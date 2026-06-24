import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  buildFamilyAssignmentSummary,
  citationRefs,
  clampScore,
  datasetRecords,
  derivationCacheKey,
  derivationLabel,
  familyForHostName,
  groupByFamily,
  isAcceptedValidation,
  isAqueousSolvent,
  mean,
  median,
  normalizeValue,
  provenanceCoverage,
  provenanceTuple,
  qualityWeight,
  roundScore,
  safeNumber,
  sampleRefs,
  weightedScore,
} from "./shared.js"
import { deriveLigandFactors } from "./ligandFactors.js"
import { deriveSynthesizabilityFactors } from "./synthesizabilityFactors.js"

const HOST_FACTOR_KEYS = ORGANIC_ACID_SCORING_SPEC.hostScoreWeights.map(([key]) => key)
const FALLBACK_THRESHOLD = ORGANIC_ACID_SCORING_SPEC.algorithm?.fallbackThreshold?.minimumRecords ?? 5
const HOST_FACTOR_CACHE = new Map()
const HOST_FACTOR_CACHE_STATS = { computations: 0, hits: 0 }

function normalizeFamilyRows(rows, rawKey) {
  const values = rows.map(row => row[rawKey])
  return rows.map(row => ({
    ...row,
    normalized: roundScore(normalizeValue(row[rawKey], values)),
  }))
}

function sourceRows(datasets = {}) {
  return {
    core: datasetRecords(datasets.coreMofImport),
    qmof: datasetRecords(datasets.qmofImport),
    reaction: datasetRecords(datasets.reactionDataset),
    gas: datasetRecords(datasets.gasAdsorptionRecords).map(record => ({ ...record, ...(record.descriptors || {}) })),
    literature: datasetRecords(datasets.literatureDataset).map(record => ({ ...record, ...(record.mof || {}) })),
    gold: datasetRecords(datasets.goldDataset).map(record => ({ ...record, ...(record.mof || {}) })),
  }
}

function structuralMedianRows(groups, field) {
  return Object.entries(groups).map(([family, records]) => ({
    family,
    nRecords: records.filter(record => Number.isFinite(Number(record[field]))).length,
    rawValue: median(records.map(record => record[field])),
    records,
  }))
}

function buildPoreScores(families, rows) {
  const structuralGroups = groupByFamily([...rows.core, ...rows.qmof])
  const surfaceRows = normalizeFamilyRows(structuralMedianRows(structuralGroups, "surfaceArea"), "rawValue")
  const poreRows = normalizeFamilyRows(structuralMedianRows(structuralGroups, "poreVolume"), "rawValue")
  const voidRows = normalizeFamilyRows(structuralMedianRows(structuralGroups, "voidFraction"), "rawValue")
  return Object.fromEntries(families.map(family => {
    const records = structuralGroups[family] || []
    const surface = surfaceRows.find(row => row.family === family)
    const pore = poreRows.find(row => row.family === family)
    const voidFraction = voidRows.find(row => row.family === family)
    const nRecords = records.length
    const value = mean([surface?.normalized, pore?.normalized, voidFraction?.normalized]) ?? 0
    return [family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "CoRE+QMOF",
        nRecords,
        rawAggregate: {
          medianSurfaceArea: roundScore(surface?.rawValue, 4),
          medianPoreVolume: roundScore(pore?.rawValue, 4),
          medianVoidFraction: roundScore(voidFraction?.rawValue, 4),
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.hostFactorMappings.poreEnvironmentScore.normalization,
        value,
        derivationLevel: nRecords >= FALLBACK_THRESHOLD ? "data-derived" : "curated-fallback",
        recordRefs: sampleRefs(records),
        citations: citationRefs(records),
        fallbackReason: nRecords >= FALLBACK_THRESHOLD ? "" : `structural records below threshold ${FALLBACK_THRESHOLD}`,
      }),
    }]
  }))
}

function gasRecordValue(record) {
  const metrics = record.metrics || {}
  const raw = mean([
    safeNumber(metrics.primaryUptake, NaN) / 6,
    safeNumber(metrics.selectivity, NaN) / 80,
    safeNumber(metrics.workingCapacity, NaN) / 5,
    safeNumber(metrics.regenerability, NaN) / 100,
  ])
  return raw === null ? null : clampScore(raw)
}

