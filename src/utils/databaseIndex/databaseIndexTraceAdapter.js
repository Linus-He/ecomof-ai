// @ts-nocheck
import { RUN_TRACE_SCHEMA_VERSION } from "../../schemas/organicAcidTraceSchema"
import { normalizeTopCandidates, safeNumber, safeText, summarizeDatabaseOverview } from "./databaseIndexFormatters"

const TRACE_BOUNDARY = {
  id: "database-index-preview-boundary",
  label: "Index-level trace boundary",
  labelZh: "索引层追踪边界",
  detail: "Large-scale trace is summarized at index level to avoid browser-side trace explosion.",
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
      decision: "Manifest loaded for database index preview.",
      decisionZh: "已加载数据库索引预览 manifest。",
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
      decision: `${summary.coreRecords} CoRE-like and ${summary.qmofRecords} QMOF-like records summarized.`,
      decisionZh: `已摘要 ${summary.coreRecords} 条 CoRE-like 与 ${summary.qmofRecords} 条 QMOF-like 记录。`,
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
      id: "load-precomputed-top-candidates",
      step: 4,
      title: "Load precomputed top candidates",
      titleZh: "加载预计算 Top-N 候选",
      status: "completed",
      inputCount: summary.readyForScoring,
      outputCount: topCandidates.length,
      decision: "Top candidates are preview candidates, not final verified recommendations.",
      decisionZh: "Top candidates 为预览候选，不是最终验证推荐。",
      linkedSectionId: "organic-acid-database-index-workbench",
    },
    {
      id: "select-preview-subset",
      step: 5,
      title: "Select preview subset",
      titleZh: "选择预览子集",
      status: "completed",
      inputCount: topCandidates.length,
      outputCount: topCandidates.length,
      decision: "Trace is limited to the current preview subset, not full database.",
      decisionZh: "算法追踪仅覆盖当前预览子集，不覆盖全量数据库。",
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
      decision: "Full raw CoRE/QMOF databases are not loaded in the browser.",
      decisionZh: "浏览器不会加载完整 CoRE/QMOF 原始数据库。",
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
      ? ["Large-scale trace is summarized at index level to avoid browser-side trace explosion."]
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
    evidenceBoundary: "This mode loads manifest and precomputed Top-N preview only. It does not run full database scoring in the browser.",
    evidenceBoundaryZh: "该模式只加载 manifest 与预计算 Top-N 预览，不在浏览器中运行全量数据库评分。",
    traceBoundary: "Trace is limited to current preview subset, not full database.",
    traceBoundaryZh: "算法追踪仅覆盖当前预览子集，不覆盖全量数据库。",
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
      decision: "Preview candidate only; excluded from final recommendation until verified.",
      decisionZh: "仅为预览候选；验证前不进入最终推荐。",
      status: candidate.dataQualityStatus,
      score: candidate.oacsPreview ?? "Pending",
      keyInputs: ["precomputed_top_n", "database_index_preview"],
      ruleChecks: ["needs-review excluded", "detail-on-demand"],
      warnings: [candidate.evidenceBoundary],
      warningsZh: ["水热稳定性证据已进入预览索引；不是完整验证。"],
      evidenceIds: [],
      blockedReason: "not_final_verified_recommendation",
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
      "Database index preview is not full verified database screening.",
      "Top candidates are preview candidates, not final verified recommendations.",
      "Large-scale trace is summarized at index level to avoid browser-side trace explosion.",
    ],
    warningsZh: [
      "数据库索引预览不是经完整验证的全量数据库筛选。",
      "Top candidates 为预览候选，不是最终验证推荐。",
      "大规模数据追踪在索引层进行摘要，避免浏览器端 trace 爆炸。",
    ],
    boundaries: [TRACE_BOUNDARY],
    legacyRecords: [],
    exportable: true,
  }
}
