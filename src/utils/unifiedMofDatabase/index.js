// @ts-nocheck
import { resolveMof, normalizeMofName, getLinkedRecords } from "../mofIdentity"

function hasValue(value) {
  if (value === undefined || value === null || value === "") return false
  if (typeof value === "number") return Number.isFinite(value)
  const normalized = String(value).toLowerCase()
  return !["pending", "null", "undefined", "nan", "not reported"].includes(normalized)
}

function structureName(row = {}) {
  return row.displayName || row.name || row.rawName || row.sourceRecordId || row.source_record || row.id || "MOF record"
}

function structureId(row = {}) {
  return row.id || row.candidateId || row.sourceRecordId || row.source_record || structureName(row)
}

function mergeUnique(values = []) {
  return [...new Set(values.filter(hasValue).map(String))]
}

function summarizeGas(records = []) {
  return {
    gasPairs: mergeUnique(records.map(record => record.gasPair)),
    dataGrades: mergeUnique(records.map(record => record.dataGrade || record.evidence?.dataGrade)),
    experimentalCount: records.filter(record => (record.dataGrade || record.evidence?.dataGrade) === "experimental").length,
    computedCount: records.filter(record => (record.dataGrade || record.evidence?.dataGrade) === "computed").length,
    seedCount: records.filter(record => (record.dataGrade || record.evidence?.dataGrade) === "seed").length,
    isothermCount: records.filter(record => Array.isArray(record.isotherm) && record.isotherm.length).length,
  }
}

export function buildUnifiedMofRows({ structures = [], gasRecords = [], registry = {} } = {}) {
  const gasById = new Map(gasRecords.map(record => [record.id, record]))
  const usedGasIds = new Set()
  const rows = structures.map(structure => {
    const name = structureName(structure)
    const canonicalId = resolveMof(name, registry) || `unresolved-${normalizeMofName(name)}`
    const links = getLinkedRecords(canonicalId, registry)
    const linkedGas = (links.gas || []).map(link => gasById.get(link.id)).filter(Boolean)
    linkedGas.forEach(record => usedGasIds.add(record.id))
    const gasSummary = summarizeGas(linkedGas)
    return {
      id: `unified-${structureId(structure)}`,
      canonicalId,
      displayName: name,
      primaryName: name,
      sourceDatabase: structure.sourceDatabase || structure.source_database || structure.provenance?.sourceDatabase || "structural",
      sourceRecordId: structure.sourceRecordId || structure.source_record || structure.id,
      metalNode: structure.metalNode || structure.metal || structure.chemistry?.metalNode || "pending",
      topology: structure.topology || structure.structure?.topology || "pending",
      surfaceArea: structure.surfaceArea ?? structure.bet_m2g ?? structure.descriptors?.surfaceArea ?? null,
      poreSizeA: structure.poreSizeA ?? structure.pldA ?? structure.pld_a ?? structure.descriptors?.poreSizeA ?? null,
      poreVolume: structure.poreVolume ?? structure.pore_volume_cm3g ?? structure.descriptors?.poreVolume ?? null,
      density: structure.density ?? structure.density_gcm3 ?? structure.descriptors?.density ?? null,
      structure,
      gasRecords: linkedGas,
      gasSummary,
      catalysisLinks: links.catalysis || [],
      completeness: {
        structure: true,
        gas: linkedGas.length > 0,
        catalysis: (links.catalysis || []).length > 0,
      },
    }
  })
  for (const record of gasRecords) {
    if (usedGasIds.has(record.id)) continue
    const canonicalId = record.canonicalId || resolveMof(record.rawName || record.displayName, registry) || `gas-only-${normalizeMofName(record.rawName || record.displayName)}`
    const links = getLinkedRecords(canonicalId, registry)
    rows.push({
      id: `unified-${record.id}`,
      canonicalId,
      displayName: record.rawName || record.displayName,
      primaryName: record.rawName || record.displayName,
      sourceDatabase: "Gas adsorption",
      sourceRecordId: record.id,
      metalNode: record.descriptors?.metalNode || "pending",
      topology: record.descriptors?.topology || "pending",
      surfaceArea: record.descriptors?.surfaceArea ?? null,
      poreSizeA: record.descriptors?.poreSizeA ?? null,
      poreVolume: record.descriptors?.poreVolume ?? null,
      density: record.descriptors?.density ?? null,
      structure: null,
      gasRecords: [record],
      gasSummary: summarizeGas([record]),
      catalysisLinks: links.catalysis || [],
      completeness: {
        structure: false,
        gas: true,
        catalysis: (links.catalysis || []).length > 0,
      },
    })
  }
  return rows
}
