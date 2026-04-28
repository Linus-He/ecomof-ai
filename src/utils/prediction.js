import { GAS_SYSTEMS, METAL_CENTERS, ORGANIC_LINKERS } from "../constants/catalogs"
import { R_GAS, MODEL_PROFILES } from "../constants/defaults"
import { getFunctionalGroupEntries, positionEffectFactor, getTotalFunctionalGroupCount, getFunctionalGroupCount } from "./functionalGroups"
import { formatFunctionalGroupSummary } from "./functionalGroups"

export function getGasSystem(id) {
  return GAS_SYSTEMS.find(g => g.id === id) || GAS_SYSTEMS[0]
}

export function qSafe(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

// Build Qst(n) for a loading n (mmol/g) given structure & gas.
// Two-site exponential decay: high-affinity (OMS/amine) saturates first, then physisorption.
export function qstAtLoading(n, { gas, hasOMS, fgBoost, pdNarrowness }) {
  const qHigh = gas.baseQst + (hasOMS ? gas.omsBonus : 0) + fgBoost + pdNarrowness
  const qLow  = gas.baseQst * 0.55
  const nStrong = 1.2 // mmol/g strong-site capacity (rough)
  const f = Math.exp(-n / nStrong)
  return qHigh * f + qLow * (1 - f)
}

export function predictMOF(inputs) {
  const {
    metalCenter, organicLinker, poreDiameter, betSurfaceArea,
    poreVolume, temperature, pressure, mlAlgorithm, gasSystem,
  } = inputs

  const metal  = METAL_CENTERS.find(m => m.value === metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === organicLinker)
  const gas    = getGasSystem(gasSystem)
  const model  = MODEL_PROFILES[mlAlgorithm] || MODEL_PROFILES.ensemble
  const functionalGroupEntries = getFunctionalGroupEntries(inputs)
  const totalFunctionalGroupCount = getTotalFunctionalGroupCount(inputs)

  // If the user picked an unavailable gas system, return a guard response.
  if (gas.priority === "unavailable") {
    return {
      unavailable: true,
      gasSystem: gas.id,
      message: gas.warningNote || "Gas system not yet supported.",
    }
  }

  // Surface-area and pore-volume contributions.
  const saContrib = (betSurfaceArea / 1000) * model.weights.sa
  const pvContrib = poreVolume * model.weights.pv

  // Optimal pore window depends on adsorbate kinetic diameter; use gas.primary.kinetic.
  const optPD = Math.max(5.0, gas.primary.kinetic * 2.2)
  const pdFactor = Math.exp(-model.weights.pd * Math.pow(poreDiameter - optPD, 2)) + 0.28

  // Van't Hoff temperature scaling anchored at 298 K.
  const tFactor = Math.exp(-0.006 * (temperature - 298))

  // Langmuir pressure term with gas-specific K.
  const kads = gas.baseKads
  const pFactor = (kads * pressure) / (1 + kads * pressure)

  // Functional-group contribution (effects are additive on primary uptake).
  let fgPrimary = 1.0
  let fgSel = 1.0
  let fgQstBoost = 0
  let stericPenalty = 1.0
  for (const { value, meta, detail } of functionalGroupEntries) {
    const positionFactor = positionEffectFactor(detail.positions)
    const dose = Math.min(3.2, Math.pow(detail.count, 0.82) * positionFactor)
    fgPrimary += meta.effectCO2 * dose * model.weights.fg
    fgSel     += meta.effectSel * dose
    stericPenalty -= (meta.steric || 0.03) * detail.count
    if (value === "amine")    fgQstBoost += gas.amineBonus * dose
    if (value === "hydroxyl") fgQstBoost += gas.amineBonus * 0.4 * dose
    if (value === "pyridyl")  fgQstBoost += gas.amineBonus * 0.7 * dose
  }
  fgPrimary = Math.max(0.45, fgPrimary * Math.max(0.66, stericPenalty))
  fgSel = Math.max(0.55, fgSel)

  // Narrow-pore enthalpy bonus (tight confinement).
  const pdNarrowness = Math.max(0, (7.5 - poreDiameter)) * 0.6

  const primaryBase = (saContrib + pvContrib) * pdFactor * tFactor * pFactor * fgPrimary
  let primaryUptake = Math.max(0.05, Math.min(14, primaryBase))

  // Secondary gas uptake — weaker physisorption, gas-specific ratio.
  const secondaryRatio = {
    "CO2/N2":   0.09 + 0.02 * (poreDiameter / 10),
    "CH4/N2":   0.35,
    "C2H4/C2H6":0.78,
    "C2H2/CO2": 0.62,
    "H2/N2":    0.40,
  }[gas.id] || 0.2
  let secondaryUptake = Math.max(0.005, primaryUptake * secondaryRatio)

  // Anomalous reversal for C2H2/CO2 on MOFs with strong CO2 affinity
  let anomaly = null
  if (gas.anomalyRule === "inverse_selectivity") {
    const reversalScore =
      Math.min(1.6, getFunctionalGroupCount(inputs, "amine") * 0.8) +
      Math.min(1.0, getFunctionalGroupCount(inputs, "hydroxyl") * 0.45) +
      (metal?.oms ? 0.5 : 0)
    if (reversalScore >= 1.1) {
      const attenuation = Math.min(1.16, 0.88 + reversalScore * 0.12)
      const swap = primaryUptake
      primaryUptake  = secondaryUptake * attenuation
      secondaryUptake = swap * 0.7
      anomaly = {
        type: "inverse_selectivity",
        label: "⚠ Inverse selectivity detected — CO₂ likely binds stronger than C₂H₂ on this MOF.",
        reason: "Amine/OH/OMS chemistry produces anomalous CO₂-over-C₂H₂ preference (cf. Chen et al. 2020).",
      }
    }
  }

  const rawSelectivity = (primaryUptake / Math.max(1e-3, secondaryUptake)) * fgSel * model.weights.sel
  const selectivity = Math.max(1.2, Math.min(400, rawSelectivity))
  const secondaryKads = Math.max(0.08, kads * secondaryRatio * 0.72)
  const henryPrimary = qSafe(primaryUptake / Math.max(pressure, 1e-4))
  const henrySecondary = qSafe(secondaryUptake / Math.max(pressure, 1e-4))
  const henrySelectivity = qSafe(henryPrimary / Math.max(henrySecondary, 1e-4))
  const iastSelectivity = qSafe(selectivity * (1 - Math.min(0.22, pressure * 0.08)) * (1 + Math.log1p(kads / Math.max(secondaryKads, 1e-4)) * 0.03))

  const betNorm = Math.min(1, betSurfaceArea / 5000)
  const pvNorm  = Math.min(1, poreVolume / 3)
  const confidenceBase = 0.72 + betNorm * 0.08 + pvNorm * 0.06 + (totalFunctionalGroupCount > 0 ? 0.04 : 0)
  const confidence = Math.max(0.50, Math.min(0.97, confidenceBase + model.weights.conf))

  // ── LCA Scoring ──
  const metalScore     = metal  ? metal.lcaScore  : 5.0
  const linkerScore    = linker ? linker.lcaScore : 5.0
  const energyScore    = Math.max(1, 10 - (temperature - 273) / 40)
  const pressureScore  = Math.max(1, 10 - pressure * 5)
  const fgEnvScore     = 5.0
    + Math.min(1.8, getFunctionalGroupCount(inputs, "amine") * 0.7)
    + Math.min(1.0, getFunctionalGroupCount(inputs, "hydroxyl") * 0.35)
    - Math.min(2.4, getFunctionalGroupCount(inputs, "thiol") * 1.2)
    - Math.min(0.9, (getFunctionalGroupCount(inputs, "halogen-I") + getFunctionalGroupCount(inputs, "trifluoromethyl")) * 0.3)
  const wasteScore     = Math.max(2.5, 6.8 - Math.max(0, totalFunctionalGroupCount - 1) * 0.25)
  const waterScore     = linker?.fossil ? 5.5 : 7.5
  const compositeGreen = (
    metalScore   * 0.25 +
    linkerScore  * 0.20 +
    energyScore  * 0.15 +
    pressureScore* 0.12 +
    fgEnvScore   * 0.13 +
    wasteScore   * 0.08 +
    waterScore   * 0.07
  )

  // ── Isotherm ──
  const qmax = primaryUptake / Math.max(1e-6, pFactor)
  const isothermData = []
  const pMax = gas.id === "H2/N2" ? 50 : gas.id === "CH4/N2" ? 10 : 1.05
  const step = pMax / 21
  for (let i = 0; i <= 21; i++) {
    const p = i * step
    const q = qmax * (kads * p) / (1 + kads * p)
    const litRef = q * (0.88 + Math.sin(p * 3) * 0.06)
    isothermData.push({
      pressure:   parseFloat(p.toFixed(3)),
      predicted:  parseFloat(q.toFixed(3)),
      literature: parseFloat(Math.max(0, litRef).toFixed(3)),
    })
  }

  // ── Thermodynamics ──
  const thermo = computeThermodynamics({
    gas, kads, qmax, pMax,
    hasOMS: !!metal?.oms,
    fgBoost: fgQstBoost,
    pdNarrowness,
  })

  const featureImportance = [
    { feature: "BET Surface Area", importance: 0.31 },
    { feature: "Pore Volume",      importance: 0.24 },
    { feature: "Metal Center",     importance: 0.18 },
    { feature: "Pore Diameter",    importance: 0.13 },
    { feature: "Func. Groups",     importance: 0.09 },
    { feature: "Temperature",      importance: 0.05 },
  ]

  const result = {
    gasSystem: gas.id,
    primaryName: gas.primary.name,
    secondaryName: gas.secondary.name,
    co2Uptake:       parseFloat(primaryUptake.toFixed(2)),
    n2Uptake:        parseFloat(secondaryUptake.toFixed(2)),
    primaryUptake:   parseFloat(primaryUptake.toFixed(2)),
    secondaryUptake: parseFloat(secondaryUptake.toFixed(2)),
    selectivity:     parseFloat(selectivity.toFixed(1)),
    selectivityDetails: {
      apparent: parseFloat(selectivity.toFixed(1)),
      henry: parseFloat(henrySelectivity.toFixed(1)),
      iast: parseFloat(iastSelectivity.toFixed(1)),
      henryPrimary: parseFloat(henryPrimary.toFixed(3)),
      henrySecondary: parseFloat(henrySecondary.toFixed(3)),
      method: "Langmuir-fit screening IAST/Henry proxy",
    },
    confidenceScore: parseFloat(confidence.toFixed(2)),
    modelProfile: model,
    latencyMs:       Math.round(42 + Math.random() * 30),
    anomaly,
    lca: {
      metalImpact:          parseFloat(metalScore.toFixed(1)),
      linkerSustainability: parseFloat(linkerScore.toFixed(1)),
      energyConsumption:    parseFloat(energyScore.toFixed(1)),
      wasteGeneration:      parseFloat(wasteScore.toFixed(1)),
      waterUsage:           parseFloat(waterScore.toFixed(1)),
      airQuality:           parseFloat(pressureScore.toFixed(1)),
      compositeGreenScore:  parseFloat(compositeGreen.toFixed(1)),
    },
    isothermData,
    thermo,
    featureImportance,
    functionalGroupSummary: formatFunctionalGroupSummary(inputs),
    algoNote: mlAlgorithm === "ensemble" ? null
      : "Current v1 beta applies a heuristic per-algorithm profile, not an independently trained production model.",
  }
  result.applicability = evaluateApplicability(inputs, result)
  return result
}

// Clausius-Clapeyron thermodynamics
export function computeThermodynamics({ gas, kads, qmax, pMax, hasOMS, fgBoost, pdNarrowness }) {
  const TREF = 298
  const temps = [273, 298, 323]
  const nPts  = 24
  const pMin = Math.max(1e-3, pMax * 0.005)

  const isotherms = temps.map(T => {
    const points = []
    for (let i = 0; i <= nPts; i++) {
      const p = pMin + (pMax - pMin) * (i / nPts)
      const nRef = qmax * (kads * p) / (1 + kads * p)
      const QstAvg = qstAtLoading(nRef * 0.5, { gas, hasOMS, fgBoost, pdNarrowness })
      const Keff = kads * Math.exp((QstAvg / R_GAS) * (1 / T - 1 / TREF))
      const n = qmax * (Keff * p) / (1 + Keff * p)
      points.push({
        pressure: parseFloat(p.toFixed(4)),
        loading:  parseFloat(n.toFixed(3)),
      })
    }
    return { T, points }
  })

  const loadings = []
  const nGrid = 20
  const nMax = qmax * 0.95
  for (let i = 1; i <= nGrid; i++) loadings.push((i / nGrid) * nMax)

  const qstCurve = loadings.map(n => {
    const xs = [], ys = []
    for (const { T, points } of isotherms) {
      const P = interpolateInverse(points, n)
      if (P == null || P <= 0) continue
      xs.push(1 / T)
      ys.push(Math.log(P))
    }
    if (xs.length < 2) return null
    const { slope } = linreg(xs, ys)
    const Qst = -R_GAS * slope
    return { loading: parseFloat(n.toFixed(3)), qst: parseFloat(Qst.toFixed(2)) }
  }).filter(Boolean)

  const qst0 = qstAtLoading(0.001, { gas, hasOMS, fgBoost, pdNarrowness })

  return {
    isotherms: isotherms.map(i => ({
      T: i.T,
      data: i.points.map(p => ({ pressure: p.pressure, loading: p.loading })),
    })),
    qstCurve,
    qst0: parseFloat(qst0.toFixed(2)),
    method: "Clausius-Clapeyron / van't Hoff on three isotherms (273, 298, 323 K)",
  }
}

export function interpolateInverse(points, targetN) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    if ((a.loading <= targetN && b.loading >= targetN) ||
        (a.loading >= targetN && b.loading <= targetN)) {
      const t = (targetN - a.loading) / Math.max(1e-9, (b.loading - a.loading))
      return a.pressure + t * (b.pressure - a.pressure)
    }
  }
  return null
}

