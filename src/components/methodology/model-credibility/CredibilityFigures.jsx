// @ts-nocheck
// V3.5 Scientific Figures — interactive, responsive SVG:
//   Figure C: Model Comparison (V3.4 external Accuracy / ROC per model)
//   Figure D: Feature Importance (best model, permutation importance)
//   Figure E: Validation & Limitations (credibility components + grade)
// All metrics are read from the frozen V3.4 / V3.5 reports — never fabricated.
import { useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const COLORS = { "Logistic Regression": "#1A6DB5", "Decision Tree": "#B45309", "Random Forest": "#15803D" }

function FigureFrame({ id, eyebrow, title, t, children }) {
  return (
    <div id={id} data-testid={id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
      <span style={{ color: t.accentText, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>{eyebrow}</span>
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{title}</strong>
      {children}
    </div>
  )
}

export function CredibilityFigures({ credibility = null, firstBenchmark = null, lang = "en", t, isMobile = false }) {
  const [hover, setHover] = useState(null)
  if (!credibility) return null
  const models = (firstBenchmark?.models || []).filter(m => typeof m.accuracy === "number")
  const best = credibility.bestModel
  const fiRows = (credibility.featureImportance?.find(f => f.model === best)?.rows || []).slice(0, 6)
  const comp = credibility.credibility?.components || {}

  return (
    <section id="algval-credibility-figures" data-testid="credibility-figures" style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
      {/* Figure C — Model Comparison */}
      <FigureFrame id="figure-c-model-comparison" eyebrow="Figure C" title={text(lang, "模型对比", "Model Comparison")} t={t}>
        <svg viewBox="0 0 240 150" role="img" aria-label="Model comparison" style={{ width: "100%" }}>
          {models.map((m, i) => {
            const x = 20 + i * 75
            const accH = (m.accuracy || 0) * 110
            const rocH = (m.rocAuc || 0) * 110
            return (
              <g key={m.model} onMouseEnter={() => setHover(m.model)} onMouseLeave={() => setHover(null)}>
                <rect x={x} y={130 - accH} width="22" height={accH} fill={COLORS[m.model] || t.accent} opacity="0.95" />
                <rect x={x + 26} y={130 - rocH} width="22" height={rocH} fill={COLORS[m.model] || t.accent} opacity="0.55" />
                <text x={x + 24} y={145} textAnchor="middle" fontSize="8" fill={t.muted}>{m.model.split(" ").map(w => w[0]).join("")}</text>
              </g>
            )
          })}
          <line x1="14" y1="130" x2="230" y2="130" stroke={t.border} />
        </svg>
        <span style={{ color: t.faint, fontSize: 10 }}>{hover ? `${hover}: acc ${models.find(m => m.model === hover)?.accuracy} · ROC ${models.find(m => m.model === hover)?.rocAuc}` : text(lang, "实心=Accuracy，半透明=ROC-AUC（V3.4 外部测试）", "Solid = Accuracy, faded = ROC-AUC (V3.4 external test)")}</span>
      </FigureFrame>

      {/* Figure D — Feature Importance */}
      <FigureFrame id="figure-d-feature-importance" eyebrow="Figure D" title={text(lang, "特征重要性", "Feature Importance")} t={t}>
        <svg viewBox="0 0 240 150" role="img" aria-label="Feature importance" style={{ width: "100%" }}>
          {(() => { const max = Math.max(...fiRows.map(r => r.importance), 0.0001); return fiRows.map((r, i) => (
            <g key={r.feature}>
              <rect x="0" y={6 + i * 23} width={Math.max(2, (r.importance / max) * 150)} height="14" rx="3" fill={t.accent} />
              <text x="4" y={16 + i * 23} fontSize="8" fill={t.panel} fontWeight="800">{r.label.slice(0, 16)}</text>
              <text x={Math.max(2, (r.importance / max) * 150) + 4} y={16 + i * 23} fontSize="8" fill={t.muted}>{r.importance}</text>
            </g>
          )) })()}
        </svg>
        <span style={{ color: t.faint, fontSize: 10 }}>{best} · permutation importance</span>
      </FigureFrame>

      {/* Figure E — Validation & Limitations */}
      <FigureFrame id="figure-e-validation-limitations" eyebrow="Figure E" title={text(lang, "验证与局限", "Validation & Limitations")} t={t}>
        <svg viewBox="0 0 240 150" role="img" aria-label="Credibility components" style={{ width: "100%" }}>
          {["benchmark", "crossValidation", "stability", "sensitivity", "dataQuality"].map((k, i) => (
            <g key={k}>
              <rect x="78" y={6 + i * 26} width={Math.max(2, (comp[k] || 0) / 100 * 150)} height="16" rx="3" fill={(comp[k] || 0) >= 70 ? t.success : (comp[k] || 0) >= 50 ? t.accent : t.warn} />
              <text x="0" y={18 + i * 26} fontSize="8" fill={t.muted}>{k.slice(0, 10)}</text>
              <text x={Math.max(2, (comp[k] || 0) / 100 * 150) + 80} y={18 + i * 26} fontSize="8" fill={t.muted}>{comp[k]}</text>
            </g>
          ))}
        </svg>
        <span style={{ color: t.faint, fontSize: 10 }}>{text(lang, `可信度 ${credibility.credibility?.score} · 等级 ${credibility.credibility?.grade}`, `Credibility ${credibility.credibility?.score} · Grade ${credibility.credibility?.grade}`)}</span>
      </FigureFrame>
    </section>
  )
}

export default CredibilityFigures
