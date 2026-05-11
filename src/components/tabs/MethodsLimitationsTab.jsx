import { useMemo, useState } from "react"
import { BlockMath } from "react-katex"
import "katex/dist/katex.min.css"
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  useT, useLang, useViewport,
  FONT_MONO,
  BasisBadge, PageHeader, CopyLinkButton,
  CRITIC_INDICATORS,
  buildCriticScoringModel,
  getDataGapRecommendations,
} from "../../shared"

const fmt = (value, digits = 3) => Number(value || 0).toFixed(digits)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

const sectionIds = [
  ["platform-scope", "Platform scope", "平台定位"],
  ["candidate-framework", "Candidate scoring", "候选评分框架"],
  ["indicator-system", "Indicator system", "三维指标体系"],
  ["critic-weighting", "CRITIC weighting", "CRITIC 客观赋权"],
  ["candidate-score", "Candidate score", "候选综合评分"],
  ["evidence-confidence", "Evidence confidence", "证据置信度"],
  ["interactive-visuals", "Sensitivity", "敏感性分析"],
  ["rsm-boundary", "CRITIC-MCDA vs. RSM", "CRITIC-MCDA 与 RSM"],
  ["method-limitations", "Limitations", "当前限制"],
]

function sectionLabel(item, zh) {
  return zh ? item[2] : item[1]
}

function Section({ id, title, eyebrow, children, t }) {
  return (
    <section id={id} className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 18,
      scrollMarginTop: 120,
    }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>{eyebrow}</div>
      <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: "5px 0 0", fontWeight: 920 }}>{title}</h2>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  )
}

function TextBlock({ children, t }) {
  return <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.75, margin: 0 }}>{children}</p>
}

function MethodCard({ title, children, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <BasisBadge tone={tone}>{title}</BasisBadge>
      <div style={{ marginTop: 10 }}>{children}</div>
    </article>
  )
}

function MathBlock({ math, fallback, t }) {
  return (
    <div style={{ overflowX: "auto", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
      <BlockMath math={math} />
      <div style={{ color: t.faint, fontSize: 10.5, fontFamily: FONT_MONO, lineHeight: 1.45 }}>
        {fallback}
      </div>
    </div>
  )
}

function ChartCard({ title, why, children, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <h3 style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, margin: 0 }}>{title}</h3>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 5, marginBottom: 12 }}>{why}</div>
      {children}
    </article>
  )
}

function TooltipBox({ active, payload, label, t }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 900, marginBottom: 4 }}>{label || payload[0]?.payload?.name}</div>
      {payload.map(item => (
        <div key={item.dataKey || item.name} style={{ color: item.color || t.muted }}>
          {item.name || item.dataKey}: {Number.isFinite(Number(item.value)) ? fmt(item.value) : item.value}
        </div>
      ))}
    </div>
  )
}

function MethodWorkflow({ zh, t }) {
  const [active, setActive] = useState(0)
  const steps = [
    ["Evidence collection", "Collect literature, DFT, experiment, characterization, or inferred evidence.", "indicator-system"],
    ["Descriptor scoring", "Convert stability, barrier, and byproduct-risk evidence into 0-1 scores.", "indicator-system"],
    ["CRITIC weighting", "Use dispersion and correlation conflict to derive objective weights.", "critic-weighting"],
    ["D_raw", "Compute the weighted geometric mean after the hard-screen factor.", "candidate-score"],
    ["Evidence confidence Q", "Apply evidence confidence to distinguish strong and weak support.", "evidence-confidence"],
    ["D_expected ranking", "Rank candidates by confidence-adjusted priority.", "interactive-visuals"],
    ["Data gaps", "Recommend missing experiment, DFT, or characterization evidence.", "method-limitations"],
  ]
  const zhSteps = [
    "证据收集", "描述符评分", "CRITIC 赋权", "D_raw", "证据置信度 Q", "D_expected 排序", "数据缺口",
  ]
  const openStep = (index, target) => {
    setActive(index)
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))", gap: 8 }}>
      {steps.map(([label, note, target], index) => (
        <button
          key={label}
          type="button"
          onMouseEnter={() => setActive(index)}
          onFocus={() => setActive(index)}
          onClick={() => openStep(index, target)}
          title={zh ? note : note}
          style={{
            background: active === index ? t.badgeInfoBg : t.surface,
            border: `1px solid ${active === index ? t.accent : t.border}`,
            borderRadius: 8,
            padding: 11,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div style={{ color: active === index ? t.accentText : t.faint, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 880, lineHeight: 1.3, marginTop: 7 }}>{zh ? zhSteps[index] : label}</div>
          <div style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{note}</div>
        </button>
      ))}
    </div>
  )
}

