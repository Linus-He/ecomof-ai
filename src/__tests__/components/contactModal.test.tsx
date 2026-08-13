// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContactPage } from "../../components/pages/ContactPage"
import { AcknowledgementsPage } from "../../components/pages/AcknowledgementsPage"
import { COPY } from "../../i18n"
import { LangCtx } from "../../contexts"

function renderPage(page) {
  return render(
    <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
      {page}
    </LangCtx.Provider>,
  )
}

describe("independent About pages", () => {
  it("renders a concise collaboration form and direct contact address", () => {
    renderPage(<ContactPage />)

    const page = screen.getByTestId("contact-page")
    expect(screen.getByRole("form", { name: "联系与合作表单" })).toBeInTheDocument()
    expect(screen.getByLabelText("合作类型 *")).toBeInTheDocument()
    expect(screen.getByLabelText("数据状态 *")).toBeInTheDocument()
    expect(screen.getByLabelText("问题与预期结果 *")).toBeInTheDocument()
    expect(page.querySelector('a[href="mailto:ecomofai@outlook.com"]')).toBeTruthy()
    expect(page).not.toHaveTextContent("square.hwh@gmail.com")
    expect(page).toHaveTextContent("保密承诺")
    expect(page).toHaveTextContent("未经提交者明确许可，不会公开、转交他人或用于其他用途")
    expect(page).toHaveTextContent("表单由 Formspree 负责传输和存储")
    expect(page.querySelector('input[type="file"]')).toBeNull()
  })

  it("preserves personal acknowledgements and adds a bounded CCDC acknowledgement", () => {
    renderPage(<AcknowledgementsPage />)

    const page = screen.getByTestId("acknowledgements-page")
    expect(page).toHaveTextContent("HappyFlight")
    expect(page).toHaveTextContent("李新建")
    expect(page).toHaveTextContent("Cambridge Crystallographic Data Centre (CCDC)")
    expect(page).toHaveTextContent("不表示 CCDC 对 EcoMOF-AI 的认可、背书或隶属关系")
    expect(page.querySelector('a[href="https://www.ccdc.cam.ac.uk/"]')).toBeTruthy()
  })
})
