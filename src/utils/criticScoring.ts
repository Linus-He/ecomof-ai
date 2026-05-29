// @ts-nocheck
const INDICATORS = [
  {
    key: "d_stab",
    label: "Stability",
    zhLabel: "水热稳定性",
    shortLabel: "stab",
    symbol: "d_stab",
    direction: "benefit",
    description: "Retained structure under target aqueous hydrothermal conditions.",
    zhDescription: "目标水相水热条件下结构保持能力。",
  },
  {
    key: "d_barrier",
    label: "Barrier",
    zhLabel: "关键能垒",
    shortLabel: "barrier",
    symbol: "d_barrier",
    direction: "benefit",
    description: "Benefit-style descriptor for a more favorable formate-pathway bottleneck.",
    zhDescription: "产甲酸关键步骤越有利，benefit-style 分数越高。",
  },
  {
    key: "d_select",
    label: "Byproduct-risk",
    zhLabel: "副产物风险",
    shortLabel: "select",
    symbol: "d_select",
    direction: "benefit",
    description: "Benefit-style descriptor after converting byproduct risk into selectivity support.",
    zhDescription: "已将副产物风险转换为 benefit-style 分数，分数越高表示副产物路径风险越低。",
  },
]

export const CRITIC_INDICATORS = INDICATORS
export const UNKNOWN_SCORE = 0.5

export const CRITIC_WEIGHTING_MODES = [
  {
    id: "critic",
    label: "CRITIC",
    zhLabel: "CRITIC",
    description: "Objective weights derived from contrast intensity and conflict intensity in the active candidate set.",
    zhDescription: "由当前候选集的差异度 contrast intensity 与冲突度 conflict intensity 推导客观权重。",
  },
  {
    id: "equal",
    label: "Equal Weight",
    zhLabel: "等权重 Equal",
    weights: { d_stab: 1 / 3, d_barrier: 1 / 3, d_select: 1 / 3 },
    description: "Reference mode where every indicator has the same influence.",
    zhDescription: "参考模式，每个指标具有相同排序影响力。",
  },
  {
    id: "expert",
    label: "Expert Preset",
    zhLabel: "专家预设 Expert",
    weights: { d_stab: 0.42, d_barrier: 0.38, d_select: 0.2 },
    description: "Hydrothermal formate-formation preset emphasizing stability and kinetic feasibility.",
    zhDescription: "面向水热产甲酸筛选的专家预设，更强调稳定性与关键能垒。",
  },
  {
    id: "custom",
    label: "Custom",
    zhLabel: "自定义 Custom",
    weights: { d_stab: 0.3, d_barrier: 0.45, d_select: 0.25 },
    description: "Example custom scenario for reviewing how a barrier-forward setting changes rank order.",
    zhDescription: "示例自定义情景，用于观察更强调能垒时排序如何变化。",
  },
]

const EXPECTED_DESCRIPTOR_FIELDS = [
  "d_stab",
  "d_barrier",
  "d_select",
  "G",
  "confidence_Q",
  "evidenceLevel",
  "evidenceSummary",
  "sources",
]

const normalizeWeights = weights => {
  const entries = INDICATORS.map(indicator => [indicator.key, Math.max(0, Number(weights?.[indicator.key]) || 0)])
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const fallback = 1 / INDICATORS.length
  return Object.fromEntries(entries.map(([key, value]) => [key, total > 0 ? value / total : fallback]))
}

