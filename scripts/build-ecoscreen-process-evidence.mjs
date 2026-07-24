import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const args = process.argv.slice(2)
const valueFor = (flag, fallback) => {
  const index = args.indexOf(flag)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const conditionsPath = valueFor(
  "--conditions",
  "/private/tmp/ecomof-fair-mofs/complete_experimental_synthetic_conditions.json",
)
const doiMapPath = valueFor(
  "--doi-map",
  "/private/tmp/ecomof-fair-mofs/doi_refcode.json",
)
const outputPath = valueFor(
  "--output",
  "public/data/ecoscreen_candidate_process_evidence_v1.json",
)
const summaryOutputPath = valueFor(
  "--summary-output",
  "public/data/ecoscreen_candidate_process_evidence_summary_v1.json",
)

const [conditions, doiMap] = await Promise.all([
  readFile(conditionsPath, "utf8").then(JSON.parse),
  readFile(doiMapPath, "utf8").then(JSON.parse),
])

const doiByRefcode = {}
for (const [doi, refcodes] of Object.entries(doiMap || {})) {
  for (const refcode of refcodes || []) {
    if (!doiByRefcode[refcode]) doiByRefcode[refcode] = doi
  }
}

const hasValue = value => {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === "object") return Object.keys(value).length > 0
  return value !== null && value !== undefined && value !== ""
}

const flattenNumeric = value => {
  const queue = Array.isArray(value) ? [...value] : [value]
  const values = []
  while (queue.length) {
    const item = queue.shift()
    if (Array.isArray(item)) {
      queue.push(...item)
    } else if (item && typeof item === "object") {
      if ("value" in item) queue.push(item.value)
    } else {
      const numeric = Number(item)
      if (Number.isFinite(numeric)) values.push(numeric)
    }
  }
  return values
}

const firstText = value => {
  const row = Array.isArray(value) ? value.find(Boolean) : value
  return row === null || row === undefined ? null : String(row)
}

const normalizeTemperatureC = value => {
  const numeric = flattenNumeric(value)[0]
  if (!Number.isFinite(numeric)) return null
  return Number((numeric > 200 ? numeric - 273.15 : numeric).toFixed(2))
}

const normalizeTimeHours = value => {
  const numeric = flattenNumeric(value)[0]
  return Number.isFinite(numeric) ? Number(numeric.toFixed(3)) : null
}

const METALS = [
  "Zr", "Hf", "Ti", "Cr", "Mo", "W", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Cd", "Hg", "Al", "Ga", "In", "Mg", "Ca", "Sr", "Ba", "V", "Ce", "La",
]

const inferMetalNode = precursors => {
  const joined = (precursors || []).join(" ")
  const matches = METALS.filter(symbol => new RegExp(`(^|[^A-Za-z])${symbol}(?=[^a-z]|$)`).test(joined))
  return matches.length === 1 ? matches[0] : "pending"
}

const coverageFields = [
  ["metalPrecursor", "mof_metal_precursor"],
  ["organicLinker", "mof_organic_linker_reagent"],
  ["reactionQuantities", "mof_reaction_quanties"],
  ["synthesisRoute", "mof_synthesis_method"],
  ["synthesisSolvent", "mof_solvent"],
  ["synthesisTemperature", "mof_reaction_temperature"],
  ["synthesisTime", "mof_reaction_time"],
  ["dryingTemperature", "mof_drying_temperature"],
]

const summary = {
  sourceRecordCount: Object.keys(conditions || {}).length,
  emittedRecordCount: 0,
  recordsWithDoi: 0,
  recordsWithAtLeastFiveProcessFields: 0,
  fieldCoverage: Object.fromEntries(coverageFields.map(([field]) => [field, 0])),
  hardBlockerCoverage: {
    yield: 0,
    massBalance: 0,
    measuredSynthesisEnergy: 0,
    solventRecovery: 0,
    workingCapacity: 0,
    cycleStability: 0,
    regenerationEnergy: 0,
  },
}

