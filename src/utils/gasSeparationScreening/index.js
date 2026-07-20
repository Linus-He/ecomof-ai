// @ts-nocheck
import { getEvidenceScore, getStabilityScore, rankGasCandidates } from "../gasScoring"
import { rankCapacityRecords } from "../gasCapacityRanking"

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const DEFAULT_GAS_RANKING_METHOD = "pareto-aps"

export const GAS_RANKING_REFERENCES = [
  {
    id: "iast-myers-prausnitz-1965",
    label: "Myers & Prausnitz 1965",
    doi: "10.1002/aic.690110125",
    url: "https://doi.org/10.1002/aic.690110125",
    note: "IAST foundation for estimating mixture adsorption from pure-component isotherms.",
    noteZh: "IAST 基础文献：从单组分等温线估计混合吸附。",
  },
  {
    id: "mof-co2-database-2018",
    label: "Altintas et al. 2018",
    doi: "10.1021/acsami.8b04600",
    url: "https://doi.org/10.1021/acsami.8b04600",
    note: "MOF screening metrics include selectivity, working capacity, APS, regenerability, and separation potential.",
    noteZh: "MOF 筛选指标包括选择性、工作容量、APS、可再生性与 separation potential。",
  },
  {
    id: "ranking-approaches-2022",
    label: "Altintas & Keskin 2022",
    doi: "10.1016/j.cherd.2022.01.030",
    url: "https://doi.org/10.1016/j.cherd.2022.01.030",
    note: "Compares MOF ranking by APS/R% and parasitic energy; rankings can differ by metric choice.",
    noteZh: "比较 APS/R% 与寄生能排序；不同指标会导致排序差异。",
  },
  {
    id: "process-metrics-warning-2016",
    label: "Rajagopalan et al. 2016",
    doi: "10.1016/j.ijggc.2015.12.033",
    url: "https://doi.org/10.1016/j.ijggc.2015.12.033",
    note: "Adsorbent screening metrics should not be treated as process-performance proof.",
    noteZh: "吸附剂筛选指标不能直接等同于过程性能证明。",
  },
  {
    id: "critic-1995",
    label: "Diakoulaki et al. 1995",
    doi: "10.1016/0305-0548(94)00059-H",
    url: "https://doi.org/10.1016/0305-0548(94)00059-H",
    note: "CRITIC derives objective weights from contrast intensity and conflict among criteria.",
    noteZh: "CRITIC 用指标区分度与冲突度计算客观权重。",
  },
]

export const GAS_RANKING_METHODS = [
  {
    id: "pareto-aps",
    label: "Pareto + APS",
    labelZh: "Pareto + APS（默认）",
    shortLabel: "Pareto",
    shortLabelZh: "Pareto",
    tone: "calc",
    formula: "non-dominated(selectivity, working capacity), APS = S × Cw",
    formulaZh: "非支配前沿(选择性, 工作容量)，APS = S × Cw",
    basis: "No subjective weights. Uses the selectivity vs working-capacity trade-off and APS as a transparent tie-breaker.",
    basisZh: "无主观权重。使用选择性与工作容量的权衡关系，并用 APS 作为透明的同前沿排序依据。",
    boundary: "Good for first-pass material screening; does not prove process performance.",
    boundaryZh: "适合第一轮材料筛选；不证明过程级性能。",
    referenceIds: ["mof-co2-database-2018", "process-metrics-warning-2016"],
  },
  {
    id: "aps-regenerability",
    label: "APS × R%",
    labelZh: "APS × R%",
    shortLabel: "APS×R",
    shortLabelZh: "APS×R",
    tone: "info",
    formula: "APS_R = selectivity × workingCapacity × regenerability / 100",
    formulaZh: "APS_R = 选择性 × 工作容量 × 可再生性 / 100",
    basis: "Keeps APS and percent regenerability together without adding a subjective weighting vector.",
    basisZh: "把 APS 与可再生性一起看，不额外加入主观权重向量。",
    boundary: "Requires selectivity, working capacity, and regenerability fields.",
    boundaryZh: "需要选择性、工作容量与可再生性字段同时存在。",
    referenceIds: ["mof-co2-database-2018", "ranking-approaches-2022"],
  },
  {
    id: "critic-objective",
    label: "CRITIC objective weights",
    labelZh: "CRITIC 客观赋权",
    shortLabel: "CRITIC",
    shortLabelZh: "CRITIC",
    tone: "warn",
    formula: "Cj = σj × Σ(1 - rjk), wj = Cj / ΣCj",
    formulaZh: "Cj = σj × Σ(1 - rjk)，wj = Cj / ΣCj",
    basis: "Weights are derived from the current candidate matrix, not assigned by intuition.",
    basisZh: "权重由当前候选矩阵计算，不由直觉指定。",
    boundary: "CRITIC describes current-data information content; it is not a physical law and should be sensitivity-checked.",
    boundaryZh: "CRITIC 描述当前数据的信息量，不是物理定律，需要做敏感性检查。",
    referenceIds: ["critic-1995", "process-metrics-warning-2016"],
  },
  {
    id: "legacy-gasscore",
    label: "Legacy GasScore",
    labelZh: "历史 GasScore 参考",
    shortLabel: "GasScore",
    shortLabelZh: "GasScore",
    tone: "proxy",
    formula: "GasScore = 100 × Σ(wi × normalized metric i) - riskPenalty",
    formulaZh: "GasScore = 100 × Σ(wi × 归一化指标 i) - 风险扣分",
    basis: "Engineering heuristic retained for continuity and UI diagnostics only.",
    basisZh: "为连续性与 UI 诊断保留的工程启发式，不作为默认科研排序。",
    boundary: "Weights are not literature-authoritative; do not cite this as a validated separation ranking.",
    boundaryZh: "权重并非文献权威；不能把它引用为已验证分离排序。",
    referenceIds: ["process-metrics-warning-2016"],
  },
]

