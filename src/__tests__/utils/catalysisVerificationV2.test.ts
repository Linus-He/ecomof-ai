// @ts-nocheck
import { describe, expect, it } from "vitest"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import tasks from "../../../public/data/catalysis_v2/catalysis_verification_tasks_v2.json"
import { buildCatalysisVerificationView, catalysisTrainingGate, filterCatalysisVerificationTasks } from "../../utils/catalysisVerificationV2"

describe("catalysis verification v2 view model", () => {
  it("joins documents, catalyst states, claims, evidence, decisions, and tasks", () => {
    const view = buildCatalysisVerificationView(database, tasks)
    expect(view.recordRows).toHaveLength(10)
    expect(view.recordRows[0].document.doi).toBeTruthy()
    expect(view.recordRows[0].claims[0].evidence.length).toBeGreaterThan(0)
    expect(view.recordRows[0].decision.browseEligible).toBe(true)
    expect(view.recordRows[0].decision.compareEligible).toBe(false)
    expect(view.recordRows[0].tasks.length).toBeGreaterThan(0)
  })

  it("filters the generated verification queue", () => {
    const p0 = filterCatalysisVerificationTasks(tasks.tasks, { priority: "P0", status: "open" })
    const identity = filterCatalysisVerificationTasks(tasks.tasks, { type: "identity-resolution", status: "open" })
    expect(p0).toHaveLength(database.summary.p0TaskCount)
    expect(identity).toHaveLength(10)
  })

  it("blocks algorithm training when no record clears all gates", () => {
    expect(catalysisTrainingGate(database)).toMatchObject({ eligible: false, eligibleCount: 0 })
  })
})
