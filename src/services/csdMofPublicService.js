import aliasRegistry from "../data/csdCommonAliases.json"
import { buildCsdNamingFields } from "../utils/mofNaming.mjs"

const CACHE_DATABASE = "ecomof-csd-public-cache"
const CACHE_VERSION = 1
const JSON_STORE = "json"
const CIF_STORE = "cif"
const SEARCH_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const DETAIL_CACHE_TTL = 30 * 24 * 60 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 12000
const DEFAULT_RETRIES = 2
const memoryCache = new Map()
let databasePromise
let preloadScheduled = false

export const CSD_COMMON_PRELOAD_REFCODES = Object.freeze(
  Array.isArray(aliasRegistry.featuredRefcodes)
    ? [...aliasRegistry.featuredRefcodes]
    : ["ABADUG", "RUBTAK", "RUBTAK01", "RUBTAK02"],
)

export class CsdMofRequestError extends Error {
  constructor(kind, message, details = {}) {
    super(message)
    this.name = "CsdMofRequestError"
    this.kind = kind
    Object.assign(this, details)
  }
}

function normalizedBaseUrl(value) {
  return `${String(value || "").trim().replace(/\/+$/, "")}/`
}

function recordPrefix(record = {}) {
  return String(
    record.prefix
    || record.refcode
    || "",
  ).slice(0, 2).toLowerCase()
}

function recordFile(record = {}) {
  if (record.file) return String(record.file)
  const segments = String(record.path || "").split("/")
  return segments[segments.length - 1] || ""
}

function recordPath(record = {}) {
  if (record.path) return String(record.path).replace(/^\/+/, "")
  const prefix = recordPrefix(record)
  const file = recordFile(record)
  return prefix && file ? `cif/${prefix}/${file}` : ""
}

function attachRecordUrl(record, baseUrl) {
  const path = recordPath(record)
  return {
    ...record,
    prefix: recordPrefix(record),
    file: recordFile(record),
    path: path || record.path,
    cifUrl: path ? new URL(path, normalizedBaseUrl(baseUrl)).href : record.cifUrl,
  }
}

function aliasMetadataByRefcode(registry = aliasRegistry) {
  const result = new Map()
  for (const group of registry?.aliases || []) {
    for (const refcode of group.refcodes || []) {
      result.set(String(refcode).toUpperCase(), {
        commonName: group.canonicalName,
        searchAliases: [...new Set([group.canonicalName, ...(group.searchAliases || [])].filter(Boolean))],
        preferredAliasRefcode: group.preferredRefcode,
        aliasRelationship: group.relationship,
        identityStatus: group.identityStatus,
        mofClass: group.mofClass,
        mofFamily: group.mofFamily,
        firstReportedYear: group.firstReportedYear,
        linkerIdentity: group.linker,
        metalCluster: group.metalCluster,
        topology: group.topology,
        associatedPaper: group.associatedPaper,
        ccdcNumber: group.ccdcNumber,
        identityPage: group.identityPage,
        aliasRefcodes: group.refcodes || [],
        aliasProvenance: group.provenance || [],
      })
    }
  }
  return result
}

function identityOnlyRecords(registry = aliasRegistry) {
  return (registry?.aliases || [])
    .filter(group => !Array.isArray(group.refcodes) || group.refcodes.length === 0)
    .map(group => ({
      recordType: "identity-only",
      identityId: normalizeIdentityId(group.canonicalName),
      commonName: group.canonicalName,
      searchAliases: [...new Set([group.canonicalName, ...(group.searchAliases || [])].filter(Boolean))],
      identityStatus: group.identityStatus || "catalogued-name-unmapped",
      mofClass: group.mofClass,
      mofFamily: group.mofFamily,
      firstReportedYear: group.firstReportedYear,
      linkerIdentity: group.linker,
      metalCluster: group.metalCluster,
      topology: group.topology,
      associatedPaper: group.associatedPaper,
      ccdcNumber: group.ccdcNumber,
      identityPage: group.identityPage,
      aliasProvenance: group.provenance || [],
      structureMappingStatus: group.structureMappingStatus || "pending-csd-refcode-verification",
    }))
}

