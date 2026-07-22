// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("top navigation layout", () => {
  it("keeps English navigation from being compressed by right-side controls", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).not.toContain('"160px 1fr 160px"')
    expect(source).toContain('"auto minmax(0, 1fr) auto"')
    expect(source).toContain('width: "100%"')
    expect(source).toContain('overscrollBehaviorX: "contain"')
  })

  it("centers Chinese tab labels inside each navigation button", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const navTabStart = source.indexOf('className="nav-tab"')
    const navTabStyle = source.slice(navTabStart, navTabStart + 1100)

    expect(navTabStyle).toContain('display: "inline-flex"')
    expect(navTabStyle).toContain('alignItems: "center"')
    expect(navTabStyle).toContain('justifyContent: "center"')
    expect(navTabStyle).toContain('lineHeight: 1')
    expect(navTabStyle).toContain('textAlign: "center"')
  })
})
