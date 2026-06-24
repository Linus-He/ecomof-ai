import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  assignFamily,
  clampScore,
  datasetRecords,
  normalizeValue,
  provenanceTuple,
  recordRef,
  roundScore,
  safeNumber,
} from "./shared.js"

export function deriveSynthesizabilityFactors(hostCandidates = [], datasets = {}) {
  const coreRecords = datasetRecords(datasets.coreMofImport)
  const literatureRecords = datasetRecords(datasets.literatureDataset).map(record => ({ ...record, ...(record.mof || {}) }))
  const families = Array.from(new Set(asArray(hostCandidates).map(host => host.displayName)))
  const rows = families.map(family => {
    const core = coreRecords.filter(record => assignFamily(record) === family)
    const literature = literatureRecords.filter(record => assignFamily(record) === family)
    const frequency = core.length + literature.length
    return {
      family,
      core,
      literature,
      frequency,
      transformedFrequency: Math.log1p(frequency),
    }
  })
  const frequencies = rows.map(row => row.transformedFrequency)
  const overrides = ORGANIC_ACID_SCORING_SPEC.synthesizability?.difficultyOverrides || {}

  return Object.fromEntries(rows.map(row => {
    const normalizedFrequency = row.frequency
      ? normalizeValue(row.transformedFrequency, frequencies)
      : 0.25
    const override = overrides[row.family]
    const multiplier = safeNumber(override?.multiplier, 1)
    const value = clampScore(normalizedFrequency * multiplier)
    const derivationLevel = row.frequency === 0
      ? "fallback"
      : override
        ? "data-derived (frequency proxy) + curated-synthesis-difficulty"
        : "data-derived (frequency proxy)"
    const records = [...row.core, ...row.literature]
    return [row.family, {
      value: roundScore(value),
      frequency: row.frequency,
      tuple: provenanceTuple({
        sourceDataset: "data_ingestion/core_mof_import_v2.json+organic_acid_literature_dataset_v2.json",
        nRecords: row.frequency,
        rawAggregate: {
          coreRecords: row.core.length,
          literatureRecords: row.literature.length,
          totalFrequency: row.frequency,
          log1pFrequency: roundScore(row.transformedFrequency, 4),
          normalizedFrequency: roundScore(normalizedFrequency, 4),
          difficultyMultiplier: multiplier,
          difficultyBasis: override?.basis || "",
          todo: override?.todo || "",
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.hostFactorMappings.synthesizabilityScore.normalization,
        value,
        derivationLevel,
        recordRefs: records.slice(0, 8).map(recordRef),
        citations: records.map(record => record.citation || record.evidence?.citation).filter(Boolean).slice(0, 3),
        fallbackReason: row.frequency ? "" : "No CoRE or literature records mapped to this family.",
      }),
    }]
  }))
}
