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
  positive: "#15803D",
  positiveSoft: "#ECFDF3",
  risk: "#B91C1C",
  riskSoft: "#FEF2F2",
  mixed: "#B45309",
  mixedSoft: "#FFF7ED",
}

const pathwayRows = [
  {
    id: "glyceraldehyde",
    path: "Path 1",
    title: "glyceraldehyde pathway",
    equation: "glyceraldehyde -> formic acid or glycolic acid / acetic acid",
    status: "mixed pathway",
    color: palette.mixed,
    bg: palette.mixedSoft,
  },
  {
    id: "formaldehyde",
    path: "Path 2",
    title: "formaldehyde pathway",
    equation: "formaldehyde -> formic acid",
    status: "positive pathway",
    color: palette.positive,
    bg: palette.positiveSoft,
  },
  {
    id: "pyruvaldehyde",
    path: "Path 3",
    title: "pyruvaldehyde pathway",
    equation: "pyruvaldehyde -> lactic acid / pyruvic acid / acetic acid",
    status: "risk pathway",
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
  "NaH13CO3 isotope tracing",
  "DFT adsorption descriptor update",
]

function fmt(value, digits = 3) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "0.000"
  return number.toFixed(digits)
}

function humanizePathway(value) {
  return String(value || "pending")
    .replace(/_/g, " ")
    .replace(/\bto\b/g, "->")
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
      <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 20, fontWeight: 950, lineHeight: 1, marginTop: 7 }}>{value}</div>
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
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.35fr) minmax(260px, 0.65fr)", alignItems: "start" }}>
        <div>
          <div style={{ color: palette.faint, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Prototype access gate</div>
          <h1 style={{ color: palette.text, fontSize: isNarrow ? 27 : 32, lineHeight: 1.1, letterSpacing: 0, margin: "6px 0 0" }}>
            Organic Acid Project / 有机酸项目
          </h1>
          <p style={{ color: palette.muted, fontSize: 14, lineHeight: 1.6, margin: "9px 0 0", maxWidth: 760 }}>
            Mechanism-guided MOF screening for glucose–NaHCO3 conversion to formic acid
          </p>
          <div style={{ background: palette.accentSoft, borderLeft: `3px solid ${palette.accent}`, color: palette.muted, fontSize: 12.5, lineHeight: 1.58, marginTop: 13, padding: "10px 12px" }}>
            Current dataset is demo / prototype data. Scores indicate a front-end screening hypothesis and do not replace reaction validation.
          </div>
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          <MetricCard label="Demo records" value={rankedRows.length} note="public/data/organic_acid_project_demo.json" />
          <MetricCard label="Top RGFA candidate" value={topCandidate?.mof || "-"} note={topCandidate ? `RGFA ${fmt(topCandidate.rgfaScore)} · Class ${topCandidate.computedClass}` : "Awaiting data"} />
        </div>
      </div>
    </section>
  )
}

function PrincipleSection({ isNarrow }) {
  return (
    <ProjectSection
      kicker="Principle"
      title="Project Principle / 项目原理"
      note="Evaluate whether a MOF can promote formic acid generation while suppressing lactic, acetic, glycolic, and pyruvic side routes."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.95fr) minmax(0, 1.05fr)" }}>
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Reaction target</div>
          <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 850, lineHeight: 1.6, marginTop: 9, overflowWrap: "anywhere" }}>
            Glucose + NaHCO3 + H2O + MOF → Formic acid / formate + byproducts
          </div>
        </div>
        <div style={{ color: palette.muted, fontSize: 13, lineHeight: 1.65 }}>
          该模块评估 MOF 是否能够促进葡萄糖-NaHCO3 协同转化中的甲酸 / 甲酸盐生成，并降低乳酸、乙酸、乙醇酸、丙酮酸以及固体副产物路径的相对风险。评分仅作为候选排序假设，后续需要主反应、路径投料和同位素追踪共同验证。
        </div>
      </div>
    </ProjectSection>
  )
}

function MechanismSection({ isNarrow }) {
  return (
    <ProjectSection
      kicker="Mechanism"
      title="Three-pathway Mechanism / 三路径机理"
      note="The project separates productive formic-acid routes from mixed and risk pathways before ranking candidates."
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {pathwayRows.map((row) => (
          <article key={row.id} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderTop: `3px solid ${row.color}`, borderRadius: 8, minHeight: 168, padding: 13 }}>
            <div style={{ color: row.color, fontSize: 11, fontWeight: 950 }}>{row.path}</div>
            <h3 style={{ color: palette.text, fontSize: 15, lineHeight: 1.25, margin: "6px 0 0" }}>{row.title}</h3>
            <div style={{ background: row.bg, border: `1px solid ${palette.border}`, borderRadius: 7, color: palette.text, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.55, marginTop: 11, padding: 10 }}>
              {row.equation}
            </div>
            <div style={{ color: row.color, fontSize: 12, fontWeight: 850, marginTop: 10 }}>{row.status}</div>
          </article>
        ))}
      </div>
    </ProjectSection>
  )
}

