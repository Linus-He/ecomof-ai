import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  citationRefs,
  clampScore,
  datasetRecords,
  derivationLabel,
  mean,
  primaryMetal,
  provenanceTuple,
  recordRef,
  roundScore,
  safeNumber,
  sampleRefs,
  weightedScore,
} from "./shared.js"

const GUEST_FACTOR_KEYS = ORGANIC_ACID_SCORING_SPEC.guestScoreWeights.map(([key]) => key)
const FALLBACK_THRESHOLD = ORGANIC_ACID_SCORING_SPEC.algorithm?.fallbackThreshold?.minimumRecords ?? 5

function sourceRows(datasets = {}) {
  return [
    ...datasetRecords(datasets.reactionDataset).map(record => ({ ...record, sourceDataset: "organic_acid_reaction_dataset_v1" })),
    ...datasetRecords(datasets.literatureDataset).map(record => ({
      ...record,
      ...(record.mof || {}),
      yield: record.performance?.yield,
      selectivity: record.performance?.selectivity,
      conversion: record.performance?.conversion,
      product: record.reaction?.targetProduct,
      sourceDataset: "organic_acid_literature_dataset_v2",
    })),
    ...datasetRecords(datasets.goldDataset).map(record => ({
      ...record,
      ...(record.mof || {}),
      yield: record.performance?.yield,
      selectivity: record.performance?.selectivity,
      conversion: record.performance?.conversion,
      product: record.reaction?.targetProduct,
      sourceDataset: "organic_acid_gold_dataset_v2",
    })),
  ]
}

function recordsForMetal(records, metal) {
  const metalKey = String(metal || "").toLowerCase()
  return asArray(records).filter(record => primaryMetal(record).toLowerCase() === metalKey)
}

function performance(record) {
  return mean([
    safeNumber(record.yield, NaN) / 100,
    safeNumber(record.selectivity, NaN) / 100,
    safeNumber(record.conversion, NaN) / 100,
  ])
}

function formatePerformance(records) {
  const formic = asArray(records).filter(record => /formic|formate/i.test(String(record.product || "")))
  return mean(formic.map(record => mean([safeNumber(record.yield, NaN) / 100, safeNumber(record.selectivity, NaN) / 100]))) ?? mean(records.map(performance))
}

function dataDerivedFactor(records, factorKey, value, rawAggregate) {
  return provenanceTuple({
    sourceDataset: Array.from(new Set(records.map(record => record.sourceDataset))).join("+") || "reaction+literature+gold",
    nRecords: records.length,
    rawAggregate,
    normalization: "normalized reaction performance fields on 0-1 scale",
    value,
    derivationLevel: "data-derived",
    recordRefs: sampleRefs(records),
    citations: citationRefs(records),
  })
}

function fallbackFactor(guest, key, nRecords, matchingRecords) {
  const value = safeNumber(guest?.[key], 0)
  return provenanceTuple({
    sourceDataset: "organic_acid_host_guest/guest_metal_candidates.json",
    nRecords,
    rawAggregate: {
      curatedLiteraturePrior: value,
      matchingPrimaryMetalRecords: nRecords,
    },
    normalization: "none; no dedicated dopant/guest-metal dataset field",
    value,
    derivationLevel: "curated-literature-prior",
    recordRefs: asArray(guest?.evidenceRefs).concat(asArray(matchingRecords).map(recordRef).slice(0, 3)),
    citations: citationRefs(matchingRecords),
    fallbackReason: "No dedicated dopant or guest-metal records meet the preregistered threshold.",
  })
}

export function deriveGuestFactors(guestMetalCandidates = [], datasets = {}, selectedHost = null) {
  const records = sourceRows(datasets)
  const rankedGuestMetals = asArray(guestMetalCandidates).map(guest => {
    const matchingRecords = recordsForMetal(records, guest.guestMetal)
    const canDerive = matchingRecords.length >= FALLBACK_THRESHOLD
    const perf = clampScore(mean(matchingRecords.map(performance)) ?? 0)
    const formate = clampScore(formatePerformance(matchingRecords) ?? perf)
    const conversion = clampScore(mean(matchingRecords.map(record => safeNumber(record.conversion, NaN) / 100)) ?? perf)
    const electron = clampScore(mean([perf, conversion]) ?? perf)
    const hostCompatibility = selectedHost?.displayName === "Al-MOF"
      ? clampScore(mean([safeNumber(selectedHost?.hostScore, 0), perf]) ?? perf)
      : clampScore(mean([safeNumber(selectedHost?.hostScore, 0), perf]) ?? perf)
    const derivedValues = {
      co2ActivationScore: conversion,
      formateStabilizationScore: formate,
      electronTransferSupport: electron,
      compatibilityWithAlMof: hostCompatibility,
      dopingFeasibility: clampScore(mean([perf, safeNumber(guest.dopingFeasibility, 0)]) ?? perf),
      postModificationFeasibility: clampScore(mean([perf, safeNumber(guest.postModificationFeasibility, 0)]) ?? perf),
      bimetallicConstructionFeasibility: clampScore(mean([perf, safeNumber(guest.bimetallicConstructionFeasibility, 0)]) ?? perf),
    }
    const factorProvenance = Object.fromEntries(GUEST_FACTOR_KEYS.map(key => {
      if (!canDerive) return [key, fallbackFactor(guest, key, matchingRecords.length, matchingRecords)]
      return [key, dataDerivedFactor(matchingRecords, key, derivedValues[key], {
        meanPerformance: roundScore(perf, 4),
        formatePerformance: roundScore(formate, 4),
        meanConversion: roundScore(conversion, 4),
      })]
    }))
    const factorValues = Object.fromEntries(GUEST_FACTOR_KEYS.map(key => [
      key,
      roundScore(canDerive ? derivedValues[key] : safeNumber(guest?.[key], 0)),
    ]))
    const guestScore = weightedScore(factorValues, ORGANIC_ACID_SCORING_SPEC.guestScoreWeights)
    const dataDerivedCount = Object.values(factorProvenance).filter(tuple => tuple.derivationLevel === "data-derived").length
    const fallbackCount = Object.values(factorProvenance).length - dataDerivedCount
    return {
      ...guest,
      ...factorValues,
      calculatedGuestScore: guestScore,
      guestScore,
      guestScoreBreakdown: {
        co2Activation: factorValues.co2ActivationScore,
        formateStabilization: factorValues.formateStabilizationScore,
        electronTransferSupport: factorValues.electronTransferSupport,
        compatibilityWithSelectedHost: factorValues.compatibilityWithAlMof,
        dopingFeasibility: factorValues.dopingFeasibility,
        postModificationFeasibility: factorValues.postModificationFeasibility,
        bimetallicConstructionFeasibility: factorValues.bimetallicConstructionFeasibility,
      },
      factorProvenance,
      derivationSummary: {
        dataDerivedCount,
        fallbackCount,
        totalRecords: Object.values(factorProvenance).reduce((sum, tuple) => sum + safeNumber(tuple.nRecords, 0), 0),
        summaryLabel: `${dataDerivedCount} guest factors data-derived; ${fallbackCount} literature priors`,
      },
      provenance: Object.entries(factorProvenance).map(([key, tuple]) => `${key}: ${derivationLabel(tuple)}`),
    }
  })
    .sort((a, b) => b.guestScore - a.guestScore)
    .map((guest, index) => ({ ...guest, ranking: index + 1 }))

  return {
    rankedGuestMetals,
    selectedGuestMetal: rankedGuestMetals[0] || null,
  }
}
