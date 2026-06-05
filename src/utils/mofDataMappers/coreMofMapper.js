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
