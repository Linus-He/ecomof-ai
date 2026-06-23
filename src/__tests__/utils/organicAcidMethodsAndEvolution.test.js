import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import versionData from "../../../public/data/version_evolution_records.json"
import versionDocs from "../../../public/data/organic_acid_final_screening/version_docs.json"

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("organic acid methods and V2.6 evolution", () => {
  it("documents Organic Acid Algorithm Closure in Methods & Evidence and Project Evolution", () => {
    const source = read("src/components/methodology/OrganicAcidFinalMethodology.jsx")
    const figureSource = read("src/components/methodology/algorithm-validation/InteractiveScientificFigure.jsx")
    const centerSource = read("src/components/methodology/algorithm-validation/AlgorithmValidationCenter.jsx")

    expect(source).toMatch(/Organic Acid Algorithm Closure/)
    expect(source).toMatch(/ORGANIC_ACID_SCORE_EQUATION/)
    expect(source).toMatch(/白盒多指标决策/)
    expect(source).toMatch(/仍需实验验证/)
    expect(figureSource).toMatch(/Interactive Scientific Figure/)
    expect(figureSource).toMatch(/No fake Accuracy/)
    expect(centerSource).toMatch(/Algorithm Validation Center/)
    expect(centerSource).toMatch(/Experimental Validation Layer/)
    expect(versionData.currentVersion).toBe("V3.9.5.4")
    expect(versionData.versions.find(row => row.version === "V2.6").algorithmImpact).toMatch(/风险惩罚/)
    expect(versionData.versions.find(row => row.version === "V2.8").summary).toMatch(/Interactive Scientific Figure/)
    expect(versionData.versions.find(row => row.version === "V3.0").summary).toMatch(/Data Foundation/)
    expect(versionData.versions.find(row => row.version === "V3.2").summary).toMatch(/Data Audit|First Real Benchmark/)
    expect(versionData.versions.find(row => row.version === "V3.3").summary).toMatch(/Real Data Ingestion/)
    expect(versionData.versions.find(row => row.version === "V3.6").summary).toMatch(/Robustness/)
    expect(versionDocs.currentVersion).toBe("V3.9.5.4")
    expect(versionDocs.versions.find(row => row.version === "V2.6").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.3").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.6").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.1").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.2").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.3").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.4").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.5").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.5.3").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.9.5.4").status).toBe("current")
    expect(versionDocs.versions.find(row => row.version === "V3.8").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V3.8").title).toBe("Research Validation Loop Closure")
    expect(versionDocs.versions.find(row => row.version === "V2.6")).toEqual(expect.objectContaining({
      title: "Organic Acid Algorithm Closure",
      evidenceBoundary: expect.stringMatching(/Algorithmic suggestion/),
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.8")).toEqual(expect.objectContaining({
      title: "Interactive Scientific Figure Refactor",
      evidenceBoundary: expect.stringMatching(/Label Count = 0/),
      relatedSection: "#methodology-algorithm-validation",
    }))
    expect(versionDocs.versions.find(row => row.version === "V3.1")).toEqual(expect.objectContaining({
      title: "Reaction Data Expansion and Benchmark Readiness",
      evidenceBoundary: expect.stringMatching(/benchmark-ready data scaffolding/),
    }))
  })
})
