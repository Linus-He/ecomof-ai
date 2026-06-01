// @ts-nocheck
import { chemText } from "./chemText"
import { uiCopy } from "../constants/uiCopy"

export function formatGasPairLabel(value = "") {
  return chemText(String(value || ""))
}

export function formatPending(lang = "en") {
  return uiCopy("data.pending", lang)
}

export function formatDemoLabel(lang = "en") {
  return uiCopy("data.demo", lang)
}

export function formatScore100(value, lang = "en") {
  const number = Number(value)
  if (!Number.isFinite(number)) return formatPending(lang)
  return `${Math.round(number)}/100`
}

export function formatPercent(value, { lang = "en", estimated = false, normalized = false } = {}) {
  const number = Number(value)
  if (!Number.isFinite(number)) return formatPending(lang)
  const percent = Math.abs(number) <= 1 ? Math.round(number * 100) : Math.round(number)
  const prefix = estimated ? "≈" : ""
  const suffix = normalized ? (lang === "zh" ? "（归一化）" : " (normalized)") : ""
  return `${prefix}${percent}%${suffix}`
}

export function formatRiskPenalty(value, lang = "en") {
  const number = Number(value)
  if (!Number.isFinite(number)) return formatPending(lang)
  const percent = Math.round(Math.abs(number))
  return lang === "zh" ? `风险惩罚：−${percent}%` : `−${percent}% risk penalty`
}

export function formatNumberWithUnit(value, unit = "", lang = "en", digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return formatPending(lang)
  const formatted = Number.isInteger(number) ? String(number) : number.toFixed(digits)
  return `${formatted}${unit ? ` ${unit}` : ""}`
}
