// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
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
  it("renders the recommendation card, 6-step stepper, route queue, risk matrix, analysis tabs, and exports", () => {
    render(<OrganicAcidHostGuestWorkbench lang="zh" isNarrow={false} workbench={workbenchFixture()} />)
    let bodyText = document.body.textContent

    expect(screen.getByTestId("organic-acid-host-guest-workbench")).toBeInTheDocument()
    expect(bodyText).toMatch(/EcoMOF-AI V3.9.3/)
    expect(bodyText).toMatch(/Current algorithm recommendation:/)
    expect(bodyText).toMatch(/Host framework: Al-MOF/)
    expect(bodyText).toMatch(/Guest \/ dopant metal: Mo/)
    expect(bodyText).toMatch(/Suggested route/)
    expect(bodyText).toMatch(/Al-MOF \+ Mo doping \/ post-modification \/ bimetallic construction/)
    expect(bodyText).toMatch(/pathway-step descriptor screening \+ multiplicative host-guest complementarity scoring/)
    expect(bodyText).toMatch(/high-priority experimental route, not final proof of catalytic performance/)
    expect(bodyText).toMatch(/HGCPS = Host Stability Factor \* Host Pathway Support Factor \* Guest Activity Compensation Factor \* Host-Guest Complementarity Factor \* Evidence Confidence Factor \* Risk Retention Factor/)

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
    expect(bodyText).toMatch(/高级证据、风险与稳健性分析/)
    expect(bodyText).toMatch(/Missing Evidence & Risk Matrix/)
    expect(bodyText).toMatch(/Mo introduction feasibility needs validation/)
    expect(bodyText).toMatch(/local Mo coordination environment uncertain/)
    expect(bodyText).toMatch(/170C aqueous stability must be tested/)
    expect(bodyText).toMatch(/same-condition experiment is still needed/)
    expect(bodyText).toMatch(/pathway -> descriptor -> host -> guest -> route/)
    expect(bodyText).toMatch(/pathway step/)
    expect(bodyText).toMatch(/descriptor/)
    expect(bodyText).toMatch(/host MOF/)
    expect(bodyText).toMatch(/guest metal/)
    expect(bodyText).toMatch(/host-guest route/)
    expect(bodyText).toMatch(/evidence/)
    expect(bodyText).toMatch(/risk/)
    expect(bodyText).toMatch(/validation experiment/)
    expect(bodyText).toMatch(/Random Forest baseline remains a baseline \/ risk reference only/)

    fireEvent.click(screen.getByRole("tab", { name: "Evidence Matrix" }))
    bodyText = document.body.textContent
    expect(bodyText).toMatch(/证据矩阵 \/ 置信矩阵/)
    expect(bodyText).toMatch(/Missing evidence/)

    fireEvent.click(screen.getByRole("tab", { name: "Sensitivity Analysis" }))
    bodyText = document.body.textContent
    expect(bodyText).toMatch(/Sensitivity Analysis Panel/)
    expect(bodyText).toMatch(/Baseline ranking/)
    expect(bodyText).toMatch(/Adjusted ranking/)
    expect(bodyText).toMatch(/Rank stability/)
    expect(bodyText).toMatch(/Most sensitive factor/)

    fireEvent.click(screen.getByRole("tab", { name: "Ablation Analysis" }))
    bodyText = document.body.textContent
    expect(bodyText).toMatch(/Ablation Analysis Panel/)
    expect(bodyText).toMatch(/without guest activity compensation/)
    expect(bodyText).toMatch(/without host-guest complementarity/)
    expect(bodyText).toMatch(/pristine Al-MOF only/)
    expect(bodyText).toMatch(/Mo contribution removed/)

    fireEvent.click(screen.getByRole("tab", { name: "Algorithm Boundary" }))
    bodyText = document.body.textContent
    expect(bodyText).toMatch(/Organic Acid Algorithm Boundary Panel/)
    expect(bodyText).toMatch(/Al-MOF \+ Mo is one high-priority experimental route, not final catalytic proof/)
    expect(bodyText).toMatch(/Random Forest is a baseline \/ risk reference only/)

    fireEvent.click(screen.getByRole("tab", { name: "Route Report Export" }))
    bodyText = document.body.textContent
    expect(bodyText).toMatch(/Host-Guest Route Priority Queue CSV/)
    expect(bodyText).toMatch(/Al-MOF \+ Mo Route Report JSON/)
    expect(bodyText).toMatch(/Evidence Matrix CSV/)
    expect(bodyText).toMatch(/Missing Evidence & Risk Matrix CSV/)
    expect(bodyText).toMatch(/Sensitivity Analysis JSON/)
    expect(bodyText).toMatch(/Ablation Analysis JSON/)
    expect(bodyText).toMatch(/Validation Roadmap JSON/)
    expect(bodyText).toMatch(/Markdown Research Summary/)

    expect(bodyText).not.toMatch(/Al-MOF is final best catalyst/i)
    expect(bodyText).not.toMatch(/Mo-MOF is optimal/i)
    expect(bodyText).not.toMatch(/machine learning predicted/i)
    expect(bodyText).not.toMatch(/already proved/i)
    expect(bodyText).not.toMatch(/Cat Playground/)
    expect(bodyText).not.toMatch(/undefined|null|NaN/)
    expect(bodyText).not.toMatch(/HGCPS\s*=\s*Host Stability Factor\s*\+/)
  })
})
