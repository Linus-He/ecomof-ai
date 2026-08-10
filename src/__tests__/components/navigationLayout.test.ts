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

  it("collects language, appearance, contact, and repository controls in one collapsed settings menu", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain("<GearSix")
    expect(source).toContain('aria-haspopup="menu"')
    expect(source).toContain('className="settings-trigger"')
    expect(source).toContain('className="settings-menu-row"')
    expect(source).toContain('className="settings-option"')
    expect(source).toContain("语言")
    expect(source).toContain('["zh-TW", "繁體中文"]')
    expect(source).toContain("外观")
    expect(source).toContain("浅色模式")
    expect(source).toContain("深色模式")
    expect(source).toContain('window.localStorage.setItem("ecomof-theme"')
    expect(source).toContain('onPointerDown={event => event.stopPropagation()}')
    expect(source).toContain("联系我们")
    expect(source).toContain("GitHub 仓库")
    expect(source).toContain('href="https://github.com/Linus-He/ecomof-ai"')
    expect(source).toContain('useState("")')
  })

  it("centers the desktop rail and turns it into a horizontal scroller at compact widths", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain('justifyContent: compactHeader ? "flex-start" : "center"')
    expect(source).toContain('maxWidth: compactHeader ? 760 : 880')
    expect(source).toContain('flex: compactHeader ? "0 0 auto" : "1 1 0"')
    expect(source).toContain('minWidth: compactHeader ? "max-content" : 0')
  })

  it("wraps tabs in one liquid-glass capsule with a measured sliding selection layer", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain('className="nav-primary-rail nav-liquid-capsule"')
    expect(source).toContain('className="nav-liquid-indicator"')
    expect(source).toContain("activeButton.offsetLeft")
    expect(source).toContain("activeButton.offsetWidth")
    expect(source).toContain("borderRadius: 999")
    expect(css).toContain(".nav-liquid-capsule")
    expect(css).toContain("backdrop-filter: blur(22px) saturate(155%)")
    expect(css).toContain(".nav-liquid-indicator")
    expect(css).toMatch(/\.nav-shell\s*\{[^}]*z-index:\s*2/s)
    expect(css).toContain("transform 480ms cubic-bezier(0.2, 0.82, 0.2, 1)")
  })

  it("centers Chinese tab labels inside each navigation button", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")
    const navTabStart = source.indexOf('className="nav-tab"')
    const navTabStyle = source.slice(navTabStart, navTabStart + 1800)

    expect(navTabStyle).toContain('display: "grid"')
    expect(navTabStyle).toContain('placeItems: "center"')
    expect(navTabStyle).toContain('flex: compactHeader ? "0 0 auto" : "1 1 0"')
    expect(navTabStyle).toContain('textAlign: "center"')
    expect(navTabStyle).toContain('<span className="nav-tab-label">')
    expect(css).toContain(".nav-tab-label")
    expect(css).toContain("place-items: center")
    expect(css).toContain("inline-size: 100%")
    expect(css).toContain("block-size: 100%")
  })
})
