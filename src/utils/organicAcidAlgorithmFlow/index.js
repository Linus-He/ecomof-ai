import {
  buildHostGuestRouteExplanation,
  buildOrganicAcidHostGuestWorkbench,
  HGCPS_FORMULA_TEXT,
  ORGANIC_ACID_HOST_GUEST_VERSION,
  safeNumber,
} from "../organicAcidHostGuest/index.js"

export const ORGANIC_ACID_ALGORITHM_FLOW_VERSION = "V3.9.10"
export const ORGANIC_ACID_ALGORITHM_FLOW_NAME = "Organic Acid Algorithm Flow Network"

const METHODOLOGY_BASE = "project-evolution-organic-acid-algorithm-methodology"

const COLUMN_DEFINITIONS = [
  { id: "pathway", labelZh: "路径步骤", labelEn: "Pathway Step" },
  { id: "descriptor", labelZh: "描述符组", labelEn: "Descriptor Group" },
  { id: "host", labelZh: "主体 MOF 候选", labelEn: "Host MOF Candidate" },
  { id: "guest", labelZh: "客体 / 掺杂金属", labelEn: "Guest / Dopant Metal" },
  { id: "route", labelZh: "主客体路线", labelEn: "Host-Guest Route" },
  { id: "evidence-risk", labelZh: "证据 / 风险", labelEn: "Evidence / Risk" },
  { id: "validation", labelZh: "验证实验", labelEn: "Validation Experiment" },
]

const PATHWAY_LABELS_ZH = {
  "step-co2-enrichment": "CO2 富集",
  "step-co2-activation": "CO2 活化",
  "step-hcoo-stabilization": "HCOO* 稳定",
  "step-proton-electron-transfer": "质子 / 电子转移",
  "step-formic-acid-desorption": "甲酸脱附",
  "step-hcooh-desorption": "甲酸脱附",
  "step-170c-aqueous-stability": "170°C 水相稳定性风险",
  "step-hydrothermal-stability": "170°C 水相稳定性风险",
}

const DESCRIPTOR_LABELS_ZH = {
  "co2 enrichment and pore access": "孔结构描述符",
  "co2 activation and lewis acidity": "Lewis 酸性 / 开放金属位点",
  "formate stabilization proxy": "中间体结合 proxy",
  "proton electron transfer proxy": "质子 / 电子转移 proxy",
  "polarity and hydrophilicity": "亲水性 / 局部极性",
  "formic acid desorption proxy": "甲酸脱附 proxy",
  "hydrothermal stability proxy": "稳定性 proxy",
}

const NODE_TYPE_LABELS = {
  pathway: ["路径步骤", "Pathway Step"],
  descriptor: ["描述符组", "Descriptor Group"],
  host: ["主体 MOF 候选", "Host Candidate"],
  guest: ["客体 / 掺杂金属", "Guest Metal"],
  route: ["主客体路线", "Route Candidate"],
  evidence: ["证据", "Evidence"],
  risk: ["风险", "Risk"],
  validation: ["验证实验", "Validation Experiment"],
  feedback: ["实验反馈规则", "Experimental Feedback Rule"],
  update: ["HGCPS 更新预览", "HGCPS Update Preview"],
}

const ADVANCED_TABS = [
  ["risk", "缺失证据与风险矩阵", "Missing Evidence & Risk Matrix"],
  ["evidence", "证据矩阵", "Evidence Matrix"],
  ["sensitivity", "敏感性分析", "Sensitivity Analysis"],
  ["ablation", "消融分析", "Ablation Analysis"],
  ["boundary", "算法边界", "Algorithm Boundary"],
  ["report", "路线报告导出", "Route Report Export"],
]

