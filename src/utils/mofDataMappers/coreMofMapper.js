// @ts-nocheck

const clamp01 = value => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(1, number))
}

const normalize = (value, min, max) => {
  const number = Number(value)
  if (!Number.isFinite(number) || max === min) return 0
  return clamp01((number - min) / (max - min))
}

const first = value => Array.isArray(value) ? value[0] : value

const finiteOrNull = value => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const finiteOr = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const boolOrNull = value => {
  if (typeof value === "boolean") return value
  return null
}

const confidenceValue = value => {
  if (typeof value === "number") return clamp01(value)
  const text = String(value || "").toLowerCase()
  if (text.includes("high")) return 0.8
  if (text.includes("medium")) return 0.55
  if (text.includes("low")) return 0.28
  return 0.18
}

const pendingFieldSource = field => ({
  sourceType: "pending_provenance",
  sourceDatabase: "Pending provenance",
  sourceRecordId: "pending",
  sourceDoi: null,
  confidence: "pending",
  note: `${field} source metadata pending verification.`,
})

const normalizeFieldSource = (raw = {}, field) => {
  const source = raw.fieldSources?.[field]
  if (!source || typeof source !== "object") return pendingFieldSource(field)
  return {
    sourceType: source.sourceType || source.sourceBasis || "curated_real_example",
    sourceDatabase: source.sourceDatabase || raw.sourceDatabase || "curated source",
    sourceRecordId: source.sourceRecordId || raw.sourceRecordId || raw.id || "pending",
    sourceDoi: source.sourceDoi || source.doi || null,
    confidence: source.confidence || "pending",
    note: source.note || "Curated sample field source requires bibliographic verification.",
  }
}

const buildCuratedFieldSources = raw => {
  const fields = [
    "sourceDatabase",
    "sourceRecordId",
    "sourceUrl",
    "citation",
    "sourceDoi",
    "license",
    "retrievedAt",
    "pldA",
    "lcdA",
    "surfaceArea",
    "poreVolume",
    "density",
    "voidFraction",
    "bandGap",
    "waterStability",
    "hydrothermalGate",
    "oacs",
    "dataQualityGate",
  ]
  return Object.fromEntries(fields.map(field => [field, normalizeFieldSource(raw, field)]))
}

function classifyCuratedQualityGate(raw = {}) {
  const water = raw.waterStability || {}
  const temp = finiteOrNull(water.max_tested_temp_C)
  const pxrd = boolOrNull(water.post_treatment_PXRD_retained)
  const confidence = confidenceValue(water.confidence_score)
  const hasCoreSource = Boolean(raw.sourceDatabase && raw.sourceRecordId)
  const hasEnoughFieldSource = Object.keys(raw.fieldSources || {}).length >= 2

  if (pxrd === false) {
    return {
      status: "rejected",
      label: "Rejected by hard gate",
      labelZh: "硬阈值拒绝",
      canEnterScoring: false,
      reason: "Post-treatment PXRD is false or failed in the curated record.",
      reasonZh: "人工整理记录中处理后 PXRD 为 false 或失败。",
    }
  }

  if (temp >= 150 && pxrd === true && confidence >= 0.4 && hasCoreSource && hasEnoughFieldSource) {
    return {
      status: "ready_for_scoring",
      label: "Ready for scoring",
      labelZh: "可进入评分",
      canEnterScoring: true,
      reason: "Curated sample has temperature, PXRD, and minimal provenance fields for V1.6 preview scoring.",
      reasonZh: "该样例具备温度、PXRD 和最小来源字段，可用于 V1.6 预览评分。",
    }
  }

  return {
    status: "needs_review",
    label: "Needs review",
    labelZh: "需要复核",
    canEnterScoring: false,
    reason: "Curated sample is visible for mapper validation but lacks enough verified gate/provenance evidence for scoring.",
    reasonZh: "该样例可用于 mapper 验证，但缺少足够的门槛或来源证据，不能进入评分。",
  }
}