function buildCo2Scores(families, rows, poreScores) {
  const gasGroups = groupByFamily(rows.gas.filter(record => /co2/i.test(`${record.primaryGas || ""} ${record.gasPair || ""}`)))
  const gasRows = Object.entries(gasGroups).map(([family, records]) => ({
    family,
    rawValue: mean(records.map(gasRecordValue)),
    records,
  }))
  const normalizedGasRows = normalizeFamilyRows(gasRows, "rawValue")
  return Object.fromEntries(families.map(family => {
    const direct = normalizedGasRows.find(row => row.family === family)
    const directRecords = gasGroups[family] || []
    const directUsable = directRecords.length >= FALLBACK_THRESHOLD && Number.isFinite(Number(direct?.normalized))
    const proxy = poreScores[family]
    const proxyRecords = safeNumber(proxy?.tuple?.nRecords, 0)
    const value = directUsable ? direct.normalized : safeNumber(proxy?.value, 0)
    return [family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: directUsable ? "gas_adsorption_records_v1" : "CoRE+QMOF structural proxy",
        nRecords: directUsable ? directRecords.length : proxyRecords,
        rawAggregate: directUsable
          ? { meanGasAdsorptionComposite: roundScore(direct.rawValue, 4) }
          : { proxy: "voidFraction/pore structural support", structuralPoreEnvironmentScore: safeNumber(proxy?.value, 0) },
        normalization: directUsable ? "cross-family min-max gas composite" : "proxy-flagged structural score",
        value,
        derivationLevel: directUsable ? "data-derived" : proxyRecords >= FALLBACK_THRESHOLD ? "proxy-flagged" : "curated-fallback",
        recordRefs: directUsable ? sampleRefs(directRecords) : asArray(proxy?.tuple?.recordRefs),
        citations: directUsable ? citationRefs(directRecords) : asArray(proxy?.tuple?.citations),
      }),
    }]
  }))
}

function combineCo2AndLigandScores(families, baseCo2Scores, ligandScores) {
  return Object.fromEntries(families.map(family => {
    const base = baseCo2Scores[family]
    const ligand = ligandScores[family]
    const value = (
      0.65 * safeNumber(base?.value, 0)
      + 0.35 * safeNumber(ligand?.value, 0.5)
    )
    const derivationLevels = [base?.tuple?.derivationLevel, ligand?.tuple?.derivationLevel].filter(Boolean)
    return [family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "derived CO2 support+linker_descriptor_table.json",
        nRecords: safeNumber(base?.tuple?.nRecords, 0) + safeNumber(ligand?.tuple?.nRecords, 0),
        rawAggregate: {
          directOrStructuralCo2Support: safeNumber(base?.value, 0),
          ligandPathwaySupport: safeNumber(ligand?.value, 0.5),
          weights: { directOrStructural: 0.65, ligand: 0.35 },
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.hostFactorMappings.co2EnrichmentSupport.normalization,
        value,
        derivationLevel: derivationLevels.some(level => /fallback/.test(level))
          ? "fallback"
          : "data-derived + curated-ligand-descriptor",
        recordRefs: asArray(base?.tuple?.recordRefs).concat(asArray(ligand?.tuple?.recordRefs)).slice(0, 8),
        citations: asArray(base?.tuple?.citations).concat(asArray(ligand?.tuple?.citations)).slice(0, 5),
        fallbackReason: [base?.tuple?.fallbackReason, ligand?.tuple?.fallbackReason].filter(Boolean).join(" "),
      }),
    }]
  }))
}

function acceptedReactionRows(records) {
  return asArray(records).filter(record => safeNumber(record.yield, 0) > 0 && isAcceptedValidation(record.validationStatus || record.validation?.validationStatus))
}

