// @ts-nocheck
import { describe, expect, it } from "vitest"
import gold from "../../../public/data/organic_acid_gold_dataset_v2.json"
import literature from "../../../public/data/organic_acid_literature_dataset_v2.json"
import benchmark from "../../../public/data/benchmark_dataset_v2.json"
import labels from "../../../public/data/organic_acid_labels_v2.json"
import reaction from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import verifiedMetadataReport from "../../../public/data/data_ingestion/verified_metadata_expansion_report.json"
import growthSummary from "../../../public/data/data_ingestion/reaction_data_expansion_summary_v3_1.json"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { generateResearchReport } from "../../utils/researchReports"

const dataFoundation = summarizeDataFoundation({ gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary })

describe("V3.1 reaction summary research report", () => {
  it("adds reaction dataset and benchmark progress sections without fake Accuracy", () => {
    const report = generateResearchReport({
      type: "candidate",
      records: [{ candidateId: "c1", displayName: "Candidate 1", verifiedMetadata: true }],
      summary: { totalCandidates: 1, verifiedMetadataCount: 1, databaseVersion: "V3.1" },
      versionData: { currentVersion: "V3.1" },
      candidateId: "c1",
      dataFoundation,
    })
    expect(report.markdown).toMatch(/Reaction Dataset Summary/)
    expect(report.markdown).toMatch(/Benchmark Progress/)
    expect(report.markdown).toMatch(/Reaction Count 120/)
    expect(report.markdown).toMatch(/Accuracy \/ ROC-AUC.*Pending/)
    expect(report.markdown).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
  })
})
