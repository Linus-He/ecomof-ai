// V3.2 Data Audit & First Real Benchmark builder.
// Reproducibly audits the committed V3.1 datasets and emits the audit reports
// plus the first benchmark report. Honest: it reports whatever the audits find
// (e.g. dataset-derived labels keep Accuracy/ROC Pending) and fabricates nothing.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { runDataAudit } from "../src/utils/dataAudit/index.js"

const root = process.cwd()
const dataDir = path.join(root, "public", "data")
const read = rel => JSON.parse(fs.readFileSync(path.join(dataDir, rel), "utf8"))
const write = (rel, value) => fs.writeFileSync(path.join(dataDir, rel), JSON.stringify(value, null, 2) + "\n")

const gold = read("organic_acid_gold_dataset_v2.json")
const labels = read("organic_acid_labels_v2.json")
const benchmark = read("benchmark_dataset_v2.json")
const reaction = read("data_ingestion/organic_acid_reaction_dataset_v1.json")

const audit = runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 })
const stamp = "2026-06-18"
const meta = { version: "v3.2", generatedAt: stamp, generator: "scripts/build-v3-2-data-audit.mjs" }

write("data_ingestion/gold_dataset_audit_v1.json", { ...meta, ...audit.audits.gold })
write("data_ingestion/label_audit_report_v1.json", { ...meta, ...audit.audits.label })
write("data_ingestion/benchmark_eligibility_audit_v1.json", { ...meta, ...audit.audits.benchmarkEligibility })
write("data_ingestion/reaction_dataset_audit_v1.json", { ...meta, ...audit.audits.reaction })
write("data_ingestion/provenance_audit_report_v1.json", { ...meta, ...audit.audits.provenance })

write("data_ingestion/benchmark_report_v1.json", {
  ...meta,
  overallStatus: audit.benchmarkReport.overallStatus,
  runnable: audit.benchmarkReport.runnable,
  conditions: audit.benchmarkReport.conditions,
  blockers: audit.benchmarkReport.blockers,
  metricsAllowed: audit.benchmarkReport.metricsAllowed,
  accuracyGate: audit.benchmarkReport.accuracyGate,
  rocGate: audit.benchmarkReport.rocGate,
  split: audit.split,
  leakage: { leakCount: audit.audits.leakage.leakCount, leakSeverity: audit.audits.leakage.leakSeverity, leakRecords: audit.audits.leakage.leakRecords, sharedDoiWarnings: audit.audits.leakage.sharedDoiWarnings },
  models: audit.benchmarkReport.models,
  summary: audit.benchmarkReport.summary,
  acceptance: audit.acceptance,
})

console.log("V3.2 data audit built:")
console.log("  overall:", audit.overallStatus)
console.log("  gold passRate:", audit.audits.gold.auditPassRate, audit.audits.gold.status)
console.log("  label:", JSON.stringify(audit.audits.label.labelSourceDistribution), "invalidGT:", audit.audits.label.invalidGroundTruthCount)
console.log("  eligible confirmed:", audit.audits.benchmarkEligibility.eligibleConfirmed)
console.log("  reaction:", JSON.stringify(audit.audits.reaction.comparabilityDistribution))
console.log("  provenance score:", audit.audits.provenance.provenanceCoverageScore)
console.log("  leakCount:", audit.audits.leakage.leakCount, "severity:", audit.audits.leakage.leakSeverity)
console.log("  split:", JSON.stringify(audit.split.counts))
console.log("  benchmark:", audit.benchmarkReport.overallStatus, "metricsAllowed:", audit.benchmarkReport.metricsAllowed)
console.log("  acceptance:", JSON.stringify(audit.acceptance))
