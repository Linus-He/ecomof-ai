// @ts-nocheck
import { BrandCornerMotif, BrandNode } from "../brand"
import { toolbarBtn } from "../../utils/styles"

export function ModuleRail({ modules, t, isMobile, onNavigate, onOpenComparisonBuilder }) {
  return (
    <div
      className="module-rail"
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
        gap: isMobile ? 12 : 14,
        position: "relative",
      }}
    >
      {!isMobile && (
        <div
          aria-hidden="true"
          className="module-rail-line"
          style={{
            position: "absolute",
            left: "6%",
            right: "6%",
            top: 32,
            height: 1,
            background: t.borderStrong,
            opacity: 0.65,
          }}
        />
      )}
      {modules.map((module, index) => (
        <article
          key={module.name}
          role="button"
          tabIndex={0}
          onClick={() => onNavigate(module.target)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onNavigate(module.target)
            }
          }}
          className="content-card clickable-card module-rail-card"
          style={{
            "--rail-delay": `${index * 85}ms`,
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            boxShadow: t.shadowSm,
            padding: isMobile ? 16 : 18,
            minWidth: 0,
            cursor: "pointer",
            display: "grid",
            gap: 12,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <BrandCornerMotif
            t={t}
            style={{ position: "absolute", top: -18, right: -18, pointerEvents: "none" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
            <BrandNode active t={t} style={{ width: 38, height: 38, flexShrink: 0 }}>
              {module.mark}
            </BrandNode>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
              {module.kicker}
            </div>
            <h3 style={{ margin: "6px 0 0", color: t.textStrong, fontSize: isMobile ? 18 : 19, lineHeight: 1.25, fontWeight: 950 }}>
              {module.name}
            </h3>
          </div>
          <p style={{ margin: 0, color: t.muted, fontSize: 12.2, lineHeight: 1.6 }}>
            {module.positioning}
          </p>
          <div className="module-rail-reveal" style={{
            display: "grid",
            gap: 9,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: 10,
          }}>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: t.textStrong, fontSize: 11.3, lineHeight: 1.62, fontWeight: 720 }}>
              {module.capabilities.map(item => <li key={item}>{item}</li>)}
            </ul>
            <div style={{ color: t.subtle, fontSize: 10.8, lineHeight: 1.5, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 8 }}>
              {module.functionText}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 34,
              padding: "8px 11px",
              borderRadius: 7,
              border: `1px solid ${t.accent}`,
              color: t.accentText,
              background: t.badgeInfoBg,
              fontSize: 11.5,
              fontWeight: 850,
            }}>
              {module.buttonLabel}
            </span>
            {module.compareAction && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenComparisonBuilder?.()
                }}
                style={{
                  ...toolbarBtn(t),
                  minHeight: 34,
                  padding: "8px 10px",
                  fontSize: 11.5,
                  color: t.subtle,
                  background: t.panel,
                }}
              >
                {module.compareAction}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
