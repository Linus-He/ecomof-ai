// V2.1 Medium Database Preview builder.
//
// This creates a bounded, offline Database Preview fixture for EcoScreen scale
// and provenance UI testing. It never downloads data and never fabricates DOI,
// license, citation, or source URL. Synthetic fixture ids are explicit and all
// records keep verifiedMetadata=false until a strict manual gate confirms them.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const seedFile = path.join(repoRoot, "public", "data", "open_mof_seed_candidates.json")
const outRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_1")

const FIELD_KEYS = [
  "displayName",
  "surfaceArea",
  "poreSizeA",
  "pldA",
  "lcdA",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "metalNode",
  "linker",
  "topology",
  "evidenceLevel",
  "sourceStatus",
  "verifiedMetadataStatus",
]

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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

function present(value) {
  if (value === null || value === undefined || value === "") return false
  const normalized = String(value).trim().toLowerCase()
  return !["pending", "unknown", "missing", "n/a", "na"].includes(normalized)
}

function sourceMeta(row) {
  const provenance = row.provenance || {}
  return {
    sourceDatabase: row.sourceDatabase || provenance.sourceDatabase || provenance.database || "unknown",
    sourceRecordId: row.sourceRecordId || provenance.sourceRecordId || "unknown",
    sourceVersion: row.sourceVersion || provenance.sourceVersion || "pending",
    sourceUrl: row.sourceUrl || provenance.sourceUrl || "pending",
    citation: row.citation || provenance.citation || "pending",
    license: row.license || provenance.license || "pending",
    retrievedAt: row.retrievedAt || provenance.retrievedAt || "pending",
  }
}

function confidenceFor(status) {
  if (status === "confirmed") return 0.82
  if (status === "derived" || status === "normalized") return 0.66
  if (status === "ambiguous") return 0.28
  if (status === "not_applicable") return 0.1
  return 0
}

function fieldSource({ row, key, value, status, variant, unit = "", notes, derivedFrom = null, normalizationMethod = null }) {
  const meta = sourceMeta(row)
  const missing = !present(value)
  const resolvedStatus = missing ? "missing" : status
  return {
    value: missing ? "unknown" : value,
    sourceDatabase: meta.sourceDatabase,
    sourceRecordId: meta.sourceRecordId,
    sourceVersion: meta.sourceVersion,
    sourceUrl: meta.sourceUrl,
    citation: meta.citation,
    license: meta.license,
    retrievedAt: meta.retrievedAt,
    curationStatus: "synthetic_fixture_pending_verification",
    confidence: confidenceFor(resolvedStatus),
    notes: notes || `V2.1 Database Preview field ${key}; synthetic fixture variant ${variant}.`,
    status: resolvedStatus,
    sourceType: resolvedStatus === "missing" ? "missing" : "database_preview_fixture",
    isOriginalField: resolvedStatus === "confirmed",
    isDerivedField: resolvedStatus === "derived" || Boolean(derivedFrom),
    isManualCuration: false,
    unitConverted: resolvedStatus === "normalized",
    hasAmbiguity: resolvedStatus === "ambiguous",
    scoringEligible: ["confirmed", "derived", "normalized"].includes(resolvedStatus),
    blocksVerifiedMetadata: resolvedStatus !== "confirmed",
    unit,
    missingReason: missing ? `${key} is not available in the seed record; left unknown in preview.` : undefined,
    derivedFrom: derivedFrom || undefined,
    normalizationMethod: normalizationMethod || undefined,
  }
}

function numericVariant(value, variant, scale = 0.018) {
  if (!Number.isFinite(Number(value))) return null
  const n = Number(value)
  const centered = variant - 2
  return Number((n * (1 + centered * scale)).toFixed(5))
}

function ratio(value, min, max) {
  if (!Number.isFinite(Number(value))) return 0.5
  return Math.max(0.01, Math.min(1, (Number(value) - min) / Math.max(1, max - min)))
}

