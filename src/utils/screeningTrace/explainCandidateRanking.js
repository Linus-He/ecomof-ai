// @ts-nocheck
// V2.0-M Candidate ranking explanation ("Decision Trace").
//
// Explains why a candidate ranks where it does, from raw descriptor contribution to the
// final score, including the confidence penalty from data gaps. It does NOT change any
// score and never claims a final recommendation.

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function finalScore(candidate) {
  return num(candidate.D_expected ?? candidate.finalScore ?? candidate.score)
}

function completenessRatio(candidate) {
  const c = candidate.descriptorCompleteness
  if (typeof c === "number") return c
  return num(c?.ratio)
}

export function explainCandidateRanking(candidate = {}, model = {}) {
  const weights = Array.isArray(model.weights)
    ? model.weights
    : Array.isArray(model.indicatorDiagnostics)
      ? model.indicatorDiagnostics
      : Object.entries(model.weights || {}).map(([key, weight]) => ({ key, weight, label: key, zhLabel: key }))
  const inputs = candidate.scoreInputs || {}
  // Raw descriptor contributions (normalized score x weight) when available.
  const drivers = (Array.isArray(weights) ? weights : []).map(w => {
    const key = w.key || w.id
    const normalized = num(inputs[key]?.normalized, num(candidate[`${key}_clipped`]))
    const weight = num(w.weight)
    return { key, label: w.label || key, labelZh: w.zhLabel || w.labelZh || key, normalized, weight, contribution: Math.round(normalized * weight * 1000) / 1000, missing: Boolean(inputs[key]?.missing) }
  }).sort((a, b) => b.contribution - a.contribution)

  const positive = drivers.filter(d => !d.missing).slice(0, 2)
  const negative = [...drivers].filter(d => !d.missing).sort((a, b) => a.normalized - b.normalized).slice(0, 1)
  const missingDrivers = drivers.filter(d => d.missing)
  const ratio = completenessRatio(candidate)
  const confidencePenalty = Math.round((1 - ratio) * 0.3 * 1000) / 1000

  const steps = [
    { id: "raw", labelEn: "Raw descriptor contribution", labelZh: "原始描述符贡献", value: positive.map(d => d.label).join(", ") || "n/a" },
    { id: "normalized", labelEn: "Normalized score", labelZh: "标准化得分", value: drivers.length ? Math.round(drivers.reduce((s, d) => s + d.normalized, 0) / drivers.length * 1000) / 1000 : null },
    { id: "critic", labelEn: "CRITIC weighted score", labelZh: "CRITIC 加权得分", value: Math.round(drivers.reduce((s, d) => s + d.contribution, 0) * 1000) / 1000 },
    { id: "evidence", labelEn: "Evidence adjusted score", labelZh: "证据修正得分", value: finalScore(candidate) },
    { id: "confidencePenalty", labelEn: "Confidence penalty (data gaps)", labelZh: "置信度惩罚（数据缺口）", value: confidencePenalty },
    { id: "final", labelEn: "Final score", labelZh: "最终得分", value: finalScore(candidate) },
  ]

  const mainReasonEn = positive.length
    ? `Ranks here mainly because of strong ${positive.map(d => d.label).join(" and ")} contribution.`
    : "Ranks here on limited descriptor evidence."
  const mainReasonZh = positive.length
    ? `主要因为 ${positive.map(d => d.labelZh).join(" 与 ")} 的较强贡献。`
    : "在有限的描述符证据下给出当前名次。"
  const mainUncertaintyEn = missingDrivers.length
    ? `Main uncertainty: missing ${missingDrivers.map(d => d.label).join(", ")}.`
    : (negative.length ? `Main uncertainty: weak ${negative[0].label}.` : "Main uncertainty: limited evidence.")
  const mainUncertaintyZh = missingDrivers.length
    ? `主要不确定性：缺少 ${missingDrivers.map(d => d.labelZh).join("、")}。`
    : (negative.length ? `主要不确定性：${negative[0].labelZh} 较弱。` : "主要不确定性：证据有限。")
  const scoredFields = drivers.filter(d => !d.missing).map(d => ({ key: d.key, label: d.label, labelZh: d.labelZh }))
  const missingFields = drivers.filter(d => d.missing).map(d => ({ key: d.key, label: d.label, labelZh: d.labelZh }))

  return {
    candidateId: candidate.id || candidate.candidateId,
    displayName: candidate.displayName || candidate.name || candidate.id,
    rank: candidate.rank ?? null,
    finalScore: finalScore(candidate),
    topPositiveFactors: positive.map(d => ({ label: d.label, labelZh: d.labelZh, contribution: d.contribution })),
    topNegativeFactors: negative.map(d => ({ label: d.label, labelZh: d.labelZh, normalized: d.normalized })),
    missingDrivers: missingDrivers.map(d => ({ label: d.label, labelZh: d.labelZh })),
    scoredFields,
    missingFields,
    confidencePenalty,
    steps,
    mainReasonEn,
    mainReasonZh,
    mainUncertaintyEn,
    mainUncertaintyZh,
    notFinalRecommendation: true,
  }
}
