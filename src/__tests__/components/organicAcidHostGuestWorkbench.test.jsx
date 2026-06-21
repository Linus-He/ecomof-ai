// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import pathwaySteps from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMap from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidates from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidates from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutes from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecords from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperiments from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import { OrganicAcidHostGuestWorkbench } from "../../components/catalysis/OrganicAcidHostGuestWorkbench"
import { buildOrganicAcidHostGuestWorkbench } from "../../utils/organicAcidHostGuest"

function workbenchFixture() {
  return buildOrganicAcidHostGuestWorkbench({
    pathwaySteps,
    pathwayDescriptorMap,
    hostMofCandidates,
    guestMetalCandidates,
    hostGuestRoutes,
    evidenceRiskRecords,
    validationExperiments,
  })
}

describe("OrganicAcidHostGuestWorkbench", () => {
  it("renders the recommendation card, 6-step stepper, route queue, trace, graph, and exports", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} workbench={workbenchFixture()} />)
    const bodyText = document.body.textContent

    expect(screen.getByTestId("organic-acid-host-guest-workbench")).toBeInTheDocument()
    expect(bodyText).toMatch(/Current algorithm recommendation:/)
    expect(bodyText).toMatch(/Host framework: Al-MOF/)
    expect(bodyText).toMatch(/Guest \/ dopant metal: Mo/)
    expect(bodyText).toMatch(/Suggested route/)
    expect(bodyText).toMatch(/Al-MOF \+ Mo doping \/ post-modification \/ bimetallic construction/)
    expect(bodyText).toMatch(/pathway-step descriptor screening \+ host-guest complementarity scoring/)
    expect(bodyText).toMatch(/high-priority experimental route, not final proof of catalytic performance/)

    for (const label of [
      "Pathway Step Analysis",
      "Descriptor Mapping",
      "Host MOF Selection",
      "Guest Metal Selection",
      "Complementary Scoring",
      "Experimental Route",
    ]) {
      expect(bodyText).toContain(label)
    }

    expect(bodyText).toMatch(/Al-MOF is selected as the stable host framework/)
    expect(bodyText).toMatch(/Mo is selected as the guest \/ dopant \/ activity compensation metal/)
    expect(bodyText).toMatch(/Top Priority Route/)
    expect(bodyText).toMatch(/Route Explanation Panel/)
    expect(bodyText).toMatch(/provenance trace/)
    expect(bodyText).toMatch(/next validation experiment/)
    expect(bodyText).toMatch(/pathway -> descriptor -> host -> guest -> route/)
    expect(bodyText).toMatch(/pathway step/)
    expect(bodyText).toMatch(/descriptor/)
    expect(bodyText).toMatch(/host MOF/)
    expect(bodyText).toMatch(/guest metal/)
    expect(bodyText).toMatch(/host-guest route/)
    expect(bodyText).toMatch(/evidence/)
    expect(bodyText).toMatch(/risk/)
    expect(bodyText).toMatch(/validation experiment/)
    expect(bodyText).toMatch(/Missing evidence/)
    expect(bodyText).toMatch(/Random Forest baseline remains a baseline \/ risk reference only/)
    expect(bodyText).toMatch(/Host-Guest Route Priority Queue CSV/)
    expect(bodyText).toMatch(/Al-MOF \+ Mo Route Explanation JSON/)
    expect(bodyText).toMatch(/Algorithm Trace JSON/)
    expect(bodyText).toMatch(/Pathway Descriptor Map CSV/)
    expect(bodyText).toMatch(/Experimental Route JSON/)

    expect(bodyText).not.toMatch(/Al-MOF is final best catalyst/i)
    expect(bodyText).not.toMatch(/Mo-MOF is optimal/i)
    expect(bodyText).not.toMatch(/machine learning predicted/i)
    expect(bodyText).not.toMatch(/already proved/i)
    expect(bodyText).not.toMatch(/Cat Playground/)
    expect(bodyText).not.toMatch(/undefined|null|NaN/)
  })
})
