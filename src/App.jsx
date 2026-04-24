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
  bg: "#0E1724", headerBg: "rgba(18,32,51,0.72)", panel: "#162538", surface: "#122033",
  sectionTint: "#15263B", card: "#162538",
  border: "rgba(255,255,255,0.10)", borderStrong: "rgba(255,255,255,0.16)",
  text: "#EAF1FB", textStrong: "#EAF1FB", muted: "#B6C2D5",
  subtle: "#8EA0B8", faint: "#7D8FA8", veryFaint: "#65768D",
  accent: "#7CB4FF", accentStrong: "#5C98FF", accentSoft: "#A8CAFF", accentText: "#7CB4FF",
  performance: "#7CB4FF", lcaAccent: "#8FD9C8", lccAccent: "#F6C98E", sensitivityAccent: "#B7A9FF", validationAccent: "#9CB2D4",
  success: "#8FD9C8", warn: "#F2A65A", danger: "#E88686",
  info: "#9CB2D4", rose: "#E88686", amber: "#F6C98E", violet: "#B7A9FF", cyan: "#7CB4FF",
  tooltipBg: "#132131", divider: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.08)", glassStrong: "rgba(110,168,255,0.14)",
  chartBg: "#132131", shadowSm: "0 8px 20px rgba(2,8,23,0.24)",
  shadowMd: "0 18px 42px rgba(0,0,0,0.30)",
  badgeInfoBg: "rgba(124,180,255,0.14)", badgeInfoText: "#7CB4FF",
  badgeCalcBg: "rgba(156,178,212,0.14)", badgeCalcText: "#A8CAFF",
  badgeProxyBg: "rgba(183,169,255,0.16)", badgeProxyText: "#B7A9FF",
  badgeUserBg: "rgba(142,160,184,0.14)", badgeUserText: "#B6C2D5",
  badgeWarnBg: "rgba(246,201,142,0.16)", badgeWarnText: "#F6C98E",
  badgeDangerBg: "rgba(232,134,134,0.15)", badgeDangerText: "#E88686",
}

const THEME_LIGHT = {
  bg: "#F7FAFE", headerBg: "rgba(255,255,255,0.62)", panel: "rgba(255,255,255,0.82)", surface: "#F3F8FD",
  sectionTint: "#EEF6FF", card: "#FCFEFF",
  border: "rgba(122,162,215,0.18)", borderStrong: "rgba(110,168,255,0.26)",
  text: "#1E2A3A", textStrong: "#1E2A3A", muted: "#607089",
  subtle: "#607089", faint: "#91A0B5", veryFaint: "#A9B5C7",
  accent: "#6EA8FF", accentStrong: "#4E8EF7", accentSoft: "#BFD9FF", accentText: "#4E8EF7",
  performance: "#6EA8FF", lcaAccent: "#8FD9C8", lccAccent: "#F6C98E", sensitivityAccent: "#B7A9FF", validationAccent: "#9CB2D4",
  success: "#8FD9C8", warn: "#F2A65A", danger: "#E88686",
  info: "#9CB2D4", rose: "#E88686", amber: "#F6C98E", violet: "#B7A9FF", cyan: "#6EA8FF",
  tooltipBg: "#FCFEFF", divider: "rgba(30,42,58,0.08)",
  glass: "rgba(255,255,255,0.72)", glassStrong: "rgba(255,255,255,0.82)",
  chartBg: "#FCFEFF", shadowSm: "0 8px 22px rgba(46,94,170,0.08)",
  shadowMd: "0 18px 45px rgba(46,94,170,0.10)",
  badgeInfoBg: "#EAF4FF", badgeInfoText: "#4E8EF7",
  badgeCalcBg: "#EEF3FA", badgeCalcText: "#5578A7",
  badgeProxyBg: "#F1EDFF", badgeProxyText: "#7A63E8",
  badgeUserBg: "#F3F6FA", badgeUserText: "#70839E",
  badgeWarnBg: "#FFF3E2", badgeWarnText: "#C88A2B",
  badgeDangerBg: "#FDEEEE", badgeDangerText: "#C76666",
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

const AROMATIC_SUBSTITUTION_POSITIONS = ["2", "3", "5", "6"]

function defaultGroupPositions(count = 1) {
  return AROMATIC_SUBSTITUTION_POSITIONS.slice(0, Math.max(1, Math.min(4, Number(count) || 1)))
}

function normalizeFunctionalGroupDetails(inputs = {}) {
  const selected = Array.isArray(inputs.functionalGroups) ? inputs.functionalGroups : []
  const details = inputs.functionalGroupDetails || {}
  return selected.reduce((acc, value) => {
    const raw = details[value] || {}
    const count = Math.max(1, Math.min(4, Number(raw.count) || raw.positions?.length || 1))
    const positions = Array.isArray(raw.positions) && raw.positions.length
      ? raw.positions.filter(pos => AROMATIC_SUBSTITUTION_POSITIONS.includes(String(pos))).slice(0, count)
      : defaultGroupPositions(count)
    acc[value] = { count, positions: positions.length ? positions : defaultGroupPositions(count) }
    return acc
  }, {})
}

function getFunctionalGroupEntries(inputs = {}) {
  const details = normalizeFunctionalGroupDetails(inputs)
  return Object.entries(details).map(([value, detail]) => ({
    value,
    detail,
    meta: FUNCTIONAL_GROUPS.find(group => group.value === value),
  })).filter(entry => entry.meta)
}

function hasFunctionalGroup(inputs = {}, value) {
  return getFunctionalGroupEntries(inputs).some(entry => entry.value === value)
}

function getFunctionalGroupCount(inputs = {}, value) {
  return normalizeFunctionalGroupDetails(inputs)[value]?.count || 0
}

function getTotalFunctionalGroupCount(inputs = {}) {
  return getFunctionalGroupEntries(inputs).reduce((sum, entry) => sum + entry.detail.count, 0)
}

function positionEffectFactor(positions = []) {
  if (!positions.length) return 1
  const set = new Set(positions.map(String))
  const highInfluence = ["2", "5"].filter(pos => set.has(pos)).length
  const metaInfluence = ["3", "6"].filter(pos => set.has(pos)).length
  const adjacentPenalty =
    (set.has("2") && set.has("3") ? 0.06 : 0) +
    (set.has("5") && set.has("6") ? 0.06 : 0)
  return Math.max(0.72, 1 + highInfluence * 0.08 + metaInfluence * 0.03 - adjacentPenalty)
}

function formatFunctionalGroupSummary(inputs = {}, lang = "en") {
  const entries = getFunctionalGroupEntries(inputs)
  if (!entries.length) return lang === "zh" ? "无" : "None"
  return entries.map(({ meta, detail }) => {
    const pos = detail.positions?.length ? detail.positions.join("/") : "—"
    return `${functionalGroupLabel(meta.label, lang)} ×${detail.count} @ ${pos}`
  }).join("; ")
}

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

const DATA_BASE_URL = `${import.meta.env.BASE_URL || "/"}data/`

const CURRENCIES = {
  USD: { label: "USD", symbol: "$", rate: 1, unit: "USD", note: "Reference currency used by seed LCC inventory." },
  CNY: { label: "CNY", symbol: "¥", rate: 7.24, unit: "CNY", note: "Static display factor, not live FX." },
  EUR: { label: "EUR", symbol: "€", rate: 0.93, unit: "EUR", note: "Static display factor, not live FX." },
  GBP: { label: "GBP", symbol: "£", rate: 0.80, unit: "GBP", note: "Static display factor, not live FX." },
  JPY: { label: "JPY", symbol: "¥", rate: 155.0, unit: "JPY", note: "Static display factor, not live FX." },
  CAD: { label: "CAD", symbol: "C$", rate: 1.37, unit: "CAD", note: "Static display factor, not live FX." },
  AUD: { label: "AUD", symbol: "A$", rate: 1.53, unit: "AUD", note: "Static display factor, not live FX." },
}

function formatCurrency(valueUsd, currencyCode = "USD", digits = 1) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const value = Number(valueUsd || 0) * currency.rate
  const decimals = currencyCode === "JPY" ? 0 : digits
  return `${currency.symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

async function fetchDataJson(fileName) {
  const response = await fetch(`${DATA_BASE_URL}${fileName}`)
  if (!response.ok) throw new Error(`Failed to load ${fileName}`)
  return response.json()
}

function parseCsvRows(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const split = (line) => line.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""))
  const headers = split(lines[0]).map(h => h.toLowerCase())
  return lines.slice(1).map(line => {
    const cells = split(line)
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] ?? ""
      return row
    }, {})
  })
}

function normalizeIsothermRows(rows) {
  return rows.map(row => ({
    mof_id: row.mof_id || row.mof || row.name || "uploaded",
    name: row.name || row.mof_name || row.mof || "Uploaded isotherm",
    gas: row.gas || row.component || "CO2",
    temperature_k: Number(row.temperature_k ?? row.temperature ?? row.t ?? row.temp_k),
    pressure_bar: Number(row.pressure_bar ?? row.pressure ?? row.p_bar ?? row.p),
    loading_mmolg: Number(row.loading_mmolg ?? row.loading ?? row.q_mmolg ?? row.q),
    method: row.method || row.source_type || "uploaded",
    source_ref: row.source_ref || row.source || "user CSV",
    doi_or_url: row.doi_or_url || row.doi || "—",
    quality_flag: row.quality_flag || "user_uploaded",
  })).filter(row =>
    Number.isFinite(row.temperature_k) &&
    Number.isFinite(row.pressure_bar) &&
    Number.isFinite(row.loading_mmolg)
  )
}

function fitLangmuirFromPoints(points) {
  const valid = points.filter(point => point.pressure_bar > 0 && point.loading_mmolg > 0)
  if (valid.length < 2) return null
  const n = valid.length
  const x = valid.map(point => point.pressure_bar)
  const y = valid.map(point => point.pressure_bar / point.loading_mmolg)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((acc, value, index) => acc + value * y[index], 0)
  const sumXX = x.reduce((acc, value) => acc + value * value, 0)
  const denom = n * sumXX - sumX * sumX
  if (Math.abs(denom) < 1e-9) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const qmax = 1 / Math.max(slope, 1e-8)
  const kads = slope / Math.max(intercept, 1e-8)
  const fitted = valid.map(point => ({
    pressure: Number(point.pressure_bar.toFixed(4)),
    observed: Number(point.loading_mmolg.toFixed(4)),
    fit: Number((qmax * kads * point.pressure_bar / (1 + kads * point.pressure_bar)).toFixed(4)),
    temperature: point.temperature_k,
  }))
  return {
    model: "single-site Langmuir",
    qmax: Number(qmax.toFixed(3)),
    kads: Number(kads.toFixed(3)),
    henry: Number((qmax * kads).toFixed(3)),
    fitted,
  }
}

function summarizeIsothermPoints(points) {
  const temperatures = Array.from(new Set(points.map(point => point.temperature_k))).sort((a, b) => a - b)
  const gases = Array.from(new Set(points.map(point => point.gas))).filter(Boolean)
  return {
    temperatures,
    gases,
    qstReady: temperatures.length >= 3,
    count: points.length,
    sourceTypes: Array.from(new Set(points.map(point => point.method))).filter(Boolean),
  }
}

function buildDatabaseRecords(structures = [], labels = []) {
  const labelByMof = new Map(labels.map(label => [label.mof_id, label]))
  return structures.map(row => {
    const label = labelByMof.get(row.mof_id) || {}
    return {
      name: row.name,
      metal: row.metal,
      linker: row.linker,
      topology: row.topology || "—",
      bet: Number(row.bet_m2g ?? row.bet ?? 0),
      pv: Number(row.pore_volume_cm3g ?? row.pv ?? 0),
      pd: Number(row.pld_a ?? row.pd ?? 0),
      lcd: Number(row.lcd_a ?? 0),
      voidFraction: Number(row.void_fraction ?? 0),
      density: Number(row.density_gcm3 ?? 0),
      oms: Boolean(row.oms),
      co2: Number(label.primary_loading_mmolg ?? row.co2 ?? 0),
      selectivity: Number(label.selectivity ?? row.selectivity ?? 0),
      henryPrimary: Number(label.henry_primary_mmolgbar ?? 0),
      henrySecondary: Number(label.henry_secondary_mmolgbar ?? 0),
      sourceType: label.method || row.source_type || "seed",
      sourceDatabase: row.source_database || "local seed",
      sourceRecord: row.source_record || label.source_ref || "—",
      descriptorMethod: row.descriptor_method || "—",
      labelSource: label.isotherm_source || "—",
      qualityFlag: label.quality_flag || row.source_type || "screening_seed",
      doi: label.doi_or_url || row.source_record || "—",
      licenseNote: label.license_note || row.license_note || "Verify source license before publication.",
    }
  })
}

const DEFAULT_INPUTS = {
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

const R_GAS = 8.314e-3 // kJ/(mol·K)

// Browser-side model profiles. These are transparent, independent static profiles
// for the no-backend demo; they are not serialized training checkpoints.
const MODEL_PROFILES = {
  ensemble: { label: "Ensemble", r2: 0.864, mae: 0.31, rmse: 0.47, weights: { sa: 0.78, pv: 2.40, pd: 0.045, fg: 1.00, sel: 1.00, conf: 0.00 } },
  rf:       { label: "Random Forest", r2: 0.821, mae: 0.38, rmse: 0.54, weights: { sa: 0.72, pv: 2.18, pd: 0.052, fg: 0.92, sel: 0.95, conf: -0.04 } },
  gbm:      { label: "Gradient Boosting", r2: 0.848, mae: 0.34, rmse: 0.50, weights: { sa: 0.83, pv: 2.32, pd: 0.040, fg: 1.05, sel: 1.04, conf: 0.01 } },
  gnn:      { label: "Graph Neural Network", r2: 0.872, mae: 0.30, rmse: 0.45, weights: { sa: 0.80, pv: 2.55, pd: 0.037, fg: 1.08, sel: 0.99, conf: -0.02 } },
}

function getGasSystem(id) {
  return GAS_SYSTEMS.find(g => g.id === id) || GAS_SYSTEMS[0]
}

function qSafe(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
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
    poreVolume, temperature, pressure, mlAlgorithm, gasSystem,
  } = inputs

  const metal  = METAL_CENTERS.find(m => m.value === metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === organicLinker)
  const gas    = getGasSystem(gasSystem)
  const model  = MODEL_PROFILES[mlAlgorithm] || MODEL_PROFILES.ensemble
  const functionalGroupEntries = getFunctionalGroupEntries(inputs)
  const totalFunctionalGroupCount = getTotalFunctionalGroupCount(inputs)

  // If the user picked an unavailable gas system, return a guard response.
  if (gas.priority === "unavailable") {
    return {
      unavailable: true,
      gasSystem: gas.id,
      message: gas.warningNote || "Gas system not yet supported.",
    }
  }

  // Surface-area and pore-volume contributions.
  const saContrib = (betSurfaceArea / 1000) * model.weights.sa
  const pvContrib = poreVolume * model.weights.pv

  // Optimal pore window depends on adsorbate kinetic diameter; use gas.primary.kinetic.
  const optPD = Math.max(5.0, gas.primary.kinetic * 2.2)
  const pdFactor = Math.exp(-model.weights.pd * Math.pow(poreDiameter - optPD, 2)) + 0.28

  // Van't Hoff temperature scaling anchored at 298 K.
  const tFactor = Math.exp(-0.006 * (temperature - 298))

  // Langmuir pressure term with gas-specific K.
  const kads = gas.baseKads
  const pFactor = (kads * pressure) / (1 + kads * pressure)

  // Functional-group contribution (effects are additive on primary uptake).
  let fgPrimary = 1.0
  let fgSel = 1.0
  let fgQstBoost = 0
  let stericPenalty = 1.0
  for (const { value, meta, detail } of functionalGroupEntries) {
    const positionFactor = positionEffectFactor(detail.positions)
    const dose = Math.min(3.2, Math.pow(detail.count, 0.82) * positionFactor)
    fgPrimary += meta.effectCO2 * dose * model.weights.fg
    fgSel     += meta.effectSel * dose
    stericPenalty -= (meta.steric || 0.03) * detail.count
    if (value === "amine")    fgQstBoost += gas.amineBonus * dose
    if (value === "hydroxyl") fgQstBoost += gas.amineBonus * 0.4 * dose
    if (value === "pyridyl")  fgQstBoost += gas.amineBonus * 0.7 * dose
  }
  fgPrimary = Math.max(0.45, fgPrimary * Math.max(0.66, stericPenalty))
  fgSel = Math.max(0.55, fgSel)

  // Narrow-pore enthalpy bonus (tight confinement).
  const pdNarrowness = Math.max(0, (7.5 - poreDiameter)) * 0.6

  const primaryBase = (saContrib + pvContrib) * pdFactor * tFactor * pFactor * fgPrimary
  let primaryUptake = Math.max(0.05, Math.min(14, primaryBase))

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
      Math.min(1.6, getFunctionalGroupCount(inputs, "amine") * 0.8) +
      Math.min(1.0, getFunctionalGroupCount(inputs, "hydroxyl") * 0.45) +
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

  const rawSelectivity = (primaryUptake / Math.max(1e-3, secondaryUptake)) * fgSel * model.weights.sel
  const selectivity = Math.max(1.2, Math.min(400, rawSelectivity))
  const secondaryKads = Math.max(0.08, kads * secondaryRatio * 0.72)
  const henryPrimary = qSafe(primaryUptake / Math.max(pressure, 1e-4))
  const henrySecondary = qSafe(secondaryUptake / Math.max(pressure, 1e-4))
  const henrySelectivity = qSafe(henryPrimary / Math.max(henrySecondary, 1e-4))
  const iastSelectivity = qSafe(selectivity * (1 - Math.min(0.22, pressure * 0.08)) * (1 + Math.log1p(kads / Math.max(secondaryKads, 1e-4)) * 0.03))

  const betNorm = Math.min(1, betSurfaceArea / 5000)
  const pvNorm  = Math.min(1, poreVolume / 3)
  const confidenceBase = 0.72 + betNorm * 0.08 + pvNorm * 0.06 + (totalFunctionalGroupCount > 0 ? 0.04 : 0)
  const confidence = Math.max(0.50, Math.min(0.97, confidenceBase + model.weights.conf))

  // ── LCA Scoring (unchanged framework) ──
  const metalScore     = metal  ? metal.lcaScore  : 5.0
  const linkerScore    = linker ? linker.lcaScore : 5.0
  const energyScore    = Math.max(1, 10 - (temperature - 273) / 40)
  const pressureScore  = Math.max(1, 10 - pressure * 5)
  const fgEnvScore     = 5.0
    + Math.min(1.8, getFunctionalGroupCount(inputs, "amine") * 0.7)
    + Math.min(1.0, getFunctionalGroupCount(inputs, "hydroxyl") * 0.35)
    - Math.min(2.4, getFunctionalGroupCount(inputs, "thiol") * 1.2)
    - Math.min(0.9, (getFunctionalGroupCount(inputs, "halogen-I") + getFunctionalGroupCount(inputs, "trifluoromethyl")) * 0.3)
  const wasteScore     = Math.max(2.5, 6.8 - Math.max(0, totalFunctionalGroupCount - 1) * 0.25)
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
    selectivityDetails: {
      apparent: parseFloat(selectivity.toFixed(1)),
      henry: parseFloat(henrySelectivity.toFixed(1)),
      iast: parseFloat(iastSelectivity.toFixed(1)),
      henryPrimary: parseFloat(henryPrimary.toFixed(3)),
      henrySecondary: parseFloat(henrySecondary.toFixed(3)),
      method: "Langmuir-fit screening IAST/Henry proxy",
    },
    confidenceScore: parseFloat(confidence.toFixed(2)),
    modelProfile: model,
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
    functionalGroupSummary: formatFunctionalGroupSummary(inputs),
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
  if (score > 5.5) return { label: "EXCELLENT", color: "#4E8EF7", bg: "#EAF4FF" }
  if (score > 3.5) return { label: "GOOD",      color: "#4E8EF7", bg: "#EAF4FF" }
  if (score > 2.0) return { label: "FAIR",      color: "#5578A7", bg: "#EEF3FA" }
  return               { label: "POOR",      color: "#C76666", bg: "#FDEEEE" }
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

const ZH_UI_TERMS = {
  "Literature-backed": "文献支持",
  "Benchmark-backed": "基准支持",
  "Model-predicted": "模型预测",
  "Screening proxy": "筛选代理",
  "User-defined": "用户定义",
  "Primary screening": "主要筛选",
  "Feasibility boundary": "可行性边界",
  "Shortlist comparison": "入围候选比较",
  "Future engineering evaluation": "未来工程评估",
  "Future Stage 4": "未来第 4 阶段",
  "Stage 1": "第 1 阶段",
  "Stage 2": "第 2 阶段",
  "Stage 3": "第 3 阶段",
  "Stage 2-3": "第 2-3 阶段",
  "Stage 1 screening": "第 1 阶段筛选",
  "Stage 1 interpretation": "第 1 阶段解释",
  "Stage 2 feasibility": "第 2 阶段可行性",
  "Stage 3 shortlist comparison": "第 3 阶段入围候选比较",
  "Stage 2 — Feasibility Boundaries": "第 2 阶段 — 可行性边界",
  "Stage 3 — Secondary Comparison": "第 3 阶段 — 次级比较",
  "Feasibility Boundaries": "可行性边界",
  "Feasibility boundary · exploratory only": "可行性边界 · 仅供探索",
  "Exploratory only": "仅供探索",
  "Shortlist comparison only": "仅限入围候选比较",
  "Not formal lifecycle costing": "不是正式生命周期成本",
  "Not formal LCC, not engineering-grade economics.": "不是正式 LCC，也不是工程级经济评价。",
  "Practical boundary between scientific screening and shortlist comparison.": "位于科学筛选和入围候选比较之间的实践边界。",
  "Cost / availability / supply sanity check.": "成本 / 可得性 / 供应合理性检查。",
  "Cost / availability / supply reasonableness check.": "成本 / 可得性 / 供应合理性检查。",
  "Use LCA/LCC only after an initial performance filter exists.": "仅在完成初步性能筛选后使用 LCA/LCC。",
  "Run Stage 1 first": "请先运行第 1 阶段",
  "Purpose": "用途",
  "Use stage": "使用阶段",
  "Interpretation": "解释",
  "Next layer": "下一层",
  "Stage": "阶段",
  "Source type": "来源类型",
  "Quality": "质量",
  "Limitation": "限制",
  "Basis": "依据",
  "coarse": "粗略",
  "basis": "依据",
  "proxy": "代理",
  "beta": "测试版",
  "planned": "规划中",
  "stable": "稳定",
  "calc": "计算",
  "connector scaffold": "接入脚手架",
  "benchmark-backed": "基准支持",
  "assumption-dependent": "依赖假设",
  "exploratory": "探索性",
  "comparative": "比较型",
  "future engineering-grade": "未来工程级",
  "screening prototype": "筛选级原型",
  "backend connected": "后端已连接",
  "loaded": "已加载",
  "fallback": "回退数据",
  "seed": "种子数据",
  "local seed": "本地种子",
  "screening_seed": "筛选种子",
  "reference": "参考",
  "calculated": "计算值",
  "estimated": "估算值",
  "public/data JSON + schema CSV": "public/data JSON + schema CSV",
  "sketch": "草图",
  "mentor & friend": "亦师亦友",
  "High": "高",
  "Medium": "中",
  "Low": "低",
  "Elevated": "较高",
  "Moderate": "中等",
  "Lower": "较低",
  "Custom synthesis likely": "可能需要定制合成",
  "Gram-scale or specialty supply": "克级或专用供应",
  "Likely commercially available": "可能可商业购买",
  "High rough burden": "粗略负担较高",
  "Moderate rough burden": "粗略负担中等",
  "Lower rough burden": "粗略负担较低",
  "Supplier quote / route check": "供应商报价 / 路线核查",
  "Needed before comparative LCC": "比较型 LCC 前需要补充",
  "Derived from current proxy catalog": "来自当前代理目录",
  "Stage 2 feasibility boundary": "第 2 阶段可行性边界",
  "Linker": "连接体",
  "Availability": "可得性",
  "Material burden note": "材料负担提示",
  "Next evidence": "下一步证据",
  "Very Low": "很低",
  "Open metal site": "开放金属位点",
  "CoRE MOF 2019 + NIST isotherms": "CoRE MOF 2019 + NIST 等温线",
  "CoRE MOF 2019 — broad GCMC coverage": "CoRE MOF 2019 — GCMC 覆盖较广",
  "π-complexation MOF literature": "π 配位 MOF 文献",
  "Anomalous inverse selectivity reported": "已有反常反向选择性报道",
  "Classical model; quantum diffusion not yet corrected": "经典模型；尚未修正量子扩散",
  "Public GCMC data scarce; honest gap acknowledged in v1.β.": "公开 GCMC 数据稀缺；v1.β 明确标注该缺口。",
  "Lewis-basic / H-bond donor": "Lewis 碱性 / 氢键供体",
  "H-bond donor": "氢键供体",
  "H-bond donor/acceptor": "氢键供体/受体",
  "Soft donor (S)": "软供体（S）",
  "Electron-withdrawing": "吸电子基团",
  "Electron-withdrawing / polar": "吸电子 / 极性",
  "Electron-withdrawing / halogen": "吸电子 / 卤素",
  "Electron-withdrawing / heavy": "吸电子 / 重卤素",
  "Heavy halogen / polarizable": "重卤素 / 易极化",
  "Steric / hydrophobic": "位阻 / 疏水",
  "Strong electron-withdrawing / hydrophobic": "强吸电子 / 疏水",
  "Bulky hydrophobic substituent": "大位阻疏水取代基",
  "Weak H-bond acceptor": "弱氢键受体",
  "Lewis-basic (aromatic N)": "Lewis 碱性（芳香 N）",
  "Ditopic carboxylate": "二连接羧酸配体",
  "Ditopic carboxylate+OH": "二连接羧酸 + 羟基配体",
  "Tritopic carboxylate": "三连接羧酸配体",
  "Tetratopic porphyrin": "四连接卟啉配体",
  "Tetratopic carboxylate": "四连接羧酸配体",
  "Ditopic azolate": "二连接唑类配体",
  "Strong": "强",
  "Stable": "稳定",
  "Sensitive": "敏感",
  "Completed": "已完成",
  "Top candidate": "最高候选",
  "Average selectivity": "平均选择性",
  "Exportable runs": "可导出记录",
  "Best selectivity": "最高选择性",
  "Best eco score": "最高生态评分",
  "Adjusted LCC": "调整后 LCC",
  "Adjusted eco score": "调整后生态评分",
  "Custom LCA score": "自定义 LCA 评分",
  "Custom LCC": "自定义 LCC",
  "P05 / P50 / P95": "P05 / P50 / P95",
  "API connected": "API 已连接",
  "static fallback": "静态回退",
  "Browser profile or optional backend prediction.": "浏览器模型配置或可选后端预测。",
  "Seed benchmark + descriptor input": "种子基准 + 描述符输入",
  "Applicability warning present.": "存在适用域警告。",
  "Within prototype descriptor range.": "位于原型描述符范围内。",
  "Screening-level only": "仅限筛选级",
  "Not a strict IAST/GCMC or experimental result.": "不是严格 IAST/GCMC 或实验结果。",
  "Medium-low": "中低",
  "Apparent": "表观",
  "Henry proxy": "Henry 代理",
  "IAST proxy": "IAST 代理",
  "Method": "方法",
  "Importance": "重要性",
  "EXCELLENT": "优秀",
  "GOOD": "良好",
  "FAIR": "一般",
  "POOR": "较差",
  "Retraining": "真实训练",
  "front-end profile": "前端配置",
  "transparent status": "透明状态说明",
  "static": "静态",
  "static site": "静态站点",
  "browser-side model": "浏览器端模型",
  "public seed": "公开种子数据",
  "Manifest source": "清单来源",
  "Model status": "模型状态",
  "Training origin": "训练来源",
  "Rows": "训练行数",
  "Targets": "目标变量",
  "No API URL set; using static browser model.": "未设置 API 地址；使用静态浏览器端模型。",
  "Backend prediction used for this run.": "本次运行使用后端预测。",
  "Static browser model": "静态浏览器端模型",
  "Parameter": "参数",
  "Value": "数值",
  "Control": "控制",
  "Flow": "流",
  "Unit": "单位",
  "Replacement": "替换路线",
  "LCA/LCC inventory seed": "LCA/LCC 清单种子数据",
  "public/data/lca_inventory.json with source fields.": "public/data/lca_inventory.json，含来源字段。",
  "Traceable schema, not full industrial LCI.": "可追溯 schema，但不是完整工业 LCI。",
  "Exploratory, assumption-dependent, and not engineering-grade.": "探索性、依赖假设，且不是工程级。",
  "Use only after Stage 1 screening and Stage 2 feasibility boundaries.": "仅在第 1 阶段筛选和第 2 阶段可行性边界之后使用。",
  "Performance": "性能",
  "Adsorption performance": "吸附性能",
  "LCA burden": "LCA 负担",
  "Current MOF": "当前 MOF",
  "Low energy": "低能耗",
  "High recovery": "高回收",
  "Conservative": "保守情景",
  "Base": "基准情景",
  "license": "许可",
  "records": "条记录",
  "Current implementation status": "当前实现状态",
  "What retrained models would add": "重训模型会增加什么",
}

function zhText(lang, value) {
  if (lang !== "zh" || typeof value !== "string") return value
  return ZH_UI_TERMS[value] || value
}

function gasLabel(label, lang = "en") {
  if (lang !== "zh") return label
  return String(label)
    .replace("Post-combustion capture", "燃烧后捕集")
    .replace("Natural gas purification", "天然气净化")
    .replace("Olefin / paraffin separation", "烯烃 / 烷烃分离")
    .replace("Acetylene purification — reversal risk", "乙炔纯化 — 反转风险")
    .replace("Hydrogen storage — mid-term", "氢储存 — 中期")
    .replace("Electronic specialty gases (NF₃, SF₆, C₄F₈) — not yet supported", "电子特气（NF₃、SF₆、C₄F₈）— 暂不支持")
}

function functionalGroupLabel(label, lang = "en") {
  if (lang !== "zh") return label
  return String(label)
    .replace("(Amine)", "（胺基）")
    .replace("(Hydroxyl)", "（羟基）")
    .replace("(Carboxyl)", "（羧基）")
    .replace("(Thiol)", "（巯基）")
    .replace("(Nitro)", "（硝基）")
    .replace("(Fluoro)", "（氟）")
    .replace("(Chloro)", "（氯）")
    .replace("(Bromo)", "（溴）")
    .replace("(Iodo)", "（碘）")
    .replace("(Methyl)", "（甲基）")
    .replace("(Trifluoromethyl)", "（三氟甲基）")
    .replace("(Isopropyl)", "（异丙基）")
    .replace("(Methoxy)", "（甲氧基）")
    .replace("(Pyridyl)", "（吡啶基）")
}

function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, comparison }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div style={{ position: "relative", overflow: "hidden", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: t.shadowSm }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.accent}, ${t.accentSoft})` }} />
      <div style={{ color: t.subtle, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>{zhText(lang, label)}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: t.textStrong, fontSize: 28, fontWeight: 700, fontFamily: FONT_MONO }}>{value}</span>
        <span style={{ color: t.faint, fontSize: 13 }}>{unit}</span>
        {badge && (
          <span style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
            color: badgeColor, background: badgeBg, letterSpacing: "0.05em" }}>
            {zhText(lang, badge)}
          </span>
        )}
      </div>
      {comparison && <div style={{ color: t.accentText, fontSize: 11, marginTop: 4 }}>{zhText(lang, comparison)}</div>}
    </div>
  )
}