export const GAS_SCREENING_GATES = [
  { id: "all", label: "All records", labelZh: "全部记录", description: "Records in the selected gas pair.", descriptionZh: "当前气体对中的全部记录。" },
  { id: "selectivity", label: "Selectivity available", labelZh: "有选择性", description: "Records with selectivity or IAST selectivity.", descriptionZh: "具备选择性或 IAST 选择性的记录。" },
  { id: "working-capacity", label: "Working capacity available", labelZh: "有工作容量", description: "Records with working capacity under the selected pressure window.", descriptionZh: "在当前压力窗口下具备工作容量的记录。" },
  { id: "aps-eligible", label: "APS eligible", labelZh: "可计算 APS", description: "Records with both selectivity and working capacity.", descriptionZh: "同时具备选择性与工作容量的记录。" },
  { id: "regenerability-eligible", label: "APS × R% eligible", labelZh: "可计算 APS×R%", description: "Records with APS and regenerability.", descriptionZh: "同时具备 APS 与可再生性的记录。" },
  { id: "pareto-frontier", label: "Pareto frontier", labelZh: "Pareto 前沿", description: "Non-dominated candidates by selectivity and working capacity.", descriptionZh: "选择性与工作容量维度上的非支配候选。" },
  { id: "validation-ready", label: "Validation-ready evidence", labelZh: "验证优先证据", description: "A/B evidence, experimental/computed records, or confidence >= 0.72.", descriptionZh: "A/B 证据、实验/计算记录或置信度 >= 0.72。" },
]

const CRITIC_METRICS = [
  { key: "primaryUptake", label: "uptake", labelZh: "吸附量" },
  { key: "selectivity", label: "selectivity", labelZh: "选择性" },
  { key: "workingCapacity", label: "working capacity", labelZh: "工作容量" },
  { key: "regenerability", label: "regenerability", labelZh: "可再生性" },
  { key: "stability", label: "stability", labelZh: "稳定性" },
]

export function getGasRankingMethod(methodId) {
  return GAS_RANKING_METHODS.find(method => method.id === methodId) || GAS_RANKING_METHODS.find(method => method.id === DEFAULT_GAS_RANKING_METHOD)
}

function selectivityValue(row = {}) {
  return finite(row.metrics?.selectivity ?? row.selectivity ?? row.metrics?.iaSTSelectivity ?? row.iaSTSelectivity)
}

function metricValue(row = {}, metric = "") {
  if (metric === "selectivity") return selectivityValue(row)
  if (metric === "stability") return getStabilityScore(row)
  if (metric === "evidence") return getEvidenceScore(row)
  return finite(row[metric] ?? row.metrics?.[metric])
}

function normalizedValue(value, domain) {
  const number = finite(value)
  if (number === null) return null
  const [min, max] = domain
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return 0.72
  return Math.max(0, Math.min(1, (number - min) / (max - min)))
}

function domainFor(values = []) {
  const nums = values.map(finite).filter(value => value !== null)
  if (!nums.length) return [0, 1]
  return [Math.min(...nums), Math.max(...nums)]
}

