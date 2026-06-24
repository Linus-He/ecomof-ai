/**
 * Organic Acid Explanation Closure builders (V3.9.5.5).
 *
 * Extends the V3.9.5.2 score-provenance explainer to Step 1 (pathway evidence),
 * Step 2 (descriptor mapping), and Step 6 (validation coverage), plus a
 * terminology crosswalk that keeps HGCPS primary while mapping OACS / DMRS.
 *
 * Everything is derived from pathwaySteps / descriptorMap / evidenceRiskRecords /
 * validationExperiments / activationWorkbench. No pathway count, control group,
 * candidate, or HGCPS value is hardcoded; no undefined / null / NaN leaks.
 */
import { buildOrganicAcidHostGuestWorkbench, safeNumber } from "../organicAcidHostGuest/index.js"
import { deriveDataGrade } from "../organicAcidScoreProvenance/index.js"

export const ORGANIC_ACID_EXPLANATION_CLOSURE_VERSION = "V3.9.8"

export const PATHWAY_BOUNDARY_ZH = "路径与描述符来自 seed / proxy / curated 证据，不等于完整机理证明。"
export const PATHWAY_BOUNDARY_EN = "Pathways and descriptors come from seed / proxy / curated evidence, not a complete mechanistic proof."
export const VALIDATION_BOUNDARY_ZH = "验证矩阵说明下一步实验如何覆盖风险，不代表实验已完成。"
export const VALIDATION_BOUNDARY_EN = "The validation matrix shows how the next experiments cover risk; it does not mean the experiments are complete."

const CONFIDENCE_RANK = { high: 4, "medium-high": 3, medium: 2, "medium-low": 1, low: 0 }
const STRUCTURE_TOKENS = /pxrd|xrd|ftir|xps|icp|bet|sorption|tem|sem|exafs|xanes|raman|structure|characterization/i
const PRODUCT_TOKENS = /hplc|ic\b|gc\b|formic|product|calibration|nmr|yield|selectivity/i

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function safeText(value, fallback = "pending") {
  if (value === undefined || value === null) return fallback
  const next = String(value).trim()
  return next || fallback
}

function num(value, fallback = 0) {
  return safeNumber(value, fallback)
}

function resolveWorkbench(workbench, sourceData = {}) {
  return workbench || buildOrganicAcidHostGuestWorkbench(sourceData || {})
}

function pathwayArrays(workbench, sourceData = {}) {
  return {
    steps: asArray(sourceData.pathwaySteps).length ? asArray(sourceData.pathwaySteps) : asArray(workbench?.pathwaySteps),
    descriptorMap: asArray(sourceData.pathwayDescriptorMap).length ? asArray(sourceData.pathwayDescriptorMap) : asArray(workbench?.descriptorMap),
    evidence: asArray(sourceData.evidenceRiskRecords).length ? asArray(sourceData.evidenceRiskRecords) : [],
  }
}

function confidenceStatus(level) {
  const rank = CONFIDENCE_RANK[safeText(level, "medium").toLowerCase()] ?? 2
  if (rank >= 3) return "covered"
  if (rank >= 1) return "partial"
  return "missing"
}

function evidenceStatus(count) {
  if (count >= 4) return "covered"
  if (count >= 1) return "partial"
  return "missing"
}

