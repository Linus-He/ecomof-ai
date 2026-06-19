// @ts-nocheck
// V3.4 Experimental Label Audit — counts the label corpus by real provenance
// (Experimental / Literature / Expert Review / Derived / Synthetic) and enforces
// the hard rule that no synthetic label may exist (syntheticLabelCount = 0) and
// no derived/algorithm label is ever miscounted as experimental.
import { EXPERIMENTAL_SOURCE_TYPES, FORBIDDEN_SOURCE_TYPES } from "../dataIngestion/experimentalLabelDataset.js"

const norm = value => String(value ?? "").trim().toLowerCase()

function classify(label = {}) {
  const st = norm(label.sourceType || label.labelSource || label.source)
  if (label.syntheticFixture === true || /synthetic/.test(st)) return "synthetic"
  if (/algorithm|model.?score|final.?score|recommendation|predicted/.test(st) || label.derived === true || /derived/.test(st)) return "derived"
  if (st === "expert_review" || /expert/.test(st)) return "expert_review"
  if (st === "independent_validation" || /independent/.test(st)) return "independent_validation"
  if (st === "literature_experimental" || /literature|paper|publication/.test(st)) return "literature"
  if (st === "experimental" || /experiment|measured|assay/.test(st)) return "experimental"
  return "other"
}

export function auditExperimentalLabels(labels = []) {
  const rows = Array.isArray(labels) ? labels : Array.isArray(labels?.labels) ? labels.labels : []

  const counts = { experimental: 0, literature: 0, expert_review: 0, independent_validation: 0, derived: 0, synthetic: 0, other: 0 }
  for (const label of rows) counts[classify(label)] += 1

  // Literature-experimental, independent-validation and expert-review labels are
  // all real experimental ground truth.
  const experimentalLabelCount = counts.experimental + counts.literature + counts.expert_review + counts.independent_validation
  const literatureLabelCount = counts.literature
  const expertReviewLabelCount = counts.expert_review
  const independentValidationCount = counts.independent_validation
  const derivedLabelCount = counts.derived
  const syntheticLabelCount = counts.synthetic

  // Any forbidden source present at all is a hard failure.
  const forbiddenPresent = rows.some(l => FORBIDDEN_SOURCE_TYPES.includes(norm(l.sourceType)) || l.syntheticFixture === true || l.derived === true)

  let status
  if (syntheticLabelCount > 0 || derivedLabelCount > 0 || forbiddenPresent) status = "Fail"
  else if (experimentalLabelCount >= 20) status = "Pass"
  else status = "Warning"

  return {
    auditId: "experimental-label-audit",
    total: rows.length,
    counts,
    experimentalLabelCount,
    literatureLabelCount,
    expertReviewLabelCount,
    independentValidationCount,
    derivedLabelCount,
    syntheticLabelCount,
    sourceTypes: EXPERIMENTAL_SOURCE_TYPES,
    status,
    note:
      syntheticLabelCount > 0
        ? "Synthetic labels detected — forbidden. syntheticLabelCount must be 0."
        : derivedLabelCount > 0
          ? "Derived/algorithm labels detected in the experimental layer — forbidden as ground truth."
          : experimentalLabelCount >= 20
            ? "Experimental label layer established with independently-sourced ground truth."
            : "Experimental labels below the minimum of 20.",
  }
}

export default auditExperimentalLabels
