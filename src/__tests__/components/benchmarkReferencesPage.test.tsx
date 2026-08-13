// @ts-nocheck
import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { BenchmarkReferencesPage } from "../../components/pages/BenchmarkReferencesPage"
import { LangCtx } from "../../contexts"
import { COPY } from "../../i18n"
import benchmarkRegistry from "../../../public/data/benchmark_references.json"

vi.mock("../../services/dataService", async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getBenchmarkReferences: vi.fn(async () => ({
      boundaryZh: "列入不表示认证或外部验证。",
      boundaryEn: "Inclusion is not certification or external validation.",
      statusVocabulary: {
        "adopted-framework": { zh: "已采用框架", en: "Adopted framework" },
        "internal-protocol": { zh: "内部协议", en: "Internal protocol" },
      },
      modules: [{
        id: "ecology",
        order: 1,
        labelZh: "生态与生命周期评价",
        labelEn: "Ecology and LCA",
        summaryZh: "国标用于组织生命周期评价。",
        summaryEn: "Standards organize LCA.",
        boundaryZh: "不是完整 LCA。",
        boundaryEn: "Not a complete LCA.",
        references: [{
          id: "gbt",
          title: "GB/T 24040-2008",
          status: "adopted-framework",
          identifier: "GB/T 24040-2008",
          url: "https://openstd.samr.gov.cn/example",
          sourceLabelZh: "国家标准全文公开系统",
          sourceLabelEn: "Official standard platform",
          projectUseZh: "采用目标与范围框架。",
          projectUseEn: "Adopts goal and scope.",
          verifiedAt: "2026-08-13",
        }],
      }],
    })),
  }
})

describe("benchmark references page", () => {
  it("separates adoption status, project use, and interpretation boundaries", async () => {
    render(
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
        <BenchmarkReferencesPage />
      </LangCtx.Provider>,
    )

    await waitFor(() => expect(screen.getByTestId("benchmark-references-page")).toHaveTextContent("GB/T 24040-2008"))
    expect(screen.getByText("已采用框架", { selector: ".benchmark-reference-meta > span" })).toBeInTheDocument()
    expect(screen.getByText("先说明边界")).toBeInTheDocument()
    expect(screen.getByText("不能据此推出")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /国家标准全文公开系统/ })).toHaveAttribute("target", "_blank")
  })

  it("keeps the cross-module registry and evidence boundaries complete", () => {
    const modules = new Map(benchmarkRegistry.modules.map(module => [module.id, module]))

    expect([...modules.keys()]).toEqual([
      "ecology",
      "structure-data",
      "gas-separation",
      "catalysis",
      "algorithm-validation",
    ])

    expect(modules.get("ecology")?.references.map(reference => reference.identifier)).toEqual(
      expect.arrayContaining([
        "GB/T 24040-2008",
        "GB/T 24044-2008",
        "ISO 14040:2006",
        "ISO 14044:2006",
      ]),
    )
    expect(modules.get("structure-data")?.references.map(reference => reference.doi)).toEqual(
      expect.arrayContaining([
        "10.5281/zenodo.15055758",
        "10.5281/zenodo.13254307",
        "10.1038/sdata.2016.18",
      ]),
    )
    expect(modules.get("gas-separation")?.references.map(reference => reference.doi)).toContain(
      "10.1002/aic.690110125",
    )

    const catalysisCorpus = modules.get("catalysis")?.references.find(
      reference => reference.id === "CATALYSIS-SEED-LITERATURE",
    )
    expect(catalysisCorpus?.sources).toHaveLength(10)
    expect(catalysisCorpus?.sources.every(source => /^10\./i.test(source.doi))).toBe(true)

    const algorithmModule = modules.get("algorithm-validation")
    expect(algorithmModule?.boundaryZh).toContain("不能称为外部独立实验验证")
    expect(algorithmModule?.references.every(reference => reference.status === "internal-protocol")).toBe(true)
  })
})
