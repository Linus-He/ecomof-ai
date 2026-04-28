export const DEFAULT_INPUTS = {
  mofName: "",
  metalCenter: "Zr4+",
  organicLinker: "BDC",
  poreDiameter: 8.5,
  betSurfaceArea: 1850,
  poreVolume: 0.82,
  functionalGroups: ["amine"],
  functionalGroupDetails: { amine: { count: 1, positions: ["2"] } },
  temperature: 298,
  pressure: 0.15,
  mlAlgorithm: "ensemble",
  gasSystem: "CO2/N2",
}

// ─── Prediction Engine (CoRE-2019 based correlations) ───────────────────────

export const R_GAS = 8.314e-3 // kJ/(mol·K)

// Browser-side model profiles. These are transparent, independent static profiles
// for the no-backend demo; they are not serialized training checkpoints.
export const MODEL_PROFILES = {
  ensemble: { label: "Ensemble", status: "Stable baseline", r2: 0.864, mae: 0.31, rmse: 0.47, weights: { sa: 0.78, pv: 2.40, pd: 0.045, fg: 1.00, sel: 1.00, conf: 0.00 } },
  rf:       { label: "Random Forest", status: "Prototype profile", r2: 0.821, mae: 0.38, rmse: 0.54, weights: { sa: 0.72, pv: 2.18, pd: 0.052, fg: 0.92, sel: 0.95, conf: -0.04 } },
  gbm:      { label: "Gradient Boosting", status: "Experimental profile", r2: 0.848, mae: 0.34, rmse: 0.50, weights: { sa: 0.83, pv: 2.32, pd: 0.040, fg: 1.05, sel: 1.04, conf: 0.01 } },
  gnn:      { label: "Graph Neural Network", status: "Coming-soon scaffold", r2: 0.872, mae: 0.30, rmse: 0.45, weights: { sa: 0.80, pv: 2.55, pd: 0.037, fg: 1.08, sel: 0.99, conf: -0.02 } },
}
