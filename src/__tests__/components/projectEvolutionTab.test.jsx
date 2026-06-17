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
    expect(bodyText()).toMatch(/V2.3/)
    expect(bodyText()).toMatch(/1000 Candidates/)
    expect(bodyText()).toMatch(/Verified Metadata/)
    expect(bodyText()).toMatch(/30/)
    expect(bodyText()).toMatch(/Database Preview/)
    expect(bodyText()).toMatch(/Not Final Recommendation/)
    expect(bodyText()).toMatch(/GitHub Stars/)
    expect(bodyText()).toMatch(/pending/)
  })
})
