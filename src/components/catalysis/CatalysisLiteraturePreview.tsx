// @ts-nocheck
import { useState } from "react"
import { catalysisSearchDocuments, scoreResearchDocument } from "../../utils/catalysisLiteratureSearch"

export function CatalysisLiteraturePreview({ paper, lang = "zh", showTitle = true }) {
  const zh = lang === "zh"
  return <div data-testid="catalysis-literature-preview" style={{ display: "grid", gap: 8, lineHeight: 1.65, overflowWrap: "anywhere" }}>
    {showTitle && <strong>{paper.title}</strong>}
    <small>{paper.journal} · {paper.year} · DOI: {paper.doi}</small>
    <p style={{ margin: 0 }}>{zh ? paper.summaryZh : paper.summaryEn}</p>
    <small>{zh ? "预览为编写的研究概述，并非原文摘要。文献收录不代表实验数值、结构身份或训练许可已核验。" : "This is an editorial research overview, not the original abstract. Inclusion does not verify numeric claims, structure identity or training permission."}</small>
    <small>{zh ? "概述依据：" : "Overview basis: "}{paper.verificationBasis === "curated-reaction-database" ? (zh ? "现有反应记录" : "Curated reaction records") : paper.verificationBasis?.includes("publisher") ? (zh ? "出版社页面或检索摘要" : "Publisher page or indexed abstract") : (zh ? "题名与元数据" : "Title and metadata")}{paper.checkedAt ? ` · ${String(paper.checkedAt).slice(0, 10)}` : ""}</small>
    <a href={paper.doiUrl} target="_blank" rel="noreferrer">{zh ? "打开 DOI 原文" : "Open DOI source"} ↗</a>
  </div>
}

export function CatalysisLiteratureCatalog({ lang = "zh", t }) {
  const zh = lang === "zh"
  const [query, setQuery] = useState("")
  const rows = catalysisSearchDocuments.filter(row => !query.trim() || scoreResearchDocument(row, query) > 0)
  return <div className="catalysis-research cr-literature-catalog" style={{ display: "grid", gap: 12, color: t.text }}>
    <p style={{ margin: 0, color: t.muted }}>{zh ? "文献目录与首页共用检索条目；已整理反应记录、候选文献与新增文献分别标明。展开可快速预览研究内容和使用边界。" : "This catalog shares its search entries with the homepage. Curated records, candidates and additions are labelled separately. Expand an entry for a brief overview and evidence boundaries."}</p>
    <input type="search" aria-label={zh ? "搜索文献题名、DOI 或关键词" : "Search literature titles, DOI or keywords"} value={query} onChange={event => setQuery(event.target.value)} placeholder={zh ? "题名、DOI、材料或中英文关键词" : "Title, DOI, material or keywords"} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.text, padding: 12, width: "100%", boxSizing: "border-box" }} />
    <span role="status">{zh ? `${rows.length} / ${catalysisSearchDocuments.length} 篇文献` : `${rows.length} / ${catalysisSearchDocuments.length} publications`}</span>
    {rows.map(row => <details key={row.id} data-layer={row.paper.layer} style={{ border: `1px solid ${t.border}`, borderRadius: 6, padding: 12, overflowWrap: "anywhere" }}>
      <summary style={{ cursor: "pointer", lineHeight: 1.6 }}>{zh ? row.titleZh : row.titleEn}<br /><small>{row.paper.journal} · {row.paper.year} · {row.paper.layer === "curated" ? (zh ? "已有反应记录" : "Reaction records available") : row.paper.layer === "addition" ? (zh ? "新增文献 · 字段待核对" : "New literature · fields pending") : (zh ? "候选文献 · 待核对" : "Candidate · review pending")} · {zh ? "简短预览" : "Brief preview"}</small></summary>
      <div style={{ paddingTop: 12 }}><CatalysisLiteraturePreview paper={row.paper} lang={lang} showTitle={false} /></div>
    </details>)}
    {!rows.length && <p>{zh ? "没有匹配的文献，请尝试题名或 DOI。" : "No matching publications. Try a title or DOI."}</p>}
  </div>
}
