// @ts-nocheck
import { describe, expect, it } from "vitest"
import queue from "../../../public/data/catalysis_v2/catalysis_candidate_queue_v1.json"
import suggestions from "../../../public/data/catalysis_v2/catalysis_extraction_suggestions_v1.json"
import batches from "../../../public/data/catalysis_v2/catalysis_discovery_batches_v1.json"
import {
  buildCatalysisDiscoveryView,
  catalysisCandidateGate,
  filterCatalysisDiscoveryCandidates,
  validateCatalysisSuggestionIsolation,
} from "../../utils/catalysisDiscoveryP2"

describe("catalysis discovery P2 view model", () => {
  it("joins candidates to machine suggestions without changing status", () => {
    const view = buildCatalysisDiscoveryView(queue, suggestions, batches)
    expect(view.candidates).toHaveLength(9)
    expect(view.candidates.every(candidate => candidate.suggestion?.candidateId === candidate.id)).toBe(true)
    expect(view.candidates.every(candidate => candidate.suggestion?.reviewStatus === "suggested-not-verified")).toBe(true)
  })

  it("filters reaction families and preserves DOI-only gate semantics", () => {
    const view = buildCatalysisDiscoveryView(queue, suggestions, batches)
    const c2 = filterCatalysisDiscoveryCandidates(view.candidates, "co2rr-c2plus-mof")
    expect(c2).toHaveLength(2)
    expect(c2.every(candidate => candidate.familyId === "co2rr-c2plus-mof")).toBe(true)
    expect(catalysisCandidateGate(c2[0])).toMatchObject({ doiMatched: true, fullTextVerified: false, formalLibraryEligible: false })
  })

  it("rejects any suggestion capable of automatic promotion", () => {
    expect(validateCatalysisSuggestionIsolation(suggestions.suggestions)).toBe(true)
    expect(validateCatalysisSuggestionIsolation([{ ...suggestions.suggestions[0], promotionAllowed: true }])).toBe(false)
  })
})
