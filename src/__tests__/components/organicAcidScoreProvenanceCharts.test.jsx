// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import {
  buildFactorCompressionTrace,
  buildGuestScoreProvenance,
  buildHostScoreProvenance,
  buildRouteFactorComparisonModel,
  buildRouteHgcpsScoreProvenance,
  buildScoreSourceTableModel,
} from "../../utils/organicAcidScoreProvenance"
import {
  FactorCompressionWaterfall,
  FinalResultSummary,
  GuestDumbbellChart,
  GuestScoreBreakdownChart,
  HgcpsFactorRose,
  HostFactorRose,
  HostScoreBreakdownChart,
  PathwayFlowDiagram,
  RouteFactorComparisonChart,
  ScoreSourceTable,
  ValidationReadinessDonut,
} from "../../components/catalysis/scoreProvenance"
import {
  buildPathwayCoverageChartModel,
  buildValidationMatrixCoverageChartModel,
} from "../../utils/organicAcidStepwiseExecution"
import { buildFinalResultSummaryModel } from "../../utils/organicAcidScoreProvenance"

const workbench = buildOrganicAcidHostGuestWorkbench({
  pathwaySteps,
  pathwayDescriptorMap,
  hostMofCandidates,
  guestMetalCandidates,
  hostGuestRoutes,
  evidenceRiskRecords,
  validationExperiments,
})

