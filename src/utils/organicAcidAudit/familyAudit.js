import {
  ORGANIC_ACID_SCORING_SPEC,
  assignFamily,
  asArray,
  datasetRecords,
  recordRef,
  roundScore,
  safeNumber,
} from "../organicAcidDataDerivation/shared.js"

const STRUCTURAL_DESCRIPTORS = ["surfaceArea", "poreVolume", "voidFraction"]

function quantile(values = [], probability = 0.5) {
  const rows = values.map(value => safeNumber(value, NaN)).filter(Number.isFinite).sort((a, b) => a - b)
  if (!rows.length) return null
  const position = (rows.length - 1) * probability
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return rows[lower]
  return rows[lower] + (rows[upper] - rows[lower]) * (position - lower)
}

function descriptorStats(records = [], descriptor) {
  const values = records.map(record => safeNumber(record[descriptor], NaN)).filter(Number.isFinite)
  const q1 = quantile(values, 0.25)
  const median = quantile(values, 0.5)
  const q3 = quantile(values, 0.75)
  const iqr = Number.isFinite(q1) && Number.isFinite(q3) ? q3 - q1 : null
  const lowerFence = Number.isFinite(iqr) ? q1 - 1.5 * iqr : null
  const upperFence = Number.isFinite(iqr) ? q3 + 1.5 * iqr : null
  const outliers = records.filter(record => {
    const value = safeNumber(record[descriptor], NaN)
    return Number.isFinite(value) && Number.isFinite(lowerFence) && (value < lowerFence || value > upperFence)
  })
  return {
    nRecords: values.length,
    median: roundScore(median, 4),
    q1: roundScore(q1, 4),
    q3: roundScore(q3, 4),
    iqr: roundScore(iqr, 4),
    lowerFence: roundScore(lowerFence, 4),
    upperFence: roundScore(upperFence, 4),
    outlierCount: outliers.length,
    outlierRefs: outliers.slice(0, 8).map(recordRef),
  }
}

function dominantRecords(records = []) {
  const ranges = Object.fromEntries(STRUCTURAL_DESCRIPTORS.map(descriptor => {
    const values = records.map(record => safeNumber(record[descriptor], NaN)).filter(Number.isFinite)
    return [descriptor, {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    }]
  }))
  return records.map(record => {
    const contributions = STRUCTURAL_DESCRIPTORS.map(descriptor => {
      const value = safeNumber(record[descriptor], NaN)
      const range = ranges[descriptor]
      if (!Number.isFinite(value) || range.max === range.min) return 0
      return (value - range.min) / (range.max - range.min)
    })
    return {
      recordRef: recordRef(record),
      sourceDatabase: record.sourceDatabase || "dataset pending",
      influenceScore: roundScore(contributions.reduce((sum, value) => sum + value, 0) / contributions.length, 4),
      values: Object.fromEntries(STRUCTURAL_DESCRIPTORS.map(descriptor => [descriptor, safeNumber(record[descriptor], null)])),
    }
  }).sort((a, b) => b.influenceScore - a.influenceScore).slice(0, 5)
}

export function buildFamilyFairnessAudit(datasets = {}, options = {}) {
  const threshold = options.minimumRecords ?? ORGANIC_ACID_SCORING_SPEC.algorithm?.fallbackThreshold?.minimumRecords ?? 5
  const sources = {
    core: datasetRecords(datasets.coreMofImport),
    qmof: datasetRecords(datasets.qmofImport),
    reaction: datasetRecords(datasets.reactionDataset),
    literature: datasetRecords(datasets.literatureDataset).map(record => ({ ...record, ...(record.mof || {}) })),
    gold: datasetRecords(datasets.goldDataset).map(record => ({ ...record, ...(record.mof || {}) })),
  }
  const families = asArray(options.families || ORGANIC_ACID_SCORING_SPEC.targetFamilies)
  const familyReports = families.map(family => {
    const byDataset = Object.fromEntries(Object.entries(sources).map(([key, rows]) => [
      key,
      rows.filter(record => assignFamily(record) === family),
    ]))
    const structuralRecords = [...byDataset.core, ...byDataset.qmof]
    const descriptors = Object.fromEntries(STRUCTURAL_DESCRIPTORS.map(descriptor => [
      descriptor,
      descriptorStats(structuralRecords, descriptor),
    ]))
    const totalOutliers = Object.values(descriptors).reduce((sum, row) => sum + row.outlierCount, 0)
    const totalMeasurements = Object.values(descriptors).reduce((sum, row) => sum + row.nRecords, 0)
    const outlierShare = totalMeasurements ? totalOutliers / totalMeasurements : 0
    const lowRecordCount = structuralRecords.length < threshold
    const outlierDominated = outlierShare >= 0.15
    return {
      family,
      nRecords: Object.fromEntries(Object.entries(byDataset).map(([key, rows]) => [key, rows.length])),
      structuralRecordCount: structuralRecords.length,
      descriptors,
      outlierShare: roundScore(outlierShare, 4),
      dominantRecords: dominantRecords(structuralRecords),
      confidence: lowRecordCount || outlierDominated ? "low-confidence-family" : "adequate-family-support",
      confidenceReasons: [
        ...(lowRecordCount ? [`structural records below threshold ${threshold}`] : []),
        ...(outlierDominated ? ["structural summary has >=15% IQR outlier measurements"] : []),
      ],
    }
  })

  return {
    auditId: "organic-acid-family-fairness-v3.9.8",
    method: "family record counts, median/IQR fences, outlier share, and high-influence structural records",
    minimumRecords: threshold,
    familyReports,
    lowConfidenceFamilies: familyReports.filter(row => row.confidence === "low-confidence-family").map(row => row.family),
    policy: "Families are reported separately; MIL-type membership is not pooled into Al/Fe/Cr single-metal families.",
  }
}
