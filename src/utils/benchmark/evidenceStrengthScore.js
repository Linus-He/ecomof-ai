// @ts-nocheck
// V3.6 Evidence Strength Score (Organic Acid) — turns the experimental /
// literature / expert evidence mix into coverage proportions and a single
// 0–100 evidence-strength score (Experimental weighted highest). Used by the
// Organic Acid module's Experimental Evidence Coverage panel.
const r3 = v => Number(Number(v).toFixed(3))
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

const WEIGHTS = { experimental: 1.0, expert: 0.7, literature: 0.5 }

export function calculateEvidenceStrength({ experimental = 0, literature = 0, expert = 0 } = {}) {
  const exp = Number(experimental) || 0
  const ex = Number(expert) || 0
  const lit = Number(literature) || 0
  const total = exp + ex + lit

  const coverage = {
    experimental: total ? r3(exp / total) : 0,
    literature: total ? r3(lit / total) : 0,
    expert: total ? r3(ex / total) : 0,
  }
  // Strength: weighted evidence per record, saturating with volume.
  const weighted = exp * WEIGHTS.experimental + ex * WEIGHTS.expert + lit * WEIGHTS.literature
  const volumeFactor = Math.min(1, total / 100) // saturates at 100 evidence items
  const mixFactor = total ? (exp * WEIGHTS.experimental + ex * WEIGHTS.expert + lit * WEIGHTS.literature) / total : 0
  const score = r3(clamp(mixFactor * 100 * (0.5 + 0.5 * volumeFactor)))

  const level = score >= 70 ? "Strong" : score >= 45 ? "Moderate" : "Weak"
  return {
    scoreId: "evidence-strength-v1",
    total,
    coverage,
    weightedEvidence: r3(weighted),
    evidenceStrengthScore: score,
    level,
  }
}

export default calculateEvidenceStrength
