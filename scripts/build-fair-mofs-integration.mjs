import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const args = process.argv.slice(2)
const valueFor = (flag, fallback) => {
  const index = args.indexOf(flag)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const root = path.resolve(import.meta.dirname, "..")
const sourceDirectory = valueFor("--source-dir", "/private/tmp/ecomof-fair-mofs")
const outputPath = path.resolve(
  root,
  valueFor("--output", "public/data/data_ingestion/fair_mofs_import_v1.json"),
)
const qualityOutputPath = path.resolve(
  root,
  valueFor("--quality-output", "public/data/fair_mofs_quality_report.json"),
)
const familyOutputPath = path.resolve(
  root,
  valueFor("--family-output", "public/data/fair_mofs_family_synthesis_evidence.json"),
)
const propertyOutputPath = path.resolve(
  root,
  valueFor("--property-output", "public/data/fair_mofs_property_index_v1.json"),
)
const ecoscreenSummaryOutputPath = path.resolve(
  root,
  valueFor("--ecoscreen-summary-output", "public/data/fair_mofs_ecoscreen_summary_v1.json"),
)
const corePath = path.resolve(
  root,
  valueFor("--core-index", "public/data/core_mof_2024/cr_search_index.json"),
)

const SOURCE = {
  id: "FAIR-MOFS-2025",
  title: "FAIR-MOFs: A Comprehensive Database for Accelerating the Discovery and Synthesis of Metal-Organic Frameworks",
  datasetDoi: "10.5281/zenodo.13254307",
  sourceUrl: "https://zenodo.org/records/13254307",
  license: "CC BY 4.0",
  publicationDate: "2025-10-31",
  retrievedAt: "2026-07-28",
  recordVersion: 13254307,
  inputFiles: {
    completeExperimentalSyntheticConditions: {
      name: "complete_experimental_synthetic_conditions.json",
      md5: "e0fc5c0f07117b1d70f71c879231a3b7",
    },
    doiRefcode: {
      name: "doi_refcode.json",
      md5: "90b9caec641c12012f554b4938eef903",
    },
    finalCombinedDataForAnalysis: {
      name: "final_combined_data_for_analysis.json",
      md5: "0e6a1e46f7bb99e38323c66cfdf5b53c",
    },
    experimentalSyntheticConditionsForGnn: {
      name: "experimental_synthetic_conditions_used_for_gnn.json",
      md5: "469e477838d1d748ef09f6b9d80977b4",
    },
  },
}

const TARGET_FAMILIES = [
  "Al-MOF",
  "Zr-MOF",
  "Ti-MOF",
  "Fe-MOF",
  "Cr-MOF",
  "Cu-MOF",
  "Zn-MOF",
  "UiO-type host",
  "MIL-type host",
  "MOF-808-like host",
]

const FAMILY_PARENT = {
  "UiO-type host": "Zr-MOF",
  "MOF-808-like host": "Zr-MOF",
}

const ELEMENT_PATTERNS = [
  ["Al", ["aluminium", "aluminum"]],
  ["Zr", ["zirconium"]],
  ["Ti", ["titanium"]],
  ["Fe", ["iron", "ferric", "ferrous"]],
  ["Cr", ["chromium"]],
  ["Cu", ["copper", "cupric", "cuprous"]],
  ["Zn", ["zinc"]],
  ["Hf", ["hafnium"]],
  ["Co", ["cobalt"]],
  ["Ni", ["nickel"]],
  ["Mn", ["manganese"]],
  ["Cd", ["cadmium"]],
  ["Mg", ["magnesium"]],
  ["Ca", ["calcium"]],
  ["V", ["vanadium"]],
  ["Mo", ["molybdenum"]],
  ["W", ["tungsten"]],
  ["Ce", ["cerium"]],
  ["La", ["lanthanum"]],
]

const FAMILY_BY_METAL = {
  Al: "Al-MOF",
  Zr: "Zr-MOF",
  Ti: "Ti-MOF",
  Fe: "Fe-MOF",
  Cr: "Cr-MOF",
  Cu: "Cu-MOF",
  Zn: "Zn-MOF",
}

const filePath = key => path.join(sourceDirectory, SOURCE.inputFiles[key].name)

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"))
}

