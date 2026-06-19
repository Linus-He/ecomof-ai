// @ts-nocheck
// V3.4 Model Leaderboard — Logistic Regression / Decision Tree / Random Forest
// ranked by their real First Real Benchmark metrics. When the Accuracy / ROC
// gates are not satisfied every row is "Blocked" with Pending metrics; nothing
// is fabricated.
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const COLUMNS = [
  { key: "accuracy", label: "Accuracy" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "f1", label: "F1" },
  { key: "rocAuc", label: "ROC-AUC" },
]

export function ModelLeaderboard({ firstBenchmark = null, lang = "en", t, isMobile = false }) {
  if (!firstBenchmark?.leaderboard) return null
  const board = firstBenchmark.leaderboard
  const metricsAllowed = Boolean(board.metricsAllowed)
  const rows = board.rows || []

  return (
    <section
      id="algval-model-leaderboard"
      data-testid="algval-model-leaderboard"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 10, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Model Leaderboard</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "模型排行榜", "Model Leaderboard")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
          {metricsAllowed
            ? text(lang, `按外部测试 ROC-AUC 排序。最佳模型：${board.bestModel}。指标来自真实拟合的 LR / DT / RF 模型。`, `Ranked by external-test ROC-AUC. Best model: ${board.bestModel}. Metrics come from genuinely fitted LR / DT / RF models.`)
            : text(lang, "排行榜 Blocked：Accuracy / ROC 门槛未满足，指标 Pending。", "Leaderboard Blocked: Accuracy / ROC gates not satisfied, metrics Pending.")}
        </p>
      </header>

      <div style={{ overflowX: "auto" }}>
        <table data-testid="leaderboard-table" style={{ borderCollapse: "collapse", fontSize: 11.6, minWidth: isMobile ? 520 : "100%", width: "100%" }}>
          <thead>
            <tr>
              {["#", "Model", "Status", ...COLUMNS.map(c => c.label), "Test / Ext"].map(h => (
                <th key={h} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10, fontWeight: 900, padding: "6px 8px", textAlign: "left", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.model} data-testid={`leaderboard-row-${row.model.replace(/\s+/g, "-")}`}>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.muted, padding: "6px 8px" }}>{row.rank ?? "—"}</td>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.textStrong, fontWeight: 800, padding: "6px 8px" }}>{row.model}</td>
                <td style={{ borderBottom: `1px solid ${t.border}`, color: metricsAllowed ? t.success : t.warn, fontWeight: 800, padding: "6px 8px" }}>{row.status}</td>
                {COLUMNS.map(c => (
                  <td key={c.key} style={{ borderBottom: `1px solid ${t.border}`, color: metricsAllowed ? t.text : t.warn, padding: "6px 8px" }}>{String(row[c.key])}</td>
                ))}
                <td style={{ borderBottom: `1px solid ${t.border}`, color: t.muted, padding: "6px 8px" }}>{row.testSize} / {row.externalTestSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ModelLeaderboard
