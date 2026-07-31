/**
 * Organic Acid Score Provenance builders (V3.9.10).
 *
 * Turns the Step Why Panel into a real score explainer: raw / proxy fields ->
 * normalized value -> weight or factor -> sub-contribution -> weighted-sum or
 * weighted-geometric compression -> final score -> rank -> why it leads runner-ups.
 *
 * Everything is derived from the host-guest workbench (hostSelection /
 * guestSelection / complementarity scoreBreakdown / provenance). No candidate
 * name, metal, or HGCPS value is hardcoded; no undefined / null / NaN leaks.
 */
import {
  GUEST_SCORE_WEIGHTS,
  HGCPS_FORMULA_TEXT,
  HOST_SCORE_WEIGHTS,
  ROUTE_FACTOR_DEFINITIONS,
  ROUTE_SCORE_WEIGHTS,
  safeNumber,
} from "../organicAcidHostGuest/index.js"

export const ORGANIC_ACID_SCORE_PROVENANCE_VERSION = "V3.9.10"

const HOST_DATA_FILE = "organic_acid_host_guest/host_mof_candidates.json"
const GUEST_DATA_FILE = "organic_acid_host_guest/guest_metal_candidates.json"
const ROUTE_DATA_FILE = "organic_acid_host_guest/host_guest_routes.json"

export const SCORE_HEADER_NOTE_ZH = "该分数是路线优先级评分，不是催化性能预测值。"
export const SCORE_HEADER_NOTE_EN = "This score is a route-priority score, not a catalytic-performance prediction."
export const RISK_RETENTION_NOTE_ZH = "Risk Retention Factor 是 0–1 的风险保留系数，会压低路线评分；它表示证据不足或风险待验证，不等于实验已证伪。"
export const RISK_RETENTION_NOTE_EN = "The Risk Retention Factor is a 0-1 risk-retention coefficient that lowers the route score; it means evidence is insufficient or risk is unverified, not that the experiment has been falsified."

export const SCORE_BOUNDARY_STATEMENTS = [
  { id: "data", zh: "本结果基于 seed / proxy / curated 数据，非真实实验测量。", en: "This result is based on seed / proxy / curated data, not real experimental measurement." },
  { id: "planning", zh: "实验规划可启用，但尚未完成同条件性能验证。", en: "Experiment planning is enabled, but same-condition performance validation is not complete." },
  { id: "priority", zh: "算法输出的是实验验证优先级，不是催化性能结论。", en: "The algorithm outputs experimental-validation priority, not a catalytic-performance conclusion." },
  { id: "risk", zh: RISK_RETENTION_NOTE_ZH, en: RISK_RETENTION_NOTE_EN },
]

const HOST_FACTOR_LABELS = {
  stabilityProxy: ["主体稳定性代理", "Host stability proxy"],
  aqueousStabilityEvidence: ["水相稳定性证据", "Aqueous stability evidence"],
  thermalStabilityEvidence: ["热稳定性证据", "Thermal stability evidence"],
  poreEnvironmentScore: ["孔环境", "Pore environment"],
  co2EnrichmentSupport: ["CO₂ 富集支持", "CO2 enrichment support"],
  ligandPathwaySupport: ["配体路径支持", "Ligand pathway support"],
  postModificationFeasibility: ["后修饰可行性", "Post-modification feasibility"],
  guestHostingFeasibility: ["客体承载可行性", "Guest hosting feasibility"],
  synthesizabilityScore: ["合成条件可及性", "Synthesis-condition accessibility"],
  provenanceQuality: ["溯源质量", "Provenance quality"],
}

const GUEST_FACTOR_LABELS = {
  co2ActivationScore: ["CO₂ 活化", "CO2 activation"],
  formateStabilizationScore: ["HCOO* 稳定", "HCOO* stabilization"],
  electronTransferSupport: ["电子转移", "Electron transfer"],
  compatibilityWithAlMof: ["主体兼容性", "Compatibility with selected host"],
  dopingFeasibility: ["掺杂可行性", "Doping feasibility"],
  postModificationFeasibility: ["后修饰可行性", "Post-modification feasibility"],
  bimetallicConstructionFeasibility: ["双金属构建可行性", "Bimetallic construction feasibility"],
}

const ROUTE_FACTOR_LABELS = {
  hostStability: ["主体稳定性", "Host stability"],
  hostPathwaySupport: ["主体路径支持", "Host pathway support"],
  guestActivityCompensation: ["客体活性补偿", "Guest activity compensation"],
  complementarity: ["主客体互补", "Host-guest complementarity"],
  evidence: ["证据置信", "Evidence confidence"],
  riskRetentionFactor: ["风险保留", "Risk retention"],
  synthesizability: ["合成条件可及性", "Synthesis-condition accessibility"],
  economics: ["经济性 LCC", "Economic LCC"],
}

const GRADE_META = {
  seed: { labelZh: "种子数据", labelEn: "Seed", tone: "info" },
  proxy: { labelZh: "代理数据", labelEn: "Proxy", tone: "warn" },
  curated: { labelZh: "人工整理", labelEn: "Curated", tone: "good" },
  inferred: { labelZh: "推断数据", labelEn: "Inferred", tone: "muted" },
}

const LEVEL_THRESHOLDS = {
  high: 0.85,
  medium: 0.65,
}

const COUNTERFACTUAL_VALUES = [0.5, 0.7, 0.9, 1.0]

