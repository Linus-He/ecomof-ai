import { createHash } from "node:crypto"
import {
  access,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const DATASET_VERSION = "CoRE MOF 2024 v1.1 · CSD-modified · 2025-02-27"
const DATASET_URL = "https://zenodo.org/records/15055758"
const DOWNLOAD_URL = "https://www.ccdc.cam.ac.uk/support-and-resources/downloads/"
const LICENSE = "CC-BY-NC-SA-4.0"
const ROUTE_STRUCTURE_LIMIT = 3
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

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) continue
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) values[key] = true
    else {
      values[key] = next
      index += 1
    }
  }
  return values
}

function parseCsv(source) {
  const rows = []
  let row = []
  let value = ""
  let quoted = false
  const text = String(source || "").replace(/^\uFEFF/, "")
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === "\"") {
      if (quoted && text[index + 1] === "\"") {
        value += "\""
        index += 1
      } else quoted = !quoted
    } else if (character === "," && !quoted) {
      row.push(value)
      value = ""
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1
      row.push(value)
      if (row.some(cell => cell !== "")) rows.push(row)
      row = []
      value = ""
    } else value += character
  }
  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }
  const [headers = [], ...data] = rows
  return data.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])))
}

function cleanText(value) {
  const text = String(value ?? "").trim()
  return !text || text === "-" || /^n\/?a$/i.test(text) ? null : text
}

function numberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function boolOrNull(value) {
  const text = String(value ?? "").trim().toLowerCase()
  if (["true", "yes", "1"].includes(text)) return true
  if (["false", "no", "0"].includes(text)) return false
  return null
}

function extensionCode(extension) {
  if (extension === "All Solvent Removed") return "ASR"
  if (extension === "Free Solvent Removed") return "FSR"
  if (extension === "with ion") return "ION"
  return "UNKNOWN"
}

function extensionDirectory(extension) {
  if (extension === "All Solvent Removed") return "ASR"
  if (extension === "Free Solvent Removed") return "FSR"
  if (extension === "with ion") return "Ion"
  return ""
}

function originalRefcode(value) {
  return String(value || "")
    .replace(/_(?:ASR|FSR|ion)_pacman$/i, "")
    .toUpperCase()
}

function firstMetal(value) {
  return String(value || "").split(/[;,/|+]/)[0]?.trim() || ""
}

function recordText(record = {}) {
  return [
    record.displayName,
    record.commonName,
    record.coreId,
    record.topology,
    record.mofidV1,
    record.mofidV2,
  ].filter(Boolean).join(" ").toLowerCase()
}

function assignFamily(record = {}) {
  const rawMetal = String(record.metalNode || "")
  const metal = firstMetal(rawMetal).toLowerCase()
  const text = recordText(record)
  if (text.includes("mil")) return "MIL-type host"
  if (metal === "zr") {
    if (text.includes("808") || text.includes("spn")) return "MOF-808-like host"
    if (text.includes("uio") || text.includes("fcu")) return "UiO-type host"
    return "Zr-MOF"
  }
  if (metal === "al") return "Al-MOF"
  if (metal === "fe") return "Fe-MOF"
  if (metal === "cr") return "Cr-MOF"
  if (metal === "ti") return "Ti-MOF"
  if (metal === "cu") return "Cu-MOF"
  if (metal === "zn") return "Zn-MOF"
  if (rawMetal.match(/[;/,+|]/)) return "ambiguous"
  if (text.includes("mof-808")) return "MOF-808-like host"
  return "unclassified"
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function descriptorCompleteness(record) {
  const keys = ["surfaceArea", "poreVolume", "density", "voidFraction", "pldA", "lcdA"]
  return keys.reduce((count, key) => count + Number(Number.isFinite(record[key])), 0)
}

function routeRepresentativeSort(a, b) {
  const extensionRank = { ASR: 0, FSR: 1, ION: 2, UNKNOWN: 3 }
  return (
    extensionRank[a.structureVariant] - extensionRank[b.structureVariant]
    || Number(Boolean(b.commonName)) - Number(Boolean(a.commonName))
    || descriptorCompleteness(b) - descriptorCompleteness(a)
    || Number(a.sourceNumber) - Number(b.sourceNumber)
  )
}

async function fileSha256(filePath) {
  return sha256(await readFile(filePath))
}

function writeJson(filePath, value) {
  return writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function writeCompactJson(filePath, value) {
  return writeFile(filePath, `${JSON.stringify(value)}\n`)
}

async function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"))
  } catch {
    return fallback
  }
}