export const CRITIC_SCORING_DEMO_CANDIDATES = [
  {
    id: "MOF-B",
    name: "MOF-B",
    libraryName: "UiO-66",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 1.0,
    d_barrier: 0.75,
    d_select: 0.8,
    G: 1,
    confidence_Q: 0.8,
    evidenceLevel: "B",
    evidenceSummary: "Literature-supported post-reaction characterization",
    exclusionReason: "",
    dataGaps: ["Need unified DFT barrier validation", "Need byproduct quantification"],
    sources: [
      { label: "Demo source", type: "literature / DFT / experiment / inferred", note: "Replace with real DOI or internal record later" },
    ],
  },
  {
    id: "MOF-808-DEMO",
    name: "MOF-808",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.92,
    d_barrier: 0.68,
    d_select: 0.74,
    G: 1,
    confidence_Q: 0.72,
    evidenceLevel: "B",
    evidenceSummary: "Illustrative Zr-cluster stability record with partial catalytic proxy evidence",
    exclusionReason: "",
    dataGaps: ["Need unified HCOO* barrier calculation", "Need hydrothermal post-reaction ICP"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "NU-1000-DEMO",
    name: "NU-1000",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.86,
    d_barrier: 0.58,
    d_select: 0.7,
    G: 1,
    confidence_Q: 0.62,
    evidenceLevel: "C",
    evidenceSummary: "Framework stability is plausible; formate-pathway evidence remains incomplete",
    exclusionReason: "",
    dataGaps: ["Need comparable DFT pathway", "Need product distribution under identical conditions"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "PCN-222-DEMO",
    name: "PCN-222",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.68,
    d_barrier: 0.64,
    d_select: 0.52,
    G: 1,
    confidence_Q: 0.55,
    evidenceLevel: "C",
    evidenceSummary: "Porphyrinic framework suggests catalytic handles, but selectivity evidence is thin",
    exclusionReason: "",
    dataGaps: ["Need byproduct quantification", "Need post-reaction framework integrity data"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "UiO-66-NH2-DEMO",
    name: "UiO-66-NH2",
    metalCenter: "Zr",
    frameworkType: "MOF",
    d_stab: 0.88,
    d_barrier: 0.46,
    d_select: 0.66,
    G: 1,
    confidence_Q: 0.58,
    evidenceLevel: "C",
    evidenceSummary: "Stable framework with incomplete formate-step kinetic evidence",
    exclusionReason: "",
    dataGaps: ["Need unified DFT barrier validation", "Need measured formate selectivity"],
    sources: [
      { label: "Demo source", type: "literature / inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "ZIF-8-DEMO",
    name: "ZIF-8",
    metalCenter: "Zn",
    frameworkType: "MOF",
    d_stab: 0.42,
    d_barrier: 0.5,
    d_select: 0.56,
    G: 1,
    confidence_Q: 0.48,
    evidenceLevel: "D",
    evidenceSummary: "Hydrothermal formate-formation suitability is weakly supported in this demo set",
    exclusionReason: "",
    dataGaps: ["Need 170 C aqueous stability evidence", "Need DFT barrier and product distribution data"],
    sources: [
      { label: "Demo source", type: "inferred", note: "Illustrative record; replace with curated source" },
    ],
  },
  {
    id: "HKUST-1-DEMO",
    name: "HKUST-1",
    metalCenter: "Cu",
    frameworkType: "MOF",
    d_stab: 0.18,
    d_barrier: 0.56,
    d_select: 0.45,
    G: 0,
    confidence_Q: 0.65,
    evidenceLevel: "D",
    evidenceSummary: "Illustrative hard-screen exclusion due to hydrothermal stability concern",
    exclusionReason: "Excluded in demo because the framework is not treated as stable under the target 170 C aqueous screening constraint.",
    dataGaps: ["Need direct post-reaction XRD/BET/ICP under target condition"],
    sources: [
      { label: "Demo source", type: "inferred", note: "Illustrative exclusion; replace with curated evidence" },
    ],
  },
]

export function isMissingScore(value) {
  if (value === undefined || value === null) return true
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "" || normalized === "unknown" || normalized === "not reported" || normalized === "pending" || normalized === "n/a" || normalized === "na" || normalized === "—"
  }
  return false
}

export function normalizeScore(value, options = {}) {
  const {
    unknown = UNKNOWN_SCORE,
    min = 0.01,
    max = 1,
  } = options
  if (isMissingScore(value)) return Math.max(min, Math.min(max, unknown))
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return Math.max(min, Math.min(max, unknown))
  return Math.max(min, Math.min(max, numeric))
}

export function clipScore(value, min = 0.01, max = 1, unknownScore = UNKNOWN_SCORE) {
  return normalizeScore(value, { unknown: unknownScore, min, max })
}

function normalizeIndicatorScore(candidate, key, unknownScore = UNKNOWN_SCORE) {
  const rawValue = candidate?.[key]
  const missing = isMissingScore(rawValue)
  const numeric = Number(rawValue)
  const trueZero = !missing && Number.isFinite(numeric) && numeric === 0
  const normalized = clipScore(rawValue, 0.01, 1, unknownScore)
  let inputState = "reported"
  if (missing) inputState = "unknown / not reported"
  else if (trueZero) inputState = "true zero / fatal descriptor"
  else if (normalized < 0.5) inputState = "weak evidence"
  return { key, rawValue, normalized, missing, trueZero, inputState }
}

export function computeStd(values) {
  const nums = values.map(Number).filter(Number.isFinite)
  if (!nums.length) return 0
  const mean = nums.reduce((sum, value) => sum + value, 0) / nums.length
  const variance = nums.reduce((sum, value) => sum + (value - mean) ** 2, 0) / nums.length
  return Math.sqrt(Math.max(0, variance))
}

export function computePearsonCorrelation(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length < 2) return 0
  const xs = a.map(Number)
  const ys = b.map(Number)
  if (xs.some(value => !Number.isFinite(value)) || ys.some(value => !Number.isFinite(value))) return 0
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length
  const numerator = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0)
  const denomX = Math.sqrt(xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0))
  const denomY = Math.sqrt(ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0))
  const denominator = denomX * denomY
  if (!Number.isFinite(denominator) || denominator === 0) return 0
  const result = numerator / denominator
  return Number.isFinite(result) ? Math.max(-1, Math.min(1, result)) : 0
}

