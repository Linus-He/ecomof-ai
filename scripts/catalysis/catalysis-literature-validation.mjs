// Metadata admission does not promote a paper to a verified reaction record.
export const canonicalTitle = value => String(value || "")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .normalize("NFKC").replace(/\s+/g, " ").trim()

export function validateLiteratureAdditions(records, batches) {
  const seen = new Set()
  for (const record of records) {
    if (seen.has(record.doi)) throw new Error(`Duplicate addition DOI: ${record.doi}`)
    seen.add(record.doi)
    for (const key of ["doi", "title", "journal", "year", "sourceUrl", "summaryZh", "summaryEn", "verificationBasis", "checkedAt"]) {
      if (!record[key]) throw new Error(`Missing ${key}: ${record.doi}`)
    }
    if (record.compareEligible !== false || record.trainingEligible !== false || record.admission !== "literature-only-awaiting-field-verification") {
      throw new Error(`Unverified literature cannot be promoted: ${record.doi}`)
    }
    if (!record.batchId) continue
    const batch = batches.find(item => item.batchId === record.batchId)
    const snapshot = batch?.records.find(item => item.doi === record.doi)
    if (!snapshot) throw new Error(`Missing DOI metadata snapshot: ${record.doi}`)
    const work = snapshot.metadata
    if (work.DOI?.toLowerCase() !== record.doi || canonicalTitle(work.title?.[0]) !== canonicalTitle(record.title)
      || canonicalTitle(work["container-title"]?.[0]) !== canonicalTitle(record.journal)
      || work.published?.["date-parts"]?.[0]?.[0] !== record.year
      || work.resource?.primary?.URL !== record.sourceUrl
      || snapshot.retrievedAt !== record.checkedAt
      || snapshot.requestUrl !== record.metadataUrl
      || work.type !== "journal-article") throw new Error(`DOI metadata mismatch: ${record.doi}`)
    if (record.publicationStatusReview !== "not-exhaustively-reviewed" || record.fullTextReuseStatus !== "not-established") {
      throw new Error(`Unsupported publication or reuse clearance: ${record.doi}`)
    }
  }
  for (const batch of batches) {
    const members = records.filter(row => row.batchId === batch.batchId)
    if (members.length !== batch.recordCount || batch.records.length !== batch.recordCount
      || new Set(batch.records.map(row => row.doi)).size !== batch.recordCount) {
      throw new Error(`Incomplete literature batch: ${batch.batchId}`)
    }
  }
}
