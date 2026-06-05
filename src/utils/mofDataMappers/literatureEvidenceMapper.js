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
