// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import pilotManifest from "../../../public/data/csd_structure_pilot_manifest.json"
import {
  MofStructureWorkbench,
  deriveCoordinationPolyhedra,
  parseCifCellVectors,
  summarizeStructureAtoms,
} from "../../components/mof-structure/MofStructureWorkbench"
import {
  downloadCsdMofCif,
  scheduleCsdMofPreload,
} from "../../services/dataService"

vi.mock("../../services/dataService", () => ({
  downloadCsdMofCif: vi.fn(),
  scheduleCsdMofPreload: vi.fn(),
}))

const octahedronAtoms = [
  { index: 0, elem: "Zr", x: 0, y: 0, z: 0 },
  { index: 1, elem: "O", x: 2, y: 0, z: 0 },
  { index: 2, elem: "O", x: -2, y: 0, z: 0 },
  { index: 3, elem: "O", x: 0, y: 2, z: 0 },
  { index: 4, elem: "O", x: 0, y: -2, z: 0 },
  { index: 5, elem: "O", x: 0, y: 0, z: 2 },
  { index: 6, elem: "O", x: 0, y: 0, z: -2 },
]

const publicCatalog = {
  publicBaseUrl: "https://example.org/data/",
  cacheState: "network",
  summary: { total: 15906 },
  dataset: { name: "CSD MOF Collection (Non-Commercial)", license: { spdx: "CC-BY-NC-SA-4.0" } },
  aliasRegistry: { aliases: new Array(12).fill({}) },
  identityRecords: [
    {
      recordType: "identity-only",
      identityId: "ntu-68",
      commonName: "NTU-68",
      searchAliases: ["NTU68", "NTU 68", "NTU-68a"],
      identityStatus: "verified-name-structure-unmapped",
      mofClass: "Cu-MOFs",
      mofFamily: "Azolate-MOFs",
      firstReportedYear: 2023,
      linkerIdentity: { name: "1,4-bis(imidazol-1-yl)benzene", abbreviation: "bimb" },
      associatedPaper: { doi: "10.1021/jacs.3c10277", url: "https://doi.org/10.1021/jacs.3c10277" },
    },
    {
      recordType: "identity-only",
      identityId: "al-l2",
      commonName: "Al(L2)",
      searchAliases: ["AlL2", "Al-L2", "Al L2", "Al(L₂)"],
      identityStatus: "catalogued-name-unmapped",
      mofClass: "Al-MOFs",
      mofFamily: "Carboxylate-MOFs",
      firstReportedYear: 2023,
    },
    {
      recordType: "identity-only",
      identityId: "uio-66-nh2",
      commonName: "UiO-66-NH₂",
      searchAliases: ["UiO-66-NH2", "UiO66NH2", "NH2-UiO-66"],
      identityStatus: "known-name-unmapped",
      mofClass: "Zr-MOFs",
      mofFamily: "Carboxylate-MOFs",
    },
  ],
  structures: [{
    refcode: "RUBTAK",
    file: "rubtak_P1_H.cif",
    prefix: "ru",
    formula: "(C48 H28 O32 Zr6)n",
    metalElements: ["Zr"],
    commonName: "UiO-66",
    displayName: "UiO-66",
    platformName: "EcoMOF-Zr-RUBTAK",
    displayNameKind: "verified-literature-common-name",
    nameSource: "curated-identity-registry",
    searchAliases: ["UiO-66", "UiO66", "Zr-BDC"],
    preferredAliasRefcode: "RUBTAK",
    aliasRefcodes: ["RUBTAK", "RUBTAK01", "RUBTAK02"],
    mofClass: "Zr-MOFs",
    mofFamily: "Carboxylate-MOFs",
    firstReportedYear: 2008,
    linkerIdentity: { name: "Benzene-1,4-dicarboxylic acid", abbreviation: "1,4-BDC" },
    metalCluster: "Zr₆(μ₃-O)₄(μ₃-OH)₄(COO)₁₂",
    topology: "fcu",
    associatedPaper: { doi: "10.1021/ja8057953", url: "https://doi.org/10.1021/ja8057953" },
    ccdcNumber: "733458",
    identityStatus: "verified-curated",
    identityPage: "https://mofanatomy.com/mof/uio-66/",
    cifUrl: "https://example.org/data/cif/ru/rubtak_P1_H.cif",
  }],
}

