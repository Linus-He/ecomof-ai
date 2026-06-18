// @ts-nocheck
import { normalizeMofRecord } from "../dataStandardization/normalizeMofRecord.js"
import { runImport } from "./runImport.js"

// Real QMOF dataset-level provenance (never fabricated).
export const QMOF_PROVENANCE = {
  sourceDatabase: "QMOF",
  sourceVersion: "16 (2025-06-03)",
  doi: "10.1016/j.matt.2021.02.015",
  citation: "Rosen et al., Machine Learning the Quantum-Chemical Properties of Metal-Organic Frameworks for Accelerated Materials Discovery, Matter 2021, DOI:10.1016/j.matt.2021.02.015 (QMOF Database).",
  sourceUrl: "https://figshare.com/articles/dataset/QMOF_Database/13147324",
  license: "CC-BY-4.0",
  sourceId: "SRC-QMOF",
}

export function mapQmofRow(raw = {}) {
  const mof = normalizeMofRecord(raw, { sourceId: QMOF_PROVENANCE.sourceId })
  return {
    mofId: mof.mofId,
    sourceDatabase: QMOF_PROVENANCE.sourceDatabase,
    sourceRecordId: raw.sourceRecordId || mof.mofId,
    sourceVersion: QMOF_PROVENANCE.sourceVersion,
    datasetOrigin: "external_database",
    bandGap: mof.bandGap,
    density: mof.density,
    surfaceArea: mof.surfaceArea,
    voidFraction: mof.voidFraction,
    metalNode: mof.metalNode,
    topology: mof.topology,
    doi: QMOF_PROVENANCE.doi,
    citation: QMOF_PROVENANCE.citation,
    sourceUrl: QMOF_PROVENANCE.sourceUrl,
    license: QMOF_PROVENANCE.license,
    valueBasis: raw.valueBasis || "database_distribution",
  }
}

export function importQmof(rawRows = []) {
  const mapped = rawRows.map(mapQmofRow)
  return runImport(mapped, { origin: "external_database" })
}
