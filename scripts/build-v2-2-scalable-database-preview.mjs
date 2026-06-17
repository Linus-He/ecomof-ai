// V2.2 Scalable Database Preview builder.
//
// The preview is offline and deterministic. It preserves field-level provenance
// for every key field and never fabricates DOI, license, citation, or source URL.
// Synthetic expansion rows are explicitly marked and cannot pass verifiedMetadata.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { buildDataQualityAudit, buildDatabaseHealthSummary, enrichRecordQuality, FIELD_QUALITY_KEYS } from "../src/utils/dataQualityAudit.js"
import { runVerifiedMetadataGate } from "../src/utils/databaseIndex/verifiedMetadataGate.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const seedFile = path.join(repoRoot, "public", "data", "open_mof_seed_candidates.json")
const outRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_2")
const GENERATED_AT = "2026-06-17T00:00:00.000Z"
const VERSION = "V2.2-Scalable-Database-Preview"
const TARGET_RECORDS = 1000

const NUMERIC_UNITS = {
  surfaceArea: "m2/g",
  poreSizeA: "A",
  pldA: "A",
  lcdA: "A",
  poreVolume: "cm3/g",
  density: "g/cm3",
  voidFraction: "",
  bandGap: "eV",
}

const PRIORITY_CANDIDATE_STATUS = [
  {
    displayName: "MIL-53(Al)",
    sourceConfirmed: true,
    verifiedMetadata: false,
    remainingBlockers: ["sourceUrl pending", "license pending", "fixture record mapping ambiguous", "fieldLevelCriticalProvenanceComplete false"],
    neededManualActions: ["Attach exact source URL", "Confirm license", "Map fixture record to exact database row", "Clear field-level ambiguity warnings"],
  },
  {
    displayName: "CAU-10(Al)",
    sourceConfirmed: true,
    verifiedMetadata: false,
    remainingBlockers: ["sourceUrl pending", "license pending", "fixture record mapping ambiguous", "fieldLevelCriticalProvenanceComplete false"],
    neededManualActions: ["Attach exact source URL", "Confirm license", "Map fixture record to exact database row", "Confirm critical descriptor provenance"],
  },
  {
    displayName: "MIL-100(Al)",
    sourceConfirmed: true,
    verifiedMetadata: false,
    remainingBlockers: ["sourceUrl pending", "license pending", "fixture record mapping ambiguous", "fieldLevelCriticalProvenanceComplete false"],
    neededManualActions: ["Attach exact source URL", "Confirm license", "Map fixture record to exact database row", "Confirm critical descriptor provenance"],
  },
  {
    displayName: "DUT-4(Al)",
    sourceConfirmed: true,
    verifiedMetadata: false,
    remainingBlockers: ["sourceUrl pending", "license pending", "fixture record mapping ambiguous", "fieldLevelCriticalProvenanceComplete false"],
    neededManualActions: ["Attach exact source URL", "Confirm license", "Map fixture record to exact database row", "Confirm critical descriptor provenance"],
  },
  {
    displayName: "MIL-101(Al)",
    sourceConfirmed: false,
    verifiedMetadata: false,
    quarantined: true,
    remainingBlockers: ["fixture mapping ambiguous", "name ambiguity warning", "sourceUrl pending", "license pending"],
    neededManualActions: ["Resolve MIL-101 metal-node ambiguity", "Attach exact source URL", "Confirm license before re-entering ranking"],
  },
]

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function present(value) {
  if (value === null || value === undefined || value === "") return false
  const normalized = String(value).trim().toLowerCase()
  return !["pending", "unknown", "missing", "n/a", "na", "not_available"].includes(normalized)
}

function firstDoi(...values) {
  const match = values.filter(Boolean).join(" ").match(/10\.\d{4,9}\/[^\s;,]+/i)
  return match ? match[0].replace(/[.)]+$/, "") : null
}

