// @ts-nocheck
import { DEFAULT_PROJECT_STATUS_SUMMARY, loadProjectStatusSummary } from "./projectStatus"

export const HOME_SUMMARY_PATH = "data/home_summary.json"
export const DATA_INGESTION_SUMMARY_PATH = "data/data_ingestion/data_ingestion_summary_v3.json"

export const HOME_SUMMARY_ENDPOINTS = [
  HOME_SUMMARY_PATH,
  DATA_INGESTION_SUMMARY_PATH,
]

export const HOME_SUMMARY_RESTRICTED_PATHS = [
  "core_mof_import_v3.json",
  "qmof_import_v3.json",
  "organic_acid_literature_dataset_v3.json",
  "benchmark_dataset_v2.json",
  "public/data/experimental_labels/",
  "public/data/external_test_dataset/",
  "benchmark_report_v1.json",
  "first_real_benchmark_report_v1.json",
]

export const DEFAULT_HOME_SUMMARY = Object.freeze({
  schemaVersion: "1.0",
  totalRecords: 3020,
  coreMofRecords: 1240,
  qmofRecords: 1240,
  organicAcidLiteratureRecords: 540,
  verifiedMetadataCount: 2480,
  goldDatasetCount: 320,
  reactionDatasetCount: 520,
  experimentalLabelCount: 150,
  externalTestCount: 80,
  benchmarkEligibleCount: 230,
  currentVersion: "V3.6",
  bestModel: "Random Forest",
  accuracy: 0.725,
  rocAuc: 0.7558,
  credibilityScore: 78.87,
  credibilityGrade: "B",
  currentRisk: "High Overfitting Risk",
  benchmarkStatus: "available",
  modelValidationStatus: "ongoing",
  accuracyStatus: "held_in_validation_center",
  rocAucStatus: "held_in_validation_center",
  benchmarkBlocker: "independently_measured_experimental_labels_missing",
  notFinalRecommendation: true,
  databasePreview: true,
  lastUpdated: "2026-06-18",
  sourceFiles: [
    "public/data/home_summary.json",
    "public/data/data_ingestion/data_ingestion_summary_v3.json",
    "public/data/model_robustness_report_v1.json",
    "public/data/benchmark_dataset_v3_6.json",
    "public/data/experimental_labels/experimental_labels_v2.json",
  ],
})

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function firstNumber(...values) {
  for (const value of values) {
    if (value == null || value === "") continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }
  return ""
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value
  }
  return null
}

