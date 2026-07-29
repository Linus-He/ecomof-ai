// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  useT,
  useLang,
  useViewport,
  FONT_SANS,
  LogoMark,
  BrandMotif,
  BlockFormula,
} from "../../shared"
import { BrandMotionBackground, GasParetoChart, HomeDataExplorer, MofDescriptor3DScatter, buildGasParetoRows } from "../home"
import { toolbarBtn } from "../../utils/styles"
import {
  DEFAULT_HOME_SUMMARY,
  loadHomeSummary,
} from "../../utils/homeSummary"
import { APP_VERSION_LABEL } from "../../constants/appVersion"

const text = (zh, en, lang) => (lang === "zh" ? zh : en)

function numberText(value, suffix = "") {
  const number = Number(value)
  if (!Number.isFinite(number)) return "Not available"
  return `${number}${suffix}`
}

function metricText(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value ?? "Not available")
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

function sharePercent(value, denominator) {
  const numericValue = Number(value)
  const numericDenominator = Number(denominator)
  if (!Number.isFinite(numericValue) || !Number.isFinite(numericDenominator) || numericDenominator <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((numericValue / numericDenominator) * 100)))
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.("change", sync)
    return () => media.removeEventListener?.("change", sync)
  }, [])

  return reduced
}

function SectionHeader({ eyebrow, title, subtitle, t, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? 14 : 18, maxWidth: 880 }}>
      <div className="home-capability-highlights" style={{
        color: t.accentText,
        fontSize: 11,
        fontWeight: 850,
        textTransform: "uppercase",
        letterSpacing: 0,
        marginBottom: 7,
      }}>
        {eyebrow}
      </div>
      <h2 style={{
        margin: 0,
        color: t.textStrong,
        fontSize: isMobile ? 22 : 30,
        lineHeight: 1.15,
        fontWeight: 900,
        letterSpacing: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          margin: "8px 0 0",
          color: t.muted,
          fontSize: isMobile ? 13 : 14,
          lineHeight: 1.65,
          maxWidth: 780,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function StoryTransition({ index, label, t }) {
  return (
    <div className="home-story-transition" aria-hidden="true" style={{ "--transition-line": t.borderStrong || t.border, "--transition-text": t.faint, "--transition-accent": t.accentText }}>
      <span className="num">{String(index).padStart(2, "0")}</span>
      <i />
      <strong>{label}</strong>
      <i />
    </div>
  )
}

function ActionButton({ children, onClick, t, primary = false, wide = false, hash }) {
  const buttonBackground = primary ? t.panel : t.surface
  const hoverBackground = t.surface

  return (
    <button
      type="button"
      onClick={onClick}
      data-hash={hash}
      className="home-action-button"
      style={{
        ...toolbarBtn(t),
        justifyContent: "center",
        minHeight: 40,
        padding: "10px 16px",
        fontSize: 12.5,
        fontWeight: 850,
        border: `1px solid ${primary ? (t.borderStrong || t.border) : t.border}`,
        borderRadius: 8,
        background: buttonBackground,
        color: t.textStrong,
        "--home-action-bg": buttonBackground,
        "--home-action-hover-bg": hoverBackground,
        "--home-action-border": primary ? (t.borderStrong || t.border) : t.border,
        "--home-action-hover-border": t.borderStrong || t.border,
        "--home-action-shadow": primary ? "0 10px 22px rgba(15, 23, 42, 0.10)" : "0 7px 16px rgba(15, 23, 42, 0.06)",
        width: wide ? "100%" : "auto",
        whiteSpace: "normal",
        textAlign: "center",
      }}
    >
      {children}
    </button>
  )
}

function IconBadge({ children, t, tone = "info" }) {
  const toneMap = {
    info: [t.badgeInfoBg, t.accentText],
    success: [t.badgeCalcBg, t.success || t.accentText],
    warn: [t.badgeWarnBg, t.warn],
    neutral: [t.surface, t.subtle],
  }
  const [background, color] = toneMap[tone] || toneMap.info
  return (
    <span style={{
      width: 38,
      height: 38,
      borderRadius: 9,
      border: `1px solid ${t.borderStrong}`,
      background,
      color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 950,
      fontFamily: FONT_SANS,
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

function PlatformCapabilityCard({ item, t }) {
  return (
    <article className="content-card home-art-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      minWidth: 0,
      display: "grid",
      gap: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconBadge t={t} tone={item.tone}>{item.mark}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 17, lineHeight: 1.25, fontWeight: 900 }}>
            {item.title}
          </h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>
            {item.subtitle}
          </div>
        </div>
      </div>
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 11px",
        display: "grid",
        gap: 5,
      }}>
        {item.highlights.map(highlight => (
          <strong key={highlight} style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.35, fontWeight: 900 }}>
            {highlight}
          </strong>
        ))}
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{item.body}</p>
    </article>
  )
}

function DataCard({ item, t }) {
  return (
    <article className="home-data-tile" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "13px 14px",
      display: "grid",
      gap: 6,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.3 }}>{item.name}</strong>
        <span style={{ color: t.accentText, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 950 }}>{item.value}</span>
      </div>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.body}</span>
    </article>
  )
}

