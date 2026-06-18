// @ts-nocheck
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderBenchmarkLab } from "./modelBenchmarkLabTestUtils"
import versionData from "../../../public/data/version_evolution_records.json"

describe("benchmarkRoadmap", () => {
  it("renders benchmark roadmap and Project Evolution V2.7 roadmap entry", () => {
    renderBenchmarkLab()

    const panel = screen.getByTestId("benchmark-roadmap")
    expect(panel).toHaveTextContent(/Current Framework/)
    expect(panel).toHaveTextContent(/Label Collection/)
    expect(panel).toHaveTextContent(/External Test/)

    const roadmap = versionData.roadmap.find(row => row.version === "V2.7")
    expect(roadmap.plannedFeatures).toEqual(expect.arrayContaining(["Model Benchmark Lab", "Algorithm Credibility Framework"]))
    expect(roadmap.validationGoal).toMatch(/Accuracy, ROC-AUC/)
  })
})

