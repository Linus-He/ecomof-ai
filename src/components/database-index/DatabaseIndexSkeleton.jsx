// @ts-nocheck
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"

export function DatabaseIndexSkeleton({ lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 10, padding: 15 }}>
      <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Database Index Preview</div>
      <strong style={{ color: t.textStrong, fontSize: 18 }}>{text(lang, "正在加载数据库索引预览...", "Loading database index preview...")}</strong>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[0, 1, 2, 3].map(index => (
          <span key={index} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, minHeight: 58 }} />
        ))}
      </div>
    </section>
  )
}
