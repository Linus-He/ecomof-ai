export function normalizeMofSearchTerm(value) {
  return String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
}

export function publicMofDisplayName(record = {}) {
  record = record || {}
  const commonName = String(record.commonName || "").trim()
  if (commonName) return commonName
  const refcode = String(record.refcode || "").trim()
  if (refcode) return refcode
  const displayName = String(record.displayName || "").trim()
  return /^EcoMOF(?:-|$)/i.test(displayName) ? "" : displayName
}

function familyKey(record = {}) {
  const commonName = String(record.commonName || "").trim()
  return commonName ? `name:${normalizeMofSearchTerm(commonName)}` : `refcode:${String(record.refcode || "").toUpperCase()}`
}

function preferredFamilyRecord(records = []) {
  const preferredRefcode = records.find(record => record.preferredAliasRefcode)?.preferredAliasRefcode
  return records.find(record => record.refcode === preferredRefcode)
    || [...records].sort((a, b) => String(a.refcode).localeCompare(String(b.refcode)))[0]
}

export function groupCsdMofRecords(structures = [], identityRecords = []) {
  const grouped = new Map()
  for (const record of structures) {
    const key = familyKey(record)
    const records = grouped.get(key) || []
    records.push(record)
    grouped.set(key, records)
  }

  const structureGroups = [...grouped.entries()].map(([key, variants]) => {
    const preferredRecord = preferredFamilyRecord(variants)
    if (variants.length === 1) {
      return {
        ...preferredRecord,
        recordType: "structure-record",
        resultKey: key,
        variants,
        variantCount: 1,
        preferredRecord,
        publicDisplayName: publicMofDisplayName(preferredRecord),
      }
    }
    const orderedVariants = [...variants].sort((a, b) => {
      if (a.refcode === preferredRecord.refcode) return -1
      if (b.refcode === preferredRecord.refcode) return 1
      return String(a.refcode).localeCompare(String(b.refcode))
    })
    return {
      ...preferredRecord,
      recordType: "structure-family",
      resultKey: key,
      variants: orderedVariants,
      variantCount: orderedVariants.length,
      preferredRecord,
      publicDisplayName: publicMofDisplayName(preferredRecord),
    }
  })

  return [
    ...structureGroups,
    ...identityRecords.map(record => ({
      ...record,
      resultKey: `identity:${record.identityId || normalizeMofSearchTerm(record.commonName)}`,
      publicDisplayName: publicMofDisplayName(record),
      variants: [],
      variantCount: 0,
    })),
  ]
}

function recordSearchTerms(record = {}) {
  const aliases = [
    record.commonName,
    ...(record.searchAliases || []),
  ].filter(Boolean)
  const identityTerms = [
    record.mofClass,
    record.mofFamily,
    record.firstReportedYear,
    record.linkerIdentity?.name,
    record.linkerIdentity?.abbreviation,
    record.topology,
    record.ccdcNumber,
    record.associatedPaper?.doi,
  ].filter(Boolean)
  return {
    aliases: aliases.map(normalizeMofSearchTerm).filter(Boolean),
    identityTerms: identityTerms.map(normalizeMofSearchTerm).filter(Boolean),
    refcodes: (record.variants?.length ? record.variants : [record])
      .map(variant => String(variant.refcode || "").toUpperCase())
      .filter(Boolean),
    formula: String(record.formula || "").toUpperCase(),
    metals: (record.metalElements || []).map(value => String(value).toUpperCase()),
  }
}

function scoreSearchRecord(record, rawQuery, normalizedQuery) {
  const terms = recordSearchTerms(record)
  const upperQuery = String(rawQuery || "").trim().toUpperCase()
  const namedSeriesQuery = /[-\s]\s*$/.test(String(rawQuery || ""))
  if (terms.aliases.includes(normalizedQuery)) return record.recordType === "identity-only" ? 1 : 0
  if (terms.refcodes.includes(upperQuery)) return 0
  if (terms.aliases.some(value => value.startsWith(normalizedQuery))) return record.recordType === "identity-only" ? 11 : 10
  if (!namedSeriesQuery && terms.refcodes.some(value => value.startsWith(upperQuery))) return 20
  if (terms.metals.includes(upperQuery)) return 30
  if (terms.identityTerms.some(value => value === normalizedQuery || value.startsWith(normalizedQuery))) return 35
  if (normalizedQuery.length >= 3 && terms.formula.includes(upperQuery)) return 45
  return Number.POSITIVE_INFINITY
}

export function searchCsdMofCatalog(structures = [], identityRecords = [], query = "", options = {}) {
  const limit = Number(options.limit || 10)
  const records = groupCsdMofRecords(structures, identityRecords)
  const rawQuery = String(query || "").trim()
  const normalizedQuery = normalizeMofSearchTerm(rawQuery)
  if (!normalizedQuery) {
    const activeRefcode = String(options.activeRefcode || "").toUpperCase()
    return [...records]
      .sort((a, b) => {
        const aActive = a.variants?.some(record => record.refcode === activeRefcode) ? -1 : 0
        const bActive = b.variants?.some(record => record.refcode === activeRefcode) ? -1 : 0
        return aActive - bActive || a.publicDisplayName.localeCompare(b.publicDisplayName)
      })
      .slice(0, limit)
  }

  return records
    .map(record => ({ record, score: scoreSearchRecord(record, rawQuery, normalizedQuery) }))
    .filter(result => Number.isFinite(result.score))
    .sort((a, b) => (
      a.score - b.score
      || a.record.publicDisplayName.localeCompare(b.record.publicDisplayName)
      || String(a.record.refcode || "").localeCompare(String(b.record.refcode || ""))
    ))
    .slice(0, limit)
    .map(result => result.record)
}
