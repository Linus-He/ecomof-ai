// @ts-nocheck
import { STEP_TRACE_RULES } from "./traceFixtures"

export function displayTraceValue(value, fallback = "Pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  if (Array.isArray(value)) return value.length ? value.map(item => displayTraceValue(item, "")).filter(Boolean).join(", ") : fallback
  const rendered = String(value)
  if (!rendered || ["undefined", "null", "NaN"].includes(rendered)) return fallback
  return rendered
}

export function numericTraceValue(value, fallback = "Pending") {
  const number = Number(value)
  return Number.isFinite(number) ? Number(number.toFixed(3)) : fallback
}

export function uniqueStrings(values = []) {
  return [...new Set((values || []).flat().map(value => displayTraceValue(value, "")).filter(Boolean))]
}

function blockedFrameworks(screeningResult = {}) {
  return (screeningResult.rankedFrameworks || [])
    .filter(row => row.hydrothermalGate?.status !== "pass" || row.dataQualityGate?.canEnterScoring === false)
    .map(row => ({
      id: displayTraceValue(row.id || row.sourceRecordId),
      label: displayTraceValue(row.displayName || row.name),
      reason: displayTraceValue(row.hydrothermalGate?.reason || row.dataQualityGate?.reason || "Not eligible for final recommendation."),
      reasonZh: displayTraceValue(row.dataQualityGate?.reasonZh || row.hydrothermalGate?.reason || "不具备最终推荐资格。"),
      status: displayTraceValue(row.hydrothermalGate?.status || row.dataQualityGate?.status || "blocked"),
    }))
}

function stepWarnings(step = {}, screeningResult = {}) {
  const warnings = []
  const selected = screeningResult.selectedFramework || {}
  const mo = screeningResult.moRecommendation || {}
  if (step.status === "warning") warnings.push(displayTraceValue(step.decision))
  if (step.id?.includes("hydrothermal") && blockedFrameworks(screeningResult).length) {
    warnings.push("Some records are visible but blocked by hydrothermal or data-quality gates.")
  }
  if (step.id === "calculate-dmrs" && mo.metal === "Mo") {
    warnings.push("Mo is a primary hypothesis and still needs direct DFT, EXAFS, and same-condition validation.")
  }
  if (step.id === "calculate-oacs" && selected.organicAcidScore?.evidenceLevel !== "top_recommendation_eligible") {
    warnings.push("Selected scaffold evidence level is not final validation evidence.")
  }
  return uniqueStrings(warnings)
}

function stepEvidenceIds(step = {}, screeningResult = {}) {
  const selected = screeningResult.selectedFramework || {}
  const mo = screeningResult.moRecommendation?.source || {}
  const ids = []
  if (step.id?.includes("oacs") || step.id?.includes("scaffold") || step.id?.includes("hydrothermal")) {
    ids.push(selected.evidenceIds, selected.organicAcidScore?.evidenceIds, selected.hydrothermalGate?.evidenceIds)
  }
  if (step.id?.includes("dmrs") || step.id?.includes("dopant") || step.id?.includes("exafs")) {
    ids.push(mo.dmrsEvidenceIds, mo.exafsPredictionEvidenceIds, mo.moWGapEvidenceIds)
  }
  if (step.id?.includes("evidence")) ids.push((screeningResult.evidenceRecords || []).map(row => row.id))
  return uniqueStrings(ids)
}

export function buildStepTraceRecords(screeningResult = {}, runSteps = []) {
  const blocked = blockedFrameworks(screeningResult)
  return (runSteps || []).map((step, index) => {
    const rule = STEP_TRACE_RULES[step.id] || {}
    const warnings = stepWarnings(step, screeningResult)
    return {
      id: displayTraceValue(step.id, `step-${index + 1}`),
      step: Number(step.step || index + 1),
      title: displayTraceValue(step.title),
      titleZh: displayTraceValue(step.titleZh, step.title),
      status: warnings.length && step.status === "completed" ? "warning" : displayTraceValue(step.status, "completed"),
      input: {
        count: Number(step.inputCount || 0),
        label: "records entering this step",
        labelZh: "进入该步骤的记录数",
      },
      rule: {
        summary: displayTraceValue(rule.rule || step.decision),
        summaryZh: displayTraceValue(rule.ruleZh || step.decisionZh || step.decision),
      },
      formula: {
        summary: displayTraceValue(rule.formula || "Rule-based transformation"),
        summaryZh: displayTraceValue(rule.formulaZh || rule.formula || "规则化转换"),
      },
      output: {
        count: Number(step.outputCount || 0),
        decision: displayTraceValue(step.decision),
        decisionZh: displayTraceValue(step.decisionZh || step.decision),
      },
      warnings,
      blockedRecords: step.id?.includes("gate") || step.id?.includes("quality") ? blocked : [],
      evidenceIds: stepEvidenceIds(step, screeningResult),
      linkedSectionId: displayTraceValue(step.linkedSectionId, "organic-acid-final-trace-workbench"),
    }
  })
}

export function buildCandidateFlow(screeningResult = {}, runSteps = []) {
  return (runSteps || []).map((step, index) => ({
    id: displayTraceValue(step.id, `flow-${index + 1}`),
    label: displayTraceValue(step.title),
    labelZh: displayTraceValue(step.titleZh || step.title),
    inputCount: Number(step.inputCount || 0),
    outputCount: Number(step.outputCount || 0),
    blockedCount: Math.max(0, Number(step.inputCount || 0) - Number(step.outputCount || 0)),
    status: displayTraceValue(step.status, "completed"),
  }))
}

