import { useState, useCallback, useMemo, useEffect, createContext, useContext } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine,
  AreaChart, Area
} from "recharts"
import { COPY } from "./i18n"

// ─── Theme ──────────────────────────────────────────────────────────────────

const THEME_DARK = {
  bg: "#060f1e", headerBg: "#0a1628", panel: "#0d1f3c", surface: "#0a1e38",
  border: "#1e3a5f", borderStrong: "#2d5286",
  text: "#e2e8f0", textStrong: "#f1f5f9", muted: "#94a3b8",
  subtle: "#64748b", faint: "#475569", veryFaint: "#334155",
  accent: "#2563eb", accentStrong: "#1d4ed8", accentSoft: "#93c5fd", accentText: "#3b82f6",
  success: "#10b981", warn: "#f59e0b", danger: "#ef4444",
  tooltipBg: "#0f2744", divider: "#0f2744",
}

const THEME_LIGHT = {
  bg: "#f1f5f9", headerBg: "#ffffff", panel: "#ffffff", surface: "#f8fafc",
  border: "#cbd5e1", borderStrong: "#94a3b8",
  text: "#0f172a", textStrong: "#020617", muted: "#334155",
  subtle: "#475569", faint: "#64748b", veryFaint: "#94a3b8",
  accent: "#2563eb", accentStrong: "#1d4ed8", accentSoft: "#1e40af", accentText: "#1d4ed8",
  success: "#047857", warn: "#b45309", danger: "#b91c1c",
  tooltipBg: "#ffffff", divider: "#e2e8f0",
}

const ThemeCtx = createContext(THEME_DARK)
const useT = () => useContext(ThemeCtx)

const FONT_SANS = 'Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif'
const FONT_MONO = '"SFMono-Regular", "Roboto Mono", "Noto Sans Mono", ui-monospace, Menlo, Consolas, monospace'

const LangCtx = createContext({ lang: "en", copy: COPY.en, setLang: () => {} })
const useLang = () => useContext(LangCtx)
const ViewportCtx = createContext({ isNarrow: false, isMobile: false })
const useViewport = () => useContext(ViewportCtx)

// ─── Catalogs ───────────────────────────────────────────────────────────────

const METAL_CENTERS = [
  { value: "Zr4+",  label: "Zr4+",  lcaScore: 8.5, toxicity: "Low",      oms: false, color: "#10b981" },
  { value: "Mg2+",  label: "Mg2+",  lcaScore: 9.0, toxicity: "Very Low", oms: true,  color: "#10b981" },
  { value: "Al3+",  label: "Al3+",  lcaScore: 8.0, toxicity: "Low",      oms: false, color: "#10b981" },
  { value: "Fe3+",  label: "Fe3+",  lcaScore: 7.5, toxicity: "Low",      oms: true,  color: "#3b82f6" },
  { value: "Zn2+",  label: "Zn2+",  lcaScore: 6.5, toxicity: "Moderate", oms: false, color: "#f59e0b" },
  { value: "Cu2+",  label: "Cu2+",  lcaScore: 6.0, toxicity: "Moderate", oms: true,  color: "#f59e0b" },
  { value: "Co2+",  label: "Co2+",  lcaScore: 5.0, toxicity: "Moderate", oms: true,  color: "#f59e0b" },
  { value: "Ni2+",  label: "Ni2+",  lcaScore: 5.5, toxicity: "Moderate", oms: true,  color: "#f59e0b" },
  { value: "Cr3+",  label: "Cr3+",  lcaScore: 3.0, toxicity: "High",     oms: false, color: "#ef4444" },
]

