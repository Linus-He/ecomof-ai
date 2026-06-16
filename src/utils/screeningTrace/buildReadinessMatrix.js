// @ts-nocheck
// V2.0-M Readiness matrix: a 2D decision map of Screening Score (Y) vs Evidence
// Confidence (X). Quadrants classify candidates into priority validation / data needed /
// keep as reference / not recommended. It never claims a final recommendation.

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function finalScore(c) { return num(c.D_expected ?? c.finalScore ?? c.score) }

// Evidence confidence in [0,1] from descriptor completeness + evidence level + metadata.
function evidenceConfidence(c) {
  const ratio = typeof c.descriptorCompleteness === "number" ? c.descriptorCompleteness : num(c.descriptorCompleteness?.ratio)
  const levelScore = { A: 0.9, B: 0.7, C: 0.45, D: 0.2 }[String(c.evidenceLevel || "").toUpperCase()] ?? 0.35
  const metadataBonus = (c.verifiedMetadata || c.verification?.verifiedMetadata) ? 0.15 : (c.sourceStatus === "confirmed" || c.verification?.sourceConfirmed ? 0.05 : 0)
  return Math.max(0, Math.min(1, ratio * 0.5 + levelScore * 0.4 + metadataBonus))
}

const QUADRANTS = {
  priority_validation: { en: "Priority validation", zh: "优先验证", note: "High score + high evidence" },
  data_needed: { en: "Data needed before recommendation", zh: "推荐前需补数据", note: "High score + low evidence" },
  keep_reference: { en: "Keep as reference", zh: "作为参考保留", note: "Low score + high evidence" },
  not_recommended: { en: "Not recommended now", zh: "暂不推荐", note: "Low score + low evidence" },
}

export function buildReadinessMatrix(candidates = [], options = {}) {
  const scoreThreshold = num(options.scoreThreshold, 0.5)
  const evidenceThreshold = num(options.evidenceThreshold, 0.55)
  const points = (Array.isArray(candidates) ? candidates : [])
    .filter(c => Number(c.G) !== 0 && !c.quarantined && !c.verification?.quarantined && !(c.ambiguityWarnings || c.verification?.ambiguityWarnings || []).length)
    .map(c => {
      const score = finalScore(c)
      const evidence = Math.round(evidenceConfidence(c) * 1000) / 1000
      const highScore = score >= scoreThreshold
      const highEvidence = evidence >= evidenceThreshold
      const quadrant = highScore && highEvidence ? "priority_validation"
        : highScore && !highEvidence ? "data_needed"
        : !highScore && highEvidence ? "keep_reference"
        : "not_recommended"
      const verification = c.verification || {}
      const tags = []
      if (c.verifiedMetadata || verification.verifiedMetadata) tags.push("verified metadata candidate")
      else if (c.sourceStatus === "confirmed" || verification.sourceConfirmed) tags.push("source confirmed only")
      if ((verification.quarantined) || (Array.isArray(verification.ambiguityWarnings) && verification.ambiguityWarnings.length)) tags.push("ambiguity blocked")
      if (verification.licenseStatus && verification.licenseStatus !== "confirmed") tags.push("license pending")
      if (verification.doiStatus && verification.doiStatus !== "confirmed") tags.push("DOI pending")
      return {
        candidateId: c.id || c.candidateId,
        displayName: c.displayName || c.name || c.id,
        score,
        evidenceConfidence: evidence,
        quadrant,
        quadrantLabelEn: QUADRANTS[quadrant].en,
        quadrantLabelZh: QUADRANTS[quadrant].zh,
        tags,
      }
    })

  const quadrantCounts = Object.keys(QUADRANTS).reduce((acc, key) => { acc[key] = points.filter(p => p.quadrant === key).length; return acc }, {})

  return {
    scoreThreshold,
    evidenceThreshold,
    quadrants: QUADRANTS,
    quadrantCounts,
    points,
    notFinalRecommendation: true,
  }
}
