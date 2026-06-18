// V3.0 Data Foundation builder.
// Reproducibly derives the gold / literature / benchmark / label datasets from
// existing repository data using the real V3.0 normalization + validation utils.
// Honest by construction: missing DOI/citation stays pending, synthetic fixtures
// are capped at Bronze, and no experimental label is fabricated (labels = null).
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { normalizeOrganicAcidRecord } from "../src/utils/dataStandardization/normalizeOrganicAcidRecord.js"
import { validateDataset } from "../src/utils/dataValidation/index.js"
import { buildBenchmarkDataset } from "../src/utils/benchmark/benchmarkDatasetBuilder.js"

const root = process.cwd()
const dataDir = path.join(root, "public", "data")
const read = rel => JSON.parse(fs.readFileSync(path.join(dataDir, rel), "utf8"))
const write = (rel, value) => fs.writeFileSync(path.join(dataDir, rel), JSON.stringify(value, null, 2) + "\n")

// ---- 1. Load real repository sources ----
const realSeed = read("mof_candidates_real_seed.json")
const openSeed = read("open_mof_seed_candidates.json")
const alMof = read("organic_acid_final_screening/al_mof_framework_candidates.json")
const v22 = read("database_precompute/v2_2/scalable_database_preview_records.json")

// ---- 2. Map each source row into a raw organic-acid shape, then normalize ----
const rawRecords = []

for (const row of realSeed) {
  rawRecords.push({
    recordId: `real-seed-${row.id}`,
    id: row.id,
    displayName: row.name,
    metalNode: Array.isArray(row.metalNodes) ? row.metalNodes.join("/") : row.metalNode,
    linker: row.linker,
    topology: row.topology,
    surfaceArea: row.surfaceArea,
    poreVolume: row.poreVolume,
    poreSizeA: row.poreSizeA,
    bandGap: row.bandGap,
    reactionId: `oa-${row.id}`,
    targetProduct: "formic acid",
    doi: row.sourceDOI,
    citation: Array.isArray(row.source) ? row.source.join("; ") : row.source,
    sourceUrl: row.sourceUrl || "pending",
    sourceDatabase: Array.isArray(row.sourceDatabase) ? row.sourceDatabase.join("/") : row.sourceDatabase,
  })
}

for (const row of v22) {
  rawRecords.push({
    recordId: `v22-${row.candidateId || row.id}`,
    id: row.candidateId || row.id,
    displayName: row.displayName || row.name,
    metalNode: row.metalNode,
    linker: row.linker,
    topology: row.topology,
    surfaceArea: row.surfaceArea,
    poreVolume: row.poreVolume,
    poreSizeA: row.poreSizeA,
    density: row.density,
    voidFraction: row.voidFraction,
    bandGap: row.bandGap,
    reactionId: `oa-${row.candidateId || row.id}`,
    targetProduct: "formic acid",
    doi: row.doi,
    citation: row.citation,
    sourceUrl: row.sourceUrl,
    verifiedMetadata: row.verifiedMetadata === true,
    syntheticFixture: row.syntheticFixture === true,
    sourceDatabase: row.sourceDatabase,
  })
}

for (const row of openSeed) {
  rawRecords.push({
    recordId: `open-seed-${row.id}`,
    id: row.id,
    displayName: row.name,
    metalNode: row.metalNode,
    linker: row.linker,
    topology: row.topology,
    surfaceArea: row.surfaceArea,
    poreVolume: row.poreVolume,
    poreSizeA: row.poreSizeA,
    density: row.density,
    voidFraction: row.voidFraction,
    bandGap: row.bandGap,
    reactionId: `oa-${row.id}`,
    targetProduct: "formic acid",
    doi: "pending",
    citation: "pending",
    sourceUrl: row.cifUrl || "pending",
    sourceDatabase: row.sourceDatabase,
  })
}

for (const row of alMof) {
  rawRecords.push({
    recordId: `al-mof-${row.id}`,
    id: row.id,
    displayName: row.displayName,
    metalNode: Array.isArray(row.metals) ? row.metals.join("/") : row.metals,
    topology: row.topology,
    surfaceArea: row.surfaceArea,
    poreVolume: row.poreVolume,
    poreSizeA: row.pldA,
    density: row.density,
    voidFraction: row.voidFraction,
    bandGap: row.bandGap,
    reactionId: `oa-${row.id}`,
    targetProduct: "formic acid",
    doi: row.waterStability?.source_doi || "pending",
    citation: "pending",
    sourceUrl: "pending",
    sourceDatabase: row.sourceDatabase,
  })
}

// Source-id mapping for provenance attribution.
const sourceIdFor = recordId => {
  if (recordId.startsWith("real-seed-")) return "SRC-REAL-SEED"
  if (recordId.startsWith("v22-")) return "SRC-CORE-MOF-2019"
  if (recordId.startsWith("open-seed-")) return "SRC-OPEN-SEED"
  return "SRC-OA-EXPERIMENT"
}

const normalized = rawRecords.map(raw => normalizeOrganicAcidRecord(raw, { sourceId: sourceIdFor(raw.recordId) }))
const validated = validateDataset(normalized)

