import { AnimalFeatures, ClassInfo } from "../types";

export interface AnimalPreset {
  id: string;
  name_uz: string;
  name_en: string;
  scientific_name: string;
  class_id: number;
  class_name_uz: string;
  description_uz: string;
  features: AnimalFeatures;
  icon: string;
}

export const CLASSES_MAP: Record<number, ClassInfo> = {
  1: {
    id: 1,
    name_en: "Mammal",
    name_uz: "Sutemizuvchilar",
    scientific_group: "Mammalia",
    description_uz: "Issiqqon, bolalarini sut bilan boquvchi, ko'pchiligi jun bilan qoplangan hayvonlar guruhi.",
    color: "#10b981", // Emerald
  },
  2: {
    id: 2,
    name_en: "Bird",
    name_uz: "Qushlar",
    scientific_group: "Aves",
    description_uz: "Patlar bilan qoplangan, tuxum qo'yuvchi, ikki oyoqli va qanotli issiqqon umurtqalilar.",
    color: "#06b6d4", // Cyan
  },
  3: {
    id: 3,
    name_en: "Reptile",
    name_uz: "Sudralib yuruvchilar",
    scientific_group: "Reptilia",
    description_uz: "Sovuqqon, tangachali quruq teriga ega, asosan quruqlikda tuxum qo'yuvchi umurtqalilar.",
    color: "#f59e0b", // Amber
  },
  4: {
    id: 4,
    name_en: "Fish",
    name_uz: "Baliqlar",
    scientific_group: "Pisces",
    description_uz: "Suvda yashovchi, jabralar orqali nafas oluvchi, suzgich qanotlariga ega sovuqqon hayvonlar.",
    color: "#3b82f6", // Blue
  },
  5: {
    id: 5,
    name_en: "Amphibian",
    name_uz: "Suvda ham quruqlikda yashovchilar",
    scientific_group: "Amphibia",
    description_uz: "Hayot sikli suv va quruqlik bilan bog'liq bo'lgan, nam terili sovuqqon umurtqalilar.",
    color: "#8b5cf6", // Purple
  },
  6: {
    id: 6,
    name_en: "Insect",
    name_uz: "Hasharotlar",
    scientific_group: "Insecta",
    description_uz: "Olti oyoqli, tanasi bosh, ko'krak va qoringa bo'lingan xitin qobiqli bo'g'imoyoqlilar.",
    color: "#ec4899", // Pink
  },
  7: {
    id: 7,
    name_en: "Invertebrate",
    name_uz: "Umurtqasizlar",
    scientific_group: "Invertebrata",
    description_uz: "Umurtqa pog'onasi bo'lmagan organizmlar: sakkizoyoqlar, qisqichbaqasimonlar, mollyuskalar.",
    color: "#14b8a6", // Teal
  },
};

