// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"
import { ScreeningTraceTimeline } from "../../components/screening-trace/ScreeningTraceTimeline"
import { ScreeningFunnelPanel } from "../../components/screening-trace/ScreeningFunnelPanel"
import { CandidateDecisionDashboard } from "../../components/screening-trace/CandidateDecisionDashboard"
import { CandidateCompareMode } from "../../components/screening-trace/CandidateCompareMode"
import { ScreeningDataGapPanel } from "../../components/screening-trace/ScreeningDataGapPanel"
import { ScreeningNextActionPanel } from "../../components/screening-trace/ScreeningNextActionPanel"

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
    expect(bodyText()).toMatch(/原始候选/)
  })

  it("dashboard renders candidate cards with decision trace toggle", () => {
    render(<CandidateDecisionDashboard trace={traceSourceOnly} candidatesById={{ A: candidates[0], B: candidates[1] }} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByText(/Candidate Dashboard/)).toBeTruthy()
    expect(screen.getAllByText(/View Decision Trace/).length).toBeGreaterThan(0)
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

  it("next action panel shows source-confirmed-only guidance", () => {
    render(<ScreeningNextActionPanel trace={traceSourceOnly} lang="en" t={THEME_LIGHT} />)
    expect(bodyText()).toMatch(/not verified metadata candidates yet/i)
    expect(bodyText()).toMatch(/not final recommendation/i)
  })
})
