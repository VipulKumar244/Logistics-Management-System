from pydantic import BaseModel, Field


class MonteCarloRequest(BaseModel):
    """Request body for distance."""
    distance: float = Field(..., example=150, description="Travel distance in kilometers. Must be > 0.")


class MonteCarloResponse(BaseModel):
    """Response body containing Monte Carlo ETA simulation statistics."""
    mean: float = Field(..., description="Mean ETA in minutes")
    median: float = Field(..., description="Median ETA in minutes")
    percentile_90: float = Field(..., description="90th percentile ETA in minutes")
    percentile_95: float = Field(..., description="95th percentile ETA in minutes")
    percentile_5: float = Field(..., description="5th percentile ETA in minutes")
