import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Database Evolution", () => {
  it("renders database growth, verified metadata growth, and field provenance coverage", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-database")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Database Growth/)
    expect(bodyText()).toMatch(/Verified Metadata Growth/)
    expect(bodyText()).toMatch(/Field Provenance Coverage/)
    expect(bodyText()).toMatch(/50 Candidates/)
    expect(bodyText()).toMatch(/250 Candidates/)
    expect(bodyText()).toMatch(/1000 Candidates/)
    expect(bodyText()).toMatch(/30 verified metadata/)
    expect(bodyText()).toMatch(/pending/)
  })
})
