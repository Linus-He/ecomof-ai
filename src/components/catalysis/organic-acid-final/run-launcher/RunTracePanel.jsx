// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, displayValue, text } from "../FinalScreeningShared"

function openTraceWorkbench() {
  if (typeof document === "undefined") return
  document.getElementById("organic-acid-final-trace-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function RunTracePanel({ open, trace, lang, t }) {
  if (!open) return null
  const rows = Array.isArray(trace) ? trace : trace?.legacyRecords || trace?.steps || []
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, maxHeight: 420, overflow: "auto", padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, "运行审计记录", "Run audit record")}</strong>
        {trace?.runId ? <StatusPill tone="info" t={t}>{trace.runId}</StatusPill> : null}
      </div>
      {trace?.runId ? (
        <button type="button" onClick={openTraceWorkbench} style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "7px 10px" }}>
          {text(lang, "打开完整算法审计工作台", "Open full algorithm audit workbench")}
        </button>
      ) : null}
      {rows.map((row, index) => (
        <article key={`${row.id}-${index}`} style={{ borderTop: index ? `1px solid ${t.divider || t.border}` : "none", display: "grid", gap: 4, paddingTop: index ? 8 : 0 }}>
          <span style={{ color: t.textStrong, fontSize: 12.3, fontWeight: 900 }}><ChemicalText value={text(lang, row.titleZh, row.title)} /></span>
          <span style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}>
            <ChemicalText value={displayValue(text(lang, row.detailZh || row.output?.decisionZh, row.detail || row.output?.decision || row.rule?.summary))} />
          </span>
        </article>
      ))}
    </section>
  )
}
