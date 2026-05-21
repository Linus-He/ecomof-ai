function cleanToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/₄/g, "4")
    .replace(/⁻/g, "-")
    .replace(/[^a-z0-9]+/g, "")
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== "")
}

export function looksLikeRawRecordId(value) {
  const text = String(value || "").trim()
  const normalized = text.toLowerCase()
  const underscoreCount = (normalized.match(/_/g) || []).length
  const knownNameLike = /uio|hkust|mof[-_ ]?\d|zif|mil|irmof|cpo[-_ ]?\d/i.test(text)
  return (
    text.length > 22 ||
    normalized.includes("_si_") ||
    normalized.includes("_pacman") ||
    normalized.includes("jacs.") ||
    (normalized.includes("ja") && underscoreCount >= 2) ||
    (underscoreCount >= 1 && !knownNameLike) ||
    /^(qmof|core|arc|mosaec)[-_]/.test(normalized) ||
    normalized.endsWith(".cif") ||
    normalized.includes("_clean") ||
    normalized.includes("_auto") ||
    normalized.includes("_manual") ||
    /^[A-Z]{6}\d{0,2}$/i.test(text)
  )
}

export function formatKnownMofName(name) {
  const text = String(name || "").trim()
  if (!text) return ""
  return text
    .replace(/NH2/g, "NH₂")
    .replace(/CO2/g, "CO₂")
    .replace(/HCO3/g, "HCO₃")
    .replace(/HCOO/g, "HCOO")
}

function databaseFallback(record) {
  const database = String(record?.sourceDatabase || record?.provenance?.sourceDatabase || record?.provenance?.database || "")
  if (database.includes("CoRE")) return "CoRE MOF record"
  if (database.includes("QMOF")) return "QMOF record"
  if (database.includes("ARC")) return "ARC-MOF record"
  if (database.includes("MOSAEC")) return "MOSAEC MOF record"
  return "Open MOF record"
}

function matchAlias(record, aliasDictionary = []) {
  const searchable = [
    record?.name,
    record?.rawName,
    record?.sourceRecordId,
    record?.cifFile,
    record?.mofid,
    record?.structure?.cifFile,
    record?.structure?.name,
    record?.provenance?.sourceRecordId,
  ].filter(Boolean)
  const searchableTokens = searchable.map(cleanToken).filter(Boolean)
  const aliasEntries = (aliasDictionary || [])
    .flatMap(entry => [entry.canonicalName, ...(entry.aliases || [])].map(alias => ({
      entry,
      aliasToken: cleanToken(alias),
    })))
    .filter(item => item.aliasToken)
    .sort((a, b) => b.aliasToken.length - a.aliasToken.length)
  const matched = aliasEntries.find(item => searchableTokens.some(token => token.includes(item.aliasToken)))
  if (matched) return matched.entry
  return null
}

export function resolveMofDisplayName(record = {}, aliasDictionary = []) {
  const rawName = firstDefined(record.rawName, record.name, record.structure?.name, record.cifFile, record.sourceRecordId)
  const explicitName = firstDefined(record.commonName, record.displayName, record.mofName, record.structure?.commonName)
  if (explicitName && !looksLikeRawRecordId(explicitName)) {
    const explicitMatch = matchAlias({ name: explicitName }, aliasDictionary)
    if (explicitMatch) {
      return {
        displayName: formatKnownMofName(explicitMatch.canonicalName),
        displayNameType: "recognized_mof_name",
        aliasNames: (explicitMatch.aliases || []).map(formatKnownMofName),
        rawName: rawName || "pending",
        nameCuration: {
          status: "recognized",
          confidence: explicitMatch.confidence || "medium",
          needsManualNameCuration: false,
          reason: `Matched explicit name to known MOF alias dictionary entry for ${explicitMatch.canonicalName}.`,
        },
      }
    }
    return {
      displayName: formatKnownMofName(explicitName),
      displayNameType: "explicit_name",
      aliasNames: [],
      rawName: rawName || "pending",
      nameCuration: {
        status: "curated",
        confidence: "high",
        needsManualNameCuration: false,
        reason: "Explicit non-raw MOF name provided in the source record.",
      },
    }
  }

  const matched = matchAlias(record, aliasDictionary)
  if (matched) {
    return {
      displayName: formatKnownMofName(matched.canonicalName),
      displayNameType: "recognized_mof_name",
      aliasNames: (matched.aliases || []).map(formatKnownMofName),
      rawName: rawName || "pending",
      nameCuration: {
        status: "recognized",
        confidence: matched.confidence || "medium",
        needsManualNameCuration: false,
        reason: `Matched known MOF alias dictionary entry for ${matched.canonicalName}.`,
      },
    }
  }

  const fallback = databaseFallback(record)
  const rawIdOnly = looksLikeRawRecordId(rawName)
  return {
    displayName: fallback,
    displayNameType: rawIdOnly ? "source_record_id_only" : "generic_source_record",
    aliasNames: [],
    rawName: rawName || "pending",
    nameCuration: {
      status: rawIdOnly ? "source_record_id_only" : "manual_curation_needed",
      confidence: "low",
      needsManualNameCuration: true,
      reason: rawIdOnly
        ? "This record currently resolves only to a source structure identifier, CIF filename, CSD refcode, or database record ID."
        : "No known common MOF name was found in the current alias dictionary.",
    },
  }
}

export function buildCandidateSearchText(candidate = {}) {
  return [
    candidate.displayName,
    ...(candidate.aliasNames || []),
    candidate.rawName,
    candidate.sourceRecordId,
    candidate.sourceDatabase,
    candidate.metalNode,
    candidate.metal,
    ...(candidate.metalNodes || []),
    candidate.linker,
    candidate.topology,
    candidate.mofid,
    candidate.cifFile,
    candidate.cifUrl,
    candidate.citation,
    candidate.sourceUrl,
    candidate.provenance?.citation,
    candidate.provenance?.sourceUrl,
    candidate.provenance?.recordId,
    candidate.provenance?.database,
    candidate.provenance?.sourceDatabase,
    candidate.provenance?.sourceRecordId,
    candidate.name,
    candidate.id,
  ].filter(Boolean).join(" ").toLowerCase()
}
