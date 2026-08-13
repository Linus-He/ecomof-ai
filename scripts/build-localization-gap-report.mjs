// V2.4 localization gap report generator (offline, self-contained).
//
// Scans the first-level module source files for string literals, then reports untranslated
// English titles, mixed-language items, inconsistent terms, and deprecated terms, and
// writes public/data/localization_gap_report.json. Intentional English (proper nouns, data
// labels, scientific boundary terms such as Database Preview / Not Final Recommendation) is
// allow-listed and not flagged.
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

const LOCALIZATION_AUDIT_MODULES = [
  "Methods & Evidence", "Project Evolution", "Research Reports", "EcoScreen", "MOF Library",
  "GasSep", "Catalysis Lab", "Model Validation Lab", "Data Quality Audit", "Roadmap",
  "Milestones", "Release Notes",
]
const INTENTIONAL_ENGLISH = [
  "EcoMOF-AI", "EcoScreen", "GasSep", "CRITIC", "DOI", "MOF", "MOFs", "CO2", "CO₂",
  "Database Preview", "Not Final Recommendation", "GitHub Stars", "GitHub",
  "Candidates", "Research Outputs Framework", "Full Localization Refactor", "ML",
  "Run ID", "Open MOF Seed", "QMOF", "CoRE", "PXRD", "DFT", "BET", "ICP", "XRD",
  "Organic Acid",
]
const MODULE_FILES = [
  "src/components/tabs/HomeTab.tsx",
  "src/components/tabs/ProjectEvolutionTab.jsx",
  "src/components/tabs/ResearchReportsTab.jsx",
  "src/components/tabs/MethodsLimitationsTab.tsx",
  "src/components/tabs/EcoScreenTab.tsx",
  "src/components/tabs/MOFLibraryTab.tsx",
  "src/components/tabs/GasSepTab.tsx",
  "src/components/tabs/CatalysisLabTab.tsx",
  "src/components/tabs/DataSourcesTab.tsx",
  "src/components/screening-trace/ScreeningTraceTimeline.jsx",
  "src/components/layout/index.tsx",
  "src/components/methodology/model-validation/ModelValidationLab.jsx",
]

function readJson(rel) {
  const full = path.join(repoRoot, rel)
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, "utf8")) : {}
}

function looksLikeEnglishTitle(s) {
  const trimmed = s.trim()
  if (!trimmed || /[一-鿿]/.test(trimmed)) return false
  if (INTENTIONAL_ENGLISH.includes(trimmed)) return false
  return /^[A-Z][A-Za-z]+(\s+[A-Za-z()/&-]+){1,}$/.test(trimmed)
}
function containsMixedLanguage(s) {
  if (!/[一-鿿]/.test(s)) return false
  if (!/[A-Za-z]+(\s+[A-Za-z]+){2,}/.test(s)) return false
  return !INTENTIONAL_ENGLISH.some(term => s.includes(term))
}