const FACTOR_EVIDENCE_KEYWORDS = {
  stabilityProxy: ["stability", "stable", "aqueous", "water", "hydrothermal", "170c", "pxrd", "leaching", "bond"],
  aqueousStabilityEvidence: ["aqueous", "water", "hydrothermal", "170c", "pxrd", "leaching", "stability"],
  thermalStabilityEvidence: ["thermal", "hydrothermal", "170c", "stability"],
  poreEnvironmentScore: ["pore", "surface area", "pore volume", "co2 enrichment", "diffusion", "access"],
  co2EnrichmentSupport: ["co2", "enrichment", "adsorption", "affinity", "uptake"],
  postModificationFeasibility: ["post-modification", "modification", "doping", "introduction", "feasibility"],
  guestHostingFeasibility: ["guest", "hosting", "compatibility", "coordination", "bimetallic"],
  provenanceQuality: ["provenance", "curation", "field-level", "evidence"],
  co2ActivationScore: ["co2 activation", "lewis", "open metal", "charge", "activation"],
  formateStabilizationScore: ["hcoo", "formate", "intermediate", "binding", "stabilization"],
  electronTransferSupport: ["electron", "redox", "pcet", "proton", "transfer"],
  compatibilityWithAlMof: ["compatibility", "host", "coordination", "guest", "bimetallic"],
  dopingFeasibility: ["doping", "introduction", "feasibility", "post-modification"],
  bimetallicConstructionFeasibility: ["bimetallic", "construction", "coordination", "guest"],
  hostStability: ["stability", "aqueous", "hydrothermal", "170c", "pxrd", "leaching", "bond"],
  hostPathwaySupport: ["pathway", "co2 enrichment", "pore", "lewis", "descriptor", "diffusion"],
  synthesizability: ["synthesis", "temperature", "time", "condition", "accessibility", "feasibility"],
  economics: ["economic", "cost", "price", "precursor", "lcc"],
  guestActivityCompensation: ["guest", "co2 activation", "hcoo", "formate", "electron", "redox", "doping", "bimetallic"],
  complementarity: ["complementarity", "compatibility", "host-guest", "coordination", "post-modification", "bimetallic"],
  evidence: ["evidence", "confidence", "same-condition", "curation", "provenance"],
  riskRetentionFactor: ["risk", "missing", "penalty", "limitation", "same-condition", "leaching", "170c", "uncertain"],
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeText(value, fallback = "pending") {
  if (value === undefined || value === null) return fallback
  const next = String(value).trim()
  return next || fallback
}

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

function clamp01(value) {
  return Math.max(0, Math.min(1, safeNumber(value, 0)))
}

export function deriveDataGrade(provenance) {
  const text = asArray(provenance).join(" ").toLowerCase()
  if (text.includes("seed")) return "seed"
  if (text.includes("curated")) return "curated"
  if (text.includes("proxy")) return "proxy"
  if (/(inferred|prior|expert|derived|estimate|literature)/.test(text)) return "inferred"
  return "proxy"
}

function factorDataGrade(fieldKey, baseGrade) {
  const key = String(fieldKey || "").toLowerCase()
  if (key.includes("risk")) return "inferred"
  if (key.includes("evidence")) return "curated"
  if (key.includes("provenance")) return "curated"
  if (key.includes("proxy")) return "proxy"
  return baseGrade
}

function curationFromProvenance(provenance, fallback = "proxy / curated") {
  const rows = asArray(provenance).map(item => safeText(item, "")).filter(Boolean)
  return rows.length ? rows.join(" / ") : fallback
}

function buildWeightedRows(entry, weights, labels, baseGrade, dataFile, builderFunction, limitation) {
  let cumulative = 0
  return weights.map(([key, weight]) => {
    const raw = safeNumber(entry?.[key], 0)
    const normalized = clamp01(raw)
    const contribution = round(normalized * weight, 4)
    cumulative = round(cumulative + contribution, 4)
    const [labelZh, labelEn] = labels[key] || [key, key]
    return {
      fieldKey: key,
      labelZh,
      labelEn,
      rawValue: round(raw, 3),
      normalizedValue: round(normalized, 3),
      weightOrFactor: weight,
      contribution,
      cumulativeValue: cumulative,
      dataGrade: factorDataGrade(key, baseGrade),
      dataSourceFile: dataFile,
      builderFunction,
      evidenceMode: "weighted-sum",
      curationStatus: baseGrade,
      limitation,
    }
  })
}

export function buildHostScoreProvenance(workbench, options = {}) {
  const hosts = asArray(workbench?.hostSelection?.rankedHosts)
  const host = options.host || workbench?.hostSelection?.selectedHost || hosts[0] || {}
  const baseGrade = deriveDataGrade(host.provenance)
  const limitation = safeText(host.limitation, "Host stability still needs same-condition validation.")
  const rows = buildWeightedRows(host, HOST_SCORE_WEIGHTS, HOST_FACTOR_LABELS, baseGrade, HOST_DATA_FILE, "buildHostMofSelection", limitation)
  const finalValue = round(safeNumber(host.hostScore, rows[rows.length - 1]?.cumulativeValue), 3)
  return {
    scoreName: "hostScore",
    displayNameZh: "主体得分",
    displayNameEn: "Host Score",
    candidateLabel: safeText(host.displayName, "host pending"),
    finalValue,
    rank: Math.round(safeNumber(host.ranking, 1)),
    formula: "Host Score = Σ (weightᵢ × normalized fieldᵢ)",
    formulaType: "weighted-sum",
    headerNoteZh: SCORE_HEADER_NOTE_ZH,
    headerNoteEn: SCORE_HEADER_NOTE_EN,
    sourceFields: rows.map(row => row.fieldKey),
    rows,
    dataGrade: baseGrade,
    dataSourceFile: HOST_DATA_FILE,
    builderFunction: "buildHostMofSelection",
    evidenceMode: "weighted-sum",
    curationStatus: curationFromProvenance(host.provenance),
    limitation,
  }
}

export function buildGuestScoreProvenance(workbench, options = {}) {
  const guests = asArray(workbench?.guestSelection?.rankedGuestMetals)
  const guest = options.guest || workbench?.guestSelection?.selectedGuestMetal || guests[0] || {}
  const baseGrade = deriveDataGrade(guest.provenance)
  const limitation = safeText(guest.mainRisk, "Guest introduction feasibility still needs validation.")
  const rows = buildWeightedRows(guest, GUEST_SCORE_WEIGHTS, GUEST_FACTOR_LABELS, baseGrade, GUEST_DATA_FILE, "buildGuestMetalSelection", limitation)
  const finalValue = round(safeNumber(guest.guestScore, rows[rows.length - 1]?.cumulativeValue), 3)
  return {
    scoreName: "guestScore",
    displayNameZh: "客体得分",
    displayNameEn: "Guest Score",
    candidateLabel: safeText(guest.guestMetal, "guest pending"),
    finalValue,
    rank: Math.round(safeNumber(guest.ranking, 1)),
    formula: "Guest Score = Σ (weightᵢ × normalized fieldᵢ)",
    formulaType: "weighted-sum",
    headerNoteZh: SCORE_HEADER_NOTE_ZH,
    headerNoteEn: SCORE_HEADER_NOTE_EN,
    sourceFields: rows.map(row => row.fieldKey),
    rows,
    dataGrade: baseGrade,
    dataSourceFile: GUEST_DATA_FILE,
    builderFunction: "buildGuestMetalSelection",
    evidenceMode: "weighted-sum",
    curationStatus: curationFromProvenance(guest.provenance),
    limitation,
  }
}

export function buildRouteHgcpsScoreProvenance(workbench, options = {}) {
  const routes = asArray(workbench?.complementarity?.routeScores)
  const route = options.route || workbench?.complementarity?.topRoute || routes[0] || {}
  const breakdown = route.scoreBreakdown || {}
  const baseGrade = deriveDataGrade(route.provenance)
  const routeName = safeText(route.routeName || `${safeText(route.hostMof, "host")} + ${safeText(route.guestMetal, "guest")}`)
  const weightMap = Object.fromEntries(ROUTE_SCORE_WEIGHTS)
  let product = 1
  const rows = ROUTE_FACTOR_DEFINITIONS.map(({ breakdownKey }) => {
    const factor = clamp01(breakdown[breakdownKey])
    const before = product
    const weight = safeNumber(weightMap[ROUTE_FACTOR_DEFINITIONS.find(row => row.breakdownKey === breakdownKey)?.key], 0)
    const effectiveFactor = Math.max(0.001, factor) ** weight
    product = product * effectiveFactor
    const [labelZh, labelEn] = ROUTE_FACTOR_LABELS[breakdownKey] || [breakdownKey, breakdownKey]
    const isRisk = breakdownKey === "riskRetentionFactor"
    return {
      fieldKey: breakdownKey,
      labelZh,
      labelEn,
      rawValue: round(safeNumber(breakdown[breakdownKey]), 3),
      normalizedValue: round(factor, 3),
      weightOrFactor: round(weight, 3),
      effectiveFactor: round(effectiveFactor, 4),
      contribution: round(product - before, 4),
      cumulativeValue: round(product, 4),
      dataGrade: factorDataGrade(breakdownKey, baseGrade),
      dataSourceFile: ROUTE_DATA_FILE,
      builderFunction: "buildHostGuestComplementarityScore",
      evidenceMode: "weighted-geometric-factor",
      curationStatus: baseGrade,
      limitation: isRisk ? RISK_RETENTION_NOTE_EN : safeText(route.mainRisk, "Route factor needs same-condition validation."),
    }
  })
  const finalValue = round(product, 3)
  return {
    scoreName: "routeHGCPS",
    displayNameZh: "路线 HGCPS",
    displayNameEn: "Route HGCPS",
    candidateLabel: routeName,
    routeId: safeText(route.routeId, "route-pending"),
    finalValue,
    rank: Math.round(safeNumber(route.ranking, 1)),
    formula: HGCPS_FORMULA_TEXT,
    formulaType: "weighted-geometric-factor",
    startValue: 1,
    headerNoteZh: SCORE_HEADER_NOTE_ZH,
    headerNoteEn: SCORE_HEADER_NOTE_EN,
    riskRetentionNoteZh: RISK_RETENTION_NOTE_ZH,
    riskRetentionNoteEn: RISK_RETENTION_NOTE_EN,
    sourceFields: rows.map(row => row.fieldKey),
    rows,
    dataGrade: baseGrade,
    dataSourceFile: ROUTE_DATA_FILE,
    builderFunction: "buildHostGuestComplementarityScore",
    evidenceMode: "weighted-geometric-factor",
    curationStatus: curationFromProvenance(route.provenance, "seed / proxy / curated"),
    limitation: safeText(route.mainRisk, "Route still needs same-condition validation."),
  }
}

export function buildFactorCompressionTrace(workbench, options = {}) {
  const provenance = buildRouteHgcpsScoreProvenance(workbench, options)
  const steps = provenance.rows.map(row => ({
    factorKey: row.fieldKey,
    labelZh: row.labelZh,
    labelEn: row.labelEn,
    factorValue: row.effectiveFactor,
    factorWeight: row.weightOrFactor,
    cumulativeValue: row.cumulativeValue,
    contribution: row.contribution,
    dataGrade: row.dataGrade,
    rawField: row.fieldKey,
    rawValue: row.rawValue,
    normalizedValue: row.normalizedValue,
    sourceFile: row.dataSourceFile,
    builder: row.builderFunction,
    limitation: row.limitation,
  }))
  return {
    titleZh: "HGCPS 因子压缩图",
    titleEn: "HGCPS Factor Compression Chart",
    routeLabel: provenance.candidateLabel,
    routeId: provenance.routeId,
    rank: provenance.rank,
    startValue: 1,
    steps,
    finalValue: provenance.finalValue,
    finalHGCPS: provenance.finalValue,
    formula: provenance.formula,
    headerNoteZh: provenance.headerNoteZh,
    headerNoteEn: provenance.headerNoteEn,
    riskRetentionNoteZh: RISK_RETENTION_NOTE_ZH,
    riskRetentionNoteEn: RISK_RETENTION_NOTE_EN,
  }
}

function comparisonRoutes(workbench, count = 3) {
  return asArray(workbench?.complementarity?.routeScores)
    .slice()
    .sort((a, b) => safeNumber(a.ranking, 99) - safeNumber(b.ranking, 99))
    .slice(0, count)
    .map(route => ({
      routeId: safeText(route.routeId, "route-pending"),
      label: safeText(route.routeName || `${safeText(route.hostMof, "host")} + ${safeText(route.guestMetal, "guest")}`),
      rank: Math.round(safeNumber(route.ranking, 1)),
      finalHGCPS: round(safeNumber(route.finalHGCPS), 3),
      breakdown: route.scoreBreakdown || {},
      dataGrade: deriveDataGrade(route.provenance),
    }))
}

export function buildRouteFactorComparisonModel(workbench, options = {}) {
  const routes = comparisonRoutes(workbench, options.count || 3)
  const top = routes[0] || { label: "route pending", breakdown: {}, rank: 1 }
  const runnerUp = routes[1] || null
  const factorRows = ROUTE_FACTOR_DEFINITIONS.map(({ breakdownKey }) => {
    const [labelZh, labelEn] = ROUTE_FACTOR_LABELS[breakdownKey] || [breakdownKey, breakdownKey]
    return {
      factorKey: breakdownKey,
      labelZh,
      labelEn,
      values: routes.map(route => ({
        routeId: route.routeId,
        label: route.label,
        rank: route.rank,
        value: round(clamp01(route.breakdown[breakdownKey]), 3),
        isTop: route.rank === top.rank,
      })),
      topVsSecondDelta: runnerUp ? round(clamp01(top.breakdown[breakdownKey]) - clamp01(runnerUp.breakdown[breakdownKey]), 3) : 0,
    }
  })
  const diffs = factorRows
    .map(row => ({ factorKey: row.factorKey, labelZh: row.labelZh, labelEn: row.labelEn, delta: row.topVsSecondDelta }))
    .filter(row => row.delta > 0)
    .sort((a, b) => b.delta - a.delta)
  const main = diffs[0] || { labelZh: "综合因子", labelEn: "combined factors", delta: 0 }
  const second = diffs[1] || { labelZh: "证据置信", labelEn: "evidence confidence", delta: 0 }
  const autoSentenceZh = runnerUp
    ? `当前 top route 相比 runner-up 主要优势来自${main.labelZh}（+${main.delta}），其次来自${second.labelZh}（+${second.delta}）。`
    : "当前仅有一条路线，缺少可比较的次优路线。"
  const autoSentenceEn = runnerUp
    ? `Compared with the runner-up, the top route leads mainly on ${main.labelEn} (+${main.delta}), then on ${second.labelEn} (+${second.delta}).`
    : "Only one route is available; no runner-up route to compare."
  return {
    titleZh: "路线因子对比图",
    titleEn: "Route Factor Comparison Chart",
    headerNoteZh: SCORE_HEADER_NOTE_ZH,
    headerNoteEn: SCORE_HEADER_NOTE_EN,
    routes,
    topRouteId: top.routeId || "route-pending",
    runnerUpRouteId: runnerUp?.routeId || "",
    factorRows,
    mainDifferenceFactor: main.labelEn,
    mainDifferenceFactorZh: main.labelZh,
    mainDifferenceDelta: main.delta,
    secondDifferenceFactor: second.labelEn,
    secondDifferenceFactorZh: second.labelZh,
    secondDifferenceDelta: second.delta,
    autoSentenceZh,
    autoSentenceEn,
  }
}

const KIND_FACTORS = {
  route: ROUTE_FACTOR_DEFINITIONS.map(({ breakdownKey }) => ({ key: breakdownKey, labelZh: ROUTE_FACTOR_LABELS[breakdownKey][0], labelEn: ROUTE_FACTOR_LABELS[breakdownKey][1] })),
  host: HOST_SCORE_WEIGHTS.map(([key]) => ({ key, labelZh: HOST_FACTOR_LABELS[key][0], labelEn: HOST_FACTOR_LABELS[key][1] })),
  guest: GUEST_SCORE_WEIGHTS.map(([key]) => ({ key, labelZh: GUEST_FACTOR_LABELS[key][0], labelEn: GUEST_FACTOR_LABELS[key][1] })),
}

function defaultGetValue(entry, key) {
  if (!entry) return 0
  if (entry.values && key in entry.values) return entry.values[key]
  if (entry.scoreBreakdown && key in entry.scoreBreakdown) return entry.scoreBreakdown[key]
  if (entry.breakdown && key in entry.breakdown) return entry.breakdown[key]
  return entry[key]
}

function defaultGetName(entry) {
  if (!entry) return "candidate pending"
  return safeText(entry.name || entry.label || entry.routeName || entry.route || entry.displayName || entry.guestMetal || (entry.hostMof && entry.guestMetal ? `${entry.hostMof} + ${entry.guestMetal}` : ""), "candidate pending")
}

export function buildDynamicWhyNotOtherExplanation(top, runnerUp, options = {}) {
  const kind = options.kind || "route"
  const factors = options.factors || KIND_FACTORS[kind] || KIND_FACTORS.route
  const getValue = options.getValue || defaultGetValue
  const getName = options.getName || defaultGetName
  const dataGrade = safeText(options.dataGrade, "seed / proxy / curated")
  const topName = getName(top)
  const runnerName = runnerUp ? getName(runnerUp) : "次优候选"
  const diffs = factors
    .map(factor => ({
      ...factor,
      delta: round(clamp01(getValue(top, factor.key)) - clamp01(getValue(runnerUp, factor.key)), 3),
    }))
    .sort((a, b) => b.delta - a.delta)
  const main = diffs[0] || { labelZh: "综合因子", labelEn: "combined factors", delta: 0 }
  const second = diffs[1] || { labelZh: "证据置信", labelEn: "evidence confidence", delta: 0 }
  const hasRunnerUp = Boolean(runnerUp)
  const rankText = Math.round(safeNumber(options.rank, top?.rank || 1))
  return {
    kind,
    mainDifferenceFactor: main.labelEn,
    mainDifferenceFactorZh: main.labelZh,
    differenceValue: main.delta,
    secondDifferenceFactor: second.labelEn,
    secondDifferenceFactorZh: second.labelZh,
    secondDifferenceValue: second.delta,
    whyWinnerLeadsZh: hasRunnerUp
      ? `${topName} 相比 ${runnerName} 主要优势来自${main.labelZh}（+${main.delta}）和${second.labelZh}（+${second.delta}）。因此它在当前 ${dataGrade} 数据下排名第 ${rankText}；但这仍是实验路线优先级，不是性能证明。`
      : `${topName} 当前缺少可比较的次优候选，排名第 ${rankText}；这仍是实验路线优先级，不是性能证明。`,
    whyWinnerLeadsEn: hasRunnerUp
      ? `${topName} leads ${runnerName} mainly on ${main.labelEn} (+${main.delta}) and ${second.labelEn} (+${second.delta}); under current ${dataGrade} data it ranks #${rankText}, which is route priority, not a performance proof.`
      : `${topName} has no comparable runner-up; it ranks #${rankText}, which is route priority, not a performance proof.`,
    whyRunnerUpNotSelectedZh: hasRunnerUp
      ? `${runnerName} 在${main.labelZh}上落后 ${main.delta}，在${second.labelZh}上落后 ${second.delta}，因此排在其后；它仍保留为对照 / backup 路线。`
      : "暂无次优候选可供对照。",
    whyRunnerUpNotSelectedEn: hasRunnerUp
      ? `${runnerName} trails by ${main.delta} on ${main.labelEn} and ${second.delta} on ${second.labelEn}, so it ranks lower; it is retained as a control / backup route.`
      : "No runner-up candidate to compare yet.",
    limitation: "基于 seed / proxy / curated 数据，差异仍需同条件实验验证。",
  }
}

const SCORE_SOURCE_COLUMNS = [
  { key: "label", labelZh: "因子 / 字段", labelEn: "Factor / field" },
  { key: "rawValue", labelZh: "原始值", labelEn: "Raw value" },
  { key: "normalizedValue", labelZh: "归一化值", labelEn: "Normalized" },
  { key: "weightOrFactor", labelZh: "权重 / 因子", labelEn: "Weight / factor" },
  { key: "contribution", labelZh: "贡献值", labelEn: "Contribution" },
  { key: "cumulativeValue", labelZh: "累计值", labelEn: "Cumulative" },
  { key: "dataGrade", labelZh: "数据等级", labelEn: "Data grade" },
  { key: "dataSourceFile", labelZh: "数据来源", labelEn: "Source file" },
  { key: "builderFunction", labelZh: "builder", labelEn: "Builder" },
  { key: "limitation", labelZh: "局限性", labelEn: "Limitation" },
]

export function buildScoreSourceTableModel(provenance, options = {}) {
  const source = provenance || {}
  const rows = asArray(source.rows).map(row => ({
    label: { zh: row.labelZh, en: row.labelEn },
    rawValue: round(row.rawValue, 3),
    normalizedValue: round(row.normalizedValue, 3),
    weightOrFactor: round(row.weightOrFactor, 3),
    contribution: round(row.contribution, 4),
    cumulativeValue: round(row.cumulativeValue, 4),
    dataGrade: safeText(row.dataGrade, "proxy"),
    dataSourceFile: safeText(row.dataSourceFile, "pending"),
    builderFunction: safeText(row.builderFunction, "pending"),
    limitation: safeText(row.limitation, "pending"),
  }))
  return {
    titleZh: "得分来源表",
    titleEn: "Score Source Table",
    triggerZh: "查看得分来源",
    triggerEn: "View score source",
    questionZh: "得分计算依据",
    questionEn: "How is this score calculated?",
    headerNoteZh: source.headerNoteZh || SCORE_HEADER_NOTE_ZH,
    headerNoteEn: source.headerNoteEn || SCORE_HEADER_NOTE_EN,
    scoreName: safeText(source.scoreName, "score"),
    displayNameZh: safeText(source.displayNameZh, "得分"),
    displayNameEn: safeText(source.displayNameEn, "Score"),
    formula: safeText(source.formula, "pending"),
    formulaType: safeText(source.formulaType, "weighted-sum"),
    finalValue: round(source.finalValue, 3),
    rank: Math.round(safeNumber(source.rank, 1)),
    columns: SCORE_SOURCE_COLUMNS,
    rows,
    defaultCollapsed: options.defaultCollapsed !== false,
  }
}

export function buildScoreDataGradeBadges(input) {
  const grades = Array.isArray(input)
    ? input
    : input && typeof input === "object"
      ? [input.dataGrade, ...asArray(input.rows).map(row => row.dataGrade)]
      : [input]
  const unique = []
  for (const grade of grades) {
    const key = safeText(grade, "")
    if (key && GRADE_META[key] && !unique.includes(key)) unique.push(key)
  }
  if (!unique.length) unique.push("proxy")
  return unique.map(grade => ({
    grade,
    labelZh: GRADE_META[grade].labelZh,
    labelEn: GRADE_META[grade].labelEn,
    tone: GRADE_META[grade].tone,
  }))
}

export function buildTerminologyAlignmentModel() {
  return {
    titleZh: "评分术语对照",
    titleEn: "Scoring Terminology Alignment",
    primaryScore: "HGCPS",
    firstMentionNoteZh: "HGCPS：主客体互补路径评分，表示路线优先级，不是性能预测值。",
    firstMentionNoteEn: "HGCPS: Host-Guest Complementary Pathway Score; it expresses route priority, not a performance prediction.",
    terms: [
      {
        acronym: "HGCPS",
        nameZh: "主客体互补路径评分",
        nameEn: "Host-Guest Complementary Pathway Score",
        scopeZh: "有机酸主客体主链条的统一路线评分。",
        scopeEn: "Primary route score for the organic-acid host-guest chain.",
        noteZh: "八因子加权几何压缩，表示路线优先级，不是催化性能预测值。",
        noteEn: "Eight-factor weighted-geometric compression; route priority, not catalytic-performance prediction.",
        primary: true,
      },
      {
        acronym: "OACS",
        nameZh: "有机酸候选评分",
        nameEn: "Organic Acid Candidate Score",
        scopeZh: "早期单材料候选筛选评分，已在主链条收敛到 HGCPS。",
        scopeEn: "Early single-candidate screening score, converged into HGCPS for the main chain.",
        noteZh: "保留为历史方法论术语，主链条优先使用 HGCPS。",
        noteEn: "Kept as legacy methodology term; the main chain prefers HGCPS.",
        primary: false,
      },
      {
        acronym: "DMRS",
        nameZh: "掺杂金属推荐评分",
        nameEn: "Dopant Metal Recommendation Score",
        scopeZh: "客体 / 掺杂金属推荐评分，对应 Guest Score 因子。",
        scopeEn: "Guest / dopant metal recommendation score, mapped to Guest Score factors.",
        noteZh: "在主客体链条中表现为 Guest Score，并入 HGCPS 的客体活性补偿因子。",
        noteEn: "Surfaces as Guest Score and feeds the HGCPS guest-activity-compensation factor.",
        primary: false,
      },
    ],
  }
}

function levelFor(value) {
  const normalized = clamp01(value)
  if (normalized >= LEVEL_THRESHOLDS.high) return { zh: "高", en: "High", key: "high" }
  if (normalized >= LEVEL_THRESHOLDS.medium) return { zh: "中", en: "Medium", key: "medium" }
  return { zh: "低", en: "Low", key: "low" }
}

function sourceFieldSentence(row, provenance) {
  const fields = asArray(provenance?.sourceFields).filter(Boolean)
  const peers = fields.filter(field => field !== row.fieldKey).slice(0, 2)
  const peerText = peers.length ? ` / ${peers.join(" / ")}` : ""
  return `${row.fieldKey}${peerText}`
}

function interpretationForRow(row, provenance) {
  const level = levelFor(row.normalizedValue)
  const sourceFields = sourceFieldSentence(row, provenance)
  const limitation = safeText(row.limitation, "same-condition validation pending")
  const valueText = round(row.normalizedValue, 3)
  if (level.key === "high") {
    return {
      zh: `${row.labelZh}处于高区间，归一化值 ${valueText}；解释直接读取 ${sourceFields} 字段，并受限于「${limitation}」。`,
      en: `${row.labelEn} is in the high band with normalized value ${valueText}; the explanation reads the real ${sourceFields} field(s) and remains bounded by "${limitation}".`,
    }
  }
  if (level.key === "medium") {
    return {
      zh: `${row.labelZh}处于中区间，说明该字段能支撑当前排序但不是单独决定因素；引用字段为 ${sourceFields}，需结合数据等级 ${row.dataGrade} 解读。`,
      en: `${row.labelEn} is in the medium band, so it supports the ranking but does not decide it alone; source field(s): ${sourceFields}, interpreted with ${row.dataGrade} data grade.`,
    }
  }
  return {
    zh: `${row.labelZh}处于低区间，是当前路线的压缩项；引用字段为 ${sourceFields}，局限性为「${limitation}」。`,
    en: `${row.labelEn} is in the low band and compresses the current route; source field(s): ${sourceFields}, limitation: "${limitation}".`,
  }
}

export function buildPerFactorInterpretation(provenance) {
  return asArray(provenance?.rows).map(row => {
    const level = levelFor(row.normalizedValue)
    const interpretation = interpretationForRow(row, provenance)
    return {
      factorKey: safeText(row.fieldKey, "factor-pending"),
      labelZh: safeText(row.labelZh, row.fieldKey),
      labelEn: safeText(row.labelEn, row.fieldKey),
      rawValue: round(row.rawValue, 3),
      normalizedValue: round(row.normalizedValue, 3),
      contribution: round(row.contribution, 4),
      dataGrade: safeText(row.dataGrade, "proxy"),
      levelTag: level.zh,
      levelTagEn: level.en,
      levelKey: level.key,
      interpretationZh: interpretation.zh,
      interpretationEn: interpretation.en,
      sourceField: safeText(row.fieldKey),
      sourceFields: [safeText(row.fieldKey)],
      limitation: safeText(row.limitation, "pending"),
    }
  })
}

function valueByFactor(provenance, factorKey) {
  const row = asArray(provenance?.rows).find(item => item.fieldKey === factorKey) || {}
  return round(row.normalizedValue, 3)
}

export function buildFactorDeltaTable(top, runnerUp, third) {
  const rows = asArray(top?.rows).map(row => {
    const topValue = valueByFactor(top, row.fieldKey)
    const secondValue = runnerUp ? valueByFactor(runnerUp, row.fieldKey) : 0
    const thirdValue = third ? valueByFactor(third, row.fieldKey) : 0
    return {
      factorKey: safeText(row.fieldKey),
      labelZh: safeText(row.labelZh, row.fieldKey),
      labelEn: safeText(row.labelEn, row.fieldKey),
      topValue,
      secondValue,
      thirdValue,
      deltaSecond: round(topValue - secondValue, 3),
      deltaThird: round(topValue - thirdValue, 3),
      isDominantGap: false,
    }
  })
  const dominant = rows
    .slice()
    .sort((a, b) => Math.abs(b.deltaSecond) - Math.abs(a.deltaSecond))[0]
  return rows.map(row => ({ ...row, isDominantGap: Boolean(dominant && row.factorKey === dominant.factorKey) }))
}

function searchableEvidenceText(record) {
  return [
    record?.linkedDescriptor,
    record?.linkedStepId,
    record?.supports,
    record?.evidenceType,
    record?.riskType,
    record?.limitation,
  ].map(value => safeText(value, "").toLowerCase()).join(" ")
}

function evidenceMatchesFactor(record, factorKey, labelZh = "", labelEn = "") {
  const text = searchableEvidenceText(record)
  const keyTokens = safeText(factorKey, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2)
  const labelTokens = `${labelZh} ${labelEn}`.toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 2)
  const keywords = [...(FACTOR_EVIDENCE_KEYWORDS[factorKey] || []), ...keyTokens, ...labelTokens]
  return keywords.some(keyword => keyword && text.includes(keyword.toLowerCase()))
}

