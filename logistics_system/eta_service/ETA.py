import joblib as jb
from pathlib import Path
import numpy as np
import pandas as pd
import os


class ETAEngine:
    """
    Engine for predicting Estimated Time of Arrival using a trained model through log-scaling.
    """

    def __init__(self):
        """
        Load the trained ETA model, scaler and residual standard deviation.
        """
        root = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(root, "configs", "log_scaled_eta.pkl")
        try:
            bundle = jb.load(config_path)
        except FileNotFoundError:
            raise FileNotFoundError(f"Error: file at {config_path} was not found")
        except Exception as e:
            raise RuntimeError(f"An unexpected error occurred: {e}")

        self.model = bundle["model"]
        self.scaler = bundle["scaler"]
        self.residual_std = bundle.get("residual_std", None)


    def predict_eta(self, distance, traffic, weather):
        """
        Predict ETA (in minutes) for a single shipment.
        args: distance: Travel distance (km). Must be > 0 / traffic: Traffic intensity index (uniform sampling) [0, 1] 
        / weather: Weather severity index (uniform sampling) [0, 1].
        returns: The predicted ETA in minutes.
        """
        distance_log = np.log(distance)
        X = pd.DataFrame([{
            "distance_log": distance_log,
            "traffic": traffic,
            "weather": weather
        }])

        X_scaled = self.scaler.transform(X)
        eta_log = self.model.predict(X_scaled)
        eta = np.exp(eta_log[0])
        return float(eta)

    def monte_carlo_eta(self,
                        distance,
                        traffic_low=0.2,
                        traffic_high=0.5,
                        weather_low=0.0,
                        weather_high=0.2,
                        n_simulations=10000):
        """
        the bounds are assumed for better accuracy.
        the model was trained on uniform(0,1) distribution.
        """
        traffic_samples = np.random.uniform(traffic_low, traffic_high, n_simulations)
        weather_samples = np.random.uniform(weather_low, weather_high, n_simulations)
        traffic_samples = np.clip(traffic_samples, 0, 1)
        weather_samples = np.clip(weather_samples, 0, 1)
        distance_log = np.log(distance)
        X_mc = pd.DataFrame({
            "distance_log": distance_log,
            "traffic": traffic_samples,
            "weather": weather_samples
        })

        X_mc_scaled = self.scaler.transform(X_mc)
        eta_log_samples = self.model.predict(X_mc_scaled)

        if self.residual_std is not None:
            eta_log_samples += np.random.normal(0, self.residual_std, n_simulations)

        return np.exp(eta_log_samples)


    def summarize(self, eta_samples):
        """returns statistical summary of simulated ETA results for testing and analysis."""
        return {
            "mean": float(np.mean(eta_samples)),
            "median": float(np.median(eta_samples)),
            "percentile_90": float(np.percentile(eta_samples, 90)),
            "percentile_95": float(np.percentile(eta_samples, 95)),
            "percentile_5": float(np.percentile(eta_samples, 5))
        }
