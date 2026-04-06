"""
Pydantic schemas for request/response validation across all routers.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from app.db.models import OrderStatus, ShipmentStatus, InventoryStatus



class InventoryItemCreate(BaseModel):
    sku: str = Field(..., example="SKU-001", description="Unique product SKU")
    vendor_id: str = Field(..., example="VENDOR-001", description="Vendor this SKU belongs to")
    name: str = Field(..., example="Industrial Bolt M8", description="Product name")
    description: Optional[str] = Field(None, example="M8 stainless steel bolt")
    quantity: int = Field(..., ge=0, example=500)
    unit_weight_kg: float = Field(0.5, gt=0, example=0.05, description="Weight per unit in kg")
    warehouse_lat: float = Field(12.9716, example=12.9716, description="Warehouse latitude")
    warehouse_lon: float = Field(77.5946, example=77.5946, description="Warehouse longitude")
    reorder_threshold: int = Field(10, ge=0, example=50)
    unit_price: float = Field(..., ge=0, example=12.50)


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    unit_weight_kg: Optional[float] = Field(None, gt=0)
    reorder_threshold: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)


class InventoryItemResponse(BaseModel):
    id: str
    sku: str
    vendor_id: str
    name: str
    description: Optional[str]
    quantity: int
    reserved_quantity: int
    available_quantity: int
    unit_weight_kg: float
    warehouse_lat: float
    warehouse_lon: float
    reorder_threshold: int
    unit_price: float
    status: InventoryStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryAdjustRequest(BaseModel):
    delta: int = Field(..., example=100, description="Positive to add stock, negative to remove")
    reason: Optional[str] = Field(None, example="Restock from supplier")




class OrderItemCreate(BaseModel):
    sku: str = Field(..., example="SKU-001")
    quantity: int = Field(..., gt=0, example=10)


class OrderCreate(BaseModel):
    vendor_id: str = Field(..., example="VENDOR-42", description="Unique vendor identifier")
    vendor_name: str = Field(..., example="Acme Corp")
    delivery_address: str = Field(..., example="123 MG Road, Bengaluru, Karnataka 560001")
    delivery_lat: float = Field(..., example=12.9352, description="Delivery destination latitude")
    delivery_lon: float = Field(..., example=77.6245, description="Delivery destination longitude")
    notes: Optional[str] = Field(None, example="Leave at reception")
    items: List[OrderItemCreate] = Field(..., min_length=1)

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must contain at least one item.")
        return v


class OrderItemResponse(BaseModel):
    id: str
    sku: str
    quantity: int
    unit_price: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    delivery_address: str
    delivery_lat: float
    delivery_lon: float
    status: OrderStatus
    total_amount: float
    notes: Optional[str]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None




class ETASummary(BaseModel):
    mean_minutes: float
    median_minutes: float
    percentile_5_minutes: float
    percentile_90_minutes: float
    percentile_95_minutes: float

    model_config = {"from_attributes": True}


class ShipmentResponse(BaseModel):
    id: str
    order_id: str
    tracking_number: str
    origin_lat: float
    origin_lon: float
    origin_address: Optional[str]
    destination_lat: float
    destination_lon: float
    destination_address: str
    distance_km: float
    status: ShipmentStatus
    carrier: Optional[str]
    total_weight_kg: float
    eta: Optional[ETASummary]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus




class ETAServiceResponse(BaseModel):
    mean: float
    median: float
    percentile_90: float
    percentile_95: float
    percentile_5: float
