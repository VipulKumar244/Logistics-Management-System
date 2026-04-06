"""
Logistics Service — Main Entrypoint
Registers all routers: inventory, orders, shipments.
Auto-generates OpenAPI/Swagger docs at /docs and /redoc.
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.session import init_db
from app.routers import inventory, orders, shipments
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    init_db()
    yield


app = FastAPI(
    title="Logistics Management Service",
    description="""
## Logistics Management Service

End-to-end logistics platform for vendor order processing, inventory management, and shipment tracking.

---

### Architecture

This service works in tandem with the **ETA Microservice**:

```
Vendor Backend
      │
      ▼
POST /orders/          ← Place order
      │
      ├─ 1. Inventory Check & Reservation
      │
      ├─ 2. Haversine Distance Calculation
      │        (warehouse coords → delivery coords)
      │
      ├─ 3. Call ETA Microservice (POST /eta/)
      │        Monte Carlo simulation (10,000 runs)
      │
      └─ 4. Create Shipment + Return tracking number & ETA
```

---

### Services
| Router | Prefix | Description |
|--------|--------|-------------|
| Inventory | `/inventory` | Manage warehouse stock, SKUs, quantities |
| Orders | `/orders` | Vendor order ingestion and lifecycle |
| Shipments | `/shipments` | Shipment tracking and status updates |

---

### ETA Fields
ETA values are in **minutes** and represent Monte Carlo simulation statistics:
- `mean` / `median` — typical delivery estimate
- `percentile_90` / `percentile_95` — worst-case planning window
- `percentile_5` — optimistic best-case estimate
""",
    version="1.0.0",
    contact={"name": "Logistics Platform", "email": "platform@logistics.internal"},
    license_info={"name": "Internal Use Only"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(shipments.router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="Service health check")
def root():
    return {
        "status": "Logistics service is running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }
