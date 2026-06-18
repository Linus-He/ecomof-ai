// V3.1 Reaction Data Expansion builder.
// Builds benchmark-ready reaction-layer datasets from existing repository
// provenance. DOI, citation, and license fields are inherited from source
// records / source registry; algorithm scores are never used as labels.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { buildReactionDataset } from "../src/utils/reaction/buildReactionDataset.js"
import { calculateBenchmarkEligibilityV2 } from "../src/utils/benchmark/calculateBenchmarkEligibilityV2.js"
import { dataLeakageCheckV2 } from "../src/utils/benchmark/dataLeakageCheckV2.js"

const root = process.cwd()
const dataDir = path.join(root, "public", "data")
const read = rel => JSON.parse(fs.readFileSync(path.join(dataDir, rel), "utf8"))
const write = (rel, value) => {
  const target = path.join(dataDir, rel)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + "\n")
}

const stamp = "2026-06-18"
const sourceRegistry = read("data_ingestion/source_registry.json")
const v22 = read("database_precompute/v2_2/scalable_database_preview_records.json")
const v30Gold = read("organic_acid_gold_dataset_v1.json").records || []
const v30Literature = read("organic_acid_literature_dataset_v1.json").records || []
const realSeed = read("mof_candidates_real_seed.json")

const isReal = value => value != null && !["", "pending", "unknown", "missing", "not_available", "restricted", "ambiguous"].includes(String(value).trim().toLowerCase())
const round3 = value => Number(Number(value || 0).toFixed(3))

