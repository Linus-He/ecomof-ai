const clamp01 = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(1, number))
}

const round = (value, digits = 4) => {
  const factor = 10 ** digits
  return Math.round((Number(value) || 0) * factor) / factor
}

export function calculateStepScore(item = {}) {
  const score = (
    0.15 * clamp01(item.A1) +
    0.20 * clamp01(item.A2) +
    0.35 * clamp01(item.A3) +
    0.15 * clamp01(item.A4) -
    0.15 * clamp01(item.B1)
  )
  return round(Math.max(0, score))
}

export function calculateSelectivityFactor(item = {}) {
  const numerator = clamp01(item.Y_FA) * clamp01(item.S_FA_C)
  const denominator = (
    1 +
    1.0 * clamp01(item.Y_lactic) +
    0.8 * clamp01(item.Y_acetic) +
    0.5 * clamp01(item.Y_glycolic) +
    0.4 * clamp01(item.Y_pyruvic) +
    0.3 * clamp01(item.Y_solid)
  )
  return round(denominator > 0 ? numerator / denominator : 0)
}

export function calculateGateScore(item = {}) {
  const water = clamp01(item.waterStabilityScore)
  const accessibility = clamp01(item.accessibilityScore)
  const activeSite = clamp01(item.activeSiteConfidence)

  if (water < 0.5 || accessibility < 0.4 || activeSite < 0.4) return 0

  const floor = Math.min(water, accessibility, activeSite)
  const average = (water + accessibility + activeSite) / 3
  return round((0.5 * floor) + (0.5 * average))
}

export function calculateRGFAScore(item = {}) {
  return round(
    calculateGateScore(item) *
    calculateStepScore(item) *
    calculateSelectivityFactor(item),
  )
}

export function classifyCandidate(score, item = {}) {
  const gate = calculateGateScore(item)
  const value = Number(score)
  if (!Number.isFinite(value) || gate === 0 || value < 0.06) return "D"
  if (value >= 0.18) return "A"
  if (value >= 0.12) return "B"
  return "C"
}

export function generateCandidateExplanation(item = {}) {
  const explanations = []
  const stepScore = calculateStepScore(item)
  const selectivityFactor = calculateSelectivityFactor(item)
  const gateScore = calculateGateScore(item)

  if (clamp01(item.A3) >= 0.75) {
    explanations.push("High A3 indicates strong intermediate-to-formic-acid conversion.")
  } else if (clamp01(item.A3) >= 0.62) {
    explanations.push("A3 is moderate, so intermediate conversion remains a watch item.")
  } else {
    explanations.push("A3 is limited and should be checked with feeding experiments.")
  }

  if (clamp01(item.B1) <= 0.3) {
    explanations.push("Low B1 suggests suppressed byproduct pathways.")
  } else if (clamp01(item.B1) >= 0.5) {
    explanations.push("High B1 flags byproduct-pathway risk.")
  } else {
    explanations.push("B1 is not dominant, but byproduct monitoring is still needed.")
  }

  if (gateScore > 0) {
    explanations.push("Water stability gate passed.")
  } else {
    explanations.push("Water stability gate did not pass in the prototype rule.")
  }

  if (selectivityFactor >= 0.3) {
    explanations.push("Selectivity factor is higher than baseline.")
  } else {
    explanations.push("Selectivity factor is below the current prototype baseline.")
  }

  if (stepScore >= 0.55) {
    explanations.push("StepScore is driven by balanced A1-A4 contributions.")
  }

  return explanations
}
