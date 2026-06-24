import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import records from "../../../public/data/database_precompute/v2_2/scalable_database_preview_records.json"
import summary from "../../../public/data/database_precompute/v2_2/scalable_database_preview_summary.json"
import versionData from "../../../public/data/version_evolution_records.json"
import rankingEvolutionLog from "../../../public/data/organic_acid_ranking_evolution_log.json"
import organicAcidAudit from "../../../public/data/organic_acid_audit_v3_9_8.json"
import metalPriceTable from "../../../public/data/metal_precursor_cost_table.json"
import { TABS } from "../../constants/badges"
import { HASH_TO_TAB } from "../../utils/deepLinks"
import { ResearchReportsTab } from "../../components/tabs/ResearchReportsTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("ResearchReportsTab", () => {
  it("renders Research Reports as a first-level tab with report outputs", () => {
    expect(TABS.map(tab => tab.id)).toEqual([
      "home",
      "library",
      "ecoscreen",
      "gassep",
      "catalysis",
      "about",
      "projectEvolution",
      "researchReports",
    ])
    expect(HASH_TO_TAB["research-reports"]).toBe("researchReports")

    render(
      <ResearchReportsTab
        records={records}
        summary={summary}
        versionData={versionData}
        rankingEvolutionLog={rankingEvolutionLog}
        organicAcidAudit={organicAcidAudit}
        metalPriceTable={metalPriceTable}
      />
    )

    expect(screen.getByTestId("research-reports-tab")).toBeInTheDocument()
    expect(screen.getByTestId("research-reports-generator")).toBeInTheDocument()
    expect(screen.getByTestId("research-validation-summary")).toBeInTheDocument()
    expect(screen.getByTestId("research-reports-snapshot")).toBeInTheDocument()
    expect(screen.getByTestId("research-reports-citation-package")).toBeInTheDocument()
    expect(screen.getByTestId("research-reports-localization-audit")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evolution-report-section")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evolution-table")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evolution-line-chart")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evolution-analysis")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evolution-audit")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Research Reports|研究报告/)
    expect(bodyText()).toMatch(/Research Validation Summary/)
    expect(bodyText()).toMatch(/Evidence Coverage/)
    expect(bodyText()).toMatch(/Label Diversity/)
    expect(bodyText()).toMatch(/Validation Queue/)
    expect(bodyText()).toMatch(/Run Snapshot|运行快照/)
    expect(bodyText()).toMatch(/Citation Package|引用包/)
    expect(bodyText()).toMatch(/Localization Coverage/)
    expect(bodyText()).toMatch(/Terminology Consistency/)
    expect(bodyText()).toMatch(/Scientific Language Consistency/)
    expect(bodyText()).toMatch(/稳健结论|Robust conclusion/)
    expect(bodyText()).toMatch(/诚实性背书|Integrity check/)
  })
})
