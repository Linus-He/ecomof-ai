import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { DataModeToggle } from "../components/ui"
import { LangCtx, ThemeCtx, ViewportCtx } from "../contexts"
import { THEME_LIGHT } from "../constants/theme"
import { COPY } from "../i18n"

function renderToggle(onChange = vi.fn()) {
  render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "en", copy: COPY.en, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isMobile: false, isNarrow: false }}>
          <DataModeToggle value="real-seed" onChange={onChange} lang="en" options={undefined} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
  return onChange
}

describe("DataModeToggle", () => {
  it("shows the Demo marker and emits changes", () => {
    const onChange = renderToggle()
    const demoButton = screen.getByRole("button", { name: /demo dataset/i })

    expect(demoButton).toBeInTheDocument()
    fireEvent.click(demoButton)

    expect(onChange).toHaveBeenCalledWith("demo")
  })
})
