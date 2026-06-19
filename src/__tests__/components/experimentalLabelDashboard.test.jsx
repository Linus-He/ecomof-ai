// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import report from "../../../public/data/first_real_benchmark_report_v1.json"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { ExperimentalLabelDashboard } from "../../components/methodology/algorithm-validation/ExperimentalLabelDashboard"
import { buildFirstRealBenchmarkReport } from "../../utils/benchmark/firstRealBenchmarkReport"

const body = () => document.body.textContent || ""

describe("ExperimentalLabelDashboard", () => {
  it("shows Experimental Label Status (Current/Target/Gap) and the First Real Benchmark dashboard", () => {
    render(<ExperimentalLabelDashboard firstBenchmark={report} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("algval-experimental-labels")).toBeInTheDocument()
    expect(screen.getByTestId("first-benchmark-dashboard")).toBeInTheDocument()
    expect(body()).toMatch(/Experimental Labels/)
    expect(body()).toMatch(/External Test/)
    expect(body()).toMatch(/Leakage Status/)
    expect(body()).toMatch(/Benchmark Status/)
    // Result A → real metrics are shown, not Pending
    expect(screen.getByTestId("benchmark-metrics")).toBeInTheDocument()
    expect(body()).toMatch(/ROC-AUC/)
  })

  it("shows the Pending reasons when the gates are not satisfied (Result B)", () => {
    const pending = buildFirstRealBenchmarkReport({ experimentalLabels: labelData.labels.slice(0, 5), externalTest: externalData.records.slice(0, 3) })
    render(<ExperimentalLabelDashboard firstBenchmark={pending} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("benchmark-pending-reasons")).toBeInTheDocument()
    expect(body()).toMatch(/Pending/)
  })

  it("renders nothing without a report", () => {
    const { container } = render(<ExperimentalLabelDashboard firstBenchmark={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
