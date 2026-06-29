// @ts-nocheck

export const GAS_SCHEMA_VERSION = "gas-adsorption-v1"

export const GAS_FIELD_SOURCE_KEYS = [
  "primaryUptake",
  "secondaryUptake",
  "selectivity",
  "iaSTSelectivity",
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

export const GAS_FIELD_SOURCE_ALIASES = {
  score: "gasScore",
  gasSeparationScore: "gasScore",
  gasScore: "gasScore",
  targetGasUptake: "primaryUptake",
  uptake: "primaryUptake",
  selectivityCO2N2: "selectivity",
  selectivityCO2CH4: "selectivity",
  selectivityCH4N2: "selectivity",
  selectivityH2CO2: "selectivity",
  selectivityO2N2: "selectivity",
  iastSelectivity: "iaSTSelectivity",
  IASTSelectivity: "iaSTSelectivity",
  confidenceLevel: "confidence",
  evidenceConfidence: "confidence",
}

export const GAS_RECORD_PROVENANCE_FIELDS = [
  "displayName",
  "rawName",
  "mofId",
  "sourceDatabase",
  "sourceRecordId",
  "sourceVersion",
  "citation",
  "doi",
  "sourceUrl",
  "license",
  "retrievedAt",
]

const RAW_VALUE_ALIASES = {
  temperatureK: "temperature",
  pressureBar: "pressure",
  adsorptionPressureBar: "pressure",
  gasMixture: "mixtureRatio",
  feedRatio: "mixtureRatio",
}

const FIELD_UNITS = {
  displayName: "record",
  sourceDatabase: "record",
  sourceRecordId: "record",
  surfaceArea: "m2/g",
  poreSizeA: "A",
  poreVolume: "cm3/g",
  density: "g/cm3",
  voidFraction: "fraction",
  waterStability: "status",
  thermalStability: "K",
  primaryUptake: "mmol/g",
  secondaryUptake: "mmol/g",
  co2Uptake: "mmol/g",
  n2Uptake: "mmol/g",
  ch4Uptake: "mmol/g",
  h2Uptake: "mmol/g",
  o2Uptake: "mmol/g",
  co2Henry: "pending",
  n2Henry: "pending",
  selectivity: "dimensionless",
  iaSTSelectivity: "dimensionless",
  selectivityCO2N2: "dimensionless",
  selectivityCO2CH4: "dimensionless",
  workingCapacity: "mmol/g",
  heatOfAdsorption: "kJ/mol",
  temperatureK: "K",
  pressureBar: "bar",
  gasMixture: "ratio",
  method: "method",
  isothermModel: "model",
  dataSourceType: "status",
  measurementBasis: "basis",
  gasSeparationScore: "/100",
  confidenceLevel: "fraction",
  curationStatus: "status",
  dataCompleteness: "fraction",
  normalizationMethod: "method",
}

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

function normalizeGasToken(value = "") {
  return String(value)
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)])
    .toUpperCase()
}

function splitGasPair(record = {}) {
  const pair = String(record.gasPair || "")
  const [pairPrimary, pairSecondary] = pair.split("/")
  return {
    primary: normalizeGasToken(record.primaryGas || pairPrimary),
    secondary: normalizeGasToken(record.secondaryGas || pairSecondary),
  }
}

function gasFromUptakeField(field = "") {
  const match = String(field).match(/^(co2|ch4|n2|h2|o2|voc)Uptake$/i)
  return match ? normalizeGasToken(match[1]) : null
}

function canonicalGasUptakeKey(record = {}, field = "") {
  const gas = gasFromUptakeField(field)
  if (!gas) return null
  const pair = splitGasPair(record)
  if (gas === pair.primary) return "primaryUptake"
  if (gas === pair.secondary) return "secondaryUptake"
  return null
}

function canonicalSelectivityKey(field = "") {
  return /^selectivity[A-Z0-9₂₄]+$/i.test(String(field)) ? "selectivity" : null
}

export function canonicalGasFieldSourceKey(record = {}, field) {
  const requested = String(field || "")
  if (!requested) return requested
  if (record.fieldSources?.[requested]) return requested
  const dynamicUptake = canonicalGasUptakeKey(record, requested)
  if (dynamicUptake) return dynamicUptake
  const dynamicSelectivity = canonicalSelectivityKey(requested)
  if (dynamicSelectivity) return dynamicSelectivity
  return GAS_FIELD_SOURCE_ALIASES[requested] || requested
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "")
}

function rawValueForField(record = {}, field, canonicalField) {
  const rawKey = RAW_VALUE_ALIASES[field] || RAW_VALUE_ALIASES[canonicalField] || field || canonicalField
  return record.rawValues?.[rawKey] || record.rawValues?.[canonicalField] || null
}

function valueForField(record = {}, field, canonicalField) {
  const direct = firstDefined(
    record[field],
    record[canonicalField],
    record.metrics?.[field],
    record.metrics?.[canonicalField],
    record.descriptors?.[field],
    record.descriptors?.[canonicalField],
    record.condition?.[field],
    record.evidence?.[field],
  )
  if (direct !== undefined) return direct
  if (field === "gasMixture" || field === "feedRatio") return firstDefined(record.condition?.mixtureRatio, record.mixtureRatio)
  if (field === "dataSourceType") return firstDefined(record.evidence?.dataType, record.dataType)
  if (field === "confidenceLevel") return firstDefined(record.evidence?.confidence, record.confidence)
  if (field === "gasSeparationScore") return firstDefined(record.score?.gasScore, record.score)
  if (field === "curationStatus") return firstDefined(record.evidence?.curationStatus, record.curationStatus)
  if (field === "dataCompleteness") return firstDefined(record.evidence?.dataCompleteness, record.dataCompleteness)
  return undefined
}

export function createPendingFieldSource(record = {}, field, canonicalField = field) {
  const provenance = getRecordProvenance(record)
  const raw = rawValueForField(record, field, canonicalField)
  const value = valueForField(record, field, canonicalField)
  return {
    ...createMissingFieldSource(canonicalField),
    sourceType: "pending_provenance",
    sourceDatabase: provenance.sourceDatabase || record.sourceDatabase || "pending",
    sourceRecordId: provenance.sourceRecordId || record.sourceRecordId || record.id || "pending",
    sourceVersion: provenance.sourceVersion || record.sourceVersion || "pending",
    citation: provenance.citation || record.citation || "pending",
    doi: provenance.doi || record.doi || null,
    sourceUrl: provenance.sourceUrl || record.sourceUrl || null,
    license: provenance.license || record.license || "pending",
    retrievedAt: provenance.retrievedAt || record.retrievedAt || "pending",
    originalValue: raw?.originalValue ?? value ?? null,
    normalizedValue: raw?.normalizedValue ?? value ?? null,
    normalizedUnit: raw?.normalizedUnit || FIELD_UNITS[field] || FIELD_UNITS[canonicalField] || "pending",
    unitConversion: raw?.conversionNote || "Field-level provenance is pending; record-level provenance is shown for traceability.",
    curationStatus: record.curationStatus || record.evidence?.curationStatus || "pending",
    confidence: 0,
    note: `Pending field-level provenance for ${field}; record-level provenance is shown for traceability.`,
    field: canonicalField,
    requestedField: field,
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
  const key = canonicalGasFieldSourceKey(record, field)
  const source = record.fieldSources?.[key] || record.fieldSources?.[field]
  if (!source || source.sourceType === "missing") return createPendingFieldSource(record, field, key)
  return {
    ...createMissingFieldSource(key),
    ...source,
    field: key,
    requestedField: field,
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
