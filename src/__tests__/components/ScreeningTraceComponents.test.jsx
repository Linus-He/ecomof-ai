// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_DARK, THEME_LIGHT } from "../../constants/theme"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"
import { ScreeningTraceTimeline } from "../../components/screening-trace/ScreeningTraceTimeline"
import { ScreeningFunnelPanel } from "../../components/screening-trace/ScreeningFunnelPanel"
import { CandidateDecisionDashboard } from "../../components/screening-trace/CandidateDecisionDashboard"
import { CandidateCompareMode } from "../../components/screening-trace/CandidateCompareMode"
import { CandidateReadinessMatrix } from "../../components/screening-trace/CandidateReadinessMatrix"
import { ScreeningDataGapPanel } from "../../components/screening-trace/ScreeningDataGapPanel"
import { ScreeningNextActionPanel } from "../../components/screening-trace/ScreeningNextActionPanel"
import { ScreeningTraceSection } from "../../components/screening-trace/ScreeningTraceSection"

const candidates = [
  { id: "A", name: "A", G: 1, rank: 1, D_expected: 0.82, evidenceLevel: "B", descriptorCompleteness: { ratio: 0.9 }, scoreInputs: { d_stab: { normalized: 0.9 } }, surfaceArea: 1200, poreSizeA: 8 },
  { id: "B", name: "B", G: 1, rank: 2, D_expected: 0.55, evidenceLevel: "C", descriptorCompleteness: { ratio: 0.6 }, scoreInputs: { d_barrier: { missing: true } }, dataGaps: ["Need DFT barrier"], surfaceArea: 900, poreSizeA: 6 },
]
const model = { candidates, weights: [{ key: "d_stab", label: "Stability", weight: 0.5 }, { key: "d_barrier", label: "Barrier", weight: 0.5 }] }
const traceSourceOnly = buildScreeningTrace({ model, verification: { sourceConfirmedCount: 4, verifiedMetadataCount: 0 } })

function bodyText() { return document.body.textContent || "" }

describe("Screening trace components", () => {
  it("timeline shows database preview, not verified screening, when verified=0", () => {
    render(<ScreeningTraceTimeline trace={traceSourceOnly} lang="en" t={THEME_LIGHT} />)
    expect(screen.getByText(/Screening Trace/)).toBeTruthy()
    expect(bodyText()).toMatch(/database preview · not final recommendation/i)
    // It may say "not verified screening", but must never positively claim verified screening.
    expect(bodyText()).not.toMatch(/is verified screening|verified screening complete/i)
  })

  it("funnel renders stages", () => {
    render(<ScreeningFunnelPanel trace={traceSourceOnly} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("筛选漏斗")).toBeTruthy()
    expect(document.querySelector("#screening-funnel-panel")).toBeTruthy()
    expect(bodyText()).toMatch(/原始候选/)
  })

  it("dashboard renders candidate cards with decision trace toggle", () => {
    render(<CandidateDecisionDashboard trace={traceSourceOnly} candidatesById={{ A: candidates[0], B: candidates[1] }} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByText(/Candidate Dashboard/)).toBeTruthy()
    expect(document.querySelector("#candidate-decision-dashboard")).toBeTruthy()
    expect(screen.getAllByText(/View Decision Trace/).length).toBeGreaterThan(0)
  })

  it("ScreeningTraceSection renders shell markers before candidate data is available", () => {
    render(<ScreeningTraceSection model={{ candidates: [], weights: [] }} verification={{ verifiedMetadataCount: 0 }} scenarioLabel="general" lang="en" t={THEME_LIGHT} isMobile />)
    expect(screen.getByTestId("screening-trace-section")).toHaveAttribute("data-shell-ready", "true")
    expect(screen.getByTestId("screening-trace-section")).toHaveAttribute("data-data-ready", "false")
    expect(document.querySelector("#screening-trace-timeline")).toBeTruthy()
    expect(document.querySelector("#screening-funnel-panel")).toBeTruthy()
    expect(document.querySelector("#candidate-decision-dashboard")).toBeTruthy()
  })

  it("keeps mobile-dark trace shell markers attached before chart timing", () => {
    render(<ScreeningTraceSection model={{ candidates: [], weights: [] }} verification={{ verifiedMetadataCount: 0 }} scenarioLabel="general" lang="en" t={THEME_DARK} isMobile />)
    expect(screen.getByTestId("screening-trace-section")).toHaveAttribute("data-shell-ready", "true")
    expect(document.querySelector("#screening-trace-timeline")).toBeTruthy()
    expect(document.querySelector("#screening-funnel-panel")).toBeTruthy()
    expect(document.querySelector("#candidate-decision-dashboard")).toBeTruthy()
    expect(bodyText()).toMatch(/Candidate dashboard shell is ready/i)
  })

  it("dashboard defaults to top 10 candidate cards", () => {
    const manyCandidates = Array.from({ length: 14 }, (_, index) => ({
      id: `C${index + 1}`,
      name: `C${index + 1}`,
      G: 1,
      rank: index + 1,
      D_expected: 0.9 - index * 0.01,
      evidenceLevel: "C",
      descriptorCompleteness: { ratio: 0.8 },
      scoreInputs: { d_stab: { normalized: 0.8 }, d_barrier: { normalized: 0.7 }, d_select: { normalized: 0.6 } },
      fieldSources: { surfaceArea: { value: 1000, status: "confirmed" } },
    }))
    const trace = buildScreeningTrace({ model: { candidates: manyCandidates, weights: [{ key: "d_stab", weight: 1 }] }, verification: { verifiedMetadataCount: 0 } })
    render(<CandidateDecisionDashboard trace={trace} candidatesById={Object.fromEntries(manyCandidates.map(c => [c.id, c]))} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getAllByText(/View Decision Trace/)).toHaveLength(10)
    expect(bodyText()).toMatch(/showing top 10\/14/i)
  })

  it("compare mode compares 2-3 candidates", () => {
    render(<CandidateCompareMode candidates={candidates} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByText(/Candidate Compare/)).toBeTruthy()
    expect(bodyText()).toMatch(/outranks/)
  })

  it("data gap panel shows blockers", () => {
    render(<ScreeningDataGapPanel trace={traceSourceOnly} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByText(/Data Gaps/)).toBeTruthy()
    expect(bodyText()).toMatch(/Need DFT barrier|d_barrier/)
  })

  it("readiness matrix excludes ambiguity-quarantined candidates from ranking recommendation", () => {
    const rows = [
      { id: "SAFE", name: "SAFE", G: 1, D_expected: 0.8, evidenceLevel: "B", descriptorCompleteness: { ratio: 0.9 } },
      { id: "AMB", name: "AMB", G: 1, D_expected: 0.95, evidenceLevel: "B", descriptorCompleteness: { ratio: 0.9 }, ambiguityWarnings: ["ambiguous source"], quarantined: true },
    ]
    render(<CandidateReadinessMatrix candidates={rows} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(bodyText()).toMatch(/SAFE/)
    expect(bodyText()).not.toMatch(/AMB/)
  })

  it("next action panel shows source-confirmed-only guidance", () => {
    render(<ScreeningNextActionPanel trace={traceSourceOnly} lang="en" t={THEME_LIGHT} />)
    expect(bodyText()).toMatch(/not verified metadata candidates yet/i)
    expect(bodyText()).toMatch(/not final recommendation/i)
  })
})
