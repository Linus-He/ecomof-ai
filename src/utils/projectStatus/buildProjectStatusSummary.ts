// @ts-nocheck

export const PROJECT_STATUS_ENDPOINTS = Object.freeze({
  versionEvolution: "data/version_evolution_records.json",
  versionDocs: "data/organic_acid_final_screening/version_docs.json",
  dataIngestionSummary: "data/data_ingestion/data_ingestion_summary_v3.json",
  benchmarkDatasetV36: "data/benchmark_dataset_v3_6.json",
  modelRobustness: "data/model_robustness_report_v1.json",
  experimentalLabelGrowth: "data/data_ingestion/experimental_label_growth_v3_6.json",
  experimentalLabelsV2: "data/experimental_labels/experimental_labels_v2.json",
  externalTestV2: "data/external_test_dataset_v2.json",
})

export const DEFAULT_PROJECT_STATUS_SUMMARY = Object.freeze({
  currentVersion: "V3.8",
  databaseScale: 10277,
  verifiedMetadata: 9835,
  goldDataset: 0,
  experimentalLabels: 150,
  externalTest: 80,
  benchmarkEligible: 230,
  bestModel: "Random Forest",
  accuracy: 0.725,
  rocAuc: 0.7558,
  credibilityScore: 78.87,
  credibilityGrade: "B",
  currentRisk: "High Overfitting Risk",
  riskLevel: "High",
  sources: {},
})

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }
  return ""
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (value == null || value === "") continue
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function sourceFor({ value, sourceDatabase, sourceRecordId, sourceUrl, evidenceTier = "confirmed", notes = "" }) {
  return {
    value,
    sourceDatabase,
    sourceRecordId,
    sourceUrl,
    citation: "EcoMOF-AI static research data artifact.",
    license: "Project repository license context.",
    retrievedAt: "2026-06-21",
    curationStatus: evidenceTier === "pending" ? "pending" : "confirmed",
    confidence: evidenceTier === "pending" ? 0.45 : 1,
    evidenceTier,
    notes,
  }
}

function latestSeriesValue(growth: any, version: string, key: string) {
  const series = asObject(growth?.series)
  const direct = asObject(series[version])
  const directValue = firstNumber(direct[key])
  if (directValue != null) return directValue
  const rows = Object.entries(series)
    .map(([rowVersion, metrics]) => [rowVersion, firstNumber(asObject(metrics)[key])] as const)
    .filter(([, value]) => value != null)
  return rows.length ? rows[rows.length - 1][1] : null
}

function bestBenchmarkRow({ robustness, benchmarkReport, modelCredibility, bestModel }) {
  const robustnessRows = asArray(robustness?.benchmark)
  const benchmarkRows = asArray(benchmarkReport?.models)
  const leaderboardRows = asArray(benchmarkReport?.leaderboard?.rows)
  const credibilityRows = asArray(modelCredibility?.benchmark)
  return [...robustnessRows, ...leaderboardRows, ...benchmarkRows, ...credibilityRows]
    .find(row => String(row?.model || "").toLowerCase() === String(bestModel || "").toLowerCase()) || {}
}

function riskLabel(value: unknown) {
  const risk = firstText(value, DEFAULT_PROJECT_STATUS_SUMMARY.riskLevel)
  if (!risk) return DEFAULT_PROJECT_STATUS_SUMMARY.currentRisk
  return `${risk[0].toUpperCase()}${risk.slice(1)} Overfitting Risk`
}

