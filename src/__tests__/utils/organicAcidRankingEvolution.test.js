import { describe, expect, it } from "vitest"
import rankingLog from "../../../public/data/organic_acid_ranking_evolution_log.json"
import audit from "../../../public/data/organic_acid_audit_v3_9_8.json"
import priceTable from "../../../public/data/metal_precursor_cost_table.json"
import { buildDescriptorEvolutionReport } from "../../utils/organicAcidRankingEvolution"

describe("organic acid ranking evolution report", () => {
  it("keeps append-only stage snapshots and derives five analyses from the log", () => {
    const report = buildDescriptorEvolutionReport(rankingLog, audit, priceTable)

    expect(report.stages.map(stage => stage.stage)).toEqual([
      "hand-authored proxy",
      "real-data structural (V3.9.6)",
      "+ligand/synthesizability/economics (V3.9.7)",
      "real prices (V3.9.8)",
    ])
    expect(report.stages.every(stage => stage.top5Routes.length === 5)).toBe(true)
    expect(report.analyses.map(row => row.id)).toEqual(["robust", "sensitive", "economics", "honesty", "limitation"])
    expect(report.analyses.find(row => row.id === "robust").bodyZh).toMatch(/Mo.*4 个阶段/)
    expect(report.analyses.find(row => row.id === "honesty").bodyZh).toContain(`#${rankingLog.stages[2].alMofRank}`)
    expect(report.analyses.find(row => row.id === "economics").bodyZh).toContain(String(rankingLog.descriptorAblation.impactSummary.largestEconomicDrop.rankDelta < 0
      ? Math.abs(rankingLog.descriptorAblation.impactSummary.largestEconomicDrop.rankDelta)
      : rankingLog.descriptorAblation.impactSummary.largestEconomicDrop.rankDelta))
    expect(report.audit.compositeSpearman).toBe(audit.proxyValidity.composite.spearmanRho)
    expect(report.audit.lowConfidenceFamilies).toContain("MIL-type host")
    expect(report.routeSeries.length).toBeGreaterThanOrEqual(5)
  })

  it("changes report values when an appended stage changes", () => {
    const baseline = buildDescriptorEvolutionReport(rankingLog, audit, priceTable)
    const changedLog = structuredClone(rankingLog)
    changedLog.stages.at(-1).routeRankings[0].rank = 4
    changedLog.stages.at(-1).top5Routes[0].rank = 4
    const changed = buildDescriptorEvolutionReport(changedLog, audit, priceTable)

    expect(changed.analyses.find(row => row.id === "economics").bodyZh)
      .not.toBe(baseline.analyses.find(row => row.id === "economics").bodyZh)
  })
})
