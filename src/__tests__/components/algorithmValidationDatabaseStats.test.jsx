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
  it("shows External Database / Literature / Experimental / Derived counts", () => {
    renderCenter()
    const stats = screen.getByTestId("algval-data-source-stats")
    expect(within(stats).getByText(/^External Database$/)).toBeInTheDocument()
    expect(within(stats).getByText(/^Literature$/)).toBeInTheDocument()
    expect(within(stats).getByText(/^Experimental$/)).toBeInTheDocument()
    expect(within(stats).getByText(/^Derived$/)).toBeInTheDocument()
  })

  it("meets the V3.3 acceptance criteria (total >= 2000, CoRE/QMOF >= 1200, etc.)", () => {
    expect(dataIngestion.totalRecords).toBeGreaterThanOrEqual(2000)
    expect(dataIngestion.acceptance.coreMof).toBe(true)
    expect(dataIngestion.acceptance.qmof).toBe(true)
    expect(dataIngestion.acceptance.literature).toBe(true)
    expect(dataIngestion.acceptance.verifiedMetadata).toBe(true)
    expect(dataIngestion.acceptance.goldDataset).toBe(true)
    expect(dataIngestion.acceptance.reactionDataset).toBe(true)
  })

  it("never counts derived data as experimental labels", () => {
    renderCenter()
    expect(dataIngestion.experimentalCount).toBe(0)
    expect(dataIngestion.derivedCount).toBeGreaterThan(0)
    expect(screen.getByTestId("algval-data-source-stats").textContent).toMatch(/Experimental Labels = 0/)
  })
})
