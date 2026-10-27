from fastapi import APIRouter, HTTPException
import pandas as pd
from typing import Dict, Any

from backend.app.ml.dataset import FEATURE_NAMES, CLASS_INFO
from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.schemas.models import AnimalProfileRequest

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("/metrics")
def get_model_metrics() -> Dict[str, Any]:
    """Returns authentic test-set evaluation metrics and cross-validation scores for all 3 models."""
    pipeline = get_ml_pipeline()
    return pipeline.metrics

@router.post("/predict")
def predict_animal(request: AnimalProfileRequest) -> Dict[str, Any]:
    """
    Unified canonical prediction endpoint.
    Accepts validated 16-feature vector and runs DecisionTree, KNN, and RandomForest on identical inputs.
    """
    pipeline = get_ml_pipeline()
    features_dict = request.features.model_dump()
    query_df = pd.DataFrame([[features_dict[f] for f in FEATURE_NAMES]], columns=FEATURE_NAMES)

    # 1. Decision Tree
    dt_pred = int(pipeline.dt_model.predict(query_df)[0])
    dt_probs_raw = pipeline.dt_model.predict_proba(query_df)[0]
    dt_classes = pipeline.dt_model.classes_.tolist()
    dt_probs = {int(c): float(p) for c, p in zip(dt_classes, dt_probs_raw)}

    # 2. KNN
    knn_pred = int(pipeline.knn_pipeline.predict(query_df)[0])
    knn_probs_raw = pipeline.knn_pipeline.predict_proba(query_df)[0]
    knn_classes = pipeline.knn_pipeline.classes_.tolist()
    knn_probs = {int(c): float(p) for c, p in zip(knn_classes, knn_probs_raw)}

    # 3. Random Forest
    rf_pred = int(pipeline.rf_model.predict(query_df)[0])
    rf_probs_raw = pipeline.rf_model.predict_proba(query_df)[0]
    rf_classes = pipeline.rf_model.classes_.tolist()
    rf_probs = {int(c): float(p) for c, p in zip(rf_classes, rf_probs_raw)}

    # Check consensus
    predictions = [dt_pred, knn_pred, rf_pred]
    from collections import Counter
    counts = Counter(predictions)
    most_common_cls, most_common_count = counts.most_common(1)[0]
    all_agree = (dt_pred == knn_pred == rf_pred)

    if all_agree:
        consensus_text = f"Barcha 3 ta model to'liq yakdil: Jonzot '{CLASS_INFO[dt_pred]['name_uz']}' guruhiga mansub."
    elif most_common_count == 2:
        consensus_text = f"3 ta modeldan 2 tasi ({CLASS_INFO[most_common_cls]['name_uz']}) guruhi bo'yicha mos keldi."
    else:
        consensus_text = "Modellar o'rtasida farq mavjud: har bir model turli xil sinfni tanladi."

    return {
        "animal_name": request.animal_name,
        "features": features_dict,
        "photo_data": request.photo_data,
        "predictions": {
            "decision_tree": {
                "class_id": dt_pred,
                "class_name_uz": CLASS_INFO[dt_pred]["name_uz"],
                "class_name_en": CLASS_INFO[dt_pred]["name_en"],
                "color": CLASS_INFO[dt_pred]["color"],
                "probabilities": dt_probs,
                "confidence": round(dt_probs.get(dt_pred, 1.0) * 100, 1),
            },
            "knn": {
                "class_id": knn_pred,
                "class_name_uz": CLASS_INFO[knn_pred]["name_uz"],
                "class_name_en": CLASS_INFO[knn_pred]["name_en"],
                "color": CLASS_INFO[knn_pred]["color"],
                "probabilities": knn_probs,
                "confidence": round(knn_probs.get(knn_pred, 1.0) * 100, 1),
            },
            "random_forest": {
                "class_id": rf_pred,
                "class_name_uz": CLASS_INFO[rf_pred]["name_uz"],
                "class_name_en": CLASS_INFO[rf_pred]["name_en"],
                "color": CLASS_INFO[rf_pred]["color"],
                "probabilities": rf_probs,
                "confidence": round(rf_probs.get(rf_pred, 1.0) * 100, 1),
            }
        },
        "consensus": {
            "all_agree": all_agree,
            "majority_class_id": most_common_cls,
            "majority_class_uz": CLASS_INFO[most_common_cls]["name_uz"],
            "majority_class_en": CLASS_INFO[most_common_cls]["name_en"],
            "agreement_ratio": f"{most_common_count}/3",
            "summary_uz": consensus_text,
        }
    }
