// @ts-nocheck
import { displayTraceValue } from "./traceRecordBuilder"

export function exportTraceReportMarkdown(trace = {}) {
  const lines = [
    `# Organic Acid Final Screening ${displayTraceValue(trace.workflowVersion, "V1.7")} Trace Report`,
    "",
    `Run ID: ${displayTraceValue(trace.runId)}`,
    `Created at: ${displayTraceValue(trace.createdAt)}`,
    `Data mode: ${displayTraceValue(trace.dataMode)}`,
    `Status: ${displayTraceValue(trace.status)}`,
    "",
    "## Boundary",
    ...(trace.boundaries || []).map(row => `- ${displayTraceValue(row.detail)}`),
    "",
    "## Output Summary",
    `- Selected scaffold: ${displayTraceValue(trace.outputSummary?.selectedScaffold)}`,
    `- OACS: ${displayTraceValue(trace.outputSummary?.oacs)}`,
    `- Top dopants: ${displayTraceValue(trace.outputSummary?.topDopants)}`,
    `- Mo-W gap: ${displayTraceValue(trace.outputSummary?.moWGap)}`,
    "",
    "## Step Trace",
    ...(trace.steps || []).map(step => [
      `### ${String(step.step).padStart(2, "0")}. ${displayTraceValue(step.title)}`,
      `- Input: ${displayTraceValue(step.input?.count)}`,
      `- Rule: ${displayTraceValue(step.rule?.summary)}`,
      `- Formula: ${displayTraceValue(step.formula?.summary)}`,
      `- Output: ${displayTraceValue(step.output?.count)}; ${displayTraceValue(step.output?.decision)}`,
      step.warnings?.length ? `- Warnings: ${step.warnings.map(displayTraceValue).join("; ")}` : "- Warnings: none",
    ].join("\n")),
    "",
    "## Candidate Decisions",
    ...(trace.candidateDecisions || []).slice(0, 20).map(row => `- ${displayTraceValue(row.label)}: ${displayTraceValue(row.decision)}; score ${displayTraceValue(row.score)}; status ${displayTraceValue(row.status)}`),
    "",
    "## Formula Inspectors",
    ...(trace.formulaTraces || []).map(row => `- ${displayTraceValue(row.formulaId).toUpperCase()}: ${displayTraceValue(row.score)} for ${displayTraceValue(row.target)}. ${displayTraceValue(row.boundary)}`),
  ]
  return lines.join("\n")
}

export function exportTraceReportJson(trace = {}) {
  return JSON.stringify(trace, null, 2)
}

export function buildTraceExportBundle(trace = {}) {
  return {
    markdown: exportTraceReportMarkdown(trace),
    json: exportTraceReportJson(trace),
  }
}

