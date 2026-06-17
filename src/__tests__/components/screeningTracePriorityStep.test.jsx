// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { buildScreeningTrace } from "../../utils/screeningTrace/buildScreeningTrace"
import { ScreeningTraceSection } from "../../components/screening-trace/ScreeningTraceSection"

const model = {
  performancePriorityMode: "performance_first",
  candidates: [
    { id: "A", name: "A", G: 1, rank: 1, score: 88, descriptorCompleteness: 0.9, surfaceArea: 3000, scoreInputs: { surfaceArea: { normalized: 1 } }, priorityImpact: { modeLabel: "Performance First", modeLabelZh: "性能优先", delta: 0.1 } },
  ],
  weights: [{ key: "surfaceArea", label: "Surface area", zhLabel: "比表面积", weight: 1 }],
}

describe("screeningTracePriorityStep", () => {
  it("inserts Performance Priority Applied after normalization", () => {
    const trace = buildScreeningTrace({ model, performancePriorityMode: "performance_first" })
    const ids = trace.steps.map(step => step.stepId)

    expect(ids.indexOf("performance_priority_applied")).toBeGreaterThan(ids.indexOf("normalization"))
    expect(ids.indexOf("performance_priority_applied")).toBeLessThan(ids.indexOf("critic_weighting"))
    expect(trace.steps.find(step => step.stepId === "performance_priority_applied")).toEqual(expect.objectContaining({
      priorityMode: "performance_first",
      affectedDescriptors: expect.arrayContaining(["surfaceArea"]),
    }))
  })

  it("renders the current priority in the dashboard shell", () => {
    render(<ScreeningTraceSection model={model} verification={{ verifiedMetadataCount: 0 }} performancePriorityMode="performance_first" lang="zh" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("screening-trace-section")).toHaveAttribute("data-shell-ready", "true")
    expect(document.body.textContent).toMatch(/当前筛选优先级/)
    expect(document.body.textContent).toMatch(/性能优先/)
  })
})
