// @ts-nocheck
import { normalizeReactionRecord } from "../dataStandardization/normalizeReactionRecord.js"
import { runImport, isReal } from "./runImport.js"

// Organic-acid literature records carry per-record DOI/citation. Records missing
// the critical reaction fields (or a real DOI) cannot reach Gold; they stay
// Silver/Bronze. Nothing is fabricated — pending DOIs remain "pending".
const CRITICAL = ["doi", "citation", "product", "temperature", "pressure", "solvent", "reactionTime", "catalyst", "yield", "selectivity"]

export function mapLiteratureRow(raw = {}) {
  const reaction = normalizeReactionRecord(
    { reactionId: raw.recordId || raw.reactionId, targetProduct: raw.product, reactionConditions: { temperature: raw.temperature, pressure: raw.pressure, solvent: raw.solvent, reactionTime: raw.reactionTime }, productDistribution: { yield: raw.yield, selectivity: raw.selectivity } },
    { sourceId: "SRC-OA-LITERATURE" },
  )
  const missing = CRITICAL.filter(field => {
    if (["doi", "citation", "product", "solvent", "catalyst"].includes(field)) return !isReal(raw[field])
    if (field === "temperature") return reaction.temperature == null
    if (field === "pressure") return reaction.pressure == null
    if (field === "reactionTime") return reaction.reactionTime == null
    if (field === "yield") return reaction.performance.yield == null
    if (field === "selectivity") return reaction.performance.selectivity == null
    return false
  })
  const goldEligible = missing.length === 0
  return {
    recordId: raw.recordId || reaction.reactionId,
    sourceRecordId: raw.recordId || reaction.reactionId,
    datasetOrigin: "literature_curated",
    doi: isReal(raw.doi) ? raw.doi : "pending",
    citation: isReal(raw.citation) ? raw.citation : "pending",
    product: raw.product || "formic acid",
    temperature: reaction.temperature,
    pressure: reaction.pressure,
    solvent: raw.solvent || "pending",
    reactionTime: reaction.reactionTime,
    catalyst: raw.catalyst || "pending",
    yield: reaction.performance.yield,
    selectivity: reaction.performance.selectivity,
    mofId: raw.mofId || raw.catalyst,
    metalNode: raw.metalNode || "pending",
    qualityTier: goldEligible ? "Gold" : isReal(raw.doi) ? "Silver" : "Bronze",
    missingCriticalFields: missing,
    goldEligible,
  }
}

export function importOrganicAcidLiterature(rawRows = []) {
  const mapped = rawRows.map(mapLiteratureRow)
  return runImport(mapped, { origin: "literature_curated" })
}
