import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.ml.dataset import load_zoo_dataset, FEATURE_NAMES, CLASS_INFO
from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.ml.tree_extractor import extract_tree_structure, trace_tree_prediction
from backend.app.ml.knn_service import get_knn_neighbors_and_projection
from backend.app.ml.forest_service import get_random_forest_votes

client = TestClient(app)

@pytest.fixture(scope="session")
def pipeline():
    return get_ml_pipeline()

def test_dataset_integrity():
    df = load_zoo_dataset()
    assert len(df) == 101
    assert set(df["class_type"].unique()) == {1, 2, 3, 4, 5, 6, 7}
    assert all(col in df.columns for col in FEATURE_NAMES)
    # Check binary features are strictly 0 or 1
    for f in FEATURE_NAMES:
        if f != "legs":
            assert set(df[f].unique()).issubset({0, 1})
    # Check legs in allowed set
    assert set(df["legs"].unique()).issubset({0, 2, 4, 5, 6, 8})

def test_model_training_and_metrics(pipeline):
    assert pipeline.is_trained
    assert len(pipeline.X_train) == 80
    assert len(pipeline.X_test) == 21
    assert "decision_tree" in pipeline.metrics
    assert "knn" in pipeline.metrics
    assert "random_forest" in pipeline.metrics
    assert pipeline.metrics["decision_tree"]["test_accuracy"] >= 0.8
    assert pipeline.metrics["knn"]["test_accuracy"] >= 0.8
    assert pipeline.metrics["random_forest"]["test_accuracy"] >= 0.8

def test_decision_tree_structure_and_trace(pipeline):
    structure = extract_tree_structure(pipeline.dt_model, pipeline.X_train, pipeline.train_animals, pipeline.y_train)
    assert structure["node_count"] > 0
    assert structure["max_depth"] > 0

    # Test trace with a known mammal (hair=1, milk=1, toothed=1, backbone=1, breathes=1, legs=4)
    sample_mammal = {
        "hair": 1, "feathers": 0, "eggs": 0, "milk": 1, "airborne": 0, "aquatic": 0,
        "predator": 1, "toothed": 1, "backbone": 1, "breathes": 1, "venomous": 0,
        "fins": 0, "legs": 4, "tail": 1, "domestic": 0, "catsize": 1
    }
    trace = trace_tree_prediction(pipeline.dt_model, sample_mammal, pipeline.X_train, pipeline.train_animals, pipeline.y_train)
    assert trace["total_steps"] >= 2
    assert trace["final_predicted_class_id"] == 1 # Mammal
    assert trace["steps"][-1]["is_leaf"] is True

def test_knn_feature_space_and_projection(pipeline):
    sample_bird = {
        "hair": 0, "feathers": 1, "eggs": 1, "milk": 0, "airborne": 1, "aquatic": 0,
        "predator": 0, "toothed": 0, "backbone": 1, "breathes": 1, "venomous": 0,
        "fins": 0, "legs": 2, "tail": 1, "domestic": 0, "catsize": 0
    }
    res = get_knn_neighbors_and_projection(pipeline, sample_bird, k=5)
    assert res["predicted_class_id"] == 2 # Bird
    assert len(res["nearest_neighbors"]) == 5
    # Nearest neighbors must be in strictly non-decreasing distance order
    dists = [n["distance_16d"] for n in res["nearest_neighbors"]]
    assert dists == sorted(dists)
    # PCA query point coordinates must exist
    assert "x" in res["query_point_pca"]
    assert "y" in res["query_point_pca"]

def test_random_forest_voting(pipeline):
    sample_fish = {
        "hair": 0, "feathers": 0, "eggs": 1, "milk": 0, "airborne": 0, "aquatic": 1,
        "predator": 1, "toothed": 1, "backbone": 1, "breathes": 0, "venomous": 0,
        "fins": 1, "legs": 0, "tail": 1, "domestic": 0, "catsize": 0
    }
    res = get_random_forest_votes(pipeline, sample_fish, detailed_limit=5)
    assert res["total_trees"] == 100
    assert len(res["all_tree_votes"]) == 100
    assert len(res["detailed_traces"]) == 5
    assert "structure" in res["detailed_traces"][0]
    assert "trace" in res["detailed_traces"][0]
    assert "feature_importances" in res
    assert len(res["feature_importances"]) == 16
    assert "forest_stats" in res
    assert res["forest_stats"]["n_estimators"] == 100
    assert res["final_predicted_class_id"] == 4 # Fish

def test_api_endpoints():
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"

    r_summary = client.get("/api/dataset/summary")
    assert r_summary.status_code == 200
    data_summary = r_summary.json()
    assert data_summary["total_samples"] == 101
    assert len(data_summary["features"]) == 16
    assert len(data_summary["classes"]) == 7

    r_animals = client.get("/api/dataset/animals")
    assert r_animals.status_code == 200
    assert len(r_animals.json()) == 101

    r_metrics = client.get("/api/models/metrics")
    assert r_metrics.status_code == 200
    metrics = r_metrics.json()
    assert "decision_tree" in metrics
    assert "knn" in metrics
    assert "random_forest" in metrics

    # Test prediction endpoint
    sample_query = {
        "animal_name": "Testjon",
        "features": {
            "hair": 1, "feathers": 0, "eggs": 0, "milk": 1, "airborne": 0, "aquatic": 0,
            "predator": 1, "toothed": 1, "backbone": 1, "breathes": 1, "venomous": 0,
            "fins": 0, "legs": 4, "tail": 1, "domestic": 0, "catsize": 1
        }
    }
    r_pred = client.post("/api/models/predict", json=sample_query)
    assert r_pred.status_code == 200
    pred_res = r_pred.json()
    assert pred_res["predictions"]["decision_tree"]["class_id"] == 1
    assert pred_res["predictions"]["knn"]["class_id"] == 1
    assert pred_res["predictions"]["random_forest"]["class_id"] == 1
    assert pred_res["consensus"]["all_agree"] is True
