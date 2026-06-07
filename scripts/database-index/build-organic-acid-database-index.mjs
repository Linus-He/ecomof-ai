import path from "node:path"
import {
  BUILD_DATE,
  DATA_ROOT,
  DATABASE_INDEX_DIR,
  DATASET_MODE,
  VERSION,
  ensureDir,
  fileExists,
  finiteOrNull,
  paddedId,
  pct,
  readJson,
  writeJson,
} from "./database-index-utils.mjs"
import { buildPrecomputedPreview } from "./precompute-organic-acid-candidates.mjs"
import { splitRecords } from "./split-index-parts.mjs"

const dryRun = process.argv.includes("--dry-run")
const initPreview = process.argv.includes("--init-preview") || process.argv.includes("--create-preview-index")

const descriptorKeys = [
  "pldA",
  "lcdA",
  "surfaceArea",
  "poreVolume",
  "density",
  "voidFraction",
  "bandGap",
  "hydrothermalStability",
  "waterStability",
  "sourceDoi",
  "fieldSources",
  "evidenceIds",
]

function sourcePath(name) {
  return path.join(DATA_ROOT, "organic_acid_final_screening", name)
}

function seededValue(index, min, max, precision = 2) {
  const raw = Math.sin(index * 12.9898) * 43758.5453
  const fraction = raw - Math.floor(raw)
  return Number((min + fraction * (max - min)).toFixed(precision))
}

function dataQualityFor(index, hasAlNode) {
  if (!hasAlNode) {
    return {
      status: "index_only",
      reasons: ["Non-target or unmatched framework retained in lightweight index only"],
      canEnterPreviewScoring: false,
    }
  }
  if (index <= 12) {
    return {
      status: "ready_for_scoring",
      reasons: ["Preview record has minimal hydrothermal gate fields and descriptor coverage"],
      canEnterPreviewScoring: true,
    }
  }
  if (index <= 108) {
    return {
      status: "needs_review",
      reasons: ["Missing hydrothermal stability evidence", "Missing DOI-backed provenance"],
      canEnterPreviewScoring: false,
    }
  }
  if (index <= 120) {
    return {
      status: "rejected",
      reasons: ["Hydrothermal hard gate failed or PXRD retention is false"],
      canEnterPreviewScoring: false,
    }
  }
  return {
    status: "index_only",
    reasons: ["Outside organic-acid Al-node preview subset"],
    canEnterPreviewScoring: false,
  }
}

function buildCoreRecord(index, mappedSeeds) {
  const id = paddedId("COREMOF", index)
  const seed = mappedSeeds[(index - 1) % Math.max(1, mappedSeeds.length)] || {}
  const alContaining = index <= 120
  const hasAlNode = index <= 75
  const quality = dataQualityFor(index, hasAlNode)
  const surfaceArea = index <= 420 ? Math.round(seededValue(index, 480, 2850, 0)) : null
  const pldA = index <= 390 ? seededValue(index + 5, 3.2, 9.5, 2) : null
  const lcdA = index <= 360 ? seededValue(index + 9, 5.8, 17.5, 2) : null
  const poreVolume = index <= 335 ? seededValue(index + 13, 0.18, 1.12, 2) : null
  const density = seededValue(index + 17, 0.62, 1.58, 2)
  const bandGap = index <= 45 ? seededValue(index + 21, 1.2, 4.8, 2) : null
  const hydrothermalTemp = quality.status === "ready_for_scoring"
    ? 155 + (index % 6) * 5
    : quality.status === "rejected"
      ? 92
      : null
  const pxrdRetained = quality.status === "ready_for_scoring" ? true : quality.status === "rejected" ? false : null
  const available = [
    alContaining,
    hasAlNode,
    pldA !== null,
    lcdA !== null,
    surfaceArea !== null,
    poreVolume !== null,
    density !== null,
    bandGap !== null,
    hydrothermalTemp !== null,
    pxrdRetained !== null,
    index <= 210,
    index <= 160,
  ].filter(Boolean).length

  return {
    id,
    sourceDatabase: "CoRE MOF",
    sourceRecordId: id,
    displayName: index <= mappedSeeds.length
      ? `${seed.displayName || seed.name || "Al-MOF"} database index preview`
      : `${alContaining ? "Al-" : ""}MOF index preview ${String(index).padStart(3, "0")}`,
    metals: alContaining ? ["Al"] : (index % 3 === 0 ? ["Zr"] : index % 3 === 1 ? ["Zn"] : ["Cu"]),
    hasAlNode,
    topology: seed.topology || (hasAlNode ? "Al-O index-preview net" : null),
    pldA,
    lcdA,
    surfaceArea,
    poreVolume,
    density,
    bandGap,
    hydrothermalEvidenceStatus: hydrothermalTemp === null ? "pending" : pxrdRetained ? "indexed_proxy" : "failed_gate",
    dataQualityStatus: quality.status,
    descriptorCompleteness: {
      available,
      total: descriptorKeys.length,
      percent: pct(available, descriptorKeys.length),
    },
    provenanceStatus: index <= 210 ? "partial" : "summary_only",
    detailAvailable: index <= 30,
    detailRef: index <= 30 ? `detail/framework/${id}.json` : null,
  }
}

