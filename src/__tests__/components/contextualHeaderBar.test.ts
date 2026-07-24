// @ts-nocheck
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("contextual header bar", () => {
  it("removes pure intro strips from Home and MOF Library", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/layout/index.tsx"), "utf8")

    expect(source).toContain('if (activeTab === "home") return null')
    expect(source).toContain('if (activeTab === "library") return null')
    expect(source).not.toContain("探索 MOF 筛选、性能分析、催化记录与数据证据链。")
    expect(source).not.toContain("MOF 候选库展示基础候选记录和逐字段来源信息，不给出最终结论。")
  })
})