function extractStrings(source) {
  const out = []
  const re = /["']([^"'\\\n]{3,80})["']/g
  let m
  while ((m = re.exec(source))) {
    const s = m[1]
    if (/[./\\]/.test(s) && !/\s/.test(s)) continue
    if (/^[a-z0-9-]+$/.test(s)) continue
    if (/^#|^https?:|^[0-9]|px$|%$|rgb|^[a-z-]+:[a-z]/.test(s)) continue
    if (/^[a-z][a-zA-Z]+$/.test(s)) continue
    out.push(s)
  }
  return out
}

function extractHardcodedJsxText(source) {
  const out = []
  const re = />([^<>{}\n]{3,120})</g
  let m
  while ((m = re.exec(source))) {
    const value = m[1].trim()
    if (value) out.push(value)
  }
  return out
}

const terminologyCn = readJson("src/i18n/terminology_cn.json")
const rules = readJson("src/i18n/translation_rules.json")

// English strings that are the `en` argument of a text(lang, "zh", "en") pair (or the zh
// side) are correctly bilingual, not untranslated. Collect them so they are not flagged.
function collectBilingualPairs(source, pairedEn, pairedZh) {
  const re = /(?:text\(\s*lang\s*,|txt\()\s*["']([^"'\\\n]{1,120})["']\s*,\s*["']([^"'\\\n]{1,120})["']\s*\)/g
  let m
  while ((m = re.exec(source))) {
    pairedZh.add(m[1])
    pairedEn.add(m[2])
  }
  const ternary = /(?:lang\s*===\s*["']zh["']|zh)\s*\?\s*["']([^"'\\\n]{1,120})["']\s*:\s*["']([^"'\\\n]{1,120})["']/g
  while ((m = ternary.exec(source))) {
    pairedZh.add(m[1])
    pairedEn.add(m[2])
  }
  const arrayPair = /\[\s*["']([^"'\\\n]{1,120})["']\s*,\s*["']([^"'\\\n]*[一-鿿][^"'\\\n]*)["']/g
  while ((m = arrayPair.exec(source))) {
    pairedEn.add(m[1])
    pairedZh.add(m[2])
  }
  const propertyPair = /(?:title|label|summary|description|note|body|purpose|implementation|inputs|outputs|boundary|meaning|explanation):\s*["']([^"'\\\n]{1,120})["']\s*,\s*(?:title|label|summary|description|note|body|purpose|implementation|inputs|outputs|boundary|meaning|explanation)Zh:\s*["']([^"'\\\n]{1,120})["']/g
  while ((m = propertyPair.exec(source))) {
    pairedEn.add(m[1])
    pairedZh.add(m[2])
  }
}

const corpus = []
const hardcodedJsxText = []
const pairedEn = new Set()
const pairedZh = new Set()
for (const rel of MODULE_FILES) {
  const full = path.join(repoRoot, rel)
  if (!fs.existsSync(full)) continue
  const source = fs.readFileSync(full, "utf8")
  collectBilingualPairs(source, pairedEn, pairedZh)
  corpus.push(...extractStrings(source))
  hardcodedJsxText.push(...extractHardcodedJsxText(source))
}
const text = corpus.join("\n")

// Duplicate Chinese translations (inconsistent terms).
const byZh = new Map()
for (const [key, record] of Object.entries(terminologyCn)) {
  const zh = record?.zh
  if (!zh) continue
  if (!byZh.has(zh)) byZh.set(zh, [])
  byZh.get(zh).push(key)
}
const inconsistentTerms = [...byZh.entries()].filter(([, keys]) => keys.length > 1).map(([zh, keys]) => ({ zh, keys }))

const untranslatedItems = [...new Set(hardcodedJsxText.filter(s => looksLikeEnglishTitle(s) && !pairedEn.has(s)))]
const mixedLanguageItems = [...new Set(corpus.filter(s => containsMixedLanguage(s) && !pairedZh.has(s)))]
const deprecatedTerms = Object.entries(rules.forbiddenTranslations || {}).flatMap(([canonical, phrases]) => {
  const expected = rules.canonicalTranslations?.[canonical] || ""
  return (phrases || [])
    // Skip a forbidden phrase that is only matched as a substring of the correct
    // canonical term (e.g. "路线图" inside the correct "发展路线图").
    .filter(phrase => !(expected && expected.includes(phrase) && !text.split("\n").some(line => line.includes(phrase) && !line.includes(expected))))
    .filter(phrase => text.includes(phrase))
    .map(phrase => ({ canonical, deprecated: phrase, expected }))
})

const report = {
  generatedAt: "2026-07-31",
  modules: LOCALIZATION_AUDIT_MODULES,
  scannedItemCount: corpus.length,
  untranslatedItems,
  mixedLanguageItems,
  inconsistentTerms,
  deprecatedTerms,
  clean: untranslatedItems.length === 0 && mixedLanguageItems.length === 0 && inconsistentTerms.length === 0 && deprecatedTerms.length === 0,
  notFinalRecommendation: true,
}

const outFile = path.join(repoRoot, "public", "data", "localization_gap_report.json")
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`)

console.log(`Localization gap report written to ${path.relative(repoRoot, outFile)}`)
console.log(`scanned=${report.scannedItemCount} · untranslated=${report.untranslatedItems.length} · mixed=${report.mixedLanguageItems.length} · inconsistent=${report.inconsistentTerms.length} · deprecated=${report.deprecatedTerms.length} · clean=${report.clean}`)
if (report.untranslatedItems.length) console.log(`untranslated sample: ${report.untranslatedItems.slice(0, 15).join(" | ")}`)
if (report.mixedLanguageItems.length) console.log(`mixed sample: ${report.mixedLanguageItems.slice(0, 10).join(" | ")}`)