function normalizeIdentityId(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function attachCsdPublicUrls(catalog, baseUrl) {
  const normalizedBase = normalizedBaseUrl(baseUrl)
  const registry = catalog?.aliasRegistry || aliasRegistry
  const aliasMap = aliasMetadataByRefcode(registry)
  const structures = Array.isArray(catalog?.structures)
    ? catalog.structures.map(sourceRecord => {
        const record = attachRecordUrl(sourceRecord, normalizedBase)
        return {
          ...record,
          ...(aliasMap.get(String(record.refcode || "").toUpperCase()) || {}),
          ...buildCsdNamingFields(
            record,
            aliasMap.get(String(record.refcode || "").toUpperCase()) || {},
          ),
        }
      })
    : []
  return {
    ...(catalog || {}),
    publicBaseUrl: normalizedBase,
    aliasRegistry: registry,
    identityRecords: identityOnlyRecords(registry),
    structures,
  }
}

function lightweightRecord(record = {}) {
  const alias = aliasMetadataByRefcode().get(String(record.refcode || "").toUpperCase()) || {}
  const lightweight = {
    refcode: record.refcode,
    file: recordFile(record),
    prefix: recordPrefix(record),
    formula: record.formula || null,
    metalElements: Array.isArray(record.metalElements) ? record.metalElements : [],
    ...alias,
  }
  return {
    ...lightweight,
    ...buildCsdNamingFields(lightweight, alias),
  }
}

function lightweightCatalog(catalog = {}, mode = "lightweight") {
  return {
    schemaVersion: "2.0.0",
    dataset: catalog.dataset || {},
    summary: catalog.summary || { total: 0 },
    indexMode: mode,
    structures: Array.isArray(catalog.structures) ? catalog.structures.map(lightweightRecord) : [],
  }
}

function memoryKey(storeName, key) {
  return `${storeName}:${key}`
}

function openDatabase() {
  if (databasePromise !== undefined) return databasePromise
  if (!globalThis.indexedDB) {
    databasePromise = Promise.resolve(null)
    return databasePromise
  }
  databasePromise = new Promise(resolve => {
    try {
      const request = globalThis.indexedDB.open(CACHE_DATABASE, CACHE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(JSON_STORE)) database.createObjectStore(JSON_STORE, { keyPath: "key" })
        if (!database.objectStoreNames.contains(CIF_STORE)) database.createObjectStore(CIF_STORE, { keyPath: "key" })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return databasePromise
}

async function readCache(storeName, key) {
  const inMemory = memoryCache.get(memoryKey(storeName, key))
  if (inMemory) return inMemory
  const database = await openDatabase()
  if (!database) return null
  return new Promise(resolve => {
    try {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key)
      request.onsuccess = () => {
        const value = request.result || null
        if (value) memoryCache.set(memoryKey(storeName, key), value)
        resolve(value)
      }
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function writeCache(storeName, key, value) {
  const entry = { key, value, savedAt: Date.now() }
  memoryCache.set(memoryKey(storeName, key), entry)
  const database = await openDatabase()
  if (!database) return
  await new Promise(resolve => {
    try {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).put(entry)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

function cacheIsFresh(entry, ttlMs) {
  return Boolean(entry && Number(entry.savedAt) > Date.now() - ttlMs)
}

function delay(milliseconds, signal) {
  if (!milliseconds) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, milliseconds)
    const abort = () => {
      globalThis.clearTimeout(timer)
      reject(new CsdMofRequestError("aborted", "The request was cancelled."))
    }
    if (signal?.aborted) abort()
    else signal?.addEventListener("abort", abort, { once: true })
  })
}

function retryable(error) {
  if (!(error instanceof CsdMofRequestError)) return true
  if (error.kind === "timeout" || error.kind === "network") return true
  return error.kind === "http" && (
    error.status === 408
    || error.status === 425
    || error.status === 429
    || error.status >= 500
  )
}

export async function fetchCsdResource(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const retries = Math.max(0, Number(options.retries ?? DEFAULT_RETRIES))
  const retryDelayMs = Math.max(0, Number(options.retryDelayMs ?? 450))
  let latestError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (options.signal?.aborted) {
      throw new CsdMofRequestError("aborted", "The request was cancelled.", { url, attempt: attempt + 1 })
    }
    const controller = new AbortController()
    let timedOut = false
    const abortFromParent = () => controller.abort()
    options.signal?.addEventListener("abort", abortFromParent, { once: true })
    const timer = globalThis.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    try {
      const response = await fetch(url, {
        mode: "cors",
        cache: options.cache || "default",
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new CsdMofRequestError("http", `CSD data request failed with HTTP ${response.status}.`, {
          url,
          status: response.status,
          attempt: attempt + 1,
        })
      }
      return { response, attempts: attempt + 1 }
    } catch (error) {
      if (options.signal?.aborted) {
        throw new CsdMofRequestError("aborted", "The request was cancelled.", { url, attempt: attempt + 1 })
      }
      latestError = error instanceof CsdMofRequestError
        ? error
        : new CsdMofRequestError(
            timedOut ? "timeout" : "network",
            timedOut ? `CSD data request timed out after ${timeoutMs} ms.` : "The CSD data site could not be reached.",
            { url, attempt: attempt + 1, cause: error },
          )
    } finally {
      globalThis.clearTimeout(timer)
      options.signal?.removeEventListener("abort", abortFromParent)
    }
    if (attempt >= retries || !retryable(latestError)) throw latestError
    await delay(retryDelayMs * (attempt + 1), options.signal)
  }
  throw latestError
}

async function fetchCachedJson(url, options = {}) {
  const cacheKey = options.cacheKey || url
  const cached = await readCache(JSON_STORE, cacheKey)
  if (!options.forceRefresh && cacheIsFresh(cached, options.ttlMs || SEARCH_CACHE_TTL)) {
    return { value: cached.value, cacheState: "indexeddb" }
  }
  try {
    const { response } = await fetchCsdResource(url, options)
    let value
    try {
      value = await response.json()
    } catch (error) {
      throw new CsdMofRequestError("invalid-json", "The CSD index was downloaded but is not valid JSON.", {
        url,
        cause: error,
      })
    }
    const cacheValue = options.cacheTransform ? options.cacheTransform(value) : value
    await writeCache(JSON_STORE, cacheKey, cacheValue)
    return { value, cacheState: "network" }
  } catch (error) {
    if (cached) return { value: cached.value, cacheState: "stale-indexeddb", warning: error }
    throw error
  }
}

function fallbackCatalog() {
  return {
    schemaVersion: "2.0.0",
    dataset: {
      name: "CSD MOF Collection (Non-Commercial)",
      license: {
        spdx: "CC-BY-NC-SA-4.0",
        url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      },
    },
    summary: { total: 0 },
    indexMode: "unavailable",
    structures: [],
  }
}

export async function getCsdMofPublicCatalog(baseUrl, options = {}) {
  const normalizedBase = normalizedBaseUrl(baseUrl)
  const searchUrl = new URL("index/search.json", normalizedBase).href
  const legacyUrl = new URL("index/structures.json", normalizedBase).href
  try {
    const loaded = await fetchCachedJson(searchUrl, {
      ...options,
      cacheKey: `search:${searchUrl}`,
      ttlMs: SEARCH_CACHE_TTL,
    })
    return {
      ...attachCsdPublicUrls(lightweightCatalog(loaded.value, "prefix-details"), normalizedBase),
      cacheState: loaded.cacheState,
    }
  } catch (searchError) {
    try {
      const loaded = await fetchCachedJson(legacyUrl, {
        ...options,
        cacheKey: `legacy-search:${legacyUrl}`,
        ttlMs: SEARCH_CACHE_TTL,
        cacheTransform: value => lightweightCatalog(value, "legacy-compatible"),
      })
      const catalog = loaded.cacheState === "network"
        ? loaded.value
        : lightweightCatalog(loaded.value, "legacy-compatible")
      return {
        ...attachCsdPublicUrls(catalog, normalizedBase),
        indexMode: loaded.cacheState === "network" ? "legacy-full" : "legacy-compatible",
        cacheState: loaded.cacheState,
        indexWarning: searchError,
      }
    } catch (legacyError) {
      if (options.throwOnError) throw legacyError
      console.warn("CSD MOF search index could not be loaded.", legacyError)
      return attachCsdPublicUrls(fallbackCatalog(), normalizedBase)
    }
  }
}

function hasDetailedMetadata(record = {}) {
  return Boolean(
    record.sha256
    || record.originalCrystalSystem
    || Number.isFinite(record.voidPercent)
    || typeof record.charged === "boolean",
  )
}

export async function getCsdMofRecordDetails(record, options = {}) {
  if (!record) return null
  const inferredBaseUrl = record.cifUrl ? new URL("../../", record.cifUrl).href : ""
  const baseUrl = normalizedBaseUrl(options.baseUrl || record.publicBaseUrl || inferredBaseUrl)
  if (hasDetailedMetadata(record) && !options.forceRefresh) return attachRecordUrl(record, baseUrl)
  const prefix = recordPrefix(record)
  if (!prefix) return attachRecordUrl(record, baseUrl)
  const detailUrl = new URL(`index/prefix/${prefix}.json`, baseUrl).href
  try {
    const loaded = await fetchCachedJson(detailUrl, {
      ...options,
      cacheKey: `detail:${detailUrl}`,
      ttlMs: DETAIL_CACHE_TTL,
      retries: options.retries ?? 1,
    })
    const match = loaded.value?.structures?.find(
      candidate => String(candidate.refcode).toUpperCase() === String(record.refcode).toUpperCase(),
    )
    return attachRecordUrl({ ...record, ...(match || {}), detailCacheState: loaded.cacheState }, baseUrl)
  } catch (error) {
    return attachRecordUrl({ ...record, detailUnavailable: true, detailError: error }, baseUrl)
  }
}

function cifCacheKey(record) {
  return `cif:${String(record?.refcode || record?.cifUrl || "unknown").toUpperCase()}:${record?.sha256 || "current"}`
}

function byteLength(value) {
  try {
    return new TextEncoder().encode(String(value || "")).byteLength
  } catch {
    return String(value || "").length
  }
}

export async function downloadCsdMofCif(record, options = {}) {
  const detailedRecord = await getCsdMofRecordDetails(record, options)
  if (!detailedRecord?.cifUrl) {
    throw new CsdMofRequestError("missing-url", "This CSD record does not provide a CIF address.", {
      refcode: record?.refcode,
    })
  }
  const key = cifCacheKey(detailedRecord)
  if (!options.forceRefresh) {
    const cached = await readCache(CIF_STORE, key)
    if (cached?.value?.text) {
      return {
        record: detailedRecord,
        text: cached.value.text,
        bytes: cached.value.bytes || byteLength(cached.value.text),
        source: "indexeddb",
        attempts: 0,
      }
    }
  }
  const { response, attempts } = await fetchCsdResource(detailedRecord.cifUrl, {
    ...options,
    cache: options.forceRefresh ? "reload" : "default",
  })
  const source = await response.text()
  const contentLength = Number(response.headers.get("content-length"))
  const bytes = Number.isFinite(contentLength) && contentLength > 0 ? contentLength : byteLength(source)
  await writeCache(CIF_STORE, key, {
    text: source,
    bytes,
    sha256: detailedRecord.sha256 || null,
    url: detailedRecord.cifUrl,
    refcode: detailedRecord.refcode,
  })
  return { record: detailedRecord, text: source, bytes, source: "network", attempts }
}

export async function preloadCsdMofStructures(catalog, options = {}) {
  const records = Array.isArray(catalog?.structures) ? catalog.structures : []
  const refcodes = options.refcodes || CSD_COMMON_PRELOAD_REFCODES
  const results = []
  for (const refcode of refcodes) {
    const record = records.find(candidate => String(candidate.refcode).toUpperCase() === String(refcode).toUpperCase())
    if (!record) continue
    try {
      const result = await downloadCsdMofCif(record, {
        ...options,
        baseUrl: catalog.publicBaseUrl,
        retries: options.retries ?? 1,
      })
      results.push({ refcode, status: "cached", source: result.source })
    } catch (error) {
      results.push({ refcode, status: "unavailable", error })
    }
  }
  return results
}

export function scheduleCsdMofPreload(catalog, options = {}) {
  if (preloadScheduled || !catalog?.structures?.length) return
  preloadScheduled = true
  const run = () => {
    void preloadCsdMofStructures(catalog, options)
  }
  if (typeof globalThis.requestIdleCallback === "function") {
    globalThis.requestIdleCallback(run, { timeout: 4500 })
  } else {
    globalThis.setTimeout(run, 900)
  }
}

export function __resetCsdMofMemoryCacheForTests() {
  memoryCache.clear()
  preloadScheduled = false
}
