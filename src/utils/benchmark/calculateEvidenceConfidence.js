// @ts-nocheck
// V3.5 Evidence Confidence — combines evidence by source (Experimental >
// Expert Review > Literature > Derived) into a High / Medium / Low confidence
// level. Derived evidence contributes the least and can never, on its own,
// reach High confidence.
const WEIGHTS = { experimental: 1.0, expert: 0.7, expert_review: 0.7, literature: 0.5, derived: 0.2 }
const r3 = v => Number(Number(v).toFixed(3))

export function calculateEvidenceConfidence({ experimental = 0, literature = 0, expert = 0, expertReview = 0, derived = 0 } = {}) {
  const exp = Number(experimental) || 0
  const ex = Number(expert ?? expertReview) || 0
  const lit = Number(literature) || 0
  const der = Number(derived) || 0
  const weighted = exp * WEIGHTS.experimental + ex * WEIGHTS.expert + lit * WEIGHTS.literature + der * WEIGHTS.derived
  const total = exp + ex + lit + der

  let level
  if (exp >= 2 || weighted >= 3) level = "High"
  else if (weighted >= 1) level = "Medium"
  else level = "Low"

  // Derived-only evidence is capped at Low regardless of count.
  if (exp === 0 && ex === 0 && lit === 0 && der > 0) level = "Low"

  return {
    level,
    weighted: r3(weighted),
    total,
    breakdown: { experimental: exp, expert: ex, literature: lit, derived: der },
    note: "Confidence weights Experimental highest and Derived lowest; derived-only evidence is capped at Low.",
  }
}

export default calculateEvidenceConfidence
