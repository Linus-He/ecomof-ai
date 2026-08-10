import { describe, expect, it } from "vitest"
import { resolveInitialLocale } from "../../utils/locale"

describe("browser locale defaults", () => {
  it.each([
    ["zh-CN", "zh-CN"],
    ["zh-SG", "zh-CN"],
    ["zh-TW", "zh-TW"],
    ["zh-HK", "zh-TW"],
    ["zh-Hant", "zh-TW"],
    ["en-US", "en"],
    ["fr-FR", "en"],
    ["ja-JP", "en"],
  ])("maps %s to %s", (browserLanguage, expected) => {
    expect(resolveInitialLocale({ browserLanguages: [browserLanguage] })).toBe(expected)
  })

  it("preserves a supported explicit user choice", () => {
    expect(resolveInitialLocale({ browserLanguages: ["en-US"], storedLocale: "zh-TW" })).toBe("zh-TW")
  })
})
