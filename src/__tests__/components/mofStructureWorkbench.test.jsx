// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import pilotManifest from "../../../public/data/csd_structure_pilot_manifest.json"
import {
  MofStructureWorkbench,
  deriveCoordinationPolyhedra,
  parseCifCellVectors,
  summarizeStructureAtoms,
} from "../../components/mof-structure/MofStructureWorkbench"

const octahedronAtoms = [
  { index: 0, elem: "Zr", x: 0, y: 0, z: 0 },
  { index: 1, elem: "O", x: 2, y: 0, z: 0 },
  { index: 2, elem: "O", x: -2, y: 0, z: 0 },
  { index: 3, elem: "O", x: 0, y: 2, z: 0 },
  { index: 4, elem: "O", x: 0, y: -2, z: 0 },
  { index: 5, elem: "O", x: 0, y: 0, z: 2 },
  { index: 6, elem: "O", x: 0, y: 0, z: -2 },
]

describe("MofStructureWorkbench", () => {
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
})
