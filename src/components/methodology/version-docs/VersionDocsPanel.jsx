// @ts-nocheck
import { useMemo, useState } from "react"
import knowledgeBaseIndex from "../../../../public/data/organic_acid_final_screening/knowledge_base_index.json"
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
  id: "methodology-knowledge-base",
  label: "Knowledge Base",
  labelZh: "知识库",
  level: 1,
  display: "知识库",
  children: [
    { id: "methodology-knowledge-hero", label: "Knowledge Base Hero", labelZh: "知识库概览" },
    { id: "methodology-version-timeline", label: "Version History", labelZh: "版本历史" },
    { id: "methodology-version-detail", label: "Selected Version Detail", labelZh: "选中版本详情" },
    { id: "methodology-literature-library", label: "Literature Library", labelZh: "文献库" },
    { id: "methodology-inspiration-map", label: "Inspiration Map", labelZh: "灵感映射" },
    { id: "methodology-version-source-map", label: "Version ↔ Literature ↔ Module Matrix", labelZh: "版本 ↔ 文献 ↔ 模块矩阵" },
    { id: "methodology-evidence-boundary-legend", label: "Evidence Boundary Legend", labelZh: "证据边界图例" },
    { id: "methodology-version-roadmap", label: "Future Knowledge Gaps", labelZh: "后续知识缺口" },
  ],
}

function LiteratureLibraryPanel({ records = [], lang, t, isMobile }) {
  const [filter, setFilter] = useState("all")
  const filters = [
    ["all", "All", "全部"],
    ["descriptor", "Descriptor design", "描述符设计"],
    ["hot-spot-map", "Hot spot map", "热区图"],
    ["evidence-boundary", "Evidence boundary", "证据边界"],
    ["data-mapper", "Data mapper", "数据映射"],
    ["validation", "Validation workflow", "验证路线"],
    ["mof-catalysis", "MOF catalysis mechanism", "MOF 催化机制"],
    ["gas-separation", "Gas separation screening", "气体分离筛选"],
  ]
  const visible = records.filter(record => {
    if (filter === "all") return true
    const haystack = [...(record.knowledgeTags || []), ...(record.inspiredModules || []), record.coreIdea, record.title].join(" ").toLowerCase()
    return haystack.includes(filter) || (filter === "descriptor" && haystack.includes("descriptor")) || (filter === "validation" && haystack.includes("validation")) || (filter === "mof-catalysis" && haystack.includes("catalysis")) || (filter === "gas-separation" && haystack.includes("separation"))
  })

  return (
    <section id="methodology-literature-library" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Literature Library</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{text(lang, "文献库", "Literature Library")}</h3>
        <p style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.55, margin: 0 }}>
          <ChemicalText value={text(
            lang,
            "文献库记录上传论文如何启发 EcoMOF-AI 的工作流、描述符、证据边界和验证路线；它不是证明 EcoMOF-AI 结果的参考文献列表。",
            "The library records how uploaded papers inspire EcoMOF-AI workflow, descriptors, evidence boundaries, and validation strategy. It is not a reference list proving EcoMOF-AI results."
          )} />
        </p>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {filters.map(([id, en, zh]) => {
          const active = filter === id
          return (
            <button key={id} type="button" onClick={() => setFilter(id)} style={{ background: active ? t.accent : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 999, color: active ? t.buttonText || "#fff" : t.textStrong, cursor: "pointer", fontSize: 11.5, fontWeight: 900, padding: "6px 9px" }}>
              {text(lang, zh, en)}
            </button>
          )
        })}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {visible.map(record => (
          <article key={record.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
            <span style={{ color: record.status === "verified_from_uploaded_file" ? t.accentText : t.warn, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{record.status}</span>
            <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.32 }}><ChemicalText value={record.title} /></strong>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 4, lineHeight: 1.42 }}>
              <span>{text(lang, "作者", "Authors")}: <ChemicalText value={record.authors || "pending metadata"} /></span>
              <span>{text(lang, "年份 / 期刊", "Year / Journal")}: <ChemicalText value={`${record.year || "pending"} / ${record.journal || "pending metadata"}`} /></span>
              <span>DOI: <strong style={{ color: record.doi ? t.textStrong : t.warn }}>{record.doi || "pending metadata"}</strong></span>
              <span>{text(lang, "启发版本", "Inspired versions")}: {(record.inspiredVersions || []).join(" / ")}</span>
              <span>{text(lang, "证据角色", "Evidence role")}: {record.evidenceRole || "design_inspiration"}</span>
              <span>{text(lang, "上传文件", "Uploaded files")}: {(record.uploadedFileRefs || []).join(" / ")}</span>
              {(record.duplicateFileRefs || []).length ? <span>{text(lang, "重复文件", "Duplicate files")}: {record.duplicateFileRefs.join(" / ")}</span> : null}
            </div>
            <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.48, margin: 0 }}><ChemicalText value={text(lang, record.coreIdeaZh, record.coreIdea)} /></p>
            <p style={{ color: t.warn, fontSize: 11.9, fontWeight: 850, lineHeight: 1.45, margin: 0 }}><ChemicalText value={text(lang, record.adaptationBoundaryZh, record.adaptationBoundary)} /></p>
          </article>
        ))}
      </div>
    </section>
  )
}

