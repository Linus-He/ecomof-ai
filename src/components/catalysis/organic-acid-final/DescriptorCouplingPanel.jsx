// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { Panel, StatusBadge, text } from "./FinalScreeningShared"

function toneFor(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("audit")) return "warn"
  if (value.includes("literature")) return "info"
  if (value.includes("hypothesis")) return "warn"
  return "proxy"
}

export function DescriptorCouplingPanel({ rows = [], lang, t }) {
  return (
    <Panel
      id="organic-acid-final-descriptor-coupling"
      eyebrow="Descriptor Coupling Panel"
      title={text(lang, "描述符耦合面板", "Descriptor Coupling Panel")}
      t={t}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.pair} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
            <div style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.25 }}><ChemicalText value={text(lang, row.pairZh, row.pair)} /></strong>
              <StatusBadge tone={toneFor(row.status)} t={t}>{text(lang, row.statusZh, row.status)}</StatusBadge>
            </div>
            <p style={{ color: t.muted, fontSize: 12.1, lineHeight: 1.48, margin: 0 }}><ChemicalText value={text(lang, row.interpretationZh, row.interpretation)} /></p>
            <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 4, paddingTop: 7 }}>
              <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "下一步证据", "Next evidence")}</span>
              <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.4 }}><ChemicalText value={text(lang, row.nextEvidenceZh, row.nextEvidence)} /></span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
