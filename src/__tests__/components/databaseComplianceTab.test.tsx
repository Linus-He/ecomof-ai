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
    expect(page).toHaveTextContent("适用条款与使用前核查")
    expect(page).toHaveTextContent("数据使用、许可与责任")
    expect(page).not.toHaveTextContent("ecomofai@outlook.com")
    expect(page).toHaveTextContent("不是法律意见，也不是全面合规认证")
    expect(screen.getByTestId("compliance-hosting-notice")).toHaveTextContent("部分数据暂未部署在中国大陆地区服务器")
    expect(screen.getByRole("link", { name: /GDPR 原始法律条文/ })).toHaveAttribute("href", "https://eur-lex.europa.eu/eli/reg/2016/679/oj")
    expect(page).toHaveTextContent("访问本网站不等于获得任何数据库的商业许可")
    expect(page).toHaveTextContent("5.1 使用者需要做到")
    expect(page).toHaveTextContent("5.2 本站目前执行的原则")
    expect(page).toHaveTextContent("不得通过本网站规避 CSD 许可")
    expect(screen.queryByTestId("compliance-document-control")).not.toBeInTheDocument()
    expect(screen.queryByTestId("compliance-control-workflow")).not.toBeInTheDocument()
    expect(page).not.toHaveTextContent("ECOMOF-DCP-001")
    expect(page).not.toHaveTextContent("CONTROL 01")
    expect(screen.getByTestId("compliance-ccdc-boundaries")).toHaveTextContent("CoRE-MOF unmodified CIFs / 完整付费 CSD")
    expect(screen.getByTestId("compliance-primary-documents")).toHaveTextContent("CSD 数据能否再分发？")
    expect(screen.getByTestId("compliance-incident-response")).toHaveTextContent("异议、纠错与移除")
    expect(page).not.toHaveTextContent(/截至\s*\d{4}/)
  })

  it("presents the renamed terms page with a non-commercial research charter", () => {
    renderTab()

    expect(screen.getByRole("heading", { name: "条款与政策", level: 1 })).toBeInTheDocument()
    const charter = screen.getByTestId("research-charter")
    expect(charter).toHaveTextContent("EcoMOF-AI 宪章")
    expect(charter).toHaveTextContent("坚持非商业性质")
    expect(charter).toHaveTextContent("不出售本站数据")
    expect(charter).toHaveTextContent("保持科学诚实")
    expect(charter).toHaveTextContent("审慎发布并持续纠错")
  })

  it("lists all applicable clauses and every authorization evidence category", () => {
    renderTab()
    const clauses = screen.getByTestId("compliance-applicable-clauses")
    const credentials = screen.getByTestId("compliance-authorization-credentials")

    expect(clauses).toHaveTextContent("适用条款与发布方原文")
    expect(clauses).toHaveTextContent("3.1.10")
    expect(clauses).toHaveTextContent("3.2.12")
    expect(clauses).toHaveTextContent("3.3.10")
    expect(clauses).toHaveTextContent("3.4.6")
    expect(clauses).toHaveTextContent("3.5.5")
    expect(clauses).toHaveTextContent("发布方原文")
    expect(clauses).not.toHaveTextContent("CCDC-01")
    expect(credentials).toHaveTextContent("公开许可")
    expect(credentials).toHaveTextContent("逐记录核验")
    expect(credentials).toHaveTextContent("无覆盖性凭证，停止接入")
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
