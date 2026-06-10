// @ts-nocheck
// V2.0-G Algorithm Improvement Trace.
//
// Shows how a sample moves from raw records to an auditable preview output, through
// the metadata gate, descriptor completeness, the descriptor redundancy gate, the
// mechanism proxy layer, and a sensitivity/stability audit. Method analogy only:
// inspired by the multi-stage feature engineering in Han et al., Nature
// Communications 2024 (10.1038/s41467-024-52550-9). It does NOT report R^2 / MAE /
// RMSE, does NOT claim a trained / black-box model, and the output is never a final
// recommendation.
import { summarizeMetadataVerification } from "./metadataVerification.js"
import { descriptorCompletenessPercent } from "./databaseIndexFormatters.js"
import { buildDescriptorRedundancySummary, DEFAULT_DESCRIPTOR_KEYS } from "./descriptorRedundancyGate.js"
import { summarizeMechanismProxyAvailability } from "../organicAcid/mechanismProxyMapping.js"

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
  const sensitivity = options.sensitivity || null

  const stages = [
    {
      id: "raw_records",
      label: "Raw records",
      labelZh: "原始记录",
      inputCount: rows.length,
      outputCount: rows.length,
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
      metrics: {
        verified: metadata.verified_metadata,
        partial: metadata.partial_metadata,
        previewOnly: metadata.preview_only,
        blocked: metadata.blocked,
      },
      boundary: "Candidates missing key metadata stay preview only / blocked.",
      boundaryZh: "缺关键 metadata 的候选停留在仅限预览 / 暂不可用。",
    },
    {
      id: "descriptor_completeness",
      label: "Descriptor completeness",
      labelZh: "描述符完整度",
      inputCount: rows.length,
      outputCount: descriptor.complete + descriptor.partial,
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
      metrics: {
        lowVarianceDescriptors: redundancy.lowVarianceCount,
        redundantPairs: redundancy.redundantPairCount,
        insufficientDataDescriptors: redundancy.insufficientDataCount,
      },
      boundary: "Redundant descriptors are penalized / reviewed, never deleted; OACS/DMRS formulas are unchanged.",
      boundaryZh: "冗余描述符被惩罚 / 复核，绝不删除；OACS/DMRS 公式不变。",
    },
    {
      id: "mechanism_proxy",
      label: "Mechanism proxy mapping",
      labelZh: "机制代理映射",
      inputCount: rows.length,
      outputCount: rows.length,
      metrics: {
        availableByProxy: mechanism.availableByProxy,
        proxyKeys: mechanism.proxyKeys,
      },
      boundary: "Rule-based mechanism hypotheses only; not DFT or experimental proof.",
      boundaryZh: "仅规则型机制假设；不是 DFT 或实验证据。",
    },
    {
      id: "sensitivity_audit",
      label: "Sensitivity / stability audit",
      labelZh: "敏感性 / 稳定性审计",
      inputCount: rows.length,
      outputCount: sensitivity ? (sensitivity.auditedCount ?? rows.length) : 0,
      metrics: sensitivity || { status: "pending" },
      boundary: sensitivity ? "Reuses the existing sensitivity audit." : "Pending: no sensitivity data for this sample yet.",
      boundaryZh: sensitivity ? "复用现有敏感性审计。" : "待定：该样本暂无敏感性数据。",
    },
    {
      id: "preview_output",
      label: "Preview output",
      labelZh: "预览输出",
      inputCount: rows.length,
      outputCount: topNCount,
      metrics: { topNPreview: topNCount, notFinalRecommendation: true },
      boundary: "Top-N preview only; not a final verified recommendation.",
      boundaryZh: "仅 Top-N 预览；不是最终验证推荐。",
    },
  ]

  return {
    createdAt: new Date().toISOString(),
    stageCount: stages.length,
    stages,
    inspiration: "Multi-stage feature engineering analogy from Han et al. 2024 (10.1038/s41467-024-52550-9); no model training and no model-accuracy metrics reported.",
    inspirationZh: "多阶段特征工程类比自 Han et al. 2024（10.1038/s41467-024-52550-9）；不训练模型，也不报告模型精度指标。",
    boundary: "This trace shows how samples move from raw records into an auditable preview. It does not represent a trained predictive model.",
    boundaryZh: "该链路展示样本如何从原始记录进入可审计预览，不代表已经训练预测模型。",
    notFinalRecommendation: true,
  }
}
