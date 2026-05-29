// @ts-nocheck
// ─── Catalogs ───────────────────────────────────────────────────────────────

export const METAL_CENTERS = [
  { value: "Zr4+",  label: "Zr4+",  lcaScore: 8.5, toxicity: "Low",      oms: false, color: "#6EA8FF" },
  { value: "Mg2+",  label: "Mg2+",  lcaScore: 9.0, toxicity: "Very Low", oms: true,  color: "#6EA8FF" },
  { value: "Al3+",  label: "Al3+",  lcaScore: 8.0, toxicity: "Low",      oms: false, color: "#6EA8FF" },
  { value: "Fe3+",  label: "Fe3+",  lcaScore: 7.5, toxicity: "Low",      oms: true,  color: "#6EA8FF" },
  { value: "Zn2+",  label: "Zn2+",  lcaScore: 6.5, toxicity: "Moderate", oms: false, color: "#9CB2D4" },
  { value: "Cu2+",  label: "Cu2+",  lcaScore: 6.0, toxicity: "Moderate", oms: true,  color: "#9CB2D4" },
  { value: "Co2+",  label: "Co2+",  lcaScore: 5.0, toxicity: "Moderate", oms: true,  color: "#9CB2D4" },
  { value: "Ni2+",  label: "Ni2+",  lcaScore: 5.5, toxicity: "Moderate", oms: true,  color: "#9CB2D4" },
  { value: "Cr3+",  label: "Cr3+",  lcaScore: 3.0, toxicity: "High",     oms: false, color: "#E88686" },
]

// Expanded linker catalog with category (topology / connectivity) & substitution notes
export const ORGANIC_LINKERS = [
  { value: "BDC",    label: "BDC — Benzene-1,4-dicarboxylate",          category: "Ditopic carboxylate",   connectivity: 2, positions: "1,4 (para)",  lcaScore: 6.0, fossil: true },
  { value: "NH2-BDC",label: "NH₂-BDC — 2-Amino-terephthalate",          category: "Ditopic carboxylate",   connectivity: 2, positions: "1,4; -NH₂ at 2", lcaScore: 6.2, fossil: true },
  { value: "NO2-BDC",label: "NO₂-BDC — 2-Nitro-terephthalate",          category: "Ditopic carboxylate",   connectivity: 2, positions: "1,4; -NO₂ at 2", lcaScore: 5.7, fossil: true },
  { value: "Br-BDC", label: "Br-BDC — 2-Bromo-terephthalate",           category: "Ditopic carboxylate",   connectivity: 2, positions: "1,4; -Br at 2",  lcaScore: 5.3, fossil: true },
  { value: "DOBDC",  label: "DOBDC — 2,5-Dioxidoterephthalate",         category: "Ditopic carboxylate+OH",connectivity: 2, positions: "1,4; -OH at 2,5",lcaScore: 6.5, fossil: true },
  { value: "BPDC",   label: "BPDC — Biphenyl-4,4'-dicarboxylate",       category: "Ditopic carboxylate",   connectivity: 2, positions: "4,4' (para)",  lcaScore: 5.0, fossil: true },
  { value: "NDC",    label: "NDC — Naphthalene-2,6-dicarboxylate",      category: "Ditopic carboxylate",   connectivity: 2, positions: "2,6",          lcaScore: 4.5, fossil: true },
  { value: "BTC",    label: "BTC — Benzene-1,3,5-tricarboxylate",       category: "Tritopic carboxylate",  connectivity: 3, positions: "1,3,5",        lcaScore: 5.5, fossil: true },
  { value: "BTB",    label: "BTB — Benzene-1,3,5-tribenzoate",          category: "Tritopic carboxylate",  connectivity: 3, positions: "1,3,5",        lcaScore: 4.0, fossil: true },
  { value: "TCPP",   label: "TCPP — Tetrakis(4-carboxyphenyl)porphyrin",category: "Tetratopic porphyrin",  connectivity: 4, positions: "meso-5,10,15,20",lcaScore: 3.8, fossil: true },
  { value: "TBAPy",  label: "TBAPy — 1,3,6,8-Tetrakis(p-benzoate)pyrene",category:"Tetratopic carboxylate",connectivity: 4, positions: "1,3,6,8",      lcaScore: 3.5, fossil: true },
  { value: "mIM",    label: "mIM — 2-Methylimidazolate (ZIF)",          category: "Ditopic azolate",       connectivity: 2, positions: "1,3 N; -CH₃ at 2", lcaScore: 7.0, fossil: false },
  { value: "BIM",    label: "BIM — Benzimidazolate",                    category: "Ditopic azolate",       connectivity: 2, positions: "1,3 N (fused)",lcaScore: 6.2, fossil: false },
  { value: "BTDD",   label: "BTDD — Bis(1H-1,2,3-triazolo)dibenzodioxin",category:"Ditopic azolate",       connectivity: 2, positions: "Triazole N",   lcaScore: 5.8, fossil: true },
  { value: "ADC",    label: "ADC — 9,10-Anthracenedicarboxylate",       category: "Ditopic carboxylate",   connectivity: 2, positions: "9,10",         lcaScore: 4.2, fossil: true },
]

