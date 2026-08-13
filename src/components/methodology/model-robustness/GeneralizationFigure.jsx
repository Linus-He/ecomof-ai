// @ts-nocheck
// V3.6 Figure H — Generalization Audit. Interactive SVG comparing the best
// model's accuracy on Train / Validation / Test / the internal held-out split,
// highlighting the frozen report's generalization gap and overfitting verdict.
import { useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const RISK_TONE = { Low: "success", Moderate: "warn", High: "danger", Unknown: "muted" }

export function GeneralizationFigure({ robustness = null, lang = "en", t, isMobile = false }) {
  const [hover, setHover] = useState(null)
  const g = robustness?.generalization
  if (!g?.splits) return null
  const order = [
    ["train", text(lang, "训练", "Train")],
    ["validation", text(lang, "验证", "Validation")],
    ["test", text(lang, "测试", "Test")],
    ["externalTest", text(lang, "内部留出", "Held-out")],
  ]
  const riskColor = t[RISK_TONE[g.overfittingRisk]] || t.muted

  return (
    <section id="figure-h-generalization" data-testid="generalization-figure" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <span style={{ color: t.accentText, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>Figure H · {text(lang, "泛化审计", "Generalization Audit")}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{g.model} · {text(lang, "训练→内部留出", "Train → Held-out")}</strong>
      <svg viewBox="0 0 260 150" role="img" aria-label="generalization audit" style={{ width: "100%" }}>
        {order.map(([key, label], i) => {
          const s = g.splits[key]
          const acc = s?.accuracy ?? 0
          const h = acc * 110
          const xx = 18 + i * 60
          return (
            <g key={key} onMouseEnter={() => setHover(key)} onMouseLeave={() => setHover(null)} data-testid={`gen-bar-${key}`}>
              <rect x={xx} y={130 - h} width="36" height={h} rx="3" fill={key === "externalTest" ? t.accentStrong || t.accent : t.accent} opacity={key === "train" ? 0.55 : 0.95} />
              <text x={xx + 18} y={145} textAnchor="middle" fontSize="8" fill={t.muted}>{label}</text>
              <text x={xx + 18} y={126 - h} textAnchor="middle" fontSize="8" fontWeight="800" fill={t.textStrong}>{s ? acc.toFixed(2) : "—"}</text>
            </g>
          )
        })}
        <line x1="12" y1="130" x2="252" y2="130" stroke={t.border} />
      </svg>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ background: t.badgeWarnBg, border: `1px solid ${riskColor}`, borderRadius: 6, color: riskColor, fontSize: 10.5, fontWeight: 800, padding: "2px 9px" }}>
          {text(lang, "过拟合风险", "Overfit risk")}: {g.overfittingRisk} · gap {g.generalizationGap}
        </span>
        <span style={{ color: t.faint, fontSize: 10 }}>{hover ? `${hover}: acc ${g.splits[hover]?.accuracy ?? "—"} (n=${g.splits[hover]?.n ?? "—"})` : g.recommendation}</span>
      </div>
    </section>
  )
}

export default GeneralizationFigure
