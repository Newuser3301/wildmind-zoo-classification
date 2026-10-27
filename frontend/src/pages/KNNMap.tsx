import React, { useEffect, useState } from "react";
import { 
  Compass, 
  Play, 
  Layers, 
  Info, 
  Eye, 
  EyeOff, 
  Sparkles,
  Hash
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { api } from "../services/api";
import { KNNResponse, KNNPoint } from "../types";
import { CLASSES_MAP } from "../constants/presets";
import { gameAudio } from "../services/soundEngine";

export const KNNMap: React.FC = () => {
  const { activeName, activeFeatures, reducedMotion } = useAnimal();

  const [kValue, setKValue] = useState<number>(5);
  const [knnData, setKnnData] = useState<KNNResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Visual toggles
  const [showDistanceLines, setShowDistanceLines] = useState<boolean>(true);
  const [showDecisionRegions, setShowDecisionRegions] = useState<boolean>(false);
  const [decisionRegionsData, setDecisionRegionsData] = useState<any | null>(null);
  const [loadingRegions, setLoadingRegions] = useState<boolean>(false);

  // Selected point for detailed inspection
  const [inspectedPoint, setInspectedPoint] = useState<KNNPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<KNNPoint | null>(null);

  // Animation of neighbor discovery
  const [animatedNeighborsCount, setAnimatedNeighborsCount] = useState<number>(5);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.queryKNN(activeFeatures, kValue)
      .then((data) => {
        if (!isMounted) return;
        setKnnData(data);
        setAnimatedNeighborsCount(data.nearest_neighbors.length);
        setIsDiscovering(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("KNN error:", err);
        setError(err.message || "KNN hisoblashda xatolik yuz berdi");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFeatures, kValue]);

  const handleToggleDecisionRegions = async () => {
    gameAudio.playClick();
    if (!showDecisionRegions && !decisionRegionsData) {
      setLoadingRegions(true);
      try {
        const regions = await api.getKNNDecisionRegions();
        setDecisionRegionsData(regions);
        setShowDecisionRegions(true);
      } catch (err) {
        console.error("Error loading decision regions:", err);
      } finally {
        setLoadingRegions(false);
      }
    } else {
      setShowDecisionRegions(!showDecisionRegions);
    }
  };

  const handleReplayDiscovery = () => {
    if (!knnData) return;
    gameAudio.playRadarScan();
    setIsDiscovering(true);
    setAnimatedNeighborsCount(0);

    const total = knnData.nearest_neighbors.length;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimatedNeighborsCount(step);
      gameAudio.playTargetLock(step);
      if (step >= total) {
        clearInterval(interval);
        setIsDiscovering(false);
        gameAudio.playLevelUp();
      }
    }, reducedMotion ? 350 : 500);
  };

  if (loading && !knnData) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wider">16 o'lchamli fazoda Evklid masofalari hisoblanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !knnData) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center max-w-md">
          <p className="text-red-300 text-sm mb-4">{error || "KNN ma'lumotlari yuklanmadi"}</p>
        </div>
      </div>
    );
  }

  // Coordinate mapping for SVG
  const allX = knnData.training_points.map((p) => p.pca_x).concat([knnData.query_point_pca.x]);
  const allY = knnData.training_points.map((p) => p.pca_y).concat([knnData.query_point_pca.y]);
  const minX = Math.min(...allX) - 0.8;
  const maxX = Math.max(...allX) + 0.8;
  const minY = Math.min(...allY) - 0.8;
  const maxY = Math.max(...allY) + 0.8;

  const mapWidth = 720;
  const mapHeight = 520;

  const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * (mapWidth - 80) + 40;
  const scaleY = (y: number) => mapHeight - (((y - minY) / (maxY - minY)) * (mapHeight - 80) + 40);

  const queryScreenX = scaleX(knnData.query_point_pca.x);
  const queryScreenY = scaleY(knnData.query_point_pca.y);

  const visibleNeighbors = knnData.nearest_neighbors.slice(0, animatedNeighborsCount);
  const visibleNeighborIndices = new Set(visibleNeighbors.map((n) => n.train_index));

  return (
    <div className="min-h-screen bg-[#030708] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-[0.2em] mb-1">
              <Compass className="w-4 h-4" />
              <span>K-Nearest Neighbors (KNN) — Interaktiv Koordinata Fazosi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              K-Eng Yaqin Qo'shnilar Xaritasi
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Haqiqiy masofalar 16 ta standartlashtirilgan belgi (StandardScaler) bo'yicha hisoblangan.
              Quyidagi tekislik — o'quv ma'lumotlarining 2D PCA proyeksiyasi ({knnData.total_variance_explained}% dispersiya tushuntirilgan).
            </p>
          </div>

          {/* Dynamic K Selector */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl cinematic-card">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5 text-cyan-400" /> K soni:
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 3, 5, 7, 9].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    gameAudio.playClick();
                    setKValue(k);
                  }}
                  className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                    kValue === k
                      ? "bg-cyan-400 text-black shadow-[0_0_12px_#22d3ee] scale-105"
                      : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Explanation Banner */}
        <div className="p-5 sm:p-6 rounded-2xl cinematic-card border-cyan-500/40 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/40">
                  K = {kValue} uchun qaror
                </span>
                <span 
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: (CLASSES_MAP[knnData.predicted_class_id]?.color || "#22d3ee") + "33",
                    color: CLASSES_MAP[knnData.predicted_class_id]?.color || "#22d3ee",
                  }}
                >
                  Sinf: {knnData.predicted_class_uz} ({knnData.predicted_class_en})
                </span>
              </div>
              <p className="text-sm font-medium text-white leading-relaxed">
                {knnData.explanation_uz}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReplayDiscovery}
                disabled={isDiscovering}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-300 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Qidiruv animatsiyasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Map & Side Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coordinate Plot (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl cinematic-card flex flex-col justify-between">
            {/* Map Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08] text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDistanceLines(!showDistanceLines)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs uppercase tracking-wider font-mono transition-all ${
                    showDistanceLines
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                      : "bg-white/[0.04] border-white/10 text-slate-400"
                  }`}
                >
                  {showDistanceLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Masofa chiziqlari</span>
                </button>

                <button
                  onClick={handleToggleDecisionRegions}
                  disabled={loadingRegions}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs uppercase tracking-wider font-mono transition-all ${
                    showDecisionRegions
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                      : "bg-white/[0.04] border-white/10 text-slate-400"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>2D Hududlar</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-cyan-400/90">
                PCA 1 ({((knnData.pca_variance_ratio[0] || 0) * 100).toFixed(1)}%) vs PCA 2 ({((knnData.pca_variance_ratio[1] || 0) * 100).toFixed(1)}%)
              </div>
            </div>

            {/* Interactive SVG Plot */}
            <div className="relative my-4 flex items-center justify-center overflow-hidden">
              <svg
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                className="w-full max-w-[720px] h-auto rounded-xl bg-[#04080c] border border-white/[0.08]"
              >
                {/* Grid Lines */}
                <line x1="40" y1={mapHeight / 2} x2={mapWidth - 40} y2={mapHeight / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1={mapWidth / 2} y1="40" x2={mapWidth / 2} y2={mapHeight - 40} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />

                {/* Optional Decision Regions */}
                {showDecisionRegions && decisionRegionsData && (
                  <g opacity="0.35">
                    {decisionRegionsData.points.map((pt: any, i: number) => {
                      const sx = scaleX(pt.x);
                      const sy = scaleY(pt.y);
                      return (
                        <rect
                          key={`reg-${i}`}
                          x={sx - 7}
                          y={sy - 7}
                          width="14"
                          height="14"
                          fill={pt.color}
                          rx="3"
                        />
                      );
                    })}
                  </g>
                )}

                {/* Distance Lines from Query to Nearest Neighbors */}
                {showDistanceLines && visibleNeighbors.map((neigh) => {
                  const targetX = scaleX(neigh.pca_x);
                  const targetY = scaleY(neigh.pca_y);
                  const midX = (queryScreenX + targetX) / 2;
                  const midY = (queryScreenY + targetY) / 2;

                  return (
                    <g key={`line-${neigh.train_index}`}>
                      <line
                        x1={queryScreenX}
                        y1={queryScreenY}
                        x2={targetX}
                        y2={targetY}
                        stroke="#22d3ee"
                        strokeWidth="1.8"
                        strokeDasharray="4,4"
                        className="animate-pulse"
                      />
                      {/* Distance Tag */}
                      <rect
                        x={midX - 22}
                        y={midY - 9}
                        width="44"
                        height="18"
                        rx="4"
                        fill="#05080c"
                        stroke="#22d3ee"
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY + 3.5}
                        fill="#67e8f9"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="select-none font-mono"
                      >
                        {neigh.distance_16d.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Training Animals Points (80 points) */}
                {knnData.training_points.map((pt) => {
                  const sx = scaleX(pt.pca_x);
                  const sy = scaleY(pt.pca_y);
                  const isVisibleNeigh = visibleNeighborIndices.has(pt.id);
                  const isSelected = inspectedPoint?.id === pt.id;

                  return (
                    <g
                      key={`pt-${pt.id}`}
                      onClick={() => setInspectedPoint(pt)}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer"
                    >
                      {/* Highlight Ring for Neighbors */}
                      {isVisibleNeigh && (
                        <circle
                          cx={sx}
                          cy={sy}
                          r="12"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2.5"
                          className="animate-ping opacity-70"
                        />
                      )}

                      {/* Main Point */}
                      <circle
                        cx={sx}
                        cy={sy}
                        r={isVisibleNeigh ? "7" : isSelected ? "8" : "4.5"}
                        fill={pt.color}
                        stroke={isVisibleNeigh ? "#ffffff" : isSelected ? "#38bdf8" : "#030708"}
                        strokeWidth={isVisibleNeigh ? "2" : "1.2"}
                        className="transition-all hover:scale-125"
                      />

                      {/* Rank badge */}
                      {isVisibleNeigh && pt.neighbor_rank && (
                        <text
                          x={sx}
                          y={sy - 10}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="select-none font-mono filter drop-shadow"
                        >
                          #{pt.neighbor_rank}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Query Animal Pulsing Marker */}
                <g>
                  <circle
                    cx={queryScreenX}
                    cy={queryScreenY}
                    r="24"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-ping"
                  />
                  <circle
                    cx={queryScreenX}
                    cy={queryScreenY}
                    r="14"
                    fill="#22d3ee"
                    opacity="0.25"
                  />
                  <circle
                    cx={queryScreenX}
                    cy={queryScreenY}
                    r="8.5"
                    fill="#22d3ee"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="shadow-[0_0_15px_#22d3ee]"
                  />
                  <text
                    x={queryScreenX}
                    y={queryScreenY + 22}
                    fill="#67e8f9"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none font-sans filter drop-shadow-md"
                  >
                    ⭐ {activeName}
                  </text>
                </g>
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-black/90 backdrop-blur-md border border-cyan-500/40 text-xs pointer-events-none z-30">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span style={{ color: hoveredPoint.color }}>●</span>
                    <span>{hoveredPoint.animal_name}</span>
                    <span className="text-[10px] text-slate-400">({hoveredPoint.class_name_uz})</span>
                  </div>
                  {hoveredPoint.distance_16d !== null && (
                    <div className="text-[10px] font-mono text-cyan-300 mt-1">
                      16D Evklid masofasi: {hoveredPoint.distance_16d}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Class Legend */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Sinflar:</span>
              <div className="flex flex-wrap items-center gap-3">
                {Object.values(CLASSES_MAP).map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-300 font-medium">{c.name_uz}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Neighbors & Votes */}
          <div className="space-y-6">
            {/* Votes Breakdown Card */}
            <div className="p-6 rounded-2xl cinematic-card">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-3 border-b border-white/[0.08] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>K = {kValue} uchun Ovozlar</span>
              </h3>

              <div className="space-y-3">
                {knnData.vote_distribution
                  .filter((v) => v.votes > 0)
                  .map((vote) => (
                    <div key={vote.class_id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vote.color }} />
                          <span>{vote.class_name_uz}</span>
                        </span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {vote.votes} ovoz ({vote.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${vote.percentage}%`,
                            backgroundColor: vote.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Nearest Neighbors Ordered List */}
            <div className="p-6 rounded-2xl cinematic-card">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-3 border-b border-white/[0.08]">
                Eng Yaqin {kValue} ta Namuna (16D)
              </h3>

              <div className="space-y-2.5">
                {knnData.nearest_neighbors.map((neigh) => (
                  <div
                    key={neigh.train_index}
                    onClick={() => {
                      const pt = knnData.training_points.find((p) => p.id === neigh.train_index);
                      if (pt) setInspectedPoint(pt);
                    }}
                    className="p-3 rounded-xl bg-black/40 border border-white/[0.08] hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center border border-cyan-500/30">
                        #{neigh.rank}
                      </span>
                      <div>
                        <div className="font-bold text-white capitalize">{neigh.animal_name}</div>
                        <div className="text-[10px] font-mono" style={{ color: neigh.color }}>
                          {neigh.class_name_uz}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-cyan-300 font-bold">d = {neigh.distance_16d}</div>
                      <div className="text-[9px] text-slate-500 font-mono">16D Evklid</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Animal Inspection Card */}
        {inspectedPoint && (
          <div className="p-6 rounded-2xl cinematic-card border-cyan-500/40">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: inspectedPoint.color }} />
                <h3 className="text-sm font-bold text-white">
                  Tanlangan namuna: {inspectedPoint.animal_name} ({inspectedPoint.class_name_uz})
                </h3>
              </div>
              <button
                onClick={() => setInspectedPoint(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Yopish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block mb-1">Sinf guruhi:</span>
                <span className="font-bold text-white text-sm">{inspectedPoint.class_name_uz}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block mb-1">16D Evklid masofasi:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {inspectedPoint.distance_16d !== null ? inspectedPoint.distance_16d : "K-ro'yxatda emas"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block mb-1">2D PCA koordinatalari:</span>
                <span className="text-slate-300">
                  x: {inspectedPoint.pca_x}, y: {inspectedPoint.pca_y}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
