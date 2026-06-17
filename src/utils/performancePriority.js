// @ts-nocheck
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0))
const round3 = value => Math.round(Number(value || 0) * 1000) / 1000

export const PERFORMANCE_PRIORITY_MODES = [
  {
    id: "balanced",
    label: "Balanced",
    labelZh: "综合平衡",
    description: "Balances performance, evidence, provenance, validation readiness, and data gaps.",
    descriptionZh: "综合考虑性能、证据、溯源、验证就绪度与数据缺口。",
    affectedDescriptors: [],
    boostedWeights: [],
    penalizedFactors: [],
    rankingImpact: "No extra priority boost is applied beyond the selected descriptor weights.",
    rankingImpactZh: "不额外放大某一类指标，沿用当前描述符权重与证据边界。",
    weightMultipliers: {},
  },
  {
    id: "performance_first",
    label: "Performance First",
    labelZh: "性能优先",
    description: "Raises pore-structure and adsorption-performance descriptors before ranking.",
    descriptionZh: "提高孔结构与吸附性能描述符在排序中的影响。",
    affectedDescriptors: ["surfaceArea", "poreVolume", "poreSizeA", "co2Uptake", "selectivity", "d_select", "d_barrier"],
    boostedWeights: ["surfaceArea", "poreVolume", "poreSizeA", "co2Uptake", "selectivity"],
    penalizedFactors: ["missing performance descriptors"],
    rankingImpact: "Candidates with stronger pore volume, surface area, pore size, and capacity/selectivity proxies can move upward.",
    rankingImpactZh: "孔体积、比表面积、孔径、容量/选择性代理更突出的候选可能上升。",
    weightMultipliers: { surfaceArea: 1.45, poreVolume: 1.45, poreSizeA: 1.3, co2Uptake: 1.35, selectivity: 1.35, d_select: 1.28, d_barrier: 1.18 },
  },
  {
    id: "evidence_first",
    label: "Evidence First",
    labelZh: "证据优先",
    description: "Raises literature, source confirmation, and citation readiness signals.",
    descriptionZh: "提高文献支持、来源确认与引文就绪信号。",
    affectedDescriptors: ["evidenceLevel", "sourceConfirmed", "citationReady"],
    boostedWeights: ["evidenceLevel", "sourceConfirmed", "citationReady"],
    penalizedFactors: ["weak evidence", "missing citation"],
    rankingImpact: "Candidates with confirmed source and stronger evidence can outrank higher-performance but weakly sourced records.",
    rankingImpactZh: "来源确认与证据更强的候选可超过性能较强但证据较弱的记录。",
    weightMultipliers: {},
  },
  {
    id: "provenance_first",
    label: "Provenance First",
    labelZh: "溯源优先",
    description: "Raises field provenance coverage, source URL status, and license readiness.",
    descriptionZh: "提高字段级溯源覆盖、来源链接状态与许可状态。",
    affectedDescriptors: ["fieldProvenanceCoverage", "sourceUrlStatus", "licenseStatus"],
    boostedWeights: ["fieldProvenanceCoverage", "sourceUrlStatus", "licenseStatus"],
    penalizedFactors: ["pending source URL", "pending license", "ambiguous field source"],
    rankingImpact: "Records with auditable field sources and cleaner licensing move upward.",
    rankingImpactZh: "字段来源可审计、许可与来源状态更清晰的记录会更靠前。",
    weightMultipliers: {},
  },
  {
    id: "validation_readiness_first",
    label: "Validation Readiness First",
    labelZh: "验证就绪优先",
    description: "Raises verified metadata, data completeness, and low blocker count.",
    descriptionZh: "提高已核验元数据、数据完整度与低阻断项信号。",
    affectedDescriptors: ["verifiedMetadata", "dataCompleteness", "lowBlockerCount"],
    boostedWeights: ["verifiedMetadata", "descriptorCompleteness", "lowBlockerCount"],
    penalizedFactors: ["verification blockers", "missing critical fields"],
    rankingImpact: "Candidates that can be reviewed or validated sooner move upward even when raw performance is similar.",
    rankingImpactZh: "更接近人工复核或验证条件的候选会在性能相近时上升。",
    weightMultipliers: {},
  },
  {
    id: "low_risk_first",
    label: "Low Risk First",
    labelZh: "低风险优先",
    description: "Penalizes ambiguity warnings, missing critical fields, synthetic fixtures, and pending licenses.",
    descriptionZh: "降低存在歧义、关键字段缺失、synthetic fixture 或 license pending 记录的排名。",
    affectedDescriptors: ["ambiguityWarnings", "missingCriticalFields", "syntheticFixture", "licensePending"],
    boostedWeights: ["low risk status"],
    penalizedFactors: ["ambiguityWarnings", "missingCriticalFields", "syntheticFixture", "licensePending"],
    rankingImpact: "Lower-risk records gain stability; risky records are pushed down without being silently removed.",
    rankingImpactZh: "低风险记录排序更稳定；高风险记录会降位但不会被静默删除。",
    weightMultipliers: { toxicityConcern: 1.2, waterStability: 1.14, thermalStability: 1.1 },
  },
]

