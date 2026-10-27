import React, { useState } from "react";
import { 
  Sparkles, 
  GitFork, 
  Compass, 
  Trees, 
  BarChart3, 
  Database, 
  Sliders, 
  Eye, 
  EyeOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { gameAudio } from "../services/soundEngine";

export type PageTab = 
  | "home" 
  | "studio" 
  | "decision-tree" 
  | "knn" 
  | "random-forest" 
  | "comparison" 
  | "dataset";

interface NavbarProps {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { activeName, reducedMotion, setReducedMotion, predictionResult } = useAnimal();

  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getIsMuted());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    gameAudio.setMuted(next);
    if (!next) gameAudio.playCoin();
  };

  const handleTabClick = (tab: PageTab) => {
    gameAudio.playClick();
    setActiveTab(tab);
  };

  const navItems: Array<{ id: PageTab; label: string; icon: React.ReactNode }> = [
    { id: "home", label: "Bosh sahifa", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "studio", label: "Jonzot profili", icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: "decision-tree", label: "Qarorlar daraxti", icon: <GitFork className="w-3.5 h-3.5" /> },
    { id: "knn", label: "KNN xaritasi", icon: <Compass className="w-3.5 h-3.5" /> },
    { id: "random-forest", label: "Tasodifiy o'rmon", icon: <Trees className="w-3.5 h-3.5" /> },
    { id: "comparison", label: "Taqqoslash", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "dataset", label: "Ma'lumotlar", icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#030708]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => handleTabClick("home")}
            onMouseEnter={() => gameAudio.playHover()}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <span className="font-extrabold text-black text-xs font-mono">WM</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-[0.2em] text-white uppercase">WildMind</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono tracking-widest">
                  AI LAB
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  onMouseEnter={() => gameAudio.playHover()}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
                    isActive
                      ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={isActive ? "text-cyan-400" : "text-slate-500"}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Game Audio SFX Toggle Button */}
            <button
              onClick={toggleSound}
              title={isMuted ? "O'yin ovozlarini yoqish (Game SFX ON)" : "Ovozni o'chirish (Mute)"}
              className={`p-2 rounded-lg border transition-all text-xs flex items-center justify-center ${
                !isMuted
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.25)] scale-105"
                  : "bg-white/[0.03] text-slate-500 border-white/10 hover:text-slate-300"
              }`}
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Active Animal Badge */}
            <button
              onClick={() => handleTabClick("studio")}
              onMouseEnter={() => gameAudio.playHover()}
              title="Faol jonzot xususiyatlarini tahrirlash"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.08] transition-all text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              <span className="text-slate-200 font-medium truncate max-w-[90px] sm:max-w-[120px]">
                {activeName}
              </span>
              {predictionResult && (
                <span 
                  className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: predictionResult.predictions.decision_tree.color + "22",
                    color: predictionResult.predictions.decision_tree.color,
                  }}
                >
                  {predictionResult.predictions.decision_tree.class_name_uz}
                </span>
              )}
            </button>

            {/* Reduced Motion Toggle */}
            <button
              onClick={() => {
                gameAudio.playClick();
                setReducedMotion(!reducedMotion);
              }}
              title={reducedMotion ? "Animatsiyalarni yoqish" : "Sekinlashtirilgan animatsiya (Reduced motion)"}
              className={`p-2 rounded-lg border transition-all text-xs flex items-center justify-center ${
                reducedMotion
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {reducedMotion ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Nav */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-white/[0.06]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-all uppercase tracking-wider ${
                activeTab === item.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
