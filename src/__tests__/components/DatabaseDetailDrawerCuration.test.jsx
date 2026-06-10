// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { DatabaseDetailDrawer } from "../../components/database-index/DatabaseDetailDrawer"

const curationRecords = [
  { recordId: "COREMOF_000010", displayName: "Candidate 10", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000010", descriptorProvenanceStatus: "complete", sourceUrl: null, sourceUrlStatus: "pending", doi: null, doiStatus: "pending", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", curationStatus: "needs_source_review", notFinalRecommendation: true },
]

function bodyText() {
  return document.body.textContent || ""
}

describe("DatabaseDetailDrawer manual curation", () => {
  it("shows curation status and remaining blockers when the candidate is in the queue", () => {
    const request = { recordId: "COREMOF_000010", frameworkId: "COREMOF_000010", displayName: "Candidate 10", detailRef: null }
    render(<DatabaseDetailDrawer request={request} curationRecords={curationRecords} onClose={() => {}} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("人工 metadata 整理")).toBeTruthy()
    expect(bodyText()).toMatch(/剩余 blocker/)
    expect(bodyText()).toMatch(/待补/)
    // Never displays a fake link for a pending source.
    expect(document.querySelector('a[href="null"]')).toBeNull()
    expect(bodyText()).not.toMatch(/undefined/)
  })

  it("shows a not-in-queue message when the candidate has no curation record", () => {
    const request = { recordId: "OTHER_999", frameworkId: "OTHER_999", displayName: "Other", detailRef: null }
    render(<DatabaseDetailDrawer request={request} curationRecords={curationRecords} onClose={() => {}} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("该候选暂未进入人工整理队列。")).toBeTruthy()
  })
})