export function buildProjectStatusSummary(input: any = {}) {
  const versionEvolution = asObject(input.versionEvolution)
  const versionDocs = asObject(input.versionDocs)
  const ingestion = asObject(input.dataIngestionSummary)
  const benchmarkReport = asObject(input.benchmarkReportV2 || input.benchmarkReport)
  const benchmarkDataset = asObject(input.benchmarkDatasetV36 || input.benchmarkDataset)
  const modelCredibility = asObject(input.modelCredibilityV2 || input.modelCredibility)
  const robustness = asObject(input.modelRobustness || input.robustness || input.modelCredibilityV2)
  const experimentalSummary = asObject(input.experimentalLabelSummary)
  const experimentalGrowth = asObject(input.experimentalLabelGrowth)
  const experimentalLabels = asObject(input.experimentalLabelsV2 || input.experimentalLabels)
  const externalTest = asObject(input.externalTestV2 || input.externalTest)

  const currentVersion = firstText(
    versionEvolution.currentVersion,
    versionEvolution.overview?.currentVersion,
    versionDocs.currentVersion,
    DEFAULT_PROJECT_STATUS_SUMMARY.currentVersion,
  )
  const bestModel = firstText(
    robustness.bestModel,
    modelCredibility.bestModel,
    benchmarkReport.answers?.bestModel,
    versionEvolution.overview?.bestModel,
    DEFAULT_PROJECT_STATUS_SUMMARY.bestModel,
  )
  const benchmarkRow = bestBenchmarkRow({ robustness, benchmarkReport, modelCredibility, bestModel })
  const credibility = asObject(robustness.credibility || modelCredibility.credibility)
  const riskLevel = firstText(robustness.generalization?.overfittingRisk, robustness.answers?.biggestStatisticalRisk, DEFAULT_PROJECT_STATUS_SUMMARY.riskLevel)

  const databaseScale = firstNumber(
    versionEvolution.overview?.databaseSize,
    ingestion.totalRecords,
    ingestion.totalRealRecords,
    DEFAULT_PROJECT_STATUS_SUMMARY.databaseScale,
  )
  const databaseScaleSource = firstNumber(versionEvolution.overview?.databaseSize) != null
    ? {
      sourceDatabase: "version_evolution_records.json",
      sourceRecordId: "overview.databaseSize",
      sourceUrl: "public/data/version_evolution_records.json",
      notes: "Database scale includes gas adsorption v2.1 records in addition to the structural and organic-acid data foundation.",
    }
    : {
      sourceDatabase: "data_ingestion_summary_v3.json",
      sourceRecordId: "totalRecords",
      sourceUrl: "public/data/data_ingestion/data_ingestion_summary_v3.json",
      notes: "",
    }
  const verifiedMetadata = firstNumber(
    ingestion.verifiedMetadataCount,
    versionEvolution.overview?.verifiedMetadataCount,
    DEFAULT_PROJECT_STATUS_SUMMARY.verifiedMetadata,
  )
  const goldDataset = firstNumber(
    ingestion.goldCount,
    ingestion.stats?.goldDataset?.current,
    versionEvolution.overview?.goldDatasetCount,
    DEFAULT_PROJECT_STATUS_SUMMARY.goldDataset,
  )
  const experimentalLabelsCount = firstNumber(
    robustness.datasetSize?.experimentalLabels,
    experimentalSummary.total,
    experimentalSummary.summary?.experimentalCount,
    latestSeriesValue(experimentalGrowth, currentVersion, "experimentalLabels"),
    experimentalLabels.total,
    experimentalLabels.summary?.experimentalCount,
    versionEvolution.overview?.labelCount,
    DEFAULT_PROJECT_STATUS_SUMMARY.experimentalLabels,
  )
  const externalTestCount = firstNumber(
    robustness.datasetSize?.externalTest,
    experimentalSummary.externalTest,
    latestSeriesValue(experimentalGrowth, currentVersion, "externalTest"),
    externalTest.total,
    asArray(externalTest.records).length,
    versionEvolution.overview?.externalTestCount,
    DEFAULT_PROJECT_STATUS_SUMMARY.externalTest,
  )
  const benchmarkEligible = firstNumber(
    benchmarkDataset.benchmarkEligibleCount,
    benchmarkDataset.total,
    benchmarkReport.benchmarkEligible,
    latestSeriesValue(experimentalGrowth, currentVersion, "benchmarkEligible"),
    versionEvolution.overview?.benchmarkEligibleCount,
    DEFAULT_PROJECT_STATUS_SUMMARY.benchmarkEligible,
  )
  const accuracy = firstNumber(benchmarkRow.accuracy, robustness.answers?.externalAccuracy, versionEvolution.overview?.accuracy, DEFAULT_PROJECT_STATUS_SUMMARY.accuracy)
  const rocAuc = firstNumber(benchmarkRow.rocAuc, benchmarkRow.roc, robustness.answers?.externalRocAuc, versionEvolution.overview?.rocAuc, DEFAULT_PROJECT_STATUS_SUMMARY.rocAuc)
  const credibilityScore = firstNumber(credibility.score, modelCredibility.credibilityScore, versionEvolution.overview?.credibilityScore, DEFAULT_PROJECT_STATUS_SUMMARY.credibilityScore)
  const credibilityGrade = firstText(credibility.grade, modelCredibility.credibilityGrade, versionEvolution.overview?.credibilityGrade, DEFAULT_PROJECT_STATUS_SUMMARY.credibilityGrade)

  return {
    currentVersion,
    databaseScale,
    verifiedMetadata,
    goldDataset,
    experimentalLabels: experimentalLabelsCount,
    externalTest: externalTestCount,
    benchmarkEligible,
    bestModel,
    accuracy,
    rocAuc,
    credibilityScore,
    credibilityGrade,
    currentRisk: riskLabel(riskLevel),
    riskLevel,
    sources: {
      currentVersion: sourceFor({
        value: currentVersion,
        sourceDatabase: "version_evolution_records.json",
        sourceRecordId: "currentVersion",
        sourceUrl: "public/data/version_evolution_records.json",
        notes: "Top-level project data-state version; not copied from stale overview text.",
      }),
      databaseScale: sourceFor({
        value: databaseScale,
        ...databaseScaleSource,
      }),
      verifiedMetadata: sourceFor({
        value: verifiedMetadata,
        sourceDatabase: "data_ingestion_summary_v3.json",
        sourceRecordId: "verifiedMetadataCount",
        sourceUrl: "public/data/data_ingestion/data_ingestion_summary_v3.json",
      }),
      goldDataset: sourceFor({
        value: goldDataset,
        sourceDatabase: "data_ingestion_summary_v3.json",
        sourceRecordId: "goldCount",
        sourceUrl: "public/data/data_ingestion/data_ingestion_summary_v3.json",
      }),
      experimentalLabels: sourceFor({
        value: experimentalLabelsCount,
        sourceDatabase: "experimental_labels_v2.json",
        sourceRecordId: "summary.experimentalCount",
        sourceUrl: "public/data/experimental_labels/experimental_labels_v2.json",
      }),
      externalTest: sourceFor({
        value: externalTestCount,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: "datasetSize.externalTest",
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      benchmarkEligible: sourceFor({
        value: benchmarkEligible,
        sourceDatabase: "benchmark_dataset_v3_6.json",
        sourceRecordId: "benchmarkEligibleCount",
        sourceUrl: "public/data/benchmark_dataset_v3_6.json",
      }),
      bestModel: sourceFor({
        value: bestModel,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: "bestModel",
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      accuracy: sourceFor({
        value: accuracy,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: `benchmark.${bestModel}.accuracy`,
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      rocAuc: sourceFor({
        value: rocAuc,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: `benchmark.${bestModel}.rocAuc`,
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      credibilityScore: sourceFor({
        value: credibilityScore,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: "credibility.score",
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      credibilityGrade: sourceFor({
        value: credibilityGrade,
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: "credibility.grade",
        sourceUrl: "public/data/model_robustness_report_v1.json",
      }),
      currentRisk: sourceFor({
        value: riskLabel(riskLevel),
        sourceDatabase: "model_robustness_report_v1.json",
        sourceRecordId: "generalization.overfittingRisk",
        sourceUrl: "public/data/model_robustness_report_v1.json",
        evidenceTier: "risk_disclosure",
      }),
    },
  }
}

export function buildProjectOverviewCards(summary: any = DEFAULT_PROJECT_STATUS_SUMMARY) {
  const resolved = { ...DEFAULT_PROJECT_STATUS_SUMMARY, ...summary, sources: { ...DEFAULT_PROJECT_STATUS_SUMMARY.sources, ...summary.sources } }
  return [
    { id: "currentVersion", label: "Current Version", value: resolved.currentVersion, source: resolved.sources.currentVersion, tone: "pass" },
    { id: "databaseScale", label: "Database Scale", value: `${resolved.databaseScale}+`, source: resolved.sources.databaseScale, tone: "info" },
    { id: "experimentalLabels", label: "Experimental Labels", value: resolved.experimentalLabels, source: resolved.sources.experimentalLabels, tone: "pass" },
    { id: "benchmarkEligible", label: "Benchmark Ready", value: resolved.benchmarkEligible, source: resolved.sources.benchmarkEligible, tone: "pass" },
    { id: "bestModel", label: "Best Model", value: resolved.bestModel, source: resolved.sources.bestModel, tone: "info" },
    { id: "credibility", label: "Credibility", value: `${resolved.credibilityScore} / Grade ${resolved.credibilityGrade}`, source: resolved.sources.credibilityScore, tone: "pass" },
    { id: "currentRisk", label: "Current Risk", value: resolved.currentRisk, source: resolved.sources.currentRisk, tone: "warn" },
  ]
}

function projectStatusUrl(path: string) {
  const base = typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL || "/" : "/"
  const normalizedBase = base.endsWith("/") ? base : `${base}/`
  return `${normalizedBase}${String(path).replace(/^\/+/, "")}`
}

async function readEndpoint(fetcher: any, path: string) {
  try {
    const response = await fetcher(projectStatusUrl(path))
    if (!response?.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function loadProjectStatusSummary(fetcher = globalThis.fetch) {
  if (typeof fetcher !== "function") return DEFAULT_PROJECT_STATUS_SUMMARY
  const entries = await Promise.all(
    Object.entries(PROJECT_STATUS_ENDPOINTS).map(async ([key, path]) => [key, await readEndpoint(fetcher, path)]),
  )
  return buildProjectStatusSummary(Object.fromEntries(entries))
}
