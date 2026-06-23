import scoringSpec from "../../../public/data/organic_acid_scoring_spec_v1.json"

export const ORGANIC_ACID_SCORING_SPEC = scoringSpec

export function asArray(value) {
  return Array.isArray(value) ? value : []
}

export function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

export function roundScore(value, digits = ORGANIC_ACID_SCORING_SPEC.normalization?.roundDigits ?? 3) {
  const factor = 10 ** digits
  return Math.round(safeNumber(value, 0) * factor) / factor
}

export function clampScore(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, safeNumber(value, 0)))
}

export function median(values = []) {
  const rows = asArray(values).map(value => safeNumber(value, NaN)).filter(Number.isFinite).sort((a, b) => a - b)
  if (!rows.length) return null
  const middle = Math.floor(rows.length / 2)
  return rows.length % 2 ? rows[middle] : (rows[middle - 1] + rows[middle]) / 2
}

export function mean(values = []) {
  const rows = asArray(values).map(value => safeNumber(value, NaN)).filter(Number.isFinite)
  if (!rows.length) return null
  return rows.reduce((sum, value) => sum + value, 0) / rows.length
}

export function normalizeValue(value, values = [], fallback = ORGANIC_ACID_SCORING_SPEC.normalization?.zeroVariance ?? 0.5) {
  const current = safeNumber(value, NaN)
  const rows = asArray(values).map(row => safeNumber(row, NaN)).filter(Number.isFinite)
  if (!Number.isFinite(current)) return fallback
  if (!rows.length) return fallback
  const min = Math.min(...rows)
  const max = Math.max(...rows)
  if (max === min) return fallback
  return clampScore((current - min) / (max - min))
}

export function normalizeByKey(rows = [], key, rawKey = "rawValue") {
  const values = asArray(rows).map(row => row?.[rawKey])
  return asArray(rows).map(row => ({
    ...row,
    [key]: roundScore(normalizeValue(row?.[rawKey], values)),
  }))
}

export function weightedScore(row, weights) {
  const pairs = asArray(weights)
  const totalWeight = pairs.reduce((sum, [, weight]) => sum + safeNumber(weight, 0), 0) || 1
  const total = pairs.reduce((sum, [key, weight]) => sum + safeNumber(row?.[key], 0) * safeNumber(weight, 0), 0)
  return roundScore(total / totalWeight)
}

export function datasetRecords(dataset) {
  if (Array.isArray(dataset)) return dataset
  return asArray(dataset?.records)
}

function recordText(record = {}) {
  return [
    record.displayName,
    record.mofName,
    record.rawName,
    record.linker,
    record.topology,
    record.mof?.displayName,
    record.mof?.linker,
    record.mof?.topology,
    record.descriptors?.topology,
    record.descriptors?.linker,
  ].filter(Boolean).join(" ").toLowerCase()
}

export function primaryMetal(record = {}) {
  const metal = record.metalNode || record.mof?.metalNode || record.descriptors?.metalNode || ""
  const first = String(metal).split(/[;/,+|]/)[0]?.trim()
  return first ? first.replace(/\bcluster\b|\bnode\b|\boxo\b|\bhydroxo\b/gi, "").trim() : ""
}

function hasAnyText(record, needles = []) {
  const text = recordText(record)
  return asArray(needles).some(needle => text.includes(String(needle).toLowerCase()))
}

export function assignFamily(record = {}) {
  const metal = primaryMetal(record)
  const metalKey = metal.toLowerCase()
  const text = recordText(record)
  const hasMil = hasAnyText(record, ["mil"])
  if (hasMil) return "MIL-type host"
  if (metalKey === "zr") {
    if (hasAnyText(record, ["808", "spn"])) return "MOF-808-like host"
    if (hasAnyText(record, ["uio", "fcu"])) return "UiO-type host"
    return "Zr-MOF"
  }
  if (metalKey === "al") return "Al-MOF"
  if (metalKey === "fe") return "Fe-MOF"
  if (metalKey === "cr") return "Cr-MOF"
  if (metalKey === "ti") return "Ti-MOF"
  if (String(record.metalNode || "").match(/[;/,+|]/)) return "ambiguous"
  if (text.includes("mof-808")) return "MOF-808-like host"
  return "unclassified"
}

export function familyForHostName(name = "") {
  const value = String(name).trim()
  const aliases = {
    "MOF-808-like host": "MOF-808-like host",
    "UiO-type host": "UiO-type host",
    "MIL-type host": "MIL-type host",
    "Al-MOF": "Al-MOF",
    "Zr-MOF": "Zr-MOF",
    "Ti-MOF": "Ti-MOF",
    "Fe-MOF": "Fe-MOF",
    "Cr-MOF": "Cr-MOF",
  }
  return aliases[value] || value
}

