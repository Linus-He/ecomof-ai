import { useEffect, useMemo, useState } from "react"
import { FONT_MONO, fetchDataJson, toolbarBtn, useViewport } from "../../shared"
import { OrganicAcidPathwayMap } from "./OrganicAcidPathwayMap"
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
    descriptors: ["waterStability", "hydrothermalStability", "metalLeachingRisk", "pxrdRetention"],
  },
  {
    category: "Accessibility descriptors",
    descriptors: ["PLD", "LCD", "poreVolume", "hydrophilicPoreEnvironment"],
  },
  {
    category: "Active-site descriptors",
    descriptors: ["metalType", "valenceState", "lewisAcidity", "basicSites", "openMetalSites"],
  },
  {
    category: "Functional-group descriptors",
    descriptors: ["amino", "hydroxyl", "carboxyl", "defects", "zrHydroxyl", "feHydroxyl"],
  },
  {
    category: "Reaction descriptors",
    descriptors: ["eadsBicarbonate", "eadsFormaldehyde", "eadsGlyceraldehyde", "eadsPyruvaldehyde", "eadsFormate"],
  },
  {
    category: "Product descriptors",
    descriptors: ["yFormicAcid", "sFormicCarbon", "yLactic", "yAcetic", "yGlycolic", "yPyruvic", "ySolid"],
  },
]

const pathwayScoreRows = [
  ["Formaldehyde → Formic acid", "formaldehyde_to_formic", palette.positive],
  ["Glyceraldehyde → Formic acid", "glyceraldehyde_to_formic", palette.mixed],
  ["Glyceraldehyde → C2 byproducts", "glyceraldehyde_to_c2_byproducts", palette.mixed],
  ["Pyruvaldehyde → Formic acid", "pyruvaldehyde_to_formic", palette.risk],
  ["Pyruvaldehyde → Lactic/Pyruvic acid", "pyruvaldehyde_to_lactic", palette.risk],
]

