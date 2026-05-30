// @ts-nocheck
import { toPercent } from "../types/scoringTypes"

export function explainWeights({
  weights = {},
  descriptors = [],
  diagnostics = {},
  lang = "en",
} = {}) {
  const critic = diagnostics.method === "critic" ? diagnostics : diagnostics.critic || {}
  const hybrid = diagnostics.method === "hybrid" ? diagnostics : {}
  return descriptors.map(descriptor => {
    const key = descriptor.key
    const weight = Number(weights?.[key]) || 0
    const contrast = critic.sigma?.[key] ?? critic.contrastIntensity?.[key] ?? 0
    const conflict = critic.conflictScore?.[key] ?? 0
    const missingRate = critic.missingRateByDescriptor?.[key] ?? 0
    const strong = weight >= 0.16
    return {
      key,
      label: descriptor.label,
      labelZh: descriptor.labelZh,
      weight,
      contrastIntensity: contrast,
      conflictScore: conflict,
      missingRate,
      fallbackUsed: Boolean(diagnostics.fallbackUsed || critic.fallbackUsed),
      expertPriorUsed: Boolean(hybrid.expertPriorUsed || diagnostics.manual),
      alpha: hybrid.actualAlpha ?? hybrid.alpha,
      evidenceStatus: missingRate > 0.35
        ? (lang === "zh" ? "缺失较多" : "limited coverage")
        : (lang === "zh" ? "可解释" : "interpretable"),
      interpretation: lang === "zh"
        ? strong
          ? "CRITIC 表明该指标在当前候选集中具有较高区分贡献。"
          : "该指标在当前候选集中的区分贡献较低或与其他指标信息重叠。"
        : strong
          ? "CRITIC suggests this descriptor contributes strongly in the current candidate set."
          : "This descriptor contributes less strongly or overlaps with other descriptors in the current candidate set.",
      summary: `${descriptor.label || key}: ${toPercent(weight, 1)} weight${diagnostics.fallbackUsed || critic.fallbackUsed ? " · fallback active" : ""}`,
    }
  })
}
