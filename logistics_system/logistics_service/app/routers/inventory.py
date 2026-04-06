"""
inventory Router - vendor-scoped
each SKU belongs to a specific vendor_id.
vendors only see their own SKUs. Admin sees all.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models import InventoryItem, InventoryStatus
from app.models.schemas import (
    InventoryItemCreate, InventoryItemUpdate,
    InventoryItemResponse, InventoryAdjustRequest,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def _to_response(item):
    return InventoryItemResponse(
        id=item.id, sku=item.sku, vendor_id=item.vendor_id,
        name=item.name, description=item.description,
        quantity=item.quantity, reserved_quantity=item.reserved_quantity,
        available_quantity=item.available_quantity,
        unit_weight_kg=item.unit_weight_kg,
        warehouse_lat=item.warehouse_lat, warehouse_lon=item.warehouse_lon,
        reorder_threshold=item.reorder_threshold, unit_price=item.unit_price,
        status=item.status, created_at=item.created_at, updated_at=item.updated_at,
    )


@router.post("/", response_model=InventoryItemResponse, status_code=201,
    summary="Add a new inventory item",
    description="Register a new SKU for a specific vendor. SKU must be unique per vendor.")
def create_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryItem).filter(
        InventoryItem.sku == payload.sku,
        InventoryItem.vendor_id == payload.vendor_id
    ).first()
    if existing:
        raise HTTPException(status_code=409,
            detail=f"SKU '{payload.sku}' already exists for vendor '{payload.vendor_id}'.")
    item = InventoryItem(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return _to_response(item)


@router.get("/", response_model=List[InventoryItemResponse],
    summary="List inventory items",
    description="Pass vendor_id to filter by vendor. Omit for all items (admin).")
def list_inventory(
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID"),
    status: Optional[InventoryStatus] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem)
    if vendor_id:
        query = query.filter(InventoryItem.vendor_id == vendor_id)
    items = query.all()
    if status:
        items = [i for i in items if i.status == status]
    return [_to_response(i) for i in items]


@router.get("/{sku}", response_model=InventoryItemResponse,
    summary="Get inventory item by SKU")
def get_inventory_item(
    sku: str,
    vendor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem).filter(InventoryItem.sku == sku)
    if vendor_id:
        query = query.filter(InventoryItem.vendor_id == vendor_id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{sku}' not found.")
    return _to_response(item)


@router.patch("/{sku}", response_model=InventoryItemResponse,
    summary="Update inventory item details")
def update_inventory_item(
    sku: str, payload: InventoryItemUpdate,
    vendor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem).filter(InventoryItem.sku == sku)
    if vendor_id:
        query = query.filter(InventoryItem.vendor_id == vendor_id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{sku}' not found.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(item)
    return _to_response(item)


@router.post("/{sku}/adjust", response_model=InventoryItemResponse,
    summary="Adjust stock quantity")
def adjust_stock(
    sku: str, payload: InventoryAdjustRequest,
    vendor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem).filter(InventoryItem.sku == sku)
    if vendor_id:
        query = query.filter(InventoryItem.vendor_id == vendor_id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{sku}' not found.")
    new_qty = item.quantity + payload.delta
    if new_qty < 0:
        raise HTTPException(status_code=400,
            detail=f"Adjustment would result in negative stock ({new_qty}).")
    item.quantity = new_qty
    item.updated_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(item)
    return _to_response(item)


@router.delete("/{sku}", status_code=204, summary="Delete an inventory item")
def delete_inventory_item(
    sku: str,
    vendor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem).filter(InventoryItem.sku == sku)
    if vendor_id:
        query = query.filter(InventoryItem.vendor_id == vendor_id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail=f"SKU '{sku}' not found.")
    if item.reserved_quantity > 0:
        raise HTTPException(status_code=409,
            detail=f"Cannot delete '{sku}': {item.reserved_quantity} units reserved.")
    db.delete(item); db.commit()
