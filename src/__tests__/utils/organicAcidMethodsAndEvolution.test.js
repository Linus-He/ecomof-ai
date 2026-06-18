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
    const benchmarkSource = read("src/components/methodology/model-benchmark/ModelBenchmarkLab.jsx")

    expect(source).toMatch(/Organic Acid Algorithm Closure/)
    expect(source).toMatch(/ORGANIC_ACID_SCORE_EQUATION/)
    expect(source).toMatch(/白盒多指标决策/)
    expect(source).toMatch(/仍需实验验证/)
    expect(benchmarkSource).toMatch(/Model Benchmark Lab/)
    expect(benchmarkSource).toMatch(/Feature Selection Workflow/)
    expect(benchmarkSource).toMatch(/Experimental labels required/)
    expect(versionData.currentVersion).toBe("V2.7")
    expect(versionData.versions.find(row => row.version === "V2.6").algorithmImpact).toMatch(/风险惩罚/)
    expect(versionData.versions.find(row => row.version === "V2.7").summary).toMatch(/Model Benchmark Lab/)
    expect(versionDocs.currentVersion).toBe("V2.7")
    expect(versionDocs.versions.find(row => row.version === "V2.6").status).toBe("completed")
    expect(versionDocs.versions.find(row => row.version === "V2.6")).toEqual(expect.objectContaining({
      title: "Organic Acid Algorithm Closure",
      evidenceBoundary: expect.stringMatching(/Algorithmic suggestion/),
    }))
    expect(versionDocs.versions.find(row => row.version === "V2.7")).toEqual(expect.objectContaining({
      title: "Model Benchmark Lab and Algorithm Credibility Framework",
      evidenceBoundary: expect.stringMatching(/Label Count = 0/),
      relatedSection: "#methodology-model-benchmark",
    }))
  })
})
