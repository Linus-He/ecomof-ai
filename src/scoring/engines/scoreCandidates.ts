// @ts-nocheck
import { calculateGraphAdjustedScore, getEvidenceConfidence } from "../../utils/scoring"
import { clamp01, safeNumber } from "../types/scoringTypes"

function candidateName(candidate, fallback) {
  return candidate?.name || candidate?.id || fallback
}

function evidenceWarning(candidate, completeness, confidence, missingPenalty) {
  if (missingPenalty >= 0.35) return "High missing-descriptor impact; treat rank as provisional."
  if (completeness < 0.65) return "Descriptor completeness is limited."
  if (confidence < 0.45) return "Evidence level is weak or needs validation."
  const limitations = Array.isArray(candidate?.limitations) ? candidate.limitations : []
  if (limitations.length) return limitations[0]
  return ""
}

export function scoreCandidates({
  candidates = [],
  matrix = [],
  descriptors = [],
  weights = {},
  missingValueStrategy = "median",
  evidenceMode = "descriptor-evidence",
} = {}) {
  const rowsById = new Map(matrix.map(row => [row.id, row]))
  return (Array.isArray(candidates) ? candidates : []).map((candidate, index) => {
    const id = candidate?.id || candidate?.name || `candidate-${index + 1}`
    const row = rowsById.get(id) || matrix[index] || { values: {}, missing: {}, rawValues: {} }
    const contributions = descriptors.map(descriptor => {
      const key = descriptor.key
      const value = clamp01(row.values?.[key], 0)
      const weight = Math.max(0, safeNumber(weights?.[key], 0))
      const missing = Boolean(row.missing?.[key])
      return {
        key,
        label: descriptor.label,
        labelZh: descriptor.labelZh,
        unit: descriptor.unit,
        rawValue: row.rawValues?.[key],
        normalizedValue: value,
        weight,
        contribution: value * weight,
        missing,
      }
    })
    const weightedScore01 = contributions.reduce((sum, item) => sum + item.contribution, 0)
    const descriptorCount = descriptors.length || 1
    const missingCount = contributions.filter(item => item.missing).length
    const completeness = 1 - (missingCount / descriptorCount)
    const missingPenalty = contributions.filter(item => item.missing).reduce((sum, item) => sum + item.weight, 0)
    const evidenceConfidence = getEvidenceConfidence(candidate?.evidenceLevel)
    const confidence = clamp01((evidenceConfidence * 0.58) + (completeness * 0.42), 0.3)
    const adjustedScore01 = evidenceMode === "quality-adjusted"
      ? weightedScore01 * (0.72 + 0.28 * confidence)
      : weightedScore01
    const descriptorScore = Number((adjustedScore01 * 100).toFixed(1))
    const graphScore = calculateGraphAdjustedScore(candidate, descriptorScore)
    const sortedContributions = [...contributions].sort((a, b) => b.contribution - a.contribution)
    const nonMissing = contributions.filter(item => !item.missing)
    const weakness = [...(nonMissing.length ? nonMissing : contributions)].sort((a, b) => a.normalizedValue - b.normalizedValue)[0]
    const topDrivers = sortedContributions.slice(0, 3)
    return {
      id,
      name: candidateName(candidate, `Candidate ${index + 1}`),
      candidate,
      score: graphScore.finalScore,
      descriptorScore,
      graphScore,
      score01: adjustedScore01,
      descriptorCompleteness: completeness,
      missingCount,
      missingPenalty,
      confidence,
      evidenceConfidence,
      evidenceLevel: candidate?.evidenceLevel || "needs-validation",
      evidenceWarning: evidenceWarning(candidate, completeness, confidence, missingPenalty),
      mainDriver: topDrivers[0] || null,
      topDrivers,
      mainWeakness: weakness || null,
      contributions,
      methodNote: missingValueStrategy === "zeroPenalty"
        ? "Missing descriptor cells contribute zero under the current strategy."
        : missingValueStrategy === "exclude"
          ? "Missing descriptor cells are excluded from CRITIC pairwise validity and imputed for display stability."
          : "Missing descriptor cells use median imputation for scoring stability.",
    }
  }).filter(row => Number.isFinite(row.score))
}
