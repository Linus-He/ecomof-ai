// @ts-nocheck
// V2.8 real-SVG mini charts embedded inside the Interactive Scientific Figure.
// Every chart is drawn from live data (no screenshots, no fabricated metrics).
import {
  buildCandidateStabilityChart,
  buildDescriptorImportanceChart,
  buildFeatureCoverageChart,
  buildModelReadinessChart,
  buildTopCandidateRankingChart,
} from "../../../utils/algorithmValidationFigure"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function ChartFrame({ title, testId, t, children, footnote }) {
  return (
    <figure data-testid={testId} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, margin: 0, minWidth: 0, padding: 10 }}>
      <figcaption style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</figcaption>
      {children}
      {footnote ? <span style={{ color: t.warn, fontSize: 10, lineHeight: 1.35 }}>{footnote}</span> : null}
    </figure>
  )
}

// Generic horizontal bar chart drawn as SVG.
function HBarChart({ rows, t, maxValue, format, colorFor, ariaLabel }) {
  const safeRows = rows.length ? rows : [{ key: "empty", label: "pending", value: 0 }]
  const rowHeight = 18
  const gap = 6
  const labelWidth = 86
  const barAreaWidth = 150
  const width = labelWidth + barAreaWidth + 34
  const height = safeRows.length * (rowHeight + gap) + 4
  const max = maxValue || Math.max(0.0001, ...safeRows.map(row => Number(row.value) || 0))
  return (
    <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} style={{ height: "auto", maxWidth: "100%", width: "100%" }}>
      {safeRows.map((row, index) => {
        const y = index * (rowHeight + gap) + 2
        const value = Number(row.value) || 0
        const barWidth = Math.max(2, Math.round((value / max) * barAreaWidth))
        const color = colorFor ? colorFor(row) : t.accent
        return (
          <g key={row.key || index}>
            <text x={0} y={y + rowHeight - 5} fontSize="9" fill={t.muted} style={{ fontWeight: 700 }}>
              {String(row.label || row.key).slice(0, 14)}
            </text>
            <rect x={labelWidth} y={y} width={barAreaWidth} height={rowHeight} rx={3} fill={t.panel} stroke={t.border} />
            <rect x={labelWidth} y={y} width={barWidth} height={rowHeight} rx={3} fill={color} />
            <text x={labelWidth + barAreaWidth + 4} y={y + rowHeight - 5} fontSize="9" fill={t.textStrong} style={{ fontWeight: 800 }}>
              {format ? format(row) : value.toFixed(2)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DescriptorImportanceMini({ lang, t }) {
  const rows = buildDescriptorImportanceChart()
  return (
    <ChartFrame title={text(lang, "描述符重要性", "Descriptor Importance")} testId="mini-chart-descriptorImportance" t={t}>
      <HBarChart
        rows={rows}
        t={t}
        maxValue={1}
        ariaLabel="Descriptor importance bar chart"
        colorFor={() => t.accent}
        format={row => Number(row.value).toFixed(2)}
      />
    </ChartFrame>
  )
}

export function FeatureCoverageMini({ lang, t }) {
  const rows = buildFeatureCoverageChart().map(step => ({ key: step.key, label: step.label, value: step.output, pending: step.pending }))
  return (
    <ChartFrame title={text(lang, "特征覆盖", "Feature Coverage")} testId="mini-chart-featureCoverage" t={t}>
      <HBarChart
        rows={rows}
        t={t}
        maxValue={45}
        ariaLabel="Feature selection coverage funnel"
        colorFor={row => (row.pending ? t.warn : t.success || t.accent)}
        format={row => String(row.value)}
      />
    </ChartFrame>
  )
}

export function ModelReadinessMini({ readiness, lang, t }) {
  const rows = buildModelReadinessChart({ readiness }).map(row => ({ key: row.key, label: `${row.label} (${row.required})`, value: row.progress, status: row.status }))
  const labelsMissing = (readiness?.experimentalLabels ?? 0) <= 0
  return (
    <ChartFrame
      title={text(lang, "模型就绪度", "Model Readiness")}
      testId="mini-chart-modelReadiness"
      t={t}
      footnote={labelsMissing ? text(lang, "Accuracy / ROC-AUC: Pending · 需要实验标签", "Accuracy / ROC-AUC: Pending · labels required") : null}
    >
      <HBarChart
        rows={rows}
        t={t}
        maxValue={1}
        ariaLabel="Model readiness progress (label coverage)"
        colorFor={() => t.warn}
        format={row => (row.value > 0 ? `${Math.round(row.value * 100)}%` : "Pending")}
      />
    </ChartFrame>
  )
}

export function CandidateStabilityMini({ algorithm, lang, t }) {
  const rows = buildCandidateStabilityChart({ algorithm })
  return (
    <ChartFrame title={text(lang, "候选稳定性", "Candidate Stability")} testId="mini-chart-candidateStability" t={t} footnote={text(lang, "数值=排名跨度，越低越稳定", "value = rank spread, lower is more stable")}>
      <HBarChart
        rows={rows}
        t={t}
        ariaLabel="Candidate rank stability spread"
        colorFor={row => (row.stability === "Unstable" ? t.warn : t.success || t.accent)}
        format={row => String(row.value)}
      />
    </ChartFrame>
  )
}

export function TopCandidateRankingMini({ algorithm, lang, t }) {
  const rows = buildTopCandidateRankingChart({ algorithm })
  return (
    <ChartFrame title={text(lang, "候选排名", "Top Candidate Ranking")} testId="mini-chart-topCandidateRanking" t={t}>
      <HBarChart
        rows={rows}
        t={t}
        ariaLabel="Top candidate final-score ranking"
        colorFor={() => t.accent}
        format={row => Number(row.value).toFixed(2)}
      />
    </ChartFrame>
  )
}

export function FigureMiniChart({ id, algorithm, readiness, lang, t }) {
  if (id === "descriptorImportance") return <DescriptorImportanceMini lang={lang} t={t} />
  if (id === "featureCoverage") return <FeatureCoverageMini lang={lang} t={t} />
  if (id === "modelReadiness") return <ModelReadinessMini readiness={readiness} lang={lang} t={t} />
  if (id === "candidateStability") return <CandidateStabilityMini algorithm={algorithm} lang={lang} t={t} />
  if (id === "topCandidateRanking") return <TopCandidateRankingMini algorithm={algorithm} lang={lang} t={t} />
  return null
}