function IndicatorScoreMatrix({ candidates, selected, onSelect, zh, t }) {
  const columns = [
    ["d_stab_clipped", "d_stab"],
    ["d_barrier_clipped", "d_barrier"],
    ["d_select_clipped", "d_select"],
    ["confidence_Q_clipped", "Q"],
    ["D_raw", "D_raw"],
    ["D_expected", "D_expected"],
  ]
  const selectedCandidate = candidates.find(item => item.id === selected) || candidates[0]
  const heat = value => {
    const v = Math.max(0, Math.min(1, Number(value) || 0))
    if (v < 0.35) return t.badgeWarnBg
    if (v < 0.6) return t.badgeProxyBg
    return t.badgeInfoBg
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.8fr)", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: "0 8px" }}>MOF</th>
              {columns.map(([, label]) => <th key={label} style={{ padding: "0 8px" }}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {candidates.map(candidate => (
              <tr key={candidate.id} onClick={() => onSelect(candidate.id)} title={zh ? "点击查看候选评分分解" : "Click to inspect score decomposition"} style={{ cursor: "pointer" }}>
                <td style={{ color: t.textStrong, background: selected === candidate.id ? t.badgeInfoBg : t.panel, borderRadius: "7px 0 0 7px", padding: 9, fontWeight: 850 }}>{candidate.name}</td>
                {columns.map(([key, label], index) => (
                  <td key={key} title={`${candidate.name} ${label}: ${fmt(candidate[key])}`} style={{ background: heat(candidate[key]), color: t.textStrong, padding: 9, fontFamily: FONT_MONO, fontSize: 11, borderRadius: index === columns.length - 1 ? "0 7px 7px 0" : 0 }}>
                    {fmt(candidate[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MethodCard title={zh ? "候选分解" : "Candidate breakdown"} t={t}>
        <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920 }}>{selectedCandidate?.name}</div>
        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {[
            ["d_stab", selectedCandidate?.d_stab_clipped],
            ["d_barrier", selectedCandidate?.d_barrier_clipped],
            ["d_select", selectedCandidate?.d_select_clipped],
            ["Q", selectedCandidate?.confidence_Q_clipped],
            ["D_expected", selectedCandidate?.D_expected],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr) 48px", gap: 8, alignItems: "center" }}>
              <span style={{ color: t.faint, fontFamily: FONT_MONO, fontSize: 10.5 }}>{label}</span>
              <span style={{ height: 7, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: pct(value), background: label === "D_expected" ? t.accentText : t.badgeCalcText, borderRadius: 999 }} />
              </span>
              <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 10.5, textAlign: "right" }}>{fmt(value)}</span>
            </div>
          ))}
        </div>
      </MethodCard>
    </div>
  )
}

function CriticWeightChart({ model, t }) {
  const data = CRITIC_INDICATORS.map(item => {
    const row = model.decomposition.find(entry => entry.key === item.key) || {}
    return {
      key: item.shortLabel,
      weight: model.weights[item.key],
      sigma: row.sigma,
      conflict: row.conflict,
      information: row.information,
    }
  })
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="key" tick={{ fill: t.subtle, fontSize: 11 }} />
        <YAxis tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={({ active, payload, label }) => {
          if (!active || !payload?.length) return null
          const row = payload[0].payload
          return (
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, boxShadow: t.shadowSm, color: t.textStrong, fontSize: 11, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 900 }}>{label}</div>
              <div>weight: {fmt(row.weight)}</div>
              <div>sigma_j: {fmt(row.sigma)}</div>
              <div>conflict_j: {fmt(row.conflict)}</div>
              <div>C_j: {fmt(row.information)}</div>
            </div>
          )
        }} />
        <Bar dataKey="weight" name="weight" fill={t.accentText} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function CorrelationMatrix({ model, t }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "78px repeat(3, minmax(0, 1fr))", gap: 6 }}>
      <span />
      {CRITIC_INDICATORS.map(item => <span key={item.key} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textAlign: "center" }}>{item.shortLabel}</span>)}
      {CRITIC_INDICATORS.flatMap(row => [
        <span key={`${row.key}-head`} style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, alignSelf: "center" }}>{row.shortLabel}</span>,
        ...CRITIC_INDICATORS.map(col => {
          const value = model.correlationMatrix[row.key]?.[col.key] ?? 0
          const bg = row.key === col.key ? t.badgeInfoBg : Math.abs(value) > 0.65 ? t.badgeCalcBg : t.surface
          return (
            <span key={`${row.key}-${col.key}`} title={`r_jk = ${fmt(value)}. Higher correlation means more repeated information.`} style={{ background: bg, border: `1px solid ${t.border}`, borderRadius: 7, padding: "10px 6px", color: t.textStrong, fontFamily: FONT_MONO, fontSize: 11, textAlign: "center" }}>
              {fmt(value, 2)}
            </span>
          )
        }),
      ])}
    </div>
  )
}

