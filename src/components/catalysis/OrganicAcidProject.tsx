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
  ["数据使用边界", "当前页面仅使用公开来源、人工整理与代理字段，不含合作方保密数据；未完成同条件验证的结果只用于安排实验优先级。"],
  ["CRITIC 样本边界", "当前候选集较小，CRITIC 仅用于比较权重敏感性，不能替代更大样本的外部校正。"],
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
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 3, height: 8, overflow: "hidden" }}>
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
            {lang === "zh" ? "研究工作区访问" : "Research workspace access"}
          </div>
          <h1 style={{ color: palette.text, fontSize: 24, lineHeight: 1.14, margin: "6px 0 0" }}>
            {lang === "zh" ? "有机酸路径工作台" : "Organic Acid Workspace"}
          </h1>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
            {lang === "zh"
              ? "本工作区包含仍在验证中的路线筛选和实验规划内容，使用访问码与催化总览分开展示。访问码只用于页面分区，不代表数据授权或许可范围。"
              : "This workspace contains route-screening and experimental-planning content that remains under validation. The access code separates it from the Catalysis overview and does not define data authorization or licence scope."}
          </p>
        </div>
        <form onSubmit={submit} style={{ alignItems: "end", display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 280px) auto" }}>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ color: palette.text, fontSize: 12, fontWeight: 700 }}>{lang === "zh" ? "工作区访问码" : "Workspace access code"}</span>
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
            {lang === "zh" ? "进入工作区" : "Enter workspace"}
          </button>
        </form>
        {error ? <div style={{ color: palette.risk, fontSize: 12, fontWeight: 700 }}>{error}</div> : null}
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 11.8, lineHeight: 1.55, padding: 10 }}>
          {lang === "zh"
            ? "进入后可查看算法追踪、反应路径、证据矩阵、路线优先级与候选队列。所有结果仍需结合来源等级和验证状态解读。"
            : "After entry, you can inspect algorithm traces, reaction pathways, evidence matrices, route priorities, and candidate queues. Interpret every result together with its source grade and validation status."}
        </div>
      </div>
    </section>
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
        <div style={{ color: palette.text, fontSize: 13.5, fontWeight: 700 }}>候选入选依据</div>
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
      kicker="验证计划"
      title="实验与计算验证计划"
      note="把当前排序结果转成后续主反应测试、路径投料、同位素与 DFT 更新的执行清单。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {validationSteps.map(([title, body], index) => (
          <article key={title} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, gridTemplateColumns: "34px minmax(0, 1fr)", padding: 11 }}>
            <div style={{ color: palette.accent, display: "flex", fontSize: 10.5, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</div>
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
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {zh ? "研究验证" : "Research validation"}
        </div>
        <h2 style={{ color: palette.text, fontSize: 18, lineHeight: 1.2, margin: 0 }}>
          {zh ? "有机酸研究验证入口" : "Organic Acid Research Validation Loop Entry"}
        </h2>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>
          {zh
            ? "从路径网络、算法追踪和候选排序进入研究验证中心；证据来源、推断层级与字段级溯源会随记录保留。"
            : "Move from pathway networks, algorithm traces, and candidate prioritization into the Research Validation Center while preserving source grade, inference level, and field-level provenance."}
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
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
          {lang === "zh"
            ? "有机酸转化是催化中优先展示的子工作台，但不是催化模块的全部范围。"
            : "Organic acid conversion is a prioritized sub-workspace within Catalysis, not the full scope of the module."}
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
                <span style={{ background: palette.positive, borderRadius: 3, height: 14, width: 14 }} />
                <span style={{ background: palette.borderStrong, height: 2 }} />
                <span style={{ background: palette.accent, borderRadius: 3, height: 14, width: 14 }} />
                <span style={{ background: palette.borderStrong, height: 2 }} />
                <span style={{ background: palette.mixed, borderRadius: 3, height: 14, width: 14 }} />
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
                  <span style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 3, height: 8, overflow: "hidden" }}><span style={{ background: palette.accent, display: "block", height: "100%", width: pct(row.rgfaScore || 0.4) }} /></span>
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
            { id: DEFAULT_CANDIDATE_DATA_MODE, label: lang === "zh" ? "CoRE 2024 CR 真实结构库" : "CoRE 2024 CR real corpus" },
          ]}
        />
        <CollapsibleResearchSection
          id="organic-acid-evidence-matrix"
          title="Evidence Matrix"
          titleZh="证据矩阵"
          description="Track CoRE source records, experiment feedback, missing citations, and evidence-review status before using data as task labels."
          descriptionZh="在把数据作为任务标签前，跟踪 CoRE 来源记录、实验反馈、缺失引用和证据复核状态。"
          defaultState="compact"
          lowPriority
          layoutCommand={layoutCommand}
          statusBadges={[
            { label: lang === "zh" ? "真实结构记录" : "Real structure records", tone: "source" },
            { label: lang === "zh" ? "需要复核" : "needs review", tone: "warn" },
          ]}
          summaryItems={[
            { label: lang === "zh" ? "CoRE 2024 CR" : "CoRE 2024 CR", value: summaryData.openSeed.length },
            { label: lang === "zh" ? "实验记录" : "Experiment records", value: summaryData.experiments.length },
            { label: lang === "zh" ? "推断 / pending" : "Inferred / pending", value: candidateRows.length },
            { label: lang === "zh" ? "缺失引用" : "Missing citations", value: lang === "zh" ? "待复核" : "needs review" },
          ]}
          miniPreview={
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["A", "B", "C", "D"].map(level => <span key={level} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 5, color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5, fontWeight: 850, padding: "5px 9px" }}>Evidence {level}</span>)}
            </div>
          }
        >
          <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, color: palette.muted, fontSize: 12.5, lineHeight: 1.55, padding: 11 }}>
            {lang === "zh"
              ? `当前全局结构候选：CoRE MOF 2024 CSD-modified CR · 已加载 ${candidateRows.length} 条真实记录 · 已接入 MOF Library / EcoScreen / Organic Acid Project。结构真实性不等于有机酸催化性能；缺少文献、DFT 或实验支持时，路径相关性保持 pending。`
              : `Active structural candidates: CoRE MOF 2024 CSD-modified CR · ${candidateRows.length} real records loaded across MOF Library / EcoScreen / Organic Acid Project. A real structure is not evidence of organic-acid catalytic performance; pathway relevance stays pending without literature, DFT, or experimental support.`}
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
            {lang === "zh" ? "当前候选数据未能载入，请刷新页面或稍后重试。" : "Candidate data could not be loaded. Refresh the page or try again later."}
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
