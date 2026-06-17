// @ts-nocheck

import { getFeatureNumericValue, getFeatureScore } from "./organicAcidFeatureSchema"

function round3(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Number(Math.min(1, Math.max(0, numeric)).toFixed(3))
}

function evidenceTier(features = {}) {
  return String(features.evidenceLevel?.value || "").toLowerCase()
}

function addRisk(collection, condition, risk) {
  if (condition) collection.push(risk)
}

export function calculateOrganicAcidRiskPenalty(features = {}) {
  const collapseRisk = getFeatureScore(features, "collapseRisk")
  const competingPathwayRisk = getFeatureScore(features, "competingPathwayRisk")
  const ambiguityWarnings = getFeatureNumericValue(features, "ambiguityWarnings")
  const missingCriticalFields = getFeatureNumericValue(features, "missingCriticalFields")
  const syntheticFixtureFlag = Boolean(features.syntheticFixtureFlag?.value)
  const fieldProvenanceCoverage = getFeatureScore(features, "fieldProvenanceCoverage")
  const conditionCompatibility = getFeatureScore(features, "conditionCompatibility")
  const mechanismSupport = getFeatureScore(features, "mechanismSupport")
  const level = evidenceTier(features)
  const evidenceLow = level.includes("very low") || level.includes("low") || level.includes("rejected") || getFeatureScore(features, "evidenceLevel") < 0.35

  const penaltyBreakdown = []
  addRisk(penaltyBreakdown, collapseRisk >= 0.7, {
    key: "collapseRisk",
    label: "collapseRisk high",
    labelZh: "坍塌风险高",
    value: collapseRisk,
    penalty: 0.18,
    severity: "blocking",
  })
  addRisk(penaltyBreakdown, competingPathwayRisk >= 0.7, {
    key: "competingPathwayRisk",
    label: "competingPathwayRisk high",
    labelZh: "竞争路径风险高",
    value: competingPathwayRisk,
    penalty: 0.1,
    severity: "soft",
  })
  addRisk(penaltyBreakdown, ambiguityWarnings > 0, {
    key: "ambiguityWarnings",
    label: "ambiguityWarnings present",
    labelZh: "存在字段歧义",
    value: ambiguityWarnings,
    penalty: Math.min(0.09, ambiguityWarnings * 0.035),
    severity: ambiguityWarnings >= 2 ? "blocking" : "soft",
  })
  addRisk(penaltyBreakdown, missingCriticalFields > 0, {
    key: "missingCriticalFields",
    label: "missingCriticalFields present",
    labelZh: "关键字段缺失",
    value: missingCriticalFields,
    penalty: Math.min(0.12, missingCriticalFields * 0.04),
    severity: missingCriticalFields >= 2 ? "blocking" : "soft",
  })
  addRisk(penaltyBreakdown, syntheticFixtureFlag, {
    key: "syntheticFixtureFlag",
    label: "syntheticFixtureFlag true",
    labelZh: "合成/演示 fixture",
    value: 1,
    penalty: 0.08,
    severity: "blocking",
  })
  addRisk(penaltyBreakdown, evidenceLow, {
    key: "evidenceLevel",
    label: "evidenceLevel low",
    labelZh: "证据等级低",
    value: features.evidenceLevel?.value || "pending",
    penalty: 0.08,
    severity: "soft",
  })
  addRisk(penaltyBreakdown, fieldProvenanceCoverage < 0.5, {
    key: "fieldProvenanceCoverage",
    label: "fieldProvenanceCoverage low",
    labelZh: "字段级溯源覆盖不足",
    value: fieldProvenanceCoverage,
    penalty: 0.08,
    severity: "soft",
  })
  addRisk(penaltyBreakdown, conditionCompatibility < 0.45, {
    key: "conditionCompatibility",
    label: "conditionCompatibility low",
    labelZh: "反应条件兼容度低",
    value: conditionCompatibility,
    penalty: 0.07,
    severity: "soft",
  })
  addRisk(penaltyBreakdown, mechanismSupport < 0.45, {
    key: "mechanismSupport",
    label: "unverified mechanism support",
    labelZh: "机制支持未闭合",
    value: mechanismSupport,
    penalty: 0.07,
    severity: "soft",
  })

  const totalPenalty = round3(penaltyBreakdown.reduce((sum, row) => sum + (Number(row.penalty) || 0), 0))
  const blockingRisks = penaltyBreakdown.filter(row => row.severity === "blocking")
  const softRisks = penaltyBreakdown.filter(row => row.severity !== "blocking")

  return {
    totalPenalty,
    penaltyBreakdown: penaltyBreakdown.map(row => ({ ...row, penalty: round3(row.penalty) })),
    blockingRisks,
    softRisks,
    explanation: penaltyBreakdown.length
      ? `Risk penalty ${totalPenalty.toFixed(3)} from ${penaltyBreakdown.map(row => row.label).join(", ")}.`
      : "No configured V2.6 risk penalty triggered; algorithmic suggestion still requires experimental validation.",
    explanationZh: penaltyBreakdown.length
      ? `风险惩罚 ${totalPenalty.toFixed(3)}，来源：${penaltyBreakdown.map(row => row.labelZh).join("、")}。`
      : "未触发 V2.6 风险惩罚；算法建议仍需实验验证。",
  }
}

export default calculateOrganicAcidRiskPenalty
