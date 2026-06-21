// @ts-nocheck
// V3.6 Generalization Audit — evaluates one fitted model on Train / Validation /
// Test / External Test and reports the generalization gap (train minus external)
// to answer "is the model overfitting?". Real metrics from the frozen split.
import { featureVector } from "../dataIngestion/experimentalLabelDataset.js"
import { computeMetrics } from "./mlModels.js"

const r4 = v => (v == null ? null : Number(Number(v).toFixed(4)))
const encodeY = records => records.map(r => (String(r.groundTruthClass ?? r.binaryLabel).toLowerCase() === "promising" ? 1 : 0))

function evalSet(model, records) {
  if (!records?.length) return null
  return computeMetrics(encodeY(records), model.predictProba(records.map(featureVector)))
}

export function classifyOverfit(gap) {
  if (gap == null) return "Unknown"
  if (gap >= 0.2) return "High"
  if (gap >= 0.1) return "Moderate"
  return "Low"
}

export function generalizationAudit({ model, modelName = "Random Forest", trainRecords = [], validationRecords = [], testRecords = [], externalTestRecords = [] } = {}) {
  const train = evalSet(model, trainRecords)
  const validation = evalSet(model, validationRecords)
  const test = evalSet(model, testRecords)
  const external = evalSet(model, externalTestRecords)

  const accGap = train && external ? r4(train.accuracy - external.accuracy) : null
  const rocGap = train && external && train.rocAuc != null && external.rocAuc != null ? r4(train.rocAuc - external.rocAuc) : null
  const gap = Math.max(accGap ?? 0, rocGap ?? 0)
  const risk = classifyOverfit(gap)

  return {
    auditId: "generalization-audit-v1",
    model: modelName,
    splits: {
      train: train && { accuracy: train.accuracy, rocAuc: train.rocAuc, n: trainRecords.length },
      validation: validation && { accuracy: validation.accuracy, rocAuc: validation.rocAuc, n: validationRecords.length },
      test: test && { accuracy: test.accuracy, rocAuc: test.rocAuc, n: testRecords.length },
      externalTest: external && { accuracy: external.accuracy, rocAuc: external.rocAuc, n: externalTestRecords.length },
    },
    accuracyGap: accGap,
    rocGap,
    generalizationGap: r4(gap),
    overfittingRisk: risk,
    recommendation: risk === "High"
      ? "Large train→external gap: reduce model complexity or expand labels before trusting absolute metrics."
      : risk === "Moderate"
        ? "Moderate gap on a small dataset: monitor; prefer external-test metrics as the honest estimate."
        : "Small gap: the model generalizes consistently from train to the independent external test.",
  }
}

export default generalizationAudit
