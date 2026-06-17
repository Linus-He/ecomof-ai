import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ProjectEvolutionTab } from "../../components/tabs/ProjectEvolutionTab"

function bodyText() {
  return document.body.textContent || ""
}

describe("Algorithm Evolution", () => {
  it("shows the required algorithm progression and future validation plan", () => {
    render(<ProjectEvolutionTab data={data} />)

    expect(screen.getByTestId("project-evolution-algorithm")).toBeInTheDocument()
    for (const stage of [
      "Descriptor Scoring",
      "CRITIC",
      "Evidence Adjustment",
      "Screening Trace",
      "Data Quality Audit",
      "Model Validation Lab",
    ]) {
      expect(bodyText()).toMatch(new RegExp(stage))
    }
    expect(bodyText()).toMatch(/Future ML Validation/)
    expect(bodyText()).toMatch(/No validation workspace/)
  })
})
