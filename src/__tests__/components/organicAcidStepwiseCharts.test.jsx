// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import minimumExperimentalMatrix from "../../../public/data/organic_acid_experimental_activation/minimum_experimental_matrix.json"
import sameConditionDataTemplate from "../../../public/data/organic_acid_experimental_activation/same_condition_data_template.json"
import activationReadinessSummary from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"
import {
  buildDescriptorMappingChartModel,
  buildGuestRankingChartModel,
  buildHostRankingChartModel,
  buildPathwayCoverageChartModel,
  buildRouteHgcpsBreakdownChartModel,
  buildValidationMatrixCoverageChartModel,
} from "../../utils/organicAcidStepwiseExecution"
import {
  DescriptorMappingGraph,
  GuestRankingChart,
  HostRankingChart,
  PathwayCoverageChart,
  RouteHgcpsBreakdownChart,
  ValidationMatrixCoverageChart,
} from "../../components/catalysis/stepwiseExecution"

function sourceFixture(overrides = {}) {
  return {
    pathwaySteps,
    pathwayDescriptorMap,
    hostMofCandidates,
    guestMetalCandidates,
    hostGuestRoutes,
    evidenceRiskRecords,
    validationExperiments,
    ...overrides,
  }
}

describe("organic acid stepwise dynamic charts", () => {
  it("renders host and guest ranking charts with row counts from candidate builders", () => {
    const source = sourceFixture({
      hostMofCandidates: hostMofCandidates.slice(0, 3),
      guestMetalCandidates: guestMetalCandidates.slice(0, 4),
    })
    const workbench = buildOrganicAcidHostGuestWorkbench(source)

    render(
      <>
        <HostRankingChart model={buildHostRankingChartModel(workbench, source, "zh")} lang="zh" />
        <GuestRankingChart model={buildGuestRankingChartModel(workbench, source, "zh")} lang="zh" />
      </>,
    )

    expect(screen.getByTestId("host-ranking-chart")).toHaveAttribute("data-row-count", "3")
    expect(screen.getByTestId("guest-ranking-chart")).toHaveAttribute("data-row-count", "4")
    expect(screen.getByText("主体候选排名图")).toBeInTheDocument()
    expect(screen.getByText("客体金属排名图")).toBeInTheDocument()
  })

  it("renders pathway and descriptor charts from pathway_steps and descriptor_map length", () => {
    const source = sourceFixture({
      pathwaySteps: pathwaySteps.slice(0, 2),
      pathwayDescriptorMap: pathwayDescriptorMap.slice(0, 2),
    })
    const workbench = buildOrganicAcidHostGuestWorkbench(source)

    render(
      <>
        <PathwayCoverageChart model={buildPathwayCoverageChartModel(workbench, source, "zh")} lang="zh" />
        <DescriptorMappingGraph model={buildDescriptorMappingChartModel(workbench, source, "zh")} lang="zh" />
      </>,
    )

    expect(screen.getByTestId("pathway-coverage-chart")).toHaveAttribute("data-row-count", "2")
    expect(screen.getByTestId("descriptor-mapping-graph")).toHaveAttribute("data-row-count", "2")
    expect(screen.getByText("路径步骤覆盖图")).toBeInTheDocument()
    expect(screen.getByText("路径—描述符映射图")).toBeInTheDocument()
  })

  it("renders route chart from route scores and updates the top route when score inputs change", () => {
    const alteredRoutes = hostGuestRoutes.map((route, index) => index === 1
      ? {
        ...route,
        hostStabilityScore: 0.99,
        hostPathwaySupportScore: 0.99,
        guestActivityCompensationScore: 0.99,
        hostGuestComplementarityScore: 0.99,
        evidenceConfidenceScore: 0.99,
        riskPenalty: 0.99,
      }
      : route)
    const source = sourceFixture({ hostGuestRoutes: alteredRoutes.slice(0, 5) })
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const model = buildRouteHgcpsBreakdownChartModel(workbench, source, "zh")

    render(<RouteHgcpsBreakdownChart model={model} lang="zh" />)

    expect(screen.getByTestId("route-hgcps-breakdown-chart")).toHaveAttribute("data-row-count", "5")
    expect(model.rows[0].routeId).toBe(alteredRoutes[1].routeId)
    expect(screen.getByText("路线评分分解图")).toBeInTheDocument()
  })

  it("renders validation coverage from experiment matrix and readiness builder output", () => {
    const source = sourceFixture()
    const workbench = buildOrganicAcidHostGuestWorkbench(source)
    const activationWorkbench = buildExperimentalActivationWorkbench({
      minimumExperimentalMatrix: {
        ...minimumExperimentalMatrix,
        experimentGroups: minimumExperimentalMatrix.experimentGroups.slice(0, 1),
      },
      sameConditionDataTemplate,
      activationReadinessSummary,
    }, { topRoute: workbench.complementarity.topRoute })
    const model = buildValidationMatrixCoverageChartModel(workbench, source, activationWorkbench, "zh")

    render(<ValidationMatrixCoverageChart model={model} lang="zh" />)

    expect(screen.getByTestId("validation-matrix-coverage-chart")).toBeInTheDocument()
    expect(screen.getByText("验证矩阵覆盖图")).toBeInTheDocument()
    expect(screen.getByText(/实验项/).textContent).toContain("1")
    expect(model.experimentCount).toBe(1)
  })
})
