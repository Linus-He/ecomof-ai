// @ts-nocheck
import { auditGoldDataset } from "./goldDatasetAudit.js"
import { auditLabels } from "./labelAudit.js"
import { auditBenchmarkEligibility } from "./benchmarkEligibilityAudit.js"
import { auditReactionDataset } from "./reactionAudit.js"
import { auditProvenance } from "./provenanceAudit.js"
import { dataLeakageCheckV3 } from "../benchmark/dataLeakageCheckV3.js"
import { buildBenchmarkSplit } from "../benchmark/buildBenchmarkSplit.js"
import { buildBenchmarkReport } from "../benchmark/benchmarkRunner.js"
import { auditExperimentalLabels } from "./experimentalLabelAudit.js"
import { auditGroundTruth } from "./groundTruthAudit.js"
import { auditLabelProvenance } from "./labelProvenanceAudit.js"

export { auditGoldDataset, auditLabels, auditBenchmarkEligibility, auditReactionDataset, auditProvenance, auditExperimentalLabels, auditGroundTruth, auditLabelProvenance }

function asRecords(dataset) {
  if (!dataset) return []
  if (Array.isArray(dataset)) return dataset
  if (Array.isArray(dataset.records)) return dataset.records
  if (Array.isArray(dataset.labels)) return dataset.labels
  return []
}

const STATUS_RANK = { Pass: 0, Warning: 1, Fail: 2 }

// Runs the full Data Audit Center model + First Real Benchmark report.
export function runDataAudit({ gold, labels, benchmark, reaction, sampleSize = 50 } = {}) {
  const goldRecords = asRecords(gold)
  const benchmarkRecords = asRecords(benchmark)
  const reactionRecords = asRecords(reaction)

  const goldAudit = auditGoldDataset(goldRecords, { sampleSize })
  const labelAudit = auditLabels(labels)
  const eligibilityAudit = auditBenchmarkEligibility(benchmarkRecords)
  const reactionAuditResult = auditReactionDataset(reactionRecords.length ? reactionRecords : goldRecords)
  const provenanceAuditResult = auditProvenance(goldRecords.length ? goldRecords : benchmarkRecords)

  // Build a clean 70/15/15 split from the labelled benchmark records, then audit leakage on it.
  const split = buildBenchmarkSplit(benchmarkRecords)
  const leakage = dataLeakageCheckV3({ records: split.records })
  const benchmarkReport = buildBenchmarkReport({ eligibilityAudit, labelAudit, split, leakage })

  const audits = {
    gold: goldAudit,
    label: labelAudit,
    benchmarkEligibility: eligibilityAudit,
    reaction: reactionAuditResult,
    provenance: provenanceAuditResult,
    leakage: { auditId: "data-leakage-audit", status: leakage.ok ? "Pass" : "Fail", ...leakage },
  }

  const overallStatus = Object.values(audits)
    .map(a => a.status)
    .reduce((worst, status) => (STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst), "Pass")

  return {
    version: "v3.2",
    generatedAt: "2026-06-18",
    audits,
    split: { counts: split.counts, ratios: split.ratios, complete: split.complete, groupCount: split.groupCount },
    benchmarkReport,
    overallStatus,
    acceptance: {
      goldAuditPassRate: goldAudit.auditPassRate,
      leakCount: leakage.leakCount,
      invalidGroundTruth: labelAudit.invalidGroundTruthCount,
      benchmarkEligibleConfirmed: eligibilityAudit.eligibleConfirmed,
      splitComplete: split.complete,
      benchmarkReportGenerated: Boolean(benchmarkReport.reportId),
    },
  }
}
