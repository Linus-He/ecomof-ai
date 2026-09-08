// @ts-nocheck
import { useLang } from "../../contexts"
import { editorialLocales } from "../../data/editorialLocales"
import { updateStories } from "../../data/updateStories"

export function UpdateStoryPage({ hash }) {
  const { lang, locale } = useLang()
  const i = lang === "zh" ? 0 : 1
  const story = updateStories.find(item => item.hash === hash) || updateStories[0]
  const local = editorialLocales[locale]
  const translated = local?.stories[updateStories.indexOf(story)]
  const label = (n, zh, en) => local?.labels[n] || (i === 0 ? zh : en)
  return <article className="update-story-page">
    <header><a href="#unified-search">{label(0, "最新动态", "Latest updates")}</a><p><time dateTime={story.date}>{story.date}</time> · {story.version}</p><h1>{translated?.title || story.title[i]}</h1><p className="update-story-deck">{translated?.intro || story.intro[i]}</p></header>
    <figure><img src={`${import.meta.env.BASE_URL}images/search-release-${story.image}.png`} alt={i === 0 ? "研究进展概念插图" : "Research progress conceptual illustration"} /><figcaption>{label(1, "概念插图", "Conceptual illustration")}</figcaption></figure>
    <div className="update-story-body">
      {story.sections.map((section, index) => <section key={section.title[0]}><h2>{translated?.sections[index][0] || section.title[i]}</h2><p>{translated?.sections[index][1] || section.body[i]}</p>{index === 0 && <div className="update-story-table"><table><caption>{label(2, "这次更新改变了什么", "What changed in this release")}</caption><thead><tr>{(local ? local.labels.slice(3, 6) : i === 0 ? ["维度", "更新前", "更新后"] : ["Area", "Before", "After"]).map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{story.comparison.map((row, rowIndex) => <tr key={row[0]}><th scope="row">{translated?.comparison[rowIndex][0] || row[i]}</th><td>{translated?.comparison[rowIndex][1] || row[2 + i]}</td><td>{translated?.comparison[rowIndex][2] || row[4 + i]}</td></tr>)}</tbody></table></div>}</section>)}
      <aside><h2>{label(6, "继续查阅", "Explore further")}</h2><p>{local?.source || (i === 0 ? `本文依据 ${story.version} 已有发布记录撰写，总结界面与文档变化；未引入未经测量的速度或准确率对比。` : `Based on the existing ${story.version} release record. Comparisons describe interface and documentation changes, not unmeasured speed or accuracy gains.`)}</p><a href="#release-notes">{label(7, "原始更新日志", "Original release notes")} ↗</a> · <a href="#methodology">{label(8, "方法论", "Methodology")} ↗</a></aside>
    </div>
  </article>
}
