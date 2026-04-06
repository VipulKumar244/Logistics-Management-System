"""
ETA Service Client
- Calculates Haversine distance between two coordinates
- Calls the ETA microservice with the computed distance
"""
import math
import httpx
import os
from app.models.schemas import ETAServiceResponse

ETA_SERVICE_URL = os.getenv("ETA_SERVICE_URL", "http://localhost:8001")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth using the Haversine formula.

    Args:
        lat1, lon1: Coordinates of point A (origin / warehouse)
        lat2, lon2: Coordinates of point B (destination / delivery)

    Returns:
        Distance in kilometers (float), minimum clamped to 1.0 km.
    """
    R = 6371.0  # Earth's mean radius in km

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return max(distance, 1.0)  # Minimum 1 km to avoid log(0) in ETA model


async def fetch_eta(distance_km: float) -> ETAServiceResponse:
    """
    Call the ETA microservice with a given distance.

    Args:
        distance_km: Haversine-computed distance in km.

    Returns:
        ETAServiceResponse with mean, median and percentile ETA values in minutes.

    Raises:
        RuntimeError if the ETA service is unreachable or returns an error.
    """
    url = f"{ETA_SERVICE_URL}/eta/"
    payload = {"distance": distance_km}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return ETAServiceResponse(**response.json())
        except httpx.ConnectError:
            raise RuntimeError(
                f"ETA service unreachable at {ETA_SERVICE_URL}. "
                "Ensure eta_service is running."
            )
        except httpx.HTTPStatusError as e:
            raise RuntimeError(
                f"ETA service returned error {e.response.status_code}: {e.response.text}"
            )
        except Exception as e:
            raise RuntimeError(f"Unexpected error calling ETA service: {e}")