function buildRecord(row, index) {
  const variant = Math.floor(index / 50)
  const ordinal = index + 1
  const candidateId = `SYNTHETIC_FIXTURE_MDBP_${String(ordinal).padStart(4, "0")}`
  const meta = sourceMeta(row)
  const rawName = row.rawName || row.name || row.sourceRecordId || candidateId
  const displayName = `${rawName} · preview ${variant + 1}`
  const surfaceArea = numericVariant(row.surfaceArea, variant)
  const poreSizeA = numericVariant(row.poreSizeA, variant, 0.01)
  const pldA = numericVariant(row.pldA ?? row.poreSizeA, variant, 0.01)
  const lcdA = numericVariant(row.lcdA, variant, 0.01)
  const poreVolume = numericVariant(row.poreVolume, variant, 0.018)
  const density = numericVariant(row.density, variant, 0.012)
  const voidFraction = numericVariant(row.voidFraction, variant, 0.005)
  const bandGap = row.bandGap ?? null
  const metalNode = row.metalNode || "unknown"
  const linker = row.linker || "pending"
  const topology = row.topology || "pending"
  const ambiguousTopology = ordinal % 17 === 0
  const sourceConfirmed = present(meta.sourceUrl) && present(meta.sourceRecordId)
  const citationReady = present(meta.citation)
  const fieldSources = {
    displayName: fieldSource({ row, key: "displayName", value: displayName, status: "derived", variant, derivedFrom: ["rawName", "sourceRecordId"], notes: "Display name is derived for preview readability; it is not an external source assertion." }),
    surfaceArea: fieldSource({ row, key: "surfaceArea", value: surfaceArea, status: variant === 0 ? "confirmed" : "normalized", variant, unit: NUMERIC_UNITS.surfaceArea, normalizationMethod: variant === 0 ? null : "deterministic preview perturbation from seed value; not a new measurement" }),
    poreSizeA: fieldSource({ row, key: "poreSizeA", value: poreSizeA, status: variant === 0 ? "confirmed" : "normalized", variant, unit: NUMERIC_UNITS.poreSizeA, normalizationMethod: variant === 0 ? null : "deterministic preview perturbation from seed value; not a new measurement" }),
    pldA: fieldSource({ row, key: "pldA", value: pldA, status: variant === 0 ? "confirmed" : "normalized", variant, unit: NUMERIC_UNITS.pldA, normalizationMethod: variant === 0 ? null : "deterministic preview perturbation from seed value; not a new measurement" }),
    lcdA: fieldSource({ row, key: "lcdA", value: lcdA, status: variant === 0 ? "confirmed" : "normalized", variant, unit: NUMERIC_UNITS.lcdA, normalizationMethod: variant === 0 ? null : "deterministic preview perturbation from seed value; not a new measurement" }),
    poreVolume: fieldSource({ row, key: "poreVolume", value: poreVolume, status: variant === 0 ? "confirmed" : "normalized", variant, unit: NUMERIC_UNITS.poreVolume, normalizationMethod: variant === 0 ? null : "deterministic preview perturbation from seed value; not a new measurement" }),
    density: fieldSource({ row, key: "density", value: density, status: "derived", variant, unit: NUMERIC_UNITS.density, derivedFrom: ["density or specific-volume field in seed record"], notes: "Density is treated as derived/pending verification in this preview; it blocks verified metadata." }),
    voidFraction: fieldSource({ row, key: "voidFraction", value: voidFraction, status: "normalized", variant, unit: NUMERIC_UNITS.voidFraction, normalizationMethod: "seed value normalized to preview schema" }),
    bandGap: fieldSource({ row, key: "bandGap", value: bandGap, status: present(bandGap) ? "confirmed" : "missing", variant, unit: NUMERIC_UNITS.bandGap }),
    metalNode: fieldSource({ row, key: "metalNode", value: metalNode, status: present(metalNode) ? "derived" : "missing", variant, derivedFrom: ["seed metalNode parser"], notes: "Metal node is parser-derived and must be manually checked before verified metadata." }),
    linker: fieldSource({ row, key: "linker", value: linker, status: present(linker) ? "pending" : "missing", variant }),
    topology: fieldSource({ row, key: "topology", value: topology, status: ambiguousTopology ? "ambiguous" : (present(topology) ? "pending" : "missing"), variant, notes: ambiguousTopology ? "Topology conflicts with fixture mapping; quarantined from ranking recommendation." : "Topology is pending manual curation." }),
    evidenceLevel: fieldSource({ row, key: "evidenceLevel", value: sourceConfirmed ? "C" : "D", status: "derived", variant, derivedFrom: ["sourceConfirmed", "citationReady"], notes: "Evidence level is a preview confidence proxy, not a measured label." }),
    sourceStatus: fieldSource({ row, key: "sourceStatus", value: sourceConfirmed ? "confirmed" : "pending", status: sourceConfirmed ? "confirmed" : "pending", variant, notes: "Source status reflects local source metadata availability only." }),
    verifiedMetadataStatus: fieldSource({ row, key: "verifiedMetadataStatus", value: false, status: "pending", variant, notes: "verifiedMetadata remains false until DOI/license/source/citation/mapping gates all pass." }),
  }
  const dataGaps = Object.entries(fieldSources)
    .filter(([, source]) => source.blocksVerifiedMetadata)
    .map(([key, source]) => `${key}:${source.status}`)
  const descriptorCompleteness = Object.fromEntries(FIELD_KEYS.map(key => [key, fieldSources[key].status]))
  descriptorCompleteness.ratio = Number((FIELD_KEYS.filter(key => fieldSources[key].scoringEligible).length / FIELD_KEYS.length).toFixed(3))
  const dStab = Number((0.35 + ratio(surfaceArea, 400, 5600) * 0.25 + ratio(voidFraction, 0.1, 0.9) * 0.18 + ratio(poreSizeA, 3, 16) * 0.12).toFixed(3))
  const dBarrier = Number((0.28 + ratio(poreVolume, 0.1, 3.2) * 0.35 + ratio(pldA, 3, 15) * 0.2).toFixed(3))
  const dSelect = Number((0.3 + (1 - ratio(density, 0.3, 4.2)) * 0.25 + ratio(lcdA, 6, 30) * 0.22).toFixed(3))
  return {
    candidateId,
    id: candidateId,
    displayName,
    name: displayName,
    rawName,
    sourceDatabase: meta.sourceDatabase,
    sourceRecordId: `${candidateId} derived-from ${meta.sourceRecordId}`,
    sourceVersion: meta.sourceVersion,
    sourceUrl: meta.sourceUrl,
    citation: meta.citation,
    license: meta.license,
    retrievedAt: meta.retrievedAt,
    curationStatus: "synthetic_fixture_pending_verification",
    descriptorCompleteness,
    fieldSources,
    surfaceArea,
    poreSizeA,
    pldA,
    lcdA,
    poreVolume,
    density,
    voidFraction,
    bandGap,
    metalNode,
    linker,
    topology,
    evidenceStatus: "database_preview_only",
    sourceConfirmed,
    sourceStatus: sourceConfirmed ? "confirmed" : "pending",
    citationReady,
    citationStatus: citationReady ? "ready" : "pending",
    verifiedMetadata: false,
    fixtureRecordMappingStatus: "synthetic_fixture_pending_verification",
    ambiguityWarnings: ambiguousTopology ? ["topology field is ambiguous in this synthetic fixture and is quarantined from ranking recommendation"] : [],
    quarantined: ambiguousTopology,
    dataGaps,
    evidenceLevel: sourceConfirmed ? "C" : "D",
    G: ambiguousTopology ? 0 : 1,
    confidence_Q: sourceConfirmed && citationReady ? 0.58 : 0.42,
    d_stab: Math.max(0.01, Math.min(1, dStab)),
    d_barrier: Math.max(0.01, Math.min(1, dBarrier)),
    d_select: Math.max(0.01, Math.min(1, dSelect)),
    dataStatus: "database-preview-v2-1",
    notFinalRecommendation: true,
    previewBoundary: "Database Preview; not Verified Screening; not final recommendation.",
  }
}

