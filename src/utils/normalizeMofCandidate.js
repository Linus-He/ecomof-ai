import { DEFAULT_CANDIDATE_DATA_MODE } from "../config/dataModes"
import { buildCandidateSearchText, resolveMofDisplayName } from "./mofDisplayName"

const PENDING = "pending"

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null)
}

function firstText(...values) {
  const value = values.find(item => item !== undefined && item !== null && String(item).trim() !== "")
  return value === undefined ? PENDING : String(value)
}

function makeFieldSource(candidate, key, value, unit = "") {
  const status = candidate.descriptorCompleteness?.[key] || candidate.curationStatus || PENDING
  if (value === null || value === undefined || value === "" || status === "pending") {
    return { sourceType: "pending", value, unit, curationStatus: status }
  }
  return {
    sourceType: "open-mof-seed",
    sourceName: candidate.sourceDatabase,
    sourceDatabase: candidate.sourceDatabase,
    database: candidate.sourceDatabase,
    sourceRecordId: candidate.sourceRecordId,
    sourceVersion: candidate.sourceVersion,
    sourceUrl: candidate.sourceUrl,
    url: candidate.sourceUrl,
    citation: candidate.citation,
    license: candidate.license,
    curationStatus: status,
    value,
    unit,
  }
}

export function pendingGraphMetadata() {
  return {
    graphStatus: PENDING,
    nodeTypes: [],
    edgeTypes: [],
    activeMotifs: [],
    graphCluster: PENDING,
    diversityScore: null,
    graphMotifScore: 0,
    graphConfidence: PENDING,
    notes: "Graph metadata pending curation.",
  }
}

export function pendingOrganicAcidRelevance() {
  return {
    targetPathway: PENDING,
    possibleRoles: [],
    pathwayPriorityScore: null,
    scoreStatus: PENDING,
    validationNeeded: ["Organic acid pathway relevance pending curation."],
    notes: "No organic acid relevance has been assigned.",
  }
}

export function normalizeMofCandidate(raw = {}, options = {}) {
  const descriptors = raw.descriptors || {}
  const chemistry = raw.chemistry || {}
  const structure = raw.structure || {}
  const provenanceSource = raw.provenance || {}
  const sourceDatabase = firstText(raw.sourceDatabase, provenanceSource.sourceDatabase, provenanceSource.database)
  const sourceRecordId = firstText(raw.sourceRecordId, provenanceSource.sourceRecordId, provenanceSource.recordId)
  const sourceVersion = firstText(raw.sourceVersion, provenanceSource.sourceVersion)
  const sourceUrl = firstText(raw.sourceUrl, provenanceSource.sourceUrl)
  const citation = firstText(raw.citation, provenanceSource.citation)
  const license = firstText(raw.license, provenanceSource.license)
  const retrievedAt = firstText(raw.retrievedAt, provenanceSource.retrievedAt)
  const curationStatus = firstText(raw.curationStatus, provenanceSource.curationStatus)
  const dataMode = options.mode || raw.dataMode || raw.dataStatus || DEFAULT_CANDIDATE_DATA_MODE

  const graphMetadata = raw.graphMetadata || pendingGraphMetadata()
  const organicAcidRelevance = raw.organicAcidRelevance || pendingOrganicAcidRelevance()
  const nameResolution = resolveMofDisplayName(
    {
      ...raw,
      sourceDatabase,
      sourceRecordId,
      sourceVersion,
      sourceUrl,
      citation,
      license,
      retrievedAt,
      curationStatus,
    },
    options.aliasDictionary || [],
  )

  const normalized = {
    ...raw,
    id: firstText(raw.id, sourceRecordId),
    name: nameResolution.displayName,
    sourceName: raw.name || nameResolution.rawName,
    displayName: nameResolution.displayName,
    displayNameType: nameResolution.displayNameType,
    aliasNames: nameResolution.aliasNames,
    rawName: nameResolution.rawName,
    nameCuration: nameResolution.nameCuration,
    sourceDatabase,
    sourceRecordId,
    sourceVersion,
    sourceUrl,
    citation,
    license,
    retrievedAt,
    curationStatus,
    descriptors,
    chemistry,
    structure,
    surfaceArea: firstDefined(raw.surfaceArea, descriptors.surfaceArea),
    poreSizeA: firstDefined(raw.poreSizeA, descriptors.poreSizeA, descriptors.pldA, raw.pldA),
    pldA: firstDefined(raw.pldA, descriptors.pldA),
    lcdA: firstDefined(raw.lcdA, descriptors.lcdA),
    poreVolume: firstDefined(raw.poreVolume, descriptors.poreVolume),
    density: firstDefined(raw.density, descriptors.density),
    voidFraction: firstDefined(raw.voidFraction, descriptors.voidFraction),
    bandGap: firstDefined(raw.bandGap, descriptors.bandGap),
    co2Uptake: firstDefined(raw.co2Uptake, descriptors.co2Uptake),
    cifFile: firstDefined(raw.cifFile, structure.cifFile),
    cifUrl: firstDefined(raw.cifUrl, structure.cifUrl),
    metalNode: firstText(raw.metalNode, chemistry.metalNode),
    linker: firstText(raw.linker, chemistry.linker),
    topology: firstText(raw.topology, structure.topology),
    descriptorCompleteness: raw.descriptorCompleteness || {},
    graphMetadata,
    organicAcidRelevance,
    provenance: {
      ...provenanceSource,
      sourceDatabase,
      database: sourceDatabase,
      sourceRecordId,
      sourceVersion,
      sourceUrl,
      citation,
      license,
      retrievedAt,
      curationStatus,
    },
    dataMode,
    dataStatus: raw.dataStatus || dataMode,
    rawRecord: raw,
  }
  const fieldSourceCandidate = {
    ...normalized,
    descriptorCompleteness: normalized.descriptorCompleteness || {},
  }
  const fieldSources = {
    ...(raw.fieldSources || {}),
    surfaceArea: makeFieldSource(fieldSourceCandidate, "surfaceArea", normalized.surfaceArea, "m²/g"),
    poreSizeA: makeFieldSource(fieldSourceCandidate, "poreSizeA", normalized.poreSizeA, "Å"),
    pldA: makeFieldSource(fieldSourceCandidate, "pldA", normalized.pldA, "Å"),
    lcdA: makeFieldSource(fieldSourceCandidate, "lcdA", normalized.lcdA, "Å"),
    poreVolume: makeFieldSource(fieldSourceCandidate, "poreVolume", normalized.poreVolume, "cm³/g"),
    density: makeFieldSource(fieldSourceCandidate, "density", normalized.density, "g/cm³"),
    voidFraction: makeFieldSource(fieldSourceCandidate, "voidFraction", normalized.voidFraction),
    bandGap: makeFieldSource(fieldSourceCandidate, "bandGap", normalized.bandGap, "eV"),
    co2Uptake: makeFieldSource(fieldSourceCandidate, "co2Uptake", normalized.co2Uptake, "mmol/g"),
  }
  return {
    ...normalized,
    fieldSources,
    searchText: buildCandidateSearchText(normalized),
  }
}
