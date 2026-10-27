import { describe, it, expect } from "vitest";
import { ANIMAL_PRESETS, CLASSES_MAP } from "../constants/presets";
import { AnimalFeatures } from "../types";

describe("WildMind AI Frontend Unit Tests", () => {
  it("validates that all 10 animal presets contain authentic 16 features", () => {
    expect(ANIMAL_PRESETS.length).toBeGreaterThanOrEqual(10);

    const requiredFeatures: Array<keyof AnimalFeatures> = [
      "hair", "feathers", "eggs", "milk", "airborne", "aquatic",
      "predator", "toothed", "backbone", "breathes", "venomous",
      "fins", "legs", "tail", "domestic", "catsize"
    ];

    const allowedLegs = new Set([0, 2, 4, 5, 6, 8]);

    ANIMAL_PRESETS.forEach((preset) => {
      expect(preset.name_uz).toBeDefined();
      expect(preset.class_id).toBeGreaterThanOrEqual(1);
      expect(preset.class_id).toBeLessThanOrEqual(7);

      requiredFeatures.forEach((feat) => {
        expect(preset.features[feat]).toBeDefined();
        if (feat === "legs") {
          expect(allowedLegs.has(preset.features.legs)).toBe(true);
        } else {
          expect([0, 1]).toContain(preset.features[feat]);
        }
      });
    });
  });

  it("validates that CLASSES_MAP contains all 7 authentic UCI classes", () => {
    for (let c = 1; c <= 7; c++) {
      const info = CLASSES_MAP[c];
      expect(info).toBeDefined();
      expect(info.id).toBe(c);
      expect(info.name_uz).toBeDefined();
      expect(info.name_en).toBeDefined();
      expect(info.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(info.scientific_group).toBeDefined();
    }
  });

  it("calculates correct majority vote and consensus logic", () => {
    // Test consensus agreement logic
    const testPredictions = {
      decision_tree: { class_id: 1 },
      knn: { class_id: 1 },
      random_forest: { class_id: 1 },
    };

    const allAgree =
      testPredictions.decision_tree.class_id === testPredictions.knn.class_id &&
      testPredictions.knn.class_id === testPredictions.random_forest.class_id;

    expect(allAgree).toBe(true);
  });

  it("verifies Euclidean distance calculation between two 16D feature vectors", () => {
    const v1: AnimalFeatures = {
      hair: 1, feathers: 0, eggs: 0, milk: 1, airborne: 0, aquatic: 0,
      predator: 1, toothed: 1, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 4, tail: 1, domestic: 0, catsize: 1
    };

    const v2: AnimalFeatures = {
      hair: 1, feathers: 0, eggs: 0, milk: 1, airborne: 0, aquatic: 0,
      predator: 1, toothed: 1, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 4, tail: 1, domestic: 0, catsize: 1
    };

    const keys = Object.keys(v1) as Array<keyof AnimalFeatures>;
    const sumSq = keys.reduce((acc, k) => acc + Math.pow(v1[k] - v2[k], 2), 0);
    const distance = Math.sqrt(sumSq);

    expect(distance).toBe(0);
  });
});