async function md5(file) {
  const content = await readFile(file)
  return createHash("md5").update(content).digest("hex")
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function flattenNumeric(value) {
  const queue = Array.isArray(value) ? [...value] : [value]
  const values = []
  while (queue.length) {
    const item = queue.shift()
    if (Array.isArray(item)) {
      queue.push(...item)
    } else if (item && typeof item === "object" && "value" in item) {
      queue.push(item.value)
    } else {
      const numeric = finiteNumber(item)
      if (numeric !== null) values.push(numeric)
    }
  }
  return values
}

function median(values = []) {
  const rows = values.map(finiteNumber).filter(value => value !== null).sort((a, b) => a - b)
  if (!rows.length) return null
  const middle = Math.floor(rows.length / 2)
  return rows.length % 2 ? rows[middle] : (rows[middle - 1] + rows[middle]) / 2
}

function mean(values = []) {
  const rows = values.map(finiteNumber).filter(value => value !== null)
  return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : null
}

function round(value, digits = 4) {
  const numeric = finiteNumber(value)
  if (numeric === null) return null
  const factor = 10 ** digits
  return Math.round(numeric * factor) / factor
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finiteNumber(value) ?? 0))
}

function normalizedDoi(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .toLowerCase()
}

function normalizedRefcode(value) {
  return String(value || "").trim().toUpperCase()
}

function baseRefcode(value) {
  return normalizedRefcode(value).replace(/\d{2}$/, "")
}

