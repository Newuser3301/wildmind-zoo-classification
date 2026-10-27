import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  Trees, 
  Play, 
  RotateCcw,
  Sparkles, 
  Filter, 
  BarChart3, 
  Layers, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  X,
  Gauge,
  Workflow,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useAnimal } from "../context/AnimalContext";
import { api } from "../services/api";
import { 
  ForestVotesResponse, 
  TreeStructure, 
  TreeNode, 
  TreeTraceResponse,
  TraceStep
} from "../types";
import { CLASSES_MAP } from "../constants/presets";
import { gameAudio } from "../services/soundEngine";
import confetti from "canvas-confetti";

type TabType = "arena" | "panorama" | "importance" | "theory";

interface MiniLayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

// Layout computer for compact SVG mini-tree
function computeMiniTreeLayout(structure: TreeStructure, width: number = 320, height: number = 190) {
  const nodeMap = new Map<number, TreeNode>();
  structure.nodes.forEach((n) => nodeMap.set(n.id, n));

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
  depthMap.forEach((d, id) => {
    if (!levels[d]) levels[d] = [];
    levels[d].push(id);
  });

  const layoutNodes: MiniLayoutNode[] = [];
  const totalLevels = Math.max(1, levels.length);
  const rowHeight = Math.min(45, (height - 40) / totalLevels);

  levels.forEach((levelIds, d) => {
    const count = levelIds.length;
    const step = width / (count + 1);
    levelIds.forEach((id, idx) => {
      const node = nodeMap.get(id)!;
      layoutNodes.push({
        node,
        x: step * (idx + 1),
        y: d * rowHeight + 25,
        depth: d,
      });
    });
  });

  return { layoutNodes, nodeMap };
}

