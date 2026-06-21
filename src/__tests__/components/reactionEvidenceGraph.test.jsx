// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import graph from "../../../public/data/reaction_evidence_graph_v1.json"
import { ReactionEvidenceGraph } from "../../components/methodology/model-credibility/ReactionEvidenceGraph"

const body = () => document.body.textContent || ""

describe("ReactionEvidenceGraph", () => {
  it("renders the CO₂ → formic acid SVG with nodes and edges", () => {
    render(<ReactionEvidenceGraph graph={graph} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(screen.getByTestId("reaction-evidence-graph")).toBeInTheDocument()
    expect(screen.getByTestId("node-co2")).toBeInTheDocument()
    expect(screen.getByTestId("node-formic_acid")).toBeInTheDocument()
    expect(screen.getByTestId("edge-co2-hcoo")).toBeInTheDocument()
    expect(body()).toMatch(/Formic Acid/)
  })

  it("shows edge detail on click", () => {
    render(<ReactionEvidenceGraph graph={graph} lang="en" t={THEME_LIGHT} isMobile={false} />)
    fireEvent.click(screen.getByTestId("edge-hcoo-formic_acid"))
    expect(screen.getByTestId("edge-detail")).toBeInTheDocument()
    expect(body()).toMatch(/confidence/i)
  })

  it("renders nothing without a graph", () => {
    const { container } = render(<ReactionEvidenceGraph graph={null} lang="en" t={THEME_LIGHT} isMobile={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
