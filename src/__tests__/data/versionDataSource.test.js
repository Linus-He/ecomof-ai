import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import data from "../../../public/data/version_evolution_records.json"

const REQUIRED_VERSION_FIELDS = [
  "version",
  "date",
  "commit",
  "summary",
  "scientificImpact",
  "databaseImpact",
  "validationImpact",
  "uiImpact",
  "knownLimitations",
  "breakingChanges",
  "nextVersionGoal",
]

const REQUIRED_RELEASE_CATEGORIES = [
  "Database",
  "Algorithm",
  "Validation",
  "UI",
  "Methods",
  "Infrastructure",
  "Testing",
]

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("version_evolution_records data source", () => {
  it("is the single authoritative source for timeline, release notes, milestones, and roadmap", () => {
    expect(data.authority).toMatch(/Single authoritative Project Evolution data source/)
    expect(data.currentVersion).toBe("V3.1")
    expect(data.versions.length).toBeGreaterThanOrEqual(9)
    expect(data.releaseNotes.length).toBeGreaterThanOrEqual(8)
    expect(data.milestones.length).toBe(data.overview.milestoneCount)
    expect(data.roadmap.map(row => row.version)).toEqual(["V2.4", "V2.5", "V2.6", "V2.7", "V3.0", "V3.1"])
    expect(data.localizationEvolution.map(row => row.version)).toContain("V2.4")
    expect(data.versions.find(row => row.version === "V2.6")).toEqual(expect.objectContaining({
      scientificImpact: "首次形成有机酸候选筛选算法闭环。",
      algorithmImpact: expect.stringMatching(/目标函数/),
      validationImpact: expect.stringMatching(/sanity check/),
      knownLimitations: "算法可解释但未被实验闭环验证。",
    }))

    for (const version of data.versions) {
      for (const field of REQUIRED_VERSION_FIELDS) {
        expect(version, `${version.version} missing ${field}`).toHaveProperty(field)
      }
    }
  })

  it("covers every required release note category", () => {
    const categories = new Set(data.releaseNotes.map(row => row.category))
    for (const category of REQUIRED_RELEASE_CATEGORIES) {
      expect(categories.has(category), `missing ${category}`).toBe(true)
    }
  })

  it("makes Project Evolution overview metrics traceable to source, script, date, and database version", () => {
    for (const [key, source] of Object.entries(data.overview.sources)) {
      expect(source.sourceDatabase, `${key} sourceDatabase`).toBeTruthy()
      expect(source.sourceRecordId, `${key} sourceRecordId`).toBeTruthy()
      expect(source.sourceUrl, `${key} sourceUrl`).toBeTruthy()
      expect(source.retrievedAt, `${key} retrievedAt`).toBeTruthy()
      expect(source.databaseVersion, `${key} databaseVersion`).toBeTruthy()
      expect(source.generatingScript, `${key} generatingScript`).toBeTruthy()
    }
    expect(data.overview.sources.githubStars.value).toBe("pending")
    expect(data.overview.sources.githubStars.notes).toMatch(/not fabricated/i)
  })

  it("keeps Methods & Evidence free of full version-log rendering", () => {
    const methodsSource = readRepoFile("src/components/tabs/MethodsLimitationsTab.tsx")
    expect(methodsSource).not.toMatch(/VersionDocsPanel/)
    expect(methodsSource).not.toMatch(/VERSION_DOCS_DIRECTORY/)
    expect(methodsSource).not.toMatch(/methodology-version-docs/)
    expect(methodsSource).not.toMatch(/Methodology Evolution Timeline/)
    expect(methodsSource).toMatch(/ProjectEvolutionShortcutCard/)
  })
})