// Functional groups grouped by electronic/steric role
export const FUNCTIONAL_GROUPS = [
  { value: "amine",      label: "−NH₂ (Amine)",        category: "Lewis-basic / H-bond donor",    effectCO2: 0.32, effectSel: 0.85, steric: 0.02 },
  { value: "hydroxyl",   label: "−OH (Hydroxyl)",      category: "H-bond donor",                  effectCO2: 0.12, effectSel: 0.20, steric: 0.01 },
  { value: "carboxyl",   label: "−COOH (Carboxyl)",    category: "H-bond donor/acceptor",         effectCO2: -0.04,effectSel: 0.05, steric: 0.05 },
  { value: "thiol",      label: "−SH (Thiol)",         category: "Soft donor (S)",                effectCO2: -0.12,effectSel: -0.15, steric: 0.03 },
  { value: "nitro",      label: "−NO₂ (Nitro)",        category: "Electron-withdrawing",          effectCO2: 0.05, effectSel: 0.10, steric: 0.04 },
  { value: "halogen-F",  label: "−F (Fluoro)",         category: "Electron-withdrawing / polar",  effectCO2: 0.08, effectSel: 0.18, steric: 0.01 },
  { value: "halogen-Cl", label: "−Cl (Chloro)",        category: "Electron-withdrawing / halogen",effectCO2: 0.05, effectSel: 0.11, steric: 0.025 },
  { value: "halogen-Br", label: "−Br (Bromo)",         category: "Electron-withdrawing / heavy",  effectCO2: 0.02, effectSel: 0.06, steric: 0.04 },
  { value: "halogen-I",  label: "−I (Iodo)",           category: "Heavy halogen / polarizable",   effectCO2: -0.01,effectSel: 0.02, steric: 0.06 },
  { value: "methyl",     label: "−CH₃ (Methyl)",       category: "Steric / hydrophobic",          effectCO2: -0.03,effectSel: -0.05, steric: 0.035 },
  { value: "trifluoromethyl", label: "−CF₃ (Trifluoromethyl)", category: "Strong electron-withdrawing / hydrophobic", effectCO2: 0.02, effectSel: 0.04, steric: 0.07 },
  { value: "isopropyl",  label: "−iPr (Isopropyl)",    category: "Bulky hydrophobic substituent", effectCO2: -0.10,effectSel: -0.12, steric: 0.09 },
  { value: "methoxy",    label: "−OCH₃ (Methoxy)",     category: "Weak H-bond acceptor",          effectCO2: 0.04, effectSel: 0.08, steric: 0.04 },
  { value: "pyridyl",    label: "−C₅H₄N (Pyridyl)",    category: "Lewis-basic (aromatic N)",      effectCO2: 0.18, effectSel: 0.45, steric: 0.06 },
]

export const AROMATIC_SUBSTITUTION_POSITIONS = ["2", "3", "5", "6"]

