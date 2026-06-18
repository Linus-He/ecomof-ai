// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab, renderBenchmarkLabDark, bodyText } from "./modelBenchmarkLabTestUtils"
import versionData from "../../../public/data/version_evolution_records.json"
import { MODEL_BENCHMARK_DIRECTORY } from "../../components/methodology/model-benchmark/ModelBenchmarkLab"

describe("ModelBenchmarkLab", () => {
  it("renders the V2.7 interactive benchmark lab and hash anchor", () => {
    renderBenchmarkLab()

    expect(screen.getByTestId("model-benchmark-lab")).toBeInTheDocument()
    expect(screen.getByTestId("model-benchmark-lab").id).toBe("methodology-model-benchmark")
    expect(bodyText()).toMatch(/Interactive Model Benchmark Workbench/)
    expect(bodyText()).toMatch(/Benchmark Framework Ready/)
    expect(bodyText()).toMatch(/Machine Learning Benchmark Pending/)
    expect(MODEL_BENCHMARK_DIRECTORY.children.map(row => row.id)).toContain("methodology-model-benchmark-workflow")
  })

  it("uses segmented mobile layout and dark readable theme values", () => {
    const { unmount } = renderBenchmarkLab({ isMobile: true })
    expect(screen.getByTestId("model-benchmark-lab")).toHaveAttribute("data-mobile-layout", "segmented")
    expect(screen.getByTestId("model-benchmark-lab")).toHaveStyle({ overflow: "hidden" })

    unmount()
    renderBenchmarkLabDark()
    expect(screen.getByTestId("model-benchmark-lab")).toHaveAttribute("data-dark-readable", "true")
  })

  it("records V2.7 model benchmark framework in Project Evolution", () => {
    expect(versionData.currentVersion).toBe("V2.7")
    expect(versionData.versions.find(row => row.version === "V2.7").summary).toMatch(/Model Benchmark Lab/)
    expect(versionData.versions.find(row => row.version === "V2.7").validationImpact).toMatch(/Label Count = 0/)
  })
})
