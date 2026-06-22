import {
  buildHostGuestRouteExplanation,
  buildOrganicAcidHostGuestWorkbench,
  HGCPS_FORMULA_TEXT,
  safeNumber,
} from "../organicAcidHostGuest/index.js"
import {
  buildFlowNetworkExportJson,
  buildGuestCompetitionModel,
  buildHostCompetitionModel,
  buildOrganicAcidAlgorithmFlowNetwork,
  buildRouteCompetitionModel,
} from "../organicAcidAlgorithmFlow/index.js"
import { buildStepWhyPanelEnhancedModel } from "../organicAcidScoreProvenance/index.js"
import {
  buildDescriptorMappingExplanationModel,
  buildDescriptorMappingSummary,
  buildPathwayEvidenceHeatmapModel,
  buildPathwayEvidenceSummary,
  buildTerminologyCrosswalk,
  buildValidationCoverageMatrixModel,
  buildValidationCoverageSummary,
} from "../organicAcidExplanationClosure/index.js"

export const ORGANIC_ACID_STEPWISE_EXECUTION_VERSION = "V3.9.5.2"
export const ORGANIC_ACID_STEPWISE_EXECUTION_NAME = "Organic Acid Stepwise Algorithm Execution Chain"

const METHODOLOGY_BASE = "project-evolution-organic-acid-algorithm-methodology"
const STEP_IDS = ["step-0", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6"]

const CONFIDENCE_VALUE = {
  high: 0.86,
  "medium-high": 0.76,
  medium: 0.62,
  "medium-low": 0.46,
  low: 0.32,
}

const STEP_LABELS = [
  ["筛选目标设定", "Screening Objective"],
  ["反应路径分解", "Reaction Pathway Decomposition"],
  ["路径与描述符对应关系", "Pathway-Descriptor Mapping"],
  ["主体 MOF 筛选", "Host MOF Screening"],
  ["客体（掺杂金属）筛选", "Guest (Dopant Metal) Screening"],
  ["主客体路线评分", "Host-Guest Route Scoring"],
  ["实验验证路线输出", "Experimental Validation Route Output"],
]

const STEP_ZERO_EYEBROW = "Screening Objective / 筛选目标"
const COMMON_BOUNDARIES = ["非催化性能结论", "非机器学习预测", "尚未完成性能验证"]

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function safeText(value, fallback = "pending") {
  if (value === undefined || value === null) return fallback
  const next = String(value).trim()
  return next || fallback
}

function safeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function safeList(value, fallback = "pending") {
  const rows = asArray(value).map(item => safeText(item, "")).filter(Boolean)
  return rows.length ? rows : [fallback]
}

function roundScore(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

function clamp01(value) {
  return Math.max(0, Math.min(1, safeNumber(value, 0)))
}

function textFor(lang, zh, en) {
  return lang === "zh" ? zh : en
}

function methodAnchor(sectionId, formulaId = "") {
  if (!formulaId) return `#${METHODOLOGY_BASE}-${sectionId}`
  return `#${METHODOLOGY_BASE}-formula-${formulaId}`
}

function routeLabel(route = {}) {
  const host = safeText(route.hostMof, "Host")
  const guest = safeText(route.guestMetal, "guest")
  return `${host} + ${guest}`
}

function metric(id, labelZh, labelEn, value, noteZh = "", noteEn = "") {
  return {
    id,
    labelZh,
    labelEn,
    value,
    noteZh: safeText(noteZh, ""),
    noteEn: safeText(noteEn, ""),
  }
}

function resolveWorkbench(workbenchInput, sourceData = {}) {
  return workbenchInput || buildOrganicAcidHostGuestWorkbench(sourceData || {})
}

function sourceArrays(workbench, sourceData = {}) {
  return {
    pathwaySteps: asArray(sourceData.pathwaySteps).length ? asArray(sourceData.pathwaySteps) : asArray(workbench?.pathwaySteps),
    descriptorMap: asArray(sourceData.pathwayDescriptorMap).length ? asArray(sourceData.pathwayDescriptorMap) : asArray(workbench?.descriptorMap),
    hosts: asArray(workbench?.hostSelection?.rankedHosts).length ? asArray(workbench.hostSelection.rankedHosts) : asArray(sourceData.hostMofCandidates),
    guests: asArray(workbench?.guestSelection?.rankedGuestMetals).length ? asArray(workbench.guestSelection.rankedGuestMetals) : asArray(sourceData.guestMetalCandidates),
    routes: asArray(workbench?.complementarity?.routeScores).length ? asArray(workbench.complementarity.routeScores) : asArray(sourceData.hostGuestRoutes),
    evidence: asArray(sourceData.evidenceRiskRecords).length ? asArray(sourceData.evidenceRiskRecords) : asArray(workbench?.evidenceMatrix),
    validations: asArray(sourceData.validationExperiments).length ? asArray(sourceData.validationExperiments) : asArray(workbench?.experimentalRoute?.experiments),
  }
}

function confidenceValue(value) {
  const key = safeText(value, "medium").toLowerCase()
  return CONFIDENCE_VALUE[key] ?? (key.includes("high") ? 0.8 : key.includes("low") ? 0.38 : 0.62)
}

function chartBase(type, titleZh, titleEn, subtitleZh, subtitleEn, rows = [], extras = {}) {
  return {
    type,
    titleZh,
    titleEn,
    subtitleZh: safeText(subtitleZh, ""),
    subtitleEn: safeText(subtitleEn, ""),
    rows,
    labels: {
      zh: titleZh,
      en: titleEn,
    },
    ...extras,
  }
}

function buildCandidateRowsFromHosts(workbench) {
  const hosts = buildHostCompetitionModel(workbench, "zh")
  const sourceHosts = asArray(workbench?.hostSelection?.rankedHosts)
  return hosts.map(row => {
    const source = sourceHosts.find(host => host.displayName === row.host) || {}
    return {
      ...row,
      id: safeText(source.hostMofId || row.host),
      labelZh: row.host,
      labelEn: row.host,
      selected: row.rank === 1,
      scoreBreakdown: asObject(source.hostScoreBreakdown),
    }
  })
}

function buildCandidateRowsFromGuests(workbench) {
  const guests = buildGuestCompetitionModel(workbench, "zh")
  const sourceGuests = asArray(workbench?.guestSelection?.rankedGuestMetals)
  return guests.map(row => {
    const source = sourceGuests.find(guest => guest.guestMetal === row.metal) || {}
    return {
      ...row,
      id: row.metal,
      labelZh: row.metal,
      labelEn: row.metal,
      selected: row.rank === 1,
      scoreBreakdown: asObject(source.guestScoreBreakdown),
    }
  })
}

function buildCandidateRowsFromRoutes(workbench) {
  const sourceRoutes = asArray(workbench?.complementarity?.routeScores)
  return buildRouteCompetitionModel(workbench, "zh").map(row => {
    const source = sourceRoutes.find(route => route.routeId === row.routeId) || {}
    return {
      ...row,
      id: row.routeId,
      labelZh: row.route,
      labelEn: row.route,
      selected: row.rank === 1,
      scoreBreakdown: row.factorBreakdown,
      routeType: safeText(source.routeType),
      targetProduct: safeText(source.targetProduct, "formic acid / organic acid"),
      mainRisk: safeText(source.mainRisk, "risk retained"),
      mainReason: safeText(source.mainReason, row.whyRankedHereZh),
    }
  })
}

export function buildObjectiveInputOutputChartModel(workbenchInput = null, sourceData = {}, activationWorkbench = null, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || arrays.routes[0] || {}
  const matrix = activationWorkbench?.minimumExperimentalMatrix || {}
  const readiness = activationWorkbench?.readiness || {}
  const rows = [
    metric("pathway", "路径步骤", "pathway steps", arrays.pathwaySteps.length, "CO₂ -> 有机酸路径瓶颈", "CO2-to-organic-acid bottlenecks"),
    metric("descriptor", "描述符映射", "descriptor mappings", arrays.descriptorMap.length, "路径步骤转换为可筛选材料特征", "pathway steps become material descriptors"),
    metric("host", "主体候选", "host candidates", arrays.hosts.length, "主体骨架竞争池", "host framework pool"),
    metric("guest", "客体金属", "guest metals", arrays.guests.length, "客体 / 掺杂竞争池", "guest / dopant pool"),
    metric("route", "主客体路线", "host-guest routes", arrays.routes.length, "HGCPS 路线竞争池", "HGCPS route pool"),
    metric("evidence", "证据风险记录", "evidence-risk records", arrays.evidence.length, "证据置信与风险保留输入", "evidence confidence and risk-retention input"),
    metric("validation", "实验矩阵", "validation matrix", asArray(matrix.all).length || arrays.validations.length, "最小验证矩阵 / 模板", "minimum validation matrix / templates"),
  ]
  return chartBase(
    "objective-input-output",
    "目标输入输出图",
    "Objective Input-Output Diagram",
    "左侧输入规模、中间筛选算法、右侧输出实验路线均由当前 builder 输出。",
    "Input scale, algorithm body, and route output are all derived from current builders.",
    rows,
    {
      targetProduct: safeText(topRoute.targetProduct, "formic acid / organic acid"),
      targetProductLabel: textFor(lang, "目标产物", "target product"),
      algorithmLabelZh: "主客体路径筛选算法",
      algorithmLabelEn: "Host-Guest Pathway Screening Algorithm",
      outputRoute: routeLabel(topRoute),
      outputRouteType: safeText(topRoute.routeType, "doping / post-modification / bimetallic construction"),
      readinessLevel: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
      boundariesZh: COMMON_BOUNDARIES,
      boundariesEn: ["Not final catalytic proof", "Not formal machine learning recommendation", "Not performance-validated"],
    }
  )
}

export function buildPathwayCoverageChartModel(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const descriptorByStep = arrays.descriptorMap.reduce((acc, mapping) => {
    const stepId = safeText(mapping.stepId)
    acc[stepId] = acc[stepId] || []
    acc[stepId].push(mapping)
    return acc
  }, {})
  const rows = arrays.pathwaySteps.map((step, index) => {
    const stepId = safeText(step.stepId, `step-${index + 1}`)
    const relatedEvidence = arrays.evidence.filter(row => row.linkedStepId === stepId)
    const relatedDescriptors = asArray(descriptorByStep[stepId])
    const riskRecords = relatedEvidence.filter(row => safeText(row.riskType, "") || safeNumber(row.penalty, 0) > 0)
    return {
      id: stepId,
      order: safeNumber(step.order, index + 1),
      labelZh: safeText(step.stepName),
      labelEn: safeText(step.stepName),
      evidenceCount: safeNumber(step.evidenceCount, relatedEvidence.length),
      confidenceLevel: safeText(step.confidenceLevel, "medium"),
      confidenceValue: confidenceValue(step.confidenceLevel),
      descriptorCount: relatedDescriptors.reduce((sum, mapping) => sum + safeList(mapping.descriptors, "").filter(Boolean).length, 0),
      riskFlag: riskRecords.length > 0,
      riskCount: riskRecords.length,
      riskLabelZh: riskRecords.length ? "存在待验证风险" : "未见显式风险",
      riskLabelEn: riskRecords.length ? "risk retained" : "no explicit risk",
      bottleneckType: safeText(step.bottleneckType),
      whyZh: safeText(step.chemicalMeaning, "路径步骤说明待补充。"),
      whyEn: safeText(step.chemicalMeaning, "Pathway explanation pending."),
    }
  })
  return chartBase(
    "pathway-coverage",
    "路径步骤覆盖图",
    "Pathway Step Coverage Chart",
    "按路径步骤展示证据数量、置信度、映射描述符数量与风险标记。",
    "Shows evidence count, confidence, descriptor count, and risk flags per pathway step.",
    rows
  )
}

export function buildDescriptorMappingChartModel(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const steps = arrays.pathwaySteps.map((step, index) => ({
    id: safeText(step.stepId, `step-${index + 1}`),
    labelZh: safeText(step.stepName),
    labelEn: safeText(step.stepName),
    order: safeNumber(step.order, index + 1),
  }))
  const descriptors = arrays.descriptorMap.map((mapping, index) => ({
    id: safeText(mapping.mappingId, `descriptor-${index + 1}`),
    labelZh: safeText(mapping.descriptorGroup),
    labelEn: safeText(mapping.descriptorGroup),
    descriptorCount: safeList(mapping.descriptors, "").filter(Boolean).length,
    missingCount: safeList(mapping.missingDescriptors, "").filter(Boolean).length,
    evidenceType: safeText(mapping.evidenceType, "proxy"),
    confidenceLevel: safeText(mapping.confidenceLevel, "medium"),
    descriptors: safeList(mapping.descriptors),
    missingDescriptors: safeList(mapping.missingDescriptors, "same-condition descriptor pending"),
  }))
  const edges = arrays.descriptorMap.map((mapping, index) => ({
    id: safeText(mapping.mappingId, `edge-${index + 1}`),
    source: safeText(mapping.stepId),
    target: safeText(mapping.mappingId, `descriptor-${index + 1}`),
    labelZh: safeText(mapping.descriptorDirection, "描述符方向待补充"),
    labelEn: safeText(mapping.descriptorDirection, "descriptor direction pending"),
    evidenceType: safeText(mapping.evidenceType, "proxy"),
  }))
  return chartBase(
    "descriptor-mapping",
    "路径—描述符映射图",
    "Pathway-Descriptor Mapping Graph",
    "每条边来自 pathway_descriptor_map，不把所有描述符混成一个总表。",
    "Each edge comes from pathway_descriptor_map rather than a pooled descriptor table.",
    descriptors,
    { steps, descriptors, edges }
  )
}

export function buildHostRankingChartModel(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const rows = buildCandidateRowsFromHosts(workbench)
  const selected = rows.find(row => row.selected) || rows[0] || {}
  return chartBase(
    "host-ranking",
    "主体候选排名图",
    "Host Candidate Ranking Chart",
    "主体排名由 host_mof_candidates 与 buildHostMofSelection 输出推导。",
    "Host ranking is derived from host_mof_candidates and buildHostMofSelection output.",
    rows,
    {
      selectedId: safeText(selected.id, ""),
      selectedLabel: safeText(selected.labelZh || selected.host, ""),
      maxScore: rows.reduce((max, row) => Math.max(max, safeNumber(row.score, 0)), 0),
      topRows: rows.slice(0, 5),
    }
  )
}

export function buildGuestRankingChartModel(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const rows = buildCandidateRowsFromGuests(workbench)
  const selected = rows.find(row => row.selected) || rows[0] || {}
  return chartBase(
    "guest-ranking",
    "客体金属排名图",
    "Guest Metal Ranking Chart",
    "客体排名由 guest_metal_candidates 与 buildGuestMetalSelection 输出推导。",
    "Guest ranking is derived from guest_metal_candidates and buildGuestMetalSelection output.",
    rows,
    {
      selectedId: safeText(selected.id, ""),
      selectedLabel: safeText(selected.labelZh || selected.metal, ""),
      maxScore: rows.reduce((max, row) => Math.max(max, safeNumber(row.score, 0)), 0),
      topRows: rows.slice(0, 5),
    }
  )
}

export function buildRouteHgcpsBreakdownChartModel(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const rows = buildCandidateRowsFromRoutes(workbench)
  const selected = rows.find(row => row.selected) || rows[0] || {}
  const factorLabels = [
    ["hostStability", "主体稳定性", "host stability"],
    ["hostPathwaySupport", "路径支持", "host pathway support"],
    ["guestActivityCompensation", "客体活性补偿", "guest activity compensation"],
    ["complementarity", "主客体互补", "host-guest complementarity"],
    ["evidenceConfidence", "证据置信", "evidence confidence"],
    ["riskRetention", "风险保留", "risk retention"],
  ]
  const factorRows = factorLabels.map(([key, zh, en]) => ({
    id: key,
    labelZh: zh,
    labelEn: en,
    value: roundScore(selected.scoreBreakdown?.[key], 3),
  }))
  return chartBase(
    "route-hgcps-breakdown",
    "路线评分分解图",
    "Route HGCPS Breakdown Chart",
    "展示路线排名与选中路线的 HGCPS 六因子乘法压缩。",
    "Shows route ranking and six-factor HGCPS compression for the selected route.",
    rows,
    {
      selectedRouteId: safeText(selected.routeId || selected.id, ""),
      selectedRoute: safeText(selected.route, ""),
      selectedHgcps: roundScore(selected.hgcps, 3),
      factorRows,
      formula: HGCPS_FORMULA_TEXT,
      maxScore: rows.reduce((max, row) => Math.max(max, safeNumber(row.hgcps, 0)), 0),
    }
  )
}

export function buildValidationMatrixCoverageChartModel(workbenchInput = null, sourceData = {}, activationWorkbench = null, lang = "zh") {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const matrix = activationWorkbench?.minimumExperimentalMatrix || {}
  const template = activationWorkbench?.sameConditionDataTemplate || {}
  const readiness = activationWorkbench?.readiness || {}
  const matrixRows = asArray(matrix.all).length ? asArray(matrix.all) : arrays.validations.map((experiment, index) => ({
    experimentGroupId: safeText(experiment.experimentId, `validation-${index + 1}`),
    experimentName: safeText(experiment.recommendedExperiment),
    routeId: safeText(experiment.routeId),
    controlType: safeText(experiment.riskAddressed, "validation"),
    purpose: safeText(experiment.purpose),
    mustRun: experiment.validationPriority === "P0",
    priority: index + 1,
    requiredCharacterizationBeforeReaction: asArray(experiment.requiredCharacterization),
    requiredProductAnalysis: asArray(experiment.requiredData),
  }))
  const coverageChecks = [
    ["blank", "空白对照", "blank control", row => /blank|no catalyst/i.test(`${row.controlType} ${row.experimentName}`)],
    ["pristine-host", "pristine 主体对照", "pristine host control", row => /pristine|host scaffold|baseline/i.test(`${row.controlType} ${row.experimentName} ${row.purpose}`)],
    ["top-route", "最高路线验证", "top route validation", row => /route-al-mof-mo|top/i.test(`${row.routeId} ${row.experimentName}`)],
    ["guest-control", "客体金属对照", "guest metal control", row => /guest|W|Fe|Co|Ni/i.test(`${row.controlType} ${row.guestMetal} ${row.experimentName}`) && !/route-al-mof-mo/i.test(row.routeId)],
    ["host-control", "主体对照", "host control", row => /host|zr/i.test(`${row.controlType} ${row.routeId} ${row.experimentName}`)],
    ["mo-only", "Mo-only 对照", "Mo-only control", row => /mo-only|moox|MoO/i.test(`${row.routeId} ${row.experimentName} ${row.controlType}`)],
    ["structure", "结构表征", "structure characterization", row => safeList(row.requiredCharacterizationBeforeReaction, "").join(" ").match(/PXRD|FTIR|XPS|ICP|sorption|structure/i)],
    ["product", "产物分析", "product analysis", row => safeList(row.requiredProductAnalysis, "").join(" ").match(/HPLC|IC|GC|formic|product|calibration/i)],
    ["carbon", "碳平衡", "carbon balance", row => `${row.purpose} ${row.notes} ${safeList(row.requiredProductAnalysis, "").join(" ")}`.match(/carbon/i)],
  ]
  const rows = coverageChecks.map(([id, labelZh, labelEn, test]) => {
    const matched = matrixRows.filter(row => Boolean(test(row)))
    return {
      id,
      labelZh,
      labelEn,
      covered: matched.length > 0,
      count: matched.length,
      examples: matched.slice(0, 3).map(row => safeText(row.experimentName || row.recommendedExperiment)),
    }
  })
  return chartBase(
    "validation-matrix-coverage",
    "验证矩阵覆盖图",
    "Validation Matrix Coverage Chart",
    "把路线输出转成最小实验矩阵覆盖项，仍保持 planning-ready 边界。",
    "Turns route output into minimum experiment matrix coverage while preserving planning-ready boundaries.",
    rows,
    {
      experimentCount: matrixRows.length,
      requiredFieldCount: asArray(template.requiredFields).length,
      readinessLevel: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
      canUseForPerformanceClaim: safeBoolean(readiness.canUseForPerformanceClaim, false),
      canUseForMachineLearning: safeBoolean(readiness.canUseForMachineLearning, false),
    }
  )
}

export function buildStepDynamicChartModel(stepId, workbenchInput = null, sourceData = {}, activationWorkbench = null, lang = "zh") {
  if (stepId === "step-1") return buildPathwayCoverageChartModel(workbenchInput, sourceData, lang)
  if (stepId === "step-2") return buildDescriptorMappingChartModel(workbenchInput, sourceData, lang)
  if (stepId === "step-3") return buildHostRankingChartModel(workbenchInput, sourceData, lang)
  if (stepId === "step-4") return buildGuestRankingChartModel(workbenchInput, sourceData, lang)
  if (stepId === "step-5") return buildRouteHgcpsBreakdownChartModel(workbenchInput, sourceData, lang)
  if (stepId === "step-6") return buildValidationMatrixCoverageChartModel(workbenchInput, sourceData, activationWorkbench, lang)
  return buildObjectiveInputOutputChartModel(workbenchInput, sourceData, activationWorkbench, lang)
}

function buildStepFields(stepId, context) {
  const { workbench, sourceData, activationWorkbench, lang } = context
  const arrays = sourceArrays(workbench, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || arrays.routes[0] || {}
  const topRouteLabel = routeLabel(topRoute)
  const selectedHost = workbench?.hostSelection?.selectedHost || arrays.hosts[0] || {}
  const selectedGuest = workbench?.guestSelection?.selectedGuestMetal || arrays.guests[0] || {}
  const routeExplanation = buildHostGuestRouteExplanation(topRoute, {
    hostSelection: workbench?.hostSelection,
    guestSelection: workbench?.guestSelection,
    descriptorMap: workbench?.descriptorMap,
    evidenceRecords: sourceData?.evidenceRiskRecords || [],
    validationExperiments: sourceData?.validationExperiments || [],
  })
  const matrix = activationWorkbench?.minimumExperimentalMatrix || {}
  const readiness = activationWorkbench?.readiness || {}
  const commonBoundaries = COMMON_BOUNDARIES
  const fields = {
    "step-0": {
      input: ["pathway steps", "descriptor mappings", "host MOF candidates", "guest metal candidates", "host–guest route candidates", "evidence / risk records", "validation experiment templates", "activation readiness data"],
      logic: "先声明筛选任务与输入边界，再进入路径、描述符、主体、客体、路线和实验验证链条。",
      formula: "筛选目标 = target product + candidate pools + evidence/risk boundary + validation-readiness boundary",
      competition: "本步骤不进行候选胜负判断，只定义本轮算法要解决的筛选问题。",
      result: `${topRouteLabel} ${safeText(topRoute.routeType, "route")} 作为高优先级实验验证路线输出。`,
      why: "需要先给出筛选目标，避免用户把后续路线排序误读成正式机器学习预测或最终性能证明。",
      whyNotOther: "没有起点时，网络会像静态结果展示；有 Step 0 后，用户能看到输入、输出和边界。",
      risk: commonBoundaries.join("；"),
      next: "进入路径步骤识别，确认 CO₂ -> 有机酸路径由哪些反应瓶颈驱动。",
      detailTarget: "start-chain",
      methodologyAnchor: methodAnchor("algorithm-positioning", "pathway-flow"),
    },
    "step-1": {
      input: [`${arrays.pathwaySteps.length} 个 pathway steps`, `${arrays.evidence.length} 条 evidence / risk records`],
      logic: "按路径步骤读取 evidence count、confidence level、mapped descriptor count 与 risk flag。",
      formula: "Pathway coverage = evidence count + confidence level + descriptor coverage + risk flag",
      competition: "路径步骤不是互相淘汰，而是决定后续描述符必须覆盖哪些反应瓶颈。",
      result: `识别 ${arrays.pathwaySteps.length} 个 CO₂ -> 有机酸路径步骤。`,
      why: "算法从路径步骤开始，是因为主体和客体候选必须服务于 CO₂ 富集、活化、HCOO* 稳定、PCET、脱附与稳定性风险。",
      whyNotOther: "不直接从材料名称开始，避免把材料 popularity 当作筛选依据。",
      risk: "同条件水相 170°C 证据仍不足，风险保留到验证矩阵。",
      next: "把每个路径步骤映射为可比较描述符组。",
      detailTarget: "evidence",
      methodologyAnchor: methodAnchor("algorithm-positioning", "pathway-flow"),
    },
    "step-2": {
      input: [`${arrays.pathwaySteps.length} 个 pathway steps`, `${arrays.descriptorMap.length} 条 descriptor mappings`],
      logic: "每个 pathway step 只连接相关 descriptor group，并保留 missing descriptor 和 evidence type。",
      formula: "Descriptor mapping = pathway bottleneck -> required material descriptor group",
      competition: "描述符按路径分组，不把孔结构、Lewis 酸性、HCOO* proxy、PCET 和稳定性混成单一总分。",
      result: `生成 ${arrays.descriptorMap.length} 组路径—描述符映射。`,
      why: "路径步骤不同，对主体骨架与客体金属的要求也不同，因此必须先分组再评分。",
      whyNotOther: "如果所有描述符混排，无法解释为什么稳定性、活性补偿和风险各自影响不同后续步骤。",
      risk: "部分描述符仍是 proxy / inferred，需要后续实验补证。",
      next: "用描述符驱动主体 MOF 筛选。",
      detailTarget: "evidence",
      methodologyAnchor: methodAnchor("descriptor-mapping", "descriptor-map"),
    },
    "step-3": {
      input: [`${arrays.hosts.length} 个主体 MOF 候选`, "稳定性、孔环境、改性可行性、客体承载与 provenance"],
      logic: "对主体候选进行加权评分并排序，保留 backup / control。",
      formula: "Host Score = weighted(stability, aqueous stability, pore environment, modification feasibility, guest hosting, provenance)",
      competition: buildCandidateRowsFromHosts(workbench),
      result: `${safeText(selectedHost.displayName)} 作为 stable host framework candidate 进入后续客体筛选。`,
      why: `${safeText(selectedHost.displayName)} 在主体骨架候选中综合稳定性、孔环境和 Mo 承载可行性更强。`,
      whyNotOther: "其他主体保留为 backup / control，用于检验主体现象是否稳健。",
      risk: safeText(selectedHost.limitation, "主体局限待验证。"),
      next: "在选中主体边界下筛选客体 / 掺杂金属。",
      detailTarget: "competition-host",
      methodologyAnchor: methodAnchor("host-selection", "host-selection"),
    },
    "step-4": {
      input: [`${arrays.guests.length} 个客体 / 掺杂金属候选`, "CO₂ activation、HCOO* stabilization、PCET、主体兼容性与引入可行性"],
      logic: "对客体金属进行加权评分，并解释 backup / conditional / control 角色。",
      formula: "Guest Score = weighted(CO2 activation, formate stabilization, electron transfer, host compatibility, introduction feasibility)",
      competition: buildCandidateRowsFromGuests(workbench),
      result: `${safeText(selectedGuest.guestMetal)} 作为 guest / dopant / activity compensation metal 进入路线组合。`,
      why: `${safeText(selectedGuest.guestMetal)} 同时支持 CO₂ 活化、HCOO* 稳定和 PCET，可补偿主体活性不足。`,
      whyNotOther: "W、Fe、Co、Ni 等候选保留为 backup / conditional / control，用于排除非目标客体泛化效应。",
      risk: safeText(selectedGuest.mainRisk, "客体金属风险待验证。"),
      next: "组合主体与客体，并用 HGCPS 评分路线。",
      detailTarget: "competition-guest",
      methodologyAnchor: methodAnchor("guest-selection", "guest-selection"),
    },
    "step-5": {
      input: [`${arrays.routes.length} 条主客体路线`, "host stability、pathway support、guest compensation、complementarity、evidence confidence、risk retention"],
      logic: "使用 HGCPS 六因子乘法评分，风险保留因子继续压缩路线分数。",
      formula: HGCPS_FORMULA_TEXT,
      competition: buildCandidateRowsFromRoutes(workbench),
      result: `${topRouteLabel} 是当前最高优先级验证路线。`,
      why: safeText(routeExplanation.exportPayload?.rankRationale || workbench?.complementarity?.whyTopRanked, `${topRouteLabel} 由 HGCPS builder 输出为当前 top route。`),
      whyNotOther: "非 top route 的短板来自主体替代、客体补偿不足、证据置信不足或风险保留压缩。",
      risk: safeText(topRoute.mainRisk, "路线风险待验证。"),
      next: "把 top route 转换为最小实验验证矩阵。",
      detailTarget: "competition-route",
      methodologyAnchor: methodAnchor("hgcps", "hgcps"),
    },
    "step-6": {
      input: [`${asArray(matrix.all).length || arrays.validations.length} 个实验验证项`, `${asArray(activationWorkbench?.sameConditionDataTemplate?.requiredFields).length || 0} 个 required same-condition fields`, safeText(readiness.readinessLevel, "planning-ready / not performance-validated")],
      logic: "将 route output 转成 blank、pristine host、top route、guest control、host control、Mo-only、结构表征、产物分析和碳平衡覆盖项。",
      formula: "Validation readiness = minimum matrix coverage + same-condition data template + feedback rules",
      competition: "实验输出不是新的排名竞赛，而是把路线假设转成可执行验证计划。",
      result: "实验规划可启用；尚未完成性能验证。",
      why: "只有同条件实验矩阵、结构表征、产物分析和碳平衡回填后，才能更新 evidence confidence / risk retention。",
      whyNotOther: "不直接声明性能证明，也不把 feedback preview 当作正式机器学习更新。",
      risk: commonBoundaries.join("；"),
      next: "打开实验启用中心，执行最小实验矩阵并回填反馈规则。",
      detailTarget: "activation",
      methodologyAnchor: methodAnchor("experimental-feedback", "feedback-evidence"),
    },
  }
  return fields[stepId] || fields["step-0"]
}

export function buildExecutionStepModel(stepId, workbenchInput = null, sourceData = {}, options = {}) {
  const lang = options.lang || "zh"
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const activationWorkbench = options.activationWorkbench || {}
  const stepIndex = Math.max(0, STEP_IDS.indexOf(stepId))
  const [nameZh, nameEn] = STEP_LABELS[stepIndex] || STEP_LABELS[0]
  const fields = buildStepFields(STEP_IDS[stepIndex] || "step-0", { workbench, sourceData, activationWorkbench, lang })
  const dynamicChartModel = buildStepDynamicChartModel(STEP_IDS[stepIndex] || "step-0", workbench, sourceData, activationWorkbench, lang)
  const stepModel = {
    id: STEP_IDS[stepIndex] || "step-0",
    stepNumber: stepIndex,
    nameZh,
    nameEn,
    label: textFor(lang, nameZh, nameEn),
    eyebrowZh: stepIndex === 0 ? STEP_ZERO_EYEBROW : `Step ${stepIndex}`,
    eyebrowEn: stepIndex === 0 ? STEP_ZERO_EYEBROW : `Step ${stepIndex}`,
    anchorId: `organic-acid-execution-${STEP_IDS[stepIndex] || "step-0"}`,
    input: Array.isArray(fields.input) ? fields.input.map(item => safeText(item)) : [safeText(fields.input)],
    logic: safeText(fields.logic),
    formula: safeText(fields.formula),
    competition: Array.isArray(fields.competition) ? fields.competition : safeText(fields.competition),
    result: safeText(fields.result),
    why: safeText(fields.why),
    whyNotOther: safeText(fields.whyNotOther),
    risk: safeText(fields.risk),
    next: safeText(fields.next),
    detailTarget: safeText(fields.detailTarget),
    methodologyAnchor: safeText(fields.methodologyAnchor, `#${METHODOLOGY_BASE}`),
    dynamicChartModel,
    buttons: [
      { id: "methodology", labelZh: "查看对应公式", labelEn: "View formula", target: safeText(fields.methodologyAnchor, `#${METHODOLOGY_BASE}`) },
      { id: "detail", labelZh: stepIndex === 6 ? "打开实验启用中心" : "查看筛选依据", labelEn: stepIndex === 6 ? "Open Activation Center" : "View screening basis", target: safeText(fields.detailTarget) },
    ],
  }
  stepModel.whyPanelEnhanced = buildStepWhyPanelEnhancedModel(stepModel, workbench, { lang })
  const enhanced = stepModel.whyPanelEnhanced
  if (stepModel.id === "step-1") {
    enhanced.pathwayEvidenceHeatmap = buildPathwayEvidenceHeatmapModel(workbench, sourceData)
    enhanced.closureSummary = buildPathwayEvidenceSummary(workbench, sourceData)
  } else if (stepModel.id === "step-2") {
    enhanced.descriptorMappingExplanation = buildDescriptorMappingExplanationModel(workbench, sourceData)
    enhanced.closureSummary = buildDescriptorMappingSummary(workbench, sourceData)
  } else if (stepModel.id === "step-5") {
    enhanced.terminologyCrosswalk = buildTerminologyCrosswalk()
  } else if (stepModel.id === "step-6") {
    enhanced.validationCoverageMatrix = buildValidationCoverageMatrixModel(workbench, sourceData, activationWorkbench)
    enhanced.closureSummary = buildValidationCoverageSummary(workbench, sourceData, activationWorkbench)
  }
  if (enhanced.closureSummary) {
    enhanced.conclusionZh = enhanced.closureSummary.oneLineConclusionZh
    enhanced.conclusionEn = enhanced.closureSummary.oneLineConclusionEn
  }
  return stepModel
}

export function buildStepNavigatorModel(steps = [], selectedStepId = "step-0", lang = "zh") {
  const selectedId = STEP_IDS.includes(selectedStepId) ? selectedStepId : "step-0"
  return {
    selectedStepId: selectedId,
    selectedStepNumber: steps.find(step => step.id === selectedId)?.stepNumber || 0,
    titleZh: "Step Navigator",
    titleEn: "Step Navigator",
    startTraceLabelZh: "从路径开始追踪",
    startTraceLabelEn: "Trace from pathway",
    items: steps.map(step => ({
      id: step.id,
      stepNumber: step.stepNumber,
      labelZh: step.nameZh,
      labelEn: step.nameEn,
      label: textFor(lang, step.nameZh, step.nameEn),
      anchorId: step.anchorId,
      active: step.id === selectedId,
    })),
  }
}

export function buildStepWhyPanelModel(step, chainContext = {}, lang = "zh") {
  const chart = step?.dynamicChartModel || {}
  return {
    stepId: safeText(step?.id, "step-0"),
    titleZh: "为什么是这个结果？",
    titleEn: "Why this result?",
    subtitleZh: "该解释由当前数据与 builder 输出生成，不是静态文案。",
    subtitleEn: "This explanation is generated from current data and builder output, not static copy.",
    stepProblemZh: safeText(step?.nameZh, "筛选目标设定"),
    stepProblemEn: safeText(step?.nameEn, "Screening Objective"),
    inputs: safeList(step?.input),
    logic: safeText(step?.logic),
    result: safeText(step?.result),
    why: safeText(step?.why),
    whyNotOther: safeText(step?.whyNotOther),
    risk: safeText(step?.risk),
    next: safeText(step?.next),
    methodologyAnchor: safeText(step?.methodologyAnchor, `#${METHODOLOGY_BASE}`),
    chart,
    comparisonHintZh: chart.rows?.length ? "点击图表候选可查看该候选解释。" : "本步骤使用目标输入输出图解释算法起点。",
    comparisonHintEn: chart.rows?.length ? "Click a chart candidate to inspect its explanation." : "This step uses the objective input-output diagram.",
    boundaries: COMMON_BOUNDARIES,
    selectedStepLabel: textFor(lang, safeText(step?.nameZh), safeText(step?.nameEn)),
    chainVersion: safeText(chainContext.version, ORGANIC_ACID_STEPWISE_EXECUTION_VERSION),
  }
}

export function buildExecutionMiniMapModel(flowNetwork = {}, selectedStepId = "step-0", lang = "zh") {
  const labels = [
    ["step-0", "Objective", "目标"],
    ["step-1", "Pathway", "路径"],
    ["step-2", "Descriptor", "描述符"],
    ["step-3", "Host", "主体"],
    ["step-4", "Guest", "客体"],
    ["step-5", "Route", "路线"],
    ["step-6", "Validation", "验证"],
  ]
  const topPath = new Set(asArray(flowNetwork?.highlightedPaths?.topPath))
  return {
    titleZh: "Mini Map",
    titleEn: "Mini Map",
    roleZh: "Flow Network 已降级为全局链条 mini map。",
    roleEn: "Flow Network is repositioned as a global-chain mini map.",
    nodes: labels.map(([id, en, zh]) => ({
      id,
      labelZh: zh,
      labelEn: en,
      label: textFor(lang, zh, en),
      active: id === selectedStepId,
      supportedByTopPath: id === "step-0" || topPath.size > 0,
    })),
    edges: labels.slice(0, -1).map((row, index) => ({ source: row[0], target: labels[index + 1][0] })),
  }
}

export function buildPredictionObjectiveStep(workbenchInput = null, sourceData = {}, options = {}) {
  return buildExecutionStepModel("step-0", workbenchInput, sourceData, options)
}

export function buildStepwiseExecutionChain(workbenchInput = null, sourceData = {}, options = {}) {
  const lang = options.lang || "zh"
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const flowNetwork = options.flowNetwork || buildOrganicAcidAlgorithmFlowNetwork(workbench, sourceData, {
    lang,
    activationWorkbench: options.activationWorkbench,
  })
  const selectedStepId = STEP_IDS.includes(options.selectedStepId) ? options.selectedStepId : "step-0"
  const steps = STEP_IDS.map(stepId => buildExecutionStepModel(stepId, workbench, sourceData, {
    lang,
    activationWorkbench: options.activationWorkbench,
  }))
  const selectedStep = steps.find(step => step.id === selectedStepId) || steps[0]
  const chain = {
    version: ORGANIC_ACID_STEPWISE_EXECUTION_VERSION,
    name: ORGANIC_ACID_STEPWISE_EXECUTION_NAME,
    titleZh: "有机酸分步算法执行链",
    titleEn: "Organic Acid Stepwise Algorithm Execution Chain",
    subtitleZh: "从筛选目标设定开始，逐步展开路径、描述符、主体、客体、路线评分和实验验证输出。",
    subtitleEn: "Starts from screening target setup and proceeds through pathway, descriptor, host, guest, route scoring, and validation output.",
    selectedStepId,
    selectedStep,
    steps,
    navigator: buildStepNavigatorModel(steps, selectedStepId, lang),
    currentStepWhyPanel: buildStepWhyPanelModel(selectedStep, { version: ORGANIC_ACID_STEPWISE_EXECUTION_VERSION }, lang),
    dynamicChartModel: selectedStep.dynamicChartModel,
    miniMap: buildExecutionMiniMapModel(flowNetwork, selectedStepId, lang),
    flowNetworkMiniMapSource: buildFlowNetworkExportJson(flowNetwork),
    boundaries: COMMON_BOUNDARIES,
  }
  return chain
}

export function buildStepwiseExecutionExport(chain = {}) {
  return {
    version: safeText(chain.version, ORGANIC_ACID_STEPWISE_EXECUTION_VERSION),
    name: safeText(chain.name, ORGANIC_ACID_STEPWISE_EXECUTION_NAME),
    selectedStepId: safeText(chain.selectedStepId, "step-0"),
    steps: asArray(chain.steps).map(step => ({
      id: step.id,
      stepNumber: step.stepNumber,
      nameZh: step.nameZh,
      nameEn: step.nameEn,
      input: step.input,
      logic: step.logic,
      formula: step.formula,
      result: step.result,
      why: step.why,
      next: step.next,
      chartType: step.dynamicChartModel?.type || "pending",
      chartRows: asArray(step.dynamicChartModel?.rows),
    })),
    miniMap: chain.miniMap || {},
    boundaries: safeList(chain.boundaries),
  }
}
