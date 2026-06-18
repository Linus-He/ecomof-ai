// @ts-nocheck

function asRecords(dataset) {
  if (!dataset) return []
  if (Array.isArray(dataset)) return dataset
  if (Array.isArray(dataset.records)) return dataset.records
  if (Array.isArray(dataset.labels)) return dataset.labels
  return []
}

function clamp01(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(1, numeric))
}

function avg(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function candidateTokens(candidate = {}) {
  return [
    candidate.candidateId,
    candidate.id,
    candidate.displayName,
    candidate.candidateName,
    candidate.rawName,
    candidate.metalNode,
    ...(Array.isArray(candidate.metals) ? candidate.metals : []),
  ].filter(Boolean).map(value => String(value).toLowerCase())
}

function matchesCandidate(record, candidate) {
  const tokens = candidateTokens(candidate)
  if (!tokens.length) return false
  const haystack = [
    record.mofName,
    record.sourceRecordId,
    record.metalNode,
    record.linker,
    record.topology,
  ].filter(Boolean).join(" ").toLowerCase()
  return tokens.some(token => token.length > 1 && haystack.includes(token))
}

export function buildReactionIntegrationContext({ reactionDataset, goldDataset, labelDataset } = {}) {
  const reactionRecords = asRecords(reactionDataset)
  const goldRecords = asRecords(goldDataset)
  const labelRecords = asRecords(labelDataset)
  const labelsByReaction = new Map(labelRecords.map(row => [row.reactionId || row.recordId, row]))
  const comparable = reactionRecords.filter(row => row.comparability?.status === "Comparable" || row.comparability?.comparabilityStatus === "Comparable").length
  const labelConfidence = avg(labelRecords.map(row => row.labelConfidence))
  return {
    enabled: reactionRecords.length > 0,
    reactionRecords,
    goldRecords,
    labelRecords,
    labelsByReaction,
    summary: {
      reactionCount: reactionRecords.length,
      goldCount: goldRecords.length,
      labelCount: labelRecords.filter(row => String(row.labelStatus || "").toLowerCase() !== "missing").length,
      comparableCount: comparable,
      labelConfidence: Number(labelConfidence.toFixed(3)),
    },
  }
}

export function applyReactionEvidenceToCandidate(scoredCandidate = {}, context = {}) {
  if (!context.enabled) return scoredCandidate
  const source = scoredCandidate.sourceCandidate || scoredCandidate
  const matched = context.reactionRecords.filter(record => matchesCandidate(record, source))
  const rows = matched.length ? matched : context.reactionRecords.slice(0, Math.min(12, context.reactionRecords.length))
  const validationScores = rows.map(row => row.validation?.score ?? (row.validationStatus === "Gold" ? 1 : 0.65))
  const comparabilityScores = rows.map(row => row.comparability?.score)
  const performanceScores = rows.map(row => avg([Number(row.yield) / 100, Number(row.selectivity) / 100, Number(row.conversion) / 100]))
  const labelScores = rows.map(row => context.labelsByReaction.get(row.reactionId)?.labelConfidence)
  const goldRatio = rows.length ? rows.filter(row => row.validationStatus === "Gold").length / rows.length : 0

  const reactionLayer = {
    reactionEvidenceWeight: Number(avg(validationScores).toFixed(3)),
    reactionQualityWeight: Number(goldRatio.toFixed(3)),
    comparabilityWeight: Number(avg(comparabilityScores).toFixed(3)),
    labelConfidenceWeight: Number(avg(labelScores).toFixed(3)),
    reactionPerformanceScore: Number(avg(performanceScores).toFixed(3)),
    matchedReactionCount: matched.length,
    fallbackScope: matched.length ? "candidate-matched" : "global-reaction-prior",
  }
  const reactionComposite = avg([
    reactionLayer.reactionEvidenceWeight,
    reactionLayer.reactionQualityWeight,
    reactionLayer.comparabilityWeight,
    reactionLayer.labelConfidenceWeight,
    reactionLayer.reactionPerformanceScore,
  ])
  const finalScore = Number(clamp01(Number(scoredCandidate.finalScore) * 0.92 + reactionComposite * 0.08).toFixed(3))
  return {
    ...scoredCandidate,
    finalScore,
    reactionLayer,
    scoreBreakdown: {
      ...(scoredCandidate.scoreBreakdown || {}),
      reactionLayer,
      reactionAdjustment: Number((finalScore - Number(scoredCandidate.finalScore || 0)).toFixed(3)),
    },
    decisionTrace: [
      ...(scoredCandidate.decisionTrace || []),
      {
        step: "Reaction Data Integration",
        input: `reaction=${context.summary.reactionCount}, gold=${context.summary.goldCount}, labels=${context.summary.labelCount}`,
        output: `reactionComposite=${reactionComposite.toFixed(3)} finalScore=${finalScore.toFixed(3)}`,
        affectedScore: Number((finalScore - Number(scoredCandidate.finalScore || 0)).toFixed(3)),
        blocker: context.summary.labelCount ? "" : "label dataset missing",
        explanation: "Reaction Evidence Weight, Reaction Quality Weight, Comparability Weight, and Label Confidence Weight are applied as a bounded V3.1 adjustment.",
        explanationZh: "V3.1 将 Reaction Evidence Weight、Reaction Quality Weight、Comparability Weight 与 Label Confidence Weight 作为有界修正接入。",
      },
    ],
  }
}
