// @ts-nocheck
// V2.0-J Screening Run state machine.
//
// A front-end interaction state machine ONLY. It does NOT recompute OACS/DMRS and
// does NOT run full database scoring. It reads the existing V2.0-I precompute summary
// and turns it into a runnable "screening audit" experience: ordered steps, a run
// result, and next actions. It is deterministic (no random behavior) and every output
// keeps notFinalRecommendation = true. It never reports model-precision metrics.

export const SCREENING_RUN_STATUSES = ["idle", "running", "completed", "warning", "blocked"]
export const SCREENING_STEP_STATUSES = ["pending", "running", "completed", "warning", "blocked", "skipped"]

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function ablationOverlap(summary, id) {
  const row = (summary?.featureAblationAudit || []).find(v => v.id === id)
  return row ? num(row.topNOverlapWithBaseline) : null
}

// Build the 12 ordered steps with a final status computed from the summary.
export function buildScreeningRunSteps(summary = {}) {
  const meta = summary.metadata || {}
  const descriptor = summary.descriptorCompleteness || {}
  const evidence = summary.mechanismEvidenceSummary || {}
  const sensitivity = summary.sensitivityAudit || {}
  const curation = summary.manualCurationSummary || {}
  const transition = summary.metadataTransitionSummary || {}
  const roadmap = summary.candidateValidationRoadmapSummary || {}
  const recordsScanned = num(summary.recordsScanned)
  const nearVerified = num(summary.nearVerifiedCount ?? transition.nearVerifiedBeforeCuration)
  const verified = num(meta.verified)
  const sourceConfirmed = num(transition.sourceConfirmed)
  const proxyAvailable = Object.values(summary.mechanismProxyAvailability || {}).filter(v => num(v) > 0).length
  const redundantPairs = num(summary.redundancyGate?.redundantPairCount)
  const top10 = num(sensitivity.top10Stability)

  const step = (id, title, titleZh, description, descriptionZh, status, inputCount, outputCount, extra = {}) => ({
    id, title, titleZh, description, descriptionZh, status,
    inputCount: num(inputCount), outputCount: num(outputCount),
    warning: extra.warning || null, warningZh: extra.warningZh || null,
    blocker: extra.blocker || null, blockerZh: extra.blockerZh || null,
    boundary: extra.boundary || "Audit step only; not a final recommendation.",
    boundaryZh: extra.boundaryZh || "仅审计步骤；不是最终推荐。",
  })

  return [
    step("load_sample", "Load current sample", "加载当前样本",
      "Load the currently loaded small-scale sample (not the full database).", "加载当前已加载的小规模样本（不是全量数据库）。",
      recordsScanned > 0 ? "completed" : "blocked", recordsScanned, recordsScanned,
      recordsScanned > 0 ? {} : { blocker: "No records loaded; choose a data scope first.", blockerZh: "未加载记录；请先选择数据范围。" }),
    step("metadata_gate", "Metadata gate", "Metadata 门控",
      "Classify candidates by metadata verification level.", "按 metadata 核验等级对候选分层。",
      "completed", recordsScanned, verified + num(meta.partial),
      { boundary: "Candidates missing key metadata stay preview only / blocked.", boundaryZh: "缺关键 metadata 的候选停留在仅限预览 / 暂不可用。" }),
    step("manual_curation", "Manual metadata curation status", "人工 metadata 整理状态",
      "Read the manual curation queue progress.", "读取人工整理队列进度。",
      num(curation.queueSize) > 0 ? "completed" : "warning", num(curation.queueSize), num(curation.queueSize)),
    step("source_link_enrichment", "Source-link enrichment check", "来源链接补全检查",
      "Check how many queue items have a confirmed source link.", "检查队列中有多少条已确认来源链接。",
      sourceConfirmed > 0 ? "completed" : "warning", num(curation.queueSize), sourceConfirmed,
      sourceConfirmed > 0 ? {} : { warning: "Source-link enrichment has not started.", warningZh: "来源链接补全尚未开始。" }),
    step("descriptor_completeness", "Descriptor completeness check", "描述符完整度检查",
      "Count complete / partial / missing-critical descriptor coverage.", "统计完整 / 部分 / 缺关键 描述符覆盖。",
      num(descriptor.complete) + num(descriptor.partial) > 0 ? "completed" : "warning",
      recordsScanned, num(descriptor.complete) + num(descriptor.partial)),
    step("descriptor_redundancy", "Descriptor redundancy audit", "冗余描述符审计",
      "Flag redundant descriptor pairs (not deleted).", "标记冗余描述符对（不删除）。",
      "completed", recordsScanned, redundantPairs,
      { boundary: "Redundant descriptors are penalized / reviewed, not deleted; OACS/DMRS unchanged.", boundaryZh: "冗余描述符被惩罚 / 复核，不删除；OACS/DMRS 不变。" }),
    step("mechanism_proxy", "Mechanism proxy mapping", "机制代理映射",
      "Map descriptors to CO2 -> organic-acid mechanism proxies.", "把描述符映射为 CO2 -> 有机酸机制代理。",
      "completed", recordsScanned, proxyAvailable,
      { boundary: "Rule-based mechanism hypotheses only; not DFT or experimental proof.", boundaryZh: "仅规则型机制假设；不是 DFT 或实验证据。" }),
    step("mechanism_evidence", "Mechanism evidence classification", "机制证据分层",
      "Classify proxy evidence: literature / descriptor / weak / insufficient.", "对代理证据分层：文献 / 描述符 / 弱代理 / 证据不足。",
      num(evidence.literature_supported) > 0 ? "completed" : "warning",
      recordsScanned, num(evidence.literature_supported),
      num(evidence.literature_supported) > 0 ? {} : { warning: "No literature-supported proxies yet; many remain weak proxies.", warningZh: "暂无文献支持的代理；多数仍是弱代理。" }),
    step("sensitivity_audit", "Sensitivity audit", "敏感性审计",
      "Check Top-N ranking stability under perturbation.", "检查扰动下 Top-N 排序稳定性。",
      top10 >= 0.7 ? "completed" : "warning", recordsScanned, num(sensitivity.auditRuns),
      { boundary: "Stability is not model accuracy.", boundaryZh: "稳定性不是模型准确率。" }),
    step("feature_ablation", "Feature ablation audit", "特征消融审计",
      "Compare Top-N overlap when feature groups are removed.", "比较移除特征组后的 Top-N 重叠。",
      "completed", recordsScanned, (summary.featureAblationAudit || []).length),
    step("validation_roadmap", "Candidate validation roadmap", "候选验证路线",
      "Build manual / descriptor / mechanism next-step actions per candidate.", "为每个候选生成 metadata / 描述符 / 机制 下一步行动。",
      "completed", recordsScanned, num(roadmap.candidateCount)),
    step("preview_report", "Generate screening preview report", "生成筛选预览报告",
      "Summarize the run as a preview report (not a final recommendation).", "把本次运行汇总为预览报告（不是最终推荐）。",
      verified > 0 ? "completed" : "warning", recordsScanned, nearVerified,
      verified > 0 ? {} : { warning: "verified_metadata is still 0; preview only.", warningZh: "verified_metadata 仍为 0；仅限预览。" }),
  ]
}

