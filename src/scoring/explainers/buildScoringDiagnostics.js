import { toPercent } from "../types/scoringTypes"

function rankingStability(methodComparison) {
  const shifts = (methodComparison?.rows || []).map(row => row.maxRankShift || 0)
  const maxShift = shifts.length ? Math.max(...shifts) : 0
  if (maxShift >= 4) return { label: "Sensitive", labelZh: "敏感", tone: "warn", maxShift }
  if (maxShift >= 2) return { label: "Moderate", labelZh: "中等", tone: "proxy", maxShift }
  return { label: "Stable", labelZh: "稳定", tone: "calc", maxShift }
}

export function buildScoringDiagnostics({
  matrixResult,
  weightingResult,
  methodComparison,
  warnings = [],
} = {}) {
  const missingRate = matrixResult?.missingRate || 0
  const allWarnings = [
    ...(matrixResult?.warnings || []),
    ...(weightingResult?.warnings || []),
    ...(warnings || []),
  ].filter(Boolean)
  return {
    missingDataImpact: {
      missingRate,
      label: `${toPercent(missingRate)} descriptor cells missing`,
      missingRateByDescriptor: matrixResult?.missingRateByDescriptor || {},
    },
    rankingStability: rankingStability(methodComparison),
    methodComparison,
    warnings: Array.from(new Set(allWarnings)),
    smallSeedNotice: (matrixResult?.matrix?.length || 0) < 8
      ? "Small seed dataset: rankings should be treated as research discussion, not final material conclusions."
      : "",
  }
}
