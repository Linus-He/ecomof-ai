import { useState, useEffect } from "react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS, FONT_MONO } from "../../constants/theme"
import { WORKFLOW_STAGE_ITEMS, SOURCE_BADGES } from "../../constants/badges"
import { zhText, gasLabel } from "../../utils/labels"
import { formatFunctionalGroupSummary, getFunctionalGroupEntries } from "../../utils/functionalGroups"
import { getGasSystem } from "../../utils/prediction"
import { toolbarBtn } from "../../utils/styles"

export const CustomTooltip = ({ active, payload, label, unitX = "bar", unitY = "mmol/g" }) => {
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

export function NumericField({ label, unit, min, max, step, value, onChange, helper }) {
  const t = useT()
  const [draft, setDraft] = useState(String(value ?? ""))
  useEffect(() => {
    setDraft(String(value ?? ""))
  }, [value])
  const clamp = (next) => Math.max(min, Math.min(max, next))
  const commitDraft = () => {
    if (draft === "" || draft === "-" || draft === ".") {
      setDraft(String(value ?? ""))
      return
    }
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value ?? ""))
      return
    }
    const rounded = clamp(parsed)
    setDraft(String(rounded))
    onChange(rounded)
  }
  const pct = ((clamp(Number(value) || min) - min) / (max - min)) * 100
  const tooltipValue = `${Number(clamp(Number(value) || min)).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} ${unit}`
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: t.muted, fontSize: 12, fontFamily: "monospace" }}>{label}</span>
        <input
          type="number" value={draft} min={min} max={max} step={step}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={e => {
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          style={{
            width: 90, background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 4, padding: "3px 8px", color: t.textStrong, fontSize: 13,
            fontFamily: FONT_MONO, outline: "none", textAlign: "right",
          }}
        />
      </div>
      <div className="range-control" style={{ position: "relative", height: 4, background: t.border, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: t.accent, borderRadius: 2 }} />
        <div className="range-value-tooltip" style={{ left: `${pct}%`, background: t.textStrong, color: t.bg }}>
          {tooltipValue}
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => {
            const next = parseFloat(e.target.value)
            setDraft(String(next))
            onChange(next)
          }}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
        />
        <div className="range-thumb" style={{
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
      {helper && <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{helper}</div>}
    </div>
  )
}

export function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, comparison }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div className="content-card metric-card" style={{ position: "relative", overflow: "hidden", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: t.shadowSm }}>
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

export function BasisBadge({ children, tone = "info" }) {
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
    <span className="basis-badge" style={{ display: "inline-flex", alignItems: "center", width: "fit-content",
      color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, lineHeight: 1.4 }}>
      {zhText(lang, children)}
    </span>
  )
}

export function SourceBadge({ type }) {
  const item = SOURCE_BADGES[type] || SOURCE_BADGES.proxy
  return <BasisBadge tone={item.tone}>{item.label}</BasisBadge>
}