function buildAqueousScores(families, rows) {
  const groups = groupByFamily(rows.reaction)
  const rawRows = families.map(family => {
    const records = groups[family] || []
    const accepted = acceptedReactionRows(records)
    const aqueous = accepted.filter(record => isAqueousSolvent(record.solvent))
    return {
      family,
      records,
      accepted,
      rawValue: accepted.length ? aqueous.length / accepted.length : null,
      nRecords: records.length,
    }
  })
  const normalizedRows = normalizeFamilyRows(rawRows, "rawValue")
  return Object.fromEntries(normalizedRows.map(row => {
    const value = row.nRecords >= FALLBACK_THRESHOLD ? row.normalized : 0
    return [row.family, {
      rawValue: row.rawValue,
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "organic_acid_reaction_dataset_v1",
        nRecords: row.nRecords,
        rawAggregate: {
          acceptedRows: row.accepted.length,
          aqueousAcceptedRows: row.accepted.filter(record => isAqueousSolvent(record.solvent)).length,
          aqueousShare: roundScore(row.rawValue, 4),
        },
        normalization: "cross-family min-max accepted aqueous share",
        value,
        derivationLevel: row.nRecords >= FALLBACK_THRESHOLD ? "data-derived" : "curated-fallback",
        recordRefs: sampleRefs(row.records),
        citations: citationRefs(row.records),
        fallbackReason: row.nRecords >= FALLBACK_THRESHOLD ? "" : `reaction records below threshold ${FALLBACK_THRESHOLD}`,
      }),
    }]
  }))
}

function buildThermalScores(families, rows) {
  const groups = groupByFamily(rows.reaction)
  const rawRows = families.map(family => {
    const records = groups[family] || []
    const accepted = acceptedReactionRows(records)
    return {
      family,
      records,
      accepted,
      rawValue: median(accepted.map(record => record.temperature)),
      nRecords: records.length,
    }
  })
  const normalizedRows = normalizeFamilyRows(rawRows, "rawValue")
  return Object.fromEntries(normalizedRows.map(row => {
    const value = row.nRecords >= FALLBACK_THRESHOLD ? row.normalized : 0
    return [row.family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "organic_acid_reaction_dataset_v1",
        nRecords: row.nRecords,
        rawAggregate: {
          acceptedRows: row.accepted.length,
          medianTemperature: roundScore(row.rawValue, 4),
        },
        normalization: "cross-family min-max accepted median temperature",
        value,
        derivationLevel: row.nRecords >= FALLBACK_THRESHOLD ? "data-derived" : "curated-fallback",
        recordRefs: sampleRefs(row.records),
        citations: citationRefs(row.records),
        fallbackReason: row.nRecords >= FALLBACK_THRESHOLD ? "" : `reaction records below threshold ${FALLBACK_THRESHOLD}`,
      }),
    }]
  }))
}

function buildStabilityScores(families, rows, aqueousScores) {
  const coreGroups = groupByFamily(rows.core)
  const coreCounts = families.map(family => ({ family, count: (coreGroups[family] || []).length }))
  const countValues = coreCounts.map(row => row.count)
  const rawRows = families.map(family => {
    const coreCount = coreCounts.find(row => row.family === family)?.count || 0
    const coreRepresentation = normalizeValue(coreCount, countValues)
    const aqueous = aqueousScores[family]
    const rawValue = 0.7 * safeNumber(aqueous?.rawValue, 0) + 0.3 * coreRepresentation
    const reactionRecords = safeNumber(aqueous?.tuple?.nRecords, 0)
    return {
      family,
      rawValue,
      coreCount,
      coreRepresentation,
      reactionRecords,
      records: [...(coreGroups[family] || [])],
    }
  })
  const normalizedRows = normalizeFamilyRows(rawRows, "rawValue")
  return Object.fromEntries(normalizedRows.map(row => {
    const nRecords = row.coreCount + row.reactionRecords
    const value = nRecords >= FALLBACK_THRESHOLD ? row.normalized : 0
    return [row.family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "organic_acid_reaction_dataset_v1+CoRE",
        nRecords,
        rawAggregate: {
          aqueousShare: roundScore(aqueousScores[row.family]?.rawValue, 4),
          coreCount: row.coreCount,
          normalizedCoreRepresentation: roundScore(row.coreRepresentation, 4),
          indirectStabilityRaw: roundScore(row.rawValue, 4),
        },
        normalization: "cross-family min-max indirect aqueous survival proxy",
        value,
        derivationLevel: nRecords >= FALLBACK_THRESHOLD ? "data-derived indirect-proxy" : "curated-fallback",
        recordRefs: sampleRefs(row.records),
        citations: citationRefs(row.records),
        fallbackReason: nRecords >= FALLBACK_THRESHOLD ? "" : `combined reaction/core records below threshold ${FALLBACK_THRESHOLD}`,
      }),
    }]
  }))
}

