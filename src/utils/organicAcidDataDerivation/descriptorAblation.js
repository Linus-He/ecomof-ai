import metalPrecursorCostTable from "../../../public/data/metal_precursor_cost_table.json"
import {
  ORGANIC_ACID_SCORING_SPEC,
  asArray,
  clampScore,
  roundScore,
  safeNumber,
} from "./shared.js"

const FACTOR_LABELS = {
  hostStabilityScore: ["主体稳定性", "Host stability"],
  hostPathwaySupportScore: ["主体路径支持", "Host pathway support"],
  guestActivityCompensationScore: ["客体活性补偿", "Guest activity compensation"],
  hostGuestComplementarityScore: ["主客体互补", "Host-guest complementarity"],
  evidenceConfidenceScore: ["证据置信", "Evidence confidence"],
  riskPenalty: ["风险保留", "Risk retention"],
  synthesizabilityScore: ["可合成性", "Synthesizability"],
  economicScore: ["经济性", "Economics"],
}

export const DESCRIPTOR_ABLATION_LAYERS = [
  { id: "L0", labelZh: "仅结构", labelEn: "Structure only", additionsZh: "结构、客体、证据与风险基线", additionsEn: "Structural, guest, evidence, and risk baseline" },
  { id: "L1", labelZh: "+ 配体", labelEn: "+ Ligand", additionsZh: "加入配体路径支持", additionsEn: "Adds ligand-aware pathway support" },
  { id: "L2", labelZh: "+ 可合成性", labelEn: "+ Synthesizability", additionsZh: "加入可合成性因子", additionsEn: "Adds synthesizability" },
  { id: "L3", labelZh: "+ 经济性", labelEn: "+ Economics", additionsZh: "加入真实价格经济性（全量）", additionsEn: "Adds real-price economics (full model)" },
]

function structuralPathwaySupport(route = {}) {
  const raw = route.routeFactorProvenance?.hostPathwaySupportScore?.rawAggregate || {}
  const pore = safeNumber(raw.poreEnvironmentScore, route.hostPathwaySupportScore)
  const combinedCo2 = safeNumber(raw.co2EnrichmentSupport, route.hostPathwaySupportScore)
  const co2Raw = route.routeFactorProvenance?.hostPathwaySupportScore?.rawAggregate?.directOrStructuralCo2Support
    ?? route.routeFactorProvenance?.hostPathwaySupportScore?.rawAggregate?.co2EnrichmentSupport
    ?? combinedCo2
  const poreWeight = safeNumber(ORGANIC_ACID_SCORING_SPEC.hostPathwaySupportFormula?.poreEnvironmentScore, 0.35)
  const co2Weight = safeNumber(ORGANIC_ACID_SCORING_SPEC.hostPathwaySupportFormula?.co2EnrichmentSupport, 0.3)
  const total = poreWeight + co2Weight || 1
  return roundScore((poreWeight * pore + co2Weight * safeNumber(co2Raw, combinedCo2)) / total)
}

function factorValuesForLayer(route, layerId) {
  const base = Object.fromEntries(ORGANIC_ACID_SCORING_SPEC.routeScoreKeys.map(key => [
    key,
    clampScore(safeNumber(route?.[key], key === "riskPenalty" ? 1 : 0)),
  ]))
  base.hostPathwaySupportScore = layerId === "L0"
    ? structuralPathwaySupport(route)
    : clampScore(safeNumber(route?.hostPathwaySupportScore, 0))
  if (layerId === "L0" || layerId === "L1") base.synthesizabilityScore = 1
  if (layerId !== "L3") base.economicScore = 1
  return base
}

function weightedGeometricScore(factors) {
  const zeroFloor = safeNumber(ORGANIC_ACID_SCORING_SPEC.algorithm?.zeroFloor, 0.001)
  const totalWeight = ORGANIC_ACID_SCORING_SPEC.routeScoreWeights.reduce((sum, [, weight]) => sum + safeNumber(weight, 0), 0) || 1
  const logScore = ORGANIC_ACID_SCORING_SPEC.routeScoreWeights.reduce((sum, [key, weight]) => (
    sum + (safeNumber(weight, 0) / totalWeight) * Math.log(Math.max(zeroFloor, safeNumber(factors[key], 0)))
  ), 0)
  return roundScore(Math.exp(logScore))
}

