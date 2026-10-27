import React, { useEffect, useState, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  GitFork, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { api } from "../services/api";
import { TreeStructure, TreeTraceResponse, TraceStep, TreeNode } from "../types";
import { CLASSES_MAP } from "../constants/presets";
import { gameAudio } from "../services/soundEngine";
import confetti from "canvas-confetti";

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

export const DecisionTreeExplorer: React.FC = () => {
  const { activeName, activeFeatures, reducedMotion } = useAnimal();

  const [treeStructure, setTreeStructure] = useState<TreeStructure | null>(null);
  const [traceData, setTraceData] = useState<TreeTraceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation controller state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  // Zoom / Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getDecisionTreeStructure(),
      api.traceDecisionTree(activeFeatures),
    ])
      .then(([structure, trace]) => {
        if (!isMounted) return;
        setTreeStructure(structure);
        setTraceData(trace);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Tree load error:", err);
        setError(err.message || "Qarorlar daraxti yuklanmadi");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeFeatures]);

  // Animation playback timer
  useEffect(() => {
    if (isPlaying && traceData) {
      const intervalMs = (reducedMotion ? 1200 : 1800) / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= traceData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, traceData, playbackSpeed, reducedMotion]);

  // Trigger authentic arcade game sound effects on step change
  useEffect(() => {
    if (traceData && traceData.steps[currentStepIndex]) {
      const step = traceData.steps[currentStepIndex];
      if (step.is_leaf) {
        gameAudio.playVictoryFanfare();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#22d3ee", "#14b8a6", "#38bdf8", "#f59e0b"]
        });
      } else {
        gameAudio.playLaserWarp();
      }
    }
  }, [currentStepIndex, traceData]);

  // Tree layout computation
  const computeTreeLayout = (structure: TreeStructure): { layoutNodes: LayoutNode[]; width: number; height: number } => {
    const nodes = structure.nodes;
    const nodeMap = new Map<number, TreeNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const depthMap = new Map<number, number>();
    const computeDepth = (id: number, d: number) => {
      depthMap.set(id, d);
      const n = nodeMap.get(id);
      if (n && !n.is_leaf) {
        if (n.children_left !== null) computeDepth(n.children_left, d + 1);
        if (n.children_right !== null) computeDepth(n.children_right, d + 1);
      }
    };
    computeDepth(0, 0);

    const levels: number[][] = [];
    depthMap.forEach((depth, id) => {
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(id);
    });

    const levelHeight = 150;
    const nodeWidth = 220;
    const horizontalGap = 30;

    let maxLevelCount = 1;
    levels.forEach((l) => {
      if (l.length > maxLevelCount) maxLevelCount = l.length;
    });

    const totalWidth = Math.max(1000, maxLevelCount * (nodeWidth + horizontalGap) + 100);
    const totalHeight = (levels.length + 1) * levelHeight + 50;

    const layoutNodes: LayoutNode[] = [];

    levels.forEach((levelNodeIds, d) => {
      const count = levelNodeIds.length;
      const step = totalWidth / (count + 1);
      levelNodeIds.forEach((id, index) => {
        const n = nodeMap.get(id)!;
        layoutNodes.push({
          node: n,
          x: step * (index + 1),
          y: d * levelHeight + 80,
          depth: d,
        });
      });
    });

    return { layoutNodes, width: totalWidth, height: totalHeight };
  };

  const currentStep: TraceStep | null =
    traceData && traceData.steps[currentStepIndex] ? traceData.steps[currentStepIndex] : null;

  const visitedNodeIds = new Set<number>(
    traceData ? traceData.steps.slice(0, currentStepIndex + 1).map((s) => s.node_id) : []
  );

  const activeNodeId = currentStep ? currentStep.node_id : 0;

  const handlePlayPause = () => {
    gameAudio.playClick();
    if (!traceData) return;
    if (currentStepIndex >= traceData.steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    gameAudio.playClick();
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleNext = () => {
    gameAudio.playClick();
    if (!traceData) return;
    setIsPlaying(false);
    if (currentStepIndex < traceData.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    gameAudio.playClick();
    if (!traceData) return;
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wider">Haqiqiy scikit-learn qarorlar daraxti tahlil qilinmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !treeStructure || !traceData) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center max-w-md">
          <p className="text-red-300 text-sm mb-4">{error || "Daraxt topilmadi"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-xs font-bold"
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }

  const { layoutNodes, width: canvasWidth, height: canvasHeight } = computeTreeLayout(treeStructure);
  const nodePositionMap = new Map<number, LayoutNode>();
  layoutNodes.forEach((ln) => nodePositionMap.set(ln.node.id, ln));

  return (
    <div className="min-h-screen bg-[#030708] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title & Status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono uppercase tracking-[0.2em] mb-1">
              <GitFork className="w-4 h-4" />
              <span>DecisionTreeClassifier — Haqiqiy scikit-learn Daraxti</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Qarorlar Daraxti Bo'ylab Interaktiv Sayohat
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Faol jonzot: <strong className="text-cyan-300 font-semibold">{activeName}</strong>. 
              Har bir tugunda haqiqiy Gini indeksi, chegara qiymati va o'quv namunalari aks ettirilgan.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Tugunlar</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{treeStructure.node_count} ta</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Chuqurlik</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{treeStructure.max_depth} bosqich</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Barglar</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{treeStructure.n_leaves} ta leaf</span>
            </div>
          </div>
        </div>

        {/* Live Step Explanation Banner (Prompt Requirement) */}
        {currentStep && (
          <div className="p-5 sm:p-6 rounded-2xl cinematic-card border-cyan-500/40 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/40">
                    {currentStep.step_number}-bosqich / {traceData.total_steps}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentStep.is_leaf ? `Leaf #${currentStep.node_id}` : `Tugun #${currentStep.node_id}`}
                  </span>
                  {currentStep.is_leaf && (
                    <span 
                      className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: (CLASSES_MAP[currentStep.predicted_class_id]?.color || "#22d3ee") + "33",
                        color: CLASSES_MAP[currentStep.predicted_class_id]?.color || "#22d3ee",
                      }}
                    >
                      Yakuniy sinf: {currentStep.predicted_class_uz}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-white leading-relaxed">
                  {currentStep.explanation_uz}
                </p>

                {/* Condition outcome badge */}
                {!currentStep.is_leaf && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Tekshiruv: <code className="text-cyan-300 bg-black/60 px-2 py-0.5 rounded font-mono border border-white/10">{currentStep.feature_name} &lt;= {currentStep.threshold?.toFixed(2)}</code>
                    </span>
                    <span className="text-slate-400">
                      Kiritilgan qiymat: <strong className="text-white font-mono">{currentStep.user_value}</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase font-mono tracking-wider ${
                      currentStep.condition_met 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}>
                      {currentStep.condition_met ? "Shart bajarildi (Chapga)" : "Shart bajarilmadi (O'ngga)"}
                    </span>
                  </div>
                )}
              </div>

              {/* Dominant Class / Leaves Mini Preview */}
              <div className="shrink-0 p-4 rounded-xl bg-black/60 border border-white/10 text-right min-w-[160px]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">O'quv namunalari:</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">{currentStep.samples} ta hayvon</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-0.5">Gini: {currentStep.impurity}</div>
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls Toolbar */}
        <div className="p-3.5 rounded-2xl cinematic-card flex flex-wrap items-center justify-between gap-4">
          {/* Play/Pause/Steps */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
                isPlaying
                  ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  : "bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-cyan-300"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? "To'xtatish" : currentStepIndex >= traceData.total_steps - 1 ? "Qaytadan" : "Bashoratni kuzatish"}</span>
            </button>

            <button
              onClick={handleReset}
              title="Boshiga qaytish"
              className="p-2.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-px bg-white/10 mx-1" />

            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-cyan-300 px-2 font-bold">
              {currentStepIndex + 1} / {traceData.total_steps}
            </span>

            <button
              onClick={handleNext}
              disabled={currentStepIndex >= traceData.total_steps - 1}
              className="p-2 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Zoom */}
          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span className="text-[11px] uppercase tracking-wider">Tezlik:</span>
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    playbackSpeed === spd
                      ? "bg-cyan-400 text-black"
                      : "bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-2 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                className="p-2 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-2 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                title="Masshtabni 100% ga qaytarish"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tree Canvas Area */}
        <div className="rounded-2xl bg-[#04080c] border border-white/[0.08] overflow-hidden relative shadow-2xl">
          {/* Canvas Header Legend */}
          <div className="p-3.5 bg-black/60 border-b border-white/[0.08] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span>Faol qadam</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 border border-teal-400" />
                <span>Bosib o'tilgan yo'l</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-white/[0.05] border border-white/20" />
                <span>Tugunlar</span>
              </div>
            </div>

            <div className="text-[11px] text-cyan-400/80 font-mono">
              Interaktiv xarita: Sichqoncha orqali harakatlantirish va tugunlarni ko'rish mumkin
            </div>
          </div>

          {/* Interactive Scrollable Canvas */}
          <div className="overflow-auto max-h-[620px] p-6 relative no-scrollbar">
            <div
              style={{
                width: `${canvasWidth * zoomLevel}px`,
                height: `${canvasHeight * zoomLevel}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
                position: "relative",
              }}
            >
              {/* SVG Connector Lines */}
              <svg
                width={canvasWidth}
                height={canvasHeight}
                className="absolute top-0 left-0 pointer-events-none"
              >
                <defs>
                  <marker
                    id="arrowhead-cyan"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#22d3ee" />
                  </marker>
                  <marker
                    id="arrowhead-default"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#1e293b" />
                  </marker>
                </defs>

                {layoutNodes.map((parentLn) => {
                  const node = parentLn.node;
                  if (node.is_leaf) return null;

                  const leftChild = node.children_left !== null ? nodePositionMap.get(node.children_left) : null;
                  const rightChild = node.children_right !== null ? nodePositionMap.get(node.children_right) : null;

                  const parentVisited = visitedNodeIds.has(node.id);

                  return (
                    <g key={`lines-${node.id}`}>
                      {/* Left Edge (<= threshold) */}
                      {leftChild && (
                        (() => {
                          const isLeftActive =
                            parentVisited &&
                            visitedNodeIds.has(leftChild.node.id);
                          return (
                            <g>
                              <line
                                x1={parentLn.x}
                                y1={parentLn.y + 40}
                                x2={leftChild.x}
                                y2={leftChild.y - 40}
                                stroke={isLeftActive ? "#22d3ee" : "#1e293b"}
                                strokeWidth={isLeftActive ? "3" : "1.5"}
                                strokeDasharray={isLeftActive ? "none" : "3,3"}
                                markerEnd={isLeftActive ? "url(#arrowhead-cyan)" : "url(#arrowhead-default)"}
                                className={isLeftActive ? "transition-all duration-500" : ""}
                              />
                              <text
                                x={(parentLn.x + leftChild.x) / 2 - 20}
                                y={(parentLn.y + leftChild.y) / 2}
                                fill={isLeftActive ? "#22d3ee" : "#64748b"}
                                fontSize="10.5"
                                fontWeight="bold"
                                className="select-none font-mono"
                              >
                                Ha (&lt;={node.threshold?.toFixed(1)})
                              </text>
                            </g>
                          );
                        })()
                      )}

                      {/* Right Edge (> threshold) */}
                      {rightChild && (
                        (() => {
                          const isRightActive =
                            parentVisited &&
                            visitedNodeIds.has(rightChild.node.id);
                          return (
                            <g>
                              <line
                                x1={parentLn.x}
                                y1={parentLn.y + 40}
                                x2={rightChild.x}
                                y2={rightChild.y - 40}
                                stroke={isRightActive ? "#22d3ee" : "#1e293b"}
                                strokeWidth={isRightActive ? "3" : "1.5"}
                                strokeDasharray={isRightActive ? "none" : "3,3"}
                                markerEnd={isRightActive ? "url(#arrowhead-cyan)" : "url(#arrowhead-default)"}
                                className={isRightActive ? "transition-all duration-500" : ""}
                              />
                              <text
                                x={(parentLn.x + rightChild.x) / 2 + 10}
                                y={(parentLn.y + rightChild.y) / 2}
                                fill={isRightActive ? "#22d3ee" : "#64748b"}
                                fontSize="10.5"
                                fontWeight="bold"
                                className="select-none font-mono"
                              >
                                Yo'q (&gt;{node.threshold?.toFixed(1)})
                              </text>
                            </g>
                          );
                        })()
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* HTML Node Cards */}
              {layoutNodes.map((ln) => {
                const node = ln.node;
                const isCurrent = node.id === activeNodeId;
                const isVisited = visitedNodeIds.has(node.id);

                const nodeBg = isCurrent
                  ? "bg-[#0b1622] border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] scale-105 z-30 ring-2 ring-cyan-400"
                  : isVisited
                  ? "bg-[#09121a] border-cyan-500/60 shadow-md z-20"
                  : "bg-[#060b10] border-white/[0.08] opacity-60 hover:opacity-100 z-10";

                return (
                  <div
                    key={`node-${node.id}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      left: `${ln.x - 110}px`,
                      top: `${ln.y - 45}px`,
                      width: "220px",
                    }}
                    className={`absolute p-3 rounded-xl border text-xs cursor-pointer transition-all duration-300 ${nodeBg}`}
                  >
                    {/* Header: Node type & ID */}
                    <div className="flex items-center justify-between mb-1 font-mono">
                      <span className="text-[10px] text-slate-400">
                        {node.id === 0 ? "Ildiz (Root)" : node.is_leaf ? `Leaf #${node.id}` : `Tugun #${node.id}`}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">
                        Gini: {node.impurity}
                      </span>
                    </div>

                    {/* Condition or Leaf Class */}
                    {node.is_leaf ? (
                      <div className="py-1">
                        <div 
                          className="font-extrabold text-sm truncate"
                          style={{ color: CLASSES_MAP[node.predicted_class_id]?.color || "#22d3ee" }}
                        >
                          {node.predicted_class_uz}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {CLASSES_MAP[node.predicted_class_id]?.name_en} ({node.samples} ta namuna)
                        </div>
                      </div>
                    ) : (
                      <div className="py-1">
                        <div className="font-bold text-white text-xs truncate">
                          {node.feature_name_uz}
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                          {node.feature_name} &lt;= {node.threshold?.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {/* Footer Samples Count */}
                    <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{node.samples} ta namuna</span>
                      {isCurrent && (
                        <span className="text-cyan-400 font-bold animate-pulse">● Hozirgi</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Node Detailed Inspector */}
        {selectedNodeId !== null && nodePositionMap.get(selectedNodeId) && (
          <div className="p-6 rounded-2xl cinematic-card border-cyan-500/40">
            {(() => {
              const selNode = nodePositionMap.get(selectedNodeId)!.node;
              return (
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Tugun #{selNode.id} Tafsilotlari</span>
                    </h3>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Yopish
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                    <div>
                      <div className="text-slate-400 mb-1">Tugun turi:</div>
                      <div className="font-bold text-white">
                        {selNode.id === 0 ? "Ildiz (Root node)" : selNode.is_leaf ? "Yakuniy barg (Leaf)" : "Qaror tuguni (Split node)"}
                      </div>
                      <div className="text-slate-400 mt-3">Gini noaniqlik ko'rsatkichi:</div>
                      <div className="font-mono text-cyan-400 font-bold text-sm">{selNode.impurity}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Tugundan o'tgan o'quv namunalari soni:</div>
                      <div className="font-mono font-bold text-white text-base">{selNode.samples} ta</div>
                      <div className="text-slate-400 mt-3">Dominant guruh:</div>
                      <div className="font-bold text-cyan-300">
                        {selNode.predicted_class_uz} ({CLASSES_MAP[selNode.predicted_class_id]?.name_en})
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Namunalar (Haqiqiy Zoo yozuvlari):</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selNode.representative_animals && selNode.representative_animals.length > 0 ? (
                          selNode.representative_animals.map((a, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-[11px] text-slate-200"
                            >
                              {a.animal_name} ({a.class_name_uz})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">Mavjud emas</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
