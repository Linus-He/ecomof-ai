// @ts-nocheck

export function safeText(value, fallback = "Pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  if (Array.isArray(value)) {
    const rendered = value.map(item => safeText(item, "")).filter(Boolean).join(", ")
    return rendered || fallback
  }
  if (typeof value === "object") return JSON.stringify(value)
  const rendered = String(value)
  if (!rendered || ["undefined", "null", "NaN"].includes(rendered)) return fallback
  return rendered
}

export function safeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function formatCount(value, fallback = "0") {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? String(numeric) : fallback
}

export function formatPercentValue(value, fallback = "Pending") {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const percent = numeric <= 1 ? numeric * 100 : numeric
  return `${Math.round(percent * 10) / 10}%`
}

export const DATABASE_INDEX_DESCRIPTOR_FILTERS = [
  { id: "surfaceArea", label: "surfaceArea" },
  { id: "poreSizeA", label: "poreSizeA" },
  { id: "poreVolume", label: "poreVolume" },
  { id: "bandGap", label: "bandGap" },
  { id: "waterStability", label: "waterStability" },
  { id: "thermalStability", label: "thermalStability" },
]

const METAL_OPTIONS = ["Al", "Zr", "Zn", "Cu", "Mo", "Fe"]

export function normalizeQualityStatus(value) {
  return safeText(value, "pending").toLowerCase().replace(/-/g, "_").replace(/\s+/g, "_")
}

export function qualityTone(value) {
  const status = normalizeQualityStatus(value)
  if (status.includes("ready")) return "pass"
  if (status.includes("reject")) return "fail"
  if (status.includes("review")) return "warn"
  return "proxy"
}

export function extractMetals(row = {}) {
  if (Array.isArray(row.metals) && row.metals.length) return row.metals.map(item => safeText(item, "")).filter(Boolean)
  const textValue = safeText([row.displayName, row.name, row.frameworkId, row.id].filter(Boolean).join(" "), "")
  const found = METAL_OPTIONS.filter(metal => new RegExp(`(^|[^A-Za-z])${metal}([^a-z]|$)`).test(textValue))
  return row.hasAlNode && !found.includes("Al") ? ["Al", ...found] : found
}

function nestedDescriptor(row = {}, key) {
  const descriptors = row.descriptors || {}
  if (key === "surfaceArea") return row.surfaceArea ?? descriptors.surfaceArea
  if (key === "poreSizeA") return row.poreSizeA ?? row.pldA ?? row.lcdA ?? descriptors.poreSizeA ?? descriptors.pldA ?? descriptors.lcdA
  if (key === "poreVolume") return row.poreVolume ?? descriptors.poreVolume
  if (key === "bandGap") return row.bandGap ?? descriptors.bandGap
  if (key === "waterStability") return row.waterStability?.status ?? row.waterStability?.label ?? row.waterStability ?? row.hydrothermalEvidenceStatus ?? descriptors.waterStability ?? descriptors.hydrothermalEvidenceStatus
  if (key === "thermalStability") return row.thermalStability ?? row.thermalStabilityC ?? descriptors.thermalStability ?? descriptors.thermalStabilityC
  return row[key] ?? descriptors[key]
}

export function descriptorValue(row = {}, key) {
  return nestedDescriptor(row, key)
}

