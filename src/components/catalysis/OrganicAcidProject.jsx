import { useEffect, useMemo, useState } from "react"
import { FONT_MONO, fetchDataJson, toolbarBtn, useViewport } from "../../shared"
import {
  AceticAcidStructure,
  FormaldehydeStructure,
  FormicAcidStructure,
  FructoseStructure,
  GlucoseStructure,
  GlyceraldehydeStructure,
  GlycolicAcidStructure,
  LacticAcidStructure,
  MoleculeNode,
  PyruvaldehydeStructure,
  PyruvicAcidStructure,
} from "./ChemicalStructure"
import {
  calculateGateScore,
  calculateRGFAScore,
  calculateSelectivityFactor,
  calculateStepScore,
  classifyCandidate,
  generateCandidateExplanation,
  safeNumber,
} from "../../utils/rgfaScore"

const ACCESS_KEY = "ecomof_organic_acid_project_access"
const PROJECT_PASSWORD = "acid"

const palette = {
  bg: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceStrong: "#F1F5F9",
  border: "#D9E2EC",
  borderStrong: "#B8C5D4",
  text: "#0F172A",
  muted: "#475569",
  faint: "#64748B",
  accent: "#1A6DB5",
  accentSoft: "#E8F2FC",
  positive: "#147C43",
  positiveSoft: "#F2FBF6",
  mixed: "#A15C13",
  mixedSoft: "#FFF7ED",
  risk: "#8F3B1B",
  riskSoft: "#FFF1E8",
}

const PATHWAY_LABELS = {
  formaldehyde_to_formic_acid: "Formaldehyde → formic acid",
  glyceraldehyde_to_formic_acid: "Glyceraldehyde → formic acid",
  glyceraldehyde_to_acetic_acid: "Glyceraldehyde → acetic acid",
  glyceraldehyde_to_glycolic_acid: "Glyceraldehyde → glycolic acid",
  pyruvaldehyde_to_lactic_acid: "Pyruvaldehyde → lactic acid",
  pyruvaldehyde_to_pyruvic_acid: "Pyruvaldehyde → pyruvic acid",
}

const descriptorGroups = [
  {
    category: "Stability descriptors",
    descriptors: ["water stability", "hydrothermal stability", "metal leaching risk", "post-reaction PXRD retention"],
  },
  {
    category: "Accessibility descriptors",
    descriptors: ["PLD", "LCD", "pore volume", "hydrophilic pore environment"],
  },
  {
    category: "Active-site descriptors",
    descriptors: ["metal type", "valence state", "Lewis acidity", "basic sites", "open metal sites"],
  },
  {
    category: "Functional-group descriptors",
    descriptors: ["-NH2", "-OH", "-COOH", "defects", "Zr-OH", "Fe-OH"],
  },
  {
    category: "Reaction descriptors",
    descriptors: ["Eads(HCO3-)", "Eads(formaldehyde)", "Eads(glyceraldehyde)", "Eads(pyruvaldehyde)", "Eads(formate)"],
  },
  {
    category: "Product descriptors",
    descriptors: ["Y_FA", "S_FA_C", "Y_lactic", "Y_acetic", "Y_glycolic", "Y_pyruvic", "Y_solid"],
  },
]

const mappingRows = [
  {
    title: "Formaldehyde → Formic acid",
    route: "primary C1 positive route",
    body: "Contributes to A3 and SelectivityFactor.",
    tone: palette.positive,
    bg: palette.positiveSoft,
  },
  {
    title: "Glyceraldehyde → Formic acid",
    route: "mixed route, positive branch",
    body: "Contributes to A2/A3.",
    tone: palette.mixed,
    bg: palette.mixedSoft,
  },
  {
    title: "Glyceraldehyde → Glycolic acid / Acetic acid",
    route: "mixed route, C2 byproduct branch",
    body: "Increases B1.",
    tone: palette.mixed,
    bg: palette.mixedSoft,
  },
  {
    title: "Pyruvaldehyde → Formic acid",
    route: "possible positive branch",
    body: "Possible positive branch but lower priority.",
    tone: palette.risk,
    bg: palette.riskSoft,
  },
  {
    title: "Pyruvaldehyde → Lactic acid / Pyruvic acid / Acetic acid",
    route: "risk-dominant branch",
    body: "Increases B1 and lowers SelectivityFactor.",
    tone: palette.risk,
    bg: palette.riskSoft,
  },
]

const pathwayMeta = {
  formaldehyde: {
    id: "formaldehyde",
    label: "Path 1",
    title: "Formaldehyde → Formic acid",
    subtitle: "primary positive route",
    color: palette.positive,
    soft: palette.positiveSoft,
    focusNode: "formaldehyde",
  },
  glyceraldehyde: {
    id: "glyceraldehyde",
    label: "Path 2",
    title: "Glyceraldehyde branches",
    subtitle: "mixed route",
    color: palette.mixed,
    soft: palette.mixedSoft,
    focusNode: "glyceraldehyde",
  },
  pyruvaldehyde: {
    id: "pyruvaldehyde",
    label: "Path 3",
    title: "Pyruvaldehyde branches",
    subtitle: "risk-dominant route",
    color: palette.risk,
    soft: palette.riskSoft,
    focusNode: "pyruvaldehyde",
  },
}

