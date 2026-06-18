// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import gold from "../../../public/data/organic_acid_gold_dataset_v1.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v1.json"
import benchmark from "../../../public/data/benchmark_dataset_v1.json"
import labels from "../../../public/data/organic_acid_labels_v1.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"
import { AlgorithmValidationCenter } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"

const dataFoundation = summarizeDataFoundation({ gold, literature, benchmark, labels })

function renderCenter() {
  return render(
    <AlgorithmValidationCenter
      summary={summary}
      organicAcidResult={{ organicAcidAlgorithm: rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" }) }}
      dataFoundation={dataFoundation}
      lang="en"
      t={THEME_LIGHT}
      isMobile={false}
    />,
  )
}

describe("Algorithm Validation Center data layer (V3.0)", () => {
  it("shows the Data Foundation dataset counts in the Database layer", () => {
    renderCenter()
    const layer = screen.getByTestId("algval-data-foundation")
    expect(within(layer).getByText(/Gold Dataset/i)).toBeInTheDocument()
    expect(within(layer).getByText(/Literature Dataset/i)).toBeInTheDocument()
    expect(within(layer).getByText(/Benchmark Dataset/i)).toBeInTheDocument()
    expect(within(layer).getByText(/Label Count/i)).toBeInTheDocument()
    expect(within(layer).getByText(/Benchmark Eligible/i)).toBeInTheDocument()
    expect(within(layer).getByText(String(dataFoundation.goldCount))).toBeInTheDocument()
  })

  it("surfaces the data status inside the interactive figure database node", () => {
    renderCenter()
    const body = document.body.textContent || ""
    expect(body).toMatch(new RegExp(`Gold ${dataFoundation.goldCount}`))
    expect(body).toMatch(new RegExp(`Literature ${dataFoundation.literatureCount}`))
    expect(body).toMatch(new RegExp(`Labels ${dataFoundation.labelCount}`))
  })

  it("keeps Future Machine Learning Pending with readiness dimensions and no fabricated metrics", () => {
    renderCenter()
    const body = document.body.textContent || ""
    expect(body).toMatch(/Accuracy: Pending/)
    expect(body).toMatch(/Benchmark Readiness/)
    expect(body).toMatch(/Label Readiness/)
    expect(body).toMatch(/Data Quality Readiness/)
    expect(body).toMatch(/Experimental Labels Required/)
    expect(body).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
    expect(body).not.toMatch(/ROC-?AUC:\s*(0\.\d+|[1-9]\d?%?)/i)
  })

  it("reflects label count zero (no fabricated experimental labels)", () => {
    renderCenter()
    expect(dataFoundation.labelCount).toBe(0)
    expect(document.body.textContent).toMatch(/Label Count = 0/)
  })
})
