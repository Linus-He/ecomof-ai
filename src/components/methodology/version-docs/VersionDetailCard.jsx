// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { VersionStatusBadge } from "./VersionStatusBadge"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function ListBlock({ title, rows = [], t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, minWidth: 0, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
      <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 4, lineHeight: 1.45 }}>
        {rows.map(row => <span key={row}><ChemicalText value={row} /></span>)}
      </div>
    </div>
  )
}

export function VersionDetailCard({ version, lang, t }) {
  if (!version) return null
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{version.version} · {version.date}</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            <ChemicalText value={text(lang, version.titleZh, version.title)} />
          </h3>
        </div>
        <VersionStatusBadge status={version.status} t={t} />
      </header>
      <p style={{ color: t.muted, fontSize: 12.6, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(lang, version.summaryZh, version.summary)} />
      </p>
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, display: "grid", gap: 4, padding: 10 }}>
        <strong style={{ color: t.warn, fontSize: 12.5 }}>{text(lang, "证据边界", "Evidence boundary")}</strong>
        <span style={{ fontSize: 12.2, lineHeight: 1.45 }}><ChemicalText value={text(lang, version.evidenceBoundaryZh, version.evidenceBoundary)} /></span>
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <ListBlock title={text(lang, "关键更新", "Key updates")} rows={lang === "zh" ? version.keyUpdatesZh : version.keyUpdates} t={t} />
        <ListBlock title={text(lang, "算法变化", "Algorithm changes")} rows={lang === "zh" ? version.algorithmChangesZh : version.algorithmChanges} t={t} />
        <ListBlock title={text(lang, "UI / UX 变化", "UI / UX changes")} rows={lang === "zh" ? version.uiChangesZh : version.uiChanges} t={t} />
        <ListBlock title={text(lang, "限制", "Limitations")} rows={lang === "zh" ? version.limitationsZh : version.limitations} t={t} />
      </div>
      <a href={version.relatedSection || "#methodology-organic-acid-final-screening"} style={{ color: t.accentText, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>
        {text(lang, "查看相关方法论小节", "View related methodology section")}
      </a>
    </article>
  )
}
