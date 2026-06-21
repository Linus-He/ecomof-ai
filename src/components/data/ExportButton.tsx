// @ts-nocheck
// V3.9.1 — generic export button. Builds the content lazily (so it reflects the
// CURRENT filtered data at click time) and triggers a version+date-stamped
// download. No-op label change in non-DOM/test environments.
import { useState } from "react"
import { downloadTextFile } from "../../utils/export"

export function ExportButton({ label = "Export", build, fileName, mime = "text/plain", t, "data-testid": testId }: any) {
  const [done, setDone] = useState(false)
  const onClick = () => {
    try {
      const content = typeof build === "function" ? build() : String(build ?? "")
      const ok = downloadTextFile(typeof fileName === "function" ? fileName() : fileName, content, mime)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
      return ok
    } catch {
      return false
    }
  }
  return (
    <button
      type="button"
      data-testid={testId || "export-button"}
      onClick={onClick}
      style={{ background: t?.surface || "#F1F5F9", border: `1px solid ${t?.accent || "#1A6DB5"}`, borderRadius: 7, color: t?.accentText || "#1A6DB5", cursor: "pointer", fontSize: 11.5, fontWeight: 800, minHeight: 30, padding: "5px 11px" }}
    >
      {done ? "✓ " : "↓ "}{label}
    </button>
  )
}

export default ExportButton
