// @ts-nocheck
import terminologyCn from "../i18n/terminology_cn.json"
import terminologyEn from "../i18n/terminology_en.json"
import translationRules from "../i18n/translation_rules.json"

export { terminologyCn, terminologyEn, translationRules }

function values(obj) {
  return Object.values(obj || {})
}

export function canonicalChineseTerm(key) {
  return terminologyCn?.[key]?.zh || key
}

export function canonicalEnglishTerm(key) {
  return terminologyEn?.[key] || terminologyCn?.[key]?.en || key
}

export function terminologyPairs() {
  return Object.entries(terminologyCn).map(([key, record]) => ({
    key,
    en: record.en || terminologyEn[key] || key,
    zh: record.zh,
    description: record.description || "",
  }))
}

export function findDuplicateTranslations(terms = terminologyCn) {
  const byZh = new Map()
  for (const [key, record] of Object.entries(terms || {})) {
    const zh = record?.zh
    if (!zh) continue
    if (!byZh.has(zh)) byZh.set(zh, [])
    byZh.get(zh).push(key)
  }
  return [...byZh.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([zh, keys]) => ({ zh, keys }))
}

export function flattenCorpus(corpus = []) {
  if (typeof corpus === "string") return corpus
  if (Array.isArray(corpus)) return corpus.map(item => flattenCorpus(item)).join("\n")
  if (corpus && typeof corpus === "object") return values(corpus).map(item => flattenCorpus(item)).join("\n")
  return ""
}

function findHits(text, phrases = []) {
  return phrases
    .filter(Boolean)
    .filter(phrase => text.includes(phrase))
    .map(phrase => ({ phrase }))
}

export function runLocalizationAudit({
  corpus = [],
  terms = terminologyCn,
  rules = translationRules,
} = {}) {
  const text = flattenCorpus(corpus)
  const termRows = terminologyPairs()
  const duplicateTranslations = findDuplicateTranslations(terms)
  const forbiddenTranslationHits = Object.entries(rules.forbiddenTranslations || {}).flatMap(([canonical, phrases]) =>
    findHits(text, phrases).map(hit => ({
      canonical,
      expected: rules.canonicalTranslations?.[canonical] || "",
      phrase: hit.phrase,
    })),
  )
  const productCopyHits = findHits(text, rules.scientificLanguageGuide?.forbiddenProductCopy || [])
  const canonicalCovered = termRows.filter(row => row.zh && row.en).length
  const localizationCoverage = termRows.length ? canonicalCovered / termRows.length : 1

  return {
    localizationCoverage,
    terminologyConsistency: duplicateTranslations.length === 0 && forbiddenTranslationHits.length === 0,
    scientificLanguageConsistency: productCopyHits.length === 0,
    duplicateTranslations,
    forbiddenTranslationHits,
    productCopyHits,
    preferredActions: rules.scientificLanguageGuide?.preferredActions || [],
    canonicalTermCount: termRows.length,
  }
}

export function assertLocalizationAuditPass(audit) {
  return Boolean(
    audit &&
    audit.localizationCoverage === 1 &&
    audit.terminologyConsistency &&
    audit.scientificLanguageConsistency
  )
}

// First-level modules the localization audit must cover (V2.7 release readiness).
export const LOCALIZATION_AUDIT_MODULES = [
  "Methods & Evidence",
  "Project Evolution",
  "Research Reports",
  "EcoScreen",
  "MOF Library",
  "GasSep",
  "Catalysis Lab",
  "Model Benchmark Lab",
  "Model Validation Lab",
  "Data Quality Audit",
  "Roadmap",
  "Milestones",
  "Release Notes",
  "Version Timeline",
]

// English that is intentionally retained (proper nouns, data labels, scientific boundary
// terms). These must NOT be flagged as untranslated.
export const INTENTIONAL_ENGLISH = [
  "EcoMOF-AI", "EcoScreen", "GasSep", "CRITIC", "DOI", "MOF", "MOFs", "CO2", "CO₂",
  "Database Preview", "Not Final Recommendation", "GitHub Stars", "GitHub",
  "Candidates", "Research Outputs Framework", "Full Localization Refactor", "ML",
  "Run ID", "Open MOF Seed", "QMOF", "CoRE", "PXRD", "DFT", "BET", "ICP", "XRD",
]

function looksLikeEnglishTitle(value) {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed || /[一-鿿]/.test(trimmed)) return false
  if (INTENTIONAL_ENGLISH.some(term => trimmed === term)) return false
  return /^[A-Z][A-Za-z]+(\s+[A-Za-z()/&-]+){1,}$/.test(trimmed)
}

function containsMixedLanguage(value) {
  if (typeof value !== "string") return false
  const hasCjk = /[一-鿿]/.test(value)
  const longEnglishRun = /[A-Za-z]+(\s+[A-Za-z]+){2,}/.test(value)
  if (!hasCjk || !longEnglishRun) return false
  return !INTENTIONAL_ENGLISH.some(term => value.includes(term))
}

// Build a localization gap report over a corpus of module strings.
export function buildLocalizationGapReport({
  corpus = [],
  terms = terminologyCn,
  rules = translationRules,
  modules = LOCALIZATION_AUDIT_MODULES,
} = {}) {
  const items = Array.isArray(corpus) ? corpus.filter(item => typeof item === "string") : flattenCorpus(corpus).split("\n")
  const text = items.join("\n")

  const untranslatedItems = [...new Set(items.filter(looksLikeEnglishTitle))]
  const mixedLanguageItems = [...new Set(items.filter(containsMixedLanguage))]
  const inconsistentTerms = findDuplicateTranslations(terms).map(row => ({ zh: row.zh, keys: row.keys }))
  const deprecatedTerms = Object.entries(rules.forbiddenTranslations || {}).flatMap(([canonical, phrases]) =>
    (phrases || []).filter(phrase => text.includes(phrase)).map(phrase => ({ canonical, deprecated: phrase, expected: rules.canonicalTranslations?.[canonical] || "" })),
  )

  return {
    generatedAt: "2026-06",
    modules,
    scannedItemCount: items.length,
    untranslatedItems,
    mixedLanguageItems,
    inconsistentTerms,
    deprecatedTerms,
    clean: untranslatedItems.length === 0 && mixedLanguageItems.length === 0 && inconsistentTerms.length === 0 && deprecatedTerms.length === 0,
    notFinalRecommendation: true,
  }
}