// ── Step 1: Pathway Evidence Heatmap ──────────────────────────────────────────
export function buildPathwayEvidenceHeatmapModel(workbenchInput = null, sourceData = {}) {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const { steps, descriptorMap, evidence } = pathwayArrays(workbench, sourceData)
  const mapByStep = descriptorMap.reduce((acc, m) => {
    const id = safeText(m.stepId)
    acc[id] = acc[id] || []
    acc[id].push(m)
    return acc
  }, {})
  const rows = steps.map((step, index) => {
    const stepId = safeText(step.stepId, `step-${index + 1}`)
    const maps = asArray(mapByStep[stepId])
    const related = evidence.filter(e => e.linkedStepId === stepId)
    const evidenceCount = num(step.evidenceCount, related.length)
    const descriptorCount = maps.reduce((s, m) => s + asArray(m.descriptors).filter(Boolean).length, 0)
    const missingDescriptorCount = maps.reduce((s, m) => s + asArray(m.missingDescriptors).filter(Boolean).length, 0)
    const riskFlag = related.some(e => safeText(e.riskType, "") !== "pending" && safeText(e.riskType, "") !== "") || num(step.penalty) > 0
    const grade = deriveDataGrade(maps[0]?.provenance || step.provenance || [safeText(step.uncertainty, "proxy")])
    const evMode = safeText(maps[0]?.evidenceType || step.evidenceType, "proxy / inferred")
    return {
      stepId,
      labelZh: safeText(step.stepName),
      labelEn: safeText(step.stepName),
      evidenceCount,
      confidenceLevel: safeText(step.confidenceLevel, "medium"),
      mappedDescriptorCount: descriptorCount,
      missingDescriptorCount,
      riskFlag,
      dataGrade: grade,
      evidenceMode: evMode,
      sourceFields: ["pathway_steps.json", "pathway_descriptor_map.json", "evidence_risk_records.json"],
      cells: [
        { metric: "evidence", labelZh: "证据数", labelEn: "Evidence", value: evidenceCount, status: evidenceStatus(evidenceCount) },
        { metric: "confidence", labelZh: "置信度", labelEn: "Confidence", value: safeText(step.confidenceLevel, "medium"), status: confidenceStatus(step.confidenceLevel) },
        { metric: "descriptor", labelZh: "描述符", labelEn: "Descriptors", value: descriptorCount, status: descriptorCount > 0 && missingDescriptorCount === 0 ? "covered" : descriptorCount > 0 ? "partial" : "missing" },
        { metric: "risk", labelZh: "风险", labelEn: "Risk", value: riskFlag ? "retained" : "none", status: riskFlag ? "risk" : "covered" },
      ],
    }
  })
  return {
    titleZh: "路径证据热图",
    titleEn: "Pathway Evidence Heatmap",
    columns: [
      { key: "evidence", labelZh: "证据数", labelEn: "Evidence" },
      { key: "confidence", labelZh: "置信度", labelEn: "Confidence" },
      { key: "descriptor", labelZh: "描述符", labelEn: "Descriptors" },
      { key: "risk", labelZh: "风险", labelEn: "Risk" },
    ],
    rows,
    stepCount: rows.length,
    headerNoteZh: PATHWAY_BOUNDARY_ZH,
    headerNoteEn: PATHWAY_BOUNDARY_EN,
  }
}

export function buildPathwayEvidenceSummary(workbenchInput = null, sourceData = {}) {
  const heatmap = buildPathwayEvidenceHeatmapModel(workbenchInput, sourceData)
  const rows = heatmap.rows
  const covered = rows.filter(r => evidenceStatus(r.evidenceCount) !== "missing" && confidenceStatus(r.confidenceLevel) !== "missing").length
  const pending = rows.length - covered
  const riskRows = rows.filter(r => r.riskFlag)
  return {
    oneLineConclusionZh: `当前 CO₂→有机酸路径被分解为 ${rows.length} 个步骤，其中 ${covered} 个步骤已有 proxy / curated 证据支持，${pending} 个步骤仍存在证据缺口。`,
    oneLineConclusionEn: `The CO2-to-organic-acid pathway is decomposed into ${rows.length} steps; ${covered} have proxy / curated evidence and ${pending} still have evidence gaps.`,
    keyCoveredCount: covered,
    pendingCount: pending,
    mainRisk: riskRows.length ? `${riskRows.length} 个步骤存在待验证风险` : "无显式风险标记",
    whyThisMattersZh: "展示路径分解的证据覆盖，说明步骤不是随意写出，而是按证据与描述符支撑排列。",
    nextActionZh: pending > 0 ? "优先为证据缺口步骤补充同条件证据。" : "进入路径与描述符对应关系。",
    boundaryZh: PATHWAY_BOUNDARY_ZH,
  }
}

