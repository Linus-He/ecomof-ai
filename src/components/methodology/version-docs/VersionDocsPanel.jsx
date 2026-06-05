// @ts-nocheck
import { useMemo, useState } from "react"
import versionDocs from "../../../../public/data/organic_acid_final_screening/version_docs.json"
import { ChemicalText } from "../../../shared"
import { VersionDetailCard } from "./VersionDetailCard"
import { VersionRoadmapCard } from "./VersionRoadmapCard"
import { VersionTimeline } from "./VersionTimeline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const VERSION_DOCS_DIRECTORY = {
  id: "methodology-version-docs",
  label: "Version Docs",
  labelZh: "版本文档",
  level: 1,
  display: "版本文档",
  children: [
    { id: "methodology-version-timeline", label: "Version Timeline", labelZh: "版本时间轴" },
    { id: "methodology-version-detail", label: "Selected Version Detail", labelZh: "选中版本详情" },
    { id: "methodology-version-roadmap", label: "Future Roadmap", labelZh: "未来路线图" },
  ],
}

export function VersionDocsPanel({ lang, t, isMobile }) {
  const versions = versionDocs.versions || []
  const [selectedVersion, setSelectedVersion] = useState(versions.find(row => row.status === "current")?.version || versions[0]?.version)
  const selected = useMemo(() => versions.find(row => row.version === selectedVersion) || versions[0], [versions, selectedVersion])

  return (
    <section id="methodology-version-docs" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5, maxWidth: 820 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Version Docs</span>
          <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "版本文档", "Version Docs")}
          </h2>
          <p style={{ color: t.muted, fontSize: 12.7, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "记录 Organic Acid Final Screening 从基础算法、稳健性审计、算法旅程、证据层到耦合热区图的迭代关系，并保留每一版的证据边界。",
              "Tracks Organic Acid Final Screening from core workflow, robustness audit, algorithm journey, evidence layer, and coupled hot spot map while preserving each version's evidence boundary."
            )} />
          </p>
        </div>
        <a href="#methodology-organic-acid-final-screening" style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", fontSize: 12, fontWeight: 900, padding: "8px 11px", textDecoration: "none" }}>
          {text(lang, "返回有机酸最终筛选方法论", "Back to Organic Acid Final Methodology")}
        </a>
      </header>

      <section id="methodology-version-timeline" style={{ display: "grid", gap: 10, scrollMarginTop: 118 }}>
        <VersionTimeline versions={versions} selectedVersion={selectedVersion} onSelect={setSelectedVersion} lang={lang} t={t} isMobile={isMobile} />
      </section>

      <section id="methodology-version-detail" style={{ scrollMarginTop: 118 }}>
        <VersionDetailCard version={selected} lang={lang} t={t} />
      </section>

      <section id="methodology-version-roadmap" style={{ scrollMarginTop: 118 }}>
        <VersionRoadmapCard roadmap={versionDocs.roadmap || []} lang={lang} t={t} />
      </section>
    </section>
  )
}
