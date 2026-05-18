import { useEffect, useMemo, useState } from "react"
import { fetchDataJson, toolbarBtn, useViewport } from "../../shared"
import { calculateRGFARanking, safeNumber } from "../../utils/rgfaScore"
import { AlgorithmTraceExplorer } from "./AlgorithmTraceExplorer"
import { DynamicDescriptorMatrix } from "./DynamicDescriptorMatrix"
import {
  ChemFormula,
  DescriptorLabel,
  FormulaCard,
  FormulaInline,
  NumericText,
  ORGANIC_ACID_FONT,
  organicAcidPalette as palette,
  pathwayMeta,
  VariableLabel,
} from "./FormulaInline"
import { OrganicAcidPathwayMap } from "./OrganicAcidPathwayMap"

const ACCESS_KEY = "ecomof_organic_acid_project_access"
const PROJECT_PASSWORD = "acid"

const validationSteps = [
  ["Main reaction test", "主反应测试，用于确认当前候选是否支撑甲酸方向的主反应输出。"],
  ["Formaldehyde feeding test", "甲醛投料实验，用于验证 Formaldehyde → Formic acid 正向路径。"],
  ["Glyceraldehyde feeding test", "甘油醛投料实验，用于量化混合路径及 C2 副产物泄漏。"],
  ["Pyruvaldehyde feeding test", "丙酮醛投料实验，用于确认乳酸/丙酮酸风险支路。"],
  ["Time-series product analysis", "时间序列产物分析，用于分离中间体峰值与终产物累计。"],
  ["Carbon balance check", "碳平衡检查，用于决定记录是否适合作为后续建模标签。"],
  ["NaH13CO3 isotope tracing", "同位素示踪，用于确认 HCO3− 对甲酸碳源的真实贡献。"],
  ["DFT descriptor update", "补齐吸附能与位点相关描述符，为后续 A3/A4 更新提供依据。"],
]

const limitationRows = [
  ["演示数据边界 Demo boundary", "当前页面只使用 demo / prototype data，不含真实合作实验结果或保密数据。"],
  ["CRITIC 小样本限制", "当前候选集较小，CRITIC 只用于方法展示，不能替代真实大样本校正。"],
  ["机理先验限制", "A1/A2/A3/A4/B1 权重属于可更新机理先验，应随投料实验和时间序列结果迭代。"],
  ["稳定性验证限制", "MOF 稳定性仍需要反应后 PXRD、ICP、FTIR、SEM/TEM 等实验表征支持。"],
  ["描述符缺口", <><DescriptorLabel descriptor="Eads_HCO3" />、Bader charge 与 formate desorption 仍处于 roadmap 状态。</>],
  ["同位素边界", <><ChemFormula kind="isotopeBicarbonate" /> 示踪用于机制确认，不应在第一轮筛选中被误读为已完成证据。</>],
  ["碳平衡边界", "碳平衡缺失的数据不能被当作高质量机器学习标签或严格比较结论。"],
]

function fmt(value, digits = 3) {
  return safeNumber(value, 0).toFixed(digits)
}

function pct(value) {
  return `${Math.round(Math.max(0, Math.min(1, safeNumber(value, 0))) * 100)}%`
}

function recommendationForClass(candidateClass) {
  if (candidateClass === "A") return "Priority validation / 优先验证"
  if (candidateClass === "B") return "Optimization candidate / 条件优化"
  if (candidateClass === "C") return "Mechanistic candidate / 机理研究"
  return "Not recommended / 暂不推荐"
}

function classTone(candidateClass) {
  if (candidateClass === "A") return palette.positive
  if (candidateClass === "B") return palette.accent
  if (candidateClass === "C") return palette.mixed
  return palette.risk
}

function dominantContribution(candidate) {
  const trace = candidate?.trace
  if (!trace) return "A3"
  return ["A1", "A2", "A3", "A4"]
    .map((key) => [key, safeNumber(trace.stepScore[key]?.contribution, 0)])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "A3"
}

