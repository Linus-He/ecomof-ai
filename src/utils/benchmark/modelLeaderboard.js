// @ts-nocheck
// V3.4 Model Leaderboard — ranks Logistic Regression / Decision Tree / Random
// Forest by their real benchmark metrics. When the Accuracy / ROC gates are not
// satisfied every row is "Blocked" with Pending metrics (no fabricated numbers);
// when they pass, rows show real Accuracy / Precision / Recall / F1 / ROC-AUC
// ranked by external-test ROC-AUC (then F1).
function metricView(metrics, allowed) {
  if (!allowed || !metrics) return { accuracy: "Pending", precision: "Pending", recall: "Pending", f1: "Pending", rocAuc: "Pending" }
  return {
    accuracy: metrics.accuracy,
    precision: metrics.precision,
    recall: metrics.recall,
    f1: metrics.f1,
    rocAuc: metrics.rocAuc,
  }
}

export function buildModelLeaderboard({ benchmark = {}, metricsAllowed = false } = {}) {
  const models = Array.isArray(benchmark.models) ? benchmark.models : []
  const rows = models.map(m => {
    const computed = m.computed || { testMetrics: m.testMetrics, externalMetrics: m.externalMetrics }
    const external = metricView(computed.externalMetrics, metricsAllowed)
    const internal = metricView(computed.testMetrics, metricsAllowed)
    return {
      model: m.model,
      status: metricsAllowed ? "Ranked" : "Blocked",
      trainSize: m.trainSize,
      testSize: m.testSize,
      externalTestSize: m.externalTestSize,
      // Headline metrics are the external (independent) test metrics.
      accuracy: external.accuracy,
      precision: external.precision,
      recall: external.recall,
      f1: external.f1,
      rocAuc: external.rocAuc,
      internalTest: internal,
      externalTest: external,
      _rankKey: metricsAllowed && computed.externalMetrics ? [computed.externalMetrics.rocAuc ?? 0, computed.externalMetrics.f1 ?? 0, computed.externalMetrics.accuracy ?? 0] : [0, 0, 0],
    }
  })

  if (metricsAllowed) {
    rows.sort((a, b) => b._rankKey[0] - a._rankKey[0] || b._rankKey[1] - a._rankKey[1] || b._rankKey[2] - a._rankKey[2])
  }
  rows.forEach((r, i) => { r.rank = metricsAllowed ? i + 1 : null; delete r._rankKey })

  const best = metricsAllowed && rows.length ? rows[0].model : null
  return {
    leaderboardId: "model-leaderboard",
    metricsAllowed,
    status: metricsAllowed ? "Ranked" : "Blocked",
    rows,
    bestModel: best,
    note: metricsAllowed
      ? `Ranked by external-test ROC-AUC then F1. Best model: ${best}.`
      : "Leaderboard blocked: Accuracy / ROC gates not satisfied, metrics Pending.",
  }
}

export default buildModelLeaderboard