// Gas systems — priority reflects data availability
export const GAS_SYSTEMS = [
  {
    id: "CO2/N2", label: "CO₂ / N₂ (Post-combustion capture)", priority: "available",
    primary: { name: "CO₂", mol: 44.01, kinetic: 3.30, dipole: 0,    quad: -14.3 },
    secondary:{ name: "N₂",  mol: 28.01, kinetic: 3.64, dipole: 0,    quad: -4.7 },
    baseKads: 6.7, baseQst: 28, omsBonus: 16, amineBonus: 13, dataNote: "CoRE MOF 2019 + NIST isotherms",
  },
  {
    id: "CH4/N2", label: "CH₄ / N₂ (Natural gas purification)", priority: "available",
    primary: { name: "CH₄", mol: 16.04, kinetic: 3.80, dipole: 0,    quad: 0 },
    secondary:{ name: "N₂",  mol: 28.01, kinetic: 3.64, dipole: 0,    quad: -4.7 },
    baseKads: 1.6, baseQst: 17, omsBonus: 3,  amineBonus: 1, dataNote: "CoRE MOF 2019 — broad GCMC coverage",
  },
  {
    id: "C2H4/C2H6", label: "C₂H₄ / C₂H₆ (Olefin / paraffin separation)", priority: "available",
    primary: { name: "C₂H₄", mol: 28.05, kinetic: 4.16, dipole: 0,    quad: 1.5 },
    secondary:{ name: "C₂H₆", mol: 30.07, kinetic: 4.44, dipole: 0,    quad: 0.65 },
    baseKads: 3.2, baseQst: 28, omsBonus: 8, amineBonus: 2, dataNote: "π-complexation MOF literature",
  },
  {
    id: "C2H2/CO2", label: "C₂H₂ / CO₂ (Acetylene purification — reversal risk)", priority: "available",
    primary: { name: "C₂H₂", mol: 26.04, kinetic: 3.30, dipole: 0,    quad: 5.0 },
    secondary:{ name: "CO₂", mol: 44.01, kinetic: 3.30, dipole: 0,    quad: -14.3 },
    baseKads: 4.5, baseQst: 34, omsBonus: 12, amineBonus: 6, dataNote: "Anomalous inverse selectivity reported",
    anomalyRule: "inverse_selectivity",
  },
  {
    id: "H2/N2", label: "H₂ / N₂ (Hydrogen storage — mid-term)", priority: "beta",
    primary: { name: "H₂", mol: 2.02, kinetic: 2.89, dipole: 0,    quad: 0.6 },
    secondary:{ name: "N₂", mol: 28.01, kinetic: 3.64, dipole: 0,    quad: -4.7 },
    baseKads: 0.9, baseQst: 6, omsBonus: 2, amineBonus: 0, dataNote: "Classical model; quantum diffusion not yet corrected",
    warningNote: "H₂ adsorption at cryogenic T involves quantum effects (Feynman-Hibbs). Current output uses a classical approximation — treat absolute values as indicative only.",
  },
  {
    id: "ESG", label: "Electronic specialty gases (NF₃, SF₆, C₄F₈) — not yet supported", priority: "unavailable",
    primary: { name: "—", mol: 0 }, secondary:{ name: "—", mol: 0 },
    baseKads: 0, baseQst: 0, omsBonus: 0, amineBonus: 0,
    dataNote: "Public GCMC data scarce; honest gap acknowledged in v1.β.",
    warningNote: "Electronic specialty gas separations require proprietary datasets and targeted DFT. This option is reserved as a roadmap placeholder.",
  },
]

