// @ts-nocheck
import { getEvidenceScore, getStabilityScore, normalizeGasMetric } from "../../utils/gasScoring"
import { formatPending, formatPercent } from "../../utils/formatters"
import { dataTypeLabel } from "./gasEvidence"

export const GAS_METRICS = [
  { key: "primaryUptake", scoreKey: "uptake", label: "Uptake", labelZh: "吸附量", unit: "mmol/g" },
  { key: "selectivity", scoreKey: "selectivity", label: "Selectivity", labelZh: "选择性", unit: "" },
  { key: "workingCapacity", scoreKey: "workingCapacity", label: "Working capacity", labelZh: "工作容量", unit: "mmol/g" },
  { key: "regenerability", scoreKey: "regenerability", label: "Regenerability", labelZh: "可再生性", unit: "%" },
  { key: "stability", scoreKey: "stability", label: "Stability", labelZh: "稳定性", unit: "" },
  { key: "evidence", scoreKey: "evidence", label: "Evidence confidence", labelZh: "证据置信度", unit: "" },
]

export const CONTRIBUTION_COLORS = {
  uptake: "#2F7D7B",
  selectivity: "#4E72B8",
  workingCapacity: "#8B7D3A",
  regenerability: "#7B61A9",
  stability: "#4F8F5B",
  evidence: "#B87333",
  riskPenalty: "#B95F6B",
}

export function text(lang, zh, en) {
  return lang === "zh" ? zh : en
}

export function metricMeta(metric) {
  return GAS_METRICS.find(item => item.key === metric || item.scoreKey === metric) || GAS_METRICS[0]
}

export function metricLabel(metric, lang) {
  const meta = metricMeta(metric)
  return text(lang, meta.labelZh, meta.label)
}

