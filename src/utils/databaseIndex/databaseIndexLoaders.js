// @ts-nocheck
import {
  fetchDatabaseManifest,
  fetchDatabaseSummaryFile,
  fetchDescriptorAvailability,
  fetchPrecomputedTopCandidates,
  fetchProvenanceCoverage,
} from "./databaseIndexClient"

function mergeErrors(results) {
  return results.map(result => result?.error).filter(Boolean)
}

export async function loadDatabaseIndexOverview() {
  const manifestResult = await fetchDatabaseManifest()
  const manifest = manifestResult.data || {}
  const files = manifest.files || {}
  const [
    coreSummary,
    qmofSummary,
    descriptorAvailability,
    provenanceCoverage,
    topCandidates,
    needsReviewSummary,
    buildReport,
  ] = await Promise.all([
    fetchDatabaseSummaryFile(files.coreSummary || "core_mof_index_summary.json"),
    fetchDatabaseSummaryFile(files.qmofSummary || "qmof_index_summary.json"),
    fetchDescriptorAvailability(),
    fetchProvenanceCoverage(),
    fetchPrecomputedTopCandidates(),
    fetchDatabaseSummaryFile(files.needsReviewSummary || "rejected_and_needs_review_summary.json"),
    fetchDatabaseSummaryFile(files.buildReport || "index_build_report.json"),
  ])

  const results = [manifestResult, coreSummary, qmofSummary, descriptorAvailability, provenanceCoverage, topCandidates, needsReviewSummary, buildReport]
  return {
    manifest,
    coreSummary: coreSummary.data || {},
    qmofSummary: qmofSummary.data || {},
    descriptorAvailability: descriptorAvailability.data || {},
    provenanceCoverage: provenanceCoverage.data || {},
    topCandidates: topCandidates.data || {},
    needsReviewSummary: needsReviewSummary.data || {},
    buildReport: buildReport.data || {},
    errors: mergeErrors(results),
  }
}