function ResearchEquationHero({ t, lang, summary, gasParetoCount, isMobile, reducedMotion }) {
  const zh = lang === "zh"
  const [activeModel, setActiveModel] = useState("lca")
  const metrics = [
    { label: zh ? "结构记录" : "Structure records", value: numberText(summary.totalRecords, "+") },
    { label: zh ? "分离点" : "Separation points", value: numberText(gasParetoCount) },
    { label: zh ? "实验标签" : "Experimental labels", value: numberText(summary.experimentalLabelCount) },
    { label: zh ? "可信度" : "Credibility", value: `${metricText(summary.credibilityScore, 1)}` },
  ]
  const models = [
    {
      id: "lca",
      index: "01",
      label: zh ? "生命周期" : "Life cycle",
      title: zh ? "环境与成本共同约束" : "Joint environmental and cost constraints",
      formula: String.raw`I_{\mathrm{LCA}}(m)=\sum_{k=1}^{K}a_{mk}\,CF_k,\qquad C_{\mathrm{LCC}}(m)=\sum_{r=1}^{R}q_{mr}p_r`,
      note: zh ? "把材料、溶剂、能源、回收与循环数据映射到同一功能单位。" : "Maps material, solvent, energy, recovery, and cycling data to one functional unit.",
    },
    {
      id: "gas",
      index: "02",
      label: zh ? "分离权衡" : "Separation",
      title: zh ? "选择性与工作容量同时最大化" : "Maximize selectivity and working capacity",
      formula: String.raw`m\in\mathcal{F}\iff\neg\exists n\ne m:\ C_{w,n}\ge C_{w,m}\land S_n\ge S_m\land\left(C_{w,n}>C_{w,m}\lor S_n>S_m\right)`,
      note: zh ? "以非支配前沿保留真实性能权衡，不把单一高选择性误当成最优。" : "Preserves real trade-offs with a non-dominated frontier instead of overvaluing selectivity alone.",
    },
    {
      id: "catalysis",
      index: "03",
      label: zh ? "催化路径" : "Catalysis",
      title: zh ? "白盒主客体路径评分" : "White-box host–guest pathway scoring",
      formula: String.raw`\mathrm{HGCPS}_i=\prod_{j=1}^{p}\left(x_{ij}+\varepsilon\right)^{w_j},\qquad \sum_jw_j=1`,
      note: zh ? "乘法结构让短板保持可见，并通过误差条表达证据不确定度。" : "The multiplicative form keeps bottlenecks visible and exposes evidence uncertainty with error bars.",
    },
    {
      id: "validation",
      index: "04",
      label: zh ? "稳健验证" : "Validation",
      title: zh ? "参数扰动与外部证据校验" : "Parameter perturbation and external-evidence checks",
      formula: String.raw`\Delta r_i(\delta)=r_i(\mathbf{w}+\delta)-r_i(\mathbf{w}),\qquad \mathbb{E}_{\delta}\!\left[|\Delta r_i|\right]\downarrow`,
      note: zh ? "排名只在敏感性、证据等级与 Benchmark 条件下解释。" : "Rankings are interpreted only with sensitivity, evidence-grade, and benchmark context.",
    },
  ]
  const active = models.find(model => model.id === activeModel) || models[0]

  return (
    <aside
      data-testid="home-scientific-atlas"
      className="home-scientific-atlas home-equation-atlas"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        "--color-accent": t.accentText,
        "--color-border": t.border,
        "--color-muted": t.muted,
        minWidth: 0,
        position: "relative",
        border: `1px solid ${t.border}`,
        background: t.panel,
        boxShadow: t.shadowSm,
        color: t.textStrong,
      }}
    >
      <div className="home-equation-objective">
        <span>{zh ? "多目标研究函数" : "MULTI-OBJECTIVE RESEARCH FUNCTION"}</span>
        <BlockFormula
          math={String.raw`\operatorname*{Pareto\,min}_{m\in\mathcal{M}}\left[I_{\mathrm{LCA}}(m),\ C_{\mathrm{LCC}}(m),\ -P_{\mathrm{task}}(m),\ U(m)\right]`}
          fallback="Pareto min [I_LCA, C_LCC, −P_task, U]"
          t={t}
          style={{ background: "transparent", border: 0, borderRadius: 0, padding: 0 }}
        />
        <p>{zh ? "在同一证据链上平衡环境影响、成本、任务性能与不确定度。" : "Balance impact, cost, task performance, and uncertainty on one evidence chain."}</p>
      </div>
      <div className="home-equation-model-tabs" role="tablist" aria-label={zh ? "研究评价方程" : "Research evaluation equations"}>
        {models.map(model => (
          <button
            key={model.id}
            type="button"
            role="tab"
            aria-selected={activeModel === model.id}
            data-active={activeModel === model.id ? "true" : "false"}
            onClick={() => setActiveModel(model.id)}
          >
            <span>{model.index}</span>
            <strong>{model.label}</strong>
          </button>
        ))}
      </div>
      <div className="home-equation-active" key={active.id}>
        <span>{active.title}</span>
        <BlockFormula
          math={active.formula}
          fallback={active.formula}
          t={t}
          style={{ background: t.surface, borderColor: t.border, marginTop: 9 }}
        />
        <p>{active.note}</p>
      </div>
      <div className="home-equation-pipeline" aria-label={zh ? "统一数据与验证流程" : "Unified data and validation flow"}>
        <span>MOF / process</span>
        <b>→</b>
        <span>descriptor vector</span>
        <b>→</b>
        <span>white-box score</span>
        <b>→</b>
        <span>evidence gate</span>
      </div>
      <div className="home-equation-metrics">
        {metrics.map(metric => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong className="num">{metric.value}</strong>
          </div>
        ))}
      </div>
    </aside>
  )
}

