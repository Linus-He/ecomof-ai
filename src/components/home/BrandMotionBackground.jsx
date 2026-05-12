import { BrandMotif, BrandNode } from "../brand"

export function BrandMotionBackground({ t, isMobile, reducedMotion }) {
  if (isMobile) return null

  return (
    <div
      className="home-motion-background"
      aria-hidden="true"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <BrandMotif
        className="home-bg-motif home-bg-motif-a"
        size={260}
        color={t.accentText}
        opacity={0.045}
        strokeWidth={1.2}
        style={{ position: "absolute", top: 90, right: -84 }}
      />
      <BrandMotif
        className="home-bg-motif home-bg-motif-b"
        size={210}
        color={t.cyan || t.accentText}
        opacity={0.035}
        strokeWidth={1.15}
        style={{ position: "absolute", top: 860, left: -72 }}
      />
      <BrandMotif
        className="home-bg-motif home-bg-motif-c"
        size={240}
        color={t.violet || t.accentText}
        opacity={0.03}
        strokeWidth={1.1}
        style={{ position: "absolute", top: 1660, right: -70 }}
      />
      <div className="home-bg-node-line" style={{ position: "absolute", top: 550, right: 118, display: "flex", alignItems: "center", gap: 10, opacity: 0.22 }}>
        <BrandNode active t={t} style={{ width: 20, height: 20, fontSize: 0 }} />
        <span style={{ width: 80, height: 1, background: t.borderStrong }} />
        <BrandNode t={t} style={{ width: 18, height: 18, fontSize: 0 }} />
      </div>
      <div className="home-bg-node-line home-bg-node-line-b" style={{ position: "absolute", top: 1280, left: 120, display: "flex", alignItems: "center", gap: 10, opacity: 0.18 }}>
        <BrandNode t={t} style={{ width: 18, height: 18, fontSize: 0 }} />
        <span style={{ width: 110, height: 1, background: t.borderStrong }} />
        <BrandNode active t={t} style={{ width: 22, height: 22, fontSize: 0 }} />
      </div>
    </div>
  )
}
