// @ts-nocheck
import translationRules from "../i18n/translation_rules.json"
import { buildPriorityImpactSummary, resolvePerformancePriorityMode } from "./performancePriority.js"
import {
  BENCHMARK_ROADMAP_STEPS,
  DESCRIPTOR_IMPORTANCE_ROWS,
  buildBenchmarkReadiness,
  buildCandidateStabilityRows,
} from "./modelBenchmarkLab.js"

export const REPORT_TYPES = [
  { id: "candidate", zh: "候选报告", en: "Candidate Report" },
  { id: "comparison", zh: "对比报告", en: "Comparison Report" },
  { id: "screening", zh: "筛选报告", en: "Screening Report" },
  { id: "validation", zh: "验证报告", en: "Validation Report" },
  { id: "organic_acid", zh: "有机酸筛选报告", en: "Organic Acid Screening Report" },
]

export const CRITIC_WEIGHT_SUMMARY = [
  { key: "surfaceArea", zh: "比表面积", en: "Surface Area", weight: 0.22 },
  { key: "poreSizeA", zh: "孔径", en: "Pore Size", weight: 0.18 },
  { key: "poreVolume", zh: "孔体积", en: "Pore Volume", weight: 0.17 },
  { key: "density", zh: "密度", en: "Density", weight: 0.14 },
  { key: "voidFraction", zh: "空隙率", en: "Void Fraction", weight: 0.13 },
  { key: "bandGap", zh: "带隙", en: "Band Gap", weight: 0.16 },
]

const FIELD_KEYS = ["surfaceArea", "poreSizeA", "density", "bandGap", "poreVolume", "voidFraction"]

function isoTimestamp(timestamp) {
  if (timestamp) return new Date(timestamp).toISOString()
  return new Date().toISOString()
}

function textValue(value, fallback = "待补充") {
  if (value === undefined || value === null || value === "") return fallback
  return String(value)
}

function reportTypeLabel(type) {
  return REPORT_TYPES.find(item => item.id === type) || REPORT_TYPES[0]
}

function candidateName(record) {
  return record?.displayName || record?.rawName || record?.candidateId || "候选待选择"
}

function normalizeRecords(records = []) {
  return Array.isArray(records) ? records.filter(Boolean) : []
}