export function computeCriticWeights(candidates) {
  const rows = Array.isArray(candidates) ? candidates.filter(candidate => Number(candidate?.G) !== 0) : []
  const sourceRows = rows.length ? rows : Array.isArray(candidates) ? candidates : []
  const valuesByKey = Object.fromEntries(
    INDICATORS.map(indicator => [indicator.key, sourceRows.map(candidate => clipScore(candidate?.[indicator.key]))])
  )
  const correlationMatrix = Object.fromEntries(
    INDICATORS.map(row => [
      row.key,
      Object.fromEntries(INDICATORS.map(col => [
        col.key,
        row.key === col.key ? 1 : computePearsonCorrelation(valuesByKey[row.key] || [], valuesByKey[col.key] || []),
      ])),
    ])
  )
  const conflictMatrix = Object.fromEntries(
    INDICATORS.map(row => [
      row.key,
      Object.fromEntries(INDICATORS.map(col => {
        const value = row.key === col.key ? 0 : 1 - (Number(correlationMatrix[row.key]?.[col.key]) || 0)
        return [col.key, Number.isFinite(value) ? Math.max(0, value) : 0]
      })),
    ])
  )
  const decomposition = INDICATORS.map(indicator => {
    const sigma = computeStd(valuesByKey[indicator.key] || [])
    const conflict = INDICATORS.reduce((sum, other) => {
      const r = correlationMatrix[indicator.key]?.[other.key]
      return sum + (1 - (Number.isFinite(r) ? r : 0))
    }, 0)
    const information = sigma * conflict
    return {
      ...indicator,
      standardDeviation: sigma,
      sigma,
      contrastIntensity: sigma,
      conflictIntensity: conflict,
      conflict,
      information,
      interpretation: "Weight expresses ranking influence in this candidate set; it is not a chemical-causality claim.",
      zhInterpretation: "该权重表示当前候选集中的排序影响力，不代表化学因果机制。",
    }
  })
  const infoSum = decomposition.reduce((sum, row) => sum + row.information, 0)
  const fallbackWeight = 1 / INDICATORS.length
  const weights = Object.fromEntries(
    decomposition.map(row => [row.key, infoSum > 0 ? row.information / infoSum : fallbackWeight])
  )
  return { weights, correlationMatrix, conflictMatrix, decomposition }
}

export function getCandidateStatus(score, G) {
  if (Number(G) === 0) return { label: "Excluded", zh: "已排除", tone: "warn" }
  if (score >= 0.75) return { label: "Likely useful", zh: "优先验证", tone: "calc" }
  if (score >= 0.5) return { label: "Promising but uncertain", zh: "有潜力但需补证据", tone: "info" }
  if (score >= 0.3) return { label: "Low priority", zh: "暂不优先", tone: "proxy" }
  return { label: "Unlikely useful", zh: "不建议优先", tone: "warn" }
}

