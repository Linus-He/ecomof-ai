// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("top navigation layout", () => {
  it("keeps the wordmark, navigation, and actions on one responsive row", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).not.toContain('"160px 1fr 160px"')
    expect(source).toContain("const compactHeader = viewport.width < 1320")
    expect(source).toContain("const veryCompactHeader = viewport.width < 760")
    expect(source).toContain('"auto minmax(0, 1fr) auto"')
    expect(source).toContain('"96px minmax(0, 1fr) 96px"')
    expect(source).toContain('"minmax(180px, 1fr) minmax(0, 880px) minmax(180px, 1fr)"')
    expect(source).toContain('position: "static"')
    expect(source).not.toContain('position: compactHeader && !veryCompactHeader ? "fixed" : "static"')
    expect(source).toContain('width: "100%"')
    expect(source).toContain('overscrollBehaviorX: "contain"')
  })

  it("collects language, appearance, and contact controls in one settings menu", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain("<GearSix")
    expect(source).toContain('aria-haspopup="menu"')
    expect(source).toContain("语言")
    expect(source).toContain("外观")
    expect(source).toContain("联系我们")
  })

  it("centers the desktop rail and turns it into a horizontal scroller at compact widths", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain('justifyContent: compactHeader ? "flex-start" : "center"')
    expect(source).toContain('maxWidth: compactHeader ? 760 : 880')
    expect(source).toContain('flex: compactHeader ? "0 0 auto" : "1 1 0"')
    expect(source).toContain('minWidth: compactHeader ? "max-content" : 0')
  })

  it("centers Chinese tab labels inside each navigation button", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const navTabStart = source.indexOf('className="nav-tab"')
    const navTabStyle = source.slice(navTabStart, navTabStart + 1400)

    expect(navTabStyle).toContain('display: "inline-flex"')
    expect(navTabStyle).toContain('alignItems: "center"')
    expect(navTabStyle).toContain('justifyContent: "center"')
    expect(navTabStyle).toContain('flex: compactHeader ? "0 0 auto" : "1 1 0"')
    expect(navTabStyle).toContain('lineHeight: 1')
    expect(navTabStyle).toContain('textAlign: "center"')
  })
})
