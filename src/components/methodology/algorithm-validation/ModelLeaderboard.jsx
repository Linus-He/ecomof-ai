// @ts-nocheck
// Frozen V3.4 model leaderboard. Metrics describe the internal curated-label
// protocol and are not presented as independently verified experimental truth.
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
      className="algorithm-validation-section"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 10, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Model Leaderboard</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "模型排行榜", "Model Leaderboard")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
          {metricsAllowed
            ? text(lang, `按内部留出集 ROC-AUC 排序。最佳模型：${board.bestModel}。LR / DT / RF 均已实际拟合，但标签仍待 DOI 与全文复核。`, `Ranked by internal held-out ROC-AUC. Best model: ${board.bestModel}. LR / DT / RF are fitted models, but the labels still await DOI and full-text verification.`)
            : text(lang, "排行榜 Blocked：Accuracy / ROC 门槛未满足，指标 Pending。", "Leaderboard Blocked: Accuracy / ROC gates not satisfied, metrics Pending.")}
        </p>
      </header>

      <div style={{ overflowX: "auto" }}>
        <table data-testid="leaderboard-table" style={{ borderCollapse: "collapse", fontSize: 11.6, minWidth: isMobile ? 520 : "100%", width: "100%" }}>
          <thead>
            <tr>
              {["#", "Model", "Status", ...COLUMNS.map(c => c.label), "Test / Held-out"].map(h => (
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