function getDescriptorCompleteness(candidate) {
  const curated = EXPECTED_DESCRIPTOR_FIELDS.filter(key => {
    const value = candidate?.[key]
    if (Array.isArray(value)) return value.length > 0
    return !isMissingScore(value)
  }).length
  return {
    curated,
    total: EXPECTED_DESCRIPTOR_FIELDS.length,
    ratio: curated / EXPECTED_DESCRIPTOR_FIELDS.length,
    label: `${curated}/${EXPECTED_DESCRIPTOR_FIELDS.length} descriptors curated`,
    zhLabel: `${curated}/${EXPECTED_DESCRIPTOR_FIELDS.length} 个描述符已整理`,
  }
}

function inferEvidenceSource(candidate) {
  const evidenceText = [
    candidate?.evidenceSummary,
    candidate?.evidenceLevel,
    ...(candidate?.sources || []).flatMap(source => [source?.label, source?.type, source?.note]),
  ].join(" ").toLowerCase()
  if (evidenceText.includes("experiment") || evidenceText.includes("characterization")) {
    return { label: "Experimental", zh: "实验 Experimental", tone: "calc" }
  }
  if (evidenceText.includes("literature") || evidenceText.includes("doi")) {
    return { label: "Literature", zh: "文献 Literature", tone: "info" }
  }
  if (evidenceText.includes("dft") || evidenceText.includes("simulated") || evidenceText.includes("simulation")) {
    return { label: "Simulated", zh: "模拟 Simulated", tone: "proxy" }
  }
  return { label: "Demo", zh: "演示 Demo", tone: "warn" }
}

function deriveCandidateMetrics(candidate, weights) {
  const G = Number(candidate.G) === 0 ? 0 : 1
  const dStab = candidate.d_stab_clipped ?? normalizeIndicatorScore(candidate, "d_stab").normalized
  const dBarrier = candidate.d_barrier_clipped ?? normalizeIndicatorScore(candidate, "d_barrier").normalized
  const dSelect = candidate.d_select_clipped ?? normalizeIndicatorScore(candidate, "d_select").normalized
  const evidenceScore = candidate.confidence_Q_clipped ?? clipScore(candidate.confidence_Q, 0, 1)
  const performanceScore = G === 0 ? 0 : (0.18 * dStab + 0.55 * dBarrier + 0.27 * dSelect)
  const sustainabilityScore = G === 0 ? 0 : (0.62 * dStab + 0.38 * dSelect)
  const completeness = getDescriptorCompleteness(candidate)
  const lowIndicatorCount = [dStab, dBarrier, dSelect].filter(value => Number(value) < 0.5).length
  const missingCount = Object.values(candidate.scoreInputs || {}).filter(input => input?.missing).length
  const scoreSpreadPenalty = lowIndicatorCount >= 2 ? 0.12 : lowIndicatorCount === 1 ? 0.06 : 0
  const confidenceBase = (evidenceScore * 0.48) + (completeness.ratio * 0.28) + ((1 - missingCount / INDICATORS.length) * 0.24) - scoreSpreadPenalty
  let rankingConfidence = { label: "High", zh: "高 High", tone: "calc", value: confidenceBase }
  if (Number(candidate.G) === 0 || confidenceBase < 0.58) rankingConfidence = { label: "Low", zh: "低 Low", tone: "warn", value: confidenceBase }
  else if (confidenceBase < 0.74) rankingConfidence = { label: "Medium", zh: "中 Medium", tone: "proxy", value: confidenceBase }
  const weightedDrivers = INDICATORS.map(indicator => ({
    key: indicator.key,
    label: indicator.label,
    zhLabel: indicator.zhLabel,
    score: candidate.scoreInputs?.[indicator.key]?.normalized ?? normalizeIndicatorScore(candidate, indicator.key).normalized,
    weight: Number(weights?.[indicator.key]) || 0,
  })).sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
  const strength = weightedDrivers[0]
  const weakness = [...weightedDrivers].sort((a, b) => a.score - b.score)[0]
  const whyHigh = Number(candidate.G) === 0
    ? {
      en: candidate.exclusionReason || "Hard-screen G = 0 prevents this candidate from entering the ranked set.",
      zh: candidate.exclusionReason || "硬筛 G = 0 使该候选不进入有效排序。",
    }
    : {
      en: `${strength.label} carries a ${Math.round(strength.weight * 100)}% ranking influence and has a normalized score of ${Number(strength.score).toFixed(2)}. The main uncertainty remains ${weakness.label} or evidence confidence.`,
      zh: `${strength.zhLabel}在当前权重下具有 ${Math.round(strength.weight * 100)}% 排序影响力，归一化得分为 ${Number(strength.score).toFixed(2)}。主要不确定性来自 ${weakness.zhLabel} 或证据置信度。`,
    }

  return {
    overallScore: candidate.D_expected,
    performanceScore,
    sustainabilityScore,
    evidenceScore,
    descriptorCompleteness: completeness,
    evidenceSource: inferEvidenceSource(candidate),
    rankingConfidence,
    whyHigh,
    topDriver: strength,
    mainWeakness: weakness,
  }
}

