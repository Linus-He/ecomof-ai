import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchDatabaseManifest, fetchIndexPart } from "../../utils/databaseIndex/databaseIndexClient"
import { loadDatabaseIndexOverview } from "../../utils/databaseIndex/databaseIndexLoaders"

const manifest = {
  version: "V2.0-A",
  datasetMode: "database_index_preview",
  files: {
    coreSummary: "core_mof_index_summary.json",
    qmofSummary: "qmof_index_summary.json",
    descriptorAvailability: "organic_acid_descriptor_availability.json",
    provenanceCoverage: "provenance_coverage_summary.json",
    topCandidates: "organic_acid_precomputed_top_candidates.json",
  },
  indexParts: {
    coreMof: ["core_mof_index_parts/core_mof_index_part_001.json"],
    qmof: ["qmof_index_parts/qmof_index_part_001.json"],
  },
}

function jsonResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("databaseIndexClient", () => {
  it("fetches manifest from the Vite base data path", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(manifest))

    const result = await fetchDatabaseManifest()

    expect(result.data.datasetMode).toBe("database_index_preview")
    expect(global.fetch).toHaveBeenCalledWith("/data/database_index/manifest.json")
  })

  it("returns a readable fallback on fetch failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, false, 404))

    const result = await fetchIndexPart("core_mof_index_parts/missing.json")

    expect(result.data.records).toEqual([])
    expect(result.error.message).toMatch(/Could not load database index file/)
    expect(result.error.status).toBe(404)
  })

  it("loads overview files without auto-fetching index parts", async () => {
    global.fetch = vi.fn(url => {
      const path = String(url)
      if (path.endsWith("manifest.json")) return Promise.resolve(jsonResponse(manifest))
      if (path.includes("core_mof_index_parts") || path.includes("qmof_index_parts")) {
        return Promise.resolve(jsonResponse({ records: [] }))
      }
      return Promise.resolve(jsonResponse({ recordCount: 1, topCandidates: [] }))
    })

    await loadDatabaseIndexOverview()

    const fetchedUrls = global.fetch.mock.calls.map(call => String(call[0]))
    expect(fetchedUrls).toContain("/data/database_index/manifest.json")
    expect(fetchedUrls.some(url => url.includes("core_mof_index_parts"))).toBe(false)
    expect(fetchedUrls.some(url => url.includes("qmof_index_parts"))).toBe(false)
  })
})
