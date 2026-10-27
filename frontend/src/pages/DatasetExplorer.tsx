import React, { useEffect, useState } from "react";
import { 
  Database, 
  Search, 
  ExternalLink, 
  AlertTriangle 
} from "lucide-react";
import { api } from "../services/api";
import { DatasetAnimal } from "../types";
import { CLASSES_MAP } from "../constants/presets";
import { useAnimal } from "../context/AnimalContext";
import { PageTab } from "../components/Navbar";

interface DatasetExplorerProps {
  setActiveTab: (tab: PageTab) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ setActiveTab }) => {
  const { setCustomAnimal } = useAnimal();

  const [animals, setAnimals] = useState<DatasetAnimal[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<DatasetAnimal | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDatasetAnimals(),
      api.getDatasetSummary(),
    ])
      .then(([animalList, sumData]) => {
        setAnimals(animalList);
        setSummary(sumData);
        if (animalList.length > 0) setSelectedAnimal(animalList[0]);
      })
      .catch((err) => {
        console.error("Dataset load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredAnimals = animals.filter((a) => {
    const matchesName = a.animal_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === null || a.class_id === selectedClassFilter;
    return matchesName && matchesClass;
  });

  const handleSelectToPredict = (a: DatasetAnimal) => {
    setCustomAnimal(a.animal_name, a.features, null);
    setActiveTab("decision-tree");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wider">101 ta haqiqiy hayvon ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030708] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-[0.2em] mb-1">
            <Database className="w-4 h-4" />
            <span>Authentic UCI Machine Learning Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white">
            UCI Zoo Dataset — Ma'lumotlar To'plami
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-3xl font-light">
            1990 yilda Richard Forsyth tomonidan taqdim etilgan 101 ta hayvon va 16 ta biologik belgilardan iborat klassik ta'limiy to'plam.
          </p>
        </div>

        {/* Dataset Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl cinematic-card">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Jami namunalar</span>
              <span className="text-2xl font-bold text-white font-mono mt-1 block">{summary.total_samples} ta</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Haqiqiy yozuvlar</span>
            </div>

            <div className="p-5 rounded-2xl cinematic-card">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Kiruvchi belgilar</span>
              <span className="text-2xl font-bold text-cyan-300 font-mono mt-1 block">{summary.features_count} ta</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">15 binar + 1 numeric (legs)</span>
            </div>

            <div className="p-5 rounded-2xl cinematic-card">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Tasnif sinflari</span>
              <span className="text-2xl font-bold text-teal-300 font-mono mt-1 block">{summary.classes_count} ta guruh</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">1 dan 7 gacha</span>
            </div>

            <div className="p-5 rounded-2xl cinematic-card flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Asl manba</span>
                <span className="text-xs font-bold text-white block mt-1">UCI ML Repository</span>
              </div>
              <a
                href={summary.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-bold mt-2"
              >
                <span>archive.ics.uci.edu</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Dataset Limitations Alert */}
        <div className="p-5 rounded-2xl cinematic-card border-amber-500/30 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block text-sm mb-1 uppercase font-mono tracking-wider">
              Kichik Ma'lumotlar To'plami Cheklovlari (Scientific Disclaimer):
            </strong>
            <p className="text-slate-300 font-light">
              {summary?.dataset_limitations_uz || 
                "To'plamda atigi 101 ta hayvon mavjud. Ba'zi sinflarda (masalan, sudralib yuruvchilar — 5 ta, amfibiyalar — 4 ta) namunalar juda kam. " +
                "Bu sinflararo nomutanosiblikni keltirib chiqaradi. Shuning uchun qarorlar daraxti va KNN kabi algoritmlarda Stratified Train/Test split usuli zarurdir."
              }
            </p>
          </div>
        </div>

        {/* Search, Filter & Table Area */}
        <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hayvon nomi bo'yicha qidirish (wolf, frog)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors font-medium"
              />
            </div>

            {/* Class Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedClassFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold whitespace-nowrap transition-all ${
                  selectedClassFilter === null
                    ? "bg-cyan-400 text-black shadow-[0_0_10px_#22d3ee] font-bold"
                    : "bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                Barchasi ({animals.length})
              </button>
              {Object.values(CLASSES_MAP).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedClassFilter === c.id
                      ? "text-black font-bold shadow"
                      : "bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                  style={{
                    backgroundColor: selectedClassFilter === c.id ? c.color : undefined,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name_uz.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px] rounded-xl border border-white/[0.08] no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#070b10] text-slate-400 uppercase text-[10px] font-mono border-b border-white/10 z-10">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Hayvon nomi</th>
                  <th className="p-3.5">Sinf guruhi</th>
                  <th className="p-3.5">Jun</th>
                  <th className="p-3.5">Pat</th>
                  <th className="p-3.5">Tuxum</th>
                  <th className="p-3.5">Sut</th>
                  <th className="p-3.5">Uchish</th>
                  <th className="p-3.5">Suvda</th>
                  <th className="p-3.5">Yirtqich</th>
                  <th className="p-3.5">Oyoqlar</th>
                  <th className="p-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono">
                {filteredAnimals.map((a, idx) => {
                  const isSelected = selectedAnimal?.animal_name === a.animal_name;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAnimal(a)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-cyan-950/30 font-bold" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="p-3.5 text-slate-500">{idx + 1}</td>
                      <td className="p-3.5 font-sans font-bold text-white capitalize">{a.animal_name}</td>
                      <td className="p-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: a.color + "22",
                            color: a.color,
                          }}
                        >
                          {a.class_name_uz}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{a.features.hair ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.feathers ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.eggs ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.milk ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.airborne ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.aquatic ? "1" : "0"}</td>
                      <td className="p-3.5 text-slate-400">{a.features.predator ? "1" : "0"}</td>
                      <td className="p-3.5 text-cyan-300 font-bold">{a.features.legs}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToPredict(a);
                          }}
                          className="px-3 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold font-mono uppercase tracking-wider transition-all"
                        >
                          Tahlil →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
