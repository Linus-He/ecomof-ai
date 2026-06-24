// @ts-nocheck
import React from "react"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("versionTimelineDynamic", () => {
  it("uses version_evolution_records.json as the dynamic source for timeline, release notes, and roadmap", () => {
    render(React.createElement(ProjectEvolutionTab, { data }))

    const timeline = screen.getByTestId("project-evolution-version-timeline")
    expect(within(timeline).getAllByText("V3.6").length).toBeGreaterThan(0)
    expect(within(timeline).getAllByText(/Experimental Label Expansion & Model Robustness/).length).toBeGreaterThan(0)

    const projectUpdates = screen.getByTestId("project-evolution-release-notes")
    expect(projectUpdates.textContent).toMatch(/Project Updates/)
    expect(projectUpdates.textContent).toMatch(/Descriptor ablation/)
    expect(projectUpdates.textContent).toMatch(/Evolution report and audit/)

    const roadmap = screen.getByTestId("project-evolution-roadmap")
    expect(roadmap.textContent).toMatch(/V3\.9\.8/)
    expect(roadmap.textContent).toMatch(/V3\.9\.7/)
    expect(roadmap.textContent).toMatch(/V3\.9\.6/)
    expect(roadmap.textContent).toMatch(/Real Data Binding/)
    expect(roadmap.textContent).toMatch(/Scoring Audit/)
    expect(roadmap.textContent).toMatch(/linker descriptor table/)
    expect(roadmap.textContent).toMatch(/Verify medium\/low-confidence prices/)
  })
})
