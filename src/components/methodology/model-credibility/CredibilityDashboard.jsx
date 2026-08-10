// @ts-nocheck
// V3.5 Model Credibility Dashboard — the 0–100 credibility score + grade, its
// five components, the benchmark credibility audit, the sensitivity / ablation
// verdict, and the honest known limitations.
const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const GRADE_TONE = { A: "success", B: "success", C: "warn", D: "danger" }

function Bar({ label, value, t }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: t.muted, fontSize: 10.6 }}>{label}</span><span style={{ color: t.textStrong, fontSize: 10.6, fontWeight: 800 }}>{value}</span></div>
      <span style={{ background: t.surface, borderRadius: 4, display: "block", height: 8, overflow: "hidden" }}><span style={{ background: value >= 70 ? t.success : value >= 50 ? t.accent : t.warn, display: "block", height: "100%", width: `${Math.max(2, value)}%` }} /></span>
    </div>
  )
}

export function CredibilityDashboard({ credibility = null, lang = "en", t, isMobile = false }) {
  const c = credibility?.credibility
  const audit = credibility?.benchmarkCredibilityAudit
  if (!c) return null
  const gradeColor = t[GRADE_TONE[c.grade]] || t.textStrong
  const comp = c.components

  return (
    <section
      id="algval-credibility"
      data-testid="algval-credibility"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Model Credibility Score</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "模型可信度评分", "Model Credibility Score")}</h3>
      </header>

      <div style={{ alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "150px 1fr" }}>
        <div data-testid="credibility-score" style={{ background: t.surface, border: `1px solid ${gradeColor}`, borderRadius: 10, display: "grid", gap: 2, justifyItems: "center", padding: "14px 10px" }}>
          <strong style={{ color: gradeColor, fontSize: 34, lineHeight: 1 }}>{c.score}</strong>
          <span style={{ color: t.muted, fontSize: 10.5 }}>/ 100</span>
          <span style={{ background: gradeColor, borderRadius: 6, color: t.panel, fontSize: 13, fontWeight: 900, marginTop: 4, padding: "1px 12px" }}>Grade {c.grade}</span>
        </div>
        <div style={{ display: "grid", gap: 7 }}>
          <Bar label={text(lang, "Benchmark（V3.4 ROC）", "Benchmark (V3.4 ROC)")} value={comp.benchmark} t={t} />
          <Bar label={text(lang, "交叉验证", "Cross Validation")} value={comp.crossValidation} t={t} />
          <Bar label={text(lang, "稳定性", "Stability")} value={comp.stability} t={t} />
          <Bar label={text(lang, "敏感性", "Sensitivity")} value={comp.sensitivity} t={t} />
          <Bar label={text(lang, "数据质量", "Data Quality")} value={comp.dataQuality} t={t} />
        </div>
      </div>

      <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.5, margin: 0 }}>{c.interpretation}</p>

      {audit ? (
        <div data-testid="benchmark-credibility-audit" style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
          {[
            ["Ground Truth", audit.groundTruthQuality],
            ["External Test", audit.externalTestQuality],
            ["Leakage", audit.leakageStatus],
            ["Split", audit.splitQuality],
            ["Cross Validation", audit.crossValidationStatus],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 8 }}>
              <span style={{ color: t.faint, display: "block", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
              <strong style={{ color: /high|clean|complete|done/i.test(String(value)) ? t.success : t.warn, display: "block", fontSize: 11.5, marginTop: 4 }}>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 11.2, fontWeight: 700, lineHeight: 1.5, padding: 10 }}>
        {text(lang, "已知局限：", "Known Limitations: ")}{(c.knownLimitations || []).join(" ")}
      </div>
    </section>
  )
}

export default CredibilityDashboard
