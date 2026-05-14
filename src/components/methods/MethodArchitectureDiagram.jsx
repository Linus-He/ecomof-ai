export function scrollToMethodTarget(id) {
  if (typeof document === "undefined") return
  const target = document.getElementById(id)
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function MethodArchitectureDiagram({ t, eyebrow, title, subtitle, children, footer, action }) {
  return (
    <article
      className="method-architecture-card"
      style={{
        background: `linear-gradient(180deg, ${t.panel}, ${t.surface})`,
        border: `1px solid ${t.border}`,
        borderRadius: 18,
        boxShadow: t.shadowSm,
        padding: 16,
        display: "grid",
        gap: 14,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div className="method-architecture-header" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, maxWidth: 780 }}>
          {eyebrow && (
            <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
              {eyebrow}
            </div>
          )}
          <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.18, fontWeight: 930, margin: eyebrow ? "5px 0 0" : 0 }}>
            {title}
          </h3>
          {subtitle && (
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
      {footer && (
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
          {footer}
        </div>
      )}
    </article>
  )
}
