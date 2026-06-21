// V3.5 Model Credibility, Explainability & Scientific Validation builder.
//
// HONESTY BOUNDARY: V3.5 adds NO data and trains NO new benchmark. It rebuilds
// the EXACT V3.4 split + models (deterministic, identical) purely to explain and
// validate them: feature importance, per-model explainability, 5-/10-fold cross
// validation, stability, sensitivity, ablation, a benchmark-credibility audit,
// and a 0–100 credibility score. Accuracy / ROC are READ from the frozen V3.4
// report — never modified or fabricated. It also builds the CO₂→formic-acid
// reaction evidence graph by COUNTING evidence in existing datasets.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { buildModelCredibilityReport } from "../src/utils/benchmark/modelCredibilityReport.js"
import { buildReactionEvidenceGraph } from "../src/utils/benchmark/reactionEvidenceGraph.js"

const root = process.cwd()
const dataDir = path.join(root, "public", "data")
const stamp = "2026-06-19"
const read = rel => JSON.parse(fs.readFileSync(path.join(dataDir, rel), "utf8"))
const write = (rel, value) => {
  const target = path.join(dataDir, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + "\n")
}

const experimentalLabels = read("experimental_labels/experimental_labels_v1.json")
const externalTest = read("external_test_dataset_v1.json")
const firstBenchmark = read("first_real_benchmark_report_v1.json")
const literature = (() => { try { return read("organic_acid_literature_dataset_v3.json") } catch { return { records: [] } } })()
const reaction = (() => { try { return read("organic_acid_reaction_dataset_v3.json") } catch { return { records: [] } } })()

const meta = { version: "v3.5", generatedAt: stamp, generator: "scripts/build-v3-5-model-credibility.mjs" }
const HONESTY = "V3.5 explains and validates the frozen V3.4 models — no new labels, no retrained benchmark, no modified Accuracy/ROC. Cross validation / sensitivity / ablation are parallel diagnostics; the headline Accuracy/ROC come from first_real_benchmark_report_v1.json."

// ---- 1. Model credibility report (explainability + CV + stability + sensitivity + credibility) ----
const report = buildModelCredibilityReport({ experimentalLabels: experimentalLabels.labels, externalTest: externalTest.records, firstBenchmark })
write("model_credibility_report_v1.json", { ...meta, honestyBoundary: HONESTY, ...report })

// ---- 2. Reaction evidence graph (CO2 -> formate -> formic acid) ----
const graph = buildReactionEvidenceGraph({ experimentalLabels: experimentalLabels.labels, literatureRecords: literature.records || [], reactionRecords: reaction.records || [] })
write("reaction_evidence_graph_v1.json", { ...meta, ...graph })

// ---- 3. Credibility growth tracker V3.4 -> V3.5 ----
write("data_ingestion/model_credibility_growth_v3_5.json", {
  ...meta,
  metrics: ["crossValidation", "credibilityScore", "explainability"],
  series: {
    "V3.4": { crossValidation: "none", credibilityScore: null, explainability: "none", sensitivity: "none" },
    "V3.5": {
      crossValidation: "5-fold + 10-fold",
      credibilityScore: report.credibility.score,
      credibilityGrade: report.credibility.grade,
      explainability: "LR coefficients + DT path/splits + RF importance/consensus",
      sensitivity: "per-feature ablation",
    },
  },
})

const cv5 = report.crossValidation.fiveFold.models.find(m => m.model === report.bestModel)
const cv10 = report.crossValidation.tenFold.models.find(m => m.model === report.bestModel)
console.log("V3.5 model credibility built:")
console.log("  Best model:", report.bestModel)
console.log("  Feature importance (best):", JSON.stringify((report.featureImportance.find(f => f.model === report.bestModel)?.rows || []).map(r => `${r.label}:${r.importance}`)))
console.log(`  CV 5-fold (${report.bestModel}): accMean ${cv5.accuracyMean}±${cv5.accuracyStd} rocMean ${cv5.rocMean}±${cv5.rocStd} stability ${cv5.stabilityScore}`)
console.log(`  CV 10-fold (${report.bestModel}): accMean ${cv10.accuracyMean}±${cv10.accuracyStd} rocMean ${cv10.rocMean}±${cv10.rocStd}`)
console.log("  Stability (5-fold):", report.stability.fiveFold.overallStability)
console.log("  Sensitivity baseline:", JSON.stringify(report.sensitivity.baseline), "| critical features:", JSON.stringify(report.ablation.criticalFeatures))
console.log("  Ablation tally:", JSON.stringify(report.ablation.tally))
console.log("  Benchmark credibility:", JSON.stringify({ gt: report.benchmarkCredibilityAudit.groundTruthQuality, ext: report.benchmarkCredibilityAudit.externalTestQuality, leak: report.benchmarkCredibilityAudit.leakageStatus, cv: report.benchmarkCredibilityAudit.crossValidationStatus, status: report.benchmarkCredibilityAudit.status }))
console.log("  Credibility score:", report.credibility.score, "grade", report.credibility.grade, "| components", JSON.stringify(report.credibility.components))
console.log("  Reaction evidence graph edges:", graph.edges.length, "| high-confidence:", graph.summary.highConfidenceEdges, "| exp evidence:", graph.summary.experimentalEvidence)
