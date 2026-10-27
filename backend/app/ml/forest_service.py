import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from collections import Counter

from backend.app.ml.dataset import FEATURE_NAMES, FEATURE_METADATA, CLASS_INFO
from backend.app.ml.pipeline import MLPipeline
from backend.app.ml.tree_extractor import extract_tree_structure, trace_tree_prediction

def get_random_forest_votes(
    pipeline: MLPipeline,
    feature_dict: Dict[str, Any],
    detailed_limit: int = 5
) -> Dict[str, Any]:
    """
    Computes real per-tree predictions from rf_model.estimators_ for the query vector.
    Calculates full-forest vote distribution, predict_proba, and final rf.predict.
    Generates detailed structures and traces for the requested subset of trees.
    Includes feature importances and ensemble depth/leaf statistics.
    """
    if not pipeline.is_trained:
        pipeline.train()

    rf = pipeline.rf_model
    query_df = pd.DataFrame([[feature_dict.get(f, 0) for f in FEATURE_NAMES]], columns=FEATURE_NAMES)

    # 1. Official RandomForestClassifier prediction and probabilities
    final_pred_class = int(rf.predict(query_df)[0])
    raw_probs = rf.predict_proba(query_df)[0]
    classes_in_model = rf.classes_.tolist()
    class_probabilities = {int(c): float(p) for c, p in zip(classes_in_model, raw_probs)}

    # 2. Iterate through all real trees in estimators_
    all_tree_votes = []
    tree_class_counts = Counter()
    depths = []
    leaf_counts = []

    for idx, tree_estimator in enumerate(rf.estimators_):
        tree_pred_raw = tree_estimator.predict(query_df.values)[0]
        # In scikit-learn RandomForestClassifier, estimators_ use 0-indexed internal classes [0..n_classes-1]
        # Map raw tree prediction back to genuine dataset class ID via rf.classes_
        raw_idx = int(round(float(tree_pred_raw)))
        if 0 <= raw_idx < len(rf.classes_):
            tree_pred_cls = int(rf.classes_[raw_idx])
        else:
            tree_pred_cls = raw_idx + 1

        tree_class_counts[tree_pred_cls] += 1

        d = int(tree_estimator.get_depth())
        l = int(tree_estimator.get_n_leaves())
        depths.append(d)
        leaf_counts.append(l)

        # Extract root split condition to illustrate Random Subspace diversity
        root_feat_idx = int(tree_estimator.tree_.feature[0])
        root_feat_name = FEATURE_NAMES[root_feat_idx] if root_feat_idx >= 0 else None
        root_feat_uz = FEATURE_METADATA.get(root_feat_name, {}).get("name_uz", root_feat_name) if root_feat_name else None
        root_threshold = float(tree_estimator.tree_.threshold[0]) if root_feat_idx >= 0 else None

        all_tree_votes.append({
            "tree_id": idx,
            "predicted_class_id": tree_pred_cls,
            "predicted_class_uz": CLASS_INFO.get(tree_pred_cls, {}).get("name_uz", "Noma'lum"),
            "predicted_class_en": CLASS_INFO.get(tree_pred_cls, {}).get("name_en", "Unknown"),
            "color": CLASS_INFO.get(tree_pred_cls, {}).get("color", "#10b981"),
            "tree_depth": d,
            "n_leaves": l,
            "root_feature": root_feat_name,
            "root_feature_uz": root_feat_uz,
            "root_threshold": root_threshold,
        })

    # 3. Detailed traversal trace and structure for a subset of trees (e.g. first N trees)
    detailed_traces = []
    limit = max(1, min(detailed_limit, len(rf.estimators_)))
    for i in range(limit):
        estimator = rf.estimators_[i]
        trace = trace_tree_prediction(
            estimator,
            feature_dict,
            pipeline.X_train,
            pipeline.train_animals,
            pipeline.y_train
        )
        structure = extract_tree_structure(
            estimator,
            pipeline.X_train,
            pipeline.train_animals,
            pipeline.y_train
        )
        detailed_traces.append({
            "tree_id": i,
            "structure": structure,
            "trace": trace,
            "tree_depth": int(estimator.get_depth()),
            "n_leaves": int(estimator.get_n_leaves()),
        })

    # 4. Vote summary for full forest
    total_trees = len(rf.estimators_)
    vote_summary = [
        {
            "class_id": cls_id,
            "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
            "class_name_en": CLASS_INFO[cls_id]["name_en"],
            "color": CLASS_INFO[cls_id]["color"],
            "votes": tree_class_counts.get(cls_id, 0),
            "percentage": round((tree_class_counts.get(cls_id, 0) / total_trees) * 100, 1),
            "model_probability": round(class_probabilities.get(cls_id, 0.0) * 100, 1),
        }
        for cls_id in sorted(CLASS_INFO.keys())
    ]

    # Most voted class among individual trees
    most_common_tree_vote = tree_class_counts.most_common(1)[0][0] if tree_class_counts else final_pred_class

    # 5. Feature importances across the ensemble (Mean Decrease in Impurity)
    feature_importances = []
    for i, f_name in enumerate(FEATURE_NAMES):
        imp = float(rf.feature_importances_[i])
        feature_importances.append({
            "feature": f_name,
            "name_uz": FEATURE_METADATA.get(f_name, {}).get("name_uz", f_name),
            "name_en": FEATURE_METADATA.get(f_name, {}).get("name_en", f_name),
            "importance": round(imp, 4),
            "percentage": round(imp * 100, 1),
        })
    feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    # 6. Ensemble depth statistics
    depth_dist = Counter(depths)
    forest_stats = {
        "n_estimators": total_trees,
        "mean_depth": round(float(np.mean(depths)), 2),
        "min_depth": int(np.min(depths)),
        "max_depth": int(np.max(depths)),
        "mean_leaves": round(float(np.mean(leaf_counts)), 1),
        "min_leaves": int(np.min(leaf_counts)),
        "max_leaves": int(np.max(leaf_counts)),
        "depth_distribution": {int(k): int(v) for k, v in sorted(depth_dist.items())},
        "max_features": "sqrt (4 alomat)",
        "bootstrap": True,
        "single_tree_accuracy": round(float(pipeline.metrics.get("decision_tree", {}).get("test_accuracy", 0.0)) * 100, 1),
        "forest_accuracy": round(float(pipeline.metrics.get("random_forest", {}).get("test_accuracy", 0.0)) * 100, 1),
    }

    winner_summary = next((v for v in vote_summary if v["class_id"] == final_pred_class), None)
    winner_votes = winner_summary["votes"] if winner_summary else 0
    winner_pct = winner_summary["percentage"] if winner_summary else 0.0

    explanation = (
        f"Tasodifiy o'rmondagi barcha {total_trees} ta haqiqiy qarorlar daraxti mustaqil baholandi. "
        f"G'olib sinf: {winner_votes}/{total_trees} ta ovoz ({winner_pct}%) "
        f"bilan '{CLASS_INFO[final_pred_class]['name_uz']}' guruhi aniqlandi. "
        f"Modelning yakuniy ishonch ehtimolligi: {class_probabilities.get(final_pred_class, 0)*100:.1f}%."
    )

    return {
        "total_trees": total_trees,
        "detailed_trees_count": limit,
        "final_predicted_class_id": final_pred_class,
        "final_predicted_class_uz": CLASS_INFO[final_pred_class]["name_uz"],
        "final_predicted_class_en": CLASS_INFO[final_pred_class]["name_en"],
        "class_probabilities": class_probabilities,
        "most_common_tree_class_id": most_common_tree_vote,
        "vote_distribution": vote_summary,
        "all_tree_votes": all_tree_votes,
        "detailed_traces": detailed_traces,
        "feature_importances": feature_importances,
        "forest_stats": forest_stats,
        "explanation_uz": explanation,
    }

def get_single_tree_details(
    pipeline: MLPipeline,
    tree_id: int,
    feature_dict: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Retrieves full structure and optional prediction trace for a specific tree in the forest."""
    if not pipeline.is_trained:
        pipeline.train()

    rf = pipeline.rf_model
    if tree_id < 0 or tree_id >= len(rf.estimators_):
        raise ValueError(f"Daraxt ID #{tree_id} mavjud emas. Maksimal: {len(rf.estimators_) - 1}")

    estimator = rf.estimators_[tree_id]
    structure = extract_tree_structure(
        estimator,
        pipeline.X_train,
        pipeline.train_animals,
        pipeline.y_train
    )

    trace = None
    if feature_dict:
        trace = trace_tree_prediction(
            estimator,
            feature_dict,
            pipeline.X_train,
            pipeline.train_animals,
            pipeline.y_train
        )

    return {
        "tree_id": tree_id,
        "structure": structure,
        "trace": trace,
    }
