// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, displayValue, formatScore, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { normalizeTopCandidates } from "../../utils/databaseIndex/databaseIndexFormatters"

export function PrecomputedTopCandidatesPanel({ topCandidates = {}, onOpenDetail, lang, t }) {
  const rows = normalizeTopCandidates(topCandidates)
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "Precomputed Top Candidates", "Precomputed Top Candidates")}</strong>
        <StatusPill tone="warn" t={t}>preview / not final recommendation</StatusPill>
      </header>
      <p style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, "Top candidates 为预览候选，不是最终验证推荐。", "Top candidates are preview candidates, not final verified recommendations.")} />
      </p>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(row => (
          <article key={row.frameworkId} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 7, gridTemplateColumns: "44px minmax(0, 1fr) 82px auto", paddingTop: 8 }}>
            <strong style={{ color: t.accentText, fontSize: 12 }}>#{row.rank}</strong>
            <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}><ChemicalText value={row.displayName} /></strong>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.4 }}><ChemicalText value={`${row.frameworkId} · ${row.dataQualityStatus} · ${row.evidenceBoundary}`} /></span>
            </div>
            <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{formatScore(row.oacsPreview)}</span>
            <button type="button" onClick={() => onOpenDetail?.(row)} disabled={!row.detailRef} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: row.detailRef ? t.accentText : t.faint, cursor: row.detailRef ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 900, minHeight: 32, padding: "6px 9px" }}>
              {text(lang, "详情", "Detail")}
            </button>
          </article>
        ))}
        {!rows.length ? <span style={{ color: t.muted, fontSize: 12 }}>{displayValue(null, "No preview candidates loaded")}</span> : null}
      </div>
    </section>
  )
}
