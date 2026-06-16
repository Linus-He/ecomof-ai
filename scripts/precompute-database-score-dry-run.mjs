// V2.0-F / V2.0-G background precompute pipeline — local dry-run only.
//
// This script audits local preview fixtures. It is a DRY RUN:
//   - it never connects to the network;
//   - it never downloads CoRE/QMOF or loads the full database;
//   - it never reads every index part (only a bounded sample);
//   - it never produces a final recommendation;
//   - it does NOT modify any existing official data structure — it writes a separate
//     dry-run report only;
//   - it does NOT modify the OACS/DMRS formulas, and it does NOT train any model.
//
// V2.0-G: when the small verified sample under public/data/database_precompute/v2_0_g/
// exists, the dry run audits it and adds descriptor redundancy, mechanism proxy
// availability, and an algorithm improvement trace. Otherwise it falls back to the
// V2.0-F fixtures and never crashes.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  getMetadataVerificationLevel,
  summarizeMetadataVerification,
} from "../src/utils/databaseIndex/metadataVerification.js"
import { descriptorCompletenessPercent } from "../src/utils/databaseIndex/databaseIndexFormatters.js"
import { buildDescriptorRedundancySummary } from "../src/utils/databaseIndex/descriptorRedundancyGate.js"
import { summarizeMechanismProxyAvailability, summarizeMechanismEvidence } from "../src/utils/organicAcid/mechanismProxyMapping.js"
import { buildAlgorithmImprovementTrace } from "../src/utils/databaseIndex/algorithmImprovementTrace.js"
import { buildSensitivityAuditSummary } from "../src/utils/databaseIndex/sensitivityAudit.js"
import { buildFeatureAblationAudit } from "../src/utils/databaseIndex/featureAblationAudit.js"
import { buildValidationRoadmapForRecords } from "../src/utils/databaseIndex/candidateValidationRoadmap.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const indexRoot = path.join(repoRoot, "public", "data", "database_index")
const v2gRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_g")
const v2hRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_h")
const v2iRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_i")
const v2kRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_k")
const v2lRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_l")
const v2mRoot = path.join(repoRoot, "public", "data", "database_precompute", "v2_0_m")

// V2.0-F fallback fixtures: Top-N preview + a single selected index part. Not the full DB.
const V2F_FIXTURE_FILES = [
  "organic_acid_precomputed_top_candidates.json",
  "core_mof_index_parts/core_mof_index_part_001.json",
]

function readJson(full) {
  if (!fs.existsSync(full)) return null
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"))
  } catch (error) {
    console.warn(`Could not parse fixture ${full}: ${error.message}`)
    return null
  }
}

function extractRecords(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  return payload.topCandidates || payload.candidates || payload.records || []
}

function descriptorBucket(record) {
  const percent = descriptorCompletenessPercent(record)
  if (percent >= 80) return "complete"
  if (percent >= 40) return "partial"
  return "missingCritical"
}

// Loads the V2.0-G sample when present; otherwise the bounded V2.0-F fixtures.
function loadSample() {
  const manifest = readJson(path.join(v2gRoot, "manifest.json"))
  if (manifest) {
    const parts = Array.isArray(manifest.parts) ? manifest.parts : ["parts/verified_sample_part_001.json"]
    const records = []
    const fixturesUsed = []
    for (const part of parts) {
      const payload = readJson(path.join(v2gRoot, part))
      const rows = extractRecords(payload)
      if (rows.length) {
        records.push(...rows)
        fixturesUsed.push({ file: `v2_0_g/${part}`, recordCount: rows.length })
      }
    }
    if (records.length) {
      return { sampleSource: "v2_0_g_verified_sample", records, fixturesUsed, outDir: v2gRoot }
    }
  }
  // Fallback: V2.0-F fixtures.
  const records = []
  const fixturesUsed = []
  for (const file of V2F_FIXTURE_FILES) {
    const rows = extractRecords(readJson(path.join(indexRoot, file)))
    if (rows.length) {
      records.push(...rows)
      fixturesUsed.push({ file, recordCount: rows.length })
    }
  }
  return { sampleSource: "v2_0_f_fixtures", records, fixturesUsed, outDir: path.join(repoRoot, "public", "data", "database_precompute") }
}

