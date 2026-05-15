const DEFAULT_LOW = 0.05
const DEFAULT_GATE = 0.5

function clamp01(value, fallback = 0) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.min(1, number))
}

function round(value, digits = 3) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
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
  const denominator = (
    1 +
    1.0 * clamp01(item.Y_lactic, 0) +
    0.8 * clamp01(item.Y_acetic, 0) +
    0.5 * clamp01(item.Y_glycolic, 0) +
    0.4 * clamp01(item.Y_pyruvic, 0) +
    0.3 * clamp01(item.Y_solid, 0)
  )

  if (!Number.isFinite(denominator) || denominator <= 0) return round(DEFAULT_LOW * DEFAULT_LOW)
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
  const value = Number(score)
  const b1 = clamp01(item.B1, DEFAULT_LOW)
  const a3 = clamp01(item.A3, DEFAULT_LOW)
  const gate = calculateGateScore(item)

  if (!Number.isFinite(value) || value < 0.02 || b1 >= 0.6 || gate < 0.18) return "D"
  if (value >= 0.12 && b1 <= 0.3 && gate >= 0.45) return "A"
  if (value >= 0.06 && b1 <= 0.45) return "B"
  if (value >= 0.03 || a3 >= 0.56) return "C"
  return "D"
}

export function generateCandidateExplanation(item = {}) {
  const explanations = []
  const a3 = clamp01(item.A3, DEFAULT_LOW)
  const b1 = clamp01(item.B1, DEFAULT_LOW)
  const water = clamp01(item.waterStabilityScore, DEFAULT_GATE)
  const accessibility = clamp01(item.accessibilityScore, DEFAULT_GATE)
  const activeSite = clamp01(item.activeSiteConfidence, DEFAULT_GATE)
  const dominantPathway = String(item.dominantPathway || "")
  const riskPathway = String(item.riskPathway || "")

  if (a3 >= 0.75) {
    explanations.push("High A3 suggests strong intermediate-to-formic-acid conversion.")
  } else if (a3 >= 0.62) {
    explanations.push("A3 is moderate and supports a mechanistic candidate interpretation.")
  } else {
    explanations.push("A3 remains limited and should be tested with intermediate feeding.")
  }

  if (b1 <= 0.3) {
    explanations.push("Low B1 indicates suppressed byproduct pathways.")
  } else if (b1 >= 0.5) {
    explanations.push("High B1 indicates that byproduct pathways may dominate.")
  } else {
    explanations.push("B1 is manageable but side products need time-series monitoring.")
  }

  if (dominantPathway.includes("formaldehyde")) {
    explanations.push("Formaldehyde pathway appears dominant.")
  } else if (dominantPathway.includes("glyceraldehyde")) {
    explanations.push("Glyceraldehyde pathway suggests mixed formic-acid and C2-product behavior.")
  } else if (dominantPathway.includes("pyruvaldehyde")) {
    explanations.push("Pyruvaldehyde pathway dominance limits priority for formic acid screening.")
  }

  if (riskPathway.includes("pyruvaldehyde")) {
    explanations.push("Pyruvaldehyde-to-lactic-acid risk requires attention.")
  } else if (riskPathway.includes("glyceraldehyde")) {
    explanations.push("Glyceraldehyde-to-glycolic/acetic-acid risk should be checked.")
  }

  if (water >= 0.7 && accessibility >= 0.65 && activeSite >= 0.65) {
    explanations.push("Water stability and accessibility gates passed.")
  } else {
    explanations.push("Gate factors need validation under aqueous NaHCO3 conditions.")
  }

  return explanations
}
