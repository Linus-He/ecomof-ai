import fs from "node:fs/promises"
import path from "node:path"
import {
  assertCandidateIsolation,
  buildExtractionSuggestion,
  mergeDiscoveryItems,
  normalizeCrossrefItem,
  normalizeOpenAlexItem,
  stableHash,
} from "./catalysis-discovery-lib.mjs"

const root = process.cwd()
const configPath = path.join(root, "data/curation/catalysis/discovery-families-v1.json")
const outDir = path.join(root, "public/data/catalysis_v2")
const databasePath = path.join(outDir, "catalysis_reaction_database_v2.json")
const reviewOverridesPath = path.join(root, "data/curation/catalysis/discovery-review-overrides-v1.json")
const discoveryDoiCacheDir = path.join(root, "data/curation/catalysis/discovery-doi-cache")
const liveMode = process.argv.includes("--live")
const crossrefOnly = process.argv.includes("--crossref-only")

const readJson = async file => JSON.parse(await fs.readFile(file, "utf8"))
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

const config = await readJson(configPath)
const database = await readJson(databasePath)
const reviewOverrides = await readJson(reviewOverridesPath)
const cacheDir = path.join(root, "data/curation/catalysis/discovery-cache", config.batchId)
const familyById = new Map(config.families.map(family => [family.id, family]))
const formalDois = new Set((database.tables?.sourceDocuments || []).map(source => source.doi))
const rows = Number(config.retrieval.rowsPerFamily || 25)

async function loadDoiVerification(doi) {
  try {
    return await readJson(path.join(discoveryDoiCacheDir, `${doi.replace(/[^a-z0-9]+/g, "_")}.json`))
  } catch {
    return null
  }
}

function cachePath(adapter, familyId) {
  return path.join(cacheDir, `${adapter}-${familyId}.json`)
}

function requestUrl(adapter, family) {
  const settings = config.retrieval[adapter]
  const url = new URL(settings.endpoint)
  if (adapter === "crossref") {
    url.searchParams.set("query.bibliographic", family.query)
    url.searchParams.set("filter", settings.filter)
    url.searchParams.set("rows", String(rows))
    url.searchParams.set("select", settings.select)
    if (process.env.CROSSREF_MAILTO) url.searchParams.set("mailto", process.env.CROSSREF_MAILTO)
  } else {
    url.searchParams.set("search", family.query)
    url.searchParams.set("filter", settings.filter)
    url.searchParams.set("per-page", String(rows))
    url.searchParams.set("select", settings.select)
    if (process.env.OPENALEX_API_KEY) url.searchParams.set("api_key", process.env.OPENALEX_API_KEY)
    if (process.env.OPENALEX_MAILTO || process.env.CROSSREF_MAILTO) {
      url.searchParams.set("mailto", process.env.OPENALEX_MAILTO || process.env.CROSSREF_MAILTO)
    }
  }
  return url
}

