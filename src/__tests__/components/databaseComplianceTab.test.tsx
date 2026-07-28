// @ts-nocheck
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import complianceRegistry from "../../../public/data/database_compliance_registry.json"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"
import { DatabaseComplianceTab } from "../../components/tabs/DatabaseComplianceTab"

function renderTab(lang = "zh") {
  return render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang, copy: COPY[lang], setLang: () => {} }}>
        <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
          <DatabaseComplianceTab />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
}

describe("DatabaseComplianceTab", () => {
  it("states the time-bounded project gate and mandatory user obligations", () => {
    renderTab()
    const page = screen.getByTestId("database-compliance-tab")
    expect(page).toHaveTextContent("项目合规门：当前通过")
    expect(page).toHaveTextContent("不是法律意见、官方认证或永久性保证")
    expect(page).toHaveTextContent("访问本网站不等于获得任何数据库的商业许可")
    expect(page).toHaveTextContent("网站用户必须遵守的再利用责任")
    expect(within(page).getAllByText("必须遵守")).toHaveLength(9)
    expect(page).toHaveTextContent("不得通过本网站规避 CSD 许可")
  })

  it("keeps CSD, CoRE, FAIR-MOFs, and quarantined QMOF boundaries distinct", () => {
    renderTab()
    const page = screen.getByTestId("database-compliance-tab")
    expect(page).toHaveTextContent("CSD MOF Collection (Non-Commercial)")
    expect(page).toHaveTextContent("CoRE MOF 2024 · CSD-modified CR")
    expect(page).toHaveTextContent("FAIR-MOFs")
    expect(page).toHaveTextContent("QMOF")

    fireEvent.click(within(page).getByRole("button", { name: "已隔离" }))
    expect(page).toHaveTextContent("QMOF")
    expect(page).not.toHaveTextContent("CSD MOF Collection (Non-Commercial)")
  })

  it("persists the legally material source constraints in the registry", () => {
    const csd = complianceRegistry.datasets.find(row => row.id === "csd-mof-collection")
    const core = complianceRegistry.datasets.find(row => row.id === "core-mof-2024-csd-modified")
    const fair = complianceRegistry.datasets.find(row => row.id === "fair-mofs")

    expect(csd.licence).toMatch(/BY-NC-SA/)
    expect(core.prohibitedEn).toMatch(/unmodified CSD CIF/)
    expect(fair.licence).toBe("CC BY 4.0")
    expect(fair.projectHandlingEn).toMatch(/exact Refcode/)
    expect(complianceRegistry.statusStatement.en).toMatch(/not legal advice|not.*permanent guarantee/i)
  })
})
