// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { LiteratureInspirationCard } from "./LiteratureInspirationCard"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function LiteratureInspirationPanel({ version, literatureRecords = [], lang, t, isMobile }) {
  const linked = useMemo(() => {
    const byId = new Map(literatureRecords.map(record => [record.id, record]))
    return (version?.literatureInspirations || []).map(link => ({
      link,
      record: byId.get(link.literatureId) || {
        id: link.literatureId,
        title: "Pending metadata",
        status: "pending_metadata",
        coreIdea: "Pending metadata.",
        coreIdeaZh: "元数据待补。",
        adaptationBoundary: link.evidenceBoundary || "Pending metadata.",
        adaptationBoundaryZh: link.evidenceBoundary || "元数据待补。",
        inspiredModules: link.inspiredFeatures || [],
      },
    }))
  }, [version, literatureRecords])
  const [selectedId, setSelectedId] = useState(linked[0]?.record?.id)
  const selected = linked.find(row => row.record.id === selectedId) || linked[0]

  if (!version) return null

  return (
    <section id="methodology-version-literature" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Literature Inspiration</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "文献灵感来源", "Literature Inspiration")}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.55, margin: 0 }}>
          <ChemicalText value={text(
            lang,
            "每条文献都绑定到具体版本和功能，并显示迁移边界；这里记录的是设计灵感，不是 EcoMOF-AI 的验证证据。",
            "Each source is tied to specific versions and features with an adaptation boundary. These records document design inspiration, not validation evidence for EcoMOF-AI."
          )} />
        </p>
      </header>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(260px, 0.95fr)" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {linked.map(row => (
            <LiteratureInspirationCard
              key={row.record.id}
              record={row.record}
              link={row.link}
              lang={lang}
              t={t}
              selected={row.record.id === selected?.record?.id}
              onSelect={() => setSelectedId(row.record.id)}
            />
          ))}
        </div>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, "选中文献详情", "Selected source detail")}
          </span>
          <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.3 }}>
            <ChemicalText value={selected?.record?.title || "Pending metadata"} />
          </strong>
          <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 6, lineHeight: 1.48 }}>
            <span>{text(lang, "版本：", "Version: ")}{version.version}</span>
            <span>{text(lang, "来源状态：", "Source status: ")}{selected?.record?.status || "pending_metadata"}</span>
            <span>{text(lang, "DOI：", "DOI: ")}{selected?.record?.doi || "DOI pending"}</span>
            <span><strong style={{ color: t.warn }}>{text(lang, "边界：", "Boundary: ")}</strong><ChemicalText value={text(lang, selected?.record?.adaptationBoundaryZh, selected?.link?.adaptationNote || selected?.record?.adaptationBoundary || "Pending metadata.")} /></span>
          </div>
        </article>
      </div>
    </section>
  )
}