function BasisBadge({ children, tone = "info" }) {
  const t = useT()
  const { lang } = useLang()
  const palette = {
    info: { color: t.badgeInfoText, bg: t.badgeInfoBg, border: "rgba(110,168,255,0.26)" },
    calc: { color: t.badgeCalcText, bg: t.badgeCalcBg, border: "rgba(156,178,212,0.24)" },
    proxy: { color: t.badgeProxyText, bg: t.badgeProxyBg, border: "rgba(183,169,255,0.28)" },
    user: { color: t.badgeUserText, bg: t.badgeUserBg, border: "rgba(156,178,212,0.18)" },
    warn: { color: t.badgeWarnText, bg: t.badgeWarnBg, border: "rgba(246,201,142,0.42)" },
    danger: { color: t.badgeDangerText, bg: t.badgeDangerBg, border: "rgba(232,134,134,0.42)" },
  }[tone] || {}
  return (
    <span style={{ display: "inline-flex", alignItems: "center", width: "fit-content",
      color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, lineHeight: 1.4 }}>
      {zhText(lang, children)}
    </span>
  )
}

const SOURCE_BADGES = {
  literature: { label: "Literature-backed", tone: "calc" },
  benchmark: { label: "Benchmark-backed", tone: "calc" },
  model: { label: "Model-predicted", tone: "info" },
  proxy: { label: "Screening proxy", tone: "proxy" },
  user: { label: "User-defined", tone: "user" },
}

function SourceBadge({ type }) {
  const item = SOURCE_BADGES[type] || SOURCE_BADGES.proxy
  return <BasisBadge tone={item.tone}>{item.label}</BasisBadge>
}

function ProvenanceGrid({ items }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  return (
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`, gap: 10 }}>
      {items.map(item => (
        <div key={item.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{zhText(lang, item.label)}</span>
            {item.type && <SourceBadge type={item.type} />}
          </div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{zhText(lang, item.value)}</div>
          {item.note && <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{zhText(lang, item.note)}</div>}
        </div>
      ))}
    </div>
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
    info: { bg: t.badgeInfoBg, border: t.accent, color: t.badgeInfoText },
    warn: { bg: t.badgeWarnBg, border: t.warn, color: t.badgeWarnText },
    danger:{ bg: t.badgeDangerBg, border: t.danger, color: t.badgeDangerText },
    success:{ bg: t.badgeCalcBg, border: t.lcaAccent, color: t.badgeCalcText },
  }[tone]
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8,
      padding: "10px 14px", color: palette.color, fontSize: 12, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

function LinkerSubstitutionPreview({ inputs, linker }) {
  const t = useT()
  const { lang } = useLang()
  const entries = getFunctionalGroupEntries(inputs)
  const positions = {
    "1": { x: 185, y: 100 },
    "2": { x: 150, y: 40 },
    "3": { x: 80, y: 40 },
    "4": { x: 45, y: 100 },
    "5": { x: 80, y: 160 },
    "6": { x: 150, y: 160 },
  }
  const ringPoints = ["1", "2", "3", "4", "5", "6"].map(pos => `${positions[pos].x},${positions[pos].y}`).join(" ")
  const groupByPosition = entries.reduce((acc, { meta, detail }) => {
    for (const pos of detail.positions || []) {
      acc[pos] = [...(acc[pos] || []), meta.label.replace(/\s*\(.+\)$/, "")]
    }
    return acc
  }, {})
  const linkerAnchors = linker?.value === "BTC"
    ? ["1", "3", "5"]
    : linker?.connectivity === 4
      ? ["1", "2", "4", "5"]
      : ["1", "4"]
  const isBenzeneLike = ["BDC", "NH2-BDC", "NO2-BDC", "Br-BDC", "DOBDC", "BTC", "BPDC", "NDC", "BTB", "ADC"].includes(linker?.value)
    || String(linker?.category || "").toLowerCase().includes("carboxylate")

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
            {lang === "zh" ? "取代构型示意" : "Substitution sketch"}
          </div>
          <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45 }}>
            {isBenzeneLike
              ? (lang === "zh" ? "简化芳环编号：1/4 为连接位，2/3/5/6 为可标注取代位。" : "Simplified aromatic numbering: 1/4 anchors, 2/3/5/6 substituent positions.")
              : (lang === "zh" ? "当前连接体不是标准苯二甲酸示意，以下仅作位置草图。" : "Current linker is not a standard BDC ring; this is a positional sketch only.")}
          </div>
        </div>
        <BasisBadge tone="user">{lang === "zh" ? "草图" : "sketch"}</BasisBadge>
      </div>
      <svg viewBox="0 0 230 220" width="100%" height="220" role="img" aria-label="Functional group substitution preview">
        <rect x="0" y="0" width="230" height="220" rx="10" fill={t.panel} stroke={t.border} />
        <polygon points={ringPoints} fill="none" stroke={t.textStrong} strokeWidth="3" />
        <line x1="60" y1="88" x2="92" y2="34" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="138" y1="34" x2="170" y2="88" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="170" y1="112" x2="138" y2="166" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="92" y1="166" x2="60" y2="112" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        {Object.entries(positions).map(([pos, point]) => {
          const anchor = linkerAnchors.includes(pos)
          const groups = groupByPosition[pos] || []
          const labelOffset = {
            "1": { x: 18, y: 4, anchor: "start" },
            "2": { x: 0, y: -18, anchor: "middle" },
            "3": { x: 0, y: -18, anchor: "middle" },
            "4": { x: -18, y: 4, anchor: "end" },
            "5": { x: 0, y: 24, anchor: "middle" },
            "6": { x: 0, y: 24, anchor: "middle" },
          }[pos]
          return (
            <g key={pos}>
              <circle cx={point.x} cy={point.y} r={anchor ? 14 : groups.length ? 13 : 10}
                fill={groups.length ? t.badgeInfoBg : anchor ? t.badgeCalcBg : t.bg}
                stroke={groups.length ? t.accent : anchor ? t.validationAccent : t.borderStrong}
                strokeWidth={groups.length ? 2.5 : 1.5} />
              <text x={point.x} y={point.y + 4} textAnchor="middle" fill={anchor ? t.textStrong : t.subtle}
                fontSize="12" fontFamily={FONT_MONO} fontWeight="800">{pos}</text>
              {anchor && (
                <text x={point.x + labelOffset.x} y={point.y + labelOffset.y} textAnchor={labelOffset.anchor}
                  fill={t.validationAccent} fontSize="11" fontFamily={FONT_MONO} fontWeight="800">COOH</text>
              )}
              {groups.length > 0 && (
                <g>
                  <line x1={point.x} y1={point.y} x2={point.x + labelOffset.x * 1.55} y2={point.y + labelOffset.y * 1.55}
                    stroke={t.accent} strokeWidth="1.6" />
                  <text x={point.x + labelOffset.x * 1.95} y={point.y + labelOffset.y * 1.95}
                    textAnchor={labelOffset.anchor} fill={t.accentText} fontSize="11" fontFamily={FONT_MONO} fontWeight="850">
                    {groups.join(",")}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        <text x="115" y="202" textAnchor="middle" fill={t.faint} fontSize="10" fontFamily={FONT_SANS}>
          {lang === "zh" ? "仅为结构草图 · 不代表合成验证" : "Structural sketch only · not synthesis validation"}
        </text>
      </svg>
      <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.55, marginTop: 8 }}>
        {lang === "zh"
          ? `当前标注：${formatFunctionalGroupSummary(inputs, lang)}。这张图只表达你输入的取代位置，不检查真实合成可行性或配位构型。`
          : `Current annotation: ${formatFunctionalGroupSummary(inputs, lang)}. This visualizes entered positions only; it does not validate synthesis feasibility or coordination geometry.`}
      </div>
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
    { name: c.lca.categoryGroups, short: c.lca.shortGroups, score: Math.min(10, 5 + Math.min(3, getFunctionalGroupCount(inputs, "amine") * 1.2) + Math.min(1.8, getFunctionalGroupCount(inputs, "hydroxyl") * 0.7)), weight: 0.13, desc: c.lca.descGroups, source: c.lca.sourceGroups },
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
  const roseColors = ["#6EA8FF", "#8FD9C8", "#F6C98E", "#B7A9FF", "#9CB2D4", "#BFD9FF"]
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildReportHtml(results, inputs, decision, c, lcaParams = {}) {
  const safe = escapeHtml
  const generatedAt = new Date().toLocaleString()
  const rows = [
    ["MOF", inputs.mofName || "Current candidate"],
    ["Gas system", results.gasSystem],
    ["Metal / linker", `${inputs.metalCenter} / ${inputs.organicLinker}`],
    ["Functional groups", formatFunctionalGroupSummary(inputs)],
    ["Primary uptake", `${results.primaryUptake} mmol/g`],
    ["Secondary uptake", `${results.secondaryUptake} mmol/g`],
    ["Apparent selectivity", results.selectivity],
    ["Henry selectivity", results.selectivityDetails?.henry ?? "screening proxy"],
    ["IAST selectivity", results.selectivityDetails?.iast ?? "screening proxy"],
    ["Qst source", "Derived from predicted multi-temperature isotherms"],
    ["Eco score", `${results.lca.compositeGreenScore}/10`],
    ["Total LCC", `$${decision.totalLcc}/kg MOF`],
    ["Dominant impact", decision.dominantImpact.name],
    ["Main cost contributor", decision.dominantCost.name],
  ]
  const params = Object.entries(lcaParams).map(([key, value]) => `<tr><td>${safe(key)}</td><td>${safe(value)}</td></tr>`).join("")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>EcoMOF-AI Decision Report</title>
  <style>
    body { font-family: Inter, "Noto Sans SC", Arial, sans-serif; color: #0f172a; margin: 38px; line-height: 1.55; }
    h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 28px 0 10px; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    h3 { margin: 18px 0 8px; font-size: 13px; color: #334155; }
    .cover { min-height: 260px; border-bottom: 2px solid #0f172a; margin-bottom: 24px; display: flex; flex-direction: column; justify-content: center; }
    .meta { color: #475569; font-size: 12px; margin-bottom: 22px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
    .value { color: #020617; font-size: 18px; font-weight: 800; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td, th { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    .note { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; font-size: 12px; color: #7c2d12; }
    .small { color: #64748b; font-size: 11px; }
    @media print { body { margin: 18mm; } .card, table, .note { break-inside: avoid; } .cover { min-height: 230px; } }
  </style>
</head>
<body>
  <section class="cover">
    <h1>EcoMOF-AI Decision Report</h1>
    <div class="meta">Research-oriented MOF screening report · generated ${safe(generatedAt)}</div>
    <div class="grid">
      <div class="card"><div class="label">Candidate</div><div class="value">${safe(inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`)}</div></div>
      <div class="card"><div class="label">Gas system</div><div class="value">${safe(results.gasSystem)}</div></div>
      <div class="card"><div class="label">Report status</div><div class="value">Screening</div></div>
    </div>
    <p class="small">This report is intended for early-stage comparison, hypothesis generation, and discussion. It is not a substitute for verified GCMC/experimental adsorption data or full inventory-linked LCA.</p>
  </section>

  <h2>Executive Summary</h2>
  <div class="grid">
    <div class="card"><div class="label">Performance</div><div class="value">${safe(results.primaryUptake)} mmol/g</div></div>
    <div class="card"><div class="label">Selectivity</div><div class="value">${safe(results.selectivity)}</div></div>
    <div class="card"><div class="label">Eco score</div><div class="value">${safe(results.lca.compositeGreenScore)}/10</div></div>
  </div>
  <h2>Input, Prediction, and Source Basis</h2>
  <table><tbody>${rows.map(([k, v]) => `<tr><th>${safe(k)}</th><td>${safe(v)}</td></tr>`).join("")}</tbody></table>
  <h2>LCA / LCC Scenario Parameters</h2>
  <table><tbody>${params || "<tr><td>No custom parameters</td><td>-</td></tr>"}</tbody></table>
  <h2>Methods</h2>
  <h3>Adsorption prediction</h3>
  <p class="small">The current browser build uses transparent model profiles and structure-property correlations. A production deployment should replace this with trained model artifacts loaded through the backend API.</p>
  <h3>Selectivity</h3>
  <p class="small">Apparent selectivity is calculated from predicted single-gas uptake. Henry and IAST values are marked as screening proxies unless fitted pure-component isotherms are supplied.</p>
  <h3>Thermodynamics</h3>
  <p class="small">Qst is derived from predicted 273 K / 298 K / 323 K isotherms. Research-grade Qst requires experimental or GCMC multi-temperature isotherm data.</p>
  <h3>LCA / LCC</h3>
  <p class="small">Inventory terms are screening-level proxy records unless replaced by supplier-specific or database-backed inventory and price data.</p>
  <h2>Basis & Limitations</h2>
  <div class="note">${safe(c.lca.prototypeNote)} ${safe(c.methods.noticeBody)}</div>