const pathwayScoreRows = [
  ["Formaldehyde → Formic acid", "formaldehyde_to_formic", palette.positive],
  ["Glyceraldehyde → Formic acid", "glyceraldehyde_to_formic", palette.mixed],
  ["Glyceraldehyde → C2 byproducts", "glyceraldehyde_to_c2_byproducts", palette.mixed],
  ["Pyruvaldehyde → Formic acid", "pyruvaldehyde_to_formic", palette.risk],
  ["Pyruvaldehyde → Lactic/Pyruvic acid", "pyruvaldehyde_to_lactic", palette.risk],
]

const moleculeDefinitions = {
  glucose: {
    name: "Glucose",
    zhName: "葡萄糖",
    role: "Feedstock entering isomerization, retro-aldol, and C1/C3 fragmentation routes.",
    scoreTerm: "A1 glucose activation",
    tone: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
    Structure: GlucoseStructure,
  },
  fructose: {
    name: "Fructose",
    zhName: "果糖",
    role: "Isomerized feedstock that supplies key C1 and C3 intermediates.",
    scoreTerm: "A1/A2 precursor generation",
    tone: "feedstock",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
    Structure: FructoseStructure,
  },
  glyceraldehyde: {
    name: "Glyceraldehyde",
    zhName: "甘油醛",
    role: "Mixed C3 intermediate: can feed formic acid but also leaks to C2 byproducts.",
    scoreTerm: "A2/A3 if routed to formic acid; B1 if routed to C2 byproducts",
    tone: "mixed",
    paths: ["glyceraldehyde"],
    Structure: GlyceraldehydeStructure,
  },
  formaldehyde: {
    name: "Formaldehyde",
    zhName: "甲醛",
    role: "Primary C1 positive intermediate toward formic acid / formate.",
    scoreTerm: "A3 and SelectivityFactor",
    tone: "positive",
    paths: ["formaldehyde"],
    Structure: FormaldehydeStructure,
  },
  pyruvaldehyde: {
    name: "Pyruvaldehyde",
    zhName: "丙酮醛",
    role: "Risk-dominant C3 intermediate that competes through lactic, pyruvic, and acetic acid branches.",
    scoreTerm: "B1 and SelectivityFactor penalty",
    tone: "risk",
    paths: ["pyruvaldehyde"],
    Structure: PyruvaldehydeStructure,
  },
  formic: {
    name: "Formic acid / Formate",
    zhName: "甲酸 / 甲酸盐",
    role: "Target product endpoint shared by all three routes.",
    scoreTerm: "A3, A4, Y_FA, S_FA,C, SelectivityFactor",
    tone: "positive",
    paths: ["formaldehyde", "glyceraldehyde", "pyruvaldehyde"],
    Structure: FormicAcidStructure,
  },
  glycolic: {
    name: "Glycolic acid",
    zhName: "乙醇酸",
    role: "C2 byproduct endpoint from the glyceraldehyde branch.",
    scoreTerm: "B1 byproduct penalty",
    tone: "mixed",
    paths: ["glyceraldehyde"],
    Structure: GlycolicAcidStructure,
  },
  acetic: {
    name: "Acetic acid",
    zhName: "乙酸",
    role: "C2 byproduct endpoint from glyceraldehyde and pyruvaldehyde branches.",
    scoreTerm: "B1 and SelectivityFactor penalty",
    tone: "risk",
    paths: ["glyceraldehyde", "pyruvaldehyde"],
    Structure: AceticAcidStructure,
  },
  lactic: {
    name: "Lactic acid",
    zhName: "乳酸",
    role: "Risk-dominant C3 byproduct endpoint.",
    scoreTerm: "B1 and SelectivityFactor penalty",
    tone: "risk",
    paths: ["pyruvaldehyde"],
    Structure: LacticAcidStructure,
  },
  pyruvic: {
    name: "Pyruvic acid",
    zhName: "丙酮酸",
    role: "Risk-dominant oxidized C3 byproduct endpoint.",
    scoreTerm: "B1 and SelectivityFactor penalty",
    tone: "risk",
    paths: ["pyruvaldehyde"],
    Structure: PyruvicAcidStructure,
  },
}

const networkNodes = {
  glucose: { x: 34, y: 112, w: 214, h: 168, column: "Feedstock", compact: false },
  fructose: { x: 34, y: 356, w: 214, h: 168, column: "Feedstock", compact: false },
  glyceraldehyde: { x: 356, y: 48, w: 232, h: 150, column: "Key intermediates", compact: false },
  formaldehyde: { x: 356, y: 268, w: 232, h: 136, column: "Key intermediates", compact: false },
  pyruvaldehyde: { x: 356, y: 488, w: 232, h: 150, column: "Key intermediates", compact: false },
  glycolic: { x: 750, y: 38, w: 194, h: 136, column: "Products / Byproducts", compact: true },
  formic: { x: 794, y: 208, w: 218, h: 136, column: "Products / Byproducts", compact: true },
  acetic: { x: 984, y: 350, w: 194, h: 128, column: "Products / Byproducts", compact: true },
  lactic: { x: 742, y: 512, w: 202, h: 136, column: "Products / Byproducts", compact: true },
  pyruvic: { x: 980, y: 512, w: 202, h: 136, column: "Products / Byproducts", compact: true },
}

