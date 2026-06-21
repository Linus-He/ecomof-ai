// @ts-nocheck
import { describe, expect, it } from "vitest"
import { buildExportFileName } from "../../utils/export/buildExportFileName"
import { sanitizeExportRows, sanitizeCell } from "../../utils/export/sanitizeExportRows"
import { buildCsv } from "../../utils/export/exportCsv"
import { buildJson, buildExportEnvelope } from "../../utils/export/exportJson"

describe("V3.9 export utils", () => {
  it("builds version- and date-stamped file names", () => {
    expect(buildExportFileName({ base: "MOF Library", version: "V3.9", date: "2026-06-21", ext: "csv" })).toBe("ecomof-mof-library-V3.9-20260621.csv")
    expect(buildExportFileName({ base: "x", version: "V3.9", date: "2026-06-21", ext: ".json" })).toMatch(/\.json$/)
  })

  it("sanitizes cells so exports never contain undefined/null/NaN/[object Object]", () => {
    expect(sanitizeCell(undefined)).toBe("")
    expect(sanitizeCell(null)).toBe("")
    expect(sanitizeCell(NaN)).toBe("")
    expect(sanitizeCell({ a: 1 })).toBe('{"a":1}')
    expect(sanitizeCell({})).toBe("")
    expect(sanitizeCell("ok")).toBe("ok")
  })

  it("CSV is clean and quotes commas; includes provenance meta line", () => {
    const csv = buildCsv([{ name: "A, B", count: 3, missing: undefined }], { includeMeta: true, meta: { version: "V3.9", dataMode: "curated" } })
    expect(csv).toMatch(/# version=V3.9 \| dataMode=curated/)
    expect(csv).toMatch(/"A, B"/)
    expect(csv).not.toMatch(/undefined/)
    expect(csv).not.toMatch(/NaN/)
  })

  it("JSON envelope carries version/generatedAt/dataVersion/dataMode/provenance and strips undefined/NaN", () => {
    const env = buildExportEnvelope({ version: "V3.9", dataMode: "mixed", payload: { a: undefined, b: NaN, c: 2 } })
    expect(env.version).toBe("V3.9")
    expect(env.dataMode).toBe("mixed")
    expect(env.generatedAt).toBeTruthy()
    expect(env.dataVersion).toBe("V3.9")
    expect(env.payload).not.toHaveProperty("a")
    expect(env.payload.b).toBeNull()
    expect(env.payload.c).toBe(2)
    const str = buildJson({ x: 1 }, { version: "V3.9", dataMode: "demo" })
    expect(str).toMatch(/"dataMode": "demo"/)
    expect(str).not.toMatch(/undefined/)
  })

  it("normalizes an unknown dataMode to mixed", () => {
    expect(buildExportEnvelope({ dataMode: "bogus" }).dataMode).toBe("mixed")
  })
})
