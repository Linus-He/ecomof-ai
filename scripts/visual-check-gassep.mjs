import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { spawn } from "node:child_process"
import { chromium } from "playwright"

const root = process.cwd()
const outDir = path.join(root, "test-results", "visual-checks", "gassep")
const port = Number(process.env.GASSEP_VISUAL_PORT || 4186)
const baseUrl = `http://127.0.0.1:${port}/ecomof-ai/`
const records = JSON.parse(await fs.readFile(path.join(root, "public/data/gas_adsorption_records_v2.json"), "utf8"))
const computedIds = new Set(records.filter(record => record.dataGrade === "computed-IAST" && record.secondaryIsotherm?.length >= 3).map(record => record.id))

await fs.mkdir(outDir, { recursive: true })

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function reachable() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1800) })
    return response.ok
  } catch {
    return false
  }
}

async function waitForPreview(server) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error("Vite preview exited before GasSep visual audit.")
    if (await reachable()) return
    await sleep(300)
  }
  throw new Error(`Vite preview did not become reachable at ${baseUrl}`)
}

function stop(server) {
  if (server && !server.killed) server.kill("SIGTERM")
}

const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  cwd: root,
  env: { ...process.env, BROWSER: "none" },
  stdio: ["ignore", "pipe", "pipe"],
})

let browser
const results = []
try {
  await waitForPreview(server)
  browser = await chromium.launch({ headless: true })

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1050 },
    { name: "mobile", width: 390, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
    const page = await context.newPage()
    await page.goto(`${baseUrl}#gassep`, { waitUntil: "domcontentloaded" })
    const panel = page.getByTestId("gassep-thermodynamic-panel")
    await panel.waitFor({ state: "visible", timeout: 30000 })
    await page.getByText(/吸附热力学与竞争平衡|Adsorption Thermodynamics and Competitive Equilibrium/).waitFor()
    const mechanismPanel = page.getByTestId("gassep-mechanism-evidence")
    await mechanismPanel.waitFor({ state: "visible", timeout: 30000 })
    await page.getByText(/机制分类与数据库补全|Mechanism Classification and Database Backfill/).waitFor()

    const formulaPane = page.getByTestId("gassep-thermodynamic-formulas")
    const chartPane = page.getByTestId("gassep-thermodynamic-chart")
    for (const required of [
      "henry-affinity",
      "henry-ratio",
      "iast-selectivity",
      "iast-constraints",
      "isosteric-heat",
    ]) {
      const formula = formulaPane.locator(`[data-formula-id="${required}"]`)
      if (await formula.count() !== 1) throw new Error(`${viewport.name}: missing formula ${required}`)
      if (!(await formula.getAttribute("aria-label"))) throw new Error(`${viewport.name}: formula ${required} has no readable fallback`)
    }

    const materialSelect = page.locator('select[aria-label="选择 MOF 气体分离记录"], select[aria-label="Select MOF gas-separation record"]').first()
    await materialSelect.waitFor({ state: "visible" })
    const options = await materialSelect.locator("option").evaluateAll(nodes => nodes.map(node => ({ value: node.value, label: node.textContent || "" })))
    const selectable = options.filter(option => computedIds.has(option.value))
    if (selectable.length < 2) throw new Error(`${viewport.name}: fewer than two computed-IAST records are selectable`)

    await materialSelect.selectOption(selectable[0].value)
    await page.waitForTimeout(350)
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="gassep-thermodynamic-chart"] .recharts-line-curve').length >= 2)
    const firstCurves = await chartPane.locator(".recharts-line-curve").evaluateAll(nodes => nodes.map(node => node.getAttribute("d")))
    const firstPanelText = await panel.innerText()

    await materialSelect.selectOption(selectable[1].value)
    await page.waitForTimeout(350)
    const secondCurves = await chartPane.locator(".recharts-line-curve").evaluateAll(nodes => nodes.map(node => node.getAttribute("d")))
    const secondPanelText = await panel.innerText()
    if (JSON.stringify(firstCurves) === JSON.stringify(secondCurves)) throw new Error(`${viewport.name}: plotted curves did not change after material selection`)
    if (firstPanelText === secondPanelText) throw new Error(`${viewport.name}: interpretation did not change after material selection`)

    const formulaBox = await formulaPane.boundingBox()
    const chartBox = await chartPane.boundingBox()
    if (!formulaBox || !chartBox) throw new Error(`${viewport.name}: thermodynamic layout panes are not measurable`)
    if (viewport.name === "desktop" && !(formulaBox.x < chartBox.x && Math.abs(formulaBox.y - chartBox.y) < 10)) {
      throw new Error("desktop: formula pane is not aligned left of the chart pane")
    }
    if (viewport.name === "mobile" && !(chartBox.y > formulaBox.y + formulaBox.height - 4)) {
      throw new Error("mobile: chart pane does not follow the formula pane")
    }

    const screenshotStyle = await page.addStyleTag({ content: "header { position: static !important; }" })
    await panel.screenshot({ path: path.join(outDir, `${viewport.name}-light.png`) })
    await screenshotStyle.evaluate(node => node.remove())
    const darkToggle = page.getByText("☾").first()
    if (await darkToggle.count()) {
      await darkToggle.click()
      await page.waitForTimeout(250)
    }
    const darkScreenshotStyle = await page.addStyleTag({ content: "header { position: static !important; }" })
    await panel.screenshot({ path: path.join(outDir, `${viewport.name}-dark.png`) })
    await darkScreenshotStyle.evaluate(node => node.remove())

    const gasPair = page.locator('select[aria-label="gas pair"]').first()
    await gasPair.selectOption("C3H6/C3H8")
    await page.waitForTimeout(300)
    for (const ratio of ["50/50", "10/90", "90/10"]) {
      if (!(await page.getByRole("button", { name: ratio, exact: true }).count())) {
        throw new Error(`${viewport.name}: missing C3H6/C3H8 ratio preset ${ratio}`)
      }
    }
    const mechanismText = await mechanismPanel.innerText()
    if (!/动力学|kinetic|数据库补全|Database backfill/i.test(mechanismText)) {
      throw new Error(`${viewport.name}: mechanism evidence panel did not expose kinetic/database evidence text`)
    }
    await gasPair.selectOption("C2H2/C2H4")
    await page.waitForTimeout(300)
    for (const ratio of ["0.5/99.5", "1/99", "1/999"]) {
      if (!(await page.getByRole("button", { name: ratio, exact: true }).count())) {
        throw new Error(`${viewport.name}: missing C2H2/C2H4 ratio preset ${ratio}`)
      }
    }

    results.push({
      viewport,
      formulasChecked: 5,
      comparedMaterialIds: [selectable[0].value, selectable[1].value],
      curveCount: secondCurves.length,
      horizontalFormulaChartLayout: viewport.name === "desktop",
      stackedFormulaChartLayout: viewport.name === "mobile",
      lightScreenshot: `${viewport.name}-light.png`,
      darkScreenshot: `${viewport.name}-dark.png`,
    })
    await context.close()
  }

  await fs.writeFile(path.join(outDir, "summary.json"), `${JSON.stringify({ status: "passed", baseUrl, results }, null, 2)}\n`)
  console.log(JSON.stringify({ status: "passed", results }, null, 2))
} finally {
  if (browser) await browser.close()
  stop(server)
}