export function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function formatNumber(value, digits = 1) {
  const number = finite(value)
  if (number == null) return "pending"
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

export function formatScore(value) {
  const number = finite(value)
  return number == null ? "pending" : String(Math.round(number))
}

export function metricRawValue(record, metric) {
  if (!record) return null
  if (metric === "stability") return getStabilityScore(record)
  if (metric === "evidence") return getEvidenceScore(record)
  return finite(record[metric])
}

export function metricNormalizedValue(record, metric, peers = []) {
  if (!record) return null
  if (metric === "stability") return getStabilityScore(record)
  if (metric === "evidence") return getEvidenceScore(record)
  return normalizeGasMetric(metricRawValue(record, metric), metric, peers)
}

export function metricContribution(record, metric) {
  if (!record?.scoreBreakdown?.contributions) return null
  const scoreKey = metricMeta(metric).scoreKey
  return finite(record.scoreBreakdown.contributions[scoreKey])
}

export function metricDisplayValue(record, metric, lang, peers = []) {
  const raw = metricRawValue(record, metric)
  if (raw == null) return formatPending(lang)
  if (metric === "stability" || metric === "evidence") return formatPercent(raw, { lang, normalized: true })
  if (metric === "regenerability") return formatPercent(raw, { lang })
  const unit = metricMeta(metric).unit
  return `${formatNumber(raw)}${unit ? ` ${unit}` : ""}`
}

export function dataStatus(record, lang) {
  return dataTypeLabel(record?.dataType || "needs_validation", lang)
}

export function metricInterpretation(record, metric, lang, peers = []) {
  const normalized = metricNormalizedValue(record, metric, peers)
  const label = metricLabel(metric, lang)
  if (normalized == null) {
    return text(lang, `${label} 当前缺失，不能作为贡献依据。`, `${label} is pending and should not be treated as evidence.`)
  }
  if (normalized >= 0.75) {
    return text(lang, `${label} 在当前候选集中贡献较强。`, `${label} is a strong contributor within the current candidate set.`)
  }
  if (normalized <= 0.35) {
    return text(lang, `${label} 是当前候选的相对短板。`, `${label} is a relative weakness for this candidate.`)
  }
  return text(lang, `${label} 表现处于中间区间，需要结合其他指标判断。`, `${label} sits in the middle range and should be interpreted with other metrics.`)
}

export function validationForRecord(record = {}, scenario = {}, lang = "en") {
  const existing = record?.validationRecommendation
  if (existing?.type) return existing
  const type = String(record?.dataType || "").toLowerCase()
  const selectivity = metricNormalizedValue(record, "selectivity", [record])
  const qst = finite(record?.heatOfAdsorption)
  const wetStream = ["CO2/N2", "VOC/N2"].includes(scenario.gasPair || record.gasPair)
  if (type.includes("predicted") || type.includes("demo")) {
    return {
      type: "GCMC simulation",
      typeZh: "GCMC 吸附模拟",
      priority: "high",
      reason: "Current record is demo/predicted and needs adsorption simulation before scientific ranking.",
      reasonZh: "当前记录仍是演示数据或预测数据，需要先用吸附模拟确认后才能进入科研排序。",
      requiredData: ["CIF structure", "force field", "partial charges", "temperature", "pressure"],
      requiredDataZh: ["CIF 结构", "力场", "部分电荷", "温度", "压力"],
      expectedOutput: "Single-component and mixture uptake estimates under the selected gas pair.",
      expectedOutputZh: "在选定气体对下得到单组分和混合气吸附量估计。",
      evidenceImpact: "Can improve evidence confidence from C toward B if simulation is reproducible.",
      evidenceImpactZh: "若模拟可复现，可将证据置信度从 C 向 B 推进。",
    }
  }
  if (selectivity != null && selectivity > 0.72) {
    return {
      type: "IAST validation",
      typeZh: "IAST 混合吸附验证",
      priority: "high",
      reason: "Selectivity strongly contributes to the score, but mixture adsorption has not been validated.",
      reasonZh: "选择性对分数贡献较强，但混合气吸附尚未验证。",
      requiredData: ["single-component isotherms", "gas mixture ratio", "temperature", "pressure"],
      requiredDataZh: ["单组分等温线", "混合气比例", "温度", "压力"],
      expectedOutput: `Estimated mixture selectivity and uptake under ${scenario.gasPair || record.gasPair} conditions.`,
      expectedOutputZh: `得到 ${scenario.gasPair || record.gasPair} 条件下的混合气选择性和吸附量估计。`,
      evidenceImpact: "May upgrade evidence confidence if the mixed-gas estimate remains consistent.",
      evidenceImpactZh: "若混合气估计保持一致，可提升证据置信度。",
    }
  }
  if (wetStream && String(record?.waterStability || "").toLowerCase() !== "high") {
    return {
      type: "Water stability test",
      typeZh: "水稳定性测试",
      priority: "medium",
      reason: "The selected stream may contain water or humidity-sensitive contaminants.",
      reasonZh: "当前气流可能包含水或湿度敏感杂质，需要确认稳定窗口。",
      requiredData: ["humidity exposure condition", "post-exposure crystallinity", "uptake retention"],
      requiredDataZh: ["湿度暴露条件", "暴露后结晶性", "吸附保持率"],
      expectedOutput: "Stability window and uptake retention after humidity exposure.",
      expectedOutputZh: "湿度暴露后的稳定窗口和吸附保持率。",
      evidenceImpact: "Clarifies whether the material can move into process-level assessment.",
      evidenceImpactZh: "判断材料是否可以进入过程级评估。",
    }
  }
  if ((qst || 0) > 38 || Number(record?.regenerability || 0) < 72) {
    return {
      type: "Regeneration cycling",
      typeZh: "再生循环测试",
      priority: "medium",
      reason: "High adsorption heat or lower regenerability may limit cyclic operation.",
      reasonZh: "较高吸附热或较低可再生性可能限制循环运行。",
      requiredData: ["adsorption/desorption cycles", "working capacity", "heat duty proxy"],
      requiredDataZh: ["吸附 / 脱附循环", "工作容量", "热负荷 proxy"],
      expectedOutput: "Capacity retention and regeneration burden across repeated cycles.",
      expectedOutputZh: "重复循环下的容量保持率和再生负担。",
      evidenceImpact: "Separates high-affinity mechanism candidates from process-priority candidates.",
      evidenceImpactZh: "区分高亲和机理候选与过程优先候选。",
    }
  }
  return {
    type: "Breakthrough experiment",
    typeZh: "穿透实验",
    priority: "medium",
    reason: "The candidate is balanced enough to justify dynamic mixture validation.",
    reasonZh: "候选表现较均衡，值得进行动态混合气验证。",
    requiredData: ["packed-bed condition", "feed composition", "flow rate", "outlet concentration curve"],
    requiredDataZh: ["固定床条件", "进料组成", "流速", "出口浓度曲线"],
    expectedOutput: "Breakthrough time, dynamic capacity, and separation factor.",
    expectedOutputZh: "穿透时间、动态容量和分离因子。",
    evidenceImpact: "Can upgrade the record toward process-level evidence if consistent.",
    evidenceImpactZh: "若结果一致，可将记录推进到过程级证据。",
  }
}
