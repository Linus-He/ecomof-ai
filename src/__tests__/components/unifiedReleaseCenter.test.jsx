import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Unified Release Center", () => {
  it("shows a single Web version with a version selector and total update", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    // newest release leads; the selector still offers v1.0.0
    expect(within(center).getAllByText(/Web v1\.0\.9/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.8/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.7/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.6/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.3/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.2/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.1/).length).toBeGreaterThan(0)
    expect(within(center).getAllByText(/Web v1\.0\.0/).length).toBeGreaterThan(0)
    expect(center.textContent).toMatch(/Unified Release Center/)
    expect(center.textContent).toMatch(/Current Web Release/)
    expect(within(center).getByLabelText("Select Web version")).toBeInTheDocument()
  })

  it("exposes module sub-tabs and drills into a module's changes (v1.0.0 gasSep)", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    // switch to the v1.0.0 release which changed the gasSep module
    fireEvent.change(within(center).getByLabelText("Select Web version"), { target: { value: "v1.0.0" } })
    expect(within(center).getByTestId("app-release-module-tab-gasSep")).toBeInTheDocument()

    fireEvent.click(within(center).getByTestId("app-release-module-tab-gasSep"))
    const panel = within(center).getByTestId("app-release-module-panel-gasSep")
    expect(panel.textContent).toMatch(/IAST/)
    expect(panel.querySelectorAll("li").length).toBeGreaterThan(0)
  })

  it("shows pre-1.0 module history expanded with counts, dates, and original versions", () => {
    render(<ProjectEvolutionTab data={data} />)
    const center = screen.getByTestId("project-evolution-app-release")
    const history = within(center).getByTestId("project-evolution-pre-v1-history")
    expect(history).toHaveAttribute("open")
    expect(center.textContent).toMatch(/History \(pre-1\.0/)
    expect(history.textContent).toMatch(/38 original versions/)
    expect(history.textContent).toMatch(/2026-/)
    expect(center.textContent).toMatch(/V3\.10\.1/)
  })

  it("summarizes the current Web release without exposing a developer document", () => {
    render(<ProjectEvolutionTab data={data} />)
    const update = screen.getByTestId("project-evolution-current-update")
    expect(update.textContent).toMatch(/Current update/)
    expect(update.textContent).toMatch(/v1\.0\.9/)
    expect(update.textContent).not.toMatch(/Developer Log|developer log|Next Release Preview|pending release/)
  })
})
