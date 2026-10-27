import {
  AnimalFeatures,
  DatasetAnimal,
  ForestVotesResponse,
  KNNResponse,
  ModelMetricsResponse,
  PredictionResponse,
  TreeStructure,
  TreeTraceResponse,
} from "../types";

const API_BASE = "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server xatosi (${res.status}): ${errorText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse<{ status: string; models_trained: boolean }>(res);
  },

  async getDatasetSummary() {
    const res = await fetch(`${API_BASE}/api/dataset/summary`);
    return handleResponse<{
      name: string;
      source: string;
      url: string;
      total_samples: number;
      features_count: number;
      classes_count: number;
      features: Array<{ name: string; name_uz: string; description_uz: string; type: string; allowed: number[] }>;
      classes: Array<{ id: number; name_en: string; name_uz: string; scientific_group: string; description_uz: string; color: string; samples_count: number }>;
      dataset_limitations_uz: string;
    }>(res);
  },

  async getDatasetAnimals(): Promise<DatasetAnimal[]> {
    const res = await fetch(`${API_BASE}/api/dataset/animals`);
    return handleResponse<DatasetAnimal[]>(res);
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    const res = await fetch(`${API_BASE}/api/models/metrics`);
    return handleResponse<ModelMetricsResponse>(res);
  },

  async predictAnimal(
    animalName: string,
    features: AnimalFeatures,
    photoData?: string | null
  ): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE}/api/models/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animal_name: animalName,
        features,
        photo_data: photoData || null,
      }),
    });
    return handleResponse<PredictionResponse>(res);
  },

  async getDecisionTreeStructure(): Promise<TreeStructure> {
    const res = await fetch(`${API_BASE}/api/decision-tree/structure`);
    return handleResponse<TreeStructure>(res);
  },

  async traceDecisionTree(features: AnimalFeatures): Promise<TreeTraceResponse> {
    const res = await fetch(`${API_BASE}/api/decision-tree/trace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });
    return handleResponse<TreeTraceResponse>(res);
  },

  async queryKNN(features: AnimalFeatures, k: number = 5): Promise<KNNResponse> {
    const res = await fetch(`${API_BASE}/api/knn/neighbors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, k }),
    });
    return handleResponse<KNNResponse>(res);
  },

  async getKNNProjection() {
    const res = await fetch(`${API_BASE}/api/knn/projection`);
    return handleResponse<{
      points: Array<{ id: number; animal_name: string; class_id: number; class_name_uz: string; color: string; pca_x: number; pca_y: number }>;
      pca_variance_ratio: number[];
      total_variance_explained: number;
    }>(res);
  },

  async getKNNDecisionRegions() {
    const res = await fetch(`${API_BASE}/api/knn/projection-predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<{
      is_projection_model: boolean;
      disclaimer_uz: string;
      bounds: { x_min: number; x_max: number; y_min: number; y_max: number };
      points: Array<{ x: number; y: number; class_id: number; color: string }>;
    }>(res);
  },

  async getRandomForestSummary() {
    const res = await fetch(`${API_BASE}/api/random-forest/summary`);
    return handleResponse<{
      n_estimators: number;
      criterion: string;
      max_features: string;
      bootstrap: boolean;
      classes: number[];
    }>(res);
  },

  async queryRandomForestVotes(
    features: AnimalFeatures,
    detailedLimit: number = 10
  ): Promise<ForestVotesResponse> {
    const res = await fetch(`${API_BASE}/api/random-forest/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, detailed_limit: detailedLimit }),
    });
    return handleResponse<ForestVotesResponse>(res);
  },

  async getSingleForestTree(treeId: number, features?: AnimalFeatures) {
    const url = `${API_BASE}/api/random-forest/tree/${treeId}`;
    const options: RequestInit = features
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        }
      : { method: "GET" };
    const res = await fetch(url, options);
    return handleResponse<{
      tree_id: number;
      structure: TreeStructure;
      trace: TreeTraceResponse | null;
    }>(res);
  },
};
