# Logistics Management System

A production-ready microservices logistics platform built with FastAPI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vendor Backend                         │
│           (calls POST /orders/ with order payload)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Logistics Service  :8000                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /inventory  │  │   /orders    │  │   /shipments     │  │
│  │              │  │              │  │                  │  │
│  │ • List SKUs  │  │ 1. Check inv │  │ • List/track     │  │
│  │ • Add stock  │  │ 2. Reserve   │  │ • Update status  │  │
│  │ • Adjust qty │  │ 3. Haversine │  │ • ETA breakdown  │  │
│  │ • Low stock  │  │ 4. Call ETA  │  │                  │  │
│  └──────────────┘  │ 5. Shipment  │  └──────────────────┘  │
│                    └──────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ POST /eta/  { distance: km }
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 ETA Microservice  :8001                      │
│                                                             │
│  Monte Carlo Simulation (10,000 iterations)                 │
│  • Samples traffic & weather from uniform distributions     │
│  • Log-scaled regression model (scikit-learn)               │
│  • Returns: mean, median, p5, p90, p95  (in minutes)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
logistics_system/
├── docker-compose.yml
│
├── eta_service/                        # ETA Microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                         # FastAPI app
│   ├── ETA.py                          # ETAEngine class (Monte Carlo)
│   ├── configs/
│   │   └── log_scaled_eta.pkl          # ← Place your trained model here
│   └── app/
│       ├── api.py                      # POST /eta/ router
│       └── models.py                   # Pydantic schemas
│
└── logistics_service/                  # Main Logistics Service
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py                         # FastAPI app
    └── app/
        ├── db/
        │   ├── models.py               # SQLAlchemy ORM models
        │   └── session.py              # DB engine & session
        ├── models/
        │   └── schemas.py              # Pydantic request/response schemas
        ├── services/
        │   └── eta_client.py           # Haversine + ETA service HTTP client
        └── routers/
            ├── inventory.py            # CRUD for warehouse inventory
            ├── orders.py               # Order ingestion + full processing flow
            └── shipments.py            # Shipment tracking & status updates
```

---

## Quickstart

### 1. Add your trained model

```bash
cp your_model.pkl eta_service/configs/log_scaled_eta.pkl
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

### 3. Access the services

| Service | URL | Swagger Docs |
|---------|-----|--------------|
| Logistics Service | http://localhost:8000 | http://localhost:8000/docs |
| ETA Microservice | http://localhost:8001 | http://localhost:8001/docs |

---

## Running Locally (without Docker)

### ETA Service
```bash
cd eta_service
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### Logistics Service
```bash
cd logistics_service
pip install -r requirements.txt
ETA_SERVICE_URL=http://localhost:8001 uvicorn main:app --port 8000 --reload
```

---

## API Flow — Placing a Vendor Order

### Step 1: Add inventory
```bash
POST http://localhost:8000/inventory/
{
  "sku": "SKU-BOLT-M8",
  "name": "Industrial Bolt M8",
  "quantity": 500,
  "unit_price": 2.50,
  "unit_weight_kg": 0.05,
  "warehouse_lat": 12.9716,
  "warehouse_lon": 77.5946,
  "reorder_threshold": 50
}
```

### Step 2: Place order (from vendor backend)
```bash
POST http://localhost:8000/orders/
{
  "vendor_id": "VENDOR-42",
  "vendor_name": "Acme Corp",
  "delivery_address": "123 MG Road, Bengaluru",
  "delivery_lat": 12.9352,
  "delivery_lon": 77.6245,
  "items": [
    { "sku": "SKU-BOLT-M8", "quantity": 100 }
  ]
}
```

### Response includes:
```json
{
  "order": { "id": "...", "status": "processing", ... },
  "shipment": {
    "tracking_number": "TRK-A1B2C3D4E5",
    "distance_km": 8.72,
    ...
  },
  "eta": {
    "mean": 42.3,
    "median": 41.1,
    "percentile_5": 31.2,
    "percentile_90": 55.8,
    "percentile_95": 61.4
  }
}
```

### Step 3: Track shipment
```bash
GET http://localhost:8000/shipments/track/TRK-A1B2C3D4E5
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ETA_SERVICE_URL` | `http://localhost:8001` | URL of the ETA microservice |
| `DATABASE_URL` | `sqlite:///./logistics.db` | SQLAlchemy database URL |

For PostgreSQL: `DATABASE_URL=postgresql://user:pass@host:5432/logistics`

---

## Database Models

| Table | Description |
|-------|-------------|
| `inventory` | Warehouse SKUs, stock levels, warehouse coordinates |
| `orders` | Vendor orders with delivery coordinates |
| `order_items` | Line items linking orders to inventory SKUs |
| `shipments` | Shipments with distance, ETA, tracking number, status |

---

## ETA Fields Reference

All ETA values are in **minutes**.

| Field | Use Case |
|-------|----------|
| `mean` | Standard display ETA |
| `median` | Robust estimate (unaffected by outliers) |
| `percentile_5` | Optimistic / best-case |
| `percentile_90` | Operational planning buffer |
| `percentile_95` | Conservative SLA commitment |