export function buildLocalizedOrganicAcidTerminology(lang = "zh") {
  const rows = {
    hostFramework: ["主体骨架", "Host framework"],
    hostMof: ["主体 MOF", "Host MOF"],
    guestMetal: ["客体 / 掺杂金属", "Guest / dopant metal"],
    route: ["实验路线", "Route"],
    topPriorityRoute: ["最高优先级验证路线", "Top Priority Route"],
    conditionalRoute: ["条件候选路线", "Conditional Route"],
    pendingRoute: ["待补证据路线", "Pending Route"],
    pathwayStep: ["路径步骤", "Pathway Step"],
    descriptorGroup: ["描述符组", "Descriptor Group"],
    complementarity: ["主客体互补", "Host-Guest Complementarity"],
    hgcps: ["主客体互补路径评分", "HGCPS"],
    riskRetentionFactor: ["风险保留因子", "Risk Retention Factor"],
    evidenceConfidenceFactor: ["证据置信因子", "Evidence Confidence Factor"],
    sensitivityAnalysis: ["敏感性分析", "Sensitivity Analysis"],
    ablationAnalysis: ["消融分析", "Ablation Analysis"],
    missingEvidenceRiskMatrix: ["缺失证据与风险矩阵", "Missing Evidence & Risk Matrix"],
    sameConditionDataTemplate: ["同条件数据模板", "Same-condition Data Template"],
    experimentalFeedbackRules: ["实验反馈规则", "Experimental Feedback Rules"],
    activationReadiness: ["实验启用状态", "Activation Readiness"],
    planningReady: ["实验规划可启用", "Planning-ready"],
    notPerformanceValidated: ["尚未完成性能验证", "Not performance-validated"],
    notFinalCatalyticProof: ["非最终催化性能证明", "Not final catalytic proof"],
    formalMachineLearning: ["正式机器学习推荐", "Formal machine learning"],
    algorithmFlowNetwork: ["算法链式网络", "Algorithm Flow Network"],
    nodeInspector: ["节点解释器", "Node Inspector"],
    candidateCompetition: ["候选竞争", "Candidate Competition"],
    routeOutput: ["路线输出", "Route Output"],
  }
  return Object.fromEntries(Object.entries(rows).map(([key, [zh, en]]) => [key, lang === "zh" ? zh : en]))
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeText(value, fallback = "pending") {
  if (value === undefined || value === null) return fallback
  const text = String(value).trim()
  return text || fallback
}

function safeList(value, fallback = "pending") {
  const rows = asArray(value).map(row => safeText(row, "")).filter(Boolean)
  return rows.length ? rows : [fallback]
}

function roundScore(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

function sanitizeId(value) {
  return safeText(value, "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item"
}

function nodeId(type, value) {
  return `flow-${type}-${sanitizeId(value)}`
}

function textFor(lang, zh, en) {
  return lang === "zh" ? zh : en
}

function selectLabel(lang, zh, en) {
  return lang === "zh" ? `${zh} / ${en}` : `${en} / ${zh}`
}

function routeName(route) {
  const host = safeText(route?.hostMof, "Host")
  const guest = safeText(route?.guestMetal, "guest")
  return `${host} + ${guest}`
}

function isTopRoute(route) {
  return route?.routeId === "route-al-mof-mo" || safeNumber(route?.ranking, 99) === 1
}

function pathRoleForHost(host) {
  const name = safeText(host?.displayName, "").toLowerCase()
  if (name === "al-mof") return "top"
  if (name.includes("zr") || name.includes("mof-808") || name.includes("uio")) return "backup"
  if (name.includes("ti") || name.includes("fe") || name.includes("cu")) return "control"
  return "conditional"
}

function pathRoleForGuest(guest) {
  const metal = safeText(guest?.guestMetal, "").toLowerCase()
  if (metal === "mo") return "top"
  if (metal === "w") return "backup"
  if (["fe", "co", "ni"].includes(metal)) return "control"
  return "conditional"
}

function pathRoleForRoute(route) {
  const id = safeText(route?.routeId, "").toLowerCase()
  const guest = safeText(route?.guestMetal, "").toLowerCase()
  const host = safeText(route?.hostMof, "").toLowerCase()
  const type = safeText(route?.routeType, "").toLowerCase()
  if (isTopRoute(route)) return "top"
  if (guest.includes("none") || type.includes("pristine") || id.includes("blank") || id.includes("mo-only")) return "control"
  if (host.includes("zr") || guest === "w") return "backup"
  return safeText(route?.recommendationTier, "").toLowerCase().includes("pending") ? "pending" : "conditional"
}

function methodAnchor(sectionId, formulaId = "") {
  if (!formulaId) return `#${METHODOLOGY_BASE}-${sectionId}`
  return `#${METHODOLOGY_BASE}-formula-${formulaId}`
}

function getWorkbench(inputWorkbench, sourceData) {
  if (inputWorkbench) return inputWorkbench
  return buildOrganicAcidHostGuestWorkbench(sourceData || {})
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

function createNode({
  id,
  type,
  column,
  labelZh,
  labelEn,
  lang,
  pathRole = "support",
  score = 0,
  statusZh = "待验证",
  statusEn = "pending validation",
  summaryZh = "待补充节点说明。",
  summaryEn = "Node explanation pending.",
  roleInAlgorithmZh = "参与算法链条。",
  roleInAlgorithmEn = "Participates in the algorithm chain.",
  inputZh = "输入待补充。",
  inputEn = "Input pending.",
  outputZh = "输出待补充。",
  outputEn = "Output pending.",
  evidenceStatus = "seed / proxy",
  riskStatus = "risk retained",
  whyNextZh = "进入下一步筛选。",
  whyNextEn = "Moves into the next screening step.",
  hgcpsImpactZh = "影响 HGCPS 因子。",
  hgcpsImpactEn = "Impacts HGCPS factors.",
  methodologyAnchor = `#${METHODOLOGY_BASE}`,
  jumpTargets = [],
  relatedItems = [],
  source = {},
}) {
  const [typeLabelZh, typeLabelEn] = NODE_TYPE_LABELS[type] || [type, type]
  return {
    id,
    type,
    column,
    labelZh: safeText(labelZh),
    labelEn: safeText(labelEn),
    label: selectLabel(lang, safeText(labelZh), safeText(labelEn)),
    typeLabelZh,
    typeLabelEn,
    typeLabel: selectLabel(lang, typeLabelZh, typeLabelEn),
    pathRole,
    score: roundScore(score, 3),
    statusZh: safeText(statusZh),
    statusEn: safeText(statusEn),
    status: textFor(lang, safeText(statusZh), safeText(statusEn)),
    summaryZh: safeText(summaryZh),
    summaryEn: safeText(summaryEn),
    summary: textFor(lang, safeText(summaryZh), safeText(summaryEn)),
    roleInAlgorithmZh: safeText(roleInAlgorithmZh),
    roleInAlgorithmEn: safeText(roleInAlgorithmEn),
    inputZh: safeText(inputZh),
    inputEn: safeText(inputEn),
    outputZh: safeText(outputZh),
    outputEn: safeText(outputEn),
    evidenceStatus: safeText(evidenceStatus),
    riskStatus: safeText(riskStatus),
    whyNextZh: safeText(whyNextZh),
    whyNextEn: safeText(whyNextEn),
    hgcpsImpactZh: safeText(hgcpsImpactZh),
    hgcpsImpactEn: safeText(hgcpsImpactEn),
    methodologyAnchor,
    jumpTargets: asArray(jumpTargets).map(row => ({
      id: safeText(row.id || row, "target"),
      labelZh: safeText(row.labelZh || row.label || row, "跳转"),
      labelEn: safeText(row.labelEn || row.label || row, "Jump"),
      target: safeText(row.target || row.href || "#organic-acid-host-guest-workbench", "#organic-acid-host-guest-workbench"),
      tab: safeText(row.tab || "", ""),
    })),
    relatedItems: asArray(relatedItems).map(item => safeText(item)).filter(Boolean),
    source: source || {},
  }
}

function createEdge({ source, target, type, labelZh, labelEn, pathRole = "support" }) {
  return {
    id: `edge-${sanitizeId(source)}-${sanitizeId(target)}-${sanitizeId(type)}`,
    source: safeText(source),
    target: safeText(target),
    type: safeText(type),
    edgeType: safeText(type),
    labelZh: safeText(labelZh),
    labelEn: safeText(labelEn),
    pathRole,
  }
}

function hostSelectionWhy(host) {
  const name = safeText(host?.displayName)
  if (safeNumber(host?.ranking, 0) === 1) {
    return {
      whySelectedZh: `${name} 在主体单项评分中排名第一；该结论与路线综合最优主体分开报告。`,
      whySelectedEn: `${name} ranks first in the host-only score; this is reported separately from the top route host.`,
      whyNotSelectedZh: "主体单项第一不是最终路线推荐，也不是催化性能证明。",
      whyNotSelectedEn: "Host-only rank 1 is neither the final route recommendation nor catalytic-performance proof.",
    }
  }
  return {
    whySelectedZh: `${name} 作为条件候选保留，用于后续对照。`,
    whySelectedEn: `${name} is retained as a conditional candidate for later comparison.`,
    whyNotSelectedZh: "当前主体单项得分低于结构榜首，但仍可在路线综合评分中上升。",
    whyNotSelectedEn: "The host-only score is below the structural leader, but route-level factors can still raise its route rank.",
  }
}

function guestSelectionWhy(guest) {
  const metal = safeText(guest?.guestMetal)
  if (metal === "Mo") {
    return {
      whySelectedZh: "Mo 在客体竞争中胜出，因为它同时支持 CO2 活化、HCOO* 稳定和 PCET，并为当前主体提供活性补偿。",
      whySelectedEn: "Mo wins guest competition because it supports CO2 activation, HCOO* stabilization, and PCET while compensating the current host.",
      whyNotSelectedZh: "仍需验证 Mo 引入可行性、氧化态、局部配位和浸出风险。",
      whyNotSelectedEn: "Mo introduction feasibility, oxidation state, local coordination, and leaching risk still require validation.",
    }
  }
  if (metal === "W") {
    return {
      whySelectedZh: "W 是 oxo-metal backup，用于测试 Mo 效应是否可由相近客体替代。",
      whySelectedEn: "W is an oxo-metal backup to test whether a nearby guest can replace Mo effects.",
      whyNotSelectedZh: "当前对 Al-MOF 的补偿评分和证据置信度低于 Mo。",
      whyNotSelectedEn: "Current Al-MOF compensation score and evidence confidence are below Mo.",
    }
  }
  if (["Fe", "Co", "Ni"].includes(metal)) {
    return {
      whySelectedZh: `${metal} 是 control / conditional redox guest，用于排除非 Mo 泛化效应。`,
      whySelectedEn: `${metal} is a control / conditional redox guest for non-Mo comparison.`,
      whyNotSelectedZh: "路径支持、HCOO* 稳定或 Al-MOF 兼容性不足，不能成为第一路线客体。",
      whyNotSelectedEn: "Pathway support, HCOO* stabilization, or Al-MOF compatibility is insufficient for first route priority.",
    }
  }
  return {
    whySelectedZh: `${metal} 保留为条件候选。`,
    whySelectedEn: `${metal} remains a conditional guest candidate.`,
    whyNotSelectedZh: "当前综合客体评分低于 Mo。",
    whyNotSelectedEn: "Current aggregate guest score is below Mo.",
  }
}

function routeSelectionWhy(route) {
  const name = routeName(route)
  if (isTopRoute(route)) {
    return {
      whyRankedHereZh: `${name} 按预注册八因子加权几何 HGCPS 排名第一；主体、配体路径、客体、证据、风险、可合成性与经济性共同决定结果。`,
      whyRankedHereEn: `${name} ranks first under the preregistered eight-factor weighted-geometric HGCPS across host, ligand-aware pathway, guest, evidence, risk, synthesizability, and economics.`,
      whyNotHigherZh: "已经是当前最高优先级验证路线，但不是最终催化性能证明。",
      whyNotHigherEn: "It is already the current top-priority validation route, but not final catalytic proof.",
    }
  }
  if (safeText(route?.guestMetal).toLowerCase().includes("none") || safeText(route?.routeType).toLowerCase().includes("pristine")) {
    return {
      whyRankedHereZh: `${name} 是 host-only control，用于判断 Mo 是否真的提供活性补偿。`,
      whyRankedHereEn: `${name} is a host-only control for testing whether Mo provides real activity compensation.`,
      whyNotHigherZh: "缺少客体金属补偿，HGCPS 乘积被 guest factor 压低。",
      whyNotHigherEn: "No guest-metal compensation; the guest factor compresses HGCPS.",
    }
  }
  if (safeText(route?.hostMof).includes("Zr")) {
    return {
      whyRankedHereZh: `${name} 是 host-framework control，用于检验 top route 是否依赖特定主体家族。`,
      whyRankedHereEn: `${name} is a host-framework control for testing whether the top route depends on a specific host family.`,
      whyNotHigherZh: "主客体互补和路线相关证据弱于当前 top route。",
      whyNotHigherEn: "Complementarity and route-specific evidence are weaker than the current top route.",
    }
  }
  if (safeText(route?.guestMetal) === "W" || safeText(route?.guestMetal) === "Fe") {
    return {
      whyRankedHereZh: `${name} 是 conditional route，用于测试 Mo 替代或红氧客体边界。`,
      whyRankedHereEn: `${name} is a conditional route for testing Mo-substitution or redox-guest boundaries.`,
      whyNotHigherZh: "客体活性补偿和证据置信低于 Mo。",
      whyNotHigherEn: "Guest activity compensation and evidence confidence are below Mo.",
    }
  }
  return {
    whyRankedHereZh: `${name} 保留在条件候选 / 待补证据队列。`,
    whyRankedHereEn: `${name} remains in the conditional or pending-evidence queue.`,
    whyNotHigherZh: "当前 HGCPS 因子存在短板，后续需补实验数据。",
    whyNotHigherEn: "Current HGCPS factors have bottlenecks and need experimental data.",
  }
}

export function buildAlgorithmFlowNodes(workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, sourceData)
  const { pathwaySteps, descriptorMap, hosts, guests, routes, evidence, validations } = sourceArrays(workbench, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || routes.find(isTopRoute) || routes[0] || {}
  const topEvidence = evidence.filter(row => row.linkedRouteId === topRoute.routeId || asArray(topRoute.evidenceRefs).includes(row.evidenceId))
  const topRiskRecords = topEvidence.filter(row => safeText(row.riskType, "") || safeNumber(row.penalty, 0) > 0)
  const topValidations = validations.filter(row => row.routeId === topRoute.routeId)

  const pathwayNodes = pathwaySteps.map((step, index) => {
    const zh = PATHWAY_LABELS_ZH[step.stepId] || safeText(step.stepName, `路径步骤 ${index + 1}`)
    return createNode({
      id: nodeId("pathway", step.stepId || index + 1),
      type: "pathway",
      column: "pathway",
      labelZh: zh,
      labelEn: safeText(step.stepName, `Pathway step ${index + 1}`),
      lang,
      pathRole: index < 5 ? "top" : "support",
      score: safeNumber(step.evidenceCount, 0) / 10,
      statusZh: `${safeText(step.confidenceLevel, "medium")} 置信`,
      statusEn: `${safeText(step.confidenceLevel, "medium")} confidence`,
      summaryZh: safeText(step.chemicalMeaning, "路径步骤说明待补充。"),
      summaryEn: safeText(step.chemicalMeaning, "Pathway explanation pending."),
      roleInAlgorithmZh: "作为 CO2 -> 有机酸链条的反应瓶颈起点。",
      roleInAlgorithmEn: "Starts from a CO2-to-organic-acid pathway bottleneck.",
      inputZh: "pathway_steps.json 中的路径步骤与瓶颈类型。",
      inputEn: "Pathway step and bottleneck type from pathway_steps.json.",
      outputZh: "映射到所需描述符组。",
      outputEn: "Maps to required descriptor groups.",
      evidenceStatus: `${safeNumber(step.evidenceCount, 0)} records / ${safeText(step.confidenceLevel, "medium")}`,
      riskStatus: safeText(step.uncertainty, "same-condition evidence pending"),
      whyNextZh: "每个路径瓶颈必须转换为可筛选的材料描述符。",
      whyNextEn: "Each pathway bottleneck must become screenable material descriptors.",
      hgcpsImpactZh: "影响 host pathway support 和 evidence confidence。",
      hgcpsImpactEn: "Impacts host pathway support and evidence confidence.",
      methodologyAnchor: methodAnchor("algorithm-positioning", "pathway-flow"),
      jumpTargets: [{ id: "methodology", labelZh: "路径公式", labelEn: "Pathway formula", target: methodAnchor("algorithm-positioning", "pathway-flow") }],
      relatedItems: safeList(step.mappedDescriptors),
      source: step,
    })
  })

  const descriptorNodes = descriptorMap.map((mapping, index) => {
    const groupKey = safeText(mapping.descriptorGroup, "").toLowerCase()
    const zh = DESCRIPTOR_LABELS_ZH[groupKey] || safeText(mapping.descriptorGroup, `描述符组 ${index + 1}`)
    return createNode({
      id: nodeId("descriptor", mapping.mappingId || mapping.descriptorGroup || index + 1),
      type: "descriptor",
      column: "descriptor",
      labelZh: zh,
      labelEn: safeText(mapping.descriptorGroup, `Descriptor group ${index + 1}`),
      lang,
      pathRole: index < 5 ? "top" : "support",
      score: safeText(mapping.confidenceLevel, "").includes("high") ? 0.8 : 0.62,
      statusZh: `${safeText(mapping.dataAvailability, "proxy available")} / ${safeText(mapping.confidenceLevel, "medium")}`,
      statusEn: `${safeText(mapping.dataAvailability, "proxy available")} / ${safeText(mapping.confidenceLevel, "medium")}`,
      summaryZh: safeText(mapping.whyTheseDescriptorsMatter, "描述符用于连接路径瓶颈和材料候选。"),
      summaryEn: safeText(mapping.whyTheseDescriptorsMatter, "Descriptor group connects pathway bottlenecks with material candidates."),
      roleInAlgorithmZh: "把路径步骤转换成主体 MOF 和客体金属可比较的描述符。",
      roleInAlgorithmEn: "Turns pathway steps into comparable descriptors for hosts and guests.",
      inputZh: `${safeText(mapping.stepId)} 的路径瓶颈。`,
      inputEn: `Pathway bottleneck from ${safeText(mapping.stepId)}.`,
      outputZh: `${safeList(mapping.descriptors).join("; ")}。`,
      outputEn: `${safeList(mapping.descriptors).join("; ")}.`,
      evidenceStatus: `${safeText(mapping.evidenceType, "proxy")} / ${safeText(mapping.confidenceLevel, "medium")}`,
      riskStatus: safeList(mapping.missingDescriptors, "same-condition descriptor pending").join("; "),
      whyNextZh: "描述符同时驱动主体稳定骨架和客体补偿金属筛选。",
      whyNextEn: "Descriptors drive both host-framework and guest-compensation screening.",
      hgcpsImpactZh: "影响 host pathway support、guest activity compensation 与 evidence confidence。",
      hgcpsImpactEn: "Impacts host pathway support, guest activity compensation, and evidence confidence.",
      methodologyAnchor: methodAnchor("descriptor-mapping", "descriptor-map"),
      jumpTargets: [{ id: "methodology", labelZh: "描述符公式", labelEn: "Descriptor formula", target: methodAnchor("descriptor-mapping", "descriptor-map") }],
      relatedItems: safeList(mapping.descriptors),
      source: mapping,
    })
  })

  const hostNodes = hosts.slice(0, 8).map(host => {
    const why = hostSelectionWhy(host)
    const role = pathRoleForHost(host)
    return createNode({
      id: nodeId("host", host.hostMofId || host.displayName),
      type: "host",
      column: "host",
      labelZh: safeText(host.displayName),
      labelEn: safeText(host.displayName),
      lang,
      pathRole: role,
      score: safeNumber(host.hostScore ?? host.calculatedHostScore, 0),
      statusZh: role === "top" ? "主体竞争胜出" : role === "backup" ? "backup / control" : "conditional / control",
      statusEn: role === "top" ? "host competition winner" : role === "backup" ? "backup / control" : "conditional / control",
      summaryZh: `${safeText(host.displayName)}：${why.whySelectedZh}`,
      summaryEn: `${safeText(host.displayName)}: ${why.whySelectedEn}`,
      roleInAlgorithmZh: role === "top" ? "稳定主体骨架候选，不是最终催化剂证明。" : "主体备选或对照，用于竞争和边界验证。",
      roleInAlgorithmEn: role === "top" ? "Stable host framework candidate, not final catalyst proof." : "Backup or control host for competition and boundary testing.",
      inputZh: "主体候选评分：稳定性、孔环境、改性可行性、客体承载和 provenance。",
      inputEn: "Host score from stability, pore environment, modification feasibility, guest hosting, and provenance.",
      outputZh: role === "top" ? "Al-MOF 进入客体金属筛选与路线组合。" : `${safeText(host.displayName)} 进入 backup / control 队列。`,
      outputEn: role === "top" ? "Al-MOF enters guest-metal screening and route combination." : `${safeText(host.displayName)} enters backup / control queue.`,
      evidenceStatus: safeList(host.provenance, "seed / proxy").join("; "),
      riskStatus: safeText(host.limitation, "host risk pending"),
      whyNextZh: role === "top" ? "稳定骨架需要 Mo 客体补偿 CO2 活化与 HCOO* 稳定。" : "用于解释为什么未替代 Al-MOF primary host。",
      whyNextEn: role === "top" ? "Stable framework needs Mo guest compensation for CO2 activation and HCOO* stabilization." : "Explains why this host does not replace primary Al-MOF.",
      hgcpsImpactZh: "影响 host stability factor 与 host pathway support factor。",
      hgcpsImpactEn: "Impacts host stability factor and host pathway support factor.",
      methodologyAnchor: methodAnchor("host-selection", "host-selection"),
      jumpTargets: [{ id: "methodology", labelZh: "主体筛选公式", labelEn: "Host formula", target: methodAnchor("host-selection", "host-selection") }],
      relatedItems: [why.whySelectedZh, why.whyNotSelectedZh],
      source: { ...host, ...why },
    })
  })

  const guestNodes = guests.slice(0, 8).map(guest => {
    const why = guestSelectionWhy(guest)
    const role = pathRoleForGuest(guest)
    return createNode({
      id: nodeId("guest", guest.guestMetal),
      type: "guest",
      column: "guest",
      labelZh: safeText(guest.guestMetal),
      labelEn: safeText(guest.guestMetal),
      lang,
      pathRole: role,
      score: safeNumber(guest.guestScore ?? guest.calculatedGuestScore, 0),
      statusZh: role === "top" ? "客体竞争胜出" : role === "backup" ? "backup guest" : "control / conditional guest",
      statusEn: role === "top" ? "guest competition winner" : role === "backup" ? "backup guest" : "control / conditional guest",
      summaryZh: `${safeText(guest.guestMetal)}：${why.whySelectedZh}`,
      summaryEn: `${safeText(guest.guestMetal)}: ${why.whySelectedEn}`,
      roleInAlgorithmZh: role === "top" ? "客体 / 掺杂 / 活性补偿金属。" : "客体备选或对照。",
      roleInAlgorithmEn: role === "top" ? "Guest / dopant / activity compensation metal." : "Backup or control guest.",
      inputZh: "客体评分：CO2 活化、HCOO* 稳定、电子转移、Al-MOF 兼容性与引入可行性。",
      inputEn: "Guest score from CO2 activation, HCOO* stabilization, electron transfer, Al-MOF compatibility, and introduction feasibility.",
      outputZh: role === "top" ? "Mo 与 Al-MOF 组合成 top route。" : `${safeText(guest.guestMetal)} 进入 backup / control 路线。`,
      outputEn: role === "top" ? "Mo combines with Al-MOF as the top route." : `${safeText(guest.guestMetal)} enters backup / control routes.`,
      evidenceStatus: safeList(guest.provenance, "seed / proxy").join("; "),
      riskStatus: safeText(guest.mainRisk, "guest risk pending"),
      whyNextZh: role === "top" ? "Mo 支持 CO2 activation / HCOO* / PCET，进入主客体路线组合。" : "用于解释 Mo 之外客体为什么暂不升为第一路线。",
      whyNextEn: role === "top" ? "Mo supports CO2 activation, HCOO*, and PCET, then enters route assembly." : "Explains why non-Mo guests are not first route.",
      hgcpsImpactZh: "影响 guest activity compensation factor 与 host-guest complementarity factor。",
      hgcpsImpactEn: "Impacts guest activity compensation factor and host-guest complementarity factor.",
      methodologyAnchor: methodAnchor("guest-selection", "guest-selection"),
      jumpTargets: [{ id: "methodology", labelZh: "客体筛选公式", labelEn: "Guest formula", target: methodAnchor("guest-selection", "guest-selection") }],
      relatedItems: [...safeList(guest.supportsPathwaySteps), why.whySelectedZh, why.whyNotSelectedZh],
      source: { ...guest, ...why },
    })
  })

  const routeNodes = routes.slice(0, 10).map(route => {
    const why = routeSelectionWhy(route)
    const role = pathRoleForRoute(route)
    return createNode({
      id: nodeId("route", route.routeId),
      type: "route",
      column: "route",
      labelZh: routeName(route),
      labelEn: routeName(route),
      lang,
      pathRole: role,
      score: safeNumber(route.finalHGCPS, 0),
      statusZh: isTopRoute(route) ? "最高优先级验证路线" : role === "control" ? "control / pending" : "conditional / backup",
      statusEn: isTopRoute(route) ? "top-priority validation route" : role === "control" ? "control / pending" : "conditional / backup",
      summaryZh: `${routeName(route)}：${why.whyRankedHereZh}`,
      summaryEn: `${routeName(route)}: ${why.whyRankedHereEn}`,
      roleInAlgorithmZh: "主体骨架与客体金属组合后的实验路线候选。",
      roleInAlgorithmEn: "Experimental route candidate after host and guest combination.",
      inputZh: "host + guest + HGCPS 八因子加权几何评分。",
      inputEn: "Host + guest + eight-factor weighted-geometric HGCPS.",
      outputZh: isTopRoute(route) ? "输出最小实验验证路线。" : "进入候选竞争解释和对照实验设计。",
      outputEn: isTopRoute(route) ? "Outputs the minimum experimental validation route." : "Feeds candidate explanation and control design.",
      evidenceStatus: `Evidence confidence ${roundScore(route.evidenceConfidence ?? route.evidenceConfidenceScore, 2)}`,
      riskStatus: `Risk retention ${roundScore(route.riskRetentionFactor ?? route.riskPenalty, 2)}; ${safeText(route.mainRisk, "risk retained")}`,
      whyNextZh: isTopRoute(route) ? "需要进入同条件验证实验，而不是声明最终性能。" : "用于 why-not-selected 和 route competition 对照。",
      whyNextEn: isTopRoute(route) ? "Moves to same-condition validation, not final performance claim." : "Used for why-not-selected and route competition comparison.",
      hgcpsImpactZh: `HGCPS = ${roundScore(route.finalHGCPS, 3)}；风险和证据继续压缩得分。`,
      hgcpsImpactEn: `HGCPS = ${roundScore(route.finalHGCPS, 3)}; evidence and risk still compress the score.`,
      methodologyAnchor: methodAnchor("hgcps", "hgcps"),
      jumpTargets: [
        { id: "formula", labelZh: "HGCPS 公式", labelEn: "HGCPS formula", target: methodAnchor("hgcps", "hgcps") },
        { id: "risk", labelZh: "风险矩阵", labelEn: "Risk Matrix", target: "#organic-acid-advanced-robustness-evidence", tab: "risk" },
      ],
      relatedItems: [why.whyRankedHereZh, why.whyNotHigherZh, safeText(route.nextExperiment, "next experiment pending")],
      source: { ...route, ...why },
    })
  })

  const evidenceNodes = topEvidence.slice(0, 5).map(record => createNode({
    id: nodeId("evidence", record.evidenceId),
    type: "evidence",
    column: "evidence-risk",
    labelZh: safeText(record.supports, record.evidenceId),
    labelEn: safeText(record.supports, record.evidenceId),
    lang,
    pathRole: "top",
    score: safeText(record.confidenceLevel, "").includes("high") ? 0.82 : 0.62,
    statusZh: `${safeText(record.evidenceType, "proxy")} / ${safeText(record.confidenceLevel, "medium")}`,
    statusEn: `${safeText(record.evidenceType, "proxy")} / ${safeText(record.confidenceLevel, "medium")}`,
    summaryZh: safeText(record.limitation || record.supports, "证据记录用于压缩或支撑路线得分。"),
    summaryEn: safeText(record.limitation || record.supports, "Evidence record supports or compresses route score."),
    roleInAlgorithmZh: "证据置信因子来源。",
    roleInAlgorithmEn: "Source for evidence confidence factor.",
    inputZh: "literature / related experiment / proxy / inferred / missing evidence。",
    inputEn: "literature / related experiment / proxy / inferred / missing evidence.",
    outputZh: "更新 evidence confidence factor。",
    outputEn: "Updates evidence confidence factor.",
    evidenceStatus: `${safeText(record.curationStatus, "proxy curated")} / same condition ${String(record.sameCondition === true ? "yes" : "no")}`,
    riskStatus: safeText(record.riskType || record.limitation, "risk retained"),
    whyNextZh: "证据决定 route score 是否被压缩。",
    whyNextEn: "Evidence determines whether route score is compressed.",
    hgcpsImpactZh: "影响 Evidence Confidence Factor。",
    hgcpsImpactEn: "Impacts Evidence Confidence Factor.",
    methodologyAnchor: methodAnchor("hgcps", "hgcps"),
    jumpTargets: [{ id: "evidence", labelZh: "证据矩阵", labelEn: "Evidence Matrix", target: "#organic-acid-advanced-robustness-evidence", tab: "evidence" }],
    relatedItems: [safeText(record.linkedDescriptor, "descriptor pending"), safeText(record.linkedStepId, "step pending")],
    source: record,
  }))

  const riskNodes = (topRiskRecords.length ? topRiskRecords : topEvidence).slice(0, 5).map(record => createNode({
    id: nodeId("risk", record.riskType || record.evidenceId),
    type: "risk",
    column: "evidence-risk",
    labelZh: safeText(record.riskType || record.limitation, "路线风险"),
    labelEn: safeText(record.riskType || record.limitation, "route risk"),
    lang,
    pathRole: "top",
    score: 1 - safeNumber(record.penalty, 0),
    statusZh: "风险保留因子压缩 HGCPS",
    statusEn: "Risk retention factor compresses HGCPS",
    summaryZh: safeText(record.limitation || record.supports, "风险需要实验验证。"),
    summaryEn: safeText(record.limitation || record.supports, "Risk requires experimental validation."),
    roleInAlgorithmZh: "风险保留因子来源。",
    roleInAlgorithmEn: "Source for risk retention factor.",
    inputZh: "Mo 引入、局域配位、170°C 水相稳定性、同条件数据、碳平衡。",
    inputEn: "Mo introduction, local coordination, 170C aqueous stability, same-condition data, carbon balance.",
    outputZh: "压缩风险保留因子。",
    outputEn: "Compresses risk retention factor.",
    evidenceStatus: safeText(record.confidenceLevel, "medium"),
    riskStatus: `penalty ${roundScore(record.penalty, 2)}`,
    whyNextZh: "风险项进入验证实验和反馈规则。",
    whyNextEn: "Risk feeds validation experiments and feedback rules.",
    hgcpsImpactZh: "影响 Risk Retention Factor。",
    hgcpsImpactEn: "Impacts Risk Retention Factor.",
    methodologyAnchor: methodAnchor("sensitivity-ablation-risk", "sensitivity"),
    jumpTargets: [{ id: "risk", labelZh: "风险矩阵", labelEn: "Risk Matrix", target: "#organic-acid-advanced-robustness-evidence", tab: "risk" }],
    relatedItems: [safeText(record.linkedDescriptor, "descriptor pending"), safeText(record.condition, "condition pending")],
    source: record,
  }))

  const validationNodes = topValidations.slice(0, 6).map(experiment => createNode({
    id: nodeId("validation", experiment.experimentId),
    type: "validation",
    column: "validation",
    labelZh: safeText(experiment.recommendedExperiment),
    labelEn: safeText(experiment.recommendedExperiment),
    lang,
    pathRole: "top",
    score: experiment.validationPriority === "P0" ? 1 : 0.75,
    statusZh: `${safeText(experiment.validationPriority, "P1")} / 实验规划`,
    statusEn: `${safeText(experiment.validationPriority, "P1")} / planning`,
    summaryZh: safeText(experiment.purpose, "验证实验目的待补充。"),
    summaryEn: safeText(experiment.purpose, "Validation purpose pending."),
    roleInAlgorithmZh: "将路线输出转成最小实验验证矩阵。",
    roleInAlgorithmEn: "Turns route output into minimum validation matrix.",
    inputZh: "top route + risk matrix + activation package。",
    inputEn: "Top route + risk matrix + activation package.",
    outputZh: safeText(experiment.successCriterion, "success criterion pending"),
    outputEn: safeText(experiment.successCriterion, "success criterion pending"),
    evidenceStatus: "pending result",
    riskStatus: safeText(experiment.riskAddressed, "risk addressed pending"),
    whyNextZh: "实验结果会进入反馈规则，但不会自动形成最终证明。",
    whyNextEn: "Experimental result feeds feedback rules but does not automatically become final proof.",
    hgcpsImpactZh: "未来可更新 evidence confidence 与 risk retention 预览。",
    hgcpsImpactEn: "Can update evidence confidence and risk retention preview.",
    methodologyAnchor: methodAnchor("experimental-feedback", "feedback-evidence"),
    jumpTargets: [{ id: "activation", labelZh: "实验启用中心", labelEn: "Activation Center", target: "#organic-acid-experimental-activation-entry" }],
    relatedItems: safeList(experiment.requiredData),
    source: experiment,
  }))

  const feedbackNode = createNode({
    id: "flow-feedback-rules",
    type: "feedback",
    column: "validation",
    labelZh: "实验反馈规则",
    labelEn: "Experimental Feedback Rules",
    lang,
    pathRole: "top",
    score: 0.7,
    statusZh: "规则预览 / 无真实结果",
    statusEn: "rule preview / no real result",
    summaryZh: "支持、反证或不确定结果只更新 evidence confidence / risk retention 预览，不构成自动重排证明。",
    summaryEn: "Supported, contradicted, or inconclusive results update evidence confidence / risk retention preview only.",
    roleInAlgorithmZh: "连接验证实验结果与 HGCPS 更新预览。",
    roleInAlgorithmEn: "Connects validation results with HGCPS update preview.",
    inputZh: "同条件实验结果模板。",
    inputEn: "Same-condition experimental result template.",
    outputZh: "HGCPS update preview。",
    outputEn: "HGCPS update preview.",
    evidenceStatus: "template only",
    riskStatus: "not performance-validated",
    whyNextZh: "防止把 planning-ready 误写成性能证明。",
    whyNextEn: "Prevents planning-ready output from becoming a performance claim.",
    hgcpsImpactZh: "预览 evidence confidence / risk retention 更新。",
    hgcpsImpactEn: "Previews evidence confidence / risk retention updates.",
    methodologyAnchor: methodAnchor("experimental-feedback", "feedback-evidence"),
    jumpTargets: [{ id: "activation", labelZh: "反馈规则", labelEn: "Feedback Rules", target: "#organic-acid-experimental-activation-entry" }],
  })

  const updateNode = createNode({
    id: "flow-hgcps-update-preview",
    type: "update",
    column: "validation",
    labelZh: "HGCPS 更新预览",
    labelEn: "HGCPS Update Preview",
    lang,
    pathRole: "top",
    score: 0.7,
    statusZh: "preview only",
    statusEn: "preview only",
    summaryZh: "只有 provenance-reviewed 同条件实验回填后，才能用于后续排序更新。",
    summaryEn: "Only provenance-reviewed same-condition feedback can support future ranking updates.",
    roleInAlgorithmZh: "算法链条闭环的预览终点。",
    roleInAlgorithmEn: "Preview endpoint of the algorithm chain.",
    inputZh: "实验反馈规则。",
    inputEn: "Experimental feedback rules.",
    outputZh: "更新预览，不是正式 ML 推荐。",
    outputEn: "Update preview, not formal ML recommendation.",
    evidenceStatus: "no real results yet",
    riskStatus: "not final catalytic proof",
    whyNextZh: "保留 not final proof 和 not formal ML 边界。",
    whyNextEn: "Keeps not-final-proof and not-formal-ML boundaries.",
    hgcpsImpactZh: "未来可能更新 HGCPS 因子。",
    hgcpsImpactEn: "May update HGCPS factors in the future.",
    methodologyAnchor: methodAnchor("experimental-feedback", "feedback-risk"),
    jumpTargets: [{ id: "methodology", labelZh: "反馈公式", labelEn: "Feedback formula", target: methodAnchor("experimental-feedback", "feedback-risk") }],
  })

  return [
    ...pathwayNodes,
    ...descriptorNodes,
    ...hostNodes,
    ...guestNodes,
    ...routeNodes,
    ...evidenceNodes,
    ...riskNodes,
    ...validationNodes,
    feedbackNode,
    updateNode,
  ]
}

export function buildHighlightedTopRoutePath(workbenchInput = null, nodes = [], sourceData = {}) {
  const workbench = getWorkbench(workbenchInput, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || {}
  const firstPathway = nodes.find(node => node.type === "pathway")?.id || "flow-pathway-step-co2-enrichment"
  const firstDescriptor = nodes.find(node => node.type === "descriptor")?.id || "flow-descriptor-map-co2-enrichment"
  const routeId = nodeId("route", topRoute.routeId || "route-al-mof-mo")
  const topPath = [
    firstPathway,
    firstDescriptor,
    nodeId("host", workbench?.hostSelection?.selectedHost?.hostMofId || "host-al-mof"),
    nodeId("guest", workbench?.guestSelection?.selectedGuestMetal?.guestMetal || "Mo"),
    routeId,
    nodes.find(node => node.type === "evidence")?.id,
    nodes.find(node => node.type === "risk")?.id,
    nodes.find(node => node.type === "validation")?.id,
    "flow-feedback-rules",
    "flow-hgcps-update-preview",
  ].filter(Boolean)

  const backupRoute = asArray(workbench?.complementarity?.routeScores).find(route => pathRoleForRoute(route) === "backup") || {}
  const controlRoute = asArray(workbench?.complementarity?.routeScores).find(route => pathRoleForRoute(route) === "control") || {}

  return {
    topPath,
    backupPath: [
      firstPathway,
      firstDescriptor,
      backupRoute.hostMof ? nodeId("host", `host-${sanitizeId(backupRoute.hostMof)}`) : nodeId("host", "host-zr-mof"),
      backupRoute.guestMetal ? nodeId("guest", backupRoute.guestMetal) : nodeId("guest", "W"),
      backupRoute.routeId ? nodeId("route", backupRoute.routeId) : nodeId("route", "route-zr-mof-mo"),
    ].filter(Boolean),
    controlPath: [
      firstPathway,
      firstDescriptor,
      controlRoute.hostMof ? nodeId("host", `host-${sanitizeId(controlRoute.hostMof)}`) : nodeId("host", "host-al-mof"),
      controlRoute.routeId ? nodeId("route", controlRoute.routeId) : nodeId("route", "route-al-mof-pristine"),
    ].filter(Boolean),
    topRouteNodeId: routeId,
    defaultSelectedNodeId: firstPathway,
  }
}

export function buildAlgorithmFlowEdges(nodes = [], workbenchInput = null, sourceData = {}, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, sourceData)
  const { descriptorMap, hosts, guests, routes, evidence, validations } = sourceArrays(workbench, sourceData)
  const selectedHost = workbench?.hostSelection?.selectedHost || hosts[0] || {}
  const selectedGuest = workbench?.guestSelection?.selectedGuestMetal || guests[0] || {}
  const topRoute = workbench?.complementarity?.topRoute || routes.find(isTopRoute) || routes[0] || {}
  const topRouteNode = nodeId("route", topRoute.routeId || "route-al-mof-mo")
  const topPath = buildHighlightedTopRoutePath(workbench, nodes, sourceData).topPath
  const topSet = new Set(topPath)

  const edges = []
  descriptorMap.forEach(mapping => {
    edges.push(createEdge({
      source: nodeId("pathway", mapping.stepId),
      target: nodeId("descriptor", mapping.mappingId || mapping.descriptorGroup),
      type: "pathway step -> required descriptor",
      labelZh: "路径步骤 -> 所需描述符",
      labelEn: "pathway step -> required descriptor",
      pathRole: topSet.has(nodeId("descriptor", mapping.mappingId || mapping.descriptorGroup)) ? "top" : "support",
    }))
  })
  descriptorMap.slice(0, 5).forEach(mapping => {
    const descriptor = nodeId("descriptor", mapping.mappingId || mapping.descriptorGroup)
    hosts.slice(0, 5).forEach(host => edges.push(createEdge({
      source: descriptor,
      target: nodeId("host", host.hostMofId || host.displayName),
      type: "descriptor -> host candidate",
      labelZh: "描述符 -> 主体候选",
      labelEn: "descriptor -> host candidate",
      pathRole: pathRoleForHost(host),
    })))
    guests.slice(0, 5).forEach(guest => edges.push(createEdge({
      source: descriptor,
      target: nodeId("guest", guest.guestMetal),
      type: "descriptor -> guest metal",
      labelZh: "描述符 -> 客体金属",
      labelEn: "descriptor -> guest metal",
      pathRole: pathRoleForGuest(guest),
    })))
  })
  hosts.slice(0, 8).forEach(host => edges.push(createEdge({
    source: nodeId("host", host.hostMofId || host.displayName),
    target: nodeId("host", selectedHost.hostMofId || selectedHost.displayName || "host-al-mof"),
    type: "host candidate -> host selection",
    labelZh: "主体候选 -> 主体筛选结果",
    labelEn: "host candidate -> host selection",
    pathRole: pathRoleForHost(host),
  })))
  guests.slice(0, 8).forEach(guest => edges.push(createEdge({
    source: nodeId("guest", guest.guestMetal),
    target: nodeId("guest", selectedGuest.guestMetal || "Mo"),
    type: "guest metal -> guest selection",
    labelZh: "客体金属 -> 客体筛选结果",
    labelEn: "guest metal -> guest selection",
    pathRole: pathRoleForGuest(guest),
  })))
  routes.slice(0, 10).forEach(route => {
    edges.push(createEdge({
      source: nodeId("host", hosts.find(host => host.displayName === route.hostMof)?.hostMofId || route.hostMof),
      target: nodeId("route", route.routeId),
      type: "host + guest -> route candidate",
      labelZh: "主体 + 客体 -> 路线",
      labelEn: "host + guest -> route candidate",
      pathRole: pathRoleForRoute(route),
    }))
    if (!safeText(route.guestMetal, "").toLowerCase().includes("none")) {
      edges.push(createEdge({
        source: nodeId("guest", route.guestMetal),
        target: nodeId("route", route.routeId),
        type: "host + guest -> route candidate",
        labelZh: "主体 + 客体 -> 路线",
        labelEn: "host + guest -> route candidate",
        pathRole: pathRoleForRoute(route),
      }))
    }
  })
  evidence
    .filter(row => row.linkedRouteId === topRoute.routeId || asArray(topRoute.evidenceRefs).includes(row.evidenceId))
    .slice(0, 5)
    .forEach(row => edges.push(createEdge({
      source: nodeId("evidence", row.evidenceId),
      target: topRouteNode,
      type: "evidence -> route score",
      labelZh: "证据 -> 路线得分",
      labelEn: "evidence -> route score",
      pathRole: "top",
    })))
  evidence
    .filter(row => (row.linkedRouteId === topRoute.routeId || asArray(topRoute.evidenceRefs).includes(row.evidenceId)) && (row.riskType || safeNumber(row.penalty, 0) > 0))
    .slice(0, 5)
    .forEach(row => edges.push(createEdge({
      source: nodeId("risk", row.riskType || row.evidenceId),
      target: topRouteNode,
      type: "risk -> risk retention factor",
      labelZh: "风险 -> 风险保留因子",
      labelEn: "risk -> risk retention factor",
      pathRole: "top",
    })))
  validations
    .filter(row => row.routeId === topRoute.routeId)
    .slice(0, 6)
    .forEach(row => {
      const validationId = nodeId("validation", row.experimentId)
      edges.push(createEdge({
        source: topRouteNode,
        target: validationId,
        type: "route candidate -> validation experiment",
        labelZh: "路线候选 -> 验证实验",
        labelEn: "route candidate -> validation experiment",
        pathRole: "top",
      }))
      edges.push(createEdge({
        source: validationId,
        target: "flow-feedback-rules",
        type: "validation result -> feedback rule",
        labelZh: "验证结果 -> 反馈规则",
        labelEn: "validation result -> feedback rule",
        pathRole: "top",
      }))
    })
  edges.push(createEdge({
    source: "flow-feedback-rules",
    target: "flow-hgcps-update-preview",
    type: "feedback rule -> HGCPS update preview",
    labelZh: "反馈规则 -> HGCPS 更新预览",
    labelEn: "feedback rule -> HGCPS update preview",
    pathRole: "top",
  }))

  const nodeIds = new Set(nodes.map(node => node.id))
  return edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
}

export function buildHostCompetitionModel(workbenchInput = null, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, {})
  return asArray(workbench?.hostSelection?.rankedHosts).map(host => {
    const why = hostSelectionWhy(host)
    const role = pathRoleForHost(host)
    return {
      rank: safeNumber(host.ranking, 0),
      host: safeText(host.displayName),
      score: roundScore(host.hostScore ?? host.calculatedHostScore, 3),
      role,
      advantageZh: role === "top" ? "稳定主体骨架、Mo 承载可行、证据质量较高。" : `${safeText(host.displayName)} 可作为 backup / control。`,
      advantageEn: role === "top" ? "Stable host framework, Mo-hosting feasible, stronger evidence quality." : `${safeText(host.displayName)} can serve as backup / control.`,
      limitationZh: safeText(host.limitation, "主体局限待验证。"),
      limitationEn: safeText(host.limitation, "Host limitation pending."),
      whySelectedZh: why.whySelectedZh,
      whySelectedEn: why.whySelectedEn,
      whyNotSelectedZh: why.whyNotSelectedZh,
      whyNotSelectedEn: why.whyNotSelectedEn,
      evidenceStatus: safeList(host.provenance, "seed / proxy").join("; "),
      riskStatus: safeText(host.limitation, "risk retained"),
      label: selectLabel(lang, safeText(host.displayName), safeText(host.displayName)),
    }
  })
}

export function buildGuestCompetitionModel(workbenchInput = null, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, {})
  return asArray(workbench?.guestSelection?.rankedGuestMetals).map(guest => {
    const why = guestSelectionWhy(guest)
    const role = pathRoleForGuest(guest)
    return {
      rank: safeNumber(guest.ranking, 0),
      metal: safeText(guest.guestMetal),
      score: roundScore(guest.guestScore ?? guest.calculatedGuestScore, 3),
      role,
      supportsPathwayZh: safeList(guest.supportsPathwaySteps).join("; "),
      supportsPathwayEn: safeList(guest.supportsPathwaySteps).join("; "),
      advantageZh: role === "top" ? "支持 CO2 activation / HCOO* / PCET，补偿主体活性。" : `${safeText(guest.guestMetal)} 用于 backup / control 竞争。`,
      advantageEn: role === "top" ? "Supports CO2 activation / HCOO* / PCET and compensates host activity." : `${safeText(guest.guestMetal)} is used for backup / control competition.`,
      limitationZh: safeText(guest.mainRisk, "客体风险待验证。"),
      limitationEn: safeText(guest.mainRisk, "Guest risk pending."),
      whySelectedZh: why.whySelectedZh,
      whySelectedEn: why.whySelectedEn,
      whyNotSelectedZh: why.whyNotSelectedZh,
      whyNotSelectedEn: why.whyNotSelectedEn,
      evidenceStatus: safeList(guest.provenance, "seed / proxy").join("; "),
      riskStatus: safeText(guest.mainRisk, "risk retained"),
      label: selectLabel(lang, safeText(guest.guestMetal), safeText(guest.guestMetal)),
    }
  })
}

export function buildRouteCompetitionModel(workbenchInput = null, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, {})
  return asArray(workbench?.complementarity?.routeScores).map(route => {
    const why = routeSelectionWhy(route)
    const breakdown = route.scoreBreakdown || {}
    return {
      rank: safeNumber(route.ranking, 0),
      routeId: safeText(route.routeId),
      route: routeName(route),
      hgcps: roundScore(route.finalHGCPS, 3),
      role: pathRoleForRoute(route),
      factorBreakdown: {
        hostStability: roundScore(breakdown.hostStability ?? route.hostStabilityScore, 2),
        hostPathwaySupport: roundScore(breakdown.hostPathwaySupport ?? route.hostPathwaySupportScore, 2),
        guestActivityCompensation: roundScore(breakdown.guestActivityCompensation ?? route.guestActivityCompensationScore, 2),
        complementarity: roundScore(breakdown.complementarity ?? route.hostGuestComplementarityScore, 2),
        evidenceConfidence: roundScore(breakdown.evidence ?? route.evidenceConfidenceScore, 2),
        riskRetention: roundScore(breakdown.riskRetentionFactor ?? route.riskPenalty, 2),
        synthesizability: roundScore(breakdown.synthesizability ?? route.synthesizabilityScore, 2),
        economics: roundScore(breakdown.economics ?? route.economicScore, 2),
      },
      evidenceConfidence: roundScore(route.evidenceConfidence ?? route.evidenceConfidenceScore, 2),
      riskRetention: roundScore(route.riskRetentionFactor ?? route.riskPenalty, 2),
      whyRankedHereZh: why.whyRankedHereZh,
      whyRankedHereEn: why.whyRankedHereEn,
      whyNotHigherZh: why.whyNotHigherZh,
      whyNotHigherEn: why.whyNotHigherEn,
      nextValidationZh: safeText(route.nextExperiment, "下一步同条件验证。"),
      nextValidationEn: safeText(route.nextExperiment, "Next same-condition validation."),
      label: selectLabel(lang, routeName(route), routeName(route)),
    }
  })
}

export function buildRouteCompetitionModelCsvRows(workbenchInput = null) {
  return buildRouteCompetitionModel(workbenchInput, "zh").map(row => ({
    rank: row.rank,
    route: row.route,
    hgcps: row.hgcps,
    role: row.role,
    hostStability: row.factorBreakdown.hostStability,
    hostPathwaySupport: row.factorBreakdown.hostPathwaySupport,
    guestActivityCompensation: row.factorBreakdown.guestActivityCompensation,
    complementarity: row.factorBreakdown.complementarity,
    evidenceConfidence: row.evidenceConfidence,
    riskRetention: row.riskRetention,
    whyRankedHere: row.whyRankedHereZh,
    whyNotHigher: row.whyNotHigherZh,
    nextValidation: row.nextValidationZh,
  }))
}

export function buildNodeInspectorModel(nodeOrId, network, workbenchInput = null, lang = "zh") {
  const nodes = asArray(network?.nodes)
  const selectedNode = typeof nodeOrId === "string"
    ? nodes.find(node => node.id === nodeOrId) || nodes[0]
    : nodeOrId || nodes[0]
  const workbench = getWorkbench(workbenchInput || network?.workbench, network?.sourceData || {})
  const node = selectedNode || createNode({
    id: "flow-pathway-empty",
    type: "pathway",
    column: "pathway",
    labelZh: "路径起点",
    labelEn: "Pathway start",
    lang,
  })
  const relatedEdges = asArray(network?.edges).filter(edge => edge.source === node.id || edge.target === node.id)
  const routeExplanation = node.type === "route"
    ? buildHostGuestRouteExplanation(asArray(workbench?.complementarity?.routeScores).find(route => node.id === nodeId("route", route.routeId)), {
      hostSelection: workbench?.hostSelection,
      guestSelection: workbench?.guestSelection,
      descriptorMap: workbench?.descriptorMap,
      evidenceRecords: network?.sourceData?.evidenceRiskRecords || [],
      validationExperiments: network?.sourceData?.validationExperiments || [],
    })
    : null

  return {
    nodeId: node.id,
    name: node.label,
    nameZh: node.labelZh,
    nameEn: node.labelEn,
    type: node.type,
    typeLabel: node.typeLabel,
    roleInChain: textFor(lang, node.roleInAlgorithmZh, node.roleInAlgorithmEn),
    input: textFor(lang, node.inputZh, node.inputEn),
    output: textFor(lang, node.outputZh, node.outputEn),
    summary: textFor(lang, node.summaryZh, node.summaryEn),
    relatedDescriptors: node.relatedItems,
    relatedCandidates: nodes.filter(row => row.pathRole === node.pathRole && ["host", "guest", "route"].includes(row.type)).map(row => row.label).slice(0, 6),
    relatedRoutes: asArray(workbench?.complementarity?.routeScores).filter(route => {
      if (node.type === "host") return route.hostMof === node.labelZh
      if (node.type === "guest") return route.guestMetal === node.labelZh
      return node.type === "route" ? node.id === nodeId("route", route.routeId) : isTopRoute(route)
    }).map(route => routeName(route)).slice(0, 6),
    evidenceStatus: node.evidenceStatus,
    riskStatus: node.riskStatus,
    whyNextStep: textFor(lang, node.whyNextZh, node.whyNextEn),
    hgcpsImpact: textFor(lang, node.hgcpsImpactZh, node.hgcpsImpactEn),
    edgeSummary: relatedEdges.map(edge => textFor(lang, edge.labelZh, edge.labelEn)).slice(0, 8),
    methodologyAnchor: node.methodologyAnchor || `#${METHODOLOGY_BASE}`,
    jumpTargets: node.jumpTargets,
    routeExplanation,
    boundaries: [
      "非最终催化性能证明 / Not final catalytic proof",
      "非正式机器学习推荐 / Not formal machine learning recommendation",
      "尚未完成性能验证 / Not performance-validated",
    ],
  }
}

export function buildOrganicAcidUxStatusBar(workbenchInput = null, sourceData = {}, activation = null, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || arrays.routes.find(isTopRoute) || arrays.routes[0] || {}
  const readiness = activation?.readiness || activation?.activationReadinessSummary || {}
  return {
    version: ORGANIC_ACID_ALGORITHM_FLOW_VERSION,
    stageZh: "实验规划可启用",
    stageEn: "Planning-ready",
    stage: textFor(lang, "实验规划可启用", "Planning-ready"),
    inputScale: {
      hostCandidates: arrays.hosts.length,
      guestMetals: arrays.guests.length,
      routes: arrays.routes.length,
      evidenceRiskRecords: arrays.evidence.length,
    },
    inputScaleLabelZh: `${arrays.hosts.length} 个主体候选 / ${arrays.guests.length} 个客体金属 / ${arrays.routes.length} 条路线 / ${arrays.evidence.length} 条证据风险记录`,
    inputScaleLabelEn: `${arrays.hosts.length} host candidates / ${arrays.guests.length} guest metals / ${arrays.routes.length} routes / ${arrays.evidence.length} evidence-risk records`,
    chainZh: "Pathway → Descriptor → Host → Guest → Route → Validation",
    chainEn: "Pathway → Descriptor → Host → Guest → Route → Validation",
    outputZh: `${routeName(topRoute)} 最高优先级验证路线`,
    outputEn: `${routeName(topRoute)} top-priority validation route`,
    output: textFor(lang, `${routeName(topRoute)} 最高优先级验证路线`, `${routeName(topRoute)} top-priority validation route`),
    boundaryZh: "非最终催化性能证明 / 非正式机器学习推荐",
    boundaryEn: "Not final catalytic proof / Not formal machine learning recommendation",
    readinessZh: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
    readinessEn: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
    actionLabelZh: "从路径开始",
    actionLabelEn: "Start from pathway",
  }
}

export function buildAlgorithmRunTraceSummary(workbenchInput = null, sourceData = {}, activation = null, lang = "zh") {
  const workbench = getWorkbench(workbenchInput, sourceData)
  const arrays = sourceArrays(workbench, sourceData)
  const topRoute = workbench?.complementarity?.topRoute || arrays.routes.find(isTopRoute) || arrays.routes[0] || {}
  return {
    version: ORGANIC_ACID_ALGORITHM_FLOW_VERSION,
    titleZh: "算法运行追踪摘要",
    titleEn: "Algorithm Run Trace Summary",
    steps: [
      ["pathway", "加载 CO2 -> 有机酸路径步骤", `${arrays.pathwaySteps.length} pathway steps`],
      ["descriptor", "映射路径步骤描述符", `${arrays.descriptorMap.length} descriptor groups`],
      ["host", "筛选主体 MOF", `${arrays.hosts.length} hosts; Al-MOF selected`],
      ["guest", "筛选客体 / 掺杂金属", `${arrays.guests.length} guests; Mo selected`],
      ["route", "组合主客体路线并计算 HGCPS", `${arrays.routes.length} routes; ${routeName(topRoute)} top`],
      ["validation", "输出最小实验验证路线", `${arrays.validations.filter(row => row.routeId === topRoute.routeId).length} linked experiments`],
    ].map(([id, zh, en], index) => ({
      id,
      order: index + 1,
      labelZh: zh,
      labelEn: en,
      label: textFor(lang, zh, en),
    })),
    boundaryZh: "该摘要用于实验规划，不是最终催化性能证明，也不是正式机器学习推荐。",
    boundaryEn: "This summary supports experiment planning, not final catalytic proof or formal machine learning recommendation.",
    readiness: activation?.readiness?.readinessLevel || "planning-ready / not performance-validated",
  }
}

export function buildAdvancedAnalysisNavigationModel(lang = "zh") {
  return ADVANCED_TABS.map(([id, zh, en]) => ({
    id,
    labelZh: zh,
    labelEn: en,
    label: textFor(lang, zh, en),
    anchor: "#organic-acid-advanced-robustness-evidence",
  }))
}

export function buildOrganicAcidAlgorithmFlowNetwork(workbenchInput = null, sourceData = {}, options = {}) {
  const lang = options.lang || "zh"
  const workbench = getWorkbench(workbenchInput, sourceData)
  const nodes = buildAlgorithmFlowNodes(workbench, sourceData, lang)
  const edges = buildAlgorithmFlowEdges(nodes, workbench, sourceData, lang)
  const highlightedPaths = buildHighlightedTopRoutePath(workbench, nodes, sourceData)
  const columns = COLUMN_DEFINITIONS.map(column => ({
    ...column,
    label: textFor(lang, column.labelZh, column.labelEn),
    nodeIds: nodes.filter(node => node.column === column.id).map(node => node.id),
  }))
  const routeCompetition = buildRouteCompetitionModel(workbench, lang)
  const selectedNodeId = options.selectedNodeId || highlightedPaths.defaultSelectedNodeId || nodes[0]?.id

  return {
    id: "organic-acid-algorithm-flow-network",
    version: ORGANIC_ACID_ALGORITHM_FLOW_VERSION,
    hostGuestVersion: ORGANIC_ACID_HOST_GUEST_VERSION,
    name: ORGANIC_ACID_ALGORITHM_FLOW_NAME,
    nameZh: "有机酸算法链式网络",
    terminology: buildLocalizedOrganicAcidTerminology(lang),
    statusBar: buildOrganicAcidUxStatusBar(workbench, sourceData, options.activationWorkbench, lang),
    columns,
    nodes,
    edges,
    highlightedPaths,
    selectedNodeId,
    nodeInspector: buildNodeInspectorModel(selectedNodeId, { nodes, edges, workbench, sourceData }, workbench, lang),
    competition: {
      hosts: buildHostCompetitionModel(workbench, lang),
      guests: buildGuestCompetitionModel(workbench, lang),
      routes: routeCompetition,
    },
    runTrace: buildAlgorithmRunTraceSummary(workbench, sourceData, options.activationWorkbench, lang),
    advancedNavigation: buildAdvancedAnalysisNavigationModel(lang),
    routeOutput: {
      routeId: safeText(workbench?.complementarity?.topRoute?.routeId, "route-al-mof-mo"),
      routeName: routeName(workbench?.complementarity?.topRoute),
      outputNatureZh: "最高优先级验证路线 / 可用于实验规划",
      outputNatureEn: "Top-priority validation route / planning-ready",
      boundaries: [
        "非最终催化性能证明 / Not final catalytic proof",
        "非正式机器学习推荐 / Not formal machine learning recommendation",
        "尚未完成性能验证 / Not performance-validated",
      ],
      nextActionsZh: [
        `为 ${safeText(workbench?.complementarity?.topRoute?.hostMof, "top route host")} 建立路线专用主体与对照矩阵。`,
        `选择 ${safeText(workbench?.complementarity?.topRoute?.guestMetal, "guest")} 引入策略并运行最小实验矩阵。`,
        "回填同条件数据模板后再预览 HGCPS 更新。",
      ],
      nextActionsEn: [
        `Build a route-specific host and control matrix for ${safeText(workbench?.complementarity?.topRoute?.hostMof, "the top route host")}.`,
        `Choose a ${safeText(workbench?.complementarity?.topRoute?.guestMetal, "guest")} introduction strategy and run the minimum matrix.`,
        "Fill same-condition template before previewing HGCPS updates.",
      ],
      hgcpsFormula: HGCPS_FORMULA_TEXT,
      topRoute: routeCompetition.find(row => row.rank === 1) || routeCompetition[0],
    },
    workbench,
    sourceData,
  }
}

export function buildFlowNetworkExportJson(network) {
  const next = network || buildOrganicAcidAlgorithmFlowNetwork()
  return {
    version: ORGANIC_ACID_ALGORITHM_FLOW_VERSION,
    name: ORGANIC_ACID_ALGORITHM_FLOW_NAME,
    statusBar: next.statusBar,
    columns: next.columns.map(column => ({ id: column.id, labelZh: column.labelZh, labelEn: column.labelEn, nodeIds: column.nodeIds })),
    nodes: next.nodes.map(node => ({
      id: node.id,
      type: node.type,
      labelZh: node.labelZh,
      labelEn: node.labelEn,
      pathRole: node.pathRole,
      score: node.score,
      statusZh: node.statusZh,
      statusEn: node.statusEn,
      methodologyAnchor: node.methodologyAnchor,
    })),
    edges: next.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      labelZh: edge.labelZh,
      labelEn: edge.labelEn,
      pathRole: edge.pathRole,
    })),
    highlightedPaths: next.highlightedPaths,
    boundary: "Al-MOF + Mo is a top-priority experimental validation route, not final catalytic proof and not formal ML recommendation.",
  }
}