function MiniBarChart({ title, rows, t, lang }) {
  const [activeLabel, setActiveLabel] = useState(rows[0]?.label || "")
  const active = rows.find(row => row.label === activeLabel) || rows[0]
  return (
    <article className="content-card" data-testid="home-mini-bar-chart" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 15,
      display: "grid",
      gap: 12,
      minWidth: 0,
    }}>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14.5, lineHeight: 1.3, fontWeight: 900 }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(row => (
          <button
            key={row.label}
            type="button"
            onClick={() => setActiveLabel(row.label)}
            onPointerEnter={() => setActiveLabel(row.label)}
            style={{
              background: row.label === active?.label ? t.badgeInfoBg : "transparent",
              border: `1px solid ${row.label === active?.label ? t.accent : "transparent"}`,
              borderRadius: 8,
              cursor: "pointer",
              display: "grid",
              gap: 5,
              padding: "4px 5px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35, fontWeight: 780 }}>{row.label}</span>
              <span style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, fontWeight: 900, fontFamily: FONT_SANS }}>{row.value} · {row.percent}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(5, Math.min(100, row.percent))}%`, height: "100%", background: row.color || t.accent }} />
            </div>
          </button>
        ))}
      </div>
      {active ? (
        <p style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, margin: 0 }}>
          {lang === "zh" ? "当前选中" : "Selected"}: <span className="num">{active.label} · {active.value} · {active.percent}%</span>
          {active.detail ? ` · ${active.detail}` : ""}
        </p>
      ) : null}
    </article>
  )
}

function ValidationEquationStage({ t, lang, summary, items, isMobile, onNavigate }) {
  const zh = lang === "zh"
  const [activeId, setActiveId] = useState(items[0]?.id || "")
  const active = items.find(item => item.id === activeId) || items[0]
  const variables = [
    { symbol: "xᵢⱼ*", label: zh ? "归一化描述符" : "Normalized descriptor", value: zh ? "同量纲比较" : "Comparable scale" },
    { symbol: "wⱼ", label: zh ? "透明权重" : "Transparent weight", value: "Σwⱼ = 1" },
    { symbol: "qᵢ", label: zh ? "证据修正系数" : "Evidence modifier", value: "0 ≤ qᵢ ≤ 1" },
    { symbol: "Δrᵢ", label: zh ? "扰动后排名变化" : "Rank shift under perturbation", value: zh ? "越小越稳健" : "lower is steadier" },
  ]

  return (
    <article
      className="scientific-story-stage validation-story-stage"
      style={{
        "--science-accent": t.accentText,
        "--science-border": t.border,
        "--science-divider": t.divider || t.border,
        "--science-faint": t.faint,
        "--science-muted": t.muted,
        "--science-panel": t.panel,
        "--science-surface": t.surface,
        "--science-text": t.textStrong,
      }}
    >
      <div className="scientific-story-copy">
        <div className="scientific-story-eyebrow">{zh ? "算法与验证 / 可审计链" : "Algorithm & validation / auditable chain"}</div>
        <h3>{zh ? "白盒筛选与 Benchmark 验证" : "White-box screening and benchmark validation"}</h3>
        <p className="scientific-story-lede">
          {zh
            ? "评分、证据修正、敏感性、实验标签与 Benchmark 不再分散成状态卡，而是构成一条可检查的验证链。"
            : "Scoring, evidence adjustment, sensitivity, labels, and benchmark checks form one inspectable validation chain instead of scattered status cards."}
        </p>
        <div className="scientific-equation-block">
          <span>{active?.title}</span>
          <BlockFormula
            math={active?.formula}
            fallback={active?.formula}
            t={t}
            style={{ background: "transparent", border: 0, borderRadius: 0, padding: 0 }}
          />
          <p>{active?.body}</p>
        </div>
        <div className="scientific-variable-list">
          {variables.map(item => (
            <div key={item.symbol}>
              <strong className="formula">{item.symbol}</strong>
              <span>{item.label}</span>
              <small>{item.value}</small>
            </div>
          ))}
        </div>
        <div className="scientific-story-source">
          <span>{zh ? "当前验证基线" : "CURRENT VALIDATION BASELINE"}</span>
          <p>
            {zh
              ? `${numberText(summary.experimentalLabelCount)} 条实验标签 · ${numberText(summary.benchmarkEligibleCount)} 条 Benchmark eligible · 可信度 ${metricText(summary.credibilityScore, 1)}。`
              : `${numberText(summary.experimentalLabelCount)} experimental labels · ${numberText(summary.benchmarkEligibleCount)} benchmark-eligible rows · credibility ${metricText(summary.credibilityScore, 1)}.`}
          </p>
        </div>
      </div>
      <div className="scientific-story-visual validation-network-visual">
        <div className="scientific-story-metric">
          <span>{zh ? "VALIDATION CHAIN" : "VALIDATION CHAIN"}</span>
          <strong className="num">05</strong>
          <small>{zh ? "→ 连续验证节点" : "→ linked validation nodes"}</small>
        </div>
        <div className="validation-network-list" role="tablist" aria-label={zh ? "验证链节点" : "Validation-chain nodes"}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active?.id === item.id}
              data-active={active?.id === item.id ? "true" : "false"}
              onClick={() => setActiveId(item.id)}
            >
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.body}</small>
              </div>
              <b className="num">{item.metric}</b>
            </button>
          ))}
        </div>
        <div className="validation-active-note">
          <span>{zh ? "当前节点" : "ACTIVE NODE"}</span>
          <strong>{active?.title}</strong>
          <p>{active?.detail}</p>
          {active?.id === "benchmark" ? (
            <ActionButton t={t} hash="#methodology-algorithm-validation" onClick={() => onNavigate("methodology-algorithm-validation", "about")}>
              {zh ? "进入验证中心" : "Enter Validation Center"}
            </ActionButton>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function FlowStep({ item, t, index, isLast }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 11, position: "relative", minWidth: 0 }}>
      <div style={{ display: "grid", justifyItems: "center", alignContent: "start", gap: 7 }}>
        <IconBadge t={t} tone={item.tone}>{String(index + 1).padStart(2, "0")}</IconBadge>
        {!isLast && <span style={{ width: 1, height: 34, background: t.borderStrong }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.35 }}>{item.title}</strong>
        <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{item.body}</p>
      </div>
    </div>
  )
}

function ResearchGatewayStage({ t, lang, modules, limitations, quickStart, isMobile, onNavigate, onContactOpen }) {
  const zh = lang === "zh"
  const routes = [
    ...modules,
    {
      mark: "BV",
      title: zh ? "验证中心" : "Validation Center",
      tag: zh ? "Benchmark / 实验标签 / 稳健性" : "Benchmark / labels / robustness",
      tone: "success",
      body: zh
        ? "做什么：集中检查 Benchmark、实验标签、敏感性与模型验证状态。"
        : "What it does: inspect benchmark, labels, sensitivity, and model-validation status in one place.",
      io: [
        zh ? "输入：筛选结果 + 标签 + 外部证据" : "Input: screening results + labels + external evidence",
        zh ? "输出：可审计验证状态 + 研究边界" : "Output: auditable validation state + research boundary",
      ],
      button: zh ? "进入验证中心" : "Enter Validation Center",
      hash: "methodology-algorithm-validation",
      target: "about",
    },
  ]
  const [activeHash, setActiveHash] = useState(routes[0]?.hash || "")
  const active = routes.find(route => route.hash === activeHash) || routes[0]

  return (
    <section
      data-testid="home-research-gateway"
      className="research-gateway-stage"
      style={{
        "--gateway-accent": t.accentText,
        "--gateway-border": t.border,
        "--gateway-muted": t.muted,
        "--gateway-panel": t.panel,
        "--gateway-surface": t.surface,
        "--gateway-text": t.textStrong,
        boxShadow: t.shadowSm,
      }}
    >
      <header>
        <div>
          <span>{zh ? "研究入口 / 证据边界" : "Research routes / evidence boundary"}</span>
          <h2>{zh ? "从问题类型进入完整工作流" : "Enter the full workflow from the research question"}</h2>
          <p>
            {zh
              ? "入口、能力说明与当前限制合并到同一决策面：先选择研究问题，再查看输入、输出和不能越过的证据边界。"
              : "Routes, capability descriptions, and current limits now share one decision surface: choose the question, then inspect inputs, outputs, and evidence boundaries."}
          </p>
        </div>
        <div className="research-gateway-index">
          <span>{zh ? "WORKSPACES" : "WORKSPACES"}</span>
          <strong className="num">{String(routes.length).padStart(2, "0")}</strong>
        </div>
      </header>

      <div data-testid="home-module-capabilities" className="research-gateway-layout">
        <div data-testid="home-research-scenarios" className="research-route-tabs" role="tablist" aria-label={zh ? "研究工作区" : "Research workspaces"}>
          {routes.map((route, index) => (
            <button
              key={route.hash}
              type="button"
              role="tab"
              aria-selected={active?.hash === route.hash}
              data-active={active?.hash === route.hash ? "true" : "false"}
              onClick={() => setActiveHash(route.hash)}
            >
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{route.title}</strong>
                <small>{route.tag}</small>
              </div>
            </button>
          ))}
        </div>
        <article className="research-route-detail" key={active?.hash}>
          <div className="research-route-heading">
            <IconBadge t={t} tone={active?.tone}>{active?.mark}</IconBadge>
            <div>
              <span>{active?.tag}</span>
              <h3>{active?.title}</h3>
            </div>
          </div>
          <p>{active?.body}</p>
          <div className="research-route-io">
            {active?.io?.map((line, index) => (
              <div key={line}>
                <span>{index === 0 ? (zh ? "输入" : "INPUT") : (zh ? "输出" : "OUTPUT")}</span>
                <strong>{line.replace(/^(输入|输出|Input|Output)[:：]?\s*/i, "")}</strong>
              </div>
            ))}
          </div>
          <ActionButton t={t} primary hash={`#${active?.hash}`} onClick={() => onNavigate(active?.hash, active?.target)}>
            {active?.button}
          </ActionButton>
        </article>
      </div>

      <div data-testid="home-current-limitations" className="research-boundary-strip">
        <div>
          <span>{zh ? "EVIDENCE BOUNDARY" : "EVIDENCE BOUNDARY"}</span>
          <strong>{zh ? "当前限制保持显式可见" : "Current limits remain explicit"}</strong>
        </div>
        <ul>
          {limitations.map(item => <LimitationItem key={item.title} item={item} t={t} lang={lang} />)}
        </ul>
      </div>

      <div data-testid="home-quick-start" className="research-gateway-actions">
        <div>
          <span>{zh ? "快速开始" : "QUICK START"}</span>
          <strong>{zh ? "选择研究入口" : "Choose a research entry point"}</strong>
        </div>
        <div data-testid="home-quick-start-buttons">
          {quickStart.map(cta => (
            <ActionButton
              key={cta.hash}
              t={t}
              primary={cta.primary}
              wide={isMobile}
              hash={`#${cta.hash}`}
              onClick={() => cta.action === "contact" ? onContactOpen?.(true) : onNavigate(cta.hash, cta.target)}
            >
              {cta.label}
            </ActionButton>
          ))}
        </div>
      </div>
    </section>
  )
}