const records = Object.entries(conditions || {}).map(([refcode, raw]) => {
  const fieldStatus = {}
  let availableProcessFields = 0
  for (const [field, sourceField] of coverageFields) {
    const available = hasValue(raw[sourceField])
    fieldStatus[field] = available ? "text_mined_experimental" : "missing"
    if (available) {
      availableProcessFields += 1
      summary.fieldCoverage[field] += 1
    }
  }
  if (availableProcessFields >= 5) summary.recordsWithAtLeastFiveProcessFields += 1

  const doi = doiByRefcode[refcode] || null
  if (doi) summary.recordsWithDoi += 1
  const metalPrecursors = raw.mof_metal_precursor || []
  const organicLinkers = raw.mof_organic_linker_reagent || []
  const solvents = raw.mof_solvent || []
  const aliases = raw.alias || []
  const metalNode = inferMetalNode(metalPrecursors)

  return {
    candidateId: `FAIR_MOF_${refcode}`,
    id: `FAIR_MOF_${refcode}`,
    displayName: aliases[0] || refcode,
    name: aliases[0] || refcode,
    rawName: refcode,
    sourceDatabase: "FAIR-MOFs synthesis conditions",
    sourceRecordId: refcode,
    doi,
    evidenceStatus: "candidate_process_evidence",
    evidenceLevel: "B",
    dataGrade: "text-mined-experimental",
    confidence_Q: 0.72,
    metalNode,
    metalPrecursor: metalPrecursors,
    linker: organicLinkers.length ? organicLinkers.join(" + ") : "pending",
    synthesisRoute: firstText(raw.mof_synthesis_method),
    synthesisSolvent: solvents.length ? solvents.join(" + ") : null,
    synthesisTemperatureC: normalizeTemperatureC(raw.mof_reaction_temperature),
    synthesisTimeHours: normalizeTimeHours(raw.mof_reaction_time),
    dryingTemperatureC: normalizeTemperatureC(raw.mof_drying_temperature),
    reactionQuantities: raw.mof_reaction_quanties || {},
    synthesisPrecaution: raw.mof_synthesis_precaution || null,
    yieldPct: null,
    massBalance: null,
    synthesisEnergyKwhPerKg: null,
    solventRecoveryPct: null,
    workingCapacityKgCo2PerKgMofCycle: null,
    cycleCount: null,
    regenerationKwhPerKgCo2: null,
    processEvidence: {
      sourceType: "text_mined_experimental_protocol",
      fieldStatus,
      availableProcessFields,
      totalProcessFields: coverageFields.length,
    },
    lcaInventoryEligible: false,
    serviceComparisonEligible: false,
    conclusionBoundary: "Real text-mined synthesis evidence; not a mass-balanced LCI and not a third-party-reviewed comparative LCA.",
    notFinalRecommendation: true,
  }
})

summary.emittedRecordCount = records.length
for (const field of Object.keys(summary.fieldCoverage)) {
  summary.fieldCoverage[field] = {
    count: summary.fieldCoverage[field],
    rate: Number((summary.fieldCoverage[field] / Math.max(1, records.length)).toFixed(4)),
  }
}

const output = {
  schemaVersion: "ecoscreen-candidate-process-evidence-v1",
  generatedAt: "2026-07-24",
  status: "candidate-process-evidence-layer",
  source: {
    id: "FAIR-MOFS-2025",
    title: "FAIR-MOFs: A Comprehensive Database for Accelerating the Discovery and Synthesis of Metal-Organic Frameworks",
    datasetDoi: "10.5281/zenodo.13254307",
    sourceUrl: "https://zenodo.org/records/13254307",
    license: "CC BY 4.0",
    retrievedAt: "2026-07-24",
    inputFiles: [
      "complete_experimental_synthetic_conditions.json",
      "doi_refcode.json",
    ],
    transformationScript: path.relative(process.cwd(), import.meta.filename),
  },
  summary,
  evidenceBoundaryZh: "该层补充候选级真实文献合成条件和 DOI，但文本挖掘字段仍需原文复核；数据集不提供统一产率、单位产品能耗、溶剂回收率或长期循环证据，因此这些字段继续作为比较性 LCA 的硬门控。",
  evidenceBoundaryEn: "This layer adds candidate-level literature synthesis conditions and DOIs, but text-mined fields still require source-paper review. The dataset does not provide harmonized yield, energy per product, solvent recovery, or long-cycle evidence, so those remain hard gates for comparative LCA.",
  records,
}

const summaryOutput = {
  schemaVersion: "ecoscreen-candidate-process-evidence-summary-v1",
  generatedAt: output.generatedAt,
  status: output.status,
  source: output.source,
  summary: output.summary,
  evidenceBoundaryZh: output.evidenceBoundaryZh,
  evidenceBoundaryEn: output.evidenceBoundaryEn,
}

await Promise.all([
  writeFile(outputPath, `${JSON.stringify(output)}\n`),
  writeFile(summaryOutputPath, `${JSON.stringify(summaryOutput)}\n`),
])
console.log(JSON.stringify({
  outputPath,
  summaryOutputPath,
  summary,
}, null, 2))
