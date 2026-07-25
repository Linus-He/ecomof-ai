import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import releaseLog from "../../../public/data/app_release_log.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

describe("Project Updates", () => {
  it("renders project-update streams from the current app release record", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    const currentRelease = releaseLog.releases[0]
    const moduleKeys = Object.keys(currentRelease.modules)

    expect(updates).toBeInTheDocument()
    expect(updates.textContent).toMatch(/Project Updates/)
    expect(updates.textContent).toContain(`App ${releaseLog.currentAppVersion}`)
    for (const number of moduleKeys.map((_, index) => String(index + 1).padStart(2, "0"))) {
      expect(within(updates).getByText(number)).toBeInTheDocument()
    }
  })

  it("labels each dynamic stream with its work area", () => {
    render(<ProjectEvolutionTab data={data} />)

    const updates = screen.getByTestId("project-evolution-release-notes")
    const currentRelease = releaseLog.releases[0]
    for (const moduleKey of Object.keys(currentRelease.modules)) {
      expect(updates.textContent).toContain(releaseLog.moduleCatalog[moduleKey].label.en)
    }
    expect(updates.textContent).toContain(`Module updates for App ${releaseLog.currentAppVersion} come from the unified release record`)
  })
})