function buildProvenanceScores(families, rows) {
  const groups = {
    core: groupByFamily(rows.core),
    qmof: groupByFamily(rows.qmof),
    reaction: groupByFamily(rows.reaction),
    literature: groupByFamily(rows.literature),
    gold: groupByFamily(rows.gold),
  }
  const rawRows = families.map(family => {
    const records = Object.values(groups).flatMap(group => group[family] || [])
    const rawValue = mean(records.map(record => provenanceCoverage(record) * qualityWeight(record)))
    return { family, records, rawValue, nRecords: records.length }
  })
  const normalizedRows = normalizeFamilyRows(rawRows, "rawValue")
  return Object.fromEntries(normalizedRows.map(row => {
    const value = row.nRecords >= FALLBACK_THRESHOLD ? row.normalized : 0
    return [row.family, {
      value: roundScore(value),
      tuple: provenanceTuple({
        sourceDataset: "CoRE+QMOF+reaction+literature+gold",
        nRecords: row.nRecords,
        rawAggregate: {
          meanQualityWeightedCoverage: roundScore(row.rawValue, 4),
        },
        normalization: "cross-family min-max provenance coverage",
        value,
        derivationLevel: row.nRecords >= FALLBACK_THRESHOLD ? "data-derived" : "curated-fallback",
        recordRefs: sampleRefs(row.records),
        citations: citationRefs(row.records),
        fallbackReason: row.nRecords >= FALLBACK_THRESHOLD ? "" : `provenance records below threshold ${FALLBACK_THRESHOLD}`,
      }),
    }]
  }))
}

function fallbackTuple(host, key, sparseTuple = null) {
  const value = safeNumber(host?.[key], 0)
  return {
    value,
    tuple: provenanceTuple({
      sourceDataset: "organic_acid_host_guest/host_mof_candidates.json",
      nRecords: safeNumber(sparseTuple?.nRecords, 0),
      rawAggregate: {
        curatedPrior: value,
        sparseDataAggregate: sparseTuple?.rawAggregate || {},
      },
      normalization: "none; descriptor absent from imported datasets",
      value,
      derivationLevel: "fallback",
      recordRefs: asArray(host?.evidenceRefs).concat(asArray(sparseTuple?.recordRefs)).slice(0, 8),
      citations: asArray(sparseTuple?.citations),
      fallbackReason: sparseTuple?.fallbackReason || "No imported dataset field represents this descriptor.",
    }),
  }
}

function useSparseFallback(host, key, row) {
  if (!row?.tuple || !/fallback/.test(row.tuple.derivationLevel)) return row
  return fallbackTuple(host, key, row.tuple)
}

