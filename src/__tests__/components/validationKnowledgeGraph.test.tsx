// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { ValidationKnowledgeGraph } from "../../components/catalysis/researchValidation/OrganicAcidResearchValidationCenter"
import { buildValidationKnowledgeGraph } from "../../utils/organicAcidResearchValidation"

const result = {
  rankedFrameworks: [
    { id: "KG-1", displayName: "Graph Candidate 1", rank: 1, hydrothermalGate: { status: "pass" }, organicAcidScore: { oacs: 0.9 } },
    { id: "KG-2", displayName: "Graph Candidate 2", rank: 2, hydrothermalGate: { status: "failed" }, organicAcidScore: { oacs: 0.3 } },
  ],
}

const evidenceRecords = [
  { id: "EV-1", claim: "Supports candidate 1.", evidenceType: "literature", targetDescriptor: "activity" },
  { id: "EV-2", claim: "Candidate 2 remains weak.", evidenceType: "derived", targetDescriptor: "stability" },
]

const labels = {
  labels: [
    { labelId: "LB-1", experimentId: "EXP-KG-1", candidateId: "KG-1", sourceType: "independent_validation" },
    { labelId: "LB-2", experimentId: "EXP-KG-2", candidateId: "KG-2", sourceType: "expert_review" },
  ],
}

describe("ValidationKnowledgeGraph", () => {
  it("renders candidate/evidence/reaction/experiment nodes and filters graph paths", () => {
    const graph = buildValidationKnowledgeGraph({ result, evidenceRecords, labels })
    render(<ValidationKnowledgeGraph graph={graph} lang="en" t={THEME_LIGHT} isMobile={false} />)

    expect(screen.getByTestId("validation-knowledge-graph")).toBeInTheDocument()
    expect(document.body.textContent).toMatch(/Candidate/)
    expect(document.body.textContent).toMatch(/Evidence/)
    expect(document.body.textContent).toMatch(/Reaction/)
    expect(document.body.textContent).toMatch(/Experiment/)
    expect(screen.getByText("supports")).toBeInTheDocument()
    expect(screen.getByText("contradicts")).toBeInTheDocument()
    expect(screen.getByText("pending")).toBeInTheDocument()
    expect(screen.getByText("Candidate Explanation")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "pending" }))
    expect(screen.getByTestId("path-analysis").textContent).toMatch(/filter "pending"/)
    fireEvent.click(screen.getAllByTestId("knowledge-graph-edge")[0])
    expect(screen.getByTestId("path-analysis").textContent).toMatch(/Edge Evidence|Evidence Tier|Source/)
    fireEvent.click(screen.getAllByTestId("knowledge-graph-node")[0])
    expect(screen.getByTestId("path-analysis").textContent).toMatch(/Confidence|Related candidates/)
  })
})
