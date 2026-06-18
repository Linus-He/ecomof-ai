// @ts-nocheck
import { normalizeField } from "./normalizeUnits.js"

const REACTION_NUMERIC_FIELDS = ["temperature", "pressure", "reactionTime", "pH"]
const PERFORMANCE_FIELDS = ["yield", "selectivity", "conversion", "rate", "TON", "TOF"]

function pick(raw, keys) {
  for (const key of keys) {
    if (raw[key] != null && raw[key] !== "") return raw[key]
  }
  return undefined
}

// Normalize reaction + performance layers (conditions + outcomes) with provenance.
export function normalizeReactionRecord(raw = {}, { sourceId = "unknown" } = {}) {
  const conditions = raw.reactionConditions || raw.conditions || raw
  const performanceRaw = raw.productDistribution || raw.performance || raw

  const reactionId = String(pick(raw, ["reactionId", "recordId", "id"]) ?? "unknown")
  const targetProduct = pick(raw, ["targetProduct"]) ?? pick(raw.reactionSystem || {}, ["targetProduct", "product"]) ?? pick(conditions, ["targetProduct"]) ?? null
  const solvent = pick(conditions, ["solvent"]) ?? null
  const atmosphere = pick(conditions, ["atmosphere"]) ?? null

  const reactionFieldSources = {}
  const reaction = { reactionId, targetProduct, solvent, atmosphere }
  for (const field of REACTION_NUMERIC_FIELDS) {
    const key = field === "reactionTime" ? pick(conditions, ["reactionTime", "time"]) : conditions[field]
    const normalized = normalizeField(field, key, sourceId)
    reaction[field] = normalized.normalizedValue
    reactionFieldSources[field] = normalized
  }

  const performanceFieldSources = {}
  const performance = {}
  for (const field of PERFORMANCE_FIELDS) {
    const normalized = normalizeField(field, performanceRaw[field], sourceId)
    performance[field] = normalized.normalizedValue
    performanceFieldSources[field] = normalized
  }

  return {
    layer: "reaction",
    ...reaction,
    performance,
    fieldSources: { ...reactionFieldSources, ...performanceFieldSources },
    sourceId,
  }
}
