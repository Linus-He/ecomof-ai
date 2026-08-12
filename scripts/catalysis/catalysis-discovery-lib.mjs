import { createHash } from "node:crypto"

const MOF_TERMS = ["metal-organic framework", "metal organic framework", "metal–organic framework", "metal azole framework", "metal azolate framework", "mof", "mofs"]
const CO2RR_TERMS = [
  "co2 reduction",
  "co₂ reduction",
  "carbon dioxide reduction",
  "co2 electroreduction",
  "co₂ electroreduction",
  "carbon dioxide electroreduction",
  "electroreduction of co2",
  "electroreduction of carbon dioxide",
  "electrochemical reduction of co2",
  "electrochemical carbon dioxide reduction",
]
const EXPERIMENTAL_TERMS = ["electrocatal", "electrochemical", "electroreduction", "catalyst", "catalytic"]

export function normalizeDoi(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase()
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt);/gi, " ")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\bco\s*2\b/g, "co2")
    .replace(/\bc\s*2\s*\+/g, "c2+")
}

function displayTitle(value) {
  return String(value || "")
    .replace(/<\/?(?:sub|sup)>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bCO\s+2\b/g, "CO2")
    .replace(/\bC\s+2\s*\+/g, "C2+")
    .trim()
}

export function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function matchingTerms(text, terms = []) {
  const normalized = normalizeText(text)
  return terms.filter(term => normalized.includes(normalizeText(term)))
}

function publicationYear(item) {
  const dateParts = item?.published?.["date-parts"]?.[0]
  return Number(dateParts?.[0] || item?.publication_year || item?.year || 0) || null
}

function sourceName(item) {
  return item?.primary_location?.source?.display_name || item?.["container-title"]?.[0] || item?.journal || null
}

export function normalizeCrossrefItem(item, familyId) {
  const doi = normalizeDoi(item?.DOI)
  return {
    adapter: "crossref",
    familyId,
    externalId: doi ? `https://doi.org/${doi}` : null,
    doi,
    title: displayTitle(item?.title?.[0]),
    year: publicationYear(item),
    journal: sourceName(item),
    publicationType: item?.type || null,
    landingPage: item?.URL || (doi ? `https://doi.org/${doi}` : null),
    isRetracted: Boolean(item?.update?.some?.(entry => /retract/i.test(entry?.type || ""))),
    licenseDeclared: Array.isArray(item?.license) && item.license.length > 0,
    authorCount: Array.isArray(item?.author) ? item.author.length : 0,
    metadataFields: Object.keys(item || {}).sort(),
  }
}

export function normalizeOpenAlexItem(item, familyId) {
  const doi = normalizeDoi(item?.doi || item?.ids?.doi)
  return {
    adapter: "openalex",
    familyId,
    externalId: item?.id || null,
    doi,
    title: displayTitle(item?.display_name || item?.title),
    year: Number(item?.publication_year || 0) || null,
    journal: sourceName(item),
    publicationType: item?.type || null,
    landingPage: item?.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : item?.id || null),
    isRetracted: item?.is_retracted === true,
    licenseDeclared: Boolean(item?.primary_location?.license),
    authorCount: Array.isArray(item?.authorships) ? item.authorships.length : 0,
    metadataFields: Object.keys(item || {}).sort(),
  }
}

export function evaluateCandidate(item, family, policy) {
  const title = normalizeText(item?.title)
  const matches = {
    mof: matchingTerms(title, MOF_TERMS),
    co2rr: matchingTerms(title, CO2RR_TERMS),
    product: matchingTerms(title, family?.productTerms),
    state: matchingTerms(title, family?.stateTerms),
    experimental: matchingTerms(title, EXPERIMENTAL_TERMS),
    excludedState: matchingTerms(title, family?.excludedStateTerms),
    excludedPublication: matchingTerms(title, policy?.excludedPublicationSignals),
  }
  const signals = []
  if (matches.mof.length) signals.push("mof-context")
  if (matches.co2rr.length) signals.push("co2-electroreduction")
  if (matches.product.length) signals.push("family-product")
  if (matches.experimental.length) signals.push("experimental-language")
  if (matches.state.length) signals.push("catalyst-state-language")

  let score = 0
  if (matches.mof.length) score += 3
  if (matches.co2rr.length) score += 3
  if (matches.product.length) score += 3
  if (matches.experimental.length) score += 1
  if (matches.state.length) score += 1
  if (matches.excludedState.length) score -= 3
  if (matches.excludedPublication.length) score -= 5
  if (item?.isRetracted) score -= 20

  const required = policy?.requiredSignals || []
  const missingRequiredSignals = required.filter(signal => !signals.includes(signal))
  const blockers = []
  if (!item?.doi) blockers.push("missing-doi")
  if (!item?.title) blockers.push("missing-title")
  if (item?.isRetracted) blockers.push("retracted-metadata-flag")
  if (matches.excludedState.length) blockers.push("excluded-catalyst-state")
  if (matches.excludedPublication.length) blockers.push("review-or-perspective-signal")
  blockers.push(...missingRequiredSignals.map(signal => `missing-signal:${signal}`))
  if (score < Number(policy?.candidateMinimumScore || 0)) blockers.push("below-candidate-score")

  return {
    score,
    signals,
    blockers: [...new Set(blockers)],
    matchedTerms: matches,
    eligibleForCandidateQueue: blockers.length === 0,
  }
}

function preferMetadata(items) {
  return [...items].sort((a, b) => {
    if (a.adapter !== b.adapter) return a.adapter === "crossref" ? -1 : 1
    return (b.title?.length || 0) - (a.title?.length || 0)
  })[0]
}

