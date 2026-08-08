import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const testFile = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(testFile), "../../..")
const scannedRoots = ["src", "scripts", "public"].map(segment => path.join(root, segment))

const excludedDirectories = new Set([".git", "dist", "node_modules", "coverage", "test-results"])
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
])

function walkFiles(entry) {
  if (!fs.existsSync(entry)) return []
  const stat = fs.statSync(entry)
  if (stat.isDirectory()) {
    if (excludedDirectories.has(path.basename(entry))) return []
    return fs.readdirSync(entry).flatMap(name => walkFiles(path.join(entry, name)))
  }
  if (entry === testFile || !textExtensions.has(path.extname(entry))) return []
  return [entry]
}

function readTextFiles() {
  return scannedRoots
    .flatMap(walkFiles)
    .map(file => ({
      file: path.relative(root, file),
      content: fs.readFileSync(file, "utf8"),
    }))
}

const deprecatedShapePatterns = [
  new RegExp(`\\b${"pi" + "ll"}\\b`, "i"),
  new RegExp(`${"caps" + "ule"}`, "i"),
  new RegExp(`${"border" + "Radius"}:\\s*999`, "i"),
  new RegExp(`${"border-" + "radius"}:\\s*999px`, "i"),
  new RegExp(`${"border-" + "radius"}:999px`, "i"),
]

const bannedWarmColors = [
  "FEF3C7",
  "FFFBEB",
  "FFF7ED",
  "FDE68A",
  "F59E0B",
  "D97706",
  "B45309",
].map(hex => `#${hex}`)

const bannedWarmRgba = [
  "245,158,11",
  "217,119,6",
  "251,191,36",
  "254,243,199",
  "255,251,235",
  "255,247,237",
]

const leftEdgePatterns = [
  new RegExp(`${"border" + "Left"}`, "i"),
  new RegExp(`${"border-" + "left"}`, "i"),
  new RegExp(`${"border" + "InlineStart"}`, "i"),
  new RegExp(`${"border-inline-" + "start"}`, "i"),
  new RegExp(`${"box" + "Shadow"}:\\s*[\`"']?inset\\s+[34]px\\s+0`, "i"),
  new RegExp(`${"box-shadow"}:\\s*inset\\s+[34]px\\s+0`, "i"),
]

function findOffenders(files, predicate) {
  return files
    .flatMap(({ file, content }) => {
      const lines = content.split(/\r?\n/)
      return lines
        .map((line, index) => ({ file, line: index + 1, text: line }))
        .filter(item => predicate(item.text, file))
    })
    .map(item => `${item.file}:${item.line}`)
}

describe("global design language guardrails", () => {
  const files = readTextFiles()

  it("does not reintroduce retired rounded-tag geometry or naming", () => {
    const offenders = findOffenders(files, line => deprecatedShapePatterns.some(pattern => pattern.test(line)))
    expect(offenders).toEqual([])
  })

  it("does not use yellow or orange warning backgrounds from the retired palette", () => {
    const offenders = findOffenders(files, line => {
      const compact = line.replace(/\s+/g, "")
      return bannedWarmColors.some(color => line.includes(color))
        || bannedWarmRgba.some(value => compact.includes(`rgba(${value}`))
    })
    expect(offenders).toEqual([])
  })

  it("does not use colored one-sided emphasis blocks", () => {
    const offenders = findOffenders(files, line => leftEdgePatterns.some(pattern => pattern.test(line)))
    expect(offenders).toEqual([])
  })

  it("uses visually reviewed sparse artwork in the homepage research map", () => {
    const mapSource = fs.readFileSync(
      path.join(root, "src/components/home/ScientificDiscoveryMap.tsx"),
      "utf8",
    )
    const rasterImports = [...mapSource.matchAll(/assets\/home-map\/([^"']+\.(?:jpe?g|png|webp))/gi)]
      .map(match => match[1])
    const reviewedArtwork = new Set([
      "atlas-catalysis.jpg",
      "atlas-ecoscreen.jpg",
      "atlas-gassep.jpg",
      "atlas-library.jpg",
      "atlas-validation.jpg",
      "safe-catalysis-pathway.jpg",
      "safe-evidence-validation.jpg",
      "safe-gas-isotherm.jpg",
      "safe-lifecycle-pareto.jpg",
      "safe-structure-library.jpg",
    ])

    expect(rasterImports.length).toBeGreaterThan(0)
    expect(rasterImports.every(file => reviewedArtwork.has(file))).toBe(true)
  })
})
