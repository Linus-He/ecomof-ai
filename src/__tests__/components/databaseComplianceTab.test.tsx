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
  it("states the evidence boundary, acknowledgement, and mandatory user obligations without self-certification", () => {
    renderTab()
    const page = screen.getByTestId("database-compliance-tab")
    expect(page).toHaveTextContent("开始使用前必须阅读")
    expect(page).toHaveTextContent("数据使用、许可与责任")
    expect(page).not.toHaveTextContent("ecomofai@outlook.com")
    expect(page).toHaveTextContent("本页列示规则与证据，不作全面合规自我认证")
    expect(page).toHaveTextContent("访问本网站不等于获得任何数据库的商业许可")
    expect(page).toHaveTextContent("下载、分析、发布与再分发前必须完成的核验")
    expect(within(page).getAllByText("必须遵守")).toHaveLength(9)
    expect(page).toHaveTextContent("不得通过本网站规避 CSD 许可")
    expect(screen.queryByTestId("compliance-document-control")).not.toBeInTheDocument()
    expect(page).not.toHaveTextContent("ECOMOF-DCP-001")
    expect(screen.getByTestId("compliance-control-workflow")).toHaveTextContent("任何下载、训练、发布或再分发都必须经过六步核验")
    expect(screen.getByTestId("compliance-ccdc-boundaries")).toHaveTextContent("CoRE-MOF unmodified CIFs / 完整付费 CSD")
    expect(screen.getByTestId("compliance-primary-documents")).toHaveTextContent("CSD 数据能否再分发？")
    expect(screen.getByTestId("compliance-incident-response")).toHaveTextContent("权利声明和来源争议的五步响应程序")
    expect(page).not.toHaveTextContent(/截至\s*\d{4}/)
  })

  it("lists all applicable clauses and every authorization evidence category", () => {
    renderTab()
    const clauses = screen.getByTestId("compliance-applicable-clauses")
    const credentials = screen.getByTestId("compliance-authorization-credentials")

    expect(clauses).toHaveTextContent("43 条条文逐项列示")
    expect(clauses).toHaveTextContent("CCDC-10")
    expect(clauses).toHaveTextContent("BYNCSA-12")
    expect(clauses).toHaveTextContent("BY-10")
    expect(clauses).toHaveTextContent("REC-06")
    expect(clauses).toHaveTextContent("PROJ-05")
    expect(credentials).toHaveTextContent("公开许可凭证")
    expect(credentials).toHaveTextContent("逐记录核验")
    expect(credentials).toHaveTextContent("缺少覆盖性凭证 / 阻断")
    expect(credentials).toHaveTextContent("Open MOF seed candidates")
    expect(credentials).toHaveTextContent("项目 NOTICE")
  })

  it("keeps CSD, CoRE, and FAIR-MOFs boundaries distinct without displaying QMOF", () => {
    renderTab()
    const page = screen.getByTestId("database-compliance-tab")
    expect(page).toHaveTextContent("CSD MOF Collection (Non-Commercial)")
    expect(page).toHaveTextContent("CoRE MOF 2024 · CSD-modified CR")
    expect(page).toHaveTextContent("FAIR-MOFs")
    expect(page).not.toHaveTextContent("QMOF")
    expect(page).toHaveTextContent("37,452")
    expect(page).toHaveTextContent("3,451")

    fireEvent.click(within(page).getByRole("button", { name: "未公开接入" }))
    const datasetList = screen.getByTestId("compliance-dataset-list")
    expect(datasetList).not.toHaveTextContent("QMOF")
    expect(datasetList).not.toHaveTextContent("CSD MOF Collection (Non-Commercial)")
  })

  it("persists the legally material source constraints in the registry", () => {
    const csd = complianceRegistry.datasets.find(row => row.id === "csd-mof-collection")
    const core = complianceRegistry.datasets.find(row => row.id === "core-mof-2024-csd-modified")
    const fair = complianceRegistry.datasets.find(row => row.id === "fair-mofs")

    expect(csd.licence).toMatch(/BY-NC-SA/)
    expect(core.prohibitedEn).toMatch(/unmodified CSD CIF/)
    expect(fair.licence).toBe("CC BY 4.0")
    expect(fair.projectHandlingEn).toMatch(/CSD Refcodes identical/)
    expect(complianceRegistry.statusStatement.en).toMatch(/non-commercial research mode/i)
    expect(complianceRegistry.applicableClauseGroups.flatMap(group => group.clauses)).toHaveLength(43)
    expect(complianceRegistry.authorizationCredentials).toHaveLength(10)
    expect(complianceRegistry.authorizationCredentials.find(row => row.id === "cred-mof-anatomy").status).toBe("limited-factual-metadata-no-site-licence")
    expect(complianceRegistry.datasets.find(row => row.id === "mof-anatomy-identity").recordCount).toBe(185)
    expect(complianceRegistry.authorizationCredentials.find(row => row.id === "cred-open-seed").status).toBe("blocked-no-credential")
    expect(JSON.stringify(complianceRegistry)).not.toMatch(/QMOF|termsCheckedAt|effectiveDate|截至\s*\d{4}/)
  })
})
