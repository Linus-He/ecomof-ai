// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CatalysisCatProbe, catProbeStorageKey, clampCatPosition, zoneForCatPosition } from "../../components/catalysis/CatalysisCatProbe"

const theme = {
  accent: "#2563eb",
  accentText: "#1d4ed8",
  badgeGoodBg: "#dcfce7",
  badgeInfoBg: "#dbeafe",
  border: "#cbd5e1",
  muted: "#475569",
  surface: "#ffffff",
  textStrong: "#0f172a",
  warn: "#b45309",
}

describe("CatalysisCatProbe", () => {
  it("uses independent chart-scoped storage keys", () => {
    expect(catProbeStorageKey("hotspot-scaffold")).toBe("ecomof-cat-position-hotspot-scaffold")
    expect(catProbeStorageKey("hotspot-dopant")).toBe("ecomof-cat-position-hotspot-dopant")
    expect(catProbeStorageKey("hotspot-synergy")).toBe("ecomof-cat-position-hotspot-synergy")
  })

  it("clamps coordinates and maps chart-relative zones", () => {
    expect(clampCatPosition(-10, 0, 20)).toBe(0)
    expect(clampCatPosition(42, 0, 20)).toBe(20)
    expect(clampCatPosition("bad", 5, 20)).toBe(5)

    const boundary = { width: 640, height: 390 }
    expect(zoneForCatPosition({ x: 32, y: 280 }, boundary, "synergy")).toBe("rejected-by-hard-gate")
    expect(zoneForCatPosition({ x: 260, y: 210 }, boundary, "synergy")).toBe("needs-review-region")
    expect(zoneForCatPosition({ x: 500, y: 62 }, boundary, "synergy")).toBe("mo-primary-hypothesis")
    expect(zoneForCatPosition({ x: 345, y: 70 }, boundary, "dopant")).toBe("w-backup-hypothesis")
    expect(zoneForCatPosition({ x: 455, y: 65 }, boundary, "scaffold")).toBe("hot-spot-region")
  })

  it("mounts inside the chart boundary without fixed positioning", () => {
    vi.stubGlobal("ResizeObserver", class ResizeObserver {
      observe() {}
      disconnect() {}
    })

    render(
      <CatalysisCatProbe boundaryId="hotspot-synergy" chartMode="synergy" lang="en" t={theme}>
        <svg aria-label="Synergy Hot Spot Map" />
      </CatalysisCatProbe>,
    )

    const probe = screen.getByTestId("catalysis-cat-probe")
    const boundary = probe.closest("[data-cat-boundary='hotspot-synergy']")

    expect(boundary).toBeInTheDocument()
    expect(boundary).toContainElement(probe)
    expect(probe).toHaveAttribute("data-cat-boundary-id", "hotspot-synergy")
    expect(probe).toHaveAttribute("data-cat-chart-mode", "synergy")
    expect(probe.style.position).not.toBe("fixed")
    expect(window.document.body.querySelector("[data-testid='catalysis-cat-probe']")).toBe(probe)

    vi.unstubAllGlobals()
  })
})