export function groupByFamily(records = []) {
  return asArray(records).reduce((acc, record) => {
    const family = assignFamily(record)
    acc[family] = acc[family] || []
    acc[family].push(record)
    return acc
  }, {})
}

export function recordRef(record = {}) {
  return record.recordId || record.reactionId || record.mofId || record.id || record.sourceRecordId || record.mof?.mofId || "record"
}

export function sampleRefs(records = [], limit = 5) {
  return asArray(records).map(recordRef).filter(Boolean).slice(0, limit)
}

export function citationRefs(records = [], limit = 3) {
  return asArray(records)
    .map(record => record.citation || record.evidence?.citation || record.recordProvenance?.citation)
    .filter(Boolean)
    .slice(0, limit)
}

export function provenanceTuple({
  sourceDataset,
  nRecords,
  rawAggregate,
  normalization,
  value,
  derivationLevel = "data-derived",
  recordRefs = [],
  citations = [],
  fallbackReason = "",
}) {
  return {
    sourceDataset,
    nRecords: safeNumber(nRecords, 0),
    rawAggregate: rawAggregate || {},
    normalization: normalization || "none",
    value: roundScore(value),
    derivationLevel,
    recordRefs: asArray(recordRefs),
    citations: asArray(citations),
    fallbackReason,
  }
}

export function derivationLabel(tuple) {
  const level = tuple?.derivationLevel || "pending"
  const n = safeNumber(tuple?.nRecords, 0)
  const source = tuple?.sourceDataset || "source pending"
  return `${level} (n=${n}, ${source})`
}

export function isAcceptedValidation(value) {
  const text = String(value || "").toLowerCase()
  if (!text) return true
  return !/(reject|failed|invalid|blocked)/.test(text)
}

export function isAqueousSolvent(value) {
  return /water|aqueous|h2o/i.test(String(value || ""))
}

export function provenanceCoverage(record = {}) {
  if (Number.isFinite(Number(record.quality?.provenanceCoverage))) return clampScore(record.quality.provenanceCoverage)
  if (Number.isFinite(Number(record.provenanceCoverage))) return clampScore(record.provenanceCoverage)
  if (Number.isFinite(Number(record.validation?.sourceCoverage))) return clampScore(record.validation.sourceCoverage)
  const doi = record.doi || record.evidence?.doi
  const citation = record.citation || record.evidence?.citation
  if (doi && citation) return 1
  if (doi || citation) return 0.65
  return 0.35
}

export function qualityWeight(record = {}) {
  const tier = String(record.qualityTier || record.quality?.validationStatus || record.validationStatus || "").toLowerCase()
  if (tier.includes("gold")) return 1
  if (tier.includes("silver")) return 0.82
  if (tier.includes("bronze")) return 0.64
  return 0.5
}

export function buildFamilyAssignmentSummary(datasets = {}) {
  const sources = {
    coreMof: datasetRecords(datasets.coreMofImport),
    qmof: datasetRecords(datasets.qmofImport),
    reaction: datasetRecords(datasets.reactionDataset),
    literature: datasetRecords(datasets.literatureDataset).map(record => ({ ...record, ...(record.mof || {}) })),
    gold: datasetRecords(datasets.goldDataset).map(record => ({ ...record, ...(record.mof || {}) })),
    gasAdsorption: datasetRecords(datasets.gasAdsorptionRecords).map(record => ({ ...record, ...(record.descriptors || {}) })),
  }
  const targetFamilies = asArray(ORGANIC_ACID_SCORING_SPEC.targetFamilies)
  const byDataset = Object.fromEntries(Object.entries(sources).map(([source, records]) => {
    const counts = asArray(records).reduce((acc, record) => {
      const family = assignFamily(record)
      acc[family] = (acc[family] || 0) + 1
      return acc
    }, {})
    const targetCounts = Object.fromEntries(targetFamilies.map(family => [family, counts[family] || 0]))
    return [source, {
      totalRecords: asArray(records).length,
      targetCounts,
      unclassified: counts.unclassified || 0,
      ambiguous: counts.ambiguous || 0,
      todo: source === "coreMof" || source === "qmof" || source === "reaction"
        ? "Review unmatched Zr topology labels before interpreting UiO-type and MOF-808-like subfamilies."
        : "",
    }]
  }))
  return {
    specId: ORGANIC_ACID_SCORING_SPEC.specId,
    targetFamilies,
    byDataset,
  }
}
