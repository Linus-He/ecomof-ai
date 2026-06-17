import { describe, expect, it } from "vitest"
import { ORGANIC_ACID_TASK_DEFINITION } from "../../utils/organicAcid/organicAcidTaskDefinition"

describe("organicAcidTaskDefinition", () => {
  it("defines the formic-acid priority task and required inputs", () => {
    expect(ORGANIC_ACID_TASK_DEFINITION.taskId).toBe("organic_acid_formic_priority")
    expect(ORGANIC_ACID_TASK_DEFINITION.targetProduct).toMatch(/formic acid/)
    expect(ORGANIC_ACID_TASK_DEFINITION.requiredInputs).toEqual(expect.arrayContaining(["formicAcidPathwayFit", "collapseRisk", "fieldProvenanceCoverage"]))
    expect(ORGANIC_ACID_TASK_DEFINITION.validationConstraints.join(" ")).toMatch(/experimental validation/)
  })
})
