// @ts-nocheck
import { ChemicalText } from "../../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const safe = value => value === null || value === undefined || value === "" ? "Pending metadata" : value

function doiLabel(record) {
  return record?.doi ? `DOI ${record.doi}` : "DOI pending"
}

function statusTone(record, t) {
  const status = String(record?.status || "pending_metadata")
  if (status === "verified_from_uploaded_file") return [t.badgeGoodBg || t.badgeInfoBg, t.good || t.accentText]
  return [t.badgeWarnBg, t.warn]
}

export function LiteratureInspirationCard({ record, link, lang, t, selected, onSelect }) {
  if (!record) return null
  const [bg, fg] = statusTone(record, t)
  const modules = link?.inspiredFeatures?.length ? link.inspiredFeatures : record.inspiredModules || []
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        background: selected ? t.badgeInfoBg : t.surface,
        border: `1px solid ${selected ? t.accentText : t.border}`,
        borderRadius: 10,
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 9,
        minWidth: 0,
        padding: 11,
        textAlign: "left",
      }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {safe(record.year)} · {safe(record.journal)}
        </span>
        <strong style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.3 }}>
          <ChemicalText value={safe(record.title)} />
        </strong>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span style={{ background: bg, border: `1px solid ${fg}`, borderRadius: 999, color: fg, fontSize: 10.5, fontWeight: 900, padding: "5px 8px" }}>
          {record.status === "verified_from_uploaded_file" ? "verified uploaded paper" : "Pending metadata"}
        </span>
        <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: record.doi ? t.accentText : t.warn, fontSize: 10.5, fontWeight: 900, padding: "5px 8px" }}>
          {doiLabel(record)}
        </span>
      </div>
      <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 5, lineHeight: 1.45 }}>
        <span><strong style={{ color: t.textStrong }}>{text(lang, "核心思路：", "Core idea: ")}</strong><ChemicalText value={text(lang, record.coreIdeaZh, record.coreIdea)} /></span>
        <span><strong style={{ color: t.textStrong }}>{text(lang, "启发模块：", "Inspired modules: ")}</strong>{modules.join(" / ")}</span>
        <span><strong style={{ color: t.warn }}>{text(lang, "迁移边界：", "Adaptation boundary: ")}</strong><ChemicalText value={text(lang, record.adaptationBoundaryZh, link?.adaptationNote || record.adaptationBoundary)} /></span>
      </div>
    </button>
  )
}
