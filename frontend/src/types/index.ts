export interface AnimalFeatures {
  hair: number;
  feathers: number;
  eggs: number;
  milk: number;
  airborne: number;
  aquatic: number;
  predator: number;
  toothed: number;
  backbone: number;
  breathes: number;
  venomous: number;
  fins: number;
  legs: number;
  tail: number;
  domestic: number;
  catsize: number;
}

export interface ClassInfo {
  id: number;
  name_en: string;
  name_uz: string;
  scientific_group: string;
  description_uz: string;
  color: string;
  samples_count?: number;
}

export interface FeatureMetadata {
  name: string;
  name_uz: string;
  description_uz: string;
  type: string;
  allowed: number[];
}

export interface ModelPrediction {
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  probabilities: Record<number, number>;
  confidence: number;
}

export interface PredictionConsensus {
  all_agree: boolean;
  majority_class_id: number;
  majority_class_uz: string;
  majority_class_en: string;
  agreement_ratio: string;
  summary_uz: string;
}

export interface PredictionResponse {
  animal_name: string;
  features: AnimalFeatures;
  photo_data?: string | null;
  predictions: {
    decision_tree: ModelPrediction;
    knn: ModelPrediction;
    random_forest: ModelPrediction;
  };
  consensus: PredictionConsensus;
}

export interface TreeNode {
  id: number;
  is_leaf: boolean;
  feature_index: number | null;
  feature_name: string | null;
  feature_name_uz: string | null;
  threshold: number | null;
  impurity: number;
  impurity_type: string;
  samples: number;
  class_distribution: Record<number, number>;
  predicted_class_id: number;
  predicted_class_uz: string;
  predicted_class_en: string;
  children_left: number | null;
  children_right: number | null;
  representative_animals?: Array<{
    animal_name: string;
    class_id: number;
    class_name_uz: string;
    class_name_en: string;
  }>;
}

export interface TreeStructure {
  node_count: number;
  max_depth: number;
  n_leaves: number;
  criterion: string;
  nodes: TreeNode[];
}

export interface TraceStep {
  step_number: number;
  node_id: number;
  node_type: "root" | "decision" | "leaf";
  is_leaf: boolean;
  feature_index?: number;
  feature_name?: string;
  feature_name_uz?: string;
  threshold?: number;
  user_value?: number;
  condition_met?: boolean;
  branch_direction?: "left" | "right";
  next_node_id?: number;
  samples: number;
  impurity: number;
  class_distribution: Record<number, number>;
  probabilities?: Record<number, number>;
  predicted_class_id: number;
  predicted_class_uz: string;
  predicted_class_en: string;
  representative_animals?: Array<{
    animal_name: string;
    class_id: number;
    class_name_uz: string;
  }>;
  explanation_uz: string;
}

export interface TreeTraceResponse {
  total_steps: number;
  final_predicted_class_id: number;
  final_predicted_class_uz: string;
  final_predicted_class_en: string;
  steps: TraceStep[];
  path_node_ids: number[];
}

export interface KNNNeighbor {
  rank: number;
  train_index: number;
  animal_name: string;
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  distance_16d: number;
  pca_x: number;
  pca_y: number;
  features: Record<string, number>;
}

export interface KNNPoint {
  id: number;
  animal_name: string;
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  pca_x: number;
  pca_y: number;
  is_neighbor?: boolean;
  neighbor_rank?: number | null;
  distance_16d?: number | null;
}

export interface KNNVote {
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  votes: number;
  percentage: number;
}

export interface KNNResponse {
  k: number;
  predicted_class_id: number;
  predicted_class_uz: string;
  predicted_class_en: string;
  class_probabilities: Record<number, number>;
  query_point_pca: { x: number; y: number };
  nearest_neighbors: KNNNeighbor[];
  vote_distribution: KNNVote[];
  training_points: KNNPoint[];
  explanation_uz: string;
  pca_variance_ratio: number[];
  total_variance_explained: number;
}

export interface TreeVote {
  tree_id: number;
  predicted_class_id: number;
  predicted_class_uz: string;
  predicted_class_en: string;
  color: string;
  tree_depth: number;
  n_leaves: number;
  root_feature?: string | null;
  root_feature_uz?: string | null;
  root_threshold?: number | null;
}

export interface ForestDetailedTrace {
  tree_id: number;
  structure?: TreeStructure;
  trace: TreeTraceResponse;
  tree_depth: number;
  n_leaves: number;
}

export interface ForestVoteSummary {
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  votes: number;
  percentage: number;
  model_probability: number;
}

export interface FeatureImportanceItem {
  feature: string;
  name_uz: string;
  name_en: string;
  importance: number;
  percentage: number;
}

export interface ForestStats {
  n_estimators: number;
  mean_depth: number;
  min_depth: number;
  max_depth: number;
  mean_leaves: number;
  min_leaves: number;
  max_leaves: number;
  depth_distribution: Record<number, number>;
  max_features: string;
  bootstrap: boolean;
  single_tree_accuracy: number;
  forest_accuracy: number;
}

export interface ForestVotesResponse {
  total_trees: number;
  detailed_trees_count: number;
  final_predicted_class_id: number;
  final_predicted_class_uz: string;
  final_predicted_class_en: string;
  class_probabilities: Record<number, number>;
  most_common_tree_class_id: number;
  vote_distribution: ForestVoteSummary[];
  all_tree_votes: TreeVote[];
  detailed_traces: ForestDetailedTrace[];
  feature_importances?: FeatureImportanceItem[];
  forest_stats?: ForestStats;
  explanation_uz: string;
}

export interface ModelMetricsData {
  name: string;
  name_uz: string;
  test_accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  precision_weighted: number;
  recall_weighted: number;
  f1_weighted: number;
  cv_scores: number[];
  cv_mean: number;
  cv_std: number;
  confusion_matrix: number[][];
  tree_depth?: number;
  n_leaves?: number;
  feature_importances?: Record<string, number>;
  k_neighbors?: number;
  distance_metric?: string;
  scaling?: string;
  pca_explained_variance_ratio?: number[];
  n_estimators?: number;
}

export interface ModelMetricsResponse {
  dataset: {
    total_samples: number;
    train_samples: number;
    test_samples: number;
    n_features: number;
    n_classes: number;
    class_distribution: Record<number, number>;
  };
  decision_tree: ModelMetricsData;
  knn: ModelMetricsData;
  random_forest: ModelMetricsData;
}

export interface DatasetAnimal {
  animal_name: string;
  class_id: number;
  class_name_uz: string;
  class_name_en: string;
  color: string;
  features: AnimalFeatures;
}
