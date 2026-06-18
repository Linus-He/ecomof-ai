// @ts-nocheck
import { normalizeMofRecord } from "../dataStandardization/normalizeMofRecord.js"
import { runImport } from "./runImport.js"

// Real CoRE MOF 2019 dataset-level provenance (never fabricated).
export const CORE_MOF_PROVENANCE = {
  sourceDatabase: "CoRE MOF",
  sourceVersion: "2.0.0 (2024-11-13)",
  doi: "10.5281/zenodo.14132134",
  citation: "Chung et al., Computation-Ready Experimental Metal-Organic Framework (CoRE MOF) 2019 Dataset, Zenodo v2.0.0, DOI:10.5281/zenodo.14132134; associated article DOI:10.1021/acs.jced.9b00835.",
  sourceUrl: "https://zenodo.org/records/14132134/files/ASR_20241113.csv?download=1",
  license: "CC-BY-4.0",
  sourceId: "SRC-CORE-MOF-2019",
}

// Map a raw CoRE row into the unified MOF + provenance shape with datasetOrigin.
export function mapCoreMofRow(raw = {}) {
  const mof = normalizeMofRecord(raw, { sourceId: CORE_MOF_PROVENANCE.sourceId })
  return {
    mofId: mof.mofId,
    displayName: mof.displayName,
    sourceDatabase: CORE_MOF_PROVENANCE.sourceDatabase,
    sourceRecordId: raw.sourceRecordId || mof.mofId,
    sourceVersion: CORE_MOF_PROVENANCE.sourceVersion,
    datasetOrigin: "external_database",
    metalNode: mof.metalNode,
    linker: mof.linker,
    topology: mof.topology,
    surfaceArea: mof.surfaceArea,
    poreVolume: mof.poreVolume,
    density: mof.density,
    voidFraction: mof.voidFraction,
    doi: CORE_MOF_PROVENANCE.doi,
    citation: CORE_MOF_PROVENANCE.citation,
    sourceUrl: CORE_MOF_PROVENANCE.sourceUrl,
    license: CORE_MOF_PROVENANCE.license,
    valueBasis: raw.valueBasis || "database_distribution",
  }
}

export function importCoreMof(rawRows = []) {
  const mapped = rawRows.map(mapCoreMofRow)
  return runImport(mapped, { origin: "external_database" })
}
