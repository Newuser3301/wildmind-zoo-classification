import React, { useEffect, useState } from "react";
import { 
  GitFork, 
  Compass, 
  Trees, 
  ArrowRight, 
  Sparkles, 
  Award, 
  Play, 
  Database,
  Sliders,
  ChevronRight
} from "lucide-react";
import { PageTab } from "../components/Navbar";
import { useAnimal } from "../context/AnimalContext";
import { api } from "../services/api";
import { ModelMetricsResponse } from "../types";
import { ANIMAL_PRESETS } from "../constants/presets";
import { gameAudio } from "../services/soundEngine";

interface HomeProps {
  setActiveTab: (tab: PageTab) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { loadPreset } = useAnimal();
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    api.getModelMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error loading metrics:", err));
  }, []);

  const showcaseAnimals = [
    {
      preset: ANIMAL_PRESETS.find(p => p.id === "wolf")!,
      bgGradient: "from-cyan-950/60 via-[#0a1219] to-black",
      badge: "01 • SUTEMIZUVCHI",
      tagline: "Yirtqich o'rmonlar qiroli",
    },
    {
      preset: ANIMAL_PRESETS.find(p => p.id === "swan")!,
      bgGradient: "from-teal-950/60 via-[#091515] to-black",
      badge: "02 • QUSH",
      tagline: "Havoda va suvda erkin",
    },
    {
      preset: ANIMAL_PRESETS.find(p => p.id === "piranha")!,
      bgGradient: "from-blue-950/60 via-[#0a101b] to-black",
      badge: "03 • BALIQ",
      tagline: "Amazon daryosi xavfi",
    },
    {
      preset: ANIMAL_PRESETS.find(p => p.id === "tortoise")!,
      bgGradient: "from-emerald-950/60 via-[#091410] to-black",
      badge: "04 • SUDRALIB YURUVCHI",
      tagline: "Qadimiy qattiq kosa",
    },
  ];

  const algorithms = [
    {
      id: "decision-tree" as PageTab,
      name: "DecisionTreeClassifier",
      titleUz: "Qarorlar Daraxti",
      subtitleUz: "Mantiqiy shoxlanish qoidalari",
      descriptionUz: "Ildiz tugunidan boshlab har bir biologik belgini ketma-ket tekshirib, yakuniy barg qaroriga yetib boradi.",
      icon: <GitFork className="w-5 h-5 text-cyan-400" />,
      cvScore: metrics ? `${(metrics.decision_tree.cv_mean * 100).toFixed(1)}%` : "95.0%",
      tag: "INTERPRETABLE",
    },
    {
      id: "knn" as PageTab,
      name: "K-Nearest Neighbors",
      titleUz: "K-Eng Yaqin Qo'shnilar",
      subtitleUz: "16D fazoda o'xshashlik masofasi",
      descriptionUz: "StandardScaler fazosida Evklid masofasi bo'yicha eng yaqin K ta hayvonning ko'pchilik ovozini aniqlaydi.",
      icon: <Compass className="w-5 h-5 text-teal-400" />,
      cvScore: metrics ? `${(metrics.knn.cv_mean * 100).toFixed(1)}%` : "93.1%",
      tag: "GEOMETRIC",
    },
    {
      id: "random-forest" as PageTab,
      name: "RandomForestClassifier",
      titleUz: "Tasodifiy O'rmon",
      subtitleUz: "100 ta daraxtning konsensus ovozi",
      descriptionUz: "100 ta mustaqil qarorlar daraxtining kollektiv ovoz berishi orqali xatolikni kamaytiradi va barqarorlikni oshiradi.",
      icon: <Trees className="w-5 h-5 text-amber-400" />,
      cvScore: metrics ? `${(metrics.random_forest.cv_mean * 100).toFixed(1)}%` : "96.0%",
      tag: "ENSEMBLE",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030708] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Cinematic Hero Section inspired by user reference */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#060c12] via-[#04080b] to-[#030708]">
        {/* Subtle Ambient Radial Glows (Turquoise / Cyan Lake feel) */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[300px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Cinematic Step Indicator (01, 02, 03... line) on Right */}
        <div className="hidden xl:flex flex-col items-center gap-4 absolute right-12 top-1/2 -translate-y-1/2 z-20 font-mono text-xs">
          {[1, 2, 3, 4].map((step) => {
            const isActive = activeStep === step;
            return (
              <div 
                key={step} 
                onClick={() => setActiveStep(step)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <span className={`transition-all ${isActive ? "text-cyan-400 font-bold" : "text-slate-600 group-hover:text-slate-400"}`}>
                  0{step}
                </span>
                <span className={`transition-all h-[1px] ${isActive ? "w-8 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "w-3 bg-white/10 group-hover:bg-white/30"}`} />
              </div>
            );
          })}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          {/* Subtle Category Pill */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400">
              WildMind AI Platform
            </span>
          </div>

          {/* Epic Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white max-w-4xl leading-tight">
            Interactive Zoo <br />
            <span className="gradient-title-cyan text-glow-cyan">Classification Lab</span>
          </h1>

          {/* Subtitle & Concept */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-light leading-relaxed">
            Uchta haqiqiy algoritm. Uch xil matematik fikrlash usuli. Bitta hayvon.
            Haqiqiy UCI Zoo ma'lumotlar to'plami asosida qaror chiqarish intellektini o'z ko'zingiz bilan ko'ring.
          </p>

          {/* Action Row */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                gameAudio.playClick();
                setActiveTab("studio");
              }}
              onMouseEnter={() => gameAudio.playHover()}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-extrabold text-xs uppercase tracking-widest hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Laboratoriyani boshlash</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                gameAudio.playClick();
                setActiveTab("comparison");
              }}
              onMouseEnter={() => gameAudio.playHover()}
              className="flex items-center gap-2 px-6 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Modellar taqqoslash</span>
            </button>
          </div>

          {/* Bottom Features Strip */}
          <div className="mt-16 pt-8 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-mono">
            <div>
              <div className="text-slate-500 uppercase tracking-wider text-[10px]">Ma'lumotlar to'plami</div>
              <div className="text-white font-bold text-sm mt-0.5">UCI Zoo (101 hayvon)</div>
              <div className="text-slate-400 text-[11px] font-sans">16 biologik parametr</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase tracking-wider text-[10px]">Decision Tree</div>
              <div className="text-cyan-300 font-bold text-sm mt-0.5">
                {metrics ? `${(metrics.decision_tree.cv_mean * 100).toFixed(0)}% CV` : "95% CV"}
              </div>
              <div className="text-slate-400 text-[11px] font-sans">Haqiqiy tree_ tuzilishi</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase tracking-wider text-[10px]">KNN (K=5)</div>
              <div className="text-teal-300 font-bold text-sm mt-0.5">
                {metrics ? `${(metrics.knn.cv_mean * 100).toFixed(0)}% CV` : "93% CV"}
              </div>
              <div className="text-slate-400 text-[11px] font-sans">StandardScaler + 16D</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase tracking-wider text-[10px]">Random Forest</div>
              <div className="text-amber-300 font-bold text-sm mt-0.5">
                {metrics ? `${(metrics.random_forest.cv_mean * 100).toFixed(0)}% CV` : "96% CV"}
              </div>
              <div className="text-slate-400 text-[11px] font-sans">100 ta mustaqil daraxt</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tall Vertical Cards Section inspired by "POPULAR TOURS" in the image */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-400 block mb-2">
            Namuna Jonzotlar
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            Klassifikatsiya Guruhlari
          </h2>
          <p className="mt-2 text-xs text-slate-400 max-w-lg mx-auto">
            Haqiqiy UCI Zoo to'plamidagi namunalardan birini tanlang va modellarning tekshiruv yo'lini tomosha qiling.
          </p>
        </div>

        {/* 4 Vertical Cinematic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseAnimals.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                gameAudio.playCoin();
                loadPreset(item.preset);
                setActiveTab("decision-tree");
              }}
              onMouseEnter={() => gameAudio.playHover()}
              className={`cinematic-card p-6 rounded-2xl bg-gradient-to-b ${item.bgGradient} flex flex-col justify-between h-[340px] cursor-pointer group`}
            >
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400/90 block mb-2">
                  {item.badge}
                </span>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.preset.icon}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.preset.name_uz}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{item.preset.scientific_name}</div>
                <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                  {item.preset.description_uz}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold tracking-wider">TAHLIL QILISH</span>
                <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Algorithm Spotlight Section: "DISCOVER THE WORLD IN A NEW WAY" style */}
      <section className="py-20 bg-gradient-to-b from-[#030708] via-[#060b10] to-[#030708] border-t border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Big Headline with Play Button */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-400 block mb-2">
                Machine Learning Lab
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
                Har bir bashorat <br />
                <span className="gradient-title-cyan text-glow-cyan">ortidagi mantiq</span>
              </h2>

              <p className="mt-6 text-sm text-slate-300 leading-relaxed font-light">
                WildMind AI shunchaki natija bermaydi — u qanday qilib o'sha natijaga kelinganini matematik jihatdan isbotlab beradi.
                Qarorlar daraxtining shoxlanishlari, KNN ning 16 o'lchovli masofasi va Random Forest ning 100 ta mustaqil ovozi sizga sun'iy intellektning ichki mexanizmini ochib beradi.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => {
                    gameAudio.playClick();
                    setActiveTab("decision-tree");
                  }}
                  onMouseEnter={() => gameAudio.playHover()}
                  className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.05] border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold uppercase tracking-wider transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-[0_0_12px_#22d3ee]">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <span>Bashorat jarayonini tomosha qilish</span>
                </button>
              </div>
            </div>

            {/* Right Algorithm Cards Grid */}
            <div className="space-y-4">
              {algorithms.map((algo) => (
                <div
                  key={algo.id}
                  onClick={() => {
                    gameAudio.playClick();
                    setActiveTab(algo.id);
                  }}
                  onMouseEnter={() => gameAudio.playHover()}
                  className="cinematic-card p-5 rounded-2xl flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 group-hover:border-cyan-500/40 transition-colors">
                      {algo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {algo.titleUz}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-slate-400 font-mono">
                          {algo.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md line-clamp-1">
                        {algo.subtitleUz}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-cyan-300 block">
                      {algo.cvScore} CV
                    </span>
                    <span className="text-[10px] text-slate-500">Aniqlik</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
