import React, { useState } from "react";
import { 
  Sparkles, 
  Upload, 
  Check, 
  X, 
  Info, 
  ArrowRight, 
  FileCheck2,
  Sliders
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { ANIMAL_PRESETS, AnimalPreset } from "../constants/presets";
import { AnimalFeatures } from "../types";
import { PageTab } from "../components/Navbar";
import { gameAudio } from "../services/soundEngine";

interface AnimalStudioProps {
  setActiveTab: (tab: PageTab) => void;
}

const FEATURE_CONFIG: Array<{
  key: keyof AnimalFeatures;
  name_uz: string;
  name_en: string;
  description_uz: string;
}> = [
  { key: "hair", name_uz: "Jun / Tuklar", name_en: "hair", description_uz: "Tanasida jun, mo'yna yoki tuk qoplamasi bormi?" },
  { key: "feathers", name_uz: "Patlar", name_en: "feathers", description_uz: "Qushlarga xos pat qoplamasi bormi?" },
  { key: "backbone", name_uz: "Umurtqa pog'onasi", name_en: "backbone", description_uz: "Skeletida umurtqa suyagi mavjudmi?" },
  { key: "toothed", name_uz: "Tishlar", name_en: "toothed", description_uz: "Jag'ida tishlar mavjudmi?" },
  { key: "tail", name_uz: "Dum", name_en: "tail", description_uz: "Tananing orqa qismida dum mavjudmi?" },
  { key: "breathes", name_uz: "O'pka bilan nafas olish", name_en: "breathes", description_uz: "O'pka yoki havo yo'li orqali nafas oladimi?" },
  
  { key: "airborne", name_uz: "Havoda uchish", name_en: "airborne", description_uz: "Havoda parvoz qila oladimi?" },
  { key: "aquatic", name_uz: "Suvda yashash", name_en: "aquatic", description_uz: "Asosiy hayotini suvda o'tkazadimi?" },
  { key: "fins", name_uz: "Suzgich qanotlar", name_en: "fins", description_uz: "Suvda suzishga mo'ljallangan qanotlari bormi?" },
  
  { key: "milk", name_uz: "Sut emizish", name_en: "milk", description_uz: "Bolalarini ona suti bilan boqadimi?" },
  { key: "eggs", name_uz: "Tuxum qo'yish", name_en: "eggs", description_uz: "Ko'payish uchun tuxum qo'yadimi?" },
  { key: "predator", name_uz: "Yirtqichlik", name_en: "predator", description_uz: "Boshqa jonivorlarni ovlab yeydimi?" },
  { key: "venomous", name_uz: "Zaharlilik", name_en: "venomous", description_uz: "Zahar bezlari yoki zaharli nishi bormi?" },
  
  { key: "domestic", name_uz: "Xonaki hayvon", name_en: "domestic", description_uz: "Inson tomonidan xonakilashtirilganmi?" },
  { key: "catsize", name_uz: "Mushuk o'lchami yoki kattaroq", name_en: "catsize", description_uz: "Gavdasi oddiy uy mushugidan katta yoki tengmi?" },
];

const LEG_OPTIONS = [0, 2, 4, 5, 6, 8];

export const AnimalStudio: React.FC<AnimalStudioProps> = ({ setActiveTab }) => {
  const { 
    activeName, 
    activeFeatures, 
    activePresetId, 
    photoUrl, 
    loadPreset, 
    updateFeature, 
    setCustomAnimal, 
    predictionResult
  } = useAnimal();

  const [customName, setCustomName] = useState(activeName);
  const [photoPreview, setPhotoPreview] = useState<string | null>(photoUrl);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    setCustomAnimal(e.target.value, activeFeatures, photoPreview);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setCustomAnimal(customName, activeFeatures, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToPreset = (preset: AnimalPreset) => {
    gameAudio.playCoin();
    setCustomName(preset.name_uz);
    setPhotoPreview(null);
    loadPreset(preset);
  };

  const handleToggleFeature = (key: keyof AnimalFeatures, currentVal: number) => {
    const nextVal = currentVal === 1 ? 0 : 1;
    gameAudio.playToggle(nextVal === 1);
    updateFeature(key, nextVal);
  };

  const handleSelectLegs = (val: number) => {
    gameAudio.playClick();
    updateFeature("legs", val);
  };

  return (
    <div className="min-h-screen bg-[#030708] py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-[0.2em] mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Animal Profile & Feature Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white">
            Jonzot Profilini Sozlash va Belgilarni Kiritish
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl font-light">
            Haqiqiy UCI Zoo ma'lumotlar to'plamidagi 16 ta biologik xususiyatni sozlang. 
            Barcha uchala model (Decision Tree, KNN, Random Forest) xuddi shu kiruvchi vektor bo'yicha tahlil qiladi.
          </p>
        </div>

        {/* Top Grid: Presets and Animal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Presets Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl cinematic-card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Haqiqiy Namunalar (Presets)</span>
              </h2>
              <span className="text-[10px] font-mono text-cyan-400/80">UCI Zoo Records</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ANIMAL_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => resetToPreset(p)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)] scale-102"
                        : "bg-white/[0.03] border-white/[0.08] hover:border-cyan-500/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{p.icon}</div>
                    <div className="text-xs font-bold text-white truncate">{p.name_uz}</div>
                    <div className="text-[10px] text-cyan-400/90 truncate font-mono mt-0.5">{p.class_name_uz}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Name & Optional Photo */}
          <div className="p-6 rounded-2xl cinematic-card flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-3 border-b border-white/[0.08]">
                Jonzot Identifikatori
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Hayvon nomi:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={handleNameChange}
                    placeholder="Masalan: Bo'ri, Oqqush..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium flex items-center justify-between">
                    <span>Ixtiyoriy rasm yuklash:</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Faqat UI uchun</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {photoPreview ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-cyan-500/40">
                        <img src={photoPreview} alt="Animal" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setPhotoPreview(null);
                            setCustomAnimal(customName, activeFeatures, null);
                          }}
                          className="absolute top-0 right-0 p-1 bg-black/80 text-white hover:text-red-400 rounded-bl"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-black/40 border border-dashed border-white/20 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 text-xs text-center hover:bg-white/[0.08] hover:border-cyan-500/40 transition-all font-medium">
                      <span>Rasm tanlash</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Notice */}
            <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-cyan-300">Ilmiy izoh:</strong> Zoo modeli piksellardan emas, balki 16 ta biologik belgilardan foydalanadi.
              </span>
            </div>
          </div>
        </div>

        {/* Feature Switches Matrix */}
        <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-6">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                16 ta Biologik Belgi (Canonical Feature Vector)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Har bir belgini o'zgartiring va uchala model natijasi qanday yangilanishini kuzating.
              </p>
            </div>

            {/* Legs Special Selector */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-white/10">
              <span className="text-xs font-mono text-cyan-300 whitespace-nowrap font-bold">Oyoqlar (legs):</span>
              <div className="flex items-center gap-1">
                {LEG_OPTIONS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSelectLegs(val)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeFeatures.legs === val
                        ? "bg-cyan-400 text-black shadow-[0_0_10px_#22d3ee]"
                        : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid of 15 Binary Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {FEATURE_CONFIG.map((feat) => {
              const val = activeFeatures[feat.key];
              const isTrue = val === 1;

              return (
                <div
                  key={feat.key}
                  onClick={() => handleToggleFeature(feat.key, val)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isTrue
                      ? "bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                      : "bg-black/30 border-white/[0.06] hover:border-white/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white tracking-wide">{feat.name_uz}</span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                        isTrue ? "bg-cyan-400 text-black shadow-[0_0_8px_#22d3ee]" : "bg-white/[0.05] text-slate-600"
                      }`}
                    >
                      {isTrue ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {feat.description_uz}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/[0.05]">
                    <span className="text-slate-500">{feat.name_en}</span>
                    <span className={isTrue ? "text-cyan-400 font-bold" : "text-slate-600"}>
                      {isTrue ? "Mavjud (1)" : "Yo'q (0)"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Results Banner */}
        {predictionResult && (
          <div className="p-6 sm:p-8 rounded-2xl cinematic-card border-cyan-500/40 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 font-mono">
                    {predictionResult.consensus.agreement_ratio} Yakdil
                  </span>
                  <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Inference Natijasi</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                  Jonzot guruhi:{" "}
                  <span className="gradient-title-cyan text-glow-cyan">
                    {predictionResult.consensus.majority_class_uz}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl font-light">
                  {predictionResult.consensus.summary_uz}
                </p>
              </div>

              {/* Three Mini Cards */}
              <div className="flex flex-wrap items-center gap-3">
                <div 
                  onClick={() => setActiveTab("decision-tree")}
                  className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all min-w-[130px]"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Decision Tree</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {predictionResult.predictions.decision_tree.class_name_uz}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">
                    {predictionResult.predictions.decision_tree.confidence}% ishonch
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("knn")}
                  className="p-3.5 rounded-xl bg-black/60 border border-teal-500/30 hover:border-teal-400 cursor-pointer transition-all min-w-[130px]"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-mono">KNN (K=5)</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {predictionResult.predictions.knn.class_name_uz}
                  </div>
                  <div className="text-[10px] font-mono text-teal-400">
                    {predictionResult.predictions.knn.confidence}% ishonch
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab("random-forest")}
                  className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all min-w-[130px]"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Random Forest</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {predictionResult.predictions.random_forest.class_name_uz}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    {predictionResult.predictions.random_forest.confidence}% ishonch
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-light">
                Algoritmlarning ushbu xulosaga qanday yetib kelganini bosqichma-bosqich tomosha qiling:
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveTab("decision-tree")}
                  className="px-4 py-2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <span>Qarorlar daraxti</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("knn")}
                  className="px-4 py-2 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <span>KNN xaritasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab("random-forest")}
                  className="px-4 py-2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <span>Tasodifiy o'rmon</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