export function StageStrip({ current = "screening", onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const stagePalette = {
    screening: { color: t.performance, bg: t.badgeInfoBg },
    feasibility: { color: t.lccAccent, bg: t.badgeProxyBg },
    comparison: { color: t.sensitivityAccent, bg: t.badgeUserBg },
    engineering: { color: t.validationAccent, bg: t.badgeCalcBg },
  }
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 5 : 8,
      flexWrap: "wrap",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      padding: 0,
      boxShadow: "none",
    }}>
      {WORKFLOW_STAGE_ITEMS.map((item, index) => {
        const active = item.id === current || (current === "lca" && item.id === "comparison") || (current === "sensitivity" && item.id === "comparison") || (current === "validation" && item.id === "screening")
        const palette = stagePalette[item.id] || stagePalette.engineering
        return (
          <div key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 8, minWidth: 0 }}>
            {index > 0 && <span style={{ color: t.faint, fontSize: 14 }}>/</span>}
            <button
              type="button"
              onClick={() => onNavigate?.(item.target)}
              className="stage-breadcrumb-link stage-pill"
              data-active={active ? "true" : "false"}
              disabled={!onNavigate}
              title={lang === "zh" ? item.zh : item.label}
              style={{
                appearance: "none",
                border: active ? `1px solid ${palette.color}` : `1px solid transparent`,
                background: active ? palette.bg : "transparent",
                borderRadius: 999,
                padding: active ? "4px 10px" : "4px 3px",
                color: active ? palette.color : t.muted,
                fontSize: 12,
                fontWeight: active ? 850 : 650,
                fontFamily: FONT_SANS,
                cursor: onNavigate ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: active ? 900 : 750 }}>{item.stage.replace("Future ", "")}</span>
              {!isMobile && (
                <span style={{ marginLeft: 6, color: active ? t.textStrong : t.subtle }}>
                  {lang === "zh" ? item.zh : item.label}
                </span>
              )}
            </button>
            {active && !isMobile && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.color, flex: "0 0 auto" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StickySummaryBar({ inputs, results, stage, confidence, onAddComparison, canAddComparison = false }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const confidenceValue = confidence ?? (results && !results.unavailable ? Math.round(results.confidenceScore * 100) : null)
  const gas = getGasSystem(inputs?.gasSystem)
  const summaryItems = [
    [lang === "zh" ? "候选" : "Candidate", inputs?.mofName || `${inputs?.metalCenter || "—"} / ${inputs?.organicLinker || "—"}`],
    [lang === "zh" ? "气体体系" : "Gas system", gasLabel(gas?.label || inputs?.gasSystem || "—", lang)],
    [lang === "zh" ? "条件" : "Conditions", `${inputs?.temperature ?? "—"} K · ${inputs?.pressure ?? "—"} bar`],
    [lang === "zh" ? "结构" : "Structure", `${inputs?.organicLinker || "—"} · ${formatFunctionalGroupSummary(inputs, lang)}`],
  ]
  return (
    <div className="sticky-summary-bar" style={{
      position: "sticky",
      top: 58,
      zIndex: 12,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
      gap: 10,
      alignItems: "center",
      background: t.panel,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 8,
      padding: "9px 11px",
      boxShadow: t.shadowSm,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {summaryItems.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 9, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap" }}>
        <BasisBadge tone="info">{stage}</BasisBadge>
        <BasisBadge tone={confidenceValue == null ? "proxy" : confidenceValue >= 70 ? "calc" : "warn"}>
          {confidenceValue == null ? (lang === "zh" ? "未运行" : "Not run") : `${confidenceValue}% ${lang === "zh" ? "置信度" : "confidence"}`}
        </BasisBadge>
        {canAddComparison && (
          <button type="button" onClick={onAddComparison} style={{ ...toolbarBtn(t), padding: "5px 9px", fontSize: 11 }}>
            + {lang === "zh" ? "加入比较" : "Add to comparison"}
          </button>
        )}
      </div>
    </div>
  )
}

export function ResultLayer({ number, title, subtitle, children }) {
  const t = useT()
  return (
    <section className="result-layer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
        <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{number}</span>
        <div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: 16, lineHeight: 1.25 }}>{title}</h2>
          {subtitle && <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function MethodDrawer({ title, badge = "Screening proxy", children }) {
  const t = useT()
  return (
    <details className="motion-surface" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
        {title} <span style={{ marginLeft: 8 }}><BasisBadge tone="proxy">{badge}</BasisBadge></span>
      </summary>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
        {children}
      </div>
    </details>
  )
}

export function HowToRead({ children }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>
      <strong style={{ color: t.subtle }}>{lang === "zh" ? "如何阅读：" : "How to read: "}</strong>{children}
    </div>
  )
}

export function NextStepCTA({ label, body, actionLabel, onClick }) {
  const t = useT()
  return (
    <div className="content-card next-step-cta" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 10, padding: 14 }}>
      <div>
        <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850 }}>{label}</div>
        {body && <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{body}</div>}
      </div>
      <button type="button" className="btn-primary" onClick={onClick} style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", padding: "8px 12px" }}>
        {actionLabel}
      </button>
    </div>
  )
}

export function CandidateComparisonPanel({ candidates, onRemove, onMove, focusId = "all" }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  if (!candidates?.length) {
    return (
      <div style={{ background: t.surface, border: `1px dashed ${t.borderStrong}`, borderRadius: 10, padding: 13, color: t.subtle, fontSize: 12, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "还没有比较候选。先在 Screening 或比较页面运行结果，然后点击“加入比较”。建议保留 2-4 个候选。"
          : "No comparison candidates yet. Run a result in Screening or a comparison page, then click Add to comparison. Keep 2-4 candidates for a readable decision view."}
      </div>
    )
  }
  const visibleCandidates = focusId === "all" ? candidates : candidates.filter(item => item.id === focusId)
  return (
    <div className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <SectionTitle>{lang === "zh" ? "候选比较清单" : "Candidate comparison shortlist"}</SectionTitle>
        <BasisBadge tone="proxy">{visibleCandidates.length}/{candidates.length}</BasisBadge>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {(lang === "zh"
                ? ["候选", "性能", "选择性", "可行性", "LCA/LCC", "稳健性", "操作"]
                : ["Candidate", "Performance", "Selectivity", "Feasibility", "LCA/LCC", "Robustness", "Actions"]).map(head => (
                <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}` }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleCandidates.map((item) => {
              const sourceIndex = candidates.findIndex(candidate => candidate.id === item.id)
              return (
              <tr key={item.id} className="motion-table-row" style={{ background: focusId !== "all" && item.id === focusId ? t.badgeInfoBg : "transparent" }}>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
                  {item.name}<div style={{ color: t.faint, fontSize: 10, marginTop: 2 }}>{item.metal} · {item.linker} · {item.gasSystem}</div>
                </td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.performance} mmol/g</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.selectivity}</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}` }}>
                  <BasisBadge tone={item.feasibility === "High" ? "warn" : item.feasibility === "Medium" ? "proxy" : "calc"}>{item.feasibility}</BasisBadge>
                </td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>LCA {item.lca}/10 · ${item.lcc}/kg</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.robustness}%</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}` }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: isNarrow ? "wrap" : "nowrap" }}>
                    <button type="button" onClick={() => onMove?.(sourceIndex, -1)} disabled={sourceIndex === 0} style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10 }}>↑</button>
                    <button type="button" onClick={() => onMove?.(sourceIndex, 1)} disabled={sourceIndex === candidates.length - 1} style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10 }}>↓</button>
                    <button type="button" onClick={() => onRemove?.(item.id)} style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10 }}>
                      {lang === "zh" ? "移除" : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ProvenanceGrid({ items }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  return (
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`, gap: 10 }}>
      {items.map(item => (
        <div key={item.label} className="content-card provenance-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
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

export function ResultProvenanceDrawer({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  if (!results) return null
  const rows = [
    {
      output: lang === "zh" ? "吸附量" : "Uptake",
      basis: lang === "zh" ? "结构描述符 + 筛选模型" : "Descriptor input + screening model",
      source: lang === "zh" ? "模型预测" : "Model-predicted",
      flag: lang === "zh" ? "中等" : "Medium",
      limitation: lang === "zh" ? "需实验等温线或 GCMC 确认绝对值" : "Absolute values need experimental isotherms or GCMC confirmation",
      stage: "Stage 1",
    },
    {
      output: lang === "zh" ? "选择性" : "Selectivity",
      basis: lang === "zh" ? "表观吸附量比值" : "Apparent uptake ratio",
      source: lang === "zh" ? "筛选代理" : "Screening proxy",
      flag: lang === "zh" ? "假设依赖" : "Assumption-dependent",
      limitation: lang === "zh" ? "不是严格 Henry 或 IAST 混合气平衡计算" : "Not strict Henry or IAST mixture-equilibrium selectivity",
      stage: "Stage 1",
    },
    {
      output: "Qst",
      basis: lang === "zh" ? "预测多温等温线反推" : "Derived from predicted multi-temperature isotherms",
      source: lang === "zh" ? "筛选代理" : "Screening proxy",
      flag: lang === "zh" ? "探索性" : "Exploratory",
      limitation: lang === "zh" ? "不是量热实测或研究级多温拟合" : "Not calorimetry or research-grade multi-T fitting",
      stage: "Stage 1",
    },
    {
      output: lang === "zh" ? "可行性" : "Feasibility",
      basis: lang === "zh" ? "连接体、金属、成本带和规模摩擦" : "Linker, metal, cost band, and scale-friction cues",
      source: lang === "zh" ? "用户输入 + 代理规则" : "User-defined + proxy rules",
      flag: lang === "zh" ? "粗边界" : "Coarse boundary",
      limitation: lang === "zh" ? "不等同于正式生命周期成本" : "Not formal lifecycle costing",
      stage: "Stage 2",
    },
    {
      output: "LCA / LCC",
      basis: lang === "zh" ? "代理清单与入围候选比较" : "Proxy inventory and shortlist comparison",
      source: lang === "zh" ? "假设依赖" : "Assumption-dependent",
      flag: lang === "zh" ? "比较性" : "Comparative",
      limitation: lang === "zh" ? "不是工程级 LCA/LCC 或供应商报价" : "Not engineering-grade LCA/LCC or supplier quotes",
      stage: "Stage 3",
    },
  ]
  return (
    <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
      <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 800 }}>
        {lang === "zh" ? "结果级来源与适用范围" : "Result-level provenance and scope"}
      </summary>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, margin: "8px 0 10px" }}>
        {lang === "zh"
          ? `当前输入的官能团：${formatFunctionalGroupSummary(inputs, lang)}。这些标签说明结果如何解释，而不是替代原始数据审计。`
          : `Functional groups in this run: ${formatFunctionalGroupSummary(inputs, lang)}. These labels explain intended interpretation; they do not replace raw data audit trails.`}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              {(lang === "zh" ? ["输出", "依据", "来源类型", "质量标记", "限制", "使用阶段"] : ["Output", "Basis", "Source type", "Quality flag", "Limitation", "Use stage"]).map(head => (
                <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}` }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.output}>
                <td style={{ color: t.textStrong, fontSize: 11, fontWeight: 800, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.output}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.basis}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.source}</td>
                <td style={{ color: t.warn, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.flag}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.limitation}</td>
                <td style={{ color: t.accentText, fontSize: 11, fontFamily: FONT_MONO, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function InfoTip({ text }) {
  const t = useT()
  return (
    <span title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 16, height: 16, borderRadius: "50%", border: `1px solid ${t.borderStrong}`,
      color: t.accentText, fontSize: 11, fontWeight: 800, marginLeft: 6, cursor: "help" }}>
      i
    </span>
  )
}

export function Callout({ tone = "info", children }) {
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

export function LinkerSubstitutionPreview({ inputs, linker }) {
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

export function WindRoseChart({ data }) {
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

// Re-export SectionTitle here since it's used by CandidateComparisonPanel above
export function SectionTitle({ children }) {
  const t = useT()
  return <div style={{ color: t.subtle, fontSize: 12, fontWeight: 700, letterSpacing: 0, marginBottom: 14 }}>{children}</div>
}
