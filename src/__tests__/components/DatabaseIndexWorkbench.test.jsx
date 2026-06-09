// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DatabaseIndexWorkbench } from "../../components/database-index/DatabaseIndexWorkbench"

const manifest = {
  version: "V2.0-A",
  datasetMode: "database_index_preview",
  buildDate: "2026-06-07",
  sourceDatabases: [
    { name: "CoRE MOF", recordCount: 500, detailCount: 30 },
    { name: "QMOF", recordCount: 200, detailCount: 20 },
  ],
  files: {
    coreSummary: "core_mof_index_summary.json",
    qmofSummary: "qmof_index_summary.json",
    needsReviewSummary: "rejected_and_needs_review_summary.json",
    buildReport: "index_build_report.json",
  },
  indexParts: {
    coreMof: ["core_mof_index_parts/core_mof_index_part_001.json"],
    qmof: [],
  },
  detailBasePaths: { framework: "detail/framework/" },
  warnings: ["not full database screening"],
}

function responseFor(url) {
  const path = String(url)
  if (path.endsWith("manifest.json")) return manifest
  if (path.endsWith("core_mof_index_summary.json")) return { recordCount: 500, alContainingCount: 120, readyForScoring: 12, needsReview: 63, rejected: 0 }
  if (path.endsWith("qmof_index_summary.json")) return { recordCount: 200 }
  if (path.endsWith("organic_acid_descriptor_availability.json")) {
    return { descriptorCoverage: [{ descriptor: "hydrothermalStability", available: 12, percent: 2.4 }], interpretation: "Hydrothermal sparse" }
  }
  if (path.endsWith("provenance_coverage_summary.json")) {
    return { totalRecords: 500, withSourceDatabase: 500, withSourceRecordId: 500, withSourceDoi: 0, withCitation: 0, withLicense: 0, fieldSourceCoveragePercent: 42, doiCoveragePercent: 0, evidenceIdsCoveragePercent: 2.4 }
  }
  if (path.endsWith("organic_acid_precomputed_top_candidates.json")) {
    return { topCandidates: [
      { rank: 1, frameworkId: "COREMOF_000001", displayName: "MIL-53(Al) preview", oacsPreview: 0.89, dataQualityStatus: "ready_for_scoring", evidenceBoundary: "preview only", detailRef: "detail/framework/COREMOF_000001.json", notFinalRecommendation: true },
      { rank: 2, frameworkId: "COREMOF_000002", displayName: "CAU-10(Al) preview", oacsPreview: 0.82, dataQualityStatus: "ready_for_scoring", evidenceBoundary: "preview only", detailRef: "detail/framework/COREMOF_000002.json", notFinalRecommendation: true },
      { rank: 3, frameworkId: "COREMOF_000003", displayName: "MIL-100(Al) preview", oacsPreview: 0.8, dataQualityStatus: "ready_for_scoring", evidenceBoundary: "preview only", detailRef: "detail/framework/COREMOF_000003.json", notFinalRecommendation: true },
      { rank: 4, frameworkId: "COREMOF_000004", displayName: "MIL-101(Al) preview", oacsPreview: 0.75, dataQualityStatus: "ready_for_scoring", evidenceBoundary: "preview only", detailRef: "detail/framework/COREMOF_000004.json", notFinalRecommendation: true },
    ] }
  }
  if (path.endsWith("core_mof_index_parts/core_mof_index_part_001.json")) {
    return { recordCount: 2, records: [
      { id: "COREMOF_000001", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000001", displayName: "MIL-53(Al) preview", metals: ["Al"], hasAlNode: true, surfaceArea: 1200, pldA: 7.1, poreVolume: 0.9, bandGap: 3.2, hydrothermalEvidenceStatus: "indexed_proxy", dataQualityStatus: "ready_for_scoring", descriptorCompleteness: { available: 5, total: 6, percent: 83.3 }, provenanceStatus: "partial", detailRef: "detail/framework/COREMOF_000001.json" },
      { id: "COREMOF_000099", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000099", displayName: "Zr review preview", metals: ["Zr"], hasAlNode: false, dataQualityStatus: "needs_review", descriptorCompleteness: { available: 2, total: 6, percent: 33.3 }, provenanceStatus: "pending", detailRef: "detail/framework/COREMOF_000099.json" },
    ] }
  }
  if (path.endsWith("detail/framework/COREMOF_000001.json")) {
    return { id: "COREMOF_000001", displayName: "MIL-53(Al) preview", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000001", sourceDoi: null, citation: null, license: null, descriptors: { surfaceArea: 1200 }, dataQualityGate: { status: "ready_for_scoring" }, dataStatus: { level: "database_index_preview" } }
  }
  return { recordCount: 0 }
}

describe("DatabaseIndexWorkbench", () => {
  function mockFetch() {
    global.fetch = vi.fn(url => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(responseFor(url)) }))
    return global.fetch
  }

  it("loads overview first, then index part and detail on demand", async () => {
    mockFetch()

    const onOverviewLoaded = vi.fn()
    const { container } = render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} onOverviewLoaded={onOverviewLoaded} />)

    await screen.findAllByText(/Database Index Preview/)
    await screen.findAllByText(/MIL-53\(Al\) preview/)

    let fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("detail/framework"))).toBe(false)
    expect(onOverviewLoaded).toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /CoRE part 1/i }))
    await waitFor(() => expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("core_mof_index_parts/core_mof_index_part_001.json"))).toBe(true))

    fireEvent.click(screen.getAllByRole("button", { name: /Detail/i })[0])
    await screen.findByRole("dialog", { name: /Database detail drawer/i })
    await waitFor(() => expect(screen.getAllByText(/evidence pending/i).length).toBeGreaterThan(0))
    expect(screen.getByText(/Source Boundary Block/i)).toBeTruthy()
    expect(screen.getByText(/Missing Evidence Warning/i)).toBeTruthy()

    fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("detail/framework/COREMOF_000001.json"))).toBe(true)
    expect(container.textContent).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/)
  })

  it("filters loaded preview records without fetching all index parts", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/Expanded Database Screening UI/)
    fireEvent.change(screen.getByLabelText(/Source database filter/i), { target: { value: "qmof" } })
    fireEvent.change(screen.getByLabelText(/Quality status filter/i), { target: { value: "ready-for-scoring" } })

    const fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("qmof_index_parts"))).toBe(false)
    expect(screen.getByText(/Filter scope: Top-N preview only/i)).toBeTruthy()
  })

  it("shows the Top Candidates explanation panel", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/MIL-53\(Al\) preview/)
    fireEvent.click(screen.getAllByRole("button", { name: /Why in preview/i })[0])

    expect(await screen.findByText(/This is a precomputed index preview/i)).toBeTruthy()
    expect(screen.getByText(/Main positive factors/i)).toBeTruthy()
    expect(screen.getAllByText(/Descriptor availability/i).length).toBeGreaterThan(0)
  })

  it("limits Candidate Compare to three loaded candidates", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/MIL-53\(Al\) preview/)
    fireEvent.click(screen.getAllByRole("button", { name: /^Compare$/i })[0])
    fireEvent.click(screen.getAllByRole("button", { name: /^Compare$/i })[1])
    fireEvent.click(screen.getAllByRole("button", { name: /^Compare$/i })[2])

    await waitFor(() => expect(screen.getAllByText((_, node) => node?.textContent === "3 / 3").length).toBeGreaterThan(0))
    expect(screen.getAllByRole("button", { name: /^Compare$/i })[3].disabled).toBe(true)
    expect(screen.getByText(/comparison is based on currently loaded preview\/index data only/i)).toBeTruthy()
  })

  it("runs selected-part dry run without fetching all parts or details", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/MIL-53\(Al\) preview/)
    fireEvent.click(screen.getByRole("button", { name: /CoRE part 1/i }))
    await waitFor(() => expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("core_mof_index_parts/core_mof_index_part_001.json"))).toBe(true))

    fireEvent.click(screen.getByRole("button", { name: /Run loaded-scope dry run/i }))
    expect(await screen.findByText(/Dry-run result/i)).toBeTruthy()
    expect(screen.getByText(/notFinalRecommendation=true/i)).toBeTruthy()

    const fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.filter(url => url.includes("core_mof_index_parts")).length).toBe(1)
    expect(fetchedUrls.some(url => url.includes("qmof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("detail/framework"))).toBe(false)
  })

  it("renders the Metadata Verification Gate panel with preview-only gating", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/MIL-53\(Al\) preview/)
    expect((await screen.findAllByText(/Metadata Verification Gate/i)).length).toBeGreaterThan(0)
    // Top-N candidates here lack DOI/source/license, so they cannot be verified recommendations.
    expect(screen.getAllByText(/Preview only/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/cannot yet support a final recommendation/i).length).toBeGreaterThan(0)
  })

  it("shows the metadata gate inside Candidate Compare", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/MIL-53\(Al\) preview/)
    fireEvent.click(screen.getAllByRole("button", { name: /^Compare$/i })[0])
    await waitFor(() => expect(screen.getAllByText(/missing key metadata and is available for index preview only/i).length).toBeGreaterThan(0))
  })

  it("renders Chinese metadata verification copy", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="zh" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/数据库索引预览/)
    expect(screen.getAllByText(/metadata 核验门控/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/仅限预览/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/该候选目前不能作为最终推荐依据/).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/\bundefined\b|\bNaN\b/)
  })

  it("renders Chinese screening labels", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="zh" t={THEME_LIGHT} isMobile={false} />)

    await screen.findAllByText(/数据库索引预览/)
    expect(screen.getByText("来源数据库")).toBeTruthy()
    expect(screen.getByText("质量状态")).toBeTruthy()
    expect(screen.getAllByText(/数据库索引预览/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Worker 评分边界预览/).length).toBeGreaterThan(0)

    const bodyText = document.body.textContent
    expect(bodyText).not.toContain("comparison is based on currently loaded preview/index data only")
    expect(bodyText).not.toContain("not final recommendation")
    expect(bodyText).not.toContain("not final verified recommendation")
    expect(bodyText).not.toContain("evidence pending")
    expect(bodyText).not.toContain("full verified database screening")
  })
})
