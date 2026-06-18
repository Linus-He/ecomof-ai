// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, screen } from "@testing-library/react"
import { renderFigure, renderCenter } from "./algorithmValidationTestUtils"

describe("Figure navigation and linkage", () => {
  it("highlights the node that the user selects", () => {
    renderFigure()

    const database = screen.getByTestId("figure-node-database")
    const evidence = screen.getByTestId("figure-node-evidence")
    expect(database).toHaveAttribute("data-selected", "true")
    expect(evidence).toHaveAttribute("data-selected", "false")

    fireEvent.click(evidence)
    expect(screen.getByTestId("figure-node-evidence")).toHaveAttribute("data-selected", "true")
    expect(screen.getByTestId("figure-node-database")).toHaveAttribute("data-selected", "false")
  })

  it("routes the feature-selection, ranking, and future-ml nodes to their explorers", () => {
    const onJumpToSection = vi.fn()
    renderFigure({ onJumpToSection })

    fireEvent.click(screen.getByTestId("figure-node-feature_selection"))
    fireEvent.click(screen.getByTestId("figure-jump-feature_selection"))
    expect(onJumpToSection).toHaveBeenLastCalledWith("algval-feature-selection")

    fireEvent.click(screen.getByTestId("figure-node-ranking"))
    fireEvent.click(screen.getByTestId("figure-jump-ranking"))
    expect(onJumpToSection).toHaveBeenLastCalledWith("algval-ranking")

    fireEvent.click(screen.getByTestId("figure-node-future_ml"))
    fireEvent.click(screen.getByTestId("figure-jump-future_ml"))
    expect(onJumpToSection).toHaveBeenLastCalledWith("algval-future-ml")
  })

  it("provides the linked layer sections inside the center as jump targets", () => {
    renderCenter()

    for (const id of [
      "algval-feature-selection",
      "algval-ranking",
      "algval-future-ml",
      "algval-database",
      "algval-descriptor",
      "algval-evidence",
      "algval-validation",
      "algval-experimental",
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
    // Feature Selection Explorer and Top Candidate Review are interactive sub-views.
    expect(screen.getByTestId("algval-feature-selection-detail")).toBeInTheDocument()
    expect(screen.getByTestId("algval-candidate-detail")).toBeInTheDocument()
  })
})
