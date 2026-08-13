import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { chromium } from "playwright"

const ROOT = process.cwd()
const BASE_URL = process.env.FINAL_UI_QA_BASE_URL || "http://127.0.0.1:4173/ecomof-ai/"
const OUT_DIR = path.join(ROOT, "test-results", "final-ui-qa")
const SOURCE_IMAGES = {
  homeEntries: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_9bPSTz/截屏2026-08-04 12.37.03.png",
  ecoSearch: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_s341To/截屏2026-07-29 19.16.10.png",
  ecoStaticMaterial: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_k8N2gY/截屏2026-07-29 19.17.28.png",
  navigation: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_8SG6aj/截屏2026-07-29 19.25.18.png",
  complianceRemovedCard: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_TyZ2lC/截屏2026-07-29 19.30.48.png",
  ccdcReference: "/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_XByrkF/截屏2026-07-29 19.33.12.png",
}

const failures = []
const interactions = []
const screenshots = {}
const consoleErrors = []
const resourceErrors = []

function check(condition, message) {
  if (!condition) failures.push(message)
}

function ignoreConsole(message) {
  return /cloudflareinsights|ERR_TUNNEL_CONNECTION_FAILED|favicon\.ico|Failed to load resource/i.test(String(message || ""))
}

async function waitForApp(page) {
  await page.waitForSelector("#root", { state: "attached", timeout: 30000 })
  await page.waitForLoadState("domcontentloaded").catch(() => {})
  await page.waitForTimeout(700)
}

async function gotoHash(page, hash) {
  await page.goto(`${BASE_URL}${hash}`, { waitUntil: "domcontentloaded", timeout: 45000 })
  await waitForApp(page)
}

async function setChinese(page) {
  const settings = page.getByRole("button", { name: /打开用户菜单|Open user menu/ }).first()
  await settings.click()
  const languageSelect = page.getByRole("combobox", { name: /语言|Language/ }).first()
  if (await languageSelect.inputValue() !== "zh-CN") await languageSelect.selectOption("zh-CN")
  else await page.keyboard.press("Escape")
}

async function screenshotElement(locator, fileName) {
  const filePath = path.join(OUT_DIR, fileName)
  await locator.screenshot({ path: filePath })
  return filePath
}

async function screenshotViewport(page, fileName) {
  const filePath = path.join(OUT_DIR, fileName)
  await page.screenshot({ path: filePath, fullPage: false })
  return filePath
}

function mimeFor(filePath) {
  return path.extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg"
}

async function makeComparison(browser, sourcePath, implementationPath, outputName, title) {
  const [source, implementation] = await Promise.all([
    fs.readFile(sourcePath),
    fs.readFile(implementationPath),
  ])
  const page = await browser.newPage({ viewport: { width: 2400, height: 1500 }, deviceScaleFactor: 1 })
  await page.setContent(`
    <!doctype html>
    <meta charset="utf-8">
    <style>
      *{box-sizing:border-box}body{margin:0;background:#e9eef5;color:#0a1628;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif}
      header{background:#0a1628;color:#fff;font-size:22px;font-weight:800;padding:18px 24px}
      main{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px}
      figure{background:#fff;border:1px solid #cbd5e1;margin:0;min-width:0;padding:12px}
      figcaption{font-size:16px;font-weight:800;margin:0 0 10px}
      img{display:block;height:auto;max-height:1300px;object-fit:contain;width:100%}
    </style>
    <header>${title}</header>
    <main>
      <figure><figcaption>用户参考图</figcaption><img src="data:${mimeFor(sourcePath)};base64,${source.toString("base64")}"></figure>
      <figure><figcaption>当前实现</figcaption><img src="data:${mimeFor(implementationPath)};base64,${implementation.toString("base64")}"></figure>
    </main>
  `)
  const outputPath = path.join(OUT_DIR, outputName)
  await page.screenshot({ path: outputPath, fullPage: true })
  await page.close()
  return outputPath
}

