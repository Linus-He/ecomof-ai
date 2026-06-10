// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { ScreeningRunConsole } from "../../components/database-index/ScreeningRunConsole"
import { ScreeningRunStepper } from "../../components/database-index/ScreeningRunStepper"
import { ScreeningResultPanel } from "../../components/database-index/ScreeningResultPanel"
import { ScreeningNextActionPanel } from "../../components/database-index/ScreeningNextActionPanel"
import { buildScreeningRunSteps, buildScreeningRunResult, buildScreeningNextActions } from "../../utils/databaseIndex/screeningRunState"

const summary = {
  recordsScanned: 120,
  nearVerifiedCount: 12,
  metadata: { verified: 0, partial: 12, previewOnly: 108, blocked: 0 },
  descriptorCompleteness: { complete: 0, partial: 120, missingCritical: 0 },
  redundancyGate: { redundantPairCount: 2 },
  mechanismProxyAvailability: { co2ActivationProxy: 120, evidenceConfidenceProxy: 120 },
  mechanismEvidenceSummary: { literature_supported: 0, descriptor_inferred: 360, weak_proxy: 480, insufficient_evidence: 0 },
  sensitivityAudit: { top5Stability: 0.886, top10Stability: 0.908, unstableCandidateCount: 3, auditRuns: 100 },
  featureAblationAudit: [
    { id: "all_descriptors", topNOverlapWithBaseline: 1 },
    { id: "without_redundant_descriptors", topNOverlapWithBaseline: 0.7 },
    { id: "without_mechanism_proxies", topNOverlapWithBaseline: 0.9 },
    { id: "metadata_gate_only", topNOverlapWithBaseline: 0.2 },
  ],
  candidateValidationRoadmapSummary: { candidateCount: 12, priorityCounts: { high: 12, medium: 0, low: 0 } },
  manualCurationSummary: { queueSize: 18 },
  metadataTransitionSummary: { nearVerifiedBeforeCuration: 12, verifiedAfterCuration: 0, sourceConfirmed: 0, citationReady: 0, licenseConfirmed: 0 },
}

function bodyText() {
  return document.body.textContent || ""
}

describe("ScreeningRunConsole", () => {
  it("renders the run button in both languages and the preview-only boundary", () => {
    const { rerender } = render(<ScreeningRunConsole summary={summary} stepDelayMs={0} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("开始筛选审计")).toBeTruthy()
    expect(bodyText()).toMatch(/不会执行全量数据库筛选/)
    rerender(<ScreeningRunConsole summary={summary} stepDelayMs={0} lang="en" t={THEME_LIGHT} />)
    expect(screen.getByText("Run screening audit")).toBeTruthy()
  })

  it("runs synchronously (stepDelayMs=0) and shows the result panel with warning state", () => {
    render(<ScreeningRunConsole summary={summary} stepDelayMs={0} lang="en" t={THEME_LIGHT} />)
    fireEvent.click(screen.getByTestId("screening-run-button"))
    expect(screen.getByTestId("screening-result-panel")).toBeTruthy()
    expect(bodyText()).toMatch(/not a final recommendation/i)
    // verified=0 empty-state explanation appears.
    expect(screen.getByText("No verified candidates yet")).toBeTruthy()
    // Button label moves to the warning state.
    expect(screen.getByText("View evidence to add")).toBeTruthy()
  })

  it("shows blocked state when recordsScanned is 0", () => {
    render(<ScreeningRunConsole summary={{ recordsScanned: 0, metadata: {} }} stepDelayMs={0} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("需要先选择数据范围")).toBeTruthy()
  })
})

describe("Screening sub-panels", () => {
  it("stepper renders all steps and the result panel shows counts", () => {
    const steps = buildScreeningRunSteps(summary)
    render(<ScreeningRunStepper steps={steps} activeIndex={2} lang="en" t={THEME_LIGHT} />)
    expect(screen.getByTestId("screening-run-stepper")).toBeTruthy()
    expect(screen.getByText(/Metadata gate/)).toBeTruthy()
  })

  it("result panel shows verified=0 / near_verified=12 and Top10 stability", () => {
    render(<ScreeningResultPanel result={buildScreeningRunResult(summary)} lang="en" t={THEME_LIGHT} />)
    expect(screen.getByText("本次筛选审计结果".length ? "Screening Audit Result" : "")).toBeTruthy()
    expect(bodyText()).toMatch(/0\.908/)
    expect(bodyText()).not.toMatch(/最终推荐 ✓|final recommendation: yes/i)
  })

  it("next action panel lists curation actions and no dangerous protocol", () => {
    render(<ScreeningNextActionPanel nextActions={buildScreeningNextActions(summary)} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("下一步行动")).toBeTruthy()
    expect(bodyText()).not.toMatch(/温度|压力|配方/)
  })
})
