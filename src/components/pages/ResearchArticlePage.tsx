/// <reference types="vite/client" />
import { useLang } from "../../contexts"
import { recentMofResearch } from "../../data/recentMofResearch"
import { researchArticles } from "../../data/researchArticles"

export function ResearchArticlePage({ hash }: { hash: string }) {
  const { lang, locale } = useLang()
  const i = lang === "zh" ? 0 : 1
  const id = hash.replace(/^research-article-/, "")
  const article = researchArticles.find(item => item.id === id)
  const index = recentMofResearch.findIndex(item => item.id === id)
  const paper = recentMofResearch[index]
  if (!article || !paper) return <section><h1>{i === 0 ? "未找到研究解读" : "Research article not found"}</h1><a href="#unified-search">{i === 0 ? "返回首页" : "Back to home"}</a></section>
  return <article className="update-story-page research-article-page">
    <header>
      <a href="#unified-search">{i === 0 ? "最新研究" : "Latest research"}</a>
      <div className="research-article-sources" aria-label={i === 0 ? "原文与 DOI" : "Paper and DOI"}>
        <a href={article.sourceUrl} target="_blank" rel="noreferrer">{i === 0 ? "论文原文" : "Original paper"} ↗</a>
        <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">DOI: {paper.doi} ↗</a>
        {article.repositoryUrl && <a href={article.repositoryUrl} target="_blank" rel="noreferrer">{i === 0 ? "机构档案" : "Institutional record"} ↗</a>}
      </div>
      <p>{article.category[i]} · {i === 0 ? "本站研究解读" : "EcoMOF-AI interpretation"}</p>
      <h1>{paper.title[i]}</h1><p className="update-story-deck">{paper.summary[i]}</p>
      <p>{paper.journal} · <time dateTime={paper.date}>{paper.date}</time> · {i === 0 ? "解读更新于 2026-09-08" : "Interpretation updated 2026-09-08"}</p>
      {locale && ["ja", "ko", "es"].includes(locale) && <p lang="en">Full interpretation currently available in Chinese and English.</p>}
    </header>
    <figure><img src={`${import.meta.env.BASE_URL}images/search-research-${index}.png`} alt={i === 0 ? "MOF 研究概念插图，非实验图" : "Conceptual MOF illustration, not experimental data"} /><figcaption>{i === 0 ? "概念插图，不代表论文实验数据" : "Conceptual illustration, not a figure from the paper"}</figcaption></figure>
    <div className="update-story-body">
      <nav className="research-article-contents" aria-label={i === 0 ? "文章目录" : "Article contents"}>{article.sections.map((s, n) => <a key={n} href={`#research-section-${id}-${n}`} onClick={event => { event.preventDefault(); document.getElementById(`research-section-${id}-${n}`)?.scrollIntoView({ block: "start" }) }}>{s.title[i]}</a>)}</nav>
      {article.sections.map((s, n) => <section id={`research-section-${id}-${n}`} key={n}><h2>{s.title[i]}</h2><p>{s.body[i]}</p></section>)}
      <aside><h2>{i === 0 ? "来源与撰写说明" : "Source and editorial note"}</h2><p>{article.authors} {article.sourceTitle}. {paper.journal}, {paper.date}. DOI: {paper.doi}.</p><p>{i === 0 ? "由 EcoMOF-AI 基于可访问的公开摘要与书目记录重新组织撰写。研究意义部分是本站解读，不是原作者声明；本文不替代原论文或独立验证。" : "Written by EcoMOF-AI from accessible public abstracts and bibliographic records. Significance sections are our interpretation, not statements by the authors. This article does not replace the paper or independent validation."}</p></aside>
    </div>
  </article>
}
