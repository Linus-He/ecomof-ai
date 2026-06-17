import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Roadmap", () => {
  it("renders V2.4 through V3.0 with goals and risk boundaries", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-roadmap")).toBeInTheDocument()
    for (const version of ["V2.4", "V2.5", "V2.6", "V3.0"]) {
      expect(bodyText()).toMatch(new RegExp(version.replace(".", "\\.")))
    }
    expect(bodyText()).toMatch(/Research Outputs Framework/)
    expect(bodyText()).toMatch(/Full Localization Refactor/)
    expect(bodyText()).toMatch(/Experimental Validation Framework/)
    expect(bodyText()).toMatch(/Organic Acid Algorithm Closure/)
    expect(bodyText()).toMatch(/Organic Acid Screening Report/)
    expect(bodyText()).toMatch(/Research Decision Platform/)
    expect(bodyText()).toMatch(/Known Risks/)
  })
})
