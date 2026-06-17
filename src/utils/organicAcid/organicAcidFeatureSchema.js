// @ts-nocheck

const SCORE_UNIT = "0-1 score"

export const ORGANIC_ACID_FEATURE_GROUPS = {
  structure: [
    "metalNode",
    "linker",
    "topology",
    "poreSizeA",
    "poreVolume",
    "surfaceArea",
    "stabilityProxy",
    "collapseRisk",
  ],
  pathway: [
    "pathwayRole",
    "formicAcidPathwayFit",
    "competingPathwayRisk",
    "CO2ActivationRelevance",
    "HTransferRelevance",
    "hydrideTransferRelevance",
  ],
  evidence: [
    "evidenceLevel",
    "literatureSupport",
    "experimentalComparability",
    "mechanismSupport",
    "sourceConfirmed",
    "citationReady",
    "verifiedMetadata",
  ],
  graph: [
    "pathwayCentrality",
    "nodeBetweenness",
    "edgeConfidence",
    "reactionStepCoverage",
    "graphConnectivity",
  ],
  dataQuality: [
    "descriptorCompleteness",
    "fieldProvenanceCoverage",
    "ambiguityWarnings",
    "missingCriticalFields",
    "syntheticFixtureFlag",
  ],
  validation: [
    "labTestability",
    "conditionCompatibility",
    "materialAvailability",
    "characterizationNeed",
    "nextExperimentFeasibility",
  ],
}

export const ORGANIC_ACID_FEATURE_SCHEMA = Object.freeze({
  metalNode: { unit: "text", weightGroup: "structureSuitabilityScore", usedInScoring: false },
  linker: { unit: "text", weightGroup: "structureSuitabilityScore", usedInScoring: false },
  topology: { unit: "text", weightGroup: "structureSuitabilityScore", usedInScoring: false },
  poreSizeA: { unit: "A", weightGroup: "structureSuitabilityScore", usedInScoring: true },
  poreVolume: { unit: "cm3/g", weightGroup: "structureSuitabilityScore", usedInScoring: true },
  surfaceArea: { unit: "m2/g", weightGroup: "structureSuitabilityScore", usedInScoring: true },
  stabilityProxy: { unit: SCORE_UNIT, weightGroup: "structureSuitabilityScore", usedInScoring: true },
  collapseRisk: { unit: SCORE_UNIT, weightGroup: "structureSuitabilityScore", usedInScoring: true },
  pathwayRole: { unit: "text", weightGroup: "pathwayFitScore", usedInScoring: false },
  formicAcidPathwayFit: { unit: SCORE_UNIT, weightGroup: "pathwayFitScore", usedInScoring: true },
  competingPathwayRisk: { unit: SCORE_UNIT, weightGroup: "pathwayFitScore", usedInScoring: true },
  CO2ActivationRelevance: { unit: SCORE_UNIT, weightGroup: "pathwayFitScore", usedInScoring: true },
  HTransferRelevance: { unit: SCORE_UNIT, weightGroup: "pathwayFitScore", usedInScoring: true },
  hydrideTransferRelevance: { unit: SCORE_UNIT, weightGroup: "pathwayFitScore", usedInScoring: true },
  evidenceLevel: { unit: "tier", weightGroup: "evidenceScore", usedInScoring: true },
  literatureSupport: { unit: SCORE_UNIT, weightGroup: "evidenceScore", usedInScoring: true },
  experimentalComparability: { unit: SCORE_UNIT, weightGroup: "evidenceScore", usedInScoring: true },
  mechanismSupport: { unit: SCORE_UNIT, weightGroup: "evidenceScore", usedInScoring: true },
  sourceConfirmed: { unit: "boolean", weightGroup: "evidenceScore", usedInScoring: true },
  citationReady: { unit: "boolean", weightGroup: "evidenceScore", usedInScoring: true },
  verifiedMetadata: { unit: "boolean", weightGroup: "evidenceScore", usedInScoring: true },
  pathwayCentrality: { unit: SCORE_UNIT, weightGroup: "graphRelevanceScore", usedInScoring: true },
  nodeBetweenness: { unit: SCORE_UNIT, weightGroup: "graphRelevanceScore", usedInScoring: true },
  edgeConfidence: { unit: SCORE_UNIT, weightGroup: "graphRelevanceScore", usedInScoring: true },
  reactionStepCoverage: { unit: SCORE_UNIT, weightGroup: "graphRelevanceScore", usedInScoring: true },
  graphConnectivity: { unit: SCORE_UNIT, weightGroup: "graphRelevanceScore", usedInScoring: true },
  descriptorCompleteness: { unit: SCORE_UNIT, weightGroup: "dataQualityScore", usedInScoring: true },
  fieldProvenanceCoverage: { unit: SCORE_UNIT, weightGroup: "dataQualityScore", usedInScoring: true },
  ambiguityWarnings: { unit: "count", weightGroup: "dataQualityScore", usedInScoring: true },
  missingCriticalFields: { unit: "count", weightGroup: "dataQualityScore", usedInScoring: true },
  syntheticFixtureFlag: { unit: "boolean", weightGroup: "dataQualityScore", usedInScoring: true },
  labTestability: { unit: SCORE_UNIT, weightGroup: "validationReadinessScore", usedInScoring: true },
  conditionCompatibility: { unit: SCORE_UNIT, weightGroup: "validationReadinessScore", usedInScoring: true },
  materialAvailability: { unit: SCORE_UNIT, weightGroup: "validationReadinessScore", usedInScoring: true },
  characterizationNeed: { unit: SCORE_UNIT, weightGroup: "validationReadinessScore", usedInScoring: true },
  nextExperimentFeasibility: { unit: SCORE_UNIT, weightGroup: "validationReadinessScore", usedInScoring: true },
})