const moleculeNodeSubtitles = {
  glucose: "feedstock",
  fructose: "isomerized feedstock",
  glyceraldehyde: "mixed C3 route",
  formaldehyde: "primary C1 positive route",
  pyruvaldehyde: "risk-dominant C3 route",
  formic: "target product",
  glycolic: "C2 byproduct",
  acetic: "C2 byproduct",
  lactic: "C3 byproduct",
  pyruvic: "oxidized C3 byproduct",
}

const edgeDefinitions = [
  { id: "glucose-glyceraldehyde", path: "glyceraldehyde", from: "glucose", to: "glyceraldehyde", label: "C3 split" },
  { id: "fructose-glyceraldehyde", path: "glyceraldehyde", from: "fructose", to: "glyceraldehyde", label: "retro-aldol" },
  { id: "glyceraldehyde-formic", path: "glyceraldehyde", from: "glyceraldehyde", to: "formic", label: "A2/A3", tone: palette.positive },
  { id: "glyceraldehyde-glycolic", path: "glyceraldehyde", from: "glyceraldehyde", to: "glycolic", label: "B1" },
  { id: "glyceraldehyde-acetic", path: "glyceraldehyde", from: "glyceraldehyde", to: "acetic", label: "B1" },
  { id: "glucose-formaldehyde", path: "formaldehyde", from: "glucose", to: "formaldehyde", label: "C1" },
  { id: "fructose-formaldehyde", path: "formaldehyde", from: "fructose", to: "formaldehyde", label: "C1" },
  { id: "formaldehyde-formic", path: "formaldehyde", from: "formaldehyde", to: "formic", label: "A3" },
  { id: "glucose-pyruvaldehyde", path: "pyruvaldehyde", from: "glucose", to: "pyruvaldehyde", label: "C3 risk" },
  { id: "fructose-pyruvaldehyde", path: "pyruvaldehyde", from: "fructose", to: "pyruvaldehyde", label: "dehydration" },
  { id: "pyruvaldehyde-formic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "formic", label: "minor", tone: palette.positive },
  { id: "pyruvaldehyde-lactic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "lactic", label: "B1" },
  { id: "pyruvaldehyde-pyruvic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "pyruvic", label: "B1" },
  { id: "pyruvaldehyde-acetic", path: "pyruvaldehyde", from: "pyruvaldehyde", to: "acetic", label: "B1" },
]

const validationSteps = [
  ["Main reaction test", "Glucose + NaHCO3 + MOF under aqueous reaction conditions."],
  ["Formaldehyde feeding test", "Validate the C1 positive route and intermediate-to-formic-acid conversion."],
  ["Glyceraldehyde feeding test", "Validate the mixed route and quantify glycolic/acetic acid leakage."],
  ["Pyruvaldehyde feeding test", "Validate the risk-dominant route toward lactic and pyruvic acids."],
  ["Time-series product analysis", "Separate transient intermediates from terminal byproducts."],
  ["Carbon balance check", "Decide whether a record is suitable as a machine-learning label."],
  ["NaH13CO3 isotope tracing", "Estimate bicarbonate contribution to the carbon in formic acid."],
  ["DFT adsorption descriptor update", "Update Eads, Bader charge, and formate desorption descriptors."],
]

function fmt(value, digits = 3) {
  return safeNumber(value, 0).toFixed(digits)
}

function pct(value) {
  return `${Math.round(Math.max(0, Math.min(1, safeNumber(value, 0))) * 100)}%`
}

function Sub({ children }) {
  return <sub style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sub>
}

function humanizePathway(value) {
  if (PATHWAY_LABELS[value]) return PATHWAY_LABELS[value]
  return String(value || "pending").replace(/_/g, " ").replace(/\bto\b/g, "→")
}

function recommendationForClass(candidateClass) {
  if (candidateClass === "A") return "priority candidate"
  if (candidateClass === "B") return "optimization candidate"
  if (candidateClass === "C") return "mechanistic candidate"
  return "not recommended"
}

function ProjectSection({ kicker, title, note, children }) {
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "grid", gap: 4, marginBottom: 13 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.2, textTransform: "uppercase" }}>
          {kicker}
        </div>
        <h2 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>{title}</h2>
        {note ? <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value, note }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 11, minWidth: 0 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 19, fontWeight: 950, lineHeight: 1.05, marginTop: 7, overflowWrap: "anywhere" }}>{value}</div>
      {note ? <div style={{ color: palette.muted, fontSize: 11, lineHeight: 1.4, marginTop: 6 }}>{note}</div> : null}
    </div>
  )
}

