import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import releaseLog from "../../../public/data/app_release_log.json"
import { ReleaseNotesPage } from "../../components/pages/ReleaseNotesPage"

describe("independent changelog", () => {
  it("renders complete releases from the unified app release record", () => {
    render(<ReleaseNotesPage />)

    const updates = screen.getByTestId("release-notes-page")
    const currentRelease = releaseLog.releases[0]

    expect(updates).toBeInTheDocument()
    expect(updates.textContent).toMatch(/Changelog/)
    expect(updates.textContent).toContain(releaseLog.currentAppVersion)
    expect(updates.textContent).toContain(currentRelease.headline.en.replace(/^v\d+(?:\.\d+){2}:\s*/, ""))
  })

  it("preserves every module and change instead of truncating the log", () => {
    render(<ReleaseNotesPage />)

    const updates = screen.getByTestId("release-notes-page")
    const currentRelease = releaseLog.releases[0]
    for (const moduleKey of Object.keys(currentRelease.modules)) {
      expect(updates.textContent).toContain(releaseLog.moduleCatalog[moduleKey].label.en)
      for (const change of currentRelease.modules[moduleKey].changes) expect(updates.textContent).toContain(change.en)
    }
  })
})
