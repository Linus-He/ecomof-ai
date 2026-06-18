// @ts-nocheck
// V3.0 Data Foundation summary — single read model the UI (EcoScreen,
// Algorithm Validation Center, Interactive Scientific Figure, Research Reports)
// uses to show dataset counts, quality distribution, and benchmark readiness.

export const GOLD_SUFFICIENT_THRESHOLD = 20

const asRecords = dataset => {
  if (!dataset) return []
  if (Array.isArray(dataset)) return dataset
  if (Array.isArray(dataset.records)) return dataset.records
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

export function summarizeDataFoundation({ gold, literature, benchmark, labels, sourceRegistry } = {}) {
  const goldRecords = asRecords(gold)
  const literatureRecords = asRecords(literature)
  const benchmarkRecords = asRecords(benchmark)
  const labelRecords = asRecords(labels)

  const labelCount = labelRecords.filter(row => row.label != null && String(row.labelStatus || "missing").toLowerCase() !== "missing").length
  const benchmarkEligibleCount = benchmarkRecords.filter(row => row.benchmarkEligible === "Ready").length
  const trainCount = benchmarkRecords.filter(row => String(row.split || "").toLowerCase() === "train").length
  const testCount = benchmarkRecords.filter(row => String(row.split || "").toLowerCase() === "test").length

  const distribution = qualityDistribution(literatureRecords.length ? literatureRecords : goldRecords)
  const verifiedMetadataCount = [...goldRecords, ...literatureRecords].filter(row => row.evidence?.verifiedMetadata || row.verifiedMetadata).length
  const provenanceValues = literatureRecords.map(row => Number(row.quality?.provenanceCoverage ?? row.provenanceCoverage ?? 0))
  const provenanceCoverage = provenanceValues.length ? Number((provenanceValues.reduce((a, b) => a + b, 0) / provenanceValues.length).toFixed(3)) : 0

  const goldCount = goldRecords.length
  const goldSufficient = goldCount >= GOLD_SUFFICIENT_THRESHOLD

  const labelReadiness = labelCount <= 0 ? "Not Ready" : labelCount < 12 ? "Partially Ready" : "Ready"
  const benchmarkReadiness = benchmarkEligibleCount <= 0 ? "Not Ready" : benchmarkEligibleCount < 12 ? "Partially Ready" : "Ready"
  const dataQualityReadiness = goldSufficient ? "Ready" : goldCount > 0 ? "Partially Ready" : "Not Ready"

  return {
    goldCount,
    literatureCount: literatureRecords.length,
    benchmarkCount: benchmarkRecords.length,
    labelCount,
    benchmarkEligibleCount,
    trainCount,
    testCount,
    qualityDistribution: distribution,
    verifiedMetadataCount,
    provenanceCoverage,
    sourceCount: asRecords(sourceRegistry?.sources ? { records: sourceRegistry.sources } : sourceRegistry).length,
    goldSufficient,
    goldThreshold: GOLD_SUFFICIENT_THRESHOLD,
    readiness: {
      label: labelReadiness,
      benchmark: benchmarkReadiness,
      dataQuality: dataQualityReadiness,
    },
    blockers: [
      labelCount <= 0 ? "Experimental Labels Required" : null,
      !goldSufficient ? "Gold Dataset Insufficient" : null,
    ].filter(Boolean),
  }
}