export function deriveHostFactors(hostCandidates = [], datasets = {}) {
  const cacheKey = derivationCacheKey([
    hostCandidates,
    datasets.coreMofImport,
    datasets.qmofImport,
    datasets.reactionDataset,
    datasets.gasAdsorptionRecords,
    datasets.literatureDataset,
    datasets.goldDataset,
  ])
  if (HOST_FACTOR_CACHE.has(cacheKey)) {
    HOST_FACTOR_CACHE_STATS.hits += 1
    return HOST_FACTOR_CACHE.get(cacheKey)
  }
  HOST_FACTOR_CACHE_STATS.computations += 1
  const rows = sourceRows(datasets)
  const families = Array.from(new Set(asArray(hostCandidates).map(host => familyForHostName(host.displayName))))
  const poreScores = buildPoreScores(families, rows)
  const ligandScores = deriveLigandFactors(hostCandidates, datasets)
  const baseCo2Scores = buildCo2Scores(families, rows, poreScores)
  const co2Scores = combineCo2AndLigandScores(families, baseCo2Scores, ligandScores)
  const synthesizabilityScores = deriveSynthesizabilityFactors(hostCandidates, datasets)
  const aqueousScores = buildAqueousScores(families, rows)
  const thermalScores = buildThermalScores(families, rows)
  const stabilityScores = buildStabilityScores(families, rows, aqueousScores)
  const provenanceScores = buildProvenanceScores(families, rows)

  const rankedHosts = asArray(hostCandidates).map(host => {
    const family = familyForHostName(host.displayName)
    const factorRows = {
      stabilityProxy: useSparseFallback(host, "stabilityProxy", stabilityScores[family]) || fallbackTuple(host, "stabilityProxy"),
      aqueousStabilityEvidence: useSparseFallback(host, "aqueousStabilityEvidence", aqueousScores[family]) || fallbackTuple(host, "aqueousStabilityEvidence"),
      thermalStabilityEvidence: useSparseFallback(host, "thermalStabilityEvidence", thermalScores[family]) || fallbackTuple(host, "thermalStabilityEvidence"),
      poreEnvironmentScore: useSparseFallback(host, "poreEnvironmentScore", poreScores[family]) || fallbackTuple(host, "poreEnvironmentScore"),
      co2EnrichmentSupport: useSparseFallback(host, "co2EnrichmentSupport", co2Scores[family]) || fallbackTuple(host, "co2EnrichmentSupport"),
      ligandPathwaySupport: ligandScores[family] || fallbackTuple(host, "ligandPathwaySupport"),
      postModificationFeasibility: fallbackTuple(host, "postModificationFeasibility"),
      guestHostingFeasibility: fallbackTuple(host, "guestHostingFeasibility"),
      synthesizabilityScore: synthesizabilityScores[family] || fallbackTuple(host, "synthesizabilityScore"),
      provenanceQuality: useSparseFallback(host, "provenanceQuality", provenanceScores[family]) || fallbackTuple(host, "provenanceQuality"),
    }
    const factorValues = Object.fromEntries(HOST_FACTOR_KEYS.map(key => [key, roundScore(factorRows[key]?.value)]))
    const factorProvenance = Object.fromEntries(HOST_FACTOR_KEYS.map(key => [key, factorRows[key]?.tuple]))
    const hostScore = weightedScore(factorValues, ORGANIC_ACID_SCORING_SPEC.hostScoreWeights)
    const provenanceRows = Object.values(factorProvenance)
    const fallbackCount = provenanceRows.filter(tuple => /fallback/.test(tuple.derivationLevel)).length
    const curatedCount = provenanceRows.filter(tuple => !/fallback/.test(tuple.derivationLevel) && /curated/.test(tuple.derivationLevel)).length
    const dataDerivedCount = provenanceRows.length - curatedCount - fallbackCount
    return {
      ...host,
      ...factorValues,
      family,
      calculatedHostScore: hostScore,
      hostScore,
      hostScoreBreakdown: factorValues,
      factorProvenance,
      ligandDescriptorSummary: {
        meanLigandCostUsdKg: ligandScores[family]?.meanLigandCostUsdKg,
        linkerRows: ligandScores[family]?.linkerRows || [],
      },
      derivationSummary: {
        dataDerivedCount,
        curatedCount,
        fallbackCount,
        totalRecords: Object.values(factorProvenance).reduce((sum, tuple) => sum + safeNumber(tuple.nRecords, 0), 0),
        summaryLabel: `${dataDerivedCount} host factors data/proxy-derived; ${curatedCount} curated; ${fallbackCount} fallback`,
      },
      provenance: Object.entries(factorProvenance).map(([key, tuple]) => `${key}: ${derivationLabel(tuple)}`),
    }
  })
    .sort((a, b) => b.hostScore - a.hostScore)
    .map((host, index) => ({ ...host, ranking: index + 1 }))

  const result = {
    rankedHosts,
    selectedHost: rankedHosts[0] || null,
    familyAssignmentSummary: buildFamilyAssignmentSummary(datasets),
    scoringSpec: ORGANIC_ACID_SCORING_SPEC,
  }
  HOST_FACTOR_CACHE.set(cacheKey, result)
  return result
}

export function getHostFactorCacheStats() {
  return { ...HOST_FACTOR_CACHE_STATS, size: HOST_FACTOR_CACHE.size }
}

export function clearHostFactorCache() {
  HOST_FACTOR_CACHE.clear()
  HOST_FACTOR_CACHE_STATS.computations = 0
  HOST_FACTOR_CACHE_STATS.hits = 0
}