export function computeCandidateScores(candidates, weights) {
  const safeWeights = weights && typeof weights === "object" ? normalizeWeights(weights) : computeCriticWeights(candidates).weights
  const scored = (Array.isArray(candidates) ? candidates : []).map(candidate => {
    const G = Number(candidate.G) === 0 ? 0 : 1
    const scoreInputs = Object.fromEntries(
      INDICATORS.map(indicator => [indicator.key, normalizeIndicatorScore(candidate, indicator.key)])
    )
    const dStab = scoreInputs.d_stab.normalized
    const dBarrier = scoreInputs.d_barrier.normalized
    const dSelect = scoreInputs.d_select.normalized
    const raw = G === 0
      ? 0
      : (dStab ** safeWeights.d_stab) * (dBarrier ** safeWeights.d_barrier) * (dSelect ** safeWeights.d_select)
    const confidence = clipScore(candidate.confidence_Q, 0, 1)
    const expected = raw * confidence
    const row = {
      ...candidate,
      d_stab_clipped: dStab,
      d_barrier_clipped: dBarrier,
      d_select_clipped: dSelect,
      confidence_Q_clipped: confidence,
      scoreInputs,
      D_raw: raw,
      D_expected: expected,
      status: getCandidateStatus(expected, G),
    }
    return {
      ...row,
      ...deriveCandidateMetrics(row, safeWeights),
    }
  })
  const sorted = scored.sort((a, b) => {
    if (Number(a.G) === 0 && Number(b.G) !== 0) return 1
    if (Number(a.G) !== 0 && Number(b.G) === 0) return -1
    return b.D_expected - a.D_expected
  })
  let rank = 0
  return sorted.map(candidate => {
    if (Number(candidate.G) === 0) return { ...candidate, rank: null }
    rank += 1
    return { ...candidate, rank }
  })
}

