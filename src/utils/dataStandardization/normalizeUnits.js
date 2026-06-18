// @ts-nocheck
// V3.0 unit normalization helpers. Canonical units:
//   temperature degC, pressure bar, surfaceArea m^2/g, poreVolume cm^3/g,
//   poreSize angstrom, yield/selectivity/conversion percent, time h.
// Each conversion returns { normalizedValue, normalizedUnit, normalizationMethod }.

const isNum = value => typeof value === "number" && Number.isFinite(value)

function parseQuantity(raw) {
  // Accepts number, or { value, unit }, or "120 C" style strings.
  if (raw == null) return { value: null, unit: null }
  if (isNum(raw)) return { value: raw, unit: null }
  if (typeof raw === "object") {
    const value = isNum(raw.value) ? raw.value : Number(raw.value)
    return { value: Number.isFinite(value) ? value : null, unit: raw.unit || null }
  }
  const match = String(raw).trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/)
  if (!match) return { value: null, unit: null }
  return { value: Number(match[1]), unit: match[2] ? match[2].trim() : null }
}

function result(normalizedValue, normalizedUnit, normalizationMethod) {
  return { normalizedValue, normalizedUnit, normalizationMethod }
}

export function normalizeTemperature(raw) {
  const { value, unit } = parseQuantity(raw)
  if (value == null) return result(null, "degC", "missing")
  const u = (unit || "degC").toLowerCase()
  if (/k\b|kelvin/.test(u) && !/kpa/.test(u)) return result(Number((value - 273.15).toFixed(3)), "degC", "K->degC")
  if (/f\b|fahrenheit/.test(u)) return result(Number(((value - 32) * 5 / 9).toFixed(3)), "degC", "degF->degC")
  return result(value, "degC", "identity")
}

export function normalizePressure(raw) {
  const { value, unit } = parseQuantity(raw)
  if (value == null) return result(null, "bar", "missing")
  const u = (unit || "bar").toLowerCase()
  if (/atm/.test(u)) return result(Number((value * 1.01325).toFixed(4)), "bar", "atm->bar")
  if (/kpa/.test(u)) return result(Number((value / 100).toFixed(4)), "bar", "kPa->bar")
  if (/mpa/.test(u)) return result(Number((value * 10).toFixed(4)), "bar", "MPa->bar")
  if (/\bpa\b/.test(u)) return result(Number((value / 1e5).toFixed(6)), "bar", "Pa->bar")
  if (/psi/.test(u)) return result(Number((value * 0.0689476).toFixed(4)), "bar", "psi->bar")
  return result(value, "bar", "identity")
}

export function normalizeTime(raw) {
  const { value, unit } = parseQuantity(raw)
  if (value == null) return result(null, "h", "missing")
  const u = (unit || "h").toLowerCase()
  if (/min/.test(u)) return result(Number((value / 60).toFixed(4)), "h", "min->h")
  if (/sec|^s$|\bs\b/.test(u)) return result(Number((value / 3600).toFixed(5)), "h", "s->h")
  if (/day|^d$/.test(u)) return result(Number((value * 24).toFixed(3)), "h", "day->h")
  return result(value, "h", "identity")
}

export function normalizePoreSize(raw) {
  const { value, unit } = parseQuantity(raw)
  if (value == null) return result(null, "angstrom", "missing")
  const u = (unit || "angstrom").toLowerCase()
  if (/nm/.test(u)) return result(Number((value * 10).toFixed(3)), "angstrom", "nm->angstrom")
  if (/pm/.test(u)) return result(Number((value / 100).toFixed(3)), "angstrom", "pm->angstrom")
  return result(value, "angstrom", "identity")
}

export function normalizePercent(raw) {
  const { value, unit } = parseQuantity(raw)
  if (value == null) return result(null, "percent", "missing")
  const u = (unit || "").toLowerCase()
  if (u === "fraction" || (unit == null && value > 0 && value <= 1)) {
    return result(Number((value * 100).toFixed(2)), "percent", "fraction->percent")
  }
  return result(value, "percent", "identity")
}

export function normalizeIdentity(raw, unit) {
  const { value } = parseQuantity(raw)
  if (value == null) return result(null, unit, "missing")
  return result(value, unit, "identity")
}

// Generic dispatcher used by record normalizers.
export const FIELD_NORMALIZERS = {
  temperature: normalizeTemperature,
  pressure: normalizePressure,
  reactionTime: normalizeTime,
  poreSizeA: normalizePoreSize,
  poreSize: normalizePoreSize,
  yield: normalizePercent,
  selectivity: normalizePercent,
  conversion: normalizePercent,
  surfaceArea: raw => normalizeIdentity(raw, "m^2/g"),
  poreVolume: raw => normalizeIdentity(raw, "cm^3/g"),
  density: raw => normalizeIdentity(raw, "g/cm^3"),
  voidFraction: raw => normalizeIdentity(raw, "fraction"),
  bandGap: raw => normalizeIdentity(raw, "eV"),
  stabilityProxy: raw => normalizeIdentity(raw, "fraction"),
}

export function normalizeField(field, raw, sourceId = "unknown") {
  const fn = FIELD_NORMALIZERS[field] || (value => normalizeIdentity(value))
  const { value: originalValue, unit: originalUnit } = parseQuantity(raw)
  const { normalizedValue, normalizedUnit, normalizationMethod } = fn(raw)
  return {
    value: normalizedValue,
    originalValue,
    originalUnit: originalUnit || (originalValue == null ? null : "as-supplied"),
    normalizedValue,
    normalizedUnit,
    normalizationMethod,
    fieldSource: sourceId,
    status: normalizedValue == null ? "missing" : "confirmed",
  }
}