export function buildFactorEvidence(provenance, evidenceRecords = [], options = {}) {
  const routeId = safeText(options.routeId || provenance?.routeId, "")
  const linkedStepId = safeText(options.linkedStepId, "")
  const candidateRecords = asArray(evidenceRecords).filter(record => {
    const routeOk = !routeId || record.linkedRouteId === routeId || asArray(options.evidenceRefs).includes(record.evidenceId)
    const stepOk = !linkedStepId || record.linkedStepId === linkedStepId
    return routeOk && stepOk
  })
  const factorRows = asArray(provenance?.rows)
  const evidenceRows = candidateRecords.map(record => {
    const matchedFactor = factorRows.find(row => evidenceMatchesFactor(record, row.fieldKey, row.labelZh, row.labelEn))
    return {
      factorKey: matchedFactor?.fieldKey || "route-level",
      factorLabelZh: matchedFactor?.labelZh || "路线级证据",
      factorLabelEn: matchedFactor?.labelEn || "Route-level evidence",
      evidenceId: safeText(record.evidenceId, "pending"),
      supports: safeText(record.supports, "pending"),
      citation: safeText(record.citation, "pending"),
      sourceUrl: safeText(record.sourceUrl, "pending"),
      directness: safeText(record.directness, "pending"),
      sameCondition: record.sameCondition === true,
      confidenceLevel: safeText(record.confidenceLevel, "pending"),
      limitation: safeText(record.limitation, "pending"),
      curationStatus: safeText(record.curationStatus, "pending"),
      linkedDescriptor: safeText(record.linkedDescriptor, "pending"),
      linkedStepId: safeText(record.linkedStepId, "pending"),
      noteZh: matchedFactor ? "证据由 linkedDescriptor / linkedStepId 映射到该因子。" : "路线级证据，未细分到该因子。",
      noteEn: matchedFactor ? "Mapped to this factor through linkedDescriptor / linkedStepId." : "Route-level evidence; not resolved to a single factor.",
    }
  })
  if (evidenceRows.length) return evidenceRows
  return [{
    factorKey: "route-level",
    factorLabelZh: "路线级证据",
    factorLabelEn: "Route-level evidence",
    evidenceId: "pending",
    supports: "pending",
    citation: "pending",
    sourceUrl: "pending",
    directness: "pending",
    sameCondition: false,
    confidenceLevel: "pending",
    limitation: "待补证据 / pending",
    curationStatus: "pending",
    linkedDescriptor: "pending",
    linkedStepId: "pending",
    noteZh: "待补证据 / pending",
    noteEn: "Evidence pending.",
  }]
}

