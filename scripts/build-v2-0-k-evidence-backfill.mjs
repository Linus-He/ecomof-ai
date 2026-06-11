// V2.0-K evidence backfill generator (offline, reproducible, merge-preserving).
//
// Builds evidence backfill records, a backfill summary, and a verified candidate report
// from the V2.0-I manual curation records. It NEVER goes to the network, NEVER accesses
// external databases, and NEVER fabricates source / citation / license / DOI (those stay
// null/pending). If an evidence backfill file already exists with manually entered
// fields, those manual values are PRESERVED (existing confirmed/manual value > generated
// pending placeholder). verified_metadata stays 0 until real evidence is confirmed.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  buildEvidenceBackfillRecord,
  mergeEvidenceBackfillRecord,
  buildEvidenceBackfillSummary,
  buildVerifiedCandidateReport,
} from "../src/utils/databaseIndex/evidenceBackfill.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const precomputeRoot = path.join(repoRoot, "public", "data", "database_precompute")
const curationFile = path.join(precomputeRoot, "v2_0_i", "manual_metadata_curation.json")
const queueFile = path.join(precomputeRoot, "v2_0_h", "metadata_verification_queue.json")
const sampleFile = path.join(precomputeRoot, "v2_0_g", "parts", "verified_sample_part_001.json")
const outRoot = path.join(precomputeRoot, "v2_0_k")
const recordsFile = path.join(outRoot, "evidence_backfill_records.json")

function readJson(file) {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

// Pure builder so it can be unit-tested without filesystem side effects.
export function buildEvidenceBackfill(curationRecords = [], sampleRecords = [], queueItems = [], existingRecords = []) {
  const sampleById = new Map((sampleRecords || []).map(record => [record.recordId, record]))
  const existingById = new Map((existingRecords || []).map(record => [record.recordId, record]))
  // Prioritize high-priority near_verified candidates from the queue.
  const priorityById = new Map((queueItems || []).map(item => [item.recordId, item.priority]))

  const records = (curationRecords || []).map(curationRecord => {
    const generated = buildEvidenceBackfillRecord(curationRecord, sampleById.get(curationRecord.recordId))
    const merged = mergeEvidenceBackfillRecord(existingById.get(curationRecord.recordId), generated)
    return { ...merged, priority: priorityById.get(curationRecord.recordId) || "medium" }
  })

  const summary = buildEvidenceBackfillSummary(records)
  const report = buildVerifiedCandidateReport(records)
  return { records, summary, report }
}

export function buildEvidenceBackfillFromDisk() {
  const curationRecords = readJson(curationFile)?.curation || []
  const sampleRecords = readJson(sampleFile)?.records || []
  const queueItems = readJson(queueFile)?.queue || []
  const existingRecords = readJson(recordsFile)?.records || []
  return buildEvidenceBackfill(curationRecords, sampleRecords, queueItems, existingRecords)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { records, summary, report } = buildEvidenceBackfillFromDisk()

  const summaryPayload = {
    version: "V2.0-K",
    sourceCuration: "v2_0_i/manual_metadata_curation.json",
    recordCount: summary.recordCount,
    notFinalRecommendation: true,
    sourceStatusCounts: summary.sourceStatusCounts,
    citationStatusCounts: summary.citationStatusCounts,
    licenseStatusCounts: summary.licenseStatusCounts,
    doiStatusCounts: summary.doiStatusCounts,
    descriptorProvenanceStatusCounts: summary.descriptorProvenanceStatusCounts,
    mechanismEvidenceStatusCounts: summary.mechanismEvidenceStatusCounts,
    verifiedMetadataEligible: summary.verifiedMetadataEligible,
    verifiedMetadataCount: summary.verifiedMetadataCount,
    nearestToVerified: summary.nearestToVerified,
    remainingBlockers: summary.remainingBlockers,
    boundary: "Evidence backfill tracking only. Not full verified database screening and not final recommendation.",
    boundaryZh: "仅用于证据回填追踪；不是经完整验证的全量数据库筛选，也不是最终推荐。",
  }

  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(recordsFile, `${JSON.stringify({ version: "V2.0-K", sourceCuration: "v2_0_i/manual_metadata_curation.json", records, notFinalRecommendation: true }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "evidence_backfill_summary.json"), `${JSON.stringify(summaryPayload, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "verified_candidate_report.json"), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`V2.0-K evidence backfill built: ${records.length} records`)
  console.log(`source confirmed=${summary.sourceStatusCounts.confirmed} citation ready=${summary.citationStatusCounts.ready} license confirmed=${summary.licenseStatusCounts.confirmed}`)
  console.log(`verifiedMetadataCount=${summary.verifiedMetadataCount} (stays 0 unless real evidence is confirmed)`)
  console.log(`report status: ${report.reportStatus}`)
}
