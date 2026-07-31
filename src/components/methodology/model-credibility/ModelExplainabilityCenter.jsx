// @ts-nocheck
// V3.5 Model Explainability Center — explains why Random Forest wins:
// Logistic Regression coefficients (positive / negative), Decision Tree decision
// path + split importance, Random Forest feature importance + tree consensus.
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Chip({ children, tone, t }) {
  const color = tone === "pos" ? t.success : tone === "neg" ? t.danger : t.muted
  return <span style={{ background: t.surface, border: `1px solid ${color}`, borderRadius: 999, color, fontSize: 10.8, fontWeight: 800, padding: "2px 8px" }}>{children}</span>
}

export function ModelExplainabilityCenter({ credibility = null, lang = "en", t, isMobile = false }) {
  const e = credibility?.explainability
  if (!e) return null
  const lr = e.logisticRegression
  const dt = e.decisionTree
  const rf = e.randomForest

  return (
    <section
      id="algval-explainability"
      data-testid="algval-explainability"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Model Explainability Center</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "模型可解释性中心", "Model Explainability Center")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>{text(lang, "随机森林列为首位的依据", e.whyRandomForestFirst)}</p>
      </header>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        {lr ? (
          <div data-testid="explain-lr" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Logistic Regression</strong>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{text(lang, "特征系数", "Feature Coefficients")}</span>
            {lr.coefficients.map(c => (
              <div key={c.feature} style={{ alignItems: "center", display: "flex", gap: 6, justifyContent: "space-between" }}>
                <span style={{ color: t.text, fontSize: 11 }}>{c.label}</span>
                <Chip tone={c.direction === "positive" ? "pos" : "neg"} t={t}>{c.coefficient >= 0 ? "+" : ""}{c.coefficient}</Chip>
              </div>
            ))}
          </div>
        ) : null}

        {dt ? (
          <div data-testid="explain-dt" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Decision Tree</strong>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{text(lang, "决策路径", "Decision Path")}</span>
            <div style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.5 }}>
              {dt.decisionPath.map((p, i) => p.leaf ? <span key={i} style={{ color: t.accentText, fontWeight: 800 }}> → p={p.proba}</span> : <span key={i}>{i ? " → " : ""}{p.label} {p.direction} {p.threshold}</span>)}
            </div>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{text(lang, "分裂重要性", "Split Importance")}</span>
            {dt.splitImportance.filter(s => s.splits > 0).map(s => (
              <div key={s.feature} style={{ display: "flex", gap: 6, justifyContent: "space-between" }}><span style={{ color: t.text, fontSize: 11 }}>{s.label}</span><span style={{ color: t.muted, fontSize: 11 }}>{s.splits} ({Math.round(s.importance * 100)}%)</span></div>
            ))}
          </div>
        ) : null}

        {rf ? (
          <div data-testid="explain-rf" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Random Forest</strong>
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{text(lang, "特征重要性", "Feature Importance")}</span>
            {rf.featureImportance.slice(0, 6).map(f => (
              <div key={f.feature} style={{ display: "flex", gap: 6, justifyContent: "space-between" }}><span style={{ color: t.text, fontSize: 11 }}>{f.label}</span><span style={{ color: t.muted, fontSize: 11 }}>{f.importance}</span></div>
            ))}
            <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{text(lang, "树共识", "Tree Consensus")}</span>
            <Chip tone="default" t={t}>{rf.consensusLevel} · {rf.treeConsensus}</Chip>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ModelExplainabilityCenter
