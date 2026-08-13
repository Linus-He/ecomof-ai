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
    expect(source).toContain('position: "relative"')
    expect(source).not.toContain('position: compactHeader && !veryCompactHeader ? "fixed" : "static"')
    expect(source).toContain('width: "100%"')
    expect(source).toContain('overscrollBehaviorX: "contain"')
  })

  it("keeps search and user controls outside the tab capsule and nests settings in the user menu", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain("<MagnifyingGlass")
    expect(source).toContain("<User")
    expect(source).not.toContain("<CaretDown")
    expect(source).not.toContain("<GearSix")
    expect(source).toContain('className="nav-action-button nav-search-trigger"')
    expect(source).toContain('className="settings-trigger nav-action-button nav-user-trigger"')
    expect(source).toContain('aria-haspopup="dialog"')
    expect(source).toContain('aria-haspopup="menu"')
    expect(source).toContain('className="settings-menu-row"')
    expect(source).toContain('className="settings-option"')
    expect(source).toContain("语言")
    expect(source).toContain('["zh-TW", "繁體中文"]')
    expect(source).toContain("外观")
    expect(source).toContain("浅色模式")
    expect(source).toContain("深色模式")
    expect(source).toContain('window.localStorage.setItem("ecomof-theme"')
    expect(source).toContain('onPointerDown={event => event.stopPropagation()}')
    expect(source).toContain("数据托管与跨境访问")
    expect(source).toContain('href="https://eur-lex.europa.eu/eli/reg/2016/679/oj"')
    expect(source).toContain("条款与政策")
    expect(source).not.toContain("GitHub 仓库")
    expect(source).not.toContain("联系我们")
    expect(source).toContain('useState("")')
  })

  it("renders the search and user triggers as equal circular controls", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toMatch(/\.nav-action-button\s*\{[^}]*aspect-ratio:\s*1/s)
    expect(css).toMatch(/\.nav-action-button\s*\{[^}]*border-radius:\s*50%\s*!important/s)
    expect(css).toMatch(/\.nav-action-button\s*\{[^}]*height:\s*40px/s)
    expect(css).toMatch(/\.nav-action-button\s*\{[^}]*width:\s*40px/s)
  })

  it("keeps the user menu compact, vertical, rounded, and glass-backed", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toMatch(/\.settings-menu\s*\{[^}]*width:\s*min\(276px,/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*border-radius:\s*22px/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*backdrop-filter:\s*blur\(34px\) saturate\(165%\)/s)
  })

  it("keeps brand and action controls outside the liquid tab rail", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const railStart = source.indexOf('<nav\n                ref={navRef}')
    const railEnd = source.indexOf('</nav>', railStart)
    const railSource = source.slice(railStart, railEnd)

    expect(railSource).not.toContain("LogoWordmark")
    expect(railSource).not.toContain("nav-search-trigger")
    expect(railSource).not.toContain("nav-user-trigger")
  })

  it("centers the desktop rail and turns it into a horizontal scroller at compact widths", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain('const contentSizedNavTabs = compactHeader || lang === "en"')
    expect(source).toContain('justifyContent: compactHeader ? "flex-start" : "center"')
    expect(source).toContain('maxWidth: compactHeader ? 760 : 880')
    expect(source).toContain('flex: contentSizedNavTabs ? "0 0 auto" : "1 1 0"')
    expect(source).toContain('minWidth: contentSizedNavTabs ? "max-content" : 0')
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
    expect(navTabStyle).toContain('flex: contentSizedNavTabs ? "0 0 auto" : "1 1 0"')
    expect(navTabStyle).toContain('textAlign: "center"')
    expect(navTabStyle).toContain('<span className="nav-tab-label">')
    expect(css).toContain(".nav-tab-label")
    expect(css).toContain("place-items: center")
    expect(css).toContain("inline-size: 100%")
    expect(css).toContain("block-size: 100%")
  })

  it("returns to the top when a primary tab changes modules", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")

    expect(source).toContain('setActiveTab(tab.id, { resetScroll: true })')
    expect(source).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" })')
    expect(source).toContain("window.requestAnimationFrame(scrollToModuleTop)")
  })

  it("preserves the intrinsic width of English tab labels", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain("data-lang={lang}")
    expect(css).toContain('.nav-primary-rail[data-lang="en"] .nav-tab-label')
    expect(css).toContain("inline-size: max-content")
    expect(css).toContain("min-inline-size: max-content")
  })
})
