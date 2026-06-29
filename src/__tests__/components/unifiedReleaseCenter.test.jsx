import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Unified Release Center", () => {
  it("shows a single App version with a version selector and total update", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    // newest release leads; the selector still offers v1.0.0
    expect(within(center).getAllByText(/App v1\.0\.1/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/App v1\.0\.0/).length).toBeGreaterThan(0)
    expect(center.textContent).toMatch(/Unified Release Center/)
    expect(center.textContent).not.toMatch(/App v1\.0\.2\s*·\s*2026-06-29/)
    expect(within(center).getByLabelText("Select App version")).toBeInTheDocument()
  })

  it("exposes module sub-tabs and drills into a module's changes (v1.0.0 gasSep)", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    // switch to the v1.0.0 release which changed the gasSep module
    fireEvent.change(within(center).getByLabelText("Select App version"), { target: { value: "v1.0.0" } })
    expect(within(center).getByTestId("app-release-module-tab-gasSep")).toBeInTheDocument()

    fireEvent.click(within(center).getByTestId("app-release-module-tab-gasSep"))
    const panel = within(center).getByTestId("app-release-module-panel-gasSep")
    expect(panel.textContent).toMatch(/IAST/)
    expect(panel.querySelectorAll("li").length).toBeGreaterThan(0)
  })

  it("folds pre-1.0 module history into a collapsed section", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    expect(center.textContent).toMatch(/History \(pre-1\.0/)
    expect(center.textContent).toMatch(/V3\.10\.1/)
  })
})