// Compact a validated record for committing (drop bulky fieldSources / check logs).
const compact = row => ({
  recordId: row.recordId,
  sourceId: row.sourceId,
  syntheticFixture: Boolean(row.syntheticFixture),
  qualityTier: row.qualityTier,
  provenanceCoverage: row.validation?.provenanceCoverage ?? row.quality?.provenanceCoverage ?? 0,
  mof: row.mof,
  reaction: row.reaction,
  performance: row.performance,
  evidence: row.evidence,
  quality: {
    completenessScore: row.quality?.completenessScore ?? 0,
    provenanceCoverage: row.validation?.provenanceCoverage ?? row.quality?.provenanceCoverage ?? 0,
    validationStatus: row.qualityTier,
    warnings: row.quality?.warnings || [],
    blockers: row.quality?.blockers || [],
  },
})

// ---- 3. Datasets ----
// Literature dataset = diverse, honestly-tiered subset (all Gold/Silver/Rejected
// + a capped Bronze sample) kept to a committable size.
const allCompact = validated.records.map(compact)
const byTier = tier => allCompact.filter(row => row.qualityTier === tier)
const literatureRecords = [
  ...byTier("Gold"),
  ...byTier("Silver"),
  ...byTier("Bronze").slice(0, 60),
  ...byTier("Rejected"),
]
const goldRecords = literatureRecords.filter(row => row.qualityTier === "Gold")

// Labels: no real experimental yield/selectivity labels exist yet -> all missing.
const labels = literatureRecords.map(row => ({
  recordId: row.recordId,
  candidateId: row.mof?.mofId,
  label: null,
  labelStatus: "missing",
  labelSource: "missing",
  taskType: "binary",
  note: "No real experimental yield/selectivity label is available; label is intentionally null and not fabricated.",
}))

const benchmark = buildBenchmarkDataset({ records: literatureRecords, labels, taskType: "binary" })

const stamp = "2026-06-18"
const tierCounts = literatureRecords.reduce((acc, row) => { acc[row.qualityTier] = (acc[row.qualityTier] || 0) + 1; return acc }, { Gold: 0, Silver: 0, Bronze: 0, Rejected: 0 })
const subsetProvenance = literatureRecords.length
  ? Number((literatureRecords.reduce((s, r) => s + (r.provenanceCoverage || 0), 0) / literatureRecords.length).toFixed(3))
  : 0

write("organic_acid_gold_dataset_v1.json", {
  version: "v3.0",
  datasetId: "organic-acid-gold-dataset-v1",
  generatedAt: stamp,
  generator: "scripts/build-v3-0-data-foundation.mjs",
  goldCriteria: "Real DOI + real citation + non-synthetic + source-link provenance >= 0.8.",
  goldThreshold: 20,
  goldCount: goldRecords.length,
  sufficient: goldRecords.length >= 20,
  note: "Records reach Gold on confirmed source provenance (real DOI + citation, non-synthetic). Reaction performance (yield/selectivity) and experimental labels remain pending and are never fabricated.",
  records: goldRecords,
})

write("organic_acid_literature_dataset_v1.json", {
  version: "v3.0",
  datasetId: "organic-acid-literature-dataset-v1",
  generatedAt: stamp,
  generator: "scripts/build-v3-0-data-foundation.mjs",
  total: literatureRecords.length,
  fullCorpusTotal: validated.records.length,
  qualityDistribution: tierCounts,
  fullCorpusDistribution: validated.distribution,
  provenanceCoverage: subsetProvenance,
  duplicateCount: validated.duplicateCount,
  note: "Tiered literature/structural records for evidence mapping, pattern discovery, and candidate ranking support. Gold/Silver/Bronze/Rejected reflect real provenance; nothing is fabricated.",
  records: literatureRecords,
})

write("benchmark_dataset_v1.json", {
  version: "v3.0",
  datasetId: "benchmark-dataset-v1",
  generatedAt: stamp,
  generator: "scripts/build-v3-0-data-foundation.mjs",
  taskType: "binary",
  summary: benchmark.summary,
  note: "Benchmark-ready structure for future LR / DT / RF. Labels are null/missing until real experimental labels exist, so benchmarkEligible stays Not Ready and no Accuracy/ROC is produced.",
  records: benchmark.records,
})

write("organic_acid_labels_v1.json", {
  version: "v3.0",
  datasetId: "organic-acid-labels-v1",
  generatedAt: stamp,
  generator: "scripts/build-v3-0-data-foundation.mjs",
  schema: {
    binary: ["promising", "not_promising"],
    multiclass: ["high", "medium", "low"],
    regression: ["yield", "selectivity", "conversion"],
  },
  labelCount: labels.filter(l => l.label != null).length,
  note: "Label framework only. No real experimental labels exist yet; all labels are null with labelStatus=missing. Algorithm scores must never be used as ground truth.",
  labels,
})

console.log("V3.0 data foundation built:")
console.log("  gold:", goldRecords.length, "| literature:", literatureRecords.length, "| benchmark:", benchmark.records.length, "| labels(non-null):", labels.filter(l => l.label != null).length)
console.log("  tier distribution:", JSON.stringify(tierCounts))
console.log("  benchmark summary:", JSON.stringify(benchmark.summary))
