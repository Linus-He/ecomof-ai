import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { VerifiedBlockerSummary } from "../../components/data-quality/DataQualityAuditPanel"

describe("VerifiedBlockerSummary", () => {
  it("shows blocker counts and the verified metadata boundary", () => {
    const audit = {
      blockerCounts: {
        "critical field provenance incomplete": 12,
        "synthetic fixture": 8,
        "field topology ambiguous": 3,
      },
    }
    render(<VerifiedBlockerSummary audit={audit} lang="en" t={THEME_LIGHT} />)

    expect(screen.getByTestId("verified-blocker-summary")).toBeInTheDocument()
    expect(screen.getByText("Verified Blocker Summary")).toBeInTheDocument()
    expect(screen.getByText("critical field provenance incomplete")).toBeInTheDocument()
    expect(screen.getByText("synthetic fixture")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/source_confirmed, citation_ready, and near_verified do not automatically equal verified_metadata/)
  })
})