function routeFactorValue(route, definition) {
  if (!route) return definition.key === "riskPenalty" ? 1 : 0
  if (route[definition.key] !== undefined) return clamp01(route[definition.key])
  if (route.scoreBreakdown?.[definition.breakdownKey] !== undefined) return clamp01(route.scoreBreakdown[definition.breakdownKey])
  if (route.breakdown?.[definition.breakdownKey] !== undefined) return clamp01(route.breakdown[definition.breakdownKey])
  return definition.key === "riskPenalty" ? 1 : 0
}

function calculateRouteHgcps(route) {
  const weights = Object.fromEntries(ROUTE_SCORE_WEIGHTS)
  return round(ROUTE_FACTOR_DEFINITIONS.reduce((product, definition) => {
    const factor = Math.max(0.001, routeFactorValue(route, definition))
    return product * factor ** safeNumber(weights[definition.key], 0)
  }, 1), 3)
}

export function buildRiskDecomposition(route, evidenceRecords = []) {
  const selectedRoute = route || {}
  const riskRetention = round(routeFactorValue(selectedRoute, ROUTE_FACTOR_DEFINITIONS.find(row => row.key === "riskPenalty")), 3)
  const weights = Object.fromEntries(ROUTE_SCORE_WEIGHTS)
  const riskWeight = safeNumber(weights.riskPenalty, 0)
  const scoreBeforeRisk = round(ROUTE_FACTOR_DEFINITIONS
    .filter(definition => definition.key !== "riskPenalty")
    .reduce((product, definition) => product * Math.max(0.001, routeFactorValue(selectedRoute, definition)) ** safeNumber(weights[definition.key], 0), 1), 3)
  const finalHGCPS = round(scoreBeforeRisk * Math.max(0.001, riskRetention) ** riskWeight, 3)
  const evidenceRisks = asArray(selectedRoute.riskPenaltyBreakdown).length
    ? asArray(selectedRoute.riskPenaltyBreakdown)
    : asArray(evidenceRecords)
      .filter(record => record.linkedRouteId === selectedRoute.routeId && (record.riskType || safeNumber(record.penalty, 0) > 0))
  const rows = evidenceRisks.length ? evidenceRisks : [{
    riskType: "route-level risk",
    penalty: round(1 - riskRetention, 3),
    reason: safeText(selectedRoute.mainRisk, "risk pending"),
    confidenceLevel: safeText(selectedRoute.confidenceLevel, "pending"),
  }]
  return {
    routeId: safeText(selectedRoute.routeId, "route-pending"),
    routeLabel: defaultGetName(selectedRoute),
    riskRetention,
    scoreBeforeRisk,
    finalHGCPS,
    rows: rows.map((row, index) => ({
      riskType: safeText(row.riskType, `risk-${index + 1}`),
      penalty: round(row.penalty, 3),
      reason: safeText(row.reason || row.limitation || row.supports, "risk reason pending"),
      confidenceLevel: safeText(row.confidenceLevel, "pending"),
      explanationZh: `Risk Retention = ${riskRetention}，把总分从 ${scoreBeforeRisk} 压到 ${finalHGCPS}；表示证据不足或风险待验证，非实验证伪。`,
      explanationEn: `Risk Retention = ${riskRetention}, compressing the score from ${scoreBeforeRisk} to ${finalHGCPS}; this means evidence is insufficient or risk remains unverified, not experimentally falsified.`,
    })),
  }
}

