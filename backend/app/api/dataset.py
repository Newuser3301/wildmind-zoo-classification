from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from backend.app.ml.dataset import load_zoo_dataset, FEATURE_NAMES, FEATURE_METADATA, CLASS_INFO

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])

@router.get("/summary")
def get_dataset_summary() -> Dict[str, Any]:
    """Returns dataset metadata, features schema, class descriptions, and source information."""
    try:
        df = load_zoo_dataset()
        class_counts = df["class_type"].value_counts().sort_index().to_dict()

        return {
            "name": "UCI Zoo Dataset",
            "source": "UCI Machine Learning Repository (Richard Forsyth, 1990)",
            "url": "https://archive.ics.uci.edu/dataset/111/zoo",
            "total_samples": len(df),
            "features_count": len(FEATURE_NAMES),
            "classes_count": len(CLASS_INFO),
            "features": [
                {
                    "name": f,
                    "name_uz": FEATURE_METADATA[f]["name_uz"],
                    "description_uz": FEATURE_METADATA[f]["description_uz"],
                    "type": FEATURE_METADATA[f]["type"],
                    "allowed": FEATURE_METADATA[f]["allowed"],
                }
                for f in FEATURE_NAMES
            ],
            "classes": [
                {
                    "id": cid,
                    "name_en": c["name_en"],
                    "name_uz": c["name_uz"],
                    "scientific_group": c["scientific_group"],
                    "description_uz": c["description_uz"],
                    "color": c["color"],
                    "samples_count": class_counts.get(cid, 0),
                }
                for cid, c in CLASS_INFO.items()
            ],
            "dataset_limitations_uz": (
                "Kichik hajm (101 ta namuna): Ayrim sinflarda (masalan, sudralib yuruvchilar — 5 ta, "
                "amfibiyalar — 4 ta) namunalar juda kam. Bu sinflararo nomutanosiblik (class imbalance) "
                "keltirib chiqaradi va murakkab neyron tarmoqlar o'rniga qarorlar daraxti va KNN kabi "
                "an'anaviy klassik algoritmlarni samaraliroq qiladi."
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/animals")
def get_all_dataset_animals() -> List[Dict[str, Any]]:
    """Returns all 101 authentic animals with their known features and true class."""
    try:
        df = load_zoo_dataset()
        results = []
        for _, row in df.iterrows():
            cid = int(row["class_type"])
            feat_dict = {f: int(row[f]) for f in FEATURE_NAMES}
            results.append({
                "animal_name": str(row["animal_name"]),
                "class_id": cid,
                "class_name_uz": CLASS_INFO[cid]["name_uz"],
                "class_name_en": CLASS_INFO[cid]["name_en"],
                "color": CLASS_INFO[cid]["color"],
                "features": feat_dict,
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