export function hasDescriptor(row = {}, key) {
  const value = descriptorValue(row, key)
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

export function descriptorCompletenessPercent(row = {}) {
  const completeness = row.descriptorCompleteness || row.descriptorAvailability
  if (Number.isFinite(Number(completeness?.percent))) return safeNumber(completeness.percent)
  if (Number.isFinite(Number(row.descriptorCompletenessPercent))) return safeNumber(row.descriptorCompletenessPercent)
  const available = DATABASE_INDEX_DESCRIPTOR_FILTERS.filter(descriptor => hasDescriptor(row, descriptor.id)).length
  return Math.round((available / DATABASE_INDEX_DESCRIPTOR_FILTERS.length) * 1000) / 10
}

export function descriptorAvailabilityList(row = {}) {
  return DATABASE_INDEX_DESCRIPTOR_FILTERS.map(descriptor => ({
    ...descriptor,
    available: hasDescriptor(row, descriptor.id),
    value: descriptorValue(row, descriptor.id),
  }))
}

export function provenanceCompletenessPercent(row = {}) {
  if (Number.isFinite(Number(row.provenanceCompletenessPercent))) return safeNumber(row.provenanceCompletenessPercent)
  if (Number.isFinite(Number(row.provenanceCompleteness))) return safeNumber(row.provenanceCompleteness)
  const status = safeText(row.provenanceStatus, "").toLowerCase()
  if (status.includes("full") || status.includes("high")) return 90
  if (status.includes("partial") || status.includes("medium")) return 42
  if (status.includes("low") || status.includes("pending")) return 10
  const fields = [row.sourceDatabase, row.sourceRecordId, row.sourceDoi || row.doi, row.citation, row.license]
  const available = fields.filter(value => value !== null && value !== undefined && value !== "").length
  return Math.round((available / fields.length) * 1000) / 10
}

export function coverageBucket(row = {}) {
  const percent = provenanceCompletenessPercent(row)
  if (percent >= 70) return "high"
  if (percent >= 30) return "medium"
  return "low"
}

export function previewScore(row = {}) {
  const value = row.oacsPreview ?? row.previewScore ?? row.oacsScore ?? row.score
  return Number.isFinite(Number(value)) ? Number(value) : null
}

function sourceBucket(row = {}) {
  return safeText(row.sourceDatabase || (String(row.frameworkId || row.id || "").startsWith("QMOF") ? "QMOF" : String(row.frameworkId || row.id || "").startsWith("CORE") ? "CoRE MOF" : ""), "").toLowerCase()
}

export function matchesDatabaseIndexFilters(row = {}, filters = {}) {
  const source = filters.sourceDatabase || "all"
  if (source !== "all") {
    const bucket = sourceBucket(row)
    if (source === "core" && !bucket.includes("core")) return false
    if (source === "qmof" && !bucket.includes("qmof")) return false
  }

  const quality = filters.qualityStatus || "all"
  if (quality !== "all") {
    const status = normalizeQualityStatus(row.dataQualityStatus || row.qualityStatus)
    if (quality === "ready-for-scoring" && !status.includes("ready")) return false
    if (quality === "needs-review" && !status.includes("review")) return false
    if (quality === "rejected" && !status.includes("reject")) return false
  }

  const metal = filters.metal || "all"
  if (metal !== "all") {
    const metals = extractMetals(row)
    if (metal === "other") {
      if (!metals.length || metals.some(item => METAL_OPTIONS.includes(item))) return false
    } else if (!metals.includes(metal)) {
      return false
    }
  }

  const selectedDescriptors = Array.isArray(filters.descriptors) ? filters.descriptors : []
  if (selectedDescriptors.length && selectedDescriptors.some(descriptor => !hasDescriptor(row, descriptor))) return false

  const coverage = filters.provenanceCoverage || "all"
  if (coverage !== "all") {
    const bucket = coverageBucket(row)
    if (coverage === "high" && bucket !== "high") return false
    if (coverage === "medium" && bucket !== "medium") return false
    if (coverage === "low" && bucket !== "low") return false
  }

  return true
}

export function sortDatabaseIndexRecords(records = [], sortKey = "previewScore") {
  const qualityOrder = { ready_for_scoring: 0, needs_review: 1, rejected: 2 }
  const rows = Array.isArray(records) ? [...records] : []
  return rows.sort((a, b) => {
    if (sortKey === "descriptorCompleteness") return descriptorCompletenessPercent(b) - descriptorCompletenessPercent(a)
    if (sortKey === "provenanceCompleteness") return provenanceCompletenessPercent(b) - provenanceCompletenessPercent(a)
    if (sortKey === "qualityStatus") return (qualityOrder[normalizeQualityStatus(a.dataQualityStatus)] ?? 9) - (qualityOrder[normalizeQualityStatus(b.dataQualityStatus)] ?? 9)
    return safeNumber(previewScore(b), -1) - safeNumber(previewScore(a), -1)
  })
}

export function summarizeIndexPartRecords(records = []) {
  const rows = Array.isArray(records) ? records : []
  const ready = rows.filter(row => normalizeQualityStatus(row.dataQualityStatus).includes("ready")).length
  const needsReview = rows.filter(row => normalizeQualityStatus(row.dataQualityStatus).includes("review")).length
  const rejected = rows.filter(row => normalizeQualityStatus(row.dataQualityStatus).includes("reject")).length
  const descriptorPercent = rows.length ? rows.reduce((sum, row) => sum + descriptorCompletenessPercent(row), 0) / rows.length : 0
  const provenancePercent = rows.length ? rows.reduce((sum, row) => sum + provenanceCompletenessPercent(row), 0) / rows.length : 0
  return {
    recordCount: rows.length,
    ready,
    needsReview,
    rejected,
    descriptorPercent: Math.round(descriptorPercent * 10) / 10,
    provenancePercent: Math.round(provenancePercent * 10) / 10,
  }
}

export function normalizeComparableCandidate(row = {}) {
  const id = safeText(row.frameworkId || row.id || row.sourceRecordId, "candidate")
  const source = row.sourceDatabase || (sourceBucket(row).includes("qmof") ? "QMOF" : sourceBucket(row).includes("core") ? "CoRE MOF" : null)
  return {
    id,
    name: safeText(row.displayName || row.name || id, id),
    sourceDatabase: safeText(source, "Pending"),
    sourceRecordId: safeText(row.sourceRecordId || row.frameworkId || row.id, "Pending"),
    qualityStatus: safeText(row.dataQualityStatus || row.qualityStatus, "pending"),
    descriptorCompleteness: descriptorCompletenessPercent(row),
    provenanceCompleteness: provenanceCompletenessPercent(row),
    surfaceArea: descriptorValue(row, "surfaceArea"),
    poreSizeA: descriptorValue(row, "poreSizeA"),
    poreVolume: descriptorValue(row, "poreVolume"),
    bandGap: descriptorValue(row, "bandGap"),
    waterStability: descriptorValue(row, "waterStability"),
    organicAcidRelevance: organicAcidRelevanceSnapshot(row),
  }
}

export function organicAcidRelevanceSnapshot(row = {}, lang = "en") {
  const factors = []
  if (extractMetals(row).includes("Al") || row.hasAlNode) factors.push(lang === "zh" ? "Al 节点候选" : "Al node candidate")
  if (hasDescriptor(row, "poreSizeA")) factors.push(lang === "zh" ? "孔径描述符可用" : "pore descriptor available")
  if (hasDescriptor(row, "waterStability")) factors.push(lang === "zh" ? "水稳定性代理/证据可用" : "water-stability proxy/evidence available")
  if (normalizeQualityStatus(row.dataQualityStatus).includes("ready")) factors.push(lang === "zh" ? "可进入预览评分" : "ready for preview scoring")
  return factors.length ? factors.join("; ") : (lang === "zh" ? "证据待核验" : "evidence pending")
}

export function buildCandidateExplanation(row = {}) {
  const descriptorRows = descriptorAvailabilityList(row)
  const positiveFactors = [
    previewScore(row) !== null ? `preview score ${previewScore(row)}` : null,
    normalizeQualityStatus(row.dataQualityStatus).includes("ready") ? "quality gate: ready_for_scoring" : null,
    extractMetals(row).length ? `metal node: ${extractMetals(row).join(", ")}` : null,
    row.detailRef ? "detail record available on demand" : null,
    hasDescriptor(row, "waterStability") ? "water stability proxy/evidence indexed" : null,
  ].filter(Boolean)
  const missingFields = descriptorRows.filter(descriptor => !descriptor.available).map(descriptor => descriptor.label)
  return {
    rank: row.rank,
    previewScore: previewScore(row),
    positiveFactors,
    missingFields,
    provenanceCompleteness: provenanceCompletenessPercent(row),
    descriptorCompleteness: descriptorCompletenessPercent(row),
    descriptorAvailability: descriptorRows,
    qualityStatus: safeText(row.dataQualityStatus, "pending"),
  }
}

export function normalizeTopCandidates(topCandidatesFile = {}) {
  const rows = topCandidatesFile.topCandidates || topCandidatesFile.candidates || []
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const frameworkId = safeText(row.frameworkId || row.id, `candidate-${index + 1}`)
    const sourceDatabase = row.sourceDatabase || (frameworkId.startsWith("QMOF") ? "QMOF" : frameworkId.startsWith("CORE") ? "CoRE MOF" : null)
    return {
      ...row,
      rank: row.rank || index + 1,
      id: safeText(row.id || frameworkId, frameworkId),
      frameworkId,
      sourceDatabase,
      sourceRecordId: row.sourceRecordId || frameworkId,
      displayName: safeText(row.displayName || row.name, `Candidate ${index + 1}`),
      metals: extractMetals({ ...row, frameworkId }),
      oacsPreview: Number.isFinite(Number(row.oacsPreview)) ? Number(row.oacsPreview) : null,
      dataQualityStatus: safeText(row.dataQualityStatus, "pending"),
      evidenceBoundary: safeText(row.evidenceBoundary, "Evidence pending"),
      detailRef: row.detailRef || null,
      provenanceStatus: row.provenanceStatus || "partial",
      notFinalRecommendation: row.notFinalRecommendation !== false,
    }
  })
}

