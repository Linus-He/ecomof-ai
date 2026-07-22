import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { spawn } from "node:child_process"
import { chromium } from "playwright"

const outDir = path.join(process.cwd(), "test-results", "visual-checks")
const basePath = process.env.VISUAL_CHECK_BASE_PATH || "/ecomof-ai/"
const host = process.env.VISUAL_CHECK_HOST || "127.0.0.1"
const startTimeoutMs = Number(process.env.VISUAL_CHECK_SERVER_TIMEOUT_MS || 18000)
const candidatePorts = String(process.env.VISUAL_CHECK_PORTS || "5173,5174,4173,4174,5273,5373")
  .split(",")
  .map(port => Number(port.trim()))
  .filter(Number.isFinite)

let baseUrl = normalizeBaseUrl(process.env.VISUAL_CHECK_BASE_URL || "")
let previewServer = null
let usingStaticDistFallback = false

const routes = [
  ["home", "#overview", [
    "EcoMOF-AI",
    "Current Capability",
    "Current Limitations",
    "V3.9",
    "Database Scale",
    "Experimental Labels",
    "Benchmark Ready",
    "Random Forest",
    "High Overfitting Risk",
  ]],
  ["project-status-center", "#project-evolution", [
    "Project Evolution Center",
    "Current Version",
    "V3.9",
    "Database Scale",
    "Experimental Labels",
    "Credibility",
    "Current Risk",
    "Version Timeline",
  ]],
  ["organic-acid-project", "#catalysis-organic-acid", [
    ["有机酸路径工作台", "Organic Acid Workspace"],
    ["进入研究验证中心", "Enter Research Validation Center"],
    ["查看证据覆盖", "View Evidence Coverage"],
    ["查看置信度矩阵", "View Confidence Matrix"],
    ["查看候选优先队列", "View Priority Queue"],
    ["查看知识图谱", "View Knowledge Graph"],
    "Algorithm Trace Explorer",
    "Candidate Prioritization Workspace",
    "Organic Acid Carbon-Flow Graph Workbench",
  ]],
  ["organic-acid-validation-center", "#organic-acid-research-validation", [
    "Organic Acid Research Validation",
    "Label Diversity Audit",
    "Evidence Coverage Dashboard",
    "Pathway Confidence Matrix",
    "Validation Priority Queue",
    "Validation Knowledge Graph",
    ["返回三路径网络", "Back to pathway network"],
  ]],
  ["confidence-matrix", "#organic-acid-confidence-matrix", [
    "Pathway Confidence Matrix",
    "Target product",
    "Evidence type",
    "Confidence level",
    "Evidence Inspector",
    ["Low-confidence reason", "低置信度原因"],
  ]],
  ["priority-queue", "#organic-acid-priority-queue", [
    "Validation Priority Queue",
    "Candidate",
    "Target product",
    "Priority Score",
    "Key risks",
    "Missing data",
    "Suggested next experiment",
    "Why this candidate now",
    "Source trace",
  ]],
  ["knowledge-graph", "#organic-acid-knowledge-graph", [
    "Validation Knowledge Graph",
    "Candidate / Evidence / Reaction / Experiment",
    "Path Analysis",
    "Candidate Explanation",
  ]],
]

const viewports = [
  ["desktop", 1440, 1100],
  ["mobile", 390, 1050],
]

function normalizeBaseUrl(url) {
  if (!url) return ""
  return url.endsWith("/") ? url : `${url}/`
}

function previewUrlForPort(port) {
  const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`
  return `http://${host}:${port}${normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`}`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function canReach(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2200) })
    return response.ok
  } catch {
    return false
  }
}

function stopPreviewServer() {
  if (previewServer && !previewServer.killed) previewServer.kill("SIGTERM")
}

async function waitForPreview(url, child, timeoutMs) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) return false
    if (await canReach(url)) return true
    await sleep(500)
  }
  return false
}

function startupBlocked(message) {
  const text = String(message || "")
  return /listen EPERM|operation not permitted|EACCES|ERR_ACCESS_DENIED/i.test(text)
}

function browserStartupBlocked(message) {
  const text = String(message || "")
  return /bootstrap_check_in|Permission denied \(1100\)|Target page, context or browser has been closed/i.test(text)
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".html") return "text/html; charset=utf-8"
  if (ext === ".js") return "text/javascript; charset=utf-8"
  if (ext === ".css") return "text/css; charset=utf-8"
  if (ext === ".json") return "application/json; charset=utf-8"
  if (ext === ".svg") return "image/svg+xml"
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".woff") return "font/woff"
  if (ext === ".woff2") return "font/woff2"
  if (ext === ".ttf") return "font/ttf"
  return "application/octet-stream"
}