export function buildCounterfactual(route, allRoutes = []) {
  const selectedRoute = route || asArray(allRoutes)[0] || {}
  const baselineRank = Math.round(safeNumber(selectedRoute.ranking, 1))
  const otherRoutes = asArray(allRoutes).filter(row => row.routeId !== selectedRoute.routeId)
  return ROUTE_FACTOR_DEFINITIONS.map(definition => {
    const [labelZh, labelEn] = ROUTE_FACTOR_LABELS[definition.breakdownKey] || [definition.label, definition.label]
    const currentValue = round(routeFactorValue(selectedRoute, definition), 3)
    const scenarios = COUNTERFACTUAL_VALUES.map(setValue => {
      const adjustedRoute = { ...selectedRoute, [definition.key]: setValue, scoreBreakdown: { ...(selectedRoute.scoreBreakdown || {}), [definition.breakdownKey]: setValue } }
      const newHGCPS = calculateRouteHgcps(adjustedRoute)
      const newRank = 1 + otherRoutes.filter(row => safeNumber(row.finalHGCPS, calculateRouteHgcps(row)) > newHGCPS).length
      const rankDelta = newRank - baselineRank
      return {
        setValue,
        newHGCPS,
        newRank,
        rankDelta,
        sentenceZh: `若 ${labelZh} 由 ${currentValue} 调整到 ${setValue}，HGCPS→${newHGCPS}，排名${newRank === baselineRank ? "仍为" : "变为"} #${newRank}。`,
        sentenceEn: `If ${labelEn} changes from ${currentValue} to ${setValue}, HGCPS becomes ${newHGCPS} and rank ${newRank === baselineRank ? "remains" : "moves to"} #${newRank}.`,
      }
    })
    return {
      factorKey: definition.breakdownKey,
      rawField: definition.key,
      labelZh,
      labelEn,
      currentValue,
      baselineRank,
      scenarios,
    }
  })
}

