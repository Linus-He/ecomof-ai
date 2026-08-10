// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("immersive homepage continuity", () => {
  it("keeps mode controls explicit and reveals the deep homepage progressively", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/tabs/HomeTab.tsx"), "utf8")

    expect(source).toContain('className="home-mode-label"')
    expect(source).toContain('className="home-mode-switch" role="group"')
    expect(source).toContain('data-home-reveal="data-foundation"')
    expect(source).toContain('data-home-reveal="descriptor-space"')
    expect(source).toContain('data-home-reveal="algorithm-validation"')
    expect(source).toContain("new IntersectionObserver")
  })

  it("uses the shared scientific canvas tokens through the footer", () => {
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")
    const footerStart = css.indexOf(".app-footer {")
    const footerBlock = css.slice(footerStart, footerStart + 520)

    expect(css).toContain('--home-canvas: var(--app-bg)')
    expect(css).toContain('--home-clay: var(--app-accent)')
    expect(css).toContain('--home-ink: var(--app-text-strong)')
    expect(css).toContain('[data-home-reveal]:not([data-revealed="true"])')
    expect(footerBlock).toContain("background: var(--app-bg)")
    expect(footerBlock).not.toContain("background: #141413")
    expect(footerBlock).not.toContain("border-top")
  })

  it("uses the homepage palette as the global application contract", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8")
    const map = readFileSync(resolve(process.cwd(), "src/components/home/ScientificDiscoveryMap.tsx"), "utf8")
    const home = readFileSync(resolve(process.cwd(), "src/components/tabs/HomeTab.tsx"), "utf8")

    expect(source).toContain("const theme = darkMode ? THEME_DARK : THEME_LIGHT")
    expect(source).toContain("const chromeTheme = theme")
    expect(source).not.toContain('activeTab === "home" ? "#f0eee6"')
    expect(home).toContain("const t = useT()")
    expect(home).not.toContain("const baseTheme = useT()")
    expect(map).toContain('"--map-accent": t?.accent || "#d97757"')
  })

  it("prevents selection focus from scrolling the atlas and keeps its overlay above mode controls", () => {
    const map = readFileSync(resolve(process.cwd(), "src/components/home/ScientificDiscoveryMap.tsx"), "utf8")
    const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8")
    const expansionLayerStart = css.indexOf(".home-map-expansion-layer {")
    const expansionLayerBlock = css.slice(expansionLayerStart, expansionLayerStart + 180)

    expect(map).toContain("focus({ preventScroll: true })")
    expect(expansionLayerBlock).toContain("z-index: 90")
    expect(css).toContain('.home-discovery-map[data-inspecting="true"] {\n  z-index: 120;')
    expect(css).toContain('.app-main:has(.home-discovery-map[data-inspecting="true"])')
    expect(css).toContain('.home-story-shell:has(.home-discovery-map[data-inspecting="true"]) .home-mode-control')
  })
})
