import fs from "node:fs/promises"
import path from "node:path"
import { calculateIastSelectivity } from "../src/utils/gasIastSelectivity/index.js"

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, "public", "data")
const RETRIEVED_AT = process.env.ECOMOF_RETRIEVED_AT || "2026-06-29"
const NIST_BASE = "https://adsorption.nist.gov/isodb"
const TARGET_IAST_PAIRS = new Set(["CO2/N2", "CO2/CH4", "H2/CO2"])

const GAS_ALIASES = new Map([
  ["carbon dioxide", "CO2"],
  ["co2", "CO2"],
  ["curltugmzlyldi-uhfffaoysa-n", "CO2"],
  ["nitrogen", "N2"],
  ["n2", "N2"],
  ["ijgrmhoshxdmsa-uhfffaoysa-n", "N2"],
  ["methane", "CH4"],
  ["ch4", "CH4"],
  ["vnwktokethgbqd-uhfffaoysa-n", "CH4"],
  ["hydrogen", "H2"],
  ["h2", "H2"],
  ["ufhflcqgniynrp-uhfffaoysa-n", "H2"],
  ["oxygen", "O2"],
  ["o2", "O2"],
  ["mymofizgzyhomd-uhfffaoysa-n", "O2"],
])

const MOLAR_MASS = { CO2: 44.0095, N2: 28.0134, CH4: 16.043, H2: 2.01588, O2: 31.998 }

const EXTRA_ALIASES = [
  ["HKUST-1", "HKUST1", "Cu-BTC", "Cu3(BTC)2", "MOF-199", "mof199"],
  ["IRMOF-1", "IRMOF1", "MOF-5", "MOF5"],
  ["MOF-74", "MOF74", "CPO-27", "CPO27", "Mg-MOF-74", "Ni-MOF-74", "Co-MOF-74", "Zn-MOF-74"],
  ["UiO-66", "UiO66", "UiO-66-NH2", "UiO-66-NH₂"],
  ["ZIF-8", "ZIF8", "zeolitic imidazolate framework-8"],
  ["MIL-101", "MIL101", "MIL-101(Cr)", "MIL101Cr"],
  ["MIL-53", "MIL53", "MIL-53(Al)", "MIL53Al"],
]

const COMPOSITION_RULES = [
  { aliases: ["HKUST-1", "Cu-BTC", "MOF-199"], metal: ["Cu"], linker: ["BTC"], maxMatches: 4, confidence: 0.58 },
  { aliases: ["IRMOF-1", "MOF-5"], metal: ["Zn"], linker: ["BDC"], maxMatches: 4, confidence: 0.52 },
  { aliases: ["MOF-74", "CPO-27", "Mg-MOF-74", "Ni-MOF-74", "Co-MOF-74", "Zn-MOF-74"], metal: ["Mg", "Ni", "Co", "Zn"], linker: ["DOBDC"], maxMatches: 6, confidence: 0.5 },
  { aliases: ["UiO-66", "UiO-66-NH2", "UiO-66-NH₂"], metal: ["Zr"], linker: ["BDC"], maxMatches: 5, confidence: 0.48 },
  { aliases: ["MIL-101"], metal: ["Cr"], linker: ["BDC"], maxMatches: 5, confidence: 0.46 },
  { aliases: ["MIL-53"], metal: ["Al", "Cr", "Fe"], linker: ["BDC"], maxMatches: 5, confidence: 0.44 },
]

async function readJson(relativePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, relativePath), "utf8"))
  } catch {
    return fallback
  }
}

async function writeJson(relativePath, data) {
  await fs.writeFile(path.join(DATA_DIR, relativePath), `${JSON.stringify(data, null, 2)}\n`)
}

function slug(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "record"
}

