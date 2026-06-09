// @ts-nocheck
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { THEME_LIGHT } from "../../constants/theme"
import { AlgorithmRunLauncher } from "../../components/catalysis/organic-acid-final/run-launcher/AlgorithmRunLauncher"

const rules = {}

describe("Screening Run Scope (final-screening UX cleanup)", () => {
  it("renders a research-readable run scope without developer-mode panels", () => {
    const { container } = render(
      <AlgorithmRunLauncher frameworks={[]} metals={[]} rules={rules} evidenceRecords={[]} result={{}} lang="en" t={THEME_LIGHT} isMobile={false} />
    )

    expect(screen.getByText(/Screening Run Scope/)).toBeTruthy()
    expect(screen.getByText(/Current demo workflow/)).toBeTruthy()
    expect(screen.getAllByText(/Preview only/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/does not run full database scoring/i).length).toBeGreaterThan(0)

    // No developer-style panel headings.
    expect(screen.queryByText("DATA MODE")).toBeNull()
    expect(screen.queryByText("Data mode")).toBeNull()
    expect(screen.queryByText(/^enabled$/i)).toBeNull()

    // No stacked historical-version flow as a main card description.
    expect(container.textContent).not.toMatch(/V1\.6/)
    expect(container.textContent).not.toMatch(/V2\.0-C/)
  })

  it("renders the Chinese run scope copy", () => {
    render(
      <AlgorithmRunLauncher frameworks={[]} metals={[]} rules={rules} evidenceRecords={[]} result={{}} lang="zh" t={THEME_LIGHT} isMobile={false} />
    )

    expect(screen.getByText(/筛选运行范围/)).toBeTruthy()
    expect(screen.getAllByText(/仅限预览/).length).toBeGreaterThan(0)
    expect(document.body.textContent).toContain("不执行全量数据库评分")
    expect(document.body.textContent).not.toContain("DATA MODE")
  })
})