function dominantPenalty(candidate) {
  const trace = candidate?.trace
  if (!trace) return "Y_lactic"
  return ["Y_lactic", "Y_acetic", "Y_glycolic", "Y_pyruvic", "Y_solid"]
    .map((key) => [key, safeNumber(trace.selectivityFactor.penaltyTerms[key]?.contribution, 0)])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "Y_lactic"
}

function dominantPathway(candidate) {
  const rows = Object.entries(candidate?.pathwayScores || {})
  return rows.sort((a, b) => safeNumber(b[1], 0) - safeNumber(a[1], 0))[0]?.[0] || "formaldehyde_to_formic"
}

function readablePathway(pathwayKey) {
  return pathwayMeta[pathwayKey]?.labelZh || String(pathwayKey || "pending").replace(/_/g, " ")
}

function nextStepLabel(candidate) {
  return candidate?.recommendation?.nextExperiment?.[0] || "Main reaction test / 主反应测试"
}

function SectionShell({ kicker, title, note, children }) {
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 18 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.18, textTransform: "uppercase" }}>{kicker}</div>
        <h2 style={{ color: palette.text, fontSize: 22, lineHeight: 1.2, margin: 0 }}>{title}</h2>
        {note ? <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

function StatCard({ label, value, note, tone = palette.text }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 11px" }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>{label}</div>
      <div style={{ color: tone, fontSize: 15, fontWeight: 700, lineHeight: 1.15, marginTop: 5 }}>{value}</div>
      {note ? <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4, marginTop: 4 }}>{note}</div> : null}
    </div>
  )
}

function ScoreBar({ label, value, tone = palette.accent, note }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        <NumericText style={{ color: palette.text, fontSize: 11.5, fontWeight: 800 }}>{fmt(value, 2)}</NumericText>
      </div>
      {note ? <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{note}</div> : null}
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ background: tone, height: "100%", width: pct(value) }} />
      </div>
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
        // Session persistence is optional for this prototype gate.
      }
      setError("")
      onUnlock()
      return
    }
    setError(lang === "zh" ? "访问码不匹配，请重新输入。" : "Access code does not match. Try again.")
  }

  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        <div>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Prototype access gate</div>
          <h1 style={{ color: palette.text, fontSize: 24, lineHeight: 1.14, margin: "6px 0 0" }}>Organic Acid Project / 有机酸项目</h1>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
            {lang === "zh"
              ? "该访问码仅用于前端原型展示入口。本模块数据为 demo / prototype data。"
              : "This access code is only used as a prototype display gate. This module uses demo / prototype data."}
          </p>
        </div>
        <form onSubmit={submit} style={{ alignItems: "end", display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 280px) auto" }}>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ color: palette.text, fontSize: 12, fontWeight: 700 }}>{lang === "zh" ? "前端访问码" : "Front-end access code"}</span>
            <input
              type="password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              style={{
                background: palette.surface,
                border: `1px solid ${error ? palette.risk : palette.borderStrong}`,
                borderRadius: 10,
                color: palette.text,
                fontFamily: ORGANIC_ACID_FONT,
                fontSize: 14,
                minHeight: 38,
                outline: "none",
                padding: "0 12px",
              }}
            />
          </label>
          <button
            type="submit"
            style={{ ...toolbarBtn(t), background: palette.accent, borderColor: palette.accent, color: "#fff", justifyContent: "center", minHeight: 38, padding: "8px 14px", width: isNarrow ? "100%" : "auto" }}
          >
            {lang === "zh" ? "进入项目" : "Enter project"}
          </button>
        </form>
        {error ? <div style={{ color: palette.risk, fontSize: 12, fontWeight: 700 }}>{error}</div> : null}
      </div>
    </section>
  )
}