export function runPrecomputeDryRun() {
  const { sampleSource, records, fixturesUsed, outDir } = loadSample()

  const metadata = summarizeMetadataVerification(records)
  const descriptorCompleteness = { complete: 0, partial: 0, missingCritical: 0 }
  const sourceDistribution = {}
  const descriptorProvenanceDistribution = {}
  for (const record of records) {
    descriptorCompleteness[descriptorBucket(record)] += 1
    const source = record.sourceDatabase || "unknown"
    sourceDistribution[source] = (sourceDistribution[source] || 0) + 1
    const provenance = record.descriptorProvenance?.source || "unknown"
    descriptorProvenanceDistribution[provenance] = (descriptorProvenanceDistribution[provenance] || 0) + 1
  }

  const redundancy = buildDescriptorRedundancySummary(records)
  const mechanism = summarizeMechanismProxyAvailability(records)
  const mechanismEvidence = summarizeMechanismEvidence(records)
  const sensitivity = buildSensitivityAuditSummary(records)
  const ablation = buildFeatureAblationAudit(records)
  const roadmap = buildValidationRoadmapForRecords(records, { topN: 12 })

  // V2.0-H manual-verification queue summary (read if present; never fabricated here).
  const queueSummary = readJson(path.join(v2hRoot, "metadata_verification_summary.json")) || { queueSize: metadata.nearVerified, manualReviewRequired: metadata.nearVerified }

  // V2.0-I manual metadata curation summary (read if present; fall back to V2.0-H).
  const curationSummary = readJson(path.join(v2iRoot, "curation_progress_summary.json"))
  const curationFallbackReason = curationSummary ? null : "V2.0-I curation summary not found; falling back to V2.0-H queue counts."

  // V2.0-K evidence backfill summary + verified candidate report (read if present).
  const baseBackfillSummary = readJson(path.join(v2kRoot, "evidence_backfill_summary.json"))
  const baseVerifiedReport = readJson(path.join(v2kRoot, "verified_candidate_report.json"))

  // V2.0-L manual source curation enrichment (preferred when present).
  const manualSourceCurationSummary = readJson(path.join(v2lRoot, "manual_source_curation_summary.json"))
  const enrichedBackfillSummary = readJson(path.join(v2lRoot, "evidence_backfill_summary_enriched.json"))
  const firstVerifiedReport = readJson(path.join(v2lRoot, "first_verified_candidate_report.json"))
  const sourceCurationFallbackReason = manualSourceCurationSummary ? null : "V2.0-L manual source curation not found; falling back to V2.0-K evidence backfill counts."

  // Prefer the enriched backfill summary / report when V2.0-L is available.
  const evidenceBackfillSummary = enrichedBackfillSummary || baseBackfillSummary
  const verifiedCandidateReport = firstVerifiedReport
    ? { verifiedMetadataCount: firstVerifiedReport.summary?.verifiedMetadataCount ?? 0, reportStatus: firstVerifiedReport.reportStatus, sourceConfirmedCount: firstVerifiedReport.summary?.sourceConfirmedCount ?? 0, citationReadyCount: firstVerifiedReport.summary?.citationReadyCount ?? 0, licenseConfirmedCount: firstVerifiedReport.summary?.licenseConfirmedCount ?? 0, nearVerifiedCandidates: firstVerifiedReport.checkedCandidates }
    : baseVerifiedReport
  const evidenceBackfillFallbackReason = baseBackfillSummary ? null : "V2.0-K evidence backfill summary not found; falling back to V2.0-I curation counts."

  const trace = buildAlgorithmImprovementTrace(records, {
    verificationQueueSummary: queueSummary,
    curationSummary: curationSummary || undefined,
    evidenceBackfillSummary: evidenceBackfillSummary || undefined,
    verifiedCandidateReport: verifiedCandidateReport || undefined,
    mechanismEvidence,
    sensitivity,
    ablation,
    validationRoadmap: roadmap,
  })

  const createdAt = new Date().toISOString()
  return {
    runId: `precompute-dry-run-${createdAt.replace(/\D/g, "").slice(0, 14)}`,
    createdAt,
    mode: "dry_run",
    sampleSource,
    notFinalRecommendation: true,
    formulaVersion: "OACS/DMRS unchanged (V2.0-H dry-run)",
    metadataGateVersion: "V2.0-E metadata gate + V2.0-H near_verified tier",
    fixturesUsed,
    recordsScanned: records.length,
    recordsEligible: records.filter(row => getMetadataVerificationLevel(row) === "verified_metadata").length,
    recordsBlocked: records.filter(row => getMetadataVerificationLevel(row) === "blocked").length,
    nearVerifiedCount: metadata.nearVerified,
    metadata: {
      verified: metadata.verified_metadata,
      partial: metadata.partial_metadata,
      previewOnly: metadata.preview_only,
      blocked: metadata.blocked,
    },
    metadataTierCounts: metadata.tierCounts,
    descriptorCompleteness,
    sourceDistribution,
    descriptorProvenanceDistribution,
    redundancyGate: {
      descriptorCount: redundancy.descriptorCount,
      lowVarianceCount: redundancy.lowVarianceCount,
      redundantPairCount: redundancy.redundantPairCount,
      insufficientDataCount: redundancy.insufficientDataCount,
      redundantPairs: redundancy.redundantPairs,
    },
    mechanismProxyAvailability: mechanism.availableByProxy,
    mechanismEvidenceSummary: mechanismEvidence.statusCounts,
    verificationQueueSummary: {
      queueSize: queueSummary.queueSize,
      priorityCounts: queueSummary.priorityCounts,
      proposedTierCounts: queueSummary.proposedTierCounts,
      manualReviewRequired: queueSummary.manualReviewRequired,
    },
    sensitivityAudit: {
      top5Stability: sensitivity.top5Stability,
      top10Stability: sensitivity.top10Stability,
      unstableCandidateCount: sensitivity.unstableCandidateCount,
      sensitiveDescriptors: sensitivity.sensitiveDescriptors,
      auditRuns: sensitivity.auditRuns,
    },
    featureAblationAudit: ablation.variants.map(v => ({ id: v.id, topNOverlapWithBaseline: v.topNOverlapWithBaseline, removedOrPenalized: v.removedOrPenalized })),
    candidateValidationRoadmapSummary: { candidateCount: roadmap.candidateCount, priorityCounts: roadmap.priorityCounts },
    manualCurationSummary: {
      queueSize: curationSummary?.queueSize ?? queueSummary.queueSize ?? metadata.nearVerified,
      statusCounts: curationSummary?.statusCounts ?? {},
      remainingBlockers: curationSummary?.remainingBlockers ?? {},
      upgradeReadiness: curationSummary?.upgradeReadiness ?? {},
      fallbackReason: curationFallbackReason,
    },
    metadataTransitionSummary: {
      nearVerifiedBeforeCuration: metadata.nearVerified,
      verifiedAfterCuration: curationSummary?.statusCounts?.verified_metadata ?? 0,
      sourceConfirmed: curationSummary?.statusCounts?.source_confirmed ?? 0,
      citationReady: curationSummary?.statusCounts?.citation_ready ?? 0,
      licenseConfirmed: curationSummary?.statusCounts?.license_confirmed ?? 0,
      curationBlocked: curationSummary?.statusCounts?.curation_blocked ?? 0,
    },
    // V2.0-K evidence backfill (read from disk; never fabricated here).
    evidenceBackfillSummary: evidenceBackfillSummary
      ? {
          recordCount: evidenceBackfillSummary.recordCount,
          sourceStatusCounts: evidenceBackfillSummary.sourceStatusCounts,
          citationStatusCounts: evidenceBackfillSummary.citationStatusCounts,
          licenseStatusCounts: evidenceBackfillSummary.licenseStatusCounts,
          doiStatusCounts: evidenceBackfillSummary.doiStatusCounts,
          descriptorProvenanceStatusCounts: evidenceBackfillSummary.descriptorProvenanceStatusCounts,
          mechanismEvidenceStatusCounts: evidenceBackfillSummary.mechanismEvidenceStatusCounts,
          verifiedMetadataEligible: evidenceBackfillSummary.verifiedMetadataEligible,
          verifiedMetadataCount: evidenceBackfillSummary.verifiedMetadataCount,
          remainingBlockers: evidenceBackfillSummary.remainingBlockers,
          fallbackReason: evidenceBackfillFallbackReason,
        }
      : { fallbackReason: evidenceBackfillFallbackReason },
    verifiedCandidateReportSummary: verifiedCandidateReport
      ? {
          reportStatus: verifiedCandidateReport.reportStatus,
          verifiedMetadataCount: verifiedCandidateReport.verifiedMetadataCount,
          sourceConfirmedCount: verifiedCandidateReport.sourceConfirmedCount,
          citationReadyCount: verifiedCandidateReport.citationReadyCount,
          licenseConfirmedCount: verifiedCandidateReport.licenseConfirmedCount,
          nearVerifiedCount: (verifiedCandidateReport.nearVerifiedCandidates || []).length,
        }
      : { reportStatus: "no_verified_candidates_yet", verifiedMetadataCount: 0 },
    metadataBackfillTransitionSummary: {
      nearVerifiedBeforeBackfill: metadata.nearVerified,
      sourceConfirmedAfterBackfill: evidenceBackfillSummary?.sourceStatusCounts?.confirmed ?? 0,
      citationReadyAfterBackfill: evidenceBackfillSummary?.citationStatusCounts?.ready ?? 0,
      licenseConfirmedAfterBackfill: evidenceBackfillSummary?.licenseStatusCounts?.confirmed ?? 0,
      verifiedAfterBackfill: evidenceBackfillSummary?.verifiedMetadataCount ?? 0,
    },
    nextActionSummary: {
      sourceConfirmed: evidenceBackfillSummary?.sourceStatusCounts?.confirmed ?? 0,
      citationReady: evidenceBackfillSummary?.citationStatusCounts?.ready ?? 0,
      licenseConfirmed: evidenceBackfillSummary?.licenseStatusCounts?.confirmed ?? 0,
      verifiedMetadataCount: evidenceBackfillSummary?.verifiedMetadataCount ?? 0,
      descriptorProvenanceIncomplete: (evidenceBackfillSummary?.descriptorProvenanceStatusCounts?.partial ?? 0) + (evidenceBackfillSummary?.descriptorProvenanceStatusCounts?.incomplete ?? 0),
      weakProxy: evidenceBackfillSummary?.mechanismEvidenceStatusCounts?.weak_proxy ?? 0,
    },
    // V2.0-L manual source curation enrichment.
    manualSourceCurationSummary: manualSourceCurationSummary
      ? {
          checkedCandidates: manualSourceCurationSummary.checkedCandidates,
          sourceConfirmedCount: manualSourceCurationSummary.sourceConfirmedCount,
          citationReadyCount: manualSourceCurationSummary.citationReadyCount,
          licenseConfirmedCount: manualSourceCurationSummary.licenseConfirmedCount,
          doiConfirmedCount: manualSourceCurationSummary.doiConfirmedCount,
          doiNotAvailableCount: manualSourceCurationSummary.doiNotAvailableCount,
          doiPendingCount: manualSourceCurationSummary.doiPendingCount,
          ambiguityWarningCount: manualSourceCurationSummary.ambiguityWarningCount,
          verifiedMetadataEligibleCount: manualSourceCurationSummary.verifiedMetadataEligibleCount,
          verifiedMetadataCount: manualSourceCurationSummary.verifiedMetadataCount,
          fallbackReason: sourceCurationFallbackReason,
        }
      : { fallbackReason: sourceCurationFallbackReason },
    evidenceBackfillEnrichedSummary: enrichedBackfillSummary
      ? {
          recordCount: enrichedBackfillSummary.recordCount,
          sourceStatusCounts: enrichedBackfillSummary.sourceStatusCounts,
          citationStatusCounts: enrichedBackfillSummary.citationStatusCounts,
          licenseStatusCounts: enrichedBackfillSummary.licenseStatusCounts,
          doiStatusCounts: enrichedBackfillSummary.doiStatusCounts,
          verifiedMetadataCount: enrichedBackfillSummary.verifiedMetadataCount,
        }
      : null,
    firstVerifiedCandidateReportSummary: firstVerifiedReport
      ? { reportStatus: firstVerifiedReport.reportStatus, ...firstVerifiedReport.summary }
      : null,
    // V2.0-M strict verified metadata gate (read if present; verifiedMetadataCount honest).
    verifiedMetadataGateSummary: (() => {
      const g = readJson(path.join(v2mRoot, "verified_metadata_gate_summary.json"))
      if (!g) return { fallbackReason: "V2.0-M gate summary not found; falling back to V2.0-L counts." }
      return {
        checkedCandidates: g.checkedCandidates,
        sourceConfirmedCount: g.sourceConfirmedCount,
        verifiedMetadataCount: g.verifiedMetadataCount,
        quarantinedCount: g.quarantinedCount,
        verifiedMetadataReached: g.verifiedMetadataReached,
        blockingReasons: g.blockingReasons,
      }
    })(),
    metadataSourceCurationTransitionSummary: {
      sourceConfirmedAfterManualCuration: manualSourceCurationSummary?.sourceConfirmedCount ?? 0,
      citationReadyAfterManualCuration: manualSourceCurationSummary?.citationReadyCount ?? 0,
      licenseConfirmedAfterManualCuration: manualSourceCurationSummary?.licenseConfirmedCount ?? 0,
      verifiedMetadataAfterManualCuration: manualSourceCurationSummary?.verifiedMetadataCount ?? 0,
    },
    algorithmImprovementTrace: trace.stages.map(stage => ({ id: stage.id, label: stage.label, inputCount: stage.inputCount, outputCount: stage.outputCount, status: stage.status })),
    boundary: "Dry-run only. Not full verified database screening. No network, no full database load, no model training, no final recommendation.",
    boundaryZh: "仅本地试算；不是经完整验证的全量数据库筛选；不联网、不加载全量数据库、不训练模型、不产生最终推荐。",
    outDir: manualSourceCurationSummary ? v2lRoot : (baseBackfillSummary || baseVerifiedReport ? v2kRoot : v2iRoot),
  }
}

