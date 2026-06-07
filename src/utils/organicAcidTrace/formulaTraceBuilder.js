// @ts-nocheck
import { displayTraceValue, numericTraceValue } from "./traceRecordBuilder"

function contributionArray(source = {}, weights = {}, penaltyKeys = []) {
  return Object.entries(source || {}).map(([key, value]) => {
    const contribution = numericTraceValue(value)
    const rawWeightKey = key.replace(/Penalty$/, "").replace("collapseRiskPenalty", "collapseRisk")
    return {
      key,
      label: key.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase()),
      weight: numericTraceValue(weights[rawWeightKey]),
      contribution,
      direction: penaltyKeys.includes(key) || Number(value) < 0 ? "penalty" : "support",
      value: contribution,
    }
  })
}

export function buildFormulaTraceRecords(screeningResult = {}) {
  const selected = screeningResult.selectedFramework || {}
  const mo = screeningResult.moRecommendation || {}
  const w = (screeningResult.rankedMetals || []).find(row => row.metal === "W") || {}
  const rules = screeningResult.rules || {}
  const oacsBreakdown = selected.organicAcidScore?.contributionBreakdown || {}
  const dmrsBreakdown = mo.contributionBreakdown || []
  return [
    {
      id: "formula-oacs-selected-scaffold",
      formulaId: "oacs",
      label: "OACS Formula & Weight Inspector",
      labelZh: "OACS 公式与权重检查器",
      target: displayTraceValue(selected.displayName || selected.id),
      formula: "OACS = weighted scaffold descriptors - collapse risk penalty",
      formulaZh: "OACS = 骨架描述符加权和 - 坍塌风险惩罚",
      score: numericTraceValue(selected.organicAcidScore?.oacs),
      weightingMethod: displayTraceValue(selected.organicAcidScore?.weightingMethod, "CRITIC+AHP"),
      contributions: contributionArray(oacsBreakdown, rules.frameworkWeights || {}, ["collapseRiskPenalty"]),
      warnings: selected.hydrothermalGate?.status === "pass"
        ? ["OACS is a prioritization score, not validated performance."]
        : ["Hydrothermal gate did not pass; OACS remains forced to 0."],
      boundary: "OACS supports scaffold prioritization only; it does not prove organic-acid catalytic performance.",
      boundaryZh: "OACS 只支持骨架优先级排序，不证明有机酸催化性能。",
    },
    {
      id: "formula-dmrs-mo-recommendation",
      formulaId: "dmrs",
      label: "DMRS Formula & Weight Inspector",
      labelZh: "DMRS 公式与权重检查器",
      target: displayTraceValue(`Mo vs W gap ${numericTraceValue((mo.dmrs || 0) - (w.dmrs || 0))}`),
      formula: "DMRS = active-site value + mechanism feasibility + aqueous stability + evidence support - risk penalty",
      formulaZh: "DMRS = 活性位价值 + 机制可行性 + 水相稳定 + 证据支持 - 风险惩罚",
      score: numericTraceValue(mo.dmrs),
      weightingMethod: "normalized descriptor weights",
      contributions: (dmrsBreakdown || []).map(row => ({
        key: displayTraceValue(row.key),
        label: displayTraceValue(row.label),
        weight: displayTraceValue((rules.dopantWeights || {})[row.key], "composite"),
        contribution: numericTraceValue(row.value),
        direction: Number(row.value) < 0 ? "penalty" : "support",
        value: numericTraceValue(row.value),
      })),
      warnings: [
        "Mo is not assumed to replace Al3+ directly.",
        "Direct selected Al-MOF DFT and same-condition spectroscopy remain pending.",
      ],
      boundary: "DMRS recommends a metal hypothesis. It is not proof that Mo is experimentally optimal.",
      boundaryZh: "DMRS 推荐第二金属假设，不证明 Mo 已是实验最优。",
    },
  ]
}

