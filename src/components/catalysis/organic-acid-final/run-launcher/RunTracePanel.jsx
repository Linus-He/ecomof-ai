// @ts-nocheck
import { ChemicalText } from "../../../../shared"
import { text } from "../FinalScreeningShared"

export function RunTracePanel({ open, trace = [], lang, t }) {
  if (!open) return null
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, maxHeight: 420, overflow: "auto", padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "运行追踪", "Run trace")}</strong>
      {trace.map((row, index) => (
        <article key={`${row.id}-${index}`} style={{ borderTop: index ? `1px solid ${t.divider || t.border}` : "none", display: "grid", gap: 4, paddingTop: index ? 8 : 0 }}>
          <span style={{ color: t.textStrong, fontSize: 12.3, fontWeight: 900 }}><ChemicalText value={text(lang, row.titleZh, row.title)} /></span>
          <span style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}><ChemicalText value={text(lang, row.detailZh, row.detail)} /></span>
        </article>
      ))}
    </section>
  )
}
