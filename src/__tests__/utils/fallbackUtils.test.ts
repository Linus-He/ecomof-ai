// @ts-nocheck
import { describe, expect, it } from "vitest"
import { safeNumber, safeRound } from "../../utils/fallback/safeNumber"
import { safePercent, safePercentOf, safeRatio } from "../../utils/fallback/safePercent"
import { normalizeMissingValue, isMissing, MISSING_LABELS } from "../../utils/fallback/normalizeMissingValue"
import { formatDataCardValue } from "../../utils/fallback/formatDataCardValue"

const FORBIDDEN = ["undefined", "null", "NaN", "[object Object]"]

describe("V3.9 fallback utils", () => {
  it("safeNumber never returns NaN/undefined", () => {
    expect(safeNumber(undefined)).toBe(0)
    expect(safeNumber(null, 5)).toBe(5)
    expect(safeNumber(NaN)).toBe(0)
    expect(safeNumber("42")).toBe(42)
    expect(safeNumber("abc", -1)).toBe(-1)
    expect(safeRound(3.14159, 2)).toBe(3.14)
  })

  it("safePercent emits clean NN% or a fallback, never NaN%/undefined%", () => {
    expect(safePercent(0.5)).toBe("50%")
    expect(safePercent(null)).toBe("Data coverage unavailable")
    expect(safePercent(NaN)).toBe("Data coverage unavailable")
    expect(safeRatio(5, 0)).toBeNull()
    expect(safePercentOf(1, 4)).toBe("25%")
    expect(safePercentOf(1, 0)).toBe("Data coverage unavailable")
  })

  it("isMissing detects undefined/null/NaN/empty/[object Object]", () => {
    expect(isMissing(undefined)).toBe(true)
    expect(isMissing(null)).toBe(true)
    expect(isMissing(NaN)).toBe(true)
    expect(isMissing("")).toBe(true)
    expect(isMissing({})).toBe(true)
    expect(isMissing("[object Object]")).toBe(true)
    expect(isMissing(0)).toBe(false)
    expect(isMissing("ok")).toBe(false)
  })

  it("normalizeMissingValue maps missing values to the kind vocabulary", () => {
    expect(normalizeMissingValue(undefined, "source")).toBe(MISSING_LABELS.source)
    expect(normalizeMissingValue(null, "provenance")).toBe(MISSING_LABELS.provenance)
    expect(normalizeMissingValue("HKUST-1", "source")).toBe("HKUST-1")
    expect(normalizeMissingValue({}, "evidence")).toBe(MISSING_LABELS.evidence)
  })

  it("formatDataCardValue never renders a forbidden token", () => {
    const cases = [undefined, null, NaN, {}, [], "", "[object Object]", 1234.5, 0.42, "text"]
    for (const v of cases) {
      for (const type of ["count", "number", "percent", "ratio", "text"]) {
        const out = formatDataCardValue(v, { type })
        expect(typeof out).toBe("string")
        for (const bad of FORBIDDEN) expect(out).not.toBe(bad)
      }
    }
    expect(formatDataCardValue(3020, { type: "count" })).toBe("3,020")
    expect(formatDataCardValue(0.42, { type: "ratio" })).toBe("42%")
  })
})
