// @ts-nocheck
import { RUN_TRACE_SCHEMA_VERSION } from "../../schemas/organicAcidTraceSchema"
import { normalizeTopCandidates, safeNumber, safeText, summarizeDatabaseOverview } from "./databaseIndexFormatters"

const TRACE_BOUNDARY = {
  id: "database-index-preview-boundary",
  label: "Index-level trace boundary",
  labelZh: "索引层追踪边界",
  detail: "Large-scale trace is summarized at index level to keep the audit readable.",
  detailZh: "大规模数据追踪在索引层进行摘要，避免浏览器端 trace 爆炸。",
}

export function buildDatabaseIndexRunSteps(overview = {}) {
  const summary = summarizeDatabaseOverview(overview)
  const topCandidates = normalizeTopCandidates(overview.topCandidates)
  return [
    {
      id: "load-database-manifest",
      step: 1,
      title: "Load database manifest",
      titleZh: "加载数据库 manifest",
      status: "completed",
      inputCount: 1,
      outputCount: overview.manifest?.datasetMode ? 1 : 0,
      decision: "Manifest loaded for the real CoRE MOF 2024 CR record index.",
      decisionZh: "已加载真实 CoRE MOF 2024 CR 记录索引 manifest。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "load-index-summaries",
      step: 2,
      title: "Load index summaries",
      titleZh: "加载索引摘要",
      status: "completed",
      inputCount: 2,
      outputCount: summary.coreRecords + summary.qmofRecords,
      decision: `${summary.coreRecords} real CoRE 2024 CR records summarized.`,
      decisionZh: `已摘要 ${summary.coreRecords} 条真实 CoRE 2024 CR 记录。`,
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "load-descriptor-provenance-coverage",
      step: 3,
      title: "Load descriptor/provenance coverage",
      titleZh: "加载描述符与溯源覆盖率",
      status: "completed",
      inputCount: summary.coreRecords,
      outputCount: summary.descriptorCoverage.length,
      decision: "Coverage summaries loaded; missing DOI remains evidence pending.",
      decisionZh: "已加载覆盖率摘要；DOI 缺失仍为证据待核。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "load-structural-review-sample",
      step: 4,
      title: "Load structural-review sample",
      titleZh: "加载结构审阅样本",
      status: "completed",
      inputCount: summary.readyForScoring,
      outputCount: topCandidates.length,
      decision: "The deterministic review sample represents structural-record completeness, not catalytic performance.",
      decisionZh: "确定性审阅样本代表结构记录完整度，不代表催化性能。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "select-review-scope",
      step: 5,
      title: "Select structural-review scope",
      titleZh: "选择结构审阅范围",
      status: "completed",
      inputCount: topCandidates.length,
      outputCount: topCandidates.length,
      decision: "Trace records the full source manifest plus the currently expanded structural-review scope.",
      decisionZh: "算法追踪记录全量来源清单与当前展开的结构审阅范围。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "build-index-level-trace",
      step: 6,
      title: "Build index-level trace",
      titleZh: "构建索引层 trace",
      status: "completed",
      inputCount: topCandidates.length,
      outputCount: 1,
      decision: "All CoRE CR rows are indexed, while raw CIFs and details load only when bundled or requested.",
      decisionZh: "全部 CoRE CR 记录已进入索引；原始 CIF 与详情仅在已内置或用户请求时加载。",
      linkedSectionId: "organic-acid-final-trace-workbench",
    },
    {
      id: "open-detail-on-demand-view",
      step: 7,
      title: "Open detail-on-demand view",
      titleZh: "打开按需详情视图",
      status: "completed",
      inputCount: topCandidates.filter(row => row.detailRef).length,
      outputCount: 0,
      decision: "Detail records load only after user selection.",
      decisionZh: "详情记录仅在用户选择后加载。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
  ]
}

function buildStepTraceRecords(steps = []) {
  return steps.map(step => ({
    id: step.id,
    step: step.step,
    title: step.title,
    titleZh: step.titleZh,
    status: step.status,
    input: { count: safeNumber(step.inputCount), label: "index records", labelZh: "索引记录" },
    rule: {
      summary: safeText(step.decision),
      summaryZh: safeText(step.decisionZh || step.decision),
    },
    formula: {
      summary: "Index-level summary trace; no full OACS/DMRS database scoring in browser.",
      summaryZh: "索引层摘要追踪；浏览器不执行全量 OACS/DMRS 数据库评分。",
    },
      output: {
      count: safeNumber(step.outputCount),
      decision: safeText(step.decision),
      decisionZh: safeText(step.decisionZh || step.decision),
    },
    warnings: step.id === "build-index-level-trace"
      ? ["Large-scale trace is summarized at index level to keep the audit readable."]
      : [],
    warningsZh: step.id === "build-index-level-trace"
      ? ["大规模数据追踪在索引层进行摘要，避免浏览器端 trace 爆炸。"]
      : [],
    blockedRecords: [],
    evidenceIds: [],
    linkedSectionId: step.linkedSectionId || "organic-acid-database-index-workbench",
  }))
}

export function buildDatabaseIndexRunResultSummary(overview = {}) {
  const summary = summarizeDatabaseOverview(overview)
  return {
    dataMode: "database_index_preview",
    datasetMode: summary.datasetMode,
    coreRecords: summary.coreRecords,
    qmofRecords: summary.qmofRecords,
    totalRecords: summary.coreRecords + summary.qmofRecords,
    topCandidateCount: summary.topCandidateCount,
    readyForScoring: summary.readyForScoring,
    needsReview: summary.needsReview,
    rejected: summary.rejected,
    descriptorCoverage: summary.descriptorCoverage.length,
    doiCoveragePercent: summary.provenanceCoverage.doiCoveragePercent ?? 0,
    fieldSourceCoveragePercent: summary.provenanceCoverage.fieldSourceCoveragePercent ?? 0,
    evidenceBoundary: "The source-record index covers all 9,835 CoRE CR rows. This mode loads a structural review sample and does not run full catalytic scoring in the browser.",
    evidenceBoundaryZh: "来源记录索引覆盖全部 9,835 条 CoRE CR；该模式加载结构审阅样本，不在浏览器中运行全量催化评分。",
    traceBoundary: "Trace covers the full source manifest and current structural-review scope; raw details remain on demand.",
    traceBoundaryZh: "算法追踪覆盖全量来源清单与当前结构审阅范围；原始详情仍按需加载。",
  }
}

export function buildDatabaseIndexTrace(overview = {}, options = {}) {
  const summary = buildDatabaseIndexRunResultSummary(overview)
  const steps = buildDatabaseIndexRunSteps(overview)
  const topCandidates = normalizeTopCandidates(overview.topCandidates)
  const createdAt = options.createdAt || new Date().toISOString()
  const runId = options.runId || `OAFS-V2.0-D-database-index-preview-${createdAt.replace(/\D/g, "").slice(0, 14)}`

  return {
    schemaVersion: RUN_TRACE_SCHEMA_VERSION,
    runId,
    createdAt,
    dataMode: "database_index_preview",
    workflowVersion: "V2.0-D",
    status: "completed_with_warnings",
    inputSummary: {
      dataMode: "database_index_preview",
      selectedModules: options.selectedModules || [],
      frameworkCandidates: summary.coreRecords,
      metalCandidates: summary.qmofRecords,
      evidenceRecords: overview.manifest?.sourceDatabases?.reduce((sum, row) => sum + safeNumber(row.detailCount), 0) || 0,
      rulesVersion: "V2.0-D index preview",
    },
    outputSummary: {
      dataMode: "database_index_preview",
      selectedScaffold: "No final scaffold recommendation",
      oacs: "Pending",
      topDopants: [],
      moDmrs: "Pending",
      wDmrs: "Pending",
      moWGap: "Pending",
      blockedFrameworks: summary.needsReview + summary.rejected,
      readyForScoring: summary.readyForScoring,
      needsReview: summary.needsReview,
      rejected: summary.rejected,
      evidenceBoundary: summary.evidenceBoundary,
      datasetMode: summary.datasetMode,
      topCandidateCount: summary.topCandidateCount,
      traceBoundary: summary.traceBoundary,
    },
    steps: buildStepTraceRecords(steps),
    candidateDecisions: topCandidates.map(candidate => ({
      id: candidate.frameworkId,
      label: candidate.displayName,
      labelZh: candidate.displayName,
      candidateType: "framework",
      rank: candidate.rank,
      decision: "Real source record selected for structural review; no catalytic-performance conclusion is inferred.",
      decisionZh: "真实来源记录被选作结构审阅样本；不推断催化性能结论。",
      status: candidate.dataQualityStatus,
      score: candidate.descriptorCompletenessPercent ?? "Pending",
      keyInputs: ["structural_review_sample", "real_core_mof_cr_index"],
      ruleChecks: ["source record traceable", "detail-on-demand"],
      warnings: [candidate.evidenceBoundary],
      warningsZh: ["结构字段已进入真实来源索引；不等于水热稳定性或催化性能已获实验验证。"],
      evidenceIds: [],
      blockedReason: "catalytic_performance_not_inferred",
    })),
    formulaTraces: [],
    evidenceTraces: [],
    candidateFlow: steps.map(step => ({
      id: step.id,
      label: step.title,
      labelZh: step.titleZh,
      inputCount: safeNumber(step.inputCount),
      outputCount: safeNumber(step.outputCount),
      blockedCount: Math.max(0, safeNumber(step.inputCount) - safeNumber(step.outputCount)),
      status: step.status,
    })),
    warnings: [
      "The full 9,835-record source index does not by itself validate catalytic performance.",
      "Structural-review samples are not catalytic-performance rankings.",
      "Large-scale trace is summarized at index level to keep the audit readable.",
    ],
    warningsZh: [
      "9,835 条全量来源索引本身不能验证催化性能。",
      "结构审阅样本不是催化性能排名。",
      "大规模数据追踪在索引层进行摘要，避免浏览器端 trace 爆炸。",
    ],
    boundaries: [TRACE_BOUNDARY],
    legacyRecords: [],
    exportable: true,
  }
}