function descriptorScoresFromCurated(raw = {}) {
  const water = raw.waterStability || {}
  const temp = finiteOrNull(water.max_tested_temp_C)
  const pxrd = boolOrNull(water.post_treatment_PXRD_retained)
  const confidence = confidenceValue(water.confidence_score)
  const pldA = finiteOrNull(raw.pldA)
  const lcdA = finiteOrNull(raw.lcdA)
  const surfaceArea = finiteOrNull(raw.surfaceArea)
  const poreVolume = finiteOrNull(raw.poreVolume)
  const density = finiteOrNull(raw.density)
  const voidFraction = finiteOrNull(raw.voidFraction)
  const bandGap = finiteOrNull(raw.bandGap)
  const hydrothermalEvidenceStrength = clamp01((temp == null ? 0.18 : normalize(temp, 90, 200) * 0.68) + (pxrd === true ? 0.24 : 0) + confidence * 0.08)
  const poreAccessibility = clamp01(
    (pldA == null ? 0.25 : normalize(pldA, 3.2, 8.5) * 0.4) +
    (lcdA == null ? 0.15 : normalize(lcdA, 5, 18) * 0.25) +
    (surfaceArea == null ? 0.1 : normalize(surfaceArea, 450, 1800) * 0.2) +
    (poreVolume == null ? 0.08 : normalize(poreVolume, 0.18, 0.7) * 0.15)
  )
  const c1IntermediateAccessibility = clamp01(
    (pldA == null ? 0.22 : normalize(pldA, 3.4, 6.2) * 0.46) +
    (lcdA == null ? 0.16 : normalize(lcdA, 5.5, 11) * 0.26) +
    (poreVolume == null ? 0.08 : normalize(poreVolume, 0.2, 0.55) * 0.18) +
    (bandGap == null ? 0.04 : normalize(3.3 - Math.abs(bandGap - 2.4), 0, 3.3) * 0.1)
  )
  const waterBlockingResistance = clamp01((pxrd === true ? 0.44 : 0.16) + normalize(temp ?? 80, 80, 190) * 0.34 + confidence * 0.22)
  const alOFrameworkRobustness = clamp01((String(raw.frameworkType || "").toLowerCase().includes("al-o") ? 0.48 : 0.28) + normalize(temp ?? 90, 90, 200) * 0.26 + (pxrd === true ? 0.16 : 0) + confidence * 0.1)
  const thermalStability = clamp01(normalize(temp ?? 90, 90, 220) * 0.74 + confidence * 0.26)
  const linkerMicroenvironmentMatch = clamp01(0.46 + (String(raw.displayName || "").toLowerCase().includes("amino") ? 0.18 : 0) + (String(raw.topology || "").toLowerCase().includes("mil") ? 0.08 : 0) - (density && density > 1.4 ? 0.08 : 0))
  const collapseRisk = clamp01(1 - hydrothermalEvidenceStrength + (pxrd === false ? 0.25 : 0) + (voidFraction && voidFraction > 0.68 ? 0.08 : 0))

  return {
    hydrothermalEvidenceStrength: Number(hydrothermalEvidenceStrength.toFixed(3)),
    thermalStability: Number(thermalStability.toFixed(3)),
    waterBlockingResistance: Number(waterBlockingResistance.toFixed(3)),
    poreAccessibility: Number(poreAccessibility.toFixed(3)),
    c1IntermediateAccessibility: Number(c1IntermediateAccessibility.toFixed(3)),
    alOFrameworkRobustness: Number(alOFrameworkRobustness.toFixed(3)),
    linkerMicroenvironmentMatch: Number(linkerMicroenvironmentMatch.toFixed(3)),
    evidenceConfidence: Number(confidence.toFixed(3)),
    collapseRisk: Number(collapseRisk.toFixed(3)),
  }
}

