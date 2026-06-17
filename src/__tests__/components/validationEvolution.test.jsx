import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Validation Evolution", () => {
  it("keeps validation stages separated from verified metadata claims", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-validation")).toBeInTheDocument()
    for (const stage of [
      "Source Confirmed",
      "Citation Ready",
      "Verified Metadata",
      "External Validation",
      "Experimental Validation",
    ]) {
      expect(bodyText()).toMatch(new RegExp(stage))
    }
    expect(bodyText()).toMatch(/Current: 1000/)
    expect(bodyText()).toMatch(/Current: 30/)
    expect(bodyText()).toMatch(/No external labels yet/)
    expect(bodyText()).toMatch(/No validated experimental target labels yet/)
  })
})