// Common MOF presets
export const MOF_PRESETS = {
  "UiO-66":       { metalCenter: "Zr4+", organicLinker: "BDC",    poreDiameter: 6.0,  betSurfaceArea: 1187, poreVolume: 0.47, functionalGroups: [] },
  "UiO-66-NH2":   { metalCenter: "Zr4+", organicLinker: "NH2-BDC",poreDiameter: 5.8,  betSurfaceArea: 1050, poreVolume: 0.42, functionalGroups: ["amine"] },
  "UiO-67":       { metalCenter: "Zr4+", organicLinker: "BPDC",   poreDiameter: 12.0, betSurfaceArea: 2145, poreVolume: 0.85, functionalGroups: [] },
  "HKUST-1":      { metalCenter: "Cu2+", organicLinker: "BTC",    poreDiameter: 9.0,  betSurfaceArea: 1850, poreVolume: 0.82, functionalGroups: [] },
  "ZIF-8":        { metalCenter: "Zn2+", organicLinker: "mIM",    poreDiameter: 3.4,  betSurfaceArea: 1630, poreVolume: 0.64, functionalGroups: ["methyl"] },
  "ZIF-67":       { metalCenter: "Co2+", organicLinker: "mIM",    poreDiameter: 3.4,  betSurfaceArea: 1550, poreVolume: 0.61, functionalGroups: ["methyl"] },
  "MOF-5":        { metalCenter: "Zn2+", organicLinker: "BDC",    poreDiameter: 12.0, betSurfaceArea: 3534, poreVolume: 1.46, functionalGroups: [] },
  "IRMOF-1":      { metalCenter: "Zn2+", organicLinker: "BDC",    poreDiameter: 14.3, betSurfaceArea: 3534, poreVolume: 1.46, functionalGroups: [] },
  "MOF-74-Mg":    { metalCenter: "Mg2+", organicLinker: "DOBDC",  poreDiameter: 11.0, betSurfaceArea: 1495, poreVolume: 0.57, functionalGroups: ["hydroxyl"] },
  "Mg-MOF-74":    { metalCenter: "Mg2+", organicLinker: "DOBDC",  poreDiameter: 11.1, betSurfaceArea: 1542, poreVolume: 0.62, functionalGroups: ["hydroxyl"] },
  "Ni-MOF-74":    { metalCenter: "Ni2+", organicLinker: "DOBDC",  poreDiameter: 11.0, betSurfaceArea: 1321, poreVolume: 0.55, functionalGroups: ["hydroxyl"] },
  "Co-MOF-74":    { metalCenter: "Co2+", organicLinker: "DOBDC",  poreDiameter: 11.0, betSurfaceArea: 1238, poreVolume: 0.52, functionalGroups: ["hydroxyl"] },
  "MIL-101(Cr)":  { metalCenter: "Cr3+", organicLinker: "BDC",    poreDiameter: 29.0, betSurfaceArea: 4230, poreVolume: 2.15, functionalGroups: [] },
  "MIL-53(Al)":   { metalCenter: "Al3+", organicLinker: "BDC",    poreDiameter: 8.5,  betSurfaceArea: 1100, poreVolume: 0.60, functionalGroups: [] },
  "Fe-MIL-100":   { metalCenter: "Fe3+", organicLinker: "BTC",    poreDiameter: 25.0, betSurfaceArea: 2800, poreVolume: 1.10, functionalGroups: [] },
  "PCN-250":      { metalCenter: "Fe3+", organicLinker: "BDC",    poreDiameter: 10.0, betSurfaceArea: 1520, poreVolume: 0.72, functionalGroups: ["amine"] },
  "NU-1000":      { metalCenter: "Zr4+", organicLinker: "TBAPy",  poreDiameter: 30.0, betSurfaceArea: 2320, poreVolume: 1.40, functionalGroups: [] },
  "PCN-222":      { metalCenter: "Zr4+", organicLinker: "TCPP",   poreDiameter: 14.0, betSurfaceArea: 2200, poreVolume: 1.10, functionalGroups: [] },
}

export const MOF_PRESET_ALIASES = {
  uio66: "UiO-66",
  uio66nh2: "UiO-66-NH2",
  uio67: "UiO-67",
  hkust1: "HKUST-1",
  zif8: "ZIF-8",
  zif67: "ZIF-67",
  mof5: "MOF-5",
  irmof1: "IRMOF-1",
  mof74mg: "MOF-74-Mg",
  mgmof74: "Mg-MOF-74",
  nimof74: "Ni-MOF-74",
  comof74: "Co-MOF-74",
  mil101cr: "MIL-101(Cr)",
  mil53al: "MIL-53(Al)",
  femil100: "Fe-MIL-100",
  pcn250: "PCN-250",
  nu1000: "NU-1000",
  pcn222: "PCN-222",
}

