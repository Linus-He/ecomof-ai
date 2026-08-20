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
      bg: "#ffffff",
      panel: "#ffffff",
      surface: "#f5f5f5",
      card: "#ffffff",
      chartBg: "#ffffff",
      textStrong: "#111110",
      border: "#dededb",
      accent: "#111110",
      success: "#4f6f45",
      info: "#4f5b6b",
      violet: "#68636f",
      danger: "#a5453f",
    })
    expect(THEME_DARK).toMatchObject({
      bg: "#141411",
      panel: "#25241f",
      surface: "#323029",
      card: "#2b2923",
      chartBg: "#1c1c18",
      textStrong: "#fffaf2",
      accent: "#fffaf2",
      success: "#9cb49b",
      info: "#aeb6c0",
      violet: "#b8b1c2",
    })
  })

  it("reserves Songti for display text and keeps dense UI text sans-serif", () => {
    expect(FONT_DISPLAY).toContain('"Songti SC", STSong')
    expect(FONT_SANS).toContain('"PingFang SC", "Noto Sans SC", "Microsoft YaHei"')
    expect(FONT_SANS).not.toMatch(/Songti SC|STSong|Noto Serif SC|SimSun/)
  })

  it("mirrors the application palette and font contract in global CSS", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toContain("--app-bg: #ffffff")
    expect(css).toContain("--app-panel: #ffffff")
    expect(css).toContain("--app-surface: #f5f5f5")
    expect(css).toContain("--app-card: #ffffff")
    expect(css).toContain("--app-chart: #ffffff")
    expect(css).toContain("--app-text-strong: #111110")
    expect(css).toContain("--app-border: #dededb")
    expect(css).toContain("--app-accent: #111110")
    expect(css).toContain("--app-info: #4f5b6b")
    expect(css).toContain("--app-violet: #68636f")
    expect(css).toContain(':root[data-theme="dark"]')
    expect(css).toContain("--app-bg: #141411")
    expect(css).toContain("--app-accent: #fffaf2")
    expect(css).toContain("--font-body: Inter, 'PingFang SC', 'Noto Sans SC'")
    expect(css).toContain("background: var(--app-bg)")
  })
})
