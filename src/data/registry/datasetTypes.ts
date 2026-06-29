// @ts-nocheck
// V3.9 data registry — shared vocabulary for the global data-source registry.
// Every dashboard card that talks about "the database" resolves its category,
// type, and data mode through these enums so nothing is invented ad hoc.

// What kind of records a source holds.
export const DATASET_TYPES = [
  "mof_records",
  "gas_separation_records",
  "organic_acid_records",
  "benchmark_records",
  "version_records",
  "research_report_records",
  "provenance_records",
  "identity_registry",
] as const

// Honesty label: how "real" the data is. NEVER let demo/seed masquerade as a
// complete real database.
export const DATA_MODES = ["demo", "seed", "curated", "inferred", "experimental", "literature", "simulation", "mixed"] as const

export type DatasetType = (typeof DATASET_TYPES)[number]
export type DataMode = (typeof DATA_MODES)[number]

// Where a source feeds the UI / outputs.
export const PARTICIPATION = ["home", "projectStatus", "researchReports", "benchmark", "export", "mofLibrary", "gasSep", "organicAcid"] as const
export type Participation = (typeof PARTICIPATION)[number]

export interface DataSourceEntry {
  id: string
  name: string
  category: string
  datasetType: DatasetType
  dataMode: DataMode
  path: string | null
  hasProvenance: boolean
  participatesIn: Participation[]
  updatedAt: string
  recordKey?: string // dotted path / array key used to count records
  note?: string
}

export function isDataMode(value: unknown): value is DataMode {
  return typeof value === "string" && (DATA_MODES as readonly string[]).includes(value)
}
export function isDatasetType(value: unknown): value is DatasetType {
  return typeof value === "string" && (DATASET_TYPES as readonly string[]).includes(value)
}