function buildSummaries(records) {
  const statusCounts = {}
  const fieldCoverage = {}
  const gapCounts = {}
  for (const record of records) {
    for (const key of FIELD_KEYS) {
      const status = record.fieldSources[key].status
      statusCounts[status] = (statusCounts[status] || 0) + 1
      fieldCoverage[key] ||= { confirmed: 0, pending: 0, ambiguous: 0, derived: 0, normalized: 0, missing: 0, not_applicable: 0, scoringEligible: 0, blocksVerifiedMetadata: 0 }
      fieldCoverage[key][status] = (fieldCoverage[key][status] || 0) + 1
      if (record.fieldSources[key].scoringEligible) fieldCoverage[key].scoringEligible += 1
      if (record.fieldSources[key].blocksVerifiedMetadata) {
        fieldCoverage[key].blocksVerifiedMetadata += 1
        gapCounts[key] = (gapCounts[key] || 0) + 1
      }
    }
  }
  const summary = {
    version: "V2.1-Medium-Database-Preview",
    previewLabel: "Database Preview",
    notFinalRecommendation: true,
    totalCandidates: records.length,
    rankedCandidates: records.filter(row => Number(row.G) !== 0 && !row.quarantined).length,
    descriptorCompleteCandidates: records.filter(row => FIELD_KEYS.every(key => row.fieldSources[key].scoringEligible)).length,
    sourceConfirmedCandidates: records.filter(row => row.sourceConfirmed).length,
    citationReadyCandidates: records.filter(row => row.citationReady).length,
    verifiedMetadataCandidates: records.filter(row => row.verifiedMetadata).length,
    verifiedMetadataCount: records.filter(row => row.verifiedMetadata).length,
    quarantinedCandidates: records.filter(row => row.quarantined).length,
    dataGapCount: records.filter(row => row.dataGaps.length).length,
    fieldStatusCounts: statusCounts,
    noFabricationPolicy: "No DOI/license/sourceUrl/citation values are invented. Unknown values remain pending/unknown.",
    zeroVerifiedNotice: "当前为 Database Preview，不是 Verified Screening。结果仅用于透明筛选流程展示和数据缺口识别。",
  }
  return {
    summary,
    descriptorCoverage: {
      version: summary.version,
      totalCandidates: records.length,
      fieldCoverage,
    },
    sourceStatusSummary: {
      version: summary.version,
      sourceConfirmedCount: summary.sourceConfirmedCandidates,
      citationReadyCount: summary.citationReadyCandidates,
      verifiedMetadataCount: summary.verifiedMetadataCount,
      sourceDatabaseCounts: records.reduce((acc, row) => {
        acc[row.sourceDatabase] = (acc[row.sourceDatabase] || 0) + 1
        return acc
      }, {}),
    },
    dataGapSummary: {
      version: summary.version,
      totalCandidatesWithGaps: summary.dataGapCount,
      byField: Object.entries(gapCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count),
      verifiedMetadataBlockers: ["synthetic fixture pending verification", "missing bandGap", "derived density", "pending linker", "pending/ambiguous topology"],
    },
  }
}

export function buildMediumDatabasePreview(seedRows = readJson(seedFile)) {
  const records = Array.from({ length: 250 }, (_, index) => buildRecord(seedRows[index % seedRows.length], index))
  return { records, ...buildSummaries(records) }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { records, summary, descriptorCoverage, sourceStatusSummary, dataGapSummary } = buildMediumDatabasePreview()
  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(path.join(outRoot, "medium_database_preview_records.json"), `${JSON.stringify(records, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "medium_database_preview_summary.json"), `${JSON.stringify(summary, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "medium_database_descriptor_coverage.json"), `${JSON.stringify(descriptorCoverage, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "medium_database_source_status_summary.json"), `${JSON.stringify(sourceStatusSummary, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "medium_database_data_gap_summary.json"), `${JSON.stringify(dataGapSummary, null, 2)}\n`)
  console.log(`V2.1 medium database preview built: ${records.length} candidates`)
  console.log(`verifiedMetadataCount=${summary.verifiedMetadataCount} sourceConfirmed=${summary.sourceConfirmedCandidates} dataGapCount=${summary.dataGapCount}`)
}
