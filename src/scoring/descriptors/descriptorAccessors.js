import { isMissingScore } from "../../utils/criticScoring"
import { getDescriptor, getDescriptors } from "./descriptorRegistry"
import { getDescriptorPreset } from "./descriptorPresets"

function readNestedDescriptor(candidate, descriptor) {
  const sourceField = descriptor.sourceField || descriptor.key
  const nested = candidate?.descriptors?.[sourceField] ?? candidate?.descriptors?.[descriptor.key]
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return {
      value: nested.value ?? null,
      unit: nested.unit || descriptor.unit || "",
      status: nested.status || nested.curationStatus || "",
      evidenceLevel: nested.evidenceLevel || "",
      sourceId: nested.sourceId || nested.sourceName || "",
      conditions: nested.conditions || nested.condition || "",
      source: nested,
      structure: "nested",
    }
  }
  if (nested !== undefined) {
    return {
      value: nested,
      unit: descriptor.unit || "",
      status: "",
      evidenceLevel: "",
      sourceId: "",
      conditions: "",
      source: null,
      structure: "nested",
    }
  }
  return null
}

function readFlatDescriptor(candidate, descriptor) {
  const sourceField = descriptor.sourceField || descriptor.key
  const value = candidate?.[sourceField] ?? candidate?.[descriptor.key] ?? null
  return {
    value,
    unit: descriptor.unit || "",
    status: "",
    evidenceLevel: candidate?.evidenceLevel || "",
    sourceId: "",
    conditions: "",
    source: null,
    structure: "flat",
  }
}

export function getCandidateDescriptorEvidence(candidate, descriptorKey) {
  const descriptor = getDescriptor(descriptorKey)
  if (!descriptor) return { missing: true, source: null, status: "unknown" }
  const sourceField = descriptor.sourceField || descriptor.key
  const nested = candidate?.descriptors?.[sourceField] ?? candidate?.descriptors?.[descriptor.key]
  const fieldSource = candidate?.fieldSources?.[sourceField] ?? candidate?.fieldSources?.[descriptor.key]
  const source = (nested && typeof nested === "object" ? nested : null) || fieldSource || null
  if (!source) {
    return {
      missing: true,
      source: null,
      status: "missing",
      evidenceLevel: candidate?.evidenceLevel || "needs-validation",
    }
  }
  const status = source.status || source.sourceType || source.curationStatus || "curated"
  return {
    missing: false,
    source,
    status,
    evidenceLevel: source.evidenceLevel || candidate?.evidenceLevel || "needs-validation",
    sourceName: source.sourceName || source.sourceId || source.database || "",
    condition: source.condition || source.conditions || "",
  }
}

export function getCandidateDescriptorValue(candidate, descriptorKey) {
  const descriptor = typeof descriptorKey === "object" ? descriptorKey : getDescriptor(descriptorKey)
  if (!descriptor) {
    return { value: null, missing: true, status: "unknown-descriptor", descriptor: null, evidence: null }
  }
  const nested = readNestedDescriptor(candidate, descriptor)
  const raw = nested || readFlatDescriptor(candidate, descriptor)
  const evidence = getCandidateDescriptorEvidence(candidate, descriptor.key)
  const missing = isMissingScore(raw.value)
  return {
    ...raw,
    descriptor,
    missing,
    status: missing ? "missing" : (evidence.status || raw.status || "available"),
    evidence,
  }
}

export function getDescriptorsForPreset(presetKey = "coreMof8", overrideKeys) {
  const keys = Array.isArray(overrideKeys) && overrideKeys.length
    ? overrideKeys
    : getDescriptorPreset(presetKey).descriptorKeys
  return getDescriptors(keys)
}

export function getDescriptorCoverage(candidate, descriptorKeys = []) {
  const descriptors = getDescriptors(descriptorKeys)
  const rows = descriptors.map(descriptor => {
    const value = getCandidateDescriptorValue(candidate, descriptor)
    const evidence = value.evidence || {}
    const evidenceMissing = descriptor.evidenceRequired && evidence.missing
    const curated = !value.missing && !evidenceMissing && evidence.status !== "pending"
    return {
      key: descriptor.key,
      descriptor,
      value: value.value,
      missing: value.missing,
      evidenceMissing,
      planned: Boolean(descriptor.planned),
      curated,
      status: curated ? "curated" : value.missing ? "missing" : "needs-evidence",
    }
  })
  const activeRows = rows.filter(row => !row.planned)
  const denominator = rows.length
  const curatedCount = rows.filter(row => row.curated).length
  return {
    rows,
    activeRows,
    curatedCount,
    descriptorCount: denominator,
    availableCount: rows.filter(row => !row.missing).length,
    plannedCount: rows.filter(row => row.planned).length,
    ratio: denominator ? curatedCount / denominator : 0,
  }
}

export function getDatasetDescriptorCoverage(candidates = [], descriptorKeys = []) {
  const descriptors = getDescriptors(descriptorKeys)
  const rows = descriptors.map(descriptor => {
    const candidateRows = (Array.isArray(candidates) ? candidates : []).map(candidate => getCandidateDescriptorValue(candidate, descriptor))
    const availableCount = candidateRows.filter(row => !row.missing).length
    const evidenceCount = candidateRows.filter((row, index) => {
      const evidence = getCandidateDescriptorEvidence(candidates[index], descriptor.key)
      return !evidence.missing && evidence.status !== "pending"
    }).length
    const total = candidateRows.length
    return {
      key: descriptor.key,
      descriptor,
      availableCount,
      evidenceCount,
      total,
      availability: total ? availableCount / total : 0,
      evidenceCoverage: total ? evidenceCount / total : 0,
      planned: Boolean(descriptor.planned),
    }
  })
  const totalCells = rows.reduce((sum, row) => sum + row.total, 0)
  const availableCells = rows.reduce((sum, row) => sum + row.availableCount, 0)
  return {
    rows,
    descriptorCount: descriptors.length,
    candidateCount: Array.isArray(candidates) ? candidates.length : 0,
    availableCells,
    totalCells,
    coverage: totalCells ? availableCells / totalCells : 0,
  }
}
