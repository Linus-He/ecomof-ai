// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen, within } from "@testing-library/react"
import { renderFigure, bodyText, FIGURE_NODE_IDS } from "./algorithmValidationTestUtils"

describe("InteractiveScientificFigure", () => {
  it("renders the figure as the single core entry with all eight pipeline nodes", () => {
    renderFigure()

    expect(screen.getByTestId("interactive-scientific-figure")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Interactive Scientific Figure/)
    for (const id of FIGURE_NODE_IDS) {
      expect(screen.getByTestId(`figure-node-${id}`)).toBeInTheDocument()
    }
  })

  it("embeds all five real SVG mini charts inside the figure", () => {
    renderFigure()

    const gallery = screen.getByTestId("figure-mini-chart-gallery")
    for (const chart of ["descriptorImportance", "featureCoverage", "modelReadiness", "candidateStability", "topCandidateRanking"]) {
      expect(within(gallery).getByTestId(`mini-chart-${chart}`)).toBeInTheDocument()
    }
    // real SVG, not screenshots
    expect(gallery.querySelectorAll("svg").length).toBeGreaterThanOrEqual(5)
  })

  it("never fabricates Future Machine Learning Accuracy or ROC-AUC", () => {
    renderFigure()

    expect(bodyText()).toMatch(/Machine Learning Pending/)
    expect(bodyText()).toMatch(/No fake Accuracy/)
    expect(bodyText()).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
    expect(bodyText()).not.toMatch(/ROC-?AUC:\s*(0\.\d+|[1-9]\d?%?)/i)
  })

  it("supports status filtering of figure nodes", () => {
    renderFigure()

    for (const filter of ["all", "passed", "warning", "blocked"]) {
      expect(screen.getByTestId(`figure-filter-${filter}`)).toBeInTheDocument()
    }
  })
})