function ProjectObjectiveSection({ topCandidate, rankedRows, isNarrow }) {
  return (
    <SectionShell
      kicker="Project objective"
      title="项目目标 Project Objective"
      note="白底、紧凑、学术化的有机酸筛选工作台，用于展示从三路径机理到算法追踪、候选排序和描述符填表的完整界面。"
    >
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.1fr) minmax(280px, 0.9fr)" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 7 }}>
            <h1 style={{ color: palette.text, fontSize: 24, lineHeight: 1.1, margin: 0 }}>有机酸项目 Organic Acid Project</h1>
            <p style={{ color: palette.muted, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              面向葡萄糖–<ChemFormula kind="sodiumBicarbonate" /> 协同转化为甲酸的机理导向 MOF 筛选平台。当前展示的是可追踪算法工作台，不发布真实实验结论。
            </p>
          </div>

          <FormulaCard title="反应目标 Reaction objective">
            <FormulaInline size={14} weight={600} gap="4px 8px">
              <span>Glucose</span><span>+</span><span><ChemFormula kind="sodiumBicarbonate" /></span><span>+</span><span><ChemFormula kind="water" /></span><span>+</span><span>MOF</span><span>→</span><span>formic acid / formate</span>
            </FormulaInline>
            <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
              目标是同时提升 <VariableLabel name="Y_FA" /> 与 <VariableLabel name="S_FA_C" />，并抑制乳酸、乙酸、乙醇酸、丙酮酸和固相副产物。
            </div>
          </FormulaCard>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <FormulaCard title="RGFA 公式 RGFA formula">
              <FormulaInline size={13.5} weight={600}>
                <span>RGFA Score</span><span>=</span><span>Gate</span><span>×</span><span>StepScore</span><span>×</span><span>SelectivityFactor</span>
              </FormulaInline>
            </FormulaCard>
            <FormulaCard title="选择性因子 SelectivityFactor">
              <FormulaInline size={13.5} weight={600}>
                <span><VariableLabel name="Y_FA" /></span><span>×</span><span><VariableLabel name="S_FA_C" /></span><span>/</span><span>(1 + weighted penalties)</span>
              </FormulaInline>
            </FormulaCard>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <StatCard label="演示候选 Demo candidates" value={<NumericText>{rankedRows.length}</NumericText>} note="独立 JSON demo dataset" />
          <StatCard label="当前最高优先级 Current top candidate" value={topCandidate?.mof || "-"} note={topCandidate ? `RGFA ${fmt(topCandidate.rgfaScore)} · ${recommendationForClass(topCandidate.computedClass)}` : "waiting for data"} tone={palette.accent} />
          <StatCard label="数据边界 Data boundary" value="Demo / Prototype" note="不引入真实合作数据或保密实验数据" />
        </div>
      </div>
    </SectionShell>
  )
}

function RankingTable({ rankedRows, selectedMof, onSelect }) {
  return (
    <div style={{ maxWidth: "100%", overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", minWidth: 560, width: "100%" }}>
        <thead>
          <tr>
            {["排名 Rank", "候选 MOF", "评分 RGFA Score", "类别 Class", "变化 Rank shift"].map((head) => (
              <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 800, padding: "8px 9px", textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankedRows.map((row) => {
            const selected = row.mof === selectedMof
            return (
              <tr
                key={row.mof}
                onClick={() => onSelect(row.mof)}
                style={{ background: selected ? palette.accentSoft : "transparent", cursor: "pointer" }}
              >
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontSize: 12.5, fontWeight: 700, padding: "10px 9px", whiteSpace: "nowrap" }}>
                  <NumericText>#{row.rgfaRank}</NumericText>
                </td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 700, padding: "10px 9px" }}>{row.mof}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, padding: "10px 9px", whiteSpace: "nowrap" }}>
                  <NumericText>{fmt(row.rgfaScore)}</NumericText>
                </td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: classTone(row.computedClass), fontSize: 12.5, fontWeight: 700, padding: "10px 9px" }}>{row.computedClass}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "10px 9px", whiteSpace: "nowrap" }}>
                  <NumericText>#{row.yieldOnlyRank}</NumericText> → <NumericText>#{row.rgfaRank}</NumericText>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CandidateDetailPanel({ candidate }) {
  if (!candidate) return null
  const driver = dominantContribution(candidate)
  const penalty = dominantPenalty(candidate)
  const topPath = dominantPathway(candidate)
  const trace = candidate.trace

  return (
    <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 10, minWidth: 0, padding: 12, position: "relative", width: "100%", alignSelf: "start" }}>
      <div style={{ borderBottom: `1px solid ${palette.border}`, display: "grid", gap: 4, paddingBottom: 9 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>候选详情 Candidate Detail</div>
        <div style={{ color: palette.text, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{candidate.mof}</div>
        <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>
          <NumericText>Yield-only #{candidate.yieldOnlyRank}</NumericText> → <NumericText>RGFA #{candidate.rgfaRank}</NumericText>
        </div>
        <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4 }}>Evidence level: {candidate.evidenceLevel || "demo"}</div>
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <StatCard label="RGFA Score" value={<NumericText>{fmt(candidate.rgfaScore)}</NumericText>} tone={palette.positive} />
        <StatCard label="Class" value={candidate.computedClass} tone={classTone(candidate.computedClass)} />
        <StatCard label="Main driver" value={<><VariableLabel name={driver} /></>} note={driver === "A3" ? "中间体转甲酸是主贡献项" : "当前排序主导因子"} />
        <StatCard label="Main penalty" value={<><VariableLabel name={penalty} /></>} note="当前最大副产物惩罚项" tone={palette.risk} />
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        <div style={{ color: palette.text, fontSize: 13.5, fontWeight: 700 }}>Pathway fingerprint / 路径指纹</div>
        {Object.keys(pathwayMeta).map((key) => (
          <ScoreBar
            key={key}
            label={`${pathwayMeta[key].labelZh} / ${pathwayMeta[key].labelEn}`}
            value={candidate.pathwayScores?.[key]}
            tone={pathwayMeta[key].color}
            note={key === topPath ? "当前主导路径" : pathwayMeta[key].note}
          />
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: palette.text, fontSize: 13.5, fontWeight: 700 }}>Why this candidate / 为什么是它</div>
        <div style={{ display: "grid", gap: 6 }}>
          {candidate.explanations.slice(0, 3).map((reason) => (
            <div key={reason} style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>
              • {reason}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: palette.text, fontSize: 13.5, fontWeight: 700 }}>Gate summary / 门槛摘要</div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <StatCard label="Water stability" value={<NumericText>{fmt(candidate.waterStabilityScore, 2)}</NumericText>} />
          <StatCard label="Accessibility" value={<NumericText>{fmt(candidate.accessibilityScore, 2)}</NumericText>} />
          <StatCard label="Active-site confidence" value={<NumericText>{fmt(candidate.activeSiteConfidence, 2)}</NumericText>} />
        </div>
      </div>

      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>Recommended next step</div>
        <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, marginTop: 6 }}>{nextStepLabel(candidate)}</div>
        <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{trace.recommendation.reason}</div>
      </div>
    </aside>
  )
}

