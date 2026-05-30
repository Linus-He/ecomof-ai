// @ts-nocheck
import { describe, expect, it } from "vitest"
import openMofSeedRows from "../../../public/data/open_mof_seed_candidates.json"
import { validateOpenMofSeedRecords } from "../../data/validateOpenMofSeed"

describe("Open MOF Seed data contract", () => {
  it("validates required provenance and core descriptor status fields", () => {
    const result = validateOpenMofSeedRecords(openMofSeedRows)
    expect(result.valid).toBe(true)
    expect(result.recordCount).toBeGreaterThan(0)
    expect(result.errors).toEqual([])
  })
})