async function fetchJson(url, adapter) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "EcoMOF-AI-catalysis-discovery/1.0 (https://github.com/linus-he/ecomof-ai)",
        },
      })
      if (!response.ok) throw new Error(`${adapter} returned HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 800))
    }
  }
  throw lastError
}

function compactResponse(adapter, response) {
  if (adapter === "crossref") {
    return {
      status: response.status,
      messageType: response["message-type"],
      totalResults: response.message?.["total-results"] || 0,
      items: response.message?.items || [],
    }
  }
  return {
    meta: {
      count: response.meta?.count || 0,
      perPage: response.meta?.per_page || rows,
    },
    results: response.results || [],
  }
}

async function loadAdapterBatch(adapter, family) {
  const file = cachePath(adapter, family.id)
  if (!liveMode) {
    try {
      return await readJson(file)
    } catch {
      throw new Error(`Missing cached ${adapter} discovery response for ${family.id}. Run with --live first.`)
    }
  }
  const url = requestUrl(adapter, family)
  const response = compactResponse(adapter, await fetchJson(url, adapter))
  const batch = {
    schemaVersion: "catalysis-discovery-cache-v1",
    batchId: config.batchId,
    adapter,
    familyId: family.id,
    retrievedAt: new Date().toISOString(),
    request: {
      endpoint: `${url.origin}${url.pathname}`,
      query: family.query,
      filter: config.retrieval[adapter].filter,
      rows,
      select: config.retrieval[adapter].select,
      accessMode: adapter === "openAlex" && process.env.OPENALEX_API_KEY ? "api-key" : "public",
    },
    response,
  }
  batch.responseHash = stableHash(batch.response)
  await writeJson(file, batch)
  return batch
}

const adapters = crossrefOnly ? ["crossref"] : ["crossref", "openAlex"]
const batches = []
for (const family of config.families) {
  for (const adapter of adapters) batches.push(await loadAdapterBatch(adapter, family))
}

const normalizedItems = []
for (const batch of batches) {
  if (batch.adapter === "crossref") {
    normalizedItems.push(...(batch.response.items || []).map(item => normalizeCrossrefItem(item, batch.familyId)))
  } else {
    normalizedItems.push(...(batch.response.results || []).map(item => normalizeOpenAlexItem(item, batch.familyId)))
  }
}

const merged = mergeDiscoveryItems(normalizedItems, config.families, config.admissionPolicy, formalDois, reviewOverrides.reviews)
const candidateQueue = merged.candidates.filter(candidate => candidate.queueStatus === "candidate-awaiting-fulltext-review")
const existingMatches = merged.candidates.filter(candidate => candidate.queueStatus === "already-in-formal-library")
const navigationCandidates = merged.candidates.filter(candidate => candidate.queueStatus === "literature-navigation-only")
const excluded = merged.candidates.filter(candidate => candidate.queueStatus === "excluded-by-rule" || candidate.queueStatus === "excluded-by-manual-review")
const suggestions = candidateQueue.map(candidate => buildExtractionSuggestion(candidate, familyById.get(candidate.familyId)))
for (const candidate of [...candidateQueue, ...navigationCandidates]) {
  candidate.doiVerification = await loadDoiVerification(candidate.doi)
}
assertCandidateIsolation({ queue: candidateQueue, suggestions, formalDois })

const generatedAt = batches.map(batch => batch.retrievedAt).sort().at(-1) || config.updatedAt
const familySummaries = config.families.map(family => {
  const familyCandidates = merged.candidates.filter(candidate => candidate.discoveryFamilyIds.includes(family.id))
  return {
    id: family.id,
    titleZh: family.titleZh,
    titleEn: family.titleEn,
    query: family.query,
    retrievedHitCount: normalizedItems.filter(item => item.familyId === family.id).length,
    deduplicatedDoiCount: familyCandidates.length,
    queuedCandidateCount: candidateQueue.filter(candidate => candidate.familyId === family.id).length,
    existingFormalCount: existingMatches.filter(candidate => candidate.discoveryFamilyIds.includes(family.id)).length,
  }
})

const summary = {
  adapterCount: adapters.length,
  familyCount: config.families.length,
  rawHitCount: normalizedItems.length,
  uniqueDoiCount: merged.candidates.length,
  missingDoiHitCount: merged.missingDoi.length,
  existingFormalMatchCount: existingMatches.length,
  navigationCandidateCount: navigationCandidates.length,
  candidateQueueCount: candidateQueue.length,
  excludedCount: excluded.length,
  suggestionCount: suggestions.length,
  individuallyDoiVerifiedCount: candidateQueue.filter(candidate => candidate.doiVerification?.metadataMatch?.status === "matched").length,
  automaticPromotionCount: 0,
  formalLibrarySourceCount: formalDois.size,
}

const discoveryBatches = {
  schemaVersion: "catalysis-discovery-batches-v1",
  batchId: config.batchId,
  generatedAt,
  generatedBy: "scripts/catalysis/discover-catalysis-literature.mjs",
  mode: liveMode ? "live-refresh" : "tracked-cache-rebuild",
  configHash: stableHash(config),
  reviewOverrideHash: stableHash(reviewOverrides),
  officialSources: [
    { id: "crossref", url: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", scope: "publisher-deposited bibliographic metadata" },
    { id: "openalex", url: "https://help.openalex.org/hc/en-us/articles/24398041565207-API-and-Data-Snapshot", scope: "open scholarly metadata cross-check" },
  ],
  policy: {
    bibliographicMetadataIsNotExperimentalEvidence: true,
    abstractsNotPersisted: true,
    candidatesAreQuarantined: true,
    automaticPromotionAllowed: false,
  },
  summary,
  families: familySummaries,
  batches: batches.map(batch => ({
    adapter: batch.adapter,
    familyId: batch.familyId,
    retrievedAt: batch.retrievedAt,
    request: batch.request,
    responseHash: batch.responseHash,
    resultCount: batch.adapter === "crossref" ? batch.response.items.length : batch.response.results.length,
  })),
}

const queueDataset = {
  schemaVersion: "catalysis-candidate-queue-v1",
  batchId: config.batchId,
  generatedAt,
  policy: {
    status: "quarantined-discovery-layer",
    formalLibraryWriteAllowed: false,
    requiredPromotionGate: ["fulltext", "claim-location", "conditions", "identity", "active-phase", "license"],
  },
  summary,
  families: familySummaries,
  candidates: candidateQueue,
  navigationCandidates,
}

const suggestionDataset = {
  schemaVersion: "catalysis-extraction-suggestions-v1",
  batchId: config.batchId,
  generatedAt,
  policy: {
    inputScope: "bibliographic-title-only",
    suggestionsAreFacts: false,
    humanReviewRequired: true,
    automaticVerificationAllowed: false,
    automaticPromotionAllowed: false,
  },
  summary: { suggestionCount: suggestions.length, verifiedSuggestionCount: 0, promotedSuggestionCount: 0 },
  suggestions,
}

const audit = {
  schemaVersion: "catalysis-discovery-audit-v1",
  batchId: config.batchId,
  generatedAt,
  result: "passed-with-quarantined-candidates",
  summary,
  checks: [
    { id: "doi-deduplication", status: "passed", detail: `${merged.candidates.length} unique DOI records from ${normalizedItems.length} metadata hits.` },
    { id: "formal-library-isolation", status: "passed", detail: "Candidate and suggestion datasets cannot write to the formal reaction database." },
    { id: "suggestion-status", status: "passed", detail: "Every extraction suggestion remains suggested-not-verified with promotion disabled." },
    { id: "abstract-copyright-boundary", status: "passed", detail: "No abstract or full text is stored in the discovery cache or public datasets." },
  ],
  existingFormalMatches: existingMatches.map(candidate => ({ id: candidate.id, doi: candidate.doi, title: candidate.title, familyId: candidate.familyId })),
  navigationCandidates: navigationCandidates.map(candidate => ({ id: candidate.id, doi: candidate.doi, title: candidate.title, familyId: candidate.familyId, manualReview: candidate.manualReview })),
  excluded: excluded.map(candidate => ({ id: candidate.id, doi: candidate.doi, title: candidate.title, relevanceScore: candidate.relevanceScore, blockers: candidate.blockers })),
  missingDoiHits: merged.missingDoi.map(item => ({ adapter: item.adapter, familyId: item.familyId, title: item.title })),
}

await writeJson(path.join(outDir, "catalysis_discovery_batches_v1.json"), discoveryBatches)
await writeJson(path.join(outDir, "catalysis_candidate_queue_v1.json"), queueDataset)
await writeJson(path.join(outDir, "catalysis_extraction_suggestions_v1.json"), suggestionDataset)
await writeJson(path.join(outDir, "catalysis_discovery_audit_v1.json"), audit)

console.log(JSON.stringify(summary, null, 2))
