// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { displayValue, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { descriptorRows, formatCount, formatPercentValue } from "../../utils/databaseIndex/databaseIndexFormatters"

export function DescriptorAvailabilityPanel({ availability = {}, lang, t }) {
  const rows = descriptorRows(availability)
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "描述符可用性", "Descriptor Availability")}</strong>
        <span style={{ color: t.warn, fontSize: 12, fontWeight: 850, lineHeight: 1.45 }}>
          <ChemicalText value={text(lang, "水热稳定性数据预计稀疏，因此仍作为证据边界与硬阈值条件。", "Hydrothermal stability is expected to be sparse and remains an evidence boundary.")} />
        </span>
      </header>
      <div style={{ display: "grid", gap: 7 }}>
        {rows.map(row => (
          <article key={row.descriptor} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 5, gridTemplateColumns: "minmax(115px, 0.75fr) minmax(0, 1.25fr) 76px", paddingTop: 7 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}><ChemicalText value={displayValue(row.descriptor)} /></strong>
            <div aria-label={`${row.descriptor} coverage`} style={{ alignSelf: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: 8, overflow: "hidden" }}>
              <span style={{ background: row.percent < 10 ? t.warn : t.accentText, display: "block", height: "100%", width: `${Math.max(0, Math.min(100, row.percent))}%` }} />
            </div>
            <span style={{ color: t.muted, fontSize: 12, textAlign: "right" }}>{formatCount(row.available)} · {formatPercentValue(row.percent)}</span>
          </article>
        ))}
      </div>
      <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}><ChemicalText value={displayValue(availability.interpretation, text(lang, "证据边界待核验", "Evidence boundary pending"))} /></p>
    </section>
  )
}