function sourceMeta(row) {
  const provenance = row.provenance || {}
  const citation = row.citation || provenance.citation || "pending"
  const sourceUrl = row.sourceUrl || provenance.sourceUrl || "pending"
  return {
    sourceDatabase: row.sourceDatabase || provenance.sourceDatabase || provenance.database || "unknown",
    sourceRecordId: row.sourceRecordId || provenance.sourceRecordId || row.id || "unknown",
    sourceVersion: row.sourceVersion || provenance.sourceVersion || "pending",
    sourceUrl,
    citation,
    license: row.license || provenance.license || "pending",
    retrievedAt: row.retrievedAt || provenance.retrievedAt || "pending",
    curationStatus: row.curationStatus || provenance.curationStatus || "raw-import",
    doi: row.doi || provenance.doi || firstDoi(citation, sourceUrl),
  }
}

function confidenceFor(status) {
  if (status === "confirmed") return 1
  if (status === "normalized") return 0.8
  if (status === "derived") return 0.7
  if (status === "pending") return 0.4
  if (status === "ambiguous") return 0.2
  return 0
}

function fieldSource({ row, key, value, status, unit = "", notes, derivedFrom, normalizationMethod, isSynthetic = false, isOriginalField = false, isManualCuration = false, missingReason }) {
  const meta = sourceMeta(row)
  const missing = !present(value)
  const resolvedStatus = isSynthetic ? "synthetic" : (missing ? "missing" : status)
  return {
    value: missing ? "missing" : value,
    sourceDatabase: meta.sourceDatabase,
    sourceRecordId: meta.sourceRecordId,
    sourceVersion: meta.sourceVersion,
    sourceUrl: meta.sourceUrl,
    citation: meta.citation,
    license: meta.license,
    retrievedAt: meta.retrievedAt,
    curationStatus: isSynthetic ? "synthetic_fixture_expansion" : meta.curationStatus,
    confidence: confidenceFor(resolvedStatus),
    notes: notes || `V2.2 field-level provenance for ${key}.`,
    status: resolvedStatus,
    fieldQualityStatus: resolvedStatus,
    sourceType: missing ? "missing" : (isSynthetic ? "synthetic_fixture_expansion" : "source_database_field"),
    isOriginalField,
    isDerivedField: status === "derived" || Boolean(derivedFrom),
    isManualCuration,
    unitConverted: Boolean(normalizationMethod),
    hasAmbiguity: resolvedStatus === "ambiguous",
    scoringEligible: ["confirmed", "derived", "normalized"].includes(resolvedStatus),
    blocksVerifiedMetadata: ["missing", "ambiguous", "pending", "synthetic"].includes(resolvedStatus),
    unit,
    missingReason: missing ? (missingReason || `${key} is not available in current repository data.`) : undefined,
    derivedFrom: derivedFrom || undefined,
    normalizationMethod: normalizationMethod || undefined,
  }
}

function exactFieldSource(row, key, value, status = "confirmed", options = {}) {
  return fieldSource({
    row,
    key,
    value,
    status,
    isOriginalField: status === "confirmed",
    ...options,
  })
}

function numericVariant(value, variant, scale = 0.012) {
  if (!Number.isFinite(Number(value))) return null
  if (variant === 0) return Number(Number(value).toFixed(5))
  const centered = ((variant % 9) - 4) * scale
  const wave = (Math.floor(variant / 9) % 3) * scale * 0.5
  return Number((Number(value) * (1 + centered + wave)).toFixed(5))
}

function ratio(value, min, max) {
  if (!Number.isFinite(Number(value))) return 0.5
  return Math.max(0.01, Math.min(1, (Number(value) - min) / Math.max(1, max - min)))
}

function buildScores(record) {
  const dStab = Number((0.32 + ratio(record.surfaceArea, 400, 5600) * 0.22 + ratio(record.voidFraction, 0.1, 0.9) * 0.18 + ratio(record.poreSizeA, 3, 16) * 0.16).toFixed(3))
  const dBarrier = Number((0.3 + ratio(record.poreVolume, 0.1, 3.2) * 0.34 + ratio(record.pldA, 3, 15) * 0.18).toFixed(3))
  const dSelect = Number((0.28 + (1 - ratio(record.density, 0.3, 4.2)) * 0.24 + ratio(record.lcdA, 6, 30) * 0.2).toFixed(3))
  return {
    d_stab: Math.max(0.01, Math.min(1, dStab)),
    d_barrier: Math.max(0.01, Math.min(1, dBarrier)),
    d_select: Math.max(0.01, Math.min(1, dSelect)),
  }
}

