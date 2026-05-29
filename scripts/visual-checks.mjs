import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { chromium } from "playwright"

const baseUrl = process.env.VISUAL_CHECK_BASE_URL || "http://127.0.0.1:5173/ecomof-ai/"
const outDir = path.join(process.cwd(), "test-results", "visual-checks")

const routes = [
  ["catalysis", "#catalysis", [["Reaction Pathway Evidence Map", "催化路径证据图"], ["Data Harmonization & Comparability Workflow", "数据整理与可比性评估流程"], ["Organic Acid Workspace", "有机酸路径工作台"]]],
  ["organic-acid", "#catalysis-organic-acid", [["Access Gate / Frontend Passcode", "前端访问入口"], ["Algorithm Trace Explorer", "算法追踪器"], ["Organic Acid Carbon-Flow Graph Workbench", "有机酸碳流图论路径工作台"], ["Candidate Prioritization Workspace", "候选物优先级与规则匹配工作台"], ["Priority Matrix", "优先级矩阵"]]],
  ["library", "#library", [["Open MOF Seed Records", "Open MOF Seed 记录"], ["View database details", "查看数据库详情"]]],
  ["ecoscreen", "#ecoscreen", ["EcoScreen", ["Candidate Scoring", "候选评分"]]],
  ["methodology", "#methodology", [["Methods & Evidence", "方法与证据"], ["Evidence Levels", "证据等级"], ["Validation Roadmap", "验证路线"]]],
]
const viewports = [
  ["desktop", 1440, 1100],
  ["tablet", 900, 1100],
  ["mobile", 390, 1100],
]

async function waitForApp(page) {
  await page.waitForSelector("#root", { state: "attached" })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(500)
}

async function setDarkMode(page, dark) {
  const bodyText = await page.locator("body").innerText()
  const hasMoon = bodyText.includes("☾")
  const hasSun = bodyText.includes("☀")
  if (dark && hasMoon) await page.getByText("☾").first().click()
  if (!dark && hasSun) await page.getByText("☀").first().click()
  await page.waitForTimeout(250)
}

async function horizontalOverflow(page) {
  return page.evaluate(() => {
    function hasScrollableAncestor(element) {
      let node = element.parentElement
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node)
        if (["auto", "scroll"].includes(style.overflowX)) return true
        node = node.parentElement
      }
      return false
    }
    const offenders = []
    const viewportWidth = document.documentElement.clientWidth
    document.querySelectorAll("body *").forEach(element => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      const allowsScroll = ["auto", "scroll"].includes(style.overflowX)
      if (!allowsScroll && !hasScrollableAncestor(element) && rect.width > viewportWidth + 8 && rect.height > 4) {
        const text = (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)
        offenders.push({ tag: element.tagName, width: Math.round(rect.width), text })
      }
    })
    return offenders.slice(0, 8)
  })
}

await fs.mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const failures = []
const screenshots = []

for (const [viewportName, width, height] of viewports) {
  for (const mode of ["light", "dark"]) {
    for (const [routeName, hash, requiredText] of routes) {
      const page = await browser.newPage({ viewport: { width, height } })
      const errors = []
      page.on("pageerror", error => errors.push(error.message))
      page.on("console", message => {
        if (message.type() === "error") errors.push(message.text())
      })
      await page.goto(`${baseUrl}${hash}`, { waitUntil: "domcontentloaded" })
      await waitForApp(page)
      await setDarkMode(page, mode === "dark")
      await waitForApp(page)

      if (routeName === "library") {
        const detailButton = page.getByText(/View database details|查看数据库详情/).first()
        if (await detailButton.count()) {
          await detailButton.click()
          await page.waitForTimeout(400)
        }
      }

      if (routeName === "organic-acid") {
        const passcode = page.locator('input[type="password"]').first()
        if (await passcode.count()) {
          await passcode.fill("acid")
          await page.getByText(/进入项目|Enter project/).first().click()
          await waitForApp(page)
        }
      }

      const bodyText = await page.locator("body").innerText()
      for (const label of requiredText) {
        const options = Array.isArray(label) ? label : [label]
        if (!options.some(option => bodyText.includes(option))) failures.push(`${routeName}/${viewportName}/${mode}: missing "${options.join(" / ")}"`)
      }

      const overflow = await horizontalOverflow(page)
      if (overflow.length) failures.push(`${routeName}/${viewportName}/${mode}: horizontal overflow ${JSON.stringify(overflow)}`)
      if (errors.length) failures.push(`${routeName}/${viewportName}/${mode}: console errors ${errors.join(" | ")}`)

      const file = path.join(outDir, `${routeName}-${viewportName}-${mode}.png`)
      await page.screenshot({ path: file, fullPage: true })
      screenshots.push(file)
      await page.close()
    }
  }
}

await browser.close()
await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({ baseUrl, screenshots, failures }, null, 2))

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`Visual checks passed. Screenshots written to ${outDir}`)
