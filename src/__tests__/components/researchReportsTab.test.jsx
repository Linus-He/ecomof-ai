import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TABS } from "../../constants/badges"
import { HASH_TO_TAB } from "../../utils/deepLinks"

describe("ResearchReportsTab", () => {
  it("removes the Research Reports module from first-level runtime surfaces", () => {
    expect(TABS.map(tab => tab.id)).toEqual([
      "home",
      "ecoscreen",
      "gassep",
      "catalysis",
      "library",
      "about",
      "projectEvolution",
    ])
    expect(HASH_TO_TAB["research-reports"]).toBeUndefined()
    expect(fs.existsSync(path.join(process.cwd(), "src/components/tabs/ResearchReportsTab.jsx"))).toBe(false)
  })
})
