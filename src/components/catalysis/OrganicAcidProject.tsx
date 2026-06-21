// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  DEFAULT_CANDIDATE_DATA_MODE,
  fetchDataJson,
  getGlobalMofCandidates,
  getOrganicAcidExperimentRecords,
  toolbarBtn,
  useViewport,
} from "../../shared"
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
  SCIENTIFIC_TOKEN_FONT,
  organicAcidPalette as palette,
  pathwayMeta,
  VariableLabel,
} from "./FormulaInline"
import { OrganicAcidExperimentFeedbackPanel } from "./OrganicAcidExperimentFeedbackPanel"
import { OrganicAcidGraphWorkbench } from "./OrganicAcidGraphWorkbench"
import { OrganicAcidHostGuestWorkbench } from "./OrganicAcidHostGuestWorkbench"
import { CandidatePrioritizationWorkspace } from "./CandidatePrioritizationWorkspace"
import { OrganicAcidInteractionWorkbench } from "./OrganicAcidInteractionWorkbench"
import { CollapsibleResearchSection, SectionLayoutControls } from "../common/CollapsibleResearchSection"
import { CompactDataModeBar } from "../module/ModuleTop"
import { DataStatusSummary, OpenMofIntegrationReport } from "../data/OpenMofIntegrationReport"

const ACCESS_KEY = "ecomof_organic_acid_project_access"
const PROJECT_PASSWORD = "acid"

const validationSteps = [
  ["Main reaction test", "主反应测试，用于确认当前候选是否支撑甲酸方向的主反应输出。"],
  ["Formaldehyde feeding test", "甲醛投料实验，用于验证 Formaldehyde → Formic acid 正向路径。"],
  ["Glyceraldehyde feeding test", "甘油醛投料实验，用于量化混合路径及 C2 副产物泄漏。"],
  ["Pyruvaldehyde feeding test", "丙酮醛投料实验，用于确认乳酸/丙酮酸风险支路。"],
  ["Time-series product analysis", "时间序列产物分析，用于分离中间体峰值与终产物累计。"],
  ["Carbon balance check", "碳平衡检查，用于决定记录是否适合作为后续建模标签。"],
  ["NaH13CO3 isotope tracing", "同位素示踪，用于确认 HCO₃⁻ 对甲酸碳源的真实贡献。"],
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
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {lang === "zh" ? "前端访问入口" : "Access Gate / Frontend Passcode"}
          </div>
          <h1 style={{ color: palette.text, fontSize: 24, lineHeight: 1.14, margin: "6px 0 0" }}>
            {lang === "zh" ? "有机酸路径工作台" : "Organic Acid Workspace"}
          </h1>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
            {lang === "zh"
              ? "已启用前端访问口令，用于将实验性有机酸流程与催化总览分开展示。该口令仅为展示层访问门槛，不是真正的安全认证。"
              : "Frontend passcode is enabled to keep this experimental workflow separate from the overview. It is a presentation gate, not secure authentication."}
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
            style={{ ...toolbarBtn(t), background: palette.accent, border: `1px solid ${palette.accent}`, color: "#fff", justifyContent: "center", minHeight: 38, padding: "8px 14px", width: isNarrow ? "100%" : "auto" }}
          >
            {lang === "zh" ? "进入项目" : "Enter project"}
          </button>
        </form>
        {error ? <div style={{ color: palette.risk, fontSize: 12, fontWeight: 700 }}>{error}</div> : null}
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 11.8, lineHeight: 1.55, padding: 10 }}>
          {lang === "zh"
            ? "用途：恢复有机酸独立子工作台入口；解锁后可查看算法追踪器、路径显示图、图论网络、证据矩阵、优先级矩阵和候选物队列。"
            : "Purpose: restore the organic-acid workspace entry. Unlock to inspect the algorithm tracker, pathway map, graph network, evidence matrix, priority matrix, and candidate queue."}
        </div>
      </div>
    </section>
  )
}

