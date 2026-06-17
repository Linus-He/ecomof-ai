// @ts-nocheck

import { scoreOrganicAcidCandidate } from "./scoreOrganicAcidCandidate"
import { ORGANIC_ACID_SCORING_WEIGHTS } from "./organicAcidScoringWeights"

export const ORGANIC_ACID_SENSITIVITY_MODES = [
  "balanced",
  "formic_acid_priority",
  "evidence_first",
  "validation_first",
  "low_risk_first",
]

function candidateId(row) {
  return row.candidateId || row.id || row.sourceRecordId || row.displayName
}

function rankForMode(candidates, mode, options = {}) {
  return (candidates || [])
    .map(candidate => scoreOrganicAcidCandidate(candidate, { ...options, scoringMode: mode }))
    .sort((a, b) => b.finalScore - a.finalScore || a.candidateName.localeCompare(b.candidateName))
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

export function runOrganicAcidSensitivityAnalysis(candidates = [], {
  taskDefinition,
  featureSchema,
  modes = ORGANIC_ACID_SENSITIVITY_MODES,
  baseMode = "balanced",
} = {}) {
  const rankings = Object.fromEntries(modes.map(mode => [mode, rankForMode(candidates, mode, { taskDefinition, featureSchema })]))
  const baseRanking = rankings[baseMode] || rankings.balanced || Object.values(rankings)[0] || []
  const baseTop = baseRanking[0]?.candidateId || null
  const allIds = [...new Set((candidates || []).map(candidateId).filter(Boolean))]
  const rankStabilityRows = allIds.map(id => {
    const ranks = Object.fromEntries(modes.map(mode => {
      const row = rankings[mode]?.find(candidate => candidate.candidateId === id)
      return [mode, row?.rank ?? null]
    }))
    const scores = Object.fromEntries(modes.map(mode => {
      const row = rankings[mode]?.find(candidate => candidate.candidateId === id)
      return [mode, row?.finalScore ?? null]
    }))
    const numericRanks = Object.values(ranks).filter(value => Number.isFinite(Number(value))).map(Number)
    const minRank = Math.min(...numericRanks)
    const maxRank = Math.max(...numericRanks)
    const rankShift = Number.isFinite(minRank) && Number.isFinite(maxRank) ? maxRank - minRank : 0
    const numericScores = Object.values(scores).filter(value => Number.isFinite(Number(value))).map(Number)
    const scoreSpread = numericScores.length ? Math.max(...numericScores) - Math.min(...numericScores) : 0
    return {
      candidateId: id,
      candidateName: baseRanking.find(row => row.candidateId === id)?.candidateName || id,
      ranks,
      scores,
      minRank,
      maxRank,
      rankShift,
      scoreSpread: Number(scoreSpread.toFixed(3)),
      stable: rankShift === 0 && scoreSpread < 0.04,
    }
  }).sort((a, b) => b.rankShift - a.rankShift || a.candidateName.localeCompare(b.candidateName))
  const topByMode = Object.fromEntries(modes.map(mode => [mode, rankings[mode]?.[0]?.candidateName || "pending"]))
  const topCandidateStability = new Set(Object.values(topByMode)).size === 1
  const unstableCandidates = rankStabilityRows.filter(row => row.rankShift >= 1 || row.scoreSpread >= 0.04)
  const sensitiveDimensions = [...new Set(modes.flatMap(mode => {
    const config = ORGANIC_ACID_SCORING_WEIGHTS[mode]
    return [...(config?.raises || []), ...(config?.lowers || [])]
  }))].map(dimension => ({
    dimension,
    explanation: `${dimension} changes across V2.6 sensitivity modes.`,
  }))

  return {
    modes,
    baseMode,
    rankings,
    rankStability: {
      baseTopCandidateId: baseTop,
      rows: rankStabilityRows,
      stableCandidateCount: rankStabilityRows.filter(row => row.stable).length,
      unstableCandidateCount: unstableCandidates.length,
    },
    topCandidateStability,
    topByMode,
    unstableCandidates,
    sensitiveDimensions,
    explanation: topCandidateStability
      ? "Top candidate is stable across V2.6 weighting modes; lower ranks may still shift."
      : "Top candidates change when V2.6 weighting modes are switched; interpret screening priority with sensitivity context.",
    explanationZh: topCandidateStability
      ? "Top candidate 在 V2.6 权重模式切换下保持稳定；后续名次仍可能变化。"
      : "切换 V2.6 权重模式时 Top candidates 会变化；筛选优先级需结合敏感性分析解释。",
  }
}

export default runOrganicAcidSensitivityAnalysis
