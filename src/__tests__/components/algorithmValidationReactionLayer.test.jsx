// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v2.json"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import verifiedMetadataReport from "../../../public/data/data_ingestion/verified_metadata_expansion_report.json"
import growthSummary from "../../../public/data/data_ingestion/reaction_data_expansion_summary_v3_1.json"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { rankOrganicAcidCandidates } from "../../utils/organicAcid/rankOrganicAcidCandidates"
import { organicAcidFixtureCandidates } from "../utils/organicAcidFixtures"
import { AlgorithmValidationCenter } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"

const dataFoundation = summarizeDataFoundation({ gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary })
const organicAcidResult = {
  organicAcidAlgorithm: rankOrganicAcidCandidates({
    candidates: organicAcidFixtureCandidates(),
    scoringMode: "formic_acid_priority",
    reactionDataset: reaction,
    goldDataset: gold,
    labelDataset: labels,
  }),
}

describe("Algorithm Validation Center V3.1 reaction layer", () => {
  it("shows reaction counts, Current / Target / Gap, and pending ML metric reasons", () => {
    render(<AlgorithmValidationCenter summary={summary} organicAcidResult={organicAcidResult} dataFoundation={dataFoundation} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByText(/Reaction Dataset Count/i)).toBeInTheDocument()
    expect(screen.getAllByText(String(dataFoundation.reactionDatasetCount)).length).toBeGreaterThan(0)
    expect(document.body.textContent).toMatch(/Current \/ Target \/ Gap/)
    expect(screen.getByTestId("future-metric-pending-reason")).toHaveTextContent(/Experimental labels required/)
    expect(document.body.textContent).toMatch(/Accuracy \/ ROC-AUC/)
  })

  it("adds reaction weights to Organic Acid algorithm output", () => {
    const top = organicAcidResult.organicAcidAlgorithm.topCandidates[0]
    expect(organicAcidResult.organicAcidAlgorithm.scoringSummary.reactionLayer.reactionCount).toBe(120)
    expect(organicAcidResult.organicAcidAlgorithm.scoringSummary.reactionWeights).toEqual(expect.arrayContaining([
      "Reaction Evidence Weight",
      "Reaction Quality Weight",
      "Comparability Weight",
      "Label Confidence Weight",
    ]))
    expect(top.scoreBreakdown.reactionLayer).toHaveProperty("reactionEvidenceWeight")
    expect(top.decisionTrace.map(step => step.step)).toContain("Reaction Data Integration")
  })
})