function ModuleCapabilityCard({ module, t, isMobile, onNavigate }) {
  return (
    <article className="content-card home-module-card home-atlas-linked-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      display: "grid",
      gap: 11,
      minWidth: 0,
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconBadge t={t} tone={module.tone}>{module.mark}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 16.5, lineHeight: 1.25, fontWeight: 900 }}>{module.title}</h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>{module.tag}</div>
        </div>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.3, lineHeight: 1.6 }}>{module.body}</p>
      <div style={{ display: "grid", gap: 4 }}>
        {module.io.map(line => (
          <span key={line} style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.45, fontWeight: 700 }}>{line}</span>
        ))}
      </div>
      <div className="home-module-flowline" aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
        <span style={{ height: 1, background: t.borderStrong }} />
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, letterSpacing: 0 }}>DATA → RESULT</span>
        <span style={{ height: 1, background: t.borderStrong }} />
      </div>
      <ActionButton t={t} wide hash={`#${module.hash}`} onClick={() => onNavigate(module.hash, module.target)}>
        {module.button}
      </ActionButton>
    </article>
  )
}

function ScenarioCard({ scenario, t, isMobile, onNavigate }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 17,
      display: "grid",
      gap: 13,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBadge t={t} tone={scenario.tone}>{scenario.mark}</IconBadge>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 18, lineHeight: 1.25, fontWeight: 950 }}>{scenario.title}</h3>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.65 }}>{scenario.body}</p>
      <ActionButton t={t} wide={isMobile} hash={`#${scenario.hash}`} onClick={() => onNavigate(scenario.hash, scenario.target)}>
        {scenario.button}
      </ActionButton>
    </article>
  )
}

