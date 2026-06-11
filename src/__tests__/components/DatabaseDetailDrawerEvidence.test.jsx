// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DatabaseDetailDrawer } from "../../components/database-index/DatabaseDetailDrawer"

const evidenceBackfillRecords = [
  { recordId: "COREMOF_000010", displayName: "Candidate 10", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000010", descriptorProvenanceStatus: "complete", sourceUrl: null, sourceStatus: "pending", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", doi: null, doiStatus: "pending", mechanismEvidenceStatus: "weak_proxy", notFinalRecommendation: true },
]

function bodyText() {
  return document.body.textContent || ""
}

describe("DatabaseDetailDrawer evidence backfill", () => {
  it("shows evidence backfill status, no fake link, and pending citation", () => {
    const request = { recordId: "COREMOF_000010", frameworkId: "COREMOF_000010", displayName: "Candidate 10", detailRef: null }
    render(<DatabaseDetailDrawer request={request} evidenceBackfillRecords={evidenceBackfillRecords} onClose={() => {}} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("证据回填")).toBeTruthy()
    expect(bodyText()).toMatch(/待补/)
    // No fake link rendered for a null sourceUrl.
    expect(document.querySelector('a[href="null"]')).toBeNull()
    // verifiedMetadataEligible false reason is shown.
    expect(bodyText()).toMatch(/可升级为 verified_metadata/)
    expect(bodyText()).not.toMatch(/undefined/)
  })

  it("shows a not-in-queue message when the candidate has no evidence record", () => {
    const request = { recordId: "OTHER_999", frameworkId: "OTHER_999", displayName: "Other", detailRef: null }
    render(<DatabaseDetailDrawer request={request} evidenceBackfillRecords={evidenceBackfillRecords} onClose={() => {}} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("该候选暂未进入证据回填队列。")).toBeTruthy()
  })
})