// Mini SVG Tree Component for Panorama View
const MiniTreeCard: React.FC<{
  treeId: number;
  structure: TreeStructure;
  trace: TreeTraceResponse;
  votedClassId: number;
  votedClassUz: string;
  onInspect: (id: number) => void;
}> = ({ treeId, structure, trace, votedClassId, votedClassUz, onInspect }) => {
  const width = 340;
  const height = 190;
  const { layoutNodes, nodeMap } = useMemo(() => computeMiniTreeLayout(structure, width, height), [structure]);
  const pathSet = useMemo(() => new Set(trace.path_node_ids || []), [trace]);
  const winnerColor = CLASSES_MAP[votedClassId]?.color || "#22d3ee";

  return (
    <div className="flex flex-col p-4 rounded-2xl bg-[#071116]/80 border border-white/[0.08] hover:border-cyan-500/40 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] group">
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
            #{treeId}
          </span>
          <span className="text-xs font-bold text-white tracking-wide">
            Daraxt #{treeId}
          </span>
        </div>
        <span 
          className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
          style={{ backgroundColor: winnerColor + "22", color: winnerColor, border: `1px solid ${winnerColor}44` }}
        >
          {votedClassUz}
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[190px] bg-black/40 rounded-xl overflow-hidden border border-white/[0.03]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <filter id={`glow-mini-${treeId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {layoutNodes.map((lNode) => {
            if (lNode.node.is_leaf) return null;
            const leftChild = lNode.node.children_left !== null ? layoutNodes.find((n) => n.node.id === lNode.node.children_left) : null;
            const rightChild = lNode.node.children_right !== null ? layoutNodes.find((n) => n.node.id === lNode.node.children_right) : null;

            return (
              <g key={`edges-${lNode.node.id}`}>
                {leftChild && (
                  <line
                    x1={lNode.x}
                    y1={lNode.y}
                    x2={leftChild.x}
                    y2={leftChild.y}
                    stroke={pathSet.has(lNode.node.id) && pathSet.has(leftChild.node.id) ? "#22d3ee" : "#1e293b"}
                    strokeWidth={pathSet.has(lNode.node.id) && pathSet.has(leftChild.node.id) ? 2.5 : 1}
                    strokeDasharray={pathSet.has(lNode.node.id) && pathSet.has(leftChild.node.id) ? "none" : "2,2"}
                  />
                )}
                {rightChild && (
                  <line
                    x1={lNode.x}
                    y1={lNode.y}
                    x2={rightChild.x}
                    y2={rightChild.y}
                    stroke={pathSet.has(lNode.node.id) && pathSet.has(rightChild.node.id) ? "#22d3ee" : "#1e293b"}
                    strokeWidth={pathSet.has(lNode.node.id) && pathSet.has(rightChild.node.id) ? 2.5 : 1}
                    strokeDasharray={pathSet.has(lNode.node.id) && pathSet.has(rightChild.node.id) ? "none" : "2,2"}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {layoutNodes.map((lNode) => {
            const isVisited = pathSet.has(lNode.node.id);
            const isLeaf = lNode.node.is_leaf;
            const isFinalLeaf = isLeaf && isVisited;
            const nodeColor = isLeaf ? (CLASSES_MAP[lNode.node.predicted_class_id]?.color || "#10b981") : "#06b6d4";

            return (
              <g key={`node-${lNode.node.id}`} className="cursor-pointer" onClick={() => onInspect(treeId)}>
                {isFinalLeaf && (
                  <circle
                    cx={lNode.x}
                    cy={lNode.y}
                    r={12}
                    fill="none"
                    stroke={winnerColor}
                    strokeWidth={2}
                    className="animate-ping opacity-75"
                  />
                )}
                <circle
                  cx={lNode.x}
                  cy={lNode.y}
                  r={isLeaf ? 8 : 6}
                  fill={isVisited ? (isLeaf ? winnerColor : "#0e7490") : "#0f172a"}
                  stroke={isVisited ? "#22d3ee" : "#334155"}
                  strokeWidth={isVisited ? 2 : 1}
                  filter={isVisited ? `url(#glow-mini-${treeId})` : undefined}
                />
                {isLeaf && (
                  <text
                    x={lNode.x}
                    y={lNode.y + 14}
                    fontSize="7"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fill={isVisited ? winnerColor : "#64748b"}
                    fontWeight="bold"
                  >
                    {lNode.node.predicted_class_uz.substring(0, 4)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Root split label overlay */}
        <div className="absolute top-2 left-2 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded border border-white/10 text-cyan-300">
          Ildiz: {structure.nodes[0]?.feature_name_uz || "Alomat"} &le; {structure.nodes[0]?.threshold}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-auto text-[11px] font-mono text-slate-400">
        <span>Chuqurlik: <strong className="text-white">{structure.max_depth}</strong></span>
        <span>Barglar: <strong className="text-white">{structure.n_leaves}</strong></span>
        <button
          onClick={() => onInspect(treeId)}
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 group-hover:underline"
        >
          <span>Tahlil</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const RandomForestExplorer: React.FC = () => {
  const { activeName, activeFeatures, photoUrl, reducedMotion } = useAnimal();

  const [activeTab, setActiveTab] = useState<TabType>("arena");
  const [forestData, setForestData] = useState<ForestVotesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Voting animation state
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [votedCount, setVotedCount] = useState<number>(100);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  // 100-Tree Grid Filter & Search
  const [filterClassId, setFilterClassId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"id" | "depth" | "leaves">("id");

  // Deep Tree Inspector Modal
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [selectedTreeDetails, setSelectedTreeDetails] = useState<any | null>(null);
  const [loadingTreeDetails, setLoadingTreeDetails] = useState<boolean>(false);
  const [inspectStepIndex, setInspectStepIndex] = useState<number>(0);
  const [isAutoPlayingModal, setIsAutoPlayingModal] = useState<boolean>(false);
  const modalTimerRef = useRef<any>(null);

  // Fetch real Forest ensemble votes and detailed traces on features change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.queryRandomForestVotes(activeFeatures, 5)
      .then((data) => {
        if (!isMounted) return;
        setForestData(data);
        setVotedCount(data.total_trees);
        setIsVoting(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Forest votes error:", err);
        setError(err.message || "Tasodifiy o'rmon ma'lumotlari yuklanmadi");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    };
  }, [activeFeatures]);

  // Handle Voting Simulation
  const handleStartVoting = () => {
    if (!forestData) return;
    gameAudio.playClick();
    setIsVoting(true);
    setVotedCount(0);

    const total = forestData.total_trees;
    let current = 0;
    const intervalMs = (reducedMotion ? 15 : 30) / playbackSpeed;

    const timer = setInterval(() => {
      current += 2;
      gameAudio.playScoreTick();
      if (current >= total) {
        current = total;
        clearInterval(timer);
        setIsVoting(false);
        gameAudio.playVictoryFanfare();
        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#22d3ee", "#10b981", "#ffffff"]
        });
      }
      setVotedCount(current);
    }, intervalMs);
    timerRef.current = timer;
  };

  // Inspect any tree
  const handleInspectTree = async (treeId: number) => {
    gameAudio.playCoin();
    setSelectedTreeId(treeId);
    setLoadingTreeDetails(true);
    setInspectStepIndex(0);
    setIsAutoPlayingModal(false);

    try {
      const details = await api.getSingleForestTree(treeId, activeFeatures);
      setSelectedTreeDetails(details);
      if (details.trace && details.trace.steps.length > 0) {
        setInspectStepIndex(details.trace.steps.length - 1);
      }
    } catch (err) {
      console.error("Single tree fetch error:", err);
    } finally {
      setLoadingTreeDetails(false);
    }
  };

  // Auto-play steps in Inspector Modal
  useEffect(() => {
    if (isAutoPlayingModal && selectedTreeDetails?.trace) {
      const stepsCount = selectedTreeDetails.trace.steps.length;
      modalTimerRef.current = setInterval(() => {
        setInspectStepIndex((prev) => {
          if (prev >= stepsCount - 1) {
            setIsAutoPlayingModal(false);
            gameAudio.playVictoryFanfare();
            return prev;
          }
          gameAudio.playLaserWarp();
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    } else {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    }
    return () => {
      if (modalTimerRef.current) clearInterval(modalTimerRef.current);
    };
  }, [isAutoPlayingModal, selectedTreeDetails, playbackSpeed]);

  // Filtered & Sorted 100 Trees
  const filteredTrees = useMemo(() => {
    if (!forestData) return [];
    let list = [...forestData.all_tree_votes];

    if (filterClassId !== "all") {
      list = list.filter((t) => t.predicted_class_id === filterClassId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => 
        t.tree_id.toString().includes(q) || 
        t.predicted_class_uz.toLowerCase().includes(q) ||
        (t.root_feature_uz && t.root_feature_uz.toLowerCase().includes(q))
      );
    }

    if (sortBy === "depth") {
      list.sort((a, b) => b.tree_depth - a.tree_depth);
    } else if (sortBy === "leaves") {
      list.sort((a, b) => b.n_leaves - a.n_leaves);
    } else {
      list.sort((a, b) => a.tree_id - b.tree_id);
    }

    return list;
  }, [forestData, filterClassId, searchQuery, sortBy]);

  if (loading && !forestData) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-cyan-300 text-sm font-mono tracking-wider">
            100 ta haqiqiy qarorlar daraxti mustaqil baholanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (error || !forestData) {
    return (
      <div className="min-h-screen bg-[#030708] flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center max-w-md">
          <p className="text-red-300 text-sm mb-4">{error || "O'rmon ma'lumotlari yuklanmadi"}</p>
        </div>
      </div>
    );
  }

  const liveVotes = forestData.all_tree_votes.slice(0, votedCount);
  const liveClassCounts: Record<number, number> = {};
  liveVotes.forEach((v) => {
    liveClassCounts[v.predicted_class_id] = (liveClassCounts[v.predicted_class_id] || 0) + 1;
  });

  const finalWinner = CLASSES_MAP[forestData.final_predicted_class_id];
  const winnerProbability = ((forestData.class_probabilities[forestData.final_predicted_class_id] || 0) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#030708] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono uppercase tracking-[0.2em] mb-1">
              <Trees className="w-4 h-4" />
              <span>RandomForestClassifier • 100 ta Haqiqiy Daraxtlar Ansambli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Ovoz Beruvchi Daraxtlar O'rmoni
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-light">
              Tanlangan jonzot: <strong className="text-cyan-300 font-semibold">{activeName}</strong>. 
              100 ta mustaqil scikit-learn daraxtining kollektiv konsensus ovozi tahlili.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Speed toggle */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-full p-0.5 text-xs font-mono">
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    playbackSpeed === spd ? "bg-amber-400 text-black font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={handleStartVoting}
              disabled={isVoting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isVoting ? "Ovoz berilmoqda..." : "Ovoz berishni boshlash"}</span>
            </button>

            <button
              onClick={() => {
                gameAudio.playClick();
                setVotedCount(forestData.total_trees);
              }}
              className="px-4 py-2.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10 hover:bg-white/[0.08] hover:text-white text-xs font-mono font-bold transition-all"
            >
              JAMI (100)
            </button>
          </div>
        </div>

        {/* Global Consensus Banner */}
        <div className="p-6 rounded-2xl cinematic-card border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Animal Profile & Verdict */}
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={activeName} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md shrink-0" 
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl shrink-0 font-bold"
                  style={{ backgroundColor: finalWinner?.color + "22", borderColor: finalWinner?.color || "#f59e0b" }}
                >
                  {finalWinner?.name_uz.charAt(0) || "🐾"}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/40">
                    {votedCount} / {forestData.total_trees} ta daraxt ovozi
                  </span>
                  <span 
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: (finalWinner?.color || "#f59e0b") + "33",
                      color: finalWinner?.color || "#f59e0b",
                      border: `1px solid ${finalWinner?.color || "#f59e0b"}55`,
                    }}
                  >
                    G'olib: {forestData.final_predicted_class_uz} ({forestData.final_predicted_class_en})
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Konsensus: <span className="text-cyan-300">{activeName}</span> — {forestData.final_predicted_class_uz}
                </h3>
                <p className="text-xs text-slate-300 font-light mt-0.5 max-w-2xl leading-relaxed">
                  {forestData.explanation_uz}
                </p>
              </div>
            </div>

            {/* Right: Confidence Gauge & Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-right min-w-[140px]">
                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-end gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Model Ehtimolligi</span>
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                  {winnerProbability}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">rf.predict_proba</div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-right min-w-[140px]">
                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Test Aniqligi</span>
                </div>
                <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">
                  {forestData.forest_stats?.forest_accuracy || 95.2}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Held-out test set</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] overflow-x-auto no-scrollbar gap-2">
          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab("arena");
            }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "arena"
                ? "border-amber-400 text-amber-300 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>1. Daraxtlar Maydoni ({forestData.total_trees} ta)</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab("panorama");
            }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "panorama"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>2. Parallel Daraxtlar Karuseli (5 ta Mini-Daraxt)</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab("importance");
            }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "importance"
                ? "border-emerald-400 text-emerald-300 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3. Alomatlar Muhimligi (MDI)</span>
          </button>

          <button
            onClick={() => {
              gameAudio.playClick();
              setActiveTab("theory");
            }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "theory"
                ? "border-purple-400 text-purple-300 bg-purple-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Bagging & Dispersiya Laboratoriyasi</span>
          </button>
        </div>

        {/* TAB 1: 100 TREES ARENA & LIVE VOTING */}
        {activeTab === "arena" && (
          <div className="space-y-6">
            {/* Live Voting Bar Chart */}
            <div className="p-6 rounded-2xl cinematic-card">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4 pb-3 border-b border-white/[0.08] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Jonli Ovozlar Taqsimoti (Live Vote Distribution)</span>
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  {votedCount} / {forestData.total_trees} ta ovoz hisoblandi
                </span>
              </h2>

              <div className="space-y-3.5">
                {forestData.vote_distribution.map((item) => {
                  const currentLiveVotes = liveClassCounts[item.class_id] || 0;
                  const livePct = votedCount > 0 ? ((currentLiveVotes / votedCount) * 100).toFixed(1) : "0.0";
                  const isWinner = item.class_id === forestData.final_predicted_class_id;

                  return (
                    <div key={item.class_id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.class_name_uz}</span>
                          <span className="text-slate-500 font-mono text-[10px]">({item.class_name_en})</span>
                          {isWinner && (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase font-mono border border-amber-500/40">
                              Konsensus G'olibi
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs">
                          <strong className="text-white">{currentLiveVotes}</strong>{" "}
                          <span className="text-slate-400">({livePct}%)</span>
                          <span className="text-slate-600 ml-2">| Ehtimollik: {item.model_probability}%</span>
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${livePct}%`,
                            backgroundColor: item.color,
                            boxShadow: isWinner ? `0 0 10px ${item.color}` : "none",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 100 Trees Interactive Grid Section */}
            <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
              {/* Filter & Search Bar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Trees className="w-5 h-5 text-amber-400" />
                    <span>100 ta Haqiqiy scikit-learn Daraxtlari Maydoni</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Har bir katakcha haqiqiy <code className="text-cyan-400 font-mono">rf.estimators_</code> daraxti. 
                    Istalgan daraxtni bosib uning to'liq SVG shoxlarini ko'ring.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFilterClassId("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      filterClassId === "all"
                        ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        : "bg-white/[0.05] text-slate-300 hover:text-white"
                    }`}
                  >
                    Barchasi (100)
                  </button>

                  {forestData.vote_distribution.filter((v) => v.votes > 0).map((v) => (
                    <button
                      key={v.class_id}
                      onClick={() => setFilterClassId(v.class_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        filterClassId === v.class_id
                          ? "text-black shadow-md font-extrabold"
                          : "bg-white/[0.05] text-slate-300 hover:text-white border border-white/10"
                      }`}
                      style={{
                        backgroundColor: filterClassId === v.class_id ? v.color : undefined,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                      <span>{v.class_name_uz} ({v.votes})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-toolbar: Search & Sort */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Daraxt ID yoki sinf bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-mono self-end">
                  <span className="text-slate-500">Saralash:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-400 text-xs font-mono"
                  >
                    <option value="id">Daraxt ID (0..99)</option>
                    <option value="depth">Maksimal chuqurlik</option>
                    <option value="leaves">Barglar soni</option>
                  </select>
                </div>
              </div>

              {/* 100 Trees Interactive Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2.5 max-h-[460px] overflow-y-auto no-scrollbar p-1">
                {filteredTrees.map((tree) => {
                  const hasVoted = tree.tree_id < votedCount;
                  const isSelected = selectedTreeId === tree.tree_id;

                  return (
                    <button
                      key={tree.tree_id}
                      onClick={() => handleInspectTree(tree.tree_id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[96px] group relative ${
                        isSelected
                          ? "ring-2 ring-cyan-400 bg-cyan-950/80 scale-105 z-20 shadow-[0_0_20px_#22d3ee]"
                          : hasVoted
                          ? "bg-white/[0.03] border-white/[0.08] hover:border-cyan-500/50 hover:bg-white/[0.06] hover:scale-105"
                          : "bg-black/40 border-white/[0.03] opacity-25"
                      }`}
                    >
                      {/* Tree ID Badge */}
                      <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400">
                        <span className="font-bold">#{tree.tree_id}</span>
                        <span className="text-[9px] text-slate-500">d={tree.tree_depth}</span>
                      </div>

                      {/* Pine Icon & Root Split */}
                      <div className="my-1 flex flex-col items-center">
                        <span className="text-lg group-hover:scale-110 transition-transform">🌲</span>
                        {tree.root_feature_uz && (
                          <span className="text-[9px] font-mono text-cyan-400/80 line-clamp-1 max-w-[70px]">
                            {tree.root_feature_uz}
                          </span>
                        )}
                      </div>

                      {/* Voted Class Pill */}
                      {hasVoted ? (
                        <div 
                          className="w-full text-[9px] font-mono font-bold truncate rounded py-0.5 px-1"
                          style={{
                            backgroundColor: tree.color + "25",
                            color: tree.color,
                            border: `1px solid ${tree.color}44`,
                          }}
                        >
                          {tree.predicted_class_uz}
                        </div>
                      ) : (
                        <div className="w-full text-[9px] font-mono text-slate-600 truncate py-0.5">
                          Kutilmoqda
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARALLEL 5-TREE PANORAMA (MINI-TREES) */}
        {activeTab === "panorama" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl cinematic-card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-6">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-cyan-400" />
                    <span>5 ta Haqiqiy scikit-learn Daraxtlarining Bir Vaqtdagi Traektoriyasi</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Tasodifiy o'rmonning kuchi: Har bir daraxt alohida bootstrap tanlanmasi va tasodifiy alomatlar (<code className="text-cyan-400 font-mono">max_features=sqrt(16)=4</code>) asosida qurilgan. 
                    Shuning uchun ular har xil alomatlardan boshlanadi, ammo bir xil mustahkam konsensusga keladi!
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Yorug' yo'l = Jonzot bosib o'tgan shoxlar</span>
                </div>
              </div>

              {/* Panorama Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {forestData.detailed_traces.map((dt) => {
                  const voteMeta = forestData.all_tree_votes[dt.tree_id];
                  if (!dt.structure || !dt.trace) return null;

                  return (
                    <MiniTreeCard
                      key={dt.tree_id}
                      treeId={dt.tree_id}
                      structure={dt.structure}
                      trace={dt.trace}
                      votedClassId={voteMeta?.predicted_class_id || 1}
                      votedClassUz={voteMeta?.predicted_class_uz || "Noma'lum"}
                      onInspect={handleInspectTree}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FEATURE IMPORTANCES (MDI) */}
        {activeTab === "importance" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
              <div className="pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Mean Decrease in Impurity (MDI) • scikit-learn rf.feature_importances_</span>
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                  100 ta Daraxt Bo'yicha Biologik Alomatlar Muhimligi Reytingi
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Random Forest alomatlar muhimligini har bir daraxtdagi Gini iflosligi (Impurity) qanchalik kamayganini butun 100 ta daraxt bo'ylab jamlash orqali hisoblaydi. 
                  Bu Zoo ma'lumotlar to'plamida qaysi xususiyat hayvonlarni ajratishda eng hal qiluvchi rol o'ynashini ilmiy jihatdan ko'rsatadi.
                </p>
              </div>

              {/* Feature Importance Bars */}
              <div className="space-y-3">
                {forestData.feature_importances?.map((item, idx) => {
                  const userVal = activeFeatures[item.feature as keyof typeof activeFeatures];
                  const isTop3 = idx < 3;

                  return (
                    <div 
                      key={item.feature}
                      className="p-3 rounded-xl bg-black/40 border border-white/[0.06] hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                            isTop3 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/[0.05] text-slate-500"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-white">{item.name_uz}</span>
                          <span className="text-slate-500 font-mono text-[11px]">({item.name_en})</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                            {activeName} qiymati: <strong>{userVal}</strong>
                          </span>
                        </div>

                        <div className="font-mono text-xs text-right">
                          <span className="text-white font-bold">{item.percentage}%</span>
                          <span className="text-slate-500 text-[10px] ml-1.5">(koeff: {item.importance})</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage * 2.5}%`,
                            maxWidth: "100%",
                            backgroundColor: isTop3 ? "#10b981" : "#06b6d4",
                            boxShadow: isTop3 ? "0 0 10px #10b981" : "none",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BAGGING & VARIANCE REDUCTION LABORATORY */}
        {activeTab === "theory" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl cinematic-card">
              <div className="pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Ensemble Learning & Variance Reduction Nazariyasi</span>
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                  Nega 100 ta Daraxt Yagona Daraxtdan Ustun? (Bagging Mexanizmi)
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Yakka qarorlar daraxti yuqori dispersiyaga (high variance) ega va ma'lumotlardagi kichik shovqinlarga haddan tashqari moslashishi (overfitting) mumkin. 
                  Random Forest bu muammoni <strong>Bootstrap Aggregation (Bagging)</strong> va <strong>Tasodifiy alomatlar tanlash</strong> orqali bartaraf etadi.
                </p>
              </div>

              {/* Head-to-Head Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Single Decision Tree */}
                <div className="p-5 rounded-2xl bg-black/50 border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <span className="text-xs font-mono text-red-400 uppercase font-bold tracking-wider">
                      Yakka Qarorlar Daraxti
                    </span>
                    <span className="text-xs font-mono text-slate-400">DecisionTreeClassifier</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Yuqori dispersiya (High Variance):</strong> Yangi yoki noodatiy hayvon kelsa, bitta noto'g'ri shox butun bashoratni buzishi mumkin.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Deterministik ildiz:</strong> Har doim bir xil alomatdan (masalan, <code className="text-cyan-300 font-mono">milk &le; 0.5</code>) boshlanadi.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong>Test aniqligi:</strong> {forestData.forest_stats?.single_tree_accuracy || 90.5}%</span>
                    </li>
                  </ul>
                </div>

                {/* Random Forest Ensemble */}
                <div className="p-5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <span className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">
                      Tasodifiy O'rmon (100 Daraxt)
                    </span>
                    <span className="text-xs font-mono text-slate-400">RandomForestClassifier</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Past dispersiya (Low Variance):</strong> 100 ta mustaqil daraxtning xatolari o'zaro bir-birini so'ndiradi (majority voting).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Dekorrelatsiya:</strong> Har bir shoxda faqat tasodifiy 4 ta alomat ko'rib chiqiladi (<code className="text-cyan-300 font-mono">max_features='sqrt'</code>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Test aniqligi:</strong> {forestData.forest_stats?.forest_accuracy || 95.2}%</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mathematical Formula Callout */}
              <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30">
                <h4 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Dispersiyani Kamaytirishning Matematik Formulasi:</span>
                </h4>
                <div className="p-4 rounded-xl bg-black/60 font-mono text-cyan-300 text-sm text-center border border-white/[0.06] my-2">
                  Var(Ansambl) = &rho;&sigma;&sup2; + ((1 - &rho;) / B) &times; &sigma;&sup2;
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Bu yerda <code className="text-purple-300 font-mono">B = 100</code> (daraxtlar soni), <code className="text-purple-300 font-mono">&sigma;&sup2;</code> (yakka daraxt dispersiyasi), va <code className="text-purple-300 font-mono">&rho;</code> (daraxtlar orasidagi korrelyatsiya). 
                  Daraxtlar soni oshganda ikkinchi had deyarli nolga aylanadi. Tasodifiy alomatlar esa korrelyatsiya <code className="text-purple-300 font-mono">&rho;</code> ni pasaytiradi!
                </p>
              </div>

              {/* Forest Depth Distribution */}
              {forestData.forest_stats?.depth_distribution && (
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider mb-3">
                    100 ta Daraxtning Chuqurlik Taqsimoti (Tree Depth Spread):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {Object.entries(forestData.forest_stats.depth_distribution).map(([depth, count]) => (
                      <div key={depth} className="p-3 rounded-xl bg-black/40 border border-white/10 text-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Chuqurlik {depth}:</span>
                        <span className="text-base font-bold text-amber-300 font-mono">{count} ta daraxt</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Tree Deep Inspector Modal */}
        {selectedTreeId !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#071116] border border-cyan-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.2)]">
              {/* Modal Header */}
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-sm font-bold font-mono">
                    #{selectedTreeId}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Daraxt #{selectedTreeId} ning Chuqur Tuzilishi va Bashorati</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      scikit-learn RandomForestClassifier.estimators_[{selectedTreeId}]
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    gameAudio.playClick();
                    setSelectedTreeId(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
                {loadingTreeDetails ? (
                  <div className="py-16 text-center text-xs text-cyan-300 font-mono flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    <span>Daraxt #{selectedTreeId} tuzilishi va qaror yo'li yuklanmoqda...</span>
                  </div>
                ) : selectedTreeDetails && selectedTreeDetails.structure ? (
                  <>
                    {/* Top Tree Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase block">Tugunlar soni:</span>
                        <span className="font-bold text-white text-sm">{selectedTreeDetails.structure.node_count} ta</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase block">Maksimal chuqurlik:</span>
                        <span className="font-bold text-white text-sm">{selectedTreeDetails.structure.max_depth} bosqich</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase block">Barglar soni:</span>
                        <span className="font-bold text-white text-sm">{selectedTreeDetails.structure.n_leaves} ta leaf</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                        <span className="text-slate-500 text-[10px] uppercase block">Ushbu daraxt ovozi:</span>
                        <span 
                          className="font-bold text-sm"
                          style={{ color: CLASSES_MAP[selectedTreeDetails.trace?.final_predicted_class_id]?.color || "#22d3ee" }}
                        >
                          {selectedTreeDetails.trace?.final_predicted_class_uz || "Noma'lum"}
                        </span>
                      </div>
                    </div>

                    {/* Step-by-step Interactive Trace for this Tree */}
                    {selectedTreeDetails.trace && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                          <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase">
                            Qaror Traektoriyasi ({selectedTreeDetails.trace.total_steps} bosqich):
                          </h4>

                          {/* Stepper Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                setInspectStepIndex((p) => Math.max(0, p - 1));
                              }}
                              disabled={inspectStepIndex === 0}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono disabled:opacity-30 hover:bg-white/[0.1]"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-xs font-mono text-slate-300">
                              {inspectStepIndex + 1} / {selectedTreeDetails.trace.total_steps}
                            </span>

                            <button
                              onClick={() => {
                                gameAudio.playClick();
                                setInspectStepIndex((p) => Math.min(selectedTreeDetails.trace.total_steps - 1, p + 1));
                              }}
                              disabled={inspectStepIndex === selectedTreeDetails.trace.total_steps - 1}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono disabled:opacity-30 hover:bg-white/[0.1]"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setIsAutoPlayingModal(!isAutoPlayingModal)}
                              className="px-3 py-1 rounded-lg bg-amber-400 text-black text-xs font-mono font-bold hover:bg-amber-300 transition-all ml-1"
                            >
                              {isAutoPlayingModal ? "Pauza" : "Avto-ijro"}
                            </button>
                          </div>
                        </div>

                        {/* Current Active Step Card */}
                        {(() => {
                          const currentStep: TraceStep | undefined = selectedTreeDetails.trace.steps[inspectStepIndex];
                          if (!currentStep) return null;

                          return (
                            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                                  Bosqich #{currentStep.step_number}: {currentStep.node_type === "root" ? "Ildiz tugun" : currentStep.is_leaf ? "Yakuniy barg" : "Qaror tuguni"}
                                </span>
                                <span className="text-slate-400">Gini: {currentStep.impurity} | Namunalar: {currentStep.samples} ta</span>
                              </div>

                              <p className="text-sm text-white font-medium">
                                {currentStep.explanation_uz}
                              </p>

                              {currentStep.representative_animals && currentStep.representative_animals.length > 0 && (
                                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <span>Bu tugundagi hayvonlar:</span>
                                  {currentStep.representative_animals.map((a: any, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 font-mono">
                                      {a.animal_name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Full Trajectory Timeline */}
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar pt-2">
                          {selectedTreeDetails.trace.steps.map((st: TraceStep, idx: number) => {
                            const isCurrent = idx === inspectStepIndex;
                            return (
                              <button
                                key={st.step_number}
                                onClick={() => {
                                  gameAudio.playClick();
                                  setInspectStepIndex(idx);
                                }}
                                className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                                  isCurrent
                                    ? "bg-cyan-950/60 border border-cyan-400 text-white font-semibold shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                    : "bg-black/40 border border-white/[0.05] text-slate-400 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05]">
                                    #{st.step_number}
                                  </span>
                                  <span className="truncate max-w-md">{st.explanation_uz}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 shrink-0">
                                  {st.is_leaf ? "Barg" : "Shoxlanish"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/[0.08] flex items-center justify-end shrink-0 bg-black/40">
                <button
                  onClick={() => setSelectedTreeId(null)}
                  className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-mono transition-all"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
