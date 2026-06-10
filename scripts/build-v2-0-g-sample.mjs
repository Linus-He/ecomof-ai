// V2.0-G small verified database sample generator (offline, reproducible).
//
// Derives a bounded (<= 200 record) curated sample from the existing local CoRE
// index fixture and reshapes it into the V2.0-G record schema. It does NOT go to
// the network, does NOT load the full database, and does NOT fabricate DOI /
// citation / license / sourceUrl — those stay absent (pending) and the metadata
// gate keeps such records at partial_metadata / preview_only / blocked honestly.
// Proxy descriptors (voidFraction, stabilityProxy, hydrophilicityProxy,
// openMetalSiteProxy) are clearly labeled as computed provenance.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { summarizeMetadataVerification, normalizeMetadataVerification } from "../src/utils/databaseIndex/metadataVerification.js"
import { descriptorCompletenessPercent } from "../src/utils/databaseIndex/databaseIndexFormatters.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const sourceFixture = path.join(repoRoot, "public", "data", "database_index", "core_mof_index_parts", "core_mof_index_part_001.json")
const outRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_g")

const SAMPLE_SIZE = 120

function round(value, digits = 3) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function openMetalSiteProxy(topology, hasAlNode) {
  const topo = String(topology || "").toLowerCase()
  if (topo.includes("mil-100") || topo.includes("mil-101")) return 0.72
  if (topo.includes("uio") || topo.includes("mof-74")) return 0.66
  if (topo.includes("mil-53") || topo.includes("cau-10")) return 0.22
  return hasAlNode ? 0.35 : 0.45
}

function stabilityProxy(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("robust") || value.includes("verified")) return 0.82
  if (value.includes("indexed_proxy") || value.includes("proxy")) return 0.6
  if (value.includes("pending")) return 0.35
  return 0.45
}

function descriptorProvenanceStatusFor(percent) {
  if (percent >= 90) return "complete"
  if (percent >= 40) return "partial"
  return "missing"
}

function reshape(record, index) {
  const descriptors = {
    surfaceArea: record.surfaceArea ?? null,
    poreSizeA: record.pldA ?? null,
    pldA: record.pldA ?? null,
    lcdA: record.lcdA ?? null,
    poreVolume: record.poreVolume ?? null,
    density: record.density ?? null,
    bandGap: record.bandGap ?? null,
  }
  // Clearly-labeled computed proxy descriptors.
  if (record.poreVolume && record.density) {
    descriptors.voidFraction = round(record.poreVolume / (record.poreVolume + 1 / record.density))
  }
  descriptors.stabilityProxy = stabilityProxy(record.hydrothermalEvidenceStatus)
  descriptors.hydrophilicityProxy = record.hasAlNode ? 0.55 : 0.42
  descriptors.openMetalSiteProxy = openMetalSiteProxy(record.topology, record.hasAlNode)

  const percent = Number(record.descriptorCompleteness?.percent ?? descriptorCompletenessPercent(record))

  return {
    recordId: record.id,
    sourceDatabase: record.sourceDatabase || "CoRE MOF",
    sourceRecordId: record.sourceRecordId || record.id,
    sourceVersion: "local curated snapshot",
    // No sourceUrl / doi / citation / license — these remain pending (not fabricated).
    retrievedAt: "2026-06",
    displayName: record.displayName || record.id,
    metalNode: Array.isArray(record.metals) ? record.metals[0] : record.metals || null,
    linker: null,
    topology: record.topology || null,
    descriptors,
    descriptorProvenance: {
      source: "computed",
      method: "Reshaped from CoRE MOF local index snapshot; proxy descriptors derived by documented rules.",
      retrievedAt: "2026-06",
    },
    metadataVerification: {
      descriptorProvenanceStatus: descriptorProvenanceStatusFor(percent),
    },
    notFinalRecommendation: true,
  }
}

const fixture = JSON.parse(fs.readFileSync(sourceFixture, "utf8"))
const sourceRecords = (fixture.records || []).slice(0, SAMPLE_SIZE)
const records = sourceRecords.map(reshape)