function AlgorithmSection({ topCandidate, isNarrow }) {
  return (
    <ProjectSection
      kicker="Scoring"
      title="RGFA Score Algorithm / 算法评分"
      note="RGFA combines a front-end gate, mechanistic step score, and product selectivity factor."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(260px, 0.75fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <pre style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.65, margin: 0, overflowX: "auto", padding: 13 }}>
{`RGFA Score = Gate × StepScore × SelectivityFactor

StepScore =
0.15A1 + 0.20A2 + 0.35A3 + 0.15A4 - 0.15B1

SelectivityFactor =
Y_FA × S_FA,C /
(1 + 1.0Y_lactic + 0.8Y_acetic + 0.5Y_glycolic
   + 0.4Y_pyruvic + 0.3Y_solid)`}
          </pre>
          <div style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.55 }}>
            Gate uses water stability, accessibility, and active-site confidence in the prototype rule.
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            ["A1", "glucose isomerization / activation ability"],
            ["A2", "formic-acid precursor generation ability"],
            ["A3", "intermediate-to-formic-acid conversion ability"],
            ["A4", "formate release and stability ability"],
            ["B1", "byproduct pathway risk"],
          ].map(([key, value]) => (
            <div key={key} style={{ borderBottom: `1px solid ${palette.border}`, display: "grid", gap: 9, gridTemplateColumns: "44px minmax(0, 1fr)", padding: "0 0 8px" }}>
              <div style={{ color: palette.accent, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 950 }}>{key}</div>
              <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.45 }}>{value}</div>
            </div>
          ))}
          {topCandidate ? (
            <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, marginTop: 4, padding: 11 }}>
              <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Top candidate score trace</div>
              <div style={{ color: palette.text, fontSize: 13, fontWeight: 900, marginTop: 6 }}>{topCandidate.mof}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
                Gate {fmt(topCandidate.gateScore)} · StepScore {fmt(topCandidate.stepScore)} · SelectivityFactor {fmt(topCandidate.selectivityFactor)}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProjectSection>
  )
}

function DescriptorSection() {
  return (
    <ProjectSection
      kicker="Descriptors"
      title="Descriptor Matrix / 描述符体系"
      note="Descriptor groups are kept as a matrix so new fields can be attached to scoring and validation without changing page-level ranking logic."
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
      kicker="Dataset"
      title="Independent Demo Dataset / 独立数据"
      note="This project reads its own static demo dataset and does not reuse the general CatalysisLab task table."
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
      <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
        <thead>
          <tr>
            {["Rank", "MOF", "RGFA Score", "Class", "Dominant pathway", "Main risk pathway"].map((head) => (
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
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 900, padding: "10px" }}>{row.mof}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontFamily: FONT_MONO, fontSize: 12.5, padding: "10px" }}>{fmt(row.rgfaScore)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 900, padding: "10px" }}>{row.computedClass}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px" }}>{humanizePathway(row.dominantPathway)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px" }}>{humanizePathway(row.riskPathway)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CandidateCard({ row, rank }) {
  return (
    <article style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 9, padding: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div>
          <div style={{ color: palette.accent, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 950 }}>#{rank}</div>
          <h3 style={{ color: palette.text, fontSize: 15, lineHeight: 1.25, margin: "4px 0 0" }}>{row.mof}</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 16, fontWeight: 950 }}>{fmt(row.rgfaScore)}</div>
          <div style={{ color: palette.faint, fontSize: 11 }}>Class {row.computedClass}</div>
        </div>
      </div>
      <dl style={{ display: "grid", gap: 7, margin: "11px 0 0" }}>
        {[
          ["Dominant pathway", humanizePathway(row.dominantPathway)],
          ["Main risk pathway", humanizePathway(row.riskPathway)],
          ["Evidence level", row.evidenceLevel || "demo"],
        ].map(([label, value]) => (
          <div key={label} style={{ borderTop: `1px solid ${palette.border}`, display: "grid", gap: 8, gridTemplateColumns: "120px minmax(0, 1fr)", paddingTop: 7 }}>
            <dt style={{ color: palette.faint, fontSize: 11 }}>{label}</dt>
            <dd style={{ color: palette.text, fontSize: 12, lineHeight: 1.45, margin: 0 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <div style={{ borderTop: `1px solid ${palette.border}`, marginTop: 10, paddingTop: 9 }}>
        <div style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}>Why this candidate?</div>
        <ul style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, margin: "6px 0 0", paddingLeft: 17 }}>
          {row.explanations.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </div>
    </article>
  )
}

function CandidateRankingSection({ rankedRows, selectedMof, setSelectedMof, isNarrow }) {
  const selected = rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0]
  return (
    <ProjectSection
      kicker="Ranking"
      title="Candidate Ranking / 候选排序"
      note="Candidates are automatically ranked by RGFA Score using the prototype formula and demo descriptor fields."
    >
      <div style={{ display: "grid", gap: 13, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.25fr) minmax(270px, 0.75fr)" }}>
        <RankingTable rankedRows={rankedRows} selectedMof={selected?.mof} onSelect={setSelectedMof} />
        {selected ? (
          <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 13 }}>
            <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Selected candidate explanation</div>
            <h3 style={{ color: palette.text, fontSize: 16, lineHeight: 1.25, margin: "6px 0 0" }}>{selected.mof}</h3>
            <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 6 }}>
              RGFA {fmt(selected.rgfaScore)} · Class {selected.computedClass} · Gate {fmt(selected.gateScore)}
            </div>
            <ul style={{ color: palette.muted, fontSize: 12, lineHeight: 1.6, margin: "10px 0 0", paddingLeft: 18 }}>
              {selected.explanations.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", marginTop: 13 }}>
        {rankedRows.map((row, index) => <CandidateCard key={row.mof} row={row} rank={index + 1} />)}
      </div>
    </ProjectSection>
  )
}

function ValidationSection() {
  return (
    <ProjectSection
      kicker="Validation"
      title="Validation Roadmap / 后续验证"
      note="The roadmap turns ranking hypotheses into testable reaction and descriptor updates."
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
        <PrincipleSection isNarrow={isNarrow} />
        <MechanismSection isNarrow={isNarrow} />
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
