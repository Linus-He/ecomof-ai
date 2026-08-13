import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Project Evolution release context", () => {
  it("keeps the current release summary without duplicating the changelog", () => {
    render(<ProjectEvolutionTab data={data} />)
    const update = screen.getByTestId("project-evolution-current-update")
    expect(update.textContent).toMatch(/Current update/)
    expect(update.textContent).toMatch(/v1\.0\.14/)
    expect(screen.queryByTestId("project-evolution-app-release")).not.toBeInTheDocument()
  })

  it("keeps pre-1.0 module history as project evidence", () => {
    render(<ProjectEvolutionTab data={data} />)
    const history = screen.getByTestId("project-evolution-pre-v1-history")
    expect(history.textContent).toMatch(/38 original versions/)
    expect(history.textContent).toMatch(/2026-/)
    expect(history.textContent).toMatch(/V3\.10\.1/)
  })
})
