import { afterEach, describe, expect, it } from "vitest"
import { observeTraditionalChinese } from "../../utils/traditionalChinese"

afterEach(() => {
  document.body.innerHTML = ""
})

describe("traditional Chinese locale conversion", () => {
  it("does not overwrite a newly committed language during cleanup", async () => {
    document.body.innerHTML = '<main id="root"><button aria-label="打开">研究进展</button></main>'
    const root = document.getElementById("root") as HTMLElement
    const restore = await observeTraditionalChinese(root, "hk")
    const button = root.querySelector("button")!
    button.firstChild!.nodeValue = "Progreso científico"
    button.setAttribute("aria-label", "Abrir")
    restore()
    expect(button.textContent).toBe("Progreso científico")
    expect(button.getAttribute("aria-label")).toBe("Abrir")
  })
  it("uses Hong Kong regional characters and restores them before another locale", async () => {
    document.body.innerHTML = '<main id="root"><p>里面的数据库与研究</p></main>'
    const root = document.getElementById("root") as HTMLElement
    const restore = await observeTraditionalChinese(root, "hk")
    expect(root.textContent).toBe("裏面的數據庫與研究")
    restore()
    expect(root.textContent).toBe("里面的数据库与研究")
  })
  it("converts current and dynamically inserted interface copy, then restores the source", async () => {
    document.body.innerHTML = '<main id="root"><button aria-label="打开设置">项目演化</button></main>'
    const root = document.getElementById("root") as HTMLElement
    const restore = await observeTraditionalChinese(root)

    expect(root.textContent).toContain("項目演化")
    expect(root.querySelector("button")).toHaveAttribute("aria-label", "打開設置")

    const dynamic = document.createElement("p")
    dynamic.textContent = "数据库描述符空间"
    root.append(dynamic)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(dynamic.textContent).toBe("數據庫描述符空間")
    restore()
    expect(root.textContent).toContain("项目演化")
    expect(dynamic.textContent).toBe("数据库描述符空间")
  })
})
