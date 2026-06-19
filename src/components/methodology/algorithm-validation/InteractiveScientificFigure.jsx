// @ts-nocheck
// V2.8 Interactive Scientific Figure — the single core entry of the Algorithm
// Validation Center. A real interactive SVG research figure (Database ->
// Experimental Validation) with clickable nodes, a Figure Inspector, and
// embedded real-SVG mini charts. It never fabricates predictive accuracy.
import { useMemo, useState } from "react"
import { BasisBadge, FieldProvenanceButton } from "../../ui"
import {
  FIGURE_MINI_CHARTS,
  buildFigureModel,
  figureNodeFieldSource,
} from "../../../utils/algorithmValidationFigure"
import { FigureMiniChart } from "./FigureMiniCharts"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const STATUS_LABEL = {
  passed: { label: "Passed", labelZh: "通过", tone: "calc" },
  warning: { label: "Warning", labelZh: "需注意", tone: "warn" },
  blocked: { label: "Blocked", labelZh: "阻断", tone: "warn" },
  planned: { label: "Planned", labelZh: "规划中", tone: "info" },
  pending: { label: "Pending", labelZh: "待定", tone: "warn" },
}

const STATUS_FILTERS = [
  { id: "all", label: "All", labelZh: "全部" },
  { id: "passed", label: "Passed", labelZh: "通过" },
  { id: "warning", label: "Warning", labelZh: "需注意" },
  { id: "blocked", label: "Blocked", labelZh: "阻断" },
]

function statusColor(status, t) {
  if (status === "passed") return t.success || t.accentText
  if (status === "planned") return t.accent
  return t.warn
}

function NodeFlowSvg({ nodes, selectedId, statusFilter, onSelect, lang, t }) {
  const NODE_H = 60
  const GAP = 22
  const WIDTH = 360
  const X = 18
  const NODE_W = WIDTH - X * 2
  const top = 8
  const height = top + nodes.length * NODE_H + (nodes.length - 1) * GAP + 8
  return (
    <svg
      role="img"
      aria-label={text(lang, "交互式科研主图：数据库到实验验证", "Interactive scientific figure: database to experimental validation")}
      viewBox={`0 0 ${WIDTH} ${height}`}
      style={{ height: "auto", maxWidth: 420, width: "100%" }}
    >
      <defs>
        <marker id="algval-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill={t.faint} />
        </marker>
      </defs>
      {nodes.map((node, index) => {
        const y = top + index * (NODE_H + GAP)
        const selected = node.id === selectedId
        const dim = statusFilter !== "all" && node.status !== statusFilter
        const color = statusColor(node.status, t)
        const status = STATUS_LABEL[node.status] || STATUS_LABEL.pending
        return (
          <g key={node.id}>
            {index < nodes.length - 1 ? (
              <line x1={WIDTH / 2} y1={y + NODE_H} x2={WIDTH / 2} y2={y + NODE_H + GAP} stroke={t.faint} strokeWidth="1.4" markerEnd="url(#algval-arrow)" />
            ) : null}
            <g
              data-testid={`figure-node-${node.id}`}
              data-status={node.status}
              data-selected={selected ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-label={`${text(lang, node.titleZh, node.title)} — ${text(lang, status.labelZh, status.label)}`}
              onClick={() => onSelect(node.id)}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(node.id) } }}
              style={{ cursor: "pointer", opacity: dim ? 0.32 : 1 }}
            >
              <rect x={X} y={y} width={NODE_W} height={NODE_H} rx={9} fill={selected ? t.badgeInfoBg : t.surface} stroke={selected ? t.accent : t.border} strokeWidth={selected ? 2 : 1} />
              <rect x={X} y={y} width={6} height={NODE_H} rx={3} fill={color} />
              <text x={X + 16} y={y + 22} fontSize="12.5" fill={t.textStrong} style={{ fontWeight: 800 }}>
                {`${index + 1}. ${text(lang, node.shortZh, node.short)}`}
              </text>
              <text x={X + 16} y={y + 40} fontSize="9.5" fill={t.muted}>
                {`${node.items.length} ${text(lang, "节点", "items")}`}
              </text>
              <text x={X + NODE_W - 10} y={y + 22} fontSize="9.5" fill={color} textAnchor="end" style={{ fontWeight: 900, textTransform: "uppercase" }}>
                {text(lang, status.labelZh, status.label)}
              </text>
              <circle cx={X + NODE_W - 12} cy={y + 38} r={4} fill={color} />
            </g>
          </g>
        )
      })}
    </svg>
  )
}