const MODE_MAP = new Map(PERFORMANCE_PRIORITY_MODES.map(mode => [mode.id, mode]))

export function resolvePerformancePriorityMode(modeId = "balanced") {
  return MODE_MAP.get(modeId) || MODE_MAP.get("balanced")
}

function normalizeWeightMap(weights = {}, descriptors = []) {
  const keys = (descriptors || []).map(descriptor => descriptor.key).filter(Boolean)
  const entries = keys.length ? keys : Object.keys(weights || {})
  const total = entries.reduce((sum, key) => sum + Math.max(0, Number(weights[key]) || 0), 0)
  if (!total) {
    const equal = entries.length ? 1 / entries.length : 0
    return Object.fromEntries(entries.map(key => [key, equal]))
  }
  return Object.fromEntries(entries.map(key => [key, (Math.max(0, Number(weights[key]) || 0)) / total]))
}

export function applyPerformancePriorityToWeights(weights = {}, descriptors = [], modeId = "balanced") {
  const mode = resolvePerformancePriorityMode(modeId)
  const multipliers = mode.weightMultipliers || {}
  if (!Object.keys(multipliers).length) return normalizeWeightMap(weights, descriptors)
  const boosted = Object.fromEntries(Object.entries(weights || {}).map(([key, value]) => [
    key,
    Math.max(0, Number(value) || 0) * (multipliers[key] || 1),
  ]))
  return normalizeWeightMap(boosted, descriptors)
}

function boolScore(value) {
  if (value === true) return 1
  const text = String(value || "").toLowerCase()
  if (["confirmed", "ready", "complete", "verified", "pass", "yes"].some(token => text.includes(token))) return 1
  if (["pending", "missing", "unknown", "ambiguous", "fail"].some(token => text.includes(token))) return 0
  return 0.4
}

function evidenceScore(candidate, evidenceConfidence) {
  return clamp01(Math.max(Number(evidenceConfidence) || 0, boolScore(candidate?.evidenceLevel)))
}

function fieldProvenanceScore(candidate) {
  if (Number.isFinite(Number(candidate?.fieldProvenanceCoverage))) return clamp01(candidate.fieldProvenanceCoverage)
  const sources = Object.values(candidate?.fieldSources || {})
  if (!sources.length) return boolScore(candidate?.sourceConfirmed || candidate?.sourceStatus)
  const ready = sources.filter(source => {
    const status = String(source?.status || source?.fieldStatus || source?.curationStatus || "").toLowerCase()
    return status.includes("confirmed") || status.includes("complete") || source?.sourceUrl || source?.sourceRecordId
  }).length
  return ready / sources.length
}

function riskCount(candidate) {
  const warnings = [
    ...(candidate?.ambiguityWarnings || []),
    ...(candidate?.verification?.ambiguityWarnings || []),
    ...(candidate?.verifiedBlockers || []),
    ...(candidate?.verificationBlockers || []),
    ...(candidate?.missingCriticalFields || []),
  ].filter(Boolean)
  let count = warnings.length
  if (candidate?.syntheticFixture || candidate?.isSyntheticFixture) count += 2
  if (String(candidate?.licenseStatus || candidate?.license || "").toLowerCase().includes("pending")) count += 1
  if (candidate?.quarantined || candidate?.verification?.quarantined) count += 2
  return count
}