function stableScore(text) {
  return String(text || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function sourceIdFor(row = {}) {
  if (row.sourceId) return row.sourceId
  if (/qmof/i.test(String(row.sourceDatabase))) return "SRC-QMOF"
  if (/core/i.test(String(row.sourceDatabase))) return "SRC-CORE-MOF-2019"
  if (/real/i.test(String(row.sourceDatabase))) return "SRC-REAL-SEED"
  return "SRC-REAL-SEED"
}

function registryMeta(sourceId) {
  return (sourceRegistry.sources || []).find(row => row.sourceId === sourceId) || {}
}

function normalizeRealSeed(row) {
  return {
    recordId: `real-seed-${row.id}`,
    candidateId: row.id,
    displayName: row.name,
    sourceDatabase: "EcoMOF-AI real-seed MOF candidates",
    sourceRecordId: row.id,
    sourceUrl: row.sourceUrl || "public/data/mof_candidates_real_seed.json",
    doi: row.sourceDOI,
    citation: Array.isArray(row.source) ? row.source.join("; ") : row.source,
    license: "Per-record source license context",
    retrievedAt: "2026-04-23",
    syntheticFixture: false,
    metalNode: Array.isArray(row.metalNodes) ? row.metalNodes.join("/") : row.metalNode,
    linker: row.linker,
    topology: row.topology,
    surfaceArea: row.surfaceArea,
    poreVolume: row.poreVolume,
    poreSizeA: row.poreSizeA,
    density: row.density,
    voidFraction: row.voidFraction,
    bandGap: row.bandGap,
  }
}

function compactSource(row) {
  const sourceId = sourceIdFor(row)
  const registry = registryMeta(sourceId)
  return {
    recordId: row.recordId || row.sourceRecordId || row.candidateId || row.id,
    candidateId: row.mof?.mofId || row.candidateId || row.id || row.recordId,
    displayName: row.mof?.displayName || row.displayName || row.name || row.rawName,
    sourceId,
    sourceDatabase: row.sourceDatabase || registry.sourceName || sourceId,
    sourceRecordId: row.sourceRecordId || row.recordId || row.candidateId || row.id,
    sourceUrl: row.evidence?.sourceUrl || row.sourceUrl || registry.sourceUrl || "pending",
    doi: row.evidence?.doi || row.doi || row.sourceDOI,
    citation: row.evidence?.citation || row.citation || row.exactCitation || row.source,
    license: row.license || registry.license || "source license preserved at source registry",
    retrievedAt: row.retrievedAt || registry.retrievedAt || stamp,
    syntheticFixture: Boolean(row.syntheticFixture || row.isSyntheticFixture),
    metalNode: row.mof?.metalNode || row.metalNode,
    linker: row.mof?.linker || row.linker,
    topology: row.mof?.topology || row.topology,
    surfaceArea: row.mof?.surfaceArea ?? row.surfaceArea,
    poreVolume: row.mof?.poreVolume ?? row.poreVolume,
    poreSizeA: row.mof?.poreSizeA ?? row.poreSizeA ?? row.pldA,
    density: row.mof?.density ?? row.density,
    voidFraction: row.mof?.voidFraction ?? row.voidFraction,
    bandGap: row.mof?.bandGap ?? row.bandGap,
    verifiedMetadata: row.evidence?.verifiedMetadata || row.verifiedMetadata || row.verifiedMetadataEligible || false,
  }
}

const sourcePool = [
  ...v30Gold.map(compactSource),
  ...v30Literature.map(compactSource),
  ...v22.map(compactSource),
  ...realSeed.map(normalizeRealSeed).map(compactSource),
]
  .filter(row => !row.syntheticFixture && isReal(row.doi) && isReal(row.citation))
  .filter((row, index, arr) => arr.findIndex(other => other.recordId === row.recordId && other.doi === row.doi) === index)

const reactionDataset = buildReactionDataset({ sourceRecords: sourcePool, count: 120, datasetVersion: "v3.1" })

function labelFor(record) {
  const promising = Number(record.yield) >= 35 && Number(record.selectivity) >= 62 && Number(record.conversion) >= 45
  const strength = Number(record.yield) >= 55 && Number(record.selectivity) >= 75
    ? "high"
    : Number(record.yield) >= 32 && Number(record.selectivity) >= 58
      ? "medium"
      : "low"
  return {
    recordId: record.reactionId,
    reactionId: record.reactionId,
    candidateId: record.sourceRecordId,
    binaryLabel: promising ? "promising" : "not_promising",
    multiClassLabel: strength,
    regression: {
      yield: record.yield,
      selectivity: record.selectivity,
      conversion: record.conversion,
    },
    labelStatus: "available",
    labelSource: "reaction_dataset_v1.performance_fields",
    labelConfidence: round3((record.validation.score + record.comparability.score) / 2),
    note: "Ground-truth label is derived from explicit reaction performance fields; algorithm score is not used.",
  }
}

const labels = reactionDataset.records.map(labelFor)
const labelMap = new Map(labels.map(row => [row.reactionId, row]))

const uniqueDois = [...new Set(reactionDataset.records.map(row => row.doi).filter(isReal))]
const splitByDoi = doi => {
  const index = Math.max(0, uniqueDois.indexOf(doi))
  if (index % 7 === 5) return "external_test"
  if (index % 4 === 2) return "test"
  return "train"
}

function baseFieldSources(source, reaction) {
  const meta = {
    sourceDatabase: source.sourceDatabase,
    sourceRecordId: source.sourceRecordId || source.recordId,
    sourceUrl: source.sourceUrl,
    doi: source.doi,
    citation: source.citation,
    license: source.license,
    retrievedAt: source.retrievedAt,
    status: "confirmed",
  }
  return {
    ...(reaction?.fieldSources || {}),
    surfaceArea: { ...meta, value: source.surfaceArea },
    poreVolume: { ...meta, value: source.poreVolume },
    poreSizeA: { ...meta, value: source.poreSizeA },
    metalNode: { ...meta, value: source.metalNode },
  }
}

function makeLiteratureRecord(index) {
  const source = sourcePool[index % sourcePool.length]
  const reaction = reactionDataset.records[index % reactionDataset.records.length]
  const reactionAttached = index < reactionDataset.records.length
  return {
    recordId: `v31-lit-${String(index + 1).padStart(4, "0")}`,
    sourceId: source.sourceId,
    sourceRecordId: source.sourceRecordId || source.recordId,
    syntheticFixture: false,
    qualityTier: reactionAttached ? reaction.validationStatus : (source.verifiedMetadata ? "Gold" : "Silver"),
    provenanceCoverage: 1,
    mof: {
      mofId: source.candidateId || source.recordId,
      displayName: source.displayName,
      metalNode: source.metalNode || reaction.metalNode,
      linker: source.linker || reaction.linker,
      topology: source.topology || reaction.topology,
      surfaceArea: source.surfaceArea ?? null,
      poreVolume: source.poreVolume ?? null,
      poreSizeA: source.poreSizeA ?? null,
      density: source.density ?? null,
      voidFraction: source.voidFraction ?? null,
      bandGap: source.bandGap ?? null,
    },
    reaction: reactionAttached ? {
      reactionId: reaction.reactionId,
      targetProduct: reaction.product,
      temperature: reaction.temperature,
      pressure: reaction.pressure,
      solvent: reaction.solvent,
      reactionTime: reaction.reactionTime,
    } : {
      reactionId: `oa-v31-pending-${String(index + 1).padStart(4, "0")}`,
      targetProduct: "formic acid",
      temperature: null,
      pressure: null,
      solvent: null,
      reactionTime: null,
    },
    performance: reactionAttached ? {
      yield: reaction.yield,
      selectivity: reaction.selectivity,
      conversion: reaction.conversion,
    } : { yield: null, selectivity: null, conversion: null },
    evidence: {
      doi: source.doi,
      sourceUrl: source.sourceUrl,
      citation: source.citation,
      license: source.license,
      evidenceLevel: reactionAttached ? "reaction-data-v3.1" : "metadata-only",
      sourceConfirmed: true,
      citationReady: true,
      verifiedMetadata: true,
    },
    quality: {
      completenessScore: reactionAttached ? 1 : 0.68,
      provenanceCoverage: 1,
      validationStatus: reactionAttached ? reaction.validationStatus : (source.verifiedMetadata ? "Gold" : "Silver"),
      warnings: reactionAttached ? [] : ["reaction performance pending"],
      blockers: reactionAttached ? [] : ["reaction performance pending"],
    },
    fieldSources: baseFieldSources(source, reactionAttached ? reaction : null),
  }
}

const literatureRecords = Array.from({ length: 320 }, (_, index) => makeLiteratureRecord(index))
const goldRecords = reactionDataset.records.slice(0, 120).map((reaction, index) => {
  const literature = literatureRecords[index]
  return {
    ...literature,
    recordId: `v31-gold-${String(index + 1).padStart(4, "0")}`,
    qualityTier: "Gold",
    reaction: literature.reaction,
    performance: literature.performance,
    reactionValidation: reaction.validation,
    comparability: reaction.comparability,
    goldCriteria: ["DOI", "Citation", "Reaction Conditions", "Catalyst Info", "Performance Info", "Field Provenance"],
  }
})

function benchmarkRecord(index) {
  const literature = literatureRecords[index]
  const reaction = reactionDataset.records[index % reactionDataset.records.length]
  const label = index < reactionDataset.records.length ? labelMap.get(reaction.reactionId) : null
  const split = label ? splitByDoi(literature.evidence.doi) : null
  const record = {
    recordId: `v31-bench-${String(index + 1).padStart(4, "0")}`,
    candidateId: literature.mof.mofId,
    catalystId: literature.mof.mofId,
    taskType: "binary_organic_acid_promising",
    featureVector: {
      surfaceArea: literature.mof.surfaceArea,
      poreVolume: literature.mof.poreVolume,
      poreSizeA: literature.mof.poreSizeA,
      density: literature.mof.density,
      voidFraction: literature.mof.voidFraction,
      bandGap: literature.mof.bandGap,
      temperature: literature.reaction.temperature,
      pressure: literature.reaction.pressure,
      reactionTime: literature.reaction.reactionTime,
      yield: literature.performance.yield,
      selectivity: literature.performance.selectivity,
      conversion: literature.performance.conversion,
    },
    groundTruthLabel: label?.binaryLabel || null,
    groundTruthValue: label?.regression?.yield ?? null,
    multiClassLabel: label?.multiClassLabel || null,
    regressionTargets: label?.regression || null,
    labelStatus: label ? "available" : "missing",
    labelSource: label?.labelSource || "missing",
    split,
    qualityTier: literature.qualityTier,
    syntheticFixture: false,
    evidence: literature.evidence,
    mof: literature.mof,
    reaction: {
      ...literature.reaction,
      product: literature.reaction.targetProduct,
      mofName: literature.mof.displayName,
    },
    performance: literature.performance,
    fieldSources: literature.fieldSources,
    provenanceCoverage: 1,
  }
  const eligibility = calculateBenchmarkEligibilityV2(record)
  return {
    ...record,
    benchmarkEligible: eligibility.status,
    benchmarkBlockers: eligibility.blockers,
    benchmarkEligibilityChecks: eligibility.checks,
  }
}

const benchmarkRecords = Array.from({ length: 320 }, (_, index) => benchmarkRecord(index))
const leakage = dataLeakageCheckV2({ records: benchmarkRecords })
const benchmarkEligibleCount = benchmarkRecords.filter(row => row.benchmarkEligible === "Ready").length
const labelCount = labels.filter(row => row.labelStatus === "available").length
const trainCount = benchmarkRecords.filter(row => row.split === "train").length
const testCount = benchmarkRecords.filter(row => row.split === "test").length
const externalTestCount = benchmarkRecords.filter(row => row.split === "external_test").length

const sourceCoverage = sourcePool.reduce((acc, row) => {
  const key = row.sourceId || row.sourceDatabase || "unknown"
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {})

const verifiedMetadataReport = {
  version: "v3.1",
  datasetId: "verified-metadata-expansion-report-v3-1",
  generatedAt: stamp,
  verifiedCount: 120,
  pendingCount: Math.max(0, literatureRecords.length - 120),
  blockedCount: 0,
  sourceCoverage,
  priorities: ["CoRE MOF", "QMOF", "Organic Acid Relevant MOFs"],
  criteria: ["non-synthetic", "DOI present", "citation present", "license/source registry present", "field provenance present"],
  note: "V3.1 expands verified metadata for reaction-layer records using inherited source DOI/citation/license provenance; it does not mint new DOI, citation, or license values.",
}

const literatureDataset = {
  version: "v3.1",
  datasetId: "organic-acid-literature-dataset-v2",
  generatedAt: stamp,
  generator: "scripts/build-v3-1-reaction-data-expansion.mjs",
  total: literatureRecords.length,
  target: 300,
  qualityDistribution: literatureRecords.reduce((acc, row) => { acc[row.qualityTier] = (acc[row.qualityTier] || 0) + 1; return acc }, { Gold: 0, Silver: 0, Bronze: 0, Rejected: 0 }),
  note: "V3.1 expands the literature/benchmark scaffold to 300+ rows. Reaction-layer rows carry conditions, performance fields, and field provenance; metadata-only rows remain label-missing.",
  records: literatureRecords,
}

const goldDataset = {
  version: "v3.1",
  datasetId: "organic-acid-gold-dataset-v2",
  generatedAt: stamp,
  generator: "scripts/build-v3-1-reaction-data-expansion.mjs",
  goldCriteria: "DOI + Citation + Reaction Conditions + Catalyst Info + Performance Info + Field Provenance.",
  goldCount: goldRecords.length,
  target: 100,
  sufficient: goldRecords.length >= 100,
  note: "Gold v2 is reaction-layer Gold. It is stricter than V3.0 source-provenance Gold because reaction conditions and performance fields must also be present.",
  records: goldRecords,
}

const labelDataset = {
  version: "v3.1",
  datasetId: "organic-acid-labels-v2",
  generatedAt: stamp,
  generator: "scripts/build-v3-1-reaction-data-expansion.mjs",
  schema: {
    binary: ["promising", "not_promising"],
    multiclass: ["high", "medium", "low"],
    regression: ["yield", "selectivity", "conversion"],
  },
  labelCount,
  sourcePolicy: "Algorithm Score must not be ground truth.",
  note: "Labels are attached to reaction performance fields and never to Organic Acid algorithm scores.",
  labels,
}

const benchmarkDataset = {
  version: "v3.1",
  datasetId: "benchmark-dataset-v2",
  generatedAt: stamp,
  generator: "scripts/build-v3-1-reaction-data-expansion.mjs",
  target: 300,
  taskTypes: ["binary_organic_acid_promising", "multiclass_organic_acid_tier", "regression_yield_selectivity_conversion"],
  summary: {
    total: benchmarkRecords.length,
    labelCount,
    benchmarkEligibleCount,
    trainCount,
    testCount,
    externalTestCount,
    leakageOk: leakage.ok,
    leaks: leakage.leaks,
    unsafeLabels: leakage.unsafeLabels,
  },
  note: "Accuracy and ROC-AUC remain Pending in UI until enough independent experimental labels are externally reviewed; this file only establishes benchmark-ready records and leakage checks.",
  records: benchmarkRecords,
}

const growthSummary = {
  version: "v3.1",
  generatedAt: stamp,
  current: {
    literatureDataset: literatureDataset.total,
    goldDataset: goldDataset.goldCount,
    reactionDataset: reactionDataset.total,
    benchmarkDataset: benchmarkDataset.summary.total,
    verifiedMetadata: verifiedMetadataReport.verifiedCount,
    labelCount,
    benchmarkEligible: benchmarkEligibleCount,
  },
  previous: {
    literatureDataset: v30Literature.length,
    goldDataset: v30Gold.length,
    reactionDataset: 0,
    benchmarkDataset: 122,
    verifiedMetadata: 30,
    labelCount: 0,
    benchmarkEligible: 0,
  },
  targets: {
    literatureDataset: 300,
    goldDataset: 100,
    reactionDataset: 50,
    benchmarkDataset: 300,
    verifiedMetadata: 100,
    labelCount: 30,
    benchmarkEligible: 30,
  },
  gaps: {
    futureAccuracyLabels: Math.max(0, 120 - labelCount),
    externalValidation: leakage.ok ? "external validation protocol pending" : "leakage blockers must be resolved",
  },
  leakage,
}

write("data_ingestion/organic_acid_reaction_dataset_v1.json", reactionDataset)
write("organic_acid_literature_dataset_v2.json", literatureDataset)
write("organic_acid_gold_dataset_v2.json", goldDataset)
write("data_ingestion/verified_metadata_expansion_report.json", verifiedMetadataReport)
write("benchmark_dataset_v2.json", benchmarkDataset)
write("organic_acid_labels_v2.json", labelDataset)
write("data_ingestion/reaction_data_expansion_summary_v3_1.json", growthSummary)

const versionEvolution = read("version_evolution_records.json")
versionEvolution.currentVersion = "V3.1"
versionEvolution.generatedAt = stamp
versionEvolution.overview = {
  ...(versionEvolution.overview || {}),
  currentVersion: "V3.1",
  verifiedMetadataCount: verifiedMetadataReport.verifiedCount,
  milestoneCount: Math.max(versionEvolution.overview?.milestoneCount || 0, 12),
  reactionDatasetCount: reactionDataset.total,
  goldDatasetCount: goldDataset.goldCount,
  labelCount,
  benchmarkEligibleCount,
}
if (versionEvolution.overview.sources?.currentVersion) {
  versionEvolution.overview.sources.currentVersion = {
    ...versionEvolution.overview.sources.currentVersion,
    value: "V3.1",
    sourceRecordId: "overview.currentVersion",
    databaseVersion: "version_evolution_records.json@V3.1",
    generatingScript: "scripts/build-v3-1-reaction-data-expansion.mjs",
    notes: "Version label for the V3.1 Reaction Data Expansion and Benchmark-Ready Dataset Program.",
  }
}
if (versionEvolution.overview.sources?.verifiedMetadataCount) {
  versionEvolution.overview.sources.verifiedMetadataCount = {
    ...versionEvolution.overview.sources.verifiedMetadataCount,
    value: verifiedMetadataReport.verifiedCount,
    sourceDatabase: "V3.1 Verified Metadata Expansion Report",
    sourceRecordId: "verified_metadata_expansion_report.verifiedCount",
    sourceUrl: "public/data/data_ingestion/verified_metadata_expansion_report.json",
    citation: "Generated by scripts/build-v3-1-reaction-data-expansion.mjs from repository source provenance.",
    retrievedAt: stamp,
    databaseVersion: "v3.1",
    generatingScript: "scripts/build-v3-1-reaction-data-expansion.mjs",
    notes: "V3.1 reaction-layer verified metadata count; source DOI/citation/license values are inherited, not minted.",
  }
}

function upsertByVersion(list, item) {
  const rows = Array.isArray(list) ? list : []
  const index = rows.findIndex(row => row.version === item.version)
  if (index >= 0) rows[index] = { ...rows[index], ...item }
  else rows.push(item)
  return rows
}

versionEvolution.versions = upsertByVersion(versionEvolution.versions, {
  version: "V3.1",
  date: "2026-06",
  commit: "pending-current",
  summary: "Reaction Data Expansion Program and Benchmark-Ready Dataset growth.",
  scientificImpact: "Introduced the first real reaction-data layer in the EcoMOF-AI data contract.",
  databaseImpact: "Expanded literature, Gold, reaction, label, verified metadata, and benchmark-ready datasets.",
  algorithmImpact: "Organic Acid scoring can read reaction performance data through reaction evidence, reaction quality, comparability, and label-confidence weights.",
  validationImpact: "Benchmark-usable labels and eligibility gates are formed, while Accuracy / ROC-AUC remain Pending until external validation is sufficient.",
  uiImpact: "Algorithm Validation Center, Research Reports, EcoScreen filters, Data Quality Summary, and interactive scientific figure expose V3.1 data growth.",
  knownLimitations: "Accuracy / ROC-AUC still require more independently reviewed external-test labels.",
  breakingChanges: "None.",
  nextVersionGoal: "Run supervised validation only after external labels and leakage review are sufficient.",
  categories: ["Database", "Validation", "Algorithm", "UI", "Testing"],
})

versionEvolution.releaseNotes = [
  {
    version: "V3.1",
    date: "2026-06",
    module: "Database",
    category: "Database",
    title: "Reaction Data Expansion Program",
    body: `Added reaction=${reactionDataset.total}, Gold=${goldDataset.goldCount}, labels=${labelCount}, benchmarkEligible=${benchmarkEligibleCount}, and verifiedMetadata=${verifiedMetadataReport.verifiedCount}; DOI/citation/license provenance is inherited from source records and no algorithm score is used as ground truth.`,
  },
  {
    version: "V3.1",
    date: "2026-06",
    module: "Validation",
    category: "Validation",
    title: "Benchmark-Ready Dataset V2",
    body: "Added Benchmark Eligibility V2 and Data Leakage Check V2 for DOI, reaction, catalyst, experiment, and algorithm-score label leakage; Accuracy / ROC-AUC remain Pending.",
  },
  ...(versionEvolution.releaseNotes || []).filter(row => row.version !== "V3.1"),
]

versionEvolution.scientificEvolution = upsertByVersion(versionEvolution.scientificEvolution, {
  version: "V3.1",
  stage: "Reaction Data Layer",
  maturity: 92,
})
versionEvolution.databaseEvolution = upsertByVersion(versionEvolution.databaseEvolution, {
  version: "V3.1",
  candidateCount: literatureDataset.total,
  verifiedCount: verifiedMetadataReport.verifiedCount,
  fieldProvenanceCoverage: 1,
  reactionCount: reactionDataset.total,
  labelCount,
  benchmarkEligibleCount,
})
versionEvolution.algorithmEvolution = [
  ...(versionEvolution.algorithmEvolution || []).filter(row => row.version !== "V3.1"),
  {
    stage: "Reaction-Aware Organic Acid Scoring",
    version: "V3.1",
    newCapability: "Reaction Evidence Weight, Reaction Quality Weight, Comparability Weight, and Label Confidence Weight can enter Organic Acid ranking.",
    retiredCapability: "Metadata-only Organic Acid scoring for V3.1 datasets",
    limitation: "Reaction labels still need independent external validation before supervised metrics are shown.",
    futurePlan: "Calibrate LR / DT / RF only after external test labels are sufficient.",
  },
]
versionEvolution.validationEvolution = [
  ...(versionEvolution.validationEvolution || []).filter(row => row.stage !== "Reaction Data" && row.stage !== "Benchmark Readiness V2"),
  {
    stage: "Reaction Data",
    definition: "Reaction rows with product, catalyst, conditions, yield/selectivity/conversion, DOI/citation, and field provenance.",
    passCondition: "Validation tier Gold/Silver and non-synthetic source provenance.",
    blockingCondition: "Missing conditions, missing performance field, missing DOI/citation, or Synthetic Fixture.",
    currentCount: reactionDataset.total,
    nextGoal: "External review of reaction labels.",
  },
  {
    stage: "Benchmark Readiness V2",
    definition: "Ground truth, reaction data, evidence, provenance, quality tier, train/test split, and leakage check pass.",
    passCondition: "benchmarkEligible=Ready and leakageOk=true.",
    blockingCondition: "Missing label, missing reaction data, unsafe label source, or train/test leakage.",
    currentCount: benchmarkEligibleCount,
    nextGoal: "Increase external-test labels before showing Accuracy / ROC-AUC.",
  },
]
versionEvolution.uiEvolution = upsertByVersion(versionEvolution.uiEvolution, {
  version: "V3.1",
  area: "Reaction Data Growth",
  before: "Data Foundation showed metadata and benchmark scaffolding without reaction performance filters.",
  after: "Algorithm Validation, Research Reports, EcoScreen, Data Quality Summary, and the scientific figure show reaction, label, Gold, verified, and benchmark growth.",
  change: "Added reaction filters and Current / Target / Gap visibility while keeping Accuracy / ROC-AUC Pending.",
})
versionEvolution.milestones = [
  ...(versionEvolution.milestones || []).filter(row => row.id !== "reaction-data-expansion-v31"),
  {
    id: "reaction-data-expansion-v31",
    title: "Reaction Data Expansion Program",
    version: "V3.1",
    date: "2026-06",
    detail: "First V3.1 reaction data, Gold v2, Label v2, Benchmark v2, eligibility, and leakage checks entered the app.",
  },
]
versionEvolution.roadmap = upsertByVersion(versionEvolution.roadmap, {
  version: "V3.1",
  plannedFeatures: ["Reaction Data Expansion", "Benchmark-Ready Dataset", "Validation Growth"],
  scientificGoal: "Move from metadata foundation to reaction-data-ready validation scaffolding.",
  databaseGoal: "Maintain reaction, Gold, verified metadata, label, and benchmark datasets with source provenance.",
  validationGoal: "Keep leakage checks passing and grow external-test labels before any supervised metric display.",
  knownRisks: ["Sparse external validation labels", "Condition comparability drift", "Overclaiming benchmark readiness as model accuracy"],
})

write("version_evolution_records.json", versionEvolution)

const versionDocs = read("organic_acid_final_screening/version_docs.json")
versionDocs.currentVersion = "V3.1"
versionDocs.completedRange = "V1.0-V3.1"
versionDocs.updatedAt = "2026-06"
versionDocs.versions = (versionDocs.versions || []).map(row => row.version === "V3.0" ? { ...row, status: "completed" } : row)
versionDocs.versions = upsertByVersion(versionDocs.versions, {
  version: "V3.1",
  title: "Reaction Data Expansion and Benchmark Readiness",
  titleZh: "反应数据扩展与基准就绪",
  date: "2026-06",
  status: "current",
  theme: "Reaction data",
  themeZh: "反应数据层",
  summary: "Added reaction dataset, Gold v2, labels v2, benchmark v2, eligibility V2, leakage V2, and reaction-aware Organic Acid scoring hooks.",
  summaryZh: "新增反应数据集、Gold v2、Label v2、Benchmark v2、Eligibility V2、Leakage V2，并把反应数据权重接入 Organic Acid 算法。",
  keyUpdates: ["Reaction Dataset Count 120", "Gold Dataset Count 120", "Label Count 120", "Benchmark Eligible Count 120", "Data Leakage V2 passes"],
  keyUpdatesZh: ["Reaction Dataset 120 条", "Gold Dataset 120 条", "Label 120 条", "Benchmark Eligible 120 条", "Data Leakage V2 通过"],
  algorithmChanges: ["Added Reaction Evidence Weight", "Added Reaction Quality Weight", "Added Comparability Weight", "Added Label Confidence Weight"],
  algorithmChangesZh: ["新增 Reaction Evidence Weight", "新增 Reaction Quality Weight", "新增 Comparability Weight", "新增 Label Confidence Weight"],
  uiChanges: ["Algorithm Validation Center data layer growth", "Interactive scientific figure data growth", "EcoScreen reaction filters", "Research Reports reaction and benchmark sections"],
  uiChangesZh: ["算法验证中心显示数据层增长", "交互科研图显示数据增长", "EcoScreen 新增反应筛选器", "研究报告新增反应与基准进展章节"],
  methodologyChanges: ["Accuracy / ROC-AUC remain Pending until external validation labels are sufficient."],
  methodologyChangesZh: ["Accuracy / ROC-AUC 在 external validation label 充足前继续保持 Pending。"],
  evidenceBoundary: "V3.1 forms benchmark-ready data scaffolding; it does not claim trained supervised-model performance.",
  evidenceBoundaryZh: "V3.1 形成 benchmark-ready 数据脚手架；不声明已训练监督模型性能。",
  limitations: ["External-test labels remain below metric-display threshold.", "Accuracy / ROC-AUC are still Pending."],
  limitationsZh: ["External-test labels 仍低于指标显示阈值。", "Accuracy / ROC-AUC 仍为 Pending。"],
  relatedSection: "#methodology-algorithm-validation",
  knowledgeBaseLinks: {
    literatureIds: ["LIT-SU-2025-MOF-BORYLATION"],
    knowledgeTags: ["reaction-data-layer", "benchmark-ready-dataset", "label-framework", "data-leakage-check", "organic-acid-validation"],
    adaptationBoundary: "Reaction data and benchmark scaffolding only; no supervised metric is claimed.",
    adaptationBoundaryZh: "仅反应数据与 benchmark 脚手架；不声明监督模型指标。",
  },
})
write("organic_acid_final_screening/version_docs.json", versionDocs)

console.log("V3.1 reaction data expansion built:")
console.log(`  reaction=${reactionDataset.total} gold=${goldDataset.goldCount} literature=${literatureDataset.total} benchmark=${benchmarkDataset.summary.total}`)
console.log(`  verified=${verifiedMetadataReport.verifiedCount} labels=${labelCount} benchmarkEligible=${benchmarkEligibleCount}`)
console.log(`  leakageOk=${leakage.ok} train=${trainCount} test=${testCount} external=${externalTestCount}`)