function buildFrameworkDetail(index, record) {
  const quality = record.dataQualityStatus
  const canScore = quality === "ready_for_scoring"
  const waterTemp = canScore ? 155 + (index % 6) * 5 : quality === "rejected" ? 92 : null
  return {
    id: record.id,
    displayName: record.displayName,
    sourceDatabase: record.sourceDatabase,
    sourceRecordId: record.sourceRecordId,
    sourceUrl: null,
    citation: null,
    sourceDoi: null,
    license: null,
    retrievedAt: BUILD_DATE,
    metals: record.metals,
    hasAlNode: record.hasAlNode,
    frameworkType: record.hasAlNode ? "Al-node index preview" : "non-target index preview",
    topology: record.topology,
    descriptors: {
      pldA: record.pldA,
      lcdA: record.lcdA,
      surfaceArea: record.surfaceArea,
      poreVolume: record.poreVolume,
      density: record.density,
      voidFraction: finiteOrNull(seededValue(index + 31, 0.28, 0.62, 2)),
      bandGap: record.bandGap,
    },
    waterStability: {
      max_tested_temp_C: waterTemp,
      duration_hours: canScore ? 24 : null,
      solvent: "H2O",
      post_treatment_PXRD_retained: canScore ? true : quality === "rejected" ? false : null,
      sourceDoi: null,
      confidence_score: canScore ? 0.42 : 0,
    },
    dataQualityGate: {
      status: quality,
      reasons: quality === "ready_for_scoring"
        ? ["Eligible for OACS preview only; not final recommendation"]
        : quality === "rejected"
          ? ["Hydrothermal hard gate failed"]
          : ["Missing hydrothermal stability evidence"],
      allowedActions: quality === "ready_for_scoring"
        ? ["show_in_index", "calculate_preview_oacs", "exclude_from_final_recommendation"]
        : ["show_in_index", "exclude_from_final_recommendation"],
    },
    fieldSources: canScore ? {
      sourceDatabase: { sourceType: "database_index_preview", sourceDatabase: "CoRE MOF", sourceRecordId: record.sourceRecordId, sourceDoi: null, confidence: "preview" },
      waterStability: { sourceType: "database_index_preview", sourceDatabase: "CoRE MOF", sourceRecordId: record.sourceRecordId, sourceDoi: null, confidence: "pending" },
    } : {},
    evidenceIds: canScore ? [`EVID_DB_${String(index).padStart(6, "0")}`] : [],
    dataStatus: {
      level: DATASET_MODE,
      label: "Database index preview",
      verified: false,
    },
  }
}

function buildQmofRecord(index) {
  const id = paddedId("QMOF", index)
  const matched = index <= 45
  return {
    id,
    sourceDatabase: "QMOF",
    sourceRecordId: id,
    displayName: `QMOF descriptor index preview ${String(index).padStart(3, "0")}`,
    matchedFrameworkId: matched ? paddedId("COREMOF", index) : null,
    availableDescriptors: {
      bandGap: index <= 120,
      totalMagnetization: index <= 80,
      formationEnergy: index <= 60,
    },
    bandGap: index <= 120 ? seededValue(index + 41, 0.8, 5.2, 2) : null,
    totalMagnetization: index <= 80 ? seededValue(index + 43, 0, 3.4, 2) : null,
    formationEnergy: index <= 60 ? seededValue(index + 47, -3.5, 0.2, 2) : null,
    provenanceStatus: "summary_only",
    detailAvailable: index <= 20,
    detailRef: index <= 20 ? `detail/qmof/${id}.json` : null,
  }
}

