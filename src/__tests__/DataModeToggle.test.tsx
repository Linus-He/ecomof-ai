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
          <DataModeToggle value="core-mof-2024-cr" onChange={onChange} lang="en" options={undefined} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
  return onChange
}

describe("DataModeToggle", () => {
  it("shows the active CoRE 2024 CR route and emits changes", () => {
    const onChange = renderToggle()
    const activeButton = screen.getByRole("button", { name: /core 2024 cr real corpus/i })

    expect(activeButton).toBeInTheDocument()
    fireEvent.click(activeButton)

    expect(onChange).toHaveBeenCalledWith("core-mof-2024-cr")
  })
})
