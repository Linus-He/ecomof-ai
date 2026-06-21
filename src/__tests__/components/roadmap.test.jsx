import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Roadmap", () => {
  it("renders the latest dynamic V3 roadmap stages with goals and risk boundaries", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-roadmap")).toBeInTheDocument()
    for (const version of ["V3.1", "V3.2", "V3.3", "V3.4", "V3.5", "V3.6"]) {
      expect(bodyText()).toMatch(new RegExp(version.replace(".", "\\.")))
    }
    expect(bodyText()).toMatch(/Reaction Data Expansion/)
    expect(bodyText()).toMatch(/Real Data Ingestion/)
    expect(bodyText()).toMatch(/Experimental Label Acquisition/)
    expect(bodyText()).toMatch(/Model Credibility/)
    expect(bodyText()).toMatch(/Model Robustness/)
    expect(bodyText()).toMatch(/Known Risks/)
  })
})
