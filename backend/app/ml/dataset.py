import os
import io
import urllib.request
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "hair", "feathers", "eggs", "milk", "airborne", "aquatic",
    "predator", "toothed", "backbone", "breathes", "venomous",
    "fins", "legs", "tail", "domestic", "catsize"
]

CLASS_INFO: Dict[int, Dict[str, Any]] = {
    1: {
        "id": 1,
        "name_en": "Mammal",
        "name_uz": "Sutemizuvchilar",
        "scientific_group": "Mammalia",
        "description_uz": "Issiqqon, bolalarini sut bilan boquvchi, ko'pchiligi jun bilan qoplangan hayvonlar guruhi.",
        "color": "#10b981", # Emerald
        "badge_bg": "rgba(16, 185, 129, 0.15)",
        "badge_border": "rgba(16, 185, 129, 0.4)",
    },
    2: {
        "id": 2,
        "name_en": "Bird",
        "name_uz": "Qushlar",
        "scientific_group": "Aves",
        "description_uz": "Patlar bilan qoplangan, tuxum qo'yuvchi, ikki oyoqli va qanotli issiqqon umurtqalilar.",
        "color": "#06b6d4", # Cyan
        "badge_bg": "rgba(6, 182, 212, 0.15)",
        "badge_border": "rgba(6, 182, 212, 0.4)",
    },
    3: {
        "id": 3,
        "name_en": "Reptile",
        "name_uz": "Sudralib yuruvchilar",
        "scientific_group": "Reptilia",
        "description_uz": "Sovuqqon, tangachali quruq teriga ega, asosan quruqlikda tuxum qo'yuvchi umurtqalilar.",
        "color": "#f59e0b", # Amber
        "badge_bg": "rgba(245, 158, 11, 0.15)",
        "badge_border": "rgba(245, 158, 11, 0.4)",
    },
    4: {
        "id": 4,
        "name_en": "Fish",
        "name_uz": "Baliqlar",
        "scientific_group": "Pisces",
        "description_uz": "Suvda yashovchi, jabralar orqali nafas oluvchi, suzgich qanotlariga ega sovuqqon hayvonlar.",
        "color": "#3b82f6", # Blue
        "badge_bg": "rgba(59, 130, 246, 0.15)",
        "badge_border": "rgba(59, 130, 246, 0.4)",
    },
    5: {
        "id": 5,
        "name_en": "Amphibian",
        "name_uz": "Suvda ham quruqlikda yashovchilar",
        "scientific_group": "Amphibia",
        "description_uz": "Hayot sikli suv va quruqlik bilan bog'liq bo'lgan, nam terili sovuqqon umurtqalilar (qurbaqalar, salamandralar).",
        "color": "#8b5cf6", # Purple
        "badge_bg": "rgba(139, 92, 246, 0.15)",
        "badge_border": "rgba(139, 92, 246, 0.4)",
    },
    6: {
        "id": 6,
        "name_en": "Insect",
        "name_uz": "Hasharotlar",
        "scientific_group": "Insecta",
        "description_uz": "Olti oyoqli, tanasi bosh, ko'krak va qoringa bo'lingan xitin qobiqli bo'g'imoyoqlilar.",
        "color": "#ec4899", # Pink
        "badge_bg": "rgba(236, 72, 153, 0.15)",
        "badge_border": "rgba(236, 72, 153, 0.4)",
    },
    7: {
        "id": 7,
        "name_en": "Invertebrate",
        "name_uz": "Umurtqasizlar",
        "scientific_group": "Invertebrata",
        "description_uz": "Umurtqa pog'onasi bo'lmagan organizmlar: dengiz yulduzlari, qisqichbaqasimonlar, sakkizoyoqlar, chuvalchanglar.",
        "color": "#14b8a6", # Teal
        "badge_bg": "rgba(20, 184, 166, 0.15)",
        "badge_border": "rgba(20, 184, 166, 0.4)",
    }
}

FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "hair": {
        "name": "hair",
        "name_uz": "Jun / tuklar",
        "description_uz": "Hayvon tanasida jun yoki soch qoplamining mavjudligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "feathers": {
        "name": "feathers",
        "name_uz": "Patlar",
        "description_uz": "Tanasida qushlarga xos patlarning bo'lishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "eggs": {
        "name": "eggs",
        "name_uz": "Tuxum qo'yish",
        "description_uz": "Ko'payish uchun tuxum qo'yishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "milk": {
        "name": "milk",
        "name_uz": "Sut emizish",
        "description_uz": "Bolalarini ona suti bilan boqishi (sut bezlarining borligi).",
        "type": "binary",
        "allowed": [0, 1],
    },
    "airborne": {
        "name": "airborne",
        "name_uz": "Havoda uchish",
        "description_uz": "Havoda ucha olish qobiliyati.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "aquatic": {
        "name": "aquatic",
        "name_uz": "Suvda yashash",
        "description_uz": "Asosan suv havzalarida umrguzaronlik qilishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "predator": {
        "name": "predator",
        "name_uz": "Yirtqichlik",
        "description_uz": "Boshqa jonzotlarni ovlab oziqlanishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "toothed": {
        "name": "toothed",
        "name_uz": "Tishlarning borligi",
        "description_uz": "Jag'ida tishlarning mavjudligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "backbone": {
        "name": "backbone",
        "name_uz": "Umurtqa pog'onasi",
        "description_uz": "Skeletida umurtqa suyagining mavjudligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "breathes": {
        "name": "breathes",
        "name_uz": "O'pka bilan nafas olish",
        "description_uz": "O'pka yoki havo nafas yo'llari orqali nafas olishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "venomous": {
        "name": "venomous",
        "name_uz": "Zaharlilik",
        "description_uz": "Zaharli bezlar yoki chaquvchi a'zolarining bo'lishi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "fins": {
        "name": "fins",
        "name_uz": "Suzgich qanotlar",
        "description_uz": "Suvda suzishga moslashgan qanotlarning borligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "legs": {
        "name": "legs",
        "name_uz": "Oyoqlar soni",
        "description_uz": "Harakatlanish uchun oyoqlar soni (0, 2, 4, 5, 6, 8).",
        "type": "numeric",
        "allowed": [0, 2, 4, 5, 6, 8],
    },
    "tail": {
        "name": "tail",
        "name_uz": "Dum mavjudligi",
        "description_uz": "Tananing orqa qismida dumning borligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "domestic": {
        "name": "domestic",
        "name_uz": "Xonaki hayvon",
        "description_uz": "Inson tomonidan xonakilashtirilganligi.",
        "type": "binary",
        "allowed": [0, 1],
    },
    "catsize": {
        "name": "catsize",
        "name_uz": "Mushuk o'lchami yoki kattaroq",
        "description_uz": "Tana hajmining uy mushugi o'lchamidan katta yoki tengligi.",
        "type": "binary",
        "allowed": [0, 1],
    }
}

DATASET_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "zoo.csv")
DATASET_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "zoo.data")
UCI_DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/zoo/zoo.data"

def load_zoo_dataset() -> pd.DataFrame:
    """
    Loads authentic UCI Zoo dataset from local cache or downloads from UCI archive.
    Validates columns, row counts, and data types.
    """
    cols = ["animal_name"] + FEATURE_NAMES + ["class_type"]
    df = None

    if os.path.exists(DATASET_CSV_PATH):
        try:
            df = pd.read_csv(DATASET_CSV_PATH)
        except Exception:
            pass

    if df is None and os.path.exists(DATASET_DATA_PATH):
        try:
            df = pd.read_csv(DATASET_DATA_PATH, header=None, names=cols)
        except Exception:
            pass

    if df is None:
        try:
            req = urllib.request.urlopen(UCI_DATA_URL, timeout=10)
            content = req.read().decode("utf-8")
            df = pd.read_csv(io.StringIO(content), header=None, names=cols)
            os.makedirs(os.path.dirname(DATASET_CSV_PATH), exist_ok=True)
            df.to_csv(DATASET_CSV_PATH, index=False)
        except Exception as e:
            raise RuntimeError(f"UCI Zoo dataset yuklab olinmadi: {e}")

    # Validate schema
    if list(df.columns) != cols:
        raise ValueError(f"Kutilmagan ustunlar: {df.columns}, kutilmoqda: {cols}")

    if len(df) != 101:
        raise ValueError(f"Kutilmagan satrlar soni: {len(df)}, kutilmoqda: 101")

    # Validate types and ranges
    for f in FEATURE_NAMES:
        if f == "legs":
            invalid = set(df["legs"].unique()) - {0, 2, 4, 5, 6, 8}
            if invalid:
                raise ValueError(f"Oyoqlar sonida noto'g'ri qiymatlar: {invalid}")
        else:
            invalid = set(df[f].unique()) - {0, 1}
            if invalid:
                raise ValueError(f"{f} ustunida noto'g'ri binar qiymatlar: {invalid}")

    return df
