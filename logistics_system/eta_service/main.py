from fastapi import FastAPI
from app.api import router

app = FastAPI(
    title="ETA Microservice",
    description="""
## ETA Microservice

Monte Carlo based ETA prediction service for the logistics management system.

### how it works
1. accepts a **distance** (km) as input
2. simulates **10,000 scenarios** by sampling traffic and weather from calibrated uniform distributions
3. returns statistical ETA estimates in **minutes**

### usage
- call `POST /eta/` with a distance payload
- use the `percentile_95` field for conservative delivery window planning
- use `mean` / `median` for standard ETA display
"""
)

app.include_router(router, prefix="/eta", tags=["ETA Prediction"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ETA service is running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    """Lightweight healthcheck — does not load the model."""
    return {"status": "ok"}
