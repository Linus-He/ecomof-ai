import { useEffect, useMemo, useState } from "react"
import { FONT_MONO, fetchDataJson, toolbarBtn, useViewport } from "../../shared"
import {
  calculateGateScore,
  calculateRGFAScore,
  calculateSelectivityFactor,
  calculateStepScore,
  classifyCandidate,
  generateCandidateExplanation,
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
  positiveSoft: "#ECFDF3",
  mixed: "#A15C13",
  mixedSoft: "#FFF7ED",
  risk: "#8F3B1B",
  riskSoft: "#FFF1E8",
}

const pathwayRows = [
  {
    id: "glyceraldehyde",
    path: "Path 1",
    title: "Glyceraldehyde pathway / 甘油醛路径",
    intermediate: "glyceraldehyde",
    status: "mixed pathway",
    route: ["Glucose / Fructose", "glyceraldehyde", "formic acid"],
    riskProducts: ["glycolic acid", "acetic acid"],
    definition: "Contributes to formic acid, but can branch toward C2 byproducts.",
    color: palette.mixed,
    bg: palette.mixedSoft,
  },
  {
    id: "formaldehyde",
    path: "Path 2",
    title: "Formaldehyde pathway / 甲醛路径",
    intermediate: "formaldehyde",
    status: "positive pathway",
    route: ["Glucose / Fructose", "formaldehyde", "formic acid / formate"],
    riskProducts: [],
    definition: "Most direct C1 route and the primary positive mechanistic path.",
    color: palette.positive,
    bg: palette.positiveSoft,
    featured: true,
  },
  {
    id: "pyruvaldehyde",
    path: "Path 3",
    title: "Pyruvaldehyde pathway / 丙酮醛路径",
    intermediate: "pyruvaldehyde",
    status: "risk pathway",
    route: ["Glucose / Fructose", "pyruvaldehyde", "lactic acid / pyruvic acid / acetic acid"],
    riskProducts: ["lactic acid", "pyruvic acid", "acetic acid"],
    definition: "Main competitive branch; lactic and pyruvic acids indicate side-path accumulation.",
    color: palette.risk,
    bg: palette.riskSoft,
  },
]

const descriptorGroups = [
  ["Stability descriptors", "water stability, hydrothermal stability, metal leaching risk"],
  ["Accessibility descriptors", "PLD, LCD, pore volume, hydrophilic pore environment"],
  ["Active-site descriptors", "metal type, valence state, Lewis acidity, basic sites, open metal sites"],
  ["Functional-group descriptors", "-NH2, -OH, -COOH, defects, Zr-OH, Fe-OH"],
  ["Reaction descriptors", "Eads(HCO3-), Eads(formaldehyde), Eads(glyceraldehyde), Eads(pyruvaldehyde), Eads(formate)"],
  ["Product descriptors", "Y_FA, S_FA_C, Y_lactic, Y_acetic, Y_glycolic, Y_pyruvic, Y_solid"],
]

const validationSteps = [
  "Main reaction test",
  "Formaldehyde feeding test",
  "Glyceraldehyde feeding test",
  "Pyruvaldehyde feeding test",
  "Time-series product analysis",
  "Carbon balance check",
  "NaH13CO3 isotope tracing",
  "DFT adsorption descriptor update",
]

function fmt(value, digits = 3) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "0.000"
  return number.toFixed(digits)
}

function pct(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "0%"
  return `${Math.round(Math.max(0, Math.min(1, number)) * 100)}%`
}

function humanizePathway(value) {
  return String(value || "pending")
    .replace(/_/g, " ")
    .replace(/\bto\b/g, "->")
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
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.2, textTransform: "uppercase" }}>{kicker}</div>
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
      <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 20, fontWeight: 950, lineHeight: 1, marginTop: 7, overflowWrap: "anywhere" }}>{value}</div>
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
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 780 }}>
        <div>
          <div style={{ color: palette.faint, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Prototype access gate</div>
          <h2 style={{ color: palette.text, fontSize: 24, lineHeight: 1.14, margin: "6px 0 0" }}>
            Organic Acid Project / 有机酸项目
          </h2>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.62, margin: "9px 0 0" }}>
            {lang === "zh"
              ? "该访问码校验只在浏览器前端运行，用于原型展示入口。本模块数据仍是 demo / prototype data。"
              : "This access-code check runs only in the browser and is used as a prototype display gate. The module still uses demo / prototype data."}
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
          <div style={{ color: palette.faint, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
            Mechanism-guided MOF screening workbench
          </div>
          <h1 style={{ color: palette.text, fontSize: isNarrow ? 27 : 32, lineHeight: 1.1, letterSpacing: 0, margin: "6px 0 0" }}>
            Organic Acid Project / 有机酸项目
          </h1>
          <p style={{ color: palette.muted, fontSize: 14, lineHeight: 1.6, margin: "9px 0 0", maxWidth: 820 }}>
            Glucose–NaHCO3 conversion to formic acid / formate, guided by formaldehyde-positive routing and byproduct-pathway suppression.
          </p>
          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderLeft: `3px solid ${palette.accent}`, borderRadius: 8, marginTop: 13, padding: 12 }}>
            <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 900, lineHeight: 1.55, overflowWrap: "anywhere" }}>
              Glucose + NaHCO3 + H2O + MOF → formic acid / formate
            </div>
            <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, marginTop: 7 }}>
              Objective: maximize formic acid yield and carbon-based selectivity while suppressing lactic acid, acetic acid, glycolic acid, pyruvic acid, and solid byproducts.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          <MetricCard label="Data status" value="demo / prototype" note="No collaborator-owned or unpublished experimental records are embedded." />
          <MetricCard label="Demo candidates" value={rankedRows.length} note="Independent organic_acid_project_demo.json dataset" />
          <MetricCard label="Current top candidate" value={topCandidate?.mof || "-"} note={topCandidate ? `RGFA ${fmt(topCandidate.rgfaScore)} · ${recommendationForClass(topCandidate.computedClass)}` : "Awaiting data"} />
        </div>
      </div>
    </section>
  )
}

