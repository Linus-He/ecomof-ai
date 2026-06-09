// V2.0-F background precompute pipeline — local dry-run only.
//
// This script audits existing local preview fixtures (the precomputed Top-N preview
// and a selected index part). It is a DRY RUN:
//   - it never connects to the network;
//   - it never downloads CoRE/QMOF or loads the full database;
//   - it never reads every index part (only the precomputed Top-N + one selected part);
//   - it never produces a final recommendation;
//   - it does NOT modify any existing official data structure — it writes a separate
//     dry-run report only;
//   - it does NOT modify the OACS/DMRS formulas.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import {
  getMetadataVerificationLevel,
  summarizeMetadataVerification,
} from "../src/utils/databaseIndex/metadataVerification.js"
import { descriptorCompletenessPercent } from "../src/utils/databaseIndex/databaseIndexFormatters.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const dataRoot = path.join(repoRoot, "public", "data", "database_index")

// Bounded fixture set: Top-N preview + a single selected index part. Not the full DB.
const FIXTURE_FILES = [
  "organic_acid_precomputed_top_candidates.json",
  "core_mof_index_parts/core_mof_index_part_001.json",
]

function readJson(relativePath) {
  const full = path.join(dataRoot, relativePath)
  if (!fs.existsSync(full)) return null
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"))
  } catch (error) {
    console.warn(`Could not parse fixture ${relativePath}: ${error.message}`)
    return null
  }
}

function extractRecords(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  return payload.topCandidates || payload.candidates || payload.records || []
}

function descriptorBucket(record) {
  const percent = descriptorCompletenessPercent(record)
  if (percent >= 80) return "complete"
  if (percent >= 40) return "partial"
  return "missingCritical"
}

export function runPrecomputeDryRun() {
  const records = []
  const fixturesUsed = []
  for (const file of FIXTURE_FILES) {
    const payload = readJson(file)
    const rows = extractRecords(payload)
    if (rows.length) {
      records.push(...rows)
      fixturesUsed.push({ file, recordCount: rows.length })
    }
  }

  const metadata = summarizeMetadataVerification(records)
  const descriptorCompleteness = { complete: 0, partial: 0, missingCritical: 0 }
  for (const record of records) {
    descriptorCompleteness[descriptorBucket(record)] += 1
  }

  const createdAt = new Date().toISOString()
  return {
    runId: `precompute-dry-run-${createdAt.replace(/\D/g, "").slice(0, 14)}`,
    createdAt,
    mode: "dry_run",
    notFinalRecommendation: true,
    formulaVersion: "OACS/DMRS unchanged (V2.0-F dry-run)",
    metadataGateVersion: "V2.0-E metadata gate",
    sourceDataset: "local preview fixtures",
    fixturesUsed,
    recordsScanned: records.length,
    recordsEligible: records.filter(row => getMetadataVerificationLevel(row) === "verified_metadata").length,
    recordsBlocked: records.filter(row => getMetadataVerificationLevel(row) === "blocked").length,
    metadata: {
      verified: metadata.verified_metadata,
      partial: metadata.partial_metadata,
      previewOnly: metadata.preview_only,
      blocked: metadata.blocked,
    },
    descriptorCompleteness,
    boundary: "Dry-run only. Not full verified database screening. No network, no full database load, no final recommendation.",
    boundaryZh: "仅本地试算；不是经完整验证的全量数据库筛选；不联网、不加载全量数据库、不产生最终推荐。",
  }
}

export function writeDryRunSummary(summary, outFile) {
  const dir = path.dirname(outFile)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(outFile, `${JSON.stringify(summary, null, 2)}\n`)
  return outFile
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const summary = runPrecomputeDryRun()
  const outFile = path.join(repoRoot, "public", "data", "database_precompute", "precompute_dry_run_summary.json")
  writeDryRunSummary(summary, outFile)
  console.log(`Precompute dry-run complete. ${summary.recordsScanned} records scanned (fixtures only, not full database).`)
  console.log(`metadata: verified=${summary.metadata.verified} partial=${summary.metadata.partial} previewOnly=${summary.metadata.previewOnly} blocked=${summary.metadata.blocked}`)
  console.log(`descriptorCompleteness: complete=${summary.descriptorCompleteness.complete} partial=${summary.descriptorCompleteness.partial} missingCritical=${summary.descriptorCompleteness.missingCritical}`)
  console.log(`notFinalRecommendation=${summary.notFinalRecommendation}`)
  console.log(`Summary written to ${path.relative(repoRoot, outFile)}`)
}
