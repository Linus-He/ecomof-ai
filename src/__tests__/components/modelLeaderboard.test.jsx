// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import report from "../../../public/data/first_real_benchmark_report_v1.json"
import labelData from "../../../public/data/experimental_labels/experimental_labels_v1.json"
import externalData from "../../../public/data/external_test_dataset_v1.json"
import { ModelLeaderboard } from "../../components/methodology/algorithm-validation/ModelLeaderboard"
import { buildFirstRealBenchmarkReport } from "../../utils/benchmark/firstRealBenchmarkReport"

const body = () => document.body.textContent || ""

describe("ModelLeaderboard", () => {
  it("ranks the three models with real metrics when the gates pass", () => {
    render(<ModelLeaderboard firstBenchmark={report} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("algval-model-leaderboard")).toBeInTheDocument()
    expect(screen.getByTestId("leaderboard-table")).toBeInTheDocument()
    expect(body()).toMatch(/Logistic Regression/)
    expect(body()).toMatch(/Decision Tree/)
    expect(body()).toMatch(/Random Forest/)
    expect(body()).toMatch(/ROC-AUC/i)
    // best model is ranked #1
    expect(screen.getByTestId(`leaderboard-row-${report.leaderboard.bestModel.replace(/\s+/g, "-")}`)).toBeInTheDocument()
    expect(body()).not.toMatch(/Pending/)
  })

  it("shows Blocked with Pending metrics when the gates are not satisfied", () => {
    const blocked = buildFirstRealBenchmarkReport({ experimentalLabels: labelData.labels.slice(0, 5), externalTest: externalData.records.slice(0, 3) })
    render(<ModelLeaderboard firstBenchmark={blocked} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(body()).toMatch(/Blocked/)
    expect(body()).toMatch(/Pending/)
  })
})