function finalizeRecord(record) {
  const enriched = enrichRecordQuality(record)
  const gate = runVerifiedMetadataGate(enriched)
  const verifiedMetadata = gate.verifiedMetadata
  const fieldSources = {
    ...enriched.fieldSources,
    verifiedMetadataStatus: {
      ...enriched.fieldSources.verifiedMetadataStatus,
      value: verifiedMetadata ? "verified_metadata" : "not_verified",
      status: verifiedMetadata ? "confirmed" : "pending",
      fieldQualityStatus: verifiedMetadata ? "confirmed" : "pending",
      fieldQualityScore: verifiedMetadata ? 1 : 0.4,
      scoringEligible: verifiedMetadata,
      blocksVerifiedMetadata: !verifiedMetadata,
      notes: verifiedMetadata
        ? "All strict V2.2 metadata gate conditions passed for this source record."
        : "Strict V2.2 metadata gate remains blocked.",
    },
  }
  const gaps = FIELD_QUALITY_KEYS
    .filter(key => fieldSources[key]?.blocksVerifiedMetadata)
    .map(key => `${key}:${fieldSources[key].status}`)
  const verifiedBlockers = [...new Set(gate.verificationBlockers)]
  const qualityWarnings = [...new Set([...(enriched.qualityWarnings || []), ...verifiedBlockers])]
  return {
    ...enriched,
    ...gate,
    fieldSources,
    verifiedMetadata,
    verifiedMetadataStatus: verifiedMetadata ? "verified_metadata" : "not_verified",
    verifiedBlockers,
    verificationBlockers: verifiedBlockers,
    qualityWarnings,
    dataGaps: gaps,
    quarantined: Boolean(record.quarantined) || (gate.ambiguityWarnings || []).length > 0 || verifiedBlockers.some(blocker => blocker.includes("ambiguous")),
    notFinalRecommendation: true,
    previewBoundary: "Database Preview; not Verified Screening; not final recommendation.",
  }
}

