from fastapi import APIRouter
from typing import Dict, Any

from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.ml.tree_extractor import extract_tree_structure, trace_tree_prediction
from backend.app.schemas.models import AnimalFeatures

router = APIRouter(prefix="/api/decision-tree", tags=["Decision Tree"])

@router.get("/structure")
def get_decision_tree_structure() -> Dict[str, Any]:
    """Returns the actual fitted scikit-learn DecisionTreeClassifier structure."""
    pipeline = get_ml_pipeline()
    return extract_tree_structure(
        pipeline.dt_model,
        pipeline.X_train,
        pipeline.train_animals,
        pipeline.y_train
    )

@router.post("/trace")
def trace_decision_tree(features: AnimalFeatures) -> Dict[str, Any]:
    """
    Traces exact prediction traversal path for the submitted animal feature vector.
    Calculates step-by-step split conditions, thresholds, user values, branch directions, and final leaf.
    """
    pipeline = get_ml_pipeline()
    feat_dict = features.model_dump()
    return trace_tree_prediction(
        pipeline.dt_model,
        feat_dict,
        pipeline.X_train,
        pipeline.train_animals,
        pipeline.y_train
    )