function dynamicConclusion(stepId, provenance, factorDeltaTable, fallbackZh, fallbackEn) {
  if (!["step-3", "step-4", "step-5"].includes(stepId) || !provenance) {
    return { zh: fallbackZh, en: fallbackEn }
  }
  const dominant = asArray(factorDeltaTable).find(row => row.isDominantGap) || {}
  const scoreLabelZh = stepId === "step-5" ? "HGCPS" : provenance.displayNameZh
  const scoreLabelEn = stepId === "step-5" ? "HGCPS" : provenance.displayNameEn
  const gapZh = dominant.factorKey
    ? ` · 主要差异：${dominant.labelZh}（较 runner-up ${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)}）`
    : ""
  const gapEn = dominant.factorKey
    ? ` · dominant gap: ${dominant.labelEn} (${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)} vs runner-up)`
    : ""
  return {
    zh: `${provenance.candidateLabel} · ${scoreLabelZh} ${round(provenance.finalValue, 3).toFixed(3)} · 排名 #${provenance.rank}${gapZh}`,
    en: `${provenance.candidateLabel} · ${scoreLabelEn} ${round(provenance.finalValue, 3).toFixed(3)} · rank #${provenance.rank}${gapEn}`,
  }
}

export function buildStructuredConclusion(stepId, provenance, factorDeltaTable = [], riskDecomposition = null, boundaries = SCORE_BOUNDARY_STATEMENTS) {
  if (!["step-3", "step-4", "step-5"].includes(stepId) || !provenance) return null
  const oneLine = dynamicConclusion(stepId, provenance, factorDeltaTable, "", "")
  const topFactors = asArray(provenance.rows)
    .slice()
    .sort((a, b) => Math.abs(safeNumber(b.contribution, 0)) - Math.abs(safeNumber(a.contribution, 0)))
    .slice(0, 2)
  const dominant = asArray(factorDeltaTable).find(row => row.isDominantGap) || asArray(factorDeltaTable)[0] || {}
  const mainRisk = safeText(riskDecomposition?.rows?.[0]?.reason || provenance.limitation, "同条件实验验证仍待补。")
  const grade = safeText(provenance.dataGrade || provenance.curationStatus, "seed / proxy / curated")
  const boundary = asArray(boundaries).find(row => row.id === "priority") || asArray(boundaries)[0] || {}
  const supportZh = topFactors.length
    ? topFactors.map(row => `${row.labelZh} ${round(row.contribution, 4)}`).join("；")
    : "贡献因子待补。"
  const supportEn = topFactors.length
    ? topFactors.map(row => `${row.labelEn} ${round(row.contribution, 4)}`).join("; ")
    : "contribution factors pending."
  const dominantZh = dominant.factorKey
    ? `${dominant.labelZh}与对照路线差值 ${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)}，是当前排序差异的主导项。`
    : "当前缺少可比较的主导差异因子。"
  const dominantEn = dominant.factorKey
    ? `${dominant.labelEn} differs from the runner-up by ${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)} and is the dominant ranking gap.`
    : "No comparable dominant gap factor is available."
  return {
    titleZh: "结构化结论",
    titleEn: "Structured conclusion",
    segments: [
      {
        id: "conclusion",
        labelZh: "结论",
        labelEn: "Conclusion",
        bodyZh: oneLine.zh,
        bodyEn: oneLine.en,
      },
      {
        id: "basis",
        labelZh: "依据",
        labelEn: "Basis",
        bodyZh: `主要贡献来自：${supportZh}。`,
        bodyEn: `The main contributions come from: ${supportEn}.`,
      },
      {
        id: "dominant-factor",
        labelZh: "关键因子",
        labelEn: "Key factor",
        bodyZh: dominantZh,
        bodyEn: dominantEn,
      },
      {
        id: "limitation",
        labelZh: "局限",
        labelEn: "Limitation",
        bodyZh: `${mainRisk} 数据等级：${grade}；${safeText(boundary.zh, SCORE_HEADER_NOTE_ZH)}`,
        bodyEn: `${mainRisk} Data grade: ${grade}; ${safeText(boundary.en, SCORE_HEADER_NOTE_EN)}`,
      },
    ],
  }
}