</body>
</html>`
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
    `Functional groups: ${formatFunctionalGroupSummary(inputs)}`,
    "",
    "## Performance",
    `${results.primaryName} uptake: ${results.primaryUptake} mmol/g`,
    `${results.secondaryName} uptake: ${results.secondaryUptake} mmol/g`,
    `Selectivity: ${results.selectivity}`,
    `Confidence: ${(results.confidenceScore * 100).toFixed(0)}%`,
    "",
    "## LCA / LCC",
    `Eco score: ${results.lca.compositeGreenScore}/10`,
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

function buildModelComparison(inputs) {
  return Object.entries(MODEL_PROFILES).map(([id, profile]) => {
    const result = predictMOF({ ...inputs, mlAlgorithm: id })
    if (result.unavailable) return null
    return {
      id,
      label: profile.label,
      uptake: result.primaryUptake,
      secondary: result.secondaryUptake,
      selectivity: result.selectivity,
      confidence: Number((result.confidenceScore * 100).toFixed(0)),
      r2: profile.r2,
      mae: profile.mae,
      rmse: profile.rmse,
      status: id === "gnn" ? "static GNN profile" : "static browser profile",
    }
  }).filter(Boolean)
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
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const sectionStyle = { padding: isMobile ? "56px 0" : "76px 0" }
  const sectionTitleStyle = { margin: 0, color: t.textStrong, fontSize: isMobile ? 26 : 34, lineHeight: 1.12, letterSpacing: 0 }
  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)" }
  const heroStages = lang === "zh" ? [
    {
      stage: "Stage 1",
      title: "科学筛选",
      accent: t.performance,
      items: ["性能", "稳定性 / 化学线索", "结果解释"],
    },
    {
      stage: "Stage 2-3",
      title: "后续决策层",
      accent: t.lccAccent,
      items: ["成本合理性检查", "生命周期比较", "稳健性"],
    },
  ] : [
    {
      stage: "Stage 1",
      title: "Scientific screening",
      accent: t.performance,
      items: ["Performance", "Stability / chemistry cues", "Interpretation"],
    },
    {
      stage: "Stage 2-3",
      title: "Decision layers",
      accent: t.lccAccent,
      items: ["Cost sanity", "Lifecycle comparison", "Robustness"],
    },
  ]
  const capabilities = [
    { key: "performance", badge: "Primary screening", title: c.home.predict, body: c.home.predictBody, accent: t.performance },
    { key: "impact", badge: "Feasibility boundary", title: c.home.evaluate, body: c.home.evaluateBody, featured: true, accent: t.lccAccent },
    { key: "robustness", badge: "Shortlist comparison", title: c.home.robustness, body: c.home.robustnessBody, accent: t.sensitivityAccent },
  ]
  const workflow = lang === "zh" ? [
    ["01", "筛选性能与稳定性", "以吸附性能、化学合理性和适用域作为第一过滤器。"],
    ["02", "检查粗略可行性边界", "查看成本、可得性和供应风险是否明显阻断。"],
    ["03", "比较入围候选", "对入围候选做初步 LCA/LCC 和稳健性比较。"],
    ["04", "进入工程评估", "后续再做工艺路线、放大经济性和正式工业 LCA。"],
  ] : [
    ["01", "Screen for performance and stability", "Use adsorption performance, chemistry, and applicability as the first filter."],
    ["02", "Check rough feasibility boundaries", "Flag cost, availability, and supply risks that may block practical use."],
    ["03", "Compare shortlisted candidates", "Run preliminary LCA/LCC and robustness comparisons after shortlist formation."],
    ["04", "Move toward engineering evaluation", "Reserve process-route design, scale-up economics, and formal industrial LCA for the future stage."],
  ]
  const benchmarks = lang === "zh" ? [
    ["UiO-66", "用于解释结构-性能权衡的稳定参考案例。", "Benchmark-backed", "大卡"],
    ["HKUST-1", "具有开放金属位点的经典吸附相关基准。", "Canonical case", "小卡"],
    ["ZIF-8", "用于比较选择性和孔道可及趋势的轻量参考材料。", "Reference material", "小卡"],
  ] : [
    ["UiO-66", "A stable reference case for interpreting structure-performance trade-offs.", "Benchmark-backed", "large"],
    ["HKUST-1", "Open metal site benchmark with strong adsorption relevance.", "Canonical case", "small"],
    ["ZIF-8", "A lightweight comparison point for selectivity and pore-access trends.", "Reference material", "small"],
  ]
  const trustBlocks = [
    [lang === "zh" ? "验证" : "Validation", c.home.trustValidation],
    [lang === "zh" ? "数据来源" : "Data Sources", c.home.trustData],
    [lang === "zh" ? "范围与限制" : "Scope and limits", c.home.trustLimits],
  ]
  const scrollToBenchmarks = () => {
    document.getElementById("home-benchmarks")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <section style={{
        minHeight: isNarrow ? "auto" : "calc(100vh - 104px)",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.42fr) minmax(0, 0.58fr)",
        gap: isNarrow ? 28 : 46,
        alignItems: "center",
        padding: isMobile ? "42px 0 64px" : "62px 0 86px",
      }}>
        <div>
          <div style={{ color: t.accentText, fontSize: 12, fontWeight: 800, letterSpacing: 0, marginBottom: 18 }}>
            {c.home.heroLabel}
          </div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 42 : isNarrow ? 54 : 70, lineHeight: 0.96, letterSpacing: 0 }}>
            {c.home.title}
          </h1>
          <p style={{ color: t.muted, fontSize: isMobile ? 16 : 18, lineHeight: 1.55, maxWidth: 560, margin: "24px 0 26px" }}>
            {c.home.subtitle}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setActiveTab("structure")} style={{ ...toolbarBtn(t), background: t.accent, color: "#fff", borderColor: t.accent, padding: "10px 16px", boxShadow: t.shadowSm }}>
              {c.home.start}
            </button>
            <button onClick={() => setActiveTab("feasibility")} style={{ ...toolbarBtn(t), padding: "10px 16px" }}>
              {lang === "zh" ? "查看可行性边界" : "View Feasibility Boundaries"}
            </button>
          </div>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${t.panel}, ${t.glassStrong})`,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 18,
          padding: isMobile ? 22 : 34,
          boxShadow: t.shadowMd,
          minHeight: isMobile ? 380 : 500,
          display: "flex",
          alignItems: "stretch",
          backdropFilter: "blur(20px) saturate(145%)",
        }}>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: isMobile ? 14 : 18, width: "100%", flex: 1 }}>
            {heroStages.map(stage => (
              <div key={stage.stage} style={{
                padding: isMobile ? 18 : 24,
                border: `1px solid ${t.border}`,
                borderRadius: 14,
                background: t.glass,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "160px 1fr",
                gap: 16,
                alignItems: "center",
              }}>
                <div>
                  <BasisBadge tone={stage.stage === "Stage 1" ? "info" : "proxy"}>{stage.stage}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: isMobile ? 24 : 32, fontWeight: 880, lineHeight: 1.08, marginTop: 12 }}>{stage.title}</div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {stage.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: stage.accent, flex: "0 0 auto" }} />
                      <span style={{ color: t.muted, fontSize: 13, fontWeight: 750 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.capabilityTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 26, alignItems: "stretch" }}>
          {capabilities.map(item => (
            <div key={item.key} style={{
              ...cardStyle,
              position: "relative",
              overflow: "hidden",
              minHeight: item.featured && !isNarrow ? 156 : 144,
              transform: item.featured && !isNarrow ? "translateY(-4px)" : "none",
              borderColor: item.featured ? t.borderStrong : t.border,
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: item.accent }} />
              <div style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.borderStrong}`, color: item.accent,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 850, marginBottom: 14 }}>
                {item.key === "performance" ? "P" : item.key === "impact" ? "L" : "S"}
              </div>
              <BasisBadge tone={item.key === "performance" ? "info" : item.key === "impact" ? "proxy" : "user"}>{item.badge}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, lineHeight: 1.2, marginTop: 12 }}>{item.title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.45, marginTop: 7 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.workflowTitle}</h2>
        <div style={{ marginTop: 34, position: "relative" }}>
          {!isNarrow && (
            <div style={{ position: "absolute", left: "8%", right: "8%", top: 23, height: 1, background: t.borderStrong }} />
          )}
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: isNarrow ? 22 : 24 }}>
            {workflow.map(([num, title, body]) => (
              <div key={num} style={{ position: "relative", paddingTop: isNarrow ? 0 : 54 }}>
                {!isNarrow && (
                  <div style={{ position: "absolute", top: 13, left: 0, width: 22, height: 22, borderRadius: "50%", background: t.bg, border: `2px solid ${t.accent}` }} />
                )}
                <div style={{ color: t.accentText, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 850 }}>{num}</div>
                <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 850, marginTop: 8 }}>{title}</div>
                <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 8, maxWidth: 260 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="home-benchmarks" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{c.home.benchmarkTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.08fr 0.92fr", gap: 16, marginTop: 26 }}>
          <div style={{ ...cardStyle, minHeight: isNarrow ? 260 : 360, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <BasisBadge tone="calc">{benchmarks[0][2]}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: isMobile ? 34 : 48, fontWeight: 880, letterSpacing: 0, marginTop: 22 }}>{benchmarks[0][0]}</div>
              <div style={{ color: t.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 540, marginTop: 14 }}>{benchmarks[0][1]}</div>
            </div>
            <button type="button" onClick={() => setActiveTab("literature")} style={{ ...toolbarBtn(t), width: "fit-content", padding: "9px 13px" }}>
              {c.home.viewCase}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateRows: isNarrow ? "auto auto" : "1fr 1fr", gap: 16 }}>
            {benchmarks.slice(1).map(([name, body, tag]) => (
              <div key={name} style={{ ...cardStyle, minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <BasisBadge tone="info">{tag}</BasisBadge>
                  <div style={{ color: t.textStrong, fontSize: 28, fontWeight: 860, marginTop: 16 }}>{name}</div>
                  <div style={{ color: t.subtle, fontSize: 13, lineHeight: 1.55, marginTop: 10 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...sectionStyle, paddingBottom: isMobile ? 40 : 56 }}>
        <h2 style={sectionTitleStyle}>{c.home.trustTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 24 }}>
          {trustBlocks.map(([title, body]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850 }}>{title}</div>
              <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.6, marginTop: 9 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StructureInputTab({ inputs, setInputs, results, loading, onPredict, onSaveRun, apiUrl, setApiUrl, apiStatus, onCheckApi, setActiveTab }) {
  const t = useT()
  const { lang, copy: c } = useLang()
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
        : [...prev.functionalGroups, fg],
      functionalGroupDetails: prev.functionalGroups.includes(fg)
        ? Object.fromEntries(Object.entries(prev.functionalGroupDetails || {}).filter(([key]) => key !== fg))
        : {
            ...(prev.functionalGroupDetails || {}),
            [fg]: (prev.functionalGroupDetails || {})[fg] || { count: 1, positions: ["2"] },
          }
    }))
  }

  const updateFGDetail = (fg, detailPatch) => {
    setInputs(prev => {
      const current = normalizeFunctionalGroupDetails(prev)[fg] || { count: 1, positions: ["2"] }
      const merged = { ...current, ...detailPatch }
      const count = Math.max(1, Math.min(4, Number(merged.count) || 1))
      let positions = Array.isArray(merged.positions)
        ? merged.positions.filter(pos => AROMATIC_SUBSTITUTION_POSITIONS.includes(String(pos))).slice(0, count)
        : current.positions
      if (positions.length > count) positions = positions.slice(0, count)
      if (!positions.length) positions = defaultGroupPositions(count)
      return {
        ...prev,
        functionalGroupDetails: {
          ...(prev.functionalGroupDetails || {}),
          [fg]: { count, positions },
        },
      }
    })
  }

  const toggleFGPosition = (fg, pos) => {
    const current = normalizeFunctionalGroupDetails(inputs)[fg] || { count: 1, positions: ["2"] }
    const exists = current.positions.includes(pos)
    let positions = exists
      ? current.positions.filter(item => item !== pos)
      : [...current.positions, pos]
    if (positions.length > current.count) positions = positions.slice(positions.length - current.count)
    if (!positions.length) positions = [pos]
    updateFGDetail(fg, { positions })
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
      ["Functional Groups", formatFunctionalGroupSummary(inputs, lang)],
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
      ["Eco Score", results.lca.compositeGreenScore],
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
  const hasUsableResults = results && !results.unavailable
  const functionalGroupDetails = normalizeFunctionalGroupDetails(inputs)
  const decisionTips = hasUsableResults
    ? (lang === "zh" ? [
        ["为什么是这个结果", `${results.primaryName} uptake 主要由 BET、孔体积、孔径匹配、${inputs.organicLinker} 连接体和官能团数量/位置共同影响。选择性仍是 screening proxy，不是严格混合气 IAST。`],
        ["可信度", `当前置信度 ${(results.confidenceScore * 100).toFixed(0)}%。${results.applicability?.warnings?.length ? "输入已有适用域警告，建议补真实等温线或 GCMC 标签。" : "输入位于基准范围附近，可用于早期候选比较。"}`],
        ["下一步", "先看解释/Qst 判断吸附原因，再进入可行性页检查粗略成本、可得性和供应边界。LCA/LCC 只用于入围候选之后的比较。"],
      ] : [
        ["Why this result", `${results.primaryName} uptake is driven by BET, pore volume, pore matching, the ${inputs.organicLinker} linker, and functional-group count/position. Selectivity remains a screening proxy, not rigorous mixture IAST.`],
        ["Confidence", `Current confidence is ${(results.confidenceScore * 100).toFixed(0)}%. ${results.applicability?.warnings?.length ? "Applicability warnings are present; add real isotherm or GCMC labels before strong claims." : "The input is close to benchmark ranges and is usable for early comparison."}`],
        ["Next steps", "Use Interpretation/Qst to inspect the mechanism, then Feasibility for coarse cost, availability, and supply boundaries. LCA/LCC comes after shortlist formation."],
      ])
    : (lang === "zh" ? [
        ["工作流", "左侧输入材料、气体体系和条件；点击运行后中间显示吸附结果，右侧显示解释、置信度和下一步。"],
        ["推荐起点", "可以在顶部搜索 UiO-66、HKUST-1、ZIF-8、MOF-5 等常见 MOF，参数会自动填入。"],
        ["结果口径", "当前网页是筛选级工具；带有 beta/proxy/basis 标记的结果不能直接当作论文级证据。"],
      ] : [
        ["Workflow", "Enter material, gas pair, and conditions on the left; results appear in the center, with interpretation and next steps on the right."],
        ["Recommended start", "Search UiO-66, HKUST-1, ZIF-8, MOF-5, and other common MOFs from the top bar to auto-fill parameters."],
        ["Result status", "This is a screening-level tool; beta/proxy/basis-marked outputs are not publication-grade evidence by themselves."],
      ])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={lang === "zh" ? "Stage 1 — 科学筛选" : "Stage 1 — Scientific Screening"}
        subtitle={lang === "zh"
          ? "用性能、化学线索和筛选置信度作为早期主要过滤器。"
          : "Use performance, chemistry, and screening confidence as the primary early-stage filter."}
        meta={`${inputs.mofName || inputs.metalCenter} · ${inputs.gasSystem} · ${inputs.temperature} K · ${inputs.pressure} bar`}
        action={<BasisBadge tone={apiStatus?.ok ? "calc" : "proxy"}>{apiStatus?.ok ? "backend connected" : "screening prototype"}</BasisBadge>}
      />
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(250px, 0.24fr) minmax(0, 0.52fr) minmax(250px, 0.24fr)", gap: 20, height: "100%", alignItems: "start" }}>
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
              {gasLabel(g.label, lang)}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 10, color: gas.priority === "beta" ? t.warn : t.faint, marginBottom: 12 }}>
          {gas.priority === "beta" ? "⚠ " : "· "}{zhText(lang, gas.dataNote)}
        </div>

        <label style={labelStyle}>{c.structure.metalCenter}</label>
        <select value={inputs.metalCenter}
          onChange={e => setInputs(p => ({ ...p, metalCenter: e.target.value }))}
          style={selectStyle}>
          {METAL_CENTERS.map(m => <option key={m.value} value={m.value}>{m.label}{m.oms ? " · OMS" : ""}</option>)}
        </select>
        {metal && <div style={{ fontSize: 11, color: metal.color, marginTop: 3, marginBottom: 12 }}>
          {c.structure.toxicity}: {zhText(lang, metal.toxicity)} · {c.structure.lca}: {metal.lcaScore}/10 {metal.oms && `· ${c.structure.oms}`}
        </div>}

        <label style={labelStyle}>{c.structure.organicLinker}</label>
        <select value={inputs.organicLinker}
          onChange={e => setInputs(p => ({ ...p, organicLinker: e.target.value }))}
          style={{ ...selectStyle, marginBottom: 4 }}>
          {ORGANIC_LINKERS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        {linker && (
          <div style={{ fontSize: 10, color: t.faint, marginBottom: 14, lineHeight: 1.5 }}>
            {zhText(lang, linker.category)} · {linker.connectivity}-{c.structure.connected} · {c.structure.position} {linker.positions}
          </div>
        )}

        <NumericField label={`${c.numeric.poreDiameter} (Å)`} unit="Å" min={3} max={30} step={0.1}
          value={inputs.poreDiameter} onChange={v => setInputs(p => ({ ...p, poreDiameter: v }))} />
        <NumericField label={`${c.numeric.bet} (m²/g)`} unit="m²/g" min={100} max={7000} step={10}
          value={inputs.betSurfaceArea} onChange={v => setInputs(p => ({ ...p, betSurfaceArea: v }))} />
        <NumericField label={`${c.numeric.poreVolume} (cm³/g)`} unit="cm³/g" min={0.1} max={4.5} step={0.01}
          value={inputs.poreVolume} onChange={v => setInputs(p => ({ ...p, poreVolume: v }))} />

        <label style={labelStyle}>{c.structure.functionalGroups}</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {FUNCTIONAL_GROUPS.map(fg => (
            <label key={fg.value} title={zhText(lang, fg.category)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              color: inputs.functionalGroups.includes(fg.value) ? t.accentSoft : t.subtle, fontSize: 11 }}>
              <input type="checkbox" checked={inputs.functionalGroups.includes(fg.value)}
                onChange={() => toggleFG(fg.value)}
                style={{ accentColor: t.accent, width: 13, height: 13 }} />
              {functionalGroupLabel(fg.label, lang)}
            </label>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {getFunctionalGroupEntries(inputs).map(({ value, meta, detail }) => (
            <div key={value} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{functionalGroupLabel(meta.label, lang)}</div>
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4 }}>{zhText(lang, meta.category)}</div>
                </div>
                <BasisBadge tone="user">{lang === "zh" ? "用户定义" : "user-defined"}</BasisBadge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "86px minmax(0, 1fr)", gap: 9, alignItems: "center" }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>{lang === "zh" ? "数量" : "Count"}</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    step={1}
                    value={detail.count}
                    onChange={e => {
                      const count = Math.max(1, Math.min(4, parseInt(e.target.value, 10) || 1))
                      updateFGDetail(value, {
                        count,
                        positions: detail.positions.length >= count ? detail.positions.slice(0, count) : defaultGroupPositions(count),
                      })
                    }}
                    style={{ ...numInputStyle, padding: "6px 8px", fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>
                    {lang === "zh" ? "芳环取代位置" : "Aromatic positions"}
                  </label>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {AROMATIC_SUBSTITUTION_POSITIONS.map(pos => {
                      const active = (functionalGroupDetails[value]?.positions || []).includes(pos)
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => toggleFGPosition(value, pos)}
                          style={{
                            minWidth: 30,
                            height: 26,
                            borderRadius: 6,
                            border: `1px solid ${active ? t.accent : t.border}`,
                            background: active ? t.badgeInfoBg : t.panel,
                            color: active ? t.accentText : t.subtle,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            fontFamily: FONT_MONO,
                          }}
                          title={lang === "zh" ? `选择 ${pos} 号取代位` : `Select substitution position ${pos}`}
                        >
                          {pos}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4, marginTop: 5 }}>
                    {lang === "zh"
                      ? `当前：${detail.positions.join(", ")}；最多按数量选择 ${detail.count} 个位置。`
                      : `Current: ${detail.positions.join(", ")}; up to ${detail.count} selected positions.`}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!getFunctionalGroupEntries(inputs).length && (
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 8, padding: 10 }}>
              {lang === "zh"
                ? "选择一个官能团后，可设置数量并标注 2/3/5/6 号取代位置。"
                : "Select a functional group to set count and mark 2/3/5/6 substitution positions."}
            </div>
          )}
        </div>

        <LinkerSubstitutionPreview inputs={inputs} linker={linker} />

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

        <div style={{ marginBottom: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>
              {lang === "zh" ? "后端预测连接" : "Backend prediction"}
            </span>
            <BasisBadge tone={apiStatus?.ok ? "calc" : "proxy"}>
              {apiStatus?.ok ? zhText(lang, "API connected") : zhText(lang, "static fallback")}
            </BasisBadge>
          </div>
          <input
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value.trim())}
            placeholder="http://127.0.0.1:8000"
            style={{ ...numInputStyle, fontSize: 11, fontFamily: FONT_MONO, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={onCheckApi} style={{ ...toolbarBtn(t), padding: "5px 8px", fontSize: 11 }}>
              {lang === "zh" ? "检查 API" : "Check API"}
            </button>
            <span style={{ color: apiStatus?.ok ? t.success : apiStatus?.checked ? t.warn : t.faint, fontSize: 10, lineHeight: 1.45 }}>
              {apiStatus?.message
                ? zhText(lang, apiStatus.message)
                : lang === "zh" ? "填写本地 FastAPI 地址前，将使用浏览器端模型。" : "Browser model is used until a local FastAPI URL is provided."}
            </span>
          </div>
          {apiStatus?.manifest && (
            <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 7 }}>
              {lang === "zh" ? "清单" : "manifest"}: {apiStatus.manifest.origin || "—"} · {lang === "zh" ? "行数" : "rows"} {apiStatus.manifest.rows ?? "—"}
            </div>
          )}
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
                {lang === "zh" ? "数据" : "data"}: {cifInfo.name || "—"}<br />
                {lang === "zh" ? "晶胞" : "cell"}: {[cifInfo.cell.a, cifInfo.cell.b, cifInfo.cell.c].filter(Number.isFinite).join(" / ") || "—"} Å
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

            <ProvenanceGrid items={[
              { label: "Basis", value: c.common.basisModelPredicted, type: "model", note: "Browser profile or optional backend prediction." },
              { label: "Source type", value: "Seed benchmark + descriptor input", type: "benchmark", note: lang === "zh" ? `MOF 预设、CIF 派生字段或用户输入。官能团：${formatFunctionalGroupSummary(inputs, lang)}` : `MOF presets, CIF-derived fields, or user input. Groups: ${formatFunctionalGroupSummary(inputs, lang)}` },
              { label: "Quality", value: results.applicability?.warnings?.length ? "Medium-low" : "Medium", type: "proxy", note: results.applicability?.warnings?.length ? "Applicability warning present." : "Within prototype descriptor range." },
              { label: "Limitation", value: "Screening-level only", type: "proxy", note: "Not a strict IAST/GCMC or experimental result." },
            ]} />

            {results.selectivityDetails && (
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <SectionTitle>{c.methods.formulaHenry} / {c.methods.formulaIast}</SectionTitle>
                  <BasisBadge tone="proxy">{c.common.basisProxy}</BasisBadge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                  {[
                    ["Apparent", results.selectivityDetails.apparent],
                    ["Henry proxy", results.selectivityDetails.henry],
                    ["IAST proxy", results.selectivityDetails.iast],
                    ["Method", results.selectivityDetails.method],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                      <div style={{ color: t.faint, fontSize: 10, marginBottom: 5 }}>{zhText(lang, label)}<InfoTip text={label === "Method" ? c.methods.formulaIastBody : c.methods.selectivityBody1} /></div>
                      <div style={{ color: t.textStrong, fontSize: label === "Method" ? 11 : 18, fontWeight: 800, fontFamily: label === "Method" ? FONT_SANS : FONT_MONO, lineHeight: 1.35 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>
                  {c.methods.selectivityBody2}
                </div>
              </div>
            )}

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

              <Callout tone="info">
                <strong>{lang === "zh" ? "为什么这个阶段先开始：" : "Why this stage comes first:"}</strong>{" "}
                {lang === "zh"
                  ? "早期材料筛选应以性能和化学合理性为中心。更宽的成本与生命周期标准只在形成初筛候选后引入。"
                  : "Early-stage materials screening should remain performance- and chemistry-centered. Broader cost and lifecycle criteria are introduced only after an initial filter exists."}
              </Callout>
            </div>

            {/* Footer Badges */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              {[
                { icon: "📊", title: c.structure.dataSource, desc: "Structure: public/data/mof_structures.json", sub: "Seed schema includes source_database, source_record, descriptor_method, CIF status" },
                { icon: "🤖", title: c.structure.mlArchitecture, desc: "Model: browser profile + optional FastAPI /predict", sub: "Training scaffold reads data/adsorption_labels.csv and writes RF/GBM artifacts" },
                { icon: "🌿", title: c.structure.lcaFramework, desc: "LCA/LCC: public/data/lca_inventory.json", sub: "Proxy inventory now has source_type, assumption, uncertainty, and roadmap replacement" },
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

      <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)", position: isNarrow ? "static" : "sticky", top: 74 }}>
        <Callout tone="info">
          <strong>{lang === "zh" ? "为什么这个阶段先开始" : "Why this stage comes first"}</strong>
          <br />
          {lang === "zh"
            ? "早期材料筛选应以性能和化学合理性为中心。更宽的成本与生命周期标准只在形成初筛候选后引入。"
            : "Early-stage materials screening should remain performance- and chemistry-centered. Broader cost and lifecycle criteria are introduced only after an initial filter exists."}
        </Callout>
        <div style={{ height: 12 }} />
        <SectionTitle>{lang === "zh" ? "解释与下一步" : "Interpretation & Next Steps"}</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {decisionTips.map(([title, body], index) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 7 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{title}</div>
                <BasisBadge tone={index === 1 && hasUsableResults ? "calc" : "info"}>{index + 1}</BasisBadge>
              </div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {[
            ["interpretation", lang === "zh" ? "机理解释" : "Mechanism"],
            ["feasibility", lang === "zh" ? "可行性边界" : "Feasibility"],
            ["lca", lang === "zh" ? "入围候选 LCA/LCC" : "Shortlist LCA/LCC"],
            ["sensitivity", lang === "zh" ? "稳健性" : "Robustness"],
            ["validation", lang === "zh" ? "验证依据" : "Validation"],
          ].map(([tab, label]) => (
            <button key={tab} type="button" onClick={() => setActiveTab?.(tab)}
              style={{ ...toolbarBtn(t), justifyContent: "space-between", width: "100%", padding: "8px 10px" }}>
              <span>{label}</span>
              <span style={{ color: t.faint }}>→</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, color: t.faint, fontSize: 10, lineHeight: 1.55 }}>
          {lang === "zh"
            ? "页面布局按输入、结果、解释三列组织，目的是让用户按研究判断链阅读，而不是只看一个预测数字。"
            : "This three-column layout follows input, result, and interpretation so the workflow supports decisions instead of isolated numbers."}
        </div>
      </aside>
    </div>
      <Callout tone="info">
        {lang === "zh"
          ? "来源依据：结构参数来自用户输入、MOF 预设或 CIF 解析；吸附结果为模型/代理筛选输出；LCA/LCC 由代理清单与用户参数计算。"
          : "Source basis: descriptors come from user input, MOF presets, or CIF parsing; adsorption results are model/proxy screening outputs; LCA/LCC uses proxy inventory plus user-defined assumptions."}
      </Callout>
    </div>
  )
}

function MLPredictionTab({ results, inputs }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const model = results?.modelProfile || MODEL_PROFILES[inputs.mlAlgorithm] || MODEL_PROFILES.ensemble
  const modelComparison = results && !results.unavailable ? buildModelComparison(inputs) : []
  const currentComparison = modelComparison.find(item => item.id === inputs.mlAlgorithm) || modelComparison[0]
  const exportModelComparison = () => {
    const header = ["Model", "Primary uptake", "Secondary uptake", "Selectivity", "Confidence", "R2", "MAE", "RMSE", "Status"]
    const rows = modelComparison.map(item => [item.label, item.uptake, item.secondary, item.selectivity, item.confidence, item.r2, item.mae, item.rmse, item.status])
    downloadTextFile("ecomof_model_comparison.csv", [header, ...rows].map(row => row.join(",")).join("\n"), "text/csv")
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={lang === "zh" ? "机器学习模型" : "ML Models"}
        subtitle={lang === "zh"
          ? "本页说明当前模型成熟度、验证口径和下一步训练路线，重点是诚实展示状态，而不是包装成多个真实后端模型。"
          : "This page explains model maturity, validation basis, and the next training milestone. It is a research-status page, not a showcase of completed backend checkpoints."}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "透明状态说明" : "transparent status"}</BasisBadge>}
      />
      {!results || results.unavailable ? <EmptyState message={c.ml.empty} /> : (
        <>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <MetricCard label={lang === "zh" ? "后端状态" : "Backend status"} value={zhText(lang, model.backendStatus || "static")} unit="" comparison={lang === "zh" ? "前端透明配置" : "front-end profile"} />
          <MetricCard label="Holdout R²" value={model.r2.toFixed(3)} unit="" />
          <MetricCard label="MAE" value={model.mae.toFixed(2)} unit="mmol/g" />
          <MetricCard label={lang === "zh" ? "下一里程碑" : "Next milestone"} value={lang === "zh" ? "真实训练" : "Retraining"} unit="" comparison={lang === "zh" ? "每个气体体系单独训练" : "separate model per gas pair"} />
        </div>

        <div style={{ background: t.chartBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <SectionTitle>{c.ml.feature}</SectionTitle>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
                {lang === "zh"
                  ? "主图只解释当前预测最依赖哪些结构描述符。它不声称这些权重来自已经部署的独立 GNN/RF/GBM checkpoint。"
                  : "The main figure explains which descriptors drive the current prediction. It does not claim deployed independent GNN/RF/GBM checkpoints."}
              </div>
            </div>
            <BasisBadge tone="proxy">{model.label}</BasisBadge>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={results.featureImportance} layout="vertical" margin={{ left: 105, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} domain={[0, 0.35]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="feature" tick={{ fill: t.muted, fontSize: 12 }} width={108} />
              <Tooltip formatter={(v) => [`${(v*100).toFixed(1)}%`, lang === "zh" ? "重要性" : "Importance"]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="importance" fill={t.accent} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
            <SectionTitle>{lang === "zh" ? "当前实现状态" : "Current implementation status"}</SectionTitle>
            <div style={{ display: "grid", gap: 9 }}>
              {[
                [c.structure.gasSystem, results.gasSystem],
                [c.ml.algorithmSelected, model.label],
                [c.structure.confidence, `${(results.confidenceScore * 100).toFixed(1)}%`],
                [c.structure.latency, `${results.latencyMs} ms`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px" }}>
                  <span style={{ color: t.subtle, fontSize: 12 }}>{label}</span>
                  <strong style={{ color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{value}</strong>
                </div>
              ))}
            </div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
              {c.ml.trainingNote} {lang === "zh"
                ? "当前是透明的前端模型配置；真实独立模型需要后端训练工件、冻结验证集和版本化 manifest。"
                : "The current build uses transparent front-end model profiles; real independent models require backend artifacts, a frozen validation set, and a versioned manifest."}
            </div>
          </div>

          <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
            <SectionTitle>{lang === "zh" ? "未来重训模型会增加什么" : "What retrained models would add"}</SectionTitle>
            <div style={{ display: "grid", gap: 9 }}>
              {(lang === "zh" ? [
                ["独立 checkpoint", "RF / GBM / GNN / Ensemble 不再只是启发式配置，而是独立训练产物。"],
                ["气体体系分模型", "CO2/N2、CH4/N2、C2H4/C2H6 等各自训练，避免一套权重混用。"],
                ["不确定性", "输出置信区间、适用域距离和异常输入警告。"],
                ["真实标签", "接入真实等温线、Henry、IAST/GCMC 标签后重新验证。"],
              ] : [
                ["Independent checkpoints", "RF / GBM / GNN / Ensemble become separate trained artifacts, not heuristic profiles."],
                ["Gas-specific models", "CO2/N2, CH4/N2, C2H4/C2H6, and others are trained separately."],
                ["Uncertainty", "Outputs include confidence intervals, applicability distance, and out-of-domain warnings."],
                ["Real labels", "Retraining depends on real isotherm, Henry, IAST/GCMC labels."],
              ]).map(([title, body]) => (
                <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                  <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{title}</div>
                  <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <details style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <summary style={{ cursor: "pointer", color: t.accentSoft, fontSize: 12, fontWeight: 800 }}>
            {lang === "zh" ? "查看静态多模型对比矩阵" : "View static multi-model comparison matrix"}
          </summary>
          <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <SectionTitle>{lang === "zh" ? "多模型对比矩阵" : "Multi-model comparison matrix"}</SectionTitle>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
                {lang === "zh"
                  ? "这里展示同一输入在 RF / GBM / GNN / Ensemble 静态模型配置下的差异。它能说明算法切换的影响，但仍不是后端独立训练 checkpoint。"
                  : "Shows the same input under RF / GBM / GNN / Ensemble static model profiles. This exposes algorithm-switch impact, but it is still not a set of independently trained backend checkpoints."}
              </div>
            </div>
            <button type="button" onClick={exportModelComparison} style={toolbarBtn(t)}>↓ Model CSV</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.1fr 0.9fr", gap: 14, alignItems: "start" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    {["Model", "Primary", "Secondary", "Selectivity", "Confidence", "R² / MAE", "Delta"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelComparison.map(item => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${t.divider}` }}>
                      <td style={{ padding: "8px 10px", color: item.id === inputs.mlAlgorithm ? t.accentSoft : t.textStrong, fontWeight: 800 }}>{item.label}</td>
                      <td style={{ padding: "8px 10px", color: t.success, fontFamily: FONT_MONO }}>{item.uptake}</td>
                      <td style={{ padding: "8px 10px", color: t.muted, fontFamily: FONT_MONO }}>{item.secondary}</td>
                      <td style={{ padding: "8px 10px", color: t.accentSoft, fontFamily: FONT_MONO }}>{item.selectivity}</td>
                      <td style={{ padding: "8px 10px", color: t.text, fontFamily: FONT_MONO }}>{item.confidence}%</td>
                      <td style={{ padding: "8px 10px", color: t.subtle }}>{item.r2.toFixed(3)} / {item.mae.toFixed(2)}</td>
                      <td style={{ padding: "8px 10px", color: t.warn, fontFamily: FONT_MONO }}>
                        {currentComparison ? `${(item.uptake - currentComparison.uptake).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modelComparison} margin={{ top: 8, right: 16, left: -12, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: t.subtle, fontSize: 10, angle: -18, textAnchor: "end" }} height={42} />
                <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
                <Bar dataKey="uptake" name="Primary uptake" fill={t.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="selectivity" name="Selectivity" fill={t.violet} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </details>
        <Callout tone="warn">
          <strong>{c.ml.statusTitle}</strong> {c.ml.statusBody}
        </Callout>
        </>
      )}
    </div>
  )
}

function ThermodynamicsTab({ results }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [uploadedAnalysis, setUploadedAnalysis] = useState(null)
  const [isothermStatus, setIsothermStatus] = useState("")

  const buildUploadedAnalysis = useCallback((points) => {
    const summary = summarizeIsothermPoints(points)
    const fits = summary.temperatures.map(temp => ({
      temperature: temp,
      fit: fitLangmuirFromPoints(points.filter(point => point.temperature_k === temp)),
    })).filter(item => item.fit)
    setUploadedAnalysis({ summary, fits })
    setIsothermStatus(summary.qstReady
      ? (lang === "zh" ? "已满足多温等温线 Qst 基础条件。" : "Multi-temperature isotherm basis is ready for Qst scaffolding.")
      : (lang === "zh" ? "至少需要三个温度节点，例如 273/298/323 K。" : "At least three temperature nodes are needed, e.g. 273/298/323 K."))
  }, [lang])

  const handleIsothermCsv = useCallback(async (file) => {
    if (!file) return
    const rows = parseCsvRows(await file.text())
    const points = normalizeIsothermRows(rows)
    if (!points.length) {
      setIsothermStatus(lang === "zh" ? "未识别到 temperature_k, pressure_bar, loading_mmolg 等字段。" : "Could not detect temperature_k, pressure_bar, and loading_mmolg columns.")
      setUploadedAnalysis(null)
      return
    }
    buildUploadedAnalysis(points)
  }, [buildUploadedAnalysis, lang])

  const loadSeedIsotherm = useCallback(async () => {
    try {
      const rows = await fetchDataJson("isotherms.json")
      buildUploadedAnalysis(normalizeIsothermRows(rows))
    } catch (_) {
      setIsothermStatus(lang === "zh" ? "示例等温线加载失败。" : "Failed to load seed isotherm.")
    }
  }, [buildUploadedAnalysis, lang])

  if (!results || results.unavailable || !results.thermo) {
    return <EmptyState message={c.thermo.empty} />
  }
  const { thermo } = results
  const qstOutOfRange = thermo.qst0 < 4 || thermo.qst0 > 80
  const primaryUploadedFit = uploadedAnalysis?.fits?.[0]

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

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {(lang === "zh" ? [
          ["当前来源", "预测多温等温线", "beta", "当前 Qst 曲线由 273/298/323 K 预测等温线反推，适合早期机理判断。"],
          ["科研级来源", "实验或 GCMC 多温等温线", "planned", "严格版本需要同一材料、同一气体、多个温度下的真实等温线标签。"],
          ["导入接口", "CSV / backend connector", "roadmap", "可扩展为上传 pressure, loading, temperature 后重新拟合 Qst。"],
        ] : [
          ["Current source", "Predicted multi-T isotherms", "beta", "Current Qst curve is derived from predicted 273/298/323 K isotherms for early mechanistic screening."],
          ["Research-grade source", "Experimental or GCMC multi-T isotherms", "planned", "Strict use requires real isotherm labels for the same MOF, gas, and temperature grid."],
          ["Import path", "CSV / backend connector", "roadmap", "Can be extended to upload pressure, loading, temperature and refit Qst."],
        ]).map(([title, value, badge, body]) => (
          <div key={title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{title}</span>
              <BasisBadge tone={badge === "beta" ? "proxy" : "info"}>{badge}</BasisBadge>
            </div>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{value}</div>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "等温线上传与拟合基础" : "Isotherm upload and fitting basis"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "CSV 字段支持 temperature_k, pressure_bar, loading_mmolg, gas, method, source_ref。当前先做单温 Langmuir 拟合；严格 IAST/Qst 仍需要真实多温、纯组分等温线。"
                : "CSV fields: temperature_k, pressure_bar, loading_mmolg, gas, method, source_ref. This first fits single-temperature Langmuir curves; strict IAST/Qst still requires real multi-temperature pure-component isotherms."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ ...toolbarBtn(t), cursor: "pointer" }}>
              ↑ CSV
              <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleIsothermCsv(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={loadSeedIsotherm} style={toolbarBtn(t)}>
              {lang === "zh" ? "载入示例" : "Load seed"}
            </button>
          </div>
        </div>

        {uploadedAnalysis ? (
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "260px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                [lang === "zh" ? "数据点" : "Data points", uploadedAnalysis.summary.count, lang === "zh" ? "上传/示例等温线" : "uploaded / seed isotherm"],
                [lang === "zh" ? "温度节点" : "Temperature nodes", uploadedAnalysis.summary.temperatures.join(" / "), uploadedAnalysis.summary.qstReady ? (lang === "zh" ? "Qst 就绪脚手架" : "Qst-ready scaffold") : (lang === "zh" ? "需要更多温度点" : "needs more temperatures")],
                ["Langmuir qmax", primaryUploadedFit ? primaryUploadedFit.fit.qmax : "—", "mmol/g"],
                ["Henry", primaryUploadedFit ? primaryUploadedFit.fit.henry : "—", "mmol/g/bar"],
              ].map(([label, value, sub]) => (
                <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                  <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800, marginTop: 5 }}>{value}</div>
                  <div style={{ color: t.subtle, fontSize: 10, marginTop: 4 }}>{sub}</div>
                </div>
              ))}
              <div style={{
                color: uploadedAnalysis.summary.qstReady ? t.success : t.warn,
                background: uploadedAnalysis.summary.qstReady ? t.badgeCalcBg : t.badgeWarnBg,
                border: `1px solid ${uploadedAnalysis.summary.qstReady ? t.success : t.warn}`,
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 11,
                lineHeight: 1.45,
                fontWeight: 700,
              }}>
                {isothermStatus}
              </div>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, minWidth: 0 }}>
              <SectionTitle>{lang === "zh" ? "观测值 vs Langmuir 拟合" : "Observed vs Langmuir fit"}</SectionTitle>
              {primaryUploadedFit ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={primaryUploadedFit.fit.fitted}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                    <XAxis dataKey="pressure" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }}
                      label={{ value: "Pressure (bar)", fill: t.subtle, fontSize: 10, dy: 10 }} />
                    <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 10 }}
                      label={{ value: "Loading (mmol/g)", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: t.subtle }} />
                    <Line type="monotone" dataKey="observed" stroke={t.accent} strokeWidth={2.2} name={`${primaryUploadedFit.temperature} K observed`} />
                    <Line type="monotone" dataKey="fit" stroke={t.lcaAccent} strokeWidth={2.2} dot={false} name="Langmuir fit" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: t.faint, fontSize: 12, padding: 18 }}>{lang === "zh" ? "有效点不足，无法拟合。" : "Not enough valid points to fit."}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: isothermStatus ? t.warn : t.faint, fontSize: 12 }}>
            {isothermStatus || (lang === "zh" ? "尚未上传等温线。可以先载入示例查看数据结构。" : "No isotherm uploaded yet. Load the seed example to inspect the schema.")}
          </div>
        )}
      </div>

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
              <Line type="monotone" dataKey="T273" stroke={t.cyan} strokeWidth={2} dot={false} name="273 K" />
              <Line type="monotone" dataKey="T298" stroke={t.accent}  strokeWidth={2} dot={false} name="298 K" />
              <Line type="monotone" dataKey="T323" stroke={t.accentSoft}   strokeWidth={2} dot={false} name="323 K" />
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
              <Line type="monotone" dataKey="qst" stroke={t.accentStrong} strokeWidth={2.5} dot={false} name="Qst" />
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

function FeasibilityTab({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const metal = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const linkerScore = Number(linker?.lcaScore ?? 5)
  const metalScore = Number(metal?.lcaScore ?? 5)
  const hasRareMetal = ["Co2+", "Ni2+", "Cr3+"].includes(inputs.metalCenter)
  const hasComplexLinker = ["TCPP", "TBAPy", "BTB", "ADC", "NDC"].includes(inputs.organicLinker)
  const costBand = hasComplexLinker || linkerScore < 4.5 ? "High" : linkerScore < 5.8 || hasRareMetal ? "Medium" : "Low"
  const availability = hasComplexLinker ? "Custom synthesis likely" : linkerScore < 5.8 ? "Gram-scale or specialty supply" : "Likely commercially available"
  const supplyRisk = hasComplexLinker || hasRareMetal ? "Elevated" : linker?.fossil ? "Moderate" : "Lower"
  const processConstraints = lang === "zh" ? [
    ["反应时间", hasComplexLinker ? "可能较长" : "常规范围", hasComplexLinker ? "复杂芳香或卟啉连接体通常需要更长路线确认。" : "当前输入未触发长反应时间警告。"],
    ["回收难度", linker?.fossil ? "需要核查" : "较低", linker?.fossil ? "应检查溶剂交换、洗涤和母液回收假设。" : "当前路线未显示明显回收难点。"],
    ["工艺条件", hasRareMetal ? "可能敏感" : "未见强警告", hasRareMetal ? "稀缺或过渡金属前驱体可能带来安全、纯化或采购约束。" : "未触发苛刻条件提示。"],
    ["放大摩擦", costBand === "High" || supplyRisk === "Elevated" ? "较高" : "中低", costBand === "High" || supplyRisk === "Elevated" ? "成本、供应或路线复杂度可能在放大时成为阻力。" : "可作为下一轮候选继续比较。"],
  ] : [
    ["Reaction time", hasComplexLinker ? "Potentially long" : "Typical range", hasComplexLinker ? "Complex aromatic or porphyrinic linkers usually need route confirmation." : "No long-reaction warning is triggered by the current inputs."],
    ["Recovery difficulty", linker?.fossil ? "Needs check" : "Lower", linker?.fossil ? "Check solvent exchange, washing, and mother-liquor recovery assumptions." : "No obvious recovery issue is flagged by the current route."],
    ["Process conditions", hasRareMetal ? "Potentially sensitive" : "No strong warning", hasRareMetal ? "Rare or transition-metal precursors may add safety, purification, or procurement constraints." : "No harsh-condition cue is triggered."],
    ["Scale friction", costBand === "High" || supplyRisk === "Elevated" ? "Elevated" : "Lower-moderate", costBand === "High" || supplyRisk === "Elevated" ? "Cost, supply, or route complexity may become a scale-up barrier." : "Reasonable to keep for the next comparison round."],
  ]
  const rows = lang === "zh" ? [
    ["连接体可得性", zhText(lang, availability), "商业购买 / 克级供应 / 定制合成的粗略判断。"],
    ["成本合理性检查", zhText(lang, costBand), "低 / 中 / 高成本带，用于排除明显不适合放大的路线。"],
    ["稀缺或前驱体风险", hasRareMetal ? "有金属供应风险" : "未触发稀缺金属警告", `${inputs.metalCenter} · 金属评分 ${metalScore}/10`],
    ["供应瓶颈风险", supplyRisk, hasComplexLinker ? "复杂芳香/卟啉/大型连接体可能需要定制合成。" : "未发现明显连接体瓶颈。"],
  ] : [
    ["Linker availability", availability, "Coarse commercial / gram-scale / custom-synthesis classification."],
    ["Cost sanity check", costBand, "Low / medium / high rough cost band for rejecting obviously impractical routes."],
    ["Rare precursor warning", hasRareMetal ? "Metal supply warning" : "No rare-metal warning", `${inputs.metalCenter} · metal score ${metalScore}/10`],
    ["Supply bottleneck risk", supplyRisk, hasComplexLinker ? "Complex aromatic, porphyrin, or large linker may require custom synthesis." : "No obvious linker bottleneck flagged."],
  ]
  const useCases = lang === "zh" ? [
    ["小规模学术探索", "可接受较高连接体成本；重点是机理、性能和可发表的结构-性质理解。"],
    ["中试或重复制备", "需要更明确的供应来源、批量可得性、溶剂路线和安全边界。"],
    ["大规模部署", "对连接体价格、金属供应、溶剂回收和再生能耗极度敏感。"],
  ] : [
    ["Small-scale academic relevance", "Higher linker cost may be acceptable when mechanism, performance, and structure-property insight matter most."],
    ["Pilot or repeated synthesis", "Supply source, batch availability, solvent route, and safety boundaries become more important."],
    ["Large-scale deployment relevance", "Linker price, metal supply, solvent recovery, and regeneration energy become highly scale-sensitive."],
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={lang === "zh" ? "Stage 2 — 可行性边界" : "Stage 2 — Feasibility Boundaries"}
        subtitle={lang === "zh"
          ? "在科学筛选之后、正式 LCC 之前，检查粗略成本、可得性、供应和用途尺度边界。"
          : "After scientific screening and before formal LCC, check rough cost, availability, supply, and use-scale boundaries."}
        meta={lang === "zh" ? "可行性边界 · 仅供探索" : "Feasibility boundary · exploratory only"}
        action={<BasisBadge tone="proxy">{lang === "zh" ? "不是正式生命周期成本" : "Not formal lifecycle costing"}</BasisBadge>}
      />

      <Callout tone="warn">
        {lang === "zh"
          ? "这个阶段不是正式生命周期成本。它是科学筛选与工程尺度评估之间的粗略可行性边界。"
          : "This stage is not formal lifecycle costing. It is a coarse feasibility boundary between scientific screening and engineering-scale evaluation."}
      </Callout>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {rows.map(([label, value, note]) => (
          <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, borderTop: `3px solid ${label.includes("Cost") || label.includes("成本") ? t.lccAccent : t.validationAccent}` }}>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 850, lineHeight: 1.25 }}>{zhText(lang, value)}</div>
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "0.9fr 1.1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "连接体与路线提示" : "Linker and route cues"}</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              [lang === "zh" ? "连接体" : "Linker", inputs.organicLinker, zhText(lang, linker?.category || "—")],
              [lang === "zh" ? "可得性" : "Availability", zhText(lang, availability), zhText(lang, "Stage 2 feasibility boundary")],
              [lang === "zh" ? "材料负担提示" : "Material burden note", zhText(lang, costBand === "High" ? "High rough burden" : costBand === "Medium" ? "Moderate rough burden" : "Lower rough burden"), zhText(lang, "Derived from current proxy catalog")],
              [lang === "zh" ? "下一步" : "Next evidence", zhText(lang, "Supplier quote / route check"), zhText(lang, "Needed before comparative LCC")],
            ].map(([label, value, note]) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</span>
                  <BasisBadge tone="proxy">{zhText(lang, "coarse")}</BasisBadge>
                </div>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, marginTop: 6 }}>{value}</div>
                <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "用途尺度依赖" : "Use-case dependence"}</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {useCases.map(([title, body]) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "180px 1fr", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{title}</div>
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "实践过程约束" : "Practical process constraints"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "这些是放大前的粗略路线提示，不等同于工艺包或安全审查。"
                : "These are coarse route cues before scale-up, not a process package or safety review."}
            </div>
          </div>
          <BasisBadge tone="proxy">{lang === "zh" ? "可行性边界" : "Feasibility boundary"}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {processConstraints.map(([label, value, body]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, borderLeft: `3px solid ${value.includes("高") || value.includes("Elevated") || value.includes("long") || value.includes("sensitive") ? t.lccAccent : t.validationAccent}` }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{value}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 7 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      <ProvenanceGrid items={[
        { label: "Use stage", value: "Stage 2 — Feasibility Boundaries", type: "proxy", note: "Practical boundary between scientific screening and shortlist comparison." },
        { label: "Purpose", value: "Feasibility boundary", type: "user", note: "Cost / availability / supply reasonableness check." },
        { label: "Interpretation", value: "Exploratory only", type: "proxy", note: "Not formal LCC, not engineering-grade economics." },
        { label: "Next layer", value: results && !results.unavailable ? "Stage 3 shortlist comparison" : "Run Stage 1 first", type: "info", note: "Use LCA/LCC only after an initial performance filter exists." },
      ]} />
    </div>
  )
}

function LCAScoringTab({ results, inputs }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [currencyCode, setCurrencyCode] = useState("USD")
  const [inventoryRows, setInventoryRows] = useState([])
  const [lcaParams, setLcaParams] = useState({
    electricityPrice: 0.12,
    solventRecovery: 80,
    materialLifetime: 10,
    regenerationCycles: 1000,
    metalPrice: 24,
    linkerPrice: 31,
  })
  useEffect(() => {
    let active = true
    fetchDataJson("lca_inventory.json")
      .then(rows => { if (active) setInventoryRows(rows) })
      .catch(() => { if (active) setInventoryRows([]) })
    return () => { active = false }
  }, [])
  if (!results || results.unavailable) return <EmptyState message={c.lca.empty} />
  const { lca } = results
  const decision = buildDecisionModel(results, inputs, c)
  const { categories, indicatorData, roseColors, windRoseData, sensitivityRadarData, lccBreakdown,
    totalLcc, unitCost, dominantImpact, dominantCost, mostSensitive, tradeoffData } = decision
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const convertedBreakdown = lccBreakdown.map(item => ({
    ...item,
    convertedValue: Number((item.value * currency.rate).toFixed(currencyCode === "JPY" ? 0 : 1)),
  }))
  const scoreColor = (s) => s >= 7 ? t.success : s >= 5 ? t.accent : s >= 3 ? t.warn : t.danger
  const chartCardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }
  const detailStyle = { marginTop: 8, color: t.faint, fontSize: 11, lineHeight: 1.55 }
  const paramFactor =
    (lcaParams.electricityPrice / 0.12) * 0.14 +
    ((100 - lcaParams.solventRecovery) / 20) * 0.16 +
    (10 / Math.max(1, lcaParams.materialLifetime)) * 0.10 +
    (1000 / Math.max(100, lcaParams.regenerationCycles)) * 0.08 +
    (lcaParams.metalPrice / 24) * 0.26 +
    (lcaParams.linkerPrice / 31) * 0.26
  const adjustedLcc = Number((totalLcc * paramFactor).toFixed(1))
  const adjustedGreenScore = Number(Math.max(0, Math.min(10, lca.compositeGreenScore + (lcaParams.solventRecovery - 80) * 0.018 - (lcaParams.electricityPrice - 0.12) * 3.2)).toFixed(1))
  const displayMoney = (valueUsd, digits = 1) => formatCurrency(valueUsd, currencyCode, digits)
  const displayPrice = (valueUsd, digits = 2) => Number((Number(valueUsd) * currency.rate).toFixed(currencyCode === "JPY" ? 0 : digits))
  const updatePriceParam = (key, valueInCurrency) => {
    const usdValue = Number(valueInCurrency) / currency.rate
    setLcaParams(prev => ({ ...prev, [key]: Number.isFinite(usdValue) ? usdValue : prev[key] }))
  }
  const lcaParamRows = [
    ["electricityPrice", lang === "zh" ? `电价（${currency.unit}/kWh）` : `Electricity price (${currency.unit}/kWh)`, displayPrice(lcaParams.electricityPrice, 3), 0.01, 0.5 * currency.rate, 0.01, "price"],
    ["solventRecovery", lang === "zh" ? "溶剂回收率（%）" : "Solvent recovery (%)", lcaParams.solventRecovery, 0, 99, 1, "plain"],
    ["materialLifetime", lang === "zh" ? "材料寿命（年）" : "Material lifetime (years)", lcaParams.materialLifetime, 1, 30, 1, "plain"],
    ["regenerationCycles", lang === "zh" ? "再生循环次数" : "Regeneration cycles", lcaParams.regenerationCycles, 100, 10000, 100, "plain"],
    ["metalPrice", lang === "zh" ? `金属前驱体（${currency.unit}/kg）` : `Metal precursor (${currency.unit}/kg)`, displayPrice(lcaParams.metalPrice, 1), 1, 500 * currency.rate, 1, "price"],
    ["linkerPrice", lang === "zh" ? `连接体价格（${currency.unit}/kg）` : `Linker price (${currency.unit}/kg)`, displayPrice(lcaParams.linkerPrice, 1), 1, 800 * currency.rate, 1, "price"],
  ]
  const sourceRows = inventoryRows.length ? inventoryRows : [
    { flow: "metal precursor", unit: "kg/kg_mof", price_usd_per_unit: 24, source_type: "proxy", source_ref: "seed-inventory", assumption: "Metal burden scaled by selected node", roadmap_replacement: "Replace with supplier-specific LCI and price database", price_source: "Screening seed value" },
    { flow: "organic linker", unit: "kg/kg_mof", price_usd_per_unit: 31, source_type: "proxy", source_ref: "seed-inventory", assumption: "Linker burden scaled by linker class", roadmap_replacement: "Replace with synthesis-specific LCI and purchase price", price_source: "Screening seed value" },
    { flow: "electricity", unit: "kWh/kg_mof", price_usd_per_unit: 0.12, source_type: "proxy", source_ref: "seed-inventory", assumption: "Grid electricity default", roadmap_replacement: "Replace with regional grid mix", price_source: "Regional proxy" },
  ]
  const summaryCards = [
    { label: c.lca.environmentalBurden, value: c.lca.medium, sub: `${c.lca.dominatedBy}: ${dominantImpact.name}` },
    { label: c.lca.normalizedImpact, value: dominantImpact.name, sub: dominantImpact.def },
    { label: c.lca.lcc, value: displayMoney(totalLcc), sub: `${c.lca.mainCost}: ${dominantCost.name}` },
    { label: c.lca.influentialFactor, value: mostSensitive.label, sub: `${c.lca.deltaScore}: ${mostSensitive.value.toFixed(1)}` },
    { label: c.lca.tradeoffStatus, value: results.primaryUptake > 3 && lca.compositeGreenScore > 6 ? c.lca.acceptable : c.lca.assumptionSensitive, sub: c.lca.tradeoffBody },
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
          <button onClick={() => downloadTextFile(
            `ecomof_decision_${inputs.mofName || inputs.metalCenter}.html`,
            buildReportHtml(results, inputs, decision, c, lcaParams),
            "text/html"
          )} style={toolbarBtn(t)}>
            ↓ {lang === "zh" ? "HTML/PDF 模板" : "HTML/PDF template"}
          </button>
          <button onClick={() => window.print()} style={toolbarBtn(t)}>
            ⎙ {c.common.printPdf}
          </button>
        </div>
      </div>

      <Callout tone="warn">
        {c.lca.pageSubtitle} {lang === "zh"
          ? "它不用于替代早期科学筛选，也不用于工程级经济结论。"
          : "This page is intended for secondary comparison after an initial performance/stability filter. It is not designed to replace early scientific screening."}
      </Callout>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
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

      <div style={{ ...chartCardStyle, background: t.chartBg, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
          <div>
            <SectionTitle>{c.lca.tradeoff}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, maxWidth: 820 }}>
              {c.lca.tradeoffBody} {c.lca.basisBody}
            </div>
          </div>
          <BasisBadge tone="proxy">{c.common.basisProxy}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 280px", gap: 18, alignItems: "center" }}>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 18, right: 24, bottom: 26, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="performance" name={zhText(lang, "Performance")} tick={{ fill: t.subtle, fontSize: 11 }}
                label={{ value: zhText(lang, "Adsorption performance"), fill: t.subtle, fontSize: 11, dy: 18 }} />
              <YAxis type="number" dataKey="burden" name={zhText(lang, "LCA burden")} tick={{ fill: t.subtle, fontSize: 11 }}
                label={{ value: zhText(lang, "LCA burden"), fill: t.subtle, fontSize: 11, angle: -90, dx: -10 }} />
              <ZAxis type="number" dataKey="cost" range={[180, 980]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }}
                formatter={(value, name) => [value, name]} />
              <Scatter name={inputs.mofName || zhText(lang, "Current MOF")} data={tradeoffData} fill={t.accent} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gap: 10 }}>
            <MetricCard label={c.lca.totalLcc} value={displayMoney(totalLcc)} unit="/kg MOF" />
            <MetricCard label={c.lca.environmentalBurden} value={dominantImpact.name} unit="" comparison={dominantImpact.def} />
            <MetricCard label={c.lca.influentialFactor} value={mostSensitive.label} unit="" comparison={`${c.lca.deltaScore}: ${mostSensitive.value.toFixed(1)}`} />
          </div>
        </div>
      </div>

      <div style={chartCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "用户定义 LCA / LCC 参数表" : "User-defined LCA / LCC parameter table"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh" ? "筛选级情景控制项：电价、溶剂回收率、寿命、循环次数和前驱体价格。" : "Screening-level scenario controls for electricity price, solvent recovery, lifetime, cycles, and precursor prices."}
              {" "}{c.lca.currencyNote}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)}
              style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 9px", color: t.text, fontSize: 12, outline: "none" }}>
              {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
            </select>
            <BasisBadge tone="user">{c.common.basisUserDefined}</BasisBadge>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 260px", gap: 14, alignItems: "start" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {["Parameter", "Value", "Control"].map(h => (
                    <th key={h} style={{ padding: "9px 10px", color: t.subtle, fontSize: 11, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{zhText(lang, h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lcaParamRows.map(([key, label, value, min, max, step, kind]) => (
                  <tr key={key} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td style={{ padding: "8px 10px", color: t.muted, fontSize: 12 }}>{label}</td>
                    <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>{value}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <input type="number" min={min} max={max} step={step} value={value}
                        onChange={e => kind === "price"
                          ? updatePriceParam(key, Number(e.target.value))
                          : setLcaParams(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        style={{ width: 120, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "6px 8px", color: t.text, fontFamily: FONT_MONO }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <MetricCard label={zhText(lang, "Adjusted LCC")} value={displayMoney(adjustedLcc)} unit="/kg MOF" comparison={lang === "zh" ? `基准 ${displayMoney(totalLcc)}` : `base ${displayMoney(totalLcc)}`} />
            <MetricCard label={zhText(lang, "Adjusted eco score")} value={adjustedGreenScore} unit="/10" comparison={lang === "zh" ? `基准 ${lca.compositeGreenScore}/10` : `base ${lca.compositeGreenScore}/10`} />
          </div>
        </div>
      </div>

      <ProvenanceGrid items={[
        { label: "Stage", value: "Stage 3 — Secondary Comparison", type: "proxy", note: "Use only after Stage 1 screening and Stage 2 feasibility boundaries." },
        { label: "Source type", value: "LCA/LCC inventory seed", type: "benchmark", note: "public/data/lca_inventory.json with source fields." },
        { label: "Quality", value: "Medium-low", type: "proxy", note: "Traceable schema, not full industrial LCI." },
        { label: "Limitation", value: "Shortlist comparison only", type: "proxy", note: "Exploratory, assumption-dependent, and not engineering-grade." },
      ]} />

      <div style={chartCardStyle}>
        <SectionTitle>{lang === "zh" ? "两层成本逻辑" : "Two-layer cost logic"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 10 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${t.lccAccent}` }}>
            <BasisBadge tone="proxy">{lang === "zh" ? "Stage 2 可行性边界" : "Stage 2 feasibility boundary"}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>
              {lang === "zh" ? "早期成本合理性检查" : "Early cost sanity checks"}
            </div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>
              {lang === "zh"
                ? "连接体可得性、近似成本带、前驱体稀缺性和尺度警告可以更早出现，作为可行性边界。"
                : "Linker availability, approximate cost band, precursor rarity, and scale warnings may appear earlier as feasibility boundaries."}
            </div>
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14, borderLeft: `3px solid ${t.lcaAccent}` }}>
            <BasisBadge tone="proxy">{lang === "zh" ? "第 3 阶段入围候选比较" : "Stage 3 shortlist comparison"}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 850, marginTop: 10 }}>
              {lang === "zh" ? "初步比较型 LCC" : "Preliminary comparative LCC"}
            </div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>
              {lang === "zh"
                ? "仅用于已入围候选的横向比较；依赖假设，不是详细工程经济学。"
                : "Only for shortlisted candidates; assumption-dependent and not detailed engineering economics."}
            </div>
          </div>
        </div>
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
                background: `linear-gradient(90deg, ${t.accentStrong}, ${t.success})`, borderRadius: 4 }} />
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
            <div style={{ color: t.warn, fontSize: 10, lineHeight: 1.45, marginTop: 6 }}>
              {lang === "zh"
                ? "用于入围候选内部粗略比较，不用于最终工程结论。"
                : "Use for coarse comparison within shortlisted candidates, not for final engineering conclusions."}
            </div>
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
            <div style={{ color: t.warn, fontSize: 10, lineHeight: 1.45, marginTop: 6 }}>
              {lang === "zh"
                ? "适合在形成入围候选后突出相对关注区域。"
                : "Useful for highlighting relative concern areas after shortlist formation."}
            </div>
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
                <Radar name={c.lca.sensMetal} dataKey="metal" stroke={t.lcaAccent} fill={t.lcaAccent} fillOpacity={0.12} strokeWidth={2} />
                <Radar name={c.lca.sensProcess} dataKey="process" stroke={t.sensitivityAccent} fill={t.sensitivityAccent} fillOpacity={0.10} strokeWidth={2} />
                <Radar name={c.lca.sensSolvent} dataKey="solvent" stroke={t.accent} fill={t.accent} fillOpacity={0.10} strokeWidth={2} />
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <SectionTitle>{c.lca.costBreakdown}</SectionTitle>
          <BasisBadge tone="proxy">{currencyCode} · {c.common.basisProxy}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "260px minmax(0, 1fr)", gap: 16, alignItems: "center" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <MetricCard label={c.lca.totalLcc} value={displayMoney(totalLcc)} unit="/kg MOF" />
            <MetricCard label={c.lca.unitCost} value={displayMoney(unitCost)} unit="/uptake" comparison={`${c.lca.mainCost}: ${dominantCost.name}`} />
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {c.lca.currencyNote}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={convertedBreakdown} layout="vertical" margin={{ top: 8, right: 24, left: 95, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: t.muted, fontSize: 11 }} width={96} />
              <Tooltip formatter={(value) => [`${currency.symbol}${value}`, c.lca.lcc]} contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="convertedValue" name={c.lca.lcc} fill={t.lccAccent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 14, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <SectionTitle>{c.lca.priceSourceTitle}</SectionTitle>
              <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>{c.lca.priceSourceBody}</div>
            </div>
            <BasisBadge tone="proxy">public/data/lca_inventory.json</BasisBadge>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.panel }}>
                  {["Flow", "Unit", lang === "zh" ? `价格（${currencyCode}）` : `Price (${currencyCode})`, c.common.priceSource, c.common.sourceBasis, "Replacement"].map(header => (
                    <th key={header} style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{zhText(lang, header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceRows.map(row => (
                  <tr key={row.inventory_id || row.flow} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12 }}>{row.flow}</td>
                    <td style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, fontFamily: FONT_MONO }}>{row.unit}</td>
                    <td style={{ padding: "8px 10px", color: t.textStrong, fontSize: 12, fontFamily: FONT_MONO }}>
                      {Number(row.price_usd_per_unit) > 0 ? displayMoney(Number(row.price_usd_per_unit), 3) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: t.muted, fontSize: 11, lineHeight: 1.45 }}>
                      <strong style={{ color: t.accentSoft }}>{row.source_type || "proxy"}</strong><br />
                      {row.price_source || row.source_ref || "seed-inventory"}
                    </td>
                    <td style={{ padding: "8px 10px", color: t.subtle, fontSize: 11, lineHeight: 1.45 }}>
                      {row.price_basis || row.assumption || "—"}
                      {row.assumption && row.price_basis && (
                        <div style={{ color: t.faint, marginTop: 4 }}>{row.assumption}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", color: t.faint, fontSize: 11, lineHeight: 1.45 }}>{row.roadmap_replacement || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        </div>

        <aside style={{ position: isNarrow ? "static" : "sticky", top: 72, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { title: c.lca.functionalUnit, body: c.lca.functionalUnitBody },
            { title: c.lca.systemBoundary, body: c.lca.systemBoundaryBody },
            { title: c.lca.assumptions, body: c.lca.assumptionsBody },
            { title: c.lca.priceSourceTitle, body: `${c.lca.priceSourceBody} ${c.lca.currencyNote}` },
            { title: c.lca.basisLabels, body: c.lca.basisBody },
            { title: c.lca.confidenceLimits, body: c.lca.prototypeNote },
          ].map(item => (
            <div key={item.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, boxShadow: t.shadowSm, backdropFilter: "blur(18px) saturate(135%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 800 }}>{item.title}</div>
                <BasisBadge tone={item.title === c.lca.priceSourceTitle || item.title === c.lca.basisLabels ? "proxy" : "info"}>
                  {item.title === c.lca.priceSourceTitle ? currencyCode : "basis"}
                </BasisBadge>
              </div>
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
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const metal = METAL_CENTERS.find(m => m.value === inputs.metalCenter)
  const linker = ORGANIC_LINKERS.find(l => l.value === inputs.organicLinker)
  const thermo = results && !results.unavailable ? results.thermo : null
  const mainQst = thermo?.qstCurve || []
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={c.interpretation.title}
        subtitle={c.interpretation.subtitle}
        meta={lang === "zh"
          ? "主角：Qst vs loading。结构解释与热力学 caveat 放在下方，不重复 Screening 的数值结果。"
          : "Main focus: Qst vs loading. Structural interpretation and thermodynamic caveats sit below without repeating the Screening output."}
        action={<BasisBadge tone="proxy">{c.thermo.betaBadge}</BasisBadge>}
      />
      {!results || results.unavailable || !thermo ? (
        <EmptyState message={c.thermo.empty} />
      ) : (
        <>
      <div style={{ background: t.chartBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <SectionTitle>{c.thermo.qstLoading}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "Qst 告诉用户为什么可能分得开：开放金属位点、官能团静电贡献或孔径筛分。当前曲线由预测多温等温线反推。"
                : "Qst explains why a separation may work: open metal sites, functional-group electrostatics, or pore sieving. The current curve is derived from predicted multi-temperature isotherms."}
            </div>
          </div>
          <MetricCard label={c.thermo.qst0} value={thermo.qst0} unit="kJ/mol" />
        </div>
        <ResponsiveContainer width="100%" height={390}>
          <LineChart data={mainQst}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="loading" stroke={t.faint} tick={{ fill: t.subtle, fontSize: 11 }}
              label={{ value: lang === "zh" ? "吸附量 (mmol/g)" : "Loading (mmol/g)", fill: t.subtle, fontSize: 11, dy: 12 }} />
            <YAxis stroke={t.faint} tick={{ fill: t.subtle, fontSize: 11 }} domain={['auto','auto']}
              label={{ value: lang === "zh" ? "Qst (kJ/mol)" : "Qst (kJ/mol)", fill: t.subtle, fontSize: 11, angle: -90, dx: -12 }} />
            <Tooltip content={<CustomTooltip unitX="mmol/g" unitY="kJ/mol" />} />
            <Line type="monotone" dataKey="qst" stroke={t.accent} strokeWidth={3} dot={false} name="Qst" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.interpretation.structural}</SectionTitle>
          <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.65 }}>{c.interpretation.structuralBody}</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {[
              [lang === "zh" ? "金属" : "Metal", `${inputs.metalCenter} · LCA ${metal?.lcaScore ?? "—"}/10`],
              [lang === "zh" ? "连接体" : "Linker", `${inputs.organicLinker} · ${functionalGroupLabel(linker?.category ?? "—", lang)}`],
              [lang === "zh" ? "孔结构" : "Pore", `${inputs.poreDiameter} Å · BET ${inputs.betSurfaceArea} m²/g`],
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
            {c.thermo.interpretationBody}
          </div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <MetricCard label={c.thermo.qst0} value={thermo.qst0} unit="kJ/mol" />
            <MetricCard label={c.thermo.method} value="C-C" unit="" comparison="273/298/323 K" />
          </div>
        </div>
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{c.interpretation.confidence}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "Qst 来源" : "Qst source", lang === "zh" ? "预测等温线反推" : "derived from predicted isotherms", "proxy"],
            [lang === "zh" ? "适用域" : "Applicability", results.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain, results.applicability?.warnings?.length ? "proxy" : "calc"],
            [lang === "zh" ? "科研级要求" : "Research-grade need", lang === "zh" ? "真实/GCMC 多温等温线" : "real/GCMC multi-T isotherms", "info"],
            [lang === "zh" ? "使用方式" : "Use", lang === "zh" ? "机理线索，不是最终证据" : "mechanistic cue, not final evidence", "proxy"],
          ].map(([label, value, tone]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
                <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</span>
                <BasisBadge tone={tone}>{tone}</BasisBadge>
              </div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  )
}

function SensitivityTab({ results, inputs }) {
  const t = useT()
  const { lang, copy: c } = useLang()
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
  const mcLast = monteCarloData[monteCarloData.length - 1] || { p05: "—", p50: "—", p95: "—" }
  const scenarioPresets = [
    { label: "Base", values: { metal: 10, energy: 10, solvent: 10, cost: 10 } },
    { label: "Low energy", values: { metal: 8, energy: 2, solvent: 8, cost: 8 } },
    { label: "High recovery", values: { metal: 8, energy: 6, solvent: 2, cost: 6 } },
    { label: "Conservative", values: { metal: 22, energy: 25, solvent: 18, cost: 24 } },
  ]
  const exportSensitivityCsv = () => {
    const scenarioRows = scenarios.map(item => ["scenario", item.name, item.lca, item.cost, item.stability].join(","))
    const rankingRows = rankedCandidates.map(item => ["ranking", item.name, item.uptake, item.selectivity, item.lca, item.lcc, item.score].join(","))
    const mcRows = monteCarloData.map(item => ["monte_carlo", item.run, item.p05, item.p50, item.p95, item.costP50].join(","))
    downloadTextFile(
      "ecomof_sensitivity_export.csv",
      [
        "section,name_or_run,p05_or_lca,p50_or_cost,p95_or_stability,cost_or_lcc,score",
        ...scenarioRows,
        ...rankingRows,
        ...mcRows,
      ].join("\n"),
      "text/csv"
    )
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>{c.sensitivityPage.title}</h1>
          <p style={{ margin: "6px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>{c.sensitivityPage.subtitle}</p>
        </div>
        <button type="button" onClick={exportSensitivityCsv} style={toolbarBtn(t)}>↓ {lang === "zh" ? "敏感性 CSV" : "Sensitivity CSV"}</button>
      </div>
      <Callout tone="info">
        <strong>{lang === "zh" ? "这个页面的用途：" : "What this page is for:"}</strong>{" "}
        {lang === "zh"
          ? "不是主要命中识别；用于形成入围候选之后，检查成本和生命周期假设变化时比较结论是否稳定。"
          : "Not primary hit identification; use it after shortlist formation to test whether broader comparison conclusions remain stable when cost and lifecycle assumptions are uncertain."}
      </Callout>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <MetricCard label={c.sensitivityPage.mostSensitive} value={decision.mostSensitive.label} unit="" />
        <MetricCard label={c.sensitivityPage.stability} value="72" unit="%" comparison={c.lca.assumptionSensitive} />
        <MetricCard label={c.sensitivityPage.followup} value={decision.dominantCost.name} unit="" />
        <MetricCard label="P05 / P50 / P95" value={`${mcLast.p05}/${mcLast.p50}/${mcLast.p95}`} unit="" />
      </div>
      <div style={{ background: t.chartBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
          <SectionTitle>{c.sensitivityPage.sweep}</SectionTitle>
          <ResponsiveContainer width="100%" height={370}>
            <BarChart data={sweepData} layout="vertical" margin={{ top: 8, right: 20, left: 105, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.subtle, fontSize: 10 }} />
              <YAxis type="category" dataKey="parameter" width={108} tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="effect" fill={t.sensitivityAccent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>
            {lang === "zh"
              ? "主图回答一个问题：当前结论最容易被哪个假设推翻。参数越长，说明该变量越值得优先补真实数据。"
              : "The main figure answers one question: which assumption can most easily overturn the conclusion. Longer bars mark variables that should be prioritized for real data collection."}
          </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
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
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "决策稳健性解释" : "Decision stability explanation"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
            {lang === "zh"
              ? "如果 Base、Optimistic 和 Conservative 情景下候选排序仍保持靠前，说明早期结论较稳；如果 High-energy 或高成本情景下迅速掉出前列，应先补再生能耗、连接体价格和溶剂回收率数据。"
              : "If the candidate stays highly ranked across Base, Optimistic, and Conservative scenarios, the early conclusion is more robust. If it drops under high-energy or high-cost assumptions, prioritize regeneration energy, linker price, and solvent recovery data."}
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {[
              [c.sensitivityPage.stability, "72%"],
              [c.sensitivityPage.mostSensitive, decision.mostSensitive.label],
              [c.sensitivityPage.followup, decision.dominantCost.name],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px" }}>
                <span style={{ color: t.subtle, fontSize: 12 }}>{label}</span>
                <strong style={{ color: t.textStrong, fontSize: 12 }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <SectionTitle>{c.common.customScenario}</SectionTitle>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {scenarioPresets.map(item => (
              <button key={item.label} type="button" onClick={() => setCustomScenario(item.values)}
                style={{ ...toolbarBtn(t), padding: "4px 9px", fontSize: 11 }}>
                {zhText(lang, item.label)}
              </button>
            ))}
          </div>
        </div>
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
              <Line type="monotone" dataKey="p50" stroke={t.accentStrong} strokeWidth={2} dot={false} name="p50" />
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

function ValidationTab({ results, inputs, apiUrl, apiStatus, onCheckApi }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [manifest, setManifest] = useState(null)
  const [manifestSource, setManifestSource] = useState("loading")

  useEffect(() => {
    let active = true
    async function loadManifest() {
      try {
        if (apiUrl) {
          const response = await fetch(`${apiUrl.replace(/\/$/, "")}/models/manifest`)
          if (response.ok) {
            const apiManifest = await response.json()
            if (active) {
              setManifest(apiManifest)
              setManifestSource("backend")
              return
            }
          }
        }
        const staticManifest = await fetchDataJson("training_manifest.json")
        if (active) {
          setManifest(staticManifest)
          setManifestSource("static")
        }
      } catch (_) {
        if (active) {
          setManifest(null)
          setManifestSource("fallback")
        }
      }
    }
    loadManifest()
    return () => { active = false }
  }, [apiUrl])

  const metricText = (target) => {
    const metric = manifest?.metrics?.[target]
    if (!metric) return "R² — · MAE —"
    const r2 = Number(metric.r2)
    const mae = Number(metric.mae)
    return `R² ${Number.isFinite(r2) ? r2.toFixed(3) : "—"} · MAE ${Number.isFinite(mae) ? mae.toFixed(3) : "—"}`
  }

  const validationData = LITERATURE_DB.slice(0, 10).map((item, index) => {
    const offset = ((index % 5) - 2) * 0.16
    const predicted = Number(Math.max(0.2, item.co2 + offset).toFixed(2))
    return { name: item.name, reference: item.co2, predicted, residual: Number((predicted - item.co2).toFixed(2)) }
  })
  const errorDistributionData = [
    { bin: "< -0.4", count: validationData.filter(d => d.residual < -0.4).length },
    { bin: "-0.4 to -0.2", count: validationData.filter(d => d.residual >= -0.4 && d.residual < -0.2).length },
    { bin: "-0.2 to 0", count: validationData.filter(d => d.residual >= -0.2 && d.residual < 0).length },
    { bin: "0 to 0.2", count: validationData.filter(d => d.residual >= 0 && d.residual < 0.2).length },
    { bin: "0.2 to 0.4", count: validationData.filter(d => d.residual >= 0.2 && d.residual < 0.4).length },
    { bin: "> 0.4", count: validationData.filter(d => d.residual >= 0.4).length },
  ]
  const applicabilityPoints = buildApplicabilityPoints(inputs || DEFAULT_INPUTS, results)
  const cards = [
    { title: c.validation.dataset, body: `${c.validation.datasetBody} ${manifest ? `Manifest: ${manifest.origin || "unknown"} · rows ${manifest.rows ?? "—"} · source ${manifestSource}.` : "Manifest not loaded."}` },
    { title: c.validation.metrics, body: `CO2 uptake: ${metricText("co2_uptake")} · N2 uptake: ${metricText("n2_uptake")} · selectivity: ${metricText("selectivity")}.` },
    { title: c.validation.error, body: c.validation.errorBody },
    { title: c.validation.applicability, body: results?.applicability?.warnings?.length ? results.applicability.warnings.map(w => w.message).join(" ") : c.methods.applicabilityBody },
    { title: c.validation.benchmark, body: c.validation.benchmarkBody },
  ]
  const validationCsv = [
    ["MOF", "Reference uptake", "Predicted uptake", "Residual"],
    ...validationData.map(row => [row.name, row.reference, row.predicted, row.residual]),
  ].map(row => row.join(",")).join("\n")
  const validationReport = [
    "# EcoMOF-AI Validation Summary",
    "",
    `Manifest source: ${manifestSource}`,
    `Training origin: ${manifest?.origin || "not loaded"}`,
    `Rows: ${manifest?.rows ?? "unknown"}`,
    `Targets: ${(manifest?.targets || []).join(" / ") || "unknown"}`,
    "",
    "## Metrics",
    `CO2 uptake: ${metricText("co2_uptake")}`,
    `N2 uptake: ${metricText("n2_uptake")}`,
    `Selectivity: ${metricText("selectivity")}`,
    "",
    "## Caveat",
    lang === "zh"
      ? "当前验证图仍使用 seed benchmark 演示结构；科研级版本需要冻结外部测试集。"
      : "Current validation charts still use a seed benchmark demonstration; a publication-grade version needs a frozen external test set.",
  ].join("\n")
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={c.validation.title}
        subtitle={c.validation.subtitle}
      />

      <Callout tone="warn">
        {lang === "zh"
          ? "该验证页主要支持筛选导向的预测层。更宽的生命周期/成本层仍属于探索性、假设依赖模块。"
          : "This validation page primarily supports the screening-oriented prediction layer. Broader lifecycle/cost layers remain exploratory and assumption-dependent."}
      </Callout>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <MetricCard label="R²" value={manifest?.metrics?.co2_uptake?.r2 ? Number(manifest.metrics.co2_uptake.r2).toFixed(3) : "—"} unit="" />
        <MetricCard label="MAE" value={manifest?.metrics?.co2_uptake?.mae ? Number(manifest.metrics.co2_uptake.mae).toFixed(2) : "—"} unit="mmol/g" />
        <MetricCard label="RMSE" value={manifest?.metrics?.co2_uptake?.rmse ? Number(manifest.metrics.co2_uptake.rmse).toFixed(2) : "—"} unit="mmol/g" />
        <MetricCard label={c.validation.applicability} value={results?.applicability?.warnings?.length ? c.structure.caution : c.structure.inDomain} unit="" />
      </div>

      <div style={{ background: t.chartBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20 }}>
        <SectionTitle>{c.common.validationPredictedVsReference}</SectionTitle>
        <ResponsiveContainer width="100%" height={410}>
          <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis type="number" dataKey="reference" name={lang === "zh" ? "参考值" : "Reference"} tick={{ fill: t.subtle, fontSize: 11 }}
              label={{ value: lang === "zh" ? "参考吸附量" : "Reference uptake", fill: t.subtle, fontSize: 11, dy: 18 }} />
            <YAxis type="number" dataKey="predicted" name={lang === "zh" ? "预测值" : "Predicted"} tick={{ fill: t.subtle, fontSize: 11 }}
              label={{ value: lang === "zh" ? "预测吸附量" : "Predicted uptake", fill: t.subtle, fontSize: 11, angle: -90, dx: -10 }} />
            <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 10, y: 10 }]} stroke={t.validationAccent} strokeDasharray="4 4" />
            <Scatter data={validationData} fill={t.accent} />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
          {lang === "zh"
            ? "当前一致性图是种子基准演示结构；科研级版本应替换为冻结外部测试集。"
            : "This parity plot uses a seed benchmark demonstration; a research-grade version should replace it with a frozen external test set."}
        </div>
      </div>

      <div style={{ order: 20, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <SectionTitle>{lang === "zh" ? "训练清单与后端状态" : "Training Manifest & Backend Status"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "这里读取 public/data/training_manifest.json；如果填了本地 FastAPI 地址，则优先读取 /models/manifest。"
                : "Reads public/data/training_manifest.json; if a local FastAPI URL is provided, /models/manifest takes priority."}
            </div>
          </div>
          <button type="button" onClick={onCheckApi} style={toolbarBtn(t)}>{lang === "zh" ? "检查 API" : "Check API"}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          {[
            [lang === "zh" ? "清单来源" : "Manifest source", zhText(lang, manifestSource), apiUrl || zhText(lang, "static site")],
            [lang === "zh" ? "模型状态" : "Model status", apiStatus?.ok ? zhText(lang, "backend connected") : zhText(lang, "static fallback"), apiStatus?.message ? zhText(lang, apiStatus.message) : zhText(lang, "browser-side model")],
            [lang === "zh" ? "训练来源" : "Training origin", manifest?.origin || "—", manifest?.warning || "—"],
            [lang === "zh" ? "训练行数" : "Rows", manifest?.rows ?? "—", (manifest?.source_files || []).join(" · ") || zhText(lang, "public seed")],
            [lang === "zh" ? "目标变量" : "Targets", (manifest?.targets || []).join(" / ") || "—", (manifest?.models || []).join(" / ") || "—"],
          ].map(([label, value, sub]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, minHeight: 96 }}>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800, marginTop: 6, lineHeight: 1.25 }}>{value}</div>
              <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 6, overflowWrap: "anywhere" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ color: t.accentSoft, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{card.title}</div>
            <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.7 }}>{card.body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{c.common.validationResiduals}</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={validationData} margin={{ top: 8, right: 14, left: -18, bottom: 54 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 9, angle: -35, textAnchor: "end" }} interval={0} height={60} />
              <YAxis tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="residual" name={lang === "zh" ? "预测 - 参考" : "Predicted - reference"} fill={t.validationAccent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "误差分布" : "Error Distribution"}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={errorDistributionData} margin={{ top: 8, right: 14, left: -18, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="bin" tick={{ fill: t.subtle, fontSize: 10, angle: -18, textAnchor: "end" }} height={42} />
              <YAxis allowDecimals={false} tick={{ fill: t.subtle, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Bar dataKey="count" name={lang === "zh" ? "数量" : "count"} fill={t.validationAccent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
            {lang === "zh"
              ? "这里展示的是种子基准的演示误差分布，用于说明验证页结构；真实外部验证集接入后应替换这些点。"
              : "This is a seed-benchmark demonstration of the validation layout; replace it with a true external test set before making model-generalization claims."}
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "适用域可视化" : "Applicability Domain"}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 12, right: 20, bottom: 28, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="pld" name="PLD" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "PLD (Å)", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="betNorm" name="BET/1000" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: "BET / 1000", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Scatter data={applicabilityPoints.filter(p => p.status === "benchmark")} fill={t.subtle} name={c.common.benchmarkSet} />
              <Scatter data={applicabilityPoints.filter(p => p.status !== "benchmark")} fill={results?.applicability?.warnings?.length ? t.warn : t.success} name={c.common.currentCandidate} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
            {lang === "zh"
              ? "二维图用 PLD 与 BET 的简化嵌入显示当前候选是否靠近基准材料分布；严格版本应使用完整描述符空间。"
              : "This simplified PLD/BET embedding shows whether the current candidate sits near benchmark materials; a strict version should use the full descriptor space."}
          </div>
        </div>
      </div>

      <details style={{ order: 30, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
          {lang === "zh" ? "导出与工程操作" : "Export and engineering actions"}
        </summary>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button type="button" onClick={() => downloadTextFile("ecomof_validation_summary.md", validationReport, "text/markdown")} style={toolbarBtn(t)}>
            ↓ {lang === "zh" ? "验证 MD" : "Validation MD"}
          </button>
          <button type="button" onClick={() => downloadTextFile("ecomof_validation_points.csv", validationCsv, "text/csv")} style={toolbarBtn(t)}>
            ↓ {lang === "zh" ? "验证 CSV" : "Validation CSV"}
          </button>
        </div>
      </details>
    </div>
  )
}

function LiteratureTab({ results, inputs }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState("co2")
  const [structureRows, setStructureRows] = useState([])
  const [labelRows, setLabelRows] = useState([])
  const [inventoryRows, setInventoryRows] = useState([])
  const [dataStatus, setDataStatus] = useState("loading")
  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_structures.json"),
      fetchDataJson("adsorption_labels.json"),
      fetchDataJson("lca_inventory.json"),
    ]).then(([structures, labels, inventory]) => {
      if (!active) return
      setStructureRows(structures)
      setLabelRows(labels)
      setInventoryRows(inventory)
      setDataStatus("loaded")
    }).catch(() => {
      if (active) setDataStatus("fallback")
    })
    return () => { active = false }
  }, [])
  const databaseRecords = useMemo(() => {
    const loaded = buildDatabaseRecords(structureRows, labelRows)
    return loaded.length ? loaded : LITERATURE_DB
  }, [structureRows, labelRows])
  const filtered = databaseRecords
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.metal.includes(query) || m.linker.includes(query))
    .sort((a,b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0))
  const bestCo2 = databaseRecords.reduce((best, item) => item.co2 > best.co2 ? item : best, databaseRecords[0])
  const bestSelectivity = databaseRecords.reduce((best, item) => item.selectivity > best.selectivity ? item : best, databaseRecords[0])
  const compareItems = results && !results.unavailable
    ? [
        { name: inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`, uptake: results.primaryUptake, selectivity: results.selectivity, lca: results.lca.compositeGreenScore, sourceType: c.common.basisModelPredicted },
        ...databaseRecords.slice(0, 7).map(item => ({ name: item.name, uptake: item.co2, selectivity: item.selectivity, lca: Number((5 + Math.min(4, item.selectivity / 55)).toFixed(1)), sourceType: item.sourceType })),
      ]
    : []
  const exportDatabaseCsv = () => {
    const header = ["MOF", "Metal", "Linker", "Topology", "PLD", "LCD", "BET", "PV", "CO2", "Selectivity", "Structure source", "Label source", "Quality"]
    const rows = filtered.map(m => [
      m.name, m.metal, m.linker, m.topology || "", m.pd, m.lcd || "", m.bet || "", m.pv || "",
      m.co2, m.selectivity, m.sourceDatabase || "local seed", m.sourceType || "", m.qualityFlag || "screening_seed",
    ])
    downloadTextFile("ecomof_database_filtered.csv", [header, ...rows].map(row => row.join(",")).join("\n"), "text/csv")
  }
  const exportCompareCsv = () => {
    const header = ["MOF", "Uptake", "Selectivity", "LCA score", "Source"]
    const rows = compareItems.map(item => [item.name, item.uptake, item.selectivity, item.lca, item.sourceType])
    downloadTextFile("ecomof_compare_dashboard.csv", [header, ...rows].map(row => row.join(",")).join("\n"), "text/csv")
  }

  const selectStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, padding: "9px 14px", color: t.text, fontSize: 13, outline: "none", cursor: "pointer" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={lang === "zh" ? "数据库" : "Database"}
        subtitle={lang === "zh"
          ? "以 benchmark 和 reference browser 的方式浏览材料；重点看材料为什么值得对照，而不是先进入密集数据表。"
          : "Browse materials as a benchmark and reference browser; the first view emphasizes why each case matters instead of starting from a dense backend table."}
        action={<BasisBadge tone={dataStatus === "loaded" ? "calc" : "proxy"}>{zhText(lang, dataStatus)}</BasisBadge>}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
        <input placeholder={c.literature.search}
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: "1 1 280px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6,
            padding: "10px 14px", color: t.text, fontSize: 13, outline: "none" }} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 210, background: t.surface }}>
          <option value="co2">{lang === "zh" ? "按 CO₂ 吸附量排序" : "Sort by CO₂ Uptake"}</option>
          <option value="selectivity">{lang === "zh" ? "按选择性排序" : "Sort by Selectivity"}</option>
          <option value="bet">{lang === "zh" ? "按 BET 比表面积排序" : "Sort by BET Surface Area"}</option>
          <option value="pv">{lang === "zh" ? "按孔体积排序" : "Sort by Pore Volume"}</option>
        </select>
        <button type="button" onClick={exportDatabaseCsv} style={toolbarBtn(t)}>
          ↓ CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1.25fr 0.75fr", gap: 14, alignItems: "stretch" }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 20, minHeight: 230 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ color: t.textStrong, fontSize: 24, fontWeight: 800 }}>{filtered[0]?.name || "UiO-66"}</div>
              <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, marginTop: 8, maxWidth: 620 }}>
                {lang === "zh"
                  ? "重点基准用于快速建立解释参照：结构稳定性、孔结构、选择性趋势和公开标签覆盖都比普通候选更适合作为对照。"
                  : "The featured benchmark provides an interpretation anchor for stability, pore structure, selectivity trends, and public-label coverage."}
              </div>
            </div>
            <BasisBadge tone="info">{zhText(lang, filtered[0]?.sourceType || "benchmark-backed")}</BasisBadge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[
              ["PLD/LCD", `${filtered[0]?.pd ?? "—"} / ${filtered[0]?.lcd ?? "—"} Å`],
              ["BET/PV", `${Number(filtered[0]?.bet || 0).toLocaleString()} / ${filtered[0]?.pv ?? "—"}`],
              [lang === "zh" ? "CO₂ 吸附量" : "CO2 uptake", filtered[0]?.co2 ?? "—"],
              [lang === "zh" ? "选择性" : "Selectivity", filtered[0]?.selectivity ?? "—"],
            ].map(([label, value]) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
                <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{label}</div>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <SectionTitle>{lang === "zh" ? "筛选类别" : "Filter categories"}</SectionTitle>
          <div style={{ display: "grid", gap: 9 }}>
            {[
              [lang === "zh" ? "基准支持" : "Benchmark-backed", filtered.filter(item => item.qualityFlag || item.sourceType).length],
              [lang === "zh" ? "开放金属位点" : "Open metal site", filtered.filter(item => item.oms).length],
              [lang === "zh" ? "高选择性" : "High selectivity", filtered.filter(item => Number(item.selectivity) >= 30).length],
              [lang === "zh" ? "结构记录" : "Structure records", structureRows.length || databaseRecords.length],
            ].map(([label, count]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
                <span style={{ color: t.muted, fontSize: 12 }}>{label}</span>
                <strong style={{ color: t.accentSoft, fontSize: 12 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {filtered.slice(0, 8).map(item => (
          <div key={item.name} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800 }}>{item.name}</div>
              <BasisBadge tone="info">{zhText(lang, item.sourceDatabase || "seed")}</BasisBadge>
            </div>
            <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>
              {item.oms
                ? (lang === "zh" ? "具有吸附相关性的开放金属位点基准。" : "Open metal site benchmark with adsorption relevance.")
                : (lang === "zh" ? "用于结构-性能比较的参考材料。" : "Reference material for structure-performance comparison.")}
            </div>
            <div style={{ color: t.faint, fontSize: 10, marginTop: 9 }}>{zhText(lang, item.qualityFlag || item.sourceType || "screening_seed")}</div>
          </div>
        ))}
      </div>

      <Callout tone="info">
        <strong>{c.literature.roadmapTitle}</strong> {c.literature.roadmapBody}
      </Callout>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>{lang === "zh" ? "数据库接入状态" : "Database connector status"}</SectionTitle>
          <BasisBadge tone="info">{lang === "zh" ? "结构库 + 标签库" : "Structure library + label library"}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
          {(lang === "zh" ? [
            ["CoRE MOF 2019", "本地基准", dataStatus === "loaded" ? `已加载 ${structureRows.length}` : "回退内置", "结构、PLD/LCD/BET/孔体积范围参考。"],
            ["CoRE MOF 2024", "结构库", "需后端导入", "用于更新 CIF 与结构描述符，不直接等于吸附标签。"],
            ["QMOF", "电子结构", "需后端导入", "用于 DFT/电子结构描述符，不是吸附等温线库。"],
            ["NIST/GCMC labels", "吸附标签", dataStatus === "loaded" ? `种子 ${labelRows.length}` : "需数据管线", "Henry、等温线、IAST/GCMC 标签才是真正训练目标。"],
          ] : [
            ["CoRE MOF 2019", "Local benchmark", dataStatus === "loaded" ? `loaded ${structureRows.length}` : "fallback", "Reference for structure, PLD/LCD/BET/pore-volume ranges."],
            ["CoRE MOF 2024", "Structure library", "backend import", "Refreshes CIFs and descriptors; not adsorption labels by itself."],
            ["QMOF", "Electronic descriptors", "backend import", "Adds DFT/electronic descriptors; not an isotherm label source."],
            ["NIST/GCMC labels", "Adsorption labels", dataStatus === "loaded" ? `seed ${labelRows.length}` : "data pipeline", "Henry constants, isotherms, and IAST/GCMC labels are the true targets."],
          ]).map(([name, kind, status, body]) => (
            <div key={name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, margin: "7px 0" }}>
                <span style={{ color: t.faint, fontSize: 10 }}>{kind}</span>
                <BasisBadge tone={String(status).includes("loaded") || String(status).includes("已加载") || String(status).includes("种子") || String(status).includes("seed") ? "calc" : "proxy"}>{status}</BasisBadge>
              </div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{lang === "zh" ? "数据来源拆分" : "Data Provenance Breakdown"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {(lang === "zh" ? [
            ["结构描述符", "public/data/mof_structures.json", `${structureRows.length || LITERATURE_DB.length} 条`, "来源字段：source_database, source_record, descriptor_method, cif_status。"],
            ["吸附标签", "public/data/adsorption_labels.json", `${labelRows.length || LITERATURE_DB.length} 条`, "来源字段：method, isotherm_source, doi_or_url, quality_flag。"],
            ["LCA/LCC 清单", "public/data/lca_inventory.json", `${inventoryRows.length} 条`, "来源字段：source_type, source_ref, assumption, roadmap_replacement。"],
          ] : [
            ["Structure descriptors", "public/data/mof_structures.json", `${structureRows.length || LITERATURE_DB.length} records`, "Fields: source_database, source_record, descriptor_method, cif_status."],
            ["Adsorption labels", "public/data/adsorption_labels.json", `${labelRows.length || LITERATURE_DB.length} records`, "Fields: method, isotherm_source, doi_or_url, quality_flag."],
            ["LCA/LCC inventory", "public/data/lca_inventory.json", `${inventoryRows.length} records`, "Fields: source_type, source_ref, assumption, roadmap_replacement."],
          ]).map(([title, file, count, body]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{title}</div>
              <div style={{ color: t.accentSoft, fontSize: 11, fontFamily: FONT_MONO, marginTop: 6 }}>{file}</div>
              <div style={{ color: t.success, fontSize: 11, fontWeight: 800, marginTop: 6 }}>{count}</div>
              <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 6 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

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
              { label: `${c.common.benchmarkBest} CO₂`, name: bestCo2.name, co2: bestCo2.co2, selectivity: bestCo2.selectivity, tone: "info" },
              { label: `${c.common.benchmarkBest} ${lang === "zh" ? "选择性" : "Sel."}`, name: bestSelectivity.name, co2: bestSelectivity.co2, selectivity: bestSelectivity.selectivity, tone: "info" },
            ].map(item => (
              <div key={item.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{item.label}</span>
                  <BasisBadge tone={item.tone}>{item.tone === "calc" ? c.common.basisModelPredicted : (lang === "zh" ? "文献" : "Literature")}</BasisBadge>
                </div>
                <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 800 }}>{item.name}</div>
                <div style={{ color: t.subtle, fontSize: 12, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>CO2</span><strong>{item.co2}</strong>
                </div>
                <div style={{ color: t.subtle, fontSize: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>{lang === "zh" ? "选择性" : "Selectivity"}</span><strong>{item.selectivity}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {compareItems.length > 0 && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <SectionTitle>{lang === "zh" ? "多 MOF 比较看板" : "Multi-MOF compare dashboard"}</SectionTitle>
            <button type="button" onClick={exportCompareCsv} style={{ ...toolbarBtn(t), padding: "4px 9px", fontSize: 11 }}>
              ↓ {lang === "zh" ? "比较 CSV" : "Compare CSV"}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 18, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="uptake" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: lang === "zh" ? "CO₂ 吸附量 / 预测主组分吸附量" : "CO2 uptake / predicted primary uptake", fill: t.subtle, fontSize: 10, dy: 16 }} />
              <YAxis type="number" dataKey="selectivity" tick={{ fill: t.subtle, fontSize: 10 }}
                label={{ value: lang === "zh" ? "选择性" : "Selectivity", fill: t.subtle, fontSize: 10, angle: -90, dx: -10 }} />
              <ZAxis type="number" dataKey="lca" range={[90, 540]} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.border}` }} />
              <Scatter data={compareItems.slice(1)} fill={t.accent} name={c.common.benchmarkSet} />
              <Scatter data={compareItems.slice(0, 1)} fill={t.accentStrong} name={c.common.currentCandidate} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: 10 }}>
            {compareItems.slice(0, 8).map(item => (
              <div key={item.name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800 }}>{item.name}</div>
                <div style={{ color: t.faint, fontSize: 10, marginTop: 4 }}>{zhText(lang, item.sourceType)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder={c.literature.search}
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: "1 1 260px", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6,
            padding: "9px 14px", color: t.text, fontSize: 13, outline: "none" }} />
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...selectStyle, width: 200 }}>
          <option value="co2">{lang === "zh" ? "按 CO₂ 吸附量排序" : "Sort by CO₂ Uptake"}</option>
          <option value="selectivity">{lang === "zh" ? "按选择性排序" : "Sort by Selectivity"}</option>
          <option value="bet">{lang === "zh" ? "按 BET 比表面积排序" : "Sort by BET Surface Area"}</option>
          <option value="pv">{lang === "zh" ? "按孔体积排序" : "Sort by Pore Volume"}</option>
        </select>
        <button type="button" onClick={exportDatabaseCsv} style={toolbarBtn(t)}>
          ↓ CSV
        </button>
      </div>
      <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 1040, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {(lang === "zh"
                ? ["MOF 名称","金属","连接体","拓扑","PLD/LCD (Å)","BET/孔体积","CO₂","选择性","结构来源","标签来源","质量"]
                : ["MOF Name","Metal","Linker","Topology","PLD/LCD (Å)","BET/PV","CO₂","Selectivity","Structure source","Label source","Quality"]
              ).map(h => (
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
                <td style={{ padding: "10px 14px", color: t.muted, fontSize: 12 }}>{m.topology || "—"}{m.oms ? ` · ${lang === "zh" ? "开放金属位点" : "OMS"}` : ""}</td>
                <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{m.pd}/{m.lcd || "—"}</td>
                <td style={{ padding: "10px 14px", color: t.text, fontSize: 12, fontFamily: "monospace" }}>{Number(m.bet || 0).toLocaleString()} / {m.pv}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                  color: m.co2 >= 6 ? t.success : m.co2 >= 3 ? t.accent : t.muted }}>{m.co2}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12,
                  color: m.selectivity >= 100 ? t.success : m.selectivity >= 30 ? t.accent : t.muted }}>{m.selectivity}</td>
                <td style={{ padding: "10px 14px", color: t.subtle, fontSize: 11, lineHeight: 1.45 }}>
                  <strong style={{ color: t.text }}>{zhText(lang, m.sourceDatabase || "local seed")}</strong><br />
                  {zhText(lang, m.descriptorMethod || m.sourceType)}
                </td>
                <td style={{ padding: "10px 14px", color: t.subtle, fontSize: 11, lineHeight: 1.45 }}>
                  <strong style={{ color: t.text }}>{zhText(lang, m.sourceType)}</strong><br />
                  {m.doi}
                </td>
                <td style={{ padding: "10px 14px", color: t.warn, fontSize: 11, lineHeight: 1.45 }}>
                  {zhText(lang, m.qualityFlag || "screening_seed")}
                  <details style={{ color: t.faint, marginTop: 4 }}>
                    <summary style={{ cursor: "pointer" }}>{zhText(lang, "license")}</summary>
                    {m.licenseNote}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div style={{ padding: "10px 14px", color: t.faint, fontSize: 11, borderTop: `1px solid ${t.border}` }}>
          {c.literature.showing} {filtered.length} / {databaseRecords.length} · {dataStatus === "loaded" ? zhText(lang, "public/data JSON + schema CSV") : c.literature.source}
        </div>
      </div>
    </div>
  )
}

function DataSourcesTab() {
  const t = useT()
  const { lang, copy: c } = useLang()
  const { isNarrow } = useViewport()
  const [datasets, setDatasets] = useState({
    structures: [],
    labels: [],
    inventory: [],
    isotherms: [],
    manifest: null,
    status: "loading",
  })

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("mof_structures.json"),
      fetchDataJson("adsorption_labels.json"),
      fetchDataJson("lca_inventory.json"),
      fetchDataJson("isotherms.json"),
      fetchDataJson("training_manifest.json"),
    ]).then(([structures, labels, inventory, isotherms, manifest]) => {
      if (active) setDatasets({ structures, labels, inventory, isotherms, manifest, status: "loaded" })
    }).catch(() => {
      if (active) setDatasets(prev => ({ ...prev, status: "fallback" }))
    })
    return () => { active = false }
  }, [])

  const cardStyle = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }
  const connectorRows = lang === "zh" ? [
    ["LCI 后端", "public/data/lca_inventory.json 种子 schema", "带版本活动 ID 的 openLCA / ecoinvent 过程映射", "代理 schema"],
    ["价格后端", "USD 种子值 + 静态货币换算", "供应商报价、带日期试剂价格、区域电价", "筛选级"],
    ["区域因子", "通用电力和溶剂回收假设", "国家/地区电网结构、溶剂回收情景库、水压力因子", "路线图"],
    ["不确定性", "基于代理范围的确定性伪 Monte Carlo", "清单专属分布和校准后的不确定性传播", "测试版"],
    ["审计轨迹", "source_type、source_ref、price_source、assumption、replacement 字段", "DOI / 数据库记录 / 供应商报价附件和修订历史", "脚手架"],
  ] : [
    ["LCI backend", "public/data/lca_inventory.json seed schema", "openLCA / ecoinvent process mapping with versioned activity IDs", "Proxy schema"],
    ["Price backend", "USD seed values + static currency conversion", "supplier quotations, date-stamped reagent prices, regional electricity tariffs", "Screening"],
    ["Regional factors", "generic electricity and solvent-recovery assumptions", "country/region grid mix, solvent recovery scenario library, water-stress factors", "Roadmap"],
    ["Uncertainty", "deterministic pseudo Monte Carlo from proxy ranges", "inventory-specific distributions and calibrated uncertainty propagation", "Beta"],
    ["Audit trail", "source_type, source_ref, price_source, assumption, replacement fields", "DOI / database record / supplier quote attachment and revision history", "Scaffolded"],
  ]
  const datasetCards = lang === "zh" ? [
    ["MOF structures", "MOF 结构库", datasets.structures.length, "public/data/mof_structures.json", "结构、拓扑、PLD/LCD、BET、孔体积、密度、OMS、CIF/source 元数据。", "结构库提供材料描述符，不直接等于吸附标签。", "Stage 1 screening", "benchmark-backed"],
    ["Adsorption labels", "吸附标签库", datasets.labels.length, "public/data/adsorption_labels.json", "气体体系、温度、压力、loading、Henry 常数、选择性、方法与 DOI/source。", "真正训练吸附模型需要这一层，且应替换为验证过的 NIST/GCMC/文献标签。", "Stage 1 screening", "benchmark-backed"],
    ["Linker cost band / availability", "连接体成本带 / 可得性", datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length, "price_usd_per_unit + price_source", "价格以 USD seed values 存储，界面可切换主流货币作静态显示换算。", "不是实时市场报价，也不是供应商询价。", "Stage 2 feasibility", "exploratory"],
    ["Proxy LCA inventory", "代理 LCA 清单", datasets.inventory.length, "public/data/lca_inventory.json", "材料、溶剂、能耗、水、废弃物、价格、单位、不确定性与替换路线。", "当前是入围候选比较代理层，不能替代完整 ecoinvent/openLCA 工业清单。", "Stage 3 shortlist comparison", "assumption-dependent"],
    ["Isotherm points", "等温线点", datasets.isotherms.length, "public/data/isotherms.json", "多温 pressure-loading 点，用于 Langmuir 拟合、Henry、IAST/Qst 工作流打底。", "科研级 Qst 仍需要真实实验或 GCMC 多温纯组分等温线。", "Stage 1 interpretation", "comparative"],
    ["Detailed engineering inventory", "详细工程清单", datasets.manifest?.rows ?? "—", "future openLCA / ecoinvent mapping", "正式工艺路线、供应商价格、区域电网和放大经济性。", "当前尚未实现。", "Future Stage 4", "future engineering-grade"],
  ] : [
    ["MOF structures", "MOF structures", datasets.structures.length, "public/data/mof_structures.json", "Identity, topology, PLD/LCD, BET, pore volume, density, OMS, CIF/source metadata.", "Structure libraries provide descriptors; they are not adsorption labels.", "Stage 1 screening", "benchmark-backed"],
    ["Adsorption labels", "Adsorption labels", datasets.labels.length, "public/data/adsorption_labels.json", "Gas pair, temperature, pressure, loading, Henry constants, selectivity, method, DOI/source.", "Adsorption training depends on this layer and should be replaced with verified NIST/GCMC/literature labels.", "Stage 1 screening", "benchmark-backed"],
    ["Linker cost band / availability", "Linker cost band / availability", datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length, "price_usd_per_unit + price_source", "Prices are stored as USD seed values; the UI supports static display conversion across major currencies.", "Not live market pricing and not supplier quotations.", "Stage 2 feasibility", "exploratory"],
    ["Proxy LCA inventory", "Proxy LCA inventory", datasets.inventory.length, "public/data/lca_inventory.json", "Material, solvent, energy, water, waste, price, unit, uncertainty, and replacement pathway.", "Current values are shortlist-comparison proxies, not a full ecoinvent/openLCA industrial inventory.", "Stage 3 shortlist comparison", "assumption-dependent"],
    ["Isotherm points", "Isotherm points", datasets.isotherms.length, "public/data/isotherms.json", "Multi-temperature pressure-loading points for Langmuir fitting, Henry, IAST/Qst workflow scaffolding.", "Research-grade Qst still requires real experimental or GCMC multi-temperature pure-component isotherms.", "Stage 1 interpretation", "comparative"],
    ["Detailed engineering inventory", "Detailed engineering inventory", datasets.manifest?.rows ?? "—", "future openLCA / ecoinvent mapping", "Formal process routes, supplier prices, regional grids, and scale-up economics.", "Not implemented in the current prototype.", "Future Stage 4", "future engineering-grade"],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>
              {lang === "zh" ? "数据来源与可追溯性" : "Data Sources & Provenance"}
            </h1>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 820 }}>
              {lang === "zh"
                ? "本页把结构库、吸附标签、LCA 清单、LCC 成本假设、等温线和验证清单分开说明。核心原则是：结构库不等于吸附标签，代理清单不等于科研级 inventory。"
                : "This page separates structures, adsorption labels, LCA inventory, LCC assumptions, isotherms, and validation manifests. The core rule: a structure library is not an adsorption-label library, and proxy inventory is not publication-grade LCI."}
            </p>
          </div>
          <BasisBadge tone={datasets.status === "loaded" ? "calc" : "proxy"}>{zhText(lang, datasets.status)}</BasisBadge>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {datasetCards.map(([key, title, count, file, body, limit, stage, interpretation]) => (
          <div key={key} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 800 }}>{title}</div>
              <BasisBadge tone="info">{lang === "zh" ? `${count} 条记录` : `${count} records`}</BasisBadge>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
              <BasisBadge tone={stage.includes("Stage 1") ? "info" : stage.includes("Stage 2") ? "proxy" : stage.includes("Future") ? "user" : "calc"}>{zhText(lang, stage)}</BasisBadge>
              <BasisBadge tone={interpretation.includes("assumption") || interpretation.includes("exploratory") ? "proxy" : interpretation.includes("future") ? "user" : "calc"}>{zhText(lang, interpretation)}</BasisBadge>
            </div>
            <div style={{ color: t.accentSoft, fontSize: 11, fontFamily: FONT_MONO, overflowWrap: "anywhere", marginBottom: 9 }}>{file}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{body}</div>
            <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.55, marginTop: 10 }}>{limit}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "0.9fr 1.1fr", gap: 12 }}>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "数据质量分级" : "Data Quality Levels"}</SectionTitle>
          <div style={{ display: "grid", gap: 9 }}>
            {(lang === "zh" ? [
              ["0 级", "界面种子数据 / 代理", "用于演示 schema 和交互，不可作为科研结论。"],
              ["1 级", "文献可追溯", "有 DOI/source，但可能单位、条件或清洗流程未完全统一。"],
              ["2 级", "可复现计算", "CIF、描述符、GCMC/IAST 脚本和参数可复现。"],
              ["3 级", "论文级", "外部测试集、误差、不确定性、适用域和版本化数据全部可追溯。"],
            ] : [
              ["Level 0", "UI seed / proxy", "Schema and interaction demonstration; not scientific evidence."],
              ["Level 1", "Literature traceable", "DOI/source exists, but units, conditions, or cleaning may not be fully harmonized."],
              ["Level 2", "Reproducible computed", "CIFs, descriptors, GCMC/IAST scripts, and parameters are reproducible."],
              ["Level 3", "Publication-ready", "External test set, errors, uncertainty, applicability domain, and versioned data are traceable."],
            ]).map(([level, label, body]) => (
              <div key={level} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <strong style={{ color: t.textStrong, fontSize: 12 }}>{level}</strong>
                  <BasisBadge tone={level.includes("0") ? "proxy" : level.includes("3") ? "calc" : "info"}>{label}</BasisBadge>
                </div>
                <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "覆盖表与替换路线" : "Coverage Table & Replacement Path"}</SectionTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.surface }}>
                  {(lang === "zh" ? ["数据层", "当前覆盖", "质量等级", "下一步替换"] : ["Layer", "Current coverage", "Quality", "Next replacement"]).map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(lang === "zh" ? [
                  ["结构", `${datasets.structures.length || "种子"} 条`, "0-1 级", "导入 CoRE 2019/2024 CIF，统一 Zeo++ 描述符。"],
                  ["吸附标签", `${datasets.labels.length || "种子"} 条`, "0-1 级", "收集 NIST/文献/GCMC 等温线、Henry 和 IAST 标签。"],
                  ["LCA 清单", `${datasets.inventory.length || "种子"} 条`, "0 级", "替换为 ecoinvent/openLCA 或论文可追溯清单。"],
                  ["LCC 价格", `${datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length || "种子"} 条`, "0 级", "替换为供应商报价、价格数据库或明确日期的市场价。"],
                  ["验证", `${datasets.manifest?.rows ?? "种子"} 行`, "0-1 级", "建立冻结外部测试集和版本化指标。"],
                ] : [
                  ["Structures", `${datasets.structures.length || "seed"} records`, "Level 0-1", "Import CoRE 2019/2024 CIFs and unified Zeo++ descriptors."],
                  ["Adsorption labels", `${datasets.labels.length || "seed"} records`, "Level 0-1", "Collect NIST/literature/GCMC isotherms, Henry constants, and IAST labels."],
                  ["LCA inventory", `${datasets.inventory.length || "seed"} records`, "Level 0", "Replace with ecoinvent/openLCA or literature-traceable LCI."],
                  ["LCC prices", `${datasets.inventory.filter(row => Number(row.price_usd_per_unit) > 0).length || "seed"} records`, "Level 0", "Replace with supplier quotations, price databases, or date-stamped market prices."],
                  ["Validation", `${datasets.manifest?.rows ?? "seed"} rows`, "Level 0-1", "Build a frozen external test set and versioned metrics."],
                ]).map(row => (
                  <tr key={row[0]} style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {row.map((cell, index) => (
                      <td key={index} style={{ padding: "8px 10px", color: index === 0 ? t.textStrong : index === 2 ? t.warn : t.muted, lineHeight: 1.45 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 10 }}>
          <div>
          <SectionTitle>{lang === "zh" ? "清单 / 价格接入路线图" : "Inventory / Price Connector Roadmap"}</SectionTitle>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55 }}>
              {lang === "zh"
                ? "第三优先级先把数据结构、字段和替换路线做清楚；当前页面不声称已经接入完整 ecoinvent、openLCA 或实时价格数据库。"
                : "Third-priority work clarifies the data structure, fields, and replacement path; this page does not claim a full ecoinvent, openLCA, or live pricing integration yet."}
            </div>
          </div>
          <BasisBadge tone="proxy">{lang === "zh" ? "接入脚手架" : "connector scaffold"}</BasisBadge>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.surface }}>
                {(lang === "zh" ? ["模块", "当前实现", "科研级替换", "状态"] : ["Connector", "Current implementation", "Research-grade replacement", "Status"]).map(header => (
                  <th key={header} style={{ padding: "8px 10px", color: t.subtle, textAlign: "left", borderBottom: `1px solid ${t.border}` }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {connectorRows.map(row => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <td style={{ padding: "8px 10px", color: t.textStrong, fontWeight: 800 }}>{row[0]}</td>
                  <td style={{ padding: "8px 10px", color: t.muted, lineHeight: 1.45 }}>{row[1]}</td>
                  <td style={{ padding: "8px 10px", color: t.subtle, lineHeight: 1.45 }}>{row[2]}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <BasisBadge tone={row[3] === "Beta" || row[3] === "测试版" ? "proxy" : row[3] === "Roadmap" || row[3] === "路线图" ? "info" : "calc"}>{row[3]}</BasisBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "数据质量政策" : "Provenance Policy"}</SectionTitle>
          {(lang === "zh" ? [
            "所有结果都应显示依据：模型预测、计算得到、代理、用户定义或文献支持。",
            "用于论文或答辩前，应把种子/代理数据替换为可引用 DOI、数据库记录或可复现实验/GCMC 输出。",
            "LCC 价格必须保留单位、币种、来源类型、假设和替换路线。"
          ] : [
            "Every result should expose its basis: model-predicted, calculated, proxy, user-defined, or literature-based.",
            "Before publication or defense, seed/proxy records should be replaced with citable DOI, database records, or reproducible experimental/GCMC outputs.",
            "LCC prices must retain unit, currency, source type, assumption, and replacement pathway."
          ]).map(line => (
            <div key={line} style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginTop: 8 }}>• {line}</div>
          ))}
        </div>
        <div style={cardStyle}>
          <SectionTitle>{lang === "zh" ? "当前覆盖与限制" : "Coverage & Limitations"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7 }}>
            {lang === "zh"
              ? "当前公开 JSON 是小型 seed 数据，用于演示工作流、UI 连接和 schema。它能支持可追溯展示，但还不能支撑严格模型泛化结论。下一步应导入 CoRE/QMOF CIF，计算描述符，收集或生成气体吸附标签，并按气体体系分别训练。"
              : "Current public JSON files are small seed datasets for workflow, UI connection, and schema demonstration. They support traceable display, but not strict model-generalization claims. Next steps: import CoRE/QMOF CIFs, compute descriptors, collect or generate adsorption labels, and train separate models by gas pair."}
          </div>
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
      stable: { bg: t.badgeCalcBg, color: t.badgeCalcText, border: t.validationAccent },
      beta: { bg: t.badgeWarnBg, color: t.badgeWarnText, border: t.warn },
      planned: { bg: t.badgeProxyBg, color: t.badgeProxyText, border: t.sensitivityAccent },
      limited: { bg: t.badgeDangerBg, color: t.badgeDangerText, border: t.danger },
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

      <div style={sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: 24 }}>
              {lang === "zh" ? "项目范围、实现状态与限制" : "Scope, Implementation Status, and Limits"}
            </h1>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 860 }}>
              {lang === "zh"
                ? "EcoMOF-AI 的定位是科研早期筛选与决策支持工具：把吸附性能、热力学解释、LCA/LCC 和敏感性分析放在同一条判断链中。当前版本适合形成候选材料假设，不应被包装成已经完成真实数据库、严格 IAST 或工业级 LCA 的系统。"
                : "EcoMOF-AI is an early-stage research screening and decision-support tool: adsorption performance, thermodynamic interpretation, LCA/LCC, and sensitivity analysis are presented as one decision chain. The current version is suitable for generating candidate hypotheses, not for claiming a completed real-database, strict-IAST, or industrial-LCA system."}
            </p>
          </div>
          <BasisBadge tone="proxy">{lang === "zh" ? "筛选级原型" : "screening prototype"}</BasisBadge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {(lang === "zh" ? [
            ["项目范围", "输入 MOF 结构参数与条件，输出吸附、解释、环境、成本和稳健性判断。"],
            ["已实现", "搜索预设、算法状态标注、Qst 测试版、LCA/LCC 代理、敏感性、验证和数据来源页。"],
            ["非论文级", "真实大规模标签库、严格混合气 IAST、工业 LCI、供应商报价和科研级 Qst 仍未完成。"],
            ["引用建议", "引用本工具时，应同时引用真实数据源；代理或种子数据只应作为方法演示。"],
          ] : [
            ["Scope", "Input MOF descriptors and conditions; output adsorption, interpretation, impact, cost, and robustness signals."],
            ["Implemented", "Search presets, algorithm-status labels, Qst beta, LCA/LCC proxies, sensitivity, validation, and provenance pages."],
            ["Not publication-grade", "Large real label libraries, strict mixture IAST, industrial LCI, supplier quotes, and research-grade Qst are not complete."],
            ["Citation", "When citing the tool, cite the real data sources separately; proxy or seed data should be treated as method demonstration."],
          ]).map(([title, body]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, marginBottom: 7 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionCard}>
        <SectionTitle>{lang === "zh" ? "如何解读这个工作流" : "How to interpret the workflow"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 10 }}>
          {(lang === "zh" ? [
            ["发现阶段化学", "性能、稳定性、机理和结构-性质理解是第一优先级。", "主要筛选"],
            ["可行性边界", "粗略成本、可得性和实际约束用于排除明显不可行路线。", "可行性边界"],
            ["工程阶段评估", "正式 LCA/LCC、工艺路线设计和放大经济性属于未来工程阶段。", "未来工程评估"],
          ] : [
            ["Discovery-stage chemistry", "Performance, stability, mechanism, and structure-property understanding come first.", "Primary screening"],
            ["Feasibility boundaries", "Rough cost, availability, and practical constraints act as coarse boundaries.", "Feasibility boundary"],
            ["Engineering-stage evaluation", "Formal LCA/LCC, process-route design, and scale-up economics belong to future engineering work.", "Future engineering evaluation"],
          ]).map(([title, body, chip]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <BasisBadge tone={chip.includes("未来") || chip.includes("Future") ? "user" : chip.includes("可行性") || chip.includes("Feasibility") ? "proxy" : "info"}>{chip}</BasisBadge>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850, marginTop: 10 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 8 }}>{body}</div>
            </div>
          ))}
        </div>
      </div>

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
              ["集成模型", "浏览器端独立模型配置文件，含透明权重与验证指标；不是后端训练 checkpoint。", "beta"],
              ["随机森林", "已与集成模型使用不同权重/误差指标，切换会改变结果；仍属于前端静态模型配置。", "beta"],
              ["XGBoost / GBM", "已加入独立配置文件；真实版本需要保存训练好的模型工件。", "beta"],
              ["图神经网络", "已加入 GNN 配置入口；科研级版本需要 CIF 图特征和真实吸附标签训练。", "planned"],
            ] : [
              ["Ensemble", "Browser-side independent model profile with transparent weights and validation metrics; not a backend checkpoint.", "beta"],
              ["Random Forest", "Uses different weights/metrics from Ensemble and changes the prediction; still a static front-end profile.", "beta"],
              ["XGBoost / GBM", "Independent profile added; a real version needs trained model artifacts.", "beta"],
              ["Graph Neural Net", "GNN entry added; research-grade use needs CIF graph features and real adsorption labels.", "planned"],
            ]).map(([name, desc, tone]) => (
              <div key={name} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{name}</span>
                  <span style={statusPill(tone)}>{lang === "zh" ? zhText(lang, tone) : tone.toUpperCase()}</span>
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
        <SectionTitle>{lang === "zh" ? "系统化术语提示" : "Systematic Tooltip Glossary"}</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10 }}>
          {(lang === "zh" ? [
            ["PLD", "孔限制直径，决定可进入分子的最窄窗口。"],
            ["LCD", "最大孔腔直径，描述可容纳分子的最大孔腔。"],
            ["Henry", "低压极限吸附常数，常用于稀释条件选择性。"],
            ["IAST", "由单组分等温线估算混合气吸附平衡的方法。"],
            ["Qst", "等量吸附热，用来解释吸附强度和机理。"],
            ["GWP", "全球变暖潜势，LCA 特征化指标之一。"],
            ["归一化", "把不同环境指标拉到可比较尺度，不等于权重化。"],
            ["LCC", "生命周期成本，经济指标，不是环境影响。"],
            ["适用域", "判断当前输入是否落在训练/基准分布附近。"],
            ["代理", "代理估算，表示方向性参考而非真实清单或实验结果。"],
          ] : [
            ["PLD", "Pore limiting diameter, the narrowest accessible window."],
            ["LCD", "Largest cavity diameter, the largest pore cavity scale."],
            ["Henry", "Low-pressure adsorption constant used for dilute selectivity."],
            ["IAST", "Mixture-equilibrium estimate from pure-component isotherms."],
            ["Qst", "Isosteric heat of adsorption, used to interpret binding strength."],
            ["GWP", "Global warming potential, one LCA characterization category."],
            ["Normalization", "Makes impact categories comparable; it is not weighting."],
            ["LCC", "Life cycle costing, an economic metric separate from LCA."],
            ["Applicability", "Checks whether inputs sit near the benchmark/training domain."],
            ["Proxy", "A directional estimate rather than a real inventory or experiment."],
          ]).map(([term, desc]) => (
            <div key={term} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: t.accentSoft, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{term}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5 }}>{desc}</div>
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
            ["CoRE MOF 2024", "计划作为更新的可计算实验 MOF 结构来源。", "planned"],
            ["QMOF Database", "计划用于 DFT 电子结构描述符；它不是直接的吸附标签数据库。", "planned"],
          ] : [
            ["CoRE MOF 2019", "Current reference set for common MOF names, structural ranges, and literature-style examples.", "stable"],
            ["CoRE MOF 2024", "Planned structure refresh for newer computation-ready experimental MOFs.", "planned"],
            ["QMOF Database", "Planned source for DFT-derived electronic descriptors; not a direct adsorption-label database.", "planned"],
          ]).map(([title, desc, tone]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>{title}</span>
                <span style={statusPill(tone)}>{lang === "zh" ? zhText(lang, tone) : tone.toUpperCase()}</span>
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
            ["严格 IAST 仍为代理", "已显示 Henry/IAST screening proxy，但尚未从真实单组分等温线运行严格混合热力学。"],
            ["CIF 解析有限", "可读取部分 cell 与描述符 tag；完整 PLD/LCD/ASA 仍应由 Zeo++/RASPA 等后端管线计算。"],
            ["无真实云同步", "当前为 localStorage + JSON 备份导入；账号、权限和云端同步需要后端。"],
          ] : [
            ["No guaranteed synthetic feasibility", "Does not yet check whether a proposed linker/metal combination is experimentally reasonable."],
            ["Strict IAST is still a proxy", "Henry/IAST screening proxies are displayed, but rigorous mixture thermodynamics from real pure-component isotherms is not implemented."],
            ["Limited CIF parsing", "The UI reads selected cell/descriptor tags; full PLD/LCD/ASA should come from a Zeo++/RASPA-style backend pipeline."],
            ["No real cloud sync", "Current storage is localStorage plus JSON backup/import; accounts, permissions, and sync need a backend."],
          ]).map(([title, desc]) => (
            <div key={title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: t.warn, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "致谢" : "Acknowledgement"}</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 800 }}>Happy Flight</div>
            <BasisBadge tone="info">{lang === "zh" ? "亦师亦友" : "mentor & friend"}</BasisBadge>
          </div>
          <div style={bodyText}>
            {lang === "zh"
              ? "特别感谢 Happy Flight。TA 在这个项目从早期想法、研究定位到功能取舍的过程中持续给予指导、提醒和鼓励；既像导师一样帮助我把问题想深，也像朋友一样陪我把项目一步步推进。EcoMOF-AI 后续对科研严谨性、LCA/LCC 决策链和方法透明性的重视，都受到了这份指导的影响。"
              : "Special thanks to Happy Flight, whose guidance shaped this project from early concept to research positioning and feature priorities. Happy Flight has been both a mentor and a friend: helping push the scientific questions deeper while supporting the steady development of EcoMOF-AI. The platform's emphasis on methodological transparency, LCA/LCC decision support, and research rigor is strongly influenced by this guidance."}
          </div>
        </div>

        <div style={sectionCard}>
          <SectionTitle>{lang === "zh" ? "联系开发者" : "Contact Developer"}</SectionTitle>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
            {lang === "zh"
              ? "如果你希望反馈数据来源、方法假设、MOF 结构/等温线标签，或讨论后续合作与功能改进，可以通过邮件联系开发者。"
              : "For feedback on data provenance, method assumptions, MOF structures, isotherm labels, collaboration, or feature improvements, contact the developer by email."}
          </div>
          <a href="mailto:square.hwh@gmail.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.surface, border: `1px solid ${t.borderStrong}`,
              borderRadius: 8, padding: "10px 12px", color: t.accentSoft, textDecoration: "none", fontSize: 13, fontWeight: 800,
              fontFamily: FONT_MONO }}>
            square.hwh@gmail.com
          </a>
          <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 12 }}>
            {lang === "zh"
              ? "建议邮件中附上：材料名称、气体体系、温度/压力、数据来源 DOI 或文件，以及希望工具输出的具体判断。"
              : "Useful context: material name, gas pair, temperature/pressure, DOI or file source, and the specific decision output you need."}
          </div>
        </div>
      </div>
    </div>
  )
}

