// @ts-nocheck
// V3.9 export — guarantees exported rows never contain undefined / null / NaN /
// [object Object]. Objects/arrays are JSON-stringified; missing scalars become
// an explicit fallback token ("" by default for CSV friendliness).
import { isMissing } from "../fallback/normalizeMissingValue"

export function sanitizeCell(value: unknown, fallback = ""): string | number | boolean {
  if (value == null) return fallback
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const t = value.trim()
    if (["undefined", "null", "nan", "[object object]"].includes(t.toLowerCase())) return fallback
    return value
  }
  if (typeof value === "object") {
    try {
      const json = JSON.stringify(value)
      return json === "{}" || json === "[]" ? fallback : json
    } catch {
      return fallback
    }
  }
  return fallback
}

// Returns { columns, rows } where rows are sanitized records keyed by columns.
export function sanitizeExportRows(rows: any[] = [], options: { columns?: string[]; fallback?: string } = {}): { columns: string[]; rows: Record<string, any>[] } {
  const list = Array.isArray(rows) ? rows : []
  const fallback = options.fallback ?? ""
  const columns =
    options.columns && options.columns.length
      ? options.columns
      : Array.from(list.reduce((set: Set<string>, row: any) => { if (row && typeof row === "object") Object.keys(row).forEach(k => set.add(k)); return set }, new Set<string>()))
  const sanitized = list.map(row => {
    const out: Record<string, any> = {}
    for (const col of columns) out[col] = sanitizeCell(row ? row[col] : undefined, fallback)
    return out
  })
  return { columns, rows: sanitized }
}

export default sanitizeExportRows
