/**
 * Organic Acid Score Provenance builders (V3.9.5.2).
 *
 * Turns the Step Why Panel into a real score explainer: raw / proxy fields ->
 * normalized value -> weight or factor -> sub-contribution -> weighted-sum or
 * multiplicative compression -> final score -> rank -> why it leads runner-ups.
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
  safeNumber,
} from "../organicAcidHostGuest/index.js"

export const ORGANIC_ACID_SCORE_PROVENANCE_VERSION = "V3.9.5.2"

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
  postModificationFeasibility: ["后修饰可行性", "Post-modification feasibility"],
  guestHostingFeasibility: ["客体承载可行性", "Guest hosting feasibility"],
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
}

const GRADE_META = {
  seed: { labelZh: "种子数据", labelEn: "Seed", tone: "info" },
  proxy: { labelZh: "代理数据", labelEn: "Proxy", tone: "warn" },
  curated: { labelZh: "人工整理", labelEn: "Curated", tone: "good" },
  inferred: { labelZh: "推断数据", labelEn: "Inferred", tone: "muted" },
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
  let product = 1
  const rows = ROUTE_FACTOR_DEFINITIONS.map(({ breakdownKey }) => {
    const factor = clamp01(breakdown[breakdownKey])
    const before = product
    product = product * factor
    const [labelZh, labelEn] = ROUTE_FACTOR_LABELS[breakdownKey] || [breakdownKey, breakdownKey]
    const isRisk = breakdownKey === "riskRetentionFactor"
    return {
      fieldKey: breakdownKey,
      labelZh,
      labelEn,
      rawValue: round(safeNumber(breakdown[breakdownKey]), 3),
      normalizedValue: round(factor, 3),
      weightOrFactor: round(factor, 3),
      contribution: round(product - before, 4),
      cumulativeValue: round(product, 4),
      dataGrade: factorDataGrade(breakdownKey, baseGrade),
      dataSourceFile: ROUTE_DATA_FILE,
      builderFunction: "buildHostGuestComplementarityScore",
      evidenceMode: "multiplicative-factor",
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
    formulaType: "multiplicative-factor",
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
    evidenceMode: "multiplicative-factor",
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
    factorValue: row.weightOrFactor,
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
    ? `当前 #1 相比 #2 主要优势来自${main.labelZh}（+${main.delta}），其次来自${second.labelZh}（+${second.delta}）。`
    : "当前仅有一条路线，缺少可比较的次优路线。"
  const autoSentenceEn = runnerUp
    ? `Compared with #2, #1 leads mainly on ${main.labelEn} (+${main.delta}), then on ${second.labelEn} (+${second.delta}).`
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
    questionZh: "这个分数怎么算出来的？",
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
        noteZh: "六因子乘法压缩，表示路线优先级，不是催化性能预测值。",
        noteEn: "Six-factor multiplicative compression; route priority, not catalytic-performance prediction.",
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

export function buildStepWhyPanelEnhancedModel(step, workbench, options = {}) {
  const stepId = safeText(step?.id, "step-0")
  const lang = options.lang || "zh"
  const isZh = lang === "zh"
  const conclusionZh = safeText(step?.result, "本步骤结论待补充。")
  const conclusionEn = safeText(step?.resultEn || step?.result, "Step conclusion pending.")
  const model = {
    stepId,
    titleZh: "为什么是这个结果？",
    titleEn: "Why this result?",
    scoreQuestionZh: "这个分数怎么算出来的？",
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
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(hosts[0], hosts[1], { kind: "host", dataGrade: provenance.dataGrade, rank: provenance.rank })
  } else if (stepId === "step-4") {
    const guests = asArray(workbench?.guestSelection?.rankedGuestMetals)
    const provenance = buildGuestScoreProvenance(workbench, options)
    model.provenance = provenance
    model.comparisonProvenances = guests.slice(0, 3).map(guest => buildGuestScoreProvenance(workbench, { guest }))
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(guests[0], guests[1], { kind: "guest", dataGrade: provenance.dataGrade, rank: provenance.rank })
  } else if (stepId === "step-5") {
    const provenance = buildRouteHgcpsScoreProvenance(workbench, options)
    model.provenance = provenance
    model.scoreSourceTable = buildScoreSourceTableModel(provenance)
    model.factorCompressionTrace = buildFactorCompressionTrace(workbench, options)
    model.routeFactorComparison = buildRouteFactorComparisonModel(workbench, options)
    model.dataGradeBadges = buildScoreDataGradeBadges(provenance)
    const routes = asArray(workbench?.complementarity?.routeScores)
    model.whyNotOther = buildDynamicWhyNotOtherExplanation(routes[0], routes[1], { kind: "route", dataGrade: provenance.dataGrade, rank: provenance.rank })
  } else {
    model.dataGradeBadges = buildScoreDataGradeBadges("curated")
  }
  return model
}
