// @ts-nocheck
import { convertPressure } from "./units"

function normalizePressure(record = {}) {
  try {
    if (record.pressureKPa != null) return convertPressure(record.pressureKPa, "kPa", "kPa")
    if (record.pressureBar != null) return convertPressure(record.pressureBar, "bar", "kPa")
  } catch {}
  return null
}

export function getConditionKey(record = {}) {
  const pressureKPa = normalizePressure(record)
  return [
    record.gasSystem || record.separationSystem || "",
    record.feedRatio || record.gasRatio || "",
    record.temperatureK ?? "",
    pressureKPa == null ? "" : Number(pressureKPa).toFixed(3),
    record.method || "",
  ].map(value => String(value).trim().toLowerCase()).join("|")
}

export function getComparabilityStatus(records = []) {
  const validRecords = records.filter(record => record && record.selectivity != null)
  if (validRecords.length <= 1) return "single-condition"
  const keys = new Set(validRecords.map(getConditionKey))
  return keys.size === 1 ? "directly-comparable" : "condition-mixed"
}

export function getComparisonWarning(records = [], lang = "en") {
  if (getComparabilityStatus(records) !== "condition-mixed") return null
  return lang === "zh"
    ? "这些选择性数据来自不同气体比例、温度、压力或方法，不能直接作为严格排名依据。"
    : "These selectivity values were reported under different feed ratios, temperatures, pressures, or methods. Direct ranking may be misleading."
}