function CandidateRankingSection({ rankedRows, selectedMof, setSelectedMof, isNarrow }) {
  const selected = rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0] || null

  return (
    <SectionShell
      kicker="Candidate ranking"
      title="候选排序 Candidate Ranking"
      note="按 RGFA Score 与 CRITIC-adjusted penalties 紧凑排序。表格只保留核心字段，点击任一候选会同步切换 Algorithm Trace Explorer。"
    >
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: isNarrow ? "1fr" : "minmax(520px, 1fr) minmax(420px, 0.9fr)", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 10, minWidth: 0, position: "relative", width: "100%" }}>
          <div style={{ alignItems: "center", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", padding: "9px 11px" }}>
            <div style={{ fontSize: 12, lineHeight: 1.45 }}>
              Sorted by <span style={{ color: palette.text, fontWeight: 700 }}>RGFA Score</span> with CRITIC-adjusted penalties
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.45 }}>
              <NumericText>{rankedRows.length}</NumericText> records · selected {selected?.mof || "pending"}
            </div>
          </div>
          <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, minWidth: 0, overflowX: "auto", padding: 10, position: "relative", width: "100%" }}>
            <RankingTable rankedRows={rankedRows} selectedMof={selected?.mof} onSelect={setSelectedMof} />
          </div>
        </div>
        <div style={{ minWidth: 0, position: "relative", width: "100%" }}>
          <CandidateDetailPanel candidate={selected} />
        </div>
      </div>
    </SectionShell>
  )
}

