import modelData from "../constants/modelData.json";
import { 
  AnimalFeatures, 
  DatasetAnimal, 
  ForestVotesResponse, 
  KNNResponse, 
  ModelMetricsResponse, 
  PredictionResponse, 
  TreeStructure, 
  TreeTraceResponse,
  TraceStep,
  FeatureMetadata
} from "../types";
import { CLASSES_MAP } from "../constants/presets";

const FEATURE_NAMES = [
  "hair", "feathers", "eggs", "milk", "airborne", "aquatic", "predator",
  "toothed", "backbone", "breathes", "venomous", "fins", "legs", "tail",
  "domestic", "catsize"
];

const FEATURE_DESCRIPTIONS_MAP: Record<string, { name_uz: string; description_uz: string; allowed: number[] }> = {
  hair: { name_uz: "Jun/tuklar", description_uz: "Tananing jun yoki tuklar bilan qoplanganligi", allowed: [0, 1] },
  feathers: { name_uz: "Patlar", description_uz: "Qushlarga xos patlarning mavjudligi", allowed: [0, 1] },
  eggs: { name_uz: "Tuxum qo'yish", description_uz: "Nasl qoldirish uchun tuxum qo'yish xususiyati", allowed: [0, 1] },
  milk: { name_uz: "Sut emizish", description_uz: "Bolalarini ona suti bilan boqish xususiyati", allowed: [0, 1] },
  airborne: { name_uz: "Havoda uchish", description_uz: "Qanotlar orqali havoda ucha olish qobiliyati", allowed: [0, 1] },
  aquatic: { name_uz: "Suvda yashash", description_uz: "Suv muhitida yashashga moslashganligi", allowed: [0, 1] },
  predator: { name_uz: "Yirtqichlik", description_uz: "Boshqa jonivorlarni ovlash va go'sht bilan oziqlanish", allowed: [0, 1] },
  toothed: { name_uz: "Tishlar mavjudligi", description_uz: "Jag'da haqiqiy tishlarning mavjudligi", allowed: [0, 1] },
  backbone: { name_uz: "Umurtqa pog'onasi", description_uz: "Ichki skelet — umurtqa suyagining mavjudligi", allowed: [0, 1] },
  breathes: { name_uz: "O'pka bilan nafas olish", description_uz: "Atmosfera havosidan o'pka orqali nafas olish", allowed: [0, 1] },
  venomous: { name_uz: "Zaharlilik", description_uz: "Zaharli bezlar yoki zaharli nishga egaligi", allowed: [0, 1] },
  fins: { name_uz: "Suzgich qanotlar", description_uz: "Suvda harakatlanish uchun suzgichlar (finlar)", allowed: [0, 1] },
  legs: { name_uz: "Oyoqlar soni", description_uz: "Harakatlanuvchi oyoqlar soni (0, 2, 4, 5, 6, 8)", allowed: [0, 2, 4, 5, 6, 8] },
  tail: { name_uz: "Dum mavjudligi", description_uz: "Orqa umurtqa davomi bo'lgan dumning mavjudligi", allowed: [0, 1] },
  domestic: { name_uz: "Xonaki hayvonligi", description_uz: "Inson tomonidan xonakilashtirilganligi", allowed: [0, 1] },
  catsize: { name_uz: "Mushukdek yoki kattaroq", description_uz: "O'lchami o'rtacha uy mushugiga teng yoki undan yirik", allowed: [0, 1] },
};

const FEATURE_DESCRIPTIONS_LIST: FeatureMetadata[] = FEATURE_NAMES.map((f) => ({
  name: f,
  name_uz: FEATURE_DESCRIPTIONS_MAP[f]?.name_uz || f,
  description_uz: FEATURE_DESCRIPTIONS_MAP[f]?.description_uz || "",
  type: f === "legs" ? "discrete" : "binary",
  allowed: FEATURE_DESCRIPTIONS_MAP[f]?.allowed || [0, 1],
}));

