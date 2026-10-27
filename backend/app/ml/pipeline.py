import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from backend.app.ml.dataset import load_zoo_dataset, FEATURE_NAMES, CLASS_INFO

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")

class MLPipeline:
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.df: Optional[pd.DataFrame] = None
        self.X_train: Optional[pd.DataFrame] = None
        self.X_test: Optional[pd.DataFrame] = None
        self.y_train: Optional[pd.Series] = None
        self.y_test: Optional[pd.Series] = None
        self.train_animals: Optional[pd.Series] = None
        self.test_animals: Optional[pd.Series] = None

        self.dt_model: Optional[DecisionTreeClassifier] = None
        self.knn_pipeline: Optional[Pipeline] = None
        self.rf_model: Optional[RandomForestClassifier] = None

        self.pca: Optional[PCA] = None
        self.pca_train_coords: Optional[np.ndarray] = None
        self.knn_2d_viz: Optional[KNeighborsClassifier] = None

        self.metrics: Dict[str, Any] = {}
        self.is_trained: bool = False

    def train(self) -> None:
        """Trains all three models and computes evaluation metrics on held-out test data."""
        self.df = load_zoo_dataset()
        X = self.df[FEATURE_NAMES]
        y = self.df["class_type"]
        animals = self.df["animal_name"]

        # 80/20 Stratified train/test split (80 train, 21 test)
        self.X_train, self.X_test, self.y_train, self.y_test, self.train_animals, self.test_animals = train_test_split(
            X, y, animals, test_size=0.2, random_state=self.random_state, stratify=y
        )

        # 1. Decision Tree
        self.dt_model = DecisionTreeClassifier(random_state=self.random_state)
        self.dt_model.fit(self.X_train, self.y_train)

        # 2. KNN with StandardScaler inside Pipeline (Scaler fitted only on train!)
        self.knn_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("knn", KNeighborsClassifier(n_neighbors=5, metric="minkowski", p=2))
        ])
        self.knn_pipeline.fit(self.X_train, self.y_train)

        # 3. Random Forest
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=self.random_state)
        self.rf_model.fit(self.X_train, self.y_train)

        # 4. Dimensionality Reduction (PCA) fitted on standardized X_train for mathematically coherent 2D map
        scaler: StandardScaler = self.knn_pipeline.named_steps["scaler"]
        X_train_scaled = scaler.transform(self.X_train)
        self.pca = PCA(n_components=2, random_state=self.random_state)
        self.pca_train_coords = self.pca.fit_transform(X_train_scaled)

        # Explanatory 2D model strictly for visual decision regions in projected space
        self.knn_2d_viz = KNeighborsClassifier(n_neighbors=5)
        self.knn_2d_viz.fit(self.pca_train_coords, self.y_train)

        # Compute metrics
        self._calculate_metrics()
        self.is_trained = True

        # Cache models
        self.save_models()

    def _calculate_metrics(self) -> None:
        """Calculates authentic test set metrics and cross-validation scores."""
        cv = StratifiedKFold(n_splits=4, shuffle=True, random_state=self.random_state)
        all_classes = [1, 2, 3, 4, 5, 6, 7]

        # Decision Tree evaluation
        y_pred_dt = self.dt_model.predict(self.X_test)
        dt_cv = cross_val_score(DecisionTreeClassifier(random_state=self.random_state), self.df[FEATURE_NAMES], self.df["class_type"], cv=cv)
        dt_cm = confusion_matrix(self.y_test, y_pred_dt, labels=all_classes).tolist()

        # KNN evaluation
        y_pred_knn = self.knn_pipeline.predict(self.X_test)
        knn_pipe_for_cv = Pipeline([
            ("scaler", StandardScaler()),
            ("knn", KNeighborsClassifier(n_neighbors=5))
        ])
        knn_cv = cross_val_score(knn_pipe_for_cv, self.df[FEATURE_NAMES], self.df["class_type"], cv=cv)
        knn_cm = confusion_matrix(self.y_test, y_pred_knn, labels=all_classes).tolist()

        # Random Forest evaluation
        y_pred_rf = self.rf_model.predict(self.X_test)
        rf_pipe_for_cv = RandomForestClassifier(n_estimators=100, random_state=self.random_state)
        rf_cv = cross_val_score(rf_pipe_for_cv, self.df[FEATURE_NAMES], self.df["class_type"], cv=cv)
        rf_cm = confusion_matrix(self.y_test, y_pred_rf, labels=all_classes).tolist()

        self.metrics = {
            "dataset": {
                "total_samples": len(self.df),
                "train_samples": len(self.X_train),
                "test_samples": len(self.X_test),
                "n_features": len(FEATURE_NAMES),
                "n_classes": len(all_classes),
                "class_distribution": self.df["class_type"].value_counts().sort_index().to_dict(),
            },
            "decision_tree": {
                "name": "DecisionTreeClassifier",
                "name_uz": "Qarorlar daraxti",
                "test_accuracy": float(accuracy_score(self.y_test, y_pred_dt)),
                "precision_macro": float(precision_score(self.y_test, y_pred_dt, average="macro", zero_division=0)),
                "recall_macro": float(recall_score(self.y_test, y_pred_dt, average="macro", zero_division=0)),
                "f1_macro": float(f1_score(self.y_test, y_pred_dt, average="macro", zero_division=0)),
                "precision_weighted": float(precision_score(self.y_test, y_pred_dt, average="weighted", zero_division=0)),
                "recall_weighted": float(recall_score(self.y_test, y_pred_dt, average="weighted", zero_division=0)),
                "f1_weighted": float(f1_score(self.y_test, y_pred_dt, average="weighted", zero_division=0)),
                "cv_scores": [float(s) for s in dt_cv],
                "cv_mean": float(dt_cv.mean()),
                "cv_std": float(dt_cv.std()),
                "confusion_matrix": dt_cm,
                "tree_depth": int(self.dt_model.get_depth()),
                "n_leaves": int(self.dt_model.get_n_leaves()),
                "feature_importances": {
                    FEATURE_NAMES[i]: float(imp)
                    for i, imp in enumerate(self.dt_model.feature_importances_) if imp > 0
                }
            },
            "knn": {
                "name": "KNeighborsClassifier",
                "name_uz": "K-Eng Yaqin Qo'shnilar (KNN)",
                "test_accuracy": float(accuracy_score(self.y_test, y_pred_knn)),
                "precision_macro": float(precision_score(self.y_test, y_pred_knn, average="macro", zero_division=0)),
                "recall_macro": float(recall_score(self.y_test, y_pred_knn, average="macro", zero_division=0)),
                "f1_macro": float(f1_score(self.y_test, y_pred_knn, average="macro", zero_division=0)),
                "precision_weighted": float(precision_score(self.y_test, y_pred_knn, average="weighted", zero_division=0)),
                "recall_weighted": float(recall_score(self.y_test, y_pred_knn, average="weighted", zero_division=0)),
                "f1_weighted": float(f1_score(self.y_test, y_pred_knn, average="weighted", zero_division=0)),
                "cv_scores": [float(s) for s in knn_cv],
                "cv_mean": float(knn_cv.mean()),
                "cv_std": float(knn_cv.std()),
                "confusion_matrix": knn_cm,
                "k_neighbors": 5,
                "distance_metric": "minkowski (p=2 Euclidean)",
                "scaling": "StandardScaler (mean=0, variance=1)",
                "pca_explained_variance_ratio": [float(r) for r in self.pca.explained_variance_ratio_]
            },
            "random_forest": {
                "name": "RandomForestClassifier",
                "name_uz": "Tasodifiy o'rmon (Random Forest)",
                "test_accuracy": float(accuracy_score(self.y_test, y_pred_rf)),
                "precision_macro": float(precision_score(self.y_test, y_pred_rf, average="macro", zero_division=0)),
                "recall_macro": float(recall_score(self.y_test, y_pred_rf, average="macro", zero_division=0)),
                "f1_macro": float(f1_score(self.y_test, y_pred_rf, average="macro", zero_division=0)),
                "precision_weighted": float(precision_score(self.y_test, y_pred_rf, average="weighted", zero_division=0)),
                "recall_weighted": float(recall_score(self.y_test, y_pred_rf, average="weighted", zero_division=0)),
                "f1_weighted": float(f1_score(self.y_test, y_pred_rf, average="weighted", zero_division=0)),
                "cv_scores": [float(s) for s in rf_cv],
                "cv_mean": float(rf_cv.mean()),
                "cv_std": float(rf_cv.std()),
                "confusion_matrix": rf_cm,
                "n_estimators": len(self.rf_model.estimators_),
                "feature_importances": {
                    FEATURE_NAMES[i]: float(imp)
                    for i, imp in enumerate(self.rf_model.feature_importances_) if imp > 0.01
                }
            }
        }

    def save_models(self) -> None:
        os.makedirs(MODELS_DIR, exist_ok=True)
        dump_data = {
            "dt_model": self.dt_model,
            "knn_pipeline": self.knn_pipeline,
            "rf_model": self.rf_model,
            "pca": self.pca,
            "pca_train_coords": self.pca_train_coords,
            "knn_2d_viz": self.knn_2d_viz,
            "metrics": self.metrics,
            "random_state": self.random_state
        }
        joblib.dump(dump_data, os.path.join(MODELS_DIR, "zoo_models.joblib"))

    def load_models(self) -> bool:
        path = os.path.join(MODELS_DIR, "zoo_models.joblib")
        if not os.path.exists(path):
            return False
        try:
            dump_data = joblib.load(path)
            self.dt_model = dump_data["dt_model"]
            self.knn_pipeline = dump_data["knn_pipeline"]
            self.rf_model = dump_data["rf_model"]
            self.pca = dump_data["pca"]
            self.pca_train_coords = dump_data["pca_train_coords"]
            self.knn_2d_viz = dump_data["knn_2d_viz"]
            self.metrics = dump_data["metrics"]
            self.df = load_zoo_dataset()
            X = self.df[FEATURE_NAMES]
            y = self.df["class_type"]
            animals = self.df["animal_name"]
            self.X_train, self.X_test, self.y_train, self.y_test, self.train_animals, self.test_animals = train_test_split(
                X, y, animals, test_size=0.2, random_state=dump_data.get("random_state", 42), stratify=y
            )
            self.is_trained = True
            return True
        except Exception:
            return False

# Global Singleton instance
pipeline_instance = MLPipeline()

def get_ml_pipeline() -> MLPipeline:
    if not pipeline_instance.is_trained:
        if not pipeline_instance.load_models():
            pipeline_instance.train()
    return pipeline_instance
