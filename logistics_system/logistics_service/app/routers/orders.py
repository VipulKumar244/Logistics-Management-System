"""
orders Router
core business logic:
vendor places order (POST /orders/)
system checks inventory for all line items
reserves stock
calculates Haversine distance from warehouse → delivery coords
calls ETA service with the computed distance
creates a Shipment record with full ETA breakdown
returns the confirmed order + tracking number to the vendor
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.db.session import get_db
from app.db.models import (
    Order, OrderItem, OrderStatus,
    InventoryItem, Shipment, ShipmentStatus
)
from app.models.schemas import (
    OrderCreate, OrderResponse, OrderStatusUpdate,
    OrderItemResponse, ShipmentResponse, ETASummary
)
from app.services.eta_client import haversine_distance_km, fetch_eta

router = APIRouter(prefix="/orders", tags=["Orders"])


def _generate_tracking_number() -> str:
    return "TRK-" + uuid.uuid4().hex[:10].upper()


def _order_to_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        vendor_id=order.vendor_id,
        vendor_name=order.vendor_name,
        delivery_address=order.delivery_address,
        delivery_lat=order.delivery_lat,
        delivery_lon=order.delivery_lon,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        items=[
            OrderItemResponse(
                id=i.id,
                sku=i.sku,
                quantity=i.quantity,
                unit_price=i.unit_price,
            ) for i in order.items
        ],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post(
    "/",
    response_model=dict,
    status_code=201,
    summary="Place a new vendor order",
    description="""
**Main order ingestion endpoint** — called from a vendor's backend system.

### Processing Flow
1. **Inventory check** — verifies all requested SKUs exist and have sufficient available stock
2. **Stock reservation** — atomically reserves the required quantities
3. **Distance calculation** — computes Haversine great-circle distance (warehouse → delivery coordinates)
4. **ETA computation** — calls the ETA microservice with the computed distance using Monte Carlo simulation
5. **Shipment creation** — generates a shipment with tracking number and full ETA breakdown
6. **Order confirmation** — returns order ID, shipment ID, tracking number and ETA summary

