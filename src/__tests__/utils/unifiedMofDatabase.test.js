import { describe, expect, it } from "vitest"
import gasRecords from "../../../public/data/gas_adsorption_records_v2.json"
import structures from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import registry from "../../../public/data/mof_identity_registry.json"
import { buildUnifiedMofRows } from "../../utils/unifiedMofDatabase"

describe("unified MOF database builder", () => {
  it("joins structure rows and gas-only rows through the identity layer", () => {
    const rows = buildUnifiedMofRows({ structures: structures.slice(0, 20), gasRecords: gasRecords.slice(0, 20), registry })
    expect(rows.length).toBeGreaterThanOrEqual(20)
    expect(rows.some(row => row.completeness.structure)).toBe(true)
    expect(rows.some(row => row.completeness.gas)).toBe(true)
    expect(rows[0]).toHaveProperty("canonicalId")
  })
})
