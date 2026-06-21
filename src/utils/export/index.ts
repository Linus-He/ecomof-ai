// @ts-nocheck
export { buildExportFileName } from "./buildExportFileName"
export { sanitizeExportRows, sanitizeCell } from "./sanitizeExportRows"
export { buildCsv } from "./exportCsv"
export { buildJson, buildExportEnvelope } from "./exportJson"

// Browser download helper (no-op in non-DOM environments / tests).
export function downloadTextFile(fileName: string, content: string, mime = "text/plain"): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false
  try {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}