export function normalizeIndexParts(manifest = {}) {
  const core = manifest.indexParts?.coreMof || manifest.files?.coreMofIndexParts || []
  const qmof = manifest.indexParts?.qmof || manifest.files?.qmofIndexParts || []
  return [
    ...core.map((path, index) => ({ id: `core-${index + 1}`, label: `CoRE part ${index + 1}`, sourceDatabase: "CoRE MOF", path })),
    ...qmof.map((path, index) => ({ id: `qmof-${index + 1}`, label: `QMOF part ${index + 1}`, sourceDatabase: "QMOF", path })),
  ].filter(row => row.path)
}

export function descriptorRows(availability = {}) {
  const rows = availability.descriptorCoverage || availability.rows || []
  return (Array.isArray(rows) ? rows : []).map(row => ({
    descriptor: safeText(row.descriptor || row.field),
    available: safeNumber(row.available ?? row.count),
    percent: safeNumber(row.percent ?? row.coveragePercent),
    interpretation: safeText(row.interpretation || availability.interpretation, "Evidence pending"),
  }))
}

export function provenanceRows(coverage = {}) {
  return [
    ["sourceDatabase coverage", coverage.withSourceDatabase, coverage.totalRecords],
    ["sourceRecordId coverage", coverage.withSourceRecordId, coverage.totalRecords],
    ["sourceDoi coverage", coverage.withSourceDoi, coverage.totalRecords, coverage.doiCoveragePercent],
    ["citation coverage", coverage.withCitation, coverage.totalRecords],
    ["license coverage", coverage.withLicense, coverage.totalRecords],
    ["fieldSources coverage", null, null, coverage.fieldSourceCoveragePercent],
    ["evidenceIds coverage", null, null, coverage.evidenceIdsCoveragePercent],
  ].map(([label, count, total, percent]) => ({
    label,
    count: Number.isFinite(Number(count)) ? Number(count) : null,
    total: Number.isFinite(Number(total)) ? Number(total) : null,
    percent: Number.isFinite(Number(percent)) ? Number(percent) : (Number.isFinite(Number(count)) && Number.isFinite(Number(total)) && Number(total) ? Number(count) / Number(total) * 100 : null),
  }))
}

export function summarizeDatabaseOverview(overview = {}) {
  const core = overview.coreSummary || {}
  const qmof = overview.qmofSummary || {}
  const candidates = normalizeTopCandidates(overview.topCandidates)
  const sourceDatabases = overview.manifest?.sourceDatabases || []
  const detailCount = sourceDatabases.reduce((sum, row) => sum + safeNumber(row.detailCount), 0)
  return {
    datasetMode: safeText(overview.manifest?.datasetMode, "database_index_preview"),
    coreRecords: safeNumber(core.recordCount),
    qmofRecords: safeNumber(qmof.recordCount),
    alContaining: safeNumber(core.alContainingCount),
    readyForScoring: safeNumber(core.readyForScoring),
    needsReview: safeNumber(core.needsReview),
    rejected: safeNumber(core.rejected),
    topCandidateCount: candidates.length,
    detailCount,
    descriptorCoverage: overview.descriptorAvailability?.descriptorCoverage || [],
    provenanceCoverage: overview.provenanceCoverage || {},
  }
}
