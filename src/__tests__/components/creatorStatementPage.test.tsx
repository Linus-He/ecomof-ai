// @ts-nocheck
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { CreatorStatementPage } from "../../components/pages/CreatorStatementPage"
import { LangCtx } from "../../contexts"
import { COPY } from "../../i18n"

function renderPage() {
  return render(
    <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
      <CreatorStatementPage />
    </LangCtx.Provider>,
  )
}

describe("creator statement", () => {
  it("states the creator identity, motivation, correction posture, and advisory invitation", () => {
    renderPage()

    const page = screen.getByTestId("creator-statement-page")
    expect(page).toHaveTextContent("因为我真心喜欢化学")
    expect(page).toHaveTextContent("我目前只是一名仍在学习中的学生")
    expect(page).toHaveTextContent("由我个人发起和维护")
    expect(page).toHaveTextContent("请直接指出错误")
    expect(page).toHaveTextContent("我欢迎专业人士成为这个项目的顾问")
  })

  it("keeps non-commercial operation distinct from source-code and source-specific licences", () => {
    renderPage()

    const page = screen.getByTestId("creator-statement-page")
    expect(page).toHaveTextContent("当前以非商业学生研究项目运行")
    expect(page).toHaveTextContent("仓库源代码采用 MIT License")
    expect(page).toHaveTextContent("分别受各自条款约束")
    expect(page.querySelector('a[href="#database-compliance"]')).toBeTruthy()
  })

  it("links to acknowledgements and collaboration without implying endorsement", () => {
    renderPage()

    const page = screen.getByTestId("creator-statement-page")
    expect(page).toHaveTextContent("不表示合作、隶属或认可关系")
    expect(page.querySelector('a[href="#acknowledgements"]')).toBeTruthy()
    expect(page.querySelector('a[href="#contact"]')).toBeTruthy()
  })
})