function InspectorRow({ label, value, t }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

function FigureInspector({ node, algorithm, readiness, lang, t, onJumpToSection }) {
  const status = STATUS_LABEL[node.status] || STATUS_LABEL.pending
  const source = figureNodeFieldSource(node)
  const rows = [
    [text(lang, "输入", "Input"), node.inspector.input],
    [text(lang, "输出", "Output"), node.inspector.output],
    [text(lang, "算法", "Algorithm"), node.inspector.algorithm],
    [text(lang, "权重", "Weights"), node.inspector.weights],
    [text(lang, "字段来源", "Field source"), node.inspector.fieldSource],
    [text(lang, "数据质量", "Data quality"), node.inspector.dataQuality],
    [text(lang, "下一步", "Next step"), node.inspector.nextStep],
  ]
  return (
    <aside data-testid="figure-inspector" data-node={node.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, minWidth: 0, padding: 13 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "图节点检视器", "Figure Inspector")}</span>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.2 }}>{text(lang, node.titleZh, node.title)}</strong>
          <BasisBadge tone={status.tone}>{text(lang, status.labelZh, status.label)}</BasisBadge>
        </div>
        <span style={{ alignItems: "center", display: "inline-flex", gap: 4 }}>
          <span style={{ color: t.faint, fontSize: 11 }}>{text(lang, "字段级溯源", "Field-level provenance")}</span>
          <FieldProvenanceButton fieldKey={node.id} fieldLabel={text(lang, node.titleZh, node.title)} source={source} lang={lang} />
        </span>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {node.items.map(item => (
          <span key={item.label} style={{ background: t.surface, border: `1px solid ${item.tone === "warn" ? t.warn : t.border}`, borderRadius: 999, color: item.tone === "warn" ? t.warn : t.muted, fontSize: 10.5, fontWeight: 800, padding: "3px 8px" }}>
            {item.label}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        {rows.map(([label, value]) => <InspectorRow key={label} label={label} value={value} t={t} />)}
        {node.inspector.blocker ? (
          <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 11.5, fontWeight: 900, lineHeight: 1.45, padding: 9 }}>
            {text(lang, "当前阻断条件", "Current blocker")}: {node.inspector.blocker}
          </div>
        ) : null}
      </div>

      <FigureMiniChart id={node.miniChart} algorithm={algorithm} readiness={readiness} lang={lang} t={t} />

      {node.navTarget ? (
        <button
          type="button"
          data-testid={`figure-jump-${node.id}`}
          onClick={() => onJumpToSection?.(node.navTarget)}
          style={{ background: t.surface, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, justifySelf: "start", minHeight: 34, padding: "7px 11px" }}
        >
          {text(lang, node.navLabelZh || "查看该层详情", node.navLabel || "Open this layer")}
        </button>
      ) : null}
    </aside>
  )
}

export function InteractiveScientificFigure({ summary = {}, algorithm = {}, dataFoundation = null, dataAudit = null, firstBenchmark = null, lang, t, isMobile, onJumpToSection }) {
  const { nodes, readiness } = useMemo(() => buildFigureModel({ summary, algorithm, dataFoundation, dataAudit, firstBenchmark }), [summary, algorithm, dataFoundation, dataAudit, firstBenchmark])
  const [selectedId, setSelectedId] = useState(nodes[0]?.id || "database")
  const [statusFilter, setStatusFilter] = useState("all")
  const selected = nodes.find(node => node.id === selectedId) || nodes[0]

  return (
    <section
      id="algval-figure"
      data-testid="interactive-scientific-figure"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, minWidth: 0, overflow: "hidden", padding: 15, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Interactive Scientific Figure</span>
        <h2 style={{ color: t.textStrong, fontSize: 22, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "交互式科研主图：从数据库到实验验证", "Interactive Scientific Figure: Database to Experimental Validation")}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.6, margin: 0, maxWidth: 980 }}>
          {text(
            lang,
            "参考 Su et al. 2025 Figure 1 + Figure 3，把整套算法验证体系整合为一张可交互科研主图。点击任意节点可在右侧检视器查看输入、输出、算法、权重、字段来源、数据质量与下一步；图内嵌入真实 SVG mini chart，未来机器学习只显示 Pending，不显示虚假 Accuracy。",
            "Adapting Su et al. 2025 Figure 1 + Figure 3, the whole validation system is one interactive research figure. Click any node to inspect input, output, algorithm, weights, field source, data quality, and next step; embedded mini charts are real SVG, and Future Machine Learning shows Pending only — never fabricated Accuracy."
          )}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BasisBadge tone="info">White-box MCDA</BasisBadge>
          <BasisBadge tone="info">Evidence Adjustment</BasisBadge>
          <BasisBadge tone="warn">Risk Penalty</BasisBadge>
          <BasisBadge tone="warn">Machine Learning Pending</BasisBadge>
          <BasisBadge tone="warn">No fake Accuracy / ROC-AUC</BasisBadge>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.id}
              type="button"
              data-testid={`figure-filter-${filter.id}`}
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
              style={{ background: statusFilter === filter.id ? t.badgeInfoBg : t.surface, border: `1px solid ${statusFilter === filter.id ? t.accent : t.border}`, borderRadius: 7, color: statusFilter === filter.id ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}
            >
              {text(lang, filter.labelZh, filter.label)}
            </button>
          ))}
        </div>
      </header>

      <div style={{ alignItems: "start", display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 0.85fr) minmax(0, 1.15fr)" }}>
        <div style={{ display: "grid", gap: 10, justifyItems: isMobile ? "stretch" : "center", minWidth: 0 }}>
          <NodeFlowSvg nodes={nodes} selectedId={selectedId} statusFilter={statusFilter} onSelect={setSelectedId} lang={lang} t={t} />
        </div>
        <FigureInspector node={selected} algorithm={algorithm} readiness={readiness} lang={lang} t={t} onJumpToSection={onJumpToSection} />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "图内嵌入的真实 SVG 图表", "Embedded real-SVG mini charts")}</span>
        <div data-testid="figure-mini-chart-gallery" style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {FIGURE_MINI_CHARTS.map(chart => (
            <FigureMiniChart key={chart.id} id={chart.id} algorithm={algorithm} readiness={readiness} lang={lang} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default InteractiveScientificFigure
