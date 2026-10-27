from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.ml.forest_service import get_random_forest_votes, get_single_tree_details
from backend.app.schemas.models import ForestVotesQueryRequest, AnimalFeatures

router = APIRouter(prefix="/api/random-forest", tags=["Random Forest"])

@router.get("/summary")
def get_random_forest_summary() -> Dict[str, Any]:
    """Returns random forest ensemble size, parameters, feature importances, and metadata."""
    pipeline = get_ml_pipeline()
    rf = pipeline.rf_model
    return {
        "n_estimators": len(rf.estimators_),
        "criterion": rf.criterion,
        "max_features": str(rf.max_features),
        "bootstrap": rf.bootstrap,
        "random_state": rf.random_state,
        "classes": rf.classes_.tolist(),
        "feature_importances": pipeline.metrics.get("random_forest", {}).get("feature_importances", {}),
    }

@router.post("/votes")
def query_random_forest_votes(request: ForestVotesQueryRequest) -> Dict[str, Any]:
    """
    Computes genuine per-tree predictions, full forest vote breakdown, feature importances, and detailed traces.
    """
    pipeline = get_ml_pipeline()
    feat_dict = request.features.model_dump()
    return get_random_forest_votes(pipeline, feat_dict, detailed_limit=request.detailed_limit)

@router.get("/tree/{tree_id}")
def get_tree_by_id(tree_id: int) -> Dict[str, Any]:
    """Returns the actual structure of the selected fitted tree from estimators_."""
    pipeline = get_ml_pipeline()
    try:
        return get_single_tree_details(pipeline, tree_id=tree_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/tree/{tree_id}")
def get_tree_by_id_with_trace(tree_id: int, request: Optional[AnimalFeatures] = None) -> Dict[str, Any]:
    """Returns the actual structure and prediction trace of the selected fitted tree for a given animal."""
    pipeline = get_ml_pipeline()
    feat_dict = request.model_dump() if request else None
    try:
        return get_single_tree_details(pipeline, tree_id=tree_id, feature_dict=feat_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
