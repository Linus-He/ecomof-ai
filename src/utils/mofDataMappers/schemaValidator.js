// @ts-nocheck
import { getOrganicAcidSchema } from "../../schemas/organicAcidScreeningSchema"

const DOI_RE = /^10\.\d{4,9}\/\S+$/i

function getValue(record, path) {
  return String(path || "").split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined
    return value[key]
  }, record)
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function typeMatches(value, field) {
  if (value === null) return !!field.allowNull
  if (field.type === "array") return Array.isArray(value)
  if (field.type === "object") return isPlainObject(value)
  if (field.type === "number") return typeof value === "number" && Number.isFinite(value)
  if (field.type === "boolean") return typeof value === "boolean"
  if (field.type === "enum") return typeof value === "string" && field.values.includes(value)
  if (field.type === "string") return typeof value === "string" && value.trim().length > 0
  return value !== undefined
}

function walkInvalidPrimitives(value, path = "$", issues = []) {
  if (value === undefined) issues.push({ path, message: "undefined value is not allowed" })
  if (typeof value === "number" && !Number.isFinite(value)) issues.push({ path, message: "NaN or Infinity is not allowed" })
  if (Array.isArray(value)) value.forEach((item, index) => walkInvalidPrimitives(item, `${path}[${index}]`, issues))
  if (isPlainObject(value)) Object.entries(value).forEach(([key, item]) => walkInvalidPrimitives(item, `${path}.${key}`, issues))
  return issues
}

export function validateAgainstSchema(record, schemaOrId) {
  const schema = typeof schemaOrId === "string" ? getOrganicAcidSchema(schemaOrId) : schemaOrId
  const errors = []
  const warnings = []

  if (!schema) {
    return { valid: false, schemaId: "unknown", errors: [{ path: "$", message: "Unknown schema" }], warnings, summary: { requiredTotal: 0, requiredPresent: 0, warningCount: 0, errorCount: 1 } }
  }

  const invalidPrimitives = walkInvalidPrimitives(record)
  invalidPrimitives.forEach(issue => errors.push(issue))

  let requiredTotal = 0
  let requiredPresent = 0
  schema.fields.forEach(field => {
    const value = getValue(record, field.path)
    if (field.required) requiredTotal += 1
    if (value !== undefined && value !== null && value !== "") requiredPresent += field.required ? 1 : 0
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push({ path: field.path, message: "required field is missing" })
      return
    }
    if (value === undefined || value === null || value === "") {
      if (field.format === "doi" && value === null) warnings.push({ path: field.path, message: "DOI metadata pending; no DOI displayed" })
      return
    }
    if (!typeMatches(value, field)) {
      errors.push({ path: field.path, message: `expected ${field.type}` })
      return
    }
    if (field.type === "number") {
      if (Number.isFinite(field.min) && value < field.min) errors.push({ path: field.path, message: `below minimum ${field.min}` })
      if (Number.isFinite(field.max) && value > field.max) errors.push({ path: field.path, message: `above maximum ${field.max}` })
    }
    if (field.format === "doi" && typeof value === "string" && !DOI_RE.test(value)) {
      errors.push({ path: field.path, message: "invalid DOI format" })
    }
  })

  const summary = {
    requiredTotal,
    requiredPresent,
    coverage: requiredTotal ? Number((requiredPresent / requiredTotal).toFixed(3)) : 1,
    warningCount: warnings.length,
    errorCount: errors.length,
  }

  return {
    valid: errors.length === 0,
    schemaId: schema.id,
    schemaLabel: schema.label,
    errors,
    warnings,
    summary,
  }
}

export function validateRecords(records = [], schemaOrId) {
  const rows = (Array.isArray(records) ? records : []).map(record => validateAgainstSchema(record, schemaOrId))
  return {
    total: rows.length,
    valid: rows.filter(row => row.valid).length,
    invalid: rows.filter(row => !row.valid).length,
    warningCount: rows.reduce((sum, row) => sum + row.warnings.length, 0),
    errorCount: rows.reduce((sum, row) => sum + row.errors.length, 0),
    rows,
  }
}
