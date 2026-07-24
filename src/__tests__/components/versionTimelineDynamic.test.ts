// @ts-nocheck
import React from "react"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("versionTimelineDynamic", () => {
  it("uses module history and unified release records as separate dynamic sources", () => {
    render(React.createElement(ProjectEvolutionTab, { data }))

    const timeline = screen.getByTestId("project-evolution-version-timeline")
    expect(within(timeline).getAllByText("V3.6").length).toBeGreaterThan(0)
    expect(within(timeline).getAllByText(/Experimental Label Expansion & Model Robustness/).length).toBeGreaterThan(0)

    const projectUpdates = screen.getByTestId("project-evolution-release-notes")
    expect(projectUpdates.textContent).toMatch(/Project Updates/)
    expect(projectUpdates.textContent).toMatch(/Module updates for App v1\.0\.3 come from the unified release record/)
    expect(projectUpdates.textContent).toMatch(/UI & Experience/)
    expect(projectUpdates.textContent).toMatch(/EcoScreen/)
    expect(projectUpdates.textContent).toMatch(/Methods & Evidence/)
    expect(projectUpdates.textContent).toMatch(/Project Evolution/)

    const roadmap = screen.getByTestId("project-evolution-roadmap")
    expect(roadmap.textContent).toMatch(/V3\.10\.1/)
    expect(roadmap.textContent).toMatch(/V3\.9\.8/)
    expect(roadmap.textContent).toMatch(/V3\.9\.7/)
    expect(roadmap.textContent).toMatch(/V3\.9\.6/)
    expect(roadmap.textContent).toMatch(/69 IAST selectivity/)
    expect(roadmap.textContent).toMatch(/MOF Identity/)
    expect(roadmap.textContent).toMatch(/Real Data Binding/)
    expect(roadmap.textContent).toMatch(/Scoring Audit/)
    expect(roadmap.textContent).toMatch(/linker descriptor table/)
  })
})
