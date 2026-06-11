// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { EvidenceBackfillPanel } from "../../components/database-index/EvidenceBackfillPanel"
import { VerifiedCandidateReportPanel } from "../../components/database-index/VerifiedCandidateReportPanel"

const records = [
  { recordId: "C1", displayName: "Candidate 1", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000010", descriptorProvenanceStatus: "complete", sourceUrl: null, sourceStatus: "pending", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", doi: null, doiStatus: "pending", mechanismEvidenceStatus: "weak_proxy", notFinalRecommendation: true },
  { recordId: "C2", displayName: "Candidate 2", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000011", descriptorProvenanceStatus: "complete", sourceUrl: "https://example.org/r", sourceStatus: "confirmed", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", doi: null, doiStatus: "pending", mechanismEvidenceStatus: "weak_proxy", notFinalRecommendation: true },
]

function bodyText() {
  return document.body.textContent || ""
}

describe("EvidenceBackfillPanel", () => {
  it("renders in Chinese with pending labels and no undefined/null", () => {
    render(<EvidenceBackfillPanel records={records} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("证据回填")).toBeTruthy()
    expect(bodyText()).toMatch(/待补/)
    expect(bodyText()).not.toMatch(/undefined|null/)
  })

  it("does not show source_confirmed as verified (verified stays 0)", () => {
    render(<EvidenceBackfillPanel records={records} lang="en" t={THEME_LIGHT} />)
    // One record is source-confirmed, so the panel shows the source-confirmed-but-not-verified message.
    expect(bodyText()).toMatch(/Some candidates have confirmed sources, but none have reached verified metadata yet/i)
    expect(screen.getAllByText("Source confirmed").length).toBeGreaterThan(0)
    expect(bodyText()).toMatch(/does not indicate full verification or final recommendation/i)
  })
})

describe("EvidenceBackfillPanel with V2.0-L source curation", () => {
  const enriched = [
    { recordId: "COREMOF_000001", displayName: "MIL-53(Al)", descriptorProvenanceStatus: "complete", sourceUrl: null, sourceStatus: "confirmed", citation: "Loiseau 2004", citationStatus: "ready", license: null, licenseStatus: "pending", doi: null, doiStatus: "pending", mechanismEvidenceStatus: "weak_proxy", ambiguityWarnings: ["fixture record id; material-level source only"], notFinalRecommendation: true },
  ]
  it("shows source confirmed and an ambiguity warning, but not verified", () => {
    render(<EvidenceBackfillPanel records={enriched} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("证据回填")).toBeTruthy()
    expect(bodyText()).toMatch(/ambiguity warning/)
    expect(bodyText()).toMatch(/已有来源确认候选，但仍未达到 verified metadata/)
  })
})

describe("VerifiedCandidateReportPanel", () => {
  const report = {
    reportStatus: "no_verified_candidates_yet",
    verifiedMetadataCount: 0,
    verifiedCandidates: [],
    nearVerifiedCandidates: [{ recordId: "C1", displayName: "Candidate 1", remainingBlockers: ["sourceUrl pending"], nextActions: ["Confirm original source URL"] }],
  }

  it("shows the empty state and near-verified candidates with a boundary", () => {
    render(<VerifiedCandidateReportPanel report={report} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getAllByText("暂无经核验候选").length).toBeGreaterThan(0)
    expect(bodyText()).toMatch(/剩余 blocker/)
    expect(bodyText()).toMatch(/不是最终推荐/)
  })

  it("shows the source-confirmed-candidates-available state for V2.0-L", () => {
    const sourceConfirmedReport = {
      reportStatus: "source_confirmed_candidates_available",
      verifiedMetadataCount: 0,
      verifiedCandidates: [],
      nearVerifiedCandidates: [{ recordId: "COREMOF_000001", displayName: "MIL-53(Al)", remainingBlockers: ["license pending", "ambiguity unresolved"], nextActions: ["Confirm the license terms"] }],
    }
    render(<VerifiedCandidateReportPanel report={sourceConfirmedReport} lang="zh" t={THEME_LIGHT} />)
    expect(bodyText()).toMatch(/已有来源确认候选/)
    expect(bodyText()).toMatch(/仍未达到 verified metadata/)
  })
})