function InspirationMapPanel({ records = [], lang, t }) {
  const rows = records.flatMap(record => (record.inspiredModules || []).slice(0, 4).map(module => ({
    id: `${record.id}-${module}`,
    source: record.journal ? `${record.journal} ${record.year || ""}`.trim() : record.title,
    module,
    versions: (record.inspiredVersions || []).join(" / "),
    boundary: record.adaptationBoundary,
    boundaryZh: record.adaptationBoundaryZh,
  })))
  return (
    <section id="methodology-inspiration-map" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Inspiration Map</span>
        <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{text(lang, "灵感映射", "Inspiration Map")}</h3>
      </header>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map(row => (
          <article key={row.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 1fr)", padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.7, lineHeight: 1.3 }}><ChemicalText value={`${row.source} -> ${row.module} -> ${row.versions}`} /></strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}><ChemicalText value={text(lang, row.boundaryZh, row.boundary)} /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

function EvidenceBoundaryLegend({ lang, t }) {
  const rows = knowledgeBaseIndex.evidenceRoleLegend || []
  return (
    <section id="methodology-evidence-boundary-legend" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 12, display: "grid", gap: 10, padding: 14, scrollMarginTop: 118 }}>
      <strong style={{ color: t.warn, fontSize: 14 }}>{text(lang, "证据边界图例", "Evidence Boundary Legend")}</strong>
      <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>
        <ChemicalText value={text(lang, knowledgeBaseIndex.boundaryZh, knowledgeBaseIndex.boundary)} />
      </p>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.role} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12 }}>{row.role}</strong>
            <span style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.42 }}><ChemicalText value={row.meaning} /></span>
          </article>
        ))}
      </div>
    </section>
  )
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
      [text(lang, "文献记录", "Literature records"), `${knowledgeBaseIndex.uniqueLiteratureRecords} unique / ${knowledgeBaseIndex.uploadedFileCount} files`],
      [text(lang, "已核验 DOI", "Verified DOI records"), `${verified}`],
      [text(lang, "Pending metadata", "Pending metadata"), `${knowledgeBaseIndex.stats?.pendingMetadataRecords ?? 0}`],
      [text(lang, "计划版本", "Planned versions"), (versionDocs.roadmap || []).map(row => row.version).join(" / ")],
    ]
  }, [lang, selected])

  return (
    <section id="methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 14, padding: 14, scrollMarginTop: 118 }}>
      <span id="methodology-version-docs" style={{ height: 0, overflow: "hidden", scrollMarginTop: 118 }} />
      <header id="methodology-knowledge-hero" style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", scrollMarginTop: 118 }}>
        <div style={{ display: "grid", gap: 5, maxWidth: 820 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Knowledge Base</span>
          <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "知识库", "Knowledge Base")}
          </h2>
          <p style={{ color: t.muted, fontSize: 12.7, lineHeight: 1.58, margin: 0 }}>
            <ChemicalText value={text(
              lang,
              "记录版本演进、文献灵感、方法迁移边界与证据状态的结构化知识库。",
              "A structured record of version history, literature inspirations, method adaptation boundaries, and evidence status."
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

      <LiteratureLibraryPanel records={literatureRecords} lang={lang} t={t} isMobile={isMobile} />

      <InspirationMapPanel records={literatureRecords} lang={lang} t={t} />

      <LiteratureInspirationPanel version={selected} literatureRecords={literatureRecords} lang={lang} t={t} isMobile={isMobile} />

      <VersionSourceMap versions={versions} literatureRecords={literatureRecords} lang={lang} t={t} isMobile={isMobile} />

      <EvidenceBoundaryLegend lang={lang} t={t} />

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
