// @ts-nocheck
// V3.4 External Test Dataset — an independent hold-out set that NEVER enters
// training. Records come from independent literature / independent experiments /
// independent catalytic systems and must be disjoint from the training corpus
// by catalyst, experiment, and publication DOI.
import { isReal } from "./runImport.js"
import { isForbiddenSource } from "./experimentalLabelDataset.js"

const norm = value => String(value ?? "").trim().toLowerCase()

export const EXTERNAL_TEST_SOURCES = ["independent_literature", "independent_experiment", "independent_catalytic_system", "literature_experimental", "independent_validation", "expert_review"]

export function catalystKey(record = {}) {
  return norm(record.catalystId || record.candidateId || record.mofId)
}
export function doiKey(record = {}) {
  return norm(record.sourceDoi || record.doi || record.evidence?.doi)
}
export function experimentKey(record = {}) {
  return norm(record.experimentId || `${record.candidateId}:${record.temperature}:${record.pressure}:${record.solvent}:${record.reactionTime}`)
}

export function validateExternalTestRecord(record = {}) {
  const errors = []
  if (!isReal(record.recordId)) errors.push("missing recordId")
  if (!isReal(record.candidateId)) errors.push("missing candidateId")
  if (!isReal(record.groundTruthClass) && !Number.isFinite(Number(record.groundTruthValue))) errors.push("missing ground truth")
  if (isForbiddenSource(record.sourceType)) errors.push(`forbidden sourceType "${record.sourceType}"`)
  else if (isReal(record.sourceType) && !EXTERNAL_TEST_SOURCES.includes(norm(record.sourceType))) errors.push(`non-independent sourceType "${record.sourceType}"`)
  if (record.split && norm(record.split) !== "external_test") errors.push(`external test record must be split "external_test", got "${record.split}"`)
  return { recordId: record.recordId, valid: errors.length === 0, errors }
}

// Build the external test set and confirm it is disjoint from training. The
// `trainingRecords` are the labels/records used for train/validation/test.
export function buildExternalTestDataset(rawRecords = [], { trainingRecords = [] } = {}) {
  const rows = Array.isArray(rawRecords) ? rawRecords : Array.isArray(rawRecords?.records) ? rawRecords.records : []
  const train = Array.isArray(trainingRecords) ? trainingRecords : Array.isArray(trainingRecords?.labels) ? trainingRecords.labels : []

  const trainCatalysts = new Set(train.map(catalystKey).filter(Boolean))
  const trainDois = new Set(train.map(doiKey).filter(Boolean))
  const trainExperiments = new Set(train.map(experimentKey).filter(Boolean))

  const records = []
  const invalid = []
  const overlaps = []
  for (const raw of rows) {
    const check = validateExternalTestRecord(raw)
    if (!check.valid) { invalid.push({ recordId: raw.recordId, errors: check.errors }); continue }
    const overlapReasons = []
    if (trainCatalysts.has(catalystKey(raw))) overlapReasons.push("catalyst")
    if (doiKey(raw) && trainDois.has(doiKey(raw))) overlapReasons.push("doi")
    if (trainExperiments.has(experimentKey(raw))) overlapReasons.push("experiment")
    if (overlapReasons.length) { overlaps.push({ recordId: raw.recordId, overlap: overlapReasons }); continue }
    records.push({ ...raw, split: "external_test", externalTest: true })
  }

  return {
    version: "v3.4",
    records,
    invalid,
    overlaps,
    summary: {
      total: records.length,
      rejected: invalid.length,
      overlapRejected: overlaps.length,
      disjointFromTraining: overlaps.length === 0,
      trainingComparedAgainst: train.length,
    },
  }
}

export default buildExternalTestDataset
