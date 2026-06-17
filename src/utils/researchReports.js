// @ts-nocheck
import translationRules from "../i18n/translation_rules.json"

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

export function buildRunSnapshot({ summary = {}, versionData = {}, timestamp } = {}) {
  const now = isoTimestamp(timestamp)
  const currentVersion = versionData.currentVersion || versionData.overview?.currentVersion || "V2.4"
  return {
    runId: `research-report-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    databaseVersion: summary.version || versionData.overview?.sources?.databaseSize?.databaseVersion || "V2.2-Scalable-Database-Preview",
    methodVersion: currentVersion,
    validationVersion: `Verified Metadata Framework ${currentVersion}`,
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

export function generateResearchReport({
  type = "candidate",
  records = [],
  summary = {},
  versionData = {},
  timestamp,
  candidateId,
} = {}) {
  const rows = normalizeRecords(records)
  const selected = rows.find(row => row.candidateId === candidateId) || rows.find(row => row.verifiedMetadata) || rows[0] || {}
  const label = reportTypeLabel(type)
  const snapshot = buildRunSnapshot({ summary, versionData, timestamp })
  const citationPackage = buildCitationPackage({ records: rows, summary, limit: 10 })
  const fieldSources = buildFieldSourceRows(selected)
  const dataGapCount = summary.dataGapCount ?? summary.fieldMissingCount ?? fieldSources.filter(row => row.status === "missing").length
  const screeningPath = [
    "数据库预览",
    "字段级溯源",
    "CRITIC权重",
    "证据状态",
    "数据缺口",
    "排序解释",
    "验证状态",
  ]
  const sections = [
    { title: "研究目标", body: `${label.zh}用于透明记录 ${candidateName(selected)} 的筛选依据、字段来源、验证状态与局限性。` },
    { title: "数据库版本", body: snapshot.databaseVersion },
    { title: "筛选条件", body: "当前报告使用 V2.2 1000 条数据库预览记录、字段级溯源和已核验元数据门控。未接入外部实验标签。" },
    { title: "候选数量", body: `${snapshot.candidateCount} 个候选；已核验元数据 ${snapshot.verifiedMetadataCount} 个。` },
    { title: "筛选路径", body: screeningPath.join(" -> ") },
    { title: "CRITIC权重", body: CRITIC_WEIGHT_SUMMARY.map(row => `${row.zh} ${row.weight}`).join("；") },
    { title: "证据状态", body: `来源已确认 ${summary.sourceConfirmedCandidates ?? 0}；引文已就绪 ${summary.citationReadyCandidates ?? 0}；数据库预览，不是最终推荐。` },
    { title: "数据缺口", body: `${dataGapCount} 个数据缺口或待复核状态仍需人工审计。` },
    { title: "字段来源", body: fieldSources.map(row => `${row.field}: ${row.sourceDatabase} / ${row.status}`).join("；") },
    { title: "验证状态", body: `已核验元数据 ${snapshot.verifiedMetadataCount}；模型验证指标保持 pending，外部验证尚未完成。` },
    { title: "局限性", body: "本报告是研究展示与透明审计材料，不是 Verified Screening，不构成最终实验推荐。" },
  ]

  const markdown = [
    `# ${label.zh}`,
    "",
    `英文副标题：${label.en}`,
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
    requiredSections: translationRules.reportRequiredSections,
    markdown,
  }
}