function ProjectObjectiveSection({ topCandidate, rankedRows, isNarrow }) {
  return (
    <SectionShell
      kicker="筛选目标"
      title="有机酸筛选工作台目标"
      note="从反应约束出发，展示 Al-MOF 骨架筛选、第二金属推荐、算法追踪与验证路线；当前不发布真实实验结论。"
    >
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.1fr) minmax(280px, 0.9fr)" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 7 }}>
            <h1 style={{ color: palette.text, fontSize: 24, lineHeight: 1.1, margin: 0 }}>有机酸项目</h1>
            <p style={{ color: palette.muted, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              面向葡萄糖–<ChemFormula kind="sodiumBicarbonate" /> 协同转化为甲酸的机理导向 MOF 筛选平台。当前展示的是可追踪算法工作台，不发布真实实验结论。
            </p>
          </div>

          <FormulaCard title="反应目标">
            <FormulaInline size={14} weight={600} gap="4px 8px">
              <span>Glucose</span><span>+</span><span><ChemFormula kind="sodiumBicarbonate" /></span><span>+</span><span><ChemFormula kind="water" /></span><span>+</span><span>MOF</span><span>→</span><span>formic acid / formate</span>
            </FormulaInline>
            <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
              目标是同时提升 <VariableLabel name="Y_FA" /> 与 <VariableLabel name="S_FA_C" />，并抑制乳酸、乙酸、乙醇酸、丙酮酸和固相副产物。
            </div>
          </FormulaCard>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <FormulaCard title="RGFA 评分公式">
              <FormulaInline size={13.5} weight={600}>
                <span>RGFA Score</span><span>=</span><span>Gate</span><span>×</span><span>StepScore</span><span>×</span><span>SelectivityFactor</span>
              </FormulaInline>
            </FormulaCard>
            <FormulaCard title="选择性因子">
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

function ResearchValidationEntryPanel({ lang }) {
  const zh = lang === "zh"
  const links = [
    ["#organic-acid-research-validation", zh ? "进入研究验证中心" : "Enter Research Validation Center", zh ? "证据覆盖、矩阵、队列与图谱总入口。" : "Hub for coverage, matrix, queue, and graph."],
    ["#organic-acid-evidence-coverage", zh ? "查看证据覆盖" : "View Evidence Coverage", zh ? "按文献、实验、专家审阅和派生来源审计覆盖。": "Audit literature, experimental, expert-review, and derived coverage."],
    ["#organic-acid-confidence-matrix", zh ? "查看置信度矩阵" : "View Confidence Matrix", zh ? "按目标产物、证据类型和置信等级筛选。": "Filter by target product, evidence type, and confidence level."],
    ["#organic-acid-priority-queue", zh ? "查看候选优先队列" : "View Priority Queue", zh ? "把候选转成下一步实验任务。": "Convert candidates into next-experiment tasks."],
    ["#organic-acid-knowledge-graph", zh ? "查看知识图谱" : "View Knowledge Graph", zh ? "联动候选、证据、反应与实验节点。": "Link candidates, evidence, reaction, and experiment nodes."],
  ]
  return (
    <section id="organic-acid-validation-loop-entry" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 14, scrollMarginTop: 118 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Research validation loop</div>
        <h2 style={{ color: palette.text, fontSize: 18, lineHeight: 1.2, margin: 0 }}>
          {zh ? "有机酸研究验证闭环入口" : "Organic Acid Research Validation Loop Entry"}
        </h2>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
          {zh
            ? "从路径网络、算法追踪和候选排序进入 V3.7/V3.8 研究验证中心；所有结果保持 demo / proxy / inferred 边界和字段级溯源。"
            : "Move from pathway network, algorithm trace, and candidate prioritization into the V3.7/V3.8 validation center; all results keep demo / proxy / inferred boundaries and field-level provenance."}
        </p>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {links.map(([href, label, note]) => (
          <a key={href} href={href} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.text, display: "grid", gap: 5, minHeight: 72, padding: 10, textDecoration: "none" }}>
            <strong style={{ color: palette.accent, fontSize: 12.5, lineHeight: 1.35 }}>{label}</strong>
            <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{note}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidProject({ lang = "zh", t }) {
  const { isNarrow } = useViewport()
  const [hasAccess, setHasAccess] = useState(false)
  const [rows, setRows] = useState([])
  const [candidateRows, setCandidateRows] = useState([])
  const [summaryData, setSummaryData] = useState({ openSeed: [], experiments: [] })
  const candidateDataMode = DEFAULT_CANDIDATE_DATA_MODE
  const [candidateStatus, setCandidateStatus] = useState("idle")
  const [status, setStatus] = useState("idle")
  const [reactionRules, setReactionRules] = useState([])
  const [evidenceItems, setEvidenceItems] = useState([])
  const [selectedMof, setSelectedMof] = useState("")
  const [selectedPathwayCandidateId, setSelectedPathwayCandidateId] = useState("")
  const [selectedRuleId, setSelectedRuleId] = useState(null)
  const [selectedPathwayNodeId, setSelectedPathwayNodeId] = useState(null)
  const [selectedOrganicPathway, setSelectedOrganicPathway] = useState("formaldehyde")
  const [graphFocusEdgeIds, setGraphFocusEdgeIds] = useState([])
  const [activeTraceStep, setActiveTraceStep] = useState("descriptor")
  const [layoutCommand, setLayoutCommand] = useState(null)

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

  useEffect(() => {
    if (!hasAccess) return
    let live = true
    Promise.all([
      getGlobalMofCandidates({ throwOnError: false }),
      getOrganicAcidExperimentRecords({ throwOnError: false }),
    ]).then(([openSeed, experiments]) => {
      if (!live) return
      setSummaryData({
        openSeed: Array.isArray(openSeed) ? openSeed : [],
        experiments: Array.isArray(experiments) ? experiments : [],
      })
    })
    return () => {
      live = false
    }
  }, [hasAccess])

  useEffect(() => {
    if (!hasAccess) return
    let live = true
    Promise.all([
      fetchDataJson("organic_acid_reaction_rules.json", []),
      fetchDataJson("organic_acid_evidence_items.json", []),
    ]).then(([rules, evidence]) => {
      if (!live) return
      setReactionRules(Array.isArray(rules) ? rules : [])
      setEvidenceItems(Array.isArray(evidence) ? evidence : [])
    }).catch(() => {
      if (!live) return
      setReactionRules([])
      setEvidenceItems([])
    })
    return () => {
      live = false
    }
  }, [hasAccess])

  useEffect(() => {
    if (!hasAccess) return
    let live = true
    setCandidateStatus("loading")
    getGlobalMofCandidates({ throwOnError: false })
      .then(data => {
        if (!live) return
        const nextRows = Array.isArray(data) ? data : []
        setCandidateRows(nextRows)
        setCandidateStatus(nextRows.length ? "loaded" : "empty")
      })
      .catch(() => {
        if (!live) return
        setCandidateRows([])
        setCandidateStatus("error")
      })
    return () => {
      live = false
    }
  }, [hasAccess])

  const rankedRows = useMemo(() => calculateRGFARanking(rows), [rows])
  const selectedRgfaCandidate = useMemo(() => (
    rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0] || null
  ), [rankedRows, selectedMof])
  const selectedPathwayCandidate = useMemo(() => (
    candidateRows.find((row) => (row.id || row.name) === selectedPathwayCandidateId) || candidateRows[0] || null
  ), [candidateRows, selectedPathwayCandidateId])

  const handleSelectPathwayCandidate = (candidateId) => {
    setSelectedPathwayCandidateId(candidateId)
    const candidate = candidateRows.find((row) => (row.id || row.name) === candidateId)
    const displayName = candidate?.displayName || candidate?.commonName || candidate?.name || candidate?.mofName
    if (displayName && rankedRows.some(row => row.mof === displayName)) setSelectedMof(displayName)
    const firstRole = candidate?.organicAcidRelevance?.possibleRoles?.[0]
    if (firstRole?.relatedRuleId) setSelectedRuleId(firstRole.relatedRuleId)
    if (firstRole?.relatedPathwayNode) setSelectedPathwayNodeId(firstRole.relatedPathwayNode)
  }

  useEffect(() => {
    if (!rankedRows.length) return
    if (!selectedMof || !rankedRows.some((row) => row.mof === selectedMof)) {
      setSelectedMof(rankedRows[0].mof)
    }
  }, [rankedRows, selectedMof])

  useEffect(() => {
    if (!candidateRows.length) {
      if (selectedPathwayCandidateId) setSelectedPathwayCandidateId("")
      return
    }
    if (!selectedPathwayCandidateId || !candidateRows.some(row => (row.id || row.name) === selectedPathwayCandidateId)) {
      const firstCurated = candidateRows.find(row => !String(`${row.dataStatus || ""} ${row.organicAcidRelevance?.scoreStatus || ""}`).toLowerCase().includes("pending"))
      setSelectedPathwayCandidateId((firstCurated || candidateRows[0]).id || (firstCurated || candidateRows[0]).name)
    }
  }, [candidateRows, selectedPathwayCandidateId])

  if (!hasAccess) {
    return (
      <div className="organic-acid-page" style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16, fontFamily: ORGANIC_ACID_FONT }}>
        <PrototypeGate lang={lang} t={t} onUnlock={() => setHasAccess(true)} />
      </div>
    )
  }

  const topCandidate = rankedRows[0] || null
  const candidateEvidenceMix = candidateRows.reduce((acc, row) => {
    const key = row.evidenceLevel || row.organicAcidRelevance?.evidenceLevel || row.dataStatus || "pending"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return (
    <div className="organic-acid-page" style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 12, padding: isNarrow ? 12 : 16, fontFamily: ORGANIC_ACID_FONT }}>
      <div style={{ display: "grid", gap: 14, margin: "0 auto", maxWidth: 1220 }}>
        <ProjectObjectiveSection topCandidate={topCandidate} rankedRows={rankedRows} isNarrow={isNarrow} />
        <div style={{ background: palette.positiveSoft, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
          {lang === "zh"
            ? "Access Gate / Frontend Passcode：已通过前端访问入口；该入口仅用于原型页面分区，不代表真实权限控制。"
            : "Access Gate / Frontend Passcode: frontend access gate passed; this prototype gate is for page segmentation, not real authorization."}
        </div>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
          {lang === "zh"
            ? "有机酸转化是 Catalysis Lab 中优先展示的子工作台，但不是催化模块的全部范围。"
            : "Organic acid conversion is a prioritized sub-workspace within Catalysis Lab, not the full scope of catalysis."}
        </div>
        <OrganicAcidHostGuestWorkbench lang={lang} isNarrow={isNarrow} />
        <ResearchValidationEntryPanel lang={lang} />
        <SectionLayoutControls command={setLayoutCommand} t={t} lang={lang} />
        <CollapsibleResearchSection
          id="organic-acid-workbench"
          title="Organic Acid Carbon-Flow Graph Workbench"
          titleZh="有机酸碳流图论路径工作台"
          description="Inspect carbon-flow nodes, edge evidence, graph metrics, and pathway control factors."
          descriptionZh="检查碳流节点、边证据、图论指标和路径控制因素。"
          defaultState="expanded"
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "图网络" : "graph network", tone: "info" },
            { label: lang === "zh" ? "演示数据" : "Demo data", tone: "proxy" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "选中路径" : "Selected pathway", value: selectedOrganicPathway },
            { label: lang === "zh" ? "节点数" : "Nodes", value: 8 },
            { label: lang === "zh" ? "边数" : "Edges", value: graphFocusEdgeIds.length || 11 },
            { label: lang === "zh" ? "主控因素" : "Top control factor", value: lang === "zh" ? "水稳定性 / 路径证据" : "water stability / pathway evidence" },
          ]}
          miniPreview={
            <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
              <div style={{ alignItems: "center", display: "grid", gridTemplateColumns: "20px 1fr 20px 1fr 20px", gap: 5 }}>
                <span style={{ background: palette.positive, borderRadius: 999, height: 18, width: 18 }} />
                <span style={{ background: palette.borderStrong, height: 2 }} />
                <span style={{ background: palette.accent, borderRadius: 999, height: 18, width: 18 }} />
                <span style={{ background: palette.borderStrong, height: 2 }} />
                <span style={{ background: palette.mixed, borderRadius: 999, height: 18, width: 18 }} />
              </div>
              <div style={{ color: palette.faint, fontSize: 11 }}>{lang === "zh" ? "mini node-edge preview · 展开查看路径网络。" : "mini node-edge preview · expand for pathway graph."}</div>
            </div>
          }
        >
          <OrganicAcidGraphWorkbench
            lang={lang}
            selectedNodeId={selectedPathwayNodeId}
            focusEdgeIds={graphFocusEdgeIds}
            onSelectNode={setSelectedPathwayNodeId}
            onSelectPathway={(pathway) => {
              setSelectedOrganicPathway(pathway.id)
              setSelectedPathwayNodeId(pathway.nodeSequence?.[0] || null)
            }}
            onHighlightEdges={setGraphFocusEdgeIds}
          />
        </CollapsibleResearchSection>
        <CollapsibleResearchSection
          id="priority"
          title="Candidate Prioritization Workspace"
          titleZh="候选物优先级与规则匹配工作台"
          description="Compare candidate priority, evidence coverage, validation need, and rule/pathway matches."
          descriptionZh="比较候选优先级、证据覆盖、验证需求与规则 / 路径匹配。"
          defaultState="compact"
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "需要验证" : "Needs validation", tone: "warn" },
            { label: lang === "zh" ? "证据状态" : "Evidence status", tone: "info" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "Top 候选" : "Top candidate", value: topCandidate?.mof || topCandidate?.displayName || "pending" },
            { label: lang === "zh" ? "候选数量" : "Candidates", value: candidateRows.length },
            { label: lang === "zh" ? "证据覆盖" : "Evidence coverage", value: Object.entries(candidateEvidenceMix).map(([key, count]) => `${key}:${count}`).join(" · ") || "pending" },
            { label: lang === "zh" ? "验证优先级" : "Main validation priority", value: recommendationForClass(topCandidate?.computedClass || "B") },
          ]}
          miniPreview={
            <div style={{ display: "grid", gap: 6 }}>
              {rankedRows.slice(0, 3).map((row, index) => (
                <div key={row.mof || index} style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "22px minmax(0, 1fr) 48px" }}>
                  <span style={{ color: palette.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11 }}>{index + 1}</span>
                  <span style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}><span style={{ background: palette.accent, display: "block", height: "100%", width: pct(row.rgfaScore || 0.4) }} /></span>
                  <span style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, textAlign: "right" }}>{fmt(row.rgfaScore || 0, 2)}</span>
                </div>
              ))}
            </div>
          }
        >
          <CandidatePrioritizationWorkspace
            lang={lang}
            selectedCandidateId={selectedPathwayCandidateId}
            onSelectCandidate={handleSelectPathwayCandidate}
            onSelectRule={setSelectedRuleId}
            onHighlightEdges={setGraphFocusEdgeIds}
          />
        </CollapsibleResearchSection>
        <div id="algorithm" style={{ scrollMarginTop: 118 }}>
          <CollapsibleResearchSection
            id="algorithm-trace-explorer"
            title="Algorithm Trace Explorer"
            titleZh="算法追踪器"
            description="Trace how candidate scores are derived from descriptors, rules, evidence adjustment, interaction effects, and risk penalties."
            descriptionZh="追踪候选评分如何由描述符、规则、证据修正、交互效应和风险惩罚得到。"
            defaultState="compact"
            layoutCommand={layoutCommand}
            statusBadges={[
              { label: "6 factors", tone: "info" },
              { label: "3 interactions", tone: "proxy" },
              { label: lang === "zh" ? "效应拆解器" : "Effect Decomposition Explorer", tone: "info" },
              { label: lang === "zh" ? "风险惩罚" : "risk penalty", tone: "warn" },
            ]}
            summaryItems={[
              { label: lang === "zh" ? "因素数量" : "Factor count", value: 6 },
            { label: lang === "zh" ? "评分方法" : "Scoring method", value: "RGFA + effects" },
              { label: lang === "zh" ? "效应拆解器" : "Effect Decomposition Explorer", value: lang === "zh" ? "主效应 + 交互 + 证据 - 风险" : "main + interaction + evidence - risk" },
              { label: lang === "zh" ? "证据修正" : "Evidence adjustment", value: lang === "zh" ? "启用" : "enabled" },
              { label: lang === "zh" ? "风险项" : "Risk penalties", value: 2 },
            ]}
            miniPreview={
              <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "flex", height: 16, overflow: "hidden" }}>
                <span style={{ background: palette.positive, width: "34%" }} />
                <span style={{ background: palette.accent, width: "22%" }} />
                <span style={{ background: palette.mixed, width: "18%" }} />
                <span style={{ background: palette.risk, width: "12%" }} />
              </div>
            }
          >
            <AlgorithmTraceExplorer
              rankedRows={rankedRows}
              selectedMof={selectedMof}
              setSelectedMof={setSelectedMof}
              activeStep={activeTraceStep}
              onActiveStepChange={setActiveTraceStep}
              selectedCandidate={selectedPathwayCandidate}
              selectedPathwayId={selectedOrganicPathway}
            />
          </CollapsibleResearchSection>
        </div>
        <CollapsibleResearchSection
          id="organic-acid-interaction-section"
          title="Interaction Effect Matrix"
          titleZh="交互效应矩阵"
          description="Separate main effects, interaction hypotheses, heredity checks, design coverage, and validation queue for sparse chemical data."
          descriptionZh="面向稀疏化学数据拆分主效应、交互假设、遗传规则检查、设计覆盖和验证队列。"
          defaultState="compact"
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "交互效应" : "interaction effects", tone: "info" },
            { label: lang === "zh" ? "实验设计覆盖图" : "Experimental Design Coverage Map", tone: "info" },
            { label: lang === "zh" ? "推断数据" : "Inferred", tone: "proxy" },
            { label: lang === "zh" ? "需要验证" : "Needs validation", tone: "warn" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "交互数量" : "Interactions", value: 4 },
            { label: lang === "zh" ? "正向协同" : "Positive synergy", value: 1 },
            { label: lang === "zh" ? "负向冲突" : "Negative conflict", value: 1 },
            { label: lang === "zh" ? "不确定" : "Uncertain", value: 1 },
          ]}
          miniPreview={
            <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 220 }}>
              {[palette.positive, palette.risk, palette.mixed, palette.accent, palette.surfaceStrong, palette.positive, palette.surfaceStrong, palette.mixed, palette.accent].map((color, index) => (
                <span key={index} style={{ background: color, border: `1px solid ${palette.border}`, borderRadius: 5, height: 22 }} />
              ))}
            </div>
          }
        >
          <OrganicAcidInteractionWorkbench
            lang={lang}
            selectedCandidate={selectedPathwayCandidate}
            selectedPathwayId={selectedOrganicPathway}
          />
        </CollapsibleResearchSection>
        <CompactDataModeBar
          value={candidateDataMode}
          onChange={() => {
            setSelectedPathwayCandidateId("")
            setSelectedRuleId(null)
            setSelectedPathwayNodeId(null)
            setSelectedOrganicPathway("formaldehyde")
          }}
          lang={lang}
          recordsCount={candidateRows.length}
          statusText={lang === "zh"
            ? `${candidateRows.length} 条候选记录 · ${candidateStatus === "loaded" ? "已载入" : candidateStatus === "empty" ? "待填充" : candidateStatus}`
            : `${candidateRows.length} candidate records · ${candidateStatus === "loaded" ? "loaded" : candidateStatus === "empty" ? "pending population" : candidateStatus}`}
          options={[
            { id: DEFAULT_CANDIDATE_DATA_MODE, label: lang === "zh" ? "Open MOF Seed" : "Open MOF Seed" },
          ]}
        />
        <CollapsibleResearchSection
          id="organic-acid-evidence-matrix"
          title="Evidence Matrix"
          titleZh="证据矩阵"
          description="Track seed records, experiment feedback, missing citations, and evidence-review status before using data as labels."
          descriptionZh="在把数据作为标签前，跟踪种子记录、实验反馈、缺失引用和证据复核状态。"
          defaultState="compact"
          lowPriority
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "演示数据" : "Demo data", tone: "proxy" },
            { label: lang === "zh" ? "需要复核" : "needs review", tone: "warn" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "Open MOF Seed" : "Open MOF Seed", value: summaryData.openSeed.length },
            { label: lang === "zh" ? "实验记录" : "Experiment records", value: summaryData.experiments.length },
            { label: lang === "zh" ? "推断 / pending" : "Inferred / pending", value: candidateRows.length },
            { label: lang === "zh" ? "缺失引用" : "Missing citations", value: lang === "zh" ? "待复核" : "needs review" },
          ]}
          miniPreview={
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["A", "B", "C", "D"].map(level => <span key={level} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5, fontWeight: 900, padding: "5px 9px" }}>Evidence {level}</span>)}
            </div>
          }
        >
          <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
            当前全局候选数据源：Open MOF Seed · 已加载记录：{candidateRows.length} 条 · 已接入模块：MOF Library / EcoScreen / Organic Acid Project。当前有机酸路径相关性在没有文献、DFT 或实验支持前仍保持 pending。
          </div>
          <DataStatusSummary
            seedRecords={summaryData.openSeed}
            experimentRecords={summaryData.experiments}
            demoCount={0}
            realSeedCount={0}
            lang={lang}
            t={t}
          />
          <OpenMofIntegrationReport
            seedRecords={summaryData.openSeed}
            experimentRecords={summaryData.experiments}
            lang={lang}
            t={t}
          />
          <OrganicAcidExperimentFeedbackPanel records={summaryData.experiments} lang={lang} t={t} />
        </CollapsibleResearchSection>
        {status === "error" ? (
          <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 12, color: palette.risk, fontSize: 12.5, fontWeight: 700, padding: 12 }}>
            Demo dataset could not be loaded from public/data/organic_acid_project_demo.json.
          </div>
        ) : (
          <CollapsibleResearchSection
            id="organic-acid-mechanism-descriptor"
            title="Mechanism / Descriptor Interpretation"
            titleZh="机理 / 描述符解释"
            description="Connect RGFA ranking, descriptor matrix, and mechanism priors to the active trace step."
            descriptionZh="将 RGFA 排序、描述符矩阵和机理先验连接到当前追踪步骤。"
            defaultState="compact"
            lowPriority
            layoutCommand={layoutCommand}
            statusBadges={[
              { label: lang === "zh" ? "描述符解释" : "descriptor interpretation", tone: "info" },
              { label: lang === "zh" ? "不是验证排名" : "not validated ranking", tone: "warn" },
            ]}
            summaryItems={[
              { label: lang === "zh" ? "当前候选" : "Selected candidate", value: selectedRgfaCandidate?.mof || "pending" },
              { label: lang === "zh" ? "活跃步骤" : "Active step", value: activeTraceStep },
              { label: lang === "zh" ? "候选数量" : "Candidates", value: rankedRows.length },
            ]}
          >
            <CandidateRankingSection rankedRows={rankedRows} selectedMof={selectedMof} setSelectedMof={setSelectedMof} isNarrow={isNarrow} />
            <DynamicDescriptorMatrix candidate={selectedRgfaCandidate} activeStep={activeTraceStep} />
          </CollapsibleResearchSection>
        )}
        <CollapsibleResearchSection
          id="validation"
          title="Validation Queue / Validation Roadmap"
          titleZh="验证队列 / 验证路线"
          description="Prioritize experiments, required data, uncertainty reduction, and expected evidence impact."
          descriptionZh="优先安排实验、所需数据、不确定性降低和预期证据影响。"
          defaultState="compact"
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "验证优先级" : "Validation priority", tone: "warn" },
            { label: lang === "zh" ? "需要验证" : "Needs validation", tone: "info" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "高优先级验证" : "High-priority validations", value: 4 },
            { label: lang === "zh" ? "下一步实验" : "Next experiment", value: "NaH13CO3 tracing" },
            { label: lang === "zh" ? "所需数据" : "Required data", value: lang === "zh" ? "碳平衡 / PXRD / ICP" : "carbon balance / PXRD / ICP" },
            { label: lang === "zh" ? "证据影响" : "Evidence impact", value: lang === "zh" ? "A-D 等级升级" : "A-D upgrade" },
          ]}
        >
          <ValidationSection />
        </CollapsibleResearchSection>
        <OrganicLimitationsSection />
      </div>
    </div>
  )
}