export function mergeDiscoveryItems(items, families, policy, formalDois = new Set(), reviewOverrides = {}) {
  const familyById = new Map(families.map(family => [family.id, family]))
  const byDoi = new Map()
  const missingDoi = []
  for (const item of items) {
    if (!item.doi) {
      missingDoi.push(item)
      continue
    }
    if (!byDoi.has(item.doi)) byDoi.set(item.doi, [])
    byDoi.get(item.doi).push(item)
  }

  const candidates = []
  for (const [doi, matches] of byDoi) {
    const representative = preferMetadata(matches)
    const familyEvaluations = families.map(family => {
      const familyId = family.id
      return { familyId, ...evaluateCandidate(representative, family, policy) }
    }).sort((a, b) => b.score - a.score || a.familyId.localeCompare(b.familyId))
    const best = familyEvaluations[0]
    const alreadyFormal = formalDois.has(doi)
    const manualReview = reviewOverrides[doi] || null
    const queueStatus = alreadyFormal
      ? "already-in-formal-library"
      : manualReview?.decision === "literature-navigation-only"
        ? "literature-navigation-only"
        : manualReview?.decision === "excluded"
          ? "excluded-by-manual-review"
      : best?.eligibleForCandidateQueue
        ? "candidate-awaiting-fulltext-review"
        : "excluded-by-rule"
    const adapterEvidence = [...new Set(matches.map(item => item.adapter))].sort()
    const discoveryFamilyIds = [...new Set(matches.map(item => item.familyId))].sort()
    candidates.push({
      id: `catlit-${stableHash(doi).slice(0, 12)}`,
      doi,
      doiUrl: `https://doi.org/${doi}`,
      title: representative.title,
      year: representative.year,
      journal: representative.journal,
      publicationType: representative.publicationType,
      documentRole: manualReview?.documentRole || "unresolved-primary-or-secondary-literature",
      landingPage: representative.landingPage,
      adapterEvidence,
      discoveryFamilyIds,
      familyId: best?.familyId || matches[0]?.familyId,
      familyMatches: familyEvaluations,
      relevanceScore: best?.score || 0,
      relevanceSignals: best?.signals || [],
      matchedTerms: best?.matchedTerms || {},
      blockers: best?.blockers || ["no-family-evaluation"],
      metadataVerification: adapterEvidence.includes("crossref") ? "crossref-metadata-resolved" : "openalex-metadata-resolved",
      queueStatus,
      manualReview,
      formalLibraryEligible: false,
      reviewStatus: queueStatus === "candidate-awaiting-fulltext-review" ? "metadata-screened-not-fulltext-verified" : queueStatus,
    })
  }

  return {
    candidates: candidates.sort((a, b) => b.relevanceScore - a.relevanceScore || (b.year || 0) - (a.year || 0) || a.doi.localeCompare(b.doi)),
    missingDoi,
  }
}

export function buildExtractionSuggestion(candidate, family) {
  const evidenceTerms = [
    ...(candidate?.matchedTerms?.mof || []),
    ...(candidate?.matchedTerms?.co2rr || []),
    ...(candidate?.matchedTerms?.product || []),
    ...(candidate?.matchedTerms?.state || []),
  ]
  return {
    id: `suggestion-${candidate.id}`,
    candidateId: candidate.id,
    doi: candidate.doi,
    generationMode: "machine-assisted-deterministic-v1",
    sourceScope: "bibliographic-title-only",
    reviewStatus: "suggested-not-verified",
    verificationLevel: "unverified",
    promotionAllowed: false,
    formalLibraryWriteAllowed: false,
    suggestedFields: [
      { field: "reaction.substrate", value: "CO2", confidence: "medium", basis: ["co2-electroreduction-title-signal"] },
      { field: "reaction.targetProduct", value: family?.suggestedProduct || null, confidence: "medium", basis: candidate?.matchedTerms?.product || [] },
      { field: "catalystState.stateType", value: candidate?.manualReview?.catalystStateOverride || family?.suggestedCatalystState || "unresolved", confidence: "low", basis: candidate?.matchedTerms?.state || [] },
      { field: "reaction.mode", value: "electrochemical", confidence: "medium", basis: candidate?.matchedTerms?.experimental || [] },
    ],
    evidenceTerms: [...new Set(evidenceTerms)].sort(),
    requiredHumanChecks: [
      "publisher-or-repository-fulltext",
      "primary-experimental-document-type",
      "claim-level-source-location",
      "condition-tuple",
      "catalyst-state-and-active-phase",
      "exact-structure-identity",
      "reuse-license",
    ],
    warning: "This suggestion is generated from bibliographic title signals. It is not a verified reaction record and cannot be promoted automatically.",
  }
}

export function assertCandidateIsolation({ queue, suggestions, formalDois }) {
  const violations = []
  for (const candidate of queue) {
    if (formalDois.has(candidate.doi)) violations.push(`queue-doi-already-formal:${candidate.doi}`)
    if (candidate.formalLibraryEligible !== false) violations.push(`queue-candidate-marked-formal:${candidate.id}`)
  }
  for (const suggestion of suggestions) {
    if (suggestion.promotionAllowed !== false || suggestion.formalLibraryWriteAllowed !== false) {
      violations.push(`suggestion-may-promote:${suggestion.id}`)
    }
    if (suggestion.reviewStatus !== "suggested-not-verified") violations.push(`suggestion-status-invalid:${suggestion.id}`)
  }
  if (violations.length) throw new Error(`Catalysis discovery isolation failed:\n${violations.join("\n")}`)
  return true
}
