// @ts-nocheck
// V3.9 export — pure CSV serialization built on sanitizeExportRows, so a CSV
// never contains undefined / null / NaN / [object Object]. A header comment line
// carries provenance (version / generatedAt / dataMode) when requested.
import { sanitizeExportRows } from "./sanitizeExportRows"

function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function buildCsv(rows: any[] = [], options: { columns?: string[]; meta?: Record<string, any>; includeMeta?: boolean } = {}): string {
  const { columns, rows: clean } = sanitizeExportRows(rows, { columns: options.columns })
  const lines: string[] = []
  if (options.includeMeta && options.meta) {
    const metaParts = Object.entries(options.meta).map(([k, v]) => `${k}=${v == null ? "" : v}`)
    lines.push(`# ${metaParts.join(" | ")}`)
  }
  lines.push(columns.map(escapeCell).join(","))
  for (const row of clean) lines.push(columns.map(col => escapeCell(row[col])).join(","))
  return lines.join("\n") + "\n"
}

export default buildCsv
