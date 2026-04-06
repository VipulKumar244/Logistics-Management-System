"""
shipment Router
manages shipment lifecycle: view, track, and update shipment status.
shipments are created automatically by the order processing flow.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models import Shipment, ShipmentStatus
from app.models.schemas import ShipmentResponse, ShipmentStatusUpdate, ETASummary

router = APIRouter(prefix="/shipments", tags=["Shipments"])


def _to_response(s: Shipment) -> ShipmentResponse:
    eta = None
    if s.eta_mean_minutes is not None:
        eta = ETASummary(
            mean_minutes=s.eta_mean_minutes,
            median_minutes=s.eta_median_minutes,
            percentile_5_minutes=s.eta_p5_minutes,
            percentile_90_minutes=s.eta_p90_minutes,
            percentile_95_minutes=s.eta_p95_minutes,
        )
    return ShipmentResponse(
        id=s.id,
        order_id=s.order_id,
        tracking_number=s.tracking_number,
        origin_lat=s.origin_lat,
        origin_lon=s.origin_lon,
        origin_address=s.origin_address,
        destination_lat=s.destination_lat,
        destination_lon=s.destination_lon,
        destination_address=s.destination_address,
        distance_km=s.distance_km,
        status=s.status,
        carrier=s.carrier,
        total_weight_kg=s.total_weight_kg,
        eta=eta,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get(
    "/",
    response_model=List[ShipmentResponse],
    summary="List all shipments",
    description="Returns all shipments. Optionally filter by status."
)
def list_shipments(
    status: Optional[ShipmentStatus] = Query(None, description="Filter by shipment status"),
    db: Session = Depends(get_db)
):
    query = db.query(Shipment)
    if status:
        query = query.filter(Shipment.status == status)
    return [_to_response(s) for s in query.all()]


@router.get(
    "/{shipment_id}",
    response_model=ShipmentResponse,
    summary="Get shipment by ID",
    description="Returns full shipment details including ETA breakdown and distance."
)
def get_shipment(shipment_id: str, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found.")
    return _to_response(s)


@router.get(
    "/track/{tracking_number}",
    response_model=ShipmentResponse,
    summary="Track shipment by tracking number",
    description="Vendor-facing tracking endpoint. Returns shipment status and ETA."
)
def track_shipment(tracking_number: str, db: Session = Depends(get_db)):
    s = db.query(Shipment).filter(Shipment.tracking_number == tracking_number).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"No shipment found for tracking number '{tracking_number}'.")
    return _to_response(s)


@router.patch(
    "/{shipment_id}/status",
    response_model=ShipmentResponse,
    summary="Update shipment status",
    description="""Manually update the shipment status. Valid transitions:
    `created` → `in_transit` → `out_for_delivery` → `delivered`
    Any status can be set to `failed`."""
)

def update_shipment_status(
    shipment_id: str,
    payload: ShipmentStatusUpdate,
    db: Session = Depends(get_db)
):
    s = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found.")

    s.status = payload.status
    s.updated_at = datetime.now(timezone.utc)

    if payload.status == ShipmentStatus.DELIVERED and s.order:
        from app.db.models import OrderStatus
        s.order.status = OrderStatus.DELIVERED
        s.order.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(s)
    return _to_response(s)
