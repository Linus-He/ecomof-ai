// @ts-nocheck
import { describe, expect, it } from "vitest"
import graph from "../../../public/data/organic_acid_pathway_graph.json"
import evidenceItems from "../../../public/data/organic_acid_evidence_items.json"
import priorityMatrix from "../../../public/data/organic_acid_priority_matrix.json"
import pathways from "../../../public/data/organic_acid_pathways.json"
import {
  buildOrganicAcidSummary, buildOrganicAcidEvidenceCoverage, buildOrganicAcidConfidenceDistribution,
  buildOrganicAcidGraphSummary, buildOrganicAcidQueueSummary, buildOrganicAcidExportRows, classifyConfidence,
} from "../../utils/summary/buildOrganicAcidSummary"

describe("V3.9.1 Organic Acid summary", () => {
  it("derives pathway / evidence / graph / queue counts from real data", () => {
    const s = buildOrganicAcidSummary({ pathways, evidenceItems, graph, priorityMatrix })
    expect(s.knowledgeGraphNodeCount).toBe(graph.nodes.length)
    expect(s.knowledgeGraphEdgeCount).toBe(graph.edges.length)
    expect(s.evidenceCount).toBeGreaterThan(0)
    expect(s.dataVersion).toBe("V3.9.1")
    expect(s.generatedAt).toBeTruthy()
  })

  it("evidence coverage changes when an evidence item is added", () => {
    const arr = Array.isArray(evidenceItems) ? evidenceItems : evidenceItems.records || []
    const before = buildOrganicAcidEvidenceCoverage(arr).evidenceCount
    const after = buildOrganicAcidEvidenceCoverage([...arr, { evidenceId: "x", evidenceType: "experimental", claim: "c", confidence: 0.9, status: "confirmed" }])
    expect(after.evidenceCount).toBe(before + 1)
    expect(after.byType.experimental).toBeGreaterThanOrEqual(1)
  })

  it("graph counts change when a node / edge is added", () => {
    const g = buildOrganicAcidGraphSummary({ nodes: [...graph.nodes, { id: "z", evidenceLevel: "literature" }], edges: [...graph.edges, { source: "z", target: "x", confidence: 0.5 }] })
    expect(g.nodeCount).toBe(graph.nodes.length + 1)
    expect(g.edgeCount).toBe(graph.edges.length + 1)
    expect(g.nodeProvenanceCoverage).toBeGreaterThan(0)
  })

  it("queue recomputes and ranks by score; flags low-confidence", () => {
    const q = buildOrganicAcidQueueSummary([{ candidateId: "a", score: 0.9, confidence: 0.8 }, { candidateId: "b", score: 0.3, confidence: 0.2 }])
    expect(q.queueCount).toBe(2)
    expect(q.ranked[0].rank).toBe(1)
    expect(q.lowConfidenceCount).toBeGreaterThanOrEqual(1)
  })

  it("classifies confidence and surfaces Missing evidence", () => {
    expect(classifyConfidence(0.9)).toBe("high")
    expect(classifyConfidence(0.5)).toBe("medium")
    expect(classifyConfidence(0.1)).toBe("low")
    expect(classifyConfidence(undefined)).toBe("pending")
    const cov = buildOrganicAcidEvidenceCoverage([{ evidenceId: "m", evidenceType: "x", status: "missing" }])
    expect(cov.missingEvidenceCount).toBe(1)
  })

  it("export rows carry confidence + evidence source and graph nodes/edges", () => {
    const ex = buildOrganicAcidExportRows({ priorityMatrix, graph })
    expect(Array.isArray(ex.queue)).toBe(true)
    expect(ex.graph.nodes.length).toBe(graph.nodes.length)
    expect(ex.graph.edges.length).toBe(graph.edges.length)
    if (ex.queue.length) expect(ex.queue[0]).toHaveProperty("confidence")
  })
})