export function writeDryRunSummary(summary, outFile) {
  const dir = path.dirname(outFile)
  fs.mkdirSync(dir, { recursive: true })
  const { outDir, ...payload } = summary
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`)
  return outFile
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const summary = runPrecomputeDryRun()
  const outFile = path.join(summary.outDir, "precompute_dry_run_summary.json")
  writeDryRunSummary(summary, outFile)
  console.log(`Precompute dry-run complete (${summary.sampleSource}). ${summary.recordsScanned} records scanned (sample only, not full database).`)
  console.log(`metadata: verified=${summary.metadata.verified} partial=${summary.metadata.partial} previewOnly=${summary.metadata.previewOnly} blocked=${summary.metadata.blocked}`)
  console.log(`descriptorCompleteness: complete=${summary.descriptorCompleteness.complete} partial=${summary.descriptorCompleteness.partial} missingCritical=${summary.descriptorCompleteness.missingCritical}`)
  console.log(`redundancy: pairs=${summary.redundancyGate.redundantPairCount} lowVariance=${summary.redundancyGate.lowVarianceCount} insufficient=${summary.redundancyGate.insufficientDataCount}`)
  console.log(`notFinalRecommendation=${summary.notFinalRecommendation}`)
  console.log(`Summary written to ${path.relative(repoRoot, outFile)}`)
}
