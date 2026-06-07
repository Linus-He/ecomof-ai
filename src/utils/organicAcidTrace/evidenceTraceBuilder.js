// @ts-nocheck
import { displayTraceValue, numericTraceValue, uniqueStrings } from "./traceRecordBuilder"

function sourceForField(record = {}, field = "") {
  const fieldSource = record.fieldSources?.[field] || {}
  const value = field.split(".").reduce((acc, key) => acc?.[key], record)
  return {
    value: displayTraceValue(value, displayTraceValue(record[field])),
    sourceType: displayTraceValue(fieldSource.sourceType || fieldSource.sourceBasis || record.sourceBasis || record.dataModeLabel || "pending_provenance"),
    sourceDatabase: displayTraceValue(fieldSource.sourceDatabase || record.sourceDatabase || "Pending provenance"),
    sourceRecordId: displayTraceValue(fieldSource.sourceRecordId || record.sourceRecordId || record.id || record.metal),
    curationStatus: displayTraceValue(fieldSource.curationStatus || record.dataStatus?.label || record.dataQualityGate?.status || "demo / needs validation"),
    doiStatus: displayTraceValue(fieldSource.doi || fieldSource.sourceDoi || record.sourceDoi ? "DOI available" : "DOI pending"),
    note: displayTraceValue(fieldSource.note || record.competitiveNote || "Field remains evidence-bound."),
  }
}

function descriptorSource(record = {}, key = "") {
  const field = record[key] || {}
  return {
    value: numericTraceValue(field.value),
    sourceType: displayTraceValue(field.sourceBasis || field.basis || "pending_provenance"),
    sourceDatabase: "Organic Acid Final Screening metal matrix",
    sourceRecordId: displayTraceValue(`OA-METAL-${record.metal}-${key}`),
    curationStatus: displayTraceValue(record.dataStatus?.label || "demo / needs validation"),
    doiStatus: field.sourceDoi || field.doi ? "DOI available" : "DOI pending",
    note: displayTraceValue(field.note || field.notes || "Descriptor evidence remains proxy-level unless verified."),
    evidenceIds: uniqueStrings(field.evidenceIds),
  }
}

export function buildEvidenceTraceRecords(screeningResult = {}) {
  const selected = screeningResult.selectedFramework || {}
  const moSource = screeningResult.moRecommendation?.source || {}
  const frameworkFields = [
    "sourceDatabase",
    "sourceRecordId",
    "waterStability.max_tested_temp_C",
    "waterStability.post_treatment_PXRD_retained",
    "organicAcidScore.oacs",
    "organicAcidScore.collapseRisk",
  ].map(field => {
    const source = sourceForField(selected, field)
    return {
      id: `evidence-framework-${field.replaceAll(".", "-")}`,
      targetType: "framework",
      targetId: displayTraceValue(selected.id || selected.sourceRecordId),
      field,
      value: source.value,
      evidenceIds: uniqueStrings([
        selected.evidenceIds,
        selected.organicAcidScore?.fieldEvidenceIds?.[field],
        selected.descriptorScoresEvidenceIds?.[field],
        selected.hydrothermalGate?.evidenceIds,
      ]),
      ...source,
    }
  })

  const metalFields = [
    "co2ActivationPotential",
    "redoxAdaptability",
    "lewisAcidContribution",
    "oxoAffinity",
    "formateAffinityProxy",
    "hydrothermalRisk",
    "leachingRisk",
    "aggregationRisk",
  ].map(field => {
    const source = descriptorSource(moSource, field)
    return {
      id: `evidence-metal-mo-${field}`,
      targetType: "metal",
      targetId: "Mo",
      field,
      evidenceIds: source.evidenceIds,
      ...source,
    }
  })

  const runEvidence = (screeningResult.evidenceRecords || []).slice(0, 12).map(record => ({
    id: displayTraceValue(record.id),
    targetType: "run",
    targetId: displayTraceValue(record.targetId || record.targetModule || "organic-acid-final"),
    field: displayTraceValue(record.field || record.descriptor || record.targetModule),
    value: displayTraceValue(record.evidenceLevel || record.evidenceRole || record.status),
    evidenceIds: [displayTraceValue(record.id)],
    sourceType: displayTraceValue(record.evidenceRole || record.sourceType || "demo_proxy"),
    sourceDatabase: displayTraceValue(record.sourceDatabase || "Organic Acid evidence records"),
    sourceRecordId: displayTraceValue(record.sourceRecordId || record.id),
    curationStatus: displayTraceValue(record.status || "pending verification"),
    doiStatus: record.sourceDoi ? "DOI available" : "DOI pending",
    note: displayTraceValue(record.note || record.description || "Evidence record remains boundary-labeled."),
  }))

  return [...frameworkFields, ...metalFields, ...runEvidence]
}

