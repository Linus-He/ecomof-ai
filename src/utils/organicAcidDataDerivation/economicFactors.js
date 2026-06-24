import metalPrecursorCostTable from "../../../public/data/metal_precursor_cost_table.json"
import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  clampScore,
  normalizeValue,
  provenanceTuple,
  roundScore,
  safeNumber,
} from "./shared.js"

const COST_WEIGHTS = ORGANIC_ACID_SCORING_SPEC.economics.costWeights

function extractMetals(value = "") {
  const knownMetals = asArray(metalPrecursorCostTable.records).map(row => row.metal)
  return knownMetals.filter(metal => new RegExp(`\\b${metal}\\b`, "i").test(String(value)))
}

function averageCost(metals = [], lookup) {
  const rows = metals.map(metal => lookup.get(metal)).filter(Boolean)
  if (!rows.length) return { cost: 15, rows: [] }
  return {
    cost: rows.reduce((sum, row) => sum + safeNumber(row.usdPerKg, 0), 0) / rows.length,
    rows,
  }
}

export function deriveEconomicFactors(routes = [], hostSelection = {}, guestSelection = {}, costTable = metalPrecursorCostTable) {
  const lookup = new Map(asArray(costTable?.records).map(row => [row.metal, row]))
  const hosts = new Map(asArray(hostSelection.rankedHosts).map(row => [row.displayName, row]))
  const guests = new Map(asArray(guestSelection.rankedGuestMetals).map(row => [row.guestMetal, row]))
  const costRows = asArray(routes).map(route => {
    const host = hosts.get(route.hostMof)
    const guest = guests.get(route.guestMetal)
    const hostMetals = extractMetals(host?.metalNode || route.hostMof)
    const guestMetals = extractMetals(guest?.guestMetal || route.guestMetal)
    const hostCost = averageCost(hostMetals, lookup)
    const guestCost = averageCost(guestMetals, lookup)
    const ligandCost = safeNumber(host?.ligandDescriptorSummary?.meanLigandCostUsdKg, 25)
    const synthesisEnergyCost = 5 + 20 * (1 - safeNumber(host?.synthesizabilityScore, 0.5))
    const estimatedCost = (
      COST_WEIGHTS.hostMetalPrecursor * hostCost.cost
      + COST_WEIGHTS.guestMetalPrecursor * guestCost.cost
      + COST_WEIGHTS.ligandCostTier * ligandCost
      + COST_WEIGHTS.synthesisEnergyIndex * synthesisEnergyCost
    )
    return {
      route,
      host,
      guest,
      hostCost,
      guestCost,
      ligandCost,
      synthesisEnergyCost,
      estimatedCost,
    }
  })
  const costs = costRows.map(row => row.estimatedCost)
  return Object.fromEntries(costRows.map(row => {
    const normalizedCost = normalizeValue(row.estimatedCost, costs)
    const value = clampScore(1 - normalizedCost)
    const sourceRows = [...row.hostCost.rows, ...row.guestCost.rows]
    return [row.route.routeId, {
      value: roundScore(value),
      estimatedCost: roundScore(row.estimatedCost, 3),
      tuple: provenanceTuple({
        sourceDataset: `${costTable?.tableId || "metal_precursor_cost_table.json"}+linker_descriptor_table.json+derived synthesizability`,
        nRecords: sourceRows.length,
        rawAggregate: {
          hostMetals: row.hostCost.rows.map(item => item.metal),
          guestMetals: row.guestCost.rows.map(item => item.metal),
          hostMetalUsdKg: roundScore(row.hostCost.cost, 3),
          guestMetalUsdKg: roundScore(row.guestCost.cost, 3),
          ligandCostTierUsdKg: roundScore(row.ligandCost, 3),
          synthesisEnergyIndexUsdKg: roundScore(row.synthesisEnergyCost, 3),
          estimatedCostUsdKg: roundScore(row.estimatedCost, 3),
          costWeights: COST_WEIGHTS,
        },
        normalization: ORGANIC_ACID_SCORING_SPEC.economics.normalization,
        value,
        derivationLevel: sourceRows.some(item => item.dataGrade === "fallback") ? "curated-economic + fallback" : "curated-economic",
        recordRefs: sourceRows.map(item => `${item.metal}:${item.precursor}`),
        citations: sourceRows.map(item => `${item.source}; ${item.status}`),
        fallbackReason: sourceRows.length
          ? sourceRows.filter(item => item.dataGrade === "fallback").map(item => `${item.metal} price remains fallback`).join("; ")
          : "No mapped metal precursor row; default cost used.",
      }),
    }]
  }))
}