export function mapCoreMofRecord(raw = {}) {
  const water = raw.water_stability || raw.waterStability || {}
  const pldA = Number(raw.pld_A ?? raw.pldA ?? raw.pore_limiting_diameter_A ?? 0)
  const lcdA = Number(raw.lcd_A ?? raw.lcdA ?? raw.largest_cavity_diameter_A ?? 0)
  const surfaceArea = Number(raw.surface_area_m2g ?? raw.surfaceAreaM2G ?? raw.accessible_surface_area_m2g ?? 0)
  const poreVolume = Number(raw.pore_volume_cm3g ?? raw.poreVolumeCm3G ?? 0)
  const maxTemp = Number(water.max_tested_temp_C ?? water.maxTestedTempC ?? 25)
  const pxrd = Boolean(water.post_treatment_PXRD_retained ?? water.postTreatmentPxrdRetained)
  const hydrothermalEvidenceStrength = clamp01((normalize(maxTemp, 80, 190) * 0.68) + (pxrd ? 0.32 : 0))
  const c1IntermediateAccessibility = clamp01((normalize(pldA, 3.5, 7.5) * 0.55) + (normalize(lcdA, 5, 12) * 0.3) + (normalize(poreVolume, 0.2, 0.8) * 0.15))
  const collapseRisk = clamp01(1 - hydrothermalEvidenceStrength + (pxrd ? 0 : 0.18))
  const sourceRecordId = String(raw.sourceRecordId || raw.core_id || raw.id || "CORE-LIKE-PENDING")
  const metalNode = String(first(raw.metal_nodes || raw.metalNode || raw.metal) || "Al")
  const linkerFamily = String(first(raw.linkers || raw.linkerFamily || raw.linker) || "pending linker")

  return {
    candidateId: `OA-FRAMEWORK-${sourceRecordId}`,
    sourceRecordId,
    sourceType: "core_like_fixture",
    displayName: String(raw.name || raw.displayName || `${metalNode}-${linkerFamily} framework`),
    formula: String(raw.formula || "formula pending"),
    metalNode,
    linkerFamily,
    topology: String(raw.topology || raw.net || "topology pending"),
    poreMetrics: {
      pldA: Number.isFinite(pldA) ? pldA : 0,
      lcdA: Number.isFinite(lcdA) ? lcdA : 0,
      surfaceAreaM2G: Number.isFinite(surfaceArea) ? surfaceArea : 0,
      poreVolumeCm3G: Number.isFinite(poreVolume) ? poreVolume : 0,
    },
    waterStability: {
      maxTestedTempC: Number.isFinite(maxTemp) ? maxTemp : 25,
      postTreatmentPxrdRetained: pxrd,
      sourceStatus: String(water.evidence_status || water.sourceStatus || "demo_proxy"),
    },
    organicAcidDescriptors: {
      hydrothermalEvidenceStrength: Number(hydrothermalEvidenceStrength.toFixed(3)),
      c1IntermediateAccessibility: Number(c1IntermediateAccessibility.toFixed(3)),
      collapseRisk: Number(collapseRisk.toFixed(3)),
    },
    mappingStatus: pxrd && maxTemp >= 150 ? "mapped_fixture" : "needs_review",
    evidenceBoundary: "Mapped from a CoRE-like fixture for schema preview only; not full CoRE database integration.",
    sourceMapping: [
      { sourceField: "pld_A", targetField: "poreMetrics.pldA" },
      { sourceField: "lcd_A", targetField: "poreMetrics.lcdA" },
      { sourceField: "water_stability.max_tested_temp_C", targetField: "waterStability.maxTestedTempC" },
      { sourceField: "water_stability.post_treatment_PXRD_retained", targetField: "waterStability.postTreatmentPxrdRetained" },
    ],
  }
}