describe("MofStructureWorkbench", () => {
  beforeEach(() => {
    vi.mocked(downloadCsdMofCif).mockReset()
    vi.mocked(scheduleCsdMofPreload).mockReset()
  })

  it("derives a ZrO6 octahedron from real coordinates", () => {
    const polyhedra = deriveCoordinationPolyhedra(octahedronAtoms)
    expect(polyhedra).toHaveLength(1)
    expect(polyhedra[0].element).toBe("Zr")
    expect(polyhedra[0].neighbors).toHaveLength(6)
    expect(polyhedra[0].faces).toHaveLength(8)

    expect(summarizeStructureAtoms(octahedronAtoms, polyhedra)).toMatchObject({
      atomCount: 7,
      metalCount: 1,
      polyhedraCount: 1,
      elements: { Zr: 1, O: 6 },
    })
  })

  it("reconstructs coordination neighbors across periodic cell boundaries", () => {
    const cellVectors = parseCifCellVectors(`
      _cell_length_a 10.000(2)
      _cell_length_b 10.000
      _cell_length_c 10.000
      _cell_angle_alpha 90
      _cell_angle_beta 90
      _cell_angle_gamma 90
    `)
    const periodicAtoms = [
      { index: 0, elem: "Zr", x: 0.3, y: 0.3, z: 0.3 },
      { index: 1, elem: "O", x: 9.0, y: 0.3, z: 0.3 },
      { index: 2, elem: "O", x: 1.8, y: 0.3, z: 0.3 },
      { index: 3, elem: "O", x: 0.3, y: 9.0, z: 0.3 },
      { index: 4, elem: "O", x: 0.3, y: 1.8, z: 0.3 },
      { index: 5, elem: "O", x: 0.3, y: 0.3, z: 9.0 },
      { index: 6, elem: "O", x: 0.3, y: 0.3, z: 1.8 },
    ]

    expect(cellVectors.a).toEqual([10, 0, 0])
    expect(cellVectors.b[0]).toBeCloseTo(0, 8)
    expect(cellVectors.b[1]).toBeCloseTo(10, 8)
    expect(cellVectors.c[0]).toBeCloseTo(0, 8)
    expect(cellVectors.c[1]).toBeCloseTo(0, 8)
    expect(cellVectors.c[2]).toBeCloseTo(10, 8)
    const polyhedra = deriveCoordinationPolyhedra(periodicAtoms, { cellVectors })
    expect(polyhedra).toHaveLength(1)
    expect(polyhedra[0].neighbors).toHaveLength(6)
    expect(polyhedra[0].distances.every(distance => distance < 1.6)).toBe(true)
  })

  it("keeps an honest CSD authorization empty state", () => {
    render(
      <MofStructureWorkbench
        item={{ id: "core_hkust1", name: "HKUST-1", metal: "Cu", topology: "tbo" }}
        pilotManifest={pilotManifest}
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
      />
    )

    expect(screen.getByTestId("mof-structure-workbench")).toBeInTheDocument()
    expect(screen.getByText("等待已授权的结构文件")).toBeInTheDocument()
    expect(screen.getByText("CSD MOF Collection")).toBeInTheDocument()
    expect(screen.getByText("CC-BY-NC-SA-4.0")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "载入本地 CIF" })).toHaveLength(2)
    expect(screen.getByRole("combobox", { name: "结构片段" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "多面体" })).toBeDisabled()
  })

  it("distinguishes network download failure and exposes all three fallbacks", async () => {
    vi.mocked(downloadCsdMofCif).mockRejectedValue({ kind: "network" })
    render(
      <MofStructureWorkbench
        item={{ id: "uio66", name: "UiO-66", metal: "Zr" }}
        pilotManifest={pilotManifest}
        publicCatalog={publicCatalog}
        catalogStatus="ready"
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
      />,
    )

    expect(await screen.findByText("网络下载失败")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "重新下载" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "复制 CIF 地址" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "载入本地 CIF" }).length).toBeGreaterThanOrEqual(2)
  })

  it("labels a downloaded invalid CIF as a parse failure", async () => {
    vi.mocked(downloadCsdMofCif).mockResolvedValue({
      record: publicCatalog.structures[0],
      text: "this is not a CIF",
      bytes: 17,
      source: "network",
      attempts: 1,
    })
    render(
      <MofStructureWorkbench
        item={{ id: "uio66", name: "UiO-66", metal: "Zr" }}
        pilotManifest={pilotManifest}
        publicCatalog={publicCatalog}
        catalogStatus="ready"
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
      />,
    )

    expect(await screen.findByText("CIF 解析失败")).toBeInTheDocument()
    expect(screen.getByText(/CIF 已下载，但缺少/)).toBeInTheDocument()
    expect(screen.getAllByText("Zr-MOFs").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Carboxylate-MOFs").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("1,4-BDC")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "DOI 10.1021/ja8057953" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "重新下载" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "复制 CIF 地址" })).toBeInTheDocument()
  })

  it("finds UiO-66 through its cited common-name alias", async () => {
    vi.mocked(downloadCsdMofCif).mockRejectedValue({ kind: "network" })
    render(
      <MofStructureWorkbench
        item={{ id: "uio66", name: "UiO-66", metal: "Zr" }}
        pilotManifest={pilotManifest}
        publicCatalog={publicCatalog}
        catalogStatus="ready"
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
      />,
    )

    const search = screen.getByRole("searchbox")
    fireEvent.change(search, { target: { value: "UiO-66" } })
    await waitFor(() => expect(screen.getByRole("button", { name: /RUBTAK/ })).toBeInTheDocument())
  })

  it("searches punctuation and Unicode naming styles without inferring a structure", async () => {
    vi.mocked(downloadCsdMofCif).mockRejectedValue({ kind: "network" })
    render(
      <MofStructureWorkbench
        item={{ id: "uio66", name: "UiO-66", metal: "Zr" }}
        pilotManifest={pilotManifest}
        publicCatalog={publicCatalog}
        catalogStatus="ready"
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
      />,
    )

    expect(await screen.findByText("网络下载失败")).toBeInTheDocument()
    const search = screen.getByRole("searchbox")

    fireEvent.change(search, { target: { value: "Al L2" } })
    expect(await screen.findByRole("button", { name: /Al\(L2\)/ })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: "UiO-66-NH2" } })
    expect(await screen.findByRole("button", { name: /UiO-66-NH₂/ })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: "NTU68" } })
    const ntuResult = await screen.findByRole("button", { name: /NTU-68/ })
    const downloadCallsBeforeIdentitySelection = vi.mocked(downloadCsdMofCif).mock.calls.length
    fireEvent.click(ntuResult)

    expect(await screen.findByText("名称已接入，结构映射待核验")).toBeInTheDocument()
    expect(screen.getByText("不以相似分子式推断结构")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "DOI 10.1021/jacs.3c10277" })).toBeInTheDocument()
    expect(vi.mocked(downloadCsdMofCif)).toHaveBeenCalledTimes(downloadCallsBeforeIdentitySelection)
  })
})
