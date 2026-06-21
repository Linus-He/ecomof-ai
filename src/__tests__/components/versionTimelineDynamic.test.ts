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

    const releaseNotes = screen.getByTestId("project-evolution-release-notes")
    expect(releaseNotes.textContent).toMatch(/V3\.6/)
    expect(releaseNotes.textContent).toMatch(/Experimental Label Expansion/)

    const roadmap = screen.getByTestId("project-evolution-roadmap")
    expect(roadmap.textContent).toMatch(/V3\.4/)
    expect(roadmap.textContent).toMatch(/V3\.5/)
    expect(roadmap.textContent).toMatch(/V3\.6/)
    expect(roadmap.textContent).toMatch(/research-grade benchmark/)
  })
})
