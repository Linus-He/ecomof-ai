// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
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
  buildFactorEvidence,
  buildGuestScoreProvenance,
  buildHostScoreProvenance,
  buildPerFactorInterpretation,
  buildRouteFactorComparisonModel,
  buildRouteHgcpsScoreProvenance,
  buildScoreSourceTableModel,
} from "../../utils/organicAcidScoreProvenance"
import {
  FactorCompressionWaterfall,
  FinalResultSummary,
  DescriptorAblationChart,
  DescriptorContributionBar,
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
  it("renders the HGCPS factor compression waterfall with eight factor segments and Chinese labels", () => {
    render(<FactorCompressionWaterfall model={buildFactorCompressionTrace(workbench)} lang="zh" />)
    const chart = screen.getByTestId("factor-compression-waterfall")
    expect(chart).toHaveAttribute("data-factor-count", "8")
    expect(chart.textContent).toMatch(/HGCPS 因子压缩图/)
    expect(chart.textContent).toMatch(/风险保留系数/)
  })

  it("renders the route factor comparison for top / runner-up / third routes", () => {
    render(<RouteFactorComparisonChart model={buildRouteFactorComparisonModel(workbench)} lang="zh" />)
    const chart = screen.getByTestId("route-factor-comparison-chart")
    expect(Number(chart.getAttribute("data-route-count"))).toBeGreaterThanOrEqual(3)
    expect(chart.textContent).toMatch(/当前 top route 相比 runner-up 主要优势来自/)
    expect(chart.textContent).toMatch(/路线因子对比图/)
  })

  it("renders four-layer descriptor ablation and eight per-factor contribution rows", () => {
    const model = workbench.descriptorAblation
    const routeId = model.layers[3].candidates[0].routeId
    render(
      <>
        <DescriptorAblationChart model={model} lang="zh" selectedRouteId={routeId} />
        <DescriptorContributionBar model={model} lang="zh" routeId={routeId} />
      </>
    )

    expect(screen.getByTestId("descriptor-ablation-chart")).toHaveAttribute("data-row-count", String(model.candidates.length))
    expect(screen.getAllByTestId("descriptor-ablation-line")).toHaveLength(model.candidates.length)
    expect(screen.getByTestId("descriptor-ablation-chart").textContent).toMatch(/描述符影响/)
    expect(screen.getByTestId("descriptor-contribution-bar")).toHaveAttribute("data-row-count", "8")
    expect(screen.getAllByTestId("descriptor-contribution-row")).toHaveLength(8)
    expect(screen.getByTestId("descriptor-contribution-bar").textContent).toMatch(/weight × ln\(factor\)/)
  })

  it("renders the host score breakdown with the selected host contributions", () => {
    render(<HostScoreBreakdownChart model={buildHostScoreProvenance(workbench)} lang="zh" />)
    const chart = screen.getByTestId("host-score-breakdown-chart")
    expect(chart).toHaveAttribute("data-row-count", "10")
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
    expect(routeRose).toHaveAttribute("data-row-count", "8")
    expect(routeRose.querySelectorAll('[data-testid="factor-rose-node"]')).toHaveLength(8)
    expect(routeRose.querySelector('[data-testid="factor-rose-polygon"]')).toBeInTheDocument()
    expect(routeRose.textContent).toContain(routeModel.finalValue.toFixed(3))

    rerender(<HgcpsFactorRose model={buildRouteHgcpsScoreProvenance(alteredWorkbench)} lang="zh" />)
    expect(screen.getByTestId("hgcps-factor-rose").textContent).not.toContain(routeModel.finalValue.toFixed(3))

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

  it("keeps guest dumbbell points inside a narrow fluid viewBox and moves them when guest data changes", () => {
    const models = workbench.guestSelection.rankedGuestMetals.slice(0, 3).map(guest => buildGuestScoreProvenance(workbench, { guest }))
    const alteredWorkbench = buildOrganicAcidHostGuestWorkbench({
      pathwaySteps,
      pathwayDescriptorMap,
      hostMofCandidates,
      guestMetalCandidates: guestMetalCandidates.map((guest, index) => index === 0 ? { ...guest, co2ActivationScore: 0.52 } : guest),
      hostGuestRoutes,
      evidenceRiskRecords,
      validationExperiments,
    })
    const { rerender } = render(<div style={{ width: 340 }}><GuestDumbbellChart models={models} lang="zh" /></div>)
    const baselineCx = Array.from(screen.getAllByTestId("guest-dumbbell-point")).map(node => Number(node.getAttribute("data-cx")))
    expect(baselineCx.length).toBe(21)
    expect(Math.max(...baselineCx)).toBeLessThanOrEqual(292)
    expect(Math.min(...baselineCx)).toBeGreaterThanOrEqual(28)

    const alteredModels = alteredWorkbench.guestSelection.rankedGuestMetals.slice(0, 3).map(guest => buildGuestScoreProvenance(alteredWorkbench, { guest }))
    rerender(<div style={{ width: 340 }}><GuestDumbbellChart models={alteredModels} lang="zh" /></div>)
    const alteredCx = Array.from(screen.getAllByTestId("guest-dumbbell-point")).map(node => Number(node.getAttribute("data-cx")))
    expect(alteredCx).not.toEqual(baselineCx)
  })

  it("opens rose factor detail from per-factor interpretation and evidence", () => {
    const routeModel = buildRouteHgcpsScoreProvenance(workbench)
    const details = buildPerFactorInterpretation(routeModel)
    const evidence = buildFactorEvidence(routeModel, evidenceRiskRecords, { routeId: routeModel.routeId })
    render(<HgcpsFactorRose model={routeModel} factorDetails={details} factorEvidence={evidence} lang="zh" />)

    const target = screen.getAllByTestId("factor-rose-node").find(node => node.getAttribute("data-factor-key") === details[0].factorKey)
    expect(target).toBeTruthy()
    fireEvent.click(target)
    expect(screen.getByTestId("factor-rose-detail-card").textContent).toContain(details[0].interpretationZh)
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
    expect(within(summary).getByTestId("final-paper-comparison-section")).toBeInTheDocument()
    expect(within(summary).getByTestId("final-route-comparison-chart")).toHaveAttribute("data-row-count", String(model.routeComparisonModel.rows.length))
    expect(summary.textContent).toMatch(/论文级对比与解读/)
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