### Error Conditions
- `404` — SKU not found in inventory
- `409` — Insufficient stock for one or more items
- `503` — ETA service unavailable (order is still created, shipment marked without ETA)
"""
)
async def place_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # ── Step 1: Validate all SKUs and stock availability ──────────────────────
    line_items = []
    warehouse_lat = None
    warehouse_lon = None
    total_weight = 0.0
    total_amount = 0.0

    for line in payload.items:
        inv = db.query(InventoryItem).filter(InventoryItem.sku == line.sku).first()
        if not inv:
            raise HTTPException(status_code=404, detail=f"SKU '{line.sku}' not found in inventory.")
        if inv.available_quantity < line.quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Insufficient stock for SKU '{line.sku}'. "
                    f"Requested: {line.quantity}, Available: {inv.available_quantity}."
                )
            )
        line_items.append((inv, line.quantity))
        total_weight += inv.unit_weight_kg * line.quantity
        total_amount += inv.unit_price * line.quantity


        if warehouse_lat is None:
            warehouse_lat = inv.warehouse_lat
            warehouse_lon = inv.warehouse_lon

    order = Order(
        vendor_id=payload.vendor_id,
        vendor_name=payload.vendor_name,
        delivery_address=payload.delivery_address,
        delivery_lat=payload.delivery_lat,
        delivery_lon=payload.delivery_lon,
        notes=payload.notes,
        total_amount=total_amount,
        status=OrderStatus.CONFIRMED,
    )
    db.add(order)
    db.flush()  

    for inv, qty in line_items:
        inv.reserved_quantity += qty
        inv.updated_at = datetime.now(timezone.utc)
        order_item = OrderItem(
            order_id=order.id,
            inventory_id=inv.id,
            sku=inv.sku,
            quantity=qty,
            unit_price=inv.unit_price,
        )
        db.add(order_item)

    distance_km = haversine_distance_km(
        lat1=warehouse_lat,
        lon1=warehouse_lon,
        lat2=payload.delivery_lat,
        lon2=payload.delivery_lon,
    )


    eta_data = None
    eta_error = None
    try:
        eta_data = await fetch_eta(distance_km)
    except RuntimeError as e:
        eta_error = str(e)

    
    shipment = Shipment(
        order_id=order.id,
        tracking_number=_generate_tracking_number(),
        origin_lat=warehouse_lat,
        origin_lon=warehouse_lon,
        origin_address="Warehouse (auto-assigned)",
        destination_lat=payload.delivery_lat,
        destination_lon=payload.delivery_lon,
        destination_address=payload.delivery_address,
        distance_km=round(distance_km, 3),
        total_weight_kg=round(total_weight, 3),
        status=ShipmentStatus.CREATED,
        eta_mean_minutes=eta_data.mean if eta_data else None,
        eta_median_minutes=eta_data.median if eta_data else None,
        eta_p90_minutes=eta_data.percentile_90 if eta_data else None,
        eta_p95_minutes=eta_data.percentile_95 if eta_data else None,
        eta_p5_minutes=eta_data.percentile_5 if eta_data else None,
        eta_raw=eta_data.model_dump() if eta_data else None,
    )
    db.add(shipment)
    order.status = OrderStatus.PROCESSING
    db.commit()
    db.refresh(order)
    db.refresh(shipment)

    
    response = {
        "order": _order_to_response(order),
        "shipment": {
            "id": shipment.id,
            "tracking_number": shipment.tracking_number,
            "distance_km": shipment.distance_km,
            "total_weight_kg": shipment.total_weight_kg,
            "status": shipment.status,
        },
        "eta": eta_data.model_dump() if eta_data else None,
        "eta_note": eta_error if eta_error else "ETA computed successfully via Monte Carlo simulation.",
    }
    return response


@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="List all orders",
    description="Returns all orders. Optionally filter by vendor ID or status."
)
def list_orders(
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID"),
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    db: Session = Depends(get_db)
):
    query = db.query(Order).options(joinedload(Order.items))
    if vendor_id:
        query = query.filter(Order.vendor_id == vendor_id)
    if status:
        query = query.filter(Order.status == status)
    return [_order_to_response(o) for o in query.all()]


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order by ID",
)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _order_to_response(order)


@router.get(
    "/{order_id}/shipment",
    response_model=ShipmentResponse,
    summary="Get shipment for an order",
    description="Returns the shipment and ETA details associated with a given order."
)
def get_order_shipment(order_id: str, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.order_id == order_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="No shipment found for this order.")

    eta = None
    if shipment.eta_mean_minutes is not None:
        eta = ETASummary(
            mean_minutes=shipment.eta_mean_minutes,
            median_minutes=shipment.eta_median_minutes,
            percentile_5_minutes=shipment.eta_p5_minutes,
            percentile_90_minutes=shipment.eta_p90_minutes,
            percentile_95_minutes=shipment.eta_p95_minutes,
        )
    return ShipmentResponse(
        id=shipment.id,
        order_id=shipment.order_id,
        tracking_number=shipment.tracking_number,
        origin_lat=shipment.origin_lat,
        origin_lon=shipment.origin_lon,
        origin_address=shipment.origin_address,
        destination_lat=shipment.destination_lat,
        destination_lon=shipment.destination_lon,
        destination_address=shipment.destination_address,
        distance_km=shipment.distance_km,
        status=shipment.status,
        carrier=shipment.carrier,
        total_weight_kg=shipment.total_weight_kg,
        eta=eta,
        created_at=shipment.created_at,
        updated_at=shipment.updated_at,
    )


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Manually update order status",
    description="Override order status. Cancelling an order will release reserved inventory."
)
def update_order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Release reserved inventory on cancellation
    if payload.status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
        for item in order.items:
            inv = db.query(InventoryItem).filter(InventoryItem.id == item.inventory_id).first()
            if inv:
                inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
                inv.updated_at = datetime.now(timezone.utc)

    order.status = payload.status
    if payload.notes:
        order.notes = (order.notes or "") + f"\n[{datetime.now(timezone.utc).isoformat()}] {payload.notes}"
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return _order_to_response(order)
