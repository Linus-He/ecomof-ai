// @ts-nocheck

const DOI_RE = /^10\.\d{4,9}\/\S+$/i

export function normalizeDoi(doi) {
  const value = typeof doi === "string" ? doi.trim() : ""
  return DOI_RE.test(value) ? value : null
}

export function mapLiteratureEvidenceRecord(raw = {}) {
  const id = String(raw.id || raw.literatureId || "LIT-PENDING")
  const status = String(raw.status || "pending_metadata")
  const sourceDoi = normalizeDoi(raw.doi || raw.sourceDoi)

  return {
    id,
    sourceType: String(raw.sourceType || "manual_note"),
    status,
    sourceTitle: String(raw.title || raw.sourceTitle || "Pending metadata source"),
    sourceDoi,
    fieldTargets: Array.isArray(raw.fieldTargets) ? raw.fieldTargets : Array.isArray(raw.inspiredFeatures) ? raw.inspiredFeatures : [],
    inspiredModules: Array.isArray(raw.inspiredModules) ? raw.inspiredModules : Array.isArray(raw.inspiredFeatures) ? raw.inspiredFeatures : [],
    coreIdea: String(raw.coreIdea || "Pending source-specific method idea."),
    adaptationBoundary: String(raw.adaptationBoundary || raw.adaptationNote || "Pending bibliographic verification; do not cite as verified source."),
    evidenceBoundary: String(raw.evidenceBoundary || "Literature entry documents conceptual influence, not reproduction or validation."),
  }
}

export function attachRealEvidenceRecords(frameworks = [], evidenceRecords = []) {
  const normalizedEvidence = (Array.isArray(evidenceRecords) ? evidenceRecords : []).map(raw => ({
    id: String(raw.id || "REAL-EVID-PENDING"),
    claim: String(raw.claim || raw.coreIdea || "Pending curated evidence claim."),
    evidenceType: String(raw.evidenceType || "literature_proxy"),
    targetModule: String(raw.targetModule || "provenance"),
    targetDescriptor: String(raw.targetDescriptor || "fieldSources"),
    targetMetal: raw.targetMetal || null,
    targetFramework: raw.targetFramework || null,
    sourceDoi: normalizeDoi(raw.sourceDoi),
    sourceTitle: raw.sourceTitle || null,
    confidence: String(raw.confidence || "pending"),
    status: String(raw.status || "pending_verification"),
    notes: String(raw.notes || "Pending verification."),
    nextEvidenceNeeded: Array.isArray(raw.nextEvidenceNeeded) ? raw.nextEvidenceNeeded : [],
  }))
  const byFramework = normalizedEvidence.reduce((acc, row) => {
    if (!row.targetFramework) return acc
    if (!acc.has(row.targetFramework)) acc.set(row.targetFramework, [])
    acc.get(row.targetFramework).push(row)
    return acc
  }, new Map())

  const mappedFrameworks = (Array.isArray(frameworks) ? frameworks : []).map(framework => {
    const linked = byFramework.get(framework.id) || []
    const evidenceIds = Array.from(new Set([...(framework.evidenceIds || []), ...linked.map(row => row.id)]))
    return {
      ...framework,
      evidenceIds,
      evidenceRecords: linked,
      realEvidenceAttachmentStatus: linked.length ? "attached" : "pending",
      organicAcidScore: {
        ...(framework.organicAcidScore || {}),
        evidenceIds,
      },
    }
  })

  return {
    frameworks: mappedFrameworks,
    evidenceRecords: normalizedEvidence,
    linkedEvidenceCount: normalizedEvidence.filter(row => row.targetFramework && byFramework.has(row.targetFramework)).length,
    frameworkCoverage: mappedFrameworks.length
      ? Number((mappedFrameworks.filter(row => (row.evidenceRecords || []).length > 0).length / mappedFrameworks.length).toFixed(3))
      : 0,
  }
}
