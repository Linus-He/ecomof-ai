// @ts-nocheck
import { GAS_EVIDENCE_CONFIDENCE_RANGE } from "./gasDataSchema"

export const GAS_EVIDENCE_LABELS = {
  A: {
    zh: "实验或高质量文献",
    en: "experimental or high-quality literature",
    tone: "calc",
  },
  B: {
    zh: "模拟或部分整理数据",
    en: "simulation or partially curated data",
    tone: "info",
  },
  C: {
    zh: "预测、推断或不完整数据",
    en: "predicted, inferred, or incomplete data",
    tone: "warn",
  },
  D: {
    zh: "演示或占位数据",
    en: "demo or placeholder data",
    tone: "proxy",
  },
}

export const GAS_DATA_TYPE_LABELS = {
  experimental_literature: { zh: "实验数据", en: "experimental", tone: "calc" },
  experimental_literature_seed: { zh: "实验数据", en: "experimental", tone: "calc" },
  literature_seed: { zh: "文献数据", en: "literature", tone: "calc" },
  simulated_gcmc: { zh: "模拟数据", en: "simulation", tone: "info" },
  simulated_iast: { zh: "模拟数据", en: "simulation", tone: "info" },
  predicted_ml: { zh: "预测数据", en: "predicted", tone: "warn" },
  derived_metric: { zh: "规则推断", en: "rule-based", tone: "warn" },
  demo_placeholder: { zh: "演示数据", en: "demo", tone: "proxy" },
  needs_validation: { zh: "待验证", en: "needs validation", tone: "proxy" },
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function evidenceTone(level) {
  return GAS_EVIDENCE_LABELS[String(level || "D").toUpperCase()]?.tone || "proxy"
}

export function dataTypeTone(type) {
  return GAS_DATA_TYPE_LABELS[String(type || "")]?.tone || "proxy"
}

export function evidenceLabel(level, lang) {
  const entry = GAS_EVIDENCE_LABELS[String(level || "D").toUpperCase()] || GAS_EVIDENCE_LABELS.D
  return `${String(level || "D").toUpperCase()} · ${text(lang, entry.zh, entry.en)}`
}

export function dataTypeLabel(type, lang) {
  const entry = GAS_DATA_TYPE_LABELS[String(type || "")] || { zh: type || "unknown", en: type || "unknown" }
  return text(lang, entry.zh, entry.en)
}

export function confidenceRangeLabel(level) {
  const range = GAS_EVIDENCE_CONFIDENCE_RANGE[String(level || "D").toUpperCase()] || GAS_EVIDENCE_CONFIDENCE_RANGE.D
  return `${Math.round(range[0] * 100)}-${Math.round(range[1] * 100)}%`
}

export function buildGasQualityChecklist(record = {}, lang = "en") {
  const fieldSources = record.fieldSources || {}
  const condition = record.condition || {}
  const evidence = record.evidence || {}
  const hasDescriptorSources = ["surfaceArea", "poreSizeA", "poreVolume", "waterStability", "thermalStability"].every(key => fieldSources[key]?.sourceType && fieldSources[key]?.sourceType !== "missing")
  const selectivityDerived = String(fieldSources.selectivity?.sourceType || "").includes("derived") || String(evidence.dataType || record.dataType || "").includes("derived")
  const checklist = [
    ["pass", "gas pair specified", "气体体系已标注", Boolean(record.gasPair)],
    ["pass", "temperature specified", "温度已标注", Number.isFinite(Number(condition.temperatureK ?? record.temperatureK))],
    ["pass", "pressure specified", "压力已标注", Number.isFinite(Number(condition.pressureBar ?? record.pressureBar))],
    ["pass", "uptake unit normalized", "吸附量单位已规范化", record.units?.uptake === "mmol/g" || record.units?.primaryUptake === "mmol/g"],
    ["pass", "source citation available", "来源引用已记录", Boolean(record.recordProvenance?.citation || record.citation)],
    ["pass", "descriptor provenance available", "描述符来源已记录", hasDescriptorSources],
    ["warn", "selectivity derived rather than measured", "选择性为推导值而非直接测量", selectivityDerived],
    ["warn", "no breakthrough validation", "缺少穿透实验验证", !evidence.hasBreakthroughValidation],
    ["fail", "humidity condition missing", "湿度条件缺失", !condition.humidity || condition.humidity === "unknown"],
  ]
  return checklist.map(([severity, en, zh, active]) => ({
    severity: active ? severity : "fail",
    label: text(lang, zh, en),
    active,
  }))
}

export function dataCompletenessScore(record = {}) {
  const checklist = buildGasQualityChecklist(record, "en")
  const passLike = checklist.filter(item => item.severity === "pass" && item.active).length
  const warnLike = checklist.filter(item => item.severity === "warn" && item.active).length
  return {
    earned: passLike + warnLike,
    total: 10,
    label: `${passLike + warnLike}/10`,
  }
}

export function recommendedCurationAction(record = {}, lang = "en") {
  const evidence = record.evidence || {}
  if (!evidence.hasBreakthroughValidation) return text(lang, "补充穿透实验验证来源", "add breakthrough validation source")
  if (!evidence.hasIASTValidation) return text(lang, "补充 IAST 或混合气验证", "add IAST or mixture validation")
  if (!record.condition?.humidity || record.condition.humidity === "unknown") return text(lang, "补充湿度工况", "add humidity condition")
  return text(lang, "维护字段级溯源", "maintain field-level provenance")
}
