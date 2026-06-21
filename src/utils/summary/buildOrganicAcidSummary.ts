// @ts-nocheck
// V3.9.1 Organic Acid summary — derives the Organic Acid validation cards from
// the raw pathway / candidate / evidence / confidence-matrix / priority-queue /
// knowledge-graph records (preserving the V3.8 loop). Counts, distributions,
// coverage, queue, and graph stats are all computed; nothing hardcoded. Missing
// evidence/confidence fall back to explicit labels.
import { safeNumber } from "../fallback/safeNumber"
import { safeRatio } from "../fallback/safePercent"

const asArray = (d: any) => (Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : Array.isArray(d?.items) ? d.items : Array.isArray(d?.pathways) ? d.pathways : Array.isArray(d?.candidates) ? d.candidates : [])
const conf = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : null)

export function classifyConfidence(value: any): string {
  const c = conf(value)
  if (c == null) return "pending"
  if (c >= 0.7) return "high"
  if (c >= 0.4) return "medium"
  return "low"
}

export function buildOrganicAcidConfidenceDistribution(records: any) {
  const rows = asArray(records)
  const dist: Record<string, number> = { high: 0, medium: 0, low: 0, pending: 0 }
  for (const r of rows) dist[classifyConfidence(r.confidence ?? r.confidenceScore)] += 1
  return dist
}

export function buildOrganicAcidEvidenceCoverage(evidenceItems: any) {
  const rows = asArray(evidenceItems)
  const total = rows.length
  const byType: Record<string, number> = {}
  let missing = 0
  let validationNeeded = 0
  for (const r of rows) {
    const t = String(r.evidenceType || "unknown")
    byType[t] = (byType[t] || 0) + 1
    if (String(r.status || "").toLowerCase().includes("missing") || r.claim == null) missing += 1
    if (r.validationNeeded === true) validationNeeded += 1
  }
  return { evidenceCount: total, byType, missingEvidenceCount: missing, validationNeededCount: validationNeeded }
}

export function buildOrganicAcidGraphSummary(graph: any) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : []
  const edges = Array.isArray(graph?.edges) ? graph.edges : []
  const nodeProvenance = nodes.filter((n: any) => Boolean(n.evidenceLevel) || Boolean(n.evidence)).length
  const edgeEvidence = edges.filter((e: any) => Boolean(e.evidenceLevel) || Boolean(e.confidence) || Boolean(e.ruleId)).length
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeProvenanceCoverage: safeRatio(nodeProvenance, nodes.length, 0),
    edgeEvidenceCoverage: safeRatio(edgeEvidence, edges.length, 0),
  }
}

export function buildOrganicAcidQueueSummary(priorityMatrix: any) {
  const rows = asArray(priorityMatrix)
  const score = (r: any) => safeNumber(r.priorityScore ?? r.score ?? r.totalScore, 0)
  const ranked = [...rows].sort((a, b) => score(b) - score(a)).map((r, i) => ({ rank: i + 1, ...r }))
  const conf = (r: any) => classifyConfidence(r.confidence ?? r.confidenceScore)
  return {
    queueCount: rows.length,
    highPriorityCount: rows.filter((r: any) => score(r) >= 0.6).length,
    lowConfidenceCount: rows.filter((r: any) => conf(r) === "low" || conf(r) === "pending").length,
    nextExperimentCount: rows.filter((r: any) => r.nextExperiment != null || r.validationNeeded === true).length,
    ranked,
  }
}

export function buildOrganicAcidBenchmarkSummary({ evidenceCoverage, confidenceDistribution }: any = {}) {
  const high = safeNumber(confidenceDistribution?.high, 0)
  const total = Object.values(confidenceDistribution || {}).reduce((a: number, v: any) => a + safeNumber(v, 0), 0) || 1
  const ready = high / total >= 0.5 && safeNumber(evidenceCoverage?.evidenceCount, 0) > 0 && safeNumber(evidenceCoverage?.missingEvidenceCount, 0) === 0
  return { benchmarkReadiness: ready ? "Ready" : "Pending", highConfidenceShare: Number((high / total).toFixed(3)) }
}

export function buildOrganicAcidExportRows({ priorityMatrix, graph }: any = {}) {
  const queue = asArray(priorityMatrix).map((r: any, i: number) => ({
    rank: i + 1,
    candidate: r.candidateId ?? r.candidate ?? r.id ?? "",
    score: safeNumber(r.priorityScore ?? r.score, 0),
    confidence: classifyConfidence(r.confidence ?? r.confidenceScore),
    evidenceSource: r.evidenceSource ?? r.source ?? "",
    nextExperiment: r.nextExperiment ?? "",
  }))
  const graphPayload = { nodes: Array.isArray(graph?.nodes) ? graph.nodes : [], edges: Array.isArray(graph?.edges) ? graph.edges : [] }
  return { queue, graph: graphPayload }
}

export function buildOrganicAcidSummary({ pathways, candidates, evidenceItems, graph, priorityMatrix, confidenceRecords, dataVersion = "V3.9.1", generatedAt = "" }: any = {}) {
  const evidenceCoverage = buildOrganicAcidEvidenceCoverage(evidenceItems)
  const confidenceDistribution = buildOrganicAcidConfidenceDistribution(confidenceRecords || evidenceItems)
  const graphSummary = buildOrganicAcidGraphSummary(graph)
  const queueSummary = buildOrganicAcidQueueSummary(priorityMatrix)
  const benchmark = buildOrganicAcidBenchmarkSummary({ evidenceCoverage, confidenceDistribution })

  return {
    summaryId: "organic-acid-summary-v1",
    generatedAt: generatedAt || new Date().toISOString(),
    dataVersion,
    dataMode: "curated",
    pathwayCount: asArray(pathways).length,
    candidateCount: asArray(candidates).length || queueSummary.queueCount,
    validationRecordCount: asArray(evidenceItems).filter((r: any) => r.validationNeeded != null || r.status != null).length,
    evidenceCount: evidenceCoverage.evidenceCount,
    evidenceTypeDistribution: evidenceCoverage.byType,
    confidenceDistribution,
    missingEvidenceCount: evidenceCoverage.missingEvidenceCount,
    matrixCoverage: safeRatio(evidenceCoverage.evidenceCount - evidenceCoverage.missingEvidenceCount, evidenceCoverage.evidenceCount, 0),
    priorityQueueCount: queueSummary.queueCount,
    highPriorityCandidateCount: queueSummary.highPriorityCount,
    lowConfidenceCandidateCount: queueSummary.lowConfidenceCount,
    nextExperimentCount: queueSummary.nextExperimentCount,
    knowledgeGraphNodeCount: graphSummary.nodeCount,
    knowledgeGraphEdgeCount: graphSummary.edgeCount,
    graphProvenanceCoverage: graphSummary.nodeProvenanceCoverage,
    benchmarkReadiness: benchmark.benchmarkReadiness,
  }
}

export default buildOrganicAcidSummary
