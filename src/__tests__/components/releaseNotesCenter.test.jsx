import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("ReleaseNotesCenter", () => {
  it("renders release notes by version, module, and category", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-release-notes")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Release Notes/)
    expect(bodyText()).toMatch(/Project Evolution Center/)
    expect(bodyText()).toMatch(/Experimental Label Acquisition/)
    expect(bodyText()).toMatch(/Model Credibility/)
    expect(bodyText()).toMatch(/Experimental Label Expansion/)
    expect(bodyText()).toMatch(/Robustness/)
    expect(bodyText()).toMatch(/Random Forest/)
  })

  it("filters release notes by category", () => {
    render(<ProjectEvolutionTab data={data} />)

    const selects = screen.getAllByRole("combobox")
    const categoryOptions = [...selects[1].querySelectorAll("option")].map(option => option.textContent)
    expect(categoryOptions).toEqual(expect.arrayContaining(["Data", "Algorithm", "Validation", "UI", "Methods", "Infrastructure", "Testing"]))

    fireEvent.change(selects[1], { target: { value: "Validation" } })
    expect(bodyText()).toMatch(/Experimental Label Acquisition/)
    expect(bodyText()).toMatch(/Model Credibility/)
    expect(bodyText()).toMatch(/Experimental Label Expansion/)
  })
})
