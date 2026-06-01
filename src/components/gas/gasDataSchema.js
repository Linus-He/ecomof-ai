// @ts-nocheck

export const GAS_SCHEMA_VERSION = "gas-adsorption-v1"

export const GAS_FIELD_SOURCE_KEYS = [
  "primaryUptake",
  "secondaryUptake",
  "selectivity",
  "workingCapacity",
  "regenerability",
  "heatOfAdsorption",
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "waterStability",
  "thermalStability",
  "evidenceLevel",
  "confidence",
  "gasScore",
]

export const GAS_RECORD_REQUIRED_FIELDS = [
  "id",
  "schemaVersion",
  "mofId",
  "displayName",
  "rawName",
  "aliasNames",
  "gasPair",
  "primaryGas",
  "secondaryGas",
  "applicationScenario",
  "condition",
  "metrics",
  "units",
  "rawValues",
  "descriptors",
  "score",
  "evidence",
  "recordProvenance",
  "fieldSources",
  "whyRecommended",
  "risks",
  "validationRecommendation",
  "limitationNote",
]

export const GAS_EVIDENCE_LEVELS = ["A", "B", "C", "D"]

export const GAS_DATA_TYPES = [
  "experimental_literature",
  "experimental_literature_seed",
  "literature_seed",
  "simulated_gcmc",
  "simulated_iast",
  "predicted_ml",
  "derived_metric",
  "demo_placeholder",
]

export const GAS_EVIDENCE_CONFIDENCE_RANGE = {
  A: [0.9, 1],
  B: [0.7, 0.89],
  C: [0.4, 0.69],
  D: [0, 0.39],
}

export function createMissingFieldSource(field) {
  return {
    sourceType: "missing",
    citation: "pending",
    doi: null,
    sourceUrl: null,
    page: null,
    tableOrFigure: null,
    originalValue: null,
    normalizedValue: null,
    unitConversion: "No curated source available yet.",
    curationStatus: "pending",
    confidence: 0,
    note: "No curated source available yet.",
    field,
  }
}

export function getRecordProvenance(record = {}) {
  return record.recordProvenance || {
    sourceDatabase: record.sourceDatabase || "unknown",
    sourceRecordId: record.sourceRecordId || record.id || "pending",
    sourceVersion: record.sourceVersion || "legacy",
    citation: record.citation || "pending",
    doi: record.doi || null,
    sourceUrl: record.sourceUrl || null,
    license: record.license || "pending",
    retrievedAt: record.retrievedAt || "pending",
    curatedBy: record.curatedBy || "EcoMOF-AI",
    curationNote: record.curationStatus || "legacy normalized record",
  }
}

export function getFieldSource(record = {}, field) {
  if (!record) return createMissingFieldSource(field)
  const key = field === "score" ? "gasScore" : field
  const source = record.fieldSources?.[key] || record.fieldSources?.[field]
  if (!source) return createMissingFieldSource(key)
  return {
    ...createMissingFieldSource(key),
    ...source,
    field: key,
  }
}

export function validateFieldSources(record = {}) {
  const errors = []
  const warnings = []
  for (const key of GAS_FIELD_SOURCE_KEYS) {
    const source = record.fieldSources?.[key]
    if (!source) {
      errors.push(`${record.id || "record"} missing fieldSources.${key}`)
      continue
    }
    for (const required of ["sourceType", "citation", "curationStatus", "confidence", "note"]) {
      if (source[required] === undefined) errors.push(`${record.id || "record"} fieldSources.${key} missing ${required}`)
    }
    if (source.sourceType === "missing" && source.confidence !== 0) warnings.push(`${record.id || "record"} fieldSources.${key} missing source should have confidence 0`)
  }
  return { valid: errors.length === 0, errors, warnings }
}

export function validateGasAdsorptionRecord(record = {}) {
  const errors = []
  const warnings = []
  for (const field of GAS_RECORD_REQUIRED_FIELDS) {
    if (record[field] === undefined) errors.push(`${record.id || "record"} missing ${field}`)
  }
  if (!GAS_EVIDENCE_LEVELS.includes(record.evidence?.evidenceLevel || record.evidenceLevel)) {
    errors.push(`${record.id || "record"} has invalid evidence level`)
  }
  if (!GAS_DATA_TYPES.includes(record.evidence?.dataType || record.dataType)) {
    warnings.push(`${record.id || "record"} uses non-standard dataType ${record.evidence?.dataType || record.dataType}`)
  }
  for (const field of ["temperatureK", "pressureBar", "adsorptionPressureBar", "desorptionPressureBar", "mixtureRatio", "humidity", "cycleType"]) {
    if (record.condition?.[field] === undefined) warnings.push(`${record.id || "record"} condition missing ${field}`)
  }
  const fieldSourceResult = validateFieldSources(record)
  errors.push(...fieldSourceResult.errors)
  warnings.push(...fieldSourceResult.warnings)
  return { valid: errors.length === 0, errors, warnings }
}

export function validateGasAdsorptionRecords(records = []) {
  const results = records.map(validateGasAdsorptionRecord)
  return {
    valid: results.every(result => result.valid),
    errors: results.flatMap(result => result.errors),
    warnings: results.flatMap(result => result.warnings),
  }
}
