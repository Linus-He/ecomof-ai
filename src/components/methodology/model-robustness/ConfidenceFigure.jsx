// @ts-nocheck
// V3.6 Figure G — Confidence Interval. Interactive SVG showing the 95% CI
// (mean + [lower, upper]) for Accuracy / ROC-AUC / Precision / Recall / F1 from
// the bootstrap distribution. Read-only; real numbers from the robustness report.
import { useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const METRICS = [
  ["accuracy", "Accuracy"],
  ["rocAuc", "ROC-AUC"],
  ["precision", "Precision"],
  ["recall", "Recall"],
  ["f1", "F1"],
]

export function ConfidenceFigure({ robustness = null, lang = "en", t, isMobile = false }) {
  const [hover, setHover] = useState(null)
  const ci = robustness?.confidenceInterval?.metrics
  if (!ci) return null
  const W = 300
  const x = v => 20 + v * (W - 40)

  return (
    <section id="figure-g-confidence-interval" data-testid="confidence-figure" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <span style={{ color: t.accentText, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>Figure G · {text(lang, "置信区间", "Confidence Interval")}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "95% 置信区间（Bootstrap）", "95% Confidence Intervals (bootstrap)")}</strong>
      <svg viewBox={`0 0 ${W} ${METRICS.length * 26 + 16}`} role="img" aria-label="confidence intervals" style={{ width: "100%" }}>
        {METRICS.map(([key, label], i) => {
          const c = ci[key]
          if (!c || c.mean == null) return null
          const y = 16 + i * 26
          return (
            <g key={key} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)} data-testid={`ci-row-${key}`}>
              <text x="0" y={y + 4} fontSize="8.5" fill={t.muted}>{label}</text>
              <line x1={x(c.lower ?? c.mean)} y1={y} x2={x(c.upper ?? c.mean)} y2={y} stroke={t.accent} strokeWidth="3" />
              <line x1={x(c.lower ?? c.mean)} y1={y - 4} x2={x(c.lower ?? c.mean)} y2={y + 4} stroke={t.accent} strokeWidth="2" />
              <line x1={x(c.upper ?? c.mean)} y1={y - 4} x2={x(c.upper ?? c.mean)} y2={y + 4} stroke={t.accent} strokeWidth="2" />
              <circle cx={x(c.mean)} cy={y} r="4" fill={t.accentStrong || t.accent} />
            </g>
          )
        })}
      </svg>
      <span style={{ color: t.faint, fontSize: 10 }}>
        {hover && ci[hover]
          ? `${hover}: ${ci[hover].mean} [${ci[hover].lower}, ${ci[hover].upper}]`
          : text(lang, "点=均值，横线=[下界, 上界]；越窄越稳定。", "Dot = mean, bar = [lower, upper]; narrower is more stable.")}
      </span>
    </section>
  )
}

export default ConfidenceFigure
