// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import database from "../../../public/data/catalysis_v2/catalysis_reaction_database_v2.json"
import queue from "../../../public/data/catalysis_v2/catalysis_candidate_queue_v1.json"
import additions from "../../../data/curation/catalysis/literature-additions-v1.json"
import { catalysisSearchDocuments, scoreResearchDocument } from "../../utils/catalysisLiteratureSearch"
import { THEME_LIGHT } from "../../constants/theme"
import { UnifiedResearchSearch } from "../../components/home/UnifiedResearchSearch"
import { CatalysisLiteratureCatalog } from "../../components/catalysis/CatalysisLiteraturePreview"

vi.mock("../../shared", () => ({ useT: () => ({}), useLang: () => ({ lang: "zh", locale: "zh" }) }))
vi.mock("../../components/home/MaterialSearchResults", () => ({ MaterialSearchResults: () => null }))

describe("catalysis literature search and previews", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterAll(() => vi.unstubAllGlobals())
  it("keeps every formal, candidate and added DOI in the shared homepage catalog", () => {
    const sources = [...database.tables.sourceDocuments, ...queue.candidates, ...queue.navigationCandidates, ...additions.records]
    expect(new Set(catalysisSearchDocuments.map(row => row.doi)).size).toBe(catalysisSearchDocuments.length)
    for (const source of sources) {
      const match = catalysisSearchDocuments.find(row => row.doi === source.doi.toLowerCase())
      expect(match, source.doi).toBeTruthy()
      expect(scoreResearchDocument(match, source.title)).toBeGreaterThan(0)
      expect(scoreResearchDocument(match, `https://doi.org/${source.doi.toUpperCase()}`)).toBe(120)
    }
    expect(additions.records.every(row => !row.compareEligible && !row.trainingEligible)).toBe(true)
  })

  it("enables the green send state only for nonblank input", () => {
    render(<UnifiedResearchSearch />)
    const input = screen.getByRole("textbox", { name: "搜索所有资料、功能与版块" })
    const send = screen.getByRole("button", { name: "提交搜索" })
    expect(send).toBeDisabled()
    fireEvent.change(input, { target: { value: "MOF" } })
    expect(send).toBeEnabled()
    expect(send).toHaveAttribute("data-ready", "true")
    fireEvent.change(input, { target: { value: "   " } })
    expect(send).toBeDisabled()
    expect(send).toHaveAttribute("data-ready", "false")
  })

  it("finds all publications by DOI through the actual homepage input", () => {
    render(<UnifiedResearchSearch onNavigate={vi.fn()} />)
    const input = screen.getByRole("textbox", { name: "搜索所有资料、功能与版块" })
    for (const paper of catalysisSearchDocuments) {
      fireEvent.change(input, { target: { value: paper.doi } })
      expect(screen.getByRole("heading", { name: paper.titleZh })).toBeVisible()
    }
  })

  it("opens and closes a correction-aware preview without navigating away", () => {
    const onNavigate = vi.fn()
    render(<UnifiedResearchSearch onNavigate={onNavigate} />)
    fireEvent.change(screen.getByRole("textbox", { name: "搜索所有资料、功能与版块" }), { target: { value: "耐酸" } })
    fireEvent.click(screen.getByRole("button", { name: "简短预览" }))
    expect(onNavigate).not.toHaveBeenCalled()
    expect(screen.getByTestId("catalysis-literature-preview")).toHaveTextContent("作者更正（2024-10-02）")
    expect(screen.getByRole("link", { name: "打开 DOI 原文 ↗" })).toHaveAttribute("href", "https://doi.org/10.1038/s41467-024-51475-7")
    fireEvent.click(screen.getByRole("button", { name: "收起预览" }))
    expect(screen.queryByTestId("catalysis-literature-preview")).not.toBeInTheDocument()
  })

  it("does not truncate literature matches after the first eight", () => {
    render(<UnifiedResearchSearch />)
    fireEvent.change(screen.getByRole("textbox", { name: "搜索所有资料、功能与版块" }), { target: { value: "催化 文献" } })
    expect(screen.getAllByRole("button", { name: "简短预览" })).toHaveLength(catalysisSearchDocuments.length)
  })

  it("supports keyword filtering and an empty result state in the literature center", () => {
    render(<CatalysisLiteratureCatalog t={THEME_LIGHT} />)
    const input = screen.getByRole("searchbox")
    fireEvent.change(input, { target: { value: "Bi@NC" } })
    expect(screen.getByRole("status")).toHaveTextContent("1 / 24")
    expect(screen.getByText(/新增文献 · 字段待核对/)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: "no-such-publication-123" } })
    expect(screen.getByText("没有匹配的文献，请尝试题名或 DOI。")).toBeVisible()
  })
})
