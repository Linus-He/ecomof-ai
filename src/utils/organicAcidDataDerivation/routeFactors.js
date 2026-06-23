import {
  ORGANIC_ACID_SCORING_SPEC,
  assignFamily,
  asArray,
  citationRefs,
  clampScore,
  datasetRecords,
  derivationLabel,
  familyForHostName,
  mean,
  provenanceCoverage,
  provenanceTuple,
  qualityWeight,
  roundScore,
  safeNumber,
  sampleRefs,
} from "./shared.js"

const ROUTE_KEYS = ORGANIC_ACID_SCORING_SPEC.routeScoreKeys

function recordsWithFamily(dataset = []) {
  return datasetRecords(dataset).map(record => ({ ...record, ...(record.mof || {}) }))
}

function evidenceRows(datasets = {}) {
  return [
    ...recordsWithFamily(datasets.literatureDataset).map(record => ({ ...record, sourceDataset: "organic_acid_literature_dataset_v2" })),
    ...recordsWithFamily(datasets.goldDataset).map(record => ({ ...record, sourceDataset: "organic_acid_gold_dataset_v2" })),
  ]
}

function productMatches(record, targetProduct = "") {
  const target = String(targetProduct || "").toLowerCase()
  const product = String(record.reaction?.targetProduct || record.product || "").toLowerCase()
  if (!target || /organic acid/.test(target)) return /acid|methanol|formic|acetic|oxalic/.test(product)
  return target.split(/[\/,]/).some(part => product.includes(part.trim()))
}

function evidenceWeight(record) {
  return qualityWeight(record) * provenanceCoverage(record)
}

function sameConditionScore(record) {
  const score = safeNumber(record.comparability?.score, NaN)
  if (Number.isFinite(score)) return score >= 0.8 ? 1 : score >= 0.55 ? 0.5 : 0.15
  return 0.15
}

function routeName(route) {
  return `${route?.hostMof || "Host"} + ${route?.guestMetal || "guest"} ${route?.routeType || "route"}`
}

function scoreRouteFactors(route, context, evidenceStats) {
  const host = context.hostsByName.get(route.hostMof)
  const guest = context.guestsByMetal.get(route.guestMetal)
  const hostStabilityScore = safeNumber(host?.hostScoreBreakdown?.stabilityProxy, safeNumber(route.hostStabilityScore, 0))
  const hostPathwaySupportScore = roundScore(mean([
    host?.hostScoreBreakdown?.poreEnvironmentScore,
    host?.hostScoreBreakdown?.co2EnrichmentSupport,
  ]) ?? safeNumber(route.hostPathwaySupportScore, 0))
  const guestActivityCompensationScore = roundScore(mean([
    guest?.co2ActivationScore,
    guest?.formateStabilizationScore,
    guest?.electronTransferSupport,
  ]) ?? safeNumber(route.guestActivityCompensationScore, 0))
  const hostGuestComplementarityScore = roundScore(clampScore(
    0.5 * guestActivityCompensationScore
    + 0.25 * hostPathwaySupportScore
    + 0.25 * (1 - Math.abs(hostStabilityScore - guestActivityCompensationScore))
  ))
  const family = familyForHostName(route.hostMof)
  const stats = evidenceStats[family] || { records: [], weightedCount: 0, sameConditionShare: 0 }
  const evidenceConfidenceScore = roundScore(clampScore(0.35 + 0.65 * safeNumber(stats.normalizedEvidence, 0)))
  const riskPenalty = roundScore(clampScore(0.45 + 0.35 * safeNumber(stats.normalizedEvidence, 0) + 0.2 * safeNumber(stats.sameConditionShare, 0)))
  return {
    host,
    guest,
    family,
    stats,
    factors: {
      hostStabilityScore: roundScore(hostStabilityScore),
      hostPathwaySupportScore,
      guestActivityCompensationScore,
      hostGuestComplementarityScore,
      evidenceConfidenceScore,
      riskPenalty,
    },
  }
}

