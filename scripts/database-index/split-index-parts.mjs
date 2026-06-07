import path from "node:path"
import { DATABASE_INDEX_DIR, DATASET_MODE, VERSION, fileExists, readableMissingFileError, readJson, writeJson } from "./database-index-utils.mjs"

export function splitRecords(records = [], {
  partSize = 250,
  prefix = "index_part",
  sourceDatabase = "database",
  outputDir,
  dryRun = false,
} = {}) {
  const rows = Array.isArray(records) ? records : []
  const dir = outputDir || path.join(DATABASE_INDEX_DIR, `${prefix}s`)
  const parts = []

  for (let start = 0; start < rows.length; start += partSize) {
    const partNumber = parts.length + 1
    const partId = `${prefix}_${String(partNumber).padStart(3, "0")}`
    const fileName = `${partId}.json`
    const filePath = path.join(dir, fileName)
    const partRows = rows.slice(start, start + partSize)
    writeJson(filePath, {
      version: VERSION,
      datasetMode: DATASET_MODE,
      partId,
      sourceDatabase,
      recordCount: partRows.length,
      records: partRows,
    }, { dryRun })
    parts.push({
      partId,
      path: path.relative(DATABASE_INDEX_DIR, filePath).replace(/\\/g, "/"),
      recordCount: partRows.length,
      firstId: partRows[0]?.id || null,
      lastId: partRows[partRows.length - 1]?.id || null,
    })
  }

  writeJson(path.join(dir, "README.json"), {
    version: VERSION,
    datasetMode: DATASET_MODE,
    sourceDatabase,
    partSize,
    partCount: parts.length,
    recordCount: rows.length,
    note: "Lightweight index parts only. Detail records are loaded on demand through detailRef.",
    warning: "Do not interpret this preview index as full verified database screening.",
    parts,
  }, { dryRun })

  return parts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run")
  const manifestPath = path.join(DATABASE_INDEX_DIR, "manifest.json")
  if (!fileExists(manifestPath)) {
    console.error(readableMissingFileError(
      manifestPath,
      "please run build-organic-acid-database-index.mjs --init-preview before running split-index-parts.mjs",
    ))
    process.exit(1)
  }
  const manifest = readJson(manifestPath)
  const partPaths = [
    ...(manifest.indexParts?.coreMof || []),
    ...(manifest.indexParts?.qmof || []),
  ]
  const partSummaries = partPaths.map(partPath => {
    const absolutePartPath = path.join(DATABASE_INDEX_DIR, partPath)
    if (!fileExists(absolutePartPath)) {
      return { path: partPath, exists: false, recordCount: 0 }
    }
    const part = readJson(absolutePartPath)
    const records = Array.isArray(part) ? part : (part.records || [])
    return { path: partPath, exists: true, recordCount: records.length }
  })
  const missing = partSummaries.filter(row => !row.exists)
  if (missing.length) {
    console.error(JSON.stringify({
      status: "failed",
      datasetMode: manifest.datasetMode || "missing",
      missingParts: missing.map(row => row.path),
      nextStep: "rerun build-organic-acid-database-index.mjs --init-preview",
    }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({
    mode: dryRun ? "dry-run" : "inspect",
    datasetMode: manifest.datasetMode,
    notFullDatabaseScreening: true,
    message: dryRun
      ? "No files written. Existing index parts are readable and already split for V2.0-A preview."
      : "split-index-parts.mjs is a helper; build-organic-acid-database-index.mjs owns preview generation.",
    parts: partSummaries,
  }, null, 2))
}
