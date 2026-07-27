import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  attachCsdPublicUrls,
  downloadCsdMofCif,
  fetchCsdResource,
  getCsdMofPublicCatalog,
  __resetCsdMofMemoryCacheForTests,
} from "../../services/csdMofPublicService"

describe("CSD MOF public catalog", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    __resetCsdMofMemoryCacheForTests()
  })

  it("attaches a sharded public CIF URL without changing source metadata", () => {
    const sourceRecord = {
      refcode: "ABADUG",
      path: "cif/ab/abadug_P1.cif",
      formula: "(C153 H90 N6 O27 Zn6)n",
      metalElements: ["Zn"],
      sha256: "443378b43ee29ed5ccdb0d9d85a9192c3c15ba579a2981485c30bc57f339ecd6",
    }

    const catalog = attachCsdPublicUrls(
      { structures: [sourceRecord], summary: { total: 15906 } },
      "https://example.org/ecomof-csd-mof-data",
    )

    expect(catalog.publicBaseUrl).toBe("https://example.org/ecomof-csd-mof-data/")
    expect(catalog.structures[0]).toEqual({
      ...sourceRecord,
      prefix: "ab",
      file: "abadug_P1.cif",
      cifUrl: "https://example.org/ecomof-csd-mof-data/cif/ab/abadug_P1.cif",
      platformName: "EcoMOF-Zn-ABADUG",
      displayName: "ABADUG",
      displayNameKind: "csd-refcode",
      nameSource: "csd-refcode",
      mofClass: "Zn-MOFs",
      mofClassSource: "derived-from-csd-metal-elements",
      csdRefcode: "ABADUG",
    })
    expect(catalog.summary.total).toBe(15906)
  })

  it("adds a cited UiO-66 alias to the distinct RUBTAK family records", () => {
    const catalog = attachCsdPublicUrls(
      {
        structures: [
          { refcode: "RUBTAK", file: "rubtak_P1_H.cif", prefix: "ru", metalElements: ["Zr"] },
          { refcode: "RUBTAK02", file: "rubtak02_P1_H.cif", prefix: "ru", metalElements: ["Zr"] },
        ],
      },
      "https://example.org/data/",
    )

    expect(catalog.structures.map(record => record.refcode)).toEqual(["RUBTAK", "RUBTAK02"])
    expect(catalog.structures[0]).toMatchObject({
      commonName: "UiO-66",
      displayName: "UiO-66",
      platformName: "EcoMOF-Zr-RUBTAK",
      displayNameKind: "verified-literature-common-name",
      preferredAliasRefcode: "RUBTAK",
      mofClass: "Zr-MOFs",
      mofFamily: "Carboxylate-MOFs",
      firstReportedYear: 2008,
      topology: "fcu",
      ccdcNumber: "733458",
      searchAliases: expect.arrayContaining(["UiO-66", "Zr-BDC"]),
    })
    expect(catalog.structures[0].linkerIdentity.abbreviation).toBe("1,4-BDC")
    expect(catalog.structures[0].associatedPaper.doi).toBe("10.1021/ja8057953")
    expect(catalog.structures[0].aliasProvenance.map(source => source.doi)).toEqual(
      expect.arrayContaining(["10.1021/ja8057953", "10.1039/D1ME00085C"]),
    )
  })

  it("keeps unmapped common names searchable without attaching a CIF URL", () => {
    const catalog = attachCsdPublicUrls(
      { structures: [], summary: { total: 15906 } },
      "https://example.org/data/",
    )

    expect(catalog.identityRecords).toEqual(expect.arrayContaining([
      expect.objectContaining({
        identityId: "ntu-68",
        commonName: "NTU-68",
        recordType: "identity-only",
        identityStatus: "verified-name-structure-unmapped",
      }),
      expect.objectContaining({
        identityId: "al-l2",
        commonName: "Al(L2)",
        searchAliases: expect.arrayContaining(["Al(L₂)", "Al L2"]),
      }),
      expect.objectContaining({
        identityId: "uio-66-nh2",
        commonName: "UiO-66-NH₂",
        searchAliases: expect.arrayContaining(["UiO-66-NH2"]),
      }),
    ]))
    expect(catalog.identityRecords.every(record => !record.cifUrl && !record.refcode)).toBe(true)
  })

  it("keeps a primary-CSD mapping visible when its Refcode is absent from the public MOF subset", () => {
    const catalog = attachCsdPublicUrls(
      { structures: [], summary: { total: 15906 } },
      "https://example.org/data/",
    )

    expect(catalog.identityRecords).toEqual(expect.arrayContaining([
      expect.objectContaining({
        identityId: "dut-68",
        commonName: "DUT-68",
        externalCsdRefcodes: ["XICYUF"],
        preferredExternalRefcode: "XICYUF",
        ccdcNumber: "902900",
      }),
    ]))
  })

  it("retries transient network failures twice before succeeding", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))

    const result = await fetchCsdResource("https://example.org/test.cif", {
      retries: 2,
      retryDelayMs: 0,
      timeoutMs: 100,
    })

    expect(result.attempts).toBe(3)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("reports a network download error after all attempts fail", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"))

    await expect(fetchCsdResource("https://example.org/test.cif", {
      retries: 2,
      retryDelayMs: 0,
      timeoutMs: 100,
    })).rejects.toMatchObject({
      name: "CsdMofRequestError",
      kind: "network",
      attempt: 3,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("caches an opened CIF and reuses it without a second network request", async () => {
    const source = "data_RUBTAK\\n_atom_site_label\\nZr1"
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(source, { status: 200, headers: { "content-length": String(source.length) } }),
    )
    const record = {
      refcode: "RUBTAK",
      file: "rubtak_P1_H.cif",
      prefix: "ru",
      sha256: "known-checksum",
      cifUrl: "https://example.org/data/cif/ru/rubtak_P1_H.cif",
    }

    const first = await downloadCsdMofCif(record, { baseUrl: "https://example.org/data/", retryDelayMs: 0 })
    const second = await downloadCsdMofCif(record, { baseUrl: "https://example.org/data/", retryDelayMs: 0 })

    expect(first.source).toBe("network")
    expect(second.source).toBe("indexeddb")
    expect(second.text).toBe(source)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("loads and caches the lightweight search index", async () => {
    const search = {
      schemaVersion: "2.0.0",
      summary: { total: 15906 },
      structures: [{ refcode: "RUBTAK", file: "rubtak_P1_H.cif", prefix: "ru", formula: "Zr", metalElements: ["Zr"] }],
    }
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(search), { status: 200, headers: { "content-type": "application/json" } }),
    )

    const first = await getCsdMofPublicCatalog("https://example.org/data/", { retryDelayMs: 0 })
    const second = await getCsdMofPublicCatalog("https://example.org/data/", { retryDelayMs: 0 })

    expect(first.summary.total).toBe(15906)
    expect(first.indexMode).toBe("prefix-details")
    expect(first.structures[0]).toMatchObject({
      refcode: "RUBTAK",
      commonName: "UiO-66",
      cifUrl: "https://example.org/data/cif/ru/rubtak_P1_H.cif",
    })
    expect(second.cacheState).toBe("indexeddb")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