export const ANIMAL_PRESETS: AnimalPreset[] = [
  {
    id: "wolf",
    name_uz: "Bo'ri",
    name_en: "Wolf",
    scientific_name: "Canis lupus",
    class_id: 1,
    class_name_uz: "Sutemizuvchilar",
    description_uz: "Yirtqich o'rmon hayvoni, to'dalarda yashaydi, 4 oyoqli, sut emizuvchi.",
    icon: "🐺",
    features: {
      hair: 1, feathers: 0, eggs: 0, milk: 1, airborne: 0, aquatic: 0,
      predator: 1, toothed: 1, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 4, tail: 1, domestic: 0, catsize: 1,
    },
  },
  {
    id: "swan",
    name_uz: "Oqqush",
    name_en: "Swan",
    scientific_name: "Cygnus",
    class_id: 2,
    class_name_uz: "Qushlar",
    description_uz: "Chiroyli suv qushi, patli, tuxum qo'yadi, havoda ucha oladi, 2 oyoqli.",
    icon: "🦢",
    features: {
      hair: 0, feathers: 1, eggs: 1, milk: 0, airborne: 1, aquatic: 1,
      predator: 0, toothed: 0, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 2, tail: 1, domestic: 0, catsize: 1,
    },
  },
  {
    id: "tortoise",
    name_uz: "Toshbaqa",
    name_en: "Tortoise",
    scientific_name: "Testudinidae",
    class_id: 3,
    class_name_uz: "Sudralib yuruvchilar",
    description_uz: "Qattiq kosali, sekin harakatlanuvchi sudralib yuruvchi, tuxum qo'yadi, 4 oyoqli.",
    icon: "🐢",
    features: {
      hair: 0, feathers: 0, eggs: 1, milk: 0, airborne: 0, aquatic: 0,
      predator: 0, toothed: 0, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 4, tail: 1, domestic: 0, catsize: 1,
    },
  },
  {
    id: "piranha",
    name_uz: "Piranha (Yirtqich baliq)",
    name_en: "Piranha",
    scientific_name: "Pygocentrus nattereri",
    class_id: 4,
    class_name_uz: "Baliqlar",
    description_uz: "O'tkir tishli daryo balig'i, suzgich qanotli, oyoqlari yo'q (0), jabra bilan nafas oladi.",
    icon: "🐟",
    features: {
      hair: 0, feathers: 0, eggs: 1, milk: 0, airborne: 0, aquatic: 1,
      predator: 1, toothed: 1, backbone: 1, breathes: 0, venomous: 0,
      fins: 1, legs: 0, tail: 1, domestic: 0, catsize: 0,
    },
  },
  {
    id: "frog",
    name_uz: "Qurbaqa",
    name_en: "Frog",
    scientific_name: "Anura",
    class_id: 5,
    class_name_uz: "Suvda ham quruqlikda yashovchilar",
    description_uz: "Suvda tuxum qo'yadi, voyaga yetgach o'pka va teri bilan nafas oladi, dumi yo'q, 4 oyoqli.",
    icon: "🐸",
    features: {
      hair: 0, feathers: 0, eggs: 1, milk: 0, airborne: 0, aquatic: 1,
      predator: 1, toothed: 1, backbone: 1, breathes: 1, venomous: 0,
      fins: 0, legs: 4, tail: 0, domestic: 0, catsize: 0,
    },
  },
  {
    id: "honeybee",
    name_uz: "Asalari",
    name_en: "Honeybee",
    scientific_name: "Apis mellifera",
    class_id: 6,
    class_name_uz: "Hasharotlar",
    description_uz: "Olti oyoqli, ucha oladigan, zaharli nishi bor bo'g'imoyoqli, umurtqasiz.",
    icon: "🐝",
    features: {
      hair: 1, feathers: 0, eggs: 1, milk: 0, airborne: 1, aquatic: 0,
      predator: 0, toothed: 0, backbone: 0, breathes: 1, venomous: 1,
      fins: 0, legs: 6, tail: 0, domestic: 1, catsize: 0,
    },
  },
  {
    id: "crab",
    name_uz: "Qisqichbaqa",
    name_en: "Crab",
    scientific_name: "Brachyura",
    class_id: 7,
    class_name_uz: "Umurtqasizlar",
    description_uz: "Sakkiz oyoqli (va 2 qisqichi bor), suvda yashovchi, qattiq qobiqli umurtqasiz jonivor.",
    icon: "🦀",
    features: {
      hair: 0, feathers: 0, eggs: 1, milk: 0, airborne: 0, aquatic: 1,
      predator: 1, toothed: 0, backbone: 0, breathes: 0, venomous: 0,
      fins: 0, legs: 4, tail: 0, domestic: 0, catsize: 0,
    },
  },
  {
    id: "dolphin",
    name_uz: "Delfin (Ajoyib namuna)",
    name_en: "Dolphin",
    scientific_name: "Delphinidae",
    class_id: 1,
    class_name_uz: "Sutemizuvchilar",
    description_uz: "Suvda yashasa va suzgich qanotlari bo'lsa-da, sut emizuvchi issiqqon umurtqali!",
    icon: "🐬",
    features: {
      hair: 0, feathers: 0, eggs: 0, milk: 1, airborne: 0, aquatic: 1,
      predator: 1, toothed: 1, backbone: 1, breathes: 1, venomous: 0,
      fins: 1, legs: 0, tail: 1, domestic: 0, catsize: 1,
    },
  },
  {
    id: "platypus",
    name_uz: "O'rdakburun (Noyob namuna)",
    name_en: "Platypus",
    scientific_name: "Ornithorhynchus anatinus",
    class_id: 1,
    class_name_uz: "Sutemizuvchilar",
    description_uz: "Tuxum qo'yuvchi yagona sutemizuvchilardan biri! Sut emizadi, zaharli bezlari bor.",
    icon: "🦫",
    features: {
      hair: 1, feathers: 0, eggs: 1, milk: 1, airborne: 0, aquatic: 1,
      predator: 1, toothed: 0, backbone: 1, breathes: 1, venomous: 1,
      fins: 0, legs: 4, tail: 1, domestic: 0, catsize: 1,
    },
  },
  {
    id: "octopus",
    name_uz: "Sakkizoyoq",
    name_en: "Octopus",
    scientific_name: "Octopoda",
    class_id: 7,
    class_name_uz: "Umurtqasizlar",
    description_uz: "8 ta paypaslagichli (oyoqli), suzgichsiz, umurtqasiz juda aqlli dengiz jonzoti.",
    icon: "🐙",
    features: {
      hair: 0, feathers: 0, eggs: 1, milk: 0, airborne: 0, aquatic: 1,
      predator: 1, toothed: 0, backbone: 0, breathes: 0, venomous: 0,
      fins: 0, legs: 8, tail: 0, domestic: 0, catsize: 1,
    },
  },
];
