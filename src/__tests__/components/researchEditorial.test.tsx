import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ResearchArticlePage } from "../../components/pages/ResearchArticlePage"
import { UpdateStoryPage } from "../../components/pages/UpdateStoryPage"
import { recentMofResearch } from "../../data/recentMofResearch"
import { researchArticles } from "../../data/researchArticles"
import { recentUpdateStories } from "../../data/recentUpdateStories"
import { resolveTabForHash } from "../../config/navigationRegistry"
import releaseLog from "../../../public/data/app_release_log.json"

describe("research editorials and current release stories", () => {
  it.each(recentMofResearch)("opens $id internally with sources and a long-form labelled analysis", paper => {
    expect(resolveTabForHash(`research-article-${paper.id}`)).toBe("researchArticle")
    render(<ResearchArticlePage hash={`research-article-${paper.id}`} />)
    expect(screen.getByRole("link", { name: `DOI: ${paper.doi} ↗` })).toHaveAttribute("href", `https://doi.org/${paper.doi}`)
    expect(screen.getByRole("link", { name: "Original paper ↗" })).toHaveAttribute("target", "_blank")
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(researchArticles.find(item => item.id === paper.id)!.sections.length + 1)
    expect(screen.getAllByRole("heading", { level: 2 }).some(heading => /^0[4-5] · /.test(heading.textContent || ""))).toBe(true)
  })
  it.each(recentUpdateStories)("keeps $version narrative and release metadata in sync", story => {
    expect(resolveTabForHash(story.hash)).toBe("updateStory")
    const entry = releaseLog.releases.find(item => item.appVersion === story.version)
    expect(entry?.date).toBe(story.date)
    expect(entry?.headline.en).toBe(story.title[1])
    render(<UpdateStoryPage hash={story.hash} />)
    expect(screen.getByRole("heading", {level:1})).toHaveTextContent(story.title[1])
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
  it("does not route an unknown article to an unrelated paper", () => {
    render(<ResearchArticlePage hash="research-article-missing" />)
    expect(screen.getByText("Research article not found")).toBeInTheDocument()
  })
})
