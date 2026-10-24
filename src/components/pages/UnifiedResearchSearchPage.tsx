// @ts-nocheck
import { NobelChemistryFeature } from "../home/NobelChemistryFeature"
import { PredictionMarketsFeature } from "../home/PredictionMarketsFeature"
import { interfaceText } from "../../utils/interfaceLocale"
import { UnifiedResearchSearch } from "../home"
import { useLang } from "../../contexts"
import { ArrowRight } from "@phosphor-icons/react"
import { recentMofResearch } from "../../data/recentMofResearch"
import { updateStories } from "../../data/updateStories"
import { editorialLocales } from "../../data/editorialLocales"


export function UnifiedResearchSearchPage({ onNavigate }) {
  const { lang, locale } = useLang()
  const l = (en, zh = en) => interfaceText(locale, en, zh)
  const zh = lang === "zh"
  const local = editorialLocales[locale]
  const releases = updateStories.slice(0, 3)
  const storyText = (story, field) => {
    const n = ["update-research-progress", "update-research-canvas", "update-methods"].indexOf(story.hash)
    return local?.stories[n]?.[field] || story[field][zh ? 0 : 1]
  }
  return (
    <div className="unified-search-page">
      <UnifiedResearchSearch onNavigate={onNavigate} />
      <NobelChemistryFeature />
      <PredictionMarketsFeature />
      <section className="search-release-editorial search-release-compact" aria-label={l("Release highlights", "更新日志精选")}>
        <div className="search-release-heading"><h2>{l("Latest updates", "最新动态")}</h2><a href="#release-notes">{l("All updates", "全部更新日志")} <ArrowRight size={17} /></a></div>
        <div className="search-release-grid">{releases.map(release => <article className="search-release-story" key={release.version}>
          <span className="search-release-version">{release.version}</span>
          <h3><a href={`#${release.hash}`} onClick={event => { event.preventDefault(); onNavigate(release.hash, { resetScroll: true }) }}>{storyText(release, "title")} <ArrowRight size={16} /></a></h3>
          <p>{storyText(release, "intro")}</p>
        </article>)}</div>
      </section>
      <section className="search-research-editorial" aria-labelledby="latest-research-title">
        <div className="search-release-heading"><h2 id="latest-research-title">{l("Latest research", "最新研究")}</h2><a href="#research-article-molecular-fans">{l("Read research", "阅读研究")} <ArrowRight size={17} /></a></div>
        <div className="search-research-grid">
          {recentMofResearch.map((paper, index) => <article className="search-release-story" key={paper.id}>
            <h3><a href={`#research-article-${paper.id}`} onClick={event => { event.preventDefault(); onNavigate(`research-article-${paper.id}`, { resetScroll: true }) }}>{local?.research[index][0] || paper.title[zh ? 0 : 1]}</a></h3>
            <div className="search-release-meta"><span>{l(paper.kind[1], paper.kind[0])}</span><span>{paper.date.slice(0, 4)}</span><span className="research-field-keywords">{paper.fieldKeywords[zh ? 0 : 1].join(" · ")}</span></div>
            <p>{local?.research[index][1] || paper.summary[zh ? 0 : 1]}</p><small>{paper.journal}</small>
          </article>)}
        </div>
        <p className="research-edition-note">{l("Selected publications · Sources in each article", "文献精选 · 来源可在各篇文章中查阅")}</p>
      </section>
    </div>
  )
}
