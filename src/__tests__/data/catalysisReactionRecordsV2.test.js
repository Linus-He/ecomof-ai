import { describe, expect, it } from "vitest"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import schema from "../../../public/data/catalysis_reaction_records_schema_v2.json"
import graph from "../../../public/data/catalysis_v2/catalysis_evidence_graph_v2.json"

describe("catalysis reaction database v2", () => {
  it("normalizes the seed into auditable entities without promoting blocked data", () => {
    expect(schema.schemaVersion).toBe("catalysis-reaction-records-schema-v2")
    expect(database.summary).toMatchObject({
      sourceDocumentCount: 10,
      reactionRecordCount: 10,
      metricClaimCount: 28,
      numericClaimCount: 26,
      claimLocatedCount: 12,
      browseEligibleCount: 10,
      compareEligibleCount: 0,
      trainingEligibleCount: 0,
      recommendationEligibleCount: 0,
    })
    expect(database.tables.documentVerifications).toHaveLength(10)
    expect(database.tables.documentVerifications.every(row => row.metadataMatch.status === "matched")).toBe(true)
    expect(database.tables.metricClaims.every(claim => claim.evidenceItemIds.length > 0)).toBe(true)
    expect(database.tables.evidenceItems.filter(item => item.reviewStatus === "verified")).toHaveLength(12)
    expect(database.tables.evidenceItems.filter(item => item.reviewStatus === "verified").every(item => item.sourceUrl && item.reviewNote)).toBe(true)
    expect(database.tables.eligibilityDecisions.every(row => row.decidedBy === "catalysis-v2-deterministic-gate")).toBe(true)
  })

  it("keeps claim-specific operating conditions when a paper reports different optima", () => {
    const su101Claims = database.tables.metricClaims.filter(claim => claim.reactionRecordId === "catrxn-v2-su101-formate-2022")
    expect(su101Claims.find(claim => claim.metric === "faradaic_efficiency").condition).toMatchObject({ potentialVsRheV: null, potentialVsRheVApprox: -1.06 })
    expect(su101Claims.find(claim => claim.metric === "partial_current_density").condition.potentialVsRheV).toBe(-1.26)
    expect(su101Claims.find(claim => claim.metric === "faradaic_efficiency_after_stability").condition.potentialVsRheV).toBe(-1.06)
  })

  it("records the current Crossref metadata refresh without treating it as claim verification", () => {
    expect(database.policy.articleIdentityIsNotClaimVerification).toBe(true)
    expect(database.tables.documentVerifications.every(row => row.checkedBy === "Crossref REST API")).toBe(true)
    expect(database.tables.documentVerifications.every(row => row.updateStatus.status === "none-declared")).toBe(true)
  })

  it("keeps structure identity exact and exposes unresolved work as tasks", () => {
    expect(database.tables.identityLinks.every(link => link.canonicalId === null)).toBe(true)
    expect(database.tables.identityLinks.every(link => link.rejectionReason)).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "identity-resolution")).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "claim-location-backfill")).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "license-review")).toBe(true)
  })

  it("publishes the reusable evidence graph", () => {
    expect(graph.schemaVersion).toBe("catalysis-evidence-graph-v2")
    expect(graph.summary.nodeCount).toBe(graph.nodes.length)
    expect(graph.summary.edgeCount).toBe(graph.edges.length)
    expect(graph.nodes.some(node => node.type === "metric-claim")).toBe(true)
    expect(graph.edges.some(edge => edge.type === "requires-verification")).toBe(true)
  })
})
