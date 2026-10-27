import React, { createContext, useContext, useState, useEffect } from "react";
import { AnimalFeatures, PredictionResponse } from "../types";
import { ANIMAL_PRESETS, AnimalPreset } from "../constants/presets";
import { api } from "../services/api";

interface AnimalContextType {
  activeName: string;
  activeFeatures: AnimalFeatures;
  activePresetId: string | null;
  photoUrl: string | null;
  predictionResult: PredictionResponse | null;
  isLoading: boolean;
  error: string | null;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  loadPreset: (preset: AnimalPreset) => void;
  updateFeature: (feat: keyof AnimalFeatures, val: number) => void;
  setCustomAnimal: (name: string, features: AnimalFeatures, photoUrl?: string | null) => void;
  runPrediction: () => Promise<void>;
}

const defaultPreset = ANIMAL_PRESETS[0]; // Wolf

const AnimalContext = createContext<AnimalContextType | undefined>(undefined);

export const AnimalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeName, setActiveName] = useState<string>(defaultPreset.name_uz);
  const [activeFeatures, setActiveFeatures] = useState<AnimalFeatures>(defaultPreset.features);
  const [activePresetId, setActivePresetId] = useState<string | null>(defaultPreset.id);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const runPrediction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictAnimal(activeName, activeFeatures, photoUrl);
      setPredictionResult(res);
    } catch (err: any) {
      console.error("Prediction error:", err);
      setError(err?.message || "Bashorat qilishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (preset: AnimalPreset) => {
    setActiveName(preset.name_uz);
    setActiveFeatures(preset.features);
    setActivePresetId(preset.id);
    setPhotoUrl(null);
  };

  const updateFeature = (feat: keyof AnimalFeatures, val: number) => {
    setActiveFeatures((prev) => ({ ...prev, [feat]: val }));
    setActivePresetId(null); // Custom since a feature was manually edited
  };

  const setCustomAnimal = (name: string, features: AnimalFeatures, photo?: string | null) => {
    setActiveName(name);
    setActiveFeatures(features);
    setActivePresetId(null);
    setPhotoUrl(photo || null);
  };

  // Run initial prediction once on startup
  useEffect(() => {
    runPrediction();
  }, [activeFeatures]);

  return (
    <AnimalContext.Provider
      value={{
        activeName,
        activeFeatures,
        activePresetId,
        photoUrl,
        predictionResult,
        isLoading,
        error,
        reducedMotion,
        setReducedMotion,
        loadPreset,
        updateFeature,
        setCustomAnimal,
        runPrediction,
      }}
    >
      {children}
    </AnimalContext.Provider>
  );
};

export const useAnimal = () => {
  const context = useContext(AnimalContext);
  if (!context) {
    throw new Error("useAnimal must be used within an AnimalProvider");
  }
  return context;
};
