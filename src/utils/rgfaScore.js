const DEFAULT_LOW = 0.05
const DEFAULT_GATE = 0.5

export function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clamp01(value, fallback = 0) {
  return Math.max(0, Math.min(1, safeNumber(value, fallback)))
}

function round(value, digits = 3) {
  const number = safeNumber(value, 0)
  const factor = 10 ** digits
  return Math.round(number * factor) / factor
}

export function calculateGateScore(item = {}) {
  const water = clamp01(item.waterStabilityScore, DEFAULT_GATE)
  const accessibility = clamp01(item.accessibilityScore, DEFAULT_GATE)
  const activeSite = clamp01(item.activeSiteConfidence, DEFAULT_GATE)

  return round(water * accessibility * activeSite)
}

export function calculateStepScore(item = {}) {
  const score = (
    0.15 * clamp01(item.A1, DEFAULT_LOW) +
    0.20 * clamp01(item.A2, DEFAULT_LOW) +
    0.35 * clamp01(item.A3, DEFAULT_LOW) +
    0.15 * clamp01(item.A4, DEFAULT_LOW) -
    0.15 * clamp01(item.B1, DEFAULT_LOW)
  )

  return round(Math.max(0, score))
}

export function calculateSelectivityFactor(item = {}) {
  const yFA = clamp01(item.Y_FA, DEFAULT_LOW)
  const sFAC = clamp01(item.S_FA_C, DEFAULT_LOW)
  const penalty = (
    1 +
    1.0 * clamp01(item.Y_lactic, 0) +
    0.8 * clamp01(item.Y_acetic, 0) +
    0.5 * clamp01(item.Y_glycolic, 0) +
    0.4 * clamp01(item.Y_pyruvic, 0) +
    0.3 * clamp01(item.Y_solid, 0)
  )

  const denominator = Math.max(DEFAULT_LOW, safeNumber(penalty, 1))
  return round((yFA * sFAC) / denominator)
}

export function calculateRGFAScore(item = {}) {
  return round(
    calculateGateScore(item) *
    calculateStepScore(item) *
    calculateSelectivityFactor(item),
  )
}

export function classifyCandidate(score, item = {}) {
  const value = safeNumber(score, 0)
  const b1 = clamp01(item.B1, DEFAULT_LOW)
  const a3 = clamp01(item.A3, DEFAULT_LOW)
  const gate = calculateGateScore(item)
  const formaldehydeRoute = clamp01(item.pathwayScores?.formaldehyde_to_formic, DEFAULT_LOW)

  if (value < 0.02 || b1 >= 0.6 || gate < 0.18) return "D"
  if (value >= 0.095 && b1 <= 0.3 && gate >= 0.45) return "A"
  if (value >= 0.05 && b1 <= 0.45) return "B"
  if (value >= 0.03 || a3 >= 0.56 || formaldehydeRoute >= 0.65) return "C"
  return "D"
}

export function generateCandidateExplanation(item = {}) {
  const explanations = []
  const a3 = clamp01(item.A3, DEFAULT_LOW)
  const b1 = clamp01(item.B1, DEFAULT_LOW)
  const a4 = clamp01(item.A4, DEFAULT_LOW)
  const water = clamp01(item.waterStabilityScore, DEFAULT_GATE)
  const accessibility = clamp01(item.accessibilityScore, DEFAULT_GATE)
  const activeSite = clamp01(item.activeSiteConfidence, DEFAULT_GATE)
  const selectivityFactor = calculateSelectivityFactor(item)
  const dominantPathway = String(item.dominantPathway || "")
  const riskPathway = String(item.riskPathway || "")
  const pathwayScores = item.pathwayScores || {}
  const formaldehydeRoute = clamp01(pathwayScores.formaldehyde_to_formic, DEFAULT_LOW)
  const glyceraldehydeRisk = clamp01(pathwayScores.glyceraldehyde_to_c2_byproducts, DEFAULT_LOW)
  const pyruvaldehydeRisk = clamp01(pathwayScores.pyruvaldehyde_to_lactic, DEFAULT_LOW)

  if (a3 >= 0.75) {
    explanations.push("High A3 suggests strong intermediate-to-formic-acid conversion.")
  } else if (a3 >= 0.62) {
    explanations.push("A3 is moderate and supports mechanistic follow-up with intermediate feeding.")
  } else {
    explanations.push("A3 remains limited and should be tested before priority ranking.")
  }

  if (b1 <= 0.3) {
    explanations.push("Low B1 indicates suppressed byproduct pathways.")
  } else if (b1 >= 0.5) {
    explanations.push("High B1 indicates that byproduct pathways may dominate.")
  } else {
    explanations.push("B1 is manageable but side products need time-series monitoring.")
  }

  if (formaldehydeRoute >= 0.72 || dominantPathway.includes("formaldehyde")) {
    explanations.push("Formaldehyde pathway appears dominant.")
  } else if (dominantPathway.includes("glyceraldehyde")) {
    explanations.push("Glyceraldehyde pathway suggests mixed formic-acid and C2-product behavior.")
  } else if (dominantPathway.includes("pyruvaldehyde")) {
    explanations.push("Pyruvaldehyde pathway dominance limits priority for formic acid screening.")
  }

  if (pyruvaldehydeRisk >= 0.4 || riskPathway.includes("pyruvaldehyde")) {
    explanations.push("Pyruvaldehyde-to-lactic-acid risk requires attention.")
  } else if (glyceraldehydeRisk >= 0.32 || riskPathway.includes("glyceraldehyde")) {
    explanations.push("Glyceraldehyde-to-glycolic/acetic-acid risk should be checked.")
  }

  if (water >= 0.7 && accessibility >= 0.65 && activeSite >= 0.65) {
    explanations.push("Water stability and accessibility gates passed.")
  } else {
    explanations.push("Gate factors need validation under aqueous NaHCO3 conditions.")
  }

  if (selectivityFactor >= 0.28) {
    explanations.push("Selectivity factor is higher than the prototype baseline.")
  }

  if (a4 >= 0.74) {
    explanations.push("A4 supports formate release and product stability assumptions.")
  }

  return explanations
}
