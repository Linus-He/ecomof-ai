// @ts-nocheck
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PrimaryDomainNavigation } from "../../components/navigation/PrimaryDomainNavigation"
import { THEME_LIGHT } from "../../constants/theme"

function renderNavigation(overrides = {}) {
  const onNavigate = vi.fn()
  render(
    <PrimaryDomainNavigation
      activeHash="overview"
      activeTab="home"
      darkMode={false}
      isMobile={false}
      lang="zh"
      onNavigate={onNavigate}
      theme={THEME_LIGHT}
      {...overrides}
    />,
  )
  return onNavigate
}

describe("primary domain navigation", () => {
  it("renders one overview entry and five registered domains", () => {
    renderNavigation()

    expect(screen.getByRole("button", { name: "总览" })).toBeInTheDocument()
    for (const label of ["研究", "数据", "方法与验证", "项目", "关于"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByRole("button", { name: "气体分离" })).not.toBeInTheDocument()
  })

  it("keeps the overview control active for both default and overview hashes", () => {
    const { rerender } = render(
      <PrimaryDomainNavigation activeHash="default" activeTab="home" darkMode={false} isMobile={false} lang="zh" onNavigate={() => {}} theme={THEME_LIGHT} />,
    )
    expect(screen.getByRole("button", { name: "总览" })).toHaveAttribute("aria-current", "page")

    rerender(
      <PrimaryDomainNavigation activeHash="overview" activeTab="home" darkMode={false} isMobile={false} lang="zh" onNavigate={() => {}} theme={THEME_LIGHT} />,
    )
    expect(screen.getByRole("button", { name: "总览" })).toHaveAttribute("aria-current", "page")
  })

  it("opens a registered domain and routes a nested item through its canonical hash", () => {
    const onNavigate = renderNavigation()

    fireEvent.click(screen.getByRole("button", { name: "研究" }))
    expect(screen.getByRole("menu", { name: "研究" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("menuitem", { name: "气体分离" }))

    expect(onNavigate).toHaveBeenCalledWith("gassep", { resetScroll: true })
    expect(screen.queryByRole("menu", { name: "研究" })).not.toBeInTheDocument()
  })

  it("marks the owning domain and exact nested destination independently", () => {
    renderNavigation({ activeHash: "methodology-gassep", activeTab: "about" })

    expect(screen.getByRole("button", { name: "方法与验证" })).toHaveAttribute("data-active", "true")
    fireEvent.click(screen.getByRole("button", { name: "方法与验证" }))
    expect(screen.getByRole("menuitem", { name: "GasSep 方法" })).toHaveAttribute("aria-current", "page")
  })

  it("shows the independent research charter under About", () => {
    renderNavigation()
    fireEvent.click(screen.getByRole("button", { name: "关于" }))
    expect(screen.getByRole("menuitem", { name: "创建者说明" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "研究宪章" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "条款与政策" })).toBeInTheDocument()
  })

  it("shows the independent changelog under Project", () => {
    renderNavigation()
    fireEvent.click(screen.getByRole("button", { name: "项目" }))
    expect(screen.getByRole("menuitem", { name: "更新日志" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "版本时间线" })).not.toBeInTheDocument()
  })

  it("closes the open menu with Escape and restores focus to its trigger", () => {
    renderNavigation()
    const trigger = screen.getByRole("button", { name: "数据" })

    fireEvent.click(trigger)
    fireEvent.keyDown(window, { key: "Escape" })

    expect(screen.queryByRole("menu", { name: "数据" })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("uses the English registry labels without restoring the old eight-tab rail", () => {
    renderNavigation({ lang: "en" })

    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Methods & validation" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "MOF Library" })).not.toBeInTheDocument()
  })

  it("lets mobile users toggle the same domain trigger closed", () => {
    renderNavigation({ isMobile: true })
    const trigger = screen.getByRole("button", { name: "关于" })

    fireEvent.click(trigger)
    expect(screen.getByRole("menu", { name: "关于" })).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.queryByRole("menu", { name: "关于" })).not.toBeInTheDocument()
  })
})