function deriveRunStatus(steps, summary) {
  if (num(summary.recordsScanned) === 0) return "blocked"
  if (steps.some(s => s.status === "blocked")) return "blocked"
  if (num(summary.metadata?.verified) === 0) return "warning"
  if (steps.some(s => s.status === "warning")) return "warning"
  return "completed"
}

export function getInitialScreeningRunState(summary = {}) {
  const steps = buildScreeningRunSteps(summary).map(s => ({ ...s, status: "pending" }))
  const blocked = num(summary.recordsScanned) === 0
  return {
    status: blocked ? "blocked" : "idle",
    activeIndex: -1,
    steps,
    result: null,
  }
}

// Deterministic final state (used by tests and as the run target).
export function runScreeningAuditSimulation(summary = {}, options = {}) {
  const steps = buildScreeningRunSteps(summary)
  const status = deriveRunStatus(steps, summary)
  return {
    status,
    activeIndex: -1,
    steps,
    result: buildScreeningRunResult(summary),
    notFinalRecommendation: true,
  }
}

export function buildScreeningRunResult(summary = {}) {
  const meta = summary.metadata || {}
  const descriptor = summary.descriptorCompleteness || {}
  const evidence = summary.mechanismEvidenceSummary || {}
  const sensitivity = summary.sensitivityAudit || {}
  const curation = summary.manualCurationSummary || {}
  const transition = summary.metadataTransitionSummary || {}
  const roadmap = summary.candidateValidationRoadmapSummary || {}
  const recordsScanned = num(summary.recordsScanned)
  const nearVerified = num(summary.nearVerifiedCount ?? transition.nearVerifiedBeforeCuration)
  const proxyAvailable = Object.values(summary.mechanismProxyAvailability || {}).filter(v => num(v) > 0).length

  const groups = [
    {
      id: "dataScope", title: "Data scope", titleZh: "数据范围",
      rows: [
        { labelEn: "Sample size", labelZh: "样本数", value: recordsScanned },
        { labelEn: "Mode", labelZh: "当前模式", value: "small-scale / preview only" },
        { labelEn: "Full database", labelZh: "全量数据库", value: "not run" },
      ],
    },
    {
      id: "metadata", title: "Metadata result", titleZh: "Metadata 结果",
      rows: [
        { labelEn: "Verified metadata", labelZh: "verified metadata", value: num(meta.verified) },
        { labelEn: "Near verified", labelZh: "near verified", value: nearVerified },
        { labelEn: "Preview only", labelZh: "preview only", value: num(meta.previewOnly) },
        { labelEn: "Manual curation queue", labelZh: "人工整理队列", value: num(curation.queueSize) },
        { labelEn: "Source confirmed", labelZh: "source confirmed", value: num(transition.sourceConfirmed) },
        { labelEn: "Citation ready", labelZh: "citation ready", value: num(transition.citationReady) },
        { labelEn: "License confirmed", labelZh: "license confirmed", value: num(transition.licenseConfirmed) },
      ],
    },
    {
      id: "descriptorMechanism", title: "Descriptors and mechanism proxies", titleZh: "描述符与机制代理",
      rows: [
        { labelEn: "Descriptor partial", labelZh: "descriptor partial", value: num(descriptor.partial) },
        { labelEn: "Redundancy pairs", labelZh: "redundancy pairs", value: num(summary.redundancyGate?.redundantPairCount) },
        { labelEn: "Mechanism proxy available", labelZh: "mechanism proxy available", value: `${proxyAvailable}` },
        { labelEn: "Literature supported", labelZh: "literature supported", value: num(evidence.literature_supported) },
        { labelEn: "Weak proxy", labelZh: "weak proxy", value: num(evidence.weak_proxy) },
      ],
    },
    {
      id: "stabilityAblation", title: "Stability and ablation", titleZh: "稳定性与消融",
      rows: [
        { labelEn: "Top5 stability", labelZh: "Top5 stability", value: num(sensitivity.top5Stability) },
        { labelEn: "Top10 stability", labelZh: "Top10 stability", value: num(sensitivity.top10Stability) },
        { labelEn: "Unstable candidates", labelZh: "unstable candidates", value: num(sensitivity.unstableCandidateCount) },
        { labelEn: "metadata-only overlap", labelZh: "metadata-only overlap", value: ablationOverlap(summary, "metadata_gate_only") },
        { labelEn: "without redundancy overlap", labelZh: "without redundancy overlap", value: ablationOverlap(summary, "without_redundant_descriptors") },
        { labelEn: "without mechanism proxy overlap", labelZh: "without mechanism proxy overlap", value: ablationOverlap(summary, "without_mechanism_proxies") },
      ],
    },
    {
      id: "validation", title: "Candidate validation roadmap", titleZh: "候选验证路线",
      rows: [
        { labelEn: "Validation roadmap count", labelZh: "validation roadmap count", value: num(roadmap.candidateCount) },
        { labelEn: "High priority", labelZh: "high priority", value: num(roadmap.priorityCounts?.high) },
        { labelEn: "Recommendation status", labelZh: "推荐状态", value: "not final recommendation" },
      ],
    },
  ]

  // V2.0-K evidence backfill result group (only when the backfill summary is present).
  const backfill = summary.evidenceBackfillSummary || null
  const verifiedReport = summary.verifiedCandidateReportSummary || null
  if (backfill) {
    groups.push({
      id: "evidenceBackfill", title: "Evidence backfill", titleZh: "证据回填",
      rows: [
        { labelEn: "Source confirmed", labelZh: "source confirmed", value: num(backfill.sourceStatusCounts?.confirmed) },
        { labelEn: "Citation ready", labelZh: "citation ready", value: num(backfill.citationStatusCounts?.ready) },
        { labelEn: "License confirmed", labelZh: "license confirmed", value: num(backfill.licenseStatusCounts?.confirmed) },
        { labelEn: "DOI confirmed", labelZh: "DOI confirmed", value: num(backfill.doiStatusCounts?.confirmed) },
        { labelEn: "DOI not available", labelZh: "DOI 不适用", value: num(backfill.doiStatusCounts?.not_available) },
        { labelEn: "DOI pending", labelZh: "DOI 待补", value: num(backfill.doiStatusCounts?.pending) },
        { labelEn: "verifiedMetadataEligible", labelZh: "verifiedMetadataEligible", value: num(backfill.verifiedMetadataEligible) },
        { labelEn: "verifiedMetadataCount", labelZh: "verifiedMetadataCount", value: num(verifiedReport?.verifiedMetadataCount ?? backfill.verifiedMetadataCount) },
        { labelEn: "Nearest to verified", labelZh: "nearest to verified", value: num(verifiedReport?.nearVerifiedCount) },
      ],
    })
  }

  const verifiedCount = num(meta.verified) + num(verifiedReport?.verifiedMetadataCount ?? backfill?.verifiedMetadataCount)
  const conclusionEn = verifiedCount > 0 || !backfill
    ? `This result means that ${nearVerified} candidates deserve priority manual review within the loaded ${recordsScanned}-record sample. However, verified metadata remains ${verifiedCount}, so this is not a final recommendation.`
    : "No verified candidates yet. V2.0-K has created evidence backfill records, but source/citation/license/DOI still require manual curation. The result is still for prioritizing verification only."
  const conclusionZh = verifiedCount > 0 || !backfill
    ? `当前结果仅说明：在已加载的 ${recordsScanned} 条小规模样本中，有 ${nearVerified} 条候选值得优先人工核验；但 verified metadata 仍为 ${verifiedCount}，因此不能作为最终推荐。`
    : "当前仍无经核验候选。V2.0-K 已建立证据回填记录，但 source/citation/license/DOI 仍需人工补全。筛选结果仍仅用于确定核验优先级。"

  return {
    finalStatus: deriveRunStatus(buildScreeningRunSteps(summary), summary),
    groups,
    conclusionEn,
    conclusionZh,
    notFinalRecommendation: true,
  }
}