export function buildHomeSummary({ homeSummary, dataIngestionSummary, versionEvolution, projectStatus } = {}) {
  const home = asObject(homeSummary)
  const ingestion = asObject(dataIngestionSummary)
  const version = asObject(versionEvolution)
  const overview = asObject(version.overview)
  const status = asObject(projectStatus)

  return {
    schemaVersion: firstText(home.schemaVersion, DEFAULT_HOME_SUMMARY.schemaVersion),
    currentVersion: firstText(status.currentVersion, home.currentVersion, version.currentVersion, overview.currentVersion, DEFAULT_HOME_SUMMARY.currentVersion),
    totalRecords: firstNumber(home.totalRecords, ingestion.totalRecords, ingestion.totalRealRecords, overview.databaseSize, DEFAULT_HOME_SUMMARY.totalRecords),
    coreMofRecords: firstNumber(home.coreMofRecords, ingestion.coreCount, ingestion.stats?.coreMof?.current, DEFAULT_HOME_SUMMARY.coreMofRecords),
    qmofRecords: firstNumber(home.qmofRecords, ingestion.qmofCount, ingestion.stats?.qmof?.current, DEFAULT_HOME_SUMMARY.qmofRecords),
    organicAcidLiteratureRecords: firstNumber(
      home.organicAcidLiteratureRecords,
      ingestion.literatureCount,
      ingestion.stats?.literature?.current,
      DEFAULT_HOME_SUMMARY.organicAcidLiteratureRecords,
    ),
    verifiedMetadataCount: firstNumber(
      home.verifiedMetadataCount,
      ingestion.verifiedMetadataCount,
      ingestion.stats?.verifiedMetadata?.current,
      DEFAULT_HOME_SUMMARY.verifiedMetadataCount,
    ),
    goldDatasetCount: firstNumber(home.goldDatasetCount, ingestion.goldCount, ingestion.stats?.goldDataset?.current, DEFAULT_HOME_SUMMARY.goldDatasetCount),
    reactionDatasetCount: firstNumber(
      home.reactionDatasetCount,
      ingestion.reactionCount,
      ingestion.stats?.reactionDataset?.current,
      DEFAULT_HOME_SUMMARY.reactionDatasetCount,
    ),
    experimentalLabelCount: firstNumber(
      status.experimentalLabels,
      home.experimentalLabelCount,
      ingestion.experimentalCount,
      ingestion.originAudit?.experimental,
      DEFAULT_HOME_SUMMARY.experimentalLabelCount,
    ),
    externalTestCount: firstNumber(status.externalTest, home.externalTestCount, DEFAULT_HOME_SUMMARY.externalTestCount),
    benchmarkEligibleCount: firstNumber(status.benchmarkEligible, home.benchmarkEligibleCount, ingestion.benchmarkCount, DEFAULT_HOME_SUMMARY.benchmarkEligibleCount),
    bestModel: firstText(status.bestModel, home.bestModel, DEFAULT_HOME_SUMMARY.bestModel),
    accuracy: firstNumber(status.accuracy, home.accuracy, DEFAULT_HOME_SUMMARY.accuracy),
    rocAuc: firstNumber(status.rocAuc, home.rocAuc, DEFAULT_HOME_SUMMARY.rocAuc),
    credibilityScore: firstNumber(status.credibilityScore, home.credibilityScore, DEFAULT_HOME_SUMMARY.credibilityScore),
    credibilityGrade: firstText(status.credibilityGrade, home.credibilityGrade, DEFAULT_HOME_SUMMARY.credibilityGrade),
    currentRisk: firstText(status.currentRisk, home.currentRisk, DEFAULT_HOME_SUMMARY.currentRisk),
    benchmarkStatus: firstText(home.benchmarkStatus, DEFAULT_HOME_SUMMARY.benchmarkStatus),
    modelValidationStatus: firstText(home.modelValidationStatus, DEFAULT_HOME_SUMMARY.modelValidationStatus),
    accuracyStatus: firstText(home.accuracyStatus, DEFAULT_HOME_SUMMARY.accuracyStatus),
    rocAucStatus: firstText(home.rocAucStatus, DEFAULT_HOME_SUMMARY.rocAucStatus),
    benchmarkBlocker: firstText(home.benchmarkBlocker, DEFAULT_HOME_SUMMARY.benchmarkBlocker),
    notFinalRecommendation: firstBoolean(
      home.notFinalRecommendation,
      overview.notFinalRecommendationStatus ? overview.notFinalRecommendationStatus === "Not Final Recommendation" : undefined,
      DEFAULT_HOME_SUMMARY.notFinalRecommendation,
    ),
    databasePreview: firstBoolean(
      home.databasePreview,
      overview.databasePreviewStatus ? overview.databasePreviewStatus === "Database Preview" : undefined,
      DEFAULT_HOME_SUMMARY.databasePreview,
    ),
    lastUpdated: firstText(home.lastUpdated, ingestion.growth?.generatedAt, version.generatedAt, DEFAULT_HOME_SUMMARY.lastUpdated),
    projectStatus: Object.keys(status).length ? status : DEFAULT_PROJECT_STATUS_SUMMARY,
    sourceFiles: Array.isArray(home.sourceFiles) && home.sourceFiles.length ? [...new Set([...home.sourceFiles, ...DEFAULT_HOME_SUMMARY.sourceFiles])] : DEFAULT_HOME_SUMMARY.sourceFiles,
  }
}

export function formatStatus(value) {
  const text = String(value || "").trim().toLowerCase()
  if (!text || text === "pending") return "Pending"
  if (text === "not_available" || text === "not available") return "Not available"
  return text.replace(/(^|[_ -])([a-z])/g, (_, prefix, letter) => `${prefix === "_" ? " " : prefix}${letter.toUpperCase()}`)
}

export function homeSummaryUrl(path) {
  const base = typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL || "/" : "/"
  const normalizedBase = base.endsWith("/") ? base : `${base}/`
  return `${normalizedBase}${String(path).replace(/^\/+/, "")}`
}

async function fetchJson(fetcher, path) {
  const response = await fetcher(homeSummaryUrl(path))
  if (!response?.ok) return null
  return response.json()
}

export async function loadHomeSummary(fetcher = globalThis.fetch) {
  if (typeof fetcher !== "function") return DEFAULT_HOME_SUMMARY

  const [homeSummary, dataIngestionSummary, projectStatus] = await Promise.all(
    [
      ...HOME_SUMMARY_ENDPOINTS.map(path => fetchJson(fetcher, path).catch(() => null)),
      loadProjectStatusSummary(fetcher).catch(() => DEFAULT_PROJECT_STATUS_SUMMARY),
    ],
  )

  return buildHomeSummary({ homeSummary, dataIngestionSummary, projectStatus })
}

export function isRestrictedHomeSummaryFetch(path) {
  const text = String(path || "")
  return HOME_SUMMARY_RESTRICTED_PATHS.some(restrictedPath => text.includes(restrictedPath))
}
