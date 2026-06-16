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
    ["有机酸候选筛选运行台", "Organic Acid Screening Run Console"],
    ["开始筛选审计", "Run screening audit"],
    ["查看人工整理队列", "View curation queue"],
    ["筛选运行范围", "Screening Run Scope"],
    ["当前边界：V2.0-F 试算 / 仅限预览", "Current boundary: V2.0-F dry-run / preview only"],
    ["当前演示流程", "Current demo workflow"],
    ["映射样例", "Mapped sample records"],
    ["人工整理样例", "Curated real samples"],
    ["数据库索引预览", "Database index preview"],
    ["仅限预览", "Preview only"],
    ["不执行全量数据库评分", "does not run full database scoring"],
    ["运行结果摘要", "Run Result Summary"],
    ["运行追踪", "Run trace"],
    ["OACS–DMRS 候选优先级地图", "OACS–DMRS Candidate Priority Map"],
    ["优先验证区", "Priority validation"],
    ["Database Index Preview", "数据库索引预览"],
    ["Expanded Database Screening UI", "扩展数据库筛选界面"],
    ["Metadata Verification Gate", "metadata 核验门控"],
    ["Metadata verification", "metadata 核验"],
    ["V2.0-H · Small-Sample Validation and Sensitivity Audit", "V2.0-H · 小样本验证与敏感性审计"],
    ["Metadata Verification Queue", "人工核验队列"],
    ["Manual Metadata Curation", "人工 metadata 整理"],
    ["curation progress", "整理进度"],
    ["Needs source review", "待来源核验"],
    ["待补", "pending"],
    ["Near verified", "接近完成核验"],
    ["Evidence Backfill", "证据回填"],
    ["Verified Candidate Report", "经核验候选报告"],
    ["confirmed sources", "已有来源确认候选"],
    ["ambiguity warning", "ambiguity warning"],
    ["source confirmed", "来源已确认"],
    ["Sensitivity Audit", "敏感性审计"],
    ["Feature Ablation Audit", "特征消融审计"],
    ["Descriptor Redundancy Gate", "描述符冗余门控"],
    ["Algorithm Improvement Trace", "算法改进追踪"],
    ["Worker Scoring Boundary Preview", "Worker 评分边界预览"],
    ["loaded-scope dry run", "已加载范围试算"],
    ["Why in preview?", "为什么进入预览？"],
    ["Candidate Compare", "候选对比"],
    ["Top-N preview only", "仅 Top-N 预览"],
    ["Index Part Browser", "索引分片浏览器"],
    ["This is an index architecture preview, not full verified database screening.", "这是数据库索引架构预览，不是经过完整验证的全量数据库筛选。"],
    "Algorithm Pipeline Stepper",
    "Status Badge Legend",
    "Screening Funnel Chart",
    "Stage Summary Cards",
    ["耦合描述符热区图", "Coupled Descriptor Hot Spot Map"],
    ["骨架热区", "Scaffold Map"],
    ["金属热区", "Dopant Map"],
    ["优先级地图", "Priority Map"],
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
    ["Screening Trace", "筛选过程"],
    ["Screening Funnel", "筛选漏斗"],
    ["Candidate Dashboard", "候选决策面板"],
    ["Candidate Compare", "候选比较"],
    ["Data Gaps", "数据缺口"],
    ["Next Action", "下一步建议"],
    ["Database Preview", "数据库预览"],
    ["Not Final Recommendation", "非最终推荐"],
    ["Ranking Explanation", "排序解释"],
  ]],
  ["methodology", "#methodology", [
    ["Methods & Evidence", "方法与证据"],
    ["Model Validation Lab", "模型验证实验室"],
    ["Methodology Evolution Timeline", "方法论版本演化"],
    ["Feature Engineering Pipeline", "特征工程管线"],
    ["Feature Selection Explorer", "特征选择探索器"],
    ["Model Comparison Dashboard", "模型比较面板"],
    ["Explainability & Trust Map", "可解释性与信任地图"],
    ["Validation Workflow Workbench", "验证流程工作台"],
    ["Confidence & Uncertainty Analysis", "置信度与不确定性"],
    "Validation Pending",
    "Demo Only",
    "Framework Ready",
    ["Database Preview", "数据库预览"],
    ["Not Final Recommendation", "非最终推荐"],
    "V2.1",
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
    "V2.0-A",
    "V2.0-B",
    "V2.0-C",
    "V2.0-D",
    "V2.0-E",
    "V2.0-F",
    "V2.0-G",
    "V2.0-H",
    "V2.0-I",
    "V2.0-J",
    "V2.0-K",
    "V2.0-L",
    ["Database Index Preview", "数据库索引预览"],
    ["Manual Source Curation for First Verified Candidates", "第一批候选的人工来源核验"],
    ["Evidence Backfill and First Verified Metadata Candidates", "证据回填与第一批 verified metadata 候选"],
    ["Screening Run UX and Result Panel Refactor", "筛选运行体验与结果面板重构"],
    ["Manual Metadata Curation and Source-Link Enrichment", "人工 metadata 整理与来源链接补全"],
    ["Small-Sample Validation and Sensitivity Audit", "小样本验证与敏感性审计"],
    ["Multi-View Descriptor Gate", "多视角描述符门控"],
    ["Background Precompute Pipeline Planning", "后台预计算管线规划"],
    ["Verified Metadata Enrichment Workflow", "经核验 metadata 补全流程"],
    ["Small-Scale Verified Database Integration", "小规模经核验数据库接入"],
    ["Worker-Based Scoring Boundary Design", "Worker 评分边界设计"],
    ["Literature Library", "文献库"],
    ["Inspiration Map", "灵感映射"],
    ["Version ↔ Literature ↔ Module Matrix", "版本 ↔ 文献 ↔ 模块矩阵"],
    ["展开完整映射矩阵", "Expand full mapping matrix"],
    ["Evidence Boundary Legend", "证据边界图例"],
    ["Validation Roadmap", "验证路线"],
  ]],
  ["methodology-model-validation", "#methodology-model-validation", [
    ["Methods & Evidence", "方法与证据"],
    ["Model Validation Lab", "模型验证实验室"],
    ["Methodology Evolution Timeline", "方法论版本演化"],
    ["Feature Engineering Pipeline", "特征工程管线"],
    ["Feature Selection Explorer", "特征选择探索器"],
    ["Model Comparison Dashboard", "模型比较面板"],
    ["Explainability & Trust Map", "可解释性与信任地图"],
    ["Validation Workflow Workbench", "验证流程工作台"],
    ["Confidence & Uncertainty Analysis", "置信度与不确定性"],
    "Validation Pending",
    "Demo Only",
    "Framework Ready",
    ["Database Preview", "数据库预览"],
    ["Not Final Recommendation", "非最终推荐"],
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
        const curatedMode = page.getByRole("button", { name: /Curated real samples|人工整理样例/ }).first()
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
      }

      if (routeName === "methodology" || routeName === "methodology-model-validation") {
        await page.locator("#methodology-model-validation").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(900)
      }

      if (routeName === "methodology") {
        await page.locator("#methodology-organic-acid-final-screening").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(1800)
        await page.locator("#methodology-knowledge-base").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.waitForTimeout(1800)
      }

      if (routeName === "ecoscreen") {
        // EcoScreen renders a shell-first trace section before heavy candidate
        // panels finish filling. Wait for stable shell markers instead of chart timing.
        await page.waitForLoadState("load").catch(() => {})
        await page.locator("#screening-trace").first().waitFor({ state: "attached", timeout: 20000 })
        await page.locator("#screening-trace").first().scrollIntoViewIfNeeded().catch(() => {})
        await page.locator("#screening-trace[data-shell-ready='true']").first().waitFor({ state: "attached", timeout: 20000 })
        await page.locator("#screening-trace-timeline").first().waitFor({ state: "attached", timeout: 20000 })
        await page.locator("#screening-funnel-panel").first().waitFor({ state: "attached", timeout: 20000 })
        await page.locator("#candidate-decision-dashboard").first().waitFor({ state: "attached", timeout: 20000 })
        await page.waitForTimeout(350)
      }

      // Expand collapsible <details> sections (some default collapsed, e.g. on mobile)
      // so secondary-panel markers are verifiable regardless of collapse state.
      await page.evaluate(() => { document.querySelectorAll("details").forEach(node => { node.open = true }) })
      await page.waitForTimeout(150)

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
