import { describe, expect, it } from "vitest"
import fs from "node:fs"

describe("organicAcidContentAudit", () => {
  it("removes low-value developer-oriented copy from final decision surfaces", () => {
    const source = fs.readFileSync("src/components/catalysis/organic-acid-final/OrganicAcidFinalDecisionBoard.jsx", "utf8")

    expect(source).not.toMatch(/This module shows|Click to view|Demo workspace|Prototype only/)
    expect(source).toMatch(/当前用于什么判断|最终决策面板|下一步实验|真实图中心性/)
  })
})