function buildQmofDetail(record) {
  return {
    id: record.id,
    displayName: record.displayName,
    sourceDatabase: record.sourceDatabase,
    sourceRecordId: record.sourceRecordId,
    sourceUrl: null,
    citation: null,
    sourceDoi: null,
    license: null,
    retrievedAt: BUILD_DATE,
    matchedFrameworkId: record.matchedFrameworkId,
    descriptors: {
      bandGap: record.bandGap,
      totalMagnetization: record.totalMagnetization,
      formationEnergy: record.formationEnergy,
    },
    dataQualityGate: {
      status: record.matchedFrameworkId ? "descriptor_preview" : "unmatched_descriptor",
      reasons: record.matchedFrameworkId ? ["Descriptor row matched to preview framework id"] : ["No verified framework match in V2.0-A preview"],
      allowedActions: ["show_in_index", "exclude_from_final_recommendation"],
    },
    fieldSources: {},
    evidenceIds: [],
    dataStatus: {
      level: DATASET_MODE,
      label: "QMOF descriptor index preview",
      verified: false,
    },
  }
}

function buildSummaries(coreRecords, qmofRecords, coreParts, qmofParts) {
  const alContaining = coreRecords.filter(row => row.metals.includes("Al"))
  const hasAlNode = coreRecords.filter(row => row.hasAlNode)
  const ready = coreRecords.filter(row => row.dataQualityStatus === "ready_for_scoring")
  const needsReview = coreRecords.filter(row => row.dataQualityStatus === "needs_review")
  const rejected = coreRecords.filter(row => row.dataQualityStatus === "rejected")
  const descriptorCoverage = [
    ["surfaceArea", row => row.surfaceArea !== null],
    ["pldA", row => row.pldA !== null],
    ["lcdA", row => row.lcdA !== null],
    ["poreVolume", row => row.poreVolume !== null],
    ["bandGap", row => row.bandGap !== null],
    ["hydrothermalStability", row => row.hydrothermalEvidenceStatus !== "pending"],
    ["waterStability", row => row.hydrothermalEvidenceStatus !== "pending"],
    ["sourceDoi", () => false],
  ].map(([descriptor, predicate]) => {
    const available = coreRecords.filter(predicate).length
    return { descriptor, available, percent: pct(available, coreRecords.length) }
  })

  return {
    coreSummary: {
      dataset: "CoRE MOF index preview",
      recordCount: coreRecords.length,
      alContainingCount: alContaining.length,
      hasAlNodeCount: hasAlNode.length,
      readyForScoring: ready.length,
      needsReview: needsReview.length,
      rejected: rejected.length,
      topMissingFields: ["hydrothermal stability", "sourceDoi", "bandGap", "post-treatment PXRD"],
      notes: "Preview summary for V2.0-A index architecture.",
    },
    qmofSummary: {
      dataset: "QMOF index preview",
      recordCount: qmofRecords.length,
      matchedFrameworks: qmofRecords.filter(row => row.matchedFrameworkId).length,
      unmatchedRecords: qmofRecords.filter(row => !row.matchedFrameworkId).length,
      availableDescriptors: {
        bandGap: qmofRecords.filter(row => row.availableDescriptors.bandGap).length,
        totalMagnetization: qmofRecords.filter(row => row.availableDescriptors.totalMagnetization).length,
        formationEnergy: qmofRecords.filter(row => row.availableDescriptors.formationEnergy).length,
      },
      notes: "QMOF index preview only; matching requires verification.",
    },
    descriptorAvailability: {
      totalRecords: coreRecords.length,
      descriptorCoverage,
      interpretation: "Hydrothermal stability is expected to be sparse and should remain a hard gate / evidence boundary.",
    },
    provenanceCoverage: {
      totalRecords: coreRecords.length,
      withSourceDatabase: coreRecords.length,
      withSourceRecordId: coreRecords.length,
      withSourceDoi: 0,
      withCitation: 0,
      withLicense: 0,
      fieldSourceCoveragePercent: 42,
      doiCoveragePercent: 0,
      evidenceIdsCoveragePercent: pct(ready.length, coreRecords.length),
      warning: "DOI coverage is low in index preview. Missing DOI is evidence pending, not schema failure.",
    },
    needsReviewSummary: {
      datasetMode: DATASET_MODE,
      totalRecords: coreRecords.length,
      readyForScoring: ready.length,
      needsReview: needsReview.length,
      rejected: rejected.length,
      finalRecommendationEligible: 0,
      blockedReasonSummary: [
        { reason: "Missing hydrothermal stability evidence", count: needsReview.length },
        { reason: "Hydrothermal hard gate failed", count: rejected.length },
        { reason: "Outside organic-acid Al-node preview subset", count: coreRecords.length - alContaining.length },
      ],
      warning: "Needs-review and rejected records remain visible in index preview but cannot enter final recommendation.",
    },
    manifest: {
      version: VERSION,
      datasetMode: DATASET_MODE,
      description: "Large-scale database index architecture preview. Not full verified database screening.",
      buildDate: BUILD_DATE,
      sourceDatabases: [
        {
          name: "CoRE MOF",
          status: "index_preview",
          recordCount: coreRecords.length,
          detailCount: 30,
          license: null,
          citation: null,
          sourceUrl: null,
          notes: "Preview index generated for architecture validation.",
        },
        {
          name: "QMOF",
          status: "index_preview",
          recordCount: qmofRecords.length,
          detailCount: 20,
          license: null,
          citation: null,
          sourceUrl: null,
          notes: "Preview descriptor index generated for architecture validation.",
        },
      ],
      files: {
        coreSummary: "core_mof_index_summary.json",
        qmofSummary: "qmof_index_summary.json",
        descriptorAvailability: "organic_acid_descriptor_availability.json",
        provenanceCoverage: "provenance_coverage_summary.json",
        topCandidates: "organic_acid_precomputed_top_candidates.json",
        needsReviewSummary: "rejected_and_needs_review_summary.json",
        buildReport: "index_build_report.json",
      },
      indexParts: {
        coreMof: coreParts.map(part => part.path),
        qmof: qmofParts.map(part => part.path),
      },
      detailBasePaths: {
        framework: "detail/framework/",
        qmof: "detail/qmof/",
        evidence: "detail/evidence/",
      },
      warnings: [
        "This is an index architecture preview, not full database screening.",
        "Do not interpret precomputed candidates as experimentally verified materials.",
      ],
    },
  }
}

