import { describe, expect, it } from "vitest"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"
import { buildRouteHgcpsScoreProvenance } from "../../utils/organicAcidScoreProvenance"
import {
  buildFactorBand,
  buildRankingUncertainty,
  buildRouteUncertainty,
  buildScoreUncertaintyModel,
} from "../../utils/organicAcidDataDerivation/scoreUncertainty"

const workbench = buildOrganicAcidHostGuestWorkbench({
  pathwaySteps,
  pathwayDescriptorMap,
  hostMofCandidates,
  guestMetalCandidates,
  hostGuestRoutes,
  evidenceRiskRecords,
  validationExperiments,
})

function topRouteProvenances(count = 4) {
  return workbench.complementarity.routeScores
    .slice(0, count)
    .map(route => buildRouteHgcpsScoreProvenance(workbench, { route }))
}

describe("organic acid score uncertainty (B2)", () => {
  it("makes a data-derived band narrower as n grows (band width ~ 1/sqrt(n))", () => {
    const small = buildFactorBand({ value: 0.8, nRecords: 4, derivationLevel: "data-derived" })
    const mid = buildFactorBand({ value: 0.8, nRecords: 16, derivationLevel: "data-derived" })
    const large = buildFactorBand({ value: 0.8, nRecords: 64, derivationLevel: "data-derived" })

    expect(small.kind).toBe("data-derived-se")
    expect(small.halfWidth).toBeGreaterThan(mid.halfWidth)
    expect(mid.halfWidth).toBeGreaterThan(large.halfWidth)
    expect(small.nRecords).toBe(4)
  })

  it("gives curated / fallback factors a fixed wide expert-estimate band, not a fake-narrow one", () => {
    const curated = buildFactorBand({ value: 0.8, nRecords: 30, derivationLevel: "curated" })
    const fallback = buildFactorBand({ value: 0.8, nRecords: 0, derivationLevel: "fallback" })

    expect(curated.wide).toBe(true)
    expect(curated.kind).toBe("expert-estimate")
    expect(curated.halfWidth).toBe(0.15)
    expect(curated.labelEn).toMatch(/expert-estimate/)
    // a high-n curated factor must NOT be narrower than a low-n data-derived one
    const dataDerived = buildFactorBand({ value: 0.8, nRecords: 8, derivationLevel: "data-derived" })
    expect(curated.halfWidth).toBeGreaterThanOrEqual(dataDerived.halfWidth)
    expect(fallback.wide).toBe(true)
  })

  it("Monte-Carlos a reproducible HGCPS interval that brackets the builder point estimate", () => {
    const provenance = buildRouteHgcpsScoreProvenance(workbench)
    const a = buildRouteUncertainty(provenance)
    const b = buildRouteUncertainty(provenance)

    // reproducible (fixed seed)
    expect(a.ciLow).toBe(b.ciLow)
    expect(a.ciHigh).toBe(b.ciHigh)
    // point reproduces the builder HGCPS exactly
    expect(a.point).toBe(provenance.finalValue)
    // interval brackets the point and has positive width
    expect(a.ciLow).toBeLessThanOrEqual(a.point)
    expect(a.ciHigh).toBeGreaterThanOrEqual(a.point)
    expect(a.ciHigh).toBeGreaterThan(a.ciLow)
    expect(a.mcSamples).toBe(1000)
    expect(JSON.stringify(a)).not.toMatch(/undefined|null|NaN/)
  })

  it("flags overlapping adjacent routes as statistically indistinguishable (and separated ones as not)", () => {
    const overlapping = buildRankingUncertainty([
      { routeId: "a", routeLabel: "A", point: 0.50, ciLow: 0.40, ciHigh: 0.60 },
      { routeId: "b", routeLabel: "B", point: 0.48, ciLow: 0.38, ciHigh: 0.58 },
    ])
    expect(overlapping.hasIndistinguishable).toBe(true)
    expect(overlapping.rows[1].indistinguishableFromPrev).toBe(true)

    const separated = buildRankingUncertainty([
      { routeId: "a", routeLabel: "A", point: 0.90, ciLow: 0.85, ciHigh: 0.95 },
      { routeId: "b", routeLabel: "B", point: 0.20, ciLow: 0.15, ciHigh: 0.25 },
    ])
    expect(separated.hasIndistinguishable).toBe(false)
    expect(separated.rows[1].indistinguishableFromPrev).toBe(false)
  })

  it("builds a ranking-uncertainty model from real route provenances", () => {
    const model = buildScoreUncertaintyModel(topRouteProvenances(4))
    expect(model.routes.length).toBe(4)
    expect(model.ranking.rows.length).toBe(4)
    expect(model.ranking.rows[0].rank).toBe(1)
    for (const row of model.routes) {
      expect(row.ciHigh).toBeGreaterThanOrEqual(row.ciLow)
      expect(typeof row.anyWideBand).toBe("boolean")
    }
    expect(typeof model.ranking.hasIndistinguishable).toBe("boolean")
    expect(JSON.stringify(model)).not.toMatch(/undefined|null|NaN/)
  })
})
