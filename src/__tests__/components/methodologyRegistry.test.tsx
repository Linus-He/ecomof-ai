import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import modules from "../../../public/data/methodology_modules_demo.json"
import literature from "../../../public/data/methodology_literature_inspiration_records.json"
import governance from "../../../public/data/methodology_governance_frameworks.json"
import { THEME_LIGHT } from "../../constants/theme"
import { MethodologyRegistry } from "../../components/methodology/MethodologyRegistry"

describe("MethodologyRegistry", () => {
  it("opens a standard method card and keeps links to the complete method and product function", () => {
    const onJump = vi.fn()
    render(
      <MethodologyRegistry
        modules={modules}
        literatureRecords={literature}
        governance={governance}
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
        onJump={onJump}
      />,
    )

    expect(screen.getByTestId("methodology-registry")).toBeInTheDocument()
    expect(screen.getByText("先判断能否使用，再进入完整方法")).toBeInTheDocument()
    modules.forEach(module => expect(screen.getByTestId(`method-registry-item-${module.id}`)).toBeInTheDocument())

    fireEvent.click(screen.getByTestId("method-registry-item-gassep"))
    const methodCard = screen.getByTestId("standard-method-card")
    expect(within(methodCard).getByText("气体分离")).toBeInTheDocument()
    expect(within(methodCard).getByText(/吸附记录、等温线、温度、压力与气体组成/)).toBeInTheDocument()
    expect(within(methodCard).getByRole("link", { name: /GasSep 工作台/ })).toHaveAttribute("href", "#gassep")

    fireEvent.click(within(methodCard).getByRole("button", { name: "阅读完整原方法" }))
    expect(onJump).toHaveBeenCalledWith("methodology-gassep")
  })

  it("shows the derived coverage matrix and verified governance references", () => {
    render(
      <MethodologyRegistry
        modules={modules}
        literatureRecords={literature}
        governance={governance}
        lang="zh"
        t={THEME_LIGHT}
        isMobile={false}
        onJump={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "覆盖矩阵" }))
    expect(screen.getByRole("table", { name: "方法覆盖矩阵" })).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(modules.length + 1)

    fireEvent.click(screen.getByRole("button", { name: "标准与治理" }))
    expect(screen.getByText("EcoMOF-AI 标准方法卡字段")).toBeInTheDocument()
    expect(screen.getByText("Materials Methodology")).toBeInTheDocument()
    expect(screen.getByText("Deployment Safety Hub")).toBeInTheDocument()
    expect(screen.getByText("Data Cards Playbook")).toBeInTheDocument()
    expect(screen.getByText("DOI 10.6028/NIST.AI.100-1")).toBeInTheDocument()
  })
})
