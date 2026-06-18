// @ts-nocheck

import { ORGANIC_ACID_FEATURE_SCHEMA } from "./organicAcidFeatureSchema"
import { runOrganicAcidSanityCheck } from "./organicAcidSanityCheck"
import { runOrganicAcidSensitivityAnalysis } from "./organicAcidSensitivityAnalysis"
import { ORGANIC_ACID_TASK_DEFINITION } from "./organicAcidTaskDefinition"
import { applyReactionEvidenceToCandidate, buildReactionIntegrationContext } from "./reactionEvidenceIntegration"
import { resolveOrganicAcidScoringMode } from "./organicAcidScoringWeights"
import { scoreOrganicAcidCandidate } from "./scoreOrganicAcidCandidate"

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown"
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function buildDataGapSummary(rows = []) {
  const missingByField = {}
  let syntheticFixtureCount = 0
  let lowProvenanceCount = 0
  for (const row of rows) {
    if (row.dataGapSummary?.syntheticFixtureFlag) syntheticFixtureCount += 1
    if (Number(row.dataGapSummary?.fieldProvenanceCoverage) < 0.5) lowProvenanceCount += 1
    for (const missing of row.missingInputs || []) {
      missingByField[missing.field] = (missingByField[missing.field] || 0) + 1
    }
  }
  return {
    missingByField,
    syntheticFixtureCount,
    lowProvenanceCount,
    affectedCandidateCount: rows.filter(row => row.missingInputs?.length || row.dataGapSummary?.syntheticFixtureFlag || Number(row.dataGapSummary?.fieldProvenanceCoverage) < 0.5).length,
    explanation: "Data gaps lower dataQualityScore and may block priority_validation; they are not treated as zero risk.",
    explanationZh: "数据缺口会降低 dataQualityScore，并可能阻断 priority_validation；缺口不会被当作零风险。",
  }
}

export function rankOrganicAcidCandidates({
  candidates = [],
  taskDefinition = ORGANIC_ACID_TASK_DEFINITION,
  scoringMode = "balanced",
  featureSchema = ORGANIC_ACID_FEATURE_SCHEMA,
  topN = 10,
  reactionDataset = null,
  goldDataset = null,
  labelDataset = null,
  reactionContext = null,
} = {}) {
  const mode = resolveOrganicAcidScoringMode(scoringMode)
  const reactionLayerContext = reactionContext || buildReactionIntegrationContext({ reactionDataset, goldDataset, labelDataset })
  const scoreWithReaction = (candidate, rank) => applyReactionEvidenceToCandidate(scoreOrganicAcidCandidate(candidate, {
    taskDefinition,
    scoringMode: mode.id,
    featureSchema,
    rank,
  }), reactionLayerContext)
  const prescored = (candidates || []).map(candidate => scoreWithReaction(candidate))
  const rankedCandidates = prescored
    .sort((a, b) => b.finalScore - a.finalScore || a.candidateName.localeCompare(b.candidateName))
    .map((candidate, index) => scoreWithReaction(candidate.sourceCandidate || candidate, index + 1))
  const topCandidates = rankedCandidates.slice(0, topN)
  const rejectedCandidates = rankedCandidates.filter(row => row.recommendationClass === "rejected")
  const sanityCheck = runOrganicAcidSanityCheck(rankedCandidates, { scoringMode: mode.id })
  const sensitivitySummary = runOrganicAcidSensitivityAnalysis(candidates, {
    taskDefinition,
    featureSchema,
    baseMode: mode.id,
  })
  const dataGapSummary = buildDataGapSummary(rankedCandidates)

  return {
    taskDefinition,
    scoringMode: mode.id,
    scoringModeLabel: mode.label,
    scoringModeLabelZh: mode.labelZh,
    rankedCandidates,
    topCandidates,
    rejectedCandidates,
    scoringSummary: {
      candidateCount: rankedCandidates.length,
      recommendationClassCounts: countBy(rankedCandidates, "recommendationClass"),
      topCandidate: topCandidates[0] || null,
      boundary: "Screening priority only; algorithmic suggestion requires experimental validation.",
      boundaryZh: "仅表示筛选优先级；算法建议仍需实验验证。",
      reactionLayer: reactionLayerContext.summary,
      reactionWeights: reactionLayerContext.enabled
        ? ["Reaction Evidence Weight", "Reaction Quality Weight", "Comparability Weight", "Label Confidence Weight"]
        : [],
    },
    sensitivitySummary,
    dataGapSummary,
    sanityCheck,
  }
}

export default rankOrganicAcidCandidates
