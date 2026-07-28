// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DatabaseIndexWorkbench } from "../../components/database-index/DatabaseIndexWorkbench"

const sourceRow = (id, displayName, metal, overrides = {}) => ({
  id,
  frameworkId: id,
  sourceDatabase: "CoRE MOF 2024 · CSD-modified",
  sourceRecordId: `2024[${metal}][test]3[ASR]1`,
  displayName,
  commonName: displayName,
  csdRefcode: displayName,
  coreId: `2024[${metal}][test]3[ASR]1`,
  metals: [metal],
  surfaceArea: 1200,
  pldA: 7.1,
  lcdA: 9.2,
  poreVolume: 0.9,
  density: 1.2,
  voidFraction: 0.54,
  waterStability: 0.72,
  thermalStability: 350,
  sourceDoi: "10.1000/test",
  sourceUrl: "https://zenodo.org/records/15055758",
  citation: "CoRE MOF 2024 v1.1 test record.",
  license: "CC-BY-NC-SA-4.0",
  retrievedAt: "2026-07-28",
  dataQualityStatus: "ready_for_structural_screening",
  descriptorCompleteness: { available: 6, total: 6, percent: 100 },
  descriptorCompletenessPercent: 100,
  provenanceCompletenessPercent: 100,
  provenanceStatus: "source_record_confirmed",
  detailRef: `detail/framework/${id}.json`,
  evidenceBoundary: "Real CoRE CR structure record selected for deterministic structural review; not a catalytic-performance ranking.",
  notFinalRecommendation: true,
  ...overrides,
})

const reviewRows = [
  sourceRow("coremof2024-csdm-00001", "ABAVIJ", "Co"),
  sourceRow("coremof2024-csdm-00002", "ABAVOP", "Zn"),
  sourceRow("coremof2024-csdm-00003", "ABAYIO", "Al"),
  sourceRow("coremof2024-csdm-00004", "ABEFOF", "Cu"),
]

const manifest = {
  version: "CoRE-MOF-2024-current",
  datasetMode: "real_core_mof_cr_index",
  buildDate: "2026-07-28",
  sourceDatabases: [
    { name: "CoRE MOF 2024 · CSD-modified CR", status: "active_source_record_index", recordCount: 9835, detailCount: 30, license: "CC-BY-NC-SA-4.0", citation: "CoRE MOF 2024 v1.1", sourceUrl: "https://zenodo.org/records/15055758" },
    { name: "QMOF", status: "quarantined", recordCount: 0, detailCount: 0 },
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
  warnings: ["Structural screening readiness does not mean catalytic performance."],
}

function responseFor(url) {
  const path = String(url)
  if (path.endsWith("manifest.json")) return manifest
  if (path.endsWith("core_mof_index_summary.json")) return { recordCount: 9835, alContainingCount: 102, readyForScoring: 9835, needsReview: 0, rejected: 0 }
  if (path.endsWith("qmof_index_summary.json")) return { recordCount: 0, status: "quarantined" }
  if (path.endsWith("organic_acid_descriptor_availability.json")) {
    return { totalRecords: 9835, descriptorCoverage: [{ descriptor: "surfaceArea", available: 9835, percent: 100 }], interpretation: "Real CoRE CR structural descriptors." }
  }
  if (path.endsWith("provenance_coverage_summary.json")) {
    return { totalRecords: 9835, withSourceDatabase: 9835, withSourceRecordId: 9835, withSourceDoi: 9835, withCitation: 9835, withLicense: 9835, fieldSourceCoveragePercent: 100, doiCoveragePercent: 100 }
  }
  if (path.endsWith("organic_acid_precomputed_top_candidates.json")) {
    return { datasetMode: "real_core_mof_cr_index", topCandidates: reviewRows }
  }
  if (path.endsWith("core_mof_index_parts/core_mof_index_part_001.json")) {
    return { dataset: "CoRE MOF 2024 · CSD-modified CR", part: 1, totalParts: 10, records: reviewRows.slice(0, 2) }
  }
  if (path.endsWith("detail/framework/coremof2024-csdm-00001.json")) {
    return { ...reviewRows[0], descriptors: { surfaceArea: 1200, poreVolume: 0.9 }, dataQualityGate: { status: "ready_for_structural_screening", boundary: "Structural screening only." }, dataStatus: { level: "real_core_mof_cr_index" } }
  }
  return { recordCount: 0 }
}

describe("DatabaseIndexWorkbench", () => {
  function mockFetch() {
    global.fetch = vi.fn(url => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(responseFor(url)) }))
    return global.fetch
  }

  it("loads the real CoRE overview without loading index parts or legacy precompute files", async () => {
    mockFetch()
    const onOverviewLoaded = vi.fn()
    const { container } = render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} onOverviewLoaded={onOverviewLoaded} />)

    await screen.findByText(/CoRE 2024 CR Database Index & Structural Review/)
    await screen.findByText("ABAVIJ")

    const fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("detail/framework"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("database_precompute"))).toBe(false)
    expect(onOverviewLoaded).toHaveBeenCalled()
    expect(container.textContent).toContain("9,835")
    expect(container.textContent).not.toMatch(/small-scale records|COREMOF_000|QMOF_000/)
  })

  it("loads one real index part and one detail record on demand", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findByText("ABAVIJ")
    fireEvent.click(screen.getByRole("button", { name: /CoRE part 1/i }))
    await waitFor(() => expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("core_mof_index_parts/core_mof_index_part_001.json"))).toBe(true))

    fireEvent.click(screen.getAllByRole("button", { name: /Detail/i })[0])
    expect(await screen.findByRole("dialog", { name: /Database detail drawer/i })).toBeTruthy()
    await waitFor(() => expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("detail/framework/coremof2024-csdm-00001.json"))).toBe(true))
  })

  it("filters the current structural-review sample without fetching all parts", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findByText("ABAVIJ")
    fireEvent.change(screen.getByLabelText(/Metal node filter/i), { target: { value: "Al" } })

    expect(screen.getByText("ABAYIO")).toBeTruthy()
    expect(screen.queryByText("ABAVIJ")).toBeNull()
    expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(screen.getAllByText(/structural-review sample/i).length).toBeGreaterThan(0)
  })

  it("compares at most three real structure records", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} />)

    await screen.findByText("ABAVIJ")
    const buttons = screen.getAllByRole("button", { name: /^Compare$/i })
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[2])

    await waitFor(() => expect(screen.getAllByText((_, node) => node?.textContent === "3 / 3").length).toBeGreaterThan(0))
    expect(buttons[3]).toBeDisabled()
    expect(document.body.textContent).toMatch(/does not infer catalytic performance/i)
  })

  it("renders the current Chinese structural-index copy", async () => {
    mockFetch()
    render(<DatabaseIndexWorkbench lang="zh" t={THEME_LIGHT} isMobile={false} />)

    await screen.findByText(/CoRE 2024 CR 数据库索引与结构审阅/)
    expect(screen.getByText("来源数据库")).toBeTruthy()
    expect(screen.getByText("质量状态")).toBeTruthy()
    expect(screen.getByText(/真实结构记录筛选器/)).toBeTruthy()
    expect(screen.getAllByText(/结构审阅样本/).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/小规模样本|数据库索引预览|COREMOF_000|QMOF_000|NaN|undefined/)
  })
})