function validationSummaryCounts(workbench, sourceData = {}, activationWorkbench = {}) {
  const topRouteId = safeText(workbench?.complementarity?.topRoute?.routeId, "")
  const activationRows = asArray(activationWorkbench?.minimumExperimentalMatrix?.all)
  const validationRows = activationRows.length ? activationRows : asArray(sourceData.validationExperiments)
  const topRows = validationRows.filter(row => !topRouteId || row.routeId === topRouteId || row.routeId === undefined)
  const coveredCount = topRows.length || validationRows.length
  return {
    coveredCount,
    pendingCount: Math.max(0, validationRows.length - coveredCount),
    totalCount: validationRows.length,
  }
}

export function buildFinalResultSummaryModel(workbench, options = {}) {
  const routes = asArray(workbench?.complementarity?.routeScores)
  const topRoute = workbench?.complementarity?.topRoute || routes[0] || {}
  const runnerUp = routes[1] || null
  const provenance = buildRouteHgcpsScoreProvenance(workbench, { route: topRoute })
  const comparisonProvenances = routes.slice(0, 3).map(route => buildRouteHgcpsScoreProvenance(workbench, { route }))
  const deltaTable = buildFactorDeltaTable(comparisonProvenances[0], comparisonProvenances[1], comparisonProvenances[2])
  const validationCounts = validationSummaryCounts(workbench, options.sourceData, options.activationWorkbench)
  const secondDelta = runnerUp ? round(safeNumber(topRoute.finalHGCPS, provenance.finalValue) - safeNumber(runnerUp.finalHGCPS, 0), 3) : 0
  const dominant = deltaTable.find(row => row.isDominantGap) || deltaTable[0] || {}
  const runnerLabel = runnerUp ? defaultGetName(runnerUp) : "runner-up pending"
  const evidenceRecords = asArray(options.sourceData?.evidenceRiskRecords)
  const riskDecomposition = buildRiskDecomposition(topRoute, evidenceRecords)
  const validationTotal = validationCounts.coveredCount + validationCounts.pendingCount
  const validationItems = Array.from({ length: validationTotal }, (_, index) => ({
    id: `validation-${index + 1}`,
    status: index < validationCounts.coveredCount ? "covered" : "pending",
  }))
  const emptyCohort = route => ({
    family: safeText(route?.hostMof, "host family pending"),
    computationRecordCount: 0,
    calculationRule: "No computation-ready CoRE host record was supplied for this result.",
    displayedStructureIds: [],
    displayedStructures: [],
  })
  const unavailableStructure = {
    route3dAvailable: false,
    status: "hypothesis-no-experimental-modified-cif",
    labelZh: "假设路线，无对应 3D 晶体结构",
    labelEn: "Hypothetical route; no corresponding 3D crystal structure",
    hostStructureDisclosureZh: "未映射实验改性 CIF；主体 CIF 不得冒充改性产物。",
    hostStructureDisclosureEn: "No experimental modified CIF is mapped; a host CIF must not represent the modified product.",
  }
  const routeComparisonRows = comparisonProvenances.map(routeModel => {
    const sourceRoute = routes.find(route => route.routeId === routeModel.routeId) || {}
    return {
      computationCohort: sourceRoute.computationCohort || emptyCohort(sourceRoute),
      participatingMofCount: safeNumber(sourceRoute.participatingMofCount, 0),
      participatingMofs: asArray(sourceRoute.participatingMofs),
      structureAvailability: sourceRoute.structureAvailability || unavailableStructure,
    routeId: routeModel.routeId,
    label: routeModel.candidateLabel,
    rank: routeModel.rank,
    finalHGCPS: routeModel.finalValue,
    factors: routeModel.rows.map(row => ({
      factorKey: row.fieldKey,
      labelZh: row.labelZh,
      labelEn: row.labelEn,
      value: row.normalizedValue,
    })),
    }
  })
  const factorAdvantages = deltaTable
    .filter(row => row.deltaSecond > 0)
    .sort((a, b) => b.deltaSecond - a.deltaSecond)
    .slice(0, 2)
  return {
    titleZh: "最终结果总结",
    titleEn: "Final Result Summary",
    routeId: safeText(topRoute.routeId, "route-pending"),
    routeLabel: defaultGetName(topRoute),
    computationCohort: topRoute.computationCohort || emptyCohort(topRoute),
    participatingMofCount: safeNumber(topRoute.participatingMofCount, 0),
    participatingMofs: asArray(topRoute.participatingMofs),
    structureAvailability: topRoute.structureAvailability || unavailableStructure,
    recommendationTier: safeText(topRoute.recommendationTier, "research hypothesis"),
    finalHGCPS: round(safeNumber(topRoute.finalHGCPS, provenance.finalValue), 3),
    ranking: Math.round(safeNumber(topRoute.ranking, provenance.rank)),
    deltaToSecond: secondDelta,
    factorRoseModel: provenance,
    factorOverlayModel: {
      top: provenance,
      runnerUp: comparisonProvenances[1] || null,
    },
    comparisonProvenances,
    perFactorInterpretation: buildPerFactorInterpretation(provenance),
    factorEvidence: buildFactorEvidence(provenance, evidenceRecords, { routeId: provenance.routeId, evidenceRefs: topRoute.evidenceRefs }),
    factorDeltaTable: deltaTable,
    routeComparisonModel: {
      titleZh: "Top-3 路线 HGCPS 对比图",
      titleEn: "Top-3 Route HGCPS Comparison",
      rows: routeComparisonRows,
      maxValue: Math.max(0.01, ...routeComparisonRows.map(row => safeNumber(row.finalHGCPS, 0))),
      dominantFactorZh: safeText(dominant.labelZh, "综合因子"),
      dominantFactorEn: safeText(dominant.labelEn, "combined factors"),
      deltaToSecond: secondDelta,
      captionZh: runnerUp
        ? `${defaultGetName(topRoute)} 较 ${runnerLabel} 领先 ${secondDelta >= 0 ? "+" : ""}${secondDelta}，主要来自${safeText(dominant.labelZh, "综合因子")}。`
        : `${defaultGetName(topRoute)} 暂无可比较的次优路线。`,
      captionEn: runnerUp
        ? `${defaultGetName(topRoute)} leads ${runnerLabel} by ${secondDelta >= 0 ? "+" : ""}${secondDelta}, mainly from ${safeText(dominant.labelEn, "combined factors")}.`
        : `${defaultGetName(topRoute)} has no comparable runner-up route yet.`,
    },
    validationDonutModel: {
      items: validationItems,
      readinessLevel: safeText(options.activationWorkbench?.readiness?.readinessLevel, "planning-ready / not performance-validated"),
      captionZh: `${validationCounts.totalCount || validationTotal} 项最小实验中 ${validationCounts.coveredCount} 项已有覆盖，${validationCounts.pendingCount} 项待补。`,
      captionEn: `${validationCounts.coveredCount} of ${validationCounts.totalCount || validationTotal} minimum experiments are covered; ${validationCounts.pendingCount} remain pending.`,
    },
    chartCaptions: [
      {
        id: "route-comparison",
        zh: runnerUp ? `${defaultGetName(topRoute)} 较 ${runnerLabel} 领先 ${secondDelta >= 0 ? "+" : ""}${secondDelta}，主要差异因子为${safeText(dominant.labelZh, "综合因子")}。` : "当前缺少 runner-up 路线。",
        en: runnerUp ? `${defaultGetName(topRoute)} leads ${runnerLabel} by ${secondDelta >= 0 ? "+" : ""}${secondDelta}; the dominant gap is ${safeText(dominant.labelEn, "combined factors")}.` : "No runner-up route is available.",
      },
      {
        id: "factor-overlay",
        zh: factorAdvantages.length ? `${factorAdvantages.map(row => row.labelZh).join("、")}是当前路线的主要优势维度。` : "当前路线优势分布较均衡。",
        en: factorAdvantages.length ? `${factorAdvantages.map(row => row.labelEn).join(", ")} are the leading advantage dimensions.` : "The current route advantage is balanced across factors.",
      },
      {
        id: "validation-donut",
        zh: `${validationCounts.coveredCount} 项已覆盖，${validationCounts.pendingCount} 项待补；该结果仍是实验验证假设。`,
        en: `${validationCounts.coveredCount} covered and ${validationCounts.pendingCount} pending; this remains an experimental-validation hypothesis.`,
      },
    ],
    interpretationParagraphs: [
      {
        id: "why-leading",
        labelZh: "为何领先",
        labelEn: "Why it leads",
        bodyZh: runnerUp ? `领先主要来自${safeText(dominant.labelZh, "综合因子")}，与对照路线差值为 ${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)}。` : "当前只有一条可排序路线，无法形成 runner-up 差异解释。",
        bodyEn: runnerUp ? `The lead mainly comes from ${safeText(dominant.labelEn, "combined factors")}, with a gap of ${dominant.deltaSecond >= 0 ? "+" : ""}${round(dominant.deltaSecond, 3)} versus the comparison route.` : "Only one sortable route is available, so no runner-up gap explanation is available.",
      },
      {
        id: "risk-boundary",
        labelZh: "风险 / 边界",
        labelEn: "Risk / boundary",
        bodyZh: `${safeText(riskDecomposition.rows?.[0]?.reason || topRoute.mainRisk, "风险待验证")}；本输出是实验验证优先级，不是性能结论。`,
        bodyEn: `${safeText(riskDecomposition.rows?.[0]?.reason || topRoute.mainRisk, "risk pending")}; this output is experimental-validation priority, not a performance conclusion.`,
      },
      {
        id: "next-experiment",
        labelZh: "验证实验",
        labelEn: "Validation experiment",
        bodyZh: `下一步实验：${safeText(topRoute.nextExperiment || workbench?.experimentalRoute?.nextExperiment, "validation experiment pending")}。`,
        bodyEn: `Next experiment: ${safeText(topRoute.nextExperiment || workbench?.experimentalRoute?.nextExperiment, "validation experiment pending")}.`,
      },
    ],
    riskDecomposition,
    boundaries: SCORE_BOUNDARY_STATEMENTS.slice(0, 3),
    validationCounts,
    nextExperiment: safeText(topRoute.nextExperiment || workbench?.experimentalRoute?.nextExperiment, "validation experiment pending"),
    actionZh: "我现在应该做什么",
    actionEn: "What should I do now?",
    actionButtonZh: "打开实验启用中心",
    actionButtonEn: "Open Activation Center",
    noteZh: "这是最高优先级实验验证路线 / research hypothesis，不是最终最优催化剂结论。",
    noteEn: "This is the highest-priority experimental-validation route / research hypothesis, not a final best-catalyst conclusion.",
  }
}

