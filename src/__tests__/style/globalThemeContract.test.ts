// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  FONT_DISPLAY,
  FONT_SANS,
  GLOBAL_RESEARCH_THEME,
  THEME_DARK,
  THEME_LIGHT,
} from "../../constants/theme"

describe("global research theme contract", () => {
  it("keeps separate frozen light and dark palettes under one design language", () => {
    expect(Object.isFrozen(GLOBAL_RESEARCH_THEME)).toBe(true)
    expect(Object.isFrozen(THEME_LIGHT)).toBe(true)
    expect(Object.isFrozen(THEME_DARK)).toBe(true)
    expect(THEME_LIGHT).toBe(GLOBAL_RESEARCH_THEME)
    expect(THEME_DARK).not.toBe(GLOBAL_RESEARCH_THEME)
    expect(GLOBAL_RESEARCH_THEME).toMatchObject({
      bg: "#f0eee6",
      panel: "#f7f5ef",
      surface: "#e8e5dc",
      card: "#fbfaf6",
      chartBg: "#fcfbf7",
      textStrong: "#171714",
      border: "#d1cfc5",
      accent: "#c6613f",
      success: "#5f7a4b",
      info: "#3f7c83",
      violet: "#7c6b99",
      danger: "#b94a42",
    })
    expect(THEME_DARK).toMatchObject({
      bg: "#141411",
      panel: "#25241f",
      surface: "#323029",
      card: "#2b2923",
      chartBg: "#1c1c18",
      textStrong: "#fffaf2",
      accent: "#e17b59",
      success: "#91a778",
      info: "#6da7ad",
      violet: "#a392bd",
    })
  })

  it("reserves Songti for display text and keeps dense UI text sans-serif", () => {
    expect(FONT_DISPLAY).toContain('"Songti SC", STSong')
    expect(FONT_SANS).toContain('"PingFang SC", "Noto Sans SC", "Microsoft YaHei"')
    expect(FONT_SANS).not.toMatch(/Songti SC|STSong|Noto Serif SC|SimSun/)
  })

  it("mirrors the application palette and font contract in global CSS", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toContain("--app-bg: #f0eee6")
    expect(css).toContain("--app-panel: #f7f5ef")
    expect(css).toContain("--app-surface: #e8e5dc")
    expect(css).toContain("--app-card: #fbfaf6")
    expect(css).toContain("--app-chart: #fcfbf7")
    expect(css).toContain("--app-text-strong: #171714")
    expect(css).toContain("--app-border: #d1cfc5")
    expect(css).toContain("--app-accent: #c6613f")
    expect(css).toContain("--app-info: #3f7c83")
    expect(css).toContain("--app-violet: #7c6b99")
    expect(css).toContain(':root[data-theme="dark"]')
    expect(css).toContain("--app-bg: #141411")
    expect(css).toContain("--app-accent: #e17b59")
    expect(css).toContain("--font-body: Inter, 'PingFang SC', 'Noto Sans SC'")
    expect(css).toContain("background: var(--app-bg)")
  })
})