const metadata = summarizeMetadataVerification(records)
const descriptorCounts = { complete: 0, partial: 0, missingCritical: 0 }
const sourceDistribution = {}
const provenanceDistribution = {}
for (const record of records) {
  const percent = Number(record.descriptors ? descriptorCompletenessPercent(record) : 0)
  if (percent >= 80) descriptorCounts.complete += 1
  else if (percent >= 40) descriptorCounts.partial += 1
  else descriptorCounts.missingCritical += 1
  sourceDistribution[record.sourceDatabase] = (sourceDistribution[record.sourceDatabase] || 0) + 1
  const src = record.descriptorProvenance?.source || "unknown"
  provenanceDistribution[src] = (provenanceDistribution[src] || 0) + 1
}

const eligible = records.filter(r => normalizeMetadataVerification(r).verificationLevel === "verified_metadata").length
const blocked = records.filter(r => normalizeMetadataVerification(r).verificationLevel === "blocked").length

const topCandidates = [...records]
  .sort((a, b) => descriptorCompletenessPercent(b) - descriptorCompletenessPercent(a) || (b.descriptors.surfaceArea || 0) - (a.descriptors.surfaceArea || 0))
  .slice(0, 12)
  .map((record, index) => ({
    rank: index + 1,
    recordId: record.recordId,
    frameworkId: record.recordId,
    displayName: record.displayName,
    sourceDatabase: record.sourceDatabase,
    metadataVerification: record.metadataVerification,
    detailRef: `details/${record.recordId}.json`,
    notFinalRecommendation: true,
  }))

const manifest = {
  version: "V2.0-G",
  datasetMode: "database_index_preview",
  scope: "Small-scale verified database sample (curated subset)",
  sourceDataset: "CoRE MOF (local curated snapshot)",
  sourceVersion: "local curated snapshot",
  formulaVersion: "OACS/DMRS unchanged",
  metadataGateVersion: "V2.0-E metadata gate",
  buildDate: "2026-06",
  recordsScanned: records.length,
  recordsEligible: eligible,
  recordsBlocked: blocked,
  parts: ["parts/verified_sample_part_001.json"],
  files: { summary: "summary.json", topCandidates: "top_candidates.json" },
  notFinalRecommendation: true,
  boundary: "Small-scale curated sample (<= 200 records). Not full database integration and not full verified database screening.",
  boundaryZh: "小规模人工整理样本（<= 200 条）。不是全量数据库接入，也不是经完整验证的全量数据库筛选。",
}

const summary = {
  version: "V2.0-G",
  recordsScanned: records.length,
  recordsEligible: eligible,
  recordsBlocked: blocked,
  metadata: {
    verified: metadata.verified_metadata,
    partial: metadata.partial_metadata,
    previewOnly: metadata.preview_only,
    blocked: metadata.blocked,
  },
  descriptorCompleteness: descriptorCounts,
  sourceDistribution,
  descriptorProvenanceDistribution: provenanceDistribution,
  notFinalRecommendation: true,
  boundary: manifest.boundary,
  boundaryZh: manifest.boundaryZh,
}

fs.mkdirSync(path.join(outRoot, "parts"), { recursive: true })
fs.mkdirSync(path.join(outRoot, "details"), { recursive: true })
fs.writeFileSync(path.join(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
fs.writeFileSync(path.join(outRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`)
fs.writeFileSync(path.join(outRoot, "top_candidates.json"), `${JSON.stringify({ version: "V2.0-G", topCandidates, notFinalRecommendation: true }, null, 2)}\n`)
fs.writeFileSync(path.join(outRoot, "parts", "verified_sample_part_001.json"), `${JSON.stringify({ partId: "verified_sample_part_001", recordCount: records.length, records, notFinalRecommendation: true }, null, 2)}\n`)
for (const candidate of topCandidates.slice(0, 6)) {
  const record = records.find(r => r.recordId === candidate.recordId)
  fs.writeFileSync(path.join(outRoot, "details", `${candidate.recordId}.json`), `${JSON.stringify({ ...record, detailLevel: "on_demand" }, null, 2)}\n`)
}

console.log(`V2.0-G sample built: ${records.length} records`)
console.log(`metadata: verified=${summary.metadata.verified} partial=${summary.metadata.partial} previewOnly=${summary.metadata.previewOnly} blocked=${summary.metadata.blocked}`)
console.log(`descriptor: complete=${descriptorCounts.complete} partial=${descriptorCounts.partial} missingCritical=${descriptorCounts.missingCritical}`)
console.log(`sourceDistribution=${JSON.stringify(sourceDistribution)}`)
