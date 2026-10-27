import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Layers, 
  GitFork, 
  Compass, 
  Trees 
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { api } from "../services/api";
import { ModelMetricsResponse } from "../types";
import { CLASSES_MAP } from "../constants/presets";
import { PageTab } from "../components/Navbar";

interface ModelComparisonProps {
  setActiveTab: (tab: PageTab) => void;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ setActiveTab }) => {
  const { activeName, predictionResult } = useAnimal();

  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [selectedMatrixModel, setSelectedMatrixModel] = useState<"decision_tree" | "knn" | "random_forest">("decision_tree");

  useEffect(() => {
    api.getModelMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error loading metrics:", err))
      .finally(() => setLoadingMetrics(false));
  }, []);

  if (loadingMetrics || !metrics) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wider">Modellarning ilmiy ko'rsatkichlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const modelCards = [
    {
      id: "decision_tree" as const,
      tabId: "decision-tree" as PageTab,
      name: "Decision Tree",
      nameUz: "Qarorlar daraxti",
      icon: <GitFork className="w-5 h-5 text-cyan-400" />,
      color: "border-cyan-500/40 bg-cyan-950/20",
      pred: predictionResult?.predictions.decision_tree,
      metricData: metrics.decision_tree,
      prosUz: "Tushunish va qoidalar ko'rinishida talqin qilish juda oson (Interpretable).",
      consUz: "Kichik ma'lumotlarda tezda overfit bo'lishi mumkin (Yuqori dispersiya).",
    },
    {
      id: "knn" as const,
      tabId: "knn" as PageTab,
      name: "KNN (K=5)",
      nameUz: "K-Eng Yaqin Qo'shnilar",
      icon: <Compass className="w-5 h-5 text-teal-400" />,
      color: "border-teal-500/40 bg-teal-950/20",
      pred: predictionResult?.predictions.knn,
      metricData: metrics.knn,
      prosUz: "Parametrsiz (Non-parametric), murakkab geometrik klasterlarni yaxshi aniqlaydi.",
      consUz: "O'lchovlar soni (Curse of dimensionality) va ma'lumotlar masshtabiga juda sezgir.",
    },
    {
      id: "random_forest" as const,
      tabId: "random-forest" as PageTab,
      name: "Random Forest",
      nameUz: "Tasodifiy o'rmon (100 daraxt)",
      icon: <Trees className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/40 bg-amber-950/20",
      pred: predictionResult?.predictions.random_forest,
      metricData: metrics.random_forest,
      prosUz: "Eng yuqori barqarorlik, shovqinga chidamli, o'rtacha aniqligi eng yuqori.",
      consUz: "Qora quti (Black-box) xususiyati — yuzlab daraxtlar qarorini alohida kuzatish murakkab.",
    },
  ];

  const currentMatrix = metrics[selectedMatrixModel].confusion_matrix;
  const classList = Object.values(CLASSES_MAP);

  return (
    <div className="min-h-screen bg-[#030708] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-[0.2em] mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Model Comparison & Evaluation Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white">
            Modellar Taqqoslash va Ilmiy Metrikalar
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl font-light">
            Barcha uchta model bir xil kiruvchi biologik vektor (<strong className="text-cyan-300 font-semibold">{activeName}</strong>) 
            va bir xil test to'plami (Stratified 20% held-out test data) asosida baholanadi.
          </p>
        </div>

        {/* Live Consensus on Active Animal */}
        {predictionResult && (
          <div className="p-6 sm:p-8 rounded-2xl cinematic-card border-cyan-500/40 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
                    Faol Jonzot Tahlili
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Hayvon: <strong className="text-white">{activeName}</strong></span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {predictionResult.consensus.summary_uz}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 font-mono ${
                  predictionResult.consensus.all_agree
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {predictionResult.consensus.all_agree ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>Kelishuv: {predictionResult.consensus.agreement_ratio}</span>
                </span>
              </div>
            </div>

            {/* Three Models Live Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modelCards.map((mc) => (
                <div
                  key={mc.id}
                  onClick={() => setActiveTab(mc.tabId)}
                  className={`p-5 rounded-2xl border ${mc.color} cursor-pointer hover:scale-[1.02] transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {mc.icon}
                        <span className="font-bold text-white text-sm">{mc.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold">
                        {(mc.metricData.cv_mean * 100).toFixed(1)}% CV
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 my-2">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Bashorat qilingan sinf:</div>
                      <div className="text-base font-extrabold text-white mt-0.5">
                        {mc.pred?.class_name_uz}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {mc.pred?.class_name_en} ({mc.pred?.confidence}% ishonch)
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 text-[11px] text-cyan-400 font-bold font-mono uppercase tracking-wider flex items-center justify-between">
                    <span>Xaritaga o'tish</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Metrics Table */}
        <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <span>Haqiqiy Metrikalar Jadvali (21 ta test namunasi)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-light">
                Stratified Train/Test (80/20) bo'linishi bo'yicha hisoblangan rasmiy natijalar.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-slate-400 uppercase text-[10px] font-mono border-b border-white/10">
                <tr>
                  <th className="p-3 rounded-l-lg">Model nomi</th>
                  <th className="p-3">Test Aniqligi (Accuracy)</th>
                  <th className="p-3">4-Fold CV O'rtacha</th>
                  <th className="p-3">Precision (Macro)</th>
                  <th className="p-3">Recall (Macro)</th>
                  <th className="p-3">F1-Score (Macro)</th>
                  <th className="p-3 rounded-r-lg">F1-Score (Weighted)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono">
                {modelCards.map((mc) => (
                  <tr key={mc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-sans font-bold text-white flex items-center gap-2">
                      {mc.icon}
                      <span>{mc.name}</span>
                    </td>
                    <td className="p-3.5 text-cyan-300 font-bold">
                      {(mc.metricData.test_accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-teal-300 font-bold">
                      {(mc.metricData.cv_mean * 100).toFixed(1)}% ± {(mc.metricData.cv_std * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {(mc.metricData.precision_macro * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {(mc.metricData.recall_macro * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-amber-300 font-bold">
                      {(mc.metricData.f1_macro * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {(mc.metricData.f1_weighted * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Matrix Studio */}
        <div className="p-6 sm:p-8 rounded-2xl cinematic-card shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-6">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Xatolar Matritsasi (Confusion Matrix 7x7)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-light">
                Qatorlar — haqiqiy sinflar (Actual), ustunlar — model taxmini (Predicted).
              </p>
            </div>

            {/* Model Selector Tabs for Confusion Matrix */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 font-mono">
              <button
                onClick={() => setSelectedMatrixModel("decision_tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMatrixModel === "decision_tree"
                    ? "bg-cyan-400 text-black shadow font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Decision Tree
              </button>
              <button
                onClick={() => setSelectedMatrixModel("knn")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMatrixModel === "knn"
                    ? "bg-teal-400 text-black shadow font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                KNN (K=5)
              </button>
              <button
                onClick={() => setSelectedMatrixModel("random_forest")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMatrixModel === "random_forest"
                    ? "bg-amber-400 text-black shadow font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Random Forest
              </button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px] max-w-3xl mx-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-[10px] text-slate-500 text-left font-mono uppercase">Haqiqiy \ Taxmin</th>
                    {classList.map((c) => (
                      <th key={c.id} className="p-2 text-[10px] font-bold font-mono" style={{ color: c.color }}>
                        {c.name_uz.split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentMatrix.map((row, actualIdx) => {
                    const actualClass = classList[actualIdx];
                    return (
                      <tr key={actualIdx} className="border-t border-white/[0.06]">
                        <td className="p-2.5 text-left font-bold text-xs" style={{ color: actualClass.color }}>
                          {actualClass.name_uz}
                        </td>
                        {row.map((val, predIdx) => {
                          const isDiagonal = actualIdx === predIdx;
                          const hasErrors = !isDiagonal && val > 0;
                          return (
                            <td
                              key={predIdx}
                              className={`p-3 font-mono text-xs font-bold transition-colors ${
                                isDiagonal
                                  ? val > 0
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "bg-black/30 text-slate-700"
                                  : hasErrors
                                  ? "bg-red-500/30 text-red-300 border border-red-500/50"
                                  : "text-slate-700"
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
