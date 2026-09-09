// @ts-nocheck
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { LangCtx } from "../../contexts"
import { COPY } from "../../i18n"
import { ResearchCharterPage } from "../../components/pages/PriorityResearchPages"

describe("ResearchCharterPage", () => {
  it("keeps the legacy charter route inside the creator statement", () => {
    render(
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: () => {} }}>
        <ResearchCharterPage />
      </LangCtx.Provider>,
    )

    expect(screen.getByTestId("creator-statement-page")).toHaveTextContent("研究宪章")
    expect(screen.getByText("让研究判断回到证据、条件与可纠正性。")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /条款与政策/ })).toHaveAttribute("href", "#database-compliance")
  })
})