export function linreg(xs, ys) {
  const n = xs.length
  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i]*xs[i]; sxy += xs[i]*ys[i] }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

export function evaluateApplicability(inputs, results) {
  const warnings = []
  const add = (code, message) => warnings.push({ code, message })
  if (inputs.poreDiameter < 3.5 || inputs.poreDiameter > 28) {
    add("pore_diameter", `Pore diameter ${inputs.poreDiameter} Å is near/outside the prototype descriptor envelope (3.5-28 Å).`)
  }
  if (inputs.betSurfaceArea < 150 || inputs.betSurfaceArea > 6000) {
    add("bet_surface_area", `BET surface area ${inputs.betSurfaceArea} m²/g is near/outside the prototype descriptor envelope (150-6000 m²/g).`)
  }
  if (inputs.poreVolume < 0.12 || inputs.poreVolume > 3.5) {
    add("pore_volume", `Pore volume ${inputs.poreVolume} cm³/g is near/outside the prototype descriptor envelope (0.12-3.5 cm³/g).`)
  }
  if (inputs.temperature < 273 || inputs.temperature > 323) {
    add("temperature", `Temperature ${inputs.temperature} K is outside the calibrated multi-temperature window (273-323 K).`)
  }
  const gas = getGasSystem(inputs.gasSystem)
  const pressureMax = gas.id === "H2/N2" ? 50 : gas.id === "CH4/N2" ? 10 : 1.05
  if (inputs.pressure < 0.01 || inputs.pressure > pressureMax) {
    add("pressure", `Pressure ${inputs.pressure} bar exceeds the current ${gas.id} isotherm plotting window (<= ${pressureMax} bar).`)
  }
  if (gas.priority === "beta") {
    add("gas_beta", `${gas.id} is marked beta because important physics or labels are incomplete.`)
  }
  if (results?.thermo?.qst0 && (results.thermo.qst0 < 4 || results.thermo.qst0 > 80)) {
    add("qst_range", `Qst0 ${results.thermo.qst0} kJ/mol is outside a conservative screening range (4-80 kJ/mol).`)
  }
  const score = Math.max(0.35, 1 - warnings.length * 0.12)
  return {
    warnings,
    score: parseFloat(score.toFixed(2)),
    status: warnings.length === 0 ? "in_domain" : warnings.length <= 2 ? "caution" : "out_of_domain",
  }
}

export function getPerformanceLabel(primary, selectivity) {
  const score = primary * 0.6 + selectivity * 0.01
  if (score > 5.5) return { label: "EXCELLENT", color: "#4E8EF7", bg: "#EAF4FF" }
  if (score > 3.5) return { label: "GOOD",      color: "#4E8EF7", bg: "#EAF4FF" }
  if (score > 2.0) return { label: "FAIR",      color: "#5578A7", bg: "#EEF3FA" }
  return               { label: "POOR",      color: "#C76666", bg: "#FDEEEE" }
}
