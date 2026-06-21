// @ts-nocheck
// V3.6 Label Provenance Audit — classifies the expanded experimental-label
// corpus into Literature / Independent / Expert / Derived / Synthetic and
// enforces the hard rule: Derived = 0 and Synthetic = 0. Anything else means a
// forbidden label leaked into the experimental dataset.
import { FORBIDDEN_SOURCE_TYPES } from "../dataIngestion/experimentalLabelDataset.js"

const norm = v => String(v ?? "").trim().toLowerCase()

function classify(label = {}) {
  const st = norm(label.sourceType || label.labelSource || label.source)
  if (label.syntheticFixture === true || /synthetic/.test(st)) return "synthetic"
  if (label.derived === true || /algorithm|model.?score|final.?score|recommendation|predicted|derived/.test(st)) return "derived"
  if (/expert/.test(st)) return "expert"
  if (/independent/.test(st)) return "independent"
  if (/literature|paper|publication/.test(st)) return "literature"
  if (/experiment|measured|assay/.test(st)) return "independent" // measured experimental → independent bucket
  return "other"
}

export function auditLabelProvenance(labels = []) {
  const rows = Array.isArray(labels) ? labels : Array.isArray(labels?.labels) ? labels.labels : []
  const counts = { literature: 0, independent: 0, expert: 0, derived: 0, synthetic: 0, other: 0 }
  for (const l of rows) counts[classify(l)] += 1

  const forbiddenPresent = rows.some(l => FORBIDDEN_SOURCE_TYPES.includes(norm(l.sourceType)) || l.syntheticFixture === true || l.derived === true)
  const literatureLabels = counts.literature
  const independentLabels = counts.independent
  const expertLabels = counts.expert
  const derivedLabels = counts.derived
  const syntheticLabels = counts.synthetic
  const experimentalTotal = literatureLabels + independentLabels + expertLabels

  const status = derivedLabels === 0 && syntheticLabels === 0 && !forbiddenPresent ? "Pass" : "Fail"
  return {
    auditId: "experimental-label-provenance-audit",
    total: rows.length,
    literatureLabels,
    independentLabels,
    expertLabels,
    derivedLabels,
    syntheticLabels,
    experimentalTotal,
    counts,
    priorityMix: {
      A_literature: literatureLabels,
      B_independent: independentLabels,
      C_expert: expertLabels,
    },
    status,
    note: status === "Pass"
      ? "All experimental labels are Literature / Independent / Expert provenance; Derived = 0, Synthetic = 0."
      : "Forbidden (derived/algorithm/synthetic) labels detected in the experimental dataset.",
  }
}

export default auditLabelProvenance
