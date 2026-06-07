// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function toneFor(value, t) {
  const textValue = String(value || "").toLowerCase()
  if (textValue.includes("verified")) return [t.badgeGoodBg || t.badgeInfoBg, t.good || t.accentText]
  if (textValue.includes("pending") || textValue.includes("hypothesis")) return [t.badgeWarnBg, t.warn]
  if (textValue.includes("literature")) return [t.badgeInfoBg, t.accentText]
  return [t.surface, t.muted]
}

function Badge({ value, t }) {
  const [bg, color] = toneFor(value, t)
  return (
    <span style={{ background: bg, border: `1px solid ${color}`, borderRadius: 999, color, display: "inline-flex", fontSize: 10.3, fontWeight: 900, padding: "4px 7px", textTransform: "uppercase" }}>
      <ChemicalText value={value} />
    </span>
  )
}

export function DescriptorEvidenceMatrix({ rows = [], coverage, lang, t }) {
  return (
    <section id="methodology-oafs-evidence-matrix" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Evidence Strength Matrix</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "证据强度矩阵", "Evidence Strength Matrix")}
          </h3>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 3, minWidth: 170, padding: 9 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>DOI coverage</span>
          <strong style={{ color: t.warn, fontSize: 20, lineHeight: 1 }}>{coverage?.doiCoveragePercent || "0%"}</strong>
          <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.35 }}>
            {text(lang, "当前阶段边界，不是错误。", "Current-stage boundary, not an error.")}
          </span>
        </div>
      </header>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.descriptor} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
            <div style={{ alignItems: "start", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.25 }}><ChemicalText value={text(lang, row.descriptorZh, row.descriptor)} /></strong>
              <Badge value={text(lang, row.currentStatusZh, row.currentStatus)} t={t} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Badge value={row.evidenceType} t={t} />
              <Badge value={row.confidence} t={t} />
              <Badge value={row.doiStatus} t={t} />
            </div>
            <div style={{ color: t.faint, fontSize: 11.4, lineHeight: 1.45 }}>
              <ChemicalText value={`${text(lang, "证据记录", "Records")}: ${(row.recordIds || []).join(", ") || "pending"}`} />
            </div>
            <div style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 4, paddingTop: 7 }}>
              <span style={{ color: t.faint, fontSize: 10.4, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "下一步证据", "Next evidence")}</span>
              {(row.nextEvidenceNeeded || []).map(item => (
                <span key={item} style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.38 }}><ChemicalText value={item} /></span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