function contributionsFor(route, factors) {
  const totalWeight = ORGANIC_ACID_SCORING_SPEC.routeScoreWeights.reduce((sum, [, weight]) => sum + safeNumber(weight, 0), 0) || 1
  const rows = ORGANIC_ACID_SCORING_SPEC.routeScoreWeights.map(([key, weight]) => {
    const normalizedWeight = safeNumber(weight, 0) / totalWeight
    const factorValue = Math.max(safeNumber(ORGANIC_ACID_SCORING_SPEC.algorithm?.zeroFloor, 0.001), safeNumber(factors[key], 0))
    const logContribution = normalizedWeight * Math.log(factorValue)
    const [labelZh, labelEn] = FACTOR_LABELS[key] || [key, key]
    return {
      factorKey: key,
      labelZh,
      labelEn,
      factorValue: roundScore(factorValue),
      weight: roundScore(normalizedWeight, 4),
      logContribution: roundScore(logContribution, 5),
    }
  })
  const meanContribution = rows.reduce((sum, row) => sum + row.logContribution, 0) / (rows.length || 1)
  return rows.map(row => ({
    ...row,
    relativeContribution: roundScore(row.logContribution - meanContribution, 5),
    routeId: route.routeId,
  }))
}

function bestRankForHost(layer, hostMof) {
  const row = asArray(layer?.candidates)
    .filter(candidate => candidate.hostMof === hostMof)
    .sort((a, b) => a.rank - b.rank)[0]
  return row?.rank ?? null
}

function metalForHost(hostMof = "") {
  const match = String(hostMof).match(/^[A-Z][a-z]?/)
  return match?.[0] || ""
}

function impactSummary(layers, costTable = metalPrecursorCostTable) {
  const l1 = layers.find(layer => layer.id === "L1")
  const l2 = layers.find(layer => layer.id === "L2")
  const l3 = layers.find(layer => layer.id === "L3")
  const priceRows = asArray(costTable?.records).filter(row => row.dataGrade !== "fallback")
  const sortedPrices = priceRows.map(row => safeNumber(row.usdPerKg, NaN)).filter(Number.isFinite).sort((a, b) => a - b)
  const midpoint = sortedPrices.length ? sortedPrices[Math.floor((sortedPrices.length - 1) / 2)] : 0
  const cheapMetals = new Set(priceRows.filter(row => safeNumber(row.usdPerKg, Infinity) <= midpoint).map(row => row.metal))
  const cheapHosts = Array.from(new Set(asArray(l3?.candidates).map(row => row.hostMof)))
    .filter(host => cheapMetals.has(metalForHost(host)))
  const economicDeltas = cheapHosts.map(host => {
    const before = bestRankForHost(l2, host)
    const after = bestRankForHost(l3, host)
    return Number.isFinite(before) && Number.isFinite(after) ? before - after : null
  }).filter(Number.isFinite)
  const averageCheapMove = economicDeltas.length
    ? roundScore(economicDeltas.reduce((sum, value) => sum + value, 0) / economicDeltas.length, 2)
    : 0
  const mappedHostNames = Array.from(new Set(asArray(l2?.candidates).map(row => row.hostMof)))
    .filter(host => priceRows.some(row => row.metal === metalForHost(host)))
  const synthesisDrops = mappedHostNames.map(host => {
    const before = bestRankForHost(l1, host)
    const after = bestRankForHost(l2, host)
    return {
      hostMof: host,
      rankDelta: Number.isFinite(before) && Number.isFinite(after) ? before - after : 0,
    }
  }).sort((a, b) => a.rankDelta - b.rankDelta)
  const largestSynthesisDrop = synthesisDrops[0] || { hostMof: "pending", rankDelta: 0 }
  const economicDrops = mappedHostNames.map(host => {
    const before = bestRankForHost(l2, host)
    const after = bestRankForHost(l3, host)
    return {
      hostMof: host,
      rankDelta: Number.isFinite(before) && Number.isFinite(after) ? before - after : 0,
    }
  }).sort((a, b) => a.rankDelta - b.rankDelta)
  const largestEconomicDrop = economicDrops[0] || { hostMof: "pending", rankDelta: 0 }
  return {
    cheapMetalThresholdUsdKg: midpoint,
    cheapMetals: Array.from(cheapMetals),
    averageCheapMetalRankMove: averageCheapMove,
    largestSynthesisDrop,
    largestEconomicDrop,
    summaryZh: `计入经济性后，低于当前价格中位数的金属主体平均${averageCheapMove >= 0 ? "上移" : "下移"} ${Math.abs(averageCheapMove)} 位，${largestEconomicDrop.hostMof} 的经济性层间变化为 ${largestEconomicDrop.rankDelta >= 0 ? "上移" : "下降"} ${Math.abs(largestEconomicDrop.rankDelta)} 位；加入可合成性后，${largestSynthesisDrop.hostMof} ${largestSynthesisDrop.rankDelta >= 0 ? "上移" : "下降"} ${Math.abs(largestSynthesisDrop.rankDelta)} 位。`,
    summaryEn: `After economics is included, host metals below the current price median move ${averageCheapMove >= 0 ? "up" : "down"} by ${Math.abs(averageCheapMove)} ranks on average, while ${largestEconomicDrop.hostMof} moves ${largestEconomicDrop.rankDelta >= 0 ? "up" : "down"} by ${Math.abs(largestEconomicDrop.rankDelta)} ranks; after synthesizability is added, ${largestSynthesisDrop.hostMof} moves ${largestSynthesisDrop.rankDelta >= 0 ? "up" : "down"} by ${Math.abs(largestSynthesisDrop.rankDelta)} ranks.`,
  }
}

