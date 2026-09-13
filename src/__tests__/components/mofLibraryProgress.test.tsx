// @ts-nocheck
import { act, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { THEME_LIGHT } from "../../constants/theme"
import { MOFLibraryTab } from "../../components/tabs/MOFLibraryTab"

const pending = vi.hoisted(() => ({ resolve: null }))
vi.mock("../../shared", async importOriginal => ({
  ...await importOriginal(),
  useT: () => THEME_LIGHT,
  useLang: () => ({ lang: "zh" }),
  useViewport: () => ({ isMobile: false }),
  getGlobalMofCandidates: () => new Promise(resolve => { pending.resolve = resolve }),
  getGasAdsorptionRecordsV2: async () => [],
  getMofIdentityRegistry: async () => ({}),
  getGasAdsorptionV2CollectionReport: async () => ({}),
  getMofIdentityResolutionReport: async () => ({}),
  getGasStructureProxyValidationReport: async () => ({}),
  getCsdStructurePilotManifest: async () => ({}),
  getCsdMofPublicCatalog: async () => ({}),
}))
vi.mock("../../services/dataService", async importOriginal => ({
  ...await importOriginal(), fetchDataJson: async () => ({ records: [] }),
}))
vi.mock("../../components/mof-structure/MofStructureWorkbench", () => ({ MofStructureWorkbench: ({ indexProgressContent }) => <div>{indexProgressContent}</div> }))
vi.mock("../../components/data-quality/DataQualityAuditPanel", () => ({ DataQualityAuditPanel: () => null }))

describe("MOF index loading progress", () => {
  it("tracks settled requests without inventing progress while a request is pending", async () => {
    render(<MOFLibraryTab />)
    const panel = screen.getByTestId("mof-index-progress")
    await act(async () => {})
    expect(panel).toHaveTextContent("90%")
    expect(within(panel).getByRole("progressbar", { hidden: true })).toHaveAttribute("aria-valuenow", "90")
    expect(panel).toHaveTextContent("加载中…")
    await act(async () => pending.resolve([]))
    expect(panel).toHaveTextContent("100%")
    expect(panel).not.toHaveTextContent("加载中…")
  })
})
