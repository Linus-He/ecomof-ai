// @ts-nocheck

export function buildCatalysisDiscoveryView(queueDataset, suggestionDataset, batchDataset = null) {
  const candidates = queueDataset?.candidates || []
  const suggestions = suggestionDataset?.suggestions || []
  const suggestionByCandidate = new Map(suggestions.map(suggestion => [suggestion.candidateId, suggestion]))
  const families = queueDataset?.families || batchDataset?.families || []
  return {
    summary: queueDataset?.summary || batchDataset?.summary || {},
    families,
    candidates: candidates.map(candidate => ({ ...candidate, suggestion: suggestionByCandidate.get(candidate.id) || null })),
    navigationCandidates: queueDataset?.navigationCandidates || [],
    batches: batchDataset?.batches || [],
    policy: queueDataset?.policy || {},
  }
}

export function filterCatalysisDiscoveryCandidates(candidates, familyId = "all") {
  if (!familyId || familyId === "all") return candidates || []
  return (candidates || []).filter(candidate => candidate.familyId === familyId)
}

export function catalysisCandidateGate(candidate) {
  const doiMatched = candidate?.doiVerification?.metadataMatch?.status === "matched"
  return {
    doiMatched,
    fullTextVerified: false,
    formalLibraryEligible: candidate?.formalLibraryEligible === true,
    reasonZh: doiMatched
      ? "DOI、题名、期刊和年份已核对；全文中的实验声明、条件、结构身份、活性相与许可仍待人工核查。"
      : "论文身份尚未完成单条 DOI 复核，不能进入正式库。",
    reasonEn: doiMatched
      ? "DOI, title, journal, and year are resolved; full-text claims, conditions, identity, active phase, and license still require human review."
      : "Single-DOI identity verification is incomplete, so this candidate cannot enter the formal library.",
  }
}

export function validateCatalysisSuggestionIsolation(suggestions) {
  return (suggestions || []).every(suggestion => (
    suggestion.reviewStatus === "suggested-not-verified"
    && suggestion.verificationLevel === "unverified"
    && suggestion.promotionAllowed === false
    && suggestion.formalLibraryWriteAllowed === false
  ))
}
