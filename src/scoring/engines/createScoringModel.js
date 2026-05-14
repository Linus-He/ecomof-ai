import { computeWeightingByAlgorithm } from "../algorithms"
import { getDatasetDescriptorCoverage, getDescriptorsForPreset } from "../descriptors/descriptorAccessors"
import { normalizeDescriptorMatrix } from "../descriptors/descriptorNormalizers"
import { getDescriptors } from "../descriptors/descriptorRegistry"
import { explainCandidateScore } from "../explainers/explainCandidateScore"
import { explainWeights } from "../explainers/explainWeights"
import { buildScoringDiagnostics } from "../explainers/buildScoringDiagnostics"
import { resolveScoringPreset } from "../presets/scoringPresets"
import { DEFAULT_SCORING_OPTIONS, normalizeWeightMap } from "../types/scoringTypes"
import { rankCandidates } from "./rankCandidates"
import { scoreCandidates } from "./scoreCandidates"

function methodLabel(id) {
  if (id === "critic") return "CRITIC"
  if (id === "equal") return "Equal"
  if (id === "manual") return "Manual"
  return "Hybrid"
}

function buildMethodComparison({ candidates, matrixResult, descriptors, manualWeights, hybridAlpha, missingValueStrategy, evidenceMode, options }) {
  const algorithms = ["manual", "equal", "critic", "hybrid"]
  const rankingsByAlgorithm = {}
  const warnings = []
  algorithms.forEach(algorithm => {
    try {
      const weighting = computeWeightingByAlgorithm(algorithm, {
        matrix: matrixResult.matrix,
        candidates,
        descriptors,
        directions: matrixResult.directions,
        missingValueStrategy,
        manualWeights,
        hybridAlpha,
        context: { comparison: true },
        options,
      })
      const scored = scoreCandidates({
        candidates,
        matrix: matrixResult.matrix,
        descriptors,
        weights: weighting.weights,
        missingValueStrategy,
        evidenceMode,
      })
      rankingsByAlgorithm[algorithm] = rankCandidates(scored)
    } catch (error) {
      warnings.push(`${methodLabel(algorithm)} comparison failed; rank column was omitted.`)
      rankingsByAlgorithm[algorithm] = []
    }
  })
  const idSet = new Set()
  Object.values(rankingsByAlgorithm).forEach(rows => rows.forEach(row => idSet.add(row.id)))
  const rows = Array.from(idSet).map(id => {
    const ranks = Object.fromEntries(algorithms.map(algorithm => {
      const row = rankingsByAlgorithm[algorithm].find(item => item.id === id)
      return [algorithm, row?.rank || null]
    }))
    const numericRanks = Object.values(ranks).filter(Number.isFinite)
    const base = rankingsByAlgorithm.hybrid.find(item => item.id === id) || rankingsByAlgorithm.critic.find(item => item.id === id)
    return {
      id,
      name: base?.name || id,
      ranks,
      score: base?.score || 0,
      maxRankShift: numericRanks.length ? Math.max(...numericRanks) - Math.min(...numericRanks) : 0,
    }
  }).sort((a, b) => (a.ranks.hybrid || 999) - (b.ranks.hybrid || 999))
  return {
    algorithms: algorithms.map(id => ({ id, label: methodLabel(id) })),
    rows,
    warnings,
  }
}

