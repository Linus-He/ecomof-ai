// V2.0-I manual metadata curation generator (offline, reproducible, merge-preserving).
//
// Builds the manual metadata curation tracking files from the V2.0-H verification
// queue. It NEVER goes to the network, NEVER fabricates DOI / source / license /
// citation (those stay null/pending), and NEVER auto-promotes a candidate to
// verified_metadata. If a curation file already exists with manually entered fields,
// those manual values are PRESERVED (existing manual value > newly generated pending
// placeholder).
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { normalizeMetadataCuration, buildCurationProgressSummary } from "../src/utils/databaseIndex/metadataCuration.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const precomputeRoot = path.join(repoRoot, "public", "data", "database_precompute")
const queueFile = path.join(precomputeRoot, "v2_0_h", "metadata_verification_queue.json")
const sampleFile = path.join(precomputeRoot, "v2_0_g", "parts", "verified_sample_part_001.json")
const outRoot = path.join(precomputeRoot, "v2_0_i")
const curationFile = path.join(outRoot, "manual_metadata_curation.json")

function readJson(file) {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

function preserved(existing, key) {
  const value = existing?.[key]
  return value !== null && value !== undefined && String(value).trim() !== "" ? value : null
}

// Build one curation record, preferring preserved manual fields over pending placeholders.
export function buildCurationRecord(queueItem, sample, existing) {
  const sourceUrl = preserved(existing, "sourceUrl")
  const doi = preserved(existing, "doi")
  const citation = preserved(existing, "citation")
  const license = preserved(existing, "license")

  const raw = {
    recordId: queueItem.recordId,
    displayName: queueItem.displayName,
    sourceDatabase: queueItem.sourceDatabase,
    sourceRecordId: queueItem.sourceRecordId,
    sourceVersion: sample?.sourceVersion || "local curated snapshot",
    previousTier: queueItem.currentVerificationTier || queueItem.proposedVerificationTier || "near_verified",
    curationStatus: existing?.curationStatus === "curation_blocked" ? "curation_blocked" : undefined,
    sourceUrl,
    sourceUrlStatus: sourceUrl ? (existing?.sourceUrlStatus || "confirmed") : "pending",
    doi,
    doiStatus: doi ? (existing?.doiStatus || "verified") : "pending",
    citation,
    citationStatus: citation ? (existing?.citationStatus || "ready") : "pending",
    license,
    licenseStatus: license ? (existing?.licenseStatus || "confirmed") : "pending",
    descriptorProvenanceStatus: queueItem.descriptorProvenanceStatus || "complete",
    descriptorProvenanceNote: sample?.descriptorProvenance?.method || "Reshaped from CoRE MOF local index snapshot; proxy descriptors derived by documented rules.",
    curatedBy: existing?.curatedBy || "manual-review-required",
    curatedAt: existing?.curatedAt || "2026-06",
    curationNotes: existing?.curationNotes || "Candidate selected from V2.0-H verification queue. Source, DOI, citation, and license still require manual confirmation.",
  }
  return normalizeMetadataCuration(raw)
}

// Pure builder: turns a queue + sample map + existing curation map into curation records.
export function buildCuration(queue = [], sampleById = new Map(), existingById = new Map()) {
  const curation = queue.map(item => buildCurationRecord(item, sampleById.get(item.recordId), existingById.get(item.recordId)))
  const summary = buildCurationProgressSummary(curation)
  return { curation, summary }
}

export function buildCurationFromDisk() {
  const queue = readJson(queueFile)?.queue || []
  const sampleById = new Map((readJson(sampleFile)?.records || []).map(record => [record.recordId, record]))
  const existingById = new Map((readJson(curationFile)?.curation || []).map(record => [record.recordId, record]))
  return buildCuration(queue, sampleById, existingById)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { curation, summary } = buildCurationFromDisk()
  const progressSummary = {
    version: "V2.0-I",
    sourceQueue: "v2_0_h/metadata_verification_queue.json",
    queueSize: summary.queueSize,
    notFinalRecommendation: true,
    statusCounts: summary.statusCounts,
    remainingBlockers: summary.remainingBlockers,
    upgradeReadiness: summary.upgradeReadiness,
    boundary: "Manual metadata curation tracking only. Not full verified database screening and not final recommendation.",
    boundaryZh: "仅用于人工 metadata 整理追踪；不是经完整验证的全量数据库筛选，也不是最终推荐。",
  }

  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(curationFile, `${JSON.stringify({ version: "V2.0-I", sourceQueue: "v2_0_h/metadata_verification_queue.json", curation, notFinalRecommendation: true }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "curation_progress_summary.json"), `${JSON.stringify(progressSummary, null, 2)}\n`)

  console.log(`V2.0-I curation built: ${curation.length} records`)
  console.log(`statusCounts: ${JSON.stringify(summary.statusCounts)}`)
  console.log(`upgradeReadiness: ${JSON.stringify(summary.upgradeReadiness)}`)
  console.log(`verified_metadata: ${summary.statusCounts.verified_metadata} (stays 0 unless real evidence is confirmed)`)
}
