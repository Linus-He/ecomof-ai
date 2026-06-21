// @ts-nocheck
// V3.9 export — deterministic, version- and date-stamped export file names, e.g.
// "ecomof-mof-library-V3.9-20260621.csv". Sanitizes the slug so the name is
// always filesystem-safe.
function slug(value: string): string {
  return String(value || "export").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export"
}

function dateStamp(date?: string | Date): string {
  const d = date ? new Date(date) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10).replace(/-/g, "")
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

export function buildExportFileName({ base = "export", version = "V0.0", date, ext = "json" }: { base?: string; version?: string; date?: string | Date; ext?: string } = {}): string {
  const v = String(version || "V0.0").trim().replace(/\s+/g, "")
  const e = String(ext || "json").replace(/^\./, "").toLowerCase()
  return `ecomof-${slug(base)}-${v}-${dateStamp(date)}.${e}`
}

export default buildExportFileName
