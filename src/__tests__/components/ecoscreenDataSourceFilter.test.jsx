// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import core from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmof from "../../../public/data/data_ingestion/qmof_import_v2.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v3.json"
import gold from "../../../public/data/organic_acid_gold_dataset_v3.json"
import verified from "../../../public/data/data_ingestion/verified_metadata_expansion_report_v3.json"
import reaction from "../../../public/data/organic_acid_reaction_dataset_v3.json"
import benchmark from "../../../public/data/benchmark_dataset_v3.json"
import growth from "../../../public/data/data_ingestion/data_growth_tracker_v3_3.json"
import foundationGold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import foundationLiterature from "../../../public/data/organic_acid_literature_dataset_v2.json"
import foundationBenchmark from "../../../public/data/benchmark_dataset_v2.json"
import foundationLabels from "../../../public/data/organic_acid_labels_v2.json"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { dataIngestionSummary } from "../../utils/dataIngestion/index"
import { DataQualitySummary } from "../../components/data-quality/DataQualitySummary"

const summary = summarizeDataFoundation({ gold: foundationGold, literature: foundationLiterature, benchmark: foundationBenchmark, labels: foundationLabels })
const dataIngestion = dataIngestionSummary({ core, qmof, literature, gold, verified, reaction, benchmark, growth })

function renderSummary() {
  return render(<DataQualitySummary summary={summary} records={foundationLiterature.records} dataIngestion={dataIngestion} lang="en" t={THEME_LIGHT} isMobile={false} />)
}

describe("EcoScreen data source filters (V3.3)", () => {
  it("offers External Database / Literature / Experimental / Derived + Verified Metadata Only filters", () => {
    renderSummary()
    for (const id of ["external_database", "literature", "experimental", "derived", "verified_metadata_only"]) {
      expect(screen.getByTestId(`data-source-filter-${id}`)).toBeInTheDocument()
    }
  })

  it("shows a data source breakdown and a V3.0->V3.3 growth tracker", () => {
    renderSummary()
    expect(screen.getByTestId("data-source-breakdown")).toBeInTheDocument()
    const tracker = screen.getByTestId("data-growth-tracker")
    expect(tracker.textContent).toMatch(/V3.0/)
    expect(tracker.textContent).toMatch(/V3.3/)
  })

  it("lets the user select a data-source filter", () => {
    renderSummary()
    const button = screen.getByTestId("data-source-filter-external_database")
    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-pressed", "true")
  })
})