export function buildRunSnapshot({ summary = {}, versionData = {}, timestamp, performancePriorityMode = "balanced" } = {}) {
  const now = isoTimestamp(timestamp)
  const currentVersion = versionData.currentVersion || versionData.overview?.currentVersion || "V2.4"
  const priority = resolvePerformancePriorityMode(performancePriorityMode || summary.performancePriorityMode || "balanced")
  return {
    runId: `research-report-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    databaseVersion: summary.version || versionData.overview?.sources?.databaseSize?.databaseVersion || "V2.2-Scalable-Database-Preview",
    methodVersion: currentVersion,
    validationVersion: `Verified Metadata Framework ${currentVersion}`,
    performancePriorityMode: priority.id,
    performancePriorityModeLabel: priority.labelZh,
    timestamp: now,
    candidateCount: summary.totalCandidates ?? 0,
    verifiedMetadataCount: summary.verifiedMetadataCount ?? summary.verifiedMetadataCandidates ?? 0,
  }
}

export function buildFieldSourceRows(record = {}, fieldKeys = FIELD_KEYS) {
  return fieldKeys.map(field => {
    const source = record.fieldSources?.[field] || {}
    return {
      field,
      value: source.value ?? record[field] ?? "missing",
      status: source.status || source.fieldQualityStatus || "missing",
      sourceDatabase: source.sourceDatabase || record.sourceDatabase || "pending",
      sourceRecordId: source.sourceRecordId || record.sourceRecordId || "pending",
      sourceUrl: source.sourceUrl || record.sourceUrl || "pending",
      citation: source.citation || record.citation || "pending",
      license: source.license || record.license || "pending",
      scoringEligible: Boolean(source.scoringEligible),
      blocksVerifiedMetadata: source.blocksVerifiedMetadata !== false,
      notes: source.notes || source.missingReason || "",
    }
  })
}

export function buildCitationPackage({ records = [], summary = {}, limit = 12 } = {}) {
  const rows = normalizeRecords(records).slice(0, limit)
  const sourceMap = new Map()
  for (const record of rows) {
    const key = [record.sourceDatabase, record.sourceRecordId, record.sourceUrl, record.citation].join("|")
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        citationSource: record.citation || "pending",
        dataSource: record.sourceDatabase || "pending",
        sourceRecordId: record.sourceRecordId || "pending",
        sourceUrl: record.sourceUrl || "pending",
        license: record.license || "pending",
        citationStatus: record.citationReady ? "引文已就绪" : "pending",
        candidateCount: 0,
      })
    }
    sourceMap.get(key).candidateCount += 1
  }

  const fieldSources = rows.flatMap(record =>
    buildFieldSourceRows(record, ["surfaceArea", "poreSizeA", "density", "bandGap"]).map(row => ({
      candidateId: record.candidateId,
      displayName: candidateName(record),
      ...row,
    })),
  )

  return {
    title: "引用包",
    subtitle: "Citation Package",
    citationReadyCount: summary.citationReadyCandidates ?? summary.citationReadyCount ?? rows.filter(row => row.citationReady).length,
    sourceConfirmedCount: summary.sourceConfirmedCandidates ?? summary.sourceConfirmedCount ?? rows.filter(row => row.sourceConfirmed).length,
    entries: [...sourceMap.values()],
    fieldSources,
  }
}

function numericScore(record, fallback = 0) {
  const value = record.finalScore ?? record.score ?? record.D_expected ?? record.oacsPreview ?? record.oacs ?? record.surfaceArea
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function buildReportCharts({ records = [], summary = {}, priorityMode = "balanced" } = {}) {
  const rows = normalizeRecords(records)
  const priority = buildPriorityImpactSummary(priorityMode)
  const total = Number(summary.totalCandidates ?? rows.length) || rows.length || 1
  const verified = Number(summary.verifiedMetadataCount ?? summary.verifiedMetadataCandidates ?? 0) || 0
  const sourceConfirmed = Number(summary.sourceConfirmedCandidates ?? summary.sourceConfirmedCount ?? 0) || 0
  const citationReady = Number(summary.citationReadyCandidates ?? summary.citationReadyCount ?? 0) || 0
  const fieldCoverage = Number(summary.fieldProvenanceCoverage ?? 1)
  const dataGapCount = Number(summary.dataGapCount ?? summary.fieldMissingCount ?? 0) || 0
  const priorityRows = (priority.affectedDescriptors.length ? priority.affectedDescriptors : CRITIC_WEIGHT_SUMMARY.map(row => row.key)).slice(0, 6)
  return [
    {
      id: "candidate-ranking-chart",
      title: "候选排序图",
      subtitle: "Candidate Ranking Chart",
      xAxis: "候选",
      yAxis: "排序分",
      legend: "当前筛选分",
      rows: rows.slice(0, 8).map((record, index) => ({
        label: candidateName(record),
        value: Number(numericScore(record, 100 - index * 4).toFixed(2)),
      })),
    },
    {
      id: "data-quality-summary-chart",
      title: "数据质量摘要图",
      subtitle: "Data Quality Summary Chart",
      xAxis: "质量状态",
      yAxis: "候选数量",
      legend: "候选计数",
      rows: [
        { label: "已核验元数据", value: verified },
        { label: "来源已确认", value: sourceConfirmed },
        { label: "引文已就绪", value: citationReady },
        { label: "仍需复核", value: Math.max(0, total - verified) },
      ],
    },
    {
      id: "priority-impact-chart",
      title: "优先级影响图",
      subtitle: "Priority Impact Chart",
      xAxis: "受影响因子",
      yAxis: "相对影响",
      legend: priority.modeLabelZh,
      rows: priorityRows.map((key, index) => ({
        label: key,
        value: Number((1 - index * 0.08).toFixed(2)),
      })),
    },
    {
      id: "provenance-coverage-chart",
      title: "溯源覆盖图",
      subtitle: "Provenance Coverage Chart",
      xAxis: "溯源状态",
      yAxis: "比例",
      legend: "覆盖率",
      rows: [
        { label: "字段级溯源", value: Number.isFinite(fieldCoverage) ? Number(fieldCoverage.toFixed(2)) : 0 },
        { label: "来源确认率", value: Number((sourceConfirmed / total).toFixed(2)) },
        { label: "引文就绪率", value: Number((citationReady / total).toFixed(2)) },
      ],
    },
    {
      id: "validation-readiness-chart",
      title: "验证就绪度图",
      subtitle: "Validation Readiness Chart",
      xAxis: "验证状态",
      yAxis: "候选数量",
      legend: "候选计数",
      rows: [
        { label: "已核验", value: verified },
        { label: "近验证", value: Number(summary.nearVerifiedCount ?? summary.nearVerifiedCandidates ?? 0) || 0 },
        { label: "数据缺口", value: dataGapCount },
        { label: "待验证", value: Math.max(0, total - verified) },
      ],
    },
  ]
}

function buildOrganicAcidReport({ organicAcidResult = null, versionData = {}, timestamp, dataFoundation = null } = {}) {
  const algorithm = organicAcidResult?.organicAcidAlgorithm || organicAcidResult || {}
  const topCandidates = algorithm.topCandidates || algorithm.rankedCandidates?.slice(0, 5) || []
  const top = topCandidates[0] || {}
  const readiness = buildBenchmarkReadiness({
    summary: {
      totalCandidates: algorithm.scoringSummary?.candidateCount || algorithm.rankedCandidates?.length || 0,
      verifiedMetadataCount: 0,
      experimentalLabelCount: 0,
      fieldProvenanceCoverage: 1,
      dataQualityScore: 0.78,
    },
    algorithm,
  })
  const stabilityRows = buildCandidateStabilityRows(algorithm).slice(0, 5)
  const descriptorSummary = DESCRIPTOR_IMPORTANCE_ROWS
    .slice()
    .sort((a, b) => b.organicAcidRelevance - a.organicAcidRelevance)
    .slice(0, 6)
    .map(row => `${row.label}: ${row.category}, organicAcidRelevance=${row.organicAcidRelevance}`)
    .join("；")
  const snapshot = buildRunSnapshot({
    summary: {
      version: "organic_acid_algorithm_closure_v2_6",
      totalCandidates: algorithm.scoringSummary?.candidateCount || algorithm.rankedCandidates?.length || 0,
      verifiedMetadataCount: 0,
    },
    versionData,
    timestamp,
    performancePriorityMode: "balanced",
  })
  snapshot.methodVersion = "V2.7 Model Benchmark Lab + V2.6 Organic Acid Algorithm Closure"
  snapshot.validationVersion = "Benchmark Framework Ready; ML Accuracy / ROC-AUC pending until experimental labels exist"
  const candidateNames = topCandidates.map(row => `${row.rank || "-"} ${row.candidateName} (${row.recommendationClass})`).join("；") || "候选待生成"
  const labelCount = dataFoundation?.labelCount ?? 0
  const executiveSummary = `Organic Acid Screening Report：当前任务为 CO2 转化为甲酸 / formic acid priority。V3.1 在 V2.6 白盒多指标决策 + 证据修正 + 图论相关性 + 风险惩罚之上接入 Reaction Dataset、Gold v2、Label v2 与 Benchmark v2。当前 Label Count = ${labelCount}，但 Accuracy / ROC-AUC 均为 Pending，不能报告虚假 ML 指标。Top candidates 为 ${candidateNames}。该报告只给出算法建议，仍需实验验证。`
  const sections = [
    { title: "研究目标", body: "Primary target：CO2 转化为甲酸 / formic acid priority；secondary goals 包括抑制竞争路径、提高证据可信度、优先可验证候选、降低结构坍塌风险并保留字段级溯源。" },
    { title: "评分模式", body: `当前评分模式：${algorithm.scoringModeLabelZh || algorithm.scoringMode || "formic_acid_priority"}；目标函数为 pathwayFitScore、evidenceScore、graphRelevanceScore、structureSuitabilityScore、validationReadinessScore、dataQualityScore 减去 riskPenalty。` },
    { title: "Model Benchmark Readiness", body: `Benchmark Framework Ready；Machine Learning Ready = ${dataFoundation?.readiness?.benchmark || readiness.machineLearningReady}；Label Count = ${labelCount}；Benchmark Eligible = ${dataFoundation?.benchmarkEligibleCount ?? 0}；Validation Status = ${readiness.validationStatus}；main blocker = ${dataFoundation?.futureMetrics?.reasonZh || readiness.mainBlocker}。Accuracy / ROC-AUC 必须保持 Pending，因为 Experimental labels required / external validation required。` },
    ...(dataFoundation ? [
      { title: "Reaction Dataset Summary", body: `Reaction Count ${dataFoundation.reactionDatasetCount || 0}；Yield Coverage ${dataFoundation.reactionCoverage?.yield || 0}；Selectivity Coverage ${dataFoundation.reactionCoverage?.selectivity || 0}；Conversion Coverage ${dataFoundation.reactionCoverage?.conversion || 0}。反应数据层用于 Reaction Evidence Weight、Reaction Quality Weight、Comparability Weight 与 Label Confidence Weight。` },
      { title: "Benchmark Progress", body: `Label Count ${dataFoundation.labelCount} / Target ${dataFoundation.targets?.labelCount || 30} / Gap ${dataFoundation.gaps?.labelCount || 0}；Benchmark Eligible ${dataFoundation.benchmarkEligibleCount} / Target ${dataFoundation.targets?.benchmarkEligible || 30} / Gap ${dataFoundation.gaps?.benchmarkEligible || 0}；External Test ${dataFoundation.externalTestCount || 0} / Target ${dataFoundation.targets?.externalTest || 30} / Gap ${dataFoundation.gaps?.externalTest || 0}。` },
    ] : []),
    { title: "Feature Importance Summary", body: `Descriptor ranking uses CRITIC importance, Evidence adjusted importance, Organic Acid relevance, and Data quality impact. Current high-relevance descriptors: ${descriptorSummary}。这些是解释性 descriptor importance，不是监督学习 feature importance。` },
    { title: "Top candidates", body: candidateNames },
    { title: "Top Candidate Review", body: topCandidates.map(row => `${row.candidateName}: finalScore=${row.finalScore}, recommendationClass=${row.recommendationClass}, why=${row.mainReasons?.[0] || "pending"}, risk=${row.mainRisks?.[0] || "pending"}, next=${row.nextExperiment}`).join("；") || "候选待生成。" },
    { title: "Candidate Stability", body: stabilityRows.map(row => `${row.candidateName}: ${row.stability}, ranks=${Object.entries(row.ranks).map(([mode, rank]) => `${mode} #${rank}`).join("/")}`).join("；") || "Candidate stability 待生成。" },
    { title: "Score breakdown", body: top.scoreBreakdown ? `Top candidate ${top.candidateName} finalScore=${top.finalScore}；pathwayFitScore=${top.pathwayFitScore}；evidenceScore=${top.evidenceScore}；graphRelevanceScore=${top.graphRelevanceScore}；structureSuitabilityScore=${top.structureSuitabilityScore}；validationReadinessScore=${top.validationReadinessScore}；dataQualityScore=${top.dataQualityScore}；riskPenalty=${top.riskPenalty}。` : "Score breakdown 待生成。" },
    { title: "Decision trace", body: top.decisionTrace?.length ? top.decisionTrace.map(step => `${step.step}: ${step.output}`).join("；") : "Decision trace 待生成。" },
    { title: "Sanity check", body: algorithm.sanityCheck?.summaryZh || "算法合理性检查待生成。" },
    { title: "Sensitivity analysis", body: algorithm.sensitivitySummary?.explanationZh || "敏感性分析待生成。" },
    { title: "Data gaps", body: algorithm.dataGapSummary?.explanationZh || "数据缺口摘要待生成。" },
    { title: "Next experiments", body: topCandidates.map(row => `${row.candidateName}: ${row.nextExperiment}`).join("；") || "下一步实验待生成。" },
    { title: "Benchmark Roadmap", body: BENCHMARK_ROADMAP_STEPS.map(step => `${step.title}: ${step.status} - ${step.detail}`).join("；") },
    { title: "Known limitations", body: "当前不是黑盒 ML，也不是实验验证结论；它是 white-box MCDA + evidence adjustment + graph relevance + risk penalty。priority_validation 仅表示优先验证候选，仍需实验验证。" },
  ]
  const charts = [
    {
      id: "organic-acid-final-score-chart",
      title: "有机酸候选排序图",
      subtitle: "Organic Acid Candidate Ranking",
      xAxis: "候选",
      yAxis: "finalScore",
      legend: "V2.6 finalScore",
      rows: topCandidates.map(row => ({ label: row.candidateName, value: row.finalScore })),
    },
    {
      id: "organic-acid-risk-penalty-chart",
      title: "有机酸风险惩罚图",
      subtitle: "Organic Acid Risk Penalty",
      xAxis: "候选",
      yAxis: "riskPenalty",
      legend: "riskPenalty",
      rows: topCandidates.map(row => ({ label: row.candidateName, value: row.riskPenalty })),
    },
    {
      id: "organic-acid-future-accuracy-chart",
      title: "未来精度验证",
      subtitle: "Future Accuracy",
      xAxis: "模型",
      yAxis: "Accuracy",
      legend: "Pending because experimental labels required",
      rows: ["LR", "DT", "RF", "Evidence-CRITIC"].map(label => ({ label, value: "Pending" })),
    },
    {
      id: "organic-acid-future-roc-chart",
      title: "未来 ROC-AUC 验证",
      subtitle: "Future ROC-AUC",
      xAxis: "模型",
      yAxis: "ROC-AUC",
      legend: "Pending because external validation required",
      rows: ["LR", "DT", "RF", "Evidence-CRITIC"].map(label => ({ label, value: "Pending" })),
    },
  ]
  const markdown = [
    "# 有机酸筛选报告",
    "",
    executiveSummary,
    "",
    ...sections.flatMap(section => [`## ${section.title}`, section.body, ""]),
  ].join("\n")

  return {
    type: "organic_acid",
    title: "有机酸筛选报告",
    subtitle: "Organic Acid Screening Report",
    generatedAt: snapshot.timestamp,
    snapshot,
    candidate: {
      candidateId: top.candidateId || "pending",
      displayName: top.candidateName || "pending",
      verifiedMetadata: false,
      sourceConfirmed: false,
      citationReady: false,
    },
    sections,
    fieldSources: Object.entries(top.fieldSources || {}).slice(0, 12).map(([field, source]) => ({
      field,
      value: source.value ?? "pending",
      status: source.status || "pending",
      sourceDatabase: source.sourceDatabase || "Organic Acid Algorithm",
      sourceRecordId: source.sourceRecordId || "pending",
      sourceUrl: source.sourceUrl || "public/data/organic_acid_final_screening/al_mof_framework_candidates.json",
      citation: source.citation || "pending",
      license: source.license || "pending",
      scoringEligible: Boolean(source.scoringEligible),
      blocksVerifiedMetadata: source.status === "missing",
      notes: source.missingReason || source.note || "",
    })),
    citationPackage: {
      title: "引用包",
      subtitle: "Citation Package",
      citationReadyCount: 0,
      sourceConfirmedCount: 0,
      entries: [],
      fieldSources: [],
    },
    charts,
    executiveSummary,
    priorityMode: null,
    requiredSections: [
      "研究目标",
      "评分模式",
      "Model Benchmark Readiness",
      "Feature Importance Summary",
      "Top candidates",
      "Top Candidate Review",
      "Candidate Stability",
      "Score breakdown",
      "Decision trace",
      "Sanity check",
      "Sensitivity analysis",
      "Data gaps",
      "Next experiments",
      "Benchmark Roadmap",
      "Known limitations",
    ],
    markdown,
    organicAcidAlgorithm: algorithm,
  }
}

