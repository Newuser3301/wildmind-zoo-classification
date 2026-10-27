import React, { useState } from "react";
import { AnimalProvider } from "./context/AnimalContext";
import { Navbar, PageTab } from "./components/Navbar";
import { AnimalStatusBar } from "./components/AnimalStatusBar";
import { Home } from "./pages/Home";
import { AnimalStudio } from "./pages/AnimalStudio";
import { DecisionTreeExplorer } from "./pages/DecisionTreeExplorer";
import { KNNMap } from "./pages/KNNMap";
import { RandomForestExplorer } from "./pages/RandomForestExplorer";
import { ModelComparison } from "./pages/ModelComparison";
import { DatasetExplorer } from "./pages/DatasetExplorer";
import { Sparkles, Heart } from "lucide-react";

export function AppContent() {
  const [activeTab, setActiveTab] = useState<PageTab>("home");

  return (
    <div className="min-h-screen flex flex-col bg-[#07100d] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Persistent Animal Status Bar (visible on all tabs except home) */}
      {activeTab !== "home" && (
        <AnimalStatusBar onOpenStudio={() => setActiveTab("studio")} />
      )}

      {/* Main Page Content */}
      <main className="flex-1">
        {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
        {activeTab === "studio" && <AnimalStudio setActiveTab={setActiveTab} />}
        {activeTab === "decision-tree" && <DecisionTreeExplorer />}
        {activeTab === "knn" && <KNNMap />}
        {activeTab === "random-forest" && <RandomForestExplorer />}
        {activeTab === "comparison" && <ModelComparison setActiveTab={setActiveTab} />}
        {activeTab === "dataset" && <DatasetExplorer setActiveTab={setActiveTab} />}
      </main>

      {/* Cinematic Footer */}
      <footer className="border-t border-emerald-950/80 bg-[#060e0b] py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">WildMind AI</span>
            <span>—</span>
            <span>Interactive Zoo Classification Lab</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500 space-y-0.5">
            <div>Haqiqiy UCI Zoo ma'lumotlar to'plami va scikit-learn modellari</div>
            <div>DecisionTreeClassifier • KNeighborsClassifier • RandomForestClassifier</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AnimalProvider>
      <AppContent />
    </AnimalProvider>
  );
}