const validationSteps = [
  ["Main reaction test", "mainReaction"],
  ["Formaldehyde feeding test", "Validate the C1 positive route and intermediate-to-formic-acid conversion."],
  ["Glyceraldehyde feeding test", "Validate the mixed route and quantify glycolic/acetic acid leakage."],
  ["Pyruvaldehyde feeding test", "Validate the risk-dominant route toward lactic and pyruvic acids."],
  ["Time-series product analysis", "Separate transient intermediates from terminal byproducts."],
  ["Carbon balance check", "Decide whether a record is suitable as a machine-learning label."],
  ["isotopeTracing", "Estimate bicarbonate contribution to the carbon in formic acid."],
  ["DFT adsorption descriptor update", "dftDescriptorUpdate"],
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

function Sup({ children }) {
  return <sup style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sup>
}

function ChemFormula({ kind }) {
  if (kind === "sodiumBicarbonate") return <>NaHCO<Sub>3</Sub></>
  if (kind === "water") return <>H<Sub>2</Sub>O</>
  if (kind === "bicarbonate") return <>HCO<Sub>3</Sub><Sup>−</Sup></>
  if (kind === "isotopeBicarbonate") return <>NaH<Sup>13</Sup>CO<Sub>3</Sub></>
  return null
}

function VariableLabel({ name }) {
  const labels = {
    yFormicAcid: <>Y<Sub>FA</Sub></>,
    sFormicCarbon: <>S<Sub>FA,C</Sub></>,
    yLactic: <>Y<Sub>lactic</Sub></>,
    yAcetic: <>Y<Sub>acetic</Sub></>,
    yGlycolic: <>Y<Sub>glycolic</Sub></>,
    yPyruvic: <>Y<Sub>pyruvic</Sub></>,
    ySolid: <>Y<Sub>solid</Sub></>,
  }

  return labels[name] || name
}

function DescriptorLabel({ descriptor }) {
  const labels = {
    waterStability: "water stability",
    hydrothermalStability: "hydrothermal stability",
    metalLeachingRisk: "metal leaching risk",
    pxrdRetention: "post-reaction PXRD retention",
    PLD: "PLD",
    LCD: "LCD",
    poreVolume: "pore volume",
    hydrophilicPoreEnvironment: "hydrophilic pore environment",
    metalType: "metal type",
    valenceState: "valence state",
    lewisAcidity: "Lewis acidity",
    basicSites: "basic sites",
    openMetalSites: "open metal sites",
    amino: <>-NH<Sub>2</Sub></>,
    hydroxyl: "-OH",
    carboxyl: "-COOH",
    defects: "defects",
    zrHydroxyl: "Zr-OH",
    feHydroxyl: "Fe-OH",
    eadsBicarbonate: <>E<Sub>ads</Sub>(HCO<Sub>3</Sub><Sup>−</Sup>)</>,
    eadsFormaldehyde: <>E<Sub>ads</Sub>(formaldehyde)</>,
    eadsGlyceraldehyde: <>E<Sub>ads</Sub>(glyceraldehyde)</>,
    eadsPyruvaldehyde: <>E<Sub>ads</Sub>(pyruvaldehyde)</>,
    eadsFormate: <>E<Sub>ads</Sub>(formate)</>,
  }

  if (descriptor in labels) return labels[descriptor]
  return <VariableLabel name={descriptor} />
}

function ValidationBody({ body }) {
  if (body === "mainReaction") {
    return (
      <>
        Glucose + <ChemFormula kind="sodiumBicarbonate" /> + MOF under aqueous reaction conditions.
      </>
    )
  }
  if (body === "dftDescriptorUpdate") {
    return (
      <>
        Update <DescriptorLabel descriptor="eadsBicarbonate" />, Bader charge, and formate desorption descriptors.
      </>
    )
  }
  return body
}

function ValidationTitle({ title }) {
  if (title === "isotopeTracing") {
    return (
      <>
        <ChemFormula kind="isotopeBicarbonate" /> isotope tracing
      </>
    )
  }
  return title
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
            Reaction-guided screening of MOFs for glucose–<ChemFormula kind="sodiumBicarbonate" /> conversion to formic acid
          </p>
          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderLeft: `3px solid ${palette.accent}`, borderRadius: 8, marginTop: 13, padding: 12 }}>
            <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 900, lineHeight: 1.55, overflowWrap: "anywhere" }}>
              Glucose + <ChemFormula kind="sodiumBicarbonate" /> + <ChemFormula kind="water" /> + MOF → formic acid / formate + suppressed byproducts
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
    [
      "SelectivityFactor",
      "Product objective",
      <>
        <VariableLabel name="yFormicAcid" /> and <VariableLabel name="sFormicCarbon" /> are rewarded while lactic, acetic, glycolic, pyruvic, and solid byproducts are penalized.
      </>,
    ],
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
    ["yFormicAcid", candidate.Y_FA, palette.positive],
    ["sFormicCarbon", candidate.S_FA_C, palette.positive],
    ["yLactic", candidate.Y_lactic, palette.risk],
    ["yAcetic", candidate.Y_acetic, palette.risk],
    ["yGlycolic", candidate.Y_glycolic, palette.mixed],
    ["yPyruvic", candidate.Y_pyruvic, palette.risk],
    ["ySolid", candidate.Y_solid, palette.muted],
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
        {productRows.map(([label, value, color]) => <ScoreBar key={label} label={<VariableLabel name={label} />} value={value} tone={color} />)}
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
              {group.descriptors.map((descriptor, descriptorIndex) => (
                <span key={descriptor}>
                  {descriptorIndex > 0 ? <span aria-hidden="true"> · </span> : null}
                  <DescriptorLabel descriptor={descriptor} />
                </span>
              ))}
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
              <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}><ValidationTitle title={step} /></div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 4 }}><ValidationBody body={body} /></div>
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
        <OrganicAcidPathwayMap />
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
