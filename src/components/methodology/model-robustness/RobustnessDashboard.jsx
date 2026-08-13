// @ts-nocheck
// V3.6 Robustness Section — the Algorithm Validation Center upgrade: experimental
// label growth, the fresh expanded benchmark, cross validation V2, bootstrap +
// 95% CI, generalization audit, stability V2, repeated-CV ranking, a Model
// Reliability Score, and credibility V2. Plus Figures F/G/H. All read-only from
// the frozen robustness report.
import { RobustnessValidationFigure } from "./RobustnessValidationFigure"
import { ConfidenceFigure } from "./ConfidenceFigure"
import { GeneralizationFigure } from "./GeneralizationFigure"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const fmt = v => (v == null ? "—" : typeof v === "number" ? v.toFixed(3) : String(v))

function Metric({ label, value, tone, t }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? t.success : tone === "danger" ? t.danger : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 14, marginTop: 4 }}>{value}</strong>
    </div>
  )
}

function GrowthRow({ label, current, target, t }) {
  const gap = Math.max(0, target - current)
  return (
    <div data-testid={`growth-${label.replace(/\s+/g, "-").toLowerCase()}`} style={{ display: "grid", gap: 6, gridTemplateColumns: "minmax(0,1.4fr) repeat(3, minmax(0,1fr))", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "7px 10px" }}>
      <span style={{ color: t.textStrong, fontSize: 11.6, fontWeight: 700 }}>{label}</span>
      <span style={{ color: current >= target ? t.success : t.warn, fontSize: 12, fontWeight: 900 }}>{current}</span>
      <span style={{ color: t.muted, fontSize: 11.6 }}>{target}</span>
      <span style={{ color: gap === 0 ? t.success : t.warn, fontSize: 11.6, fontWeight: 800 }}>{gap}</span>
    </div>
  )
}

