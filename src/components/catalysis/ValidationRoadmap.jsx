const ROADMAP = [
  ["01", "Candidate pathway library", "Keep P1-P8 routes as a candidate network with evidence levels."],
  ["02", "MOF screening & risk tagging", "Apply water stability, pore access, site, and release-risk tags before stronger claims."],
  ["03", "Reaction fingerprint scoring", "Use A1/A2/A3/A4/B1 as expert-prior metrics, not validated yield prediction."],
  ["04", "Experimental calibration & active learning", "Update pathway weights with feeding tests, isotope tracing, time-series data, and carbon balance."],
]

export function ValidationRoadmap({ t, isMobile }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 9 }}>
        {ROADMAP.map(([number, title, body]) => (
          <article key={number} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 11 }}>
            <div style={{ color: t.accentText, fontSize: 11, fontWeight: 920, fontVariantNumeric: "tabular-nums" }}>{number}</div>
            <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.3 }}>{title}</div>
            <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>{body}</div>
          </article>
        ))}
      </div>
      <div style={{ background: t.badgeWarnBg || t.surface, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.badgeWarnText || t.warn, fontSize: 12, lineHeight: 1.55, padding: 11 }}>
        This framework is designed for hypothesis generation and experimental prioritization, not validated yield prediction at the current stage.
      </div>
    </section>
  )
}