export function getDataGapRecommendations(candidate) {
  if (!candidate) return []
  if (Number(candidate.G) === 0) {
    return [{
      limitation: candidate.exclusionReason || "Hard-screen exclusion",
      nextEvidence: "Re-check exclusion constraint before ranking this candidate.",
      priority: "High",
    }]
  }
  const gaps = []
  const inputs = candidate.scoreInputs || Object.fromEntries(
    INDICATORS.map(indicator => [indicator.key, normalizeIndicatorScore(candidate, indicator.key)])
  )
  if (inputs.d_stab?.missing) {
    gaps.push({
      limitation: "170 C aqueous stability is unknown / not reported",
      nextEvidence: "Add XRD/BET/ICP after 170 C aqueous exposure before treating stability as validated.",
      priority: "High",
    })
  }
  if (inputs.d_barrier?.missing) {
    gaps.push({
      limitation: "Formate-pathway barrier is unknown / not reported",
      nextEvidence: "Run unified DFT for HCOO* formation or desorption barrier.",
      priority: "High",
    })
  }
  if (inputs.d_select?.missing) {
    gaps.push({
      limitation: "Byproduct-risk evidence is unknown / not reported",
      nextEvidence: "Add HPLC/IC/NMR product distribution for acetate/lactate side paths.",
      priority: "Medium",
    })
  }
  if (!inputs.d_stab?.missing && Number(candidate.d_stab) < 0.5) {
    gaps.push({
      limitation: "Hydrothermal stability score below 0.50",
      nextEvidence: "Add XRD/BET/ICP after 170 C aqueous exposure.",
      priority: "High",
    })
  }
  if (!inputs.d_barrier?.missing && Number(candidate.d_barrier) < 0.5) {
    gaps.push({
      limitation: "Formate-pathway barrier score below 0.50",
      nextEvidence: "Run unified DFT for HCOO* formation or desorption barrier.",
      priority: "High",
    })
  }
  if (!inputs.d_select?.missing && Number(candidate.d_select) <= 0.5) {
    gaps.push({
      limitation: "Byproduct-risk score at or below 0.50",
      nextEvidence: "Add HPLC/IC/NMR product distribution for acetate/lactate side paths.",
      priority: "Medium",
    })
  }
  if (Number(candidate.confidence_Q) < 0.6) {
    gaps.push({
      limitation: "Evidence confidence below 0.60",
      nextEvidence: "Add higher-level evidence with DOI, DFT record, or controlled experiment.",
      priority: "Medium",
    })
  }
  if (!gaps.length) {
    gaps.push({
      limitation: "No critical threshold failure in the demo descriptor set",
      nextEvidence: candidate.dataGaps?.[0] || "Add replicate validation and source-level provenance.",
      priority: "Review",
    })
  }
  return gaps
}

function rankWithWeights(candidates, weights, mode = "expected") {
  const scoreKey = mode === "raw" ? "D_raw" : "D_expected"
  const ranked = computeCandidateScores(candidates, weights).sort((a, b) => {
    if (Number(a.G) === 0 && Number(b.G) !== 0) return 1
    if (Number(a.G) !== 0 && Number(b.G) === 0) return -1
    return b[scoreKey] - a[scoreKey]
  })
  let rank = 0
  return ranked.reduce((map, candidate) => {
    if (Number(candidate.G) === 0) {
      map[candidate.id] = "Excluded"
      return map
    }
    rank += 1
    map[candidate.id] = rank
    return map
  }, {})
}

function buildSensitivityRows(candidates, ranksByScheme) {
  return (Array.isArray(candidates) ? candidates : []).map(candidate => {
    const ranks = Object.fromEntries(ranksByScheme.map(scheme => [scheme.id, scheme.ranks[candidate.id]]))
    const numericRanks = Object.values(ranks).filter(Number.isFinite)
    const topThreeCount = numericRanks.filter(rank => rank <= 3).length
    const spread = numericRanks.length ? Math.max(...numericRanks) - Math.min(...numericRanks) : 0
    let robustness = "Mixed"
    if (Number(candidate.G) === 0) robustness = "Excluded"
    else if (Number(candidate.confidence_Q) < 0.6) robustness = "Evidence-limited"
    else if (topThreeCount >= 3) robustness = "Robust"
    else if (spread >= 3) robustness = "Weight-sensitive"
    return { id: candidate.id, name: candidate.name, ranks, robustness }
  })
}

export function computeSensitivityRanks(candidates, criticWeights) {
  const schemes = [
    { id: "critic", label: "CRITIC", zhLabel: "CRITIC", weights: normalizeWeights(criticWeights) },
    { id: "equal", label: "Equal Weight", zhLabel: "等权重 Equal", weights: CRITIC_WEIGHTING_MODES.find(mode => mode.id === "equal").weights },
    { id: "expert", label: "Expert Preset", zhLabel: "专家预设 Expert", weights: CRITIC_WEIGHTING_MODES.find(mode => mode.id === "expert").weights },
    { id: "custom", label: "Custom", zhLabel: "自定义 Custom", weights: CRITIC_WEIGHTING_MODES.find(mode => mode.id === "custom").weights },
  ]
  const rawRanksByScheme = schemes.map(scheme => ({
    ...scheme,
    ranks: rankWithWeights(candidates, scheme.weights, "raw"),
  }))
  const expectedRanksByScheme = schemes.map(scheme => ({
    ...scheme,
    ranks: rankWithWeights(candidates, scheme.weights, "expected"),
  }))
  return {
    schemes,
    modes: [
      {
        id: "raw",
        label: "Raw-score sensitivity based on D_raw",
        zh: "基于 D_raw 的原始评分敏感性",
        rows: buildSensitivityRows(candidates, rawRanksByScheme),
      },
      {
        id: "expected",
        label: "Confidence-adjusted sensitivity based on D_expected",
        zh: "基于 D_expected 的置信度修正敏感性",
        rows: buildSensitivityRows(candidates, expectedRanksByScheme),
      },
    ],
    rows: buildSensitivityRows(candidates, expectedRanksByScheme),
  }
}

