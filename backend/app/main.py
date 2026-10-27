import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Dict, Any

from backend.app.ml.pipeline import get_ml_pipeline
from backend.app.api.dataset import router as dataset_router
from backend.app.api.models import router as models_router
from backend.app.api.decision_tree import router as dt_router
from backend.app.api.knn import router as knn_router
from backend.app.api.random_forest import router as rf_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Train/load models on application startup
    print("WildMind AI backend yuklanmoqda...")
    pipeline = get_ml_pipeline()
    print(f"Modellar muvaffaqiyatli yuklandi! O'quv namunalari: {len(pipeline.X_train)}, Test namunalari: {len(pipeline.X_test)}")
    yield
    print("WildMind AI to'xtatilmoqda...")

app = FastAPI(
    title="WildMind AI — Interactive Zoo Classification Lab API",
    description="Haqiqiy UCI Zoo ma'lumotlar to'plami va scikit-learn modellari (DecisionTree, KNN, RandomForest) uchun ta'limiy interaktiv API.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    pipeline = get_ml_pipeline()
    return {
        "status": "ok",
        "app": "WildMind AI",
        "subtitle": "Interactive Zoo Classification Lab",
        "models_trained": pipeline.is_trained,
        "train_samples": len(pipeline.X_train) if pipeline.X_train is not None else 0,
        "test_samples": len(pipeline.X_test) if pipeline.X_test is not None else 0,
    }

# Mount API Routers
app.include_router(dataset_router)
app.include_router(models_router)
app.include_router(dt_router)
app.include_router(knn_router)
app.include_router(rf_router)

# Mount frontend production build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
