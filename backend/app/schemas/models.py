from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator

ALLOWED_LEGS = {0, 2, 4, 5, 6, 8}

class AnimalFeatures(BaseModel):
    hair: int = Field(..., ge=0, le=1, description="Jun/tuklar mavjudligi (0 yoki 1)")
    feathers: int = Field(..., ge=0, le=1, description="Patlar mavjudligi (0 yoki 1)")
    eggs: int = Field(..., ge=0, le=1, description="Tuxum qo'yish (0 yoki 1)")
    milk: int = Field(..., ge=0, le=1, description="Sut emizish (0 yoki 1)")
    airborne: int = Field(..., ge=0, le=1, description="Uchish qobiliyati (0 yoki 1)")
    aquatic: int = Field(..., ge=0, le=1, description="Suvda yashash (0 yoki 1)")
    predator: int = Field(..., ge=0, le=1, description="Yirtqichlik (0 yoki 1)")
    toothed: int = Field(..., ge=0, le=1, description="Tishlarning mavjudligi (0 yoki 1)")
    backbone: int = Field(..., ge=0, le=1, description="Umurtqa pog'onasi (0 yoki 1)")
    breathes: int = Field(..., ge=0, le=1, description="O'pka bilan nafas olish (0 yoki 1)")
    venomous: int = Field(..., ge=0, le=1, description="Zaharlilik (0 yoki 1)")
    fins: int = Field(..., ge=0, le=1, description="Suzgich qanotlar (0 yoki 1)")
    legs: int = Field(..., description="Oyoqlar soni (0, 2, 4, 5, 6, 8)")
    tail: int = Field(..., ge=0, le=1, description="Dum mavjudligi (0 yoki 1)")
    domestic: int = Field(..., ge=0, le=1, description="Xonaki hayvonligi (0 yoki 1)")
    catsize: int = Field(..., ge=0, le=1, description="Mushuk o'lchamida yoki kattaroq (0 yoki 1)")

    @field_validator("legs")
    @classmethod
    def validate_legs(cls, v: int) -> int:
        if v not in ALLOWED_LEGS:
            raise ValueError(f"Oyoqlar soni faqat {sorted(list(ALLOWED_LEGS))} qiymatlaridan biri bo'lishi shart.")
        return v

class AnimalProfileRequest(BaseModel):
    animal_name: Optional[str] = Field("Noma'lum hayvon", description="Hayvon nomi (ko'rgazmali)")
    features: AnimalFeatures
    photo_data: Optional[str] = Field(None, description="Ixtiyoriy rasm (faqat UI ko'rgazmasi uchun, ML modeliga kiritilmaydi)")

class KNNQueryRequest(BaseModel):
    features: AnimalFeatures
    k: int = Field(5, ge=1, le=25, description="Qo'shnilar soni K")

class ForestVotesQueryRequest(BaseModel):
    features: AnimalFeatures
    detailed_limit: int = Field(10, ge=1, le=50, description="Batafsil ko'rsatiladigan daraxtlar soni")

class SingleTreeQueryRequest(BaseModel):
    tree_id: int = Field(..., ge=0, description="Daraxt indeksi")
    features: Optional[AnimalFeatures] = Field(None, description="Ixtiyoriy xususiyatlar vektori")