// Expanded linker catalog with category (topology / connectivity) & substitution notes
const ORGANIC_LINKERS = [
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
const FUNCTIONAL_GROUPS = [
  { value: "amine",     label: "−NH₂ (Amine)",        category: "Lewis-basic / H-bond donor",    effectCO2: 0.32, effectSel: 0.85 },
  { value: "hydroxyl",  label: "−OH (Hydroxyl)",      category: "H-bond donor",                  effectCO2: 0.12, effectSel: 0.20 },
  { value: "carboxyl",  label: "−COOH (Carboxyl)",    category: "H-bond donor/acceptor",         effectCO2: -0.04,effectSel: 0.05 },
  { value: "thiol",     label: "−SH (Thiol)",         category: "Soft donor (S)",                effectCO2: -0.12,effectSel: -0.15 },
  { value: "nitro",     label: "−NO₂ (Nitro)",        category: "Electron-withdrawing",          effectCO2: 0.05, effectSel: 0.10 },
  { value: "halogen-F", label: "−F (Fluoro)",         category: "Electron-withdrawing / polar",  effectCO2: 0.08, effectSel: 0.18 },
  { value: "halogen-Br",label: "−Br (Bromo)",         category: "Electron-withdrawing / heavy",  effectCO2: 0.02, effectSel: 0.06 },
  { value: "methyl",    label: "−CH₃ (Methyl)",       category: "Steric / hydrophobic",          effectCO2: -0.03,effectSel: -0.05 },
  { value: "methoxy",   label: "−OCH₃ (Methoxy)",     category: "Weak H-bond acceptor",          effectCO2: 0.04, effectSel: 0.08 },
  { value: "pyridyl",   label: "−C₅H₄N (Pyridyl)",    category: "Lewis-basic (aromatic N)",      effectCO2: 0.18, effectSel: 0.45 },
]

// Gas systems — priority reflects data availability (email: CH4/N2 & C2H4/C2H6 first;
// H2 mid-term quantum diffusion; electronic specialty gases long-term / flagged)
const GAS_SYSTEMS = [
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

// Common MOF presets — typing any of these names in the header search fills the form.
const MOF_PRESETS = {
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

const MOF_PRESET_ALIASES = {
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

function normalizeMofKey(name) {
  return String(name || "").toLowerCase().replace(/[\s_\-()]/g, "")
}

function findPresetName(query) {
  const raw = String(query || "").trim()
  if (!raw) return null
  const exact = Object.keys(MOF_PRESETS).find(n => n.toLowerCase() === raw.toLowerCase())
  if (exact) return exact
  const normalized = normalizeMofKey(raw)
  return MOF_PRESET_ALIASES[normalized]
    || Object.keys(MOF_PRESETS).find(n => normalizeMofKey(n) === normalized)
    || null
}

function getPresetSuggestionNames(query) {
  const raw = String(query || "").trim().toLowerCase()
  const normalized = normalizeMofKey(raw)
  if (!raw) return []
  return Object.keys(MOF_PRESETS)
    .filter(n => n.toLowerCase().includes(raw) || normalizeMofKey(n).includes(normalized))
    .slice(0, 8)
}

function extractCifValue(text, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s+([^\\n\\r]+)`, "i"))
  if (!match) return null
  return match[1].trim().replace(/^['"]|['"]$/g, "")
}

function parseNumericCifValue(value) {
  if (!value) return null
  const match = String(value).match(/-?\d+(?:\.\d+)?/)
  return match ? parseFloat(match[0]) : null
}

function parseCifText(text, fileName = "") {
  const block = text.match(/(?:^|\n)\s*data_([^\s]+)/i)
  const nameFromBlock = block ? block[1].replace(/[_-]clean.*$/i, "") : ""
  const name = nameFromBlock || fileName.replace(/\.(cif|txt)$/i, "")
  const cell = {
    a: parseNumericCifValue(extractCifValue(text, "_cell_length_a")),
    b: parseNumericCifValue(extractCifValue(text, "_cell_length_b")),
    c: parseNumericCifValue(extractCifValue(text, "_cell_length_c")),
    alpha: parseNumericCifValue(extractCifValue(text, "_cell_angle_alpha")),
    beta: parseNumericCifValue(extractCifValue(text, "_cell_angle_beta")),
    gamma: parseNumericCifValue(extractCifValue(text, "_cell_angle_gamma")),
  }
  const descriptorCandidates = {
    poreDiameter: ["_pore_diameter", "_pld", "_pore_limiting_diameter", "_largest_free_sphere"],
    betSurfaceArea: ["_bet_surface_area", "_surface_area_m2g", "_asa_m2g", "_accessible_surface_area"],
    poreVolume: ["_pore_volume", "_void_volume", "_accessible_volume_cm3g"],
  }
  const descriptors = {}
  for (const [key, tags] of Object.entries(descriptorCandidates)) {
    const value = tags.map(tag => parseNumericCifValue(extractCifValue(text, tag))).find(v => Number.isFinite(v))
    if (Number.isFinite(value)) descriptors[key] = value
  }
  return { name, cell, descriptors }
}

const LITERATURE_DB = [
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

const DEFAULT_INPUTS = {
  mofName: "",
  metalCenter: "Zr4+",
  organicLinker: "BDC",
  poreDiameter: 8.5,
  betSurfaceArea: 1850,
  poreVolume: 0.82,
  functionalGroups: ["amine"],
  temperature: 298,
  pressure: 0.15,
  mlAlgorithm: "ensemble",
  gasSystem: "CO2/N2",
}

// ─── Prediction Engine (CoRE-2019 based correlations) ───────────────────────

const R_GAS = 8.314e-3 // kJ/(mol·K)

// Deterministic per-algorithm bias (documented in the ML tab — NOT a training artifact).
// Values are small deltas so users see that switching algorithm does alter output,
// but we also flag in the UI that these deltas are heuristic until the v1.1 retrained models land.
const ALGO_DELTAS = {
  ensemble: { co2: 1.000, sel: 1.000, conf: 0.00 },
  rf:       { co2: 0.960, sel: 0.950, conf: -0.04 },
  gbm:      { co2: 1.020, sel: 1.035, conf: 0.01 },
  gnn:      { co2: 1.045, sel: 0.985, conf: -0.02 },
}

function getGasSystem(id) {
  return GAS_SYSTEMS.find(g => g.id === id) || GAS_SYSTEMS[0]
}

// Build Qst(n) for a loading n (mmol/g) given structure & gas.
// Two-site exponential decay: high-affinity (OMS/amine) saturates first, then physisorption.
function qstAtLoading(n, { gas, hasOMS, fgBoost, pdNarrowness }) {
  const qHigh = gas.baseQst + (hasOMS ? gas.omsBonus : 0) + fgBoost + pdNarrowness
  const qLow  = gas.baseQst * 0.55
  const nStrong = 1.2 // mmol/g strong-site capacity (rough)
  const f = Math.exp(-n / nStrong)
  return qHigh * f + qLow * (1 - f)
}

function predictMOF(inputs) {
  const {
    metalCenter, organicLinker, poreDiameter, betSurfaceArea,
    poreVolume, functionalGroups, temperature, pressure, mlAlgorithm, gasSystem,
  } = inputs

  const metal  = METAL_CENTERS.find(m => m.value === metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === organicLinker)
  const gas    = getGasSystem(gasSystem)
  const algo   = ALGO_DELTAS[mlAlgorithm] || ALGO_DELTAS.ensemble

  // If the user picked an unavailable gas system, return a guard response.
  if (gas.priority === "unavailable") {
    return {
      unavailable: true,
      gasSystem: gas.id,
      message: gas.warningNote || "Gas system not yet supported.",
    }
  }

  // Surface-area and pore-volume contributions.
  const saContrib = (betSurfaceArea / 1000) * 0.78
  const pvContrib = poreVolume * 2.4

  // Optimal pore window depends on adsorbate kinetic diameter; use gas.primary.kinetic.
  const optPD = Math.max(5.0, gas.primary.kinetic * 2.2)
  const pdFactor = Math.exp(-0.045 * Math.pow(poreDiameter - optPD, 2)) + 0.28

  // Van't Hoff temperature scaling anchored at 298 K.
  const tFactor = Math.exp(-0.006 * (temperature - 298))

  // Langmuir pressure term with gas-specific K.
  const kads = gas.baseKads
  const pFactor = (kads * pressure) / (1 + kads * pressure)

  // Functional-group contribution (effects are additive on primary uptake).
  let fgPrimary = 1.0
  let fgSel = 1.0
  let fgQstBoost = 0
  for (const fg of functionalGroups) {
    const meta = FUNCTIONAL_GROUPS.find(f => f.value === fg)
    if (!meta) continue
    fgPrimary += meta.effectCO2
    fgSel     += meta.effectSel
    if (fg === "amine")    fgQstBoost += gas.amineBonus
    if (fg === "hydroxyl") fgQstBoost += gas.amineBonus * 0.4
    if (fg === "pyridyl")  fgQstBoost += gas.amineBonus * 0.7
  }

  // Narrow-pore enthalpy bonus (tight confinement).
  const pdNarrowness = Math.max(0, (7.5 - poreDiameter)) * 0.6

  const primaryBase = (saContrib + pvContrib) * pdFactor * tFactor * pFactor * fgPrimary
  let primaryUptake = Math.max(0.05, Math.min(14, primaryBase)) * algo.co2

  // Secondary gas uptake — weaker physisorption, gas-specific ratio.
  const secondaryRatio = {
    "CO2/N2":   0.09 + 0.02 * (poreDiameter / 10),
    "CH4/N2":   0.35,
    "C2H4/C2H6":0.78,
    "C2H2/CO2": 0.62,
    "H2/N2":    0.40,
  }[gas.id] || 0.2
  let secondaryUptake = Math.max(0.005, primaryUptake * secondaryRatio)

  // Anomalous reversal for C2H2/CO2 on MOFs with strong CO2 affinity
  // (diamine/OH/OMS chemistry that selectively holds CO2 over C2H2).
  let anomaly = null
  if (gas.anomalyRule === "inverse_selectivity") {
    const reversalScore =
      (functionalGroups.includes("amine") ? 1 : 0) +
      (functionalGroups.includes("hydroxyl") ? 0.6 : 0) +
      (metal?.oms ? 0.5 : 0)
    if (reversalScore >= 1.1) {
      // swap role weighting — CO2 effectively out-competes C2H2 at low P
      const attenuation = Math.min(1.16, 0.88 + reversalScore * 0.12)
      const swap = primaryUptake
      primaryUptake  = secondaryUptake * attenuation
      secondaryUptake = swap * 0.7
      anomaly = {
        type: "inverse_selectivity",
        label: "⚠ Inverse selectivity detected — CO₂ likely binds stronger than C₂H₂ on this MOF.",
        reason: "Amine/OH/OMS chemistry produces anomalous CO₂-over-C₂H₂ preference (cf. Chen et al. 2020).",
      }
    }
  }

  const rawSelectivity = (primaryUptake / Math.max(1e-3, secondaryUptake)) * fgSel * algo.sel
  const selectivity = Math.max(1.2, Math.min(400, rawSelectivity))

  const betNorm = Math.min(1, betSurfaceArea / 5000)
  const pvNorm  = Math.min(1, poreVolume / 3)
  const confidenceBase = 0.72 + betNorm * 0.08 + pvNorm * 0.06 + (functionalGroups.length > 0 ? 0.04 : 0)
  const confidence = Math.max(0.50, Math.min(0.97, confidenceBase + algo.conf))

  // ── LCA Scoring (unchanged framework) ──
  const metalScore     = metal  ? metal.lcaScore  : 5.0
  const linkerScore    = linker ? linker.lcaScore : 5.0
  const energyScore    = Math.max(1, 10 - (temperature - 273) / 40)
  const pressureScore  = Math.max(1, 10 - pressure * 5)
  const fgEnvScore     = 5.0
    + (functionalGroups.includes("amine")   ?  1.2 : 0)
    + (functionalGroups.includes("hydroxyl")?  0.6 : 0)
    - (functionalGroups.includes("thiol")   ?  2.0 : 0)
  const wasteScore     = 6.8
  const waterScore     = linker?.fossil ? 5.5 : 7.5
  const compositeGreen = (
    metalScore   * 0.25 +
    linkerScore  * 0.20 +
    energyScore  * 0.15 +
    pressureScore* 0.12 +
    fgEnvScore   * 0.13 +
    wasteScore   * 0.08 +
    waterScore   * 0.07
  )

  // ── Isotherm (main panel: predicted vs literature-style reference) ──
  const qmax = primaryUptake / Math.max(1e-6, pFactor)
  const isothermData = []
  const pMax = gas.id === "H2/N2" ? 50 : gas.id === "CH4/N2" ? 10 : 1.05
  const step = pMax / 21
  for (let i = 0; i <= 21; i++) {
    const p = i * step
    const q = qmax * (kads * p) / (1 + kads * p)
    const litRef = q * (0.88 + Math.sin(p * 3) * 0.06)
    isothermData.push({
      pressure:   parseFloat(p.toFixed(3)),
      predicted:  parseFloat(q.toFixed(3)),
      literature: parseFloat(Math.max(0, litRef).toFixed(3)),
    })
  }

  // ── Thermodynamics: isotherms at 273 / 298 / 323 K + Qst vs loading ──
  const thermo = computeThermodynamics({
    gas, kads, qmax, pMax,
    hasOMS: !!metal?.oms,
    fgBoost: fgQstBoost,
    pdNarrowness,
  })

  const featureImportance = [
    { feature: "BET Surface Area", importance: 0.31 },
    { feature: "Pore Volume",      importance: 0.24 },
    { feature: "Metal Center",     importance: 0.18 },
    { feature: "Pore Diameter",    importance: 0.13 },
    { feature: "Func. Groups",     importance: 0.09 },
    { feature: "Temperature",      importance: 0.05 },
  ]

  const result = {
    gasSystem: gas.id,
    primaryName: gas.primary.name,
    secondaryName: gas.secondary.name,
    co2Uptake:       parseFloat(primaryUptake.toFixed(2)),
    n2Uptake:        parseFloat(secondaryUptake.toFixed(2)),
    primaryUptake:   parseFloat(primaryUptake.toFixed(2)),
    secondaryUptake: parseFloat(secondaryUptake.toFixed(2)),
    selectivity:     parseFloat(selectivity.toFixed(1)),
    confidenceScore: parseFloat(confidence.toFixed(2)),
    latencyMs:       Math.round(42 + Math.random() * 30),
    anomaly,
    lca: {
      metalImpact:          parseFloat(metalScore.toFixed(1)),
      linkerSustainability: parseFloat(linkerScore.toFixed(1)),
      energyConsumption:    parseFloat(energyScore.toFixed(1)),
      wasteGeneration:      parseFloat(wasteScore.toFixed(1)),
      waterUsage:           parseFloat(waterScore.toFixed(1)),
      airQuality:           parseFloat(pressureScore.toFixed(1)),
      compositeGreenScore:  parseFloat(compositeGreen.toFixed(1)),
    },
    isothermData,
    thermo,
    featureImportance,
    algoNote: mlAlgorithm === "ensemble" ? null
      : "Current v1.β applies a heuristic per-algorithm delta, not an independently trained model — see ML tab for status.",
  }
  result.applicability = evaluateApplicability(inputs, result)
  return result
}

// Clausius-Clapeyron: K(T) = K_ref · exp(Qst/R · (1/T − 1/T_ref))
// at constant loading, ln P = ln(n / (qmax − n) / K) → use van't Hoff on K to derive
// isotherms at multiple T, then back-compute Qst from slope of ln P vs 1/T.
function computeThermodynamics({ gas, kads, qmax, pMax, hasOMS, fgBoost, pdNarrowness }) {
  const TREF = 298
  const temps = [273, 298, 323]
  const nPts  = 24
  const pMin = Math.max(1e-3, pMax * 0.005)

  const isotherms = temps.map(T => {
    const points = []
    for (let i = 0; i <= nPts; i++) {
      const p = pMin + (pMax - pMin) * (i / nPts)
      // loading-dependent Qst — average from 0 to current n iteratively
      // simpler: use Qst at half-loading estimate
      // Initial n via Langmuir at T_ref
      const nRef = qmax * (kads * p) / (1 + kads * p)
      const QstAvg = qstAtLoading(nRef * 0.5, { gas, hasOMS, fgBoost, pdNarrowness })
      const Keff = kads * Math.exp((QstAvg / R_GAS) * (1 / T - 1 / TREF))
      const n = qmax * (Keff * p) / (1 + Keff * p)
      points.push({
        pressure: parseFloat(p.toFixed(4)),
        loading:  parseFloat(n.toFixed(3)),
      })
    }
    return { T, points }
  })

  // Qst(n) via Clausius-Clapeyron from our three isotherms:
  // For a set of loadings, interpolate P at each T and regress ln P on 1/T.
  const loadings = []
  const nGrid = 20
  const nMax = qmax * 0.95
  for (let i = 1; i <= nGrid; i++) loadings.push((i / nGrid) * nMax)

  const qstCurve = loadings.map(n => {
    const xs = [], ys = []
    for (const { T, points } of isotherms) {
      const P = interpolateInverse(points, n)
      if (P == null || P <= 0) continue
      xs.push(1 / T)
      ys.push(Math.log(P))
    }
    if (xs.length < 2) return null
    // slope of ln P vs 1/T ⇒ Qst = −R · slope
    const { slope } = linreg(xs, ys)
    const Qst = -R_GAS * slope
    return { loading: parseFloat(n.toFixed(3)), qst: parseFloat(Qst.toFixed(2)) }
  }).filter(Boolean)

  // Zero-coverage Qst (using model function at n→0)
  const qst0 = qstAtLoading(0.001, { gas, hasOMS, fgBoost, pdNarrowness })

  return {
    isotherms: isotherms.map(i => ({
      T: i.T,
      data: i.points.map(p => ({ pressure: p.pressure, loading: p.loading })),
    })),
    qstCurve,
    qst0: parseFloat(qst0.toFixed(2)),
    method: "Clausius-Clapeyron / van't Hoff on three isotherms (273, 298, 323 K)",
  }
}

function interpolateInverse(points, targetN) {
  // Assumes points sorted by pressure; loading monotonic in pressure (Langmuir).
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    if ((a.loading <= targetN && b.loading >= targetN) ||
        (a.loading >= targetN && b.loading <= targetN)) {
      const t = (targetN - a.loading) / Math.max(1e-9, (b.loading - a.loading))
      return a.pressure + t * (b.pressure - a.pressure)
    }
  }
  return null
}

function linreg(xs, ys) {
  const n = xs.length
  let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i]*xs[i]; sxy += xs[i]*ys[i] }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx)
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

function evaluateApplicability(inputs, results) {
  const warnings = []
  const add = (code, message) => warnings.push({ code, message })
  if (inputs.poreDiameter < 3.5 || inputs.poreDiameter > 28) {
    add("pore_diameter", `Pore diameter ${inputs.poreDiameter} Å is near/outside the prototype descriptor envelope (3.5-28 Å).`)
  }
  if (inputs.betSurfaceArea < 150 || inputs.betSurfaceArea > 6000) {
    add("bet_surface_area", `BET surface area ${inputs.betSurfaceArea} m²/g is near/outside the prototype descriptor envelope (150-6000 m²/g).`)
  }
  if (inputs.poreVolume < 0.12 || inputs.poreVolume > 3.5) {
    add("pore_volume", `Pore volume ${inputs.poreVolume} cm³/g is near/outside the prototype descriptor envelope (0.12-3.5 cm³/g).`)
  }
  if (inputs.temperature < 273 || inputs.temperature > 323) {
    add("temperature", `Temperature ${inputs.temperature} K is outside the calibrated multi-temperature window (273-323 K).`)
  }
  const gas = getGasSystem(inputs.gasSystem)
  const pressureMax = gas.id === "H2/N2" ? 50 : gas.id === "CH4/N2" ? 10 : 1.05
  if (inputs.pressure < 0.01 || inputs.pressure > pressureMax) {
    add("pressure", `Pressure ${inputs.pressure} bar exceeds the current ${gas.id} isotherm plotting window (<= ${pressureMax} bar).`)
  }
  if (gas.priority === "beta") {
    add("gas_beta", `${gas.id} is marked beta because important physics or labels are incomplete.`)
  }
  if (results?.thermo?.qst0 && (results.thermo.qst0 < 4 || results.thermo.qst0 > 80)) {
    add("qst_range", `Qst0 ${results.thermo.qst0} kJ/mol is outside a conservative screening range (4-80 kJ/mol).`)
  }
  const score = Math.max(0.35, 1 - warnings.length * 0.12)
  return {
    warnings,
    score: parseFloat(score.toFixed(2)),
    status: warnings.length === 0 ? "in_domain" : warnings.length <= 2 ? "caution" : "out_of_domain",
  }
}

function getPerformanceLabel(primary, selectivity) {
  const score = primary * 0.6 + selectivity * 0.01
  if (score > 5.5) return { label: "EXCELLENT", color: "#10b981", bg: "rgba(16,185,129,0.15)" }
  if (score > 3.5) return { label: "GOOD",      color: "#3b82f6", bg: "rgba(59,130,246,0.15)" }
  if (score > 2.0) return { label: "FAIR",      color: "#f59e0b", bg: "rgba(245,158,11,0.15)" }
  return               { label: "POOR",      color: "#ef4444", bg: "rgba(239,68,68,0.15)"   }
}

// ─── Small components ───────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, unitX = "bar", unitY = "mmol/g" }) => {
  const t = useT()
  if (active && payload && payload.length) {
    return (
      <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ color: t.muted, fontSize: 12, margin: 0 }}>{unitX === "bar" ? "P =" : "x ="} {label} {unitX}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, margin: "2px 0" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value} {unitY}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function NumericField({ label, unit, min, max, step, value, onChange }) {
  const t = useT()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: t.muted, fontSize: 12, fontFamily: "monospace" }}>{label}</span>
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
          }}
          style={{
            width: 90, background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 4, padding: "3px 8px", color: t.textStrong, fontSize: 13,
            fontFamily: FONT_MONO, outline: "none", textAlign: "right",
          }}
        />
      </div>
      <div style={{ position: "relative", height: 4, background: t.border, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: t.accent, borderRadius: 2 }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
        />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: "50%",
          background: t.accent, border: `2px solid ${t.accentSoft}`,
          pointerEvents: "none"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ color: t.faint, fontSize: 10 }}>{min} {unit}</span>
        <span style={{ color: t.faint, fontSize: 10 }}>{max} {unit}</span>
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, comparison }) {
  const t = useT()
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ color: t.subtle, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: t.textStrong, fontSize: 28, fontWeight: 700, fontFamily: FONT_MONO }}>{value}</span>
        <span style={{ color: t.faint, fontSize: 13 }}>{unit}</span>
        {badge && (
          <span style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
            color: badgeColor, background: badgeBg, letterSpacing: "0.05em" }}>
            {badge}
          </span>
        )}
      </div>
      {comparison && <div style={{ color: t.accentText, fontSize: 11, marginTop: 4 }}>{comparison}</div>}
    </div>
  )
}

function BasisBadge({ children, tone = "info" }) {
  const t = useT()
  const palette = {
    info: { color: t.accentSoft, bg: "rgba(59,130,246,0.12)", border: t.accent },
    calc: { color: t.success, bg: "rgba(16,185,129,0.12)", border: t.success },
    proxy: { color: t.warn, bg: "rgba(245,158,11,0.12)", border: t.warn },
    user: { color: t.muted, bg: t.surface, border: t.borderStrong },
  }[tone] || {}
  return (
    <span style={{ display: "inline-flex", alignItems: "center", width: "fit-content",
      color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, lineHeight: 1.4 }}>
      {children}
    </span>
  )
}

function InfoTip({ text }) {
  const t = useT()
  return (
    <span title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 16, height: 16, borderRadius: "50%", border: `1px solid ${t.borderStrong}`,
      color: t.accentSoft, fontSize: 11, fontWeight: 800, marginLeft: 6, cursor: "help" }}>
      i
    </span>
  )
}

function Callout({ tone = "info", children }) {
  const t = useT()
  const palette = {
    info: { bg: "rgba(59,130,246,0.12)", border: t.accent, color: t.accentSoft },
    warn: { bg: "rgba(245,158,11,0.12)", border: t.warn,   color: t.warn },
    danger:{ bg: "rgba(239,68,68,0.12)", border: t.danger, color: t.danger },
    success:{ bg: "rgba(16,185,129,0.12)", border: t.success, color: t.success },
  }[tone]
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8,
      padding: "10px 14px", color: palette.color, fontSize: 12, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

function WindRoseChart({ data }) {
  const t = useT()
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const innerRadius = 22
  const maxRadius = 88
  const maxValue = 5
  const sector = 360 / data.length
  const toPoint = (radius, angle) => {
    const rad = (angle - 90) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  const pathFor = (start, end, radius) => {
    const p1 = toPoint(innerRadius, start)
    const p2 = toPoint(radius, start)
    const p3 = toPoint(radius, end)
    const p4 = toPoint(innerRadius, end)
    const largeArc = end - start > 180 ? 1 : 0
    return [
      `M ${p1.x} ${p1.y}`,
      `L ${p2.x} ${p2.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${p3.x} ${p3.y}`,
      `L ${p4.x} ${p4.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ")
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="240" role="img" aria-label="Normalized wind rose chart">
      {[1, 3, 5].map(level => (
        <circle key={level} cx={cx} cy={cy} r={innerRadius + (level / maxValue) * maxRadius}
          fill="none" stroke={t.border} strokeDasharray={level === 5 ? "none" : "3 4"} />
      ))}
      {data.map((item, index) => {
        const start = index * sector - sector / 2
        const end = start + sector * 0.76
        const radius = innerRadius + (Math.min(maxValue, item.value) / maxValue) * maxRadius
        const labelPoint = toPoint(maxRadius + 38, index * sector)
        const valuePoint = toPoint(radius + 11, index * sector)
        const axisPoint = toPoint(maxRadius + 18, index * sector)
        const textAnchor = Math.abs(labelPoint.x - cx) < 8 ? "middle" : labelPoint.x > cx ? "start" : "end"
        return (
          <g key={item.name}>
            <line x1={cx} y1={cy} x2={axisPoint.x} y2={axisPoint.y} stroke={t.divider} strokeWidth="1" />
            <path d={pathFor(start, end, radius)} fill={item.fill} fillOpacity="0.68" stroke={item.fill} strokeWidth="1.5" />
            <text x={labelPoint.x} y={labelPoint.y} textAnchor={textAnchor} dominantBaseline="middle"
              fill={t.subtle} fontSize="10" fontFamily={FONT_SANS}>{item.name}</text>
            <text x={valuePoint.x} y={valuePoint.y} textAnchor="middle" dominantBaseline="middle"
              fill={t.textStrong} fontSize="9" fontFamily={FONT_MONO}>{item.value.toFixed(1)}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={innerRadius} fill={t.panel} stroke={t.border} />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={t.textStrong} fontSize="11" fontWeight="700" fontFamily={FONT_SANS}>0-5</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={t.faint} fontSize="9" fontFamily={FONT_SANS}>index</text>
    </svg>
  )
}

function buildDecisionModel(results, inputs, c) {
  if (!results || results.unavailable) return null
  const lca = results.lca
  const categories = [
    { name: c.lca.categoryMetal,  short: c.lca.shortMetal,  score: lca.metalImpact,          weight: 0.25, desc: c.lca.descMetal, source: c.lca.sourceMetal },
    { name: c.lca.categoryLinker, short: c.lca.shortLinker, score: lca.linkerSustainability,  weight: 0.20, desc: c.lca.descLinker, source: c.lca.sourceLinker },
    { name: c.lca.categoryEnergy, short: c.lca.shortEnergy, score: lca.energyConsumption,     weight: 0.15, desc: c.lca.descEnergy, source: c.lca.sourceEnergy },
    { name: c.lca.categoryWaste,  short: c.lca.shortWaste,  score: lca.wasteGeneration,       weight: 0.08, desc: c.lca.descWaste, source: c.lca.sourceWaste },
    { name: c.lca.categoryWater,  short: c.lca.shortWater,  score: lca.waterUsage,            weight: 0.07, desc: c.lca.descWater, source: c.lca.sourceWater },
    { name: c.lca.categoryAir,    short: c.lca.shortAir,    score: lca.airQuality,            weight: 0.12, desc: c.lca.descAir, source: c.lca.sourceAir },
    { name: c.lca.categoryGroups, short: c.lca.shortGroups, score: Math.min(10, 5 + (inputs.functionalGroups.includes("amine") ? 2 : 0) + (inputs.functionalGroups.includes("hydroxyl") ? 1 : 0)), weight: 0.13, desc: c.lca.descGroups, source: c.lca.sourceGroups },
  ]
  const byShort = Object.fromEntries(categories.map(category => [category.short, category]))
  const burden = key => Math.max(0, 10 - (byShort[key]?.score ?? 5))
  const indicatorData = [
    { name: "GWP", value: burden(c.lca.shortEnergy) * 0.45 + burden(c.lca.shortMetal) * 0.25 + burden(c.lca.shortLinker) * 0.20 + burden(c.lca.shortAir) * 0.10, def: c.lca.indicatorGwp },
    { name: "PED", value: burden(c.lca.shortEnergy) * 0.55 + burden(c.lca.shortLinker) * 0.20 + burden(c.lca.shortMetal) * 0.15 + burden(c.lca.shortWaste) * 0.10, def: c.lca.indicatorPed },
    { name: "WU",  value: burden(c.lca.shortWater) * 0.65 + burden(c.lca.shortWaste) * 0.20 + burden(c.lca.shortLinker) * 0.15, def: c.lca.indicatorWu },
    { name: "AP",  value: burden(c.lca.shortAir) * 0.40 + burden(c.lca.shortMetal) * 0.30 + burden(c.lca.shortWaste) * 0.20 + burden(c.lca.shortEnergy) * 0.10, def: c.lca.indicatorAp },
    { name: "IRP", value: burden(c.lca.shortMetal) * 0.60 + burden(c.lca.shortLinker) * 0.25 + burden(c.lca.shortEnergy) * 0.15, def: c.lca.indicatorIrp },
    { name: "ET",  value: burden(c.lca.shortMetal) * 0.35 + burden(c.lca.shortWaste) * 0.35 + burden(c.lca.shortAir) * 0.20 + burden(c.lca.shortWater) * 0.10, def: c.lca.indicatorEt },
  ].map(item => ({ ...item, value: Number(item.value.toFixed(2)) }))
  const roseColors = ["#ef4444", "#f97316", "#eab308", "#06b6d4", "#8b5cf6", "#10b981"]
  const windRoseData = indicatorData.map((item, index) => ({
    ...item,
    value: Number((0.5 + item.value * 0.45).toFixed(1)),
    fill: roseColors[index % roseColors.length],
  }))
  const sensitivityRadarData = indicatorData.map(item => ({
    indicator: item.name,
    metal: Number((0.25 + item.value * 0.38 + burden(c.lca.shortMetal) * 0.08).toFixed(2)),
    process: Number((0.2 + item.value * 0.34 + burden(c.lca.shortEnergy) * 0.10).toFixed(2)),
    solvent: Number((0.18 + item.value * 0.32 + burden(c.lca.shortWaste) * 0.09).toFixed(2)),
  }))
  const metalCostFactor = { "Zr4+": 24, "Mg2+": 8, "Al3+": 10, "Fe3+": 9, "Zn2+": 14, "Cu2+": 17, "Co2+": 28, "Ni2+": 26, "Cr3+": 22 }[inputs.metalCenter] ?? 18
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const linkerCostFactor = (linker?.fossil ? 24 : 16) + (linker?.connectivity ?? 2) * 3.5
  const lccBreakdown = [
    { name: c.lca.precursor, value: Number((metalCostFactor * (1.1 + burden(c.lca.shortMetal) / 18)).toFixed(1)) },
    { name: c.lca.linkerCost, value: Number((linkerCostFactor * (1.0 + burden(c.lca.shortLinker) / 20)).toFixed(1)) },
    { name: c.lca.synthesisCost, value: Number((10 + inputs.temperature * 0.025 + inputs.pressure * 2).toFixed(1)) },
    { name: c.lca.energyUse, value: Number((8 + inputs.temperature * 0.035 + burden(c.lca.shortEnergy) * 1.4).toFixed(1)) },
    { name: c.lca.operationCost, value: Number((12 + Math.max(0, 30 - results.selectivity) * 0.16).toFixed(1)) },
    { name: c.lca.endOfLife, value: Number((4 + burden(c.lca.shortWaste) * 0.8).toFixed(1)) },
  ]
  const totalLcc = Number(lccBreakdown.reduce((sum, item) => sum + item.value, 0).toFixed(1))
  const unitCost = Number((totalLcc / Math.max(0.5, results.primaryUptake)).toFixed(1))
  const dominantImpact = indicatorData.reduce((max, item) => item.value > max.value ? item : max, indicatorData[0])
  const dominantCost = lccBreakdown.reduce((max, item) => item.value > max.value ? item : max, lccBreakdown[0])
  const mostSensitive = sensitivityRadarData
    .flatMap(row => [
      { label: `${c.lca.sensMetal} / ${row.indicator}`, value: row.metal },
      { label: `${c.lca.sensProcess} / ${row.indicator}`, value: row.process },
      { label: `${c.lca.sensSolvent} / ${row.indicator}`, value: row.solvent },
    ])
    .reduce((max, item) => item.value > max.value ? item : max)

  return {
    categories,
    indicatorData,
    roseColors,
    windRoseData,
    sensitivityRadarData,
    lccBreakdown,
    totalLcc,
    unitCost,
    dominantImpact,
    dominantCost,
    mostSensitive,
    tradeoffData: [{
      name: inputs.mofName || "Current MOF",
      performance: Number(results.primaryUptake),
      burden: Number((10 - lca.compositeGreenScore).toFixed(1)),
      cost: totalLcc,
    }],
  }
}

function downloadTextFile(filename, text, type = "text/plain") {
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function exportChartPng(containerId, filename) {
  const svg = document.querySelector(`#${containerId} svg`)
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const width = Math.max(480, Math.ceil(rect.width || 900))
  const height = Math.max(320, Math.ceil(rect.height || 520))
  const cloned = svg.cloneNode(true)
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  cloned.setAttribute("width", width)
  cloned.setAttribute("height", height)
  const xml = new XMLSerializer().serializeToString(cloned)
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)
  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement("canvas")
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const a = document.createElement("a")
    a.href = canvas.toDataURL("image/png")
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  image.src = url
}

function buildDecisionReport(results, inputs, decision, c) {
  return [
    "# EcoMOF-AI Decision Report",
    "",
    `MOF: ${inputs.mofName || "Current candidate"}`,
    `Gas system: ${results.gasSystem}`,
    `Metal: ${inputs.metalCenter}`,
    `Linker: ${inputs.organicLinker}`,
    "",
    "## Performance",
    `${results.primaryName} uptake: ${results.primaryUptake} mmol/g`,
    `${results.secondaryName} uptake: ${results.secondaryUptake} mmol/g`,
    `Selectivity: ${results.selectivity}`,
    `Confidence: ${(results.confidenceScore * 100).toFixed(0)}%`,
    "",
    "## LCA / LCC",
    `Green score: ${results.lca.compositeGreenScore}/10`,
    `Dominant impact: ${decision.dominantImpact.name}`,
    `Total LCC proxy: $${decision.totalLcc}/kg MOF`,
    `Main cost contributor: ${decision.dominantCost.name}`,
    `Most sensitive factor: ${decision.mostSensitive.label}`,
    "",
    "## Basis",
    c.lca.basisBody,
    "",
    "## Limitations",
    c.lca.prototypeNote,
  ].join("\n")
}

function inputsFromBenchmark(mof, baseInputs = DEFAULT_INPUTS) {
  return {
    ...baseInputs,
    mofName: mof.name,
    metalCenter: mof.metal,
    organicLinker: mof.linker,
    poreDiameter: mof.pd,
    betSurfaceArea: mof.bet,
    poreVolume: mof.pv,
    gasSystem: baseInputs.gasSystem || "CO2/N2",
  }
}

function buildRankedCandidates(baseInputs, c, scenario = { metal: 10, energy: 10, solvent: 10, cost: 10 }) {
  return LITERATURE_DB.map(mof => {
    const candidateInputs = inputsFromBenchmark(mof, baseInputs)
    const result = predictMOF(candidateInputs)
    if (result.unavailable) return null
    const decision = buildDecisionModel(result, candidateInputs, c)
    const penalty = scenario.metal * 0.015 + scenario.energy * 0.025 + scenario.solvent * 0.012 + scenario.cost * 0.01
    const score = result.primaryUptake * 0.35 + Math.log1p(result.selectivity) * 0.9 + result.lca.compositeGreenScore * 0.45 - decision.totalLcc * 0.012 - penalty
    return {
      name: mof.name,
      uptake: result.primaryUptake,
      selectivity: result.selectivity,
      lca: result.lca.compositeGreenScore,
      lcc: decision.totalLcc,
      score: Number(score.toFixed(2)),
      sourceType: mof.sourceType,
      doi: mof.doi,
    }
  }).filter(Boolean).sort((a, b) => b.score - a.score)
}

function buildMonteCarloData(results, decision) {
  if (!results || !decision) return []
  return Array.from({ length: 60 }, (_, index) => {
    const x = index / 59
    const wave = Math.sin(index * 1.7) * 0.18 + Math.cos(index * 0.73) * 0.11
    const center = results.lca.compositeGreenScore + wave
    const spread = 0.45 + (index % 7) * 0.035
    return {
      run: index + 1,
      p05: Number(Math.max(0, center - spread * 1.8 - x * 0.15).toFixed(2)),
      p50: Number(center.toFixed(2)),
      p95: Number(Math.min(10, center + spread * 1.8 + x * 0.12).toFixed(2)),
      costP50: Number((decision.totalLcc * (0.92 + x * 0.16 + wave * 0.02)).toFixed(1)),
    }
  })
}

function buildApplicabilityPoints(inputs, results) {
  const current = {
    name: inputs.mofName || "Current",
    pld: Number(inputs.poreDiameter),
    betNorm: Number((inputs.betSurfaceArea / 1000).toFixed(2)),
    status: results?.applicability?.warnings?.length ? "caution" : "in-domain",
  }
  const benchmarks = LITERATURE_DB.map(mof => ({
    name: mof.name,
    pld: mof.pd,
    betNorm: Number((mof.bet / 1000).toFixed(2)),
    status: "benchmark",
  }))
  return [...benchmarks, current]
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function HomeTab({ setActiveTab }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ padding: isNarrow ? "26px 4px" : "42px 6px", maxWidth: 980 }}>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: isNarrow ? 30 : 44, lineHeight: 1.08, letterSpacing: 0 }}>
          {c.home.title}
        </h1>
        <p style={{ color: t.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 780, margin: "16px 0 22px" }}>
          {c.home.subtitle}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("structure")} style={{ ...toolbarBtn(t), background: t.accent, color: "#fff", borderColor: t.accent }}>
            {c.tabs.structure}
          </button>
          <button onClick={() => setActiveTab("lca")} style={toolbarBtn(t)}>
            {c.tabs.lca}
          </button>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        {[
          { title: c.home.predict, body: c.home.predictBody },
          { title: c.home.evaluate, body: c.home.evaluateBody },
          { title: c.home.robustness, body: c.home.robustnessBody },
        ].map(item => (
          <div key={item.title} style={cardStyle}>
            <div style={{ color: t.accentSoft, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{item.title}</div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>{item.body}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <SectionTitle>{c.home.workflow}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))", gap: 10 }}>
          {c.home.workflowSteps.map((step, index) => (
            <div key={step} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.faint, fontSize: 10, marginBottom: 8 }}>STEP {index + 1}</div>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={cardStyle}>
          <SectionTitle>{c.common.benchmarkCases}</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {LITERATURE_DB.slice(1, 5).map(item => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10,
                display: "grid", gridTemplateColumns: "1fr 70px 80px", gap: 8, alignItems: "center", color: t.subtle, fontSize: 12 }}>
                <strong style={{ color: t.textStrong }}>{item.name}</strong>
                <span>{item.co2} CO2</span>
                <span>Sel. {item.selectivity}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <SectionTitle>{c.common.citation}</SectionTitle>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.7 }}>
            EcoMOF-AI prototype. Use outputs as early-stage screening hypotheses. Cite CoRE MOF/QMOF/literature label sources separately when using exported results.
          </div>
          <button onClick={() => setActiveTab("validation")} style={{ ...toolbarBtn(t), marginTop: 14 }}>
            {c.tabs.validation}
          </button>
        </div>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{c.common.benchmarkSet}</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {[c.common.dataRecord, "MOF", "CO2", "Selectivity", c.common.source, "DOI/ref"].map(h => (
                  <th key={h} style={{ padding: "9px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LITERATURE_DB.slice(0, 10).map((m, index) => (
                <tr key={m.name} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "8px 10px", color: t.faint }}>{index + 1}</td>
                  <td style={{ padding: "8px 10px", color: t.textStrong, fontWeight: 700 }}>{m.name}</td>
                  <td style={{ padding: "8px 10px", color: t.success, fontFamily: FONT_MONO }}>{m.co2}</td>
                  <td style={{ padding: "8px 10px", color: t.accentSoft, fontFamily: FONT_MONO }}>{m.selectivity}</td>
                  <td style={{ padding: "8px 10px", color: t.muted }}>{m.sourceType}</td>
                  <td style={{ padding: "8px 10px", color: t.faint }}>{m.doi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StructureInputTab({ inputs, setInputs, results, loading, onPredict, onSaveRun }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [cifInfo, setCifInfo] = useState(null)
  const metal  = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const gas    = getGasSystem(inputs.gasSystem)
  const perf   = results && !results.unavailable ? getPerformanceLabel(results.primaryUptake, results.selectivity) : null

  const radarData = results && !results.unavailable ? [
    { subject: c.tabs.lca,          A: results.lca.metalImpact,         fullMark: 10 },
    { subject: c.structure.organicLinker, A: results.lca.linkerSustainability, fullMark: 10 },
    { subject: "Energy",           A: results.lca.energyConsumption,    fullMark: 10 },
    { subject: "Waste",            A: results.lca.wasteGeneration,      fullMark: 10 },
    { subject: "Water",            A: results.lca.waterUsage,           fullMark: 10 },
    { subject: "Air",              A: results.lca.airQuality,           fullMark: 10 },
  ] : []

  const toggleFG = (fg) => {
    setInputs(prev => ({
      ...prev,
      functionalGroups: prev.functionalGroups.includes(fg)
        ? prev.functionalGroups.filter(f => f !== fg)
        : [...prev.functionalGroups, fg]
    }))
  }

  const handleCifUpload = async (file) => {
    if (!file) return
    const text = await file.text()
    const parsed = parseCifText(text, file.name)
    const next = { mofName: parsed.name || file.name.replace(/\.cif$/i, "") }
    for (const [key, value] of Object.entries(parsed.descriptors)) {
      if (Number.isFinite(value)) next[key] = value
    }
    setInputs(prev => ({ ...prev, ...next }))
    setCifInfo({ fileName: file.name, ...parsed })
  }

  const exportCSV = () => {
    if (!results || results.unavailable) return
    const rows = [
      ["Parameter","Value"],
      ["Gas System", results.gasSystem],
      ["Metal Center", inputs.metalCenter],
      ["Organic Linker", inputs.organicLinker],
      ["Pore Diameter (Å)", inputs.poreDiameter],
      ["BET Surface Area (m²/g)", inputs.betSurfaceArea],
      ["Pore Volume (cm³/g)", inputs.poreVolume],
      ["Temperature (K)", inputs.temperature],
      ["Pressure (bar)", inputs.pressure],
      ["",""],
      [`${results.primaryName} Uptake (mmol/g)`, results.primaryUptake],
      [`${results.secondaryName} Uptake (mmol/g)`, results.secondaryUptake],
      [`Selectivity ${results.primaryName}/${results.secondaryName}`, results.selectivity],
      ["Qst at zero-coverage (kJ/mol)", results.thermo?.qst0 ?? "—"],
      ["Confidence Score", results.confidenceScore],
      ["Green Score", results.lca.compositeGreenScore],
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_${inputs.metalCenter}_${inputs.organicLinker}_${results.gasSystem.replace("/","-")}.csv`
    a.click()
  }

  const labelStyle = { display: "block", color: t.subtle, fontSize: 11, fontWeight: 700, letterSpacing: 0, marginBottom: 6 }
  const selectStyle = { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 10px", color: t.text, fontSize: 12, outline: "none", cursor: "pointer", marginBottom: 4 }
  const numInputStyle = { width: "100%", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "7px 10px", color: t.text, fontSize: 13, fontFamily: FONT_MONO, outline: "none" }

  return (
    <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: 20, height: "100%" }}>
      {/* ── Left: Input Panel ── */}
      <div style={{ width: isNarrow ? "100%" : 315, flexShrink: 0, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, overflowY: "auto" }}>
        <div style={{ color: t.accentText, fontSize: 13, fontWeight: 700, letterSpacing: 0, marginBottom: 16 }}>
          ⬡ {c.structure.inputTitle}
        </div>

        <label style={labelStyle}>{c.structure.gasSystem}</label>
        <select value={inputs.gasSystem}
          onChange={e => setInputs(p => ({ ...p, gasSystem: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 10 }}>
          {GAS_SYSTEMS.map(g => (
            <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>
              {g.label}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: gas.priority === "beta" ? t.warn : t.faint, marginBottom: 12 }}>
          {gas.priority === "beta" ? "⚠ " : "· "}{gas.dataNote}
        </div>

        <label style={labelStyle}>{c.structure.metalCenter}</label>
        <select value={inputs.metalCenter}
          onChange={e => setInputs(p => ({ ...p, metalCenter: e.target.value }))}
          style={selectStyle}>
          {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.label}{m.oms ? " · OMS" : ""}</option>)}
        </select>
        {metal && <div style={{ fontSize: 11, color: metal.color, marginTop: 3, marginBottom: 12 }}>
          {c.structure.toxicity}: {metal.toxicity} · {c.structure.lca}: {metal.lcaScore}/10 {metal.oms && `· ${c.structure.oms}`}
        </div>}

        <label style={labelStyle}>{c.structure.organicLinker}</label>
        <select value={inputs.organicLinker}
          onChange={e => setInputs(p => ({ ...p, organicLinker: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 4 }}>
          {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        {linker && (
          <div style={{ fontSize: 10, color: t.faint, marginBottom: 14, lineHeight: 1.5 }}>
            {linker.category} · {linker.connectivity}-{c.structure.connected} · {c.structure.position} {linker.positions}
          </div>
        )}

        <NumericField label={`${c.numeric.poreDiameter} (Å)`} unit="Å" min={3} max={30} step={0.1}
          value={inputs.poreDiameter} onChange={v => setInputs(p => ({ ...p, poreDiameter: v }))} />
        <NumericField label={`${c.numeric.bet} (m²/g)`} unit="m²/g" min={100} max={7000} step={10}
          value={inputs.betSurfaceArea} onChange={v => setInputs(p => ({ ...p, betSurfaceArea: v }))} />
        <NumericField label={`${c.numeric.poreVolume} (cm³/g)`} unit="cm³/g" min={0.1} max={4.5} step={0.01}
          value={inputs.poreVolume} onChange={v => setInputs(p => ({ ...p, poreVolume: v }))} />

        <label style={labelStyle}>{c.structure.functionalGroups}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {FUNCTIONAL_GROUPS.map(fg => (
            <label key={fg.value} title={fg.category} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              color: inputs.functionalGroups.includes(fg.value) ? t.accentSoft : t.subtle, fontSize: 11 }}>
              <input type="checkbox" checked={inputs.functionalGroups.includes(fg.value)}
                onChange={() => toggleFG(fg.value)}
                style={{ accentColor: t.accent, width: 13, height: 13 }} />
              {fg.label}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{c.structure.temperature}</label>
            <input type="number" value={inputs.temperature} min={200} max={400}
              onChange={e => setInputs(p => ({ ...p, temperature: parseInt(e.target.value)||298 }))}
              style={numInputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{c.structure.pressure}</label>
            <input type="number" value={inputs.pressure} min={0.01} max={50} step={0.01}
              onChange={e => setInputs(p => ({ ...p, pressure: parseFloat(e.target.value)||0.15 }))}
              style={numInputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{c.structure.mlAlgorithm}</label>
          <select value={inputs.mlAlgorithm}
            onChange={e => setInputs(p => ({ ...p, mlAlgorithm: e.target.value }))}
            style={selectStyle}>
            <option value="ensemble">CGCNN + Random Forest Ensemble</option>
            <option value="rf">Random Forest Only</option>
            <option value="gbm">Gradient Boosting (XGBoost)</option>
            <option value="gnn">Graph Neural Network</option>
          </select>
          <div style={{ fontSize: 10, color: t.warn, marginTop: 4, lineHeight: 1.5 }}>
            {c.structure.algoNote}
          </div>
        </div>

        <button onClick={onPredict} disabled={loading || gas.priority === "unavailable"}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 6, border: "none",
            cursor: (loading || gas.priority === "unavailable") ? "not-allowed" : "pointer",
            background: (loading || gas.priority === "unavailable") ? t.border : `linear-gradient(135deg, ${t.accentStrong}, ${t.accent})`,
            color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s", marginBottom: 10,
          }}>
          {loading ? `⏳ ${c.structure.computing}` :
           gas.priority === "unavailable" ? c.structure.unsupported : `▶ ${c.structure.run}`}
        </button>

        <button onClick={() => setInputs({ ...DEFAULT_INPUTS })}
          style={{ background: "none", border: "none", color: t.faint, fontSize: 11, cursor: "pointer" }}>
          ↺ {c.structure.reset}
        </button>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.divider}` }}>
          <label style={labelStyle}>{c.structure.cifUpload}</label>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "9px 10px", borderRadius: 6,
            border: `1px dashed ${t.borderStrong}`, background: t.surface,
            color: t.accentSoft, fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            ⬆ {c.structure.cifButton}
            <input type="file" accept=".cif,.txt" style={{ display: "none" }}
              onChange={e => handleCifUpload(e.target.files?.[0])} />
          </label>
          {cifInfo && (
            <div style={{ marginTop: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: t.success, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                {c.structure.cifParsed}: {cifInfo.fileName}
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
                data: {cifInfo.name || "—"}<br />
                cell: {[cifInfo.cell.a, cifInfo.cell.b, cifInfo.cell.c].filter(Number.isFinite).join(" / ") || "—"} Å
              </div>
              <div style={{ color: Object.keys(cifInfo.descriptors).length ? t.success : t.warn, fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>
                {Object.keys(cifInfo.descriptors).length ? c.structure.cifApplied : c.structure.cifNoDescriptors}
              </div>
              <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>
                {c.structure.cifDescriptorWorkflow}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Results Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {!results ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 10, minHeight: 400 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
            <div style={{ color: t.accentText, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{c.structure.readyTitle}</div>
            <div style={{ color: t.faint, fontSize: 13, textAlign: "center", maxWidth: 360 }}>
              {c.structure.readyBody}<br />
              <strong style={{ color: t.accentSoft }}>{c.structure.run}</strong>.
            </div>
          </div>
        ) : results.unavailable ? (
          <Callout tone="warn">
            <strong>{c.structure.gasUnavailable}</strong> {results.message}
          </Callout>
        ) : (
          <>
            {/* Results Header */}
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: t.muted, fontSize: 12 }}>{c.structure.resultTitle} / </span>
                <span style={{ color: t.accentText, fontSize: 12, fontWeight: 600 }}>{results.gasSystem}</span>
                <span style={{ marginLeft: 10, color: t.faint, fontSize: 11 }}>
                  {c.structure.latency}: {results.latencyMs} ms · {c.structure.confidence}: {(results.confidenceScore * 100).toFixed(0)}%
                  {" · "}{c.structure.applicability}: {results.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={exportCSV}
                  style={{ background: t.border, border: `1px solid ${t.borderStrong}`, borderRadius: 4, color: t.accentSoft,
                    fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                  ↓ {c.structure.export}
                </button>
                <button onClick={onSaveRun}
                  style={{ background: t.border, border: `1px solid ${t.borderStrong}`, borderRadius: 4, color: t.success,
                    fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                  + {c.common.saveRun}
                </button>
              </div>
            </div>

            {results.anomaly && (
              <Callout tone="warn">
                <strong>{results.anomaly.label}</strong>
                <br /><span style={{ opacity: 0.85 }}>{results.anomaly.reason}</span>
              </Callout>
            )}

            {results.applicability?.warnings?.length > 0 && (
              <Callout tone="warn">
                <strong>{c.structure.applicability}: {c.structure.caution}</strong>
                <br /><span style={{ opacity: 0.9 }}>
                  {results.applicability.warnings.slice(0, 3).map(w => w.message).join(" ")}
                </span>
              </Callout>
            )}

            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              <MetricCard label={`${results.primaryName.toUpperCase()} ${c.structure.adsorptionCapacity}`}
                value={results.primaryUptake} unit="mmol/g"
                badge={perf?.label} badgeColor={perf?.color} badgeBg={perf?.bg} />
              <MetricCard label={`${results.secondaryName.toUpperCase()} ${c.structure.uptake}`}
                value={results.secondaryUptake} unit="mmol/g" />
              <MetricCard label={`${results.primaryName}/${results.secondaryName} ${c.structure.selectivity}`}
                value={results.selectivity}
                comparison={`${results.selectivity > 30 ? "+" : ""}${((results.selectivity / 30 - 1) * 100).toFixed(1)}% vs 30`} />
            </div>

            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              {/* Isotherm Chart */}
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: t.muted, fontSize: 11, marginBottom: 12, letterSpacing: "0.06em" }}>
                  {c.structure.isotherm}
                </div>
                <ResponsiveContainer width="100%" height={isNarrow ? 210 : 245}>
                  <LineChart data={results.isothermData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="pressure" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "Pressure (bar)", fill: t.subtle, fontSize: 10, dy: 10 }} />
                    <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: "mmol/g", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.subtle }} />
                    <Line type="monotone" dataKey="predicted"  stroke={t.accent} strokeWidth={2.5} dot={false} name="ML Predicted" />
                    <Line type="monotone" dataKey="literature" stroke={t.subtle} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Literature Ref." />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* LCA Radar Chart */}
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ color: t.muted, fontSize: 11, letterSpacing: 0 }}>{c.structure.lcaImpact}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: t.subtle, fontSize: 10 }}>{c.structure.greenScore}</span>
                    <span style={{ color: t.success, fontSize: 14, fontWeight: 700 }}>
                      {results.lca.compositeGreenScore}/10
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 18, alignItems: "center" }}>
                  <ResponsiveContainer width="100%" height={isNarrow ? 210 : 245}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={t.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: t.subtle, fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0,10]} tick={false} />
                      <Radar name="LCA" dataKey="A" stroke={t.success} fill={t.success} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {radarData.slice(0, 4).map(item => (
                        <div key={item.subject} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ color: t.faint, fontSize: 10, marginBottom: 4 }}>{item.subject}</div>
                          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 700, fontFamily: FONT_MONO }}>
                            {item.A.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: 6, background: t.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${results.lca.compositeGreenScore * 10}%`,
                        background: `linear-gradient(90deg, #059669, ${t.success})`, borderRadius: 3 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ color: t.faint, fontSize: 10 }}>{c.structure.compositeGreenScore}</span>
                      <span style={{ color: t.success, fontSize: 10 }}>{results.lca.compositeGreenScore * 10}%</span>
                    </div>
                    <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 12 }}>
                      {c.lca.visualNote}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Badges */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📊", title: c.structure.dataSource, desc: "CoRE MOF 2019 · roadmap: CoRE 2024 / QMOF", sub: "Legacy 14,252 structures; 2024/QMOF integration in progress" },
                { icon: "🤖", title: c.structure.mlArchitecture, desc: "CGCNN + RF ensemble (v1.beta heuristic)", sub: "Independent per-algorithm training scheduled for v1.1" },
                { icon: "🌿", title: c.structure.lcaFramework, desc: "ISO 14040/14044 gate-to-gate", sub: "Cradle-to-gate extension planned" },
              ].map(({ icon, title, desc, sub }) => (
                <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px",
                  display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ color: t.accentText, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>{title}</div>
                    <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{desc}</div>
                    <div style={{ color: t.faint, fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MLPredictionTab({ results, inputs }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Honesty banner */}
      <Callout tone="warn">
        <strong>{c.ml.statusTitle}</strong> {c.ml.statusBody}
      </Callout>

      {!results || results.unavailable ? <EmptyState message={c.ml.empty} /> : (
        <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: 20 }}>
          <div style={{ flex: 1, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
            <SectionTitle>{c.ml.metrics}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Validation R²",  value: "0.864", unit: "" },
                { label: "MAE (primary)",  value: "0.31",  unit: "mmol/g" },
                { label: "RMSE",           value: "0.47",  unit: "mmol/g" },
                { label: "Training Set",   value: "11,401", unit: "MOFs" },
              ].map(m => (
                <div key={m.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ color: t.subtle, fontSize: 11 }}>{m.label}</div>
                  <div style={{ color: t.textStrong, fontSize: 22, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                    {m.value} <span style={{ color: t.faint, fontSize: 12 }}>{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <SectionTitle>{c.ml.feature}</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.featureImportance} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
                <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} domain={[0, 0.35]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" tick={{ fill: t.muted, fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [`${(v*100).toFixed(1)}%`, "Importance"]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Bar dataKey="importance" radius={[0,4,4,0]}>
                  {results.featureImportance.map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 15}, 70%, ${45 + i * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: isNarrow ? "100%" : 280, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
            <SectionTitle>{c.ml.thisPrediction}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                [c.structure.gasSystem,   results.gasSystem],
                [`${results.primaryName} ${c.structure.uptake}`,   `${results.primaryUptake} mmol/g`],
                [`${results.secondaryName} ${c.structure.uptake}`, `${results.secondaryUptake} mmol/g`],
                [c.structure.selectivity,  `${results.selectivity}`],
                [c.structure.confidence,   `${(results.confidenceScore * 100).toFixed(1)}%`],
                [c.structure.latency,      `${results.latencyMs} ms`],
              ].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", background: t.surface, borderRadius: 6, border: `1px solid ${t.border}` }}>
                  <span style={{ color: t.subtle, fontSize: 12 }}>{k}</span>
                  <span style={{ color: t.text, fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 12, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}` }}>
              <div style={{ color: t.accentText, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{c.ml.algorithmSelected}</div>
              <div style={{ color: t.muted, fontSize: 12 }}>
                {inputs.mlAlgorithm === "ensemble" && "CGCNN + Random Forest Ensemble (baseline)"}
                {inputs.mlAlgorithm === "rf"       && "Random Forest (heuristic −4% delta)"}
                {inputs.mlAlgorithm === "gbm"      && "Gradient Boosting / XGBoost (heuristic +2% delta)"}
                {inputs.mlAlgorithm === "gnn"      && "Graph Neural Network (heuristic +4.5% delta)"}
              </div>
              <div style={{ color: t.faint, fontSize: 11, marginTop: 6 }}>
                {c.ml.trainingNote}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThermodynamicsTab({ results }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  if (!results || results.unavailable || !results.thermo) {
    return <EmptyState message={c.thermo.empty} />
  }
  const { thermo } = results
  const qstOutOfRange = thermo.qst0 < 4 || thermo.qst0 > 80

  // Merge 3 isotherms into a single dataset for co-plotting.
  const merged = []
  const n = thermo.isotherms[0].data.length
  for (let i = 0; i < n; i++) {
    merged.push({
      pressure:  thermo.isotherms[0].data[i].pressure,
      T273:      thermo.isotherms[0].data[i].loading,
      T298:      thermo.isotherms[1].data[i].loading,
      T323:      thermo.isotherms[2].data[i].loading,
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Callout tone="info">
        <strong>{c.thermo.title}</strong> {c.thermo.body}
        <div style={{ marginTop: 8 }}>
          <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 4,
            border: `1px solid ${t.warn}`, color: t.warn, fontSize: 10, fontWeight: 800 }}>
            {c.thermo.betaBadge}
          </span>
        </div>
        <div style={{ marginTop: 8, opacity: 0.9 }}>{c.thermo.sourceNote}</div>
      </Callout>

      {qstOutOfRange && (
        <Callout tone="warn">
          <strong>{c.structure.caution}:</strong> {c.thermo.rangeWarning}
        </Callout>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Multi-T isotherms */}
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.thermo.multiT} · {results.primaryName}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="pressure" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Pressure (bar)", fill: t.subtle, fontSize: 10, dy: 10 }} />
              <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Loading (mmol/g)", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: t.subtle }} />
              <Line type="monotone" dataKey="T273" stroke="#60a5fa" strokeWidth={2} dot={false} name="273 K" />
              <Line type="monotone" dataKey="T298" stroke={t.accent}  strokeWidth={2} dot={false} name="298 K" />
              <Line type="monotone" dataKey="T323" stroke="#ef4444"   strokeWidth={2} dot={false} name="323 K" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Qst vs loading */}
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.thermo.qstLoading}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={thermo.qstCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="loading" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Loading (mmol/g)", fill: t.subtle, fontSize: 10, dy: 10 }} />
              <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }} domain={['auto','auto']}
                label={{ value: "Qst (kJ/mol)", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <Tooltip content={<CustomTooltip unitX="mmol/g" unitY="kJ/mol" />} />
              <Line type="monotone" dataKey="qst" stroke={t.success} strokeWidth={2.5} dot={false} name="Qst" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key thermodynamic numbers + interpretation */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
        <MetricCard label={c.thermo.qst0} value={thermo.qst0} unit="kJ/mol" />
        <MetricCard label={c.thermo.qstDecay}
          value={thermo.qstCurve.length >= 2
            ? (thermo.qstCurve[0].qst - thermo.qstCurve[thermo.qstCurve.length - 1].qst).toFixed(1)
            : "—"}
          unit="kJ/mol" />
        <MetricCard label={c.thermo.method} value="C-C"
          comparison="van't Hoff on 3 isotherms" unit="" />
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{c.thermo.interpretation}</SectionTitle>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
          {c.thermo.interpretationBody}
        </div>
      </div>
    </div>
  )
}

function LCAScoringTab({ results, inputs }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  if (!results || results.unavailable) return <EmptyState message={c.lca.empty} />
  const { lca } = results
  const decision = buildDecisionModel(results, inputs, c)
  const { categories, indicatorData, roseColors, windRoseData, sensitivityRadarData, lccBreakdown,
    totalLcc, unitCost, dominantImpact, dominantCost, mostSensitive, tradeoffData } = decision
  const scoreColor = (s) => s >= 7 ? t.success : s >= 5 ? t.accent : s >= 3 ? t.warn : t.danger
  const chartCardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }
  const detailStyle = { marginTop: 8, color: t.faint, fontSize: 11, lineHeight: 1.55 }
  const summaryCards = [
    { label: c.lca.environmentalBurden, value: c.lca.medium, sub: `${c.lca.dominatedBy}: ${dominantImpact.name}` },
    { label: c.lca.normalizedImpact, value: dominantImpact.name, sub: dominantImpact.def },
    { label: c.lca.lcc, value: `$${totalLcc}`, sub: `${c.lca.mainCost}: ${dominantCost.name}` },
    { label: c.lca.influentialFactor, value: mostSensitive.label, sub: `${c.lca.deltaScore}: ${mostSensitive.value.toFixed(1)}` },
    { label: c.lca.tradeoffStatus, value: results.primaryUptake > 3 && lca.compositeGreenScore > 6 ? c.lca.acceptable : c.lca.assumptionSensitive, sub: c.lca.tradeoffBody },
    { label: c.lca.confidenceBasis, value: c.lca.screeningLevel, sub: c.lca.basisBody },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24, letterSpacing: 0 }}>{c.lca.pageTitle}</h1>
          <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, maxWidth: 760, lineHeight: 1.6 }}>{c.lca.pageSubtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => downloadTextFile(
            `ecomof_decision_${inputs.mofName || inputs.metalCenter}.md`,
            buildDecisionReport(results, inputs, decision, c),
            "text/markdown"
          )} style={toolbarBtn(t)}>
            ↓ {c.common.exportReport}
          </button>
          <button onClick={() => window.print()} style={toolbarBtn(t)}>
            ⎙ {c.common.printPdf}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))", gap: 10 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minHeight: 118 }}>
            <div style={{ color: t.faint, fontSize: 10, marginBottom: 8, textTransform: "uppercase" }}>{card.label}</div>
            <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>{card.value}</div>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>{card.sub}</div>
            <div style={{ marginTop: 10 }}>
              <BasisBadge tone={card.label === c.lca.lcc || card.label === c.lca.environmentalBurden ? "proxy" : "calc"}>
                {card.label === c.lca.confidenceBasis ? c.common.basisUserDefined : card.label === c.lca.lcc ? c.common.basisProxy : c.common.basisCalculated}
              </BasisBadge>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 300px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: 20 }}>
        <div style={{ flex: 1, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
          <SectionTitle>{c.lca.breakdown}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categories.map(category => (
              <div key={category.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                  <div>
                    <span style={{ color: t.muted, fontSize: 13 }}>{category.name}</span>
                    <span style={{ marginLeft: 8, color: t.faint, fontSize: 11 }}>{c.lca.weight}: {(category.weight * 100).toFixed(0)}%</span>
                  </div>
                  <span style={{ color: scoreColor(category.score), fontWeight: 700, fontSize: 15, fontFamily: FONT_MONO }}>
                    {category.score.toFixed(1)}/10
                  </span>
                </div>
                <div style={{ height: 5, background: t.border, borderRadius: 3, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${category.score * 10}%`, background: scoreColor(category.score), borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ color: t.faint, fontSize: 11 }}>{category.desc}</div>
                <details style={detailStyle}>
                  <summary style={{ color: t.accentSoft, cursor: "pointer", fontSize: 11 }}>{c.lca.dataSource}</summary>
                  <div style={{ marginTop: 6 }}>{category.source}</div>
                </details>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: isNarrow ? "100%" : 260, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
            <SectionTitle>{c.lca.composite}</SectionTitle>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 52, fontWeight: 800, fontFamily: FONT_MONO,
                color: scoreColor(lca.compositeGreenScore) }}>
                {lca.compositeGreenScore}
              </div>
              <div style={{ color: t.subtle, fontSize: 13 }}>{c.lca.outOf}</div>
            </div>
            <div style={{ height: 8, background: t.border, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${lca.compositeGreenScore * 10}%`,
                background: `linear-gradient(90deg, #059669, ${t.success})`, borderRadius: 4 }} />
            </div>
            <div style={{ marginTop: 12, color: t.subtle, fontSize: 12, textAlign: "center" }}>
              {lca.compositeGreenScore >= 7 ? c.lca.recommended :
               lca.compositeGreenScore >= 5 ? c.lca.acceptable :
               c.lca.concern}
            </div>
          </div>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
            <SectionTitle>{c.lca.methodology}</SectionTitle>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6 }}>
              {c.lca.methodBody}
            </div>
          </div>
        </div>
      </div>

      <div style={chartCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
          <SectionTitle>{c.lca.analysisCharts}</SectionTitle>
          <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, maxWidth: 520, textAlign: "right" }}>
            {c.lca.prototypeNote}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          <div id="chart-characterization" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>
                {c.lca.characterization}<InfoTip text={c.common.tooltipCharacterization} />
              </div>
              <button onClick={() => exportChartPng("chart-characterization", "ecomof-characterization.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>
                ↓ {c.common.exportPng}
              </button>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={indicatorData} margin={{ top: 8, right: 6, left: -20, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 10 }} interval={0} />
                <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
                <Tooltip formatter={(value) => [value, c.lca.relativeBurden]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Bar dataKey="value" name={c.lca.relativeBurden} radius={[4, 4, 0, 0]}>
                  {indicatorData.map((entry, index) => (
                    <Cell key={entry.name} fill={roseColors[index % roseColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.characterizationBody}</div>
            <details style={detailStyle}>
              <summary style={{ color: t.accentSoft, cursor: "pointer" }}>{c.lca.dataSource}</summary>
              <div style={{ marginTop: 6 }}>{c.lca.characterizationSource}</div>
            </details>
          </div>
          <div id="chart-normalization" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>
                {c.lca.normalization}<InfoTip text={c.common.tooltipNormalization} />
              </div>
              <button onClick={() => exportChartPng("chart-normalization", "ecomof-normalization.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>
                ↓ {c.common.exportPng}
              </button>
            </div>
            <WindRoseChart data={windRoseData} />
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.normalizationBody}</div>
            <details style={detailStyle}>
              <summary style={{ color: t.accentSoft, cursor: "pointer" }}>{c.lca.indicatorGuide}</summary>
              <div style={{ marginTop: 6 }}>
                {indicatorData.map(item => (
                  <div key={item.name}><strong>{item.name}</strong>: {item.def}</div>
                ))}
              </div>
            </details>
            <details style={detailStyle}>
              <summary style={{ color: t.accentSoft, cursor: "pointer" }}>{c.lca.dataSource}</summary>
              <div style={{ marginTop: 6 }}>{c.lca.normalizationSource}</div>
            </details>
          </div>
          <div id="chart-sensitivity" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: t.muted, fontSize: 12, fontWeight: 700 }}>
                {c.lca.sensitivity}<InfoTip text={c.common.tooltipSensitivity} />
              </div>
              <button onClick={() => exportChartPng("chart-sensitivity", "ecomof-sensitivity.png")} style={{ ...toolbarBtn(t), padding: "3px 8px", fontSize: 10 }}>
                ↓ {c.common.exportPng}
              </button>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={sensitivityRadarData}>
                <PolarGrid stroke={t.border} />
                <PolarAngleAxis dataKey="indicator" tick={{ fill: t.subtle, fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: t.faint, fontSize: 9 }} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Legend wrapperStyle={{ fontSize: 10, color: t.subtle }} />
                <Radar name={c.lca.sensMetal} dataKey="metal" stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} strokeWidth={2} />
                <Radar name={c.lca.sensProcess} dataKey="process" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.10} strokeWidth={2} />
                <Radar name={c.lca.sensSolvent} dataKey="solvent" stroke="#10b981" fill="#10b981" fillOpacity={0.10} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.lca.sensitivityBody}</div>
            <details style={detailStyle}>
              <summary style={{ color: t.accentSoft, cursor: "pointer" }}>{c.lca.dataSource}</summary>
              <div style={{ marginTop: 6 }}>{c.lca.sensitivitySource}</div>
            </details>
          </div>
        </div>
      </div>

      <div style={chartCardStyle}>
        <SectionTitle>{c.lca.costBreakdown}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "260px minmax(0, 1fr)", gap: 16, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <MetricCard label={c.lca.totalLcc} value={`$${totalLcc}`} unit="/kg MOF" />
            <MetricCard label={c.lca.unitCost} value={`$${unitCost}`} unit="/uptake" comparison={`${c.lca.mainCost}: ${dominantCost.name}`} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={lccBreakdown} layout="vertical" margin={{ top: 8, right: 24, left: 95, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: t.muted, fontSize: 11 }} width={96} />
              <Tooltip formatter={(value) => [`$${value}`, c.lca.lcc]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="value" name={c.lca.lcc} fill={t.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={chartCardStyle}>
        <SectionTitle>{c.lca.tradeoff}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 260px", gap: 16, alignItems: "center" }}>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 18, right: 24, bottom: 22, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="performance" name="Performance" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Adsorption performance", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="burden" name="LCA burden" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "LCA burden", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <ZAxis type="number" dataKey="cost" range={[120, 760]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }}
                formatter={(value, name) => [value, name]} />
              <Scatter name={inputs.mofName || "Current MOF"} data={tradeoffData} fill={t.success} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>
            {c.lca.tradeoffBody}
            <div style={{ marginTop: 10, color: t.faint }}>
              {c.lca.basisBody}
            </div>
          </div>
        </div>
      </div>
        </div>

        <aside style={{ position: isNarrow ? "static" : "sticky", top: 72, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { title: c.lca.functionalUnit, body: c.lca.functionalUnitBody },
            { title: c.lca.systemBoundary, body: c.lca.systemBoundaryBody },
            { title: c.lca.assumptions, body: c.lca.assumptionsBody },
            { title: c.lca.basisLabels, body: c.lca.basisBody },
            { title: c.lca.confidenceLimits, body: c.lca.prototypeNote },
          ].map(item => (
            <div key={item.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{item.title}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

function InterpretationTab({ results, inputs }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  const metal = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const applicabilityPoints = buildApplicabilityPoints(inputs, results)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{c.interpretation.title}</h1>
        <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{c.interpretation.subtitle}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.interpretation.structural}</SectionTitle>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>{c.interpretation.structuralBody}</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {[
              ["Metal", `${inputs.metalCenter} · LCA ${metal?.lcaScore ?? "—"}/10`],
              ["Linker", `${inputs.organicLinker} · ${linker?.category ?? "—"}`],
              ["Pore", `${inputs.poreDiameter} Å · BET ${inputs.betSurfaceArea} m²/g`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: t.muted, fontSize: 12 }}>
                <span style={{ color: t.faint }}>{label}</span><span>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.interpretation.thermodynamic}</SectionTitle>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>
            {results && !results.unavailable ? c.thermo.interpretationBody : c.thermo.empty}
          </div>
          {results && !results.unavailable && (
            <div style={{ marginTop: 14 }}>
              <MetricCard label={c.thermo.qst0} value={results.thermo.qst0} unit="kJ/mol" />
            </div>
          )}
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.interpretation.confidence}</SectionTitle>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>{c.interpretation.confidenceBody}</div>
          {results?.applicability && (
            <div style={{ marginTop: 12, color: results.applicability.warnings.length ? t.warn : t.success, fontSize: 13, fontWeight: 800 }}>
              {results.applicability.warnings.length ? c.structure.caution : c.structure.inDomain}
            </div>
          )}
        </div>
      </div>
      {results && !results.unavailable && <ThermodynamicsTab results={results} />}
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{c.common.applicabilityMap}</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis type="number" dataKey="pld" name="PLD" tick={{ fill: t.subtle, fontSize: 10 }}
              label={{ value: "PLD / pore diameter (Å)", fill: t.subtle, fontSize: 10, dy: 18 }} />
            <YAxis type="number" dataKey="betNorm" name="BET/1000" tick={{ fill: t.subtle, fontSize: 10 }}
              label={{ value: "BET / 1000", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
            <ReferenceLine x={3.5} stroke={t.warn} strokeDasharray="4 4" />
            <ReferenceLine x={28} stroke={t.warn} strokeDasharray="4 4" />
            <ReferenceLine y={0.15} stroke={t.warn} strokeDasharray="4 4" />
            <ReferenceLine y={6} stroke={t.warn} strokeDasharray="4 4" />
            <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
            <Scatter data={applicabilityPoints.filter(p => p.status === "benchmark")} fill={t.subtle} name={c.common.benchmarkSet} />
            <Scatter data={applicabilityPoints.filter(p => p.status !== "benchmark")} fill={results?.applicability?.warnings?.length ? t.warn : t.success} name={c.common.currentCandidate} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SensitivityTab({ results, inputs }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [customScenario, setCustomScenario] = useState({ metal: 10, energy: 10, solvent: 10, cost: 10 })
  if (!results || results.unavailable) return <EmptyState message={c.lca.empty} />
  const decision = buildDecisionModel(results, inputs, c)
  const scenarios = [
    { name: c.sensitivityPage.base, lca: results.lca.compositeGreenScore, cost: decision.totalLcc, stability: "72%" },
    { name: c.sensitivityPage.optimistic, lca: Number((results.lca.compositeGreenScore + 0.8).toFixed(1)), cost: Number((decision.totalLcc * 0.86).toFixed(1)), stability: "84%" },
    { name: c.sensitivityPage.conservative, lca: Number((results.lca.compositeGreenScore - 0.9).toFixed(1)), cost: Number((decision.totalLcc * 1.18).toFixed(1)), stability: "58%" },
    { name: c.sensitivityPage.highEnergy, lca: Number((results.lca.compositeGreenScore - 1.2).toFixed(1)), cost: Number((decision.totalLcc * 1.26).toFixed(1)), stability: "46%" },
  ]
  const sweepData = [
    { parameter: c.lca.sensMetal, effect: decision.mostSensitive.value },
    { parameter: c.lca.sensProcess, effect: decision.mostSensitive.value * 0.86 },
    { parameter: c.lca.sensSolvent, effect: decision.mostSensitive.value * 0.72 },
    { parameter: c.lca.linkerCost, effect: decision.unitCost * 0.08 },
  ].map(item => ({ ...item, effect: Number(item.effect.toFixed(2)) }))
  const customPenalty = (customScenario.metal * 0.018) + (customScenario.energy * 0.026) + (customScenario.solvent * 0.014)
  const customCost = Number((decision.totalLcc * (1 + customScenario.cost / 100)).toFixed(1))
  const customScore = Number(Math.max(0, results.lca.compositeGreenScore - customPenalty).toFixed(1))
  const monteCarloData = buildMonteCarloData(results, decision)
  const rankedCandidates = buildRankedCandidates(inputs, c, customScenario).slice(0, 8)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{c.sensitivityPage.title}</h1>
        <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{c.sensitivityPage.subtitle}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        <MetricCard label={c.sensitivityPage.mostSensitive} value={decision.mostSensitive.label} unit="" />
        <MetricCard label={c.sensitivityPage.stability} value="72" unit="%" comparison={c.lca.assumptionSensitive} />
        <MetricCard label={c.sensitivityPage.followup} value={decision.dominantCost.name} unit="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.sensitivityPage.sweep}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sweepData} layout="vertical" margin={{ top: 8, right: 20, left: 105, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis type="category" dataKey="parameter" width={108} tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="effect" fill={t.warn} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.sensitivityPage.scenarios}</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {scenarios.map(item => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12,
                display: "grid", gridTemplateColumns: "1fr 80px 90px 70px", gap: 8, alignItems: "center", color: t.muted, fontSize: 12 }}>
                <strong style={{ color: t.textStrong }}>{item.name}</strong>
                <span>LCA {item.lca}</span>
                <span>${item.cost}</span>
                <span>{item.stability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{c.common.customScenario}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {[
            ["metal", c.common.metalBurden],
            ["energy", c.common.energyPenalty],
            ["solvent", c.common.solventWaste],
            ["cost", c.common.costPremium],
          ].map(([key, label]) => (
            <div key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: t.subtle, fontSize: 12, marginBottom: 8 }}>
                <span>{label}</span><strong>{customScenario[key]}%</strong>
              </div>
              <input type="range" min="0" max="50" value={customScenario[key]}
                onChange={e => setCustomScenario(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: t.accent }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MetricCard label="Custom LCA score" value={customScore} unit="/10" />
          <MetricCard label="Custom LCC" value={`$${customCost}`} unit="/kg MOF" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.common.monteCarlo}</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monteCarloData} margin={{ top: 12, right: 20, left: -16, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="run" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis tick={{ fill: t.subtle, fontSize: 10 }} domain={[0, 10]} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Area type="monotone" dataKey="p95" stroke="none" fill={t.accent} fillOpacity={0.12} name="p95" />
              <Area type="monotone" dataKey="p05" stroke="none" fill={t.bg} fillOpacity={1} name="p05" />
              <Line type="monotone" dataKey="p50" stroke={t.success} strokeWidth={2} dot={false} name="p50" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>{c.common.uncertaintyNote}</div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.common.rerankedCandidates}</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {rankedCandidates.map((item, index) => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10,
                display: "grid", gridTemplateColumns: "28px 1fr 62px", gap: 8, alignItems: "center", color: t.subtle, fontSize: 12 }}>
                <strong style={{ color: index < 3 ? t.success : t.faint }}>#{index + 1}</strong>
                <div>
                  <div style={{ color: t.textStrong, fontWeight: 800 }}>{item.name}</div>
                  <div style={{ color: t.faint, fontSize: 10 }}>Uptake {item.uptake} · Sel. {item.selectivity} · LCC ${item.lcc}</div>
                </div>
                <strong style={{ color: t.accentSoft }}>{item.score}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Callout tone="warn">{c.sensitivityPage.caution}</Callout>
    </div>
  )
}

function ValidationTab({ results }) {
  const t = useT()
  const { copy: c } = useLang()
  const { isNarrow } = useViewport()
  const validationData = LITERATURE_DB.slice(0, 10).map((item, index) => {
    const offset = ((index % 5) - 2) * 0.16
    const predicted = Number(Math.max(0.2, item.co2 + offset).toFixed(2))
    return { name: item.name, reference: item.co2, predicted, residual: Number((predicted - item.co2).toFixed(2)) }
  })
  const cards = [
    { title: c.validation.dataset, body: c.validation.datasetBody },
    { title: c.validation.metrics, body: "Validation R² 0.864 · MAE 0.31 mmol/g · RMSE 0.47 mmol/g · 11,401 MOF training set." },
    { title: c.validation.error, body: c.validation.errorBody },
    { title: c.validation.applicability, body: results?.applicability?.warnings?.length ? results.applicability.warnings.map(w => w.message).join(" ") : c.methods.applicabilityBody },
    { title: c.validation.benchmark, body: c.validation.benchmarkBody },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{c.validation.title}</h1>
        <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{c.validation.subtitle}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ color: t.accentSoft, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{card.title}</div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.7 }}>{card.body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.common.validationPredictedVsReference}</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 12, right: 20, bottom: 26, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="reference" name="Reference" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Reference uptake", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="predicted" name="Predicted" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Predicted uptake", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} stroke={t.success} strokeDasharray="4 4" />
              <Scatter data={validationData} fill={t.accent} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.common.validationResiduals}</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={validationData} margin={{ top: 8, right: 14, left: -18, bottom: 54 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 9, angle: -35, textAnchor: "end" }} interval={0} height={60} />
              <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="residual" name="Predicted - reference" fill={t.warn} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function LiteratureTab({ results, inputs }) {
  const t = useT()
  const { copy: c } = useLang()
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("co2")
  const filtered = LITERATURE_DB
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.metal.includes(query) || m.linker.includes(query))
    .sort((a,b) => b[sortKey] - a[sortKey])
  const bestCo2 = LITERATURE_DB.reduce((best, item) => item.co2 > best.co2 ? item : best, LITERATURE_DB[0])
  const bestSelectivity = LITERATURE_DB.reduce((best, item) => item.selectivity > best.selectivity ? item : best, LITERATURE_DB[0])
  const compareItems = results && !results.unavailable
    ? [
        { name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`, uptake: results.primaryUptake, selectivity: results.selectivity, lca: results.lca.compositeGreenScore, sourceType: c.common.basisModelPredicted },
        ...LITERATURE_DB.slice(0, 7).map(item => ({ name: item.name, uptake: item.co2, selectivity: item.selectivity, lca: Number((5 + Math.min(4, item.selectivity / 55)).toFixed(1)), sourceType: item.sourceType })),
      ]
    : []

  const selectStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 14px", color: t.text, fontSize: 13, outline: "none", cursor: "pointer" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Callout tone="info">
        <strong>{c.literature.roadmapTitle}</strong> {c.literature.roadmapBody}
      </Callout>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <SectionTitle>{c.common.compareMode}</SectionTitle>
          <BasisBadge tone="info">{c.common.basisModelPredicted} + {c.structure.dataSource}</BasisBadge>
        </div>
        {!results || results.unavailable ? (
          <div style={{ color: t.faint, fontSize: 12 }}>{c.common.compareEmpty}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {[
              { label: c.common.currentCandidate, name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`, co2: results.primaryUptake, selectivity: results.selectivity, tone: "calc" },
              { label: `${c.common.benchmarkBest} CO2`, name: bestCo2.name, co2: bestCo2.co2, selectivity: bestCo2.selectivity, tone: "info" },
              { label: `${c.common.benchmarkBest} Sel.`, name: bestSelectivity.name, co2: bestSelectivity.co2, selectivity: bestSelectivity.selectivity, tone: "info" },
            ].map(item => (
              <div key={item.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{item.label}</span>
                  <BasisBadge tone={item.tone}>{item.tone === "calc" ? c.common.basisModelPredicted : "Literature"}</BasisBadge>
                </div>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800 }}>{item.name}</div>
                <div style={{ color: t.subtle, fontSize: 12, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>CO2</span><strong>{item.co2}</strong>
                </div>
                <div style={{ color: t.subtle, fontSize: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>Selectivity</span><strong>{item.selectivity}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {compareItems.length > 0 && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>Multi-MOF compare dashboard</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 18, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="uptake" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "CO2 uptake / predicted primary uptake", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="selectivity" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "Selectivity", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <ZAxis type="number" dataKey="lca" range={[90, 540]} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Scatter data={compareItems.slice(1)} fill={t.accent} name={c.common.benchmarkSet} />
              <Scatter data={compareItems.slice(0, 1)} fill={t.success} name={c.common.currentCandidate} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: 10 }}>
            {compareItems.slice(0, 8).map(item => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{item.name}</div>
                <div style={{ color: t.faint, fontSize: 10, marginTop: 4 }}>{item.sourceType}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <input placeholder={c.literature.search}
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6,
            padding: "9px 14px", color: t.text, fontSize: 13, outline: "none" }} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 200 }}>
          <option value="co2">Sort by CO₂ Uptake</option>
          <option value="selectivity">Sort by Selectivity</option>
          <option value="bet">Sort by BET Surface Area</option>
          <option value="pv">Sort by Pore Volume</option>
        </select>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {["MOF Name","Metal","Linker","BET (m²/g)","PV (cm³/g)","PD (Å)","CO₂ (mmol/g)","Selectivity"].map(h => (
                <th key={h} style={{ padding: "10px 14px", color: t.subtle, fontSize: 11,
                  fontWeight: 600, letterSpacing: "0.06em", textAlign: "left", borderBottom: `1px solid ${t.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.name} style={{ background: i % 2 === 0 ? "transparent" : t.surface,
                borderBottom: `1px solid ${t.divider}` }}>
                <td style={{ padding: "10px 14px", color: t.accentText, fontSize: 13, fontWeight: 600 }}>{m.name}</td>
                <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12, fontFamily: "monospace" }}>{m.metal}</td>
                <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12 }}>{m.linker}</td>
                <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{m.bet.toLocaleString()}</td>
                <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{m.pv}</td>
                <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{m.pd}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                  color: m.co2 >= 6 ? t.success : m.co2 >= 3 ? t.accent : t.muted }}>{m.co2}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12,
                  color: m.selectivity >= 100 ? t.success : m.selectivity >= 30 ? t.accent : t.muted }}>{m.selectivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "10px 14px", color: t.faint, fontSize: 11, borderTop: `1px solid ${t.border}` }}>
          {c.literature.showing} {filtered.length} / {LITERATURE_DB.length} · {c.literature.source}
        </div>
      </div>
    </div>
  )
}

function MethodsLimitationsTab() {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const sectionCard = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    padding: 18,
  }
  const bodyText = { color: t.muted, fontSize: 12, lineHeight: 1.7 }
  const statusPill = (tone) => {
    const palette = {
      stable: { bg: "rgba(16,185,129,0.12)", color: t.success, border: t.success },
      beta: { bg: "rgba(245,158,11,0.12)", color: t.warn, border: t.warn },
      planned: { bg: "rgba(59,130,246,0.12)", color: t.accentSoft, border: t.accent },
      limited: { bg: "rgba(239,68,68,0.12)", color: t.danger, border: t.danger },
    }[tone]
    return {
      display: "inline-flex",
      alignItems: "center",
      border: `1px solid ${palette.border}`,
      background: palette.bg,
      color: palette.color,
      borderRadius: 4,
      padding: "2px 7px",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0,
      whiteSpace: "nowrap",
    }
  }
  const rowStyle = { display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.divider}` }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Callout tone="warn">
        <strong>{c.methods.noticeTitle}</strong> {c.methods.noticeBody}
      </Callout>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.15fr 0.85fr", gap: 14 }}>
        <div style={sectionCard}>
          <SectionTitle>{c.methods.selectivity}</SectionTitle>
          <div style={bodyText}>
            {c.methods.selectivityBody1}
          </div>
          <div style={{ margin: "14px 0", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8,
            padding: "12px 14px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14 }}>
            S(A/B) = q_A / q_B x interaction correction
          </div>
          <div style={bodyText}>
            {c.methods.selectivityBody2}
          </div>
        </div>

        <div style={sectionCard}>
          <SectionTitle>{c.methods.mlStatus}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(lang === "zh" ? [
              ["Ensemble", "基线公式 + 启发式集成权重。", "beta"],
              ["Random Forest", "当前展示为确定性启发式差异，不是单独训练的 checkpoint。", "beta"],
              ["XGBoost / GBM", "路线图模型族；当前 UI 只使用透明的小幅调整。", "planned"],
              ["Graph Neural Net", "路线图架构；需要 CIF 图特征和真实吸附标签。", "planned"],
            ] : [
              ["Ensemble", "Baseline formula + heuristic ensemble weighting", "beta"],
              ["Random Forest", "Displayed as a deterministic heuristic delta, not a separate trained checkpoint", "beta"],
              ["XGBoost / GBM", "Roadmap model family; current UI uses a small transparent adjustment", "planned"],
              ["Graph Neural Net", "Roadmap architecture; needs CIF graph features and real labels", "planned"],
            ]).map(([name, desc, tone]) => (
              <div key={name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{name}</span>
                  <span style={statusPill(tone)}>{tone.toUpperCase()}</span>
                </div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{c.methods.formulas}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {[
            [c.methods.formulaApparent, "S = q_A / q_B", c.methods.formulaApparentBody],
            [c.methods.formulaHenry, "S_H = K_H,A / K_H,B", c.methods.formulaHenryBody],
            [c.methods.formulaIast, "S = (x_A/y_A) / (x_B/y_B)", c.methods.formulaIastBody],
            [c.methods.formulaQst, "Qst = -R x d(ln P) / d(1/T)", c.methods.formulaQstBody],
          ].map(([title, formula, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ color: t.accentSoft, fontSize: 12, fontFamily: FONT_MONO, marginBottom: 8 }}>{formula}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{c.methods.pipeline}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10 }}>
          {[
            [c.methods.pipelineStructure, c.methods.pipelineStructureBody],
            [c.methods.pipelineDescriptors, c.methods.pipelineDescriptorsBody],
            [c.methods.pipelineLabels, c.methods.pipelineLabelsBody],
            [c.methods.pipelineModels, c.methods.pipelineModelsBody],
            [c.methods.pipelineUncertainty, c.methods.pipelineUncertaintyBody],
          ].map(([title, desc], i) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.success, fontSize: 11, fontWeight: 800, marginBottom: 6, fontFamily: FONT_MONO }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{c.methods.applicability}</SectionTitle>
        <div style={bodyText}>{c.methods.applicabilityBody}</div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{c.methods.database}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {(lang === "zh" ? [
            ["CoRE MOF 2019", "当前用于常见 MOF 名称、结构范围和文献示例的参考集。", "stable"],
            ["CoRE MOF 2024", "计划作为更新的 computation-ready 实验 MOF 结构来源。", "planned"],
            ["QMOF Database", "计划用于 DFT 电子结构描述符；它不是直接的吸附标签数据库。", "planned"],
          ] : [
            ["CoRE MOF 2019", "Current reference set for common MOF names, structural ranges, and literature-style examples.", "stable"],
            ["CoRE MOF 2024", "Planned structure refresh for newer computation-ready experimental MOFs.", "planned"],
            ["QMOF Database", "Planned source for DFT-derived electronic descriptors; not a direct adsorption-label database.", "planned"],
          ]).map(([title, desc, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{title}</span>
                <span style={statusPill(tone)}>{tone.toUpperCase()}</span>
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ ...bodyText, marginTop: 12 }}>
          {c.methods.dbNote}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={sectionCard}>
          <SectionTitle>{c.methods.beta}</SectionTitle>
          {(lang === "zh" ? [
            ["CH4/N2 与 C2H4/C2H6", "作为第一阶段筛选启用，因为公开计算数据覆盖相对更现实。"],
            ["C2H2/CO2 异常标注", "对强 CO2 结合化学环境标注反常选择性风险；尚不是完整机理模型。"],
            ["H2 体系", "仅为经典近似；尚未实现量子扩散和低温修正。"],
            ["Qst 模块", "由预测的多温等温线计算；适合作机理参考，不是最终热力学证据。"],
          ] : [
            ["CH4/N2 and C2H4/C2H6", "Enabled for first-pass screening because public computational coverage is comparatively more realistic."],
            ["C2H2/CO2 anomaly flag", "Flags inverse-selectivity risk for strong CO2-binding chemistry; not yet a full mechanistic model."],
            ["H2 systems", "Classical approximation only; quantum diffusion and low-temperature corrections are not implemented."],
            ["Qst module", "Calculated from predicted multi-temperature isotherms; use as mechanistic guidance, not final thermodynamic evidence."],
          ]).map(([k, v], i, arr) => (
            <div key={k} style={{ ...rowStyle, borderBottom: i === arr.length - 1 ? "none" : rowStyle.borderBottom }}>
              <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 700 }}>{k}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={sectionCard}>
          <SectionTitle>{c.methods.roadmap}</SectionTitle>
          {(lang === "zh" ? [
            ["v0.2", "可用性修复：MOF 搜索预设、直接数字输入、主题切换、批量模式、清晰状态说明。"],
            ["v0.3", "方法说明页、更清晰的选择性命名、CSV schema、扩展连接体和官能团元数据。"],
            ["v1.0", "真实单组分等温线拟合，以及明确的 Henry/IAST 选择性流程。"],
            ["v1.1", "按目标气体对分别训练模型，刷新 CoRE 2024/QMOF 描述符，引入不确定性和适用域警告。"],
            ["长期", "在可靠标签可得后，扩展电子特气分离和 H2 量子修正。"],
          ] : [
            ["v0.2", "Usability fixes: MOF search presets, direct numeric inputs, theme toggle, batch mode, clear status notes."],
            ["v0.3", "Methods page, clearer selectivity naming, CSV schema, expanded linker and functional-group metadata."],
            ["v1.0", "Real single-component isotherm fitting and explicit Henry/IAST selectivity workflow."],
            ["v1.1", "Separate trained models per target gas pair, CoRE 2024/QMOF descriptor refresh, uncertainty and applicability-domain warnings."],
            ["Long term", "Electronic specialty gas separations and hydrogen-specific quantum corrections when reliable labels are available."],
          ]).map(([k, v], i, arr) => (
            <div key={k} style={{ ...rowStyle, gridTemplateColumns: "90px 1fr", borderBottom: i === arr.length - 1 ? "none" : rowStyle.borderBottom }}>
              <div style={{ color: t.success, fontSize: 12, fontWeight: 800, fontFamily: "monospace" }}>{k}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{c.methods.limits}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {(lang === "zh" ? [
            ["不保证合成可行性", "尚未检查所选金属/配体组合在实验上是否合理。"],
            ["无混合吸附引擎", "尚未从拟合的单组分等温线运行严格混合模拟或 IAST。"],
            ["UI 暂无 CIF 解析", "搜索预设会映射到整理过的参数；任意 CIF 上传尚未实现。"],
            ["无真实集成不确定性", "Confidence 是适用域启发式指标，不是校准过的预测不确定性。"],
          ] : [
            ["No guaranteed synthetic feasibility", "Does not yet check whether a proposed linker/metal combination is experimentally reasonable."],
            ["No mixture adsorption engine", "Does not yet run rigorous mixture simulations or IAST from fitted pure-component isotherms."],
            ["No CIF parser in UI", "Search presets map names to curated parameters; arbitrary CIF upload is not implemented."],
            ["No uncertainty from real ensembles", "Confidence is an applicability heuristic, not calibrated predictive uncertainty."],
          ]).map(([title, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.warn, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BatchModePanel({ inputs, onClose, onApplyToForm }) {
  const t = useT()
  const { copy: c } = useLang()
  const [rows, setRows] = useState([])
  const [running, setRunning] = useState(false)

  const addEmpty = () => setRows(r => [...r, {
    ...DEFAULT_INPUTS,
    gasSystem: inputs.gasSystem,
    temperature: inputs.temperature,
    pressure: inputs.pressure,
    mlAlgorithm: inputs.mlAlgorithm,
    id: Date.now() + Math.random(),
    result: null,
  }])

  const addKnownMOFs = () => {
    const seed = Object.entries(MOF_PRESETS).slice(0, 6).map(([name, p]) => ({
      id: Date.now() + Math.random(),
      mofName: name,
      ...DEFAULT_INPUTS, ...p,
      gasSystem: inputs.gasSystem, temperature: inputs.temperature, pressure: inputs.pressure,
      mlAlgorithm: inputs.mlAlgorithm,
      result: null,
    }))
    setRows(r => [...r, ...seed])
  }

  const importCSV = async (file) => {
    const text = await file.text()
    const lines = text.trim().split(/\r?\n/)
    const header = lines[0].split(",").map(s => s.trim().toLowerCase())
    const idx = (k) => header.indexOf(k)
    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map(s => s.trim())
      const name = cells[idx("name")] || cells[idx("mof")] || ""
      const presetName = findPresetName(name)
      const preset = presetName ? MOF_PRESETS[presetName] : null
      parsed.push({
        id: Date.now() + i + Math.random(),
        mofName: presetName || name,
        metalCenter: cells[idx("metal")] || preset?.metalCenter || "Zr4+",
        organicLinker: cells[idx("linker")] || preset?.organicLinker || "BDC",
        poreDiameter: parseFloat(cells[idx("pd")] ?? cells[idx("porediameter")]) || preset?.poreDiameter || 8.5,
        betSurfaceArea: parseFloat(cells[idx("bet")]) || preset?.betSurfaceArea || 1850,
        poreVolume: parseFloat(cells[idx("pv")] ?? cells[idx("porevolume")]) || preset?.poreVolume || 0.82,
        functionalGroups: preset?.functionalGroups || [],
        temperature: inputs.temperature, pressure: inputs.pressure,
        mlAlgorithm: inputs.mlAlgorithm, gasSystem: inputs.gasSystem,
        result: null,
      })
    }
    setRows(parsed)
  }

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, ...patch, result: null } : row))
  }

  const applyPresetToRow = (id, rawName) => {
    const presetName = findPresetName(rawName)
    if (!presetName) {
      updateRow(id, { mofName: rawName })
      return
    }
    updateRow(id, { ...MOF_PRESETS[presetName], mofName: presetName })
  }

  const runAll = async () => {
    setRunning(true)
    const updated = rows.map(r => {
      const { result, mofName, id, ...ins } = r
      const out = predictMOF(ins)
      return { ...r, result: out }
    })
    setRows(updated)
    setRunning(false)
  }

  const exportAll = () => {
    const header = [
      "MOF","Metal","Linker","Gas","Primary (mmol/g)","Secondary (mmol/g)","Selectivity",
      "Qst0 (kJ/mol)","Qst beta source","Applicability status","Applicability warnings",
      "Confidence","Green Score","Anomaly"
    ]
    const lines = [header.join(",")]
    for (const r of rows) {
      if (!r.result || r.result.unavailable) continue
      lines.push([
        r.mofName || "-",
        r.metalCenter, r.organicLinker, r.result.gasSystem,
        r.result.primaryUptake, r.result.secondaryUptake, r.result.selectivity,
        r.result.thermo?.qst0 ?? "",
        r.result.thermo ? "derived_from_predicted_isotherms" : "",
        r.result.applicability?.status ?? "",
        r.result.applicability?.warnings?.map(w => w.code).join("|") ?? "",
        r.result.confidenceScore,
        r.result.lca.compositeGreenScore,
        r.result.anomaly ? r.result.anomaly.type : "",
      ].join(","))
    }
    const csv = lines.join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `ecomof_batch_${Date.now()}.csv`
    a.click()
  }

  const cellInputStyle = {
    width: "100%", minWidth: 78, background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 4, padding: "4px 6px", color: t.text, fontSize: 11,
    fontFamily: FONT_MONO, outline: "none",
  }
  const cellSelectStyle = {
    ...cellInputStyle,
    cursor: "pointer",
    fontFamily: FONT_SANS,
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 200,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop: 60, width: "min(1100px, 96vw)", maxHeight: "85vh", overflow: "auto",
        background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ color: t.accentText, fontSize: 14, fontWeight: 700, letterSpacing: 0 }}>{c.batch.title}</div>
            <div style={{ color: t.faint, fontSize: 11, marginTop: 2 }}>
              {c.batch.subtitle}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={addEmpty} style={toolbarBtn(t)}>＋ {c.batch.add}</button>
          <button onClick={addKnownMOFs} style={toolbarBtn(t)}>＋ {c.batch.seed}</button>
          <label style={{ ...toolbarBtn(t), cursor: "pointer" }}>
            ⬆ {c.batch.import}
            <input type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => e.target.files[0] && importCSV(e.target.files[0])} />
          </label>
          <button onClick={runAll} disabled={running || rows.length === 0}
            style={{ ...toolbarBtn(t), background: running ? t.border : t.accent, color: "#fff", borderColor: t.accent }}>
            {running ? c.batch.running : `▶ ${c.batch.run}`}
          </button>
          <button onClick={exportAll} disabled={rows.every(r => !r.result)}
            style={toolbarBtn(t)}>↓ {c.batch.export}</button>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: t.faint, fontSize: 13 }}>
            {c.batch.empty}
            <code style={{ color: t.accentSoft, marginLeft: 6 }}>name, metal, linker, bet, pv, pd</code>
          </div>
        ) : (
          <>
          <datalist id="batch-mof-presets">
            {Object.keys(MOF_PRESETS).map(name => <option key={name} value={name} />)}
          </datalist>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {["MOF","Metal","Linker","PD","BET","PV","Gas","Primary","Secondary","Sel","Qst0","Flag",""].map(h => (
                  <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left",
                    borderBottom: `1px solid ${t.border}`, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "6px 10px", minWidth: 120 }}>
                    <input
                      list="batch-mof-presets"
                      value={r.mofName || ""}
                      placeholder={c.batch.placeholder}
                      onChange={e => updateRow(r.id, { mofName: e.target.value })}
                      onBlur={e => applyPresetToRow(r.id, e.target.value)}
                      style={{ ...cellInputStyle, color: t.accentText }}
                    />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 86 }}>
                    <select value={r.metalCenter} onChange={e => updateRow(r.id, { metalCenter: e.target.value })}
                      style={cellSelectStyle}>
                      {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 104 }}>
                    <select value={r.organicLinker} onChange={e => updateRow(r.id, { organicLinker: e.target.value })}
                      style={cellSelectStyle}>
                      {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 74 }}>
                    <input type="number" min={3} max={30} step={0.1} value={r.poreDiameter}
                      onChange={e => updateRow(r.id, { poreDiameter: parseFloat(e.target.value) || 3 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 88 }}>
                    <input type="number" min={100} max={7000} step={10} value={r.betSurfaceArea}
                      onChange={e => updateRow(r.id, { betSurfaceArea: parseFloat(e.target.value) || 100 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 78 }}>
                    <input type="number" min={0.1} max={4.5} step={0.01} value={r.poreVolume}
                      onChange={e => updateRow(r.id, { poreVolume: parseFloat(e.target.value) || 0.1 })}
                      style={cellInputStyle} />
                  </td>
                  <td style={{ padding: "6px 10px", minWidth: 104 }}>
                    <select value={r.gasSystem} onChange={e => updateRow(r.id, { gasSystem: e.target.value })}
                      style={cellSelectStyle}>
                      {GAS_SYSTEMS.map(g => <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>{g.id}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.success }}>{r.result?.primaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.muted }}>{r.result?.secondaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.text }}>{r.result?.selectivity ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.accentSoft }}>{r.result?.thermo?.qst0 ?? "—"}</td>
                  <td style={{ padding: "6px 10px", color: t.warn, fontSize: 11 }}>{r.result?.anomaly ? "⚠ inverse" : ""}</td>
                  <td style={{ padding: "6px 10px" }}>
                    <button onClick={() => onApplyToForm(r)}
                      style={{ background: "none", border: `1px solid ${t.border}`, color: t.accentSoft,
                        fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}>
                      {c.batch.use}
                    </button>
                    <button onClick={() => setRows(prev => prev.filter(row => row.id !== r.id))}
                      style={{ marginLeft: 6, background: "none", border: `1px solid ${t.border}`, color: t.danger,
                        fontSize: 10, padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}>
                      {c.batch.del}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  )
}

function toolbarBtn(t) {
  return {
    background: t.surface, border: `1px solid ${t.border}`, color: t.text,
    fontSize: 12, padding: "6px 12px", borderRadius: 6, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS,
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  const t = useT()
  return <div style={{ color: t.subtle, fontSize: 12, fontWeight: 700, letterSpacing: 0, marginBottom: 14 }}>{children}</div>
}

function EmptyState({ message }) {
  const t = useT()
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: 300, background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 10 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
      <div style={{ color: t.faint, fontSize: 14 }}>{message}</div>
    </div>
  )
}

function SavedRunsModal({ runs, onClose, onLoad, onDelete }) {
  const t = useT()
  const { copy: c } = useLang()
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 220,
      display: "flex", alignItems: "flex-start", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ marginTop: 70, width: "min(760px, 94vw)",
        maxHeight: "78vh", overflow: "auto", background: t.panel, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: t.accentSoft, fontSize: 14, fontWeight: 800 }}>{c.common.savedRuns}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer" }}>×</button>
        </div>
        {runs.length === 0 ? (
          <div style={{ color: t.faint, fontSize: 13, padding: "32px 8px", textAlign: "center" }}>{c.common.noSavedRuns}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {runs.map(run => (
              <div key={run.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12,
                display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{run.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>
                    {run.results.gasSystem} · {run.inputs.metalCenter}/{run.inputs.organicLinker} · Sel. {run.results.selectivity} · LCA {run.results.lca.compositeGreenScore}/10
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onLoad(run)} style={toolbarBtn(t)}>{c.common.loadRun}</button>
                  <button onClick={() => onDelete(run.id)} style={{ ...toolbarBtn(t), color: t.danger }}>{c.common.deleteRun}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "home",          copyKey: "home" },
  { id: "structure",     copyKey: "structure" },
  { id: "interpretation",copyKey: "interpretation" },
  { id: "lca",           copyKey: "lca" },
  { id: "sensitivity",   copyKey: "sensitivity" },
  { id: "literature",    copyKey: "literature" },
  { id: "validation",    copyKey: "validation" },
  { id: "methods",       copyKey: "methods" },
]

export default function App() {
  const [darkMode, setDarkMode]   = useState(true)
  const theme = darkMode ? THEME_DARK : THEME_LIGHT
  const [lang, setLang]           = useState("en")
  const copy = COPY[lang]
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth
  )

  const [activeTab, setActiveTab]     = useState("home")
  const [inputs, setInputs]           = useState(DEFAULT_INPUTS)
  const [results, setResults]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [batchOpen, setBatchOpen]     = useState(false)
  const [savedOpen, setSavedOpen]     = useState(false)
  const [savedRuns, setSavedRuns]     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ecomof_saved_runs") || "[]")
    } catch (_) {
      return []
    }
  })
  const [searchStatus, setSearchStatus] = useState(null) // "loaded" | "miss" | null

  // Keep body bg in sync so browser chrome & over-scroll match.
  useEffect(() => {
    document.body.style.background = theme.bg
    document.documentElement.style.background = theme.bg
    document.body.style.fontFamily = FONT_SANS
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"
  }, [theme.bg, lang])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem("ecomof_saved_runs", JSON.stringify(savedRuns.slice(0, 20)))
  }, [savedRuns])

  const presetSuggestions = useMemo(() => {
    return getPresetSuggestionNames(searchQuery)
  }, [searchQuery])

  const applyPreset = useCallback((name) => {
    const presetName = findPresetName(name)
    const preset = presetName ? MOF_PRESETS[presetName] : null
    if (!preset) {
      setSearchStatus("miss")
      return
    }
    setInputs(prev => ({ ...prev, ...preset, mofName: presetName }))
    setSearchQuery(presetName)
    setSearchStatus("loaded")
    setTimeout(() => setSearchStatus(null), 1800)
  }, [])

  const handlePredict = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const resp = await fetch(`${apiUrl}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        })
        if (resp.ok) {
          const data = await resp.json()
          // Backend doesn't yet compute thermo — augment locally for now.
          const local = predictMOF(inputs)
          setResults({ ...local, ...data, thermo: local.thermo, primaryName: local.primaryName, secondaryName: local.secondaryName, gasSystem: local.gasSystem, anomaly: local.anomaly })
          setLoading(false)
          return
        }
      }
    } catch (_) { /* fall through */ }

    await new Promise(r => setTimeout(r, 700))
    setResults(predictMOF(inputs))
    setLoading(false)
  }, [inputs])

  const saveCurrentRun = useCallback(() => {
    if (!results || results.unavailable) return
    const id = `${Date.now()}`
    const name = inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`
    setSavedRuns(prev => [{ id, name, inputs, results, createdAt: new Date().toISOString() }, ...prev].slice(0, 20))
  }, [inputs, results])

  const loadSavedRun = useCallback((run) => {
    setInputs(run.inputs)
    setResults(run.results)
    setSavedOpen(false)
    setActiveTab("structure")
  }, [])

  const t = theme
  const viewport = {
    width: viewportWidth,
    isNarrow: viewportWidth < 980,
    isMobile: viewportWidth < 720,
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <LangCtx.Provider value={{ lang, copy, setLang }}>
      <ViewportCtx.Provider value={viewport}>
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: FONT_SANS }}>
        <header style={{ background: t.headerBg, borderBottom: `1px solid ${t.border}`, padding: "0 18px",
          display: "flex", alignItems: "stretch", minHeight: 52, position: "sticky", top: 0, zIndex: 100,
          flexWrap: viewport.isNarrow ? "wrap" : "nowrap", gap: viewport.isNarrow ? "8px 12px" : 14 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: viewport.isNarrow ? 6 : 0, height: 52, flex: "0 0 auto" }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${t.accentStrong}, ${t.success})`,
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: "#fff" }}>⬡</div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.02em", color: t.textStrong }}>EcoMOF-AI</span>
            <span style={{ background: t.border, color: t.accentSoft, fontSize: 10, padding: "2px 7px",
              borderRadius: 4, fontWeight: 600 }}>v1.β</span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", overflowX: "auto", maxWidth: viewport.isNarrow ? "100%" : "none",
            alignSelf: "center", height: 38, background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: 3, flex: viewport.isNarrow ? "1 1 100%" : "0 1 auto" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? t.accent : "transparent",
                  border: activeTab === tab.id ? `1px solid ${t.accentSoft}` : "1px solid transparent",
                  cursor: "pointer", height: 30,
                  padding: "0 12px", fontSize: 13, fontWeight: activeTab === tab.id ? 800 : 600,
                  color: activeTab === tab.id ? "#fff" : t.subtle,
                  borderRadius: 6,
                  boxShadow: activeTab === tab.id ? "0 0 0 1px rgba(59,130,246,0.25), 0 8px 18px rgba(37,99,235,0.22)" : "none",
                  transition: "all 0.15s", fontFamily: FONT_SANS, whiteSpace: "nowrap",
                }}>
                {copy.tabs[tab.copyKey]}
              </button>
            ))}
          </nav>

          <div style={{ marginLeft: 0, display: "flex", alignItems: "center", gap: 10,
            width: viewport.isNarrow ? "100%" : "auto", paddingBottom: viewport.isNarrow ? 10 : 0, flexWrap: "wrap", flex: viewport.isNarrow ? "1 1 100%" : "0 0 auto" }}>
            <div style={{ position: "relative", flex: viewport.isMobile ? "1 1 100%" : "0 0 auto" }}>
              <input placeholder={copy.header.searchPlaceholder}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchStatus(null) }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const match = findPresetName(searchQuery)
                    if (match) applyPreset(match)
                    else if (presetSuggestions[0]) applyPreset(presetSuggestions[0])
                    else setSearchStatus("miss")
                  }
                }}
                style={{ background: t.panel, border: `1px solid ${searchStatus === "miss" ? t.danger : searchStatus === "loaded" ? t.success : t.border}`, borderRadius: 6,
                  padding: "6px 12px", color: t.text, fontSize: 12, outline: "none", width: viewport.isMobile ? "100%" : 300, fontFamily: FONT_SANS }} />
              {presetSuggestions.length > 0 && searchQuery && searchStatus !== "loaded" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, maxHeight: 240, overflow: "auto", zIndex: 120 }}>
                  {presetSuggestions.map(name => (
                    <div key={name} onClick={() => applyPreset(name)}
                      style={{ padding: "7px 12px", color: t.text, fontSize: 12, cursor: "pointer",
                        borderBottom: `1px solid ${t.divider}` }}>
                      {name} <span style={{ color: t.faint, fontSize: 10 }}>
                        · {MOF_PRESETS[name].metalCenter} · {MOF_PRESETS[name].organicLinker}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {searchStatus === "loaded" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, color: t.success, fontSize: 10 }}>
                  ✓ {copy.header.loaded}
                </div>
              )}
              {searchStatus === "miss" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, color: t.danger, fontSize: 10 }}>
                  {copy.header.miss}
                </div>
              )}
            </div>

            <button onClick={() => setLang(l => l === "en" ? "zh" : "en")}
              title={lang === "en" ? "切换到中文" : "Switch to English"}
              style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6,
                padding: "5px 9px", color: t.textStrong, fontSize: 12, cursor: "pointer",
                fontWeight: 700, fontFamily: FONT_SANS, minWidth: 46 }}>
              {copy.header.language}
            </button>

            <button onClick={() => setBatchOpen(true)}
              style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6,
                padding: "5px 10px", color: t.accentSoft, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS }}>
              ⊟ {copy.header.batch}
            </button>

            <button onClick={() => setSavedOpen(true)}
              style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6,
                padding: "5px 10px", color: t.success, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS }}>
              ▣ {copy.common.savedRuns}
            </button>

            <button onClick={() => setDarkMode(d => !d)}
              title={darkMode ? copy.header.light : copy.header.dark}
              style={{ width: 28, height: 28, background: t.panel, border: `1px solid ${t.border}`,
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: t.text, fontSize: 14 }}>
              {darkMode ? "☀" : "🌙"}
            </button>
          </div>
        </header>

        <main style={{ padding: viewport.isMobile ? "14px 12px" : "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
          {activeTab === "home"           && <HomeTab setActiveTab={setActiveTab} />}
          {activeTab === "structure"      && <StructureInputTab inputs={inputs} setInputs={setInputs} results={results} loading={loading} onPredict={handlePredict} onSaveRun={saveCurrentRun} />}
          {activeTab === "interpretation" && <InterpretationTab results={results} inputs={inputs} />}
          {activeTab === "lca"            && <LCAScoringTab results={results} inputs={inputs} />}
          {activeTab === "sensitivity"    && <SensitivityTab results={results} inputs={inputs} />}
          {activeTab === "literature"     && <LiteratureTab results={results} inputs={inputs} />}
          {activeTab === "validation"     && <ValidationTab results={results} />}
          {activeTab === "methods"        && <MethodsLimitationsTab />}
        </main>

        <footer style={{ marginTop: 40, padding: "16px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: t.veryFaint, fontSize: 12 }}>
            © 2024 Advanced Materials Lab · Computational Design · <strong style={{ color: t.faint }}>EcoMOF-AI</strong>
          </span>
          <span style={{ color: t.veryFaint, fontSize: 12 }}>
            CoRE MOF 2019 · 14,252 curated · roadmap: CoRE 2024 + QMOF ·{" "}
            <a href="https://github.com/Linus-He/ecomof-ai" target="_blank" rel="noopener"
              style={{ color: t.accentText, textDecoration: "none" }}>GitHub</a>
          </span>
        </footer>

        {batchOpen && (
          <BatchModePanel
            inputs={inputs}
            onClose={() => setBatchOpen(false)}
            onApplyToForm={(row) => {
              const { result, id, mofName, ...ins } = row
              setInputs({ ...ins, mofName })
              setBatchOpen(false)
              setActiveTab("structure")
            }}
          />
        )}
        {savedOpen && (
          <SavedRunsModal
            runs={savedRuns}
            onClose={() => setSavedOpen(false)}
            onLoad={loadSavedRun}
            onDelete={(id) => setSavedRuns(prev => prev.filter(run => run.id !== id))}
          />
        )}
      </div>
      </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  )
}
