import { describe, expect, it, vi } from "vitest"
import homeSummary from "../../../public/data/home_summary.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import {
  HOME_SUMMARY_ENDPOINTS,
  HOME_SUMMARY_RESTRICTED_PATHS,
  isRestrictedHomeSummaryFetch,
  loadHomeSummary,
} from "../../utils/homeSummary"
import { PROJECT_STATUS_ENDPOINTS } from "../../utils/projectStatus"

function response(data) {
  return {
    ok: true,
    json: async () => data,
  }
}

describe("homeNoHeavyFetch", () => {
  it("loads only lightweight homepage summary and bounded project status endpoints", async () => {
    const fetcher = vi.fn(async (url) => {
      if (String(url).includes("home_summary.json")) return response(homeSummary)
      if (String(url).includes("data_ingestion_summary_v3.json")) return response(dataIngestionSummary)
      return { ok: false, json: async () => null }
    })

    const summary = await loadHomeSummary(fetcher)
    const calls = fetcher.mock.calls.map(([url]) => String(url))

    expect(summary.totalRecords).toBe(3462)
    expect(summary.experimentalLabelCount).toBe(150)
    expect(calls).toHaveLength(HOME_SUMMARY_ENDPOINTS.length + Object.keys(PROJECT_STATUS_ENDPOINTS).length)
    for (const endpoint of HOME_SUMMARY_ENDPOINTS) {
      expect(calls.some(url => url.includes(endpoint))).toBe(true)
    }
    for (const endpoint of Object.values(PROJECT_STATUS_ENDPOINTS)) {
      expect(calls.some(url => url.includes(endpoint))).toBe(true)
    }
    for (const url of calls) {
      expect(isRestrictedHomeSummaryFetch(url)).toBe(false)
    }
  })

  it("documents restricted homepage fetch paths, including V3.4 label and benchmark work", () => {
    expect(HOME_SUMMARY_RESTRICTED_PATHS).toEqual(expect.arrayContaining([
      "core_mof_import_v3.json",
      "qmof_import_v3.json",
      "organic_acid_literature_dataset_v3.json",
      "benchmark_dataset_v2.json",
      "public/data/experimental_labels/",
      "public/data/external_test_dataset/",
      "benchmark_report_v1.json",
      "first_real_benchmark_report_v1.json",
    ]))
  })
})