await fs.mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  chromiumSandbox: false,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 })
page.on("pageerror", error => consoleErrors.push(error.message))
page.on("console", message => {
  if (message.type() === "error" && !ignoreConsole(message.text())) consoleErrors.push(message.text())
})
page.on("response", response => {
  if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`)
})
page.on("requestfailed", request => {
  resourceErrors.push(`FAILED ${request.url()} · ${request.failure()?.errorText || "unknown"}`)
})

try {
  await gotoHash(page, "#overview")
  await setChinese(page)

  const homeMap = page.getByTestId("home-scientific-atlas")
  await homeMap.waitFor({ state: "visible" })
  const clusterIds = await homeMap.locator("[data-cluster-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-cluster-id")))
  check(JSON.stringify(clusterIds) === JSON.stringify(["ecoscreen", "library", "gassep", "organic", "validation"]), `首页研究地图入口错误：${clusterIds.join(" / ")}`)
  check(await homeMap.locator("[data-node-id]").count() === 18, "首页研究地图证据节点数量错误")
  const stage = homeMap.getByTestId("home-discovery-map-stage")
  const scaleBefore = await stage.evaluate(node => getComputedStyle(node).transform)
  await homeMap.getByRole("button", { name: "放大地图" }).click()
  await page.waitForTimeout(380)
  const scaleAfter = await stage.evaluate(node => getComputedStyle(node).transform)
  check(scaleBefore !== scaleAfter, "首页研究地图缩放按钮没有改变视图")
  await homeMap.getByRole("button", { name: /哪种材料更适合气体分离/ }).click()
  const mapDialog = page.getByRole("dialog", { name: "哪种材料更适合气体分离？" })
  await mapDialog.waitFor({ state: "visible" })
  check((await mapDialog.innerText()).includes("IAST"), "首页研究地图详情缺少 GasSep 证据说明")
  await mapDialog.getByRole("button", { name: "关闭详情" }).click()
  interactions.push("首页研究地图节点、详情、缩放与工作区路由")

  const navShell = page.locator(".nav-shell")
  const navSlot = page.getByTestId("primary-nav-slot")
  const [shellBox, navBox] = await Promise.all([navShell.boundingBox(), navSlot.boundingBox()])
  check(Boolean(shellBox && navBox), "无法测量中文导航")
  if (shellBox && navBox) {
    const offset = Math.abs((shellBox.x + shellBox.width / 2) - (navBox.x + navBox.width / 2))
    check(offset <= 1.5, `中文导航未居中，中心偏差 ${offset.toFixed(2)}px`)
  }
  screenshots.navigation = await screenshotElement(navShell, "navigation-chinese-centered.png")

  const settingsButton = page.getByRole("button", { name: "打开用户菜单" }).first()
  await settingsButton.click()
  const settingsMenu = page.getByRole("menu", { name: "用户与设置菜单" })
  await settingsMenu.waitFor({ state: "visible" })
  check(await settingsMenu.getByRole("combobox", { name: /语言/ }).count() === 1, "设置菜单缺少语言切换")
  check(await settingsMenu.getByRole("menuitem", { name: /外观/ }).count() === 1, "设置菜单缺少深浅色切换")
  check(await settingsMenu.getByRole("menuitem", { name: "联系与合作" }).count() === 1, "设置菜单缺少联系与合作")
  screenshots.settings = await screenshotElement(settingsMenu, "settings-menu.png")
  await page.keyboard.press("Escape")
  interactions.push("用户设置菜单、语言、主题与联系合作入口")

  const quickStart = page.getByTestId("home-quick-start-buttons")
  await quickStart.getByRole("button", { name: "联系我们" }).click()
  const contactPage = page.getByTestId("contact-page")
  await contactPage.waitFor({ state: "visible" })
  check((await contactPage.innerText()).includes("ecomofai@outlook.com"), "独立联系页未显示指定邮箱")
  check(await contactPage.getByRole("form", { name: "联系与合作表单" }).count() === 1, "独立联系页缺少合作表单")
  interactions.push("独立联系页显示邮箱与合作表单")
  screenshots.homeEntries = await screenshotElement(homeMap, "home-research-map.png")

  await gotoHash(page, "#ecoscreen")
  await page.getByTestId("ecoscreen-material-awaiting-confirmation").waitFor({ state: "visible", timeout: 30000 })
  check(await page.getByTestId("ecoscreen-lca-results").count() === 0, "未确认 MOF 时仍显示生命周期结果")
  check(!(await page.locator("body").innerText()).includes("UiO-66"), "未确认 MOF 时仍预填 UiO-66")
  screenshots.ecoEmpty = await screenshotViewport(page, "ecoscreen-before-confirmation.png")

  const search = page.getByRole("textbox", { name: "检索 MOF 候选材料" })
  await search.fill("UiO-66")
  await page.waitForTimeout(2200)
  await page.getByRole("button", { name: "确认", exact: true }).click()
  await page.getByTestId("ecoscreen-material-conclusion").waitFor({ state: "visible", timeout: 30000 })
  await page.getByTestId("ecoscreen-lca-results").waitFor({ state: "attached", timeout: 30000 })
  screenshots.ecoConfirmed = await screenshotViewport(page, "ecoscreen-after-confirmation.png")
  const propertiesButton = page.getByRole("button", { name: "查看物化性质" })
  check(!(await propertiesButton.isDisabled()), "确认 MOF 后物化性质按钮仍禁用")
  await propertiesButton.click()
  const propertyDialog = page.getByTestId("mof-property-modal")
  await propertyDialog.waitFor({ state: "visible" })
  const propertyText = await propertyDialog.innerText()
  for (const label of ["比表面积", "孔体积", "PLD", "LCD", "密度", "空隙率", "非商业研究"]) {
    check(propertyText.includes(label), `物化性质弹窗缺少 ${label}`)
  }
  screenshots.propertyModal = await screenshotElement(propertyDialog, "physicochemical-property-modal.png")
  await propertyDialog.getByRole("button", { name: "关闭物化性质弹窗" }).click()
  check(await propertyDialog.count() === 0, "物化性质弹窗关闭按钮无效")
  interactions.push("生态筛选未确认空状态、确认后计算、物化性质弹窗与关闭")

  await gotoHash(page, "#library")
  const propertySearchPanel = page.getByTestId("mof-physicochemical-search")
  await propertySearchPanel.waitFor({ state: "visible", timeout: 30000 })
  const propertySearch = propertySearchPanel.getByRole("searchbox")
  await propertySearch.fill("UiO-66")
  const propertyMatch = propertySearchPanel.getByRole("button").first()
  await propertyMatch.waitFor({ state: "visible", timeout: 30000 })
  await propertyMatch.click()
  await page.waitForTimeout(500)
  const libraryPropertyText = await propertySearchPanel.innerText()
  for (const label of ["比表面积", "孔体积", "PLD", "LCD", "密度", "空隙率"]) {
    check(libraryPropertyText.includes(label), `MOF 库性质查询缺少 ${label}`)
  }
  const structureWorkbench = page.getByTestId("mof-structure-workbench")
  await page.waitForTimeout(800)
  const structureText = await structureWorkbench.innerText()
  check(structureText.includes("物化性质"), "MOF 结构侧栏未显示物化性质")
  check(structureText.includes("UiO-66"), "物化性质搜索结果未同步到 MOF 结构工作台")
  check(await propertySearchPanel.getByRole("button", { name: /UiO-66/ }).count() === 0, "选择物化性质记录后搜索下拉仍未收起")
  screenshots.libraryProperties = await screenshotViewport(page, "mof-library-property-search.png")
  interactions.push("MOF 库物化性质查询与结构侧栏")

  await gotoHash(page, "#database-compliance")
  const compliance = page.getByTestId("database-compliance-tab")
  await compliance.waitFor({ state: "visible", timeout: 30000 })
  const complianceText = await compliance.innerText()
  for (const label of ["数据使用、许可与责任", "适用条款与发布方原文", "37,452", "3,451", "来源登记"]) {
    check(complianceText.includes(label), `合规页面缺少 ${label}`)
  }
  check(!/QMOF/i.test(complianceText), "合规页面仍显示 QMOF")
  check(!complianceText.includes("ECOMOF-DCP-001"), "合规页面仍显示已删除的控制文件卡")
  check(!complianceText.includes("CONTROL 01"), "合规页面仍显示已删除的六步控制流程")
  check(!complianceText.includes("CCDC-01"), "合规条款仍使用等宽内部编号")
  check(!/截至\s*\d{4}/.test(complianceText), "合规页面仍含截止日期式自我认证")
  screenshots.compliance = await screenshotViewport(page, "data-compliance-formal.png")
  interactions.push("合规条文、授权凭证、来源登记、外链及被删除模块")

  await gotoHash(page, "#project-evolution")
  const currentUpdate = page.getByTestId("project-evolution-current-update")
  await currentUpdate.waitFor({ state: "visible", timeout: 30000 })
  check((await currentUpdate.innerText()).includes("v1.0.14"), "项目演化未显示 v1.0.14 当前更新")
  await page.getByTestId("project-evolution-archive").getByText("发布与历史档案", { exact: true }).click()
  const history = page.getByTestId("project-evolution-pre-v1-history")
  await history.waitFor({ state: "visible", timeout: 30000 })
  const historyText = await history.innerText()
  check(historyText.includes("V3.10.1"), "历史沿革仍为空或缺少原始版本记录")
  check(/38\s*(个原始版本|original versions)/.test(historyText), "历史沿革未显示原始版本总数")
  screenshots.projectHistory = await screenshotElement(history, "project-evolution-history.png")
  interactions.push("v1.0.14 当前更新与非空历史沿革")

  await gotoHash(page, "#release-notes")
  const changelog = page.getByTestId("release-notes-page")
  await changelog.waitFor({ state: "visible", timeout: 30000 })
  const changelogText = await changelog.innerText()
  check(changelogText.includes("v1.0.14"), "独立更新日志未显示 v1.0.14")
  check(changelogText.includes("当前版本"), "独立更新日志未标明当前版本")
  screenshots.releaseNotes = await screenshotViewport(page, "release-notes.png")
  interactions.push("独立更新日志")

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 1050 }, deviceScaleFactor: 1 })
  await gotoHash(mobilePage, "#project-evolution")
  await mobilePage.getByTestId("project-evolution-archive").getByText("发布与历史档案", { exact: true }).click()
  const mobileHistory = mobilePage.getByTestId("project-evolution-pre-v1-history")
  await mobileHistory.waitFor({ state: "visible", timeout: 30000 })
  const mobileHistoryOverflow = await mobileHistory.evaluate(node => node.scrollWidth - node.clientWidth)
  check(mobileHistoryOverflow <= 2, `移动端历史沿革横向溢出 ${mobileHistoryOverflow}px`)
  screenshots.projectHistoryMobile = await screenshotElement(mobileHistory, "project-evolution-history-mobile.png")
  await mobilePage.close()

  const localOrigin = new URL(BASE_URL).origin
  const localResourceErrors = resourceErrors.filter(message => {
    const match = message.match(/https?:\/\/[^\s]+/)
    if (!match) return false
    try {
      const url = new URL(match[0])
      return url.origin === localOrigin && !/favicon\.ico/i.test(url.pathname)
    } catch {
      return false
    }
  })
  check(consoleErrors.length === 0, `浏览器控制台错误：${consoleErrors.join(" | ")}`)
  check(localResourceErrors.length === 0, `站内资源加载错误：${localResourceErrors.join(" | ")}`)

  const comparisons = {
    home: await makeComparison(browser, SOURCE_IMAGES.homeEntries, screenshots.homeEntries, "compare-home-research-map.png", "首页研究地图：参考交互画布与当前材料证据地图"),
    navigation: await makeComparison(browser, SOURCE_IMAGES.navigation, screenshots.navigation, "compare-navigation.png", "中文导航：原偏移参考与当前等宽居中轨道"),
    ecoEmpty: await makeComparison(browser, SOURCE_IMAGES.ecoStaticMaterial, screenshots.ecoEmpty, "compare-ecoscreen-empty-state.png", "生态筛选：原默认静态材料与当前确认前空状态"),
    ecoProperties: await makeComparison(browser, SOURCE_IMAGES.ecoSearch, screenshots.propertyModal, "compare-property-dialog.png", "生态筛选：原搜索工具条与当前可关闭物化性质档案"),
    compliance: await makeComparison(browser, SOURCE_IMAGES.ccdcReference, screenshots.compliance, "compare-compliance-formality.png", "合规页面：CCDC 严肃信息参考与当前正式责任页面"),
    removedComplianceCard: await makeComparison(browser, SOURCE_IMAGES.complianceRemovedCard, screenshots.compliance, "compare-removed-compliance-card.png", "合规页面：原控制卡与当前删除后的正式结构"),
  }

  await fs.writeFile(path.join(OUT_DIR, "summary.json"), `${JSON.stringify({
    baseUrl: BASE_URL,
    viewport: { width: 1440, height: 1100, deviceScaleFactor: 1 },
    interactions,
    screenshots,
    comparisons,
    consoleErrors,
    resourceErrors,
    failures,
    status: failures.length ? "failed" : "passed",
  }, null, 2)}\n`)
} finally {
  await page.close().catch(() => {})
  await browser.close().catch(() => {})
}

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`Final UI QA passed. Evidence written to ${OUT_DIR}`)