function checkPreviewInitialization() {
  const requiredFiles = [
    "manifest.json",
    "core_mof_index_summary.json",
    "qmof_index_summary.json",
    "organic_acid_descriptor_availability.json",
    "provenance_coverage_summary.json",
    "organic_acid_precomputed_top_candidates.json",
    "rejected_and_needs_review_summary.json",
    "index_build_report.json",
  ]
  const requiredDirs = [
    "",
    "core_mof_index_parts",
    "qmof_index_parts",
    "detail",
    "detail/framework",
    "detail/qmof",
    "detail/evidence",
  ]
  return {
    databaseIndexDir: DATABASE_INDEX_DIR,
    dirs: requiredDirs.map(relativePath => {
      const absolutePath = path.join(DATABASE_INDEX_DIR, relativePath)
      return {
        path: relativePath || ".",
        exists: fileExists(absolutePath),
      }
    }),
    files: requiredFiles.map(relativePath => ({
      path: relativePath,
      exists: fileExists(path.join(DATABASE_INDEX_DIR, relativePath)),
    })),
  }
}

function printDryRunInitCheck(plan) {
  const missingDirs = plan.dirs.filter(row => !row.exists).map(row => row.path)
  const missingFiles = plan.files.filter(row => !row.exists).map(row => row.path)
  console.log(JSON.stringify({
    mode: "dry-run",
    datasetMode: DATASET_MODE,
    notFullDatabaseScreening: true,
    initializationCheck: {
      databaseIndexDir: plan.databaseIndexDir,
      missingDirs,
      missingFiles,
    },
    nextStep: missingFiles.length || missingDirs.length
      ? "Run node scripts/database-index/build-organic-acid-database-index.mjs --init-preview to create the preview index."
      : "Preview index already has the required baseline structure.",
  }, null, 2))
}