export function mapCuratedFrameworkExamples(records = []) {
  return (Array.isArray(records) ? records : []).map(raw => {
    const water = raw.waterStability || {}
    const temp = finiteOrNull(water.max_tested_temp_C)
    const pxrd = boolOrNull(water.post_treatment_PXRD_retained)
    const sourceRecordId = String(raw.sourceRecordId || raw.id || "CURATED-ALMOF-PENDING")
    const qualityGate = classifyCuratedQualityGate(raw)
    const fieldSources = buildCuratedFieldSources(raw)
    const descriptorScores = descriptorScoresFromCurated(raw)
    const evidenceIds = Array.isArray(raw.evidenceIds) ? raw.evidenceIds : []

    return {
      id: String(raw.id || `REAL-${sourceRecordId}`),
      candidateId: `OA-FRAMEWORK-${sourceRecordId}`,
      sourceRecordId,
      sourceType: "curated_real_example",
      sourceDatabase: String(raw.sourceDatabase || "curated source"),
      sourceUrl: raw.sourceUrl || null,
      citation: raw.citation || null,
      sourceDoi: raw.sourceDoi || null,
      license: raw.license || null,
      retrievedAt: raw.retrievedAt || "2026-06-05",
      displayName: String(raw.displayName || `Curated Al-MOF ${sourceRecordId}`),
      formula: String(raw.formula || "formula pending"),
      metals: Array.isArray(raw.metals) ? raw.metals : ["Al"],
      hasAlNode: raw.hasAlNode !== false,
      frameworkType: String(raw.frameworkType || "Al-O framework pending"),
      topology: String(raw.topology || "topology pending"),
      metalNode: "Al",
      linkerFamily: String(raw.linkerFamily || raw.frameworkType || "pending linker"),
      pldA: finiteOr(raw.pldA),
      lcdA: finiteOr(raw.lcdA),
      surfaceArea: finiteOr(raw.surfaceArea),
      poreVolume: finiteOr(raw.poreVolume),
      density: finiteOr(raw.density),
      voidFraction: finiteOr(raw.voidFraction),
      bandGap: finiteOrNull(raw.bandGap),
      poreMetrics: {
        pldA: finiteOr(raw.pldA),
        lcdA: finiteOr(raw.lcdA),
        surfaceAreaM2G: finiteOr(raw.surfaceArea),
        poreVolumeCm3G: finiteOr(raw.poreVolume),
      },
      waterStability: {
        ...water,
        maxTestedTempC: temp ?? 0,
        max_tested_temp_C: temp,
        durationHours: finiteOrNull(water.duration_hours),
        postTreatmentPxrdRetained: pxrd === true,
        post_treatment_PXRD_retained: pxrd,
        sourceStatus: "curated_real_example",
        sourceDoi: water.sourceDoi || null,
        confidenceScore: confidenceValue(water.confidence_score),
      },
      descriptorScores,
      organicAcidDescriptors: {
        hydrothermalEvidenceStrength: descriptorScores.hydrothermalEvidenceStrength,
        c1IntermediateAccessibility: descriptorScores.c1IntermediateAccessibility,
        collapseRisk: descriptorScores.collapseRisk,
      },
      hydrothermalGate: {
        status: "pending",
        reason: "To be evaluated by the V1.6 hydrothermal hard gate preview.",
        evidenceIds,
      },
      organicAcidScore: {
        oacs: null,
        collapseRisk: null,
        evidenceLevel: "pending",
        weightingMethod: "CRITIC+AHP",
        evidenceIds,
        fieldEvidenceIds: {
          oacs: evidenceIds,
          hydrothermalGate: evidenceIds.filter(id => id.includes("001") || id.includes("002") || id.includes("003") || id.includes("004")),
          collapseRisk: evidenceIds,
        },
      },
      dataQualityGate: qualityGate,
      mappingStatus: qualityGate.status === "ready_for_scoring" ? "curated_real_example" : qualityGate.status === "rejected" ? "blocked" : "needs_review",
      dataMode: "curated_real_examples",
      dataModeLabel: "Curated real example",
      dataStatus: {
        level: "curated_real_example",
        label: "Curated real example",
        description: "Small curated real example for V1.6 mapper validation; not full database screening.",
        verified: false,
      },
      fieldSources,
      evidenceIds,
      evidenceRecords: [],
      descriptorScoresEvidenceIds: Object.fromEntries(Object.keys(descriptorScores).map(key => [key, evidenceIds])),
      evidenceBoundary: "Small curated real example for V1.6 mapping validation. Not full CoRE/QMOF database screening and not validated catalytic performance.",
      sourceMapping: [
        { sourceField: "pldA", targetField: "poreMetrics.pldA" },
        { sourceField: "lcdA", targetField: "poreMetrics.lcdA" },
        { sourceField: "waterStability.max_tested_temp_C", targetField: "waterStability.maxTestedTempC" },
        { sourceField: "waterStability.post_treatment_PXRD_retained", targetField: "waterStability.postTreatmentPxrdRetained" },
        { sourceField: "fieldSources", targetField: "fieldSources" },
        { sourceField: "evidenceIds", targetField: "evidenceIds" },
      ],
    }
  })
}