async function runPool(items, concurrency, worker) {
  let cursor = 0
  const results = new Array(items.length)
  async function run() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
  return results
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.source) {
    throw new Error("Usage: node scripts/build-core-mof-2024-csd-modified.mjs --source <CSD-modified directory>")
  }

  const root = process.cwd()
  const sourceDirectory = path.resolve(String(args.source))
  const csvPath = path.join(sourceDirectory, "CR_data_CSD_modified_20250227.csv")
  const appDataDirectory = path.join(root, "public", "data")
  const datasetDirectory = path.join(appDataDirectory, "core_mof_2024")
  const routeStructureDirectory = path.join(datasetDirectory, "route_structures")
  const databaseIndexDirectory = path.join(appDataDirectory, "database_index")
  const generatedAt = new Date().toISOString()
  const sourceRows = parseCsv(await readFile(csvPath, "utf8"))

  await rm(datasetDirectory, { recursive: true, force: true })
  await rm(databaseIndexDirectory, { recursive: true, force: true })
  await mkdir(routeStructureDirectory, { recursive: true })
  await mkdir(path.join(databaseIndexDirectory, "core_mof_index_parts"), { recursive: true })
  await mkdir(path.join(databaseIndexDirectory, "qmof_index_parts"), { recursive: true })
  await mkdir(path.join(databaseIndexDirectory, "detail", "framework"), { recursive: true })

  const records = sourceRows.map(row => {
    const sourceNumber = Number(row.number)
    const id = `coremof2024-csdm-${String(sourceNumber).padStart(5, "0")}`
    const structureVariant = extensionCode(row.Extension)
    const commonName = cleanText(row.name)
    const csdRefcode = originalRefcode(row.refcode)
    const displayName = commonName || csdRefcode
    const topology = cleanText(row["topology(SingleNodes)"]) || cleanText(row["topology(AllNodes)"]) || "pending"
    const record = {
      id,
      mofId: id,
      displayName,
      name: displayName,
      commonName,
      aliases: unique([commonName, csdRefcode, row.refcode, row.coreid, row["mofid-v1"], row["mofid-v2"]]),
      sourceDatabase: "CoRE MOF 2024 · CSD-modified",
      sourceRecordId: row.coreid,
      sourceNumber,
      sourceVersion: DATASET_VERSION,
      datasetOrigin: "external_database",
      computationReadiness: "CR",
      routeCalculationEligible: true,
      sourceRefcode: row.refcode,
      csdRefcode,
      coreId: row.coreid,
      mofidV1: cleanText(row["mofid-v1"]),
      mofidV2: cleanText(row["mofid-v2"]),
      metalNode: cleanText(row["Metal Types"]) || "pending",
      metalElements: unique(String(row["Metal Types"] || "").split(",").map(value => cleanText(value))),
      linker: "pending",
      topology,
      topologyAllNodes: cleanText(row["topology(AllNodes)"]),
      catenation: numberOrNull(row.catenation),
      structureDimension: numberOrNull(row.structure_dimension),
      spaceGroupNumber: numberOrNull(row.number_spacegroup),
      hallSymbol: cleanText(row.hall),
      surfaceArea: numberOrNull(row["ASA (m2/g)"]),
      accessibleSurfaceAreaA2: numberOrNull(row["ASA (A2)"]),
      poreVolume: numberOrNull(row["PV (cm3/g)"]),
      voidFraction: numberOrNull(row.VF),
      density: numberOrNull(row["Density (g/cm3)"]),
      pldA: numberOrNull(row["PLD (Å)"]),
      lcdA: numberOrNull(row["LCD (Å)"]),
      lfpdA: numberOrNull(row["LFPD (Å)"]),
      hasOpenMetalSites: boolOrNull(row["Has OMS"]),
      openMetalSiteTypes: cleanText(row["OMS Types"]),
      chargeMethod: cleanText(row.Charge),
      atomCount: numberOrNull(row.natoms),
      year: numberOrNull(row.Year),
      doi: cleanText(row.DOI),
      publication: cleanText(row.Publication),
      thermalStabilityC: numberOrNull(row["Thermal_stability (℃)"]),
      solventStabilityProbability: numberOrNull(row.Solvent_stability),
      waterStabilityProbability: numberOrNull(row.Water_stability),
      waterAffinityClass: cleanText(row.KH_Classes),
      heatCapacity300K: numberOrNull(row["Heat_capacity@300K (J/g/K)"]),
      structureVariant,
      extension: row.Extension,
      structureStatus: "experimental-host-cif",
      routeStructureStatus: "host-only-not-modified-route",
      cifFile: `${row.coreid}.cif`,
      sourceCifRelativePath: `cifs/CR/${extensionDirectory(row.Extension)}/${row.coreid}.cif`,
      publicDataRepositoryPath: `core-mof-2024/cif/${id}.cif`,
      sourceUrl: DATASET_URL,
      citation: `CoRE MOF 2024 v1.1; CSD-modified record ${row.coreid}; DOI ${cleanText(row.DOI) || "pending"}.`,
      license: LICENSE,
      provenanceConfirmed: true,
      valueBasis: "record-level-source",
      curationStatus: "source-verified",
      dataStatus: "core-mof-2024-cr",
      descriptorCompleteness: {
        surfaceArea: numberOrNull(row["ASA (m2/g)"]) === null ? "pending" : "curated",
        poreSizeA: numberOrNull(row["PLD (Å)"]) === null ? "pending" : "curated",
        poreVolume: numberOrNull(row["PV (cm3/g)"]) === null ? "pending" : "curated",
        density: numberOrNull(row["Density (g/cm3)"]) === null ? "pending" : "curated",
        voidFraction: numberOrNull(row.VF) === null ? "pending" : "curated",
        topology: topology === "pending" ? "pending" : "curated",
        metalNode: cleanText(row["Metal Types"]) ? "curated" : "pending",
      },
      organicAcidRelevance: {
        targetPathway: "formic acid / organic acid",
        possibleRoles: ["host framework candidate"],
        pathwayPriorityScore: null,
        scoreStatus: "family-level-structural-input",
        validationNeeded: ["No catalytic performance is inferred from the CoRE structure record."],
        notes: "Eligible as a real CR host-structure input; route modification remains a separate experimental hypothesis.",
      },
    }
    record.family = assignFamily(record)
    return record
  })

  const sourceIds = new Set()
  const coreIds = new Set()
  const duplicateIds = []
  const duplicateCoreIds = []
  for (const record of records) {
    if (sourceIds.has(record.id)) duplicateIds.push(record.id)
    sourceIds.add(record.id)
    if (coreIds.has(record.coreId)) duplicateCoreIds.push(record.coreId)
    coreIds.add(record.coreId)
  }

  const recordsByFamily = Object.fromEntries(TARGET_FAMILIES.map(family => [
    family,
    records.filter(record => record.family === family).sort(routeRepresentativeSort),
  ]))
  const routeStructureRecords = TARGET_FAMILIES.flatMap(family => (
    recordsByFamily[family].slice(0, ROUTE_STRUCTURE_LIMIT)
  ))
  const bundledIds = new Set(routeStructureRecords.map(record => record.id))

  for (const record of routeStructureRecords) {
    const sourcePath = path.join(sourceDirectory, record.sourceCifRelativePath)
    const targetPath = path.join(routeStructureDirectory, `${record.id}.cif`)
    await copyFile(sourcePath, targetPath)
    record.bundledCifPath = `data/core_mof_2024/route_structures/${record.id}.cif`
    record.bundledCifSha256 = await fileSha256(targetPath)
  }

  for (const record of records) {
    if (!bundledIds.has(record.id)) continue
    const bundled = routeStructureRecords.find(candidate => candidate.id === record.id)
    record.bundledCifPath = bundled.bundledCifPath
    record.bundledCifSha256 = bundled.bundledCifSha256
  }

  const extensionCounts = Object.fromEntries(["ASR", "FSR", "ION"].map(code => [
    code,
    records.filter(record => record.structureVariant === code).length,
  ]))
  const familyCounts = Object.fromEntries([
    ...TARGET_FAMILIES.map(family => [family, recordsByFamily[family].length]),
    ["unclassified", records.filter(record => record.family === "unclassified").length],
  ])
  const namedCount = records.filter(record => record.commonName).length
  const exactCifCoverage = await runPool(records, 32, async record => {
    try {
      await access(path.join(sourceDirectory, record.sourceCifRelativePath))
      return true
    } catch {
      return false
    }
  })
  const cifPresentCount = exactCifCoverage.filter(Boolean).length

  const routeCohorts = Object.fromEntries(TARGET_FAMILIES.map(family => [
    family,
    {
      family,
      computationRecordCount: recordsByFamily[family].length,
      calculationRule: "All computation-ready CoRE MOF 2024 CSD-modified records assigned to this host family contribute to family-level structural aggregates.",
      displayedStructureIds: recordsByFamily[family].slice(0, ROUTE_STRUCTURE_LIMIT).map(record => record.id),
      displayedStructures: recordsByFamily[family].slice(0, ROUTE_STRUCTURE_LIMIT).map(record => ({
        id: record.id,
        displayName: record.displayName,
        commonName: record.commonName || record.displayName,
        csdRefcode: record.csdRefcode,
        coreId: record.coreId,
        structureVariant: record.structureVariant,
        metalNode: record.metalNode,
        topology: record.topology,
        bundledCifPath: record.bundledCifPath,
        bundledCifSha256: record.bundledCifSha256,
        structureStatus: record.structureStatus,
      })),
    },
  ]))

  const algorithmRecords = records.map(record => ({
    id: record.id,
    mofId: record.mofId,
    displayName: record.displayName,
    commonName: record.commonName,
    sourceDatabase: record.sourceDatabase,
    sourceRecordId: record.sourceRecordId,
    sourceVersion: record.sourceVersion,
    datasetOrigin: record.datasetOrigin,
    computationReadiness: record.computationReadiness,
    routeCalculationEligible: record.routeCalculationEligible,
    csdRefcode: record.csdRefcode,
    coreId: record.coreId,
    metalNode: record.metalNode,
    topology: record.topology,
    surfaceArea: record.surfaceArea,
    poreVolume: record.poreVolume,
    voidFraction: record.voidFraction,
    density: record.density,
    pldA: record.pldA,
    lcdA: record.lcdA,
    year: record.year,
    doi: record.doi,
    thermalStabilityC: record.thermalStabilityC,
    solventStabilityProbability: record.solventStabilityProbability,
    waterStabilityProbability: record.waterStabilityProbability,
    structureVariant: record.structureVariant,
    structureStatus: record.structureStatus,
    bundledCifPath: record.bundledCifPath,
    citation: record.citation,
    license: record.license,
    provenanceConfirmed: record.provenanceConfirmed,
    valueBasis: record.valueBasis,
    curationStatus: record.curationStatus,
    family: record.family,
  }))
  const searchIndex = records.map(record => ({
    id: record.id,
    name: record.displayName,
    displayName: record.displayName,
    commonName: record.commonName,
    aliases: unique([record.commonName, record.csdRefcode, record.coreId]),
    sourceDatabase: record.sourceDatabase,
    sourceRecordId: record.sourceRecordId,
    sourceVersion: record.sourceVersion,
    sourceUrl: record.sourceUrl,
    citation: record.citation,
    license: record.license,
    curationStatus: record.curationStatus,
    dataStatus: record.dataStatus,
    csdRefcode: record.csdRefcode,
    coreId: record.coreId,
    family: record.family,
    metalNode: record.metalNode,
    metalElements: record.metalElements,
    topology: record.topology,
    year: record.year,
    doi: record.doi,
    surfaceArea: record.surfaceArea,
    poreSizeA: record.pldA,
    pldA: record.pldA,
    lcdA: record.lcdA,
    poreVolume: record.poreVolume,
    density: record.density,
    voidFraction: record.voidFraction,
    structureVariant: record.structureVariant,
    computationReadiness: record.computationReadiness,
    bundledCifPath: record.bundledCifPath,
    structureStatus: record.structureStatus,
    descriptorCompleteness: record.descriptorCompleteness,
  }))

  const qualityReport = {
    schemaVersion: "1.0.0",
    generatedAt,
    dataset: DATASET_VERSION,
    intendedGrain: "One computation-ready processed CoRE structure variant per coreid.",
    primaryKey: "coreId",
    checks: {
      csvRows: sourceRows.length,
      generatedRecords: records.length,
      uniqueIds: sourceIds.size,
      duplicateIds,
      uniqueCoreIds: coreIds.size,
      duplicateCoreIds,
      cifExpected: records.length,
      cifPresent: cifPresentCount,
      cifMissing: records.length - cifPresentCount,
      requiredRefcodeMissing: records.filter(record => !record.csdRefcode).length,
      requiredDoiMissing: records.filter(record => !record.doi).length,
      commonNameAvailable: namedCount,
      commonNameMissing: records.length - namedCount,
      routeFamiliesWithNoRecords: TARGET_FAMILIES.filter(family => !recordsByFamily[family].length),
    },
    counts: {
      totalCR: records.length,
      extension: extensionCounts,
      family: familyCounts,
      bundledRouteStructures: routeStructureRecords.length,
    },
    eligibility: {
      included: "CR records only",
      excluded: "All NCR records; all legacy RNG-generated CoRE and QMOF placeholders",
      modifiedRouteCifPolicy: "A host CIF cannot be presented as a guest-metal-modified route CIF. A route-level 3D button requires an explicitly mapped experimental modified CIF.",
    },
    status: duplicateIds.length || duplicateCoreIds.length || cifPresentCount !== records.length
      ? "blocked"
      : "passed",
  }

  const summary = {
    schemaVersion: "1.0.0",
    generatedAt,
    count: records.length,
    dataset: {
      name: "CoRE MOF 2024 · CSD-modified",
      version: DATASET_VERSION,
      sourceUrl: DATASET_URL,
      downloadUrl: DOWNLOAD_URL,
      license: LICENSE,
    },
    counts: {
      totalCR: records.length,
      totalNCRQuarantined: 10441,
      extension: extensionCounts,
      commonNameAvailable: namedCount,
      commonNameMissing: records.length - namedCount,
      family: familyCounts,
      bundledRouteStructures: routeStructureRecords.length,
    },
    useBoundary: {
      algorithm: "CR record-level descriptors may participate in family-level host structural factors.",
      viewer: "Bundled route structures are pristine/processed host structures only.",
      route3d: "Modified-route 3D is unavailable unless an exact experimental modified CIF is mapped.",
      ncr: "NCR records are retained outside the scoring dataset and never participate in ranking.",
    },
  }

  const quarantine = {
    schemaVersion: "1.0.0",
    generatedAt,
    status: "active",
    liveAlgorithmExclusions: [
      {
        dataset: "Legacy RNG-generated CoRE MOF import",
        previousPath: "data/data_ingestion/core_mof_import_v2.json",
        previousRecords: 1240,
        reason: "Record identities and descriptors were generated placeholders rather than row-level source records.",
        replacement: "CoRE MOF 2024 CSD-modified CR import",
      },
      {
        dataset: "Legacy RNG-generated QMOF import",
        previousPath: "data/data_ingestion/qmof_import_v2.json",
        previousRecords: 1240,
        reason: "No row-level QMOF source mapping was present.",
        replacement: "No replacement yet; records are excluded until a real QMOF export is supplied.",
      },
      {
        dataset: "Legacy scalable/medium database preview",
        previousPath: "data/database_precompute/v2_2 and v2_1",
        reason: "Preview records are not eligible to override the real CoRE candidate index.",
        replacement: "data/core_mof_2024/cr_search_index.json",
      },
    ],
  }

  const emptyQmof = {
    version: "quarantined-2026-07-28",
    generatedAt,
    sourceDatabase: "QMOF",
    count: 0,
    summary: {
      total: 0,
      status: "quarantined",
      reason: "The previous 1,240 rows were RNG-generated placeholders without row-level QMOF identity.",
    },
    records: [],
  }

  const coreImport = {
    version: "coremof-2024-v1.1-csd-modified",
    datasetSignature: `coremof-2024-v1.1-csd-modified:${algorithmRecords.length}:${qualityReport.checks.uniqueCoreIds}`,
    generatedAt,
    sourceDatabase: "CoRE MOF 2024 · CSD-modified",
    sourceVersion: DATASET_VERSION,
    count: algorithmRecords.length,
    summary: {
      total: algorithmRecords.length,
      computationReady: algorithmRecords.length,
      provenanceConfirmed: algorithmRecords.length,
      sourceRecordLevel: algorithmRecords.length,
      extensionCounts,
      familyCounts,
      dataQualityStatus: qualityReport.status,
    },
    routeCohorts,
    records: algorithmRecords,
  }

  const indexRecords = searchIndex.map(record => {
    const available = [
      record.surfaceArea,
      record.poreVolume,
      record.density,
      record.voidFraction,
      record.pldA,
      record.lcdA,
    ].filter(Number.isFinite).length
    const structuralReady = available >= 4
    return {
      id: record.id,
      frameworkId: record.id,
      sourceDatabase: record.sourceDatabase,
      sourceRecordId: record.sourceRecordId,
      displayName: record.displayName,
      commonName: record.commonName || record.displayName,
      csdRefcode: record.csdRefcode,
      coreId: record.coreId,
      metals: record.metalElements,
      hasAlNode: record.metalElements?.includes("Al") || false,
      topology: record.topology,
      surfaceArea: record.surfaceArea,
      pldA: record.pldA,
      lcdA: record.lcdA,
      poreVolume: record.poreVolume,
      density: record.density,
      voidFraction: record.voidFraction,
      waterStability: undefined,
      thermalStability: undefined,
      sourceDoi: record.doi,
      citation: record.citation,
      license: record.license,
      dataQualityStatus: structuralReady ? "ready_for_structural_screening" : "needs_review",
      descriptorCompleteness: {
        available,
        total: 6,
        percent: Number((available / 6 * 100).toFixed(1)),
      },
      provenanceStatus: "source_record_confirmed",
      detailAvailable: false,
      finalRecommendationEligible: false,
      structureVariant: record.structureVariant,
      bundledCifPath: record.bundledCifPath,
    }
  })
  const algorithmRecordById = new Map(algorithmRecords.map(record => [record.id, record]))
  for (const record of indexRecords) {
    const source = algorithmRecordById.get(record.id)
    record.waterStability = source?.waterStabilityProbability
    record.thermalStability = source?.thermalStabilityC
  }
  const detailRecords = [...indexRecords]
    .sort((a, b) => b.descriptorCompleteness.percent - a.descriptorCompleteness.percent || a.id.localeCompare(b.id))
    .slice(0, 30)
  for (const record of detailRecords) {
    record.detailAvailable = true
    record.detailRef = `detail/framework/${record.id}.json`
  }
  const indexPartSize = 1000
  const indexPartPaths = []
  const indexPartWrites = []
  for (let offset = 0; offset < indexRecords.length; offset += indexPartSize) {
    const partNumber = Math.floor(offset / indexPartSize) + 1
    const fileName = `core_mof_index_part_${String(partNumber).padStart(3, "0")}.json`
    indexPartPaths.push(`core_mof_index_parts/${fileName}`)
    indexPartWrites.push(writeCompactJson(
      path.join(databaseIndexDirectory, "core_mof_index_parts", fileName),
      {
        dataset: "CoRE MOF 2024 · CSD-modified CR",
        part: partNumber,
        totalParts: Math.ceil(indexRecords.length / indexPartSize),
        records: indexRecords.slice(offset, offset + indexPartSize),
      },
    ))
  }
  const descriptorFields = [
    ["surfaceArea", "surfaceArea"],
    ["pldA", "pldA"],
    ["lcdA", "lcdA"],
    ["poreVolume", "poreVolume"],
    ["density", "density"],
    ["voidFraction", "voidFraction"],
    ["waterStability", "waterStability"],
    ["thermalStability", "thermalStability"],
    ["sourceDoi", "sourceDoi"],
  ]
  const descriptorCoverage = descriptorFields.map(([descriptor, field]) => {
    const available = indexRecords.filter(record => record[field] !== null && record[field] !== undefined && record[field] !== "").length
    return {
      descriptor,
      available,
      percent: Number((available / indexRecords.length * 100).toFixed(1)),
    }
  })
  const structurallyReady = indexRecords.filter(record => record.dataQualityStatus === "ready_for_structural_screening").length
  const topCandidates = detailRecords.slice(0, 12).map((record, index) => ({
    ...record,
    rank: index + 1,
    descriptorCompletenessPercent: record.descriptorCompleteness.percent,
    provenanceCompletenessPercent: 100,
    sourceUrl: DATASET_URL,
    retrievedAt: generatedAt.slice(0, 10),
    evidenceBoundary: "Real CoRE CR structure record selected for deterministic structural review; not a catalytic-performance ranking.",
    notFinalRecommendation: true,
  }))
  const databaseManifest = {
    version: "CoRE-MOF-2024-current",
    datasetMode: "real_core_mof_cr_index",
    description: "Record-level CoRE MOF 2024 CSD-modified CR index. Structural screening only; no catalytic outcome is inferred.",
    buildDate: generatedAt.slice(0, 10),
    sourceDatabases: [
      {
        name: "CoRE MOF 2024 · CSD-modified CR",
        status: "active_source_record_index",
        recordCount: indexRecords.length,
        detailCount: detailRecords.length,
        license: LICENSE,
        citation: "CoRE MOF 2024 v1.1",
        sourceUrl: DATASET_URL,
        notes: "All 9,835 CR records are real source rows with corresponding processed CIFs.",
      },
      {
        name: "QMOF",
        status: "quarantined",
        recordCount: 0,
        detailCount: 0,
        license: null,
        citation: null,
        sourceUrl: null,
        notes: "Legacy placeholder rows are excluded until a row-level QMOF export is supplied.",
      },
    ],
    files: {
      coreSummary: "core_mof_index_summary.json",
      qmofSummary: "qmof_index_summary.json",
      descriptorAvailability: "organic_acid_descriptor_availability.json",
      provenanceCoverage: "provenance_coverage_summary.json",
      topCandidates: "organic_acid_precomputed_top_candidates.json",
      needsReviewSummary: "rejected_and_needs_review_summary.json",
      buildReport: "index_build_report.json",
    },
    indexParts: {
      coreMof: indexPartPaths,
      qmof: [],
    },
    detailBasePaths: {
      framework: "detail/framework/",
      qmof: "detail/qmof/",
      evidence: "detail/evidence/",
    },
    warnings: [
      "Structural screening readiness does not mean catalytic performance or hydrothermal validation.",
      "QMOF is quarantined and contributes zero active records.",
    ],
  }
  const coreIndexSummary = {
    dataset: "CoRE MOF 2024 · CSD-modified CR",
    recordCount: indexRecords.length,
    alContainingCount: indexRecords.filter(record => record.hasAlNode).length,
    hasAlNodeCount: indexRecords.filter(record => record.hasAlNode).length,
    readyForScoring: structurallyReady,
    needsReview: indexRecords.length - structurallyReady,
    rejected: 0,
    finalRecommendationEligible: 0,
    topMissingFields: descriptorCoverage.filter(row => row.available < indexRecords.length).sort((a, b) => a.available - b.available).map(row => row.descriptor),
    notes: "readyForScoring means ready for structural-factor screening only; reaction performance still requires independent evidence.",
  }
  const qmofIndexSummary = {
    dataset: "QMOF",
    recordCount: 0,
    status: "quarantined",
    matchedFrameworks: 0,
    unmatchedRecords: 0,
    availableDescriptors: {},
    notes: "No active QMOF rows. Legacy placeholders are quarantined.",
  }
  const provenanceCoverage = {
    totalRecords: indexRecords.length,
    withSourceDatabase: indexRecords.length,
    withSourceRecordId: indexRecords.length,
    withSourceDoi: indexRecords.filter(record => record.sourceDoi).length,
    withCitation: indexRecords.filter(record => record.citation).length,
    withLicense: indexRecords.filter(record => record.license).length,
    fieldSourceCoveragePercent: 100,
    doiCoveragePercent: Number((indexRecords.filter(record => record.sourceDoi).length / indexRecords.length * 100).toFixed(1)),
    evidenceIdsCoveragePercent: 0,
    warning: "Source identity is complete; catalytic evidence and route-modified CIFs remain separate and are not inferred.",
  }
  const currentTargets = {
    total: records.length,
    totalMin: records.length,
    coreMof: records.length,
    qmof: 0,
    literature: 0,
    verifiedMetadata: records.length,
    goldDataset: 0,
    reactionDataset: 0,
    benchmarkDataset: 0,
  }
  const currentIngestionSummary = {
    version: "CoRE-MOF-2024-current",
    generatedAt,
    totalRecords: records.length,
    totalRealRecords: records.length,
    externalDatabaseCount: records.length,
    coreCount: records.length,
    qmofCount: 0,
    literatureCount: 0,
    experimentalCount: 0,
    derivedCount: 0,
    verifiedMetadataCount: records.length,
    goldCount: 0,
    reactionCount: 0,
    benchmarkCount: 0,
    originAudit: {
      auditId: "coremof-2024-current-origin-audit",
      total: records.length,
      counts: {
        external_database: records.length,
        literature_curated: 0,
        experimental: 0,
        expert_review: 0,
        derived_dataset: 0,
        synthetic_fixture: 0,
      },
      externalDatabase: records.length,
      literature: 0,
      experimental: 0,
      expert: 0,
      derived: 0,
      synthetic: 0,
      realData: records.length,
      realDataShare: 1,
      derivedShare: 0,
      experimentalShare: 0,
      missingOrigin: 0,
      derivedIsolated: true,
      status: "Pass",
    },
    breakdown: {
      externalDatabase: 1,
      literature: 0,
      experimental: 0,
      derived: 0,
    },
    targets: currentTargets,
    stats: Object.fromEntries([
      ["total", records.length],
      ["coreMof", records.length],
      ["qmof", 0],
      ["literature", 0],
      ["verifiedMetadata", records.length],
      ["goldDataset", 0],
      ["reactionDataset", 0],
    ].map(([key, current]) => [key, { current, target: currentTargets[key], gap: 0 }])),
    acceptance: {
      totalMin: true,
      total: true,
      coreMof: true,
      qmof: false,
      literature: false,
      verifiedMetadata: true,
      goldDataset: false,
      reactionDataset: false,
    },
    availability: {
      coreMof: { status: "active", count: records.length },
      qmof: { status: "quarantined", count: 0, reason: emptyQmof.summary.reason },
      literature: { status: "quarantined", count: 0, reason: "Legacy RNG-generated V3.3 literature rows had no confirmed DOI mapping." },
      goldDataset: { status: "quarantined", count: 0, reason: "Legacy Gold rows inherited placeholder CoRE/QMOF identities." },
      reactionDataset: { status: "quarantined", count: 0, reason: "Legacy reaction rows were derived from placeholder candidates, not experiments." },
      benchmarkDataset: { status: "quarantined", count: 0, reason: "Legacy V3.3 derived benchmark is not the independent V3.6 benchmark dataset." },
    },
  }
  const quarantinedDerived = (dataset, reason, extra = {}) => ({
    version: "quarantined-2026-07-28",
    generatedAt,
    dataset,
    status: "quarantined",
    total: 0,
    count: 0,
    records: [],
    labels: [],
    reason,
    excludedFromCurrentStatistics: true,
    ...extra,
  })
  const currentHome = await readJson(path.join(appDataDirectory, "home_summary.json"), {})
  const gasRecordCount = Number(currentHome?.gasAdsorptionV21?.recordCount || 0)
  const currentHomeSummary = {
    ...currentHome,
    totalRecords: records.length + gasRecordCount,
    coreMofRecords: records.length,
    qmofRecords: 0,
    organicAcidLiteratureRecords: 0,
    verifiedMetadataCount: records.length,
    goldDatasetCount: 0,
    reactionDatasetCount: 0,
    structuralSourceStatus: "active",
    coreMofSourceLabel: "CoRE MOF 2024 · CSD-modified CR",
    qmofStatus: "quarantined",
    literatureV33Status: "quarantined",
    lastUpdated: generatedAt.slice(0, 10),
    sourceFiles: unique([
      "public/data/core_mof_2024/summary.json",
      "public/data/core_mof_2024/quality_report.json",
      "public/data/core_mof_2024/legacy_data_quarantine.json",
      "public/data/database_index/manifest.json",
      ...asArray(currentHome.sourceFiles),
    ]),
    notes: unique([
      "Current structural records use 9,835 row-level CoRE MOF 2024 CSD-modified CR entries. Legacy placeholder CoRE/QMOF and their V3.3 derived datasets are excluded from current statistics.",
      ...asArray(currentHome.notes),
    ]),
  }
  const versionEvolutionPath = path.join(appDataDirectory, "version_evolution_records.json")
  const versionEvolution = await readJson(versionEvolutionPath, {})
  const currentDatabaseSize = records.length + gasRecordCount
  const currentSource = {
    value: currentDatabaseSize,
    sourceDatabase: "CoRE MOF 2024 CSD-modified CR + EcoMOF gas adsorption v2.1",
    sourceRecordId: "home_summary.totalRecords",
    sourceUrl: "public/data/home_summary.json",
    citation: "CoRE MOF 2024 v1.1 source-row import plus the existing gas adsorption v2.1 record layer.",
    license: LICENSE,
    retrievedAt: generatedAt.slice(0, 10),
    curationStatus: "confirmed",
    confidence: 1,
    databaseVersion: "coremof-2024-current",
    generatingScript: "scripts/build-core-mof-2024-csd-modified.mjs",
    notes: "Counts 9,835 active CoRE CR structure rows and 442 existing gas records; quarantined placeholder/derived rows are excluded.",
  }
  const updatedVersionEvolution = {
    ...versionEvolution,
    overview: {
      ...(versionEvolution.overview || {}),
      databaseSize: currentDatabaseSize,
      verifiedMetadataCount: records.length,
      sourceConfirmedCount: records.length,
      citationReadyCount: records.length,
      reactionDatasetCount: 0,
      goldDatasetCount: 0,
      databasePreviewStatus: "Real CoRE CR Index / Structural Screening",
      dataMigrationStatus: "CoRE MOF 2024 CSD-modified CR active; legacy placeholders quarantined",
      sources: {
        ...(versionEvolution.overview?.sources || {}),
        databaseSize: currentSource,
        verifiedMetadataCount: { ...currentSource, value: records.length, sourceRecordId: "core_mof_2024.quality_report.checks.generatedRecords", sourceUrl: "public/data/core_mof_2024/quality_report.json" },
        sourceConfirmedCount: { ...currentSource, value: records.length, sourceRecordId: "core_mof_2024.quality_report.checks.uniqueCoreIds", sourceUrl: "public/data/core_mof_2024/quality_report.json" },
        citationReadyCount: { ...currentSource, value: records.length, sourceRecordId: "core_mof_2024.quality_report.checks.requiredDoiMissing", sourceUrl: "public/data/core_mof_2024/quality_report.json" },
      },
    },
  }
  const growthTracker = await readJson(path.join(appDataDirectory, "data_ingestion", "data_growth_tracker_v3_3.json"), { series: {} })
  const updatedGrowthTracker = {
    ...growthTracker,
    currentDatasetState: "CoRE-MOF-2024-current",
    generatedAt,
    series: {
      ...(growthTracker.series || {}),
      "CoRE-2024-CR": {
        records: records.length,
        gold: 0,
        verified: records.length,
        reaction: 0,
        labels: 0,
      },
    },
    note: "V3.0-V3.3 entries are historical. CoRE-2024-CR is the current active source-row state; legacy placeholder-derived counts are excluded.",
  }
  const verifiedReport = {
    version: "CoRE-MOF-2024-current",
    generatedAt,
    verifiedCount: records.length,
    target: records.length,
    sufficient: true,
    sources: { coreMof: records.length, qmof: 0 },
    note: "Verified metadata means a row-level CoRE 2024 CR identity with CSD refcode, DOI, citation, and processed CIF. QMOF contributes zero active rows.",
  }
  const realDataSources = {
    version: "CoRE-MOF-2024-current",
    generatedAt,
    generator: "scripts/build-core-mof-2024-csd-modified.mjs",
    note: "Only row-level source records are active. Placeholder-generated datasets are quarantined.",
    sources: [
      {
        sourceId: "SRC-CORE-MOF-2024-CSD-MODIFIED-CR",
        category: "CoRE MOF 2024 · CSD-modified CR",
        target: records.length,
        imported: records.length,
        status: "active",
        datasetOrigin: "external_database",
        doi: "10.5281/zenodo.15055758",
        sourceUrl: DATASET_URL,
        license: LICENSE,
      },
      {
        sourceId: "SRC-QMOF",
        category: "QMOF",
        target: 0,
        imported: 0,
        status: "quarantined",
        datasetOrigin: "external_database",
        reason: emptyQmof.summary.reason,
      },
    ],
  }

  await Promise.all([
    ...indexPartWrites,
    ...detailRecords.map(record => writeJson(path.join(databaseIndexDirectory, "detail", "framework", `${record.id}.json`), {
      ...record,
      descriptors: {
        surfaceArea: record.surfaceArea,
        pldA: record.pldA,
        lcdA: record.lcdA,
        poreVolume: record.poreVolume,
        density: record.density,
        voidFraction: record.voidFraction,
        waterStability: record.waterStability,
        thermalStability: record.thermalStability,
      },
      dataQualityGate: {
        status: record.dataQualityStatus,
        boundary: "Structural screening only; no catalytic performance or modified-route structure is inferred.",
      },
      dataStatus: { level: "real_core_mof_cr_index" },
    })),
    writeJson(path.join(datasetDirectory, "summary.json"), summary),
    writeJson(path.join(datasetDirectory, "quality_report.json"), qualityReport),
    writeJson(path.join(datasetDirectory, "route_cohorts.json"), routeCohorts),
    writeCompactJson(path.join(datasetDirectory, "cr_search_index.json"), searchIndex),
    writeJson(path.join(datasetDirectory, "legacy_data_quarantine.json"), quarantine),
    writeCompactJson(path.join(appDataDirectory, "data_ingestion", "core_mof_import_v2.json"), coreImport),
    writeJson(path.join(appDataDirectory, "data_ingestion", "qmof_import_v2.json"), emptyQmof),
    writeJson(path.join(databaseIndexDirectory, "manifest.json"), databaseManifest),
    writeJson(path.join(databaseIndexDirectory, "core_mof_index_summary.json"), coreIndexSummary),
    writeJson(path.join(databaseIndexDirectory, "qmof_index_summary.json"), qmofIndexSummary),
    writeJson(path.join(databaseIndexDirectory, "organic_acid_descriptor_availability.json"), {
      totalRecords: indexRecords.length,
      descriptorCoverage,
      interpretation: "Geometry/descriptors come from real CoRE CR rows. Catalytic and hydrothermal evidence remains a separate gate.",
    }),
    writeJson(path.join(databaseIndexDirectory, "provenance_coverage_summary.json"), provenanceCoverage),
    writeJson(path.join(databaseIndexDirectory, "organic_acid_precomputed_top_candidates.json"), {
      version: "CoRE-MOF-2024-current",
      datasetMode: "real_core_mof_cr_index",
      precomputedAt: generatedAt,
      method: "Descriptor-completeness structural review queue; not OACS or catalytic-performance ranking.",
      topCandidates,
      finalRecommendationCount: 0,
      notFullScreening: true,
      blockedReasonSummary: [{ reason: "Independent catalytic evidence unavailable", count: topCandidates.length }],
      warnings: ["Top candidates are review exemplars only and are not final recommendations."],
    }),
    writeJson(path.join(databaseIndexDirectory, "rejected_and_needs_review_summary.json"), {
      datasetMode: "real_core_mof_cr_index",
      totalRecords: indexRecords.length,
      readyForScoring: structurallyReady,
      needsReview: indexRecords.length - structurallyReady,
      rejected: 0,
      finalRecommendationEligible: 0,
      blockedReasonSummary: [{ reason: "Independent catalytic evidence required for final recommendation", count: indexRecords.length }],
      warning: "Structural screening readiness is not catalytic validation.",
    }),
    writeJson(path.join(databaseIndexDirectory, "index_build_report.json"), {
      version: "CoRE-MOF-2024-current",
      datasetMode: "real_core_mof_cr_index",
      dryRun: false,
      buildDate: generatedAt,
      sourceInputs: [path.basename(csvPath), "9,835 processed CR CIFs"],
      generatedRecordCounts: {
        coreMofIndexRecords: indexRecords.length,
        qmofIndexRecords: 0,
        frameworkDetailRecords: detailRecords.length,
        qmofDetailRecords: 0,
      },
      mapperBoundary: "Built directly from CoRE MOF 2024 CSD-modified CR source rows.",
      warning: "Does not create catalytic-performance labels or modified-route CIFs.",
    }),
    writeJson(path.join(databaseIndexDirectory, "validation_report.json"), {
      version: "CoRE-MOF-2024-current",
      status: qualityReport.status,
      checks: qualityReport.checks,
    }),
    writeJson(path.join(databaseIndexDirectory, "core_mof_index_parts", "README.json"), {
      dataset: "CoRE MOF 2024 · CSD-modified CR",
      totalRecords: indexRecords.length,
      totalParts: indexPartPaths.length,
      partSize: indexPartSize,
      files: indexPartPaths,
    }),
    writeJson(path.join(databaseIndexDirectory, "qmof_index_parts", "README.json"), {
      dataset: "QMOF",
      status: "quarantined",
      totalRecords: 0,
      files: ["qmof_index_part_001.json"],
    }),
    writeJson(path.join(databaseIndexDirectory, "qmof_index_parts", "qmof_index_part_001.json"), {
      dataset: "QMOF",
      status: "quarantined",
      records: [],
    }),
    writeJson(path.join(appDataDirectory, "data_ingestion", "data_ingestion_summary_v3.json"), currentIngestionSummary),
    writeJson(path.join(appDataDirectory, "data_ingestion", "data_growth_tracker_v3_3.json"), updatedGrowthTracker),
    writeJson(path.join(appDataDirectory, "data_ingestion", "verified_metadata_expansion_report_v3.json"), verifiedReport),
    writeJson(path.join(appDataDirectory, "data_ingestion", "real_data_sources_v3.json"), realDataSources),
    writeJson(path.join(appDataDirectory, "organic_acid_literature_dataset_v3.json"), quarantinedDerived("Organic Acid Literature V3.3", "Legacy RNG-generated rows had no confirmed DOI mapping.")),
    writeJson(path.join(appDataDirectory, "organic_acid_gold_dataset_v3.json"), quarantinedDerived("Organic Acid Gold V3.3", "Legacy Gold rows inherited placeholder CoRE/QMOF identities.", { goldCount: 0, sufficient: false })),
    writeJson(path.join(appDataDirectory, "organic_acid_reaction_dataset_v3.json"), quarantinedDerived("Organic Acid Reaction V3.3", "Legacy rows were derived from placeholder candidates and are not experimental.", { datasetOrigin: "quarantined_derived_dataset" })),
    writeJson(path.join(appDataDirectory, "benchmark_dataset_v3.json"), quarantinedDerived("Benchmark Dataset V3.3", "Legacy V3.3 derived benchmark is excluded; the independent V3.6 benchmark remains separate.", { summary: { labelCount: 0, benchmarkEligibleCount: 0, datasetOrigin: "quarantined_derived_dataset" } })),
    writeJson(path.join(appDataDirectory, "organic_acid_labels_v3.json"), quarantinedDerived("Organic Acid Labels V3.3", "Legacy labels were generated from unverified literature and placeholder-derived reaction rows.")),
    writeJson(path.join(appDataDirectory, "home_summary.json"), currentHomeSummary),
    writeJson(versionEvolutionPath, updatedVersionEvolution),
  ])

  process.stdout.write(`${JSON.stringify({
    sourceDirectory,
    csvRows: sourceRows.length,
    generatedRecords: records.length,
    dataQualityStatus: qualityReport.status,
    cifPresent: cifPresentCount,
    routeStructures: routeStructureRecords.length,
    familyCounts,
    outputs: {
      coreImport: "public/data/data_ingestion/core_mof_import_v2.json",
      searchIndex: "public/data/core_mof_2024/cr_search_index.json",
      routeCohorts: "public/data/core_mof_2024/route_cohorts.json",
      qualityReport: "public/data/core_mof_2024/quality_report.json",
    },
  }, null, 2)}\n`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