export function buildStepWhyPanelEnhancedModel(step, workbench, options = {}) {
  const stepId = safeText(step?.id, "step-0")
  const lang = options.lang || "zh"
  const conclusionZh = safeText(step?.result, "本步骤结论待补充。")
  const conclusionEn = safeText(step?.resultEn || step?.result, "Step conclusion pending.")
  const sourceData = options.sourceData || {}
  const evidenceRecords = asArray(options.evidenceRecords).length ? asArray(options.evidenceRecords) : asArray(sourceData.evidenceRiskRecords)
  const model = {
    stepId,
    titleZh: "当前结果的形成依据",
    titleEn: "Why this result?",
    scoreQuestionZh: "得分计算依据",
    scoreQuestionEn: "How is this score calculated?",
    conclusionZh,
    conclusionEn,
    mainChartType: safeText(step?.dynamicChartModel?.type, "objective-input-output"),
    boundaries: SCORE_BOUNDARY_STATEMENTS,
    methodologyAnchor: safeText(step?.methodologyAnchor, "#project-evolution-organic-acid-algorithm-methodology"),
    dataGradeBadges: [],
  }

  if (stepId === "step-3") {
    const hosts = asArray(workbench?.hostSelection?.rankedHosts)
    const provenance = buildHostScoreProvenance(workbench, options)
    model.provenance = provenance
    model.comparisonProvenances = hosts.slice(0, 3).map(host => buildHostScoreProvenance(workbench, { host }))
    model.perFactorInterpretation = buildPerFactorInterpretation(provenance)
    model.factorDeltaTable = buildFactorDeltaTable(model.comparisonProvenances[0], model.comparisonProvenances[1], model.comparisonProvenances[2])
    model.factorEvidence = buildFactorEvidence(provenance, evidenceRecords, { stepId })
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(hosts[0], hosts[1], { kind: "host", dataGrade: provenance.dataGrade, rank: provenance.rank })
    const dynamic = dynamicConclusion(stepId, provenance, model.factorDeltaTable, conclusionZh, conclusionEn)
    model.conclusionZh = dynamic.zh
    model.conclusionEn = dynamic.en
    model.structuredConclusion = buildStructuredConclusion(stepId, provenance, model.factorDeltaTable, null, model.boundaries)
  } else if (stepId === "step-4") {
    const guests = asArray(workbench?.guestSelection?.rankedGuestMetals)
    const provenance = buildGuestScoreProvenance(workbench, options)
    model.provenance = provenance
    model.comparisonProvenances = guests.slice(0, 3).map(guest => buildGuestScoreProvenance(workbench, { guest }))
    model.perFactorInterpretation = buildPerFactorInterpretation(provenance)
    model.factorDeltaTable = buildFactorDeltaTable(model.comparisonProvenances[0], model.comparisonProvenances[1], model.comparisonProvenances[2])
    model.factorEvidence = buildFactorEvidence(provenance, evidenceRecords, { stepId })
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(guests[0], guests[1], { kind: "guest", dataGrade: provenance.dataGrade, rank: provenance.rank })
    const dynamic = dynamicConclusion(stepId, provenance, model.factorDeltaTable, conclusionZh, conclusionEn)
    model.conclusionZh = dynamic.zh
    model.conclusionEn = dynamic.en
    model.structuredConclusion = buildStructuredConclusion(stepId, provenance, model.factorDeltaTable, null, model.boundaries)
  } else if (stepId === "step-5") {
    const provenance = buildRouteHgcpsScoreProvenance(workbench, options)
    model.provenance = provenance
    const routes = asArray(workbench?.complementarity?.routeScores)
    model.comparisonProvenances = routes.slice(0, 3).map(route => buildRouteHgcpsScoreProvenance(workbench, { route }))
    model.perFactorInterpretation = buildPerFactorInterpretation(provenance)
    model.factorDeltaTable = buildFactorDeltaTable(model.comparisonProvenances[0], model.comparisonProvenances[1], model.comparisonProvenances[2])
    model.factorEvidence = buildFactorEvidence(provenance, evidenceRecords, { stepId, routeId: provenance.routeId, evidenceRefs: routes[0]?.evidenceRefs })
    model.riskDecomposition = buildRiskDecomposition(routes[0] || workbench?.complementarity?.topRoute, evidenceRecords)
    model.counterfactual = buildCounterfactual(routes[0] || workbench?.complementarity?.topRoute, routes)
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.factorCompressionTrace = buildFactorCompressionTrace(workbench, options)
    model.routeFactorComparison = buildRouteFactorComparisonModel(workbench, options)
    model.descriptorAblation = workbench?.descriptorAblation || null
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(routes[0], routes[1], { kind: "route", dataGrade: provenance.dataGrade, rank: provenance.rank })
    const dynamic = dynamicConclusion(stepId, provenance, model.factorDeltaTable, conclusionZh, conclusionEn)
    model.conclusionZh = dynamic.zh
    model.conclusionEn = dynamic.en
    model.structuredConclusion = buildStructuredConclusion(stepId, provenance, model.factorDeltaTable, model.riskDecomposition, model.boundaries)
  } else {
    model.dataGradeBadges = buildScoreDataGradeBadges("curated")
  }
  return model
}
