// @ts-nocheck
import { normalizeMofRecord } from "./normalizeMofRecord.js"
import { normalizeReactionRecord } from "./normalizeReactionRecord.js"

const PENDING = new Set(["pending", "unknown", "ambiguous", "restricted", "missing", "not_available", "", null, undefined])

function isReal(value) {
  if (value == null) return false
  return !PENDING.has(String(value).trim().toLowerCase())
}

function pick(raw, keys) {
  for (const key of keys) {
    if (raw[key] != null && raw[key] !== "") return raw[key]
  }
  return undefined
}

// Normalize a raw organic-acid record into the unified five-layer schema.
// Missing provenance stays pending/null and is never fabricated.
export function normalizeOrganicAcidRecord(raw = {}, { sourceId = "unknown" } = {}) {
  const mof = normalizeMofRecord(raw, { sourceId })
  const reaction = normalizeReactionRecord(raw, { sourceId })

  const doi = pick(raw, ["doi", "sourceDoi", "sourceDOI"]) ?? (raw.provenance && pick(raw.provenance, ["doi", "sourceDoi"])) ?? "pending"
  const citation = pick(raw, ["citation", "exactCitation", "sourceTitle"]) ?? "pending"
  const sourceUrl = pick(raw, ["sourceUrl", "cifUrl"]) ?? "pending"
  const syntheticFixture = Boolean(raw.syntheticFixture || raw.dataMode === "synthetic" || /synthetic/i.test(String(raw.sourceDatabase || "")))

  const evidence = {
    doi: isReal(doi) ? doi : "pending",
    sourceUrl: isReal(sourceUrl) ? sourceUrl : "pending",
    citation: isReal(citation) ? citation : "pending",
    evidenceLevel: pick(raw, ["evidenceLevel"]) ?? "pending",
    sourceConfirmed: Boolean(raw.sourceConfirmed) || isReal(sourceUrl),
    citationReady: Boolean(raw.citationReady) || isReal(citation),
    verifiedMetadata: Boolean(raw.verifiedMetadata),
  }

  const allFieldSources = { ...mof.fieldSources, ...reaction.fieldSources }
  const totalFields = Object.keys(allFieldSources).length || 1
  const presentFields = Object.values(allFieldSources).filter(source => source.status === "confirmed").length
  const completenessScore = Number((presentFields / totalFields).toFixed(3))
  const provenanceFields = ["doi", "citation", "sourceUrl"]
  const provenanceCoverage = Number((provenanceFields.filter(field => isReal(evidence[field])).length / provenanceFields.length).toFixed(3))

  return {
    recordId: String(pick(raw, ["recordId", "reactionId", "id", "mofId"]) ?? mof.mofId),
    sourceId,
    syntheticFixture,
    mof: { mofId: mof.mofId, displayName: mof.displayName, metalNode: mof.metalNode, linker: mof.linker, topology: mof.topology, surfaceArea: mof.surfaceArea, poreVolume: mof.poreVolume, poreSizeA: mof.poreSizeA, density: mof.density, voidFraction: mof.voidFraction, bandGap: mof.bandGap, stabilityProxy: mof.stabilityProxy },
    reaction: { reactionId: reaction.reactionId, targetProduct: reaction.targetProduct, temperature: reaction.temperature, pressure: reaction.pressure, solvent: reaction.solvent, reactionTime: reaction.reactionTime, atmosphere: reaction.atmosphere, pH: reaction.pH },
    performance: reaction.performance,
    evidence,
    quality: {
      completenessScore,
      provenanceCoverage,
      validationStatus: "pending",
      warnings: [],
      blockers: [],
    },
    fieldSources: allFieldSources,
  }
}
