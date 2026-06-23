import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import experimentalFeedbackRules from "../../../public/data/organic_acid_experimental_activation/experimental_feedback_rules.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"
import {
  buildDescriptorMappingExplanationModel,
  buildDescriptorMappingSummary,
  buildExplanationClosureExportJson,
  buildOrganicAcidVisualQaChecklist,
  buildPathwayEvidenceHeatmapModel,
  buildPathwayEvidenceSummary,
  buildTerminologyCrosswalk,
  buildValidationCoverageMatrixModel,
  buildValidationCoverageSummary,
} from "../../utils/organicAcidExplanationClosure"

const STATES = ["covered", "partial", "pending", "missing"]

function source(overrides = {}) {
  return { pathwaySteps, pathwayDescriptorMap, hostMofCandidates, guestMetalCandidates, hostGuestRoutes, evidenceRiskRecords, validationExperiments, ...overrides }
}
function workbench(overrides = {}) {
  return buildOrganicAcidHostGuestWorkbench(source(overrides))
}
function activation(matrixOverride = minimumExperimentalMatrix) {
  return buildExperimentalActivationWorkbench({
    minimumExperimentalMatrix: matrixOverride,
    sameConditionDataTemplate,
    experimentalFeedbackRules,
    activationReadinessSummary,
  }, { topRoute: workbench().complementarity.topRoute })
}
function noBad(value) {
  expect(JSON.stringify(value)).not.toMatch(/undefined|null|NaN/)
}

describe("organic acid explanation closure builders", () => {
  it("builds a pathway evidence heatmap with evidence / confidence / descriptor / risk cells per step", () => {
    const model = buildPathwayEvidenceHeatmapModel(workbench(), source())
    expect(model.rows.length).toBe(pathwaySteps.length)
    expect(model.columns.map(c => c.key)).toEqual(["evidence", "confidence", "descriptor", "risk"])
    for (const row of model.rows) {
      expect(row.labelZh).toBeTruthy()
      expect(row.cells.map(c => c.metric)).toEqual(["evidence", "confidence", "descriptor", "risk"])
      for (const cell of row.cells) expect(["covered", "partial", "missing", "risk"]).toContain(cell.status)
      expect(["seed", "proxy", "curated", "inferred"]).toContain(row.dataGrade)
    }
    noBad(model)
  })

  it("derives the Step 1 pathway evidence one-line summary from data", () => {
    const summary = buildPathwayEvidenceSummary(workbench(), source())
    expect(summary.oneLineConclusionZh).toMatch(/CO₂→有机酸路径被分解为 \d+ 个步骤/)
    expect(summary.keyCoveredCount + summary.pendingCount).toBe(pathwaySteps.length)
    noBad(summary)
  })

  it("builds descriptor mapping explanation with nodes, edges, and missing descriptors", () => {
    const model = buildDescriptorMappingExplanationModel(workbench(), source())
    expect(model.nodes.length).toBe(pathwaySteps.length + pathwayDescriptorMap.length)
    expect(model.edges.length).toBe(pathwayDescriptorMap.length)
    expect(model.descriptorGroups.every(g => Array.isArray(g.missingDescriptors))).toBe(true)
    expect(model.missingDescriptorCount).toBeGreaterThanOrEqual(0)
    const summary = buildDescriptorMappingSummary(workbench(), source())
    expect(summary.oneLineConclusionZh).toMatch(/个路径步骤映射到 \d+ 个描述符组/)
    noBad(model)
  })

  it("builds a validation coverage matrix with covered / partial / pending / missing states", () => {
    const model = buildValidationCoverageMatrixModel(workbench(), source(), activation())
    expect(model.items.length).toBeGreaterThanOrEqual(10)
    for (const item of model.items) expect(STATES).toContain(item.status)
    expect(model.items.some(i => i.status === "covered")).toBe(true)
    expect(model.items.find(i => i.id === "top-route").status).toBe("covered")
    expect(model.readinessLevel).toMatch(/planning-ready/)
    expect(model.canUseForPerformanceClaim).toBe(false)
    noBad(model)
  })

  it("does not hardcode Mo-only coverage — removing the Mo-only group flips it away from covered", () => {
    const withMo = buildValidationCoverageMatrixModel(workbench(), source(), activation())
    expect(withMo.items.find(i => i.id === "mo-only").status).toBe("covered")

    const filtered = {
      ...minimumExperimentalMatrix,
      experimentGroups: minimumExperimentalMatrix.experimentGroups.filter(g => !/moox|mo-only|mo precursor/i.test(`${g.experimentGroupId} ${g.experimentName} ${g.controlType}`)),
    }
    const withoutMo = buildValidationCoverageMatrixModel(workbench(), source(), activation(filtered))
    expect(withoutMo.items.find(i => i.id === "mo-only").status).not.toBe("covered")
  })

  it("derives the Step 6 validation coverage summary without claiming completion", () => {
    const summary = buildValidationCoverageSummary(workbench(), source(), activation())
    expect(summary.oneLineConclusionZh).toMatch(/同条件性能数据仍为 pending/)
    expect(summary.boundaryZh).toMatch(/不代表实验已完成/)
    noBad(summary)
  })

  it("builds a terminology crosswalk that keeps HGCPS primary and marks OACS / DMRS legacy/auxiliary", () => {
    const model = buildTerminologyCrosswalk()
    expect(model.primaryScore).toBe("HGCPS")
    const byAcronym = Object.fromEntries(model.terms.map(t => [t.acronym, t]))
    expect(byAcronym.HGCPS.role).toBe("primary")
    expect(byAcronym.OACS.role).toBe("legacy")
    expect(byAcronym.DMRS.role).toBe("auxiliary")
    expect(model.firstMentionNoteZh).toMatch(/主客体互补路径评分/)
  })

  it("exports the closure bundle and a visual QA checklist without bad values", () => {
    const bundle = buildExplanationClosureExportJson(workbench(), source(), activation())
    expect(bundle.version).toBe("V3.9.5.5")
    noBad(bundle)
    const qa = buildOrganicAcidVisualQaChecklist()
    expect(qa.items.length).toBeGreaterThanOrEqual(10)
    expect(qa.items.every(i => i.status === "to-verify")).toBe(true)
  })

  it("falls back to pending coverage when no activation matrix is available", () => {
    const model = buildValidationCoverageMatrixModel(workbench(), source(), null)
    expect(model.experimentGroupCount).toBe(0)
    expect(model.items.every(i => i.status === "pending")).toBe(true)
    noBad(model)
  })
})
