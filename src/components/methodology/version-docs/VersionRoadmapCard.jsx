// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { VersionStatusBadge } from "./VersionStatusBadge"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function VersionRoadmapCard({ roadmap = [], lang, t }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Future Knowledge Gaps</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "后续知识缺口", "Future Knowledge Gaps")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {roadmap.map(item => (
          <article key={item.version} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 15 }}>{item.version}</strong>
              <VersionStatusBadge status={item.status} t={t} />
            </div>
            <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 900 }}><ChemicalText value={text(lang, item.titleZh, item.title)} /></span>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 4, lineHeight: 1.42 }}>
              {(lang === "zh" ? item.itemsZh : item.items).map(row => <span key={row}><ChemicalText value={row} /></span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
