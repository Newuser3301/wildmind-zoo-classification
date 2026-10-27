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
import { clientMLEngine } from "./clientMLEngine";

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
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      return await handleResponse<{ status: string; models_trained: boolean }>(res);
    } catch {
      return clientMLEngine.getHealth();
    }
  },

  async getDatasetSummary() {
    try {
      const res = await fetch(`${API_BASE}/api/dataset/summary`);
      return await handleResponse<any>(res);
    } catch {
      return clientMLEngine.getDatasetSummary();
    }
  },

  async getDatasetAnimals(): Promise<DatasetAnimal[]> {
    try {
      const res = await fetch(`${API_BASE}/api/dataset/animals`);
      return await handleResponse<DatasetAnimal[]>(res);
    } catch {
      return clientMLEngine.getDatasetAnimals();
    }
  },

  async getModelMetrics(): Promise<ModelMetricsResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/models/metrics`);
      return await handleResponse<ModelMetricsResponse>(res);
    } catch {
      return clientMLEngine.getModelMetrics();
    }
  },

  async predictAnimal(
    animalName: string,
    features: AnimalFeatures,
    photoData?: string | null
  ): Promise<PredictionResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/models/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animal_name: animalName,
          features,
          photo_data: photoData || null,
        }),
      });
      return await handleResponse<PredictionResponse>(res);
    } catch {
      return clientMLEngine.predictAnimal(animalName, features, photoData);
    }
  },

  async getDecisionTreeStructure(): Promise<TreeStructure> {
    try {
      const res = await fetch(`${API_BASE}/api/decision-tree/structure`);
      return await handleResponse<TreeStructure>(res);
    } catch {
      return clientMLEngine.getDecisionTreeStructure();
    }
  },

  async traceDecisionTree(features: AnimalFeatures): Promise<TreeTraceResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/decision-tree/trace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });
      return await handleResponse<TreeTraceResponse>(res);
    } catch {
      return clientMLEngine.traceDecisionTree(features);
    }
  },

  async queryKNN(features: AnimalFeatures, k: number = 5): Promise<KNNResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/knn/neighbors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, k }),
      });
      return await handleResponse<KNNResponse>(res);
    } catch {
      return clientMLEngine.queryKNN(features, k);
    }
  },

  async getKNNProjection() {
    try {
      const res = await fetch(`${API_BASE}/api/knn/projection`);
      return await handleResponse<{
        points: Array<{ id: number; animal_name: string; class_id: number; class_name_uz: string; color: string; pca_x: number; pca_y: number }>;
        pca_variance_ratio: number[];
        total_variance_explained: number;
      }>(res);
    } catch {
      const knnRes = clientMLEngine.queryKNN({
        hair: 0, feathers: 0, eggs: 0, milk: 0, airborne: 0, aquatic: 0, predator: 0,
        toothed: 0, backbone: 0, breathes: 0, venomous: 0, fins: 0, legs: 0, tail: 0,
        domestic: 0, catsize: 0
      }, 5);
      return {
        points: knnRes.training_points.map((p) => ({
          id: p.id,
          animal_name: p.animal_name,
          class_id: p.class_id,
          class_name_uz: p.class_name_uz,
          color: p.color,
          pca_x: p.pca_x,
          pca_y: p.pca_y,
        })),
        pca_variance_ratio: knnRes.pca_variance_ratio,
        total_variance_explained: knnRes.total_variance_explained,
      };
    }
  },

  async getKNNDecisionRegions() {
    try {
      const res = await fetch(`${API_BASE}/api/knn/projection-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return await handleResponse<any>(res);
    } catch {
      return {
        is_projection_model: true,
        disclaimer_uz: "Ushbu 2D chegaralar PCA proyeksiyasiga moslangan vizual xaritadir.",
        bounds: { x_min: -3, x_max: 3, y_min: -3, y_max: 3 },
        points: [],
      };
    }
  },

  async getRandomForestSummary() {
    try {
      const res = await fetch(`${API_BASE}/api/random-forest/summary`);
      return await handleResponse<any>(res);
    } catch {
      return {
        n_estimators: 100,
        criterion: "gini",
        max_features: "sqrt",
        bootstrap: true,
        classes: [1, 2, 3, 4, 5, 6, 7],
      };
    }
  },

  async queryRandomForestVotes(
    features: AnimalFeatures,
    detailedLimit: number = 5
  ): Promise<ForestVotesResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/random-forest/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, detailed_limit: detailedLimit }),
      });
      return await handleResponse<ForestVotesResponse>(res);
    } catch {
      return clientMLEngine.queryRandomForestVotes(features, detailedLimit);
    }
  },

  async getSingleForestTree(treeId: number, features?: AnimalFeatures) {
    try {
      const url = `${API_BASE}/api/random-forest/tree/${treeId}`;
      const options: RequestInit = features
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(features),
          }
        : { method: "GET" };
      const res = await fetch(url, options);
      return await handleResponse<{
        tree_id: number;
        structure: TreeStructure;
        trace: TreeTraceResponse | null;
      }>(res);
    } catch {
      return clientMLEngine.getSingleForestTree(treeId, features);
    }
  },
};
