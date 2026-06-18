// @ts-nocheck
import { normalizeField } from "./normalizeUnits.js"

const MOF_NUMERIC_FIELDS = ["surfaceArea", "poreVolume", "poreSizeA", "density", "voidFraction", "bandGap", "stabilityProxy"]

function pick(raw, keys) {
  for (const key of keys) {
    if (raw[key] != null && raw[key] !== "") return raw[key]
  }
  return undefined
}

// Normalize an arbitrary MOF record into the unified MOF Layer with field-level provenance.
export function normalizeMofRecord(raw = {}, { sourceId = "unknown" } = {}) {
  const mofId = String(pick(raw, ["mofId", "id", "candidateId", "sourceRecordId"]) ?? "unknown")
  const displayName = String(pick(raw, ["displayName", "name", "rawName"]) ?? mofId)
  const metalNode = pick(raw, ["metalNode"]) ?? (Array.isArray(raw.metals) ? raw.metals.join("/") : pick(raw, ["metalNodes"])) ?? null
  const linker = pick(raw, ["linker"]) ?? null
  const topology = pick(raw, ["topology"]) ?? null
  const poreSizeRaw = pick(raw, ["poreSizeA", "pldA", "poreSize"])

  const fieldSources = {}
  const layer = { mofId, displayName, metalNode, linker, topology }

  for (const field of MOF_NUMERIC_FIELDS) {
    const rawValue = field === "poreSizeA" ? poreSizeRaw : raw[field]
    const normalized = normalizeField(field, rawValue, sourceId)
    layer[field] = normalized.normalizedValue
    fieldSources[field] = normalized
  }

  return { layer: "mof", ...layer, fieldSources, sourceId }
}
