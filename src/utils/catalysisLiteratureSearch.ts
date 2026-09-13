import catalog from "../../public/data/catalysis_v2/catalysis_literature_catalog_v1.json"

export const catalysisLiterature = catalog.records
export const normalizeResearchQuery = (value: unknown) => String(value ?? "").normalize("NFKC").toLowerCase().replace(/https?:\/\/(?:dx\.)?doi\.org\//g, "").replace(/[\s\p{P}\p{S}]+/gu, "")

export function scoreResearchDocument(document: any, query: string) {
  const needle = normalizeResearchQuery(query)
  if (!needle) return 0
  if (document.doi && normalizeResearchQuery(document.doi) === needle) return 120
  const title = normalizeResearchQuery(`${document.titleZh} ${document.titleEn}`)
  if (title.includes(needle)) return 80
  if (normalizeResearchQuery(document.keywords).includes(needle)) return 58
  if (normalizeResearchQuery(`${document.bodyZh || ""} ${document.bodyEn || ""}`).includes(needle)) return 38
  return 0
}

export const catalysisSearchDocuments = catalysisLiterature.map(paper => ({
  id: paper.id, kind: "literature", doi: paper.doi, paper,
  titleZh: "titleZh" in paper ? `${paper.titleZh} · ${paper.title}` : paper.title,
  titleEn: paper.title,
  bodyZh: `${paper.journal} · ${paper.year} · ${paper.summaryZh}`,
  bodyEn: `${paper.journal} · ${paper.year} · ${paper.summaryEn}`,
  hash: "catalysis-literature-verification",
  keywords: `${paper.title} ${paper.doi} ${paper.journal} ${paper.year} ${paper.keywords} 催化 文献 catalysis literature`,
}))
