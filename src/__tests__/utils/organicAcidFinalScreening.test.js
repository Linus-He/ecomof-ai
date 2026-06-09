// @ts-nocheck
import { describe, expect, it } from "vitest"
import fs from "node:fs"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import versionDocs from "../../../public/data/organic_acid_final_screening/version_docs.json"
import literatureInspirations from "../../../public/data/organic_acid_final_screening/literature_inspiration_records.json"
import { ORGANIC_ACID_FINAL_DIRECTORY } from "../../components/methodology/organic-acid-final/directory"
import {
  applyHydrothermalGate,
  attachEvidenceToFrameworks,
  attachEvidenceToMetals,
  buildCuratedRealScreeningResult,
  buildRunSteps,
  buildCandidateDecisionTrace,
  calculateEvidenceCoverage,
  calculateDMRS,
  calculateOACS,
  loadEvidenceRecords,
  METAL_DESCRIPTOR_KEYS,
  runDemoScreeningWorkflow,
  runOrganicAcidFinalScreening,
  runFullMetalSensitivityDistribution,
} from "../../utils/organicAcidFinalScreening"
import { loadCuratedRealExamples } from "../../utils/mofDataMappers/mapperPreviewFixtures"

describe("organic acid final screening", () => {
  it("applies the hydrothermal hard gate before OACS ranking", () => {
    const passed = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_001"), rules), rules.frameworkWeights)
    const failed = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_009"), rules), rules.frameworkWeights)
    const review = calculateOACS(applyHydrothermalGate(frameworks.find(row => row.id === "ALMOF_DEMO_008"), rules), rules.frameworkWeights)

    expect(passed.hydrothermalGate.status).toBe("pass")
    expect(passed.organicAcidScore.oacs).toBeGreaterThan(0)
    expect(failed.hydrothermalGate.status).toBe("fail")
    expect(failed.organicAcidScore.oacs).toBe(0)
    expect(review.hydrothermalGate.status).toBe("needs_review")
    expect(review.organicAcidScore.oacs).toBe(0)
  })

  it("keeps Mo as a second-metal recommendation outcome with robust sensitivity", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const mo = result.moRecommendation

    expect(result.rankedFrameworks.filter(row => row.hydrothermalGate.status === "pass").length).toBeGreaterThanOrEqual(5)
    expect(mo).toBeTruthy()
    expect(mo.mostLikelyForm).toMatch(/Mo-oxo|MoOx-like/)
    expect(mo.mechanism.nodeSubstitution.level).toBe("low")
    expect(result.sensitivity.targetMetal.metal).toBe("Mo")
    expect(result.sensitivity.targetMetal.top3Probability).toBeGreaterThanOrEqual(0.85)
    expect(result.moRobustnessAudit.status).toBe("audit_required")
    expect(result.moRobustnessAudit.reason).toMatch(/not definitive proof|不是/)
  })

  it("marks blind-baseline negative evidence as pending when DOI is absent", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.blindBaselineSummary.map(row => row.metal).sort()).toEqual(["Ag", "Pd", "Ru"])
    result.blindBaselineSummary.forEach(row => {
      expect(row.sourceDoi).toBeNull()
      expect(row.negativeEvidenceStatus).toBe("pending verification")
    })
  })

  it("scores structured metal descriptors instead of falling back to zero", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const selectedFramework = result.selectedFramework
    const moSource = metals.find(row => row.metal === "Mo")
    const mo = calculateDMRS(moSource, selectedFramework, rules.dopantWeights)

    METAL_DESCRIPTOR_KEYS.forEach(key => {
      expect(moSource[key]).toEqual(expect.objectContaining({
        value: expect.any(Number),
        sourceBasis: expect.any(String),
        confidence: expect.any(String),
        sourceDoi: null,
        note: expect.any(String),
      }))
    })
    expect(mo.activeSiteValue).toBeGreaterThan(0.7)
    expect(mo.dmrs).toBeGreaterThan(0.6)
  })

  it("runs a full-metal sensitivity distribution with validated perturbations", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const distribution = runFullMetalSensitivityDistribution(metals, result.selectedFramework, rules.dopantWeights, 120, {
      perturbationRange: 0.2,
      robustTop3Threshold: 0.85,
      seed: 170,
    })

    expect(distribution.validation.status).toBe("valid")
    expect(distribution.validation.withinRange).toBe(true)
    expect(distribution.validation.normalized).toBe(true)
    expect(distribution.summaries).toHaveLength(metals.length)
    expect(distribution.summaries.find(row => row.metal === "Mo")).toEqual(expect.objectContaining({
      top1Probability: 1,
      rankRange: "1-1",
      rankProbabilities: expect.objectContaining({ rank1: 1 }),
    }))
    expect(result.fullMetalSensitivityDistribution).toHaveLength(metals.length)
  })

  it("reports competitor diagnostics and provenance coverage without fake DOI", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.competitiveMetalComparison.map(row => row.competitor).sort()).toEqual(["Fe", "Ti", "V", "W", "Zr"])
    expect(result.competitiveMetalComparison.find(row => row.competitor === "W").dmrsGap).toBeGreaterThan(0)
    expect(result.provenanceCoverage.structuredValueCoverage).toBe(1)
    expect(result.provenanceCoverage.sourceBasisCoverage).toBe(1)
    expect(result.provenanceCoverage.confidenceCoverage).toBe(1)
    expect(result.provenanceCoverage.doiCoverage).toBe(0)
    expect(result.provenanceCoverage.fakeDoiCount).toBe(0)
    expect(result.provenanceCoverage.noFakeDoiPolicyActive).toBe(true)
  })

  it("loads the V1.3 evidence data layer without fabricated DOI values", () => {
    const loaded = loadEvidenceRecords(evidenceRecords)
    const coverage = calculateEvidenceCoverage(loaded)
    const frameworksWithEvidence = attachEvidenceToFrameworks(frameworks, loaded)
    const metalsWithEvidence = attachEvidenceToMetals(metals, loaded)
    const mo = metalsWithEvidence.find(row => row.metal === "Mo")

    expect(loaded).toHaveLength(30)
    expect(loaded.every(record => record.sourceDoi === null)).toBe(true)
    expect(coverage).toEqual(expect.objectContaining({
      totalRecords: 30,
      verified: 0,
      literatureSupported: 0,
      literatureProxy: 12,
      expertPrior: 8,
      pendingVerification: 10,
      statusPendingVerification: 30,
      doiCoverage: 0,
      fakeDoiCount: 0,
      noFakeDoiPolicyActive: true,
    }))
    expect(coverage.warning).toMatch(/demo\/proxy/)
    expect(frameworks[0].waterStability.evidenceIds).toContain("EVID-OA-001")
    expect(frameworks[0].organicAcidScore.fieldEvidenceIds.oacs).toContain("EVID-OA-005")
    expect(frameworksWithEvidence[0].waterStability.evidenceRecords.map(record => record.id)).toContain("EVID-OA-002")
    expect(mo.formateAffinityProxy.evidenceIds).toContain("EVID-OA-008")
    expect(mo.formateAffinityProxy.evidenceRecords[0].id).toBe("EVID-OA-008")
    expect(rules.evidenceLayer.fieldEvidenceIds.DMRS).toContain("EVID-OA-015")
  })

  it("builds V1.3 methodology flow, formula, evidence matrix, and validation loop data", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords)

    expect(result.evidenceCoverage.totalRecords).toBe(30)
    expect(result.methodologyFlowData.map(row => row.id)).toEqual([
      "reaction-constraint",
      "hydrothermal-hard-gate",
      "oacs-framework-ranking",
      "dmrs-dopant-recommendation",
      "robustness-audit",
      "exafs-falsification",
      "experimental-controls",
    ])
    expect(result.formulaCards.map(card => card.id)).toEqual(["oacs", "dmrs"])
    expect(result.formulaCards.find(card => card.id === "oacs").thresholdFallback).toMatch(/OACS = 0/)
    expect(result.formulaCards.find(card => card.id === "dmrs").interpretation).toMatch(/not assumed/)
    expect(result.evidenceStrengthMatrix).toHaveLength(10)
    expect(result.evidenceStrengthMatrix.find(row => row.descriptor === "Formate affinity proxy")).toEqual(expect.objectContaining({
      doiStatus: "DOI pending",
      confidence: "medium",
    }))
    expect(result.validationLoopData.controls.map(row => row.name)).toEqual([
      "Pure Al-MOF",
      "Mo-anchored Al-MOF",
      "Al-MOF + MoOx physical mixture",
      "MoOx alone",
      "Blank reaction",
    ])
  })

  it("builds V1.4 coupled descriptor hot spot data without changing scoring conclusions", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords)
    const selected = result.scaffoldHotSpotData.find(row => row.isSelected)
    const mo = result.dopantHotSpotData.find(row => row.metal === "Mo")
    const w = result.dopantHotSpotData.find(row => row.metal === "W")
    const synergyMo = result.synergyHotSpotData.find(row => row.metal === "Mo")
    const synergyW = result.synergyHotSpotData.find(row => row.metal === "W")

    expect(selected.name).toBe("Al-hydroxyterephthalate C1-accessible scaffold")
    expect(selected.oacs).toBe(0.631)
    expect(result.scaffoldHotSpotData.find(row => row.gateStatus === "fail").why).toMatch(/High surface area/)
    expect(mo.role).toBe("primary hypothesis")
    expect(w.role).toBe("backup hypothesis")
    expect(result.dopantHotSpotData.filter(row => row.role === "blind baseline").map(row => row.metal).sort()).toEqual(["Ag", "Pd", "Ru"])
    expect(synergyMo.label).toBe("Al-MOF@Mo")
    expect(synergyMo.role).toBe("primary hypothesis")
    expect(synergyW.role).toBe("backup hypothesis")
    expect(result.hotSpotRegion).toEqual(expect.objectContaining({
      xMin: expect.any(Number),
      yMin: expect.any(Number),
      synergyMin: expect.any(Number),
    }))
    expect(result.descriptorCouplingData).toHaveLength(6)
    expect(result.validationEvidenceLadder.map(row => row.title)).toEqual([
      "Demo proxy",
      "Literature proxy",
      "DFT validation",
      "Spectroscopy validation",
      "Reaction performance",
    ])
    expect(result.moRecommendation.dmrs).toBe(0.653)
    expect(result.stageSummary.stage2.moWGap).toBe(0.027)
  })

  it("records the Organic Acid Knowledge Base and planned roadmap", () => {
    expect(versionDocs.knowledgeBaseLabel).toBe("Knowledge Base")
    expect(versionDocs.currentVersion).toBe("V2.0-F")
    expect(versionDocs.completedRange).toBe("V1.0-V2.0-F")
    expect(versionDocs.versions.map(row => row.version)).toEqual(["V1.0", "V1.1", "V1.2", "V1.3", "V1.4", "V1.5", "V1.6", "V1.7", "V2.0-A", "V2.0-B", "V2.0-C", "V2.0-D", "V2.0-E", "V2.0-F"])
    expect(versionDocs.versions.find(row => row.version === "V1.4")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Coupled Descriptor Hot Spot Map",
      evidenceBoundary: "Hot spot map is a demo/proxy design-space visualization, not a DFT-trained performance predictor.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V1.5")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Data Mapper and Schema Validation",
      evidenceBoundary: "Mapper preview uses small fixtures only and does not load full CoRE/QMOF or claim real-data validation.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V1.6")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Small Real Dataset Integration",
      evidenceBoundary: "Small curated sample only. Not full-scale CoRE/QMOF database screening and not validated catalytic performance.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V1.7")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Algorithm Trace Workbench and Performance Optimization",
      evidenceBoundary: "Trace workbench provides auditability and transparency for demo / mapped / curated sample workflows. It does not prove catalytic performance.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-A")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Large-scale Database Index Architecture",
      evidenceBoundary: "Database index architecture preview only; not full verified database screening.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-B")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Database Index Workbench UI",
      evidenceBoundary: "Front-end index preview only; not full verified database screening.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-C")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Expanded Database Screening UI",
      evidenceBoundary: "Expanded screening UI only; not full verified database screening and not a final recommendation system.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-D")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Worker-Based Scoring Boundary Design",
      evidenceBoundary: "Worker scoring boundary and loaded-scope dry-run preview only; not full verified database screening and not a final verified recommendation.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-E")).toEqual(expect.objectContaining({
      status: "completed",
      title: "Verified Metadata Enrichment Workflow",
      evidenceBoundary: "Metadata verification gate and status modeling only; no live DOI/source verification, not full verified database screening, and not a final verified recommendation.",
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.0-F")).toEqual(expect.objectContaining({
      status: "current",
      title: "Background Precompute Pipeline Planning",
      evidenceBoundary: "Pipeline planning and offline dry-run only; not full database integration and not full verified database screening.",
    }))
    versionDocs.versions.forEach(row => {
      expect(row.summary).toBeTruthy()
      expect(row.keyUpdates.length).toBeGreaterThan(0)
      expect(row.algorithmChanges.length).toBeGreaterThan(0)
      expect(row.uiChanges.length).toBeGreaterThan(0)
      expect(row.methodologyChanges.length).toBeGreaterThan(0)
      expect(row.evidenceBoundary).toBeTruthy()
      expect(row.limitations.length).toBeGreaterThan(0)
      if (row.version.startsWith("V1.")) {
        expect(row.literatureInspirations.length).toBeGreaterThan(0)
        expect(row.knowledgeBaseLinks.literatureIds.length).toBeGreaterThan(0)
      } else {
        expect(row.knowledgeBaseLinks.knowledgeTags.length).toBeGreaterThan(0)
      }
      expect(row.knowledgeBaseLinks.adaptationBoundary).toBeTruthy()
      ;(row.literatureInspirations || []).forEach(link => {
        expect(link.literatureId).toBeTruthy()
        expect(link.inspiredFeatures.length).toBeGreaterThan(0)
        expect(link.evidenceBoundary).toBeTruthy()
      })
    })
    expect(versionDocs.roadmap.map(row => [row.version, row.status])).toEqual([
      ["V2.0-G", "planned"],
    ])
    expect(literatureInspirations).toHaveLength(5)
    const hotSpotPaper = literatureInspirations.find(row => row.id === "LIT-HOTSPOT-2025-NATCOMM")
    expect(hotSpotPaper).toEqual(expect.objectContaining({
      status: "verified_from_uploaded_file",
      doi: "10.1038/s41467-025-60170-0",
    }))
    const suPaper = literatureInspirations.find(row => row.id === "LIT-SU-2025-MOF-BORYLATION")
    expect(suPaper.uploadedFileRefs).toEqual(["LIT-005", "LIT-006"])
    expect(suPaper.duplicateFileRefs).toEqual(["LIT-006"])
    expect(literatureInspirations.filter(row => row.status === "pending_metadata").every(row => row.doi === null)).toBe(true)
  })

  it("records the V1.6 small real dataset, V1.7 trace workbench, and Knowledge Base upgrade", () => {
    const v15 = versionDocs.versions.find(row => row.version === "V1.5")
    const v16 = versionDocs.versions.find(row => row.version === "V1.6")
    expect(v15.maintenanceNotes).toContain("V1.5 Patch: Run Launcher Prep + Cat Drag Fix + Copy Cleanup.")
    expect(v15.maintenanceNotes.join(" ")).toMatch(/current demo workflow/)
    expect(v16.keyUpdates.join(" ")).toMatch(/curated real Al-MOF examples/)
    expect(v16.keyUpdates.join(" ")).toMatch(/Knowledge Base/)
    expect(v16.algorithmChanges.join(" ")).toMatch(/No OACS\/DMRS core scoring logic change/)
    const v17 = versionDocs.versions.find(row => row.version === "V1.7")
    expect(v17.keyUpdates.join(" ")).toMatch(/Algorithm Trace Workbench/)
    expect(v17.keyUpdates.join(" ")).toMatch(/chart-scoped science probe/)
    expect(v17.keyUpdates.join(" ")).toMatch(/Methods & Evidence/)
    expect(v17.algorithmChanges.join(" ")).toMatch(/No OACS\/DMRS core scoring logic change/)
    const v20b = versionDocs.versions.find(row => row.version === "V2.0-B")
    expect(v20b.keyUpdates.join(" ")).toMatch(/Database Index Workbench UI/)
    expect(v20b.algorithmChanges.join(" ")).toMatch(/index-level trace/)
    expect(v20b.evidenceBoundary).toMatch(/not full verified database screening/)
    const v20c = versionDocs.versions.find(row => row.version === "V2.0-C")
    expect(v20c.keyUpdates.join(" ")).toMatch(/Why in preview/)
    expect(v20c.keyUpdates.join(" ")).toMatch(/Candidate Compare/)
    expect(v20c.algorithmChanges.join(" ")).toMatch(/No OACS\/DMRS formula change/)
    expect(v20c.evidenceBoundary).toMatch(/not full verified database screening/)
    const v20d = versionDocs.versions.find(row => row.version === "V2.0-D")
    expect(v20d.keyUpdates.join(" ")).toMatch(/Worker Scoring Boundary Preview/)
    expect(v20d.algorithmChanges.join(" ")).toMatch(/Full database scoring/)
    expect(v20d.algorithmChanges.join(" ")).toMatch(/No OACS\/DMRS formula change/)
    expect(v20d.evidenceBoundary).toMatch(/not full verified database screening/)
    const v20e = versionDocs.versions.find(row => row.version === "V2.0-E")
    expect(v20e.keyUpdates.join(" ")).toMatch(/metadata/i)
    expect(v20e.keyUpdates.join(" ")).toMatch(/GitHub Actions CI/)
    expect(v20e.algorithmChanges).toContain("No OACS/DMRS formula change.")
    expect(v20e.algorithmChanges).toContain("No full database scoring in browser.")
    expect(v20e.algorithmChanges.join(" ")).toMatch(/metadata verification gate/)
    expect(v20e.evidenceBoundary).toMatch(/not full verified database screening/)
    const v20f = versionDocs.versions.find(row => row.version === "V2.0-F")
    expect(v20f.keyUpdates.join(" ")).toMatch(/precompute/i)
    expect(v20f.keyUpdates.join(" ")).toMatch(/dry-run/i)
    expect(v20f.algorithmChanges).toContain("No OACS/DMRS formula change.")
    expect(v20f.algorithmChanges).toContain("No full database scoring in browser.")
    expect(v20f.algorithmChanges.join(" ")).toMatch(/V2.0-D worker boundary and V2.0-E metadata gate are unchanged/)
    expect(v20f.evidenceBoundary).toMatch(/not full verified database screening/)
    expect(versionDocs.currentVersion).toBe("V2.0-F")
    expect(versionDocs.roadmap.map(row => [row.version, row.status])).toEqual([
      ["V2.0-G", "planned"],
    ])
  })

  it("exposes the V2.0-D database index preview in the Organic Acid methodology directory", () => {
    const children = ORGANIC_ACID_FINAL_DIRECTORY.children
    const traceIndex = children.findIndex(row => row.id === "methodology-oafs-trace-workbench")
    const databaseIndex = children.findIndex(row => row.id === "methodology-oafs-database-index-preview")
    const oacsIndex = children.findIndex(row => row.id === "methodology-oafs-oacs")
    const item = children[databaseIndex]

    expect(traceIndex).toBeGreaterThanOrEqual(0)
    expect(databaseIndex).toBe(traceIndex + 1)
    expect(oacsIndex).toBe(databaseIndex + 1)
    expect(item).toEqual({
      id: "methodology-oafs-database-index-preview",
      label: "Database Index Preview",
      labelZh: "数据库索引预览",
    })
  })

  it("documents the V2.0-D Worker-Based Scoring Boundary Design in methodology", () => {
    const methodologySource = fs.readFileSync("src/components/methodology/OrganicAcidFinalMethodology.jsx", "utf8")
    expect(methodologySource).toMatch(/V2.0-D Worker-Based Scoring Boundary Design/)
    expect(methodologySource).toMatch(/Worker trace/)
  })

  it("documents the V2.0-E Verified Metadata Enrichment Workflow in methodology", () => {
    const methodologySource = fs.readFileSync("src/components/methodology/OrganicAcidFinalMethodology.jsx", "utf8")
    expect(methodologySource).toMatch(/V2.0-E Verified Metadata Enrichment Workflow/)
    expect(methodologySource).toMatch(/Metadata verification gate/)
    expect(methodologySource).toMatch(/CI verification gate/)
  })

  it("documents the V2.0-F Background Precompute Pipeline Planning in methodology", () => {
    const methodologySource = fs.readFileSync("src/components/methodology/OrganicAcidFinalMethodology.jsx", "utf8")
    expect(methodologySource).toMatch(/V2.0-F Background Precompute Pipeline Planning/)
    expect(methodologySource).toMatch(/Precompute dry-run \(offline\)/)
  })

  it("runs the V1.7 launcher workflow on demo, mapped fixture, and curated sample modes with exportable trace", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords)
    const curatedRealExamples = loadCuratedRealExamples()
    const curatedResult = buildCuratedRealScreeningResult(curatedRealExamples, metals, rules)
    const previewSteps = buildRunSteps(result, { dataMode: "mapped_fixtures" })
    const demoRun = runDemoScreeningWorkflow(frameworks, metals, rules, evidenceRecords, { dataMode: "demo_workflow" })
    const mappedRun = runDemoScreeningWorkflow(frameworks, metals, rules, evidenceRecords, { dataMode: "mapped_fixtures" })
    const curatedRun = runDemoScreeningWorkflow(frameworks, metals, rules, evidenceRecords, { dataMode: "curated_real_examples", curatedRealExamples, curatedRealResult: curatedResult })

    expect(previewSteps).toHaveLength(10)
    expect(previewSteps.map(row => row.linkedSectionId)).toContain("organic-acid-final-framework-ranking")
    expect(demoRun.status).toBe("completed")
    expect(demoRun.steps).toHaveLength(10)
    expect(demoRun.summary).toEqual(expect.objectContaining({
      dataMode: "demo_workflow",
      topDopants: ["Mo", "W"],
      moWGap: 0.027,
    }))
    expect(demoRun.summary.evidenceBoundary).toMatch(/does not represent full database screening/)
    expect(demoRun.trace).toEqual(expect.objectContaining({
      workflowVersion: "V1.7",
      exportable: true,
      dataMode: "demo_workflow",
    }))
    expect(demoRun.trace.runId).toMatch(/OAFS-V1\.7-demo_workflow/)
    expect(demoRun.trace.steps).toHaveLength(10)
    expect(demoRun.trace.candidateDecisions.length).toBeGreaterThan(10)
    expect(demoRun.trace.formulaTraces.map(row => row.formulaId)).toEqual(["oacs", "dmrs"])
    expect(demoRun.trace.evidenceTraces.length).toBeGreaterThan(10)
    expect(demoRun.trace.legacyRecords.map(row => row.id)).toContain("run-boundary")
    expect(mappedRun.status).toBe("completed")
    expect(mappedRun.summary.dataMode).toBe("mapped_fixtures")
    expect(mappedRun.trace.dataMode).toBe("mapped_fixtures")
    expect(curatedRun.status).toBe("completed")
    expect(curatedRun.steps).toHaveLength(9)
    expect(curatedRun.steps.map(row => row.title)).toEqual([
      "Load curated framework examples",
      "Validate schema",
      "Apply data quality gate",
      "Attach QMOF descriptors",
      "Attach literature evidence",
      "Apply hydrothermal gate",
      "Calculate OACS for eligible examples",
      "Project points to hot spot map",
      "Generate review summary",
    ])
    expect(curatedRun.summary).toEqual(expect.objectContaining({
      dataMode: "curated_real_examples",
      frameworkRecords: 12,
      readyForScoring: 3,
      needsReview: 7,
      rejected: 2,
      unmatchedQmofDescriptorRecords: 2,
      doiCoverage: 0,
    }))
    expect(curatedRun.summary.evidenceBoundary).toMatch(/not full-scale CoRE\/QMOF database screening/i)
    expect(curatedRun.result.curatedFrameworks.filter(row => row.finalRecommendationEligible)).toHaveLength(3)
    expect(curatedRun.result.curatedFrameworks.filter(row => row.dataQualityGate.status === "needs_review").every(row => !row.finalRecommendationEligible)).toBe(true)
    expect(curatedRun.trace.dataMode).toBe("curated_real_examples")
    expect(curatedRun.trace.steps).toHaveLength(9)
    expect(curatedRun.trace.warnings.join(" ")).toMatch(/small sample/i)
  })

  it("builds the V1.2 algorithm journey UI data without changing conclusions", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    expect(result.algorithmJourneySteps).toHaveLength(7)
    expect(result.algorithmJourneySteps.map(row => row.id)).toEqual([
      "reaction-constraints",
      "hydrothermal-gate",
      "oacs-framework-ranking",
      "dmrs-dopant-recommendation",
      "robustness-audit",
      "exafs-falsification",
      "experimental-controls",
    ])
    expect(result.algorithmJourneySteps.find(row => row.id === "robustness-audit").status).toBe("warning")
    expect(result.screeningFunnelData.map(row => [row.label, row.count])).toEqual([
      ["Raw demo framework pool", 24],
      ["Al-MOF candidates", 24],
      ["Hydrothermal gate pass", 9],
      ["OACS-ranked candidates", 9],
      ["Selected scaffold", 1],
      ["Dopant metals evaluated", 14],
      ["High-priority dopants", 2],
      ["Experimental hypothesis", 1],
    ])
    expect(result.stageSummary.stage1.oacs).toBe(0.631)
    expect(result.stageSummary.stage2.moWGap).toBe(0.027)
    expect(result.mechanismRadarData.map(row => row.metal)).toEqual(["Mo", "W", "V", "Fe", "Ti", "Zr"])
    expect(result.sensitivityRankBars.find(row => row.metal === "Mo").rankProbabilities.rank1).toBe(1)
    expect(result.algorithmTrace).toHaveLength(9)
    expect(result.algorithmTrace.map(row => row.id)).toContain("falsifiable-hypothesis")
  })

  it("builds candidate decision traces for pass, fail, and needs-review candidates", () => {
    const result = runOrganicAcidFinalScreening(frameworks, metals, rules)
    const passed = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "pass"))
    const failed = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "fail"))
    const review = buildCandidateDecisionTrace(result.rankedFrameworks.find(row => row.hydrothermalGate.status === "needs_review"))

    expect(passed.decision).toBe("passed")
    expect(failed.decision).toBe("failed")
    expect(failed.reasons).toContain("OACS forced to 0")
    expect(failed.reasonsZh).toContain("高比表面积不能抵消水热稳定性失败。")
    expect(review.decision).toBe("needs_review")
    expect(review.penalties).toContain("OACS forced to 0")
  })
})
