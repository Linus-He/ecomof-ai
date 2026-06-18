// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import { runDataAudit } from "../../utils/dataAudit/index"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"
import { AlgorithmValidationCenter } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"

const dataAudit = runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 })

function renderCenter() {
  return render(
    <AlgorithmValidationCenter
      summary={summary}
      organicAcidResult={{ organicAcidAlgorithm: rankOrganicAcidCandidates({ candidates: organicAcidFixtureCandidates(), scoringMode: "formic_acid_priority" }) }}
      dataAudit={dataAudit}
      lang="en"
      t={THEME_LIGHT}
      isMobile={false}
    />,
  )
}

describe("First Real Benchmark Dashboard + Data Audit Center", () => {
  it("renders the Data Audit Center dashboard with the six audits", () => {
    renderCenter()
    const dashboard = screen.getByTestId("audit-dashboard")
    for (const title of ["Gold Dataset Audit", "Label Audit", "Benchmark Eligibility Audit", "Reaction Audit", "Provenance Audit", "Data Leakage Audit"]) {
      expect(within(dashboard).getByText(title)).toBeInTheDocument()
    }
  })

  it("renders the First Real Benchmark Dashboard with Accuracy/ROC Pending and no fabricated metrics", () => {
    renderCenter()
    const board = screen.getByTestId("algval-first-benchmark")
    expect(within(board).getByText(/^Current Benchmark Status$/)).toBeInTheDocument()
    expect(within(board).getByText(/^Leakage Status$/)).toBeInTheDocument()
    expect(within(board).getByText(/^Label Status$/)).toBeInTheDocument()
    expect(board.textContent).toMatch(/Accuracy: Pending/)
    expect(board.textContent).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
    expect(board.textContent).not.toMatch(/ROC-?AUC:\s*(0\.\d+|[1-9]\d?%?)/i)
  })

  it("explains why Accuracy / ROC cannot be shown yet", () => {
    renderCenter()
    expect(screen.getByTestId("benchmark-pending-reasons").textContent).toMatch(/experimental labels/i)
  })

  it("confirms the V3.2 acceptance criteria on the real audit", () => {
    expect(dataAudit.acceptance.goldAuditPassRate).toBeGreaterThanOrEqual(0.95)
    expect(dataAudit.acceptance.leakCount).toBe(0)
    expect(dataAudit.acceptance.invalidGroundTruth).toBe(0)
    expect(dataAudit.acceptance.benchmarkEligibleConfirmed).toBeGreaterThanOrEqual(100)
    expect(dataAudit.acceptance.splitComplete).toBe(true)
    expect(dataAudit.acceptance.benchmarkReportGenerated).toBe(true)
  })
})