function buildEvidenceStats(routes = [], datasets = {}) {
  const rows = evidenceRows(datasets)
  const families = Array.from(new Set(asArray(routes).map(route => familyForHostName(route.hostMof))))
  const rawStats = families.map(family => {
    const routeTargets = asArray(routes).filter(route => familyForHostName(route.hostMof) === family).map(route => route.targetProduct)
    const records = rows.filter(record => assignFamily(record) === family)
      .filter(record => !routeTargets.length || routeTargets.some(target => productMatches(record, target)))
    const weightedCount = records.reduce((sum, record) => sum + evidenceWeight(record), 0)
    const sameConditionShare = records.length ? mean(records.map(sameConditionScore)) : 0
    return { family, records, weightedCount, sameConditionShare: sameConditionShare ?? 0 }
  })
  const values = rawStats.map(row => row.weightedCount)
  return Object.fromEntries(rawStats.map(row => {
    const max = Math.max(...values, 0)
    const min = Math.min(...values, 0)
    const normalizedEvidence = max === min ? 0.5 : (row.weightedCount - min) / (max - min)
    return [row.family, {
      ...row,
      normalizedEvidence: clampScore(normalizedEvidence),
    }]
  }))
}

function routeTuple(route, key, derived, context) {
  const hostTuple = derived.host?.factorProvenance || {}
  const guestTuple = derived.guest?.factorProvenance || {}
  if (key === "hostStabilityScore") {
    return provenanceTuple({
      ...hostTuple.stabilityProxy,
      sourceDataset: hostTuple.stabilityProxy?.sourceDataset || "derived host stabilityProxy",
      value: derived.factors[key],
    })
  }
  if (key === "hostPathwaySupportScore") {
    return provenanceTuple({
      sourceDataset: "derived host poreEnvironmentScore+co2EnrichmentSupport",
      nRecords: safeNumber(hostTuple.poreEnvironmentScore?.nRecords, 0) + safeNumber(hostTuple.co2EnrichmentSupport?.nRecords, 0),
      rawAggregate: {
        poreEnvironmentScore: derived.host?.hostScoreBreakdown?.poreEnvironmentScore,
        co2EnrichmentSupport: derived.host?.hostScoreBreakdown?.co2EnrichmentSupport,
      },
      normalization: "mean of derived host pathway factors",
      value: derived.factors[key],
      derivationLevel: [hostTuple.poreEnvironmentScore?.derivationLevel, hostTuple.co2EnrichmentSupport?.derivationLevel].some(level => /curated/.test(level || ""))
        ? "proxy-flagged"
        : "data-derived",
      recordRefs: asArray(hostTuple.poreEnvironmentScore?.recordRefs).concat(asArray(hostTuple.co2EnrichmentSupport?.recordRefs)).slice(0, 8),
    })
  }
  if (key === "guestActivityCompensationScore") {
    return provenanceTuple({
      sourceDataset: "derived guest activity factors",
      nRecords: safeNumber(guestTuple.co2ActivationScore?.nRecords, 0),
      rawAggregate: {
        co2ActivationScore: derived.guest?.co2ActivationScore,
        formateStabilizationScore: derived.guest?.formateStabilizationScore,
        electronTransferSupport: derived.guest?.electronTransferSupport,
      },
      normalization: "mean of guest activity factors",
      value: derived.factors[key],
      derivationLevel: guestTuple.co2ActivationScore?.derivationLevel || "curated-literature-prior",
      recordRefs: asArray(guestTuple.co2ActivationScore?.recordRefs),
      citations: asArray(guestTuple.co2ActivationScore?.citations),
      fallbackReason: guestTuple.co2ActivationScore?.fallbackReason || "",
    })
  }
  if (key === "hostGuestComplementarityScore") {
    return provenanceTuple({
      sourceDataset: "organic_acid_scoring_spec_v1",
      nRecords: 0,
      rawAggregate: {
        hostStabilityScore: derived.factors.hostStabilityScore,
        hostPathwaySupportScore: derived.factors.hostPathwaySupportScore,
        guestActivityCompensationScore: derived.factors.guestActivityCompensationScore,
        formula: ORGANIC_ACID_SCORING_SPEC.routeFactorMappings.hostGuestComplementarityScore.aggregate,
      },
      normalization: "clamped 0-1 deterministic combination",
      value: derived.factors[key],
      derivationLevel: "rule-derived",
    })
  }
  if (key === "evidenceConfidenceScore") {
    return provenanceTuple({
      sourceDataset: "organic_acid_literature_dataset_v2+organic_acid_gold_dataset_v2",
      nRecords: derived.stats.records.length,
      rawAggregate: {
        weightedEvidenceCount: roundScore(derived.stats.weightedCount, 4),
        normalizedEvidence: roundScore(derived.stats.normalizedEvidence, 4),
      },
      normalization: "cross-route min-max weighted evidence count with sparse floor",
      value: derived.factors[key],
      derivationLevel: "data-derived",
      recordRefs: sampleRefs(derived.stats.records),
      citations: citationRefs(derived.stats.records),
    })
  }
  return provenanceTuple({
    sourceDataset: "organic_acid_literature_dataset_v2+organic_acid_gold_dataset_v2",
    nRecords: derived.stats.records.length,
    rawAggregate: {
      weightedEvidenceCount: roundScore(derived.stats.weightedCount, 4),
      normalizedEvidence: roundScore(derived.stats.normalizedEvidence, 4),
      sameConditionShare: roundScore(derived.stats.sameConditionShare, 4),
    },
    normalization: "risk retention from evidence density and same-condition coverage",
    value: derived.factors[key],
    derivationLevel: "data-derived",
    recordRefs: sampleRefs(derived.stats.records),
    citations: citationRefs(derived.stats.records),
  })
}