// ── Step 2: Descriptor Mapping Explanation ────────────────────────────────────
export function buildDescriptorMappingExplanationModel(workbenchInput = null, sourceData = {}, options = {}) {
  const workbench = resolveWorkbench(workbenchInput, sourceData)
  const { steps, descriptorMap } = pathwayArrays(workbench, sourceData)
  const maxVisible = options.maxVisibleDescriptors || 4
  const stepNameById = new Map(steps.map(s => [safeText(s.stepId), safeText(s.stepName)]))
  const groups = descriptorMap.map((m, index) => {
    const descriptors = asArray(m.descriptors).filter(Boolean)
    const missing = asArray(m.missingDescriptors).filter(Boolean)
    const visible = descriptors.slice(0, maxVisible)
    return {
      id: safeText(m.mappingId, `map-${index + 1}`),
      stepId: safeText(m.stepId),
      stepName: stepNameById.get(safeText(m.stepId)) || safeText(m.stepId),
      descriptorGroup: safeText(m.descriptorGroup),
      descriptors,
      visibleDescriptors: visible,
      overflowCount: Math.max(0, descriptors.length - visible.length),
      descriptorCount: descriptors.length,
      missingDescriptors: missing,
      missingCount: missing.length,
      evidenceType: safeText(m.evidenceType, "proxy"),
      confidenceLevel: safeText(m.confidenceLevel, "medium"),
      descriptorDirection: safeText(m.descriptorDirection, "descriptor direction pending"),
      sourceFields: ["pathway_descriptor_map.json", ...asArray(m.provenance)],
    }
  })
  const nodes = [
    ...steps.map((s, i) => ({ id: safeText(s.stepId, `step-${i + 1}`), type: "pathway-step", labelZh: safeText(s.stepName), labelEn: safeText(s.stepName) })),
    ...groups.map(g => ({ id: g.id, type: "descriptor-group", labelZh: g.descriptorGroup, labelEn: g.descriptorGroup, missingCount: g.missingCount })),
  ]
  const edges = groups.map(g => ({
    id: `edge-${g.id}`,
    source: g.stepId,
    target: g.id,
    weight: g.descriptorCount,
    evidenceType: g.evidenceType,
    missing: g.missingCount > 0,
  }))
  return {
    titleZh: "路径与描述符对应关系",
    titleEn: "Pathway-Descriptor Mapping",
    nodes,
    edges,
    descriptorGroups: groups,
    stepCount: steps.length,
    groupCount: groups.length,
    missingDescriptorCount: groups.reduce((s, g) => s + g.missingCount, 0),
    headerNoteZh: PATHWAY_BOUNDARY_ZH,
    headerNoteEn: PATHWAY_BOUNDARY_EN,
  }
}

export function buildDescriptorMappingSummary(workbenchInput = null, sourceData = {}) {
  const model = buildDescriptorMappingExplanationModel(workbenchInput, sourceData)
  const missing = model.missingDescriptorCount
  return {
    oneLineConclusionZh: `当前 ${model.stepCount} 个路径步骤映射到 ${model.groupCount} 个描述符组，其中 ${missing} 个描述符仍待补证据。`,
    oneLineConclusionEn: `${model.stepCount} pathway steps map to ${model.groupCount} descriptor groups, with ${missing} descriptors still awaiting evidence.`,
    keyCoveredCount: model.groupCount,
    pendingCount: missing,
    mainRisk: missing > 0 ? "稳定性与中间体结合相关描述符仍是主要缺口" : "描述符覆盖较完整",
    whyThisMattersZh: "把路径瓶颈映射到可比较的材料描述符组，避免把所有描述符混成一个总表。",
    nextActionZh: "用描述符驱动主体 MOF 与客体金属筛选。",
    boundaryZh: PATHWAY_BOUNDARY_ZH,
  }
}

