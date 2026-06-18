// @ts-nocheck
// V3.0 Data Foundation summary — single read model the UI (EcoScreen,
// Algorithm Validation Center, Interactive Scientific Figure, Research Reports)
// uses to show dataset counts, quality distribution, and benchmark readiness.

export const GOLD_SUFFICIENT_THRESHOLD = 20

const asRecords = dataset => {
  if (!dataset) return []
  if (Array.isArray(dataset)) return dataset
  if (Array.isArray(dataset.records)) return dataset.records
  if (Array.isArray(dataset.labels)) return dataset.labels
  return []
}

const isReal = value => {
  if (value == null) return false
  return !["pending", "unknown", "ambiguous", "restricted", "missing", "not_available", ""].includes(String(value).trim().toLowerCase())
}

function qualityDistribution(records) {
  const distribution = { Gold: 0, Silver: 0, Bronze: 0, Rejected: 0 }
  for (const record of records) {
    const tier = record.qualityTier || record.quality?.validationStatus
    if (distribution[tier] != null) distribution[tier] += 1
  }
  return distribution
}

const DEFAULT_TARGETS = {
  literatureDataset: 300,
  goldDataset: 100,
  reactionDataset: 50,
  benchmarkDataset: 300,
  verifiedMetadata: 100,
  labelCount: 30,
  benchmarkEligible: 30,
  externalTest: 30,
}

function gap(current, target) {
  return Math.max(0, Number(target || 0) - Number(current || 0))
}

export function summarizeDataFoundation({ gold, literature, benchmark, labels, sourceRegistry, reaction, verifiedMetadataReport, growthSummary } = {}) {
  const goldRecords = asRecords(gold)
  const literatureRecords = asRecords(literature)
  const benchmarkRecords = asRecords(benchmark)
  const labelRecords = asRecords(labels)
  const reactionRecords = asRecords(reaction)

  const labelCount = Number(labels?.labelCount) || labelRecords.filter(row => (
    row.label != null || row.binaryLabel != null || row.groundTruthLabel != null || row.regression
  ) && String(row.labelStatus || "missing").toLowerCase() !== "missing").length
  const benchmarkEligibleCount = benchmarkRecords.filter(row => row.benchmarkEligible === "Ready").length
  const trainCount = benchmarkRecords.filter(row => String(row.split || "").toLowerCase() === "train").length
  const testCount = benchmarkRecords.filter(row => String(row.split || "").toLowerCase() === "test").length
  const externalTestCount = benchmarkRecords.filter(row => String(row.split || "").toLowerCase() === "external_test").length
  const reactionCoverage = reaction?.coverage || {
    yield: reactionRecords.filter(row => row.yield != null).length,
    selectivity: reactionRecords.filter(row => row.selectivity != null).length,
    conversion: reactionRecords.filter(row => row.conversion != null).length,
    doi: reactionRecords.filter(row => isReal(row.doi)).length,
  }

  const distribution = qualityDistribution(literatureRecords.length ? literatureRecords : goldRecords)
  const verifiedMetadataCount = Number(verifiedMetadataReport?.verifiedCount) || [...goldRecords, ...literatureRecords].filter(row => row.evidence?.verifiedMetadata || row.verifiedMetadata).length
  const provenanceValues = literatureRecords.map(row => Number(row.quality?.provenanceCoverage ?? row.provenanceCoverage ?? 0))
  const provenanceCoverage = provenanceValues.length ? Number((provenanceValues.reduce((a, b) => a + b, 0) / provenanceValues.length).toFixed(3)) : 0

  const goldCount = goldRecords.length
  const goldThreshold = Number(gold?.target || growthSummary?.targets?.goldDataset || GOLD_SUFFICIENT_THRESHOLD)
  const goldSufficient = goldCount >= goldThreshold

  const targets = { ...DEFAULT_TARGETS, ...(growthSummary?.targets || {}) }
  const labelReadiness = labelCount <= 0 ? "Not Ready" : labelCount < targets.labelCount ? "Partially Ready" : "Ready"
  const benchmarkReadiness = benchmarkEligibleCount <= 0 ? "Not Ready" : benchmarkEligibleCount < targets.benchmarkEligible ? "Partially Ready" : "Ready"
  const dataQualityReadiness = goldSufficient ? "Ready" : goldCount > 0 ? "Partially Ready" : "Not Ready"
  const current = {
    literatureDataset: literatureRecords.length,
    goldDataset: goldCount,
    reactionDataset: reactionRecords.length,
    benchmarkDataset: benchmarkRecords.length,
    verifiedMetadata: verifiedMetadataCount,
    labelCount,
    benchmarkEligible: benchmarkEligibleCount,
    externalTest: externalTestCount,
  }
  const gaps = Object.fromEntries(Object.entries(targets).map(([key, target]) => [key, gap(current[key], target)]))

  return {
    version: reactionRecords.length ? "V3.1" : "V3.0",
    goldCount,
    literatureCount: literatureRecords.length,
    reactionDatasetCount: reactionRecords.length,
    benchmarkCount: benchmarkRecords.length,
    labelCount,
    benchmarkEligibleCount,
    trainCount,
    testCount,
    externalTestCount,
    qualityDistribution: distribution,
    verifiedMetadataCount,
    reactionCoverage,
    provenanceCoverage,
    sourceCount: asRecords(sourceRegistry?.sources ? { records: sourceRegistry.sources } : sourceRegistry).length,
    goldSufficient,
    goldThreshold,
    readiness: {
      label: labelReadiness,
      benchmark: benchmarkReadiness,
      dataQuality: dataQualityReadiness,
    },
    targets,
    current,
    gaps,
    growth: growthSummary || null,
    futureMetrics: {
      accuracy: "Pending",
      rocAuc: "Pending",
      reason: externalTestCount < targets.externalTest
        ? "Experimental labels required; external test split remains below V3.1 metric threshold."
        : "Experimental labels require independent review before Accuracy / ROC-AUC display.",
      reasonZh: externalTestCount < targets.externalTest
        ? "仍需更多实验标签；external test split 未达到 V3.1 指标阈值。"
        : "实验标签仍需独立复核后才能显示 Accuracy / ROC-AUC。",
    },
    blockers: [
      labelCount <= 0 ? "Experimental Labels Required" : null,
      !goldSufficient ? "Gold Dataset Insufficient" : null,
      externalTestCount < targets.externalTest ? "External Test Labels Required" : null,
    ].filter(Boolean),
  }
}
