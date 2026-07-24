// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("top navigation layout", () => {
  it("keeps English navigation from being compressed by right-side controls", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).not.toContain('"160px 1fr 160px"')
    expect(source).toContain('"minmax(220px, 1fr) minmax(680px, 760px) minmax(220px, 1fr)"')
    expect(source).toContain("const navStacked = viewport.width < 1180")
    expect(source).toContain('width: "100%"')
    expect(source).toContain('overscrollBehaviorX: "contain"')
  })

  it("centers an equal-width desktop navigation rail independently of the side regions", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain('justifyContent: navStacked ? "flex-start" : "center"')
    expect(source).toContain('gridTemplateColumns: navStacked ? "1fr auto" : "minmax(220px, 1fr) minmax(680px, 760px) minmax(220px, 1fr)"')
    expect(source).toContain('gridTemplateColumns: navStacked ? undefined : `repeat(${TABS.length}, minmax(0, 1fr))`')
    expect(source).toContain('maxWidth: navStacked ? "100%" : 760')
  })

  it("centers Chinese tab labels inside each navigation button", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const navTabStart = source.indexOf('className="nav-tab"')
    const navTabStyle = source.slice(navTabStart, navTabStart + 1100)

    expect(navTabStyle).toContain('display: "inline-flex"')
    expect(navTabStyle).toContain('alignItems: "center"')
    expect(navTabStyle).toContain('justifyContent: "center"')
    expect(navTabStyle).toContain('width: navStacked ? "auto" : "100%"')
    expect(navTabStyle).toContain('lineHeight: 1')
    expect(navTabStyle).toContain('textAlign: "center"')
  })
})
