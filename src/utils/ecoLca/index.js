const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)))

const hasValue = value => {
  if (value === null || value === undefined || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  return !/^(pending|missing|unknown|not reported|not_reported|na|n\/a)$/i.test(String(value).trim())
}

const rss = (...values) => Math.sqrt(values.reduce((sum, value) => sum + Number(value || 0) ** 2, 0))

export function getEcoLcaCandidateMetal(candidate = {}) {
  const value = candidate.metalNode || candidate.metalCenter || candidate.metal || candidate.rawRecord?.metalNode || ""
  return String(value).split(/[,\s;/]+/).find(Boolean) || "pending"
}

function candidateDisplayName(candidate = {}) {
  const displayName = candidate.displayName || candidate.name
  if (displayName && !/^(core|qmof)\s+mof\s+record$/i.test(String(displayName).trim())) return displayName
  return candidate.rawName || candidate.sourceRecordId || displayName || candidate.id || candidate.candidateId || "pending"
}

function getCandidateField(candidate = {}, field) {
  const aliases = {
    synthesisRoute: ["synthesisRoute", "synthesisMethod"],
    synthesisSolvent: ["synthesisSolvent", "solvent"],
    synthesisEnergy: ["synthesisEnergy", "synthesisEnergyKwhPerKg", "energyUse"],
    yield: ["yield", "synthesisYield", "yieldPct"],
    synthesisTemperature: ["synthesisTemperature", "synthesisTemperatureC", "reactionTemperatureC"],
    synthesisTime: ["synthesisTime", "synthesisTimeHours", "reactionTimeHours"],
    reactionQuantities: ["reactionQuantities"],
    massBalance: ["massBalance", "inventoryMassBalance"],
    solventRecovery: ["solventRecovery", "solventRecoveryPct"],
    workingCapacity: ["workingCapacity", "workingCapacityKgCo2PerKg"],
    cycleStability: ["cycleStability", "regenerationCycles", "cycleCount"],
    regenerationEnergy: ["regenerationEnergy", "regenerationKwhPerKgCo2"],
  }
  const keys = aliases[field] || [field]
  for (const key of keys) {
    const value = candidate[key] ?? candidate.rawRecord?.[key] ?? candidate.descriptors?.[key]
    if (hasValue(value)) return value
  }
  return null
}

export function assessEcoLcaReadiness(candidate = {}, functionalUnitId = "kg_mof", model = {}) {
  const materialFields = model.candidateDataGate?.requiredFieldsMaterial || []
  const serviceFields = functionalUnitId === "tonne_co2"
    ? model.candidateDataGate?.requiredFieldsService || []
    : []
  const fields = [...materialFields, ...serviceFields]
  const rows = fields.map(field => ({
    field,
    available: field === "metalNode"
      ? getEcoLcaCandidateMetal(candidate) !== "pending"
      : hasValue(getCandidateField(candidate, field)),
  }))
  const availableCount = rows.filter(row => row.available).length
  const score = fields.length ? availableCount / fields.length : 0
  const threshold = Number(model.candidateDataGate?.minimumReadinessForCandidateComparison || 0.6)
  const hardBlockers = [
    ...(model.candidateDataGate?.hardBlockersMaterial || []),
    ...(functionalUnitId === "tonne_co2" ? model.candidateDataGate?.hardBlockersService || [] : []),
  ]
  const missingHardBlockers = hardBlockers.filter(field => {
    if (field === "metalNode") return getEcoLcaCandidateMetal(candidate) === "pending"
    return !hasValue(getCandidateField(candidate, field))
  })
  const grade = score >= 0.8 ? "A" : score >= 0.6 ? "B" : score >= 0.35 ? "C" : "D"
  return {
    fields: rows,
    availableCount,
    requiredCount: fields.length,
    score,
    grade,
    comparable: score >= threshold && missingHardBlockers.length === 0,
    missingFields: rows.filter(row => !row.available).map(row => row.field),
    hardBlockers,
    missingHardBlockers,
  }
}

function priceUncertaintyFraction(row = {}) {
  if (row.dataGrade === "fallback") return 0.65
  if (row.confidence === "high") return 0.15
  if (row.confidence === "medium") return 0.3
  if (row.confidence === "low") return 0.5
  return 0.4
}

function normalizeParameters(model, route, parameters = {}) {
  const defaults = model.serviceDefaults || {}
  return {
    yieldPct: clamp(parameters.yieldPct ?? route.defaultYieldPct ?? 70, 1, 100),
    solventRecoveryPct: clamp(parameters.solventRecoveryPct ?? route.defaultSolventRecoveryPct ?? 80, 0, 99.9),
    conversionCostUsdPerKg: Math.max(0, Number(parameters.conversionCostUsdPerKg ?? route.defaultConversionCostUsdPerKg ?? 0)),
    electricityPriceUsdPerKwh: Math.max(0, Number(parameters.electricityPriceUsdPerKwh ?? defaults.electricityPriceUsdPerKwh ?? 0.12)),
    gridGwpKgCo2ePerKwh: Math.max(0, Number(parameters.gridGwpKgCo2ePerKwh ?? defaults.gridGwpKgCo2ePerKwh ?? 0.55)),
    heatGwpKgCo2ePerKwh: Math.max(0, Number(parameters.heatGwpKgCo2ePerKwh ?? defaults.heatGwpKgCo2ePerKwh ?? 0.2)),
    workingCapacityKgCo2PerKgMofCycle: Math.max(0.0001, Number(parameters.workingCapacityKgCo2PerKgMofCycle ?? defaults.workingCapacityKgCo2PerKgMofCycle ?? 0.12)),
    cycleCount: Math.max(1, Number(parameters.cycleCount ?? defaults.cycleCount ?? 1000)),
    capacityUtilizationPct: clamp(parameters.capacityUtilizationPct ?? defaults.capacityUtilizationPct ?? 85, 1, 100),
    regenerationKwhPerKgCo2: Math.max(0, Number(parameters.regenerationKwhPerKgCo2 ?? defaults.regenerationKwhPerKgCo2 ?? 0.35)),
  }
}

function scenarioQuantity(row, route, params, model) {
  const multiplier = Number(route.multipliers?.[row.inventory_id] ?? 1)
  const yieldScale = Number(model.inventoryReference?.referenceYieldPct || 100) / params.yieldPct
  let recoveryScale = 1
  if (row.inventory_id === "inv_solvent") {
    const referenceRecovery = Number(model.inventoryReference?.referenceSolventRecoveryPct || 80)
    recoveryScale = (100 - params.solventRecoveryPct) / Math.max(0.1, 100 - referenceRecovery)
  }
  return Math.max(0, Number(row.base_value || 0) * multiplier * yieldScale * recoveryScale)
}

function applyFunctionalUnit(production, functionalUnitId, params) {
  if (functionalUnitId !== "tonne_co2") {
    return {
      ...production,
      functionalScale: 1,
      materialRequiredKg: 1,
      regenerationElectricityKwh: 0,
      unit: "kg_mof",
    }
  }
  const lifetimeCaptureKg = params.workingCapacityKgCo2PerKgMofCycle
    * params.cycleCount
    * (params.capacityUtilizationPct / 100)
  const materialRequiredKg = 1000 / Math.max(0.0001, lifetimeCaptureKg)
  const regenerationElectricityKwh = params.regenerationKwhPerKgCo2 * 1000
  const regenerationGwp = regenerationElectricityKwh * params.gridGwpKgCo2ePerKwh
  const regenerationCost = regenerationElectricityKwh * params.electricityPriceUsdPerKwh
  return {
    ...production,
    gwp: production.gwp * materialRequiredKg + regenerationGwp,
    gwpLow: production.gwpLow * materialRequiredKg + regenerationGwp * 0.7,
    gwpHigh: production.gwpHigh * materialRequiredKg + regenerationGwp * 1.3,
    energyMj: production.energyMj * materialRequiredKg + regenerationElectricityKwh * 3.6,
    solventKg: production.solventKg * materialRequiredKg,
    waterL: production.waterL * materialRequiredKg,
    wasteKg: production.wasteKg * materialRequiredKg,
    totalCost: production.totalCost * materialRequiredKg + regenerationCost,
    costLow: production.costLow * materialRequiredKg + regenerationCost * 0.8,
    costHigh: production.costHigh * materialRequiredKg + regenerationCost * 1.2,
    variableCost: production.variableCost * materialRequiredKg + regenerationCost,
    functionalScale: materialRequiredKg,
    materialRequiredKg,
    regenerationElectricityKwh,
    unit: "tonne_co2",
    contributions: [
      ...production.contributions.map(row => ({
        ...row,
        gwp: row.gwp * materialRequiredKg,
        gwpLow: row.gwpLow * materialRequiredKg,
        gwpHigh: row.gwpHigh * materialRequiredKg,
        cost: row.cost * materialRequiredKg,
        costLow: row.costLow * materialRequiredKg,
        costHigh: row.costHigh * materialRequiredKg,
        quantity: row.quantity * materialRequiredKg,
      })),
      {
        id: "service_regeneration",
        flow: "regeneration electricity",
        stage: "use_phase",
        unit: "kWh/t_co2",
        quantity: regenerationElectricityKwh,
        gwp: regenerationGwp,
        gwpLow: regenerationGwp * 0.7,
        gwpHigh: regenerationGwp * 1.3,
        cost: regenerationCost,
        costLow: regenerationCost * 0.8,
        costHigh: regenerationCost * 1.2,
        sourceType: "user_scenario",
      },
    ],
  }
}

export function buildEcoLcaScenario({
  candidate = {},
  inventoryRows = [],
  metalCostRows = [],
  model = {},
  routeId = "solvothermal",
  functionalUnitId = "kg_mof",
  parameters = {},
} = {}) {
  const routes = model.routeScenarios || []
  const route = routes.find(item => item.id === routeId) || routes[0] || { id: routeId, multipliers: {} }
  const params = normalizeParameters(model, route, parameters)
  const metal = getEcoLcaCandidateMetal(candidate)
  const metalPrice = (metalCostRows || []).find(row => String(row.metal || "").trim() === metal)
  const factors = model.characterizationFactors || {}

  const contributions = (inventoryRows || [])
    .filter(row => row.inventory_id !== "inv_lifetime")
    .map(row => {
      const factor = factors[row.inventory_id] || {}
      const quantity = scenarioQuantity(row, route, params, model)
      const factorGwp = row.inventory_id === "inv_electricity"
        ? params.gridGwpKgCo2ePerKwh
        : row.inventory_id === "inv_heat"
          ? params.heatGwpKgCo2ePerKwh
          : Number(factor.gwpKgCo2ePerUnit || 0)
      const price = row.inventory_id === "inv_metal_precursor" && metalPrice
        ? Number(metalPrice.usdPerKg || 0)
        : row.inventory_id === "inv_electricity"
          ? params.electricityPriceUsdPerKwh
          : Number(row.price_usd_per_unit || 0)
      const inventoryUncertainty = Number(row.uncertainty_pct || 0) / 100
      const factorUncertainty = Number(factor.uncertaintyPct || 0) / 100
      const impactUncertainty = Math.min(0.95, rss(inventoryUncertainty, factorUncertainty))
      const costUncertainty = Math.min(
        0.95,
        rss(inventoryUncertainty, row.inventory_id === "inv_metal_precursor" && metalPrice ? priceUncertaintyFraction(metalPrice) : 0.35),
      )
      const gwp = quantity * factorGwp
      const cost = quantity * price
      return {
        id: row.inventory_id,
        flow: row.flow,
        stage: row.stage,
        unit: row.unit,
        quantity,
        gwp,
        gwpLow: gwp * (1 - impactUncertainty),
        gwpHigh: gwp * (1 + impactUncertainty),
        energyMj: quantity * Number(factor.energyMjPerUnit || 0),
        cost,
        costLow: cost * (1 - costUncertainty),
        costHigh: cost * (1 + costUncertainty),
        sourceType: factor.sourceType || row.source_type || "proxy",
        factorReplacement: factor.replacement || row.roadmap_replacement,
        priceSource: row.inventory_id === "inv_metal_precursor" && metalPrice ? metalPrice.source : row.price_source,
      }
    })

  const sum = key => contributions.reduce((total, row) => total + Number(row[key] || 0), 0)
  const variableCost = sum("cost")
  const contingency = Number(model.economicModel?.contingencyPct || 0) / 100
  const conversionCost = params.conversionCostUsdPerKg
  const conversionUncertainty = Number(model.economicModel?.conversionCostUncertaintyPct || 0) / 100
  const totalCost = (variableCost + conversionCost) * (1 + contingency)
  const production = {
    gwp: sum("gwp"),
    gwpLow: sum("gwpLow"),
    gwpHigh: sum("gwpHigh"),
    energyMj: sum("energyMj"),
    solventKg: contributions.find(row => row.id === "inv_solvent")?.quantity || 0,
    waterL: contributions.find(row => row.id === "inv_water")?.quantity || 0,
    wasteKg: contributions.find(row => row.id === "inv_waste")?.quantity || 0,
    variableCost,
    totalCost,
    costLow: (sum("costLow") + conversionCost * (1 - conversionUncertainty)) * (1 + contingency),
    costHigh: (sum("costHigh") + conversionCost * (1 + conversionUncertainty)) * (1 + contingency),
    contributions,
  }
  const normalized = applyFunctionalUnit(production, functionalUnitId, params)
  const readiness = assessEcoLcaReadiness(candidate, functionalUnitId, model)
  const hotspots = [...normalized.contributions].sort((a, b) => b.gwp - a.gwp)
  const costHotspots = [...normalized.contributions].sort((a, b) => b.cost - a.cost)

  return {
    candidateId: candidate.id || candidate.candidateId || candidate.name || "pending",
    candidateName: candidateDisplayName(candidate),
    metal,
    metalPrice: metalPrice || null,
    route,
    parameters: params,
    functionalUnitId,
    readiness,
    conclusionStatus: readiness.comparable ? "candidate_comparable" : "scenario_only",
    ...normalized,
    hotspots,
    costHotspots,
  }
}

export function compareEcoLcaRoutes(options = {}) {
  const routes = options.model?.routeScenarios || []
  return routes.map(route => buildEcoLcaScenario({
    ...options,
    routeId: route.id,
    parameters: {
      ...options.parameters,
      yieldPct: route.defaultYieldPct,
      solventRecoveryPct: route.defaultSolventRecoveryPct,
      conversionCostUsdPerKg: route.defaultConversionCostUsdPerKg,
    },
  }))
}

export function compareEcoLcaCandidateCosts({
  candidates = [],
  limit = 8,
  ...options
} = {}) {
  const representatives = []
  const seenCandidateMetals = new Set()
  for (const candidate of candidates || []) {
    const metal = getEcoLcaCandidateMetal(candidate)
    if (metal === "pending" || seenCandidateMetals.has(metal)) continue
    seenCandidateMetals.add(metal)
    representatives.push(candidate)
  }
  const sorted = representatives
    .map(candidate => buildEcoLcaScenario({ ...options, candidate }))
    .sort((a, b) => a.totalCost - b.totalCost || a.candidateName.localeCompare(b.candidateName))
  const seenMetals = new Set()
  return sorted
    .filter(result => {
      if (seenMetals.has(result.metal)) return false
      seenMetals.add(result.metal)
      return true
    })
    .slice(0, limit)
}