// ── Step 6: Validation Coverage Matrix ────────────────────────────────────────
const COVERAGE_ITEMS = [
  { id: "blank", labelZh: "空白对照", labelEn: "Blank control", match: t => /blank|no catalyst/.test(t) },
  { id: "pristine-host", labelZh: "pristine 主体对照", labelEn: "Pristine host control", match: t => /pristine|host scaffold/.test(t) },
  { id: "top-route", labelZh: "最高路线验证", labelEn: "Top route validation", match: t => /top route/.test(t) },
  { id: "guest-control", labelZh: "客体金属对照", labelEn: "Guest metal control", match: t => /guest.{0,12}control/.test(t) },
  { id: "host-control", labelZh: "主体框架对照", labelEn: "Host framework control", match: t => /host framework control|host control/.test(t) },
  { id: "mo-only", labelZh: "Mo-only 对照", labelEn: "Mo-only control", match: t => /mo-only|moox|mo precursor|mo only/.test(t) },
  { id: "structure", labelZh: "结构表征", labelEn: "Structure characterization", match: (t, g) => STRUCTURE_TOKENS.test(`${t} ${asArray(g.requiredCharacterizationBeforeReaction).join(" ")} ${asArray(g.requiredCharacterizationAfterReaction).join(" ")}`) },
  { id: "product", labelZh: "产物分析", labelEn: "Product analysis", match: (t, g) => PRODUCT_TOKENS.test(`${t} ${asArray(g.requiredProductAnalysis).join(" ")}`) },
  { id: "carbon", labelZh: "碳平衡", labelEn: "Carbon balance", match: (t, g) => /carbon/.test(`${t} ${safeText(g.notes, "")}`) },
]

function groupText(g) {
  return `${safeText(g.controlType, "")} ${safeText(g.experimentName, "")} ${safeText(g.purpose, "")} ${safeText(g.routeId, "")} ${safeText(g.hypothesisTested, "")}`.toLowerCase()
}

export function buildValidationCoverageMatrixModel(workbenchInput = null, sourceData = {}, activationWorkbench = null) {
  const matrix = activationWorkbench?.minimumExperimentalMatrix || {}
  const groups = asArray(matrix.all)
  const readiness = activationWorkbench?.readiness || {}
  const feedbackRules = asArray(activationWorkbench?.feedbackRules)
  const items = COVERAGE_ITEMS.map(item => {
    const matched = groups.filter(g => item.match(groupText(g), g))
    let status = "pending"
    if (matched.length) {
      const validated = matched.some(g => /validated|confirmed|complete/i.test(safeText(g.curationStatus, "")) && safeText(g.dataMode, "seed") !== "seed")
      status = validated ? "covered" : "partial"
      if (["blank", "pristine-host", "top-route", "guest-control", "host-control", "mo-only", "structure", "product"].includes(item.id) && matched.length) {
        status = "covered" // a dedicated planning group covers the control item
      }
      if (item.id === "carbon") status = "partial" // mentioned in planning, no same-condition carbon-balance data yet
    } else if (groups.length === 0) {
      status = "pending"
    } else {
      status = "missing"
    }
    return {
      id: item.id,
      labelZh: item.labelZh,
      labelEn: item.labelEn,
      status,
      matchedGroups: matched.map(g => ({ id: safeText(g.experimentGroupId), name: safeText(g.experimentName), purpose: safeText(g.purpose), dataMode: safeText(g.dataMode, "seed"), curationStatus: safeText(g.curationStatus, "pending") })),
      requiredFields: matched.flatMap(g => [...asArray(g.requiredCharacterizationBeforeReaction), ...asArray(g.requiredProductAnalysis)]).slice(0, 4),
      dataState: matched.length ? "planning data (seed / curated), not performance-validated" : "not yet in the minimum experiment matrix",
    }
  })
  // result feedback derives from feedback rules availability, not a control group
  items.push({
    id: "result-feedback",
    labelZh: "结果反馈",
    labelEn: "Result feedback",
    status: feedbackRules.length ? "partial" : "pending",
    matchedGroups: [],
    requiredFields: feedbackRules.slice(0, 3).map(r => safeText(r.ruleId || r.id || r.trigger, "feedback rule")),
    dataState: feedbackRules.length ? "feedback rules ready; no validated result fed back yet" : "feedback rules pending",
  })
  const coveredCount = items.filter(i => i.status === "covered").length
  return {
    titleZh: "验证覆盖矩阵",
    titleEn: "Validation Coverage Matrix",
    items,
    coveredCount,
    experimentGroupCount: groups.length,
    readinessLevel: safeText(readiness.readinessLevel, "planning-ready / not performance-validated"),
    canUseForPerformanceClaim: readiness.canUseForPerformanceClaim === true,
    canUseForMachineLearning: readiness.canUseForMachineLearning === true,
    headerNoteZh: VALIDATION_BOUNDARY_ZH,
    headerNoteEn: VALIDATION_BOUNDARY_EN,
  }
}