function clamp01(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(1, Math.max(0, numeric))
}

function avg(values) {
  const valid = values.map(Number).filter(Number.isFinite)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

function fieldObjectValue(value, fallback = 0) {
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) return value.value
  return value ?? fallback
}

function tierScore(value) {
  const text = String(value || "").toLowerCase()
  if (text.includes("very low") || text.includes("rejected")) return 0.12
  if (text.includes("low")) return 0.28
  if (text.includes("review") || text.includes("pending")) return 0.42
  if (text.includes("medium-high")) return 0.72
  if (text.includes("medium")) return 0.6
  if (text.includes("eligible") || text.includes("verified") || text.includes("high")) return 0.82
  return clamp01(value)
}

function confidenceScore(value, fallback = 0.45) {
  const text = String(value || "").toLowerCase()
  if (text.includes("verified")) return 0.9
  if (text.includes("high")) return 0.78
  if (text.includes("medium")) return 0.62
  if (text.includes("low")) return 0.34
  if (text.includes("pending")) return 0.22
  const numeric = Number(value)
  return Number.isFinite(numeric) ? clamp01(numeric) : fallback
}

function sourceFor(candidate, field, fallback = {}) {
  const source = candidate?.fieldSources?.[field] || candidate?.descriptorFieldSources?.[field] || {}
  return {
    sourceType: source.sourceType || fallback.sourceType || "derived_proxy",
    sourceDatabase: source.sourceDatabase || candidate?.sourceDatabase || fallback.sourceDatabase || "Organic Acid Final Screening candidate record",
    sourceRecordId: source.sourceRecordId || candidate?.sourceRecordId || candidate?.id || "pending",
    sourceUrl: source.sourceUrl || fallback.sourceUrl || "public/data/organic_acid_final_screening/al_mof_framework_candidates.json",
    curationStatus: source.curationStatus || fallback.curationStatus || candidate?.dataStatus?.level || "demo / needs review",
    confidence: source.confidence ?? fallback.confidence ?? candidate?.waterStability?.confidence_score ?? 0.45,
    note: source.note || fallback.note || "V2.6 organic-acid algorithm input; algorithmic suggestion, requires experimental validation.",
    derivedFrom: source.derivedFrom || fallback.derivedFrom,
    normalizationMethod: source.normalizationMethod || fallback.normalizationMethod,
    expertPrior: source.expertPrior || fallback.expertPrior,
  }
}

