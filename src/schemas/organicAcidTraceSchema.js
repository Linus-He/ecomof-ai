// @ts-nocheck

export const RUN_TRACE_SCHEMA_VERSION = "organic-acid-trace.v1.7"

export const RUN_TRACE_DATA_MODES = [
  "demo_workflow",
  "mapped_fixtures",
  "curated_real_examples",
]

export const RUN_TRACE_STATUSES = [
  "completed",
  "completed_with_warnings",
  "blocked",
  "failed",
]

export const runTraceSchema = {
  schemaVersion: "string",
  runId: "string",
  createdAt: "string",
  dataMode: "demo_workflow|mapped_fixtures|curated_real_examples",
  workflowVersion: "string",
  status: "completed|completed_with_warnings|blocked|failed",
  inputSummary: "object",
  outputSummary: "object",
  steps: "array",
  candidateDecisions: "array",
  formulaTraces: "array",
  evidenceTraces: "array",
  candidateFlow: "array",
  warnings: "array",
  boundaries: "array",
  legacyRecords: "array",
  exportable: "boolean",
}

export const stepTraceSchema = {
  id: "string",
  step: "number",
  title: "string",
  titleZh: "string",
  status: "completed|warning|blocked|pending",
  input: "object",
  rule: "object",
  formula: "object",
  output: "object",
  warnings: "array",
  blockedRecords: "array",
  evidenceIds: "array",
  linkedSectionId: "string",
}

export const candidateDecisionSchema = {
  id: "string",
  label: "string",
  labelZh: "string",
  candidateType: "framework|metal",
  rank: "number|string",
  decision: "string",
  decisionZh: "string",
  status: "string",
  score: "number|string",
  keyInputs: "array",
  ruleChecks: "array",
  warnings: "array",
  evidenceIds: "array",
  blockedReason: "string",
}

export const formulaContributionSchema = {
  id: "string",
  formulaId: "oacs|dmrs",
  label: "string",
  labelZh: "string",
  target: "string",
  formula: "string",
  formulaZh: "string",
  score: "number|string",
  weightingMethod: "string",
  contributions: "array",
  warnings: "array",
  boundary: "string",
  boundaryZh: "string",
}

export const evidenceTraceSchema = {
  id: "string",
  targetType: "framework|metal|rule|run",
  targetId: "string",
  field: "string",
  value: "string|number",
  evidenceIds: "array",
  sourceType: "string",
  sourceDatabase: "string",
  sourceRecordId: "string",
  curationStatus: "string",
  doiStatus: "string",
  note: "string",
}

export const traceReportSchema = {
  format: "markdown|json",
  runId: "string",
  generatedAt: "string",
  title: "string",
  body: "string|object",
}

export function isRunTrace(value) {
  return Boolean(value && typeof value === "object" && Array.isArray(value.steps) && value.runId)
}

