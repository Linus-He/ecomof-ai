import linkerDescriptorTable from "../../../public/data/linker_descriptor_table.json"
import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  assignFamily,
  clampScore,
  datasetRecords,
  provenanceTuple,
  recordRef,
  roundScore,
  safeNumber,
} from "./shared.js"

const TIER_VALUES = ORGANIC_ACID_SCORING_SPEC.normalization?.curatedTierValues || {
  low: 0.25,
  medium: 0.6,
  high: 0.9,
}

function normalizedLinker(value) {
  return String(value || "").trim().toLowerCase()
}

function descriptorLookup() {
  const lookup = new Map()
  asArray(linkerDescriptorTable.records).forEach(row => {
    [row.linker, ...asArray(row.aliases)].forEach(alias => lookup.set(normalizedLinker(alias), row))
  })
  return lookup
}

function linkerScore(row) {
  if (!row) return 0.5
  return clampScore(
    0.2 * clampScore(safeNumber(row.carboxylateCount, 0) / 4)
    + 0.25 * (row.nDonorOrAmine ? 1 : 0)
    + 0.15 * clampScore(safeNumber(row.aromaticRings, 0) / 4)
    + 0.15 * safeNumber(TIER_VALUES[row.openMetalSitePropensity], 0.5)
    + 0.25 * safeNumber(TIER_VALUES[row.lewisBasicityTier], 0.5)
  )
}

export function deriveLigandFactors(hostCandidates = [], datasets = {}) {
  const lookup = descriptorLookup()
  const records = datasetRecords(datasets.coreMofImport)
  const families = Array.from(new Set(asArray(hostCandidates).map(host => host.displayName)))

  return Object.fromEntries(families.map(family => {
    const familyRecords = records.filter(record => assignFamily(record) === family)
    const linkerCounts = familyRecords.reduce((acc, record) => {
      const linker = String(record.linker || "pending").trim() || "pending"
      acc[linker] = (acc[linker] || 0) + 1
      return acc
    }, {})
    const linkerRows = Object.entries(linkerCounts).map(([linker, count]) => {
      const descriptor = lookup.get(normalizedLinker(linker))
      return {
        linker,
        count,
        matched: Boolean(descriptor),
        score: roundScore(linkerScore(descriptor), 4),
        descriptor: descriptor ? {
          carboxylateCount: descriptor.carboxylateCount,
          nDonorOrAmine: descriptor.nDonorOrAmine,
          aromaticRings: descriptor.aromaticRings,
          openMetalSitePropensity: descriptor.openMetalSitePropensity,
          lewisBasicityTier: descriptor.lewisBasicityTier,
          costTierUsdKg: descriptor.costTierUsdKg,
        } : null,
      }
    }).sort((a, b) => b.count - a.count)
    const total = linkerRows.reduce((sum, row) => sum + row.count, 0)
    const value = total
      ? linkerRows.reduce((sum, row) => sum + row.score * row.count, 0) / total
      : 0.5
    const unmatched = linkerRows.filter(row => !row.matched)
    const meanLigandCostUsdKg = total
      ? linkerRows.reduce((sum, row) => sum + safeNumber(row.descriptor?.costTierUsdKg, 25) * row.count, 0) / total
      : 25
    return [family, {
      value: roundScore(value),
      meanLigandCostUsdKg: roundScore(meanLigandCostUsdKg, 2),
      linkerRows,
      tuple: provenanceTuple({
        sourceDataset: "data_ingestion/core_mof_import_v2.json+linker_descriptor_table.json",
        nRecords: familyRecords.length,
        rawAggregate: {
          linkerCounts,
          matchedLinkerRecords: total - unmatched.reduce((sum, row) => sum + row.count, 0),
          fallbackLinkerRecords: unmatched.reduce((sum, row) => sum + row.count, 0),
          meanLigandCostUsdKg: roundScore(meanLigandCostUsdKg, 2),
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.hostFactorMappings.ligandPathwaySupport.normalization,
        value,
        derivationLevel: unmatched.length ? "fallback" : "curated-ligand-descriptor",
        recordRefs: familyRecords.slice(0, 8).map(recordRef),
        citations: asArray(linkerDescriptorTable.records).slice(0, 3).map(row => row.source),
        fallbackReason: unmatched.length ? `Unmapped linker labels: ${unmatched.map(row => row.linker).join(", ")}` : "",
      }),
    }]
  }))
}
