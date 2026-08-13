// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("top navigation layout", () => {
  it("keeps the wordmark, navigation, and actions on one responsive row", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const navigation = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")

    expect(source).not.toContain('"160px 1fr 160px"')
    expect(source).toContain("const compactHeader = viewport.width < 1320")
    expect(source).toContain("const veryCompactHeader = viewport.width < 760")
    expect(source).toContain('"auto minmax(0, 1fr) auto"')
    expect(source).toContain('"96px minmax(0, 1fr) 96px"')
    expect(source).toContain('"170px minmax(0, 1fr) auto"')
    expect(source).toContain('position: "relative"')
    expect(source).not.toContain('position: compactHeader && !veryCompactHeader ? "fixed" : "static"')
    expect(source).toContain('width: "100%"')
    expect(navigation).toContain('className="nav-primary-rail"')
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
    expect(source).toContain('className="settings-language-select"')
    expect(source).toContain("语言")
    expect(source).toContain('<option value="zh-TW">繁體中文</option>')
    expect(source).toContain("外观")
    expect(source).toContain("浅色")
    expect(source).toContain("深色")
    expect(source).toContain('window.localStorage.setItem("ecomof-theme"')
    expect(source).toContain('onPointerDown={event => event.stopPropagation()}')
    expect(source).toContain("数据托管与跨境访问")
    expect(source).toContain('navigateTab("compliance-hosting-notice")')
    expect(source).not.toContain("GitHub 仓库")
    expect(source).toContain("联系与合作")
    expect(source).not.toContain("settingsSection")
  })

  it("keeps search and user triggers unframed", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toMatch(/\.settings-control-cluster \.nav-action-button\s*\{[^}]*border:\s*0\s*!important/s)
    expect(css).toMatch(/\.settings-control-cluster \.nav-action-button\s*\{[^}]*border-radius:\s*0\s*!important/s)
    expect(css).toMatch(/\.settings-control-cluster \.nav-action-button\s*\{[^}]*box-shadow:\s*none\s*!important/s)
    expect(css).toMatch(/\.settings-control-cluster \.nav-action-button\s*\{[^}]*backdrop-filter:\s*none/s)
  })

  it("keeps the user menu compact, vertical, rounded, and glass-backed", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(css).toMatch(/\.settings-menu\s*\{[^}]*width:\s*min\(272px,/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*border-radius:\s*16px/s)
    expect(css).toMatch(/\.settings-menu\s*\{[^}]*backdrop-filter:\s*blur\(20px\) saturate\(130%\)/s)
  })

  it("keeps brand and action controls outside the text navigation rail", () => {
    const railSource = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")

    expect(railSource).not.toContain("LogoWordmark")
    expect(railSource).not.toContain("nav-search-trigger")
    expect(railSource).not.toContain("nav-user-trigger")
  })

  it("keeps six domain-level controls and turns the rail into a horizontal scroller at compact widths", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain("NAVIGATION_DOMAINS")
    expect(source).toContain("domains.map(domain =>")
    expect(css).toMatch(/\.primary-domain-navigation \.nav-primary-rail\s*\{[^}]*overflow-x:\s*auto/s)
    expect(css).toContain("@media (max-width: 1319px)")
    expect(css).toMatch(/\.primary-domain-navigation \.nav-tab\s*\{[^}]*flex:\s*0 0 auto/s)
  })

  it("uses an OpenAI-style unframed text rail without a selection capsule", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain('className="nav-primary-rail"')
    expect(source).not.toContain("nav-liquid-capsule")
    expect(source).not.toContain("nav-liquid-indicator")
    expect(source).not.toContain("CaretDown")
    expect(css).toMatch(/\.primary-domain-navigation \.nav-primary-rail\s*\{[^}]*background:\s*transparent/s)
    expect(css).toMatch(/\.primary-domain-navigation \.nav-primary-rail\s*\{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.primary-domain-navigation \.nav-primary-rail\s*\{[^}]*box-shadow:\s*none/s)
    expect(css).toMatch(/\.nav-shell\s*\{[^}]*z-index:\s*2/s)
  })

  it("renders the secondary menu as a full-width unframed index layer", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain('className="nav-domain-panel-inner"')
    expect(source).toContain('data-featured={groupIndex === 0 ? "true" : "false"}')
    expect(css).toMatch(/\.nav-domain-panel\s*\{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.nav-domain-panel\s*\{[^}]*border-radius:\s*0/s)
    expect(css).toMatch(/\.nav-domain-panel\s*\{[^}]*box-shadow:\s*none/s)
    expect(css).toMatch(/\.nav-domain-panel\s*\{[^}]*position:\s*fixed/s)
    expect(css).toMatch(/\.nav-domain-panel\s*\{[^}]*width:\s*100vw/s)
    expect(css).toMatch(/\.nav-domain-group\[data-featured="true"\] \.nav-domain-item\s*\{[^}]*font-size:\s*30px/s)
  })

  it("keeps bilingual domain labels centered without shrinking long English text", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain('<span className="nav-tab-label">')
    expect(css).toContain(".nav-tab-label")
    expect(css).toContain("place-items: center")
    expect(css).toContain("inline-size: 100%")
    expect(css).toContain("block-size: 100%")
  })

  it("returns to the top when a primary tab changes modules", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const navigation = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")

    expect(navigation).toContain('onNavigate(hash, { resetScroll: true })')
    expect(source).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" })')
    expect(source).toContain("window.requestAnimationFrame(scrollToModuleTop)")
  })

  it("preserves the intrinsic width of English tab labels", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/navigation/PrimaryDomainNavigation.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")

    expect(source).toContain("data-lang={lang}")
    expect(css).toContain('.nav-primary-rail[data-lang="en"] .nav-tab-label')
    expect(css).toContain("inline-size: max-content")
    expect(css).toContain("min-inline-size: max-content")
  })
})
