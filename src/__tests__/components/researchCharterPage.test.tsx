// @ts-nocheck
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LangCtx } from "../../contexts"
import { COPY } from "../../i18n"
import { ResearchCharterPage } from "../../components/pages/PriorityResearchPages"

describe("ResearchCharterPage", () => {
  it("presents the charter as a separate governance page with four principles", () => {
    render(
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: () => {} }}>
        <ResearchCharterPage />
      </LangCtx.Provider>,
    )

    expect(screen.getByTestId("research-charter-page")).toHaveTextContent("EcoMOF-AI 研究宪章")
    expect(screen.getByText("让研究收益广泛可用")).toBeInTheDocument()
    expect(screen.getByText("坚持长期科学可靠性")).toBeInTheDocument()
    expect(screen.getByText("保持技术与证据领导力")).toBeInTheDocument()
    expect(screen.getByText("保持开放合作取向")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /查看条款与政策/ })).toHaveAttribute("href", "#database-compliance")
  })
})
