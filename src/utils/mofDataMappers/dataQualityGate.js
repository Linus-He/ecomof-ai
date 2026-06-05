// @ts-nocheck

export function buildDataQualityGate(validation, options = {}) {
  const requiredCoverage = Number.isFinite(options.requiredCoverage) ? options.requiredCoverage : 0.92
  const warningLimit = Number.isFinite(options.warningLimit) ? options.warningLimit : 3
  const summary = validation?.summary || {}
  const errors = validation?.errors || []
  const warnings = validation?.warnings || []
  const coverage = Number.isFinite(summary.coverage) ? summary.coverage : 0
  const issues = []

  if (errors.length) issues.push(`${errors.length} schema error(s)`)
  if (coverage < requiredCoverage) issues.push(`required-field coverage ${coverage} below ${requiredCoverage}`)
  if (warnings.length > warningLimit) issues.push(`${warnings.length} metadata warning(s)`)

  const status = errors.length ? "blocked" : issues.length ? "needs_review" : "pass"
  const score = Math.max(0, Math.min(1, coverage - errors.length * 0.25 - Math.max(0, warnings.length - warningLimit) * 0.06))

  return {
    status,
    score: Number(score.toFixed(3)),
    requiredCoverage,
    warningLimit,
    issues,
    summary: {
      coverage,
      warningCount: warnings.length,
      errorCount: errors.length,
    },
    interpretation: status === "pass"
      ? "Record can enter mapper preview; still not a validated scientific result."
      : status === "needs_review"
        ? "Record can be previewed but needs metadata review before scoring."
        : "Record is blocked before scoring because schema requirements failed.",
  }
}

export function summarizeQualityGates(gates = []) {
  const rows = Array.isArray(gates) ? gates : []
  return {
    total: rows.length,
    pass: rows.filter(row => row.status === "pass").length,
    needsReview: rows.filter(row => row.status === "needs_review").length,
    blocked: rows.filter(row => row.status === "blocked").length,
    averageScore: rows.length ? Number((rows.reduce((sum, row) => sum + (Number(row.score) || 0), 0) / rows.length).toFixed(3)) : 0,
  }
}