export function buildValidationCoverageSummary(workbenchInput = null, sourceData = {}, activationWorkbench = null) {
  const model = buildValidationCoverageMatrixModel(workbenchInput, sourceData, activationWorkbench)
  const coveredLabels = model.items.filter(i => i.status === "covered").map(i => i.labelZh)
  const lead = coveredLabels.slice(0, 4).join("、") || "核心对照"
  return {
    oneLineConclusionZh: `当前最小实验矩阵覆盖 ${lead}，但同条件性能数据仍为 pending。`,
    oneLineConclusionEn: `The minimum experiment matrix covers ${model.items.filter(i => i.status === "covered").map(i => i.labelEn).slice(0, 4).join(", ") || "core controls"}, but same-condition performance data is still pending.`,
    keyCoveredCount: model.coveredCount,
    pendingCount: model.items.filter(i => i.status === "pending" || i.status === "missing").length,
    mainRisk: "同条件性能验证尚未完成",
    whyThisMattersZh: "说明算法输出如何转成可执行的最小实验验证路线，并保留风险覆盖。",
    nextActionZh: "打开实验启用中心，按矩阵执行同条件实验并回填反馈规则。",
    boundaryZh: VALIDATION_BOUNDARY_ZH,
  }
}

// ── Terminology crosswalk ─────────────────────────────────────────────────────
export function buildTerminologyCrosswalk() {
  return {
    titleZh: "评分术语对照",
    titleEn: "Scoring Terminology Crosswalk",
    primaryScore: "HGCPS",
    firstMentionNoteZh: "HGCPS：主客体互补路径评分，表示实验路线优先级，不是性能预测值。",
    firstMentionNoteEn: "HGCPS: Host-Guest Complementary Pathway Score; it expresses experimental route priority, not a performance prediction.",
    terms: [
      { acronym: "HGCPS", role: "primary", nameZh: "主客体互补路径评分", nameEn: "Host-Guest Complementary Pathway Score", noteZh: "主链条唯一主评分，八因子加权几何压缩，表示路线优先级。", noteEn: "The single primary score of the main chain; eight-factor weighted-geometric compression for route priority." },
      { acronym: "OACS", role: "legacy", nameZh: "有机酸候选评分", nameEn: "Organic Acid Candidate Score", noteZh: "历史 / 辅助指标，早期单材料候选评分，已收敛到 HGCPS。", noteEn: "Legacy / auxiliary metric; early single-candidate score now converged into HGCPS." },
      { acronym: "DMRS", role: "auxiliary", nameZh: "掺杂金属推荐评分", nameEn: "Dopant Metal Recommendation Score", noteZh: "辅助指标，对应 Guest Score，并入 HGCPS 的客体活性补偿因子。", noteEn: "Auxiliary metric; maps to Guest Score and feeds the HGCPS guest-activity-compensation factor." },
      { acronym: "Host Score", role: "factor", nameZh: "主体得分", nameEn: "Host Score", noteZh: "加权求和，进入 HGCPS 的主体稳定性与路径支持因子。", noteEn: "Weighted sum; feeds the HGCPS host-stability and pathway-support factors." },
      { acronym: "Guest Score", role: "factor", nameZh: "客体得分", nameEn: "Guest Score", noteZh: "加权求和，进入 HGCPS 的客体活性补偿因子。", noteEn: "Weighted sum; feeds the HGCPS guest-activity-compensation factor." },
      { acronym: "Risk Retention Factor", role: "factor", nameZh: "风险保留因子", nameEn: "Risk Retention Factor", noteZh: "0–1 风险保留系数，压低路线评分；不等于实验已证伪。", noteEn: "0-1 risk-retention coefficient that lowers the route score; not falsification." },
      { acronym: "Evidence Confidence Factor", role: "factor", nameZh: "证据置信因子", nameEn: "Evidence Confidence Factor", noteZh: "证据覆盖与置信度因子，进入 HGCPS 乘法。", noteEn: "Evidence coverage / confidence factor in the HGCPS product." },
    ],
  }
}