function average(values = []) {
  const clean = values.map(value => Number(value)).filter(Number.isFinite)
  if (!clean.length) return 0
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

function performanceSignal(candidate, contributions = []) {
  const fromContribution = key => contributions.find(item => item.key === key)?.normalizedValue
  return average([
    fromContribution("surfaceArea") ?? clamp01((Number(candidate?.surfaceArea) || 0) / 3000),
    fromContribution("poreVolume") ?? clamp01((Number(candidate?.poreVolume) || 0) / 1.8),
    fromContribution("poreSizeA") ?? clamp01((Number(candidate?.poreSizeA) || Number(candidate?.pldA) || 0) / 30),
    fromContribution("co2Uptake") ?? clamp01((Number(candidate?.co2Uptake) || 0) / 10),
    fromContribution("selectivity") ?? clamp01((Number(candidate?.selectivity) || Number(candidate?.selectivityCo2N2) || 0) / 120),
  ])
}

function adjustmentForMode(modeId, candidate, context) {
  const completeness = clamp01(context?.completeness)
  const evidence = evidenceScore(candidate, context?.evidenceConfidence)
  const source = boolScore(candidate?.sourceConfirmed || candidate?.sourceStatus || candidate?.verification?.sourceConfirmed)
  const citation = boolScore(candidate?.citationReady || candidate?.citationStatus || candidate?.verification?.citationStatus)
  const provenance = fieldProvenanceScore(candidate)
  const license = boolScore(candidate?.licenseConfirmed || candidate?.licenseStatus || candidate?.license)
  const verified = boolScore(candidate?.verifiedMetadata || candidate?.verification?.verifiedMetadata)
  const blockers = riskCount(candidate)

  if (modeId === "performance_first") {
    const signal = performanceSignal(candidate, context?.contributions)
    return { signal, delta: (signal - 0.5) * 0.2 }
  }
  if (modeId === "evidence_first") {
    const signal = average([evidence, source, citation])
    return { signal, delta: (signal - 0.5) * 0.24 }
  }
  if (modeId === "provenance_first") {
    const signal = average([provenance, source, license])
    return { signal, delta: (signal - 0.5) * 0.22 }
  }
  if (modeId === "validation_readiness_first") {
    const lowBlocker = clamp01(1 - Math.min(1, blockers / 5))
    const signal = average([verified, completeness, lowBlocker])
    return { signal, delta: (signal - 0.5) * 0.23 }
  }
  if (modeId === "low_risk_first") {
    const riskPenalty = Math.min(0.24, blockers * 0.045 + (context?.missingPenalty || 0) * 0.12)
    const cleanBonus = blockers === 0 && completeness >= 0.8 ? 0.04 : 0
    return { signal: clamp01(1 - riskPenalty), delta: cleanBonus - riskPenalty }
  }
  return { signal: 0.5, delta: 0 }
}

export function buildPriorityCandidateAdjustment(candidate = {}, context = {}) {
  const mode = resolvePerformancePriorityMode(context.modeId)
  const { signal, delta } = adjustmentForMode(mode.id, candidate, context)
  const roundedDelta = round3(delta)
  const directionZh = roundedDelta > 0.005 ? "上调" : roundedDelta < -0.005 ? "下调" : "保持"
  const directionEn = roundedDelta > 0.005 ? "raised" : roundedDelta < -0.005 ? "lowered" : "kept stable"
  return {
    modeId: mode.id,
    modeLabel: mode.label,
    modeLabelZh: mode.labelZh,
    signal: round3(signal),
    delta: roundedDelta,
    affectedDescriptors: mode.affectedDescriptors,
    boostedWeights: mode.boostedWeights,
    penalizedFactors: mode.penalizedFactors,
    rankingImpact: mode.rankingImpact,
    rankingImpactZh: mode.rankingImpactZh,
    explanationEn: `${mode.label} ${directionEn} this candidate by ${Math.abs(roundedDelta).toFixed(3)} based on ${mode.affectedDescriptors.slice(0, 3).join(", ") || "balanced descriptors"}.`,
    explanationZh: `${mode.labelZh} 根据 ${mode.affectedDescriptors.slice(0, 3).join("、") || "综合指标"} 将该候选${directionZh} ${Math.abs(roundedDelta).toFixed(3)}。`,
  }
}

export function buildPriorityImpactSummary(modeId = "balanced") {
  const mode = resolvePerformancePriorityMode(modeId)
  return {
    modeId: mode.id,
    modeLabel: mode.label,
    modeLabelZh: mode.labelZh,
    affectedDescriptors: mode.affectedDescriptors,
    boostedWeights: mode.boostedWeights,
    penalizedFactors: mode.penalizedFactors,
    rankingImpact: mode.rankingImpact,
    rankingImpactZh: mode.rankingImpactZh,
    summaryEn: mode.id === "balanced"
      ? "Balanced mode keeps performance, evidence, provenance, validation readiness, and data gaps visible without a special priority boost."
      : `Current mode is ${mode.label}. Ranking puts more emphasis on ${mode.boostedWeights.join(", ") || mode.affectedDescriptors.join(", ")} and penalizes ${mode.penalizedFactors.join(", ") || "mode-specific risk factors"}.`,
    summaryZh: mode.id === "balanced"
      ? "当前为“综合平衡”。排序同时保留性能、证据、溯源、验证就绪度与数据缺口，不额外放大单一方向。"
      : `当前为“${mode.labelZh}”。本轮排序更重视 ${mode.boostedWeights.join("、") || mode.affectedDescriptors.join("、")}，并降低 ${mode.penalizedFactors.join("、") || "对应风险因素"} 的排名影响。`,
  }
}
