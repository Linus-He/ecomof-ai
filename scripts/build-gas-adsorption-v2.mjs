import fs from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, "public", "data")
const NIST_BASE = "https://adsorption.nist.gov/isodb"
const RETRIEVED_AT = process.env.ECOMOF_RETRIEVED_AT || "2026-06-29"
const EXPERIMENT_CATEGORY = "34f118545b52949ceeaaed19ea67e6eb6dfbe36e"
const SIMULATION_CATEGORY = "c99b5a776bc51de1c70e221dafc05ea40f84b2f3"

const GAS_NAMES = {
  CO2: "Carbon Dioxide",
  N2: "Nitrogen",
  CH4: "Methane",
  H2: "Hydrogen",
  O2: "Oxygen",
}

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

const MOLAR_MASS = {
  CO2: 44.0095,
  N2: 28.0134,
  CH4: 16.043,
  H2: 2.01588,
  O2: 31.998,
}

const TARGET_PAIRS = [
  {
    gasPair: "CO2/N2",
    primaryGas: "CO2",
    secondaryGas: "N2",
    scenario: "flue gas carbon capture",
    mixtureRatio: "15/85",
    adsorptionPressureBar: 1,
    desorptionPressureBar: 0.15,
  },
  {
    gasPair: "CO2/CH4",
    primaryGas: "CO2",
    secondaryGas: "CH4",
    scenario: "natural gas upgrading",
    mixtureRatio: "50/50",
    adsorptionPressureBar: 1,
    desorptionPressureBar: 0.15,
  },
  {
    gasPair: "H2/CO2",
    primaryGas: "H2",
    secondaryGas: "CO2",
    scenario: "hydrogen purification",
    mixtureRatio: "75/25",
    adsorptionPressureBar: 5,
    desorptionPressureBar: 1,
  },
  {
    gasPair: "O2/N2",
    primaryGas: "O2",
    secondaryGas: "N2",
    scenario: "air separation",
    mixtureRatio: "21/79",
    adsorptionPressureBar: 1,
    desorptionPressureBar: 0.2,
  },
]

const SEARCH_JOBS = [
  ...Object.entries(GAS_NAMES).map(([gas, name]) => ({
    gas,
    gasName: name,
    category: EXPERIMENT_CATEGORY,
    dataGrade: "experimental",
    sourceLabel: "NIST/ARPA-E ISODB experimental search",
    pageLimit: 7,
  })),
  ...["CO2", "N2", "CH4", "H2"].map(gas => ({
    gas,
    gasName: GAS_NAMES[gas],
    category: SIMULATION_CATEGORY,
    dataGrade: "computed",
    sourceLabel: "NIST/ARPA-E ISODB simulation search",
    pageLimit: 3,
  })),
]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8"))
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  await fs.writeFile(path.join(DATA_DIR, file), `${JSON.stringify(data, null, 2)}\n`)
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/\\\//g, "/")
    .replace(/<sub>(.*?)<\/sub>/g, "$1")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function slug(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "record"
}

function normalizeName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, digit => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(digit)])
    .replace(/\bmetal organic framework\b/g, "mof")
    .replace(/\s+/g, " ")
    .replace(/[\[\]{}()'"]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function canonicalIdForName(value = "") {
  return `mof-${slug(normalizeName(value))}`
}

function isMofLike(value = "") {
  const text = String(value).toLowerCase()
  return /mof|irmof|zif|mil-|uio-|hkust|pcn-|nu-|dut-|cau-|mof-|bio-mof|zmo f|z-mof|rho-zmof|rho-zmof|sod-zmof|ftw-mof/.test(text)
}

function gasFormula(value = "") {
  const normalized = String(value).toLowerCase().replace(/\s+/g, " ").trim()
  return GAS_ALIASES.get(normalized) || GAS_ALIASES.get(normalized.replace(/-/g, " ")) || null
}

function sourceUrlFor(filename) {
  return `${NIST_BASE}/api/isotherm/${encodeURIComponent(filename)}.json`
}

function doiUrl(doi) {
  return doi ? `https://doi.org/${doi}` : null
}

async function postForm(url, entries) {
  const body = new URLSearchParams()
  for (const [key, value] of entries) body.append(key, value)
  const response = await fetch(url, {
    method: "POST",
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "user-agent": "EcoMOF-AI data provenance builder",
    },
  })
  if (!response.ok) throw new Error(`${url} failed with ${response.status}`)
  return response.json()
}

async function searchIsodb(job, start, count) {
  const entries = [
    ["s", String(start)],
    ["n", String(count)],
    ["wid", "isodb"],
    ["q[0][name]", "material"],
    ["q[0][value]", "MOF"],
    ["q[1][name]", "gas"],
    ["q[1][value]", job.gasName],
    ["q[2][name]", "category"],
    ["q[2][value]", job.category],
    ["q[3][name]", "have_isotherm"],
    ["q[3][value]", "on"],
  ]
  return postForm(`${NIST_BASE}/content/plugins/isodb-search/functions.php?f=get_biblio_results`, entries)
}

