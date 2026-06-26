// @ts-nocheck
import { describe, expect, it } from "vitest"
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"
import reactionDataset from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import literatureDataset from "../../../public/data/organic_acid_literature_dataset_v2.json"
import goldDataset from "../../../public/data/organic_acid_gold_dataset_v2.json"
import auditArtifact from "../../../public/data/organic_acid_audit_v3_9_7.json"
import rerunArtifact from "../../../public/data/organic_acid_rerun_v3_9_7.json"
import currentAuditArtifact from "../../../public/data/organic_acid_audit_v3_9_8.json"
import currentRerunArtifact from "../../../public/data/organic_acid_rerun_v3_9_8.json"
import {
  buildFamilyFairnessAudit,
  buildOrganicAcidAudit,
  buildProxyValidityAudit,
  spearmanCorrelation,
} from "../../utils/organicAcidAudit"

function structuralRecord(metalNode, value, id) {
  return {
    mofId: id,
    metalNode,
    surfaceArea: value,
    poreVolume: value,
    voidFraction: value,
  }
}

function reactionRecord(metalNode, value, id) {
  return {
    reactionId: id,
    metalNode,
    yield: value,
    selectivity: value,
  }
}

describe("organic acid V3.9.7 audits", () => {
  it("computes Spearman direction and flags non-positive structural proxies", () => {
    expect(spearmanCorrelation([1, 2, 3], [10, 20, 30])).toBeCloseTo(1)
    expect(spearmanCorrelation([1, 2, 3], [30, 20, 10])).toBeCloseTo(-1)

    const core = {
      version: "positive",
      records: [
        structuralRecord("Al", 1, "al"),
        structuralRecord("Ti", 2, "ti"),
        structuralRecord("Fe", 3, "fe"),
      ],
    }
    const positive = buildProxyValidityAudit({
      coreMofImport: core,
      reactionDataset: {
        records: [
          reactionRecord("Al", 10, "al-r"),
          reactionRecord("Ti", 20, "ti-r"),
          reactionRecord("Fe", 30, "fe-r"),
        ],
      },
    }, { families: ["Al-MOF", "Ti-MOF", "Fe-MOF"] })
    const negative = buildProxyValidityAudit({
      coreMofImport: core,
      reactionDataset: {
        records: [
          reactionRecord("Al", 30, "al-r"),
          reactionRecord("Ti", 20, "ti-r"),
          reactionRecord("Fe", 10, "fe-r"),
        ],
      },
    }, { families: ["Al-MOF", "Ti-MOF", "Fe-MOF"] })

    expect(positive.descriptors[0].validity).toBe("positive-tracking-signal")
    expect(negative.descriptors[0].validity).toBe("low-validity-for-this-reaction")
    expect(negative.weightChangeApplied).toBe(false)
  })

  it("reports family counts, IQR outliers, dominant records, and low confidence", () => {
    const audit = buildFamilyFairnessAudit({
      coreMofImport: {
        records: [
          structuralRecord("Al", 1, "al-1"),
          structuralRecord("Al", 1.1, "al-2"),
          structuralRecord("Al", 1.2, "al-3"),
          structuralRecord("Al", 1.3, "al-4"),
          structuralRecord("Al", 1.4, "al-5"),
          structuralRecord("Al", 100, "al-outlier"),
        ],
      },
    }, { families: ["Al-MOF"], minimumRecords: 5 })
    const family = audit.familyReports[0]

    expect(family.nRecords.core).toBe(6)
    expect(family.descriptors.surfaceArea.outlierRefs).toContain("al-outlier")
    expect(family.dominantRecords[0].recordRef).toBe("al-outlier")
    expect(family.confidence).toBe("low-confidence-family")
  })

  it("builds the current real-data audit without mutating scoring", () => {
    const audit = buildOrganicAcidAudit({
      coreMofImport,
      qmofImport,
      reactionDataset,
      literatureDataset,
      goldDataset,
    })

    expect(audit.version).toBe("V3.9.8")
    // B1 (V3.10.0): validity extended to 8 descriptors (5 structural + 3 route-level), each with n + indicative caveat.
    expect(audit.proxyValidity.descriptors).toHaveLength(8)
    for (const descriptor of audit.proxyValidity.descriptors) {
      expect(typeof descriptor.n).toBe("number")
      expect(descriptor.indicative).toBe(true)
      expect(descriptor.powerCaveat).toMatch(/indicative, not confirmatory/)
    }
    expect(audit.proxyValidity.statisticalPowerNote).toMatch(/indicative, not confirmatory/)
    expect(audit.proxyValidity.insufficientNDescriptors.length).toBeGreaterThan(0)
    expect(audit.proxyValidity.familyRows.find(row => row.family === "Al-MOF").reactionRecords).toBeGreaterThan(0)
    expect(audit.familyFairness.familyReports.find(row => row.family === "MIL-type host").nRecords).toEqual(expect.objectContaining({
      core: expect.any(Number),
      qmof: expect.any(Number),
    }))
    expect(audit.scoringMutation.applied).toBe(false)
  })

  it("persists the Stage A audit and locked V3.9.7 rerun artifacts", () => {
    expect(auditArtifact.proxyValidity.lowValidityDescriptors).toEqual(expect.arrayContaining(["surfaceArea", "voidFraction"]))
    expect(auditArtifact.familyFairness.lowConfidenceFamilies).toContain("MIL-type host")
    expect(auditArtifact.rankingSensitivity.summary.scenarioCount).toBe(14)
    expect(auditArtifact.rankingSensitivity.candidateRankDistributions.find(row => row.hostMof === "Al-MOF")).toEqual(expect.objectContaining({
      minRank: 4,
      maxRank: 5,
    }))

    expect(rerunArtifact.scoringSpec.specId).toBe("organic-acid-host-guest-scoring-spec-v2")
    expect(rerunArtifact.scoringSpec.policy).toMatch(/not to favor any candidate/)
    expect(rerunArtifact.routeRanking[0]).toEqual(expect.objectContaining({
      routeId: "route-cu-mof-mo",
      ranking: 1,
    }))
    expect(rerunArtifact.routeRanking.find(row => row.routeId === "route-al-mof-mo").ranking).toBe(3)
    expect(rerunArtifact.routeRanking.find(row => row.routeId === "route-ti-mof-mo").ranking).toBe(6)
    expect(rerunArtifact.boundary).toMatch(/No post-hoc weight change/)
  })

  it("persists V3.9.8 audit conclusions and the locked-spec real-price rerun", () => {
    expect(currentAuditArtifact.version).toBe("V3.9.8")
    expect(currentAuditArtifact.proxyValidity.composite.spearmanRho).toBeGreaterThan(0.1)
    expect(currentAuditArtifact.proxyValidity.lowValidityDescriptors).toContain("voidFraction")
    expect(currentAuditArtifact.familyFairness.lowConfidenceFamilies).toContain("MIL-type host")
    expect(currentAuditArtifact.scoringMutation).toEqual(expect.objectContaining({
      applied: false,
      note: expect.stringMatching(/price data only|weights/i),
    }))
    expect(currentRerunArtifact.scoringSpec.specId).toBe("organic-acid-host-guest-scoring-spec-v2")
    expect(currentRerunArtifact.priceTable.version).toBe("V3.9.8")
    expect(currentRerunArtifact.descriptorAblation.layers).toHaveLength(4)
    expect(currentRerunArtifact.boundary).toMatch(/No post-hoc weight change/)
  })
})
