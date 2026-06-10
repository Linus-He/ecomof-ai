// @ts-nocheck
// V2.0-H Algorithm Improvement Trace.
//
// Shows how a sample moves from raw records to an auditable validation plan, through
// the metadata gate, a manual-verification queue, descriptor completeness, the
// descriptor redundancy gate, the mechanism proxy layer + evidence backfill, a
// sensitivity audit, a feature ablation audit, and a candidate validation roadmap.
// Method analogy only: the screen -> mechanism-explain -> validate loop is inspired
// by Han et al., Nature Communications 2024 (10.1038/s41467-024-52550-9). It does
// NOT report model-precision metrics, does NOT claim a trained / black-box model, and
// the output is never a final recommendation.
import { summarizeMetadataVerification } from "./metadataVerification.js"
import { descriptorCompletenessPercent } from "./databaseIndexFormatters.js"
import { buildDescriptorRedundancySummary, DEFAULT_DESCRIPTOR_KEYS } from "./descriptorRedundancyGate.js"
import { summarizeMechanismProxyAvailability, summarizeMechanismEvidence } from "../organicAcid/mechanismProxyMapping.js"
import { buildSensitivityAuditSummary } from "./sensitivityAudit.js"
import { buildFeatureAblationAudit } from "./featureAblationAudit.js"
import { buildValidationRoadmapForRecords } from "./candidateValidationRoadmap.js"

function descriptorCompletenessCounts(records = []) {
  const counts = { complete: 0, partial: 0, missingCritical: 0 }
  for (const record of records) {
    const percent = descriptorCompletenessPercent(record)
    if (percent >= 80) counts.complete += 1
    else if (percent >= 40) counts.partial += 1
    else counts.missingCritical += 1
  }
  return counts
}

