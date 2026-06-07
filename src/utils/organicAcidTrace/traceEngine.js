// @ts-nocheck
import { RUN_TRACE_SCHEMA_VERSION } from "../../schemas/organicAcidTraceSchema"
import { buildCandidateDecisionRecords } from "./candidateDecisionLogger"
import { buildEvidenceTraceRecords } from "./evidenceTraceBuilder"
import { buildFormulaTraceRecords } from "./formulaTraceBuilder"
import { TRACE_BOUNDARIES, TRACE_WORKFLOW_VERSION } from "./traceFixtures"
import { buildCandidateFlow, buildStepTraceRecords, displayTraceValue, numericTraceValue, uniqueStrings } from "./traceRecordBuilder"

function makeRunId(dataMode = "demo_workflow", createdAt = new Date().toISOString()) {
  const stamp = String(createdAt).replace(/\D/g, "").slice(0, 14) || "run"
  return `OAFS-${TRACE_WORKFLOW_VERSION}-${dataMode}-${stamp}`
}

function buildWarnings(screeningResult = {}, dataMode = "demo_workflow") {
  const warnings = [
    "Trace records explain the current workflow; they are not validation evidence.",
  ]
  if (dataMode === "curated_real_examples") warnings.push("Curated mode is a small sample only, not full CoRE/QMOF screening.")
  if (screeningResult.moRobustnessAudit?.status === "audit_required") warnings.push("Mo robustness is audit-required and not proof of optimality.")
  const blocked = (screeningResult.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status !== "pass" || row.dataQualityGate?.canEnterScoring === false)
  if (blocked.length) warnings.push(`${blocked.length} framework records are visible but blocked from final recommendation.`)
  return uniqueStrings(warnings)
}

function buildInputSummary(screeningResult = {}, runSteps = [], options = {}) {
  return {
    dataMode: displayTraceValue(options.dataMode, "demo_workflow"),
    selectedModules: uniqueStrings(options.selectedModules || []),
    frameworkCandidates: Number(screeningResult.rankedFrameworks?.length || screeningResult.curatedFrameworks?.length || runSteps[0]?.inputCount || 0),
    metalCandidates: Number(screeningResult.rankedMetals?.length || screeningResult.metalMatrix?.length || 0),
    evidenceRecords: Number(screeningResult.evidenceCoverage?.totalRecords || screeningResult.evidenceRecords?.length || 0),
    rulesVersion: displayTraceValue(screeningResult.rules?.version || screeningResult.version || TRACE_WORKFLOW_VERSION),
  }
}

function buildOutputSummary(screeningResult = {}, dataMode = "demo_workflow") {
  const mo = screeningResult.moRecommendation || {}
  const w = (screeningResult.rankedMetals || []).find(row => row.metal === "W") || {}
  const report = screeningResult.mappingReport || screeningResult.summary || {}
  return {
    dataMode,
    selectedScaffold: displayTraceValue(screeningResult.selectedFramework?.displayName || "No final scaffold recommendation"),
    oacs: numericTraceValue(screeningResult.selectedFramework?.organicAcidScore?.oacs),
    topDopants: uniqueStrings((screeningResult.rankedMetals || []).slice(0, 3).map(row => row.metal)),
    moDmrs: numericTraceValue(mo.dmrs),
    wDmrs: numericTraceValue(w.dmrs),
    moWGap: mo.dmrs != null && w.dmrs != null ? numericTraceValue((mo.dmrs || 0) - (w.dmrs || 0)) : "Pending",
    blockedFrameworks: Number((screeningResult.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status !== "pass" || row.dataQualityGate?.canEnterScoring === false).length),
    readyForScoring: Number(report.readyForScoring || (screeningResult.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status === "pass").length || 0),
    needsReview: Number(report.needsReview || (screeningResult.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status === "needs_review").length || 0),
    rejected: Number(report.rejected || (screeningResult.rankedFrameworks || []).filter(row => row.hydrothermalGate?.status === "fail").length || 0),
    evidenceBoundary: displayTraceValue(report.boundary || "Demo/proxy trace; not full database screening or validated catalytic performance."),
  }
}

export function buildRunTrace({
  screeningResult = {},
  runSteps = [],
  dataMode = "demo_workflow",
  selectedModules = [],
  createdAt = new Date().toISOString(),
  runId = "",
  legacyTrace = [],
} = {}) {
  const warnings = buildWarnings(screeningResult, dataMode)
  const steps = buildStepTraceRecords(screeningResult, runSteps)
  return {
    schemaVersion: RUN_TRACE_SCHEMA_VERSION,
    runId: runId || makeRunId(dataMode, createdAt),
    createdAt,
    dataMode,
    workflowVersion: TRACE_WORKFLOW_VERSION,
    status: warnings.length ? "completed_with_warnings" : "completed",
    inputSummary: buildInputSummary(screeningResult, runSteps, { dataMode, selectedModules }),
    outputSummary: buildOutputSummary(screeningResult, dataMode),
    steps,
    candidateDecisions: buildCandidateDecisionRecords(screeningResult),
    formulaTraces: buildFormulaTraceRecords(screeningResult),
    evidenceTraces: buildEvidenceTraceRecords(screeningResult),
    candidateFlow: buildCandidateFlow(screeningResult, runSteps),
    warnings,
    boundaries: TRACE_BOUNDARIES,
    legacyRecords: legacyTrace || [],
    exportable: true,
  }
}