function normalizeName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)])
    .replace(/\bmetal organic framework\b/g, "mof")
    .replace(/\bcu\s*3?\s*\(?btc\)?\s*2?\b/g, "cu-btc")
    .replace(/\s+/g, " ")
    .replace(/[\[\]{}()'"]/g, "")
    .replace(/[–—−_]/g, "-")
    .replace(/[^a-z0-9+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function canonicalIdForName(value = "") {
  return `mof-${slug(normalizeName(value))}`
}

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function gasFormula(value = "") {
  const normalized = String(value).toLowerCase().replace(/\s+/g, " ").trim()
  return GAS_ALIASES.get(normalized) || GAS_ALIASES.get(normalized.replace(/-/g, " ")) || null
}

function sourceUrlFor(filename) {
  return `${NIST_BASE}/api/isotherm/${encodeURIComponent(filename)}.json`
}

function convertUptake(value, unit, gas) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const normalized = String(unit || "").toLowerCase().replace(/\s+/g, "")
  if (["mmol/g", "mmolg-1", "mmol/gadsorbent"].includes(normalized)) return number
  if (["mol/kg", "mole/kg", "molkg-1"].includes(normalized)) return number
  if (normalized.includes("cm3") && normalized.includes("stp") && normalized.includes("/g")) return number / 22.414
  if (normalized === "mg/g" || normalized === "mgg-1") {
    const mass = MOLAR_MASS[gas]
    return mass ? number / mass : null
  }
  return null
}

function normalizeFetchedIsotherm(json, gas) {
  const points = []
  const unit = json.adsorptionUnits || ""
  for (const point of json.isotherm_data || []) {
    const species = Array.isArray(point.species_data)
      ? point.species_data.find(item => gasFormula(item.name || item.InChIKey || "") === gas) || point.species_data[0]
      : null
    const rawUptake = species?.adsorption ?? point.total_adsorption
    const uptake = convertUptake(rawUptake, unit, gas)
    const pressure = Number(point.pressure)
    if (Number.isFinite(pressure) && Number.isFinite(uptake)) {
      points.push({ pressureBar: Number(pressure.toFixed(6)), uptake: Number(uptake.toFixed(6)), gas, uptakeUnit: "mmol/g" })
    }
  }
  return points.sort((a, b) => a.pressureBar - b.pressureBar)
}

function makeMissingIastSource(record, note) {
  const provenance = record.recordProvenance || {}
  return {
    field: "iaSTSelectivity",
    sourceType: "selectivity-unavailable",
    sourceDatabase: provenance.sourceDatabase || "pending",
    sourceRecordId: provenance.sourceRecordId || record.id,
    sourceVersion: "gas_adsorption_records_v2.1",
    citation: provenance.citation || "pending",
    doi: provenance.doi || null,
    sourceUrl: provenance.sourceUrl || null,
    license: provenance.license || "pending",
    retrievedAt: RETRIEVED_AT,
    page: null,
    tableOrFigure: null,
    originalValue: null,
    normalizedValue: null,
    normalizedUnit: "dimensionless",
    unitConversion: note,
    curationStatus: "computed-unavailable",
    confidence: 0,
    note,
  }
}

function buildIastSource(record, value, result, secondaryMeta) {
  const provenance = record.recordProvenance || {}
  const primaryId = record.linkedIsotherms?.primary?.filename || provenance.sourceRecordId
  const secondaryId = secondaryMeta?.filename || record.linkedIsotherms?.secondary?.filename
  return {
    field: "iaSTSelectivity",
    sourceType: "iast_from_pure_component_isotherms",
    sourceDatabase: "EcoMOF-AI gas adsorption v2.1 IAST derivation",
    sourceRecordId: `${primaryId} + ${secondaryId}`,
    sourceVersion: "gas_adsorption_records_v2.1",
    citation: provenance.citation || "NIST/ARPA-E ISODB pure-component isotherms.",
    doi: provenance.doi || null,
    sourceUrl: provenance.sourceUrl || null,
    license: provenance.license || "NIST public database export; linked publication terms should be checked before reuse.",
    retrievedAt: RETRIEVED_AT,
    page: null,
    tableOrFigure: null,
    originalValue: value,
    normalizedValue: value,
    normalizedUnit: "dimensionless",
    unitConversion: `Binary IAST from fitted pure-component isotherms at ${record.condition?.adsorptionPressureBar ?? record.condition?.pressureBar} bar and feed ${record.condition?.mixtureRatio}.`,
    curationStatus: "computed-IAST",
    confidence: Number(Math.min(0.9, Math.max(0.62, 0.68 + (result.minFitR2 || 0) * 0.18)).toFixed(2)),
    note: "Computed from real single-component isotherm points; not an experimental mixture or breakthrough measurement.",
    dataGrade: "computed-IAST",
    sourceIsothermIds: { primary: primaryId, secondary: secondaryId },
    modelFits: {
      primary: { model: result.primaryFit.model, r2: result.primaryFit.r2, pointCount: result.primaryFit.pointCount },
      secondary: { model: result.secondaryFit.model, r2: result.secondaryFit.r2, pointCount: result.secondaryFit.pointCount },
    },
  }
}

function buildAliasLookup(aliasRows = []) {
  const lookup = new Map()
  const addGroup = group => {
    const canonical = group[0]
    const canonicalId = canonicalIdForName(canonical)
    for (const alias of group) lookup.set(normalizeName(alias), { canonical, canonicalId })
  }
  for (const row of aliasRows) addGroup([row.canonicalName, ...(row.aliases || [])].filter(Boolean))
  for (const group of EXTRA_ALIASES) addGroup(group)
  return lookup
}

function resolveCanonicalName(name, aliasLookup) {
  const normalized = normalizeName(name)
  return aliasLookup.get(normalized) || { canonical: name, canonicalId: canonicalIdForName(name) }
}

function mergeUnique(values = []) {
  const seen = new Set()
  const out = []
  for (const value of values) {
    const clean = String(value || "").trim()
    if (!clean) continue
    const key = normalizeName(clean)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(clean)
  }
  return out
}

function mergeLinks(existing = [], next = []) {
  const seen = new Set()
  const out = []
  for (const item of [...existing, ...next]) {
    const key = item?.id || item?.sourceRecordId || JSON.stringify(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function normalizeStructureRow(row = {}, index = 0) {
  const sourceRecordId = row.sourceRecordId || row.source_record || row.sourceRecord || row.id || row.candidateId || `structure-${index}`
  return {
    id: row.id || row.candidateId || sourceRecordId,
    displayName: row.displayName || row.name || row.rawName || sourceRecordId,
    rawName: row.rawName || row.name || row.displayName || sourceRecordId,
    sourceRecordId,
    sourceDatabase: row.sourceDatabase || row.source_database || row.provenance?.sourceDatabase || "structural",
    sourceUrl: row.sourceUrl || row.provenance?.sourceUrl || null,
    metalNode: row.metalNode || row.metal || row.chemistry?.metalNode || "pending",
    linker: row.linker || row.chemistry?.linker || row.descriptors?.linker || "pending",
    topology: row.topology || row.structure?.topology || row.descriptors?.topology || "pending",
    surfaceArea: row.surfaceArea ?? row.bet_m2g ?? row.descriptors?.surfaceArea ?? null,
    poreSizeA: row.poreSizeA ?? row.pldA ?? row.pld_a ?? row.descriptors?.poreSizeA ?? null,
    poreVolume: row.poreVolume ?? row.pore_volume_cm3g ?? row.descriptors?.poreVolume ?? null,
    density: row.density ?? row.density_gcm3 ?? row.descriptors?.density ?? null,
    aliases: [row.rawName, row.name, row.displayName, row.sourceRecordId, row.cifFile, row.structure?.cifFile].filter(Boolean),
  }
}

function structuralLink(row, method = "normalized-name", confidence = 0.74) {
  return {
    id: row.id,
    sourceDatabase: row.sourceDatabase,
    sourceRecordId: row.sourceRecordId,
    sourceUrl: row.sourceUrl,
    surfaceArea: row.surfaceArea,
    poreSizeA: row.poreSizeA,
    poreVolume: row.poreVolume,
    density: row.density,
    metalNode: row.metalNode,
    linker: row.linker,
    topology: row.topology,
    resolution: { method, confidence },
  }
}

function addRegistryRecord(map, canonicalName, patch = {}, aliasLookup) {
  const resolved = resolveCanonicalName(canonicalName, aliasLookup)
  const current = map.get(resolved.canonicalId) || {
    canonicalId: resolved.canonicalId,
    primaryName: resolved.canonical,
    aliases: [],
    normalizedAliases: [],
    links: { structural: [], gas: [], catalysis: [] },
    resolution: { status: "resolved", method: "normalized-name", confidence: 0.74 },
  }
  current.aliases = mergeUnique([current.primaryName, ...current.aliases, canonicalName, ...(patch.aliases || [])])
  current.normalizedAliases = mergeUnique(current.aliases.map(normalizeName))
  current.links.structural = mergeLinks(current.links.structural, patch.structural || [])
  current.links.gas = mergeLinks(current.links.gas, patch.gas || [])
  current.links.catalysis = mergeLinks(current.links.catalysis, patch.catalysis || [])
  if (patch.resolution) current.resolution = patch.resolution
  map.set(resolved.canonicalId, current)
  return current
}

function compositionRuleFor(record) {
  const aliases = [record.primaryName, ...(record.aliases || []), ...(record.normalizedAliases || [])].map(normalizeName)
  return COMPOSITION_RULES.find(rule => rule.aliases.some(alias => aliases.includes(normalizeName(alias)))) || null
}

function matchComposition(rule, structuralRows) {
  const metals = new Set(rule.metal.map(value => String(value).toLowerCase()))
  const linkers = rule.linker.map(normalizeName)
  return structuralRows
    .filter(row => metals.has(String(row.metalNode || "").toLowerCase()))
    .filter(row => linkers.some(linker => normalizeName(row.linker).includes(linker)))
    .sort((a, b) => String(a.sourceRecordId).localeCompare(String(b.sourceRecordId)))
    .slice(0, rule.maxMatches)
}

function buildIdentityRegistry({ gasRecords, structuralRows, aliasRows, catalysisRows }) {
  const aliasLookup = buildAliasLookup(aliasRows)
  const byId = new Map()
  for (const row of aliasRows || []) addRegistryRecord(byId, row.canonicalName, { aliases: row.aliases || [] }, aliasLookup)
  for (const group of EXTRA_ALIASES) addRegistryRecord(byId, group[0], { aliases: group }, aliasLookup)

  for (const record of gasRecords) {
    const name = record.rawName || record.displayName
    const resolved = resolveCanonicalName(name, aliasLookup)
    record.canonicalId = resolved.canonicalId
    record.mofId = resolved.canonicalId
    addRegistryRecord(byId, resolved.canonical, {
      aliases: [name, ...(record.aliasNames || [])],
      gas: [{
        id: record.id,
        gasPair: record.gasPair,
        dataGrade: record.dataGrade || record.evidence?.dataGrade || "seed",
        sourceRecordId: record.recordProvenance?.sourceRecordId,
      }],
    }, aliasLookup)
  }

  const normalizedStructures = structuralRows.map(normalizeStructureRow)
  normalizedStructures.forEach((row, index) => {
    const resolved = resolveCanonicalName(row.displayName, aliasLookup)
    addRegistryRecord(byId, resolved.canonical, {
      aliases: row.aliases,
      structural: [structuralLink(row, "normalized-name", 0.74)],
    }, aliasLookup)
  })

  const compositionMatches = []
  for (const record of byId.values()) {
    if (!record.links.gas.length || record.links.structural.length) continue
    const rule = compositionRuleFor(record)
    if (!rule) continue
    const matches = matchComposition(rule, normalizedStructures)
    if (!matches.length) continue
    record.links.structural = mergeLinks(record.links.structural, matches.map(row => structuralLink(row, "matched-by-composition", rule.confidence)))
    record.resolution = { status: "candidate-structural-link", method: "matched-by-composition", confidence: rule.confidence }
    compositionMatches.push({ canonicalId: record.canonicalId, primaryName: record.primaryName, matchCount: matches.length, rule: { metal: rule.metal, linker: rule.linker, confidence: rule.confidence } })
  }

  for (const row of catalysisRows || []) {
    const name = row.name || row.hostName || row.displayName || row.mofName
    if (!name) continue
    addRegistryRecord(byId, name, {
      aliases: row.aliasNames || row.aliases || [],
      catalysis: [{ id: row.id || row.hostId || row.candidateId || name, role: row.role || row.pathwayRole || "organic-acid-host", source: "organic_acid_host_guest" }],
    }, aliasLookup)
  }

  const records = [...byId.values()].sort((a, b) => a.primaryName.localeCompare(b.primaryName))
  const byCanonical = new Map(records.map(row => [row.canonicalId, row]))
  const unresolved = gasRecords
    .filter(record => !(byCanonical.get(record.canonicalId)?.links?.structural || []).length)
    .map(record => ({ gasRecordId: record.id, rawName: record.rawName, canonicalId: record.canonicalId, reason: "No structural CoRE/QMOF record matched by alias or conservative composition rule." }))
  const gasRecordCount = gasRecords.length
  const linkedGasRecordCount = gasRecords.filter(record => (byCanonical.get(record.canonicalId)?.links?.structural || []).length).length
  return {
    registry: {
      schemaVersion: "mof-identity-registry-v2.1",
      generatedAt: RETRIEVED_AT,
      records,
      unresolved,
      summary: {
        canonicalCount: records.length,
        gasLinkedCount: records.filter(row => row.links.gas.length).length,
        structuralLinkedCount: records.filter(row => row.links.structural.length).length,
        catalysisLinkedCount: records.filter(row => row.links.catalysis.length).length,
        unresolvedGasCount: unresolved.length,
        gasRecordCount,
        gasRecordsWithStructuralLinks: linkedGasRecordCount,
        gasStructureResolutionRate: Number((linkedGasRecordCount / Math.max(1, gasRecordCount)).toFixed(4)),
        compositionMatchedCanonicalCount: compositionMatches.length,
      },
    },
    resolutionReport: {
      schemaVersion: "mof-identity-resolution-report-v2.1",
      generatedAt: RETRIEVED_AT,
      summary: {
        gasRecordCount,
        linkedGasRecordCount,
        unresolvedGasRecordCount: unresolved.length,
        gasStructureResolutionRate: Number((linkedGasRecordCount / Math.max(1, gasRecordCount)).toFixed(4)),
        compositionMatchedCanonicalCount: compositionMatches.length,
        structuralInputCount: normalizedStructures.length,
      },
      compositionMatches,
      unresolved,
      caveat: "Composition matches are candidate links only. They require metal+linker agreement and are labeled matched-by-composition; unresolved names are not forced onto structure IDs.",
    },
  }
}

function rank(values) {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value)
  const ranks = Array(values.length)
  for (let index = 0; index < sorted.length; index += 1) ranks[sorted[index].index] = index + 1
  return ranks
}

function spearman(xs, ys) {
  const pairs = xs.map((x, index) => [finite(x), finite(ys[index])]).filter(([x, y]) => x !== null && y !== null)
  if (pairs.length < 3) return { rho: null, n: pairs.length, status: "insufficient-data" }
  const rx = rank(pairs.map(([x]) => x))
  const ry = rank(pairs.map(([, y]) => y))
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length
  const mx = mean(rx)
  const my = mean(ry)
  const numerator = rx.reduce((sum, value, index) => sum + (value - mx) * (ry[index] - my), 0)
  const denomX = Math.sqrt(rx.reduce((sum, value) => sum + (value - mx) ** 2, 0))
  const denomY = Math.sqrt(ry.reduce((sum, value) => sum + (value - my) ** 2, 0))
  const rho = denomX && denomY ? numerator / (denomX * denomY) : null
  return { rho: rho === null ? null : Number(rho.toFixed(4)), n: pairs.length, status: rho === null ? "insufficient-data" : Math.abs(rho) < 0.35 ? "low-validity-indicative" : "indicative-only" }
}

function buildProxyValidationReport(records, registry) {
  const byGasId = new Map(records.map(record => [record.id, record]))
  const pairs = []
  for (const entry of registry.records || []) {
    const gasLinks = entry.links?.gas || []
    const structural = (entry.links?.structural || []).find(link => finite(link.surfaceArea) !== null || finite(link.poreSizeA) !== null || finite(link.poreVolume) !== null)
    if (!structural) continue
    for (const link of gasLinks) {
      const gas = byGasId.get(link.id)
      const uptake = finite(gas?.metrics?.primaryUptake)
      if (uptake === null) continue
      pairs.push({
        canonicalId: entry.canonicalId,
        gasRecordId: gas.id,
        gasPair: gas.gasPair,
        dataGrade: gas.dataGrade,
        primaryUptake: uptake,
        surfaceArea: structural.surfaceArea,
        poreSizeA: structural.poreSizeA,
        poreVolume: structural.poreVolume,
        density: structural.density,
        structuralSourceRecordId: structural.sourceRecordId,
        matchMethod: structural.resolution?.method || "unknown",
      })
    }
  }
  const metrics = ["surfaceArea", "poreSizeA", "poreVolume", "density"].map(descriptorKey => {
    const result = spearman(pairs.map(row => row[descriptorKey]), pairs.map(row => row.primaryUptake))
    return { descriptorKey, metricKey: "primaryUptake", ...result }
  })
  return {
    schemaVersion: "gas-structure-proxy-validation-v2.1",
    generatedAt: RETRIEVED_AT,
    summary: {
      candidatePairCount: pairs.length,
      realUptakeCount: records.filter(record => finite(record.metrics?.primaryUptake) !== null && record.dataGrade !== "seed").length,
      status: metrics.some(row => row.status === "low-validity-indicative") ? "low-validity-indicative" : "indicative-only",
      caveat: "Indicative only: structural descriptors are not adsorption predictions and require same-condition uptake validation. Candidate composition links are not treated as exact structural identity.",
    },
    metrics,
    reviewedPairs: pairs.slice(0, 250),
  }
}

function annotateGasIdentity(records, registry) {
  const byCanonical = new Map((registry.records || []).map(row => [row.canonicalId, row]))
  for (const record of records) {
    const linked = byCanonical.get(record.canonicalId)?.links?.structural || []
    if (linked.length) {
      const method = linked.some(link => link.resolution?.method === "matched-by-composition")
        ? "matched-by-composition"
        : "resolved-by-structural-alias"
      record.identityStatus = method
      record.structuralLinkCount = linked.length
    } else {
      record.identityStatus = "unresolved"
      record.structuralLinkCount = 0
    }
  }
  return records
}

function buildDuplicateReport(records) {
  const exactGroups = new Map()
  const conditionGroups = new Map()
  for (const record of records) {
    const exactKey = [record.rawName, record.gasPair, record.condition?.temperatureK, record.recordProvenance?.sourceRecordId].map(value => String(value || "pending")).join("|")
    const conditionKey = [record.rawName, record.condition?.temperatureK].map(value => String(value || "pending")).join("|")
    if (!exactGroups.has(exactKey)) exactGroups.set(exactKey, [])
    if (!conditionGroups.has(conditionKey)) conditionGroups.set(conditionKey, [])
    exactGroups.get(exactKey).push(record.id)
    conditionGroups.get(conditionKey).push({ id: record.id, gasPair: record.gasPair, sourceRecordId: record.recordProvenance?.sourceRecordId })
  }
  const exactDuplicates = [...exactGroups.entries()].filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, ids }))
  const conditionRepeats = [...conditionGroups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({ key, rows, reason: "same MOF/temperature appears across different gas pairs, source isotherms, or conditions; retained as distinct provenance-backed records." }))
  return {
    exactDuplicateGroups: exactDuplicates,
    conditionRepeatGroups: conditionRepeats.slice(0, 80),
    exactDuplicateCount: exactDuplicates.reduce((sum, group) => sum + group.ids.length, 0),
    conditionRepeatGroupCount: conditionRepeats.length,
  }
}

async function fetchSecondaryIsotherm(record, cache, report) {
  const meta = record.linkedIsotherms?.secondary
  if (!meta?.filename) return { points: null, status: "missing-secondary-link" }
  if (cache.has(meta.filename)) return { points: cache.get(meta.filename), status: "local-secondary-isotherm", meta }
  if (process.env.ECOMOF_DISABLE_NIST_FETCH === "1") return { points: null, status: "secondary-fetch-disabled", meta }
  const url = meta.sourceUrl || sourceUrlFor(meta.filename)
  try {
    const response = await fetch(url, { headers: { "user-agent": "EcoMOF-AI gas v2.1 IAST builder" } })
    if (!response.ok) throw new Error(`${response.status}`)
    const json = await response.json()
    const points = normalizeFetchedIsotherm(json, record.secondaryGas)
    if (points.length < 3) return { points: null, status: "secondary-too-few-points", meta }
    cache.set(meta.filename, points)
    report.fetchedSecondaryIsotherms += 1
    return { points, status: "fetched-secondary-isotherm", meta }
  } catch (error) {
    report.secondaryFetchFailures.push({ recordId: record.id, filename: meta.filename, url, error: error.message })
    return { points: null, status: "secondary-fetch-failed", meta }
  }
}

async function deriveIast(records) {
  const cache = new Map()
  for (const record of records) {
    const filename = record.linkedIsotherms?.primary?.filename || record.recordProvenance?.sourceRecordId
    if (filename && Array.isArray(record.isotherm) && record.isotherm.length >= 3) cache.set(filename, record.isotherm)
  }
  const report = {
    computed: [],
    unavailable: [],
    retainedExisting: [],
    fetchedSecondaryIsotherms: 0,
    secondaryFetchFailures: [],
  }
  const next = []
  for (const record of records) {
    const updated = structuredClone(record)
    updated.fieldSources = { ...(updated.fieldSources || {}) }
    if (!updated.fieldSources.iaSTSelectivity) {
      updated.fieldSources.iaSTSelectivity = makeMissingIastSource(updated, "IAST selectivity has not been computed for this record.")
    }
    const existingIast = finite(updated.metrics?.iaSTSelectivity)
    if (existingIast !== null && updated.dataGrade === "seed") {
      updated.fieldSources.iaSTSelectivity = {
        ...makeMissingIastSource(updated, "Seed record carried a source-specific IAST-like selectivity value; not recomputed in v2.1."),
        sourceType: "seed_source_specific_isotherm",
        originalValue: existingIast,
        normalizedValue: existingIast,
        curationStatus: "seed-carried-forward",
        confidence: 0.35,
      }
      report.retainedExisting.push(updated.id)
      next.push(updated)
      continue
    }
    if (!TARGET_IAST_PAIRS.has(updated.gasPair)) {
      next.push(updated)
      continue
    }
    const primary = Array.isArray(updated.isotherm) ? updated.isotherm : []
    const secondary = await fetchSecondaryIsotherm(updated, cache, report)
    if (secondary.points) {
      updated.secondaryIsotherm = secondary.points
      updated.secondaryIsothermTemperatureK = updated.condition?.temperatureK ?? null
    }
    if (primary.length < 3 || !secondary.points) {
      const reason = primary.length < 3 ? "need primary and secondary isotherms" : "need both isotherms"
      updated.iastStatus = `selectivity-unavailable (${reason})`
      updated.fieldSources.iaSTSelectivity = makeMissingIastSource(updated, `selectivity-unavailable (${reason}); secondary status: ${secondary.status}.`)
      report.unavailable.push({ id: updated.id, gasPair: updated.gasPair, reason, secondaryStatus: secondary.status })
      next.push(updated)
      continue
    }
    const result = calculateIastSelectivity({
      primaryIsotherm: primary,
      secondaryIsotherm: secondary.points,
      mixtureRatio: updated.condition?.mixtureRatio,
      pressureBar: updated.condition?.adsorptionPressureBar ?? updated.condition?.pressureBar,
    })
    if (result.status !== "computed-IAST") {
      updated.iastStatus = result.status
      updated.fieldSources.iaSTSelectivity = makeMissingIastSource(updated, `${result.status}; ${result.reason || "fit or IAST solver did not produce a finite selectivity."}`)
      report.unavailable.push({ id: updated.id, gasPair: updated.gasPair, reason: updated.iastStatus })
      next.push(updated)
      continue
    }
    const value = result.value
    const alreadyComputedIast = String(updated.dataGrade || updated.evidence?.dataGrade || "").toLowerCase() === "computed-iast"
    const originalDataGrade = updated.dataGrade || updated.evidence?.dataGrade || "unknown"
    updated.baseDataGrade = updated.baseDataGrade || originalDataGrade
    updated.dataGrade = "computed-IAST"
    updated.iastStatus = "computed-IAST"
    updated.iast = {
      method: "binary IAST from fitted pure-component isotherms",
      selectivity: value,
      pressureBar: result.pressureBar,
      mixtureRatio: result.mixtureRatio,
      sourceIsothermIds: {
        primary: updated.linkedIsotherms?.primary?.filename || updated.recordProvenance?.sourceRecordId,
        secondary: secondary.meta?.filename || updated.linkedIsotherms?.secondary?.filename,
      },
      modelFits: {
        primary: { model: result.primaryFit.model, r2: result.primaryFit.r2, pointCount: result.primaryFit.pointCount },
        secondary: { model: result.secondaryFit.model, r2: result.secondaryFit.r2, pointCount: result.secondaryFit.pointCount },
      },
      adsorbedFractions: result.adsorbedFractions,
      gasFractions: result.gasFractions,
    }
    updated.metrics = { ...(updated.metrics || {}), selectivity: value, iaSTSelectivity: value }
    updated.rawValues = {
      ...(updated.rawValues || {}),
      iaSTSelectivity: {
        originalValue: value,
        originalUnit: "dimensionless",
        normalizedValue: value,
        normalizedUnit: "dimensionless",
        conversionNote: "Computed by binary IAST from fitted pure-component isotherms.",
      },
    }
    const source = buildIastSource(updated, value, result, secondary.meta)
    updated.fieldSources.iaSTSelectivity = source
    updated.fieldSources.selectivity = { ...source, field: "selectivity" }
    updated.evidence = {
      ...(updated.evidence || {}),
      dataType: "simulated_iast",
      dataGrade: "computed-IAST",
      evidenceLevel: "B",
      confidence: source.confidence,
      hasIASTValidation: true,
      hasMixtureValidation: false,
      dataCompleteness: Number(Math.min(
        1,
        (updated.evidence?.dataCompleteness || 0) + (alreadyComputedIast ? 0 : 0.18),
      ).toFixed(2)),
    }
    updated.whyRecommended = mergeUnique([
      ...(updated.whyRecommended || []).filter(item => !String(item).toLowerCase().includes("iast selectivity")),
      `IAST selectivity ${value} computed from ${source.sourceIsothermIds.primary} and ${source.sourceIsothermIds.secondary}; not an experimental breakthrough result.`,
    ])
    updated.risks = mergeUnique([
      ...(updated.risks || []).filter(item => {
        const label = String(item).toLowerCase()
        return !label.includes("no iast") && !label.includes("iast is fitted from pure-component")
      }),
      "IAST is fitted from pure-component isotherms and remains a computed separation estimate, not process validation.",
    ])
    report.computed.push({ id: updated.id, rawName: updated.rawName, gasPair: updated.gasPair, value, minFitR2: result.minFitR2, sourceIsothermIds: source.sourceIsothermIds })
    next.push(updated)
  }
  return { records: next, report }
}

function updateCollectionReport(report, records, iastReport, resolutionReport, proxyReport, duplicateReport) {
  const dataGradeCounts = records.reduce((acc, record) => {
    const grade = record.dataGrade || record.evidence?.dataGrade || "unknown"
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {})
  const byPair = records.reduce((acc, record) => {
    const pair = record.gasPair || "unknown"
    if (!acc[pair]) acc[pair] = { total: 0, withSelectivity: 0, computedIast: 0 }
    acc[pair].total += 1
    if (finite(record.metrics?.selectivity) !== null) acc[pair].withSelectivity += 1
    if (finite(record.metrics?.iaSTSelectivity) !== null && record.dataGrade === "computed-IAST") acc[pair].computedIast += 1
    return acc
  }, {})
  return {
    ...(report || {}),
    generatedAt: RETRIEVED_AT,
    version: "gas-adsorption-v2.1",
    summary: {
      ...((report || {}).summary || {}),
      outputRecordCount: records.length,
      dataGradeCounts,
      recordsWithSelectivity: records.filter(record => finite(record.metrics?.selectivity) !== null).length,
      recordsWithIastSelectivity: records.filter(record => finite(record.metrics?.iaSTSelectivity) !== null).length,
      computedIastSelectivityCount: iastReport.summary.computedIastCount,
      gasStructureResolutionRate: resolutionReport.summary.gasStructureResolutionRate,
      gasRecordsWithStructuralLinks: resolutionReport.summary.linkedGasRecordCount,
      proxyValidationStatus: proxyReport.summary.status,
      exactDuplicateCount: duplicateReport.exactDuplicateCount,
    },
    v2_1: {
      iast: iastReport.summary,
      identityResolution: resolutionReport.summary,
      structureProxyValidation: proxyReport.summary,
      duplicates: {
        exactDuplicateCount: duplicateReport.exactDuplicateCount,
        conditionRepeatGroupCount: duplicateReport.conditionRepeatGroupCount,
      },
      selectivityCoverageByPair: byPair,
    },
  }
}

function versionSource(value, recordId, notes) {
  return {
    value,
    sourceDatabase: "EcoMOF-AI gas adsorption v2.1 release",
    sourceRecordId: recordId,
    sourceUrl: "public/data/gas_adsorption_v2_1_iast_report.json",
    citation: "Generated by scripts/build-gas-adsorption-v2-1.mjs from NIST/ARPA-E ISODB isotherm provenance.",
    license: "Project repository license context; source publication/license terms remain field-level.",
    retrievedAt: RETRIEVED_AT,
    curationStatus: "confirmed",
    confidence: 1,
    databaseVersion: "gas-adsorption-v2.1",
    generatingScript: "scripts/build-gas-adsorption-v2-1.mjs",
    notes,
  }
}

function updateVersionEvolution(data, summary) {
  const version = "V3.10.1"
  const entry = {
    version,
    date: RETRIEVED_AT,
    commit: "pending-current",
    summary: "Gas Adsorption Database v2.1: computed IAST selectivity from real paired pure-component isotherms, expanded conservative MOF identity links to CoRE/QMOF structure records, added honest coverage/proxy-validation reports, and improved GasSep comparison readability.",
    scientificImpact: "Unlocks separation screening for records with paired real isotherms while marking every IAST value as computed-IAST rather than experimental mixture evidence.",
    databaseImpact: `Gas v2.1 keeps ${summary.outputRecordCount} gas records, computes ${summary.computedIastSelectivityCount} IAST selectivity values, and links ${summary.gasRecordsWithStructuralLinks} gas records to structural candidates under explicit confidence labels.`,
    algorithmImpact: "Adds white-box Langmuir / dual-site Langmuir / Freundlich fitting and binary IAST solving; no ML is introduced and missing pair isotherms remain unavailable.",
    validationImpact: `Adds provenance and anti-fabrication tests plus a structure-proxy Spearman report marked ${summary.proxyValidationStatus}.`,
    uiImpact: "GasSep now surfaces IAST/experimental/seed coverage and a clearer selected-vs-compare panel; MOF Library shows gas/structure/catalysis completeness with updated identity coverage.",
    knownLimitations: "IAST values depend on fitted pure-component isotherms and are not breakthrough or process validation. Composition-based structure links are candidate links, not exact identity proof.",
    breakingChanges: "Gas records with v2.1 IAST selectivity use dataGrade computed-IAST while preserving baseDataGrade for the underlying isotherm source.",
    nextVersionGoal: "Review composition candidate links manually, add directly indexed CoRE/QMOF IDs where available, and collect mixture/breakthrough validation for top IAST-ranked MOFs.",
    categories: ["GasSep", "Gas Adsorption", "IAST", "MOF Identity", "Database", "Validation", "UI", "Testing"],
  }
  const versions = (data.versions || []).filter(row => row.version !== version)
  versions.push(entry)
  const releaseNotes = [
    {
      version,
      date: RETRIEVED_AT,
      module: "GasSep",
      category: "Algorithm",
      title: "IAST Selectivity From Real Pure-Component Isotherms",
      body: `Computed ${summary.computedIastSelectivityCount} binary IAST selectivity values from paired NIST/ARPA-E ISODB isotherms with fitted model R2 and source isotherm IDs; unavailable pairs remain marked missing.`,
    },
    {
      version,
      date: RETRIEVED_AT,
      module: "Database",
      category: "Database",
      title: "Gas-to-Structure Identity Resolution",
      body: `Linked ${summary.gasRecordsWithStructuralLinks} gas records to structural candidates through aliases and conservative metal+linker composition matches; unresolved records remain explicit.`,
    },
    {
      version,
      date: RETRIEVED_AT,
      module: "Validation",
      category: "Validation",
      title: "Structure Proxy Spearman Audit",
      body: `Added an uptake-backed structure-proxy validation report labeled ${summary.proxyValidationStatus}; structural descriptors are not treated as adsorption predictions.`,
    },
    {
      version,
      date: RETRIEVED_AT,
      module: "GasSep",
      category: "UI",
      title: "Honest Coverage and Clearer Candidate Comparison",
      body: "GasSep, MOF Library, and Data Sources now show selectivity, IAST, isotherm, structural-link, and source-grade coverage; the GasSep comparison view presents selected and comparison MOFs side by side.",
    },
    {
      version,
      date: RETRIEVED_AT,
      module: "Testing",
      category: "Testing",
      title: "Anti-Fabrication and v2.1 Regression Tests",
      body: "Added tests for computed-IAST provenance, source isotherm IDs, model fit quality, identity resolution, coverage counting, Pareto behavior, and duplicate auditing.",
    },
    ...((data.releaseNotes || []).filter(row => row.version !== version)),
  ]
  const roadmap = [
    ...((data.roadmap || []).filter(row => row.version !== version)),
    {
      version,
      plannedFeatures: ["Gas Adsorption v2.1 IAST selectivity", "MOF identity resolution", "Coverage/proxy validation reports"],
      scientificGoal: "Separate computed IAST screening evidence from experimental mixture validation while unlocking honest gas-separation ranking.",
      databaseGoal: `Keep ${summary.outputRecordCount} gas records source-backed, expose ${summary.computedIastSelectivityCount} computed-IAST values, and link gas records to structural candidates without forcing unresolved names.`,
      validationGoal: "Use Spearman proxy validation and provenance tests to prevent structural descriptors or computed IAST from being presented as final adsorption predictions.",
      knownRisks: [
        "IAST depends on fitted pure-component isotherms rather than breakthrough validation.",
        "Composition-based structural links are candidate links and need manual review.",
        "Most target-pair records still lack paired isotherms for IAST.",
      ],
    },
  ]
  return {
    ...data,
    currentVersion: version,
    generatedAt: RETRIEVED_AT,
    overview: {
      ...(data.overview || {}),
      currentVersion: version,
      databaseSize: Math.max(data.overview?.databaseSize || 0, 3020 + summary.outputRecordCount),
      sources: {
        ...((data.overview || {}).sources || {}),
        currentVersion: versionSource(version, "version_evolution_records.currentVersion", "Version label for the Gas Adsorption Database v2.1 IAST and identity-linking release."),
        databaseSize: versionSource(Math.max(data.overview?.databaseSize || 0, 3020 + summary.outputRecordCount), "version_evolution_records.overview.databaseSize", "Database scale includes the gas adsorption v2.1 record layer in addition to the structural and organic-acid data foundation."),
      },
    },
    versions,
    releaseNotes,
    roadmap,
  }
}

function updateHomeSummary(data, summary) {
  const expandedTotalRecords = Math.max(data.totalRecords || 0, 3020 + summary.outputRecordCount)
  const notes = [
    ...((data.notes || []).filter(note => !String(note).includes("Gas Adsorption v2.1"))),
    `Gas Adsorption v2.1 computes ${summary.computedIastSelectivityCount} IAST selectivity values from paired real isotherms, links ${summary.gasRecordsWithStructuralLinks} gas records to structural candidates, and keeps missing selectivity/identity gaps explicit.`,
  ]
  return {
    ...data,
    currentVersion: "V3.10.1",
    totalRecords: expandedTotalRecords,
    lastUpdated: RETRIEVED_AT,
    gasAdsorptionV21: {
      recordCount: summary.outputRecordCount,
      computedIastSelectivityCount: summary.computedIastSelectivityCount,
      recordsWithIastSelectivity: summary.recordsWithIastSelectivity,
      gasRecordsWithStructuralLinks: summary.gasRecordsWithStructuralLinks,
      gasStructureResolutionRate: summary.gasStructureResolutionRate,
      proxyValidationStatus: summary.proxyValidationStatus,
      sourceFiles: [
        "public/data/gas_adsorption_records_v2.json",
        "public/data/gas_adsorption_v2_1_iast_report.json",
        "public/data/mof_identity_resolution_report.json",
        "public/data/gas_structure_proxy_validation_report.json",
      ],
    },
    sourceFiles: mergeUnique([...(data.sourceFiles || []), "public/data/gas_adsorption_records_v2.json", "public/data/gas_adsorption_v2_1_iast_report.json", "public/data/mof_identity_resolution_report.json", "public/data/gas_structure_proxy_validation_report.json"]),
    notes,
  }
}

async function main() {
  const records = await readJson("gas_adsorption_records_v2.json", [])
  const collectionReport = await readJson("gas_adsorption_v2_collection_report.json", {})
  const aliasRows = await readJson("mof_name_aliases.json", [])
  const structuralRows = [
    ...((await readJson("data_ingestion/core_mof_import_v2.json", {})).records || []),
    ...((await readJson("data_ingestion/qmof_import_v2.json", {})).records || []),
    ...(await readJson("database_precompute/v2_2/scalable_database_preview_records.json", [])),
    ...(await readJson("open_mof_seed_candidates.json", [])),
  ]
  const catalysisRows = await readJson("organic_acid_host_guest/host_mof_candidates.json", [])

  const iast = await deriveIast(records)
  const identity = buildIdentityRegistry({ gasRecords: iast.records, structuralRows, aliasRows, catalysisRows })
  annotateGasIdentity(iast.records, identity.registry)
  const proxyReport = buildProxyValidationReport(iast.records, identity.registry)
  const duplicateReport = buildDuplicateReport(iast.records)
  const iastReport = {
    schemaVersion: "gas-adsorption-iast-v2.1",
    generatedAt: RETRIEVED_AT,
    method: "Binary IAST from fitted pure-component isotherms. Candidate models: Langmuir, dual-site Langmuir, and Freundlich; best model selected by R2.",
    summary: {
      recordCount: iast.records.length,
      targetPairRecords: iast.records.filter(record => TARGET_IAST_PAIRS.has(record.gasPair)).length,
      computedIastCount: iast.report.computed.length,
      retainedSeedIastCount: iast.report.retainedExisting.length,
      unavailableCount: iast.report.unavailable.length,
      fetchedSecondaryIsotherms: iast.report.fetchedSecondaryIsotherms,
      secondaryFetchFailureCount: iast.report.secondaryFetchFailures.length,
      computedByPair: iast.report.computed.reduce((acc, row) => {
        acc[row.gasPair] = (acc[row.gasPair] || 0) + 1
        return acc
      }, {}),
    },
    computed: iast.report.computed,
    unavailable: iast.report.unavailable,
    secondaryFetchFailures: iast.report.secondaryFetchFailures,
    caveat: "computed-IAST values are derived from fitted pure-component isotherms, not experimental mixture or breakthrough measurements.",
  }

  const updatedCollectionReport = updateCollectionReport(collectionReport, iast.records, iastReport, identity.resolutionReport, proxyReport, duplicateReport)
  const versionEvolution = updateVersionEvolution(await readJson("version_evolution_records.json", {}), updatedCollectionReport.summary)
  const homeSummary = updateHomeSummary(await readJson("home_summary.json", {}), updatedCollectionReport.summary)

  await writeJson("gas_adsorption_records_v2.json", iast.records)
  await writeJson("gas_adsorption_v2_collection_report.json", updatedCollectionReport)
  await writeJson("gas_adsorption_v2_1_iast_report.json", iastReport)
  await writeJson("mof_identity_registry.json", identity.registry)
  await writeJson("mof_identity_resolution_report.json", identity.resolutionReport)
  await writeJson("gas_structure_proxy_validation_report.json", proxyReport)
  await writeJson("gas_adsorption_duplicate_report_v2_1.json", duplicateReport)
  await writeJson("version_evolution_records.json", versionEvolution)
  await writeJson("home_summary.json", homeSummary)

  console.log(JSON.stringify({
    iast: iastReport.summary,
    identity: identity.resolutionReport.summary,
    proxy: proxyReport.summary,
    duplicates: { exactDuplicateCount: duplicateReport.exactDuplicateCount, conditionRepeatGroupCount: duplicateReport.conditionRepeatGroupCount },
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
