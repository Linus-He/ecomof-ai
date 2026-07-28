import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import scoringSpecV1 from "../../../public/data/organic_acid_scoring_spec_v1.json"
import scoringSpecV2 from "../../../public/data/organic_acid_scoring_spec_v2.json"
import methodologyShowcase from "../../../public/data/organic_acid_methodology_showcase_v3_9_8.json"
import metalPriceTable from "../../../public/data/metal_precursor_cost_table.json"
import { AlgorithmShowcaseSection } from "../../components/methodology/organic-acid-final/AlgorithmShowcaseSection"
import { buildAlgorithmShowcaseModel } from "../../utils/organicAcidAlgorithmMethodology"

const t = {
  panel: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#D9E2EC",
  divider: "#D9E2EC",
  textStrong: "#0F172A",
  muted: "#475569",
  faint: "#64748B",
  accentText: "#1A6DB5",
  warn: "#8F3B1B",
  good: "#147C43",
  badgeInfoBg: "#E8F2FC",
  badgeWarnBg: "#FFF1E8",
  badgeGoodBg: "#F2FBF6",
}

describe("Organic Acid AlgorithmShowcaseSection", () => {
  it("renders the eight-factor formula, descriptor matrix, preregistration, and audit conclusions", () => {
    const model = buildAlgorithmShowcaseModel({
      scoringSpecV1,
      scoringSpecV2,
      showcaseArtifact: methodologyShowcase,
      priceTable: metalPriceTable,
    })
    render(<AlgorithmShowcaseSection model={model} lang="zh" t={t} />)

    expect(screen.getByTestId("algorithm-showcase-section")).toBeInTheDocument()
    expect(screen.getByTestId("descriptor-evidence-matrix-algorithm")).toBeInTheDocument()
    expect(screen.getAllByTestId("algorithm-descriptor-row")).toHaveLength(8)
    expect(screen.getByTestId("algorithm-audit-conclusions")).toBeInTheDocument()
    expect(screen.getByTestId("algorithm-showcase-section").innerHTML).toMatch(/katex/)
    expect(screen.getByTestId("algorithm-showcase-section").textContent).toMatch(/加权几何平均/)
    expect(screen.getByTestId("algorithm-showcase-section").textContent).toMatch(/规则先于排名/)
    expect(screen.getByTestId("algorithm-showcase-section").textContent).toMatch(/density/)
    expect(screen.getByTestId("algorithm-showcase-section").textContent).toMatch(/UiO-type host/)
  })
})
