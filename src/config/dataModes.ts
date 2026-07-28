// @ts-nocheck
export const DATA_MODES = {
  CORE_MOF_2024_CR: "core-mof-2024-cr",
  OPEN_MOF_SEED: "open-mof-seed",
  DEMO: "demo",
  REAL_SEED: "real-seed",
}

export const DEFAULT_CANDIDATE_DATA_MODE = DATA_MODES.CORE_MOF_2024_CR

export function isOpenMofSeedMode(mode) {
  return mode === DATA_MODES.OPEN_MOF_SEED
}
