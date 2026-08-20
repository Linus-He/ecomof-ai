import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import data from "../../../public/data/version_evolution_records.json"
import { ResearchRoadmapPage } from "../../components/pages/MilestoneRoadmapPages"

describe("Roadmap", () => {
  it("renders the latest dynamic V3 roadmap stages with goals and risk boundaries", () => {
    render(<ResearchRoadmapPage />)

    const roadmap = screen.getByTestId("project-evolution-roadmap")
    const roadmapView = within(roadmap)
    expect(roadmap).toBeInTheDocument()
    for (const row of data.versions.slice(-6)) {
      expect(roadmapView.getByText(row.version, { exact: true })).toBeInTheDocument()
      expect(roadmap).toHaveTextContent(row.categories[0])
    }
    expect(roadmap).toHaveTextContent("Scientific goal")
    expect(roadmap).toHaveTextContent("Database goal")
    expect(roadmap).toHaveTextContent("Validation goal")
    expect(roadmap).toHaveTextContent("Known risks")
  })
})
