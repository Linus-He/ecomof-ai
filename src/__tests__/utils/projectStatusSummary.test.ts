// @ts-nocheck
import { describe, expect, it } from "vitest"
import versionEvolution from "../../../public/data/version_evolution_records.json"
import versionDocs from "../../../public/data/organic_acid_final_screening/version_docs.json"
import dataIngestionSummary from "../../../public/data/data_ingestion/data_ingestion_summary_v3.json"
import benchmarkDatasetV36 from "../../../public/data/benchmark_dataset_v3_6.json"
import experimentalLabelsV2 from "../../../public/data/experimental_labels/experimental_labels_v2.json"
import experimentalLabelGrowth from "../../../public/data/data_ingestion/experimental_label_growth_v3_6.json"
import modelRobustness from "../../../public/data/model_robustness_report_v1.json"
import { buildProjectOverviewCards, buildProjectStatusSummary } from "../../utils/projectStatus"

describe("projectStatusSummary", () => {
  it("builds the V3.7 dynamic project status summary from research artifacts", () => {
    const summary = buildProjectStatusSummary({
      versionEvolution,
      versionDocs,
      dataIngestionSummary,
      benchmarkDatasetV36,
      experimentalLabelsV2,
      experimentalLabelGrowth,
      modelRobustness,
    })

    expect(summary).toMatchObject({
      currentVersion: "V3.9.5.1",
      databaseScale: 3020,
      verifiedMetadata: 2480,
      goldDataset: 320,
      experimentalLabels: 150,
      externalTest: 80,
      benchmarkEligible: 230,
      bestModel: "Random Forest",
      accuracy: 0.725,
      rocAuc: 0.7558,
      credibilityScore: 78.87,
      credibilityGrade: "B",
      currentRisk: "High Overfitting Risk",
    })

    for (const [field, source] of Object.entries(summary.sources)) {
      expect(source.sourceDatabase, field).toBeTruthy()
      expect(source.sourceRecordId, field).toBeTruthy()
      expect(source.sourceUrl, field).toBeTruthy()
      expect(source.evidenceTier, field).toBeTruthy()
    }
  })

  it("maps the dynamic summary into overview cards without stale V3.3 values", () => {
    const cards = buildProjectOverviewCards(buildProjectStatusSummary({ versionEvolution, dataIngestionSummary, benchmarkDatasetV36, experimentalLabelsV2, modelRobustness }))
    const text = cards.map(card => `${card.label}:${card.value}`).join(" | ")

    expect(text).toContain("Current Version:V3.9.5.1")
    expect(text).toContain("Database Scale:3020+")
    expect(text).toContain("Experimental Labels:150")
    expect(text).toContain("Benchmark Ready:230")
    expect(text).toContain("Best Model:Random Forest")
    expect(text).toContain("Credibility:78.87 / Grade B")
    expect(text).toContain("Current Risk:High Overfitting Risk")
    expect(text).not.toContain("V3.3")
    expect(text).not.toContain("Validation Pending")
  })
})