function activeCandidateIds(candidates) {
  return (Array.isArray(candidates) ? candidates : [])
    .filter(candidate => Number(candidate.G) !== 0)
    .map(candidate => candidate.id)
}

function sortedRankEntries(rankMap) {
  return Object.entries(rankMap)
    .filter(([, rank]) => Number.isFinite(rank))
    .sort((a, b) => a[1] - b[1])
}

function topThreeIds(rankMap) {
  return sortedRankEntries(rankMap).slice(0, 3).map(([id]) => id)
}

function topThreeOverlap(baseTop3, comparisonTop3) {
  if (!baseTop3.length) return 0
  const comparison = new Set(comparisonTop3)
  return baseTop3.filter(id => comparison.has(id)).length / Math.min(3, baseTop3.length)
}

export function computeRankingRobustness(candidates, criticWeights) {
  const activeIds = activeCandidateIds(candidates)
  const schemes = [
    { id: "critic", label: "CRITIC", zhLabel: "CRITIC", weights: normalizeWeights(criticWeights) },
    { id: "equal", label: "Equal Weight", zhLabel: "等权重 Equal", weights: CRITIC_WEIGHTING_MODES.find(mode => mode.id === "equal").weights },
    { id: "expert", label: "Expert Preset", zhLabel: "专家预设 Expert", weights: CRITIC_WEIGHTING_MODES.find(mode => mode.id === "expert").weights },
  ]
  const schemeRanks = schemes.map(scheme => ({
    ...scheme,
    ranks: rankWithWeights(candidates, scheme.weights, "expected"),
  }))
  const baseTop3 = topThreeIds(schemeRanks[0]?.ranks || {})
  const top3Rows = schemeRanks.map(scheme => ({
    id: scheme.id,
    label: scheme.label,
    zhLabel: scheme.zhLabel,
    top3: topThreeIds(scheme.ranks),
  }))
  const consistencyScores = top3Rows.slice(1).map(row => topThreeOverlap(baseTop3, row.top3))
  const top3Consistency = consistencyScores.length
    ? consistencyScores.reduce((sum, value) => sum + value, 0) / consistencyScores.length
    : 1
  const removeOneRows = (Array.isArray(candidates) ? candidates : []).map(removed => {
    const subset = candidates.filter(candidate => candidate.id !== removed.id)
    const subsetWeights = computeCriticWeights(subset).weights
    const subsetRanks = rankWithWeights(subset, subsetWeights, "expected")
    const baseRanks = schemeRanks[0]?.ranks || {}
    const comparableIds = activeIds.filter(id => id !== removed.id)
    const shifts = comparableIds
      .map(id => Math.abs((Number(subsetRanks[id]) || 0) - (Number(baseRanks[id]) || 0)))
      .filter(Number.isFinite)
    const maxShift = shifts.length ? Math.max(...shifts) : 0
    const meanShift = shifts.length ? shifts.reduce((sum, value) => sum + value, 0) / shifts.length : 0
    const retainedTop3 = topThreeOverlap(baseTop3.filter(id => id !== removed.id), topThreeIds(subsetRanks))
    let stability = "Stable"
    let zhStability = "稳定 Stable"
    if (maxShift >= 3 || retainedTop3 < 0.5) {
      stability = "Sensitive"
      zhStability = "敏感 Sensitive"
    } else if (maxShift >= 2 || retainedTop3 < 0.67) {
      stability = "Moderate"
      zhStability = "中等 Moderate"
    }
    return {
      removedId: removed.id,
      removedName: removed.name,
      weights: subsetWeights,
      top3: topThreeIds(subsetRanks),
      maxShift,
      meanShift,
      retainedTop3,
      stability,
      zhStability,
    }
  })
  const maxRemoveOneShift = removeOneRows.reduce((max, row) => Math.max(max, row.maxShift), 0)
  let stability = { label: "Stable", zh: "稳定 Stable", tone: "calc" }
  if (top3Consistency < 0.5 || maxRemoveOneShift >= 3) {
    stability = { label: "Sensitive", zh: "敏感 Sensitive", tone: "warn" }
  } else if (top3Consistency < 0.84 || maxRemoveOneShift >= 2) {
    stability = { label: "Moderate", zh: "中等 Moderate", tone: "proxy" }
  }
  return {
    schemes,
    schemeRanks,
    top3Rows,
    top3Consistency,
    removeOneRows,
    maxRemoveOneShift,
    stability,
  }
}

