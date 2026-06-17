// @ts-nocheck
import translationRules from "../i18n/translation_rules.json"
import { buildPriorityImpactSummary, resolvePerformancePriorityMode } from "./performancePriority.js"

export const REPORT_TYPES = [
  { id: "candidate", zh: "候选报告", en: "Candidate Report" },
  { id: "comparison", zh: "对比报告", en: "Comparison Report" },
  { id: "screening", zh: "筛选报告", en: "Screening Report" },
  { id: "validation", zh: "验证报告", en: "Validation Report" },
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

export function generateResearchReport({
  type = "candidate",
  records = [],
  summary = {},
  versionData = {},
  timestamp,
  candidateId,
  performancePriorityMode = "balanced",
} = {}) {
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
