import path from "node:path"
import {
  BUILD_DATE,
  DATABASE_INDEX_DIR,
  DATASET_MODE,
  VERSION,
  clamp01,
  fileExists,
  readableMissingFileError,
  readJson,
  writeJson,
} from "./database-index-utils.mjs"

const dryRun = process.argv.includes("--dry-run")
const initPreviewRequested = process.argv.includes("--init-preview") || process.argv.includes("--create-preview-index")

function readPartRecords(partPath) {
  const part = readJson(path.join(DATABASE_INDEX_DIR, partPath))
  return Array.isArray(part) ? part : (part.records || [])
}

function previewScore(record) {
  const surface = clamp01((Number(record.surfaceArea) || 0) / 2600)
  const pore = clamp01((Number(record.poreVolume) || 0) / 1.0)
  const pldFit = record.pldA == null ? 0.35 : clamp01(1 - Math.abs(Number(record.pldA) - 5.2) / 5.5)
  const density = record.density == null ? 0.45 : clamp01(1 - Math.abs(Number(record.density) - 1.05) / 1.6)
  return Number((0.24 + surface * 0.22 + pore * 0.18 + pldFit * 0.24 + density * 0.12).toFixed(3))
}

export function buildPrecomputedPreview(coreRecords = []) {
  const rows = Array.isArray(coreRecords) ? coreRecords : []
  const eligible = coreRecords
    .filter(record => record.dataQualityStatus === "ready_for_scoring")
    .map(record => ({
      ...record,
      oacsPreview: previewScore(record),
    }))
    .sort((a, b) => b.oacsPreview - a.oacsPreview)

  const topCandidates = eligible.slice(0, 20).map((record, index) => ({
    rank: index + 1,
    frameworkId: record.id,
    displayName: record.displayName,
    oacsPreview: record.oacsPreview,
    dataQualityStatus: record.dataQualityStatus,
    evidenceBoundary: "hydrothermal evidence indexed for preview; not full verification",
    detailRef: record.detailRef,
      notFinalRecommendation: true,
    }))

  const needsReviewCount = rows.filter(record => record.dataQualityStatus === "needs_review").length
  const rejectedCount = rows.filter(record => record.dataQualityStatus === "rejected").length
  return {
    version: VERSION,
    datasetMode: DATASET_MODE,
    precomputedAt: BUILD_DATE,
    method: "OACS-ready candidate preview using current schema and data quality gate.",
    notFullScreening: true,
    finalRecommendationCount: 0,
    topCandidates,
    blockedReasonSummary: [
      { reason: "needs_review_excluded_from_preview_top_n", count: needsReviewCount },
      { reason: "rejected_by_quality_or_hydrothermal_gate", count: rejectedCount },
    ],
    warnings: [
      "Preview scores are not final database screening results.",
      "Candidates with missing hydrothermal evidence must not enter final recommendation.",
      "Trace should cover only this Top-N/current subset, not the full raw database.",
    ],
  }
}

function main() {
  if (initPreviewRequested) {
    console.error([
      "precompute-organic-acid-candidates.mjs does not initialize the preview index directly.",
      "Please run: node scripts/database-index/build-organic-acid-database-index.mjs --init-preview",
      "Then rerun precompute with --dry-run or without --dry-run.",
    ].join("\n"))
    process.exit(1)
  }

  const manifestPath = path.join(DATABASE_INDEX_DIR, "manifest.json")
  if (!fileExists(manifestPath)) {
    console.error(readableMissingFileError(
      manifestPath,
      "please run build-organic-acid-database-index.mjs first, or run it with --init-preview to generate preview manifest",
    ))
    process.exit(1)
  }

  const manifest = readJson(manifestPath)
  if (manifest.datasetMode !== DATASET_MODE) {
    console.error(`Invalid datasetMode: ${manifest.datasetMode || "missing"}. Expected ${DATASET_MODE}.`)
    process.exit(1)
  }
  const coreRecords = (manifest.indexParts?.coreMof || []).flatMap(partPath => {
    const absolutePartPath = path.join(DATABASE_INDEX_DIR, partPath)
    if (!fileExists(absolutePartPath)) {
      console.error(readableMissingFileError(absolutePartPath, "please rerun build-organic-acid-database-index.mjs --init-preview"))
      process.exit(1)
    }
    return readPartRecords(partPath)
  })
  const output = buildPrecomputedPreview(coreRecords)

  writeJson(path.join(DATABASE_INDEX_DIR, "organic_acid_precomputed_top_candidates.json"), output, { dryRun })
  console.log(`${dryRun ? "Dry run" : "Wrote"} ${output.topCandidates.length} V2.0-A precomputed preview candidates. Needs-review records excluded: ${output.blockedReasonSummary[0]?.count || 0}.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
