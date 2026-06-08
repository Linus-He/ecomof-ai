// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount, formatPercentValue, provenanceRows } from "../../utils/databaseIndex/databaseIndexFormatters"

export function ProvenanceCoveragePanel({ coverage = {}, lang, t }) {
  const rows = provenanceRows(coverage)
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "来源覆盖率", "Provenance Coverage")}</strong>
        <span style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45 }}>
          <ChemicalText value={text(lang, "DOI 缺失表示证据待核，不是结构校验失败。", "Missing DOI is evidence pending, not schema failure.")} />
        </span>
      </header>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 9 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{row.label}</span>
            <strong style={{ color: row.percent === 0 ? t.warn : t.textStrong, fontSize: 16 }}>
              {row.count === null ? formatPercentValue(row.percent) : `${formatCount(row.count)} / ${formatCount(row.total)} · ${formatPercentValue(row.percent)}`}
            </strong>
          </article>
        ))}
      </div>
      {coverage.warning ? <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}><ChemicalText value={coverage.warning} /></p> : null}
    </section>
  )
}