export function buildDescriptorAblation(routeScores = [], options = {}) {
  const layers = DESCRIPTOR_ABLATION_LAYERS.map(layer => {
    const ranked = asArray(routeScores)
      .map(route => {
        const factors = factorValuesForLayer(route, layer.id)
        return {
          routeId: route.routeId,
          routeName: route.routeName || `${route.hostMof || "Host"} + ${route.guestMetal || "guest"}`,
          hostMof: route.hostMof,
          guestMetal: route.guestMetal,
          score: weightedGeometricScore(factors),
          factors,
          contributions: contributionsFor(route, factors),
        }
      })
      .sort((a, b) => b.score - a.score || String(a.routeId).localeCompare(String(b.routeId)))
      .map((row, index) => ({ ...row, rank: index + 1 }))
    return { ...layer, candidates: ranked }
  })
  const byRoute = Object.fromEntries(asArray(routeScores).map(route => {
    const evolution = layers.map((layer, index) => {
      const row = layer.candidates.find(candidate => candidate.routeId === route.routeId)
      const previous = index > 0 ? layers[index - 1].candidates.find(candidate => candidate.routeId === route.routeId) : null
      const baseline = layers[0].candidates.find(candidate => candidate.routeId === route.routeId)
      return {
        layerId: layer.id,
        labelZh: layer.labelZh,
        labelEn: layer.labelEn,
        score: row?.score ?? 0,
        rank: row?.rank ?? 0,
        rankDelta: previous ? previous.rank - row.rank : 0,
        rankDeltaFromBaseline: baseline ? baseline.rank - row.rank : 0,
      }
    })
    const full = layers[3]?.candidates.find(candidate => candidate.routeId === route.routeId)
    return [route.routeId, {
      routeId: route.routeId,
      routeName: route.routeName || `${route.hostMof || "Host"} + ${route.guestMetal || "guest"}`,
      hostMof: route.hostMof,
      guestMetal: route.guestMetal,
      evolution,
      contributions: full?.contributions || [],
    }]
  }))
  return {
    version: "V3.9.10",
    scoringSpecId: ORGANIC_ACID_SCORING_SPEC.specId,
    fixedWeights: Object.fromEntries(ORGANIC_ACID_SCORING_SPEC.routeScoreWeights),
    layers,
    candidates: Object.values(byRoute),
    impactSummary: impactSummary(layers, options.costTable || metalPrecursorCostTable),
    boundary: "Descriptor ablation uses the locked spec-v3 weights. Inactive descriptor groups are neutral factors; no rank or score is hardcoded. FAIR-MOFs record count is not a point-score input.",
  }
}