export function buildNodeInspectorSummaryJson(inspector) {
  const next = inspector || {}
  return {
    version: ORGANIC_ACID_ALGORITHM_FLOW_VERSION,
    nodeId: safeText(next.nodeId, "node pending"),
    nameZh: safeText(next.nameZh, "节点"),
    nameEn: safeText(next.nameEn, "Node"),
    type: safeText(next.type, "node"),
    roleInChain: safeText(next.roleInChain, "role pending"),
    input: safeText(next.input, "input pending"),
    output: safeText(next.output, "output pending"),
    evidenceStatus: safeText(next.evidenceStatus, "evidence pending"),
    riskStatus: safeText(next.riskStatus, "risk retained"),
    whyNextStep: safeText(next.whyNextStep, "next step pending"),
    hgcpsImpact: safeText(next.hgcpsImpact, "HGCPS impact pending"),
    methodologyAnchor: safeText(next.methodologyAnchor, `#${METHODOLOGY_BASE}`),
    boundaries: safeList(next.boundaries, "not final catalytic proof"),
  }
}

function csvEscape(value) {
  const text = safeText(value, "")
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function rowsToCsv(rows) {
  const dataRows = asArray(rows)
  if (!dataRows.length) return ""
  const headers = Object.keys(dataRows[0])
  return [
    headers.join(","),
    ...dataRows.map(row => headers.map(header => csvEscape(row[header])).join(",")),
  ].join("\n")
}

export function buildCandidateCompetitionCsv(networkOrWorkbench) {
  const workbench = networkOrWorkbench?.workbench || networkOrWorkbench
  const hostRows = buildHostCompetitionModel(workbench, "zh").map(row => ({
    type: "host",
    rank: row.rank,
    candidate: row.host,
    score: row.score,
    role: row.role,
    advantage: row.advantageZh,
    limitation: row.limitationZh,
    whySelected: row.whySelectedZh,
    whyNotSelected: row.whyNotSelectedZh,
    evidenceStatus: row.evidenceStatus,
    riskStatus: row.riskStatus,
  }))
  const guestRows = buildGuestCompetitionModel(workbench, "zh").map(row => ({
    type: "guest",
    rank: row.rank,
    candidate: row.metal,
    score: row.score,
    role: row.role,
    advantage: row.advantageZh,
    limitation: row.limitationZh,
    whySelected: row.whySelectedZh,
    whyNotSelected: row.whyNotSelectedZh,
    evidenceStatus: row.evidenceStatus,
    riskStatus: row.riskStatus,
  }))
  return rowsToCsv([...hostRows, ...guestRows])
}

export function buildRouteCompetitionCsv(networkOrWorkbench) {
  const workbench = networkOrWorkbench?.workbench || networkOrWorkbench
  return rowsToCsv(buildRouteCompetitionModelCsvRows(workbench))
}

export function buildAlgorithmFlowMarkdownSummary(network) {
  const next = network || buildOrganicAcidAlgorithmFlowNetwork()
  const status = next.statusBar
  const top = next.routeOutput.topRoute || {}
  return [
    `# ${next.nameZh} / ${next.name}`,
    "",
    `Version: ${ORGANIC_ACID_ALGORITHM_FLOW_VERSION}`,
    `Stage: ${status.stageZh} / ${status.stageEn}`,
    `Input scale: ${status.inputScaleLabelZh}`,
    `Chain: ${status.chainZh}`,
    `Output: ${status.outputZh}`,
    `Boundary: ${status.boundaryZh}`,
    "",
    "## Top Route",
    "",
    `Route: ${safeText(top.route, "route pending")}`,
    `HGCPS: ${safeText(top.hgcps, "pending")}`,
    `Why ranked here: ${safeText(top.whyRankedHereZh, "The current route ranks first in route competition.")}`,
    `Why not final proof: ${safeText(top.whyNotHigherZh, "Not final catalytic proof.")}`,
    "",
    "## Network Nodes",
    "",
    ...next.columns.flatMap(column => [
      `### ${column.labelZh} / ${column.labelEn}`,
      ...column.nodeIds.slice(0, 8).map(id => {
        const node = next.nodes.find(row => row.id === id)
        return `- ${node?.labelZh || id}: ${node?.statusZh || "pending"}`
      }),
      "",
    ]),
    "## Boundaries",
    "",
    "- 非最终催化性能证明 / Not final catalytic proof",
    "- 非正式机器学习推荐 / Not formal machine learning recommendation",
    "- 尚未完成性能验证 / Not performance-validated",
    "",
  ].join("\n")
}
