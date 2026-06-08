// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../FinalScreeningShared"

export function TraceWarningBoundaryPanel({ warnings = [], warningsZh = [], boundaries = [], lang, t, isMobile }) {
  const displayWarnings = lang === "zh" && warningsZh?.length ? warningsZh : warnings
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Warning & Boundary Panel", "Warning & Boundary Panel")}
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.8fr) minmax(0, 1.2fr)" }}>
        <article style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
          <strong style={{ color: t.warn, fontSize: 13 }}>{text(lang, "Warnings", "Warnings")}</strong>
          {(displayWarnings || []).map(item => <span key={item} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>• <ChemicalText value={displayValue(item)} /></span>)}
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Evidence boundaries", "Evidence boundaries")}</strong>
          {(boundaries || []).map(row => (
            <div key={row.id} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 4, paddingTop: 8 }}>
              <StatusPill tone="warn" t={t}>{text(lang, row.labelZh, row.label)}</StatusPill>
              <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={text(lang, row.detailZh, row.detail)} /></span>
            </div>
          ))}
        </article>
      </div>
    </section>
  )
}
