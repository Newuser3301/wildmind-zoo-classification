import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.tree import DecisionTreeClassifier

from backend.app.ml.dataset import FEATURE_NAMES, FEATURE_METADATA, CLASS_INFO

def get_node_sample_mapping(estimator: DecisionTreeClassifier, X_train: pd.DataFrame, train_animals: pd.Series, y_train: pd.Series) -> Dict[int, List[Dict[str, Any]]]:
    """Finds authentic training animals that fall into each node of the tree."""
    tree = estimator.tree_
    node_mapping: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(tree.node_count)}
    
    # Handle feature names presence
    X_input = X_train.values if hasattr(estimator, "feature_names_in_") is False and isinstance(X_train, pd.DataFrame) else X_train
    indicator = estimator.decision_path(X_input).toarray()
    
    for sample_idx in range(len(X_train)):
        animal = train_animals.iloc[sample_idx]
        cls_id = int(y_train.iloc[sample_idx])
        nodes_visited = np.where(indicator[sample_idx] == 1)[0]
        for nid in nodes_visited:
            node_mapping[nid].append({
                "animal_name": animal,
                "class_id": cls_id,
                "class_name_uz": CLASS_INFO[cls_id]["name_uz"],
                "class_name_en": CLASS_INFO[cls_id]["name_en"],
            })
            
    return node_mapping

def extract_tree_structure(
    estimator: DecisionTreeClassifier,
    X_train: Optional[pd.DataFrame] = None,
    train_animals: Optional[pd.Series] = None,
    y_train: Optional[pd.Series] = None
) -> Dict[str, Any]:
    """Extracts complete scikit-learn tree structure for frontend rendering."""
    tree = estimator.tree_
    node_mapping = {}
    if X_train is not None and train_animals is not None and y_train is not None:
        node_mapping = get_node_sample_mapping(estimator, X_train, train_animals, y_train)

    nodes = []
    for i in range(tree.node_count):
        left_child = int(tree.children_left[i])
        right_child = int(tree.children_right[i])
        is_leaf = left_child == -1 and right_child == -1

        feat_idx = int(tree.feature[i])
        feat_name = FEATURE_NAMES[feat_idx] if not is_leaf and feat_idx >= 0 else None
        feat_meta = FEATURE_METADATA.get(feat_name, {}) if feat_name else {}

        raw_values = tree.value[i][0].tolist()
        class_dist = {cls_id: int(count) for cls_id, count in enumerate(raw_values, start=1) if count > 0}
        
        # Determine dominant or predicted class
        pred_class_idx = int(np.argmax(raw_values)) + 1
        samples_count = int(tree.n_node_samples[i])

        rep_animals = node_mapping.get(i, [])[:6] if node_mapping else []

        node_data = {
            "id": i,
            "is_leaf": is_leaf,
            "feature_index": feat_idx if not is_leaf else None,
            "feature_name": feat_name,
            "feature_name_uz": feat_meta.get("name_uz"),
            "threshold": float(tree.threshold[i]) if not is_leaf else None,
            "impurity": round(float(tree.impurity[i]), 4),
            "impurity_type": "gini" if estimator.criterion == "gini" else "entropy",
            "samples": samples_count,
            "class_distribution": class_dist,
            "predicted_class_id": pred_class_idx,
            "predicted_class_uz": CLASS_INFO[pred_class_idx]["name_uz"],
            "predicted_class_en": CLASS_INFO[pred_class_idx]["name_en"],
            "children_left": left_child if not is_leaf else None,
            "children_right": right_child if not is_leaf else None,
            "representative_animals": rep_animals,
        }
        nodes.append(node_data)

    return {
        "node_count": tree.node_count,
        "max_depth": int(estimator.get_depth()),
        "n_leaves": int(estimator.get_n_leaves()),
        "criterion": estimator.criterion,
        "nodes": nodes,
    }

