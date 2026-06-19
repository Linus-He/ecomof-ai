// @ts-nocheck
// V3.4 Experimental Label Status + First Real Benchmark Dashboard.
//   - Experimental Label Status: Current / Target / Gap for experimental labels,
//     verified ground truth, and external test.
//   - First Real Benchmark Dashboard: Label Count / External Test Count /
//     Leakage Status / Benchmark Status, plus the per-model summary and (when the
//     gates pass) the real Accuracy / ROC-AUC. Otherwise Pending + reasons.
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function StatusRow({ label, current, target, t }) {
  const gap = Math.max(0, target - current)
  const ok = current >= target
  return (
    <div data-testid={`exp-status-${label.replace(/\s+/g, "-").toLowerCase()}`} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", padding: "8px 10px" }}>
      <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 700 }}>{label}</span>
      <span style={{ color: ok ? t.success : t.warn, fontSize: 12.5, fontWeight: 900 }}>{current}</span>
      <span style={{ color: t.muted, fontSize: 12 }}>{target}</span>
      <span style={{ color: gap === 0 ? t.success : t.warn, fontSize: 12, fontWeight: 800 }}>{gap}</span>
    </div>
  )
}

function Metric({ label, value, tone, t }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? t.success : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 14, marginTop: 5 }}>{value}</strong>
    </div>
  )
}

export function ExperimentalLabelDashboard({ firstBenchmark = null, lang = "en", t, isMobile = false }) {
  if (!firstBenchmark) return null
  const exp = Number(firstBenchmark.experimentalLabelAudit?.experimentalLabelCount || 0)
  const verified = Number(firstBenchmark.groundTruthAudit?.verifiedGroundTruthCount || 0)
  const invalidGt = Number(firstBenchmark.groundTruthAudit?.invalidGroundTruthCount || 0)
  const external = Number(firstBenchmark.split?.counts?.external_test || 0)
  const leak = Number(firstBenchmark.leakage?.leakCount || 0)
  const metricsAllowed = Boolean(firstBenchmark.metricsAllowed)
  const reasons = firstBenchmark.pendingReasons || []
  const best = firstBenchmark.models?.find(m => m.model === firstBenchmark.answers?.bestModel) || firstBenchmark.models?.[0]

  return (
    <section
      id="algval-experimental-labels"
      data-testid="algval-experimental-labels"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Experimental Label Status · First Real Benchmark</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "实验标签状态与首个真实 Benchmark", "Experimental Label Status & First Real Benchmark")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
          {text(lang, "V3.4 首次建立实验标签层（专家审查 + 独立验证），合法运行第一个真实 Benchmark。", "V3.4 establishes the first experimental-label layer (expert review + independent validation) and runs the first legitimate real benchmark.")}
        </p>
      </header>

      {/* Experimental Label Status: Current / Target / Gap */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.faint, display: "grid", fontSize: 10, fontWeight: 900, gap: 6, gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))", padding: "0 10px", textTransform: "uppercase" }}>
          <span>Metric</span><span>Current</span><span>Target</span><span>Gap</span>
        </div>
        <StatusRow label={text(lang, "实验标签", "Experimental Labels")} current={exp} target={30} t={t} />
        <StatusRow label={text(lang, "验证 Ground Truth", "Verified Ground Truth")} current={verified} target={30} t={t} />
        <StatusRow label={text(lang, "外部测试集", "External Test")} current={external} target={30} t={t} />
      </div>

      {/* First Real Benchmark Dashboard */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ background: metricsAllowed ? t.badgeOkBg || t.surface : t.badgeWarnBg, border: `1px solid ${metricsAllowed ? t.success : t.warn}`, borderRadius: 999, color: metricsAllowed ? t.success : t.warn, fontSize: 11, fontWeight: 800, padding: "3px 10px" }}>
          {firstBenchmark.overallStatus} · Result {firstBenchmark.result}
        </span>
      </div>
      <div data-testid="first-benchmark-dashboard" style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label="Label Count" value={exp} tone={exp >= 30 ? "pass" : "warn"} t={t} />
        <Metric label="External Test Count" value={external} tone={external >= 30 ? "pass" : "warn"} t={t} />
        <Metric label="Leakage Status" value={`${leak} leaks`} tone={leak === 0 ? "pass" : "warn"} t={t} />
        <Metric label="Benchmark Status" value={metricsAllowed ? "Complete" : "Pending"} tone={metricsAllowed ? "pass" : "warn"} t={t} />
      </div>

      {metricsAllowed && best ? (
        <div data-testid="benchmark-metrics" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 11.8, lineHeight: 1.5, padding: 10 }}>
          {text(lang, "合法展示（来自真实模型）", "Legitimately shown (real fitted models)")} · {text(lang, "最佳模型", "Best model")} <strong style={{ color: t.textStrong }}>{best.model}</strong> — Accuracy {best.accuracy} · Precision {best.precision} · Recall {best.recall} · F1 {best.f1} · ROC-AUC {best.rocAuc}
        </div>
      ) : (
        <div data-testid="benchmark-pending-reasons" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 8, color: t.warn, fontSize: 11.6, fontWeight: 700, lineHeight: 1.5, padding: 10 }}>
          {text(lang, "为什么不能合法展示 Accuracy / ROC：", "Why Accuracy / ROC cannot be shown yet: ")}{reasons.join(" ") || text(lang, "条件不足。", "Conditions not met.")}
        </div>
      )}
      {invalidGt > 0 ? (
        <div style={{ color: t.danger, fontSize: 11.4, fontWeight: 700 }}>Invalid ground truth: {invalidGt}</div>
      ) : null}
    </section>
  )
}

export default ExperimentalLabelDashboard