export function RobustnessDashboard({ robustness = null, lang = "en", t, isMobile = false }) {
  if (!robustness) return null
  const rel = robustness.reliability || {}
  const cred = robustness.credibility || {}
  const stab = robustness.stability || {}
  const ds = robustness.datasetSize || {}
  const exp = robustness.labelExpansion || {}
  const repeated = robustness.crossValidation?.repeatedFiveFold?.models || []
  const ranking = robustness.repeatedRanking?.rows || []
  const ev = robustness.organicAcidEvidence

  return (
    <section
      id="algval-robustness"
      data-testid="algval-robustness"
      className="algorithm-validation-section"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, minWidth: 0, padding: 15, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 5 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Robustness Section · Model Reliability</span>
        <h3 style={{ color: t.textStrong, fontSize: 18, margin: 0 }}>{text(lang, "稳健性验证与模型可靠度", "Robustness Validation & Model Reliability")}</h3>
        <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>
          {text(lang, `内部整理标签扩展到 ${ds.experimentalLabels}、留出记录 ${ds.externalTest}；冻结报告用交叉验证、Bootstrap、置信区间与泛化审计检验内部模型行为。标签证据等级不因此升级。`, `The internally curated corpus contains ${ds.experimentalLabels} labels and ${ds.externalTest} held-out records. The frozen report uses cross-validation, bootstrap, confidence intervals, and a generalization audit to test internal model behaviour without upgrading label evidence.`)}
        </p>
      </header>

      {/* Experimental Label Growth V3.4 -> V3.6 */}
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "内部整理标签规模 V3.4 → V3.6", "Internal Curated-label Scale V3.4 → V3.6")}</strong>
        <div style={{ color: t.faint, display: "grid", fontSize: 9.5, fontWeight: 900, gap: 6, gridTemplateColumns: "minmax(0,1.4fr) repeat(3, minmax(0,1fr))", padding: "0 10px", textTransform: "uppercase" }}>
          <span>Metric</span><span>Current</span><span>Target</span><span>Gap</span>
        </div>
        <GrowthRow label={text(lang, "内部整理标签", "Curated Labels")} current={ds.experimentalLabels} target={exp.target || 150} t={t} />
        <GrowthRow label={text(lang, "内部留出集", "Held-out Set")} current={ds.externalTest} target={exp.externalTarget || 60} t={t} />
      </div>

      {/* Headline reliability + credibility */}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0,1fr))" }}>
        <Metric label="Reliability Score" value={`${rel.score ?? "—"} · ${rel.level ?? ""}`} tone={rel.score >= 80 ? "pass" : "warn"} t={t} />
        <Metric label="Credibility V2" value={`${cred.score ?? "—"} · ${cred.grade ?? ""}`} tone={cred.grade === "A" || cred.grade === "B" ? "pass" : "warn"} t={t} />
        <Metric label="Overall Stability" value={stab.overallStability ?? "—"} tone={stab.overallStability === "Stable" ? "pass" : "warn"} t={t} />
        <Metric label="Overfit Risk" value={robustness.generalization?.overfittingRisk ?? "—"} tone={robustness.generalization?.overfittingRisk === "Low" ? "pass" : robustness.generalization?.overfittingRisk === "High" ? "danger" : "warn"} t={t} />
      </div>

      {/* Figures F / G / H */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))" }}>
        <RobustnessValidationFigure robustness={robustness} lang={lang} t={t} isMobile={isMobile} />
        <ConfidenceFigure robustness={robustness} lang={lang} t={t} isMobile={isMobile} />
        <GeneralizationFigure robustness={robustness} lang={lang} t={t} isMobile={isMobile} />
      </div>

      {/* Repeated CV + ranking table */}
      <div data-testid="robustness-cv-table" style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11.2, minWidth: isMobile ? 480 : "100%", width: "100%" }}>
          <thead><tr>{["Model", "CV Acc (mean±std)", "CV ROC (mean±std)", "Win Rate", "Avg Rank", "Stability"].map(h => <th key={h} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 9.5, fontWeight: 900, padding: "5px 7px", textAlign: "left", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {repeated.map(m => {
              const r = ranking.find(x => x.model === m.model) || {}
              const s = stab.rows?.find(x => x.model === m.model) || {}
              return (
                <tr key={m.model} data-testid={`robustness-row-${m.model.replace(/\s+/g, "-")}`}>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontWeight: 800, padding: "5px 7px" }}>{m.model}</td>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "5px 7px" }}>{fmt(m.accuracyMean)} ± {fmt(m.accuracyStd)}</td>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "5px 7px" }}>{fmt(m.rocMean)} ± {fmt(m.rocStd)}</td>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "5px 7px" }}>{fmt(r.winRate)}</td>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: t.text, padding: "5px 7px" }}>{fmt(r.averageRank)}</td>
                  <td style={{ borderBottom: `1px solid ${t.border}`, color: s.crossValidationStability === "Stable" ? t.success : t.warn, padding: "5px 7px" }}>{s.crossValidationStability ?? "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Organic Acid Experimental Evidence Coverage */}
      {ev ? (
        <div data-testid="experimental-evidence-coverage" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.4, lineHeight: 1.5, padding: 10 }}>
          <strong style={{ color: t.textStrong }}>{text(lang, "实验证据覆盖（有机酸）", "Experimental Evidence Coverage (Organic Acid)")}：</strong>{" "}
          {text(lang, `实验 ${Math.round(ev.coverage.experimental * 100)}% · 文献 ${Math.round(ev.coverage.literature * 100)}% · 专家 ${Math.round(ev.coverage.expert * 100)}%；证据强度 ${ev.evidenceStrengthScore}（${ev.level}）。`, `Experimental ${Math.round(ev.coverage.experimental * 100)}% · Literature ${Math.round(ev.coverage.literature * 100)}% · Expert ${Math.round(ev.coverage.expert * 100)}%; evidence strength ${ev.evidenceStrengthScore} (${ev.level}).`)}
        </div>
      ) : null}

      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 11.2, fontWeight: 700, lineHeight: 1.5, padding: 10 }}>
        {text(lang, "最大统计学风险：", "Biggest statistical risk: ")}{robustness.answers?.biggestStatisticalRisk}
      </div>
    </section>
  )
}

export default RobustnessDashboard
