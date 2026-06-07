import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { chromium } from "playwright"

const baseUrl = process.env.VISUAL_CHECK_BASE_URL || "http://127.0.0.1:5173/ecomof-ai/"
const outDir = path.join(process.cwd(), "test-results", "visual-checks")

const routes = [
  ["home", "#overview", [
    ["Workflow Narrative", "流程叙事"],
    ["Evidence & Validation Loop", "证据与验证闭环"],
    ["What this workflow produces", "这套流程最终产出什么"],
    ["Structure & Source Intake", "结构与来源接入"],
  ]],
  ["catalysis", "#catalysis", [
    ["Section layout controls", "Section 布局控制"],
    ["Reaction Pathway Evidence Map", "催化路径证据图"],
    ["Organic Acid Workspace", "有机酸路径工作台"],
    "Organic Acid Final Screening",
  ]],
  ["organic-acid", "#catalysis-organic-acid", [
    ["Access Gate / Frontend Passcode", "前端访问入口"],
    ["Section layout controls", "Section 布局控制"],
    ["Algorithm Trace Explorer", "算法追踪器"],
    ["Effect Decomposition Explorer", "效应拆解器"],
    ["Organic Acid Carbon-Flow Graph Workbench", "有机酸碳流图论路径工作台"],
    ["Interaction Effect Matrix", "交互效应矩阵"],
    ["Experimental Design Coverage Map", "实验设计覆盖图"],
  ]],
  ["organic-acid-final", "#catalysis-organic-acid-final-screening", [
    "Organic Acid Final Screening",
    ["演示级代理评分", "Demo Score Disclaimer"],
    ["完整方法论与证据层已同步到 Methods & Evidence", "Methodology and evidence layer updated in Methods & Evidence"],
    ["查看证据层", "View evidence layer"],
    ["算法运行启动器", "Algorithm Run Launcher"],
    ["运行 Curated 小样例", "Run curated sample"],
    ["演示流程", "Demo workflow"],
    ["映射样例", "Mapped fixtures"],
    ["人工整理真实样例", "Curated real examples"],
    ["Small curated sample only", "small curated sample only", "仅小规模人工整理样例"],
    ["运行结果摘要", "Run Result Summary"],
    ["运行追踪", "Run trace"],
    "Algorithm Pipeline Stepper",
    "Status Badge Legend",
    "Screening Funnel Chart",
    "Stage Summary Cards",
    ["耦合描述符热区图", "Coupled Descriptor Hot Spot Map"],
    ["骨架热区", "Scaffold Map"],
    ["金属热区", "Dopant Map"],
    ["协同热区", "Synergy Map"],
    ["为什么需要热区图", "Why Hot Spot Matters"],
    ["描述符耦合面板", "Descriptor Coupling Panel"],
    ["验证证据阶梯", "Validation Evidence Ladder"],
    ["Reaction Constraint Builder", "反应约束"],
    "Al-MOF Ranking Table",
    "Dopant Metal Recommendation Matrix",
    "Mechanism Path Radar",
    "Why Mo? Waterfall Chart",
    "Why Mo vs W Comparison",
    "Sensitivity Rank Distribution",
    "Full-Metal Sensitivity Distribution",
    "Mo vs W/V/Ti/Zr/Fe",
    "robust but audit required",
    "Ru / Pd / Ag",
    "Prediction vs Falsification",
    "Data Status & Provenance Coverage",
    "V1.6 Curated real examples mapping report",
    "Limitations & Reproducibility Statement",
    "V1.7 · ALGORITHM TRACE WORKBENCH",
    "WARNING & BOUNDARY PANEL",
    "CANDIDATE FLOW FUNNEL / SANKEY",
    "FORMULA & WEIGHT INSPECTOR",
    "CANDIDATE DECISION LOG",
    "EVIDENCE TRACE PANEL",
    "TRACE EXPORT PANEL",
  ]],
  ["library", "#library", [
    ["Open MOF Seed Records", "Open MOF Seed 记录"],
    ["View database details", "查看数据库详情"],
  ]],
  ["gassep", "#gassep", [
    ["Gas Separation Scenario Builder", "气体分离场景构建器"],
    ["Interactive Performance Map", "性能图谱"],
    ["GasSep Interaction Diagnostics", "交互诊断"],
    ["Validation Roadmap", "验证路线"],
  ]],
  ["ecoscreen", "#ecoscreen", [
    "EcoScreen",
    ["Candidate Scoring", "候选评分"],
  ]],
  ["methodology", "#methodology", [
    ["Methods & Evidence", "方法与证据"],
    ["Structured Factor Effects", "结构化因素效应"],
    ["Catalysis Energy Playground Method", "催化能量游乐场方法说明"],
    ["Organic Acid Final Screening Methodology", "有机酸最终筛选方法论"],
    ["Method Overview", "方法总览"],
    ["Two-Stage Algorithm Flow", "两阶段算法流程图"],
    ["Data Mapping and Schema Validation", "数据映射与 Schema Validation"],
    ["Small Real Dataset Integration", "小规模真实样例接入"],
    ["Data Mapper Preview Panel", "Data Mapper Preview Panel"],
    ["Schema Validation Panel", "Schema Validation Panel"],
    ["Data Quality Gate Panel", "Data Quality Gate Panel"],
    ["Algorithm Trace Workbench", "算法追踪工作台"],
    ["OACS Formula Explainer", "OACS 骨架筛选"],
    ["DMRS Formula Explainer", "DMRS 第二金属推荐"],
    ["Mechanism Path Cards", "三路径机制解释"],
    ["Coupled Descriptor Hot Spot Map", "耦合描述符热区图"],
    ["Knowledge Base", "知识库"],
    ["Robustness Audit", "稳健性审计"],
    ["Evidence Strength Matrix", "证据强度矩阵"],
    ["EXAFS-Guided Falsification", "EXAFS 引导的假设-证伪闭环"],
    ["Experimental Control Loop", "实验控制闭环"],
    ["Evidence Data Layer Status", "证据层状态"],
    ["Version History", "版本历史"],
    "V1.4",
    "V1.5",
    "V1.6",
    "V1.7",
    ["Literature Library", "文献库"],
    ["Inspiration Map", "灵感映射"],
    ["Version ↔ Literature ↔ Module Matrix", "版本 ↔ 文献 ↔ 模块矩阵"],
    ["展开完整映射矩阵", "Expand full mapping matrix"],
    ["Evidence Boundary Legend", "证据边界图例"],
    ["Validation Roadmap", "验证路线"],
  ]],
]
const viewports = [
  ["desktop", 1440, 1100],
  ["tablet", 900, 1100],
  ["mobile", 390, 1100],
]

