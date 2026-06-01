// @ts-nocheck
import { createMissingFieldSource, GAS_FIELD_SOURCE_KEYS, GAS_SCHEMA_VERSION, validateGasAdsorptionRecord } from "./gasDataSchema"

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function valueFrom(container = {}, key) {
  const value = container?.[key]
  if (value && typeof value === "object" && "normalizedValue" in value) return value.normalizedValue
  return value
}

function sourceFromLegacy(record = {}, field, normalizedValue, sourceType = "legacy_demo") {
  return {
    ...createMissingFieldSource(field),
    sourceType,
    citation: record.citation || "Legacy GasSep demo record",
    doi: record.doi || null,
    sourceUrl: record.sourceUrl || "#methodology-gassep",
    page: null,
    tableOrFigure: null,
    originalValue: normalizedValue ?? record[field] ?? null,
    normalizedValue: normalizedValue ?? record[field] ?? null,
    unitConversion: "Legacy demo value normalized into Gas Adsorption Data Layer v1 shape.",
    curationStatus: record.curationStatus || "placeholder",
    confidence: finite(record.confidence) ?? 0.35,
    note: "Legacy fallback record; replace with curated field-level source before scientific use.",
  }
}

export function normalizeLegacyGasRecord(record = {}) {
  const condition = {
    temperatureK: record.temperatureK ?? null,
    pressureBar: record.pressureBar ?? null,
    adsorptionPressureBar: record.pressureBar ?? null,
    desorptionPressureBar: 0.1,
    mixtureRatio: record.mixtureRatio || "pending",
    humidity: "unknown",
    cycleType: "not specified",
  }
  const metrics = {
    primaryUptake: finite(record.primaryUptake),
    secondaryUptake: finite(record.secondaryUptake),
    selectivity: finite(record.selectivity),
    workingCapacity: finite(record.workingCapacity),
    regenerability: finite(record.regenerability),
    heatOfAdsorption: finite(record.heatOfAdsorption),
    iaSTSelectivity: null,
    breakthroughTime: null,
  }
  const descriptors = {
    surfaceArea: finite(record.surfaceArea),
    poreSizeA: finite(record.poreSizeA),
    poreVolume: finite(record.poreVolume),
    density: finite(record.density),
    voidFraction: finite(record.voidFraction),
    metalNode: record.metalNode || "pending",
    linker: record.linker || "pending",
    topology: record.topology || "pending",
    waterStability: record.waterStability || "pending",
    thermalStability: finite(record.thermalStability),
    toxicityConcern: record.toxicityConcern || "pending",
  }
  const evidence = {
    dataType: "demo_placeholder",
    evidenceLevel: "D",
    confidence: Math.min(finite(record.confidence) ?? 0.35, 0.39),
    curationStatus: "placeholder",
    dataCompleteness: 0.42,
    sameConditionEvidence: false,
    hasMixtureValidation: false,
    hasBreakthroughValidation: false,
    hasIASTValidation: false,
  }
  const fieldSources = Object.fromEntries(GAS_FIELD_SOURCE_KEYS.map(key => [key, sourceFromLegacy(record, key, key === "gasScore" ? record.score : metrics[key] ?? descriptors[key])]))
  return normalizeGasRecord({
    ...record,
    schemaVersion: "legacy-demo-normalized",
    aliasNames: record.aliasNames || [],
    primaryGas: record.primaryGas,
    secondaryGas: record.secondaryGas,
    condition,
    metrics,
    units: {
      uptake: record.uptakeUnit || "mmol/g",
      pressure: "bar",
      temperature: "K",
      heatOfAdsorption: "kJ/mol",
      workingCapacity: "mmol/g",
    },
    rawValues: {},
    descriptors,
    score: { gasScore: record.score || 0, scoreBreakdown: record.scoreBreakdown || { computedAtRuntime: true } },
    evidence,
    recordProvenance: {
      sourceDatabase: record.sourceDatabase || "EcoMOF GasSep Demo",
      sourceRecordId: record.sourceRecordId || record.id,
      sourceVersion: record.sourceVersion || "legacy",
      citation: record.citation || "Legacy GasSep demo record",
      doi: record.doi || null,
      sourceUrl: record.sourceUrl || "#methodology-gassep",
      license: record.license || "Demo data for UI validation",
      retrievedAt: record.retrievedAt || "pending",
      curatedBy: "EcoMOF-AI",
      curationNote: "Legacy fallback record normalized into v1 shape.",
    },
    fieldSources,
  })
}

