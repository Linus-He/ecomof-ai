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
  GuestScoreBreakdownChart,
  HostScoreBreakdownChart,
  RouteFactorComparisonChart,
  ScoreSourceTable,
} from "../../components/catalysis/scoreProvenance"

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
