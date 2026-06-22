import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { TABS } from "../../constants/badges"
import { HASH_TO_TAB } from "../../utils/deepLinks"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("ProjectEvolutionTab", () => {
  it("renders Project Evolution as a first-level tab and standalone route", () => {
    expect(TABS.some(tab => tab.id === "projectEvolution")).toBe(true)
    expect(HASH_TO_TAB["project-evolution"]).toBe("projectEvolution")

    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-tab")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Project Evolution Center/)
    expect(bodyText()).toMatch(/What Changed In EcoMOF-AI/)
    expect(bodyText()).toMatch(/Methods & Evidence explains how EcoMOF-AI works/)
  })

  it("renders overview metrics with Database Preview and Not Final Recommendation boundary", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-overview")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Current Version/)
    expect(bodyText()).toMatch(/V3.9.5.1/)
    expect(bodyText()).toMatch(/3020\+/)
    expect(bodyText()).toMatch(/Verified Metadata/)
    expect(bodyText()).toMatch(/2480/)
    expect(bodyText()).toMatch(/Database Preview/)
    expect(bodyText()).toMatch(/Not Final Recommendation/)
    expect(bodyText()).toMatch(/Random Forest/)
    expect(bodyText()).toMatch(/78\.87/)
    expect(bodyText()).toMatch(/High Overfitting Risk/)
    expect(screen.getByTestId("project-evolution-localization")).toBeInTheDocument()
    expect(bodyText()).toMatch(/Localization Evolution/)
    expect(bodyText()).toMatch(/Research Reports/)
  })

  it("renders the Organic Acid algorithm methodology module with KaTeX formulas and exports", () => {
    render(<ProjectEvolutionTab data={data} />)

    const text = bodyText()
    expect(screen.getByTestId("project-evolution-organic-acid-algorithm-methodology")).toBeInTheDocument()
    expect(text).toMatch(/Organic Acid Host-Guest Algorithm Methodology/)
    expect(text).toMatch(/Al-MOF \+ Mo/)
    expect(text).toMatch(/High-priority experimental hypothesis/)
    expect(text).toMatch(/Not final catalytic proof/)
    expect(text).toMatch(/Not ready for formal machine learning/)
    expect(screen.getByTestId("organic-acid-formula-hgcps").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-host-selection").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-guest-selection").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-route-selection").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-sensitivity").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-ablation").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("organic-acid-formula-feedback-evidence").innerHTML).toMatch(/katex/)
    expect(document.getElementById("project-evolution-organic-acid-algorithm-methodology-host-selection")).toBeInTheDocument()
    expect(document.getElementById("project-evolution-organic-acid-algorithm-methodology-guest-selection")).toBeInTheDocument()
    expect(document.getElementById("project-evolution-organic-acid-algorithm-methodology-hgcps")).toBeInTheDocument()
    expect(document.getElementById("project-evolution-organic-acid-algorithm-methodology-formula-hgcps")).toBeInTheDocument()
    expect(screen.getByTestId("organic-acid-formula-hgcps").textContent).not.toMatch(/HGCPS = A \\* B \\* C/)
    expect(text).toMatch(/Organic Acid Algorithm Methodology Markdown/)
    expect(text).toMatch(/Organic Acid Algorithm Formula JSON/)
    expect(text).toMatch(/Organic Acid Algorithm LaTeX Summary/)
    expect(text).not.toMatch(/undefined|null|NaN|Cat Playground/)
  })
})
