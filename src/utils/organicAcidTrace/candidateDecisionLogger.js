// @ts-nocheck
import { displayTraceValue, numericTraceValue, uniqueStrings } from "./traceRecordBuilder"

function frameworkDecision(row = {}, selectedId = "") {
  const gate = row.hydrothermalGate?.status || row.dataQualityGate?.hydrothermalGateStatus || "pending"
  const canScore = row.finalRecommendationEligible !== false && gate === "pass" && row.dataQualityGate?.canEnterScoring !== false
  if (row.id === selectedId && canScore) return ["selected_scaffold", "选定骨架"]
  if (canScore) return ["eligible_ranked_candidate", "合格排序候选"]
  if (gate === "needs_review" || row.dataQualityGate?.status === "needs_review") return ["blocked_needs_review", "因需复核被拦截"]
  return ["blocked_hard_gate", "因硬阈值被拦截"]
}

function frameworkWarnings(row = {}) {
  const warnings = []
  if (row.hydrothermalGate?.status !== "pass") warnings.push("OACS forced to 0 until hydrothermal evidence is reviewed.")
  if (row.dataQualityGate?.status === "needs_review") warnings.push("Needs-review record stays auditable but cannot enter final recommendation.")
  if (row.sourceDoi === null || row.doiStatus === "DOI pending") warnings.push("DOI or source metadata remains pending.")
  return uniqueStrings(warnings)
}

function metalDecision(row = {}) {
  if (row.metal === "Mo") return ["primary_hypothesis", "主假设"]
  if (row.metal === "W") return ["backup_hypothesis", "备选假设"]
  if (["Ru", "Pd", "Ag"].includes(row.metal)) return ["blind_baseline", "盲测基线"]
  return ["competitor_context", "竞品 / 背景候选"]
}

function metalWarnings(row = {}) {
  const warnings = []
  if (row.metal === "Mo") warnings.push("Mo requires direct selected Al-MOF DFT, EXAFS, and same-condition reaction validation.")
  if (row.sensitivityStatus?.includes("audit")) warnings.push("Robust ranking is audit-required and not proof of catalytic performance.")
  if (["Ru", "Pd", "Ag"].includes(row.metal)) warnings.push("Blind-baseline negative evidence remains pending when DOI metadata is absent.")
  if (row.source?.dataStatus?.verified === false) warnings.push("Descriptor values are demo/proxy-level.")
  return uniqueStrings(warnings)
}

function sourceEvidence(row = {}) {
  return uniqueStrings([
    row.evidenceIds,
    row.organicAcidScore?.evidenceIds,
    row.hydrothermalGate?.evidenceIds,
    row.source?.dmrsEvidenceIds,
    row.source?.moWGapEvidenceIds,
    row.source?.exafsPredictionEvidenceIds,
    row.dmrsEvidenceIds,
  ])
}

export function buildCandidateDecisionRecords(screeningResult = {}) {
  const selectedId = screeningResult.selectedFramework?.id || ""
  const frameworks = (screeningResult.rankedFrameworks || []).slice(0, 18).map(row => {
    const [decision, decisionZh] = frameworkDecision(row, selectedId)
    return {
      id: displayTraceValue(row.id || row.sourceRecordId),
      label: displayTraceValue(row.displayName || row.name),
      labelZh: displayTraceValue(row.displayName || row.name),
      candidateType: "framework",
      rank: row.rank || "Pending",
      decision,
      decisionZh,
      status: displayTraceValue(row.hydrothermalGate?.status || row.dataQualityGate?.status || "pending"),
      score: numericTraceValue(row.organicAcidScore?.oacs),
      keyInputs: [
        { field: "hydrothermalGate", label: "Hydrothermal Gate", value: displayTraceValue(row.hydrothermalGate?.status) },
        { field: "poreAccessibility", label: "Pore accessibility", value: numericTraceValue(row.descriptorScores?.poreAccessibility) },
        { field: "c1IntermediateAccessibility", label: "C1 accessibility", value: numericTraceValue(row.descriptorScores?.c1IntermediateAccessibility) },
        { field: "collapseRisk", label: "Collapse risk", value: numericTraceValue(row.organicAcidScore?.collapseRisk ?? row.descriptorScores?.collapseRisk) },
      ],
      ruleChecks: [
        { label: ">=150 C hydrothermal evidence", labelZh: ">=150 C 水热证据", status: displayTraceValue(row.hydrothermalGate?.status) },
        { label: "post-treatment PXRD", labelZh: "处理后 PXRD", status: row.waterStability?.post_treatment_PXRD_retained === true ? "retained" : "needs review" },
        { label: "final recommendation eligibility", labelZh: "最终推荐资格", status: decision === "selected_scaffold" || decision === "eligible_ranked_candidate" ? "eligible" : "blocked" },
      ],
      warnings: frameworkWarnings(row),
      evidenceIds: sourceEvidence(row),
      blockedReason: displayTraceValue(row.hydrothermalGate?.reason || row.dataQualityGate?.reason || "Not blocked", "Not blocked"),
    }
  })

  const metals = (screeningResult.rankedMetals || []).slice(0, 18).map(row => {
    const [decision, decisionZh] = metalDecision(row)
    return {
      id: displayTraceValue(`metal-${row.metal}`),
      label: displayTraceValue(row.metal),
      labelZh: displayTraceValue(row.metal),
      candidateType: "metal",
      rank: row.rank || "Pending",
      decision,
      decisionZh,
      status: displayTraceValue(row.sensitivityStatus || row.dataStatus?.label || "hypothesis-generating"),
      score: numericTraceValue(row.dmrs),
      keyInputs: [
        { field: "activeSiteValue", label: "Active-site value", value: numericTraceValue(row.activeSiteValue) },
        { field: "mechanismFeasibility", label: "Mechanism feasibility", value: numericTraceValue(row.mechanism?.score) },
        { field: "aqueousStability", label: "Aqueous stability", value: numericTraceValue(row.aqueousStability) },
        { field: "riskPenalty", label: "Risk penalty", value: numericTraceValue(row.riskPenalty) },
      ],
      ruleChecks: [
        { label: "Mo as output", labelZh: "Mo 作为输出", status: row.metal === "Mo" ? "primary hypothesis" : "not direct filter" },
        { label: "competitors remain visible", labelZh: "竞品保持可见", status: "visible" },
        { label: "validation required", labelZh: "需要验证", status: "DFT / EXAFS / same-condition experiment pending" },
      ],
      warnings: metalWarnings(row),
      evidenceIds: sourceEvidence(row),
      blockedReason: "Not blocked by retrieval; interpreted as hypothesis / competitor context.",
    }
  })

  return [...frameworks, ...metals]
}

