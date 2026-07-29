// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PhysicochemicalPropertyModal } from "../../components/layout/PhysicochemicalPropertyModal"
import { COPY } from "../../i18n"
import { THEME_LIGHT } from "../../constants/theme"
import { LangCtx, ThemeCtx, ViewportCtx } from "../../contexts"

const record = {
  commonName: "UiO-66",
  csdRefcode: "RUBTAK",
  sourceVersion: "CoRE MOF 2024 v1.1",
  surfaceArea: 1186.4,
  poreVolume: 0.52,
  pldA: 6.01,
  lcdA: 8.12,
  density: 1.21,
  voidFraction: 0.49,
  fairMofsCrossValidation: {
    sourceUrl: "https://zenodo.org/records/13254307",
    properties: { pldA: 5.98, lcdA: 8.08 },
  },
}

function renderModal(onClose = vi.fn()) {
  render(
    <ThemeCtx.Provider value={THEME_LIGHT}>
      <LangCtx.Provider value={{ lang: "zh", copy: COPY.zh, setLang: vi.fn() }}>
        <ViewportCtx.Provider value={{ isNarrow: false, isMobile: false }}>
          <PhysicochemicalPropertyModal open onClose={onClose} record={record} />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>,
  )
  return onClose
}

describe("PhysicochemicalPropertyModal", () => {
  it("shows CoRE primary properties, exact FAIR evidence, and the non-commercial boundary", () => {
    renderModal()
    const dialog = screen.getByRole("dialog", { name: "UiO-66" })
    expect(dialog).toHaveTextContent("比表面积")
    expect(dialog).toHaveTextContent("1,186.4")
    expect(dialog).toHaveTextContent("CSD Refcode 完全一致")
    expect(dialog).toHaveTextContent("仅用于非商业研究")
    expect(dialog).toHaveTextContent("CC BY‑NC‑SA 4.0")
  })

  it("provides an explicit close button and Escape dismissal", () => {
    const onClose = renderModal()
    fireEvent.click(screen.getByRole("button", { name: "关闭物化性质弹窗" }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
