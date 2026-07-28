// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import gold from "../../../public/data/organic_acid_gold_dataset_v1.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v1.json"
import benchmark from "../../../public/data/benchmark_dataset_v1.json"
import labels from "../../../public/data/organic_acid_labels_v1.json"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { DataQualitySummary } from "../../components/data-quality/DataQualitySummary"

const summary = summarizeDataFoundation({ gold, literature, benchmark, labels })

function renderSummary() {
  return render(<DataQualitySummary summary={summary} records={literature.records} lang="en" t={THEME_LIGHT} isMobile={false} />)
}

describe("EcoScreen Data Quality integration", () => {
  it("renders the Data Quality Summary with tier counts and provenance", () => {
    renderSummary()
    const panel = screen.getByTestId("data-quality-summary")
    expect(within(panel).getByText(/Total reviewed records/i)).toBeInTheDocument()
    expect(within(panel).getByText(/^Gold$/)).toBeInTheDocument()
    expect(within(panel).getByText(/^Silver$/)).toBeInTheDocument()
    expect(within(panel).getByText(/^Bronze$/)).toBeInTheDocument()
    expect(within(panel).getByText(/^Rejected$/)).toBeInTheDocument()
    expect(within(panel).getByText(/^Verified Metadata$/)).toBeInTheDocument()
    expect(within(panel).getByText(/^Provenance Coverage$/)).toBeInTheDocument()
  })

  it("offers the four tier filters and updates the in-view count", () => {
    renderSummary()
    for (const id of ["gold_only", "gold_silver", "include_bronze", "exclude_rejected"]) {
      expect(screen.getByTestId(`data-quality-filter-${id}`)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByTestId("data-quality-filter-gold_only"))
    expect(screen.getByText(`${summary.qualityDistribution.Gold} records in view`)).toBeInTheDocument()
  })

  it("omits unavailable current layers instead of displaying zero-value status cards", () => {
    renderSummary()
    const panel = screen.getByTestId("data-quality-summary")
    expect(panel).not.toHaveTextContent("Gold Status")
    expect(panel).not.toHaveTextContent("Reaction Dataset")
    expect(panel).not.toHaveTextContent("Label Count")
    expect(within(panel).queryByText("Benchmark Eligible")).not.toBeInTheDocument()
  })
})
