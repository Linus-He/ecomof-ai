// @ts-nocheck
// V3.6 Figure F — Robustness Validation. Interactive SVG of repeated 5-fold CV
// accuracy (mean ± std error bar) per model; the bigger the bar overlap with the
// external benchmark, the more robust the result.
import { useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const COLORS = { "Logistic Regression": "#1A6DB5", "Decision Tree": "#B45309", "Random Forest": "#15803D" }

export function RobustnessValidationFigure({ robustness = null, lang = "en", t, isMobile = false }) {
  const [hover, setHover] = useState(null)
  const models = robustness?.crossValidation?.repeatedFiveFold?.models
  if (!models?.length) return null
  const y = v => 130 - v * 110

  return (
    <section id="figure-f-robustness" data-testid="robustness-figure" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <span style={{ color: t.accentText, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>Figure F · {text(lang, "稳健性验证", "Robustness Validation")}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "重复 5-fold 交叉验证（均值 ± 标准差）", "Repeated 5-fold CV (mean ± std)")}</strong>
      <svg viewBox="0 0 260 150" role="img" aria-label="robustness validation" style={{ width: "100%" }}>
        {models.map((m, i) => {
          const xx = 30 + i * 75
          const mean = m.accuracyMean
          const std = m.accuracyStd
          return (
            <g key={m.model} onMouseEnter={() => setHover(m.model)} onMouseLeave={() => setHover(null)} data-testid={`rf-bar-${m.model.replace(/\s+/g, "-")}`}>
              <rect x={xx} y={y(mean)} width="34" height={130 - y(mean)} rx="3" fill={COLORS[m.model] || t.accent} opacity="0.9" />
              <line x1={xx + 17} y1={y(mean + std)} x2={xx + 17} y2={y(Math.max(0, mean - std))} stroke={t.textStrong} strokeWidth="2" />
              <line x1={xx + 11} y1={y(mean + std)} x2={xx + 23} y2={y(mean + std)} stroke={t.textStrong} strokeWidth="2" />
              <line x1={xx + 11} y1={y(Math.max(0, mean - std))} x2={xx + 23} y2={y(Math.max(0, mean - std))} stroke={t.textStrong} strokeWidth="2" />
              <text x={xx + 17} y={145} textAnchor="middle" fontSize="8" fill={t.muted}>{m.model.split(" ").map(w => w[0]).join("")}</text>
            </g>
          )
        })}
        <line x1="14" y1="130" x2="252" y2="130" stroke={t.border} />
      </svg>
      <span style={{ color: t.faint, fontSize: 10 }}>{hover ? `${hover}: acc ${models.find(m => m.model === hover)?.accuracyMean} ± ${models.find(m => m.model === hover)?.accuracyStd}` : text(lang, `${robustness.crossValidation.repeatedFiveFold.totalFolds} folds`, `${robustness.crossValidation.repeatedFiveFold.totalFolds} folds`)}</span>
    </section>
  )
}

export default RobustnessValidationFigure
