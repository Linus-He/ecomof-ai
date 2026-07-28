// @ts-nocheck
export const TERMINOLOGY = {
  descriptor: { zh: "描述符", en: "descriptor" },
  evidenceLevel: { zh: "证据等级", en: "evidence level" },
  curationStatus: { zh: "整理状态", en: "curation status" },
  provenance: { zh: "数据溯源", en: "provenance" },
  fieldLevelProvenance: { zh: "字段级溯源", en: "field-level provenance" },
  recordLevelProvenance: { zh: "记录级溯源", en: "record-level provenance" },
  openMofSeed: { zh: "CoRE 2024 CR 真实结构库", en: "CoRE 2024 CR real corpus" },
  gasSep: { zh: "GasSep", en: "GasSep" },
  ecoScreen: { zh: "EcoScreen", en: "EcoScreen" },
  catalysisLab: { zh: "催化", en: "Catalysis" },
  criticMcda: { zh: "CRITIC-MCDA", en: "CRITIC-MCDA" },
  lcaLcc: { zh: "LCA / LCC", en: "LCA / LCC" },
}

export function term(key, lang = "en") {
  const item = TERMINOLOGY[key]
  if (!item) return key
  return lang === "zh" ? item.zh : item.en
}
