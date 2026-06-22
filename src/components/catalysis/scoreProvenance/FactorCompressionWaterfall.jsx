import { useState } from "react"
import { asArray, cardStyle, ChartFrame, EmptyState, fmt, GradeBadge, palette, pct, text } from "./shared"

const GRADE_TONE = { seed: "info", proxy: "warn", curated: "good", inferred: "muted" }

export function FactorCompressionWaterfall({ model, lang = "zh", withTestId = true, onSelectFactor }) {
  const steps = asArray(model?.steps)
  const [openKey, setOpenKey] = useState(null)
  if (!steps.length) {
    return <ChartFrame testId={withTestId ? "factor-compression-waterfall" : undefined} rowCount={0} title={text(lang, model?.titleZh, model?.titleEn)}><EmptyState lang={lang} /></ChartFrame>
  }
  const points = [{ cumulativeValue: model.startValue ?? 1 }, ...steps]
  const barWidth = 64
  const gap = 18
  const chartHeight = 150
  const width = points.length * barWidth + (points.length - 1) * gap + 20
  const yOf = value => chartHeight - Math.max(4, Math.min(1, Number(value) || 0) * chartHeight)

  return (
    <div data-testid={withTestId ? "factor-compression-waterfall" : undefined} data-factor-count={steps.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, `${model.routeLabel} · 从 1.0 起逐个因子相乘压缩到 HGCPS ${fmt(model.finalHGCPS, 3)}`, `${model.routeLabel} · multiply from 1.0 down to HGCPS ${fmt(model.finalHGCPS, 3)}`)}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${chartHeight + 46}`} role="img" aria-label={text(lang, model.titleZh, model.titleEn)} style={{ minWidth: width, width: "100%", height: "auto" }}>
        {points.map((point, index) => {
          const x = 10 + index * (barWidth + gap)
          const y = yOf(point.cumulativeValue)
          const isStart = index === 0
          const step = isStart ? null : steps[index - 1]
          const tone = isStart ? palette.accent : (step?.factorKey === "riskRetentionFactor" ? palette.risk : palette.positive)
          return (
            <g key={isStart ? "start" : step.factorKey}>
              {index > 0 ? <line x1={x - gap} y1={yOf(points[index - 1].cumulativeValue)} x2={x} y2={y} stroke={palette.borderStrong} strokeWidth="1" strokeDasharray="3 3" /> : null}
              <rect x={x} y={y} width={barWidth} height={chartHeight - y} rx="5" fill={tone} opacity={isStart ? 0.55 : 0.9} />
              <text x={x + barWidth / 2} y={y - 5} fill={palette.text} fontSize="10.5" fontWeight="900" textAnchor="middle">{fmt(point.cumulativeValue, 2)}</text>
              <text x={x + barWidth / 2} y={chartHeight + 16} fill={palette.faint} fontSize="9.5" textAnchor="middle">{isStart ? text(lang, "起点 1.0", "start 1.0") : `×${fmt(step.factorValue, 2)}`}</text>
              <text x={x + barWidth / 2} y={chartHeight + 30} fill={palette.muted} fontSize="9" textAnchor="middle">{isStart ? "HGCPS" : text(lang, step.labelZh, step.labelEn).slice(0, 6)}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: "grid", gap: 6 }}>
        {steps.map(step => {
          const open = openKey === step.factorKey
          return (
            <div key={step.factorKey} style={{ background: palette.surface, border: `1px solid ${open ? palette.accent : palette.border}`, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => { setOpenKey(open ? null : step.factorKey); onSelectFactor?.(step) }}
                title={text(lang, `原始字段 ${step.rawField} · 归一化 ${fmt(step.normalizedValue, 2)} · 来源 ${step.sourceFile}`, `raw ${step.rawField} · normalized ${fmt(step.normalizedValue, 2)} · ${step.sourceFile}`)}
                style={{ alignItems: "center", background: "transparent", border: "none", cursor: "pointer", display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) auto auto", padding: 9, textAlign: "left", width: "100%" }}
              >
                <span style={{ color: palette.text, fontSize: 11.8, fontWeight: 850 }}>{text(lang, step.labelZh, step.labelEn)}</span>
                <span style={{ color: palette.muted, fontSize: 11.5 }}>×{fmt(step.factorValue, 2)} → {fmt(step.cumulativeValue, 3)}</span>
                <GradeBadge grade={step.dataGrade} labelZh={step.dataGrade} labelEn={step.dataGrade} tone={GRADE_TONE[step.dataGrade] || "info"} lang={lang} />
              </button>
              {open ? (
                <div style={{ borderTop: `1px solid ${palette.border}`, color: palette.muted, display: "grid", fontSize: 11, gap: 4, lineHeight: 1.45, padding: 9 }}>
                  <span>{text(lang, "原始字段", "Raw field")}: {step.rawField} = {fmt(step.rawValue, 3)} · {text(lang, "归一化", "normalized")} {fmt(step.normalizedValue, 3)} ({pct(step.normalizedValue)})</span>
                  <span>{text(lang, "来源", "Source")}: {step.sourceFile} · builder {step.builder}</span>
                  <span style={{ color: step.factorKey === "riskRetentionFactor" ? palette.risk : palette.faint }}>{step.limitation}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <p style={{ color: palette.risk, fontSize: 11, lineHeight: 1.45, margin: 0 }}>{text(lang, model.riskRetentionNoteZh, model.riskRetentionNoteEn)}</p>
      <p style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.4, margin: 0 }}>{text(lang, model.headerNoteZh, model.headerNoteEn)}</p>
    </div>
  )
}

export default FactorCompressionWaterfall
