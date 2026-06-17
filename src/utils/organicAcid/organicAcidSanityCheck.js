// @ts-nocheck

function featureValue(candidate, field, fallback = 0) {
  const value = candidate?.features?.[field]?.value
  if (typeof value === "boolean") return value ? 1 : 0
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function flag(candidate, ruleId, severity, message, suggestedFix) {
  return {
    candidateId: candidate.candidateId,
    candidateName: candidate.candidateName,
    ruleId,
    severity,
    message,
    suggestedFix,
  }
}

export function runOrganicAcidSanityCheck(rankedCandidates = [], { scoringMode = "balanced" } = {}) {
  const top10 = (rankedCandidates || []).slice(0, 10)
  const failedRules = []
  const warnings = []
  const candidateFlags = []

  for (const candidate of top10) {
    const collapseRisk = featureValue(candidate, "collapseRisk")
    const evidenceLevel = String(candidate.features?.evidenceLevel?.value || "").toLowerCase()
    const missingCriticalFields = featureValue(candidate, "missingCriticalFields")
    const syntheticFixtureFlag = Boolean(candidate.features?.syntheticFixtureFlag?.value)
    const formicFit = featureValue(candidate, "formicAcidPathwayFit")
    const noNextExperiment = !candidate.nextExperiment
    const isPriority = candidate.recommendationClass === "priority_validation"

    if (collapseRisk >= 0.7 && isPriority) {
      const row = flag(candidate, "collapse-risk-priority-validation", "failed", "collapseRisk high candidates must not enter priority_validation.", "Downgrade to mechanism_check_needed or collect stability evidence.")
      failedRules.push(row)
      candidateFlags.push(row)
    }
    if (evidenceLevel.includes("very low") && candidate.rank === 1) {
      const row = flag(candidate, "very-low-evidence-rank-one", "warning", "evidenceLevel very low candidate should not rank first without warning.", "Review evidence score or add explicit evidence limitation.")
      warnings.push(row)
      candidateFlags.push(row)
    }
    if (missingCriticalFields >= 2 && candidate.finalScore >= 0.62) {
      const row = flag(candidate, "missing-critical-high-score", "warning", "Candidates with multiple missingCriticalFields should not retain a high score.", "Lower dataQualityScore or collect critical inputs.")
      warnings.push(row)
      candidateFlags.push(row)
    }
    if (syntheticFixtureFlag && isPriority) {
      const row = flag(candidate, "synthetic-fixture-priority-validation", "failed", "syntheticFixtureFlag true candidates cannot enter priority_validation.", "Require real source records before priority validation.")
      failedRules.push(row)
      candidateFlags.push(row)
    }
    if (scoringMode === "formic_acid_priority" && candidate.rank <= 3 && formicFit < 0.4) {
      const row = flag(candidate, "low-formic-fit-top-three", "failed", "formicAcidPathwayFit low candidates cannot enter Top 3 in formic_acid_priority mode.", "Review pathway fit or move candidate below Top 3.")
      failedRules.push(row)
      candidateFlags.push(row)
    }
    if (noNextExperiment && isPriority) {
      const row = flag(candidate, "priority-no-next-experiment", "failed", "Candidates without nextExperiment cannot enter priority_validation.", "Generate a concrete validation experiment first.")
      failedRules.push(row)
      candidateFlags.push(row)
    }
  }

  const suggestedFixes = [
    ...new Set(candidateFlags.map(row => row.suggestedFix).filter(Boolean)),
  ]

  return {
    passed: failedRules.length === 0,
    warnings,
    failedRules,
    candidateFlags,
    suggestedFixes,
    summary: failedRules.length
      ? `${failedRules.length} sanity rule(s) failed; do not report priority_validation as passed.`
      : warnings.length
        ? `${warnings.length} sanity warning(s); ranking can be shown with caution.`
        : "Top candidates pass configured V2.6 sanity checks.",
    summaryZh: failedRules.length
      ? `${failedRules.length} 条算法合理性规则失败；不得把 priority_validation 报告为通过。`
      : warnings.length
        ? `${warnings.length} 条算法合理性警告；排序可展示但需谨慎。`
        : "Top candidates 通过 V2.6 算法合理性检查。",
  }
}

export default runOrganicAcidSanityCheck