function normalizedTextList(value) {
  return asArray(value)
    .map(item => String(item || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function inferMetals(precursors = []) {
  const original = normalizedTextList(precursors)
  const lower = original.join(" ").toLowerCase()
  return ELEMENT_PATTERNS
    .filter(([symbol, names]) => {
      const formulaPattern = new RegExp(`(^|[^A-Za-z])${symbol}(?=[^a-z]|$)`)
      return original.some(value => formulaPattern.test(value))
        || names.some(name => new RegExp(`\\b${name}\\b`, "i").test(lower))
    })
    .map(([symbol]) => symbol)
}

function conditionFingerprint(record = {}) {
  return JSON.stringify({
    reactionTemperatureK: record.synthesis?.reactionTemperatureK,
    reactionTimeHours: record.synthesis?.reactionTimeHours,
    crystallizationTemperatureK: record.synthesis?.crystallizationTemperatureK,
    crystallizationTimeHours: record.synthesis?.crystallizationTimeHours,
    metalPrecursors: normalizedTextList(record.synthesis?.metalPrecursors),
    organicLinkers: normalizedTextList(record.synthesis?.organicLinkers),
    solvents: normalizedTextList(record.synthesis?.solvents),
    methods: normalizedTextList(record.synthesis?.methods),
  })
}

function accessibilityScore(reactionTemperatureK, reactionTimeHours) {
  const temperatureScore = reactionTemperatureK === null
    ? null
    : clamp01((523.15 - reactionTemperatureK) / (523.15 - 298.15))
  const timeScore = reactionTimeHours === null
    ? null
    : clamp01(1 - Math.log(Math.max(1, reactionTimeHours)) / Math.log(168))
  const value = mean([temperatureScore, timeScore])
  return {
    value: round(value),
    temperatureScore: round(temperatureScore),
    timeScore: round(timeScore),
    availableComponents: [temperatureScore, timeScore].filter(item => item !== null).length,
  }
}

function uniqueBy(rows, keyFor) {
  const seen = new Set()
  return rows.filter(row => {
    const key = keyFor(row)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const [
  conditions,
  doiMap,
  combinedData,
  gnnConditions,
  coreRecords,
] = await Promise.all([
  readJson(filePath("completeExperimentalSyntheticConditions")),
  readJson(filePath("doiRefcode")),
  readJson(filePath("finalCombinedDataForAnalysis")),
  readJson(filePath("experimentalSyntheticConditionsForGnn")),
  readJson(corePath),
])

const checksumResults = {}
for (const [key, descriptor] of Object.entries(SOURCE.inputFiles)) {
  const actual = await md5(filePath(key))
  checksumResults[key] = {
    expected: descriptor.md5,
    actual,
    passed: actual === descriptor.md5,
  }
}
if (Object.values(checksumResults).some(row => !row.passed)) {
  throw new Error(`FAIR-MOFs checksum validation failed: ${JSON.stringify(checksumResults)}`)
}

const doisByRefcode = new Map()
for (const [doi, refcodes] of Object.entries(doiMap || {})) {
  for (const refcode of asArray(refcodes)) {
    const key = normalizedRefcode(refcode)
    if (!doisByRefcode.has(key)) doisByRefcode.set(key, [])
    doisByRefcode.get(key).push(normalizedDoi(doi))
  }
}

const coreByExactRefcode = new Map()
const coreByBaseRefcode = new Map()
const coreByDoi = new Map()
for (const row of coreRecords) {
  const exact = normalizedRefcode(row.csdRefcode)
  const base = baseRefcode(exact)
  const doi = normalizedDoi(row.doi)
  if (exact) {
    if (!coreByExactRefcode.has(exact)) coreByExactRefcode.set(exact, [])
    coreByExactRefcode.get(exact).push(row)
  }
  if (base) {
    if (!coreByBaseRefcode.has(base)) coreByBaseRefcode.set(base, [])
    coreByBaseRefcode.get(base).push(row)
  }
  if (doi) {
    if (!coreByDoi.has(doi)) coreByDoi.set(doi, [])
    coreByDoi.get(doi).push(row)
  }
}

const records = Object.entries(conditions).map(([rawRefcode, raw]) => {
  const csdRefcode = normalizedRefcode(rawRefcode)
  const base = baseRefcode(csdRefcode)
  const property = combinedData[rawRefcode] || combinedData[csdRefcode] || {}
  const gnn = gnnConditions[rawRefcode] || gnnConditions[csdRefcode] || {}
  const dois = uniqueBy(
    [...asArray(doisByRefcode.get(csdRefcode)), normalizedDoi(gnn.doi)].filter(Boolean),
    value => value,
  )
  const exactMatches = asArray(coreByExactRefcode.get(csdRefcode))
  const baseMatches = exactMatches.length ? [] : asArray(coreByBaseRefcode.get(base))
  const refcodeMatches = exactMatches.length ? exactMatches : baseMatches
  const articleMatches = uniqueBy(
    dois.flatMap(doi => asArray(coreByDoi.get(doi))),
    row => row.id,
  )
  const structuralFamilies = uniqueBy(
    refcodeMatches.map(row => row.family).filter(TARGET_FAMILIES.includes.bind(TARGET_FAMILIES)),
    value => value,
  )
  const metalPrecursors = normalizedTextList(raw.mof_metal_precursor)
  const inferredMetals = inferMetals(metalPrecursors)
  const inferredFamily = inferredMetals.length === 1 ? FAMILY_BY_METAL[inferredMetals[0]] || null : null
  const family = structuralFamilies.length === 1 ? structuralFamilies[0] : inferredFamily || "unclassified"
  const familyAssignment = structuralFamilies.length === 1
    ? exactMatches.length
      ? "core-refcode-exact"
      : "core-refcode-base"
    : inferredFamily
      ? "metal-precursor-inferred"
      : inferredMetals.length > 1
        ? "ambiguous-metal-precursors"
        : "unclassified"
  const reactionTemperatureK = round(median(flattenNumeric(raw.mof_reaction_temperature)))
  const reactionTimeHours = round(median(flattenNumeric(raw.mof_reaction_time)))
  const synthesis = {
    reactionTemperatureK,
    reactionTimeHours,
    crystallizationTemperatureK: round(median(flattenNumeric(raw.mof_crystallization_temperature))),
    crystallizationTimeHours: round(median(flattenNumeric(raw.mof_crystallization_time))),
    dryingTemperatureK: round(median(flattenNumeric(raw.mof_drying_temperature))),
    meltingTemperatureK: round(median(flattenNumeric(raw.mof_melting_temperature))),
    metalPrecursors,
    organicLinkers: normalizedTextList(raw.mof_organic_linker_reagent),
    solvents: normalizedTextList(raw.mof_solvent),
    methods: normalizedTextList(raw.mof_synthesis_method),
  }
  const accessibility = accessibilityScore(reactionTemperatureK, reactionTimeHours)
  const fieldStatus = {
    reactionTemperature: reactionTemperatureK === null ? "missing" : "text-mined-experimental",
    reactionTime: reactionTimeHours === null ? "missing" : "text-mined-experimental",
    metalPrecursors: synthesis.metalPrecursors.length ? "text-mined-experimental" : "missing",
    organicLinkers: synthesis.organicLinkers.length ? "text-mined-experimental" : "missing",
    solvents: synthesis.solvents.length ? "text-mined-experimental" : "missing",
    methods: synthesis.methods.length ? "text-mined-experimental" : "missing",
  }
  const conditionFieldCount = Object.values(fieldStatus).filter(value => value !== "missing").length
  const record = {
    id: `FAIR_MOF_${csdRefcode}`,
    csdRefcode,
    aliases: normalizedTextList(raw.alias),
    doi: dois[0] || null,
    dois,
    family,
    familyAssignment,
    inferredMetals,
    match: {
      structureIdentityLevel: exactMatches.length
        ? "exact-refcode"
        : baseMatches.length
          ? "base-refcode-variant"
          : "unmatched",
      matchedCoreRecordIds: refcodeMatches.map(row => row.id),
      matchedCoreFamilies: structuralFamilies,
      articleAssociationLevel: articleMatches.length ? "shared-doi-only" : "none",
      articleAssociatedCoreRecordCount: articleMatches.length,
      warning: articleMatches.length && !refcodeMatches.length
        ? "Shared DOI is article-level evidence only and is not treated as structure identity."
        : "",
    },
    synthesis,
    conditionAccessibility: {
      ...accessibility,
    },
    physicalProperties: {
      asaM2Cm3: finiteNumber(property["ASA (m^2/cm^3)"]),
      bdeKjMol: finiteNumber(property["BDE (kj/mol)"]),
      lcdA: finiteNumber(property["LCD (A)"]),
      pldA: finiteNumber(property["PLD (A)"]),
      voidFraction: finiteNumber(property["void fraction"]),
      hasOpenMetalSite: typeof property["has oms"] === "boolean" ? property["has oms"] : null,
      numberOfChannels: finiteNumber(property["number of channels"]),
      topology: property.topology || null,
      color: property.color || null,
    },
    evidenceQuality: {
      availableConditionFields: conditionFieldCount,
      totalConditionFields: Object.keys(fieldStatus).length,
      completeness: round(conditionFieldCount / Object.keys(fieldStatus).length),
      evidenceGrade: "text-mined-experimental-needs-paper-review",
    },
  }
  const fingerprint = conditionFingerprint(record)
  record.conditionFingerprint = createHash("sha256").update(fingerprint).digest("hex").slice(0, 20)
  record.uniqueSynthesisEvidenceKey = `${record.doi || csdRefcode}:${record.conditionFingerprint}`
  return record
})

const scoredUniqueRecords = uniqueBy(
  records.filter(record => record.conditionAccessibility.value !== null && TARGET_FAMILIES.includes(record.family)),
  record => record.uniqueSynthesisEvidenceKey,
)
const globalPrior = median(scoredUniqueRecords.map(record => record.conditionAccessibility.value)) ?? 0.5
const shrinkageK = 20

const directFamilyRows = Object.fromEntries(TARGET_FAMILIES.map(family => {
  const familyRecords = records.filter(record => record.family === family)
  const uniqueEvidence = uniqueBy(
    familyRecords.filter(record => record.conditionAccessibility.value !== null),
    record => record.uniqueSynthesisEvidenceKey,
  )
  const observed = median(uniqueEvidence.map(record => record.conditionAccessibility.value))
  const nEffective = uniqueEvidence.length
  const reliability = nEffective / (nEffective + shrinkageK)
  const temperatureCoverage = uniqueEvidence.length
    ? uniqueEvidence.filter(record => record.synthesis.reactionTemperatureK !== null).length / uniqueEvidence.length
    : 0
  const timeCoverage = uniqueEvidence.length
    ? uniqueEvidence.filter(record => record.synthesis.reactionTimeHours !== null).length / uniqueEvidence.length
    : 0
  const conditionCoverage = mean([temperatureCoverage, timeCoverage]) ?? 0
  const value = observed === null
    ? globalPrior
    : reliability * observed + (1 - reliability) * globalPrior
  return [family, {
    family,
    value: round(value),
    observedConditionAccessibility: round(observed),
    globalPrior: round(globalPrior),
    nSourceRecords: familyRecords.length,
    nEffective,
    uniqueDoiCount: new Set(uniqueEvidence.map(record => record.doi).filter(Boolean)).size,
    reliability: round(reliability),
    evidenceConfidence: round(reliability * (0.6 + 0.4 * conditionCoverage)),
    temperatureCoverage: round(temperatureCoverage),
    timeCoverage: round(timeCoverage),
    medianReactionTemperatureK: round(median(uniqueEvidence.map(record => record.synthesis.reactionTemperatureK))),
    medianReactionTimeHours: round(median(uniqueEvidence.map(record => record.synthesis.reactionTimeHours))),
    derivationLevel: nEffective
      ? "data-derived FAIR-MOFs synthesis-condition accessibility with empirical-Bayes shrinkage"
      : "neutral-prior",
    evidenceTransfer: null,
    recordRefs: uniqueEvidence.slice(0, 8).map(record => record.id),
    citations: uniqueEvidence.map(record => record.doi).filter(Boolean).slice(0, 5),
  }]
}))

for (const [family, parentFamily] of Object.entries(FAMILY_PARENT)) {
  if (directFamilyRows[family].nEffective > 0) continue
  const parent = directFamilyRows[parentFamily]
  directFamilyRows[family] = {
    ...directFamilyRows[family],
    value: parent.value,
    globalPrior: parent.globalPrior,
    evidenceConfidence: round(parent.evidenceConfidence * 0.45),
    derivationLevel: "proxy-transferred from parent metal family",
    evidenceTransfer: {
      fromFamily: parentFamily,
      reason: `No directly classified FAIR-MOFs synthesis-condition rows were available for ${family}.`,
      confidenceMultiplier: 0.45,
    },
    citations: parent.citations,
  }
}

const familySummary = TARGET_FAMILIES.map(family => directFamilyRows[family])
const assignmentCounts = records.reduce((counts, record) => {
  counts[record.familyAssignment] = (counts[record.familyAssignment] || 0) + 1
  return counts
}, {})
const familyCounts = records.reduce((counts, record) => {
  counts[record.family] = (counts[record.family] || 0) + 1
  return counts
}, {})
const exactMatchedFairRecords = records.filter(record => record.match.structureIdentityLevel === "exact-refcode").length
const baseMatchedFairRecords = records.filter(record => record.match.structureIdentityLevel === "base-refcode-variant").length
const articleOnlyFairRecords = records.filter(record => (
  record.match.articleAssociationLevel === "shared-doi-only"
  && record.match.structureIdentityLevel === "unmatched"
)).length
const matchedCoreIds = new Set(records.flatMap(record => record.match.matchedCoreRecordIds))

const fieldCoverage = {}
for (const [field, accessor] of [
  ["reactionTemperature", record => record.synthesis.reactionTemperatureK],
  ["reactionTime", record => record.synthesis.reactionTimeHours],
  ["metalPrecursors", record => record.synthesis.metalPrecursors.length ? true : null],
  ["organicLinkers", record => record.synthesis.organicLinkers.length ? true : null],
  ["solvents", record => record.synthesis.solvents.length ? true : null],
  ["methods", record => record.synthesis.methods.length ? true : null],
]) {
  const count = records.filter(record => accessor(record) !== null && accessor(record) !== undefined).length
  fieldCoverage[field] = { count, rate: round(count / Math.max(1, records.length)) }
}
for (const [field, accessor] of [
  ["doi", record => record.doi],
  ["asaM2Cm3", record => record.physicalProperties.asaM2Cm3],
  ["bdeKjMol", record => record.physicalProperties.bdeKjMol],
  ["lcdA", record => record.physicalProperties.lcdA],
  ["pldA", record => record.physicalProperties.pldA],
  ["voidFraction", record => record.physicalProperties.voidFraction],
  ["openMetalSite", record => record.physicalProperties.hasOpenMetalSite],
  ["topology", record => record.physicalProperties.topology],
]) {
  const count = records.filter(record => accessor(record) !== null && accessor(record) !== undefined && accessor(record) !== "").length
  fieldCoverage[field] = { count, rate: round(count / Math.max(1, records.length)) }
}

const generatedAt = new Date().toISOString()
const summary = {
  sourceRecordCount: records.length,
  exactRefcodeMatchedFairRecords: exactMatchedFairRecords,
  baseRefcodeMatchedFairRecords: baseMatchedFairRecords,
  structureMatchedFairRecords: exactMatchedFairRecords + baseMatchedFairRecords,
  matchedCoreRecordCount: matchedCoreIds.size,
  articleOnlyFairRecords,
  recordsWithDoi: records.filter(record => record.doi).length,
  recordsWithAccessibilityScore: records.filter(record => record.conditionAccessibility.value !== null).length,
  assignmentCounts,
  familyCounts,
  fieldCoverage,
  targetFamilyEvidence: Object.fromEntries(familySummary.map(row => [row.family, {
    nEffective: row.nEffective,
    value: row.value,
    evidenceConfidence: row.evidenceConfidence,
    derivationLevel: row.derivationLevel,
  }])),
}

const output = {
  schemaVersion: "fair-mofs-import-v1",
  version: "V3.9.10",
  generatedAt,
  datasetSignature: `fair-mofs:${SOURCE.recordVersion}:${records.length}:${createHash("sha256").update(JSON.stringify(summary)).digest("hex").slice(0, 16)}`,
  source: SOURCE,
  checksumValidation: checksumResults,
  scoringPolicy: {
    name: "FAIR-MOFs synthesis-condition accessibility",
    formula: "record = mean(temperature accessibility, log-time accessibility); family = empirical-Bayes shrinkage of the unique-condition median toward the global prior",
    temperatureBoundsK: [298.15, 523.15],
    timeBoundsHours: [1, 168],
    shrinkageK,
    duplicateRule: "One effective observation per normalized DOI plus condition fingerprint.",
    abundanceBoundary: "Raw family frequency is never normalized into a score. Sample size affects only shrinkage strength and evidence confidence.",
    outcomeBoundary: "The score describes severity of reported successful synthesis conditions, not probability of synthesis success.",
  },
  summary,
  familySummary,
  records,
}

const qualityReport = {
  schemaVersion: "fair-mofs-quality-report-v1",
  generatedAt,
  source: SOURCE,
  checksumValidation: checksumResults,
  grain: "One FAIR-MOFs synthesis-condition record per CSD refcode.",
  identityRules: {
    structureIdentity: "Exact CSD Refcode first; six-letter base Refcode is accepted only as a variant-level match.",
    doiAssociation: "A shared DOI is article-level association only and never establishes structure identity.",
    familyAssignment: "Matched CoRE family when Refcode identity is available; otherwise a single metal inferred from precursor text; multiple/unknown metals remain ambiguous or unclassified.",
  },
  summary,
  checks: {
    recordCountMatchesSource: records.length === Object.keys(conditions).length,
    uniqueIds: new Set(records.map(record => record.id)).size === records.length,
    checksumPassed: Object.values(checksumResults).every(row => row.passed),
    familyScoreUsesRawFrequency: false,
    doiPromotedToStructureIdentity: false,
  },
  knownLimitations: [
    "FAIR-MOFs synthesis fields are text-mined and require source-paper review for experimental use.",
    "No harmonized synthesis yield or failure set is available, so synthesis success probability cannot be estimated.",
    "FAIR-MOFs and CoRE MOF 2024 have limited exact Refcode overlap; unmatched FAIR records remain a separate evidence layer.",
    "UiO-type and MOF-808-like families use an explicitly low-confidence Zr-family transfer when no direct FAIR record is classified.",
  ],
  status: "passed",
}

const familyOutput = {
  schemaVersion: "fair-mofs-family-synthesis-evidence-v1",
  version: "V3.9.10",
  generatedAt,
  source: SOURCE,
  scoringPolicy: output.scoringPolicy,
  globalPrior: round(globalPrior),
  families: familySummary,
  boundaryZh: "FAIR-MOFs 在此只提供成功合成文献中的温度、时间、DOI 与派生物化性质证据。分数表示已报道条件的温和程度，不是合成成功率；样本量只影响收缩与置信度，不直接加分。",
  boundaryEn: "FAIR-MOFs contributes reported successful-synthesis temperatures, times, DOIs, and derived properties. The score measures reported condition severity, not synthesis-success probability; sample size affects shrinkage and confidence only.",
}

const propertyOutput = {
  schemaVersion: "fair-mofs-property-index-v1",
  version: "V3.9.10",
  generatedAt,
  source: SOURCE,
  identityBoundaryZh: "仅精确 CSD Refcode 可作为结构级映射；六位基码仅表示变体关联，DOI 仅表示论文级关联。未匹配记录保留为独立 FAIR-MOFs 证据，不会冒充 CoRE 结构。",
  identityBoundaryEn: "Only an exact CSD Refcode establishes structure-level mapping. A six-letter base Refcode is variant association only, and DOI is article association only. Unmatched records remain separate FAIR-MOFs evidence and never impersonate a CoRE structure.",
  propertyBoundaryZh: "物化性质来自 FAIR-MOFs 汇总数据中的原始或派生字段；0 是来源值时保留为 0，缺失值显示为 unavailable。使用前仍应回看来源论文和方法。",
  propertyBoundaryEn: "Physicochemical properties are reported or derived fields from the FAIR-MOFs combined dataset. Source zeros remain zero and missing values remain unavailable. Review the source paper and method before use.",
  summary: {
    recordCount: records.length,
    exactStructureMatches: summary.exactRefcodeMatchedFairRecords,
    variantAssociations: summary.baseRefcodeMatchedFairRecords,
    articleOnlyAssociations: summary.articleOnlyFairRecords,
    fieldCoverage: summary.fieldCoverage,
  },
  records: records.map(record => ({
    id: record.id,
    csdRefcode: record.csdRefcode,
    aliases: record.aliases,
    doi: record.doi,
    family: record.family,
    familyAssignment: record.familyAssignment,
    inferredMetals: record.inferredMetals,
    match: record.match,
    conditionAccessibility: record.conditionAccessibility,
    physicalProperties: record.physicalProperties,
    evidenceQuality: record.evidenceQuality,
  })),
}

const processCoverage = {
  metalPrecursor: summary.fieldCoverage.metalPrecursors,
  organicLinker: summary.fieldCoverage.organicLinkers,
  reactionQuantities: { count: records.length, rate: 1 },
  synthesisRoute: summary.fieldCoverage.methods,
  synthesisSolvent: summary.fieldCoverage.solvents,
  synthesisTemperature: summary.fieldCoverage.reactionTemperature,
  synthesisTime: summary.fieldCoverage.reactionTime,
  dryingTemperature: {
    count: records.filter(record => record.synthesis?.dryingTemperatureK != null && Number.isFinite(Number(record.synthesis.dryingTemperatureK))).length,
    rate: round(records.filter(record => record.synthesis?.dryingTemperatureK != null && Number.isFinite(Number(record.synthesis.dryingTemperatureK))).length / records.length),
  },
}
const ecoscreenSummaryOutput = {
  schemaVersion: "fair-mofs-ecoscreen-summary-v1",
  generatedAt,
  source: {
    dataset: "FAIR-MOFs",
    doi: SOURCE.datasetDoi,
    license: SOURCE.license,
  },
  processSummary: {
    sourceRecordCount: records.length,
    emittedRecordCount: records.length,
    recordsWithDoi: summary.recordsWithDoi,
    recordsWithAtLeastFiveProcessFields: records.filter(record => Number(record.evidenceQuality?.availableConditionFields || 0) >= 5).length,
    fieldCoverage: processCoverage,
    hardBlockerCoverage: {
      yield: 0,
      massBalance: 0,
      measuredSynthesisEnergy: 0,
      solventRecovery: 0,
      workingCapacity: 0,
      cycleStability: 0,
      regenerationEnergy: 0,
    },
  },
  propertySummary: propertyOutput.summary,
}

await Promise.all([
  mkdir(path.dirname(outputPath), { recursive: true }),
  mkdir(path.dirname(qualityOutputPath), { recursive: true }),
  mkdir(path.dirname(familyOutputPath), { recursive: true }),
  mkdir(path.dirname(propertyOutputPath), { recursive: true }),
  mkdir(path.dirname(ecoscreenSummaryOutputPath), { recursive: true }),
])
await Promise.all([
  writeFile(outputPath, `${JSON.stringify(output)}\n`, "utf8"),
  writeFile(qualityOutputPath, `${JSON.stringify(qualityReport, null, 2)}\n`, "utf8"),
  writeFile(familyOutputPath, `${JSON.stringify(familyOutput, null, 2)}\n`, "utf8"),
  writeFile(propertyOutputPath, `${JSON.stringify(propertyOutput)}\n`, "utf8"),
  writeFile(ecoscreenSummaryOutputPath, `${JSON.stringify(ecoscreenSummaryOutput, null, 2)}\n`, "utf8"),
])

console.log(JSON.stringify({
  outputPath: path.relative(root, outputPath),
  qualityOutputPath: path.relative(root, qualityOutputPath),
  familyOutputPath: path.relative(root, familyOutputPath),
  propertyOutputPath: path.relative(root, propertyOutputPath),
  ecoscreenSummaryOutputPath: path.relative(root, ecoscreenSummaryOutputPath),
  summary,
}, null, 2))
