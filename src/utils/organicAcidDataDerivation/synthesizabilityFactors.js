import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  provenanceTuple,
  roundScore,
  safeNumber,
} from "./shared.js"

export function deriveSynthesizabilityFactors(hostCandidates = [], datasets = {}) {
  const families = Array.from(new Set(asArray(hostCandidates).map(host => host.displayName)))
  const evidence = datasets.fairMofsFamilyEvidence || {}
  const evidenceByFamily = new Map(asArray(evidence.families).map(row => [row.family, row]))
  const globalPrior = safeNumber(evidence.globalPrior, 0.5)

  return Object.fromEntries(families.map(family => {
    const row = evidenceByFamily.get(family)
    const value = safeNumber(row?.value, globalPrior)
    const nEffective = safeNumber(row?.nEffective, 0)
    const derivationLevel = row?.derivationLevel || "neutral-prior"
    return [family, {
      value: roundScore(value),
      evidenceConfidence: roundScore(row?.evidenceConfidence),
      nEffective,
      reliability: roundScore(row?.reliability),
      tuple: provenanceTuple({
        sourceDataset: "FAIR-MOFs v1 · fair_mofs_family_synthesis_evidence.json",
        nRecords: nEffective,
        rawAggregate: {
          observedConditionAccessibility: row?.observedConditionAccessibility ?? null,
          globalPrior: row?.globalPrior ?? globalPrior,
          effectiveUniqueConditions: nEffective,
          uniqueDoiCount: safeNumber(row?.uniqueDoiCount, 0),
          reliability: row?.reliability ?? 0,
          evidenceConfidence: row?.evidenceConfidence ?? 0,
          temperatureCoverage: row?.temperatureCoverage ?? 0,
          timeCoverage: row?.timeCoverage ?? 0,
          medianReactionTemperatureK: row?.medianReactionTemperatureK ?? null,
          medianReactionTimeHours: row?.medianReactionTimeHours ?? null,
          evidenceTransfer: row?.evidenceTransfer || null,
          abundanceUsedAsScore: false,
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.hostFactorMappings.synthesizabilityScore.normalization,
        value,
        derivationLevel,
        recordRefs: asArray(row?.recordRefs),
        citations: asArray(row?.citations),
        fallbackReason: nEffective
          ? ""
          : row?.evidenceTransfer
            ? `No direct ${family} FAIR-MOFs condition row; point estimate transferred from ${row.evidenceTransfer.fromFamily} with reduced confidence.`
            : `No usable ${family} FAIR-MOFs temperature/time row; empirical global prior used with zero direct-evidence confidence.`,
      }),
    }]
  }))
}