function LimitationItem({ item, t, lang }) {
  const title = item.title || (lang === "zh" ? item.zh : item.en)
  const body = item.body || item.en
  return (
    <li style={{
      listStyle: "none",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "12px 13px",
      color: t.textStrong,
      display: "grid",
      gap: 3,
      minWidth: 0,
    }}>
      <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{title}</strong>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{body}</span>
    </li>
  )
}

function HeroVisual({ t, lang, summary }) {
  const rows = [
    { label: "Database", value: numberText(summary.totalRecords, "+") },
    { label: "Labels", value: numberText(summary.experimentalLabelCount) },
    { label: "Benchmark", value: numberText(summary.benchmarkEligibleCount) },
    { label: "Model", value: summary.bestModel || "Pending" },
  ]

  return (
    <aside className="content-card home-platform-visual" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: 18,
      display: "grid",
      gap: 15,
      minWidth: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <BrandMotif
        size={150}
        color={t.accentText}
        opacity={0.045}
        className="hero-brand-watermark"
        style={{ position: "absolute", right: -28, top: -28, pointerEvents: "none" }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <LogoMark size={24} radius={7} />
          <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.2 }}>
            {text("平台工作流", "Platform Workflow", lang)}
          </strong>
        </div>
        <span style={{
          color: t.accentText,
          background: t.badgeInfoBg,
          border: `1px solid ${t.border}`,
          borderRadius: 999,
          padding: "6px 9px",
          fontSize: 10.5,
          fontWeight: 850,
        }}>
          {APP_VERSION_LABEL}
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 9 }}>
        {rows.map((row, index) => (
          <div key={row.label} style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
          }}>
            <IconBadge t={t} tone={index === 0 ? "info" : index === 1 ? "success" : index === 2 ? "warn" : "neutral"}>
              {String(index + 1).padStart(2, "0")}
            </IconBadge>
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 9,
              padding: "10px 11px",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}>
              <span style={{ color: t.muted, fontSize: 12, fontWeight: 820 }}>{row.label}</span>
              <strong style={{ color: t.textStrong, fontSize: 12.5, fontFamily: FONT_SANS, lineHeight: 1.3 }}>{row.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <p style={{ position: "relative", zIndex: 1, margin: 0, color: t.subtle, fontSize: 11.5, lineHeight: 1.55, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
        {text("从数据库到筛选解释，再到验证准备。", "From database to screening explanation, then validation preparation.", lang)}
      </p>
    </aside>
  )
}

export function HomeTab({ setActiveTab, onContactOpen }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const reducedMotion = usePrefersReducedMotion()
  const [summary, setSummary] = useState(DEFAULT_HOME_SUMMARY)
  const gasParetoCount = useMemo(() => buildGasParetoRows().length, [])
  const zh = lang === "zh"

  useEffect(() => {
    let cancelled = false
    loadHomeSummary().then(nextSummary => {
      if (!cancelled) setSummary(nextSummary)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const navigateHash = (hash, fallbackTarget) => {
    setActiveTab?.(fallbackTarget)
    if (typeof window === "undefined") return
    const normalized = String(hash || "").replace(/^#/, "")
    window.location.hash = normalized
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    } catch {
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const pageGap = isMobile ? 18 : 24
  const sectionStyle = { background: "transparent", border: "none", borderRadius: 0 }
  const panelStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const dataCards = useMemo(() => [
    { name: "CoRE MOF 2024 CR", value: numberText(summary.coreMofRecords), body: zh ? "当前 MOF库使用的逐条 CSD-modified 晶体结构记录。" : "Row-level CSD-modified crystal structures used by the current MOF Library." },
    { name: "FAIR-MOFs", value: numberText(summary.fairMofsRecords), body: zh ? "用于合成条件、DOI 与物化性质查询的开放记录。" : "Open records used for synthesis conditions, DOI links, and physicochemical property queries." },
    { name: zh ? "气体吸附记录" : "Gas adsorption records", value: numberText(summary.gasAdsorptionRecords), body: zh ? "GasSep 使用的真实等温线与条件化吸附记录。" : "Real isotherm and condition-aware adsorption records used by GasSep." },
    { name: zh ? "实验标签" : "Experimental labels", value: numberText(summary.experimentalLabelCount), body: zh ? "用于模型验证的实验与独立验证标签。" : "Experimental and independent-validation labels used for model validation." },
    { name: "Benchmark", value: numberText(summary.benchmarkEligibleCount), body: zh ? "满足当前基准比较字段要求的记录。" : "Records meeting the current benchmark comparison requirements." },
  ], [summary, zh])

  const chartRows = useMemo(() => {
    const coreRecords = Number(summary.coreMofRecords || 0)
    const fairRecords = Number(summary.fairMofsRecords || 0)
    const gasRecords = Number(summary.gasAdsorptionRecords || 0)
    const sourceTotal = Math.max(coreRecords + fairRecords + gasRecords, 1)
    const fairDoiRecords = Number(summary.fairMofsDoiRecords || 0)
    const fairPorePropertyRecords = Number(summary.fairMofsPorePropertyRecords || 0)
    return {
      coverage: [
        { label: "CoRE MOF 2024 CR", value: numberText(coreRecords), percent: sharePercent(coreRecords, sourceTotal), detail: zh ? `${numberText(coreRecords)} 条结构记录` : `${numberText(coreRecords)} structure records`, color: t.accentText },
        { label: "FAIR-MOFs", value: numberText(fairRecords), percent: sharePercent(fairRecords, sourceTotal), detail: zh ? `${numberText(fairRecords)} 条合成与性质记录` : `${numberText(fairRecords)} synthesis/property records`, color: t.success || t.accentText },
        { label: zh ? "气体吸附" : "Gas adsorption", value: numberText(gasRecords), percent: sharePercent(gasRecords, sourceTotal), detail: zh ? `${numberText(gasRecords)} 条等温线记录` : `${numberText(gasRecords)} isotherm records`, color: t.warn },
      ],
      quality: [
        { label: zh ? "CoRE 结构元数据" : "CoRE structural metadata", value: numberText(summary.verifiedMetadataCount), percent: sharePercent(summary.verifiedMetadataCount, Math.max(coreRecords, 1)), detail: `${numberText(summary.verifiedMetadataCount)} / ${numberText(coreRecords)}`, color: t.accentText },
        { label: zh ? "FAIR DOI 关联" : "FAIR DOI links", value: numberText(fairDoiRecords), percent: sharePercent(fairDoiRecords, Math.max(fairRecords, 1)), detail: `${numberText(fairDoiRecords)} / ${numberText(fairRecords)}`, color: t.success || t.accentText },
        { label: zh ? "FAIR 孔道性质" : "FAIR pore properties", value: numberText(fairPorePropertyRecords), percent: sharePercent(fairPorePropertyRecords, Math.max(fairRecords, 1)), detail: `${numberText(fairPorePropertyRecords)} / ${numberText(fairRecords)}`, color: t.warn },
      ],
      source: [
        { label: "CoRE / CCDC", value: numberText(coreRecords), percent: sharePercent(coreRecords, sourceTotal), detail: zh ? "晶体结构层" : "Crystal-structure layer", color: t.accentText },
        { label: "FAIR-MOFs", value: numberText(fairRecords), percent: sharePercent(fairRecords, sourceTotal), detail: zh ? "合成与物化性质层" : "Synthesis and property layer", color: t.success || t.accentText },
        { label: "ISODB / NIST", value: numberText(gasRecords), percent: sharePercent(gasRecords, sourceTotal), detail: zh ? "气体吸附层" : "Gas-adsorption layer", color: t.warn },
      ],
    }
  }, [summary, t, zh])

  const validationFlow = useMemo(() => [
    {
      id: "screening",
      title: zh ? "白盒筛选" : "White-box Screening",
      body: zh ? "透明规则与权重让筛选路径可检查。" : "Transparent rules and weights keep the screening path inspectable.",
      detail: zh ? "保留每个描述符、归一化方式、权重和候选贡献，避免黑盒分数脱离研究语境。" : "Retains every descriptor, normalization rule, weight, and candidate contribution.",
      formula: String.raw`S_i=\sum_{j=1}^{p}w_jx_{ij}^{*},\qquad \sum_{j=1}^{p}w_j=1`,
      metric: "RULED",
    },
    {
      id: "evidence",
      title: zh ? "证据修正" : "Evidence Adjustment",
      body: zh ? "证据等级、来源状态和风险提示影响解释语境。" : "Evidence level, source status, and risk notes shape the explanation context.",
      detail: zh ? "已核验元数据、来源位置与缺失字段共同决定修正系数；缺失证据不会被默认成零风险。" : "Verified metadata, source location, and missing fields jointly determine the modifier; missing evidence is not treated as zero risk.",
      formula: String.raw`S_i^{\prime}=S_i\,q_i,\qquad q_i=f(g_i,\ p_i,\ c_i)`,
      metric: numberText(summary.verifiedMetadataCount),
    },
    {
      id: "sensitivity",
      title: zh ? "敏感性分析" : "Sensitivity Analysis",
      body: zh ? "候选稳定性通过参数扰动与排序变化检查。" : "Candidate stability is checked through parameter changes and ranking movement.",
      detail: zh ? "只有在权重和情景扰动下仍保持相对稳定的候选，才适合进入下一层验证。" : "Only candidates that remain relatively stable under weight and scenario perturbations proceed.",
      formula: String.raw`\Delta r_i(\delta)=r_i(\mathbf{w}+\delta)-r_i(\mathbf{w})`,
      metric: "ΔRANK",
    },
    {
      id: "labels",
      title: zh ? "实验标签" : "Experimental Labels",
      body: zh ? "实验标签用于连接候选解释与模型验证。" : "Experimental labels connect candidate explanation to model validation.",
      detail: zh ? "实验标签用于估计外部误差与适用域，而不是替代来源和实验条件说明。" : "Experimental labels estimate external error and applicability domain rather than replacing provenance and conditions.",
      formula: String.raw`\mathcal{D}_{\mathrm{exp}}=\{(\mathbf{x}_i,y_i,\sigma_i)\}_{i=1}^{n}`,
      metric: numberText(summary.experimentalLabelCount),
    },
    {
      id: "benchmark",
      title: zh ? "Benchmark 框架" : "Benchmark Framework",
      body: zh ? "Benchmark 已接入" : "Benchmark Available",
      detail: zh ? "Benchmark 框架已作为验证入口；具体模型指标、外部测试与适用域说明由验证中心承载。" : "The benchmark is available as a validation entry; model metrics, external tests, and applicability-domain details stay in the validation center.",
      formula: String.raw`\mathcal{B}(f)=\{\mathrm{CV},\ \mathcal{D}_{\mathrm{ext}},\ \mathrm{Cal},\ \mathrm{UQ}\}`,
      metric: numberText(summary.benchmarkEligibleCount),
    },
  ], [summary, zh])

  const limitations = useMemo(() => [
    {
      title: zh ? "高过拟合风险" : (summary.currentRisk || "High Overfitting Risk"),
      body: zh ? "训练集与外部测试之间仍有明显差距，必须在首页直接提示。" : "Train to external-test gap remains high and must stay visible.",
    },
    {
      title: zh ? "实验标签仍需扩充" : "Need More Experimental Labels",
      body: zh ? `${numberText(summary.experimentalLabelCount)} 条实验标签已有价值，但距离研究级规模仍不足。` : `${numberText(summary.experimentalLabelCount)} labels are useful but still below research-grade scale.`,
    },
    {
      title: zh ? "非最终推荐" : "Not Final Recommendation",
      body: zh ? "候选排序用于支持研究判断，不等同于最终实验推荐。" : "Candidate rankings support research decisions, not final experimental recommendation.",
    },
  ], [summary, zh])


  const moduleCapabilities = useMemo(() => [
    {
      mark: "ES",
      title: "EcoScreen",
      tag: zh ? "可持续性筛选" : "Sustainability screening",
      tone: "info",
      body: zh
        ? "做什么：对候选 MOF 做 LCA / LCC 可持续性筛选与白盒排序。"
        : "What it does: LCA / LCC sustainability screening with white-box ranking for candidate MOFs.",
      io: [
        zh ? "输入：MOF 结构 + 反应/工艺条件" : "Input: MOF structure + reaction/process conditions",
        zh ? "输出：环境与成本评分 + 可检查的排序解释" : "Output: environment & cost scores + inspectable ranking",
      ],
      button: zh ? "进入 EcoScreen" : "Enter EcoScreen",
      hash: "ecoscreen",
      target: "ecoscreen",
    },
    {
      mark: "GS",
      title: "GasSep",
      tag: zh ? "气体分离 / 容量筛选" : "Gas separation / capacity",
      tone: "success",
      body: zh
        ? "做什么：基于 ISODB 真实等温线与 IAST 选择性比较气体分离候选。"
        : "What it does: compare gas-separation candidates using real ISODB isotherms and IAST selectivity.",
      io: [
        zh ? "输入：气对（如 CO₂/N₂）+ 温度条件" : "Input: gas pair (e.g. CO₂/N₂) + temperature",
        zh ? "输出：computed-IAST 选择性 + 工作容量排序" : "Output: computed-IAST selectivity + working-capacity ranking",
      ],
      button: zh ? "进入 GasSep" : "Enter GasSep",
      hash: "gassep",
      target: "gassep",
    },
    {
      mark: "OA",
      title: "Organic Acid",
      tag: zh ? "白盒催化路线筛选" : "White-box route screening",
      tone: "warn",
      body: zh
        ? "做什么：数据驱动的白盒主客体催化路线筛选（HGCPS + 不确定度）。"
        : "What it does: data-driven white-box host-guest catalytic route screening (HGCPS + uncertainty).",
      io: [
        zh ? "输入：反应数据 + 主体 MOF / 客体金属候选" : "Input: reaction data + host-MOF / guest-metal candidates",
        zh ? "输出：带误差条的 HGCPS 排序 + 证据语境" : "Output: HGCPS ranking with error bars + evidence context",
      ],
      button: zh ? "进入 Organic Acid" : "Enter Organic Acid",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
    },
    {
      mark: "ML",
      title: "MOF Library",
      tag: zh ? "MOF库" : "MOF Library",
      tone: "neutral",
      body: zh
        ? "做什么：查任意 MOF 的结构、气体与催化全貌，含字段级溯源。"
        : "What it does: browse any MOF's structure, gas, and catalysis profile with field-level provenance.",
      io: [
        zh ? "输入：金属节点 / 拓扑 / 比表面等分面检索" : "Input: faceted search by metal node / topology / surface area",
        zh ? "输出：聚合详情面板 + 数据完整度三色点" : "Output: aggregated detail panel + tri-color completeness dots",
      ],
      button: zh ? "进入 MOF Library" : "Enter MOF Library",
      hash: "library",
      target: "mofLibrary",
    },
  ], [zh])

  const quickStart = [
    { label: zh ? "生态筛选" : "Eco Screening", hash: "ecoscreen", target: "ecoscreen", primary: true },
    { label: zh ? "气体分离" : "Gas Separation", hash: "gassep", target: "gassep" },
    { label: zh ? "催化" : "Catalysis", hash: "catalysis", target: "catalysisLab" },
    { label: zh ? "数据合规承诺" : "Data Compliance Pledge", hash: "database-compliance", target: "dataCompliance" },
    { label: zh ? "联系我们" : "Contact Us", hash: "contact", action: "contact" },
  ]

  return (
    <div className="home-story-shell" style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden", position: "relative" }}>
      <BrandMotionBackground t={t} isMobile={isNarrow} reducedMotion={reducedMotion} />

      <section id="overview" data-testid="home-hero" className="home-hero-section" style={{ ...sectionStyle, paddingTop: isMobile ? 10 : 18, position: "relative", overflow: "hidden" }}>
        <div className="home-hero-bg-layer" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {!isMobile && (
            <BrandMotif
              size={300}
              color={t.accentText}
              opacity={0.052}
              className="hero-bg-brand-motif"
              style={{ position: "absolute", right: -86, top: 10, pointerEvents: "none" }}
              strokeWidth={1.2}
            />
          )}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.96fr) minmax(320px, 0.82fr)",
          gap: isMobile ? 16 : 20,
          alignItems: "center",
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}>
          <div className="home-hero-foreground" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <LogoMark size={isMobile ? 48 : 58} radius={14} style={{ boxShadow: t.shadowSm }} />
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                {zh ? "材料筛选 / 字段级溯源 / 验证准备" : "Material screening / field-level provenance / validation readiness"}
              </div>
            </div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 42 : 64, lineHeight: 0.98, fontWeight: 950, letterSpacing: 0 }}>
              EcoMOF-AI
            </h1>
            <p style={{ margin: isMobile ? "14px 0 0" : "18px 0 0", color: t.textStrong, fontSize: isMobile ? 20 : 28, lineHeight: 1.18, fontWeight: 900, maxWidth: 860 }}>
              {zh ? "数据驱动的 MOF 筛选与验证平台" : "Data-driven MOF Screening and Validation Platform"}
            </p>
            <p style={{ margin: "13px 0 0", color: t.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.7, maxWidth: 780 }}>
              {zh
                ? "四个研究工作区覆盖可持续性筛选、气体分离、白盒催化路线与材料数据库浏览。"
                : "One platform, four research workspaces: EcoScreen for sustainability screening, GasSep for gas separation, Organic Acid for white-box route screening, and MOF Library to browse structure, gas, and catalysis data."}
            </p>
            <div style={{ marginTop: 18 }} className="home-hero-cta home-primary-entry-grid" data-testid="home-primary-entry-grid">
              {quickStart.map(cta => (
                <ActionButton
                  key={cta.hash}
                  t={t}
                  primary={cta.primary}
                  hash={`#${cta.hash}`}
                  onClick={() => cta.action === "contact" ? onContactOpen?.(true) : navigateHash(cta.hash, cta.target)}
                >
                  {cta.label}
                </ActionButton>
              ))}
            </div>
          </div>
          <ResearchEquationHero t={t} lang={lang} summary={summary} gasParetoCount={gasParetoCount} isMobile={isMobile} reducedMotion={reducedMotion} />
        </div>
      </section>

      <section data-testid="home-data-foundation" className="home-immersive-panel" style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.badgeInfoBg }}>
        <SectionHeader
          eyebrow={zh ? "数据基础" : "Data Foundation"}
          title={zh ? "当前启用的数据与证据层" : "Active data and evidence layers"}
          subtitle={zh ? "仅展示当前参与检索、计算或验证的数据。不同数据层可能指向同一材料，因此记录数不等同于去重后的 MOF 总数。" : "Only data currently used for search, calculation, or validation are shown. Layers can refer to the same material, so record counts are not a deduplicated MOF total."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
          {dataCards.map(item => <DataCard key={item.name} item={item} t={t} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <MiniBarChart title={zh ? "数据层规模" : "Data layer scale"} rows={chartRows.coverage} t={t} lang={lang} />
          <MiniBarChart title={zh ? "字段覆盖" : "Field coverage"} rows={chartRows.quality} t={t} lang={lang} />
          <MiniBarChart title={zh ? "来源构成" : "Source composition"} rows={chartRows.source} t={t} lang={lang} />
        </div>
      </section>

      <section id="home-descriptor-3d" data-testid="home-descriptor-3d" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "交互可视化" : "Interactive Visual"}
          title={zh ? "数据库描述符空间" : "Descriptor space explorer"}
          subtitle={zh ? "用真实 CoRE MOF 2024 CSD-modified CR 数据展示描述符三维分布、统计分布、金属筛选与相关性。" : "Explore descriptor distributions, metal filters, and correlations from real CoRE MOF 2024 CSD-modified CR records."}
          t={t}
          isMobile={isMobile}
        />
        <StoryTransition index={1} label={zh ? "从数据来源到描述符空间" : "From source data to descriptor space"} t={t} />
        <MofDescriptor3DScatter t={t} lang={lang} isMobile={isMobile} />
        <StoryTransition index={2} label={zh ? "从空间位置到统计结构" : "From spatial position to statistical structure"} t={t} />
        <HomeDataExplorer t={t} lang={lang} isMobile={isMobile} />
        <StoryTransition index={3} label={zh ? "从结构分布到任务性能" : "From structural distribution to task performance"} t={t} />
        <GasParetoChart t={t} lang={lang} isMobile={isMobile} />
      </section>

      <section data-testid="home-algorithm-validation" style={sectionStyle}>
        <StoryTransition index={4} label={zh ? "从候选性能到验证证据" : "From candidate performance to validation evidence"} t={t} />
        <ValidationEquationStage t={t} lang={lang} summary={summary} items={validationFlow} isMobile={isMobile} onNavigate={navigateHash} />
      </section>

      <StoryTransition index={5} label={zh ? "从验证结论到研究行动" : "From validation evidence to research action"} t={t} />
      <ResearchGatewayStage
        t={t}
        lang={lang}
        modules={moduleCapabilities}
        limitations={limitations}
        quickStart={quickStart}
        isMobile={isMobile}
        onNavigate={navigateHash}
        onContactOpen={onContactOpen}
      />
    </div>
  )
}