function parseSearchResults(output = "", job) {
  const rows = []
  const normalized = String(output)
  const rowRegex = /getIsotherms\(this,"([^"]+)"[\s\S]*?<span class='hidden-xs hidden-sm col-md-3'[^>]*>[\s\S]*?&nbsp;&nbsp;([\s\S]*?)<\/span>[\s\S]*?<span class='hidden-xs hidden-sm col-md-2'>([\s\S]*?)<\/span>[\s\S]*?<span class='hidden-xs hidden-sm col-md-1'>([\s\S]*?)<\/span>[\s\S]*?<span class='hidden-xs hidden-sm col-md-1'>([\s\S]*?)<\/span>[\s\S]*?<span class='hidden-xs hidden-sm col-md-2'>([\s\S]*?)<\/span>[\s\S]*?<span class='hidden-xs hidden-sm col-md-2'>([\s\S]*?)<\/span>/g
  for (const match of normalized.matchAll(rowRegex)) {
    rows.push({
      doi: decodeHtml(match[1]),
      title: decodeHtml(match[2]),
      authors: decodeHtml(match[3]),
      journal: decodeHtml(match[4]),
      year: decodeHtml(match[5]),
      adsorbentsSummary: decodeHtml(match[6]),
      adsorbatesSummary: decodeHtml(match[7]),
      searchGas: job.gas,
      searchCategory: job.category,
      dataGrade: job.dataGrade,
      sourceLabel: job.sourceLabel,
    })
  }
  return rows
}