function ValidationSection() {
  return (
    <SectionShell
      kicker="Validation roadmap"
      title="验证路线图 Validation Roadmap"
      note="把当前排序结果转成后续主反应测试、路径投料、同位素与 DFT 更新的执行清单。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {validationSteps.map(([title, body], index) => (
          <article key={title} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, gridTemplateColumns: "28px minmax(0, 1fr)", padding: 11 }}>
            <div style={{ alignItems: "center", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.accent, display: "flex", fontSize: 11.5, fontWeight: 700, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</div>
            <div>
              <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

function OrganicLimitationsSection() {
  return (
    <SectionShell
      kicker="Limitations"
      title="限制说明 Limitations"
      note="限制说明用于界定当前工作台结果的使用边界，防止把候选优先级误读为已验证科学结论。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {limitationRows.map(([title, body]) => (
          <article key={title} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 11 }}>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
            <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>{body}</div>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

export function OrganicAcidProject({ lang = "zh", t }) {
  const { isNarrow } = useViewport()
  const [hasAccess, setHasAccess] = useState(false)
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState("idle")
  const [selectedMof, setSelectedMof] = useState("")
  const [activeTraceStep, setActiveTraceStep] = useState("raw")

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

  const rankedRows = useMemo(() => calculateRGFARanking(rows), [rows])
  const selectedCandidate = useMemo(() => (
    rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0] || null
  ), [rankedRows, selectedMof])

  useEffect(() => {
    if (!rankedRows.length) return
    if (!selectedMof || !rankedRows.some((row) => row.mof === selectedMof)) {
      setSelectedMof(rankedRows[0].mof)
    }
  }, [rankedRows, selectedMof])

  if (!hasAccess) {
    return (
      <div className="organic-acid-page" style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16, fontFamily: ORGANIC_ACID_FONT }}>
        <PrototypeGate lang={lang} t={t} onUnlock={() => setHasAccess(true)} />
      </div>
    )
  }

  const topCandidate = rankedRows[0] || null

  return (
    <div className="organic-acid-page" style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16, fontFamily: ORGANIC_ACID_FONT }}>
      <div style={{ display: "grid", gap: 14, margin: "0 auto", maxWidth: 1220 }}>
        <ProjectObjectiveSection topCandidate={topCandidate} rankedRows={rankedRows} isNarrow={isNarrow} />
        <OrganicAcidPathwayMap lang={lang} />
        <AlgorithmTraceExplorer
          rankedRows={rankedRows}
          selectedMof={selectedMof}
          setSelectedMof={setSelectedMof}
          activeStep={activeTraceStep}
          onActiveStepChange={setActiveTraceStep}
        />
        {status === "error" ? (
          <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 12, color: palette.risk, fontSize: 12.5, fontWeight: 700, padding: 12 }}>
            Demo dataset could not be loaded from public/data/organic_acid_project_demo.json.
          </div>
        ) : (
          <>
            <CandidateRankingSection rankedRows={rankedRows} selectedMof={selectedMof} setSelectedMof={setSelectedMof} isNarrow={isNarrow} />
            <DynamicDescriptorMatrix candidate={selectedCandidate} activeStep={activeTraceStep} />
          </>
        )}
        <ValidationSection />
        <OrganicLimitationsSection />
      </div>
    </div>
  )
}