export function generateResearchReport({
  type = "candidate",
  records = [],
  summary = {},
  versionData = {},
  timestamp,
  candidateId,
  performancePriorityMode = "balanced",
  organicAcidResult = null,
  dataFoundation = null,
  dataAudit = null,
} = {}) {
  if (type === "organic_acid") {
    return buildOrganicAcidReport({ organicAcidResult, versionData, timestamp, dataFoundation })
  }
  const rows = normalizeRecords(records)
  const selected = rows.find(row => row.candidateId === candidateId) || rows.find(row => row.verifiedMetadata) || rows[0] || {}
  const label = reportTypeLabel(type)
  const priority = buildPriorityImpactSummary(performancePriorityMode || summary.performancePriorityMode || "balanced")
  const snapshot = buildRunSnapshot({ summary, versionData, timestamp, performancePriorityMode: priority.modeId })
  const citationPackage = buildCitationPackage({ records: rows, summary, limit: 10 })
  const fieldSources = buildFieldSourceRows(selected)
  const dataGapCount = summary.dataGapCount ?? summary.fieldMissingCount ?? fieldSources.filter(row => row.status === "missing").length
  const topRows = rows.slice(0, 3).map(candidateName).join("、") || candidateName(selected)
  const executiveSummary = `本次筛选基于 ${snapshot.databaseVersion} 的 ${snapshot.candidateCount} 条候选记录。当前处于数据库预览阶段，结果不构成最终推荐。系统采用“${priority.modeLabelZh}”模式，${priority.rankingImpactZh} 当前共有 ${snapshot.verifiedMetadataCount} 条候选达到已核验元数据条件，仍需进一步实验或外部证据验证。`
  const sections = [
    { title: "执行摘要", body: executiveSummary },
    { title: "研究问题", body: `${label.zh}回答的是：在当前数据库预览与证据边界下，哪些候选最值得进入下一轮人工复核或实验验证。` },
    { title: "筛选设置", body: `方法版本 ${snapshot.methodVersion}；数据库版本 ${snapshot.databaseVersion}；筛选优先级为“${priority.modeLabelZh}”。` },
    { title: "数据库快照", body: `${snapshot.candidateCount} 条候选；来源已确认 ${summary.sourceConfirmedCandidates ?? summary.sourceConfirmedCount ?? 0}；引文已就绪 ${summary.citationReadyCandidates ?? summary.citationReadyCount ?? 0}。` },
    { title: "筛选优先级", body: priority.summaryZh },
    { title: "优先候选摘要", body: `当前报告关注 ${candidateName(selected)}；Top candidates: ${topRows}。候选摘要仅表示研究优先级，不是最终材料推荐。` },
    { title: "排序解释", body: `排序综合描述符权重、证据状态、数据完整度与当前优先级。${priority.rankingImpactZh}` },
    { title: "证据与溯源", body: `字段来源示例：${fieldSources.slice(0, 4).map(row => `${row.field}: ${row.sourceDatabase} / ${row.status}`).join("；")}。` },
    { title: "数据缺口", body: `${dataGapCount} 个数据缺口或待复核状态仍需人工审计，缺口不会被当作零风险处理。` },
    { title: "验证就绪度", body: `已核验元数据 ${snapshot.verifiedMetadataCount}；模型验证指标保持 pending，外部验证尚未完成。` },
    { title: "已知局限", body: "本报告是研究展示与透明审计材料，不是 Verified Screening，不报告虚假模型精度，不构成最终实验推荐。" },
    { title: "下一步建议", body: "优先补齐 DOI、license、来源链接、关键字段溯源，并对优先候选进行目标场景验证。" },
  ]
  if (dataFoundation) {
    const distribution = dataFoundation.qualityDistribution || {}
    sections.splice(9, 0, {
      title: "数据来源与标准化",
      subtitle: "Data Source & Standardization",
      body: `数据集版本 ${dataFoundation.version || "V3.1"}；数据来源登记 ${dataFoundation.sourceCount} 个；质量分层 Gold ${distribution.Gold || 0} / Silver ${distribution.Silver || 0} / Bronze ${distribution.Bronze || 0} / Rejected ${distribution.Rejected || 0}；字段级溯源覆盖率 ${Math.round((dataFoundation.provenanceCoverage || 0) * 100)}%；标准化规则统一温度 °C、压力 bar、比表面积 m²/g、孔体积 cm³/g、孔径 Å、产率 %、时间 h。Benchmark 就绪度 = ${dataFoundation.readiness?.benchmark}；Label 数量 = ${dataFoundation.labelCount}；Accuracy / ROC-AUC 继续 Pending。`,
    }, {
      title: "Reaction Dataset Summary",
      subtitle: "反应数据摘要",
      body: `Reaction Count ${dataFoundation.reactionDatasetCount || 0}；Yield Coverage ${dataFoundation.reactionCoverage?.yield || 0}；Selectivity Coverage ${dataFoundation.reactionCoverage?.selectivity || 0}；Conversion Coverage ${dataFoundation.reactionCoverage?.conversion || 0}；DOI Coverage ${dataFoundation.reactionCoverage?.doi || 0}。该层用于算法证据权重、可比性权重与研究报告，不把算法分数写入 ground truth。`,
    }, {
      title: "Benchmark Progress",
      subtitle: "基准数据进展",
      body: `Label Count ${dataFoundation.labelCount} / Target ${dataFoundation.targets?.labelCount || 30} / Gap ${dataFoundation.gaps?.labelCount || 0}；Benchmark Eligible ${dataFoundation.benchmarkEligibleCount} / Target ${dataFoundation.targets?.benchmarkEligible || 30} / Gap ${dataFoundation.gaps?.benchmarkEligible || 0}；External Test ${dataFoundation.externalTestCount || 0} / Target ${dataFoundation.targets?.externalTest || 30} / Gap ${dataFoundation.gaps?.externalTest || 0}。${dataFoundation.futureMetrics?.reasonZh || "Accuracy / ROC-AUC 仍需实验标签与外部验证后才能显示。"}`,
    })
  }
  if (dataAudit?.audits) {
    const a = dataAudit.audits
    const report = dataAudit.benchmarkReport || {}
    sections.push({
      title: "Benchmark Audit Summary",
      subtitle: "基准审计摘要",
      body: `Label Quality：experimental ${a.label.realExperimentalLabelCount} / dataset-derived ${a.label.datasetDerivedCount} / invalid ground truth ${a.label.invalidGroundTruthCount}。Benchmark Readiness：${report.overallStatus || "pending"}（confirmed eligible ${a.benchmarkEligibility.eligibleConfirmed}）。Leakage Status：${a.leakage.leakCount} leaks（severity ${a.leakage.leakSeverity}）。Gold Audit Pass Rate ${Math.round((a.gold.auditPassRate || 0) * 100)}%。Current Gap：${report.metricsAllowed ? "无，可合法显示 Accuracy / ROC-AUC" : "缺少真实实验标签，Accuracy / ROC-AUC 继续 Pending"}。`,
    })
  }
  const charts = buildReportCharts({ records: rows, summary, priorityMode: priority.modeId })

  const markdown = [
    `# ${label.zh}`,
    "",
    `英文副标题：${label.en}`,
    "",
    executiveSummary,
    "",
    ...sections.flatMap(section => [`## ${section.title}`, section.body, ""]),
    "## 运行快照",
    Object.entries(snapshot).map(([key, value]) => `- ${key}: ${value}`).join("\n"),
    "",
    "## 引用包",
    citationPackage.entries.map(entry => `- ${entry.dataSource}: ${entry.citationSource}`).join("\n"),
  ].join("\n")

  return {
    type,
    title: label.zh,
    subtitle: label.en,
    generatedAt: snapshot.timestamp,
    snapshot,
    candidate: {
      candidateId: selected.candidateId || "pending",
      displayName: candidateName(selected),
      verifiedMetadata: Boolean(selected.verifiedMetadata),
      sourceConfirmed: Boolean(selected.sourceConfirmed),
      citationReady: Boolean(selected.citationReady),
    },
    sections,
    fieldSources,
    citationPackage,
    charts,
    executiveSummary,
    priorityMode: priority,
    requiredSections: translationRules.reportRequiredSections,
    markdown,
  }
}