function buildExactSeedRecord(row, index) {
  const meta = sourceMeta(row)
  const rawName = row.rawName || row.name || row.sourceRecordId || row.id
  const candidateId = `OPEN_MOF_SEED_${String(index + 1).padStart(4, "0")}`
  const displayName = rawName
  const baseRecord = {
    candidateId,
    id: candidateId,
    displayName,
    name: displayName,
    rawName,
    sourceDatabase: meta.sourceDatabase,
    sourceRecordId: meta.sourceRecordId,
    sourceVersion: meta.sourceVersion,
    sourceUrl: meta.sourceUrl,
    citation: meta.citation,
    exactCitation: meta.citation,
    license: meta.license,
    doi: meta.doi,
    retrievedAt: meta.retrievedAt,
    curationStatus: meta.curationStatus,
    surfaceArea: row.surfaceArea ?? null,
    poreSizeA: row.poreSizeA ?? null,
    pldA: row.pldA ?? row.poreSizeA ?? null,
    lcdA: row.lcdA ?? null,
    poreVolume: row.poreVolume ?? null,
    density: row.density ?? null,
    voidFraction: row.voidFraction ?? null,
    bandGap: row.bandGap ?? null,
    metalNode: row.metalNode || "missing",
    linker: row.linker || "pending",
    topology: row.topology || "pending",
    evidenceStatus: "source_database_preview",
    evidenceLevel: "B",
    sourceConfirmed: present(meta.sourceUrl) && present(meta.sourceRecordId),
    sourceStatus: present(meta.sourceUrl) && present(meta.sourceRecordId) ? "confirmed" : "pending",
    sourceUrlStatus: present(meta.sourceUrl) ? "confirmed" : "pending",
    licenseStatus: present(meta.license) ? "confirmed" : "pending",
    citationStatus: present(meta.citation) ? "confirmed" : "pending",
    doiStatus: present(meta.doi) ? "confirmed" : "pending",
    citationReady: present(meta.citation),
    sourceConfirmedDate: "2026-06-17",
    fixtureRecordMappingStatus: "confirmed",
    isSyntheticFixture: false,
    syntheticFixture: false,
    ambiguityWarnings: [],
    dataStatus: "database-preview-v2-2-exact-seed",
    confidence_Q: present(meta.sourceUrl) && present(meta.citation) ? 0.82 : 0.55,
  }
  baseRecord.fieldSources = {
    displayName: exactFieldSource(row, "displayName", displayName, "confirmed", { notes: "Display name is copied from the source seed record name field." }),
    rawName: exactFieldSource(row, "rawName", rawName, "confirmed", { notes: "Raw name is copied from the source seed record." }),
    sourceDatabase: exactFieldSource(row, "sourceDatabase", meta.sourceDatabase, "confirmed", { notes: "Source database is provided by the seed provenance block." }),
    sourceRecordId: exactFieldSource(row, "sourceRecordId", meta.sourceRecordId, "confirmed", { notes: "Source record id is the exact row identifier from the seed provenance block." }),
    sourceUrl: exactFieldSource(row, "sourceUrl", meta.sourceUrl, present(meta.sourceUrl) ? "confirmed" : "pending", { notes: "Source URL is reused only when present in the seed provenance block." }),
    citation: exactFieldSource(row, "citation", meta.citation, present(meta.citation) ? "confirmed" : "pending", { notes: "Citation is reused only when present in the seed provenance block." }),
    license: exactFieldSource(row, "license", meta.license, present(meta.license) ? "confirmed" : "pending", { notes: "License is reused only when present in the seed provenance block." }),
    surfaceArea: exactFieldSource(row, "surfaceArea", baseRecord.surfaceArea, present(baseRecord.surfaceArea) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.surfaceArea, notes: "Surface area is copied from the source seed descriptor." }),
    poreSizeA: exactFieldSource(row, "poreSizeA", baseRecord.poreSizeA, present(baseRecord.poreSizeA) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.poreSizeA, notes: "Pore size is copied from the source seed descriptor." }),
    pldA: exactFieldSource(row, "pldA", baseRecord.pldA, present(baseRecord.pldA) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.pldA, notes: "PLD is copied from the source seed descriptor." }),
    lcdA: exactFieldSource(row, "lcdA", baseRecord.lcdA, present(baseRecord.lcdA) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.lcdA, notes: "LCD is copied from the source seed descriptor." }),
    poreVolume: exactFieldSource(row, "poreVolume", baseRecord.poreVolume, present(baseRecord.poreVolume) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.poreVolume, notes: "Pore volume is copied from the source seed descriptor." }),
    density: exactFieldSource(row, "density", baseRecord.density, present(baseRecord.density) ? "derived" : "missing", { unit: NUMERIC_UNITS.density, derivedFrom: ["source density or source specific-volume field"], notes: "Density follows the seed processing note and is marked derived when available." }),
    voidFraction: exactFieldSource(row, "voidFraction", baseRecord.voidFraction, present(baseRecord.voidFraction) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.voidFraction, notes: "Void fraction is copied from the source seed descriptor when present." }),
    bandGap: exactFieldSource(row, "bandGap", baseRecord.bandGap, present(baseRecord.bandGap) ? "confirmed" : "missing", { unit: NUMERIC_UNITS.bandGap, notes: "Band gap is copied from the source seed descriptor when present." }),
    metalNode: exactFieldSource(row, "metalNode", baseRecord.metalNode, present(baseRecord.metalNode) ? "confirmed" : "missing", { notes: "Metal node is copied from the seed parser output." }),
    linker: exactFieldSource(row, "linker", baseRecord.linker, present(baseRecord.linker) ? "confirmed" : "pending", { notes: "Linker is copied from the seed parser output when present." }),
    topology: exactFieldSource(row, "topology", baseRecord.topology, present(baseRecord.topology) ? "confirmed" : "pending", { notes: "Topology is copied from the seed parser output when present." }),
    evidenceLevel: exactFieldSource(row, "evidenceLevel", "B", "derived", { derivedFrom: ["sourceConfirmed", "citationStatus", "licenseStatus"], notes: "Evidence level is a preview confidence tier, not a measured label." }),
    verifiedMetadataStatus: exactFieldSource(row, "verifiedMetadataStatus", "pending", "pending", { notes: "Updated after strict V2.2 verified metadata gate." }),
  }
  Object.assign(baseRecord, buildScores(baseRecord))
  baseRecord.G = baseRecord.sourceConfirmed ? 1 : 0
  return finalizeRecord(baseRecord)
}