// Mathematical 16D Euclidean distance and PCA projection
export function traceTree(structure: TreeStructure, features: AnimalFeatures): TreeTraceResponse {
  const steps: TraceStep[] = [];
  const pathNodeIds: number[] = [];
  const nodes = structure.nodes;
  const nodeMap = new Map<number, any>();
  nodes.forEach((n: any) => nodeMap.set(n.id, n));

  let currId = 0;
  let stepNum = 1;

  while (true) {
    const node = nodeMap.get(currId);
    if (!node) break;

    pathNodeIds.push(node.id);
    const isLeaf = node.is_leaf;
    const isRoot = currId === 0;
    const nodeType = isRoot ? "root" : isLeaf ? "leaf" : "decision";

    if (isLeaf) {
      steps.push({
        step_number: stepNum,
        node_id: node.id,
        node_type: "leaf",
        is_leaf: true,
        samples: node.samples,
        impurity: node.impurity,
        class_distribution: node.class_distribution,
        predicted_class_id: node.predicted_class_id,
        predicted_class_uz: node.predicted_class_uz,
        predicted_class_en: node.predicted_class_en,
        representative_animals: node.representative_animals,
        explanation_uz: `Yakuniy barg tuguni: Bashorat — '${node.predicted_class_uz}' (${node.predicted_class_en}). Gini iflosligi: ${node.impurity}.`,
      });
      break;
    }

    const featName = node.feature_name as keyof AnimalFeatures;
    const userVal = features[featName] !== undefined ? features[featName] : 0;
    const threshold = node.threshold;
    const conditionMet = userVal <= threshold;
    const branchDir = conditionMet ? "left" : "right";
    const nextId = conditionMet ? node.children_left : node.children_right;

    steps.push({
      step_number: stepNum,
      node_id: node.id,
      node_type: nodeType,
      is_leaf: false,
      feature_index: node.feature_index,
      feature_name: node.feature_name,
      feature_name_uz: node.feature_name_uz,
      threshold: threshold,
      user_value: userVal,
      condition_met: conditionMet,
      branch_direction: branchDir,
      next_node_id: nextId,
      samples: node.samples,
      impurity: node.impurity,
      class_distribution: node.class_distribution,
      predicted_class_id: node.predicted_class_id,
      predicted_class_uz: node.predicted_class_uz,
      predicted_class_en: node.predicted_class_en,
      representative_animals: node.representative_animals,
      explanation_uz: `${stepNum}-qadam: '${node.feature_name_uz}' tekshirilmoqda (${node.feature_name} <= ${threshold}). Kiritilgan qiymat: ${userVal}. Natija: ${conditionMet ? "shart bajarildi (chap tarmoqqa o'tildi)" : "shart bajarilmadi (o'ng tarmoqqa o'tildi)"}.`,
    });

    currId = nextId;
    stepNum++;
  }

  const finalLeaf = steps[steps.length - 1];
  return {
    total_steps: steps.length,
    final_predicted_class_id: finalLeaf.predicted_class_id,
    final_predicted_class_uz: finalLeaf.predicted_class_uz,
    final_predicted_class_en: finalLeaf.predicted_class_en,
    steps,
    path_node_ids: pathNodeIds,
  };
}

