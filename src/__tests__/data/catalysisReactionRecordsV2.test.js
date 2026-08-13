import { describe, expect, it } from "vitest"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import schema from "../../../public/data/catalysis_reaction_records_schema_v2.json"
import graph from "../../../public/data/catalysis_v2/catalysis_evidence_graph_v2.json"

describe("catalysis reaction database v2", () => {
  it("normalizes the seed into run-level auditable entities without promoting blocked training data", () => {
    expect(schema.schemaVersion).toBe("catalysis-reaction-records-schema-v2")
    expect(database.summary).toMatchObject({
      sourceDocumentCount: 10,
      reactionRecordCount: 10,
      experimentRunCount: 18,
      metricClaimCount: 31,
      numericClaimCount: 30,
      claimLocatedCount: 17,
      identityResolvedCount: 1,
      identityLinkedCount: 0,
      browseEligibleCount: 10,
      compareEligibleCount: 2,
      compareEligibleRunCount: 5,
      trainingEligibleCount: 0,
      recommendationEligibleCount: 0,
    })
    expect(database.tables.documentVerifications).toHaveLength(10)
    expect(database.tables.documentVerifications.every(row => row.metadataMatch.status === "matched")).toBe(true)
    expect(database.tables.metricClaims.every(claim => claim.evidenceItemIds.length > 0)).toBe(true)
    expect(database.tables.evidenceItems.filter(item => item.reviewStatus === "verified")).toHaveLength(17)
    expect(database.tables.evidenceItems.filter(item => item.reviewStatus === "verified").every(item => item.sourceUrl && item.reviewNote)).toBe(true)
    expect(database.tables.eligibilityDecisions.every(row => row.decidedBy === "catalysis-v2-experiment-run-aggregate-gate")).toBe(true)
    expect(database.tables.runEligibilityDecisions.every(row => row.decidedBy === "catalysis-v2-deterministic-gate")).toBe(true)
  })

  it("keeps distinct SU-101 optima and stability tests in separate experiment runs", () => {
    const su101Claims = database.tables.metricClaims.filter(claim => claim.reactionRecordId === "catrxn-v2-su101-formate-2022")
    const su101Runs = database.tables.experimentRuns.filter(run => run.reactionRecordId === "catrxn-v2-su101-formate-2022")
    expect(su101Runs).toHaveLength(3)
    expect(new Set(su101Claims.map(claim => claim.experimentRunId)).size).toBe(3)
    expect(su101Claims.find(claim => claim.metric === "faradaic_efficiency").condition).toMatchObject({ potentialVsRheV: null, potentialVsRheVApprox: -1.06 })
    expect(su101Claims.find(claim => claim.metric === "partial_current_density").condition.potentialVsRheV).toBe(-1.26)
    expect(su101Claims.find(claim => claim.metric === "faradaic_efficiency_after_stability").condition.potentialVsRheV).toBe(-1.06)
    expect(database.tables.runEligibilityDecisions.filter(row => su101Runs.some(run => run.id === row.experimentRunId)).every(row => row.compareEligible)).toBe(true)
  })

  it("records MFM-220 precursor identity, calculated loading provenance, and the publisher licence without transferring identity to MFM-220-p", () => {
    const recordId = "catrxn-v2-mfm220p-formate-2022"
    const state = database.tables.catalystStates.find(row => row.reactionRecordId === recordId)
    const source = database.tables.sourceDocuments.find(row => row.id === "source-cat-lit-mfm220-2022")
    const conditions = database.tables.conditionSets.filter(row => row.reactionRecordId === recordId)
    expect(state.precursorIdentity).toMatchObject({ material: "MFM-220", identifierType: "CCDC", identifier: "899427" })
    expect(state.identityLink.canonicalId).toBeNull()
    expect(state.precursorIdentity.activeMaterialBoundary).toContain("must not be assigned")
    expect(source.license).toMatchObject({ name: "Creative Commons Attribution 3.0 Unported", trainingUseAllowed: true })
    expect(conditions).toHaveLength(2)
    expect(conditions.every(row => row.catalystLoadingStatus === "calculated-from-source-preparation")).toBe(true)
    expect(conditions.every(row => row.catalystLoadingCalculation.includes("0.995 mg cm-2"))).toBe(true)
  })

  it("separates Bi-HHTP reaction runs from material characterization and links its exact crystal identity", () => {
    const recordId = "catrxn-v2-bi-hhtp-formate-2023"
    const state = database.tables.catalystStates.find(row => row.reactionRecordId === recordId)
    const runs = database.tables.experimentRuns.filter(row => row.reactionRecordId === recordId)
    const conductivityRun = runs.find(row => row.purpose === "material-characterization")
    const conductivityDecision = database.tables.runEligibilityDecisions.find(row => row.experimentRunId === conductivityRun.id)
    const stabilityCondition = database.tables.conditionSets.find(row => row.experimentRunId.endsWith("stability-30h-minus-0-7v"))

    expect(runs).toHaveLength(5)
    expect(state.identityLink).toMatchObject({ canonicalId: null, exactStructureIdentifier: "CCDC:2242230", status: "publisher-structure-identifier-verified" })
    expect(state.activeMaterialIdentity).toMatchObject({ identifierType: "CCDC", identifier: "2242230" })
    expect(stabilityCondition).toMatchObject({ potentialVsRheV: -0.7, durationH: 30 })
    expect(conductivityDecision).toMatchObject({ comparisonApplicable: false, compareEligible: false })
    expect(conductivityDecision.conditionCompleteness).toMatchObject({ required: [], missing: [] })
    expect(database.tables.verificationTasks.some(task => task.experimentRunId === conductivityRun.id)).toBe(false)
  })

  it("keeps BiNP flow-cell and H-cell evidence separate and preserves source-derived condition provenance", () => {
    const recordId = "catrxn-v2-zr-dmbd-bi-np-formate-2025"
    const runs = database.tables.experimentRuns.filter(row => row.reactionRecordId === recordId)
    const conditions = database.tables.conditionSets.filter(row => row.reactionRecordId === recordId)
    const flowCondition = conditions.find(row => row.experimentRunId.endsWith("flow-cell-minus-25ma"))
    const hCellCondition = conditions.find(row => row.experimentRunId.endsWith("hcell-minus-1-4v"))
    const hCellClaims = database.tables.metricClaims.filter(row => row.experimentRunId.endsWith("hcell-minus-1-4v"))

    expect(runs).toHaveLength(2)
    expect(flowCondition).toMatchObject({ electrolyte: "1 M KOH; 25 mL anolyte and 25 mL catholyte", catalystLoading: 0.5, gasFlowRate: 20 })
    expect(hCellCondition).toMatchObject({ electrolyte: "0.1 M KHCO3; 8 mL in each compartment", potentialVsRheV: -1.4, catalystLoadingStatus: "calculated-from-source-preparation" })
    expect(hCellCondition.appliedCurrentDensity).toBeNull()
    expect(hCellCondition.catalystLoadingCalculation).toContain("0.239 mg cm-2")
    expect(hCellClaims).toHaveLength(2)
    expect(hCellClaims.find(claim => claim.metric === "partial_current_density").valueBasis).toContain("cathodic-current magnitude")
  })

  it("records the current Crossref metadata refresh without treating it as claim verification", () => {
    expect(database.policy.articleIdentityIsNotClaimVerification).toBe(true)
    expect(database.tables.documentVerifications.every(row => row.checkedBy === "Crossref REST API")).toBe(true)
    expect(database.tables.documentVerifications.every(row => row.updateStatus.status === "none-declared")).toBe(true)
  })

  it("keeps structure identity exact and exposes unresolved work as tasks", () => {
    expect(database.tables.identityLinks.filter(link => link.canonicalId)).toHaveLength(0)
    expect(database.tables.identityLinks.find(link => link.activeMaterialIdentity?.identifier === "2242230")).toMatchObject({ registryJoinStatus: "exact-external-identifier-not-in-local-registry", rejectionReason: null })
    expect(database.tables.identityLinks.filter(link => !link.canonicalId && !link.activeMaterialIdentity).every(link => link.rejectionReason)).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "identity-resolution")).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "claim-location-backfill")).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.type === "license-review")).toBe(true)
    expect(database.tables.verificationTasks.some(task => task.sourceDocumentId === "source-cat-lit-bihhtp-2023" && task.type === "license-review")).toBe(false)
    expect(database.tables.verificationTasks.some(task => task.sourceDocumentId === "source-cat-lit-zrdmbdbi-2025" && task.type === "license-review")).toBe(false)
  })

  it("publishes the reusable evidence graph", () => {
    expect(graph.schemaVersion).toBe("catalysis-evidence-graph-v2")
    expect(graph.summary.nodeCount).toBe(graph.nodes.length)
    expect(graph.summary.edgeCount).toBe(graph.edges.length)
    expect(graph.nodes.some(node => node.type === "metric-claim")).toBe(true)
    expect(graph.nodes.some(node => node.type === "experiment-run")).toBe(true)
    expect(graph.edges.some(edge => edge.type === "has-experiment-run")).toBe(true)
    expect(graph.edges.some(edge => edge.type === "requires-verification")).toBe(true)
  })
})
