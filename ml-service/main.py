""" 
FastAPI microservice for task priority prediction.
Serves predictions from the trained RandomForest model.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
from typing import Optional
from contextlib import asynccontextmanager

# Model components (loaded at startup)
model = None
tfidf_vectorizer = None
project_encoder = None
label_encoder = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")


def load_model():
    """Load all model components from disk."""
    global model, tfidf_vectorizer, project_encoder, label_encoder

    if not os.path.exists(MODEL_DIR):
        print(f"WARNING: Model directory '{MODEL_DIR}' not found. Run train_model.py first.")
        return False

    try:
        model = joblib.load(os.path.join(MODEL_DIR, "classifier.pkl"))
        tfidf_vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"))
        project_encoder = joblib.load(os.path.join(MODEL_DIR, "project_encoder.pkl"))
        label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model when the server starts."""
    load_model()
    yield
    # Clean up resources if needed
    print("Application shutdown complete.")


app = FastAPI(
    title="Task Priority Prediction Service",
    description="ML microservice for predicting task priority (LOW, MEDIUM, HIGH)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    title: str = ""
    description: str = ""
    days_until_deadline: float = 30.0
    assignee_active_tasks: int = 0
    assignee_overdue_rate: float = 0.0
    assignee_avg_completion_delay: float = 0.0
    project_name: str = "Unknown"


class PredictResponse(BaseModel):
    predictedPriority: str
    confidence: float
    probabilities: dict


class RetrainRequest(BaseModel):
    csv_path: Optional[str] = "training_data.csv"


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    model_loaded = model is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict_priority(request: PredictRequest):
    """Predict task priority based on input features."""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first by running train_model.py",
        )

    try:
        # Prepare text features
        text = f"{request.title} {request.description}"
        text_features = tfidf_vectorizer.transform([text]).toarray()

        # Prepare numeric features
        numeric_features = np.array([[
            request.days_until_deadline,
            request.assignee_active_tasks,
            request.assignee_overdue_rate,
            request.assignee_avg_completion_delay,
        ]])

        # Prepare project features
        project_features = project_encoder.transform([[request.project_name]])

        # Combine all features
        X = np.hstack([text_features, numeric_features, project_features])

        # Predict
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]

        # Decode label
        predicted_label = label_encoder.inverse_transform([prediction])[0]

        # Build probability dict
        prob_dict = {}
        for i, label in enumerate(label_encoder.classes_):
            prob_dict[label] = round(float(probabilities[i]), 4)

        # Confidence is the max probability
        confidence = round(float(max(probabilities)), 4)

        return PredictResponse(
            predictedPriority=predicted_label,
            confidence=confidence,
            probabilities=prob_dict,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/retrain")
async def retrain_model(request: RetrainRequest):
    """Retrain the model from CSV data."""
    try:
        from train_model import train_model as do_train

        csv_path = request.csv_path or "training_data.csv"

        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail=f"Training data file not found: {csv_path}")

        do_train(csv_path=csv_path)
        load_model()

        return {"message": "Model retrained and reloaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
