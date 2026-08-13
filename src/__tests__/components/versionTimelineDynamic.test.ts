// @ts-nocheck
import React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("versionTimelineDynamic", () => {
  it("removes the duplicate version timeline while preserving the project roadmap", () => {
    render(React.createElement(ProjectEvolutionTab, { data }))

    expect(screen.queryByTestId("project-evolution-version-timeline")).not.toBeInTheDocument()
    expect(screen.queryByTestId("project-evolution-release-notes")).not.toBeInTheDocument()

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