function ReactionPathwayMap({ isNarrow }) {
  return (
    <ProjectSection
      kicker="Reaction pathway map"
      title="Three-pathway Mechanism / 三路径机理"
      note="This map defines the positive pathway, mixed pathway, and byproduct penalty terms used by the RGFA Score."
    >
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "170px minmax(0, 1fr) 190px", alignItems: "stretch" }}>
        <div style={{ background: palette.surface, border: `1px solid ${palette.borderStrong}`, borderRadius: 10, display: "grid", placeItems: "center", minHeight: isNarrow ? 80 : 270, padding: 14, textAlign: "center" }}>
          <div>
            <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Feedstock</div>
            <div style={{ color: palette.text, fontSize: 16, fontWeight: 950, lineHeight: 1.25, marginTop: 7 }}>Glucose / Fructose</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {pathwayRows.map((row) => (
            <article
              key={row.id}
              style={{
                background: row.featured ? palette.positiveSoft : palette.bg,
                border: `1px solid ${row.featured ? row.color : palette.border}`,
                borderLeft: `4px solid ${row.color}`,
                borderRadius: 10,
                boxShadow: row.featured ? "0 10px 26px rgba(20, 124, 67, 0.10)" : "none",
                display: "grid",
                gap: 10,
                gridTemplateColumns: isNarrow ? "1fr" : "minmax(150px, 0.32fr) 26px minmax(160px, 0.34fr) 26px minmax(170px, 0.34fr)",
                alignItems: "center",
                padding: row.featured ? 14 : 12,
              }}
            >
              <div>
                <div style={{ color: row.color, fontSize: 10.5, fontWeight: 950 }}>{row.path} · {row.status}</div>
                <h3 style={{ color: palette.text, fontSize: 14.5, lineHeight: 1.25, margin: "5px 0 0" }}>{row.title}</h3>
                <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{row.definition}</div>
              </div>
              {!isNarrow && <div style={{ color: row.color, fontSize: 18, fontWeight: 900, textAlign: "center" }}>→</div>}
              <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Intermediate</div>
                <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 900, marginTop: 5 }}>{row.intermediate}</div>
              </div>
              {!isNarrow && <div style={{ color: row.color, fontSize: 18, fontWeight: 900, textAlign: "center" }}>→</div>}
              <div style={{ display: "grid", gap: 7 }}>
                <div style={{ background: palette.bg, border: `1px solid ${row.featured ? row.color : palette.border}`, borderRadius: 8, color: palette.text, fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 850, lineHeight: 1.4, padding: 9 }}>
                  {row.route[2]}
                </div>
                {row.riskProducts.length > 0 && (
                  <div style={{ background: row.bg, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 11.5, lineHeight: 1.45, padding: 9 }}>
                    Risk products: {row.riskProducts.join(" / ")}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div style={{ background: palette.surface, border: `1px solid ${palette.borderStrong}`, borderRadius: 10, display: "grid", gap: 10, alignContent: "center", minHeight: isNarrow ? "auto" : 270, padding: 14 }}>
          <div>
            <div style={{ color: palette.positive, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Target output</div>
            <div style={{ color: palette.text, fontSize: 15, fontWeight: 950, lineHeight: 1.3, marginTop: 6 }}>formic acid / formate</div>
          </div>
          <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 10 }}>
            <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Penalty outputs</div>
            <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>
              lactic acid, acetic acid, glycolic acid, pyruvic acid, and solid byproducts
            </div>
          </div>
        </div>
      </div>
    </ProjectSection>
  )
}

function AlgorithmSection({ topCandidate, isNarrow }) {
  const cards = [
    ["Gate", "Material entry check", "waterStabilityScore × accessibilityScore × activeSiteConfidence"],
    ["StepScore", "Reaction-step ability", "A1/A2/A3/A4 reward terms minus B1 byproduct risk; A3 has the highest weight."],
    ["SelectivityFactor", "Product-level objective", "Y_FA and S_FA,C divided by weighted lactic/acetic/glycolic/pyruvic/solid penalties."],
  ]

  return (
    <ProjectSection
      kicker="RGFA score"
      title="RGFA Score Algorithm / 算法评分"
      note="The score is a transparent prototype ranking function for reaction-guided candidate selection."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(290px, 0.75fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <pre style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.65, margin: 0, overflowX: "auto", padding: 13 }}>
{`RGFA Score = Gate × StepScore × SelectivityFactor

Gate =
waterStabilityScore × accessibilityScore × activeSiteConfidence

StepScore =
0.15A1 + 0.20A2 + 0.35A3 + 0.15A4 - 0.15B1

SelectivityFactor =
(Y_FA × S_FA,C) /
(1 + 1.0Y_lactic + 0.8Y_acetic + 0.5Y_glycolic
   + 0.4Y_pyruvic + 0.3Y_solid)`}
          </pre>
          <div style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.55 }}>
            A3 carries the highest weight because it directly measures whether key intermediates are routed toward formic acid.
          </div>
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          {cards.map(([title, subtitle, body]) => (
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

function DescriptorSection() {
  return (
    <ProjectSection
      kicker="Descriptor matrix"
      title="Descriptor Matrix / 描述符体系"
      note="The descriptor matrix connects MOF structure, active sites, pathway intermediates, and product-level labels."
    >
      <div style={{ border: `1px solid ${palette.border}`, borderRadius: 8, overflow: "hidden" }}>
        {descriptorGroups.map(([category, descriptors], index) => (
          <div
            key={category}
            style={{
              background: index % 2 === 0 ? palette.bg : palette.surface,
              borderTop: index === 0 ? "none" : `1px solid ${palette.border}`,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "minmax(170px, 0.35fr) minmax(0, 1fr)",
              padding: "11px 12px",
            }}
          >
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900 }}>{category}</div>
            <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.5, overflowWrap: "anywhere" }}>{descriptors}</div>
          </div>
        ))}
      </div>
    </ProjectSection>
  )
}

