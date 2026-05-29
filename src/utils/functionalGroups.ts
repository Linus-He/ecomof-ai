// @ts-nocheck
import { FUNCTIONAL_GROUPS, AROMATIC_SUBSTITUTION_POSITIONS } from "../constants/catalogs"

export function defaultGroupPositions(count = 1) {
  const safeCount = Math.max(0, Math.min(4, Number(count) || 0))
  return AROMATIC_SUBSTITUTION_POSITIONS.slice(0, safeCount)
}

export function normalizeFunctionalGroupDetails(inputs = {}) {
  const selected = Array.isArray(inputs.functionalGroups) ? inputs.functionalGroups : []
  const details = inputs.functionalGroupDetails || {}
  return selected.reduce((acc, value) => {
    const raw = details[value] || {}
    const count = Math.max(0, Math.min(4, raw.count === 0 ? 0 : Number(raw.count) || raw.positions?.length || 1))
    const positions = count > 0 && Array.isArray(raw.positions) && raw.positions.length
      ? raw.positions.filter(pos => AROMATIC_SUBSTITUTION_POSITIONS.includes(String(pos))).slice(0, count)
      : defaultGroupPositions(count)
    acc[value] = { count, positions: count > 0 && positions.length ? positions : defaultGroupPositions(count) }
    return acc
  }, {})
}

export function getFunctionalGroupEntries(inputs = {}) {
  const details = normalizeFunctionalGroupDetails(inputs)
  return Object.entries(details).map(([value, detail]) => ({
    value,
    detail,
    meta: FUNCTIONAL_GROUPS.find(group => group.value === value),
  })).filter(entry => entry.meta)
}

export function hasFunctionalGroup(inputs = {}, value) {
  return getFunctionalGroupEntries(inputs).some(entry => entry.value === value && entry.detail.count > 0)
}

export function getFunctionalGroupCount(inputs = {}, value) {
  return normalizeFunctionalGroupDetails(inputs)[value]?.count || 0
}

export function getTotalFunctionalGroupCount(inputs = {}) {
  return getFunctionalGroupEntries(inputs).reduce((sum, entry) => sum + entry.detail.count, 0)
}

export function positionEffectFactor(positions = []) {
  if (!positions.length) return 1
  const set = new Set(positions.map(String))
  const highInfluence = ["2", "5"].filter(pos => set.has(pos)).length
  const metaInfluence = ["3", "6"].filter(pos => set.has(pos)).length
  const adjacentPenalty =
    (set.has("2") && set.has("3") ? 0.06 : 0) +
    (set.has("5") && set.has("6") ? 0.06 : 0)
  return Math.max(0.72, 1 + highInfluence * 0.08 + metaInfluence * 0.03 - adjacentPenalty)
}

export function formatFunctionalGroupSummary(inputs = {}, lang = "en") {
  const entries = getFunctionalGroupEntries(inputs)
  if (!entries.length) return lang === "zh" ? "无" : "None"
  return entries.map(({ meta, detail }) => {
    const pos = detail.positions?.length ? detail.positions.join("/") : "—"
    // Import functionalGroupLabel lazily to avoid circular dependency
    const label = lang === "zh"
      ? String(meta.label)
          .replace("(Amine)", "（胺基）")
          .replace("(Hydroxyl)", "（羟基）")
          .replace("(Carboxyl)", "（羧基）")
          .replace("(Thiol)", "（巯基）")
          .replace("(Nitro)", "（硝基）")
          .replace("(Fluoro)", "（氟）")
          .replace("(Chloro)", "（氯）")
          .replace("(Bromo)", "（溴）")
          .replace("(Iodo)", "（碘）")
          .replace("(Methyl)", "（甲基）")
          .replace("(Trifluoromethyl)", "（三氟甲基）")
          .replace("(Isopropyl)", "（异丙基）")
          .replace("(Methoxy)", "（甲氧基）")
          .replace("(Pyridyl)", "（吡啶基）")
      : meta.label
    return `${label} ×${detail.count} @ ${pos}`
  }).join("; ")
}
