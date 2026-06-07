import fs from "node:fs"
import path from "node:path"
import process from "node:process"

export const ROOT = process.cwd()
export const DATA_ROOT = path.join(ROOT, "public", "data")
export const DATABASE_INDEX_DIR = path.join(DATA_ROOT, "database_index")
export const BUILD_DATE = "2026-06-07"
export const VERSION = "V2.0-A"
export const DATASET_MODE = "database_index_preview"

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch (error) {
    if (fallback !== null) return fallback
    throw error
  }
}

export function fileExists(filePath) {
  return fs.existsSync(filePath)
}

export function readableMissingFileError(filePath, nextStep = "Run build-organic-acid-database-index.mjs --init-preview first.") {
  return [
    `manifest not found or required file missing: ${path.relative(ROOT, filePath).replace(/\\/g, "/")}`,
    nextStep,
    "V2.0-A requires datasetMode: database_index_preview and is not full database screening.",
  ].join("\n")
}

export function writeJson(filePath, value, { dryRun = false } = {}) {
  if (dryRun) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

export function ensureDir(dirPath, { dryRun = false } = {}) {
  if (dryRun) return
  fs.mkdirSync(dirPath, { recursive: true })
}

export function ensureCleanDir(dirPath, { dryRun = false } = {}) {
  if (dryRun) return
  fs.rmSync(dirPath, { recursive: true, force: true })
  fs.mkdirSync(dirPath, { recursive: true })
}

export function relDatabasePath(filePath) {
  return path.relative(DATABASE_INDEX_DIR, filePath).replace(/\\/g, "/")
}

export function pct(count, total, digits = 1) {
  const denominator = Number(total) || 0
  if (!denominator) return 0
  return Number(((Number(count) || 0) / denominator * 100).toFixed(digits))
}

export function paddedId(prefix, index) {
  return `${prefix}_${String(index).padStart(6, "0")}`
}

export function clamp01(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(1, number))
}

export function finiteOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function noFakeDoi(value) {
  if (value === null || value === undefined || value === "") return true
  return /^10\.\d{4,9}\/\S+$/i.test(String(value))
}

export function collectJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.flatMap(entry => {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) return collectJsonFiles(fullPath)
    return entry.name.endsWith(".json") ? [fullPath] : []
  })
}