function mean(values = []) {
  const nums = values.filter(Number.isFinite)
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0
}

function standardDeviation(values = []) {
  const nums = values.filter(Number.isFinite)
  if (nums.length <= 1) return 0
  const avg = mean(nums)
  const variance = nums.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (nums.length - 1)
  return Math.sqrt(Math.max(0, variance))
}

function pearson(valuesA = [], valuesB = []) {
  const pairs = valuesA
    .map((value, index) => [value, valuesB[index]])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
  if (pairs.length <= 2) return 0
  const avgA = mean(pairs.map(([a]) => a))
  const avgB = mean(pairs.map(([, b]) => b))
  const numerator = pairs.reduce((sum, [a, b]) => sum + (a - avgA) * (b - avgB), 0)
  const denomA = Math.sqrt(pairs.reduce((sum, [a]) => sum + (a - avgA) ** 2, 0))
  const denomB = Math.sqrt(pairs.reduce((sum, [, b]) => sum + (b - avgB) ** 2, 0))
  if (!denomA || !denomB) return 0
  return Math.max(-1, Math.min(1, numerator / (denomA * denomB)))
}

function formatScoreNumber(value, digits = 1) {
  const number = finite(value)
  if (number === null) return "pending"
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

export function buildGasCriticModel(rows = []) {
  const domains = Object.fromEntries(CRITIC_METRICS.map(metric => [
    metric.key,
    domainFor(rows.map(row => metricValue(row, metric.key))),
  ]))
  const columns = Object.fromEntries(CRITIC_METRICS.map(metric => [
    metric.key,
    rows.map(row => normalizedValue(metricValue(row, metric.key), domains[metric.key])),
  ]))
  const activeMetrics = CRITIC_METRICS.filter(metric => {
    const values = columns[metric.key].filter(value => value !== null)
    const unique = new Set(values.map(value => value.toFixed(6)))
    return values.length >= 3 && unique.size > 1
  })
  const safeMetrics = activeMetrics.length ? activeMetrics : CRITIC_METRICS.slice(0, 1)
  const information = Object.fromEntries(safeMetrics.map(metric => {
    const values = columns[metric.key].filter(value => value !== null)
    const sigma = standardDeviation(values)
    const conflict = safeMetrics.reduce((sum, other) => {
      if (other.key === metric.key) return sum
      return sum + (1 - pearson(columns[metric.key], columns[other.key]))
    }, 0)
    return [metric.key, Math.max(0, sigma * (conflict || 1))]
  }))
  const totalInformation = Object.values(information).reduce((sum, value) => sum + value, 0)
  const weights = totalInformation > 0
    ? Object.fromEntries(safeMetrics.map(metric => [metric.key, information[metric.key] / totalInformation]))
    : Object.fromEntries(safeMetrics.map(metric => [metric.key, 1 / safeMetrics.length]))
  const normalizedRows = Object.fromEntries(rows.map((row, rowIndex) => [
    row.id,
    Object.fromEntries(safeMetrics.map(metric => [metric.key, columns[metric.key][rowIndex]])),
  ]))
  return {
    metrics: safeMetrics,
    domains,
    information,
    weights,
    normalizedRows,
  }
}

function evidenceGate(row = {}) {
  const level = String(row.evidenceLevel || "D").toUpperCase()
  const dataGrade = String(row.dataGrade || "").toLowerCase()
  return ["A", "B"].includes(level) || ["experimental", "computed", "computed-iast"].includes(dataGrade) || Number(row.confidence || 0) >= 0.72
}

function buildLiteratureMetricBundle(row = {}, criticModel, paretoIds, apsDomain, apsRegenerabilityDomain) {
  const selectivity = selectivityValue(row)
  const workingCapacity = metricValue(row, "workingCapacity")
  const regenerability = metricValue(row, "regenerability")
  const aps = selectivity !== null && workingCapacity !== null ? selectivity * workingCapacity : null
  const apsRegenerability = aps !== null && regenerability !== null ? aps * (regenerability / 100) : null
  const criticValues = criticModel.normalizedRows[row.id] || {}
  const criticCompleteness = criticModel.metrics.length
    ? criticModel.metrics.filter(metric => criticValues[metric.key] !== null).length / criticModel.metrics.length
    : 0
  const criticScore = criticModel.metrics.reduce((sum, metric) => {
    const value = criticValues[metric.key]
    return sum + (criticModel.weights[metric.key] || 0) * (value === null ? 0 : value)
  }, 0) * 100
  const paretoFrontier = paretoIds.has(row.id)
  const apsNorm = normalizedValue(aps, apsDomain) ?? 0
  const apsRegenerabilityNorm = normalizedValue(apsRegenerability, apsRegenerabilityDomain) ?? 0
  const flags = {
    hasSelectivity: selectivity !== null,
    hasWorkingCapacity: workingCapacity !== null,
    hasRegenerability: regenerability !== null,
    apsEligible: aps !== null,
    regenerabilityEligible: apsRegenerability !== null,
    paretoFrontier,
    validationReady: evidenceGate(row),
  }
  return {
    selectivity,
    workingCapacity,
    regenerability,
    aps,
    apsRegenerability,
    apsNorm,
    apsRegenerabilityNorm,
    paretoFrontier,
    paretoTier: paretoFrontier ? 0 : 1,
    criticScore: Number.isFinite(criticScore) ? criticScore : null,
    criticCompleteness,
    criticWeights: criticModel.weights,
    flags,
  }
}

function compareFiniteDesc(a, b) {
  const av = finite(a)
  const bv = finite(b)
  if (av !== null && bv !== null) return bv - av
  if (av !== null) return -1
  if (bv !== null) return 1
  return 0
}

function methodSortTuple(row = {}, methodId = DEFAULT_GAS_RANKING_METHOD) {
  const screen = row.gasScreening || {}
  if (methodId === "aps-regenerability") {
    return [
      screen.flags?.regenerabilityEligible ? 1 : 0,
      finite(screen.apsRegenerability) ?? -Infinity,
      finite(screen.aps) ?? -Infinity,
      getEvidenceScore(row),
    ]
  }
  if (methodId === "critic-objective") {
    return [
      finite(screen.criticScore) !== null ? 1 : 0,
      finite(screen.criticScore) ?? -Infinity,
      finite(screen.criticCompleteness) ?? 0,
      finite(screen.aps) ?? -Infinity,
    ]
  }
  if (methodId === "legacy-gasscore") {
    return [
      finite(row.score) !== null ? 1 : 0,
      finite(row.score) ?? -Infinity,
      getEvidenceScore(row),
      finite(screen.aps) ?? -Infinity,
    ]
  }
  return [
    screen.flags?.apsEligible ? 1 : 0,
    screen.paretoFrontier ? 1 : 0,
    finite(screen.aps) ?? -Infinity,
    getEvidenceScore(row),
  ]
}

export function gasMethodScore(row = {}, methodId = DEFAULT_GAS_RANKING_METHOD) {
  const screen = row.gasScreening || {}
  if (methodId === "aps-regenerability") return screen.flags?.regenerabilityEligible ? screen.apsRegenerabilityNorm * 100 : null
  if (methodId === "critic-objective") return finite(screen.criticScore)
  if (methodId === "legacy-gasscore") return finite(row.score)
  const apsScore = screen.apsNorm == null ? 0 : screen.apsNorm * 100
  if (!screen.flags?.apsEligible) return null
  return (screen.paretoFrontier ? 100 : 0) + apsScore
}

export function gasMethodScoreLabel(row = {}, methodId = DEFAULT_GAS_RANKING_METHOD, lang = "zh") {
  const screen = row.gasScreening || {}
  if (methodId === "aps-regenerability") {
    return screen.apsRegenerability == null ? (lang === "zh" ? "pending" : "pending") : `APS×R ${formatScoreNumber(screen.apsRegenerability, 1)}`
  }
  if (methodId === "critic-objective") {
    return screen.criticScore == null ? "pending" : `CRITIC ${formatScoreNumber(screen.criticScore, 1)}/100`
  }
  if (methodId === "legacy-gasscore") {
    return row.score == null ? "pending" : `GasScore ${formatScoreNumber(row.score, 0)}/100`
  }
  if (screen.aps == null) return "pending"
  return `${screen.paretoFrontier ? (lang === "zh" ? "前沿" : "frontier") : (lang === "zh" ? "非前沿" : "dominated")} · APS ${formatScoreNumber(screen.aps, 1)}`
}

export function sortGasRowsByMethod(rows = [], methodId = DEFAULT_GAS_RANKING_METHOD) {
  const method = getGasRankingMethod(methodId)
  return [...rows].sort((a, b) => {
    const at = methodSortTuple(a, method.id)
    const bt = methodSortTuple(b, method.id)
    for (let index = 0; index < Math.max(at.length, bt.length); index += 1) {
      const diff = compareFiniteDesc(at[index], bt[index])
      if (diff) return diff
    }
    return String(a.displayName || "").localeCompare(String(b.displayName || ""))
  })
}

export function matchesGasScreeningGate(row = {}, gateId = "all") {
  const flags = row.gasScreening?.flags || {}
  if (gateId === "selectivity") return Boolean(flags.hasSelectivity)
  if (gateId === "working-capacity") return Boolean(flags.hasWorkingCapacity)
  if (gateId === "aps-eligible") return Boolean(flags.apsEligible)
  if (gateId === "regenerability-eligible") return Boolean(flags.regenerabilityEligible)
  if (gateId === "pareto-frontier") return Boolean(flags.paretoFrontier)
  if (gateId === "validation-ready") return Boolean(flags.validationReady)
  return true
}

function buildScreeningFunnel(rows = []) {
  const total = rows.length || 1
  return GAS_SCREENING_GATES.map(gate => {
    const gateRows = rows.filter(row => matchesGasScreeningGate(row, gate.id))
    return {
      ...gate,
      count: gateRows.length,
      rowIds: gateRows.map(row => row.id),
      fraction: gateRows.length / total,
    }
  })
}

function buildMethodRankings(rows = []) {
  const rankings = Object.fromEntries(GAS_RANKING_METHODS.map(method => [
    method.id,
    sortGasRowsByMethod(rows, method.id).map((row, index) => ({
      id: row.id,
      displayName: row.displayName,
      rank: index + 1,
      score: gasMethodScore(row, method.id),
      scoreLabelZh: gasMethodScoreLabel(row, method.id, "zh"),
      scoreLabel: gasMethodScoreLabel(row, method.id, "en"),
      dataGrade: row.dataGrade,
      evidenceLevel: row.evidenceLevel,
    })),
  ]))
  const rankMaps = Object.fromEntries(Object.entries(rankings).map(([methodId, rowsForMethod]) => [
    methodId,
    Object.fromEntries(rowsForMethod.map(row => [row.id, row.rank])),
  ]))
  const topCounts = rows.map(row => {
    const appearances = GAS_RANKING_METHODS
      .map(method => rankMaps[method.id]?.[row.id])
      .filter(rank => Number.isFinite(rank) && rank <= 10)
    return {
      id: row.id,
      displayName: row.displayName,
      appearances: appearances.length,
      bestRank: appearances.length ? Math.min(...appearances) : null,
      averageRank: appearances.length ? appearances.reduce((sum, rank) => sum + rank, 0) / appearances.length : null,
      methods: GAS_RANKING_METHODS.filter(method => (rankMaps[method.id]?.[row.id] || Infinity) <= 10).map(method => method.id),
    }
  }).filter(row => row.appearances > 1)
    .sort((a, b) => b.appearances - a.appearances || a.averageRank - b.averageRank || String(a.displayName).localeCompare(String(b.displayName)))
  return { rankings, rankMaps, consensus: topCounts.slice(0, 8) }
}

function enrichRowsWithLiteratureMetrics(rows = [], scenario = {}) {
  const paretoRows = getParetoFrontier(rows)
  const paretoIds = new Set(paretoRows.map(row => row.id))
  const criticModel = buildGasCriticModel(rows)
  const rawMetrics = rows.map(row => {
    const selectivity = selectivityValue(row)
    const workingCapacity = metricValue(row, "workingCapacity")
    const regenerability = metricValue(row, "regenerability")
    const aps = selectivity !== null && workingCapacity !== null ? selectivity * workingCapacity : null
    return {
      id: row.id,
      aps,
      apsRegenerability: aps !== null && regenerability !== null ? aps * (regenerability / 100) : null,
    }
  })
  const apsDomain = domainFor(rawMetrics.map(row => row.aps))
  const apsRegenerabilityDomain = domainFor(rawMetrics.map(row => row.apsRegenerability))
  return rows.map(row => ({
    ...row,
    gasScreening: {
      ...(row.gasScreening || {}),
      methodId: scenario.rankingMethod || DEFAULT_GAS_RANKING_METHOD,
      activeMethod: getGasRankingMethod(scenario.rankingMethod || DEFAULT_GAS_RANKING_METHOD),
      legacyGasScore: row.score,
      ...buildLiteratureMetricBundle(row, criticModel, paretoIds, apsDomain, apsRegenerabilityDomain),
    },
  }))
}

export function getParetoFrontier(rows = [], xKey = "workingCapacity", yKey = "selectivity") {
  const metricValue = (row, key) => key === "selectivity"
    ? finite(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity)
    : finite(row[key] ?? row.metrics?.[key])
  const points = rows
    .map(row => ({ row, x: metricValue(row, xKey), y: metricValue(row, yKey) }))
    .filter(point => point.x !== null && point.y !== null)
  return points
    .filter(point => !points.some(other => (
      other !== point &&
      other.x >= point.x &&
      other.y >= point.y &&
      (other.x > point.x || other.y > point.y)
    )))
    .sort((a, b) => a.x - b.x)
    .map(point => point.row)
}

export function summarizeGasScreeningCoverage(records = [], scenario = {}) {
  const gasPair = String(scenario.gasPair || "").toUpperCase()
  const rows = records.filter(record => !gasPair || String(record.gasPair || "").toUpperCase() === gasPair)
  const gradeCounts = rows.reduce((acc, record) => {
    const grade = record.dataGrade || record.evidence?.dataGrade || "unknown"
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})
  const selectivityValue = row => finite(row.metrics?.selectivity ?? row.selectivity ?? row.metrics?.iaSTSelectivity ?? row.iaSTSelectivity)
  const iastValue = row => finite(row.metrics?.iaSTSelectivity ?? row.iaSTSelectivity)
  const experimentalSelectivity = rows.filter(row => {
    const sourceType = String(row.fieldSources?.selectivity?.sourceType || "")
    return selectivityValue(row) !== null && (sourceType.includes("mixture") || row.baseDataGrade === "experimental")
  }).length
  const linkedToStructure = rows.filter(row => Number(row.structuralLinkCount || 0) > 0 || String(row.identityStatus || "").includes("structural")).length
  return {
    gasPair: scenario.gasPair,
    total: rows.length,
    experimental: gradeCounts.experimental || 0,
    computed: gradeCounts.computed || 0,
    computedIast: gradeCounts["computed-IAST"] || 0,
    seed: gradeCounts.seed || 0,
    withIsotherm: rows.filter(row => Array.isArray(row.isotherm) && row.isotherm.length >= 2).length,
    withSelectivity: rows.filter(row => selectivityValue(row) !== null).length,
    withIastSelectivity: rows.filter(row => iastValue(row) !== null).length,
    withExperimentalSelectivity: experimentalSelectivity,
    withWorkingCapacity: rows.filter(row => finite(row.metrics?.workingCapacity ?? row.workingCapacity) !== null).length,
    linkedToStructure,
    gradeCounts,
    thin: rows.length < 20 || rows.filter(row => selectivityValue(row) !== null).length < 5,
  }
}

export function buildGasSeparationScreening(records = [], scenario = {}) {
  const capacityRows = rankCapacityRecords(records, {
    gasPair: scenario.gasPair,
    adsorptionPressureBar: scenario.adsorptionPressureBar ?? scenario.pressureBar,
    desorptionPressureBar: scenario.desorptionPressureBar,
  })
  const scoredRecords = rankGasCandidates(capacityRows, scenario)
  const enrichedRows = enrichRowsWithLiteratureMetrics(scoredRecords, scenario)
  const methodRankings = buildMethodRankings(enrichedRows)
  const methodId = getGasRankingMethod(scenario.rankingMethod || DEFAULT_GAS_RANKING_METHOD).id
  const rankedRecords = sortGasRowsByMethod(enrichedRows, methodId).map((row, index) => ({
    ...row,
    gasScreening: {
      ...row.gasScreening,
      methodId,
      activeMethod: getGasRankingMethod(methodId),
      methodRank: index + 1,
      methodRanks: Object.fromEntries(GAS_RANKING_METHODS.map(method => [method.id, methodRankings.rankMaps[method.id]?.[row.id] || null])),
      methodScore: gasMethodScore(row, methodId),
      methodScoreLabelZh: gasMethodScoreLabel(row, methodId, "zh"),
      methodScoreLabel: gasMethodScoreLabel(row, methodId, "en"),
    },
  }))
  return {
    rankedRecords,
    methodId,
    methods: GAS_RANKING_METHODS,
    references: GAS_RANKING_REFERENCES,
    methodRankings: methodRankings.rankings,
    rankingStability: methodRankings.consensus,
    screeningFunnel: buildScreeningFunnel(enrichedRows),
    paretoFrontier: getParetoFrontier(enrichedRows),
    coverage: summarizeGasScreeningCoverage(capacityRows, scenario),
  }
}