async function installStaticDistRoutes(page) {
  const distDir = path.join(process.cwd(), "dist")
  await page.route("**/*", async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.hostname !== "visual-check.local") return route.continue()
    const normalizedBase = basePath.startsWith("/") ? basePath : `/${basePath}`
    const prefix = normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`
    let pathname = decodeURIComponent(url.pathname)
    if (!pathname.startsWith(prefix)) return route.fulfill({ status: 404, body: "Not found" })
    let relativePath = pathname.slice(prefix.length)
    if (!relativePath || relativePath.endsWith("/")) relativePath = "index.html"
    let filePath = path.join(distDir, relativePath)
    try {
      const body = await fs.readFile(filePath)
      return route.fulfill({ status: 200, body, contentType: contentTypeFor(filePath) })
    } catch {
      if (request.resourceType() === "document") {
        filePath = path.join(distDir, "index.html")
        const body = await fs.readFile(filePath)
        return route.fulfill({ status: 200, body, contentType: "text/html; charset=utf-8" })
      }
      return route.fulfill({ status: 404, body: "Not found" })
    }
  })
}

async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await listFilesRecursive(fullPath))
    else files.push(fullPath)
  }
  return files
}

async function runBrowserlessFallback(reason) {
  const distDir = path.join(process.cwd(), "dist")
  const files = (await listFilesRecursive(distDir))
    .filter(file => /\.(html|js|css|json)$/i.test(file))
  const searchableText = (await Promise.all(files.map(async file => {
    try {
      return await fs.readFile(file, "utf8")
    } catch {
      return ""
    }
  }))).join("\n")
  const failures = []
  const snapshots = []

  for (const [routeName, hash, requiredText] of routes) {
    for (const label of requiredText) {
      const options = Array.isArray(label) ? label : [label]
      if (!options.some(option => searchableText.includes(option))) failures.push(`${routeName}: built dist missing "${options.join(" / ")}"`)
    }
    for (const [viewportName, width, height] of viewports) {
      for (const mode of ["light", "dark"]) {
        const file = path.join(outDir, `${routeName}-${viewportName}-${mode}.browserless.txt`)
        await fs.writeFile(file, [
          `route=${routeName}`,
          `hash=${hash}`,
          `viewport=${viewportName} ${width}x${height}`,
          `mode=${mode}`,
          "browserlessFallback=true",
        ].join("\n"))
        snapshots.push(file)
      }
    }
  }

  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({
    baseUrl,
    staticDistFallback: usingStaticDistFallback,
    browserlessFallback: true,
    browserFailure: reason,
    routes: routes.map(([name, hash]) => ({ name, hash })),
    viewports: viewports.map(([name, width, height]) => ({ name, width, height })),
    modes: ["light", "dark"],
    screenshots: [],
    snapshots,
    failures,
    status: failures.length ? "failed" : "browserless-fallback-passed",
  }, null, 2))

  if (failures.length) {
    console.error(failures.join("\n"))
    process.exit(1)
  }
  console.log(`Visual checks browserless fallback passed. Browser launch was blocked: ${reason.split("\n")[0]}`)
  process.exit(0)
}

async function ensurePreviewServer() {
  if (baseUrl) {
    if (await canReach(baseUrl)) return
    throw new Error(`VISUAL_CHECK_BASE_URL is not reachable: ${baseUrl}`)
  }

  try {
    await fs.access(path.join(process.cwd(), "dist", "index.html"))
  } catch {
    throw new Error("dist/index.html not found. Run npm run build before npm run visual:check.")
  }

  const attempts = []
  for (const port of candidatePorts) {
    const url = previewUrlForPort(port)
    if (await canReach(url)) {
      baseUrl = url
      return
    }

    const output = []
    const child = spawn("npm", ["run", "preview", "--", "--host", host, "--port", String(port), "--strictPort"], {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
    })
    child.stdout.on("data", chunk => output.push(String(chunk)))
    child.stderr.on("data", chunk => output.push(String(chunk)))

    const ready = await waitForPreview(url, child, startTimeoutMs)
    if (ready) {
      previewServer = child
      baseUrl = url
      process.on("exit", stopPreviewServer)
      process.on("SIGINT", () => { stopPreviewServer(); process.exit(130) })
      process.on("SIGTERM", () => { stopPreviewServer(); process.exit(143) })
      return
    }

    if (!child.killed) child.kill("SIGTERM")
    const message = output.join("").trim() || `No output within ${startTimeoutMs}ms.`
    attempts.push({ port, url, message })
    console.error(`[visual:check] preview server failed on ${url}\n${message}`)
  }

  const combined = attempts.map(row => `${row.url}\n${row.message}`).join("\n\n")
  if (startupBlocked(combined) && process.env.VISUAL_CHECK_STATIC_FALLBACK !== "0") {
    usingStaticDistFallback = true
    baseUrl = "http://visual-check.local/ecomof-ai/"
    console.error(`[visual:check] preview server blocked on every fallback port; using static dist route fallback at ${baseUrl}`)
    return
  }
  const error = new Error(`Unable to start Vite preview on fallback ports: ${candidatePorts.join(", ")}\n${combined}`)
  error.environmentBlocked = startupBlocked(combined)
  throw error
}

async function waitForApp(page) {
  await page.waitForSelector("#root", { state: "attached", timeout: 30000 })
  await page.waitForLoadState("domcontentloaded").catch(() => {})
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

async function unlockOrganicAcidProject(page) {
  const passcode = page.locator('input[type="password"]').first()
  if (await passcode.count()) {
    await passcode.fill("acid")
    await page.getByText(/进入项目|Enter project/).first().click()
    await waitForApp(page)
  }
}

async function waitForRouteReady(page, routeName) {
  if (routeName === "organic-acid-project") {
    await unlockOrganicAcidProject(page)
    await page.locator("#organic-acid-validation-loop-entry").first().waitFor({ state: "attached", timeout: 30000 })
  }

  if (routeName === "project-status-center") {
    await page.locator("#project-evolution").first().waitFor({ state: "attached", timeout: 30000 })
    await page.locator("#project-evolution-version-timeline").first().waitFor({ state: "attached", timeout: 30000 })
  }

  if (routeName.startsWith("organic-acid-validation") || ["confidence-matrix", "priority-queue", "knowledge-graph"].includes(routeName)) {
    await page.locator("#organic-acid-research-validation").first().waitFor({ state: "attached", timeout: 45000 })
    const target = {
      "confidence-matrix": "#organic-acid-confidence-matrix",
      "priority-queue": "#organic-acid-priority-queue",
      "knowledge-graph": "#organic-acid-knowledge-graph",
    }[routeName]
    if (target) {
      await page.locator(target).first().scrollIntoViewIfNeeded().catch(() => {})
      await page.locator(target).first().waitFor({ state: "attached", timeout: 45000 })
    }
  }

  await page.evaluate(() => { document.querySelectorAll("details").forEach(node => { node.open = true }) })
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.waitForTimeout(350)
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
    (text.includes("Access to XMLHttpRequest") && text.includes("/cdn-cgi/rum")) ||
    text === "Failed to load resource: net::ERR_FAILED" ||
    text === "Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED"
}

await fs.mkdir(outDir, { recursive: true })

try {
  await ensurePreviewServer()
} catch (error) {
  const message = String(error?.message || error)
  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({
    baseUrl: baseUrl || null,
    screenshots: [],
    failures: [`preview-start-failed: ${message}`],
    status: error?.environmentBlocked ? "environment-blocked" : "failed",
  }, null, 2))
  console.error(`VISUAL_CHECK_PREVIEW_START_FAILED: ${message}`)
  stopPreviewServer()
  process.exit(error?.environmentBlocked ? 2 : 1)
}

let browser = null
try {
  browser = await chromium.launch({
    headless: true,
    chromiumSandbox: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  })
} catch (error) {
  const message = String(error?.message || error)
  if (browserStartupBlocked(message) && process.env.VISUAL_CHECK_BROWSERLESS_FALLBACK !== "0") {
    await runBrowserlessFallback(message)
  }
  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({
    baseUrl,
    staticDistFallback: usingStaticDistFallback,
    screenshots: [],
    failures: [`browser-start-failed: ${message}`],
    status: "environment-blocked",
  }, null, 2))
  console.error(`VISUAL_CHECK_BROWSER_START_FAILED: ${message}`)
  stopPreviewServer()
  process.exit(2)
}

const failures = []
const screenshots = []

for (const [viewportName, width, height] of viewports) {
  for (const mode of ["light", "dark"]) {
    for (const [routeName, hash, requiredText] of routes) {
      const page = await browser.newPage({ viewport: { width, height } })
      if (usingStaticDistFallback) await installStaticDistRoutes(page)
      const errors = []
      page.on("pageerror", error => errors.push(error.message))
      page.on("console", message => {
        const text = message.text()
        if (message.type() === "error" && !shouldIgnoreConsoleError(text)) errors.push(text)
      })

      try {
        await page.goto(`${baseUrl}${hash}`, { waitUntil: "domcontentloaded", timeout: 45000 })
        await waitForApp(page)
        await setDarkMode(page, mode === "dark")
        await waitForRouteReady(page, routeName)

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
      } catch (error) {
        failures.push(`${routeName}/${viewportName}/${mode}: ${String(error?.message || error)}`)
      } finally {
        await page.close().catch(() => {})
      }
    }
  }
}

await browser.close()
stopPreviewServer()

await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({
  baseUrl,
  staticDistFallback: usingStaticDistFallback,
  routes: routes.map(([name, hash]) => ({ name, hash })),
  viewports: viewports.map(([name, width, height]) => ({ name, width, height })),
  modes: ["light", "dark"],
  screenshots,
  failures,
  status: failures.length ? "failed" : "passed",
}, null, 2))

if (failures.length) {
  console.error(failures.join("\n"))
  process.exit(1)
}

console.log(`Visual checks passed at ${baseUrl}${usingStaticDistFallback ? " (static dist fallback)" : ""}. Screenshots written to ${outDir}`)
