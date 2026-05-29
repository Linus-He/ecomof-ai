// @ts-nocheck
import { toPercent } from "../types/scoringTypes"

export function explainCandidateScore(row, lang = "en") {
  if (!row) return null
  const driver = row.mainDriver
  const weakness = row.mainWeakness
  return {
    id: row.id,
    name: row.name,
    summary: lang === "zh"
      ? `${row.name} 当前评分 ${row.score.toFixed(1)}；完整度 ${toPercent(row.descriptorCompleteness)}。`
      : `${row.name} currently scores ${row.score.toFixed(1)} with ${toPercent(row.descriptorCompleteness)} descriptor completeness.`,
    mainDriver: driver
      ? (lang === "zh"
        ? `${driver.labelZh || driver.label} 是主要正向贡献，贡献约 ${(driver.contribution * 100).toFixed(1)} 分。`
        : `${driver.label} is the main positive driver, contributing about ${(driver.contribution * 100).toFixed(1)} score points.`)
      : "",
    mainWeakness: weakness
      ? (lang === "zh"
        ? `${weakness.labelZh || weakness.label} 是当前主要短板或缺失风险。`
        : `${weakness.label} is the main weakness or missing-data risk.`)
      : "",
    warning: row.evidenceWarning,
  }
}