async function waitForApp(page) {
  await page.waitForSelector("#root", { state: "attached" })
  await page.waitForLoadState("load").catch(() => {})
  await page.waitForTimeout(650)
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

function shouldIgnoreConsoleError(message) {
  const text = String(message || "")
  return text.includes("cloudflareinsights.com/cdn-cgi/rum") ||
    text.includes("Access to XMLHttpRequest") && text.includes("/cdn-cgi/rum") ||
    text === "Failed to load resource: net::ERR_FAILED" ||
    text === "Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"
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
        const text = message.text()
        if (message.type() === "error" && !shouldIgnoreConsoleError(text)) errors.push(text)
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

      if (routeName === "organic-acid-final") {
        const curatedMode = page.getByRole("button", { name: /Curated real examples|人工整理真实样例/ }).first()
        if (await curatedMode.count()) {
          await curatedMode.scrollIntoViewIfNeeded()
          await curatedMode.click()
          await page.waitForTimeout(250)
        }
        const runButton = page.getByRole("button", { name: /Run curated sample|运行 Curated 小样例|Run demo screening|运行演示筛选/ }).first()
        if (await runButton.count()) {
          await runButton.scrollIntoViewIfNeeded()
          await runButton.click()
          await page.waitForTimeout(1400)
          const traceButton = page.getByRole("button", { name: /View run trace|查看运行追踪/ }).first()
          if (await traceButton.count()) await traceButton.click()
          await page.waitForTimeout(300)
        }
        const catBoundary = page.locator('[data-cat-boundary="hotspot-synergy"]').first()
        const catHandle = catBoundary.locator('[data-testid="catalysis-cat-probe"]').first()
        if (await catBoundary.count() && await catHandle.count()) {
          await catBoundary.scrollIntoViewIfNeeded()
          const catBox = await catHandle.boundingBox()
          const targetBox = await catBoundary.boundingBox()
          if (catBox && targetBox) {
            const startX = catBox.x + catBox.width / 2
            const startY = catBox.y + catBox.height / 2
            const endX = targetBox.x + targetBox.width * 0.82
            const endY = targetBox.y + targetBox.height * 0.28
            await page.mouse.move(startX, startY)
            await page.mouse.down()
            await page.mouse.move(endX, endY, { steps: 12 })
            await page.mouse.up()
            await page.waitForTimeout(350)
            const activeZone = await catHandle.getAttribute("data-cat-zone-active")
            if (!["mo-primary-hypothesis", "hot-spot-region"].includes(activeZone)) failures.push(`${routeName}/${viewportName}/${mode}: chart-scoped cat did not enter a hot zone, got ${activeZone}`)
          }
        }
      }

      if (routeName === "methodology") {
        await page.locator("#methodology-organic-acid-final-screening").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(1800)
        await page.locator("#methodology-knowledge-base").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(1800)
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
