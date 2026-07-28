// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import core from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmof from "../../../public/data/data_ingestion/qmof_import_v2.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v3.json"
import gold from "../../../public/data/organic_acid_gold_dataset_v3.json"
import verified from "../../../public/data/data_ingestion/verified_metadata_expansion_report_v3.json"
import reaction from "../../../public/data/organic_acid_reaction_dataset_v3.json"
import benchmark from "../../../public/data/benchmark_dataset_v3.json"
import summaryFixture from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import { dataIngestionSummary } from "../../utils/dataIngestion/index"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"
import { AlgorithmValidationCenter } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"

const dataIngestion = dataIngestionSummary({ core, qmof, literature, gold, verified, reaction, benchmark })

function renderCenter() {
  return render(
    <AlgorithmValidationCenter
      summary={summaryFixture}
      organicAcidResult={{ organicAcidAlgorithm: rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" }) }}
      dataIngestion={dataIngestion}
      lang="en"
      t={THEME_LIGHT}
      isMobile={false}
    />,
  )
}

describe("Algorithm Validation Center database stats (V3.3)", () => {
  it("shows only current non-zero data-source counts", () => {
    renderCenter()
    const stats = screen.getByTestId("algval-data-source-stats")
    expect(within(stats).getByText(/^External Database$/)).toBeInTheDocument()
    expect(within(stats).queryByText(/^Literature$/)).not.toBeInTheDocument()
    expect(within(stats).queryByText(/^Experimental$/)).not.toBeInTheDocument()
    expect(within(stats).queryByText(/^Derived$/)).not.toBeInTheDocument()
  })

  it("uses the real CoRE 2024 CR source and quarantines unsupported current layers", () => {
    expect(dataIngestion.totalRecords).toBe(9835)
    expect(dataIngestion.acceptance.coreMof).toBe(true)
    expect(dataIngestion.acceptance.qmof).toBe(false)
    expect(dataIngestion.acceptance.literature).toBe(false)
    expect(dataIngestion.acceptance.verifiedMetadata).toBe(true)
    expect(dataIngestion.acceptance.goldDataset).toBe(false)
    expect(dataIngestion.acceptance.reactionDataset).toBe(false)
    expect(dataIngestion.availability.qmof.status).toBe("quarantined")
  })

  it("never counts derived data as experimental labels", () => {
    renderCenter()
    expect(dataIngestion.experimentalCount).toBe(0)
    expect(dataIngestion.derivedCount).toBe(0)
    expect(screen.getByTestId("algval-data-source-stats").textContent).toMatch(/Experimental Labels = 0/)
  })
})
