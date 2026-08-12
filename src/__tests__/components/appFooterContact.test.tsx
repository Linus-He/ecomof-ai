// @ts-nocheck
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AppFooter } from "../../components/layout/AppFooter"
import { THEME_LIGHT } from "../../constants/theme"

describe("AppFooter contact links", () => {
  it("uses brand icons for GitHub, email, and Zhihu contact destinations", () => {
    render(<AppFooter lang="zh" navigate={vi.fn()} theme={THEME_LIGHT} />)

    expect(screen.getByRole("navigation", { name: "联系我们" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "在 GitHub 查看 EcoMOF-AI 仓库" })).toHaveAttribute("href", "https://github.com/Linus-He/ecomof-ai")
    expect(screen.getByRole("link", { name: "发送邮件至 ecomofai@outlook.com" })).toHaveAttribute("href", "mailto:ecomofai@outlook.com")
    expect(screen.getByRole("link", { name: "在知乎关注小落生" })).toHaveAttribute("href", "https://www.zhihu.com/people/xiao-luo-sheng-25")
  })
})