// ── Export + QA checklist ─────────────────────────────────────────────────────
export function buildExplanationClosureExportJson(workbenchInput = null, sourceData = {}, activationWorkbench = null) {
  return {
    version: ORGANIC_ACID_EXPLANATION_CLOSURE_VERSION,
    generatedAt: new Date().toISOString(),
    pathwayEvidenceHeatmap: buildPathwayEvidenceHeatmapModel(workbenchInput, sourceData),
    pathwayEvidenceSummary: buildPathwayEvidenceSummary(workbenchInput, sourceData),
    descriptorMappingExplanation: buildDescriptorMappingExplanationModel(workbenchInput, sourceData),
    descriptorMappingSummary: buildDescriptorMappingSummary(workbenchInput, sourceData),
    validationCoverageMatrix: buildValidationCoverageMatrixModel(workbenchInput, sourceData, activationWorkbench),
    validationCoverageSummary: buildValidationCoverageSummary(workbenchInput, sourceData, activationWorkbench),
    terminologyCrosswalk: buildTerminologyCrosswalk(),
    boundaries: [PATHWAY_BOUNDARY_ZH, VALIDATION_BOUNDARY_ZH],
  }
}

export function buildOrganicAcidVisualQaChecklist() {
  const item = (id, zh, en) => ({ id, labelZh: zh, labelEn: en, status: "to-verify" })
  return {
    titleZh: "可视化验收清单",
    titleEn: "Visual QA Checklist",
    noteZh: "真实浏览器点击验收项；自动沙箱不可截图时如实标注未完成。",
    noteEn: "Real-browser click-through checks; mark as not done when the sandbox cannot screenshot.",
    items: [
      item("open-live", "打开 live site 并进入 Catalysis Lab", "Open live site and enter Catalysis Lab"),
      item("acid-gate", "输入 acid 进入 Organic Acid Workbench", "Enter the acid passcode to open the Organic Acid Workbench"),
      item("step5-waterfall", "Step 5 HGCPS 因子压缩瀑布图可见", "Step 5 HGCPS factor compression waterfall is visible"),
      item("score-source", "HGCPS 数字 / 查看得分来源可展开 Score Source Table", "Score source table expands from the HGCPS score"),
      item("route-compare", "Route Factor Comparison 的 #2 可显示 why-not-other", "Route factor comparison #2 shows the why-not-other explanation"),
      item("step1-heatmap", "Step 1 路径证据热图可见", "Step 1 pathway evidence heatmap is visible"),
      item("step2-mapping", "Step 2 路径与描述符对应关系可见", "Step 2 descriptor mapping explanation is visible"),
      item("step6-matrix", "Step 6 验证覆盖矩阵可见", "Step 6 validation coverage matrix is visible"),
      item("terminology", "HGCPS / OACS / DMRS 术语对照可见", "HGCPS / OACS / DMRS terminology crosswalk is visible"),
      item("mobile", "移动端布局可用", "Mobile layout works"),
      item("dark", "暗色模式图表文字可读", "Dark-mode chart text is readable"),
    ],
  }
}
