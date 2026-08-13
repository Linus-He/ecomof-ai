// @ts-nocheck
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DataHostingNotice } from "../../components/common/DataHostingNotice"

describe("DataHostingNotice", () => {
  it("keeps the access explanation compact until the user opens it", () => {
    render(<DataHostingNotice lang="zh" placement="gassep" />)

    const note = screen.getByTestId("data-hosting-note-gassep")
    expect(note).not.toHaveAttribute("open")
    expect(screen.getByText("部分研究数据由境外来源托管")).toBeInTheDocument()

    fireEvent.click(screen.getByText("查看说明"))
    expect(note).toHaveAttribute("open")
    expect(screen.getByRole("link", { name: "欧盟 GDPR 原始法律文本" })).toHaveAttribute(
      "href",
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    )
    expect(screen.getByRole("link", { name: "查看条款与政策" })).toHaveAttribute("href", "#database-compliance")
  })

  it("is present at the three requested research entry points", () => {
    const files = import.meta.glob("../../components/{ecoscreen,tabs}/*.{tsx,jsx}", {
      eager: true,
      query: "?raw",
      import: "default",
    })
    const source = Object.values(files).join("\n")

    expect(source).toContain('placement="ecoscreen"')
    expect(source).toContain('placement="gassep"')
    expect(source).toContain('placement="catalysis"')
  })
})
