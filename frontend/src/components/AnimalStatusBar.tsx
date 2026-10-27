import React from "react";
import { ANIMAL_PRESETS } from "../constants/presets";
import { useAnimal } from "../context/AnimalContext";
import { CheckCircle2, AlertTriangle, SlidersHorizontal, Sparkles } from "lucide-react";
import { gameAudio } from "../services/soundEngine";

interface AnimalStatusBarProps {
  onOpenStudio?: () => void;
}

export const AnimalStatusBar: React.FC<AnimalStatusBarProps> = ({ onOpenStudio }) => {
  const { activePresetId, loadPreset, predictionResult, isLoading } = useAnimal();

  const presetsList = ANIMAL_PRESETS.slice(0, 8);

  const handleSelectPreset = (preset: any) => {
    gameAudio.playCoin();
    loadPreset(preset);
  };

  const handleOpenStudio = () => {
    gameAudio.playClick();
    if (onOpenStudio) onOpenStudio();
  };

  return (
    <div className="bg-[#05080c]/95 border-b border-white/[0.06] py-2 px-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Preset Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-mono text-cyan-400/90 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Namunalar:
          </span>
          <div className="flex items-center gap-1.5">
            {presetsList.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                    isSelected
                      ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(34,211,238,0.4)] scale-105"
                      : "bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:border-cyan-500/40 hover:text-white"
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span className="hidden sm:inline font-medium">{preset.name_uz}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Consensus & Models Status */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {predictionResult && !isLoading && (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  predictionResult.consensus.all_agree
                    ? "bg-cyan-950/50 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                    : "bg-amber-950/50 border-amber-500/40 text-amber-300"
                }`}
              >
                {predictionResult.consensus.all_agree ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="tracking-wide">
                  {predictionResult.consensus.agreement_ratio} {predictionResult.consensus.majority_class_uz}
                </span>
              </div>

              {/* Models quick pills */}
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-500">DT:</span>
                <span className="text-cyan-300 font-medium">
                  {predictionResult.predictions.decision_tree.class_name_uz} ({predictionResult.predictions.decision_tree.confidence}%)
                </span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-500">KNN:</span>
                <span className="text-teal-300 font-medium">
                  {predictionResult.predictions.knn.class_name_uz}
                </span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-500">RF:</span>
                <span className="text-amber-300 font-medium">
                  {predictionResult.predictions.random_forest.class_name_uz} ({predictionResult.predictions.random_forest.confidence}%)
                </span>
              </div>
            </div>
          )}

          {onOpenStudio && (
            <button
              onClick={handleOpenStudio}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Belgilar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
