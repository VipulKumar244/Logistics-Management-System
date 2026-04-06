
from sqlalchemy import (
    Column, String, Integer, Float, Enum, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone
import enum
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())




class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ShipmentStatus(str, enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"


class InventoryStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"




class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(String, primary_key=True, default=generate_uuid)
    sku = Column(String, nullable=False, index=True)
    vendor_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    unit_weight_kg = Column(Float, nullable=False, default=0.5)
    warehouse_lat = Column(Float, nullable=False, default=12.9716)
    warehouse_lon = Column(Float, nullable=False, default=77.5946)
    reorder_threshold = Column(Integer, nullable=False, default=10)
    unit_price = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    order_items = relationship("OrderItem", back_populates="inventory_item")

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def status(self):
        avail = self.available_quantity
        if avail <= 0:
            return InventoryStatus.OUT_OF_STOCK
        elif avail <= self.reorder_threshold:
            return InventoryStatus.LOW_STOCK
        return InventoryStatus.IN_STOCK




class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    vendor_id = Column(String, nullable=False, index=True)
    vendor_name = Column(String, nullable=False)


    delivery_address = Column(Text, nullable=False)
    delivery_lat = Column(Float, nullable=False)
    delivery_lon = Column(Float, nullable=False)

    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipment = relationship("Shipment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    inventory_id = Column(String, ForeignKey("inventory.id"), nullable=False)
    sku = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    inventory_item = relationship("InventoryItem", back_populates="order_items")




class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    tracking_number = Column(String, unique=True, nullable=False)

    
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    origin_address = Column(Text, nullable=True)

    
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    destination_address = Column(Text, nullable=False)

    
    distance_km = Column(Float, nullable=False)
    eta_mean_minutes = Column(Float, nullable=True)
    eta_median_minutes = Column(Float, nullable=True)
    eta_p90_minutes = Column(Float, nullable=True)
    eta_p95_minutes = Column(Float, nullable=True)
    eta_p5_minutes = Column(Float, nullable=True)

    status = Column(Enum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False)
    carrier = Column(String, nullable=True, default="Standard Logistics")
    total_weight_kg = Column(Float, nullable=False, default=0.0)
    eta_raw = Column(JSON, nullable=True)  # Full ETA response stored for reference

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    order = relationship("Order", back_populates="shipment")