describe("organic acid score provenance charts", () => {
  it("renders the HGCPS factor compression waterfall with six factor segments and Chinese labels", () => {
    render(<FactorCompressionWaterfall model={buildFactorCompressionTrace(workbench)} lang="zh" />)
    const chart = screen.getByTestId("factor-compression-waterfall")
    expect(chart).toHaveAttribute("data-factor-count", "6")
    expect(chart.textContent).toMatch(/HGCPS 因子压缩图/)
    expect(chart.textContent).toMatch(/风险保留系数/)
  })

  it("renders the route factor comparison for top / runner-up / third routes", () => {
    render(<RouteFactorComparisonChart model={buildRouteFactorComparisonModel(workbench)} lang="zh" />)
    const chart = screen.getByTestId("route-factor-comparison-chart")
    expect(Number(chart.getAttribute("data-route-count"))).toBeGreaterThanOrEqual(3)
    expect(chart.textContent).toMatch(/当前 #1 相比 #2 主要优势来自/)
    expect(chart.textContent).toMatch(/路线因子对比图/)
  })

  it("renders the host score breakdown with the selected host contributions", () => {
    render(<HostScoreBreakdownChart model={buildHostScoreProvenance(workbench)} lang="zh" />)
    const chart = screen.getByTestId("host-score-breakdown-chart")
    expect(chart).toHaveAttribute("data-row-count", "8")
    expect(chart.textContent).toMatch(/主体得分/)
    expect(chart.textContent).toContain(workbench.hostSelection.selectedHost.displayName)
  })

  it("renders the guest score breakdown comparing selected and runner-up guests", () => {
    const guests = workbench.guestSelection.rankedGuestMetals.slice(0, 3)
    const models = guests.map(guest => buildGuestScoreProvenance(workbench, { guest }))
    render(<GuestScoreBreakdownChart models={models} lang="zh" />)
    const chart = screen.getByTestId("guest-score-breakdown-chart")
    expect(chart).toHaveAttribute("data-row-count", "7")
    expect(chart.textContent).toMatch(/客体得分拆解图/)
  })

  it("renders HGCPS and host factor rose charts from model rows and updates when data changes", () => {
    const routeModel = buildRouteHgcpsScoreProvenance(workbench)
    const hostModel = buildHostScoreProvenance(workbench)
    const alteredWorkbench = buildOrganicAcidHostGuestWorkbench({
      pathwaySteps,
      pathwayDescriptorMap,
      hostMofCandidates: hostMofCandidates.map((host, index) => index === 0 ? { ...host, poreEnvironmentScore: 0.6 } : host),
      guestMetalCandidates,
      hostGuestRoutes: hostGuestRoutes.map((route, index) => index === 0 ? { ...route, hostGuestComplementarityScore: 0.52 } : route),
      evidenceRiskRecords,
      validationExperiments,
    })
    const { rerender } = render(<HgcpsFactorRose model={routeModel} lang="zh" />)
    const routeRose = screen.getByTestId("hgcps-factor-rose")
    expect(routeRose).toHaveAttribute("data-row-count", "6")
    expect(routeRose.querySelectorAll('[data-testid="factor-rose-wedge"]')).toHaveLength(6)
    expect(routeRose.textContent).toContain("0.416")

    rerender(<HgcpsFactorRose model={buildRouteHgcpsScoreProvenance(alteredWorkbench)} lang="zh" />)
    expect(screen.getByTestId("hgcps-factor-rose").textContent).not.toContain("0.416")

    rerender(<HostFactorRose model={hostModel} comparisonModels={[hostModel]} lang="zh" />)
    expect(screen.getByTestId("host-factor-rose")).toHaveAttribute("data-row-count", "5")

    rerender(<HostFactorRose model={buildHostScoreProvenance(alteredWorkbench)} comparisonModels={[buildHostScoreProvenance(alteredWorkbench)]} lang="zh" />)
    expect(screen.getByTestId("host-factor-rose").textContent).toContain("0.60")
  })

  it("renders the guest dumbbell chart and responds to comparison series count", () => {
    const models = workbench.guestSelection.rankedGuestMetals.slice(0, 3).map(guest => buildGuestScoreProvenance(workbench, { guest }))
    const { rerender } = render(<GuestDumbbellChart models={models} lang="zh" />)
    expect(screen.getByTestId("guest-dumbbell-chart")).toHaveAttribute("data-row-count", "7")
    expect(screen.getByTestId("guest-dumbbell-chart")).toHaveAttribute("data-series-count", "3")
    expect(screen.getByTestId("guest-dumbbell-chart").textContent).toMatch(/前 2 个竞争客体/)

    rerender(<GuestDumbbellChart models={models.slice(0, 2)} lang="zh" />)
    expect(screen.getByTestId("guest-dumbbell-chart")).toHaveAttribute("data-series-count", "2")
    expect(screen.getByTestId("guest-dumbbell-chart").textContent).toMatch(/前 1 个竞争客体/)
  })

  it("renders pathway flow and validation readiness donut with data-driven row counts", () => {
    const source = { pathwaySteps, pathwayDescriptorMap, hostMofCandidates, guestMetalCandidates, hostGuestRoutes, evidenceRiskRecords, validationExperiments }
    const pathwayModel = buildPathwayCoverageChartModel(workbench, source, "zh")
    const validationModel = buildValidationMatrixCoverageChartModel(workbench, source, null, "zh")
    const { rerender } = render(<PathwayFlowDiagram model={pathwayModel} lang="zh" />)
    expect(screen.getByTestId("pathway-flow-diagram")).toHaveAttribute("data-row-count", String(pathwaySteps.length))

    rerender(<PathwayFlowDiagram model={{ ...pathwayModel, rows: pathwayModel.rows.slice(0, 2) }} lang="zh" />)
    expect(screen.getByTestId("pathway-flow-diagram")).toHaveAttribute("data-row-count", "2")

    rerender(<ValidationReadinessDonut model={validationModel} lang="zh" />)
    expect(Number(screen.getByTestId("validation-readiness-donut").getAttribute("data-row-count"))).toBeGreaterThan(0)
    expect(screen.getByTestId("validation-readiness-donut").textContent).toMatch(/已覆盖|covered/)
  })

  it("renders the final result summary from the top route model", () => {
    const model = buildFinalResultSummaryModel(workbench, { sourceData: { validationExperiments } })
    render(<FinalResultSummary model={model} lang="zh" />)
    const summary = screen.getByTestId("final-result-summary")
    expect(summary.textContent).toContain(String(model.nextExperiment))
    expect(summary.textContent).toContain(model.finalHGCPS.toFixed(3))
    expect(summary.textContent).toMatch(/最高优先级实验验证路线/)
  })

  it("renders a collapsible score source table that can expand", () => {
    render(<ScoreSourceTable model={buildScoreSourceTableModel(buildRouteHgcpsScoreProvenance(workbench))} lang="zh" open />)
    const table = screen.getByTestId("score-source-table")
    expect(table.tagName.toLowerCase()).toBe("details")
    expect(table).toHaveAttribute("open")
    expect(within(table).getByText(/查看得分来源/)).toBeInTheDocument()
    expect(table.textContent).toMatch(/这个分数怎么算出来的？/)
    expect(table.textContent).not.toMatch(/undefined|null|NaN/)
  })

  it("falls back to a pending state when chart data is empty", () => {
    render(<FactorCompressionWaterfall model={{ steps: [] }} lang="zh" />)
    expect(screen.getByTestId("factor-compression-waterfall").textContent).toMatch(/数据不足|insufficient/)
  })
})