def trace_tree_prediction(
    estimator: DecisionTreeClassifier,
    feature_dict: Dict[str, Any],
    X_train: Optional[pd.DataFrame] = None,
    train_animals: Optional[pd.Series] = None,
    y_train: Optional[pd.Series] = None
) -> Dict[str, Any]:
    """
    Traces exact prediction traversal path for the submitted feature vector.
    Follows actual tree_.children_left, children_right, and thresholds.
    """
    tree = estimator.tree_
    node_mapping = {}
    if X_train is not None and train_animals is not None and y_train is not None:
        node_mapping = get_node_sample_mapping(estimator, X_train, train_animals, y_train)

    current_node = 0
    steps = []
    step_num = 1

    while True:
        left_child = int(tree.children_left[current_node])
        right_child = int(tree.children_right[current_node])
        is_leaf = left_child == -1 and right_child == -1

        raw_values = tree.value[current_node][0].tolist()
        class_dist = {cls_id: int(count) for cls_id, count in enumerate(raw_values, start=1) if count > 0}
        pred_class_id = int(np.argmax(raw_values)) + 1
        samples_count = int(tree.n_node_samples[current_node])
        rep_animals = node_mapping.get(current_node, [])[:5] if node_mapping else []

        if is_leaf:
            # Reached real leaf
            total_val = sum(raw_values)
            probs = {cls_id: (count / total_val) for cls_id, count in class_dist.items()} if total_val > 0 else {}
            
            steps.append({
                "step_number": step_num,
                "node_id": current_node,
                "node_type": "leaf",
                "is_leaf": True,
                "samples": samples_count,
                "impurity": round(float(tree.impurity[current_node]), 4),
                "class_distribution": class_dist,
                "probabilities": probs,
                "predicted_class_id": pred_class_id,
                "predicted_class_uz": CLASS_INFO[pred_class_id]["name_uz"],
                "predicted_class_en": CLASS_INFO[pred_class_id]["name_en"],
                "representative_animals": rep_animals,
                "explanation_uz": (
                    f"Yakuniy barg (Leaf #{current_node}) tuguniga yetib kelindi. "
                    f"Taqsimot: {samples_count} ta o'quv namunasi to'liq '{CLASS_INFO[pred_class_id]['name_uz']}' "
                    f"guruhi bilan mos keldi. Gini noaniqligi = {tree.impurity[current_node]:.2f}. "
                    f"Qaror: {CLASS_INFO[pred_class_id]['name_uz']} ({CLASS_INFO[pred_class_id]['name_en']})."
                )
            })
            break

        # Decision node
        feat_idx = int(tree.feature[current_node])
        feat_name = FEATURE_NAMES[feat_idx]
        feat_meta = FEATURE_METADATA.get(feat_name, {})
        threshold = float(tree.threshold[current_node])
        user_val = float(feature_dict.get(feat_name, 0))

        condition_met = user_val <= threshold
        next_node = left_child if condition_met else right_child
        branch_dir = "left" if condition_met else "right"

        if feat_name == "legs":
            val_desc = f"{int(user_val)} ta oyoq"
            thresh_desc = f"{threshold:.1f} tadan kam yoki teng"
        else:
            val_desc = "Mavjud (1)" if user_val == 1 else "Mavjud emas (0)"
            thresh_desc = "<= 0.5 (Yo'q)"

        if condition_met:
            outcome_uz = f"Shart bajarildi ({user_val} <= {threshold:.1f}). Chap tarmoqqa (#{left_child}) o'tiladi."
        else:
            outcome_uz = f"Shart bajarilmadi ({user_val} > {threshold:.1f}). O'ng tarmoqqa (#{right_child}) o'tiladi."

        explanation = (
            f"{step_num}-qadam (Tugun #{current_node}): '{feat_meta.get('name_uz', feat_name)}' belgisi tekshirildi. "
            f"Model sharti: '{feat_name} <= {threshold:.2f}'. "
            f"Kiritilgan qiymat: {user_val} ({val_desc}). "
            f"{outcome_uz}"
        )

        steps.append({
            "step_number": step_num,
            "node_id": current_node,
            "node_type": "root" if current_node == 0 else "decision",
            "is_leaf": False,
            "feature_index": feat_idx,
            "feature_name": feat_name,
            "feature_name_uz": feat_meta.get("name_uz", feat_name),
            "threshold": threshold,
            "user_value": user_val,
            "condition_met": condition_met,
            "branch_direction": branch_dir,
            "next_node_id": next_node,
            "samples": samples_count,
            "impurity": round(float(tree.impurity[current_node]), 4),
            "class_distribution": class_dist,
            "representative_animals": rep_animals,
            "explanation_uz": explanation,
        })

        current_node = next_node
        step_num += 1

    return {
        "total_steps": len(steps),
        "final_predicted_class_id": steps[-1]["predicted_class_id"],
        "final_predicted_class_uz": steps[-1]["predicted_class_uz"],
        "final_predicted_class_en": steps[-1]["predicted_class_en"],
        "steps": steps,
        "path_node_ids": [s["node_id"] for s in steps],
    }
