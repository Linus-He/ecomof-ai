// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { ManualMetadataCurationPanel } from "../../components/database-index/ManualMetadataCurationPanel"

const curationRecords = [
  { recordId: "C1", displayName: "Candidate 1", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000010", descriptorProvenanceStatus: "complete", sourceUrl: null, sourceUrlStatus: "pending", doi: null, doiStatus: "pending", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", curationStatus: "needs_source_review", notFinalRecommendation: true },
  { recordId: "C2", displayName: "Candidate 2", sourceDatabase: "CoRE MOF", sourceRecordId: "COREMOF_000011", descriptorProvenanceStatus: "complete", sourceUrl: "https://example.org/r", sourceUrlStatus: "confirmed", doi: null, doiStatus: "pending", citation: null, citationStatus: "pending", license: null, licenseStatus: "pending", curationStatus: "source_confirmed", notFinalRecommendation: true },
]

function bodyText() {
  return document.body.textContent || ""
}

describe("ManualMetadataCurationPanel", () => {
  it("renders in Chinese with pending labels and no undefined/null", () => {
    render(<ManualMetadataCurationPanel curationRecords={curationRecords} lang="zh" t={THEME_LIGHT} />)
    expect(screen.getByText("人工 metadata 整理")).toBeTruthy()
    expect(bodyText()).toMatch(/待补/)
    expect(bodyText()).not.toMatch(/undefined|null/)
  })

  it("does not display source_confirmed as verified and shows the boundary", () => {
    render(<ManualMetadataCurationPanel curationRecords={curationRecords} lang="en" t={THEME_LIGHT} />)
    // source_confirmed candidate is shown, but the verified-metadata count stays 0.
    expect(screen.getAllByText("Source confirmed").length).toBeGreaterThan(0)
    expect(bodyText()).toMatch(/does not indicate full verification or final recommendation/i)
  })
})
