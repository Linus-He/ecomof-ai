// @ts-nocheck
// V2.0-M Candidate comparison. Compares 2-3 candidates across ranking, descriptor,
// evidence, and metadata dimensions, and auto-generates "why A outranks B". It does not
// change any score and never claims a final recommendation.

function num(value, fallback = null) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
function finalScore(c) { return num(c.D_expected ?? c.finalScore ?? c.score) }
function ratio(c) { const v = c.descriptorCompleteness; return typeof v === "number" ? v : num(v?.ratio) }

const DIMENSIONS = [
  { key: "rank", labelEn: "Rank", labelZh: "名次", get: c => c.rank ?? null },
  { key: "finalScore", labelEn: "Final score", labelZh: "最终得分", get: c => finalScore(c) },
  { key: "descriptorCompleteness", labelEn: "Descriptor completeness", labelZh: "描述符完整度", get: c => ratio(c) },
  { key: "evidenceLevel", labelEn: "Evidence level", labelZh: "证据等级", get: c => c.evidenceLevel ?? null },
  { key: "sourceStatus", labelEn: "Source status", labelZh: "来源状态", get: c => c.sourceStatus ?? c.verification?.sourceUrlStatus ?? "pending" },
  { key: "verifiedMetadata", labelEn: "Verified metadata", labelZh: "已核验元数据", get: c => Boolean(c.verifiedMetadata ?? c.verification?.verifiedMetadata) },
  { key: "surfaceArea", labelEn: "Surface area", labelZh: "比表面积", get: c => num(c.surfaceArea ?? c.descriptors?.surfaceArea) },
  { key: "poreSizeA", labelEn: "Pore size", labelZh: "孔径", get: c => num(c.poreSizeA ?? c.descriptors?.poreSizeA) },
  { key: "poreVolume", labelEn: "Pore volume", labelZh: "孔体积", get: c => num(c.poreVolume ?? c.descriptors?.poreVolume) },
  { key: "density", labelEn: "Density", labelZh: "密度", get: c => num(c.density ?? c.descriptors?.density) },
  { key: "bandGap", labelEn: "Band gap", labelZh: "带隙", get: c => num(c.bandGap ?? c.descriptors?.bandGap) },
  { key: "riskLevel", labelEn: "Risk level", labelZh: "风险等级", get: c => c.riskLevel ?? null },
]

export function buildCandidateComparison(candidates = []) {
  const rows = (Array.isArray(candidates) ? candidates : []).slice(0, 3)
  const dimensions = DIMENSIONS.map(dim => ({
    key: dim.key,
    labelEn: dim.labelEn,
    labelZh: dim.labelZh,
    values: rows.map(c => dim.get(c)),
  }))

  const comparisons = []
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i]
      const b = rows[j]
      const higher = num(finalScore(a), 0) >= num(finalScore(b), 0) ? a : b
      const lower = higher === a ? b : a
      comparisons.push(buildWhyOutranks(higher, lower))
    }
  }

  return {
    candidateCount: rows.length,
    candidateIds: rows.map(c => c.id || c.candidateId),
    dimensions,
    comparisons,
    notFinalRecommendation: true,
  }
}

export function buildWhyOutranks(higher = {}, lower = {}) {
  const reasonsEn = []
  const reasonsZh = []
  if (num(ratio(higher), 0) > num(ratio(lower), 0)) {
    reasonsEn.push("higher descriptor completeness")
    reasonsZh.push("更高的描述符完整度")
  }
  if (num(finalScore(higher), 0) > num(finalScore(lower), 0)) {
    reasonsEn.push("stronger overall score contribution")
    reasonsZh.push("更强的综合得分贡献")
  }
  const lowerLimitEn = []
  const lowerLimitZh = []
  if (num(ratio(lower), 1) < num(ratio(higher), 0)) { lowerLimitEn.push("more limited descriptor coverage"); lowerLimitZh.push("描述符覆盖更有限") }
  const lowerSource = lower.sourceStatus ?? lower.verification?.sourceUrlStatus
  if (lowerSource && lowerSource !== "confirmed") { lowerLimitEn.push("metadata uncertainty and missing license/source confirmation"); lowerLimitZh.push("元数据不确定、缺少 license/来源确认") }

  const higherName = higher.displayName || higher.name || higher.id
  const lowerName = lower.displayName || lower.name || lower.id
  return {
    higherId: higher.id || higher.candidateId,
    lowerId: lower.id || lower.candidateId,
    summaryEn: `${higherName} outranks ${lowerName} mainly because it has ${reasonsEn.join(" and ") || "a higher score"}${lowerLimitEn.length ? `, while ${lowerName} is more limited by ${lowerLimitEn.join(" and ")}` : ""}.`,
    summaryZh: `${higherName} 排名高于 ${lowerName}，主要因为它具有${reasonsZh.join("、") || "更高的得分"}${lowerLimitZh.length ? `，而 ${lowerName} 更受${lowerLimitZh.join("、")}限制` : ""}。`,
    notFinalRecommendation: true,
  }
}