async function getIsothermRows(doi) {
  const response = await postForm(`${NIST_BASE}/content/plugins/isodb-search/functions.php?f=get_isotherms_results`, [["DOI", doi]])
  const output = String(response?.o?.output || "")
  const rows = []
  const rowRegex = /api\/isotherm\/([^"]+)\.json[\s\S]*?<span class='col-xs-9 col-sm-4 col-md-4'>([^<]+)<\/span><span class='hidden-xs col-sm-2 col-md-2'>([^<]+)<\/span><span class='hidden-xs col-sm-3 col-md-3'>([^<]+)<\/span><span class='hidden-xs col-sm-1 col-md-1'>([^<]+)<\/span>/g
  for (const match of output.matchAll(rowRegex)) {
    rows.push({
      filename: decodeHtml(match[1]),
      adsorbent: decodeHtml(match[3]),
      adsorbates: decodeHtml(match[4]),
      temperatureK: Number(decodeHtml(match[5])),
    })
  }
  return rows
}

async function fetchIsotherm(filename) {
  const response = await fetch(sourceUrlFor(filename), {
    headers: { "user-agent": "EcoMOF-AI data provenance builder" },
  })
  if (!response.ok) throw new Error(`${filename} failed with ${response.status}`)
  return response.json()
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

function normalizeIsotherm(json, gas) {
  const unit = json.adsorptionUnits || ""
  const points = []
  for (const point of json.isotherm_data || []) {
    const species = Array.isArray(point.species_data)
      ? point.species_data.find(item => gasFormula(item.name || "") === gas) || point.species_data[0]
      : null
    const rawUptake = species?.adsorption ?? point.total_adsorption
    const uptake = convertUptake(rawUptake, unit, gas)
    const pressure = Number(point.pressure)
    if (Number.isFinite(pressure) && Number.isFinite(uptake)) {
      points.push({
        pressureBar: Number(pressure.toFixed(6)),
        uptake: Number(uptake.toFixed(6)),
        originalUptake: Number(rawUptake),
        originalUnit: unit,
      })
    }
  }
  return points.sort((a, b) => a.pressureBar - b.pressureBar)
}

function interpolate(points = [], pressure) {
  const target = Number(pressure)
  if (!Number.isFinite(target) || !points.length) return null
  const sorted = [...points].sort((a, b) => a.pressureBar - b.pressureBar)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (target < first.pressureBar || target > last.pressureBar) return null
  const exact = sorted.find(point => Math.abs(point.pressureBar - target) < 1e-9)
  if (exact) return exact.uptake
  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1]
    const next = sorted[index]
    if (target >= prev.pressureBar && target <= next.pressureBar) {
      const fraction = (target - prev.pressureBar) / Math.max(1e-12, next.pressureBar - prev.pressureBar)
      return prev.uptake + (next.uptake - prev.uptake) * fraction
    }
  }
  return null
}

function mixRatioParts(value) {
  const [a, b] = String(value || "").split("/").map(Number)
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null
  return [a, b]
}

function selectivityFromMixture(primaryIso, primaryGas, secondaryGas) {
  const rows = []
  for (const point of primaryIso.raw?.isotherm_data || []) {
    const species = Array.isArray(point.species_data) ? point.species_data : []
    const primary = species.find(item => gasFormula(item.name || item.InChIKey || "") === primaryGas)
    const secondary = species.find(item => gasFormula(item.name || item.InChIKey || "") === secondaryGas)
    if (!primary || !secondary) continue
    const qPrimary = Number(primary.adsorption)
    const qSecondary = Number(secondary.adsorption)
    const yPrimary = Number(primary.composition)
    const ySecondary = Number(secondary.composition)
    if ([qPrimary, qSecondary, yPrimary, ySecondary].every(Number.isFinite) && qSecondary > 0 && yPrimary > 0 && ySecondary > 0) {
      rows.push((qPrimary / qSecondary) / (yPrimary / ySecondary))
    }
  }
  if (!rows.length) return null
  return rows.reduce((sum, value) => sum + value, 0) / rows.length
}

function dataCompleteness(metrics, hasSecondary, hasIsotherm) {
  const keys = ["primaryUptake", "secondaryUptake", "selectivity", "workingCapacity", "regenerability", "heatOfAdsorption"]
  const metricCompleteness = keys.filter(key => metrics[key] !== null && metrics[key] !== undefined).length / keys.length
  return Number(Math.min(1, metricCompleteness * 0.65 + (hasIsotherm ? 0.25 : 0) + (hasSecondary ? 0.1 : 0)).toFixed(2))
}

function makeFieldSource({ field, value, provenance, sourceType, note, unit = "mmol/g", confidence }) {
  return {
    field,
    sourceType,
    sourceDatabase: provenance.sourceDatabase,
    sourceRecordId: provenance.sourceRecordId,
    sourceVersion: provenance.sourceVersion,
    citation: provenance.citation,
    doi: provenance.doi,
    sourceUrl: provenance.sourceUrl,
    license: provenance.license,
    retrievedAt: provenance.retrievedAt,
    page: null,
    tableOrFigure: provenance.tableOrFigure || null,
    originalValue: value,
    normalizedValue: value,
    normalizedUnit: unit,
    unitConversion: note,
    curationStatus: "programmatically-ingested",
    confidence,
    note,
  }
}

function makeMissingSource(field, provenance, note) {
  return makeFieldSource({
    field,
    value: null,
    provenance,
    sourceType: "not_available_in_source",
    note,
    unit: "pending",
    confidence: 0,
  })
}

function buildRecord(pair, primaryIso, secondaryIso, index) {
  const pAds = pair.adsorptionPressureBar
  const pDes = pair.desorptionPressureBar
  const primaryUptake = interpolate(primaryIso.points, pAds)
  const secondaryUptake = secondaryIso ? interpolate(secondaryIso.points, pAds) : null
  const desorptionUptake = interpolate(primaryIso.points, pDes)
  const workingCapacity = primaryUptake !== null && desorptionUptake !== null
    ? Math.max(0, primaryUptake - desorptionUptake)
    : null
  const regenerability = primaryUptake && workingCapacity !== null
    ? Math.min(100, Math.max(0, (workingCapacity / primaryUptake) * 100))
    : null
  const selectivity = selectivityFromMixture(primaryIso, pair.primaryGas, pair.secondaryGas)
  const hasSecondary = secondaryUptake !== null
  const evidenceLevel = selectivity !== null || hasSecondary ? "A" : "B"
  const sourceDatabase = primaryIso.dataGrade === "computed" ? "NIST/ARPA-E ISODB simulation" : "NIST/ARPA-E ISODB"
  const sourceVersion = "ISODB API isotherm export"
  const sourceUrl = sourceUrlFor(primaryIso.filename)
  const citation = `${primaryIso.biblio.authors || "Unknown authors"}, ${primaryIso.biblio.title || "Adsorption isotherm record"}, ${primaryIso.biblio.journal || "unknown journal"} ${primaryIso.biblio.year || ""}; DOI:${primaryIso.doi}.`
  const provenance = {
    sourceDatabase,
    sourceRecordId: primaryIso.filename,
    sourceVersion,
    citation,
    doi: primaryIso.doi,
    sourceUrl,
    license: "NIST public database export; linked publication terms should be checked before reuse.",
    retrievedAt: RETRIEVED_AT,
    curatedBy: "scripts/build-gas-adsorption-v2.mjs",
    curationNote: "Programmatic ingestion from NIST/ARPA-E ISODB JSON exports. Missing separation metrics are left null.",
  }
  const metrics = {
    primaryUptake: primaryUptake === null ? null : Number(primaryUptake.toFixed(4)),
    secondaryUptake: secondaryUptake === null ? null : Number(secondaryUptake.toFixed(4)),
    selectivity: selectivity === null ? null : Number(selectivity.toFixed(4)),
    workingCapacity: workingCapacity === null ? null : Number(workingCapacity.toFixed(4)),
    regenerability: regenerability === null ? null : Number(regenerability.toFixed(1)),
    heatOfAdsorption: null,
    iaSTSelectivity: null,
    breakthroughTime: null,
  }
  const completeness = dataCompleteness(metrics, hasSecondary, true)
  const primaryName = primaryIso.adsorbent
  const canonicalId = canonicalIdForName(primaryName)
  const recordId = `gassep-v2-${slug(pair.gasPair)}-${slug(primaryName)}-${slug(primaryIso.filename)}-${String(index).padStart(4, "0")}`
  const fieldSources = {
    primaryUptake: makeFieldSource({
      field: "primaryUptake",
      value: metrics.primaryUptake,
      provenance,
      sourceType: "nist_isotherm_interpolated",
      note: `Interpolated from ${primaryIso.filename} at ${pAds} bar; original adsorption unit ${primaryIso.raw.adsorptionUnits}.`,
      confidence: 0.9,
    }),
    secondaryUptake: hasSecondary ? makeFieldSource({
      field: "secondaryUptake",
      value: metrics.secondaryUptake,
      provenance: { ...provenance, sourceRecordId: secondaryIso.filename, sourceUrl: sourceUrlFor(secondaryIso.filename) },
      sourceType: "nist_isotherm_interpolated",
      note: `Interpolated from matched secondary-gas isotherm ${secondaryIso.filename} at ${pAds} bar.`,
      confidence: 0.86,
    }) : makeMissingSource("secondaryUptake", provenance, "No matched secondary-gas isotherm was available for this record."),
    selectivity: metrics.selectivity !== null ? makeFieldSource({
      field: "selectivity",
      value: metrics.selectivity,
      provenance,
      sourceType: "nist_mixture_isotherm_derived",
      note: "Derived from multicomponent isotherm species adsorption and gas-phase composition in the same JSON record.",
      unit: "dimensionless",
      confidence: 0.82,
    }) : makeMissingSource("selectivity", provenance, "NIST record did not provide mixture/IAST selectivity; not inferred from single-component uptake."),
    workingCapacity: metrics.workingCapacity !== null ? makeFieldSource({
      field: "workingCapacity",
      value: metrics.workingCapacity,
      provenance,
      sourceType: "nist_isotherm_derived",
      note: `Derived as uptake(${pAds} bar) - uptake(${pDes} bar) by linear interpolation of the primary isotherm.`,
      confidence: 0.84,
    }) : makeMissingSource("workingCapacity", provenance, "Adsorption/desorption pressure window was outside available isotherm range."),
    regenerability: metrics.regenerability !== null ? makeFieldSource({
      field: "regenerability",
      value: metrics.regenerability,
      provenance,
      sourceType: "nist_isotherm_derived",
      note: "Derived as workingCapacity / uptake(P_ads) * 100.",
      unit: "%",
      confidence: 0.78,
    }) : makeMissingSource("regenerability", provenance, "Regenerability could not be derived without working capacity and uptake at adsorption pressure."),
    heatOfAdsorption: makeMissingSource("heatOfAdsorption", provenance, "Heat of adsorption was not available in the ISODB isotherm JSON export."),
    surfaceArea: makeMissingSource("surfaceArea", provenance, "Surface area is a structural descriptor and was not included in this NIST isotherm JSON export."),
    poreSizeA: makeMissingSource("poreSizeA", provenance, "Pore size is a structural descriptor and was not included in this NIST isotherm JSON export."),
    poreVolume: makeMissingSource("poreVolume", provenance, "Pore volume is a structural descriptor and was not included in this NIST isotherm JSON export."),
    waterStability: makeMissingSource("waterStability", provenance, "Water stability was not available in the ISODB isotherm JSON export."),
    thermalStability: makeMissingSource("thermalStability", provenance, "Thermal stability was not available in the ISODB isotherm JSON export."),
    evidenceLevel: makeFieldSource({
      field: "evidenceLevel",
      value: evidenceLevel,
      provenance,
      sourceType: "curation_rule",
      note: "Evidence level reflects real isotherm provenance and whether matched secondary or mixture data were available.",
      unit: "level",
      confidence: 0.75,
    }),
    confidence: makeFieldSource({
      field: "confidence",
      value: evidenceLevel === "A" ? 0.9 : 0.78,
      provenance,
      sourceType: "curation_rule",
      note: "Confidence is assigned from data grade, DOI provenance, unit convertibility, and separation-metric completeness.",
      unit: "fraction",
      confidence: 0.75,
    }),
    gasScore: makeMissingSource("gasScore", provenance, "GasScore is computed at runtime by the GasSep client."),
  }

  return {
    id: recordId,
    schemaVersion: "gas-adsorption-v1",
    dataGrade: primaryIso.dataGrade,
    identityStatus: "resolved-by-normalized-name",
    canonicalId,
    mofId: canonicalId,
    displayName: `${primaryName} ${pair.gasPair} ${primaryIso.dataGrade}`,
    rawName: primaryName,
    aliasNames: [primaryName, normalizeName(primaryName), primaryIso.biblio.adsorbentsSummary].filter(Boolean),
    gasPair: pair.gasPair,
    primaryGas: pair.primaryGas,
    secondaryGas: pair.secondaryGas,
    applicationScenario: pair.scenario,
    condition: {
      temperatureK: Number(primaryIso.temperatureK) || null,
      pressureBar: pAds,
      adsorptionPressureBar: pAds,
      desorptionPressureBar: pDes,
      mixtureRatio: pair.mixtureRatio,
      humidity: "not reported",
      cycleType: pair.gasPair === "H2/CO2" ? "PSA" : "VSA",
    },
    metrics,
    units: {
      uptake: "mmol/g",
      selectivity: "dimensionless",
      workingCapacity: "mmol/g",
      regenerability: "%",
      heatOfAdsorption: "kJ/mol",
      surfaceArea: "m2/g",
      poreSizeA: "A",
      poreVolume: "cm3/g",
    },
    rawValues: {
      primaryUptake: {
        originalValue: metrics.primaryUptake,
        originalUnit: primaryIso.raw.adsorptionUnits,
        normalizedValue: metrics.primaryUptake,
        normalizedUnit: "mmol/g",
        conversionNote: "Interpolated from NIST isotherm and converted to mmol/g when the source unit was convertible.",
      },
      secondaryUptake: hasSecondary ? {
        originalValue: metrics.secondaryUptake,
        originalUnit: secondaryIso.raw.adsorptionUnits,
        normalizedValue: metrics.secondaryUptake,
        normalizedUnit: "mmol/g",
        conversionNote: "Interpolated from matched NIST secondary-gas isotherm and converted to mmol/g.",
      } : null,
      workingCapacity: metrics.workingCapacity === null ? null : {
        originalValue: metrics.workingCapacity,
        originalUnit: "mmol/g",
        normalizedValue: metrics.workingCapacity,
        normalizedUnit: "mmol/g",
        conversionNote: "Derived from the normalized isotherm pressure window.",
      },
      pressure: {
        originalValue: pAds,
        originalUnit: "bar",
        normalizedValue: pAds,
        normalizedUnit: "bar",
        conversionNote: "NIST pressure units were bar for ingested records.",
      },
      temperature: {
        originalValue: Number(primaryIso.temperatureK) || null,
        originalUnit: "K",
        normalizedValue: Number(primaryIso.temperatureK) || null,
        normalizedUnit: "K",
        conversionNote: "Temperature retained as reported by ISODB.",
      },
    },
    descriptors: {
      surfaceArea: null,
      poreSizeA: null,
      poreVolume: null,
      density: null,
      voidFraction: null,
      metalNode: inferMetalNode(primaryName),
      linker: "not reported in NIST isotherm",
      topology: "not reported in NIST isotherm",
      waterStability: "not reported",
      thermalStability: null,
      toxicityConcern: "not assessed",
    },
    isotherm: primaryIso.points.map(point => ({
      pressureBar: point.pressureBar,
      uptake: point.uptake,
      gas: pair.primaryGas,
      uptakeUnit: "mmol/g",
    })),
    linkedIsotherms: {
      primary: {
        filename: primaryIso.filename,
        sourceUrl,
        originalUnit: primaryIso.raw.adsorptionUnits,
        pointCount: primaryIso.points.length,
      },
      secondary: secondaryIso ? {
        filename: secondaryIso.filename,
        sourceUrl: sourceUrlFor(secondaryIso.filename),
        originalUnit: secondaryIso.raw.adsorptionUnits,
        pointCount: secondaryIso.points.length,
      } : null,
    },
    score: {
      gasScore: null,
      computedAtRuntime: true,
      unit: "/100",
      note: "GasScore is computed in the client from normalized scenario weights.",
    },
    evidence: {
      dataType: primaryIso.dataGrade === "computed" ? "simulated_gcmc" : "experimental_literature",
      dataGrade: primaryIso.dataGrade,
      evidenceLevel,
      confidence: evidenceLevel === "A" ? 0.9 : 0.78,
      curationStatus: "programmatically-ingested",
      dataCompleteness: completeness,
      sameConditionEvidence: hasSecondary,
      hasMixtureValidation: metrics.selectivity !== null,
      hasBreakthroughValidation: false,
      hasIASTValidation: false,
    },
    recordProvenance: provenance,
    fieldSources,
    whyRecommended: [
      `${pair.primaryGas} uptake is traced to a NIST/ARPA-E ISODB isotherm JSON export.`,
      metrics.workingCapacity !== null ? `Working capacity is recomputed from ${pAds}/${pDes} bar isotherm interpolation.` : "Working capacity is unavailable for this pressure window.",
      hasSecondary ? `${pair.secondaryGas} uptake is linked from a matched secondary isotherm in the same DOI/material/temperature group.` : `${pair.secondaryGas} uptake is not available; separation selectivity is not inferred.`,
    ],
    risks: [
      metrics.selectivity === null ? "No IAST, breakthrough, or mixture selectivity in source; selectivity is left blank." : "Mixture selectivity is derived from source species adsorption and feed composition.",
      "Structural descriptors are not imported from this isotherm source and must be joined through the identity registry.",
    ],
    validationRecommendation: {
      type: metrics.selectivity === null ? "IAST validation" : "Breakthrough experiment",
      typeZh: metrics.selectivity === null ? "IAST 混合吸附验证" : "穿透实验",
      priority: metrics.selectivity === null ? "high" : "medium",
      reason: "The record contains real isotherm data but does not replace process-level separation validation.",
      reasonZh: "该记录包含真实等温线数据，但不能替代过程级分离验证。",
      requiredData: ["single-component isotherms", "mixture ratio", "temperature", "pressure"],
      requiredDataZh: ["单组分等温线", "混合比例", "温度", "压力"],
      expectedOutput: "Mixture selectivity, dynamic capacity, and regeneration window under the selected gas pair.",
      expectedOutputZh: "目标气体对下的混合选择性、动态容量与再生窗口。",
      evidenceImpact: "Can upgrade the separation evidence if mixture and cycling behavior remain consistent.",
      evidenceImpactZh: "若混合气与循环行为一致，可提升分离证据等级。",
    },
    applicabilityNote: "Use for evidence-backed isotherm browsing and capacity ranking; do not treat missing selectivity as zero or as a validated separation result.",
    limitationNote: "NIST isotherm exports often lack structure descriptors, IAST selectivity, breakthrough curves, humidity, and stability metadata. Missing fields remain null.",
  }
}

function inferMetalNode(name = "") {
  const text = String(name)
  const match = text.match(/\b(Al|Cu|Zn|Zr|Mg|Co|Ni|Fe|Cr|Mn|Cd|Ga|In|Yb|Tb|Eu|Ca|Na|Li|V|Ti)\b/i)
  return match ? match[1] : "not reported"
}

function nearestIso(group, gas, temperatureK) {
  const rows = group.filter(item => item.gas === gas && item.points.length)
  if (!rows.length) return null
  if (!Number.isFinite(Number(temperatureK))) return rows[0]
  return [...rows].sort((a, b) => Math.abs(a.temperatureK - temperatureK) - Math.abs(b.temperatureK - temperatureK))[0]
}

function mergeAlias(existing = [], next = []) {
  const seen = new Set()
  const merged = []
  for (const value of [...existing, ...next]) {
    const clean = String(value || "").trim()
    if (!clean) continue
    const key = normalizeName(clean)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(clean)
  }
  return merged
}

function buildIdentityRegistry({ gasRecords, structuralRows, aliasRows, catalysisRows }) {
  const byId = new Map()
  const unresolved = []
  const add = (name, patch) => {
    const normalized = normalizeName(name)
    if (!normalized) return null
    const canonicalId = canonicalIdForName(name)
    const current = byId.get(canonicalId) || {
      canonicalId,
      primaryName: name,
      aliases: [],
      normalizedAliases: [],
      links: { structural: [], gas: [], catalysis: [] },
      resolution: { status: "resolved", method: "normalized-name", confidence: 0.74 },
    }
    current.primaryName = current.primaryName || name
    current.aliases = mergeAlias(current.aliases, [name, ...(patch.aliases || [])])
    current.normalizedAliases = mergeAlias(current.normalizedAliases, current.aliases.map(normalizeName))
    current.links.structural = mergeLinks(current.links.structural, patch.structural || [])
    current.links.gas = mergeLinks(current.links.gas, patch.gas || [])
    current.links.catalysis = mergeLinks(current.links.catalysis, patch.catalysis || [])
    byId.set(canonicalId, current)
    return current
  }

  for (const row of aliasRows || []) {
    add(row.canonicalName, { aliases: row.aliases || [] })
  }
  for (const record of gasRecords) {
    add(record.rawName || record.displayName, {
      aliases: record.aliasNames || [],
      gas: [{
        id: record.id,
        gasPair: record.gasPair,
        dataGrade: record.dataGrade || record.evidence?.dataGrade || "seed",
        sourceRecordId: record.recordProvenance?.sourceRecordId,
      }],
    })
  }
  for (const row of structuralRows) {
    const name = row.displayName || row.name || row.rawName || row.sourceRecordId || row.id
    const recordId = row.id || row.candidateId || row.sourceRecordId
    const sourceRecordId = row.sourceRecordId || row.source_record || row.sourceRecord || recordId
    const link = {
      id: recordId,
      sourceDatabase: row.sourceDatabase || row.source_database || "structural",
      sourceRecordId,
      surfaceArea: row.surfaceArea ?? row.bet_m2g ?? null,
      poreSizeA: row.poreSizeA ?? row.pldA ?? row.pld_a ?? null,
      topology: row.topology || "pending",
    }
    add(name, { aliases: [row.rawName, sourceRecordId, row.cifFile].filter(Boolean), structural: [link] })
  }
  for (const row of catalysisRows) {
    const name = row.name || row.hostName || row.displayName || row.mofName
    if (!name) continue
    add(name, {
      aliases: row.aliasNames || row.aliases || [],
      catalysis: [{
        id: row.id || row.hostId || row.candidateId || name,
        role: row.role || row.pathwayRole || "organic-acid-host",
        source: "organic_acid_host_guest",
      }],
    })
  }

  for (const record of gasRecords) {
    const id = canonicalIdForName(record.rawName || record.displayName)
    if (!byId.get(id)?.links?.structural?.length) {
      unresolved.push({
        gasRecordId: record.id,
        rawName: record.rawName,
        reason: "No structural CoRE/QMOF record matched by normalized name or alias.",
      })
    }
  }

  const records = [...byId.values()].sort((a, b) => a.primaryName.localeCompare(b.primaryName))
  return {
    schemaVersion: "mof-identity-registry-v1",
    generatedAt: RETRIEVED_AT,
    records,
    unresolved,
    summary: {
      canonicalCount: records.length,
      gasLinkedCount: records.filter(row => row.links.gas.length).length,
      structuralLinkedCount: records.filter(row => row.links.structural.length).length,
      catalysisLinkedCount: records.filter(row => row.links.catalysis.length).length,
      unresolvedGasCount: unresolved.length,
    },
  }
}

function mergeLinks(existing = [], next = []) {
  const seen = new Set()
  const output = []
  for (const item of [...existing, ...next]) {
    const key = item?.id || item?.sourceRecordId || JSON.stringify(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }
  return output
}

async function main() {
  const report = {
    generatedAt: RETRIEVED_AT,
    sources: {},
    skipped: {},
    attemptedSources: [
      {
        source: "NIST/ARPA-E ISODB",
        status: "ingested",
        note: "Fetched public search results and isotherm JSON exports from adsorption.nist.gov.",
      },
      {
        source: "CoRE MOF 2019 computed adsorption",
        status: "not_ingested",
        note: "No verified bulk CO2/N2/CH4 adsorption endpoint was identified in this run; existing structural CoRE IDs are linked separately and missing adsorption values remain absent.",
      },
      {
        source: "hMOF / ARC-MOF",
        status: "not_ingested",
        note: "No verified bulk endpoint was ingested in this run. NIST simulation-category records are marked computed when collected.",
      },
    ],
  }

  const biblioByDoi = new Map()
  for (const job of SEARCH_JOBS) {
    let total = 0
    let parsed = 0
    for (let page = 0; page < job.pageLimit; page += 1) {
      const start = page * 20
      const result = await searchIsodb(job, start, 20)
      total = Number(result?.o?.tot) || total
      const rows = parseSearchResults(result?.o?.output || "", job)
      parsed += rows.length
      for (const row of rows) {
        const current = biblioByDoi.get(row.doi) || row
        current.dataGrades = Array.from(new Set([...(current.dataGrades || []), row.dataGrade]))
        current.searchGases = Array.from(new Set([...(current.searchGases || []), row.searchGas]))
        biblioByDoi.set(row.doi, current)
      }
      if (start + 20 >= total) break
      await sleep(80)
    }
    report.sources[`${job.sourceLabel} ${job.gas}`] = { total, parsed }
  }

  const isotherms = []
  const maxDoi = Number(process.env.ECOMOF_NIST_MAX_DOI || 80)
  const maxIsotherms = Number(process.env.ECOMOF_NIST_MAX_ISOTHERMS || 450)
  const maxRowsPerDoi = Number(process.env.ECOMOF_NIST_MAX_ROWS_PER_DOI || 25)
  const computedDoiTarget = Math.min(Number(process.env.ECOMOF_NIST_COMPUTED_DOI || 18), Math.floor(maxDoi / 3))
  const allDoiRows = [...biblioByDoi.values()]
  const computedRows = allDoiRows.filter(row => (row.dataGrades || []).includes("computed") && !(row.dataGrades || []).includes("experimental"))
  const experimentalRows = allDoiRows.filter(row => !computedRows.includes(row))
  const doiRows = [
    ...computedRows.slice(0, computedDoiTarget),
    ...experimentalRows.slice(0, Math.max(0, maxDoi - computedDoiTarget)),
  ]
  let processedDoi = 0
  doiLoop:
  for (const biblio of doiRows) {
    processedDoi += 1
    if (processedDoi === 1 || processedDoi % 10 === 0) {
      console.error(`[gas-v2] DOI ${processedDoi}/${doiRows.length}; accepted isotherms=${isotherms.length}`)
    }
    let rows = []
    try {
      rows = await getIsothermRows(biblio.doi)
    } catch (error) {
      report.skipped[biblio.doi] = `isotherm-list-failed: ${error.message}`
      continue
    }
    for (const row of rows.slice(0, maxRowsPerDoi)) {
      if (isotherms.length >= maxIsotherms) break doiLoop
      if (!isMofLike(`${row.adsorbent} ${biblio.title} ${biblio.adsorbentsSummary}`)) continue
      let json
      try {
        json = await fetchIsotherm(row.filename)
      } catch (error) {
        report.skipped[row.filename] = `isotherm-json-failed: ${error.message}`
        continue
      }
      const gases = (json.adsorbates || []).map(item => gasFormula(item.name)).filter(Boolean)
      const gas = gases[0] || gasFormula(row.adsorbates)
      if (!gas || !GAS_NAMES[gas]) continue
      const points = normalizeIsotherm(json, gas)
      if (points.length < 2) {
        report.skipped[row.filename] = `not-convertible-or-too-few-points: ${json.adsorptionUnits || "unknown unit"}`
        continue
      }
      isotherms.push({
        filename: row.filename,
        doi: json.DOI || biblio.doi,
        biblio,
        adsorbent: json.adsorbent?.name || row.adsorbent,
        temperatureK: Number(json.temperature) || row.temperatureK,
        gas,
        dataGrade: (biblio.dataGrades || []).includes("computed") && !(biblio.dataGrades || []).includes("experimental") ? "computed" : "experimental",
        points,
        raw: json,
      })
      if (isotherms.length >= maxIsotherms) break doiLoop
    }
    await sleep(80)
  }

  const groups = new Map()
  for (const iso of isotherms) {
    const key = `${normalizeName(iso.adsorbent)}|${iso.doi}|${Math.round(Number(iso.temperatureK) || 0)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(iso)
  }

  const records = []
  let index = 1
  for (const group of groups.values()) {
    for (const pair of TARGET_PAIRS) {
      const primary = nearestIso(group, pair.primaryGas, group[0]?.temperatureK)
      if (!primary) continue
      const secondary = nearestIso(group, pair.secondaryGas, primary.temperatureK)
      const record = buildRecord(pair, primary, secondary, index)
      if (!record.recordProvenance.sourceUrl && !record.recordProvenance.doi) {
        report.skipped[record.id] = "record-without-provenance"
        continue
      }
      records.push(record)
      index += 1
    }
  }

  const existingSeeds = (await readJson("gas_adsorption_records_v1.json", [])).map(record => ({
    ...record,
    dataGrade: "seed",
    canonicalId: record.canonicalId || canonicalIdForName(record.rawName || record.displayName),
    identityStatus: "seed-name-normalized",
    evidence: {
      ...(record.evidence || {}),
      dataGrade: "seed",
    },
  }))
  const allRecords = [...records, ...existingSeeds]

  const structuralRows = [
    ...(await readJson("database_precompute/v2_2/scalable_database_preview_records.json", [])),
    ...(await readJson("open_mof_seed_candidates.json", [])),
  ]
  const aliasRows = await readJson("mof_name_aliases.json", [])
  const catalysisRows = await readJson("organic_acid_host_guest/host_mof_candidates.json", [])
  const registry = buildIdentityRegistry({ gasRecords: allRecords, structuralRows, aliasRows, catalysisRows })

  report.summary = {
    outputRecordCount: allRecords.length,
    nistRecordCount: records.length,
    seedCarryoverCount: existingSeeds.length,
    isothermCount: isotherms.length,
    doiCount: doiRows.length,
    gasPairCounts: allRecords.reduce((acc, record) => {
      acc[record.gasPair] = (acc[record.gasPair] || 0) + 1
      return acc
    }, {}),
    dataGradeCounts: allRecords.reduce((acc, record) => {
      const grade = record.dataGrade || record.evidence?.dataGrade || "unknown"
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {}),
    recordsWithIsotherm: allRecords.filter(record => Array.isArray(record.isotherm) && record.isotherm.length).length,
    recordsWithSelectivity: allRecords.filter(record => record.metrics?.selectivity !== null && record.metrics?.selectivity !== undefined).length,
    recordsWithWorkingCapacity: allRecords.filter(record => record.metrics?.workingCapacity !== null && record.metrics?.workingCapacity !== undefined).length,
    provenanceComplete: allRecords.every(record => record.recordProvenance?.sourceUrl || record.recordProvenance?.doi),
  }

  await writeJson("gas_adsorption_records_v2.json", allRecords)
  await writeJson("gas_adsorption_v2_collection_report.json", report)
  await writeJson("mof_identity_registry.json", registry)

  console.log(JSON.stringify(report.summary, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
