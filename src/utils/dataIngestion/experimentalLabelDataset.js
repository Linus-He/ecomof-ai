// @ts-nocheck
// V3.4 Experimental Label Layer — the first dataset of independently-sourced
// experimental ground-truth labels for the organic-acid benchmark.
//
// HONESTY BOUNDARY: only labels whose value comes from a real experiment count
// as experimental ground truth. Three source types are allowed:
//   - literature_experimental : a measured result reported in a real paper (DOI)
//   - independent_validation  : a separate, independent experimental dataset
//   - expert_review           : explicitly expert-reviewed and flagged as such
// Algorithm scores, recommendations, derived labels, and synthetic fixtures are
// NEVER experimental ground truth and are rejected here, not relabelled.
import { isReal } from "./runImport.js"

// Source types that produce real experimental ground truth.
export const EXPERIMENTAL_SOURCE_TYPES = ["literature_experimental", "independent_validation", "expert_review"]

// Source types that are forbidden as ground truth — an algorithm score, a
// recommendation, a derived label, or a synthetic fixture can never be claimed
// as an experimental label.
export const FORBIDDEN_SOURCE_TYPES = ["algorithm_generated", "algorithm_score", "model_score", "recommendation", "derived", "derived_dataset", "synthetic", "synthetic_fixture", "predicted"]

export const LABEL_TYPES = ["binary", "multiclass", "regression"]

// Field-source schema fields every experimental label declares provenance for.
// A real sourceCitation is always required; sourceDoi is required only for
// literature_experimental labels (expert-review / independent-validation labels
// are explicitly curated and need not cite a published DOI).
export const REQUIRED_FIELDS = ["labelId", "candidateId", "labelType", "sourceType", "sourceCitation"]

const norm = value => String(value ?? "").trim().toLowerCase()

export function isExperimentalSource(sourceType) {
  return EXPERIMENTAL_SOURCE_TYPES.includes(norm(sourceType))
}

export function isForbiddenSource(sourceType) {
  return FORBIDDEN_SOURCE_TYPES.includes(norm(sourceType))
}

// Numeric features used by the real benchmark models. Kept deterministic and
// descriptor/condition-based so the outcome class is never a feature (no leak).
export const FEATURE_KEYS = ["temperature", "pressure", "reactionTime", "metalElectronegativity", "surfaceArea", "voidFraction"]

export function featureVector(label = {}) {
  const f = label.features || {}
  return FEATURE_KEYS.map(key => {
    const value = label[key] ?? f[key]
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  })
}

// Validate a single experimental label against the schema + honesty rules.
export function validateExperimentalLabel(label = {}) {
  const errors = []
  const warnings = []

  for (const field of REQUIRED_FIELDS) {
    if (!isReal(label[field])) errors.push(`missing ${field}`)
  }

  const labelType = norm(label.labelType)
  if (labelType && !LABEL_TYPES.includes(labelType)) errors.push(`invalid labelType "${label.labelType}"`)

  // The cardinal rule: the source must be a real experimental source and must
  // not be an algorithm/recommendation/derived/synthetic source.
  if (isForbiddenSource(label.sourceType)) errors.push(`forbidden sourceType "${label.sourceType}" (algorithm/recommendation/derived/synthetic cannot be ground truth)`)
  else if (isReal(label.sourceType) && !isExperimentalSource(label.sourceType)) errors.push(`non-experimental sourceType "${label.sourceType}"`)

  if (label.syntheticFixture === true) errors.push("syntheticFixture cannot be an experimental label")
  if (label.derived === true) errors.push("derived label cannot be an experimental label")

  // Ground truth value/class checks per label type.
  if (labelType === "regression") {
    if (!Number.isFinite(Number(label.groundTruthValue))) errors.push("regression label needs a numeric groundTruthValue")
  } else if (labelType === "binary" || labelType === "multiclass") {
    if (!isReal(label.groundTruthClass)) errors.push(`${labelType} label needs a groundTruthClass`)
  }

  // A published DOI is required only for literature_experimental labels. Expert
  // review and independent validation are explicitly curated and carry an
  // experimentId + reviewer attribution instead — never a fabricated DOI.
  if (norm(label.sourceType) === "literature_experimental" && !isReal(label.sourceDoi)) {
    errors.push("literature_experimental label requires a real sourceDoi")
  }

  if (!isReal(label.validationLevel)) warnings.push("missing validationLevel")
  if (label.fieldSources == null || typeof label.fieldSources !== "object") warnings.push("missing fieldSources")

  return { labelId: label.labelId, valid: errors.length === 0, errors, warnings }
}

// Build the experimental-label dataset: validate, drop the invalid, and report
// a transparent summary. Nothing is fabricated — invalid rows are excluded.
export function buildExperimentalLabelDataset(rawLabels = []) {
  const rows = Array.isArray(rawLabels) ? rawLabels : Array.isArray(rawLabels?.labels) ? rawLabels.labels : []
  const labels = []
  const invalid = []
  for (const raw of rows) {
    const check = validateExperimentalLabel(raw)
    if (check.valid) labels.push({ ...raw })
    else invalid.push({ labelId: raw.labelId, errors: check.errors })
  }

  const bySourceType = {}
  const byLabelType = {}
  for (const label of labels) {
    const st = norm(label.sourceType)
    const lt = norm(label.labelType)
    bySourceType[st] = (bySourceType[st] || 0) + 1
    byLabelType[lt] = (byLabelType[lt] || 0) + 1
  }

  return {
    version: "v3.4",
    labels,
    invalid,
    summary: {
      total: labels.length,
      rejected: invalid.length,
      experimentalCount: labels.length, // every retained label is experimental by construction
      bySourceType,
      byLabelType,
      syntheticCount: 0,
    },
  }
}

export default buildExperimentalLabelDataset