function DatasetSection({ rankedRows, status }) {
  return (
    <ProjectSection
      kicker="Independent dataset"
      title="Independent Demo Dataset / 独立数据"
      note="This project reads a standalone prototype dataset and does not write into the general MOF Library data model."
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <MetricCard label="Data file" value="JSON" note="public/data/organic_acid_project_demo.json" />
        <MetricCard label="Records" value={status === "loading" ? "-" : rankedRows.length} note={status === "loaded" ? "Loaded from public/data" : "Loading demo data"} />
        <MetricCard label="Evidence level" value="demo" note="Prototype values for screening workflow display" />
      </div>
    </ProjectSection>
  )
}

function RankingTable({ rankedRows, selectedMof, onSelect }) {
  return (
    <div style={{ maxWidth: "100%", minWidth: 0, overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 780, width: "100%" }}>
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
      <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
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
        <ScoreBar label="A3 intermediate-to-FA" value={candidate.A3} tone={palette.positive} />
        <ScoreBar label="A4 formate release" value={candidate.A4} />
        <ScoreBar label="B1 byproduct risk" value={candidate.B1} tone={palette.risk} />
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Product profile</div>
        {productRows.map(([label, value, color]) => <ScoreBar key={label} label={label} value={value} tone={color} />)}
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 950 }}>Gate factors</div>
        <ScoreBar label="Water stability" value={candidate.waterStabilityScore} />
        <ScoreBar label="Accessibility" value={candidate.accessibilityScore} />
        <ScoreBar label="Active-site confidence" value={candidate.activeSiteConfidence} />
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
      note="Rows are sorted automatically by RGFA Score. Select a candidate to inspect pathway assumptions, gate factors, product labels, and generated explanation."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(300px, 0.75fr)" }}>
        <RankingTable rankedRows={rankedRows} selectedMof={selected?.mof} onSelect={setSelectedMof} />
        <CandidateDetailPanel candidate={selected} />
      </div>
    </ProjectSection>
  )
}

function ValidationSection() {
  return (
    <ProjectSection
      kicker="Validation roadmap"
      title="Validation Roadmap / 后续验证"
      note="The roadmap converts ranked hypotheses into main-reaction tests, pathway-feeding tests, carbon accounting, isotope tracing, and DFT descriptor updates."
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {validationSteps.map((step, index) => (
          <article key={step} style={{ alignItems: "start", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, gridTemplateColumns: "34px minmax(0, 1fr)", padding: 11 }}>
            <div style={{ alignItems: "center", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.accent, display: "flex", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>{index + 1}</div>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 850, lineHeight: 1.42 }}>{step}</div>
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
        <ReactionPathwayMap isNarrow={isNarrow} />
        <AlgorithmSection topCandidate={topCandidate} isNarrow={isNarrow} />
        <DescriptorSection />
        <DatasetSection rankedRows={rankedRows} status={status} />
        {status === "error" ? (
          <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.risk, fontSize: 12.5, fontWeight: 850, padding: 12 }}>
            Demo dataset could not be loaded from public/data/organic_acid_project_demo.json.
          </div>
        ) : (
          <CandidateRankingSection rankedRows={rankedRows} selectedMof={selectedMof} setSelectedMof={setSelectedMof} isNarrow={isNarrow} />
        )}
        <ValidationSection />
      </div>
    </div>
  )
}
