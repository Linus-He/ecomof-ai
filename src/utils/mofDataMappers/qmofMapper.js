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

export function mapQmofRecord(raw = {}) {
  const descriptors = raw.descriptors || raw
  const sourceRecordId = String(raw.qmof_id || raw.sourceRecordId || raw.id || "QMOF-LIKE-PENDING")
  const metal = String(raw.metal || descriptors.metal || "Mo")
  const bandGap = Number(descriptors.band_gap_eV ?? descriptors.bandGapEv ?? 0)
  const charge = Number(descriptors.partial_charge_metal ?? descriptors.partialChargeMetal ?? 0)
  const oxoAffinity = clamp01(descriptors.oxo_affinity_proxy ?? descriptors.oxoAffinityProxy ?? normalize(charge, 0.8, 2.4))
  const formateAffinity = clamp01(descriptors.formate_affinity_proxy ?? descriptors.formateAffinityProxy ?? normalize(2.8 - Math.abs(bandGap - 1.8), 0, 2.8))
  const redoxWindow = clamp01(descriptors.redox_window_proxy ?? descriptors.redoxWindowProxy ?? normalize(3.2 - Math.abs(bandGap - 1.2), 0, 3.2))
  const confidence = String(raw.confidence || descriptors.confidence || "medium")

  return {
    candidateId: `OA-ELECTRONIC-${sourceRecordId}`,
    sourceRecordId,
    sourceType: "qmof_like_fixture",
    metal,
    descriptors: {
      bandGapEv: Number.isFinite(bandGap) ? bandGap : 0,
      partialChargeMetal: Number.isFinite(charge) ? charge : 0,
      oxoAffinityProxy: Number(oxoAffinity.toFixed(3)),
      formateAffinityProxy: Number(formateAffinity.toFixed(3)),
      redoxWindowProxy: Number(redoxWindow.toFixed(3)),
    },
    descriptorConfidence: ["high", "medium", "low", "pending"].includes(confidence) ? confidence : "pending",
    mappingStatus: confidence === "pending" ? "needs_review" : "mapped_fixture",
    evidenceBoundary: "Mapped from a QMOF-like fixture for descriptor-schema preview only; not full QMOF integration.",
    sourceMapping: [
      { sourceField: "band_gap_eV", targetField: "descriptors.bandGapEv" },
      { sourceField: "partial_charge_metal", targetField: "descriptors.partialChargeMetal" },
      { sourceField: "oxo_affinity_proxy", targetField: "descriptors.oxoAffinityProxy" },
      { sourceField: "formate_affinity_proxy", targetField: "descriptors.formateAffinityProxy" },
    ],
  }
}

function finiteOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function pendingDescriptorSource(raw = {}) {
  return {
    sourceType: "qmof_curated_example",
    sourceDatabase: raw.sourceDatabase || "QMOF / curated descriptor note",
    sourceRecordId: raw.sourceRecordId || raw.id || "pending",
    sourceDoi: raw.sourceDoi || null,
    confidence: raw.fieldSources?.bandGap?.confidence || "pending",
    note: "Curated QMOF descriptor supplement; DOI/citation remain pending unless explicitly verified.",
  }
}

export function mergeQmofDescriptorsIntoFrameworks(frameworks = [], qmofRecords = []) {
  const frameworkById = new Map((Array.isArray(frameworks) ? frameworks : []).map(row => [row.id, row]))
  const matchedDescriptorIds = new Set()
  const descriptorByFramework = new Map()

  for (const raw of Array.isArray(qmofRecords) ? qmofRecords : []) {
    const frameworkId = raw?.matchedFrameworkId
    if (frameworkId && frameworkById.has(frameworkId)) {
      matchedDescriptorIds.add(raw.id)
      descriptorByFramework.set(frameworkId, raw)
    }
  }

  const mergedFrameworks = (Array.isArray(frameworks) ? frameworks : []).map(framework => {
    const descriptor = descriptorByFramework.get(framework.id)
    if (!descriptor) {
      return {
        ...framework,
        qmofDescriptorStatus: "missing",
        fieldSources: {
          ...(framework.fieldSources || {}),
          bandGap: framework.fieldSources?.bandGap || {
            sourceType: "pending_provenance",
            sourceDatabase: "Pending provenance",
            sourceRecordId: "pending",
            sourceDoi: null,
            confidence: "pending",
            note: "No curated QMOF descriptor matched this framework.",
          },
        },
      }
    }

    const bandGap = finiteOrNull(descriptor.bandGap)
    const source = descriptor.fieldSources?.bandGap || pendingDescriptorSource(descriptor)
    return {
      ...framework,
      bandGap,
      qmofDescriptorStatus: bandGap == null ? "needs_review" : "matched",
      qmofDescriptorRecord: {
        id: descriptor.id,
        sourceDatabase: descriptor.sourceDatabase,
        sourceRecordId: descriptor.sourceRecordId,
        bandGap,
        totalMagnetization: finiteOrNull(descriptor.totalMagnetization),
        formationEnergy: finiteOrNull(descriptor.formationEnergy),
        sourceDoi: descriptor.sourceDoi || null,
        citation: descriptor.citation || null,
      },
      fieldSources: {
        ...(framework.fieldSources || {}),
        bandGap: {
          ...pendingDescriptorSource(descriptor),
          ...source,
          sourceType: source.sourceType || "qmof_curated_example",
          sourceDoi: source.sourceDoi || null,
        },
        qmofDescriptor: pendingDescriptorSource(descriptor),
      },
    }
  })

  const unmatchedRecords = (Array.isArray(qmofRecords) ? qmofRecords : [])
    .filter(raw => !matchedDescriptorIds.has(raw.id))
    .map(raw => ({
      id: raw.id,
      matchedFrameworkId: raw.matchedFrameworkId || null,
      sourceRecordId: raw.sourceRecordId || null,
      reason: raw.matchedFrameworkId ? "matched framework was not found in curated framework sample" : "missing matchedFrameworkId",
    }))

  return {
    frameworks: mergedFrameworks,
    matchedCount: matchedDescriptorIds.size,
    unmatchedRecords,
  }
}
