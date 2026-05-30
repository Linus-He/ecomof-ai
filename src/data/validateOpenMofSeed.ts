// @ts-nocheck
import { CORE_MOF_DESCRIPTOR_KEYS } from "../scoring/descriptors/descriptorRegistry"
import { getCoreDescriptorCompleteness } from "../scoring/descriptors/descriptorAccessors"

const CURATION_STATUSES = new Set(["curated", "pending", "missing", "needs-review", "demo", "raw-import"])
const EVIDENCE_LEVELS = new Set([
  "experimental",
  "literature",
  "literature-supported",
  "simulation",
  "simulation-supported",
  "ML-predicted",
  "ml-predicted",
  "rule-based",
  "database",
  "needs-validation",
  "pending",
])

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== ""
}

function isFiniteDescriptorValue(value) {
  if (value === undefined || value === null || value === "") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (typeof value === "boolean") return true
  const text = String(value).trim().toLowerCase()
  if (["pending", "unknown", "not reported", "n/a", "na", "—"].includes(text)) return true
  const numeric = Number(value)
  return !Number.isNaN(numeric) ? Number.isFinite(numeric) : true
}

function validateDescriptorStatus(record, key, errors) {
  const value = record?.[key] ?? record?.descriptors?.[key] ?? null
  if (!isFiniteDescriptorValue(value)) errors.push(`${record.id || "unknown"}:${key} has non-finite descriptor value`)
  const status = String(record?.descriptorCompleteness?.[key] || (value == null ? "pending" : "curated")).toLowerCase()
  if (!CURATION_STATUSES.has(status)) errors.push(`${record.id || "unknown"}:${key} has invalid curation status ${status}`)
  const nested = record?.descriptors?.[key]
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const evidence = nested.evidenceLevel || record.evidenceLevel || "needs-validation"
    if (!EVIDENCE_LEVELS.has(String(evidence))) errors.push(`${record.id || "unknown"}:${key} has invalid evidence level ${evidence}`)
  }
}

export function validateOpenMofSeedRecords(records = []) {
  const rows = Array.isArray(records) ? records : []
  const errors = []
  const warnings = []
  rows.forEach((record, index) => {
    const label = record?.id || `record-${index + 1}`
    if (!hasText(record?.id)) errors.push(`${label} is missing id`)
    if (!hasText(record?.displayName) && !hasText(record?.name) && !hasText(record?.rawName)) errors.push(`${label} is missing displayName/name/rawName`)
    if (!hasText(record?.sourceDatabase) && !hasText(record?.provenance?.sourceDatabase) && !hasText(record?.provenance?.database)) errors.push(`${label} is missing sourceDatabase`)
    const curationStatus = String(record?.curationStatus || record?.provenance?.curationStatus || "pending").toLowerCase()
    if (!CURATION_STATUSES.has(curationStatus)) errors.push(`${label} has invalid curationStatus ${curationStatus}`)
    CORE_MOF_DESCRIPTOR_KEYS.forEach(key => validateDescriptorStatus(record, key, errors))
    const completeness = getCoreDescriptorCompleteness(record)
    if (completeness.descriptorCount !== CORE_MOF_DESCRIPTOR_KEYS.length) errors.push(`${label} core descriptor completeness did not resolve 8 descriptors`)
    if (record?.sourceUrl && typeof record.sourceUrl !== "string") warnings.push(`${label} sourceUrl is not a string`)
    if (record?.doi && typeof record.doi !== "string") warnings.push(`${label} doi is not a string`)
  })
  return {
    valid: errors.length === 0,
    recordCount: rows.length,
    errors,
    warnings,
  }
}