export function createScoringModel(config = {}) {
  const preset = resolveScoringPreset(config.preset)
  const presetKey = config.descriptorPreset || preset.descriptorPreset || (typeof config.preset === "string" ? config.preset : "coreMof8")
  const requestedDescriptors = config.descriptorKeys?.length
    ? getDescriptors(config.descriptorKeys)
    : config.descriptors?.length
      ? getDescriptors(config.descriptors.map(descriptor => descriptor.key || descriptor))
      : getDescriptorsForPreset(presetKey, preset.descriptors)
  const descriptorCoverage = getDatasetDescriptorCoverage(config.candidates || [], requestedDescriptors.map(descriptor => descriptor.key))
  const unavailablePlannedKeys = descriptorCoverage.rows
    .filter(row => row.planned && row.availableCount === 0)
    .map(row => row.key)
  const descriptors = config.includeUnavailableDescriptors
    ? requestedDescriptors
    : requestedDescriptors.filter(descriptor => !(descriptor.planned && unavailablePlannedKeys.includes(descriptor.key)))
  const algorithm = config.algorithm || preset.defaultAlgorithm || DEFAULT_SCORING_OPTIONS.algorithm
  const missingValueStrategy = config.missingValueStrategy || preset.defaultMissingValueStrategy || DEFAULT_SCORING_OPTIONS.missingValueStrategy
  const evidenceMode = config.evidenceMode || preset.defaultEvidenceMode || DEFAULT_SCORING_OPTIONS.evidenceMode
  const hybridAlpha = Number.isFinite(Number(config.hybridAlpha)) ? Number(config.hybridAlpha) : (preset.hybridAlpha ?? DEFAULT_SCORING_OPTIONS.hybridAlpha)
  const candidates = Array.isArray(config.candidates) ? config.candidates : []
  const descriptorWarnings = []
  if (unavailablePlannedKeys.length && !config.includeUnavailableDescriptors) {
    descriptorWarnings.push(`Planned descriptors without current dataset values were not scored: ${unavailablePlannedKeys.join(", ")}.`)
  }
  if (requestedDescriptors.length && descriptors.length === 0) {
    descriptorWarnings.push("Selected descriptor set has no currently scorable descriptors; the engine returned empty rankings.")
  }
  const options = {
    normalization: config.options?.normalization || config.normalization || "minmax",
    ...(config.options || {}),
  }
  const matrixResult = normalizeDescriptorMatrix({
    candidates,
    descriptors,
    descriptorDirections: config.descriptorDirections,
    presetDirections: preset.descriptorDirections,
    normalization: options.normalization,
    missingValueStrategy,
  })
  const resolvedDescriptors = matrixResult.descriptors
  const manualWeights = normalizeWeightMap(config.manualWeights || preset.manualWeights, resolvedDescriptors)
  let weightingResult = computeWeightingByAlgorithm(algorithm, {
    matrix: matrixResult.matrix,
    candidates,
    descriptors: resolvedDescriptors,
    directions: matrixResult.directions,
    missingValueStrategy,
    manualWeights,
    hybridAlpha,
    context: config.context || {},
    options,
  })
  if (!weightingResult?.weights) {
    weightingResult = {
      weights: normalizeWeightMap({}, resolvedDescriptors),
      diagnostics: { fallbackUsed: true },
      warnings: ["Weighting algorithm returned no weights; equal weights were used."],
      explanation: "Equal-weight fallback.",
    }
  }
  const scores = scoreCandidates({
    candidates,
    matrix: matrixResult.matrix,
    descriptors: resolvedDescriptors,
    weights: weightingResult.weights,
    missingValueStrategy,
    evidenceMode,
  })
  const rankings = rankCandidates(scores)
  const methodComparison = buildMethodComparison({
    candidates,
    matrixResult,
    descriptors: resolvedDescriptors,
    manualWeights,
    hybridAlpha,
    missingValueStrategy,
    evidenceMode,
    options,
  })
  const warnings = [...descriptorWarnings, ...(methodComparison.warnings || [])]
  const diagnostics = buildScoringDiagnostics({
    matrixResult,
    weightingResult,
    methodComparison,
    warnings,
  })
  const generatedAt = new Date().toISOString()
  return {
    preset,
    algorithm,
    weights: weightingResult.weights,
    normalizedMatrix: matrixResult.matrix,
    scores,
    rankings,
    explanations: {
      weights: explainWeights({ weights: weightingResult.weights, descriptors: resolvedDescriptors, diagnostics: weightingResult.diagnostics }),
      candidates: rankings.map(row => explainCandidateScore(row)),
    },
    diagnostics,
    warnings: diagnostics.warnings,
    metadata: {
      candidateCount: candidates.length,
      descriptorCount: resolvedDescriptors.length,
      validRecordCount: matrixResult.validRecordCount,
      missingRate: matrixResult.missingRate,
      generatedAt,
      methodSummary: preset.methodSummary,
      methodSummaryZh: preset.methodSummaryZh,
      descriptorPreset: presetKey,
      requestedDescriptorCount: requestedDescriptors.length,
    },
    descriptors: resolvedDescriptors,
    descriptorDirections: matrixResult.directions,
    manualWeights,
    hybridAlpha,
    missingValueStrategy,
    evidenceMode,
    weightingDiagnostics: weightingResult.diagnostics,
    weightingExplanation: weightingResult.explanation,
    boundsByDescriptor: matrixResult.boundsByDescriptor,
    descriptorCoverage,
    requestedDescriptors,
    unavailablePlannedKeys,
  }
}