function RawExpectedChart({ candidates, selected, onSelect, t }) {
  const data = candidates.map(candidate => ({
    id: candidate.id,
    name: candidate.name,
    D_raw: Number(candidate.D_raw.toFixed(3)),
    D_expected: Number(candidate.D_expected.toFixed(3)),
    Q: Number(candidate.confidence_Q_clipped.toFixed(3)),
  }))
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 44 }} onClick={(event) => event?.activePayload?.[0]?.payload?.id && onSelect(event.activePayload[0].payload.id)}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
        <XAxis dataKey="name" tick={{ fill: t.subtle, fontSize: 10 }} interval={0} angle={-22} textAnchor="end" height={58} />
        <YAxis domain={[0, 1]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
        <Tooltip content={<TooltipBox t={t} />} />
        <Legend wrapperStyle={{ color: t.subtle, fontSize: 11 }} />
        <Bar dataKey="D_raw" name="D_raw" fill={t.badgeCalcText} radius={[3, 3, 0, 0]} />
        <Bar dataKey="D_expected" name="D_expected" fill={t.accentText} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SensitivityRankChart({ sensitivity, selected, onSelect, zh, t }) {
  const [mode, setMode] = useState("expected")
  const current = sensitivity.modes?.find(item => item.id === mode) || sensitivity.modes?.[0]
  const schemes = sensitivity.schemes || []
  const lineData = schemes.map(scheme => {
    const point = { scheme: scheme.label }
    current.rows.forEach(row => {
      point[row.name] = Number.isFinite(row.ranks[scheme.id]) ? row.ranks[scheme.id] : null
    })
    return point
  })
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["raw", zh ? "D_raw 原始评分" : "Raw-score D_raw"],
          ["expected", zh ? "D_expected 置信度修正" : "Confidence-adjusted D_expected"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} style={{ background: mode === id ? t.badgeInfoBg : t.surface, border: `1px solid ${mode === id ? t.accent : t.border}`, borderRadius: 7, color: mode === id ? t.accentText : t.muted, padding: "7px 10px", cursor: "pointer", fontSize: 11, fontWeight: 850 }}>
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={290}>
        <LineChart data={lineData} margin={{ top: 12, right: 18, left: 0, bottom: 42 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis dataKey="scheme" tick={{ fill: t.subtle, fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={58} />
          <YAxis reversed domain={[1, 6]} tick={{ fill: t.subtle, fontSize: 10 }} width={42} />
          <Tooltip content={<TooltipBox t={t} />} />
          {current.rows.filter(row => Number(row.ranks?.critic) <= 4 || row.id === selected).map((row, index) => (
            <Line key={row.id} type="monotone" dataKey={row.name} stroke={row.id === selected ? t.accentText : index % 2 ? t.badgeCalcText : t.subtle} strokeWidth={row.id === selected ? 3 : 1.6} dot={{ r: row.id === selected ? 4 : 3 }} connectNulls onClick={() => onSelect(row.id)} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 620, borderCollapse: "separate", borderSpacing: "0 6px" }}>
          <tbody>
            {current.rows.map(row => (
              <tr key={row.id} onClick={() => onSelect(row.id)} title={`${row.name}: ${row.robustness}`} style={{ cursor: "pointer" }}>
                <td style={{ background: row.id === selected ? t.badgeInfoBg : t.panel, borderRadius: "7px 0 0 7px", padding: 9, color: t.textStrong, fontWeight: 850 }}>{row.name}</td>
                {schemes.map(scheme => <td key={scheme.id} style={{ background: t.panel, padding: 9, color: t.muted, fontFamily: FONT_MONO }}>{Number.isFinite(row.ranks[scheme.id]) ? `#${row.ranks[scheme.id]}` : row.ranks[scheme.id]}</td>)}
                <td style={{ background: t.panel, borderRadius: "0 7px 7px 0", padding: 9, color: row.robustness === "Robust" ? t.accentText : t.warn, fontWeight: 850 }}>{row.robustness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CandidateNote({ candidate, zh, t }) {
  if (!candidate) return null
  const gaps = getDataGapRecommendations(candidate).slice(0, 2)
  return (
    <MethodCard title={zh ? "选中候选解释" : "Selected candidate note"} t={t} tone={candidate.status?.tone || "info"}>
      <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 920 }}>{candidate.name}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>
        D_raw {fmt(candidate.D_raw)} × Q {fmt(candidate.confidence_Q_clipped)} = D_expected {fmt(candidate.D_expected)}.
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>
        {zh ? "该分数为演示占位，不代表该 MOF 的真实性能判断。" : "This score is an illustrative placeholder, not a validated statement about this MOF."}
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {gaps.map(gap => (
          <div key={`${gap.limitation}-${gap.nextEvidence}`} style={{ borderLeft: `3px solid ${gap.priority === "High" ? t.warn : t.accentText}`, paddingLeft: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            {gap.nextEvidence}
          </div>
        ))}
      </div>
    </MethodCard>
  )
}

export function MethodsLimitationsTab({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const zh = lang === "zh"
  const model = useMemo(() => buildCriticScoringModel(), [])
  const [selectedCandidateId, setSelectedCandidateId] = useState(model.candidates[0]?.id)
  const selectedCandidate = model.candidates.find(item => item.id === selectedCandidateId) || model.candidates[0]

  const qRows = [
    ["A", "strong experimental + post-reaction evidence"],
    ["B", "literature-supported evidence"],
    ["C", "DFT-only or partial evidence"],
    ["D", "inferred evidence"],
    ["E", "missing or weak evidence"],
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={zh ? "Methodology / 方法论" : "Methodology / 方法论"}
        subtitle={zh
          ? "论文方法页 + 网页可读版：解释候选评分、证据置信度、CRITIC 权重和 RSM 边界。"
          : "A paper-style method page for candidate scoring, evidence confidence, CRITIC weighting, and the RSM boundary."}
        meta={zh ? "CRITIC-MCDA · LaTeX 公式 · 交互图表 · 限制说明" : "CRITIC-MCDA · LaTeX formulas · interactive visuals · limitations"}
        action={
          <>
            <BasisBadge tone="proxy">{zh ? "早期决策支持" : "early-stage decision support"}</BasisBadge>
            <CopyLinkButton hash="methodology" ariaLabel={zh ? "复制方法论链接" : "Copy methodology link"} />
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "220px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <aside style={{
          position: isNarrow ? "static" : "sticky",
          top: 92,
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: 10,
          maxHeight: isNarrow ? "none" : "calc(100vh - 120px)",
          overflow: "auto",
        }}>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>
            {zh ? "页面结构" : "Contents"}
          </div>
          <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible" }}>
            {sectionIds.map(item => (
              <a key={item[0]} href={`#${item[0]}`} style={{ color: t.accentText, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, padding: "7px 8px", textDecoration: "none", fontSize: 11, fontWeight: 820, whiteSpace: "nowrap" }}>
                {sectionLabel(item, zh)}
              </a>
            ))}
          </nav>
        </aside>

        <main style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Section id="platform-scope" eyebrow="01" title={zh ? "Platform scope / 平台定位" : "Platform scope / 平台定位"} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(260px, 0.8fr)", gap: 12 }}>
              <TextBlock t={t}>
                {zh
                  ? "EcoMOF-AI 是面向 MOF 候选筛选、证据追踪与绿色评价的早期决策支持平台。它不是直接产率预测工具，不是已验证催化性能数据库；当前 demo 数据用于展示方法流程。"
                  : "EcoMOF-AI is an early-stage decision-support platform for MOF candidate screening, evidence tracking, and sustainability-oriented evaluation. It is not a direct yield-prediction tool or a validated catalytic-performance database; demo records illustrate the method workflow."}
              </TextBlock>
              <MethodCard title={zh ? "边界" : "Boundary"} t={t} tone="warn">
                <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
                  {zh ? "当前模块用于 early-stage candidate prioritization，不用于 direct yield prediction。" : "The current module supports early-stage candidate prioritization, not direct yield prediction."}
                </div>
              </MethodCard>
            </div>
          </Section>

          <Section id="candidate-framework" eyebrow="02" title={zh ? "Candidate Scoring Framework / 候选评分框架" : "Candidate Scoring Framework / 候选评分框架"} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              <TextBlock t={t}>
                {zh
                  ? "在真实产率数据不足、文献条件不可直接横向比较的情况下，框架先对候选材料进行可解释优先级排序。"
                  : "When comparable yield labels are unavailable, the framework prioritizes candidates using interpretable descriptor evidence."}
              </TextBlock>
              <ChartCard title="Figure 1. CRITIC Workflow / 方法流程图" why={zh ? "为什么重要：展示从证据到候选排序和数据缺口建议的完整链路。" : "Why it matters: it shows the full path from evidence to ranking and data-gap recommendations."} t={t}>
                <MethodWorkflow zh={zh} t={t} />
              </ChartCard>
            </div>
          </Section>

          <Section id="indicator-system" eyebrow="03" title={zh ? "Indicator System / 三维指标体系" : "Indicator System / 三维指标体系"} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 780, borderCollapse: "separate", borderSpacing: "0 7px" }}>
                  <thead>
                    <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
                      <th>Indicator</th><th>Symbol</th><th>Meaning</th><th>Higher score means</th><th>Evidence examples</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Stability", "d_stab", "170 C aqueous stability; whether the material retains structure under target hydrothermal conditions.", "more stable under 170 C aqueous conditions", "post-reaction XRD / BET / ICP; literature source"],
                      ["Barrier", "d_barrier", "Formate key-step barrier from CO2/HCO3- to HCOO* or a related bottleneck step.", "more favorable kinetic bottleneck", "DFT barrier; inferred evidence"],
                      ["Byproduct-risk", "d_select", "Whether the candidate is less likely to shift toward acetate, lactate, or other side paths.", "lower byproduct-path risk", "HPLC / IC / NMR product distribution"],
                    ].map(row => (
                      <tr key={row[1]} style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
                        {row.map((cell, index) => (
                          <td key={cell} style={{ background: t.surface, padding: 10, borderRadius: index === 0 ? "7px 0 0 7px" : index === row.length - 1 ? "0 7px 7px 0" : 0, color: index < 2 ? t.textStrong : t.muted, fontFamily: index === 1 ? FONT_MONO : undefined, fontWeight: index < 2 ? 850 : 500 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ChartCard title="Figure 2. Indicator Score Matrix / 指标评分矩阵" why={zh ? "为什么重要：直接显示每个候选的短板，以及 Q 如何进入最终排序。" : "Why it matters: it shows candidate weaknesses and where Q enters the final ranking."} t={t}>
                <IndicatorScoreMatrix candidates={model.candidates} selected={selectedCandidateId} onSelect={setSelectedCandidateId} zh={zh} t={t} />
              </ChartCard>
            </div>
          </Section>

          <Section id="critic-weighting" eyebrow="04" title={zh ? "CRITIC Weighting / CRITIC 客观赋权" : "CRITIC Weighting / CRITIC 客观赋权"} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <MathBlock math="C_j = \sigma_j \sum_{k=1}^{m}(1-r_{jk})" fallback="C_j = sigma_j * sum_k(1 - r_jk)" t={t} />
                <MathBlock math="w_j = \frac{C_j}{\sum_{j=1}^{m}C_j}" fallback="w_j = C_j / sum(C_j)" t={t} />
              </div>
              <MathBlock math="r_{jk}=\frac{\sum_i(x_{ij}-\bar{x}_j)(x_{ik}-\bar{x}_k)}{\sqrt{\sum_i(x_{ij}-\bar{x}_j)^2}\sqrt{\sum_i(x_{ik}-\bar{x}_k)^2}}" fallback="r_jk = cov(x_j, x_k) / (std(x_j) * std(x_k))" t={t} />
              <TextBlock t={t}>
                {zh ? "sigma_j 表示指标区分能力，r_jk 表示信息重复程度，C_j 表示指标信息量，w_j 是当前候选集下的探索性客观权重，不是普适物理常数。" : "sigma_j represents discriminating power, r_jk captures information redundancy, C_j is information content, and w_j is a dataset-specific exploratory weight rather than a universal physical constant."}
              </TextBlock>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <ChartCard title="Figure 3. CRITIC Weight Explanation / CRITIC 权重解释图" why={zh ? "为什么重要：权重由标准差和指标冲突度共同决定，不是拍脑袋。" : "Why it matters: weights come from dispersion and conflict, not manual preference."} t={t}>
                  <CriticWeightChart model={model} t={t} />
                </ChartCard>
                <ChartCard title="Figure 4. Correlation Matrix / 指标相关性矩阵" why={zh ? "为什么重要：相关性越高，信息越重复；相关性越低或为负，独立信息越多。" : "Why it matters: higher correlation means more repeated information; lower or negative correlation adds independent signal."} t={t}>
                  <CorrelationMatrix model={model} t={t} />
                </ChartCard>
              </div>
            </div>
          </Section>

          <Section id="candidate-score" eyebrow="05" title={zh ? "Candidate Score / 候选综合评分" : "Candidate Score / 候选综合评分"} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              <MathBlock math="D_{raw,i}=G_i \cdot d_{stab,i}^{w_{stab}} d_{barrier,i}^{w_{barrier}} d_{select,i}^{w_{select}}" fallback="D_raw = G * d_stab^w_stab * d_barrier^w_barrier * d_select^w_select" t={t} />
              <TextBlock t={t}>
                {zh ? "候选综合评分使用加权几何平均，以体现短板惩罚。某个关键指标很低时，不能被其他高分完全补偿。G=0 表示明确硬筛排除。" : "The composite score uses a weighted geometric mean to penalize severe weaknesses. A very low key indicator cannot be fully compensated by high values elsewhere. G=0 denotes confirmed hard-screen exclusion."}
              </TextBlock>
              <CandidateNote candidate={selectedCandidate} zh={zh} t={t} />
            </div>
          </Section>

          <Section id="evidence-confidence" eyebrow="06" title={zh ? "Evidence Confidence / 证据置信度" : "Evidence Confidence / 证据置信度"} t={t}>
            <div style={{ display: "grid", gap: 12 }}>
              <MathBlock math="D_{expected,i}=D_{raw,i}\times Q_i" fallback="D_expected = D_raw * Q" t={t} />
              <TextBlock t={t}>
                {zh ? "Q 表示证据置信度，用于区分“高分且证据强”和“高分但证据弱”。Q 不代表真实催化性能概率。" : "Q is the evidence confidence factor. It distinguishes high scores with strong evidence from high scores with weak evidence. Q is not a probability of true catalytic performance."}
              </TextBlock>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(260px, 0.72fr)", gap: 12 }}>
                <ChartCard title="Figure 5. Raw vs Expected Score / 置信度修正对比图" why={zh ? "为什么重要：展示 Q 如何降低证据较弱候选的最终优先级。" : "Why it matters: it shows how Q lowers final priority when evidence is weak."} t={t}>
                  <RawExpectedChart candidates={model.candidates} selected={selectedCandidateId} onSelect={setSelectedCandidateId} t={t} />
                </ChartCard>
                <MethodCard title={zh ? "Q 等级参考" : "Q evidence ladder"} t={t}>
                  <div style={{ display: "grid", gap: 7 }}>
                    {qRows.map(([level, desc]) => (
                      <div key={level} style={{ display: "grid", gridTemplateColumns: "32px minmax(0, 1fr)", gap: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                        <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontWeight: 900 }}>{level}</span>
                        <span>{desc}</span>
                      </div>
                    ))}
                  </div>
                </MethodCard>
              </div>
            </div>
          </Section>

          <Section id="interactive-visuals" eyebrow="07" title={zh ? "Interactive Method Visuals / 交互式方法图表" : "Interactive Method Visuals / 交互式方法图表"} t={t}>
            <ChartCard title="Figure 6. Sensitivity Analysis / 排名敏感性分析" why={zh ? "为什么重要：显示排序是否依赖某一种权重设定，并区分原始评分与置信度修正评分。" : "Why it matters: it shows whether rank depends on a single weighting scheme, separating raw and confidence-adjusted scoring."} t={t}>
              <SensitivityRankChart sensitivity={model.sensitivity} selected={selectedCandidateId} onSelect={setSelectedCandidateId} zh={zh} t={t} />
            </ChartCard>
          </Section>

          <Section id="rsm-boundary" eyebrow="08" title={zh ? "CRITIC-MCDA vs. RSM / 材料筛选与条件优化边界" : "CRITIC-MCDA vs. RSM / 材料筛选与条件优化边界"} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <MethodCard title={zh ? "功能分工" : "Role separation"} t={t} tone="info">
                <TextBlock t={t}>
                  {zh ? "CRITIC-MCDA selects candidate materials; RSM optimizes reaction conditions for selected candidates. CRITIC-MCDA 用于候选材料初筛；响应面法 RSM 更适合在选定候选后，对温度、反应时间、pH、HCO3- 浓度或催化剂用量进行统一实验条件优化。" : "CRITIC-MCDA selects candidate materials; RSM optimizes reaction conditions for selected candidates. RSM is better suited for optimizing temperature, residence time, pH, HCO3- concentration, or catalyst dosage after one or several candidate materials have been selected."}
                </TextBlock>
              </MethodCard>
              <MethodCard title={zh ? "当前边界" : "Current boundary"} t={t} tone="warn">
                <TextBlock t={t}>
                  {zh ? "当前阶段不适合直接使用 RSM 跨 MOF 拟合甲酸产率，因为不同候选的数据来源、反应条件、检测方法和产率口径并不统一。RSM 需要统一实验设计和连续变量输入，更适合在已经选定 1–3 个候选材料后，用于优化具体反应条件。" : "At the current stage, RSM is not used for cross-MOF yield fitting because candidate records may come from different data sources, reaction conditions, analytical protocols, and yield definitions. RSM requires a unified experimental design and continuous process variables, so it is better suited for optimizing temperature, residence time, pH, HCO3- concentration, or catalyst dosage after one or several candidate materials have been selected."}
                </TextBlock>
              </MethodCard>
            </div>
          </Section>

          <Section id="method-limitations" eyebrow="09" title={zh ? "Limitations / 当前限制" : "Limitations / 当前限制"} t={t}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {(zh
                ? [
                  "demo 数据不代表真实催化结论。",
                  "小样本下 CRITIC 权重可能受候选集影响。",
                  "文献数据条件不可完全比较。",
                  "缺失值不等于材料失败。",
                  "后续需要真实实验、DFT 和反应后表征验证。",
                  "当前模块用于 early-stage prioritization，不用于 direct yield prediction。",
                ]
                : [
                  "Demo records do not represent real catalytic conclusions.",
                  "CRITIC weights can be candidate-set dependent in small samples.",
                  "Literature conditions are not fully comparable.",
                  "Missing values are not material failure.",
                  "Next steps require experiment, DFT, and post-reaction characterization.",
                  "The module supports early-stage prioritization, not direct yield prediction.",
                ]).map(item => (
                <div key={item} style={{ color: t.muted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, fontSize: 12, lineHeight: 1.55 }}>
                  {item}
                </div>
              ))}
            </div>
          </Section>
        </main>
      </div>
    </div>
  )
}