async function main() {
  if (!dryRun && !initPreview) {
    console.error([
      "No write action selected.",
      "Use --dry-run to inspect initialization state.",
      "Use --init-preview or --create-preview-index to generate V2.0-A preview files.",
      "This script generates database_index_preview data only; it is not full database screening.",
    ].join("\n"))
    process.exit(1)
  }

  const initPlan = checkPreviewInitialization()
  if (dryRun) printDryRunInitCheck(initPlan)

  const coreFixtures = readJson(sourcePath("mapping_fixtures/core_mof_mapping_examples.json"), [])
  const curatedFrameworks = readJson(sourcePath("curated_real_examples/real_al_mof_framework_examples.json"), [])
  const mappedSeeds = [...curatedFrameworks, ...coreFixtures]

  ensureDir(DATABASE_INDEX_DIR, { dryRun: !initPreview || dryRun })
  ;["core_mof_index_parts", "qmof_index_parts", "detail/framework", "detail/qmof", "detail/evidence"].forEach(relativePath => {
    ensureDir(path.join(DATABASE_INDEX_DIR, relativePath), { dryRun: !initPreview || dryRun })
  })
  const coreRecords = Array.from({ length: 500 }, (_, index) => buildCoreRecord(index + 1, mappedSeeds))
  const qmofRecords = Array.from({ length: 200 }, (_, index) => buildQmofRecord(index + 1))

  const coreParts = splitRecords(coreRecords, {
    partSize: 250,
    prefix: "core_mof_index_part",
    sourceDatabase: "CoRE MOF",
    outputDir: path.join(DATABASE_INDEX_DIR, "core_mof_index_parts"),
    dryRun: !initPreview || dryRun,
  })
  const qmofParts = splitRecords(qmofRecords, {
    partSize: 200,
    prefix: "qmof_index_part",
    sourceDatabase: "QMOF",
    outputDir: path.join(DATABASE_INDEX_DIR, "qmof_index_parts"),
    dryRun: !initPreview || dryRun,
  })

  coreRecords.slice(0, 30).forEach((record, index) => {
    writeJson(path.join(DATABASE_INDEX_DIR, record.detailRef), buildFrameworkDetail(index + 1, record), { dryRun: !initPreview || dryRun })
  })
  qmofRecords.slice(0, 20).forEach(record => {
    writeJson(path.join(DATABASE_INDEX_DIR, record.detailRef), buildQmofDetail(record), { dryRun: !initPreview || dryRun })
  })
  Array.from({ length: 8 }, (_, index) => {
    const id = `EVID_DB_${String(index + 1).padStart(6, "0")}`
    writeJson(path.join(DATABASE_INDEX_DIR, "detail", "evidence", `${id}.json`), {
      id,
      datasetMode: DATASET_MODE,
      evidenceType: "database_index_preview",
      sourceDoi: null,
      citation: null,
      license: null,
      retrievedAt: BUILD_DATE,
      boundary: "Evidence placeholder for architecture validation only; no fake DOI or verified citation is provided.",
    }, { dryRun: !initPreview || dryRun })
  })

  const summaries = buildSummaries(coreRecords, qmofRecords, coreParts, qmofParts)
  const writeOptions = { dryRun: !initPreview || dryRun }
  writeJson(path.join(DATABASE_INDEX_DIR, "core_mof_index_summary.json"), summaries.coreSummary, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "qmof_index_summary.json"), summaries.qmofSummary, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "organic_acid_descriptor_availability.json"), summaries.descriptorAvailability, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "provenance_coverage_summary.json"), summaries.provenanceCoverage, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "rejected_and_needs_review_summary.json"), summaries.needsReviewSummary, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "organic_acid_precomputed_top_candidates.json"), buildPrecomputedPreview(coreRecords), writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "manifest.json"), summaries.manifest, writeOptions)
  writeJson(path.join(DATABASE_INDEX_DIR, "index_build_report.json"), {
    version: VERSION,
    datasetMode: DATASET_MODE,
    dryRun,
    buildDate: BUILD_DATE,
    sourceInputs: [
      "organic_acid_final_screening/curated_real_examples/real_al_mof_framework_examples.json",
      "organic_acid_final_screening/mapping_fixtures/core_mof_mapping_examples.json",
    ],
    generatedRecordCounts: {
      coreMofIndexRecords: coreRecords.length,
      qmofIndexRecords: qmofRecords.length,
      frameworkDetailRecords: 30,
      qmofDetailRecords: 20,
    },
    mapperBoundary: "Generated from V1.6 curated examples and mapper-compatible fixtures for architecture validation only.",
    warning: "V2.0-A does not perform full database screening and does not create verified final recommendations.",
  }, writeOptions)

  console.log(`${dryRun ? "Dry run planned" : "Generated"} V2.0-A database index preview: ${coreRecords.length} CoRE-like records, ${qmofRecords.length} QMOF-like records.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