function PrototypeGate({ lang, t, onUnlock }) {
  const { isNarrow } = useViewport()
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")

  const submit = (event) => {
    event.preventDefault()
    if (draft.trim() === PROJECT_PASSWORD) {
      try {
        window.sessionStorage.setItem(ACCESS_KEY, "granted")
      } catch {
        // Session persistence is optional for this prototype display gate.
      }
      setError("")
      onUnlock()
      return
    }
    setError(lang === "zh" ? "访问码不匹配，请重新输入。" : "Access code does not match. Try again.")
  }

  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.borderStrong}`, borderRadius: 12, boxShadow: "0 14px 38px rgba(15, 23, 42, 0.08)", padding: 18 }}>
      <div style={{ display: "grid", gap: 16, maxWidth: 800 }}>
        <div>
          <div style={{ color: palette.faint, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Prototype access gate</div>
          <h2 style={{ color: palette.text, fontSize: 24, lineHeight: 1.14, margin: "6px 0 0" }}>
            Organic Acid Project / 有机酸项目
          </h2>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.62, margin: "9px 0 0" }}>
            {lang === "zh"
              ? "该访问码校验只在浏览器前端运行，用于原型展示入口。本模块数据为 demo / prototype data。"
              : "This access-code check runs only in the browser and is used as a prototype display gate. This module uses demo / prototype data."}
          </p>
        </div>
        <form onSubmit={submit} style={{ alignItems: "end", display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 280px) auto" }}>
          <label style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <span style={{ color: palette.text, fontSize: 12, fontWeight: 850 }}>{lang === "zh" ? "前端访问码" : "Front-end access code"}</span>
            <input
              type="password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label={lang === "zh" ? "输入有机酸项目访问码" : "Enter Organic Acid Project access code"}
              style={{
                background: palette.surface,
                border: `1px solid ${error ? palette.risk : palette.borderStrong}`,
                borderRadius: 7,
                color: palette.text,
                fontFamily: FONT_MONO,
                fontSize: 14,
                minHeight: 39,
                outline: "none",
                padding: "0 10px",
              }}
            />
          </label>
          <button
            type="submit"
            style={{ ...toolbarBtn(t), background: palette.accent, borderColor: palette.accent, color: "#fff", justifyContent: "center", minHeight: 39, padding: "9px 14px", width: isNarrow ? "100%" : "auto" }}
          >
            {lang === "zh" ? "进入项目" : "Enter project"}
          </button>
        </form>
        {error ? <div style={{ color: palette.risk, fontSize: 12, fontWeight: 800 }}>{error}</div> : null}
      </div>
    </section>
  )
}

function ProjectHero({ topCandidate, rankedRows, isNarrow }) {
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.borderStrong}`, borderRadius: 12, boxShadow: "0 14px 38px rgba(15, 23, 42, 0.08)", padding: 18 }}>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.3fr) minmax(260px, 0.7fr)", alignItems: "start" }}>
        <div>
          <div style={{ color: palette.faint, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Mechanism-guided MOF screening workbench</div>
          <h1 style={{ color: palette.text, fontSize: isNarrow ? 27 : 32, lineHeight: 1.1, letterSpacing: 0, margin: "6px 0 0" }}>
            Organic Acid Project
          </h1>
          <p style={{ color: palette.muted, fontSize: 14, lineHeight: 1.6, margin: "9px 0 0", maxWidth: 820 }}>
            Reaction-guided screening of MOFs for glucose–NaHCO3 conversion to formic acid
          </p>
          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderLeft: `3px solid ${palette.accent}`, borderRadius: 8, marginTop: 13, padding: 12 }}>
            <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 900, lineHeight: 1.55, overflowWrap: "anywhere" }}>
              Glucose + NaHCO<Sub>3</Sub> + H<Sub>2</Sub>O + MOF → formic acid / formate + suppressed byproducts
            </div>
            <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, marginTop: 7 }}>
              Objective: maximize formic acid yield and carbon-based selectivity while suppressing lactic acid, acetic acid, glycolic acid, pyruvic acid, and solid byproducts.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          <MetricCard label="Data status" value="Demo / Prototype Data" note="No real collaboration data or unpublished experimental data is embedded." />
          <MetricCard label="Demo candidates" value={rankedRows.length} note="Standalone organic_acid_project_demo.json dataset" />
          <MetricCard label="Current top candidate" value={topCandidate?.mof || "-"} note={topCandidate ? `RGFA ${fmt(topCandidate.rgfaScore)} · ${recommendationForClass(topCandidate.computedClass)}` : "Awaiting data"} />
        </div>
      </div>
    </section>
  )
}

function nodePoint(id, side = "right") {
  const node = networkNodes[id]
  if (!node) return { x: 0, y: 0 }
  const y = node.y + node.h / 2
  if (side === "left") return { x: node.x, y }
  if (side === "top") return { x: node.x + node.w / 2, y: node.y }
  if (side === "bottom") return { x: node.x + node.w / 2, y: node.y + node.h }
  return { x: node.x + node.w, y }
}

function edgeCurve(edge) {
  const from = nodePoint(edge.from, "right")
  const to = nodePoint(edge.to, "left")
  const span = Math.max(60, Math.abs(to.x - from.x) * 0.48)
  const c1 = { x: from.x + span, y: from.y }
  const c2 = { x: to.x - span, y: to.y }
  return {
    d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
    labelX: (from.x + to.x) / 2,
    labelY: (from.y + to.y) / 2,
  }
}

function PathButton({ path, active, onSelect, onHover, onLeave }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        alignItems: "start",
        background: active ? path.soft : palette.bg,
        border: `1px solid ${active ? path.color : palette.border}`,
        borderLeft: `4px solid ${path.color}`,
        borderRadius: 8,
        color: palette.text,
        cursor: "pointer",
        display: "grid",
        gap: 3,
        minHeight: 54,
        padding: "8px 10px",
        textAlign: "left",
      }}
    >
      <span style={{ color: path.color, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>{path.label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 950, lineHeight: 1.25 }}>{path.title}</span>
      <span style={{ color: palette.muted, fontSize: 10.8, fontWeight: 750, lineHeight: 1.25 }}>{path.subtitle}</span>
    </button>
  )
}