export function normalizeGasRecord(record = {}) {
  const condition = record.condition || {}
  const metrics = record.metrics || {}
  const descriptors = record.descriptors || {}
  const evidence = record.evidence || {}
  const provenance = record.recordProvenance || {}
  const fieldSources = {
    ...Object.fromEntries(GAS_FIELD_SOURCE_KEYS.map(key => [key, createMissingFieldSource(key)])),
    ...(record.fieldSources || {}),
  }
  const normalized = {
    ...record,
    schemaVersion: record.schemaVersion || GAS_SCHEMA_VERSION,
    aliasNames: record.aliasNames || [],
    condition,
    metrics,
    descriptors,
    evidence,
    recordProvenance: provenance,
    fieldSources,
    temperatureK: finite(condition.temperatureK),
    pressureBar: finite(condition.pressureBar),
    adsorptionPressureBar: finite(condition.adsorptionPressureBar),
    desorptionPressureBar: finite(condition.desorptionPressureBar),
    mixtureRatio: condition.mixtureRatio || record.mixtureRatio || "pending",
    humidity: condition.humidity || "unknown",
    cycleType: condition.cycleType || "not specified",
    primaryUptake: finite(valueFrom(metrics, "primaryUptake")),
    secondaryUptake: finite(valueFrom(metrics, "secondaryUptake")),
    selectivity: finite(valueFrom(metrics, "selectivity")),
    workingCapacity: finite(valueFrom(metrics, "workingCapacity")),
    regenerability: finite(valueFrom(metrics, "regenerability")),
    heatOfAdsorption: finite(valueFrom(metrics, "heatOfAdsorption")),
    iaSTSelectivity: finite(valueFrom(metrics, "iaSTSelectivity")),
    breakthroughTime: finite(valueFrom(metrics, "breakthroughTime")),
    surfaceArea: finite(valueFrom(descriptors, "surfaceArea")),
    poreSizeA: finite(valueFrom(descriptors, "poreSizeA")),
    poreVolume: finite(valueFrom(descriptors, "poreVolume")),
    density: finite(valueFrom(descriptors, "density")),
    voidFraction: finite(valueFrom(descriptors, "voidFraction")),
    metalNode: valueFrom(descriptors, "metalNode") || "pending",
    linker: valueFrom(descriptors, "linker") || "pending",
    topology: valueFrom(descriptors, "topology") || "pending",
    waterStability: valueFrom(descriptors, "waterStability") || "pending",
    thermalStability: finite(valueFrom(descriptors, "thermalStability")),
    toxicityConcern: valueFrom(descriptors, "toxicityConcern") || "pending",
    sourceDatabase: provenance.sourceDatabase || record.sourceDatabase || "pending",
    sourceRecordId: provenance.sourceRecordId || record.sourceRecordId || record.id,
    sourceVersion: provenance.sourceVersion || record.sourceVersion || "pending",
    citation: provenance.citation || record.citation || "pending",
    doi: provenance.doi || record.doi || null,
    sourceUrl: provenance.sourceUrl || record.sourceUrl || null,
    license: provenance.license || record.license || "pending",
    retrievedAt: provenance.retrievedAt || record.retrievedAt || "pending",
    curationStatus: evidence.curationStatus || record.curationStatus || "pending",
    dataType: evidence.dataType || record.dataType || "demo_placeholder",
    evidenceLevel: evidence.evidenceLevel || record.evidenceLevel || "D",
    confidence: finite(evidence.confidence ?? record.confidence) ?? 0,
    dataCompleteness: finite(evidence.dataCompleteness) ?? 0,
    sameConditionEvidence: Boolean(evidence.sameConditionEvidence),
    hasMixtureValidation: Boolean(evidence.hasMixtureValidation),
    hasBreakthroughValidation: Boolean(evidence.hasBreakthroughValidation),
    hasIASTValidation: Boolean(evidence.hasIASTValidation),
    score: finite(record.score?.gasScore ?? record.score) ?? 0,
    scoreBreakdown: record.score?.scoreBreakdown || record.scoreBreakdown || { computedAtRuntime: true },
  }
  const validation = validateGasAdsorptionRecord(record.schemaVersion ? record : { ...record, fieldSources })
  if (validation.errors.length && typeof console !== "undefined") {
    console.warn("Gas adsorption record normalized with schema gaps.", normalized.id, validation.errors.slice(0, 4))
  }
  return normalized
}

export function normalizeGasRecords(records = []) {
  return (Array.isArray(records) ? records : []).map(record => record?.schemaVersion === GAS_SCHEMA_VERSION ? normalizeGasRecord(record) : normalizeLegacyGasRecord(record))
}
