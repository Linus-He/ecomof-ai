import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Version Timeline", () => {
  it("shows every required version from the authoritative data source", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-version-timeline")).toBeInTheDocument()
    for (const version of ["V1.0", "V1.5", "V2.0-K", "V2.0-L", "V2.0-M", "V2.1", "V2.2", "V2.3", "V2.4"]) {
      expect(bodyText()).toMatch(new RegExp(version.replace(".", "\\.")))
    }
    expect(bodyText()).toMatch(/Breaking Changes/)
    expect(bodyText()).toMatch(/Next Version Goal/)
  })

  it("supports timeline search", () => {
    render(<ProjectEvolutionTab data={data} />)

    fireEvent.change(screen.getByPlaceholderText("Search versions"), { target: { value: "Data Quality" } })
    expect(bodyText()).toMatch(/Data Quality Audit, Verified Metadata Breakthrough, Scalable Database Preview/)
    expect(bodyText()).not.toMatch(/Initial transparent MOF screening prototype/)
  })
})