export const LITERATURE_DB = [
  { name: "MOF-74-Mg",    metal: "Mg2+", linker: "DOBDC", bet: 1495, pv: 0.57, pd: 11.0, co2: 8.61, selectivity: 182, sourceType: "GCMC/literature", doi: "benchmark-MOF74-Mg" },
  { name: "HKUST-1",      metal: "Cu2+", linker: "BTC",   bet: 1850, pv: 0.82, pd: 9.0,  co2: 4.82, selectivity: 42,  sourceType: "NIST/literature", doi: "benchmark-HKUST1" },
  { name: "UiO-66",       metal: "Zr4+", linker: "BDC",   bet: 1187, pv: 0.47, pd: 6.0,  co2: 2.50, selectivity: 28,  sourceType: "CoRE/literature", doi: "benchmark-UiO66" },
  { name: "UiO-66-NH2",   metal: "Zr4+", linker: "NH2-BDC",bet: 1050, pv: 0.42, pd: 5.8,  co2: 3.40, selectivity: 68, sourceType: "literature", doi: "benchmark-UiO66NH2" },
  { name: "ZIF-8",        metal: "Zn2+", linker: "mIM",   bet: 1630, pv: 0.64, pd: 3.4,  co2: 1.80, selectivity: 12,  sourceType: "CoRE/literature", doi: "benchmark-ZIF8" },
  { name: "MIL-101(Cr)",  metal: "Cr3+", linker: "BDC",   bet: 4230, pv: 2.15, pd: 29.0, co2: 3.30, selectivity: 18,  sourceType: "GCMC/literature", doi: "benchmark-MIL101Cr" },
  { name: "MIL-53(Al)",   metal: "Al3+", linker: "BDC",   bet: 1100, pv: 0.60, pd: 8.5,  co2: 3.10, selectivity: 55,  sourceType: "NIST/literature", doi: "benchmark-MIL53Al" },
  { name: "Mg-MOF-74",    metal: "Mg2+", linker: "DOBDC", bet: 1542, pv: 0.62, pd: 11.1, co2: 9.20, selectivity: 195, sourceType: "GCMC/literature", doi: "benchmark-MgMOF74" },
  { name: "IRMOF-1",      metal: "Zn2+", linker: "BDC",   bet: 3534, pv: 1.46, pd: 14.3, co2: 2.20, selectivity: 8,   sourceType: "CoRE/literature", doi: "benchmark-IRMOF1" },
  { name: "Co-MOF-74",    metal: "Co2+", linker: "DOBDC", bet: 1238, pv: 0.52, pd: 11.0, co2: 6.80, selectivity: 145, sourceType: "GCMC/literature", doi: "benchmark-CoMOF74" },
  { name: "Ni-MOF-74",    metal: "Ni2+", linker: "DOBDC", bet: 1321, pv: 0.55, pd: 11.0, co2: 7.50, selectivity: 160, sourceType: "GCMC/literature", doi: "benchmark-NiMOF74" },
  { name: "Fe-MIL-100",   metal: "Fe3+", linker: "BTC",   bet: 2800, pv: 1.10, pd: 25.0, co2: 3.60, selectivity: 22,  sourceType: "literature", doi: "benchmark-FeMIL100" },
  { name: "Al-MIL-53",    metal: "Al3+", linker: "BDC",   bet: 1200, pv: 0.58, pd: 8.5,  co2: 3.20, selectivity: 52,  sourceType: "NIST/literature", doi: "benchmark-AlMIL53" },
  { name: "NU-1000",      metal: "Zr4+", linker: "TBAPy", bet: 2320, pv: 1.40, pd: 30.0, co2: 2.70, selectivity: 14,  sourceType: "CoRE/literature", doi: "benchmark-NU1000" },
  { name: "PCN-222",      metal: "Zr4+", linker: "TCPP",  bet: 2200, pv: 1.10, pd: 14.0, co2: 4.10, selectivity: 38,  sourceType: "literature", doi: "benchmark-PCN222" },
]

export const DATA_BASE_URL = `${import.meta.env.BASE_URL || "/"}data/`

export const CURRENCIES = {
  USD: { label: "USD", symbol: "$", rate: 1, unit: "USD", note: "Reference currency used by seed LCC inventory." },
  CNY: { label: "CNY", symbol: "¥", rate: 7.24, unit: "CNY", note: "Static display factor, not live FX." },
  EUR: { label: "EUR", symbol: "€", rate: 0.93, unit: "EUR", note: "Static display factor, not live FX." },
  GBP: { label: "GBP", symbol: "£", rate: 0.80, unit: "GBP", note: "Static display factor, not live FX." },
  JPY: { label: "JPY", symbol: "¥", rate: 155.0, unit: "JPY", note: "Static display factor, not live FX." },
  CAD: { label: "CAD", symbol: "C$", rate: 1.37, unit: "CAD", note: "Static display factor, not live FX." },
  AUD: { label: "AUD", symbol: "A$", rate: 1.53, unit: "AUD", note: "Static display factor, not live FX." },
}
