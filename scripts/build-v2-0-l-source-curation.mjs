// V2.0-L manual source curation builder (offline, reproducible).
//
// Reads the manually authored source-curation records and the V2.0-K evidence backfill
// records, and emits ENRICHED evidence backfill records, an enriched summary, and a
// first verified candidate report. It NEVER goes to the network and NEVER fabricates
// DOI / citation / license / source URL: anything unconfirmed stays pending / unknown /
// not_available. It does NOT overwrite the original V2.0-K files. verified_metadata only
// appears when the full evidence loop is confirmed AND there is no unresolved ambiguity.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  normalizeManualSourceCuration,
  buildSourceCurationSummary,
  mergeSourceCurationIntoEvidenceBackfill,
} from "../src/utils/databaseIndex/manualSourceCuration.js"
import { buildEvidenceBackfillSummary } from "../src/utils/databaseIndex/evidenceBackfill.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const precomputeRoot = path.join(repoRoot, "public", "data", "database_precompute")
const sourceCurationFile = path.join(precomputeRoot, "v2_0_l", "manual_source_curation.json")
const backfillFile = path.join(precomputeRoot, "v2_0_k", "evidence_backfill_records.json")
const outRoot = path.join(precomputeRoot, "v2_0_l")

function readJson(file) {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

function sourceConfirmed(r) { return ["confirmed", "verified"].includes(String(r.sourceStatus || "").toLowerCase()) || (r.sourceUrl !== null && r.sourceUrl !== undefined && String(r.sourceUrl).trim() !== "") }
function citationReady(r) { return ["ready", "confirmed", "verified"].includes(String(r.citationStatus || "").toLowerCase()) || (r.citation !== null && r.citation !== undefined && String(r.citation).trim() !== "") }

// Pure builder so it can be unit-tested without filesystem side effects.
export function buildSourceCuration(sourceCurationRecords = [], backfillRecords = []) {
  const curation = (sourceCurationRecords || []).map(normalizeManualSourceCuration)
  const sourceSummary = buildSourceCurationSummary(curation)
  const enrichedRecords = mergeSourceCurationIntoEvidenceBackfill(backfillRecords, sourceCurationRecords)
  const enrichedSummary = buildEvidenceBackfillSummary(enrichedRecords)

  const checked = curation.map(row => ({
    recordId: row.recordId,
    displayName: row.displayName,
    sourceStatus: row.sourceStatus,
    citationStatus: row.citationStatus,
    licenseStatus: row.licenseStatus,
    doiStatus: row.doiStatus,
    ambiguityWarning: row.ambiguityWarnings[0] || null,
    verifiedMetadataEligible: row.verifiedMetadataEligible,
    remainingBlockers: row.remainingBlockers,
    nextActions: row.nextActions,
  }))

  const verifiedCandidates = enrichedRecords
    .filter(row => row.verifiedMetadataEligible)
    .map(row => ({ recordId: row.recordId, displayName: row.displayName, sourceUrl: row.sourceUrl, citation: row.citation, license: row.license, doi: row.doi, verifiedMetadataEligible: true, notFinalRecommendation: true }))

  const reportStatus = verifiedCandidates.length
    ? "verified_metadata_candidates_available"
    : (sourceSummary.sourceConfirmedCount > 0 ? "source_confirmed_candidates_available" : "no_verified_candidates_yet")

  const report = {
    version: "V2.0-L",
    generatedAt: "2026-06",
    notFinalRecommendation: true,
    reportStatus,
    summary: {
      checkedCandidates: sourceSummary.checkedCandidates,
      sourceConfirmedCount: sourceSummary.sourceConfirmedCount,
      citationReadyCount: sourceSummary.citationReadyCount,
      licenseConfirmedCount: sourceSummary.licenseConfirmedCount,
      doiConfirmedCount: sourceSummary.doiConfirmedCount,
      doiNotAvailableCount: sourceSummary.doiNotAvailableCount,
      doiPendingCount: sourceSummary.doiPendingCount,
      ambiguityWarningCount: sourceSummary.ambiguityWarningCount,
      verifiedMetadataEligibleCount: sourceSummary.verifiedMetadataEligibleCount,
      verifiedMetadataCount: sourceSummary.verifiedMetadataCount,
    },
    checkedCandidates: checked,
    verifiedCandidates,
    boundary: "First verified candidate report scaffold. Not a final recommendation, not experimental validation, and not full database screening.",
    boundaryZh: "第一批候选核验报告框架；不是最终推荐、不是实验验证，也不是全量数据库筛选。",
  }

  return { curation, sourceSummary, enrichedRecords, enrichedSummary, report }
}

export function buildSourceCurationFromDisk() {
  const sourceCurationRecords = readJson(sourceCurationFile)?.records || []
  const backfillRecords = readJson(backfillFile)?.records || []
  return buildSourceCuration(sourceCurationRecords, backfillRecords)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const { curation, sourceSummary, enrichedRecords, enrichedSummary, report } = buildSourceCurationFromDisk()

  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(path.join(outRoot, "manual_source_curation_summary.json"), `${JSON.stringify({ version: "V2.0-L", ...sourceSummary }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "evidence_backfill_records_enriched.json"), `${JSON.stringify({ version: "V2.0-L", source: "v2_0_k/evidence_backfill_records.json + v2_0_l/manual_source_curation.json", records: enrichedRecords, notFinalRecommendation: true }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "evidence_backfill_summary_enriched.json"), `${JSON.stringify({ version: "V2.0-L", ...enrichedSummary }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "verified_candidate_report_enriched.json"), `${JSON.stringify({ version: "V2.0-L", reportStatus: report.reportStatus, verifiedCandidates: report.verifiedCandidates, nearVerifiedCandidates: report.checkedCandidates, notFinalRecommendation: true, boundary: report.boundary, boundaryZh: report.boundaryZh }, null, 2)}\n`)
  fs.writeFileSync(path.join(outRoot, "first_verified_candidate_report.json"), `${JSON.stringify(report, null, 2)}\n`)

  console.log(`V2.0-L source curation built: ${curation.length} candidates checked`)
  console.log(`source confirmed=${sourceSummary.sourceConfirmedCount} citation ready=${sourceSummary.citationReadyCount} license confirmed=${sourceSummary.licenseConfirmedCount}`)
  console.log(`DOI confirmed=${sourceSummary.doiConfirmedCount} not_available=${sourceSummary.doiNotAvailableCount} pending=${sourceSummary.doiPendingCount}`)
  console.log(`ambiguity warnings=${sourceSummary.ambiguityWarningCount} verifiedMetadataEligible=${sourceSummary.verifiedMetadataEligibleCount}`)
  console.log(`report status: ${report.reportStatus}`)
}
