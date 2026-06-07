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
    return { topCandidates: [{ rank: 1, frameworkId: "COREMOF_000001", displayName: "MIL-53(Al) preview", oacsPreview: 0.89, dataQualityStatus: "ready_for_scoring", evidenceBoundary: "preview only", detailRef: "detail/framework/COREMOF_000001.json", notFinalRecommendation: true }] }
  }
  if (path.endsWith("core_mof_index_parts/core_mof_index_part_001.json")) {
    return { recordCount: 1, records: [{ id: "COREMOF_000001", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000001", displayName: "MIL-53(Al) preview", hasAlNode: true, dataQualityStatus: "ready_for_scoring", detailRef: "detail/framework/COREMOF_000001.json" }] }
  }
  if (path.endsWith("detail/framework/COREMOF_000001.json")) {
    return { id: "COREMOF_000001", displayName: "MIL-53(Al) preview", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000001", sourceDoi: null, citation: null, license: null, descriptors: { surfaceArea: 1200 }, dataQualityGate: { status: "ready_for_scoring" }, dataStatus: { level: "database_index_preview" } }
  }
  return { recordCount: 0 }
}

describe("DatabaseIndexWorkbench", () => {
  it("loads overview first, then index part and detail on demand", async () => {
    global.fetch = vi.fn(url => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(responseFor(url)) }))

    const onOverviewLoaded = vi.fn()
    const { container } = render(<DatabaseIndexWorkbench lang="en" t={THEME_LIGHT} isMobile={false} onOverviewLoaded={onOverviewLoaded} />)

    await screen.findByText(/Database Index Preview/)
    await screen.findByText(/MIL-53\(Al\) preview/)

    let fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("detail/framework"))).toBe(false)
    expect(onOverviewLoaded).toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /CoRE part 1/i }))
    await waitFor(() => expect(global.fetch.mock.calls.map(call => String(call[0])).some(url => url.includes("core_mof_index_parts/core_mof_index_part_001.json"))).toBe(true))

    fireEvent.click(screen.getAllByRole("button", { name: /Detail/i })[0])
    await screen.findByRole("dialog", { name: /Database detail drawer/i })
    await waitFor(() => expect(screen.getAllByText(/Evidence pending/).length).toBeGreaterThan(0))

    fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls.some(url => url.includes("detail/framework/COREMOF_000001.json"))).toBe(true)
    expect(container.textContent).not.toMatch(/\bundefined\b|\bnull\b|\bNaN\b/)
  })
})
