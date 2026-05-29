// @ts-nocheck
import { MOF_PRESETS, MOF_PRESET_ALIASES } from "../constants/catalogs"

export function normalizeMofKey(name) {
  return String(name || "").toLowerCase().replace(/[\s_\-()]/g, "")
}

export function findPresetName(query) {
  const raw = String(query || "").trim()
  if (!raw) return null
  const exact = Object.keys(MOF_PRESETS).find(n => n.toLowerCase() === raw.toLowerCase())
  if (exact) return exact
  const normalized = normalizeMofKey(raw)
  return MOF_PRESET_ALIASES[normalized]
    || Object.keys(MOF_PRESETS).find(n => normalizeMofKey(n) === normalized)
    || null
}

export function getPresetSuggestionNames(query) {
  const raw = String(query || "").trim().toLowerCase()
  const normalized = normalizeMofKey(raw)
  if (!raw) return []
  return Object.keys(MOF_PRESETS)
    .filter(n => n.toLowerCase().includes(raw) || normalizeMofKey(n).includes(normalized))
    .slice(0, 8)
}