function makeFeature(candidate, field, value, options = {}) {
  const meta = ORGANIC_ACID_FEATURE_SCHEMA[field] || {}
  const missing = value === null || value === undefined || value === ""
  return {
    value: missing ? null : value,
    unit: options.unit || meta.unit || SCORE_UNIT,
    source: options.source || "organic_acid_algorithm_v2_6",
    fieldSource: sourceFor(candidate, field, options.fieldSource),
    status: missing ? "missing" : options.status || "available",
    usedInScoring: options.usedInScoring ?? meta.usedInScoring ?? true,
    missingReason: missing ? options.missingReason || `${field} unavailable in candidate record` : options.missingReason || "",
    confidence: options.confidence ?? sourceFor(candidate, field, options.fieldSource).confidence ?? 0.45,
    weightGroup: options.weightGroup || meta.weightGroup || "dataQualityScore",
  }
}

function scoreFromDescriptors(candidate, keys) {
  return avg(keys.map(key => clamp01(fieldObjectValue(candidate?.descriptorScores?.[key]))))
}

function poreSizeFit(candidate) {
  const pld = Number(candidate?.pldA ?? candidate?.poreSizeA)
  if (!Number.isFinite(pld)) return 0.45
  return clamp01(1 - Math.abs(pld - 5.2) / 8)
}

function completeness(candidate, keys) {
  if (!keys.length) return 1
  return keys.filter(key => {
    const value = key.includes(".")
      ? key.split(".").reduce((acc, part) => acc?.[part], candidate)
      : candidate?.[key]
    return value !== undefined && value !== null && value !== ""
  }).length / keys.length
}