export const clientMLEngine = {
  getHealth(): { status: string; models_trained: boolean } {
    return { status: "ok", models_trained: true };
  },

  getDatasetSummary() {
    return {
      name: "UCI Zoo Dataset",
      source: "UCI Machine Learning Repository (Forsyth, 1990)",
      url: "https://archive.ics.uci.edu/dataset/111/zoo",
      total_samples: 101,
      features_count: 16,
      classes_count: 7,
      features: FEATURE_DESCRIPTIONS_LIST,
      classes: Object.values(CLASSES_MAP),
      dataset_limitations_uz: "Ushbu ma'lumotlar to'plami 101 ta hayvon bilan cheklangan. Barcha haqiqiy biologik xilma-xillikni to'liq qamrab olmasligi mumkin.",
    };
  },

  getDatasetAnimals(): DatasetAnimal[] {
    return modelData.animals as DatasetAnimal[];
  },

  getModelMetrics(): ModelMetricsResponse {
    return modelData.metrics as unknown as ModelMetricsResponse;
  },

  getDecisionTreeStructure(): TreeStructure {
    return modelData.decision_tree_structure as unknown as TreeStructure;
  },

  traceDecisionTree(features: AnimalFeatures): TreeTraceResponse {
    return traceTree(modelData.decision_tree_structure as unknown as TreeStructure, features);
  },

  queryKNN(features: AnimalFeatures, k: number = 5): KNNResponse {
    const knnData = modelData.knn;
    const trainingPoints = knnData.training_points;
    const scalerMean = knnData.scaler_mean;
    const scalerScale = knnData.scaler_scale;

    // 1. Standardize query vector in 16D
    const queryScaled: number[] = [];
    FEATURE_NAMES.forEach((f, idx) => {
      const val = features[f as keyof AnimalFeatures] || 0;
      queryScaled.push((val - scalerMean[idx]) / (scalerScale[idx] || 1));
    });

    // 2. Compute 16D Euclidean distance to all 80 training samples
    const distances: Array<{ index: number; dist: number; point: any }> = [];
    trainingPoints.forEach((p: any, idx: number) => {
      let sumSq = 0;
      FEATURE_NAMES.forEach((f, fIdx) => {
        const pVal = p.features[f] || 0;
        const pScaled = (pVal - scalerMean[fIdx]) / (scalerScale[fIdx] || 1);
        const diff = queryScaled[fIdx] - pScaled;
        sumSq += diff * diff;
      });
      distances.push({ index: idx, dist: Math.sqrt(sumSq), point: p });
    });

    // Sort ascending
    distances.sort((a, b) => a.dist - b.dist);
    const topK = distances.slice(0, k);

    // Count class votes
    const voteCounts: Record<number, number> = {};
    topK.forEach((item) => {
      voteCounts[item.point.class_id] = (voteCounts[item.point.class_id] || 0) + 1;
    });

    let bestClass = 1;
    let maxVotes = -1;
    Object.entries(voteCounts).forEach(([cls, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        bestClass = parseInt(cls);
      }
    });

    // 3. Project query vector to 2D PCA space
    let pcaX = 0;
    let pcaY = 0;
    queryScaled.forEach((val, i) => {
      pcaX += val * knnData.pca_components[0][i];
      pcaY += val * knnData.pca_components[1][i];
    });

    const nearestNeighbors = topK.map((item, rank) => ({
      rank: rank + 1,
      train_index: item.point.id,
      animal_name: item.point.animal_name,
      class_id: item.point.class_id,
      class_name_uz: item.point.class_name_uz,
      class_name_en: item.point.class_name_en,
      color: item.point.color,
      distance_16d: round(item.dist, 4),
      pca_x: item.point.pca_x,
      pca_y: item.point.pca_y,
      features: item.point.features,
    }));

    const voteSummary = Object.keys(CLASSES_MAP).map((cStr) => {
      const cId = parseInt(cStr);
      const v = voteCounts[cId] || 0;
      return {
        class_id: cId,
        class_name_uz: CLASSES_MAP[cId].name_uz,
        class_name_en: CLASSES_MAP[cId].name_en,
        color: CLASSES_MAP[cId].color,
        votes: v,
        percentage: round((v / k) * 100, 1),
      };
    });

    const topNeighbor = nearestNeighbors[0];
    const explanation = `K = ${k} qiymatida standartlashtirilgan 16 o'lchamli fazoda (StandardScaler) eng yaqin ${k} ta o'quv namunasi aniqlandi. Eng yaqin namuna: '${topNeighbor.animal_name}' (${topNeighbor.class_name_uz}, masofa: ${topNeighbor.distance_16d}). Ko'pchilik ovozi: ${maxVotes}/${k} ta ovoz bilan '${CLASSES_MAP[bestClass].name_uz}' guruhi g'olib bo'ldi.`;

    const topKIndices = new Set(topK.map((item) => item.point.id));
    const allPlotPoints = trainingPoints.map((tp: any) => ({
      id: tp.id,
      animal_name: tp.animal_name,
      class_id: tp.class_id,
      class_name_uz: tp.class_name_uz,
      class_name_en: tp.class_name_en,
      color: tp.color,
      pca_x: tp.pca_x,
      pca_y: tp.pca_y,
      is_neighbor: topKIndices.has(tp.id),
      neighbor_rank: topKIndices.has(tp.id) ? topK.findIndex((x) => x.point.id === tp.id) + 1 : undefined,
      distance_16d: topKIndices.has(tp.id) ? topK.find((x) => x.point.id === tp.id)?.dist : undefined,
    }));

    const classProbs: Record<number, number> = {};
    Object.keys(CLASSES_MAP).forEach((c) => {
      classProbs[parseInt(c)] = (voteCounts[parseInt(c)] || 0) / k;
    });

    return {
      k,
      predicted_class_id: bestClass,
      predicted_class_uz: CLASSES_MAP[bestClass].name_uz,
      predicted_class_en: CLASSES_MAP[bestClass].name_en,
      class_probabilities: classProbs,
      query_point_pca: { x: round(pcaX, 3), y: round(pcaY, 3) },
      nearest_neighbors: nearestNeighbors,
      vote_distribution: voteSummary,
      training_points: allPlotPoints,
      explanation_uz: explanation,
      pca_variance_ratio: knnData.pca_variance_ratio,
      total_variance_explained: round(knnData.pca_variance_ratio.reduce((a, b) => a + b, 0) * 100, 1),
    };
  },

  queryRandomForestVotes(features: AnimalFeatures, detailedLimit: number = 5): ForestVotesResponse {
    const trees = modelData.random_forest_trees;
    const treeVotes: any[] = [];
    const classCounts: Record<number, number> = {};

    trees.forEach((t: any) => {
      const trace = traceTree(t.structure as any, features);
      const predClass = trace.final_predicted_class_id;
      classCounts[predClass] = (classCounts[predClass] || 0) + 1;

      const rootNode = t.structure.nodes[0];
      treeVotes.push({
        tree_id: t.tree_id,
        predicted_class_id: predClass,
        predicted_class_uz: CLASSES_MAP[predClass]?.name_uz || "Noma'lum",
        predicted_class_en: CLASSES_MAP[predClass]?.name_en || "Unknown",
        color: CLASSES_MAP[predClass]?.color || "#10b981",
        tree_depth: t.structure.max_depth,
        n_leaves: t.structure.n_leaves,
        root_feature: rootNode?.feature_name,
        root_feature_uz: rootNode?.feature_name_uz,
        root_threshold: rootNode?.threshold,
      });
    });

    const totalTrees = trees.length;
    let winningClass = 1;
    let maxVotes = -1;
    Object.entries(classCounts).forEach(([cls, cnt]) => {
      if (cnt > maxVotes) {
        maxVotes = cnt;
        winningClass = parseInt(cls);
      }
    });

    const voteDist = Object.keys(CLASSES_MAP).map((cStr) => {
      const cId = parseInt(cStr);
      const v = classCounts[cId] || 0;
      return {
        class_id: cId,
        class_name_uz: CLASSES_MAP[cId].name_uz,
        class_name_en: CLASSES_MAP[cId].name_en,
        color: CLASSES_MAP[cId].color,
        votes: v,
        percentage: round((v / totalTrees) * 100, 1),
        model_probability: round((v / totalTrees) * 100, 1),
      };
    });

    const detailedTraces = trees.slice(0, detailedLimit).map((t: any) => ({
      tree_id: t.tree_id,
      structure: t.structure as any,
      trace: traceTree(t.structure as any, features),
      tree_depth: t.structure.max_depth,
      n_leaves: t.structure.n_leaves,
    }));

    const classProbs: Record<number, number> = {};
    Object.keys(CLASSES_MAP).forEach((c) => {
      classProbs[parseInt(c)] = (classCounts[parseInt(c)] || 0) / totalTrees;
    });

    const winnerSummary = voteDist.find((v) => v.class_id === winningClass);
    const explanation = `Tasodifiy o'rmondagi barcha ${totalTrees} ta haqiqiy qarorlar daraxti mustaqil baholandi. G'olib sinf: ${winnerSummary?.votes}/${totalTrees} ta ovoz (${winnerSummary?.percentage}%) bilan '${CLASSES_MAP[winningClass].name_uz}' guruhi aniqlandi. Modelning yakuniy ishonch ehtimolligi: ${(classProbs[winningClass] * 100).toFixed(1)}%.`;

    // Feature importances from metrics
    const rfMetrics = (modelData.metrics as any).random_forest;
    const featImp = rfMetrics?.feature_importances || {};
    const featImpList = Object.entries(featImp).map(([f, imp]: [string, any]) => ({
      feature: f,
      name_uz: FEATURE_DESCRIPTIONS_MAP[f]?.name_uz || f,
      name_en: f,
      importance: round(imp, 4),
      percentage: round(imp * 100, 1),
    }));
    featImpList.sort((a, b) => b.importance - a.importance);

    const depths = trees.map((t: any) => t.structure.max_depth);
    const leaves = trees.map((t: any) => t.structure.n_leaves);
    const depthDist: Record<number, number> = {};
    depths.forEach((d: number) => {
      depthDist[d] = (depthDist[d] || 0) + 1;
    });

    const forestStats = {
      n_estimators: totalTrees,
      mean_depth: round(depths.reduce((a: number, b: number) => a + b, 0) / totalTrees, 2),
      min_depth: Math.min(...depths),
      max_depth: Math.max(...depths),
      mean_leaves: round(leaves.reduce((a: number, b: number) => a + b, 0) / totalTrees, 1),
      min_leaves: Math.min(...leaves),
      max_leaves: Math.max(...leaves),
      depth_distribution: depthDist,
      max_features: "sqrt (4 alomat)",
      bootstrap: true,
      single_tree_accuracy: round((modelData.metrics as any).decision_tree.test_accuracy * 100, 1),
      forest_accuracy: round(rfMetrics.test_accuracy * 100, 1),
    };

    return {
      total_trees: totalTrees,
      detailed_trees_count: detailedLimit,
      final_predicted_class_id: winningClass,
      final_predicted_class_uz: CLASSES_MAP[winningClass].name_uz,
      final_predicted_class_en: CLASSES_MAP[winningClass].name_en,
      class_probabilities: classProbs,
      most_common_tree_class_id: winningClass,
      vote_distribution: voteDist,
      all_tree_votes: treeVotes,
      detailed_traces: detailedTraces,
      feature_importances: featImpList,
      forest_stats: forestStats,
      explanation_uz: explanation,
    };
  },

  getSingleForestTree(treeId: number, features?: AnimalFeatures) {
    const tree = modelData.random_forest_trees[treeId];
    if (!tree) throw new Error(`Daraxt #${treeId} mavjud emas`);
    const trace = features ? traceTree(tree.structure as any, features) : null;
    return {
      tree_id: treeId,
      structure: tree.structure as any,
      trace,
    };
  },

  predictAnimal(animalName: string, features: AnimalFeatures, photoData?: string | null): PredictionResponse {
    const dtTrace = this.traceDecisionTree(features);
    const knnRes = this.queryKNN(features, 5);
    const rfRes = this.queryRandomForestVotes(features, 5);

    const dtClass = dtTrace.final_predicted_class_id;
    const knnClass = knnRes.predicted_class_id;
    const rfClass = rfRes.final_predicted_class_id;

    const allAgree = dtClass === knnClass && knnClass === rfClass;
    const consensusWinner = rfClass;
    const agreeCount = [dtClass, knnClass, rfClass].filter((c) => c === consensusWinner).length;

    return {
      animal_name: animalName,
      features,
      photo_data: photoData || null,
      predictions: {
        decision_tree: {
          class_id: dtClass,
          class_name_uz: CLASSES_MAP[dtClass].name_uz,
          class_name_en: CLASSES_MAP[dtClass].name_en,
          color: CLASSES_MAP[dtClass].color,
          probabilities: { [dtClass]: 1.0 },
          confidence: 1.0,
        },
        knn: {
          class_id: knnClass,
          class_name_uz: CLASSES_MAP[knnClass].name_uz,
          class_name_en: CLASSES_MAP[knnClass].name_en,
          color: CLASSES_MAP[knnClass].color,
          probabilities: knnRes.class_probabilities,
          confidence: knnRes.class_probabilities[knnClass] || 0.8,
        },
        random_forest: {
          class_id: rfClass,
          class_name_uz: CLASSES_MAP[rfClass].name_uz,
          class_name_en: CLASSES_MAP[rfClass].name_en,
          color: CLASSES_MAP[rfClass].color,
          probabilities: rfRes.class_probabilities,
          confidence: rfRes.class_probabilities[rfClass] || 0.95,
        },
      },
      consensus: {
        all_agree: allAgree,
        majority_class_id: consensusWinner,
        majority_class_uz: CLASSES_MAP[consensusWinner].name_uz,
        majority_class_en: CLASSES_MAP[consensusWinner].name_en,
        agreement_ratio: `${agreeCount}/3`,
        summary_uz: allAgree
          ? `Barcha uchala model yakdillik bilan '${CLASSES_MAP[consensusWinner].name_uz}' (${CLASSES_MAP[consensusWinner].name_en}) deb xulosa qildi.`
          : `Modellar konsensusi: '${CLASSES_MAP[consensusWinner].name_uz}' guruhi aniqlandi.`,
      },
    };
  },
};

function round(val: number, decimals: number): number {
  const p = Math.pow(10, decimals);
  return Math.round(val * p) / p;
}