function buildSyntheticRecord(row, syntheticIndex, seedIndex) {
  const meta = sourceMeta(row)
  const variant = Math.floor(syntheticIndex / 50) + 1
  const candidateId = `SYNTHETIC_FIXTURE_SDBP_${String(syntheticIndex + 1).padStart(4, "0")}`
  const rawName = row.rawName || row.name || row.sourceRecordId || row.id || candidateId
  const displayName = `${rawName} preview fixture ${variant}`
  const record = {
    candidateId,
    id: candidateId,
    displayName,
    name: displayName,
    rawName,
    sourceDatabase: meta.sourceDatabase,
    sourceRecordId: candidateId,
    sourceVersion: meta.sourceVersion,
    sourceUrl: meta.sourceUrl,
    citation: meta.citation,
    exactCitation: meta.citation,
    license: meta.license,
    doi: meta.doi,
    retrievedAt: meta.retrievedAt,
    curationStatus: "synthetic_fixture_expansion",
    isSyntheticFixture: true,
    syntheticFixture: true,
    syntheticFixtureId: candidateId,
    syntheticFixtureSourceRecordId: meta.sourceRecordId,
    syntheticFixtureSeedIndex: seedIndex,
    surfaceArea: numericVariant(row.surfaceArea, variant, 0.015),
    poreSizeA: numericVariant(row.poreSizeA, variant, 0.01),
    pldA: numericVariant(row.pldA ?? row.poreSizeA, variant, 0.01),
    lcdA: numericVariant(row.lcdA, variant, 0.01),
    poreVolume: numericVariant(row.poreVolume, variant, 0.015),
    density: numericVariant(row.density, variant, 0.01),
    voidFraction: numericVariant(row.voidFraction, variant, 0.004),
    bandGap: numericVariant(row.bandGap, variant, 0.01),
    metalNode: row.metalNode || "missing",
    linker: row.linker || "pending",
    topology: row.topology || "pending",
    evidenceStatus: "synthetic_fixture_database_preview_only",
    evidenceLevel: "D",
    sourceConfirmed: present(meta.sourceUrl) && present(meta.sourceRecordId),
    sourceStatus: present(meta.sourceUrl) && present(meta.sourceRecordId) ? "confirmed" : "pending",
    sourceUrlStatus: present(meta.sourceUrl) ? "confirmed" : "pending",
    licenseStatus: present(meta.license) ? "confirmed" : "pending",
    citationStatus: present(meta.citation) ? "confirmed" : "pending",
    doiStatus: present(meta.doi) ? "confirmed" : "pending",
    citationReady: present(meta.citation),
    fixtureRecordMappingStatus: "synthetic_fixture",
    ambiguityWarnings: syntheticIndex % 23 === 0 ? ["synthetic fixture topology must not enter ranking recommendation without manual review"] : [],
    dataStatus: "database-preview-v2-2-synthetic-fixture",
    confidence_Q: 0.35,
  }
  record.fieldSources = {
    displayName: fieldSource({ row, key: "displayName", value: displayName, status: "synthetic", isSynthetic: true, notes: "Display name is generated only for the synthetic fixture preview row." }),
    rawName: fieldSource({ row, key: "rawName", value: rawName, status: "confirmed", notes: "Raw name comes from the underlying seed row; the record itself is synthetic." }),
    sourceDatabase: fieldSource({ row, key: "sourceDatabase", value: meta.sourceDatabase, status: "confirmed", notes: "Underlying source database is preserved from the seed row." }),
    sourceRecordId: fieldSource({ row, key: "sourceRecordId", value: candidateId, status: "synthetic", isSynthetic: true, notes: `Synthetic fixture id derived from source record ${meta.sourceRecordId}.` }),
    sourceUrl: fieldSource({ row, key: "sourceUrl", value: meta.sourceUrl, status: present(meta.sourceUrl) ? "confirmed" : "pending", notes: "Underlying source URL is preserved for provenance only; it does not verify the synthetic fixture." }),
    citation: fieldSource({ row, key: "citation", value: meta.citation, status: present(meta.citation) ? "confirmed" : "pending", notes: "Underlying citation is preserved for provenance only; it does not verify the synthetic fixture." }),
    license: fieldSource({ row, key: "license", value: meta.license, status: present(meta.license) ? "confirmed" : "pending", notes: "Underlying license is preserved for provenance only; it does not verify the synthetic fixture." }),
    surfaceArea: fieldSource({ row, key: "surfaceArea", value: record.surfaceArea, status: present(record.surfaceArea) ? "normalized" : "missing", unit: NUMERIC_UNITS.surfaceArea, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    poreSizeA: fieldSource({ row, key: "poreSizeA", value: record.poreSizeA, status: present(record.poreSizeA) ? "normalized" : "missing", unit: NUMERIC_UNITS.poreSizeA, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    pldA: fieldSource({ row, key: "pldA", value: record.pldA, status: present(record.pldA) ? "normalized" : "missing", unit: NUMERIC_UNITS.pldA, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    lcdA: fieldSource({ row, key: "lcdA", value: record.lcdA, status: present(record.lcdA) ? "normalized" : "missing", unit: NUMERIC_UNITS.lcdA, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    poreVolume: fieldSource({ row, key: "poreVolume", value: record.poreVolume, status: present(record.poreVolume) ? "normalized" : "missing", unit: NUMERIC_UNITS.poreVolume, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    density: fieldSource({ row, key: "density", value: record.density, status: present(record.density) ? "derived" : "missing", unit: NUMERIC_UNITS.density, derivedFrom: ["seed density or source specific-volume field"], notes: "Density is inherited from seed-derived value and deterministically perturbed for preview." }),
    voidFraction: fieldSource({ row, key: "voidFraction", value: record.voidFraction, status: present(record.voidFraction) ? "normalized" : "missing", unit: NUMERIC_UNITS.voidFraction, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    bandGap: fieldSource({ row, key: "bandGap", value: record.bandGap, status: present(record.bandGap) ? "normalized" : "missing", unit: NUMERIC_UNITS.bandGap, normalizationMethod: "deterministic preview perturbation from seed value; not a new measurement" }),
    metalNode: fieldSource({ row, key: "metalNode", value: record.metalNode, status: present(record.metalNode) ? "derived" : "missing", derivedFrom: ["seed metal node parser"], notes: "Metal node is parser-derived for preview." }),
    linker: fieldSource({ row, key: "linker", value: record.linker, status: present(record.linker) ? "pending" : "missing", notes: "Linker remains pending until manual curation." }),
    topology: fieldSource({ row, key: "topology", value: record.topology, status: record.ambiguityWarnings.length ? "ambiguous" : (present(record.topology) ? "pending" : "missing"), notes: "Topology is not used for verified metadata while synthetic or ambiguous." }),
    evidenceLevel: fieldSource({ row, key: "evidenceLevel", value: "D", status: "derived", derivedFrom: ["synthetic fixture status"], notes: "Evidence level is lowered because this is a synthetic preview row." }),
    verifiedMetadataStatus: fieldSource({ row, key: "verifiedMetadataStatus", value: "not_verified", status: "pending", notes: "Synthetic fixtures cannot pass verified metadata." }),
  }
  Object.assign(record, buildScores(record))
  record.G = record.ambiguityWarnings.length ? 0 : 1
  return finalizeRecord(record)
}

function buildSummaries(records, audit) {
  const verifiedCount = records.filter(row => row.verifiedMetadata).length
  const sourceConfirmedCount = records.filter(row => row.sourceConfirmed).length
  const citationReadyCount = records.filter(row => row.citationReady || ["confirmed", "ready"].includes(String(row.citationStatus || "").toLowerCase())).length
  const descriptorCompleteCount = records.filter(row => Number(row.descriptorCompleteness) >= 0.85 || Number(row.descriptorCompleteness?.ratio) >= 0.85).length
  const priorityStillZero = PRIORITY_CANDIDATE_STATUS.every(row => !row.verifiedMetadata)
  const summary = {
    version: VERSION,
    previewLabel: "Database Preview",
    label: "Database Preview",
    notFinalRecommendation: true,
    notFinalRecommendationLabel: "Not Final Recommendation",
    totalCandidates: records.length,
    rankedCandidates: records.filter(row => Number(row.G) !== 0 && !row.quarantined).length,
    descriptorCompleteCandidates: descriptorCompleteCount,
    sourceConfirmedCandidates: sourceConfirmedCount,
    citationReadyCandidates: citationReadyCount,
    licenseConfirmedCandidates: audit.summary.licenseConfirmedCount,
    doiConfirmedCandidates: audit.summary.doiConfirmedCount,
    sourceUrlConfirmedCandidates: audit.summary.sourceUrlConfirmedCount,
    verifiedMetadataCandidates: verifiedCount,
    verifiedMetadataCount: verifiedCount,
    quarantinedCandidates: records.filter(row => row.quarantined).length,
    syntheticFixtureCandidates: records.filter(row => row.isSyntheticFixture).length,
    dataGapCount: records.filter(row => row.dataGaps?.length).length,
    fieldMissingCount: audit.summary.missingFieldCount,
    highRiskRecordCount: audit.summary.highRiskRecordCount,
    descriptorCoverage: audit.summary.descriptorCoverage,
    provenanceCoverage: audit.summary.provenanceCoverage,
    verifiedMetadataBreakthrough: verifiedCount >= 1,
    verifiedMetadataBreakthroughNote: verifiedCount >= 1
      ? "Strict metadata gate reached by exact non-synthetic seed records with source URL, citation, license, mapping, and critical field provenance already present in repository data."
      : "No candidate reached strict verified metadata; no evidence was fabricated.",
    priorityCandidateBreakthrough: false,
    priorityCandidateStatus: priorityStillZero ? "priority Al candidates remain blocked offline" : "priority Al candidate verified",
    whyPriorityStillZero: priorityStillZero
      ? "MIL-53(Al), CAU-10(Al), MIL-100(Al), DUT-4(Al), and MIL-101(Al) still lack enough offline sourceUrl/license/exact mapping evidence in the repository; MIL-101(Al) remains ambiguity quarantine."
      : undefined,
    candidateClosestToVerified: "MIL-53(Al)",
    remainingBlockers: [...new Set(PRIORITY_CANDIDATE_STATUS.flatMap(row => row.remainingBlockers || []))],
    neededManualActions: [...new Set(PRIORITY_CANDIDATE_STATUS.flatMap(row => row.neededManualActions || []))],
    fieldStatusCounts: audit.fieldCoverage.reduce((counts, row) => {
      for (const key of ["confirmed", "pending", "ambiguous", "missing", "derived", "normalized", "synthetic", "not_available"]) {
        counts[key] = (counts[key] || 0) + (row[key] || 0)
      }
      return counts
    }, {}),
    noFabricationPolicy: "No DOI/license/sourceUrl/citation values are invented. Unknown values remain pending, ambiguous, missing, or synthetic.",
    databaseBoundary: "Database Preview only. Not Verified Screening. Not Final Recommendation.",
    zeroVerifiedNotice: "当前为 Database Preview，不是 Verified Screening。结果仅用于透明筛选流程展示和数据缺口识别。",
  }
  return summary
}

export function buildScalableDatabasePreview(seedRows = readJson(seedFile)) {
  const exactRecords = seedRows.map((row, index) => buildExactSeedRecord(row, index))
  const syntheticCount = Math.max(0, TARGET_RECORDS - exactRecords.length)
  const syntheticRecords = Array.from({ length: syntheticCount }, (_, index) => buildSyntheticRecord(seedRows[index % seedRows.length], index, index % seedRows.length))
  const records = [...exactRecords, ...syntheticRecords]
  const audit = buildDataQualityAudit(records, {
    version: VERSION,
    generatedAt: GENERATED_AT,
    runId: "v2-2-scalable-database-preview-2026-06-17",
  })
  const finalRecords = audit.records.map(row => {
    const gate = runVerifiedMetadataGate(row)
    const verifiedMetadata = gate.verifiedMetadata
    return {
      ...row,
      ...gate,
      verifiedMetadata,
      verifiedMetadataStatus: verifiedMetadata ? "verified_metadata" : "not_verified",
      fieldSources: {
        ...row.fieldSources,
        verifiedMetadataStatus: {
          ...row.fieldSources?.verifiedMetadataStatus,
          value: verifiedMetadata ? "verified_metadata" : "not_verified",
          status: verifiedMetadata ? "confirmed" : "pending",
          fieldQualityStatus: verifiedMetadata ? "confirmed" : "pending",
          fieldQualityScore: verifiedMetadata ? 1 : 0.4,
          scoringEligible: verifiedMetadata,
          blocksVerifiedMetadata: !verifiedMetadata,
        },
      },
    }
  })
  const finalAudit = buildDataQualityAudit(finalRecords, {
    version: VERSION,
    generatedAt: GENERATED_AT,
    runId: "v2-2-scalable-database-preview-2026-06-17",
  })
  const summary = buildSummaries(finalRecords, finalAudit)
  const healthSummary = {
    ...buildDatabaseHealthSummary(finalAudit),
    previewLabel: "Database Preview",
    notFinalRecommendationLabel: "Not Final Recommendation",
  }
  const fieldCoverage = {
    version: VERSION,
    totalCandidates: finalRecords.length,
    fieldCoverage: finalAudit.fieldCoverage,
    notFinalRecommendation: true,
  }
  const verifiedBlockers = {
    version: VERSION,
    totalCandidates: finalRecords.length,
    verifiedMetadataCount: summary.verifiedMetadataCount,
    blockerCounts: finalAudit.blockerCounts,
    priorityCandidateStatus: PRIORITY_CANDIDATE_STATUS,
    whyStillZero: summary.verifiedMetadataCount === 0
      ? "Strict gate remains blocked for every record; no evidence was fabricated."
      : undefined,
    priorityWhyStillZero: summary.whyPriorityStillZero,
    remainingBlockers: summary.remainingBlockers,
    neededManualActions: summary.neededManualActions,
    candidateClosestToVerified: summary.candidateClosestToVerified,
    syntheticFixturePolicy: "Synthetic fixture rows are explicit and always blocked from verified metadata.",
    notFinalRecommendation: true,
  }
  return {
    records: finalRecords,
    summary,
    qualityAudit: {
      ...finalAudit,
      records: undefined,
      sampleRecords: finalAudit.records.slice(0, 20).map(row => ({
        candidateId: row.candidateId,
        displayName: row.displayName,
        recordQualityScore: row.recordQualityScore,
        provenanceCompleteness: row.provenanceCompleteness,
        descriptorCompleteness: row.descriptorCompleteness,
        verificationReadiness: row.verificationReadiness,
        verifiedMetadata: row.verifiedMetadata,
        verifiedBlockers: row.verifiedBlockers || row.verificationBlockers,
      })),
    },
    fieldCoverage,
    verifiedBlockers,
    healthSummary,
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { records, summary, qualityAudit, fieldCoverage, verifiedBlockers, healthSummary } = buildScalableDatabasePreview()
  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(path.join(outRoot, "scalable_database_preview_records.json"), `${JSON.stringify(records, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "scalable_database_preview_summary.json"), `${JSON.stringify(summary, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "scalable_database_quality_audit.json"), `${JSON.stringify(qualityAudit, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "scalable_database_field_coverage.json"), `${JSON.stringify(fieldCoverage, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "scalable_database_verified_blockers.json"), `${JSON.stringify(verifiedBlockers, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "scalable_database_health_summary.json"), `${JSON.stringify(healthSummary, null, 2)}\n`)
  console.log(`V2.2 scalable database preview built: ${records.length} candidates`)
  console.log(`verifiedMetadataCount=${summary.verifiedMetadataCount} sourceConfirmed=${summary.sourceConfirmedCandidates} syntheticFixtures=${summary.syntheticFixtureCandidates}`)
  console.log(`priorityCandidateStatus=${summary.priorityCandidateStatus}`)
}
