import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from collections import Counter

from backend.app.ml.dataset import FEATURE_NAMES, CLASS_INFO
from backend.app.ml.pipeline import MLPipeline

def get_knn_neighbors_and_projection(
    pipeline: MLPipeline,
    feature_dict: Dict[str, Any],
    k: int = 5
) -> Dict[str, Any]:
    """
    Computes genuine feature-space KNN neighbors and distances in the standardized 16D space.
    Also projects query point into PCA 2D space for the educational coordinate map.
    """
    if not pipeline.is_trained:
        pipeline.train()

    # Prepare DataFrame matching training feature columns
    query_df = pd.DataFrame([[feature_dict.get(f, 0) for f in FEATURE_NAMES]], columns=FEATURE_NAMES)

    scaler = pipeline.knn_pipeline.named_steps["scaler"]
    knn = pipeline.knn_pipeline.named_steps["knn"]

    # 1. Scale query vector using training scaler
    query_scaled = scaler.transform(query_df)

    # 2. Get true nearest neighbors in 16D standardized space
    k = max(1, min(k, len(pipeline.X_train)))
    distances, indices = knn.kneighbors(query_scaled, n_neighbors=k, return_distance=True)

    dist_list = distances[0].tolist()
    idx_list = indices[0].tolist()

    # 3. Model prediction & probabilities from fitted pipeline
    pred_class_id = int(pipeline.knn_pipeline.predict(query_df)[0])
    raw_probs = pipeline.knn_pipeline.predict_proba(query_df)[0]
    classes_in_model = pipeline.knn_pipeline.classes_.tolist()
    class_probs = {int(cls): float(prob) for cls, prob in zip(classes_in_model, raw_probs)}

    # 4. Analyze actual neighbor votes
    neighbor_details = []
    neighbor_classes = []
    neighbor_indices_set = set(idx_list)

    for rank, (dist, idx) in enumerate(zip(dist_list, idx_list), start=1):
        animal_name = str(pipeline.train_animals.iloc[idx])
        cls_id = int(pipeline.y_train.iloc[idx])
        neighbor_classes.append(cls_id)

        # PCA coordinate of this neighbor
        pca_x = float(pipeline.pca_train_coords[idx, 0])
        pca_y = float(pipeline.pca_train_coords[idx, 1])

        neighbor_details.append({
            "rank": rank,
            "train_index": idx,
            "animal_name": animal_name,
            "class_id": cls_id,
            "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
            "class_name_en": CLASS_INFO[cls_id]["name_en"],
            "color": CLASS_INFO[cls_id]["color"],
            "distance_16d": round(float(dist), 4),
            "pca_x": round(pca_x, 3),
            "pca_y": round(pca_y, 3),
            "features": {f: int(pipeline.X_train.iloc[idx][f]) for f in FEATURE_NAMES}
        })

    vote_counts = Counter(neighbor_classes)
    vote_summary = [
        {
            "class_id": cls_id,
            "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
            "class_name_en": CLASS_INFO[cls_id]["name_en"],
            "color": CLASS_INFO[cls_id]["color"],
            "votes": vote_counts.get(cls_id, 0),
            "percentage": round((vote_counts.get(cls_id, 0) / k) * 100, 1),
        }
        for cls_id in sorted(CLASS_INFO.keys())
    ]

    # 5. Project query into PCA 2D coordinates
    query_pca = pipeline.pca.transform(query_scaled)[0]
    query_pca_x = float(query_pca[0])
    query_pca_y = float(query_pca[1])

    # 6. Prepare all training points for 2D coordinate plot
    training_points = []
    for i in range(len(pipeline.X_train)):
        cls_id = int(pipeline.y_train.iloc[i])
        is_neigh = i in neighbor_indices_set
        neigh_rank = (idx_list.index(i) + 1) if is_neigh else None

        training_points.append({
            "id": i,
            "animal_name": str(pipeline.train_animals.iloc[i]),
            "class_id": cls_id,
            "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
            "class_name_en": CLASS_INFO[cls_id]["name_en"],
            "color": CLASS_INFO[cls_id]["color"],
            "pca_x": round(float(pipeline.pca_train_coords[i, 0]), 3),
            "pca_y": round(float(pipeline.pca_train_coords[i, 1]), 3),
            "is_neighbor": is_neigh,
            "neighbor_rank": neigh_rank,
            "distance_16d": round(float(dist_list[idx_list.index(i)]), 4) if is_neigh else None,
        })

    # Educational explanation in Uzbek
    top_neighbor = neighbor_details[0]
    explanation = (
        f"K = {k} qiymatida standartlashtirilgan 16 o'lchamli fazoda (StandardScaler) "
        f"eng yaqin {k} ta o'quv namunasi aniqlandi. "
        f"Eng yaqin namuna: '{top_neighbor['animal_name']}' ({top_neighbor['class_name_uz']}, masofa: {top_neighbor['distance_16d']:.3f}). "
        f"Ko'pchilik ovozi: {vote_counts.get(pred_class_id, 0)}/{k} ta ovoz bilan '{CLASS_INFO[pred_class_id]['name_uz']}' guruhi g'olib bo'ldi."
    )

    return {
        "k": k,
        "predicted_class_id": pred_class_id,
        "predicted_class_uz": CLASS_INFO[pred_class_id]["name_uz"],
        "predicted_class_en": CLASS_INFO[pred_class_id]["name_en"],
        "class_probabilities": class_probs,
        "query_point_pca": {
            "x": round(query_pca_x, 3),
            "y": round(query_pca_y, 3),
        },
        "nearest_neighbors": neighbor_details,
        "vote_distribution": vote_summary,
        "training_points": training_points,
        "explanation_uz": explanation,
        "pca_variance_ratio": [round(float(v), 4) for v in pipeline.pca.explained_variance_ratio_],
        "total_variance_explained": round(float(sum(pipeline.pca.explained_variance_ratio_)) * 100, 2),
    }

def get_knn_decision_regions(pipeline: MLPipeline, grid_resolution: int = 40) -> Dict[str, Any]:
    """
    Computes educational 2D decision regions in projected PCA space.
    Clearly labeled as an explanatory projection model, not the primary 16D classifier.
    """
    if not pipeline.is_trained:
        pipeline.train()

    coords = pipeline.pca_train_coords
    x_min, x_max = coords[:, 0].min() - 1.0, coords[:, 0].max() + 1.0
    y_min, y_max = coords[:, 1].min() - 1.0, coords[:, 1].max() + 1.0

    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, grid_resolution),
        np.linspace(y_min, y_max, grid_resolution)
    )

    grid_pts = np.c_[xx.ravel(), yy.ravel()]
    # Predict using the 2D visualization KNN
    preds = pipeline.knn_2d_viz.predict(grid_pts)

    region_points = []
    for (gx, gy), pred_cls in zip(grid_pts, preds):
        cls_int = int(pred_cls)
        region_points.append({
            "x": round(float(gx), 2),
            "y": round(float(gy), 2),
            "class_id": cls_int,
            "color": CLASS_INFO[cls_int]["color"],
        })

    return {
        "is_projection_model": True,
        "disclaimer_uz": "DIQQAT: Ushbu 2D chegaralar PCA proyeksiyasi asosidagi ko'rgazmali modelga tegishli. Haqiqiy KNN bashorati barcha 16 ta standartlashtirilgan xususiyatlar asosida hisoblanadi.",
        "bounds": {
            "x_min": round(float(x_min), 2),
            "x_max": round(float(x_max), 2),
            "y_min": round(float(y_min), 2),
            "y_max": round(float(y_max), 2),
        },
        "points": region_points,
    }