export function deriveRouteFactors(hostGuestRoutes = [], datasets = {}, hostSelection = {}, guestSelection = {}) {
  const hostsByName = new Map(asArray(hostSelection.rankedHosts).map(host => [host.displayName, host]))
  const guestsByMetal = new Map(asArray(guestSelection.rankedGuestMetals).map(guest => [guest.guestMetal, guest]))
  const context = { hostsByName, guestsByMetal }
  const evidenceStats = buildEvidenceStats(hostGuestRoutes, datasets)
  const routeScores = asArray(hostGuestRoutes).map(route => {
    const derived = scoreRouteFactors(route, context, evidenceStats)
    const routeFactorProvenance = Object.fromEntries(ROUTE_KEYS.map(key => [key, routeTuple(route, key, derived, context)]))
    const finalHGCPS = roundScore(ROUTE_KEYS.reduce((product, key) => product * safeNumber(derived.factors[key], key === "riskPenalty" ? 1 : 0), 1))
    const dataDerivedCount = Object.values(routeFactorProvenance).filter(tuple => /data-derived|proxy-flagged|rule-derived/.test(tuple.derivationLevel)).length
    const fallbackCount = Object.values(routeFactorProvenance).filter(tuple => /curated/.test(tuple.derivationLevel)).length
    return {
      ...route,
      ...derived.factors,
      finalHGCPS,
      scoreBreakdown: {
        hostStability: derived.factors.hostStabilityScore,
        hostPathwaySupport: derived.factors.hostPathwaySupportScore,
        guestActivityCompensation: derived.factors.guestActivityCompensationScore,
        complementarity: derived.factors.hostGuestComplementarityScore,
        evidence: derived.factors.evidenceConfidenceScore,
        riskRetentionFactor: derived.factors.riskPenalty,
      },
      routeFactorProvenance,
      derivationSummary: {
        dataDerivedCount,
        fallbackCount,
        totalRecords: Object.values(routeFactorProvenance).reduce((sum, tuple) => sum + safeNumber(tuple.nRecords, 0), 0),
        summaryLabel: `${dataDerivedCount} route factors data/rule-derived; ${fallbackCount} curated priors`,
      },
      routeName: routeName(route),
      mainReason: `${route.hostMof} + ${route.guestMetal} is ranked by V3.9.6 preregistered data-derived HGCPS factors: host stability, host pathway support, guest activity compensation, complementarity, evidence confidence, and risk retention.`,
      provenanceStatus: Object.entries(routeFactorProvenance).map(([key, tuple]) => `${key}: ${derivationLabel(tuple)}`).join(" / "),
      provenance: Object.entries(routeFactorProvenance).map(([key, tuple]) => `${key}: ${derivationLabel(tuple)}`),
      evidenceSources: derived.stats.records,
      evidenceConfidence: derived.factors.evidenceConfidenceScore,
      riskRetentionFactor: derived.factors.riskPenalty,
    }
  })
    .sort((a, b) => b.finalHGCPS - a.finalHGCPS)
    .map((route, index) => ({
      ...route,
      ranking: index + 1,
      recommendationTier: index === 0
        ? "Top Priority Route"
        : route.finalHGCPS >= 0.22
          ? "Conditional Routes"
          : "Pending / Insufficient Evidence Routes",
      nextExperiment: index === 0
        ? `Validate ${route.hostMof} + ${route.guestMetal} under the minimum same-condition matrix, then compare structure retention, product distribution, and carbon balance against host-only and guest-only controls.`
        : route.nextExperiment,
    }))

  return {
    routeScores,
    topRoute: routeScores[0] || null,
  }
}
