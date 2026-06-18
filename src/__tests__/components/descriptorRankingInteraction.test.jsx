// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, screen, within } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"

describe("descriptorRankingInteraction", () => {
  it("opens descriptor field provenance details on click and supports mode/category controls", () => {
    renderBenchmarkLab()

    fireEvent.change(screen.getByLabelText(/filter by category/i), { target: { value: "Electronic" } })
    expect(screen.getByTestId("descriptor-importance-ranking")).toHaveTextContent(/bandGap/)

    fireEvent.click(screen.getByRole("button", { name: /Evidence adjusted importance/i }))
    const ranking = screen.getByTestId("descriptor-importance-ranking")
    const bandGapButton = within(ranking).getAllByRole("button", { name: /bandGap/i })
      .find(button => button.textContent?.includes("bandGap"))
    fireEvent.click(bandGapButton)

    const panel = screen.getByTestId("descriptor-provenance-panel")
    expect(panel).toHaveTextContent(/bandGap/)
    expect(panel).toHaveTextContent(/Field provenance/)
    expect(panel).toHaveTextContent(/Source coverage/)
    expect(panel).toHaveTextContent(/Impact reason/)
    expect(window.localStorage.getItem("ecomof.v27.selectedDescriptor")).toBe("bandGap")
  })
})