function buildMissingDataSummary(candidates) {
  const rows = Array.isArray(candidates) ? candidates : []
  const totalCells = rows.length * INDICATORS.length
  const missingCells = rows.reduce((sum, candidate) => (
    sum + INDICATORS.filter(indicator => isMissingScore(candidate?.[indicator.key])).length
  ), 0)
  return {
    missingCells,
    totalCells,
    ratio: totalCells ? missingCells / totalCells : 0,
  }
}

function getWeightingModeConfig(modeId, criticWeights) {
  const mode = CRITIC_WEIGHTING_MODES.find(item => item.id === modeId) || CRITIC_WEIGHTING_MODES[0]
  return {
    ...mode,
    weights: mode.id === "critic" ? normalizeWeights(criticWeights) : normalizeWeights(mode.weights),
  }
}

function buildMethodSummary({ candidates, mode, robustness }) {
  const missingData = buildMissingDataSummary(candidates)
  return {
    weightingMode: mode.label,
    weightingModeZh: mode.zhLabel,
    normalizationMethod: "0.01-1 clipped benefit-style normalization; unknown descriptors use 0.50 as uncertainty placeholder.",
    normalizationMethodZh: "0.01-1 clipped benefit-style normalization；未知描述符以 0.50 作为不确定性占位。",
    directionAdjustment: "Cost or risk descriptors are transformed so higher values consistently mean stronger screening support.",
    directionAdjustmentZh: "cost / risk 类描述符已转换为 benefit direction，数值越高表示筛选支持越强。",
    candidateCount: Array.isArray(candidates) ? candidates.length : 0,
    indicatorCount: INDICATORS.length,
    missingDataRatio: missingData.ratio,
    missingData,
    rankingStability: robustness.stability,
  }
}

export function buildCriticScoringModel(candidates = CRITIC_SCORING_DEMO_CANDIDATES, weightingMode = "critic") {
  const critic = computeCriticWeights(candidates)
  const activeMode = getWeightingModeConfig(weightingMode, critic.weights)
  const scoredCandidates = computeCandidateScores(candidates, activeMode.weights)
  const sensitivity = computeSensitivityRanks(candidates, critic.weights)
  const robustness = computeRankingRobustness(candidates, critic.weights)
  const methodSummary = buildMethodSummary({ candidates, mode: activeMode, robustness })
  const indicatorDiagnostics = critic.decomposition.map(row => ({
    ...row,
    weight: activeMode.weights[row.key],
    criticWeight: critic.weights[row.key],
  }))
  return {
    ...critic,
    sourceCandidates: candidates,
    candidates: scoredCandidates,
    sensitivity,
    robustness,
    methodSummary,
    indicatorDiagnostics,
    weightingModes: CRITIC_WEIGHTING_MODES,
    activeWeightingMode: activeMode,
    activeWeights: activeMode.weights,
  }
}

export function findCriticCandidateByName(name, model = buildCriticScoringModel()) {
  const key = String(name || "").trim().toLowerCase()
  if (!key) return null
  return model.candidates.find(candidate => (
    String(candidate.name || "").toLowerCase() === key ||
    String(candidate.libraryName || "").toLowerCase() === key ||
    String(candidate.id || "").toLowerCase() === key
  )) || null
}
