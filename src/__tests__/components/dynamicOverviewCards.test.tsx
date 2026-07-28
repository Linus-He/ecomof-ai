// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("dynamic overview cards", () => {
  it("renders the project status overview from the dynamic status center", () => {
    render(<ProjectEvolutionTab data={data} />)

    const overview = screen.getByTestId("project-evolution-overview")
    expect(within(overview).getByText("Current Web Version")).toBeInTheDocument()
    expect(within(overview).getByText("Latest Module Data Version")).toBeInTheDocument()
    expect(within(overview).getByText("Database Scale")).toBeInTheDocument()
    expect(within(overview).getByText("Experimental Labels")).toBeInTheDocument()
    expect(within(overview).getByText("Benchmark Ready")).toBeInTheDocument()
    expect(within(overview).getByText("Best Model")).toBeInTheDocument()
    expect(within(overview).getByText("Credibility")).toBeInTheDocument()
    expect(within(overview).getByText("Current Risk")).toBeInTheDocument()
    expect(overview.textContent).toMatch(/Web v1\.0\.5/)
    expect(overview.textContent).toMatch(/V3\.10\.1/)
    expect(overview.textContent).toMatch(/10277\+/)
    expect(overview.textContent).toMatch(/150/)
    expect(overview.textContent).toMatch(/230/)
    expect(overview.textContent).toMatch(/Random Forest/)
    expect(overview.textContent).toMatch(/78\.87 \/ Grade B/)
    expect(overview.textContent).toMatch(/High Overfitting Risk/)
    expect(overview.textContent).not.toMatch(/Validation Pending|V3\.3/)
  })
})
