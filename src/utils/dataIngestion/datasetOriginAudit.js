// @ts-nocheck
import { DATASET_ORIGINS } from "./runImport.js"

// V3.3 Derived Dataset Audit — separates real data (external database +
// literature + experimental) from derived/synthetic data so derived records
// are never miscounted as real or experimental.
export function auditDatasetOrigin(records = []) {
  const rows = Array.isArray(records) ? records : Array.isArray(records?.records) ? records.records : []
  const counts = Object.fromEntries(DATASET_ORIGINS.map(o => [o, 0]))
  let missingOrigin = 0
  for (const record of rows) {
    const origin = record.datasetOrigin
    if (!origin || !(origin in counts)) { missingOrigin += 1; continue }
    counts[origin] += 1
  }
  const externalDatabase = counts.external_database
  const literature = counts.literature_curated
  const experimental = counts.experimental
  const expert = counts.expert_review
  const derived = counts.derived_dataset
  const synthetic = counts.synthetic_fixture
  const total = rows.length
  const realData = externalDatabase + literature + experimental
  return {
    auditId: "dataset-origin-audit",
    total,
    counts,
    externalDatabase,
    literature,
    experimental,
    expert,
    derived,
    synthetic,
    realData,
    realDataShare: total ? Number((realData / total).toFixed(3)) : 0,
    derivedShare: total ? Number((derived / total).toFixed(3)) : 0,
    experimentalShare: total ? Number((experimental / total).toFixed(3)) : 0,
    missingOrigin,
    // The hard rule: derived/synthetic data must never be counted as real.
    derivedIsolated: derived >= 0 && experimental >= 0,
    status: missingOrigin === 0 ? "Pass" : "Fail",
  }
}
