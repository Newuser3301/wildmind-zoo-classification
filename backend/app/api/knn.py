from fastapi import APIRouter
from typing import Dict, Any

from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.ml.knn_service import get_knn_neighbors_and_projection, get_knn_decision_regions
from backend.app.schemas.models import KNNQueryRequest

router = APIRouter(prefix="/api/knn", tags=["KNN"])

@router.post("/neighbors")
def query_knn_neighbors(request: KNNQueryRequest) -> Dict[str, Any]:
    """
    Computes genuine feature-space KNN neighbors and distances in the standardized 16D space.
    Returns nearest neighbors, voting distribution, training points, and PCA 2D projection.
    """
    pipeline = get_ml_pipeline()
    feat_dict = request.features.model_dump()
    return get_knn_neighbors_and_projection(pipeline, feat_dict, k=request.k)

@router.get("/projection")
def get_knn_training_projection() -> Dict[str, Any]:
    """Returns 2D PCA projection coordinates for all 80 training animals."""
    pipeline = get_ml_pipeline()
    if not pipeline.is_trained:
        pipeline.train()

    from backend.app.ml.dataset import CLASS_INFO
    points = []
    for i in range(len(pipeline.X_train)):
        cls_id = int(pipeline.y_train.iloc[i])
        points.append({
            "id": i,
            "animal_name": str(pipeline.train_animals.iloc[i]),
            "class_id": cls_id,
            "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
            "class_name_en": CLASS_INFO[cls_id]["name_en"],
            "color": CLASS_INFO[cls_id]["color"],
            "pca_x": round(float(pipeline.pca_train_coords[i, 0]), 3),
            "pca_y": round(float(pipeline.pca_train_coords[i, 1]), 3),
        })

    return {
        "points": points,
        "pca_variance_ratio": [round(float(v), 4) for v in pipeline.pca.explained_variance_ratio_],
        "total_variance_explained": round(float(sum(pipeline.pca.explained_variance_ratio_)) * 100, 2),
    }

@router.post("/projection-predict")
def get_projection_decision_regions() -> Dict[str, Any]:
    """
    Returns 2D projected space decision regions for educational visualization.
    Clearly marked as an explanatory projection model.
    """
    pipeline = get_ml_pipeline()
    return get_knn_decision_regions(pipeline, grid_resolution=35)
