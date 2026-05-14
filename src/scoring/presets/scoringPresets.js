import { CATALYSIS_FORMATE_DESCRIPTOR_DEFINITIONS, GENERAL_MOF_DESCRIPTOR_DEFINITIONS } from "../descriptors/descriptorDefinitions"
import { CATALYSIS_FORMATE_DESCRIPTOR_DIRECTIONS, GENERAL_MOF_DESCRIPTOR_DIRECTIONS } from "../descriptors/descriptorDirections"
import { getDescriptorPreset } from "../descriptors/descriptorPresets"

const generalDescriptors = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

const catalysisDescriptors = ["d_stab", "d_barrier", "d_select"]

export const SCORING_PRESETS = {
  generalMofScreening: {
    id: "generalMofScreening",
    label: "General MOF descriptor screening",
    labelZh: "通用 MOF 描述符评分",
    datasetLabel: "MOF candidate descriptors",
    datasetLabelZh: "MOF 候选描述符",
    defaultAlgorithm: "hybrid",
    descriptorPreset: "coreMof8",
    defaultMissingValueStrategy: "median",
    defaultEvidenceMode: "descriptor-evidence",
    hybridAlpha: 0.65,
    descriptors: generalDescriptors,
    descriptorDefinitions: GENERAL_MOF_DESCRIPTOR_DEFINITIONS,
    descriptorDirections: GENERAL_MOF_DESCRIPTOR_DIRECTIONS,
    manualWeights: {
      surfaceArea: 0.14,
      poreSizeA: 0.1,
      poreVolume: 0.1,
      co2Uptake: 0.18,
      bandGap: 0.1,
      waterStability: 0.16,
      thermalStability: 0.12,
      toxicityConcern: 0.1,
    },
    methodSummary: "Raw MOF descriptors are normalized, weighted, scored, ranked, and explained with data-quality warnings.",
    methodSummaryZh: "对 MOF 原始描述符归一化、赋权、评分、排序，并附带数据质量提示。",
  },
  catalysisFormateCase: {
    id: "catalysisFormateCase",
    label: "Catalysis formate CRITIC case",
    labelZh: "产甲酸路径 CRITIC 案例",
    datasetLabel: "Formate-pathway candidate descriptors",
    datasetLabelZh: "产甲酸路径候选描述符",
    defaultAlgorithm: "critic",
    defaultMissingValueStrategy: "median",
    defaultEvidenceMode: "confidence-Q",
    hybridAlpha: 1,
    descriptors: catalysisDescriptors,
    descriptorDefinitions: CATALYSIS_FORMATE_DESCRIPTOR_DEFINITIONS,
    descriptorDirections: CATALYSIS_FORMATE_DESCRIPTOR_DIRECTIONS,
    manualWeights: { d_stab: 0.42, d_barrier: 0.38, d_select: 0.2 },
    methodSummary: "Existing formate-pathway prototype with G hard screening, D_raw, confidence_Q, D_expected, sensitivity ranks, and robustness diagnostics.",
    methodSummaryZh: "保留现有产甲酸路径原型：G 硬筛、D_raw、confidence_Q、D_expected、敏感性排名与稳健性诊断。",
  },
}

export function resolveScoringPreset(preset = "generalMofScreening") {
  if (typeof preset === "object" && preset?.id) return preset
  const descriptorPreset = getDescriptorPreset(preset)
  if (descriptorPreset?.key === preset && !SCORING_PRESETS[preset]) {
    return {
      ...SCORING_PRESETS.generalMofScreening,
      descriptorPreset: descriptorPreset.key,
      descriptors: descriptorPreset.descriptorKeys,
      label: descriptorPreset.label,
      labelZh: descriptorPreset.labelZh,
      methodSummary: descriptorPreset.description || SCORING_PRESETS.generalMofScreening.methodSummary,
      methodSummaryZh: descriptorPreset.descriptionZh || SCORING_PRESETS.generalMofScreening.methodSummaryZh,
    }
  }
  return SCORING_PRESETS[preset] || SCORING_PRESETS.generalMofScreening
}