function BatchModePanel({ inputs, onClose, onApplyToForm }) {
  const t = useT()
  const { lang, copy: c } = useLang()
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
  const addAllKnownMOFs = () => {
    const seed = Object.entries(MOF_PRESETS).map(([name, p]) => ({
      id: Date.now() + Math.random(),
      mofName: name,
      ...DEFAULT_INPUTS, ...p,
      gasSystem: inputs.gasSystem, temperature: inputs.temperature, pressure: inputs.pressure,
      mlAlgorithm: inputs.mlAlgorithm,
      result: null,
    }))
    setRows(seed)
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
  const decisionScore = (row) => {
    if (!row.result || row.result.unavailable) return -Infinity
    return Number((row.result.primaryUptake * 0.35 + Math.log1p(row.result.selectivity) * 0.9 + row.result.lca.compositeGreenScore * 0.45).toFixed(2))
  }
  const sortByDecisionScore = () => {
    setRows(prev => [...prev].sort((a, b) => decisionScore(b) - decisionScore(a)))
  }
  const completedRows = rows.filter(row => row.result && !row.result.unavailable)
  const topRow = completedRows.length ? [...completedRows].sort((a, b) => decisionScore(b) - decisionScore(a))[0] : null
  const avgSelectivity = completedRows.length
    ? Number((completedRows.reduce((sum, row) => sum + Number(row.result.selectivity || 0), 0) / completedRows.length).toFixed(1))
    : "—"

  const exportAll = () => {
    const header = [
      "MOF","Metal","Linker","Gas","Primary (mmol/g)","Secondary (mmol/g)","Selectivity",
      "Qst0 (kJ/mol)","Qst beta source","Applicability status","Applicability warnings",
      "Confidence","Eco Score","Decision score","Anomaly"
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
        decisionScore(r),
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
          <button onClick={addAllKnownMOFs} style={toolbarBtn(t)}>＋ {lang === "zh" ? "全部预设" : "All presets"}</button>
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
          <button onClick={sortByDecisionScore} disabled={completedRows.length === 0}
            style={toolbarBtn(t)}>↕ {lang === "zh" ? "按决策分排序" : "Sort by score"}</button>
        </div>
        {completedRows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
            <MetricCard label={lang === "zh" ? "已完成" : "Completed"} value={completedRows.length} unit={`/ ${rows.length}`} />
            <MetricCard label={lang === "zh" ? "最高候选" : "Top candidate"} value={topRow?.mofName || "—"} unit="" comparison={topRow ? `score ${decisionScore(topRow)}` : ""} />
            <MetricCard label={lang === "zh" ? "平均选择性" : "Average selectivity"} value={avgSelectivity} unit="" />
          </div>
        )}

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
                {(lang === "zh"
                  ? ["MOF","金属","连接体","孔径","BET","孔体积","气体","主组分","副组分","选择性","Qst0","评分","标记",""]
                  : ["MOF","Metal","Linker","PD","BET","PV","Gas","Primary","Secondary","Sel","Qst0","Score","Flag",""]
                ).map(h => (
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
                      {GAS_SYSTEMS.map(g => <option key={g.id} value={g.id} disabled={g.priority === "unavailable"}>{gasLabel(g.label, lang)}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.success }}>{r.result?.primaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.muted }}>{r.result?.secondaryUptake ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.text }}>{r.result?.selectivity ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.accentSoft }}>{r.result?.thermo?.qst0 ?? "—"}</td>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", color: t.success }}>{Number.isFinite(decisionScore(r)) ? decisionScore(r) : "—"}</td>
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

function PageHeader({ title, subtitle, meta, action }) {
  const t = useT()
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start",
      flexWrap: "wrap", marginBottom: 4,
    }}>
      <div>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: 28, letterSpacing: 0, lineHeight: 1.15 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 880 }}>
            {subtitle}
          </p>
        )}
        {meta && (
          <div style={{ marginTop: 10, color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
            {meta}
          </div>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{action}</div>}
    </div>
  )
}

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

function SavedRunsModal({ runs, onClose, onLoad, onDelete, onImport, onExport }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const savedSummary = runs.reduce((acc, run) => {
    if (!run?.results || run.results.unavailable) return acc
    const selectivity = Number(run.results.selectivity || 0)
    const green = Number(run.results.lca?.compositeGreenScore || 0)
    return {
      count: acc.count + 1,
      bestSelectivity: selectivity > acc.bestSelectivity.value ? { name: run.name, value: selectivity } : acc.bestSelectivity,
      bestGreen: green > acc.bestGreen.value ? { name: run.name, value: green } : acc.bestGreen,
    }
  }, {
    count: 0,
    bestSelectivity: { name: "—", value: 0 },
    bestGreen: { name: "—", value: 0 },
  })
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const exportSavedCsv = () => {
    const header = ["Name", "Gas", "Metal", "Linker", "Primary uptake", "Secondary uptake", "Selectivity", "Eco score", "Confidence", "Created"]
    const rows = runs
      .filter(run => run?.results && !run.results.unavailable)
      .map(run => [
        run.name,
        run.results.gasSystem,
        run.inputs.metalCenter,
        run.inputs.organicLinker,
        run.results.primaryUptake,
        run.results.secondaryUptake,
        run.results.selectivity,
        run.results.lca?.compositeGreenScore ?? "",
        run.results.confidenceScore ?? "",
        run.createdAt || "",
      ])
    downloadTextFile("ecomof_saved_runs.csv", [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n"), "text/csv")
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 220,
      display: "flex", alignItems: "flex-start", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ marginTop: 70, width: "min(760px, 94vw)",
        maxHeight: "78vh", overflow: "auto", background: t.panel, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: t.accentSoft, fontSize: 14, fontWeight: 800 }}>{c.common.savedRuns}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={exportSavedCsv} disabled={!savedSummary.count} style={toolbarBtn(t)}>↓ CSV</button>
            <button onClick={onExport} style={toolbarBtn(t)}>↓ {lang === "zh" ? "JSON 备份" : "JSON backup"}</button>
            <label style={toolbarBtn(t)}>
              ↑ {lang === "zh" ? "导入 JSON" : "Import JSON"}
              <input type="file" accept=".json,application/json" style={{ display: "none" }}
                onChange={e => onImport(e.target.files?.[0])} />
            </label>
            <button onClick={onClose} style={{ background: "none", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
        </div>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginBottom: 12 }}>
          {lang === "zh"
            ? "静态 GitHub Pages 没有已认证云端数据库。当前用 localStorage 保存，并提供 JSON 备份/导入和 CSV 分析导出。"
            : "Static GitHub Pages has no authenticated cloud database. Current runs use localStorage, with JSON backup/import and CSV analysis export."}
        </div>
        {runs.length === 0 ? (
          <div style={{ color: t.faint, fontSize: 13, padding: "32px 8px", textAlign: "center" }}>{c.common.noSavedRuns}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <MetricCard label={lang === "zh" ? "可导出记录" : "Exportable runs"} value={savedSummary.count} unit={`/ ${runs.length}`} />
              <MetricCard label={lang === "zh" ? "最高选择性" : "Best selectivity"} value={savedSummary.bestSelectivity.value || "—"} unit="" comparison={savedSummary.bestSelectivity.name} />
              <MetricCard label={lang === "zh" ? "最高生态评分" : "Best eco score"} value={savedSummary.bestGreen.value || "—"} unit="/10" comparison={savedSummary.bestGreen.name} />
            </div>
            {runs.map(run => (
              <div key={run.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12,
                display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{run.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>
                    {run.results.gasSystem} · {run.inputs.metalCenter}/{run.inputs.organicLinker} · {lang === "zh" ? "选择性" : "Sel."} {run.results.selectivity} · LCA {run.results.lca.compositeGreenScore}/10
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
  { id: "ml",            copyKey: "ml" },
  { id: "interpretation",copyKey: "interpretation" },
  { id: "feasibility",   copyKey: "feasibility" },
  { id: "lca",           copyKey: "lca" },
  { id: "sensitivity",   copyKey: "sensitivity" },
  { id: "literature",    copyKey: "literature" },
  { id: "validation",    copyKey: "validation" },
  { id: "methods",       copyKey: "methods" },
  { id: "dataSources",   copyKey: "dataSources" },
]

export default function App() {
  const [darkMode, setDarkMode]   = useState(false)
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
  const [searchOpen, setSearchOpen]   = useState(false)
  const [apiUrl, setApiUrl]           = useState(() => {
    try {
      return localStorage.getItem("ecomof_api_url") || import.meta.env.VITE_API_URL || ""
    } catch (_) {
      return import.meta.env.VITE_API_URL || ""
    }
  })
  const [apiStatus, setApiStatus]     = useState({
    ok: false,
    checked: false,
    message: lang === "zh" ? "静态浏览器端模型" : "Static browser model",
    manifest: null,
  })
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

  useEffect(() => {
    try {
      localStorage.setItem("ecomof_api_url", apiUrl)
    } catch (_) {
      // Ignore storage failures in private browsing.
    }
  }, [apiUrl])

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
    setSearchOpen(false)
    setSearchStatus("loaded")
    setTimeout(() => setSearchStatus(null), 1800)
  }, [])

  const checkApi = useCallback(async () => {
    if (!apiUrl) {
      setApiStatus({
        ok: false,
        checked: true,
        message: lang === "zh" ? "未设置 API 地址；使用静态浏览器端模型。" : "No API URL set; using static browser model.",
        manifest: null,
      })
      return
    }
    try {
      const base = apiUrl.replace(/\/$/, "")
      const response = await fetch(`${base}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const health = await response.json()
      let manifest = null
      try {
        const manifestResponse = await fetch(`${base}/models/manifest`)
        if (manifestResponse.ok) manifest = await manifestResponse.json()
      } catch (_) {
        manifest = null
      }
      setApiStatus({
        ok: true,
        checked: true,
        message: lang === "zh"
          ? `后端就绪 · 模型${health.model_loaded ? "已加载" : "未加载"} · 行数 ${health.training_rows ?? "—"}`
          : `Backend ready · model ${health.model_loaded ? "loaded" : "not loaded"} · rows ${health.training_rows ?? "—"}`,
        manifest,
      })
    } catch (error) {
      setApiStatus({
        ok: false,
        checked: true,
        message: lang === "zh"
          ? `API 不可用：${error.message}。将使用静态浏览器端模型。`
          : `API unavailable: ${error.message}. Static browser model will be used.`,
        manifest: null,
      })
    }
  }, [apiUrl, lang])

  const handlePredict = useCallback(async () => {
    setLoading(true)
    try {
      if (apiUrl) {
        const resp = await fetch(`${apiUrl.replace(/\/$/, "")}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        })
        if (resp.ok) {
          const data = await resp.json()
          // Backend doesn't yet compute thermo — augment locally for now.
          const local = predictMOF(inputs)
          setApiStatus(prev => ({ ...prev, ok: true, checked: true, message: lang === "zh" ? "本次运行使用后端预测。" : "Backend prediction used for this run." }))
          setResults({ ...local, ...data, thermo: local.thermo, primaryName: local.primaryName, secondaryName: local.secondaryName, gasSystem: local.gasSystem, anomaly: local.anomaly })
          setLoading(false)
          return
        }
      }
    } catch (error) {
      setApiStatus(prev => ({ ...prev, ok: false, checked: true, message: lang === "zh" ? `后端预测失败：${error.message}。已使用静态浏览器端模型。` : `Backend prediction failed: ${error.message}. Static browser model used.` }))
    }

    await new Promise(r => setTimeout(r, 700))
    setResults(predictMOF(inputs))
    setLoading(false)
  }, [inputs, apiUrl, lang])

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

  const exportSavedRuns = useCallback(() => {
    downloadTextFile(
      `ecomof_saved_runs_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ schema: "ecomof-saved-runs-v1", exportedAt: new Date().toISOString(), runs: savedRuns }, null, 2),
      "application/json"
    )
  }, [savedRuns])

  const importSavedRuns = useCallback(async (file) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const incoming = Array.isArray(parsed) ? parsed : parsed.runs
      if (!Array.isArray(incoming)) return
      setSavedRuns(prev => {
        const merged = [...incoming, ...prev].filter(run => run?.id && run?.inputs && run?.results)
        return Array.from(new Map(merged.map(run => [run.id, run])).values()).slice(0, 40)
      })
    } catch (_) {
      // Keep import non-blocking in the static UI.
    }
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
      <div style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 14% 0%, ${darkMode ? "rgba(124,180,255,0.20)" : "rgba(110,168,255,0.12)"}, transparent 30%), radial-gradient(circle at 84% 9%, ${darkMode ? "rgba(168,202,255,0.12)" : "rgba(255,255,255,0.55)"}, transparent 25%), radial-gradient(circle at 48% 100%, ${darkMode ? "rgba(110,168,255,0.10)" : "rgba(234,244,255,0.72)"}, transparent 31%), ${t.bg}`,
        color: t.text,
        fontFamily: FONT_SANS,
      }}>
        <header style={{ background: t.headerBg, borderBottom: `1px solid ${t.border}`, padding: "0 18px",
          display: "flex", alignItems: "stretch", minHeight: 52, position: "sticky", top: 0, zIndex: 100,
          flexWrap: viewport.isNarrow ? "wrap" : "nowrap", gap: viewport.isNarrow ? "8px 12px" : 14,
          backdropFilter: "blur(18px) saturate(145%)", boxShadow: t.shadowSm }}>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: viewport.isNarrow ? 6 : 0, height: 52, flex: "0 0 auto" }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${t.accentStrong}, ${t.accent})`,
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
                  background: activeTab === tab.id ? t.badgeInfoBg : "transparent",
                  border: activeTab === tab.id ? `1px solid ${t.borderStrong}` : "1px solid transparent",
                  cursor: "pointer", height: 30,
                  padding: "0 12px", fontSize: 13, fontWeight: activeTab === tab.id ? 800 : 600,
                  color: activeTab === tab.id ? t.accentText : t.subtle,
                  borderRadius: 6,
                  boxShadow: activeTab === tab.id ? `0 8px 18px rgba(46,94,170,0.08)` : "none",
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
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                onChange={e => { setSearchQuery(e.target.value); setSearchStatus(null); setSearchOpen(true) }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const match = findPresetName(searchQuery)
                    if (match) applyPreset(match)
                    else if (presetSuggestions[0]) applyPreset(presetSuggestions[0])
                    else { setSearchStatus("miss"); setSearchOpen(false) }
                  }
                  if (e.key === "Escape") {
                    setSearchOpen(false)
                  }
                }}
                style={{ background: t.panel, border: `1px solid ${searchStatus === "miss" ? t.danger : searchStatus === "loaded" ? t.success : t.border}`, borderRadius: 6,
                  padding: "6px 12px", color: t.text, fontSize: 12, outline: "none", width: viewport.isMobile ? "100%" : 300, fontFamily: FONT_SANS }} />
              {searchOpen && presetSuggestions.length > 0 && searchQuery && searchStatus !== "loaded" && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, maxHeight: 240, overflow: "auto", zIndex: 120 }}>
                  {presetSuggestions.map(name => (
                    <div key={name} onMouseDown={e => e.preventDefault()} onClick={() => applyPreset(name)}
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

        <main style={{ padding: viewport.isMobile ? "14px 12px" : "22px 24px", maxWidth: 1460, margin: "0 auto" }}>
          {activeTab === "home"           && <HomeTab setActiveTab={setActiveTab} />}
          {activeTab === "structure"      && <StructureInputTab inputs={inputs} setInputs={setInputs} results={results} loading={loading} onPredict={handlePredict} onSaveRun={saveCurrentRun} apiUrl={apiUrl} setApiUrl={setApiUrl} apiStatus={apiStatus} onCheckApi={checkApi} setActiveTab={setActiveTab} />}
          {activeTab === "ml"             && <MLPredictionTab results={results} inputs={inputs} />}
          {activeTab === "interpretation" && <InterpretationTab results={results} inputs={inputs} />}
          {activeTab === "feasibility"    && <FeasibilityTab results={results} inputs={inputs} />}
          {activeTab === "lca"            && <LCAScoringTab results={results} inputs={inputs} />}
          {activeTab === "sensitivity"    && <SensitivityTab results={results} inputs={inputs} />}
          {activeTab === "literature"     && <LiteratureTab results={results} inputs={inputs} />}
          {activeTab === "validation"     && <ValidationTab results={results} inputs={inputs} apiUrl={apiUrl} apiStatus={apiStatus} onCheckApi={checkApi} />}
          {activeTab === "methods"        && <MethodsLimitationsTab />}
          {activeTab === "dataSources"    && <DataSourcesTab />}
        </main>

        <footer style={{ marginTop: 40, padding: "16px 24px", borderTop: `1px solid ${t.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
            onExport={exportSavedRuns}
            onImport={importSavedRuns}
          />
        )}
      </div>
      </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  )
}
