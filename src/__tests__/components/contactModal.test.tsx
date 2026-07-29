// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ContactModal } from "../../components/layout/ContactModal"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"

describe("ContactModal", () => {
  it("reveals the requested contact address inside the dialog", () => {
    render(
      <ThemeCtx.Provider value={THEME_LIGHT}>
        <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
          <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
            <ContactModal open onClose={vi.fn()} />
          </ViewportCtx.Provider>
        </LangCtx.Provider>
      </ThemeCtx.Provider>,
    )

    const dialog = screen.getByRole("dialog", { name: "联系与合作 / Contact" })
    expect(dialog).toHaveTextContent("ecomofai@outlook.com")
    expect(dialog.querySelector('a[href="mailto:ecomofai@outlook.com"]')).toBeTruthy()
    expect(dialog).not.toHaveTextContent("square.hwh@gmail.com")
  })
})
