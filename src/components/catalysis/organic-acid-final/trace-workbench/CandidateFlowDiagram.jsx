// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { displayValue, text } from "../FinalScreeningShared"

export function CandidateFlowDiagram({ flow = [], lang, t }) {
  const maxInput = Math.max(1, ...flow.map(row => row.inputCount || 0))
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Candidate Flow Funnel / Sankey", "Candidate Flow Funnel / Sankey")}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
        {flow.map(row => {
          const inputWidth = Math.max(12, (row.inputCount / maxInput) * 100)
          const outputWidth = Math.max(8, (row.outputCount / maxInput) * 100)
          return (
            <div key={row.id} style={{ display: "grid", gap: 4 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: t.textStrong, fontSize: 12 }}><ChemicalText value={text(lang, row.labelZh, row.label)} /></strong>
                <span style={{ color: t.muted, fontSize: 11.5 }}>{`${row.inputCount} -> ${row.outputCount}`}</span>
              </div>
              <div style={{ background: t.border, borderRadius: 6, height: 9, overflow: "hidden" }}>
                <div style={{ background: t.accent, borderRadius: 6, height: "100%", width: `${inputWidth}%` }} />
              </div>
              <div style={{ background: t.border, borderRadius: 6, height: 7, overflow: "hidden" }}>
                <div style={{ background: row.blockedCount ? t.warn : t.good || t.accent, borderRadius: 6, height: "100%", width: `${outputWidth}%` }} />
              </div>
              {row.blockedCount ? <span style={{ color: t.warn, fontSize: 11.5 }}>{displayValue(row.blockedCount)} blocked / filtered at this step</span> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