export function buildAlgorithmImprovementTrace(records = [], options = {}) {
  const rows = Array.isArray(records) ? records : []
  const descriptorKeys = options.descriptorKeys || DEFAULT_DESCRIPTOR_KEYS
  const topNCount = Number.isFinite(Number(options.topNCount)) ? Number(options.topNCount) : Math.min(rows.length, 10)

  const metadata = summarizeMetadataVerification(rows)
  const descriptor = descriptorCompletenessCounts(rows)
  const redundancy = buildDescriptorRedundancySummary(rows, descriptorKeys, options.redundancyOptions)
  const mechanism = summarizeMechanismProxyAvailability(rows)
  const mechanismEvidence = options.mechanismEvidence || summarizeMechanismEvidence(rows)
  const queue = options.verificationQueueSummary || { queueSize: metadata.nearVerified, manualReviewRequired: metadata.nearVerified }
  const curation = options.curationSummary || null
  const curationQueueSize = curation?.queueSize ?? (queue.queueSize ?? metadata.nearVerified)
  const sourceConfirmedCount = curation
    ? curationQueueSize - ((curation.statusCounts?.needs_source_review || 0) + (curation.statusCounts?.curation_blocked || 0))
    : 0
  const sensitivity = rows.length ? (options.sensitivity || buildSensitivityAuditSummary(rows, options.sensitivityOptions)) : null
  const ablation = rows.length ? (options.ablation || buildFeatureAblationAudit(rows)) : null
  const roadmap = rows.length ? (options.validationRoadmap || buildValidationRoadmapForRecords(rows, { topN: options.roadmapTopN || 12 })) : null

  const stages = [
    {
      id: "raw_records",
      label: "Raw records",
      labelZh: "原始记录",
      inputCount: rows.length,
      outputCount: rows.length,
      status: "loaded",
      metrics: { recordsLoaded: rows.length },
      boundary: "Loaded from a bounded local sample, not the full database.",
      boundaryZh: "来自有界的本地样本，不是全量数据库。",
    },
    {
      id: "metadata_gate",
      label: "Metadata gate",
      labelZh: "metadata 门控",
      inputCount: rows.length,
      outputCount: metadata.verified_metadata + metadata.partial_metadata,
      status: "gated",
      metrics: { verified: metadata.verified_metadata, partial: metadata.partial_metadata, previewOnly: metadata.preview_only, blocked: metadata.blocked, nearVerified: metadata.nearVerified },
      boundary: "Candidates missing key metadata stay preview only / blocked.",
      boundaryZh: "缺关键 metadata 的候选停留在仅限预览 / 暂不可用。",
    },
    {
      id: "verification_queue",
      label: "Verification queue",
      labelZh: "人工核验队列",
      inputCount: metadata.nearVerified + metadata.partial_metadata,
      outputCount: queue.queueSize ?? metadata.nearVerified,
      status: "queued",
      metrics: { queueSize: queue.queueSize ?? metadata.nearVerified, manualReviewRequired: queue.manualReviewRequired ?? queue.queueSize ?? metadata.nearVerified },
      boundary: "Manual-review queue; no DOI/license is fabricated and no candidate is auto-verified.",
      boundaryZh: "人工核验队列；不伪造 DOI/license，也不自动核验任何候选。",
    },
    {
      id: "manual_metadata_curation",
      label: "Manual metadata curation",
      labelZh: "人工 metadata 整理",
      inputCount: curationQueueSize,
      outputCount: curationQueueSize,
      status: "curation tracking",
      metrics: curation ? { statusCounts: curation.statusCounts, upgradeReadiness: curation.upgradeReadiness } : { status: "pending" },
      boundary: "Curation progress tracking only; source_confirmed / citation_ready are not verified_metadata and nothing is fabricated.",
      boundaryZh: "仅追踪整理进度；source_confirmed / citation_ready 不等于 verified_metadata，也不伪造任何字段。",
    },
    {
      id: "source_link_enrichment",
      label: "Source-link enrichment",
      labelZh: "来源链接补全",
      inputCount: curationQueueSize,
      outputCount: sourceConfirmedCount,
      status: sourceConfirmedCount > 0 ? "enriched" : "pending",
      metrics: { sourceConfirmed: sourceConfirmedCount, pending: curationQueueSize - sourceConfirmedCount },
      boundary: "Source links stay pending until manually confirmed; missing DOI/source is never fabricated.",
      boundaryZh: "来源链接在人工确认前保持待补；缺失的 DOI/来源绝不伪造。",
    },
    {
      id: "descriptor_completeness",
      label: "Descriptor completeness",
      labelZh: "描述符完整度",
      inputCount: rows.length,
      outputCount: descriptor.complete + descriptor.partial,
      status: "checked",
      metrics: descriptor,
      boundary: "Records without critical descriptors cannot be scored.",
      boundaryZh: "缺少关键描述符的记录无法评分。",
    },
    {
      id: "redundancy_gate",
      label: "Redundancy gate",
      labelZh: "冗余门控",
      inputCount: descriptorKeys.length,
      outputCount: descriptorKeys.length - redundancy.redundantPairCount,
      status: "audited",
      metrics: { lowVarianceDescriptors: redundancy.lowVarianceCount, redundantPairs: redundancy.redundantPairCount, insufficientDataDescriptors: redundancy.insufficientDataCount },
      boundary: "Redundant descriptors are penalized / reviewed, never deleted; OACS/DMRS formulas are unchanged.",
      boundaryZh: "冗余描述符被惩罚 / 复核，绝不删除；OACS/DMRS 公式不变。",
    },
    {
      id: "mechanism_proxy",
      label: "Mechanism proxy mapping",
      labelZh: "机制代理映射",
      inputCount: rows.length,
      outputCount: rows.length,
      status: "mapped",
      metrics: { availableByProxy: mechanism.availableByProxy, proxyKeys: mechanism.proxyKeys },
      boundary: "Rule-based mechanism hypotheses only; not DFT or experimental proof.",
      boundaryZh: "仅规则型机制假设；不是 DFT 或实验证据。",
    },
    {
      id: "mechanism_evidence_backfill",
      label: "Mechanism evidence backfill",
      labelZh: "机制证据回填",
      inputCount: rows.length,
      outputCount: rows.length,
      status: "classified",
      metrics: mechanismEvidence.statusCounts,
      boundary: "Each proxy is labeled literature_supported / descriptor_inferred / weak_proxy / insufficient_evidence; still not DFT or experiment.",
      boundaryZh: "每个代理标注 文献支持 / 描述符推断 / 弱代理 / 证据不足；仍不是 DFT 或实验。",
    },
    {
      id: "sensitivity_audit",
      label: "Sensitivity / stability audit",
      labelZh: "敏感性 / 稳定性审计",
      inputCount: rows.length,
      outputCount: sensitivity ? sensitivity.auditRuns : 0,
      status: sensitivity ? "audited" : "pending",
      metrics: sensitivity ? { top5Stability: sensitivity.top5Stability, top10Stability: sensitivity.top10Stability, unstableCandidateCount: sensitivity.unstableCandidateCount, sensitiveDescriptors: sensitivity.sensitiveDescriptors } : { status: "pending" },
      boundary: "Stability audit only; reports stability, not predictive precision.",
      boundaryZh: "仅稳定性审计；报告稳定性，不是精度。",
    },
    {
      id: "feature_ablation_audit",
      label: "Feature ablation audit",
      labelZh: "特征消融审计",
      inputCount: descriptorKeys.length,
      outputCount: ablation ? ablation.variants.length : 0,
      status: ablation ? "audited" : "pending",
      metrics: ablation ? { variants: ablation.variants.map(v => ({ id: v.id, topNOverlapWithBaseline: v.topNOverlapWithBaseline })) } : { status: "pending" },
      boundary: "Ablation audit only; no descriptor field is deleted and no variant is claimed best.",
      boundaryZh: "仅消融审计；不删除描述符字段，也不声称某组最好。",
    },
    {
      id: "candidate_validation_roadmap",
      label: "Candidate validation roadmap",
      labelZh: "候选验证路线",
      inputCount: rows.length,
      outputCount: roadmap ? roadmap.candidateCount : 0,
      status: roadmap ? "planned" : "pending",
      metrics: roadmap ? roadmap.priorityCounts : { status: "pending" },
      boundary: "Validation directions only; not a guarantee of success and not a final recommendation.",
      boundaryZh: "仅验证方向；不保证成功，也不是最终推荐。",
    },
    {
      id: "preview_output",
      label: "Preview output",
      labelZh: "预览输出",
      inputCount: rows.length,
      outputCount: topNCount,
      status: "preview",
      metrics: { topNPreview: topNCount, notFinalRecommendation: true },
      boundary: "Top-N preview only; not a final verified recommendation.",
      boundaryZh: "仅 Top-N 预览；不是最终验证推荐。",
    },
  ]

  return {
    createdAt: new Date().toISOString(),
    stageCount: stages.length,
    stages,
    inspiration: "Screen -> mechanism-explain -> validate loop analogy from Han et al. 2024 (10.1038/s41467-024-52550-9); no model training and no model-precision metrics reported.",
    inspirationZh: "筛选 -> 机制解释 -> 验证 闭环类比自 Han et al. 2024（10.1038/s41467-024-52550-9）；不训练模型，也不报告模型精度指标。",
    boundary: "This trace shows how samples move from raw records into an auditable validation plan. It does not represent a trained predictive model.",
    boundaryZh: "该链路展示样本如何从原始记录进入可审计验证计划，不代表已经训练预测模型。",
    notFinalRecommendation: true,
  }
}
