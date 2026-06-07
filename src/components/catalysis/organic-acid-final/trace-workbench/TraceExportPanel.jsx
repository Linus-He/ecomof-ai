// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../common/ChemicalFormula"
import { buildTraceExportBundle } from "../../../../utils/organicAcidTrace/traceReportExporter"
import { StatusPill, text } from "../FinalScreeningShared"

export function TraceExportPanel({ trace, lang, t }) {
  const [format, setFormat] = useState("markdown")
  const bundle = useMemo(() => buildTraceExportBundle(trace || {}), [trace])
  const body = format === "json" ? bundle.json : bundle.markdown
  const copy = () => {
    if (typeof navigator === "undefined") return
    navigator.clipboard?.writeText(body).catch(() => {})
  }
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "Trace Export Panel", "Trace Export Panel")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["markdown", "json"].map(item => (
            <button key={item} type="button" onClick={() => setFormat(item)} style={{ background: format === item ? t.accent : t.surface, border: `1px solid ${format === item ? t.accent : t.border}`, borderRadius: 8, color: format === item ? t.buttonText || "#fff" : t.textStrong, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>{item}</button>
          ))}
          <button type="button" onClick={copy} style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
            {text(lang, "复制报告", "Copy report")}
          </button>
        </div>
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 10 }}>
        <StatusPill tone="info" t={t}>{trace?.exportable ? "exportable" : "pending"}</StatusPill>
        <pre style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.45, margin: 0, maxHeight: 260, overflow: "auto", whiteSpace: "pre-wrap" }}><ChemicalText value={body} /></pre>
      </div>
    </section>
  )
}

