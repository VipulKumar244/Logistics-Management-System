from fastapi import APIRouter, HTTPException
from app.models import MonteCarloRequest, MonteCarloResponse

router = APIRouter()

# Lazy-loaded engine — loaded on first request, not at import time
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        from ETA import ETAEngine
        try:
            _engine = ETAEngine()
        except FileNotFoundError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail=str(e))
    return _engine


@router.post(
    "/",
    response_model=MonteCarloResponse,
    summary="Run Monte Carlo ETA Simulation",
    description="""
Run a Monte Carlo simulation (10,000 iterations) to predict shipment ETA.

- Accepts a distance (km) and returns statistical ETA estimates in **minutes**.
- Traffic and weather are sampled from calibrated uniform distributions.
- Use `percentile_95` for worst-case delivery planning.
- Use `mean` or `median` for standard estimates.
"""
)
def eta_monte_carlo(req: MonteCarloRequest):
    if req.distance <= 0:
        raise HTTPException(status_code=422, detail="Distance must be greater than 0.")
    engine = get_engine()
    samples = engine.monte_carlo_eta(distance=req.distance)
    summary = engine.summarize(samples)
    return MonteCarloResponse(**summary)
