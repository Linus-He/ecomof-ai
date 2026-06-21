// @ts-nocheck
// V3.9 research reports summary — derives every Research Reports section from
// live data instead of fixed prose: dataset coverage, MOF candidate, descriptor
// coverage, provenance coverage, benchmark eligibility, organic-acid validation,
// gas-sep, model risk, missing data, and Suggested Next Validation Steps. The
// next-steps list is DERIVED from low coverage / high risk thresholds, never
// hardcoded.
import { safeNumber } from "../fallback/safeNumber"
import { safePercent, safeRatio } from "../fallback/safePercent"

export const COVERAGE_THRESHOLDS = { descriptor: 0.8, provenance: 0.8, benchmarkEligible: 0.5, organicAcidEvidence: 0.6 }

export function buildResearchReportsSummary(input: any = {}) {
  const {
    globalSummary = null,
    ingestionSummary = null,
    robustness = null,
    descriptorCoverage = null,
    provenanceCoverage = null,
    benchmarkEligibleCount = null,
    benchmarkTotal = null,
    organicAcidEvidenceCoverage = null,
    mofCandidateCount = null,
    gasSepRecordCount = null,
    dataVersion = "V3.9",
    generatedAt = "",
  } = input

  const ts = generatedAt || new Date().toISOString()
  const benchmarkRatio = safeRatio(benchmarkEligibleCount, benchmarkTotal, null)
  const modelRisk = robustness?.generalization?.overfittingRisk || robustness?.answers?.overfitting || "Unknown"

  const cards = {
    datasetCoverage: {
      label: "Dataset Coverage",
      totalRecords: safeNumber(globalSummary?.totalRecords ?? ingestionSummary?.totalRecords, 0),
      sourceCount: safeNumber(globalSummary?.totalSources, 0),
      dataMode: globalSummary?.dataMode || "mixed",
    },
    mofCandidate: { label: "MOF Candidate", count: safeNumber(mofCandidateCount, 0) },
    descriptorCoverage: { label: "Descriptor Coverage", value: descriptorCoverage, display: safePercent(descriptorCoverage) },
    provenanceCoverage: { label: "Provenance Coverage", value: provenanceCoverage, display: safePercent(provenanceCoverage) },
    benchmarkEligibility: { label: "Benchmark Eligibility", eligible: safeNumber(benchmarkEligibleCount, 0), total: safeNumber(benchmarkTotal, 0), ratio: benchmarkRatio, display: safePercent(benchmarkRatio) },
    organicAcidValidation: { label: "Organic Acid Validation", evidenceCoverage: organicAcidEvidenceCoverage, display: safePercent(organicAcidEvidenceCoverage) },
    gasSep: { label: "GasSep Data", recordCount: safeNumber(gasSepRecordCount, 0) },
    modelRisk: { label: "Model Risk", risk: modelRisk, reliability: safeNumber(robustness?.reliability?.score, 0), credibility: safeNumber(robustness?.credibility?.score, 0) },
  }

  // --- Suggested Next Validation Steps (derived, not hardcoded) ---
  const nextSteps: Array<{ id: string; priority: string; recommendation: string }> = []
  if (descriptorCoverage != null && safeNumber(descriptorCoverage) < COVERAGE_THRESHOLDS.descriptor) {
    nextSteps.push({ id: "descriptor", priority: "high", recommendation: `Descriptor coverage ${safePercent(descriptorCoverage)} is below ${safePercent(COVERAGE_THRESHOLDS.descriptor)}; supplement missing descriptors (surfaceArea / poreVolume / voidFraction).` })
  }
  if (benchmarkRatio != null && safeNumber(benchmarkRatio) < COVERAGE_THRESHOLDS.benchmarkEligible) {
    nextSteps.push({ id: "benchmark", priority: "high", recommendation: `Benchmark-eligible ratio ${safePercent(benchmarkRatio)} is low; complete the benchmark fields (ground truth / reaction data / field provenance / quality tier).` })
  }
  if (organicAcidEvidenceCoverage != null && safeNumber(organicAcidEvidenceCoverage) < COVERAGE_THRESHOLDS.organicAcidEvidence) {
    nextSteps.push({ id: "organic-acid-evidence", priority: "medium", recommendation: `Organic-acid evidence coverage ${safePercent(organicAcidEvidenceCoverage)} is low; add same-condition experimental data.` })
  }
  if (provenanceCoverage != null && safeNumber(provenanceCoverage) < COVERAGE_THRESHOLDS.provenance) {
    nextSteps.push({ id: "provenance", priority: "medium", recommendation: `Provenance coverage ${safePercent(provenanceCoverage)} is below ${safePercent(COVERAGE_THRESHOLDS.provenance)}; fill sourceUrl / citation / retrievedAt.` })
  }
  if (String(modelRisk).toLowerCase().includes("high")) {
    nextSteps.push({ id: "model-risk", priority: "high", recommendation: "Model risk is High Overfitting Risk; lower the weight of ML conclusions and keep only the baseline + evidence/confidence/provenance." })
  }
  if (nextSteps.length === 0) {
    nextSteps.push({ id: "ok", priority: "info", recommendation: "No threshold breaches detected; continue expanding independent experimental labels and external test coverage." })
  }

  return {
    summaryId: "research-reports-summary-v1",
    generatedAt: ts,
    dataVersion,
    dataMode: globalSummary?.dataMode || "mixed",
    cards,
    suggestedNextValidationSteps: nextSteps,
  }
}

export default buildResearchReportsSummary
