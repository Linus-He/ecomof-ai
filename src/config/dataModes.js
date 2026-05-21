export const DATA_MODES = {
  OPEN_MOF_SEED: "open-mof-seed",
  DEMO: "demo",
  REAL_SEED: "real-seed",
}

export const DEFAULT_CANDIDATE_DATA_MODE = DATA_MODES.OPEN_MOF_SEED

export function isOpenMofSeedMode(mode) {
  return mode === DATA_MODES.OPEN_MOF_SEED
}