// Summary-driven next actions. Prefers the V2.0-K evidence backfill summary when
// present, otherwise falls back to the V2.0-I curation transition counts.
export function buildScreeningNextActions(summary = {}) {
  const meta = summary.metadata || {}
  const evidence = summary.mechanismEvidenceSummary || {}
  const transition = summary.metadataTransitionSummary || {}
  const backfill = summary.evidenceBackfillSummary || null
  const verifiedReport = summary.verifiedCandidateReportSummary || null
  const nearVerified = num(summary.nearVerifiedCount ?? transition.nearVerifiedBeforeCuration)
  const metadataOnlyOverlap = ablationOverlap(summary, "metadata_gate_only")
  const sourceConfirmed = backfill ? num(backfill.sourceStatusCounts?.confirmed) : num(transition.sourceConfirmed)
  const citationReady = backfill ? num(backfill.citationStatusCounts?.ready) : num(transition.citationReady)
  const licenseConfirmed = backfill ? num(backfill.licenseStatusCounts?.confirmed) : num(transition.licenseConfirmed)
  const verifiedCount = num(verifiedReport?.verifiedMetadataCount ?? backfill?.verifiedMetadataCount ?? meta.verified)
  const provenanceIncomplete = backfill ? num(backfill.descriptorProvenanceStatusCounts?.partial) + num(backfill.descriptorProvenanceStatusCounts?.incomplete) : 0
  const actions = []

  if (verifiedCount === 0) {
    actions.push({
      id: "curate_near_verified", priority: "high", tone: "warn",
      en: `Prioritize source/citation/license curation for the ${nearVerified} near-verified candidates to produce the first verified_metadata.`,
      zh: `优先补充 ${nearVerified} 条 near_verified 候选的 source/citation/license，目标是生成第一批 verified_metadata。`,
    })
    actions.push({
      id: "first_verified_loop", priority: "high", tone: "warn",
      en: "Complete a full evidence loop (source + citation + license + provenance) for 3-5 candidates to reach the first verified_metadata.",
      zh: "先为 3-5 条候选完成完整证据闭环（source + citation + license + provenance），争取第一批 verified_metadata。",
    })
  }
  if (sourceConfirmed === 0) {
    actions.push({
      id: "confirm_source", priority: "high", tone: "warn",
      en: "Confirm source links for the high-priority queue first.",
      zh: "先确认 high priority 队列中的来源链接。",
    })
  }
  if (citationReady === 0) {
    actions.push({
      id: "confirm_citation", priority: "medium", tone: "proxy",
      en: "Attach citations for the high-priority candidates.",
      zh: "为 high priority 候选补充 citation。",
    })
  }
  if (licenseConfirmed === 0) {
    actions.push({
      id: "confirm_license", priority: "medium", tone: "proxy",
      en: "Confirm license terms for the curated candidates.",
      zh: "确认已整理候选的 license。",
    })
  }
  if (provenanceIncomplete > 0) {
    actions.push({
      id: "backfill_provenance", priority: "medium", tone: "proxy",
      en: `Backfill descriptor provenance for the ${provenanceIncomplete} records with incomplete provenance.`,
      zh: `为 ${provenanceIncomplete} 条 descriptor provenance 不完整的记录补全溯源。`,
    })
  }
  if (num(evidence.literature_supported) === 0) {
    actions.push({
      id: "backfill_literature", priority: "medium", tone: "proxy",
      en: "Backfill literature evidence for mechanism proxies; otherwise they remain weak proxies.",
      zh: "为机制代理补充文献证据，否则只能保持 weak proxy。",
    })
  }
  if (metadataOnlyOverlap !== null && metadataOnlyOverlap <= 0.3) {
    actions.push({
      id: "metadata_first", priority: "medium", tone: "info",
      en: "Metadata gate strongly affects ranking; source evidence should be handled first.",
      zh: "metadata gate 对候选排序影响很大，需要优先处理来源证据。",
    })
  }
  if (num(evidence.weak_proxy) > num(evidence.descriptor_inferred)) {
    actions.push({
      id: "weak_proxy_caution", priority: "low", tone: "warn",
      en: "Many proxies remain weak; mechanism conclusions should not be overinterpreted.",
      zh: "弱代理数量较多，不应过度解释机制结论。",
    })
  }

  return { actions, notFinalRecommendation: true }
}
