// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusBadge, displayValue, text } from "../FinalScreeningShared"

export function EvidenceTracePanel({ evidenceTraces = [], lang, t }) {
  const rows = evidenceTraces.slice(0, 26)
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Evidence Trace Panel", "Evidence Trace Panel")}
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 980, width: "100%" }}>
          <thead>
            <tr>
              {["Target", "Field", "Value", "Evidence IDs", "Source", "DOI", "Status", "Note"].map(label => (
                <th key={label} style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "8px 7px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11.8, fontWeight: 850, padding: "8px 7px" }}>{displayValue(row.targetId)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, padding: "8px 7px" }}>{displayValue(row.field)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, padding: "8px 7px" }}>{displayValue(row.value)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, lineHeight: 1.35, padding: "8px 7px" }}>{row.evidenceIds?.slice(0, 4).join(" / ") || "Pending"}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, padding: "8px 7px" }}>{displayValue(row.sourceType)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, padding: "8px 7px" }}><StatusBadge tone={row.doiStatus?.includes("available") ? "pass" : "warn"} t={t}>{row.doiStatus}</StatusBadge></td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, padding: "8px 7px" }}>{displayValue(row.curationStatus)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.5, lineHeight: 1.35, padding: "8px 7px" }}><ChemicalText value={displayValue(row.note)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

