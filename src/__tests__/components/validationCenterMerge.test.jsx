// @ts-nocheck
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { renderCenter, bodyText } from "./algorithmValidationTestUtils"
import { ALGORITHM_VALIDATION_DIRECTORY } from "../../components/methodology/algorithm-validation/AlgorithmValidationCenter"
import { HASH_TO_TAB } from "../../utils/deepLinks"

function exists(relativePath) {
  return fs.existsSync(path.join(process.cwd(), relativePath))
}

describe("Validation center merge (V2.8)", () => {
  it("retires the Model Validation Lab and Model Benchmark Lab modules from the codebase", () => {
    expect(exists("src/components/methodology/model-validation/ModelValidationLab.jsx")).toBe(false)
    expect(exists("src/components/methodology/model-benchmark/ModelBenchmarkLab.jsx")).toBe(false)
  })

  it("renders the Algorithm Validation Center with the interactive figure on top and does not render the old labs", () => {
    renderCenter()

    expect(screen.getByTestId("algorithm-validation-center")).toBeInTheDocument()
    expect(screen.getByTestId("algorithm-validation-center").id).toBe("methodology-algorithm-validation")
    expect(screen.getByTestId("interactive-scientific-figure")).toBeInTheDocument()

    // The removed lab modules no longer render anywhere on the page.
    expect(screen.queryByTestId("model-benchmark-lab")).toBeNull()
    expect(screen.queryByTestId("methodology-model-validation")).toBeNull()
    expect(bodyText()).not.toMatch(/Model Benchmark Lab/)
    expect(bodyText()).not.toMatch(/Model Validation Lab/)
  })

  it("keeps deep links pointed at the algorithm validation center, not the retired labs", () => {
    expect(HASH_TO_TAB["methodology-algorithm-validation"]).toBe("algorithmValidation")
    expect(HASH_TO_TAB["methodology-model-benchmark"]).toBeUndefined()
    expect(HASH_TO_TAB["methodology-model-validation"]).toBeUndefined()
  })

  it("consolidates validation into one figure-driven center with a small set of layer sections", () => {
    renderCenter()

    // Figure-driven layer sections (incl. V3.2 Data Audit Center + First Real
    // Benchmark), instead of the ~17 cards across the two retired labs.
    const layerIds = ALGORITHM_VALIDATION_DIRECTORY.children.filter(child => child.id.startsWith("algval-") && child.id !== "algval-figure")
    expect(layerIds.length).toBe(17)
    for (const child of layerIds) {
      expect(screen.getByTestId(child.id)).toBeInTheDocument()
    }
  })

  it("never fabricates Future Machine Learning metrics", () => {
    renderCenter()

    expect(bodyText()).toMatch(/Accuracy: Pending/)
    expect(bodyText()).toMatch(/Experimental Labels Required/)
    expect(bodyText()).not.toMatch(/Accuracy:\s*(0\.\d+|[1-9]\d?%?)/i)
    expect(bodyText()).not.toMatch(/ROC-?AUC:\s*(0\.\d+|[1-9]\d?%?)/i)
  })
})
