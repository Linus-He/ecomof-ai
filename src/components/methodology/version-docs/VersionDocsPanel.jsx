// @ts-nocheck
import { useMemo, useState } from "react"
import literatureRecords from "../../../../public/data/organic_acid_final_screening/literature_inspiration_records.json"
import versionDocs from "../../../../public/data/organic_acid_final_screening/version_docs.json"
import { ChemicalText } from "../../../shared"
import { LiteratureInspirationPanel } from "./LiteratureInspirationPanel"
import { VersionDetailCard } from "./VersionDetailCard"
import { VersionRoadmapCard } from "./VersionRoadmapCard"
import { VersionSourceMap } from "./VersionSourceMap"
import { VersionTimeline } from "./VersionTimeline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const VERSION_DOCS_DIRECTORY = {
  id: "methodology-version-docs",
  label: "Version Docs",
  labelZh: "版本文档",
  level: 1,
  display: "版本文档",
  children: [
    { id: "methodology-version-hero", label: "Version Docs Hero", labelZh: "版本文档概览" },
    { id: "methodology-version-timeline", label: "Version Timeline", labelZh: "版本时间轴" },
    { id: "methodology-version-detail", label: "Selected Version Detail", labelZh: "选中版本详情" },
    { id: "methodology-version-literature", label: "Literature Inspiration", labelZh: "文献灵感来源" },
    { id: "methodology-version-source-map", label: "Version ↔ Literature Source Map", labelZh: "版本与文献映射" },
    { id: "methodology-version-roadmap", label: "Future Roadmap", labelZh: "未来路线图" },
    { id: "methodology-version-boundary", label: "Evidence Boundary Notice", labelZh: "证据边界提示" },
  ],
}

export function VersionDocsPanel({ lang, t, isMobile }) {
  const versions = versionDocs.versions || []
  const [selectedVersion, setSelectedVersion] = useState(versionDocs.currentVersion || versions.find(row => row.status === "current")?.version || versions[versions.length - 1]?.version)
  const selected = useMemo(() => versions.find(row => row.version === selectedVersion) || versions[0], [versions, selectedVersion])
  const stats = useMemo(() => {
    const verified = literatureRecords.filter(row => row.status === "verified_from_uploaded_file").length
    return [
      [text(lang, "当前版本", "Current version"), versionDocs.currentVersion || selected?.version || "V1.5"],
      [text(lang, "已完成版本", "Completed versions"), versionDocs.completedRange || "V1.0-V1.5"],
      [text(lang, "计划版本", "Planned versions"), (versionDocs.roadmap || []).map(row => row.version).join(" / ")],
      [text(lang, "已核验文献灵感", "Verified literature inspirations"), `${verified}+`],
    ]
  }, [lang, selected])

  return (
    <section id="methodology-version-docs" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, padding: 14, scrollMarginTop: 118 }}>
      <header id="methodology-version-hero" style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", scrollMarginTop: 118 }}>
        <div style={{ display: "grid", gap: 5, maxWidth: 820 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Version Docs</span>
          <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "版本文档", "Version Docs")}
          </h2>
          <p style={{ color: t.muted, fontSize: 12.7, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "记录 EcoMOF-AI 有机酸最终筛选模块的版本演进、证据边界与文献灵感来源。",
              "A structured record of EcoMOF-AI Organic Acid Final Screening iterations, evidence boundaries, and literature inspirations."
            )} />
          </p>
        </div>
        <a href="#methodology-organic-acid-final-screening" style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", fontSize: 12, fontWeight: 900, padding: "8px 11px", textDecoration: "none" }}>
          {text(lang, "返回方法论", "Back to methodology")}
        </a>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {stats.map(([label, value]) => (
          <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 5, padding: 10 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.15 }}><ChemicalText value={value} /></strong>
          </article>
        ))}
      </div>

      <section id="methodology-version-timeline" style={{ display: "grid", gap: 10, scrollMarginTop: 118 }}>
        <VersionTimeline versions={versions} selectedVersion={selectedVersion} onSelect={setSelectedVersion} lang={lang} t={t} isMobile={isMobile} />
      </section>

      <section id="methodology-version-detail" style={{ scrollMarginTop: 118 }}>
        <VersionDetailCard version={selected} lang={lang} t={t} />
      </section>

      <LiteratureInspirationPanel version={selected} literatureRecords={literatureRecords} lang={lang} t={t} isMobile={isMobile} />

      <VersionSourceMap versions={versions} literatureRecords={literatureRecords} lang={lang} t={t} isMobile={isMobile} />

      <section id="methodology-version-roadmap" style={{ scrollMarginTop: 118 }}>
        <VersionRoadmapCard roadmap={versionDocs.roadmap || []} lang={lang} t={t} />
      </section>

      <section id="methodology-version-boundary" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "grid", gap: 6, fontSize: 12.3, lineHeight: 1.55, padding: 11, scrollMarginTop: 118 }}>
        <strong style={{ color: t.warn }}>{text(lang, "证据边界提示", "Evidence Boundary Notice")}</strong>
        <ChemicalText value={text(lang, versionDocs.evidenceBoundaryZh, versionDocs.evidenceBoundary)} />
      </section>
    </section>
  )
}