function MoleculeDetailPanel({ nodeId }) {
  const molecule = moleculeDefinitions[nodeId] || moleculeDefinitions.formaldehyde
  const Structure = molecule.Structure
  const tone = {
    feedstock: palette.accent,
    positive: palette.positive,
    mixed: palette.mixed,
    risk: palette.risk,
  }[molecule.tone] || palette.accent
  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderLeft: `3px solid ${tone}`, borderRadius: 8, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>Molecule detail</div>
      <div style={{ alignItems: "start", display: "grid", gap: 9, gridTemplateColumns: "minmax(0, 1fr)", marginTop: 8 }}>
        <div>
          <div style={{ color: palette.text, fontSize: 14, fontWeight: 950, lineHeight: 1.25 }}>{molecule.name}</div>
          <div style={{ color: tone, fontSize: 12, fontWeight: 850, marginTop: 3 }}>{molecule.zhName}</div>
        </div>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 7, display: "flex", justifyContent: "center", padding: 6 }}>
          <Structure />
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>Role:</strong> {molecule.role}
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55 }}>
          <strong style={{ color: palette.text }}>Score term:</strong> {molecule.scoreTerm}
        </div>
      </div>
    </article>
  )
}

function PathwayMappingPanel({ activePath }) {
  return (
    <article style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>Pathway-to-score mapping</div>
      <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
        {mappingRows.map((row) => {
          const pathActive = row.tone === pathwayMeta[activePath]?.color
          return (
            <div key={row.title} style={{ background: pathActive ? row.bg : palette.bg, border: `1px solid ${pathActive ? row.tone : palette.border}`, borderLeft: `3px solid ${row.tone}`, borderRadius: 7, padding: 9 }}>
              <div style={{ color: row.tone, fontSize: 10.2, fontWeight: 920, lineHeight: 1.3 }}>{row.title}</div>
              <div style={{ color: palette.text, fontSize: 11.5, fontWeight: 880, lineHeight: 1.35, marginTop: 4 }}>{row.route}</div>
              <div style={{ color: palette.muted, fontSize: 10.8, lineHeight: 1.45, marginTop: 4 }}>{row.body}</div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function ReactionPathwayMap() {
  const { isNarrow } = useViewport()
  const [activePath, setActivePath] = useState("formaldehyde")
  const [hoveredPath, setHoveredPath] = useState("")
  const [hoveredNode, setHoveredNode] = useState("")
  const [selectedNode, setSelectedNode] = useState("formaldehyde")
  const highlightedPath = hoveredPath || activePath

  const selectPath = (pathId) => {
    setActivePath(pathId)
    setSelectedNode(pathwayMeta[pathId].focusNode)
  }

  return (
    <ProjectSection
      kicker="Reaction mechanism map"
      title="Three-pathway Reaction Network / 三路径反应网络"
      note="Interactive mechanism map for glucose/fructose conversion. Hover a route to inspect its branch, click a molecule to view its pathway role, and use the path labels to lock the active route."
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
          {Object.values(pathwayMeta).map((path) => (
            <PathButton
              key={path.id}
              path={path}
              active={highlightedPath === path.id}
              onSelect={() => selectPath(path.id)}
              onHover={() => setHoveredPath(path.id)}
              onLeave={() => setHoveredPath("")}
            />
          ))}
        </div>

        <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(280px, 0.32fr)", alignItems: "start", minWidth: 0 }}>
          <div style={{ maxWidth: "100%", minWidth: 0, overflowX: "auto", paddingBottom: 4, width: "100%" }}>
            <div
              style={{
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                height: 690,
                minWidth: 1200,
                position: "relative",
                width: 1200,
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 1200 690" preserveAspectRatio="none" style={{ height: "100%", inset: 0, position: "absolute", width: "100%", zIndex: 1 }}>
                <defs>
                  {Object.values(pathwayMeta).map((path) => (
                    <marker key={path.id} id={`arrow-${path.id}`} markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4" viewBox="0 0 8 8">
                      <path d="M 0 0 L 8 4 L 0 8 z" fill={path.color} />
                    </marker>
                  ))}
                </defs>
                <rect x="330" y="250" width="728" height="176" rx="12" fill={palette.positiveSoft} stroke={palette.positive} strokeOpacity="0.28" />
                {edgeDefinitions.map((edge) => {
                  const path = pathwayMeta[edge.path]
                  const active = highlightedPath === edge.path
                  const curve = edgeCurve(edge)
                  const stroke = edge.tone || path.color
                  return (
                    <g
                      key={edge.id}
                      opacity={active ? 1 : 0.2}
                      onMouseEnter={() => setHoveredPath(edge.path)}
                      onMouseLeave={() => setHoveredPath("")}
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                    >
                      <path d={curve.d} fill="none" markerEnd={`url(#arrow-${edge.path})`} stroke={stroke} strokeLinecap="round" strokeWidth={active ? 3.2 : 2} />
                      <text x={curve.labelX} y={curve.labelY - 6} fill={stroke} fontFamily="Arial, Helvetica, sans-serif" fontSize="10.5" fontWeight="800" textAnchor="middle">
                        {edge.label}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {[
                ["Feedstock", 34],
                ["Key intermediates", 356],
                ["Products / Byproducts", 748],
              ].map(([label, x]) => (
                <div key={label} style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, left: x, letterSpacing: 0.2, position: "absolute", textTransform: "uppercase", top: 12, zIndex: 2 }}>
                  {label}
                </div>
              ))}

              {Object.entries(networkNodes).map(([id, position]) => {
                const molecule = moleculeDefinitions[id]
                const Structure = molecule.Structure
                const nodeActive = molecule.paths.includes(highlightedPath)
                const selected = selectedNode === id
                const dimmed = !nodeActive && !selected && !hoveredNode
                return (
                  <div
                    key={id}
                    style={{
                      height: position.h,
                      left: position.x,
                      position: "absolute",
                      top: position.y,
                      width: position.w,
                      zIndex: 3,
                    }}
                  >
                    <MoleculeNode
                      title={`${molecule.name} / ${molecule.zhName}`}
                      subtitle={moleculeNodeSubtitles[id]}
                      tone={molecule.tone}
                      compact={position.compact}
                      active={nodeActive}
                      selected={selected}
                      dimmed={dimmed}
                      onClick={() => setSelectedNode(id)}
                      onMouseEnter={() => setHoveredNode(id)}
                      onMouseLeave={() => setHoveredNode("")}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <Structure />
                    </MoleculeNode>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <MoleculeDetailPanel nodeId={selectedNode} />
            <PathwayMappingPanel activePath={highlightedPath} />
          </div>
        </div>
      </div>
    </ProjectSection>
  )
}

function FormulaLine({ children }) {
  return (
    <div style={{ alignItems: "baseline", color: palette.text, display: "flex", flexWrap: "wrap", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 900, gap: "4px 7px", lineHeight: 1.55, minWidth: 0 }}>
      {children}
    </div>
  )
}

function FractionFormula() {
  const formulaPart = (children) => (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "2px 5px", lineHeight: 1.45, minWidth: 0 }}>
      {children}
    </span>
  )

  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 12 }}>
      <FormulaLine>
        <span>SelectivityFactor</span>
        <span>=</span>
      </FormulaLine>
      <div style={{ color: palette.text, display: "grid", fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 850, gap: 6, lineHeight: 1.5, minWidth: 0 }}>
        <div style={{ borderBottom: `1.5px solid ${palette.text}`, paddingBottom: 6 }}>
          {formulaPart(
            <>
              <span>Y<Sub>FA</Sub></span>
              <span>×</span>
              <span>S<Sub>FA,C</Sub></span>
            </>,
          )}
        </div>
        <div>
          {formulaPart(
            <>
              <span>1</span>
              <span>+</span>
              <span>1.0Y<Sub>lactic</Sub></span>
              <span>+</span>
              <span>0.8Y<Sub>acetic</Sub></span>
              <span>+</span>
              <span>0.5Y<Sub>glycolic</Sub></span>
              <span>+</span>
              <span>0.4Y<Sub>pyruvic</Sub></span>
              <span>+</span>
              <span>0.3Y<Sub>solid</Sub></span>
            </>,
          )}
        </div>
      </div>
    </div>
  )
}

function AlgorithmSection({ topCandidate, isNarrow }) {
  const termCards = [
    ["Gate", "Material entry check", "Water stability, pore accessibility, and active-site confidence determine whether the candidate should enter reaction screening."],
    ["StepScore", "Reaction-step ability", "A3 carries the highest weight because it measures intermediate-to-formic-acid conversion."],
    ["SelectivityFactor", "Product objective", "Y_FA and S_FA,C are rewarded while lactic, acetic, glycolic, pyruvic, and solid byproducts are penalized."],
  ]

  return (
    <ProjectSection
      kicker="RGFA score algorithm"
      title="Reaction-Guided Formic Acid Score / RGFA Score"
      note="The score is a transparent prototype ranking function. It is intended for mechanism-guided prioritization, not as an experimental conclusion."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.1fr) minmax(290px, 0.72fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
            <FormulaLine>
              <span>RGFA Score</span>
              <span>=</span>
              <span>Gate</span>
              <span>×</span>
              <span>StepScore</span>
              <span>×</span>
              <span>SelectivityFactor</span>
            </FormulaLine>
            <FormulaLine>
              <span>Gate</span>
              <span>=</span>
              <span>waterStabilityScore</span>
              <span>×</span>
              <span>accessibilityScore</span>
              <span>×</span>
              <span>activeSiteConfidence</span>
            </FormulaLine>
            <FormulaLine>
              <span>StepScore</span>
              <span>=</span>
              <span>0.15A<Sub>1</Sub></span>
              <span>+</span>
              <span>0.20A<Sub>2</Sub></span>
              <span>+</span>
              <span>0.35A<Sub>3</Sub></span>
              <span>+</span>
              <span>0.15A<Sub>4</Sub></span>
              <span>−</span>
              <span>0.15B<Sub>1</Sub></span>
            </FormulaLine>
          </div>
          <FractionFormula />
          <div style={{ border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", padding: 11 }}>
            {[
              ["A1", "glucose isomerization / activation ability"],
              ["A2", "formic-acid precursor generation ability"],
              ["A3", "intermediate-to-formic-acid conversion ability"],
              ["A4", "formate release and stability ability"],
              ["B1", "byproduct pathway risk"],
            ].map(([term, definition]) => (
              <div key={term} style={{ minWidth: 0 }}>
                <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 950 }}>{term}</div>
                <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{definition}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          {termCards.map(([title, subtitle, body]) => (
            <article key={title} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: palette.text, fontSize: 13, fontWeight: 950 }}>{title}</div>
              <div style={{ color: palette.accent, fontSize: 11, fontWeight: 850, marginTop: 3 }}>{subtitle}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>{body}</div>
            </article>
          ))}
          {topCandidate ? (
            <article style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 11 }}>
              <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Top candidate score trace</div>
              <div style={{ color: palette.text, fontSize: 13, fontWeight: 900, marginTop: 6 }}>{topCandidate.mof}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
                Gate {fmt(topCandidate.gateScore)} · StepScore {fmt(topCandidate.stepScore)} · SelectivityFactor {fmt(topCandidate.selectivityFactor)}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </ProjectSection>
  )
}

function PathwayScoreMappingSection() {
  return (
    <ProjectSection
      kicker="Pathway-to-score mapping"
      title="How Mechanism Enters RGFA / 路径与评分映射"
      note="The three organic routes define which terms reward the target product and which terms penalize competing organic acids."
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {mappingRows.map((row) => (
          <article key={row.title} style={{ background: row.bg, border: `1px solid ${palette.border}`, borderLeft: `3px solid ${row.tone}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: row.tone, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{row.title}</div>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35, marginTop: 6 }}>{row.route}</div>
            <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>{row.body}</div>
          </article>
        ))}
      </div>
    </ProjectSection>
  )
}

function RankingTable({ rankedRows, selectedMof, onSelect }) {
  if (!rankedRows.length) {
    return (
      <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 12.5, padding: 12 }}>
        Loading independent demo dataset from public/data/organic_acid_project_demo.json.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "100%", minWidth: 0, overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 820, width: "100%" }}>
        <thead>
          <tr>
            {["Rank", "MOF", "RGFA Score", "Class", "Dominant pathway", "Main risk", "Evidence"].map((head) => (
              <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, padding: "8px 10px", textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankedRows.map((row, index) => {
            const selected = row.mof === selectedMof
            return (
              <tr key={row.mof} onClick={() => onSelect(row.mof)} style={{ background: selected ? palette.accentSoft : "transparent", cursor: "pointer" }}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 900, padding: "10px" }}>#{index + 1}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 900, padding: "10px", whiteSpace: "nowrap" }}>{row.mof}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontFamily: FONT_MONO, fontSize: 12.5, padding: "10px" }}>{fmt(row.rgfaScore)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 900, padding: "10px" }}>{row.computedClass}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px" }}>{humanizePathway(row.dominantPathway)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px" }}>{humanizePathway(row.riskPathway)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px" }}>{row.evidenceLevel || "demo"}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ScoreBar({ label, value, tone = palette.accent }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span style={{ color: palette.muted, fontSize: 11.5, fontWeight: 850 }}>{label}</span>
        <span style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 900 }}>{fmt(value, 2)}</span>
      </div>
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <div style={{ background: tone, height: "100%", width: pct(value) }} />
      </div>
    </div>
  )
}

function CandidateDetailPanel({ candidate }) {
  if (!candidate) return null
  const productRows = [
    ["Y_FA", candidate.Y_FA, palette.positive],
    ["S_FA,C", candidate.S_FA_C, palette.positive],
    ["Y_lactic", candidate.Y_lactic, palette.risk],
    ["Y_acetic", candidate.Y_acetic, palette.risk],
    ["Y_glycolic", candidate.Y_glycolic, palette.mixed],
    ["Y_pyruvic", candidate.Y_pyruvic, palette.risk],
    ["Y_solid", candidate.Y_solid, palette.muted],
  ]
  const pathwayRows = pathwayScoreRows.map(([label, key, color]) => [label, candidate.pathwayScores?.[key], color])

  return (
    <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 13 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Candidate Detail Panel</div>
      <h3 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: "6px 0 0" }}>{candidate.mof}</h3>
      <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
        RGFA {fmt(candidate.rgfaScore)} · Class {candidate.computedClass} · {recommendationForClass(candidate.computedClass)}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Step scores</div>
        <ScoreBar label="A1 glucose activation" value={candidate.A1} />
        <ScoreBar label="A2 precursor generation" value={candidate.A2} />
        <ScoreBar label="A3 intermediate → formic acid" value={candidate.A3} tone={palette.positive} />
        <ScoreBar label="A4 formate release" value={candidate.A4} />
        <ScoreBar label="B1 byproduct risk" value={candidate.B1} tone={palette.risk} />
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Gate scores</div>
        <ScoreBar label="water stability" value={candidate.waterStabilityScore} />
        <ScoreBar label="accessibility" value={candidate.accessibilityScore} />
        <ScoreBar label="active site confidence" value={candidate.activeSiteConfidence} />
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Product and selectivity</div>
        {productRows.map(([label, value, color]) => <ScoreBar key={label} label={label} value={value} tone={color} />)}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Pathway fingerprint</div>
        {pathwayRows.map(([label, value, color]) => <ScoreBar key={label} label={label} value={value} tone={color} />)}
      </div>

      <div style={{ borderTop: `1px solid ${palette.border}`, marginTop: 13, paddingTop: 11 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Why this candidate?</div>
        <ul style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, margin: "7px 0 0", paddingLeft: 17 }}>
          {candidate.explanations.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </aside>
  )
}

function CandidateRankingSection({ rankedRows, selectedMof, setSelectedMof, isNarrow }) {
  const selected = rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0]
  return (
    <ProjectSection
      kicker="Candidate ranking"
      title="Candidate Ranking / 候选排序"
      note="Rows are sorted automatically by RGFA Score from the standalone demo dataset. Select a candidate to inspect pathway assumptions, score components, and generated explanation."
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 12 }}>
        <MetricCard label="Data file" value="JSON" note="public/data/organic_acid_project_demo.json" />
        <MetricCard label="Records" value={rankedRows.length || "-"} note="Independent from the general MOF Library" />
        <MetricCard label="Evidence level" value="demo" note="Prototype values for workflow display" />
      </div>
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(300px, 0.75fr)" }}>
        <RankingTable rankedRows={rankedRows} selectedMof={selected?.mof} onSelect={setSelectedMof} />
        <CandidateDetailPanel candidate={selected} />
      </div>
    </ProjectSection>
  )
}

function DescriptorSection({ isNarrow }) {
  return (
    <ProjectSection
      kicker="Descriptor matrix"
      title="Descriptor Matrix / 描述符体系"
      note="The descriptor matrix connects MOF stability, access, active-site chemistry, pathway intermediates, and product labels."
    >
      <div style={{ border: `1px solid ${palette.border}`, borderRadius: 8, overflow: "hidden" }}>
        {descriptorGroups.map((group, index) => (
          <div
            key={group.category}
            style={{
              background: index % 2 === 0 ? palette.bg : palette.surface,
              borderTop: index === 0 ? "none" : `1px solid ${palette.border}`,
              display: "grid",
              gap: isNarrow ? 6 : 12,
              gridTemplateColumns: isNarrow ? "1fr" : "minmax(190px, 0.35fr) minmax(0, 1fr)",
              padding: "11px 12px",
            }}
          >
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900 }}>{group.category}</div>
            <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.5, overflowWrap: "anywhere" }}>
              {group.descriptors.join(" · ")}
            </div>
          </div>
        ))}
      </div>
    </ProjectSection>
  )
}

function ValidationSection() {
  return (
    <ProjectSection
      kicker="Validation roadmap"
      title="Validation Roadmap / 后续实验与 DFT 验证"
      note="The roadmap converts ranked hypotheses into main-reaction tests, pathway-feeding tests, carbon accounting, isotope tracing, and descriptor updates."
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {validationSteps.map(([step, body], index) => (
          <article key={step} style={{ alignItems: "start", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, gridTemplateColumns: "34px minmax(0, 1fr)", padding: 11 }}>
            <div style={{ alignItems: "center", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.accent, display: "flex", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>{index + 1}</div>
            <div>
              <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}>{step}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 4 }}>{body}</div>
            </div>
          </article>
        ))}
      </div>
    </ProjectSection>
  )
}

export function OrganicAcidProject({ lang = "zh", t }) {
  const { isNarrow } = useViewport()
  const [hasAccess, setHasAccess] = useState(false)
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState("idle")
  const [selectedMof, setSelectedMof] = useState("")

  useEffect(() => {
    try {
      setHasAccess(window.sessionStorage.getItem(ACCESS_KEY) === "granted")
    } catch {
      setHasAccess(false)
    }
  }, [])

  useEffect(() => {
    if (!hasAccess) return
    let live = true
    setStatus("loading")
    fetchDataJson("organic_acid_project_demo.json", [])
      .then((data) => {
        if (!live) return
        setRows(Array.isArray(data) ? data : [])
        setStatus("loaded")
      })
      .catch(() => {
        if (!live) return
        setRows([])
        setStatus("error")
      })
    return () => {
      live = false
    }
  }, [hasAccess])

  const rankedRows = useMemo(() => (
    rows
      .map((item) => {
        const stepScore = calculateStepScore(item)
        const selectivityFactor = calculateSelectivityFactor(item)
        const gateScore = calculateGateScore(item)
        const rgfaScore = calculateRGFAScore(item)
        return {
          ...item,
          stepScore,
          selectivityFactor,
          gateScore,
          rgfaScore,
          computedClass: classifyCandidate(rgfaScore, item),
          explanations: generateCandidateExplanation(item),
        }
      })
      .sort((a, b) => b.rgfaScore - a.rgfaScore)
  ), [rows])

  useEffect(() => {
    if (!rankedRows.length) return
    if (!selectedMof || !rankedRows.some((row) => row.mof === selectedMof)) {
      setSelectedMof(rankedRows[0].mof)
    }
  }, [rankedRows, selectedMof])

  if (!hasAccess) {
    return (
      <div style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16 }}>
        <PrototypeGate lang={lang} t={t} onUnlock={() => setHasAccess(true)} />
      </div>
    )
  }

  const topCandidate = rankedRows[0] || null

  return (
    <div style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <ProjectHero topCandidate={topCandidate} rankedRows={rankedRows} isNarrow={isNarrow} />
        <ReactionPathwayMap />
        <AlgorithmSection topCandidate={topCandidate} isNarrow={isNarrow} />
        {status === "error" ? (
          <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.risk, fontSize: 12.5, fontWeight: 850, padding: 12 }}>
            Demo dataset could not be loaded from public/data/organic_acid_project_demo.json.
          </div>
        ) : (
          <CandidateRankingSection rankedRows={rankedRows} selectedMof={selectedMof} setSelectedMof={setSelectedMof} isNarrow={isNarrow} />
        )}
        <DescriptorSection isNarrow={isNarrow} />
        <ValidationSection />
      </div>
    </div>
  )
}