export function buildOrganicAcidFeatureSet(candidate = {}, schema = ORGANIC_ACID_FEATURE_SCHEMA) {
  const descriptorScores = candidate.descriptorScores || {}
  const evidenceLevel = candidate.organicAcidScore?.evidenceLevel || candidate.evidenceLevel || "pending"
  const hydrothermalStatus = candidate.hydrothermalGate?.status || "pending"
  const syntheticFixtureFlag = Boolean(
    candidate.syntheticFixtureFlag ||
    String(candidate.dataStatus?.level || "").toLowerCase().includes("demo") ||
    String(candidate.sourceDatabase || "").toLowerCase().includes("demo"),
  )
  const ambiguityWarnings = Array.isArray(candidate.ambiguityWarnings)
    ? candidate.ambiguityWarnings.length
    : candidate.ambiguityWarning || candidate.hasAmbiguity
      ? 1
      : 0
  const requiredKeys = ["sourceDatabase", "sourceRecordId", "descriptorScores.hydrothermalEvidenceStrength", "descriptorScores.collapseRisk", "descriptorScores.poreAccessibility"]
  const descriptorCompleteness = completeness(candidate, requiredKeys)
  const missingCriticalFields = requiredKeys.length - Math.round(descriptorCompleteness * requiredKeys.length)
  const baseProvenance = avg([
    candidate.sourceDatabase ? 1 : 0,
    candidate.sourceRecordId ? 1 : 0,
    Array.isArray(candidate.evidenceIds) && candidate.evidenceIds.length ? 0.8 : 0.4,
    candidate.fieldSources && Object.keys(candidate.fieldSources).length ? 0.75 : 0.35,
  ])
  const pathwayFit = avg([
    descriptorScores.c1IntermediateAccessibility,
    descriptorScores.linkerMicroenvironmentMatch,
    descriptorScores.poreAccessibility,
  ])
  const competingRisk = clamp01(1 - clamp01(descriptorScores.waterBlockingResistance ?? 0.45))
  const stabilityProxy = scoreFromDescriptors(candidate, ["hydrothermalEvidenceStrength", "thermalStability", "alOFrameworkRobustness"])
  const collapseRisk = clamp01(descriptorScores.collapseRisk ?? candidate.organicAcidScore?.collapseRisk ?? (hydrothermalStatus === "pass" ? 0.25 : 0.85))
  const literatureSupport = tierScore(evidenceLevel)
  const fieldSourceBase = {
    derivedFrom: "Organic Acid Final Screening candidate descriptors",
    normalizationMethod: "min-max / bounded proxy normalization to 0-1",
  }

  const features = {
    metalNode: makeFeature(candidate, "metalNode", (candidate.metals || ["Al"]).join("/"), { unit: "text", usedInScoring: false }),
    linker: makeFeature(candidate, "linker", candidate.linker || candidate.frameworkType || "pending", { unit: "text", usedInScoring: false }),
    topology: makeFeature(candidate, "topology", candidate.topology || candidate.frameworkType || "pending", { unit: "text", usedInScoring: false }),
    poreSizeA: makeFeature(candidate, "poreSizeA", Number(candidate.pldA ?? candidate.poreSizeA), { unit: "A", fieldSource: { ...fieldSourceBase, derivedFrom: "pldA" } }),
    poreVolume: makeFeature(candidate, "poreVolume", Number(candidate.poreVolume), { unit: "cm3/g", fieldSource: { ...fieldSourceBase, derivedFrom: "poreVolume" } }),
    surfaceArea: makeFeature(candidate, "surfaceArea", Number(candidate.surfaceArea), { unit: "m2/g", fieldSource: { ...fieldSourceBase, derivedFrom: "surfaceArea" } }),
    stabilityProxy: makeFeature(candidate, "stabilityProxy", Number(stabilityProxy.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "hydrothermalEvidenceStrength, thermalStability, alOFrameworkRobustness" } }),
    collapseRisk: makeFeature(candidate, "collapseRisk", Number(collapseRisk.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "descriptorScores.collapseRisk / hydrothermal gate" } }),
    pathwayRole: makeFeature(candidate, "pathwayRole", hydrothermalStatus === "pass" ? "formic-acid pathway scaffold" : "data review / risk-gated scaffold", { unit: "text", usedInScoring: false }),
    formicAcidPathwayFit: makeFeature(candidate, "formicAcidPathwayFit", Number(pathwayFit.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "c1IntermediateAccessibility, linkerMicroenvironmentMatch, poreAccessibility" } }),
    competingPathwayRisk: makeFeature(candidate, "competingPathwayRisk", Number(competingRisk.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "1 - waterBlockingResistance" } }),
    CO2ActivationRelevance: makeFeature(candidate, "CO2ActivationRelevance", Number(avg([descriptorScores.c1IntermediateAccessibility, descriptorScores.poreAccessibility]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "C1 intermediate accessibility and pore accessibility" } }),
    HTransferRelevance: makeFeature(candidate, "HTransferRelevance", Number(avg([descriptorScores.linkerMicroenvironmentMatch, descriptorScores.waterBlockingResistance]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "linker microenvironment and water-blocking resistance" } }),
    hydrideTransferRelevance: makeFeature(candidate, "hydrideTransferRelevance", Number(avg([descriptorScores.c1IntermediateAccessibility, descriptorScores.evidenceConfidence]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "C1 accessibility and evidence confidence" } }),
    evidenceLevel: makeFeature(candidate, "evidenceLevel", evidenceLevel, { unit: "tier", fieldSource: { ...fieldSourceBase, derivedFrom: "organicAcidScore.evidenceLevel" } }),
    literatureSupport: makeFeature(candidate, "literatureSupport", Number(literatureSupport.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "evidence level and evidence ids" } }),
    experimentalComparability: makeFeature(candidate, "experimentalComparability", hydrothermalStatus === "pass" ? 0.68 : hydrothermalStatus === "needs_review" ? 0.42 : 0.18, { fieldSource: { ...fieldSourceBase, derivedFrom: "hydrothermal gate status" } }),
    mechanismSupport: makeFeature(candidate, "mechanismSupport", Number(avg([descriptorScores.evidenceConfidence, descriptorScores.linkerMicroenvironmentMatch]).toFixed(3)), { fieldSource: { ...fieldSourceBase, expertPrior: "mechanism support remains a white-box prior, not black-box ML" } }),
    sourceConfirmed: makeFeature(candidate, "sourceConfirmed", Boolean(candidate.sourceConfirmed || candidate.sourceDatabase), { unit: "boolean" }),
    citationReady: makeFeature(candidate, "citationReady", Boolean(candidate.citationReady || candidate.citation), { unit: "boolean" }),
    verifiedMetadata: makeFeature(candidate, "verifiedMetadata", Boolean(candidate.verifiedMetadata), { unit: "boolean" }),
    pathwayCentrality: makeFeature(candidate, "pathwayCentrality", Number(avg([pathwayFit, descriptorScores.poreAccessibility]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "pathway fit and pore accessibility" } }),
    nodeBetweenness: makeFeature(candidate, "nodeBetweenness", Number(avg([descriptorScores.alOFrameworkRobustness, descriptorScores.c1IntermediateAccessibility]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "Al-O robustness and C1 accessibility" } }),
    edgeConfidence: makeFeature(candidate, "edgeConfidence", Number(avg([descriptorScores.evidenceConfidence, literatureSupport]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "evidence confidence and literature support" } }),
    reactionStepCoverage: makeFeature(candidate, "reactionStepCoverage", Number(avg([descriptorScores.c1IntermediateAccessibility, descriptorScores.linkerMicroenvironmentMatch, baseProvenance]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "C1 accessibility, linker match, provenance coverage" } }),
    graphConnectivity: makeFeature(candidate, "graphConnectivity", Number(avg([pathwayFit, baseProvenance]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "pathway fit and provenance coverage" } }),
    descriptorCompleteness: makeFeature(candidate, "descriptorCompleteness", Number(descriptorCompleteness.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "required descriptor presence" } }),
    fieldProvenanceCoverage: makeFeature(candidate, "fieldProvenanceCoverage", Number(baseProvenance.toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "source id, evidence ids, and fieldSources" } }),
    ambiguityWarnings: makeFeature(candidate, "ambiguityWarnings", ambiguityWarnings, { unit: "count" }),
    missingCriticalFields: makeFeature(candidate, "missingCriticalFields", missingCriticalFields, { unit: "count", missingReason: missingCriticalFields ? "One or more required V2.6 fields are missing." : "" }),
    syntheticFixtureFlag: makeFeature(candidate, "syntheticFixtureFlag", syntheticFixtureFlag, { unit: "boolean" }),
    labTestability: makeFeature(candidate, "labTestability", hydrothermalStatus === "pass" ? 0.72 : 0.32, { fieldSource: { ...fieldSourceBase, derivedFrom: "hydrothermal gate and validation roadmap" } }),
    conditionCompatibility: makeFeature(candidate, "conditionCompatibility", Number(avg([stabilityProxy, 1 - collapseRisk]).toFixed(3)), { fieldSource: { ...fieldSourceBase, derivedFrom: "stability proxy and collapse risk" } }),
    materialAvailability: makeFeature(candidate, "materialAvailability", syntheticFixtureFlag ? 0.42 : 0.68, { fieldSource: { ...fieldSourceBase, derivedFrom: "data status and source type" } }),
    characterizationNeed: makeFeature(candidate, "characterizationNeed", hydrothermalStatus === "pass" ? 0.45 : 0.8, { fieldSource: { ...fieldSourceBase, derivedFrom: "hydrothermal gate status" } }),
    nextExperimentFeasibility: makeFeature(candidate, "nextExperimentFeasibility", hydrothermalStatus === "pass" ? 0.74 : 0.38, { fieldSource: { ...fieldSourceBase, derivedFrom: "validation roadmap feasibility" } }),
  }

  return Object.fromEntries(Object.entries(features).filter(([key]) => schema[key]))
}

export function flattenOrganicAcidFeatureSources(features = {}) {
  return Object.fromEntries(Object.entries(features).map(([field, feature]) => [field, {
    ...(feature.fieldSource || {}),
    value: feature.value,
    unit: feature.unit,
    status: feature.status,
    scoringEligible: Boolean(feature.usedInScoring),
    missingReason: feature.missingReason,
    weightGroup: feature.weightGroup,
  }]))
}

export function getFeatureNumericValue(features = {}, field, fallback = 0) {
  const value = features[field]?.value
  if (typeof value === "boolean") return value ? 1 : 0
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function getFeatureScore(features = {}, field, fallback = 0) {
  if (field === "evidenceLevel") return tierScore(features[field]?.value)
  return clamp01(getFeatureNumericValue(features, field, fallback))
}
