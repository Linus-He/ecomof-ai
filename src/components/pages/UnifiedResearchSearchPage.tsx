// @ts-nocheck
import { interfaceText } from "../../utils/interfaceLocale"
import { UnifiedResearchSearch } from "../home"
import { useLang } from "../../contexts"
import { useState } from "react"
import { Pause, Play } from "@phosphor-icons/react"
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
  const [paused, setPaused] = useState(false)
  return (
    <div className="unified-search-page" data-motion-paused={paused}>
      <UnifiedResearchSearch onNavigate={onNavigate} />
      <section className="search-release-editorial" aria-label={l("Release highlights", "更新日志精选")}>
        <div className="search-release-heading">
          <h2>{l("Latest updates", "最新动态")}</h2>
          <a href="#release-notes">{l("All updates", "全部更新日志")} ↗</a>
        </div>
        <div className="search-release-grid">
          {releases.map((release, index) => (
            <article key={release.version} className={`search-release-story search-release-story--${index}`}>
              <div className="editorial-cover">
              <a href={`#${release.hash}`} onClick={event => { event.preventDefault(); onNavigate(release.hash, { resetScroll: true }) }} className="search-release-image" aria-label={storyText(release, "title")}>
                <img src={`${import.meta.env.BASE_URL}images/search-release-${release.image}.png`} alt={zh ? ["星空中的晶体网络概念插图", "悬浮的晶体单元概念插图", "粒子轨迹概念插图"][release.image] : ["Crystal constellation illustration", "Floating crystal cells illustration", "Particle orbit illustration"][release.image]} loading="lazy" />
              </a>
              <button className="cover-motion-toggle" type="button" aria-label={paused ? l("Play cover animation", "播放封面动画") : l("Pause cover animation", "暂停封面动画")} onClick={() => setPaused(value => !value)}>{paused ? <Play weight="fill" /> : <Pause weight="fill" />}</button>
              </div>
              <h3><a href={`#${release.hash}`} onClick={event => { event.preventDefault(); onNavigate(release.hash, { resetScroll: true }) }}>{storyText(release, "title")}</a></h3>
              <div className="search-release-meta"><span>{release.version}</span><time dateTime={release.date}>{release.date}</time></div>
              {index === 0 && <p>{storyText(release, "intro")}</p>}
            </article>
          ))}
        </div>
      </section>
      <section className="search-research-editorial" aria-labelledby="latest-research-title">
        <div className="search-release-heading"><h2 id="latest-research-title">{l("Latest research", "最新研究")}</h2><a href="https://www.nature.com/subjects/metal-organic-frameworks" target="_blank" rel="noreferrer">{l("View all", "查看全部")} ↗</a></div>
        <div className="search-research-grid">
          {recentMofResearch.map((paper, index) => <article className="search-release-story" key={paper.id}>
            <a className="search-release-image" href={`#research-article-${paper.id}`} onClick={event => { event.preventDefault(); onNavigate(`research-article-${paper.id}`, { resetScroll: true }) }}><img src={`${import.meta.env.BASE_URL}images/search-research-${index}.png`} alt={l("Conceptual MOF illustration, not experimental data", "MOF 研究概念插图，非实验图")} loading="lazy" /></a>
            <h3><a href={`#research-article-${paper.id}`} onClick={event => { event.preventDefault(); onNavigate(`research-article-${paper.id}`, { resetScroll: true }) }}>{local?.research[index][0] || paper.title[zh ? 0 : 1]}</a></h3>
            <div className="search-release-meta"><span>{l(paper.kind[1], paper.kind[0])}</span><time dateTime={paper.date}>{paper.date}</time></div>
            <p>{local?.research[index][1] || paper.summary[zh ? 0 : 1]}</p><small>{paper.journal}</small>
          </article>)}
        </div>
        <p className="research-edition-note">{l("Selected publications · Checked 2026-09-07 · Conceptual cover illustrations", "文献精选 · 核对日期 2026-09-07 · 封面为概念插图")}</p>
      </section>
    </div>
  )
}
