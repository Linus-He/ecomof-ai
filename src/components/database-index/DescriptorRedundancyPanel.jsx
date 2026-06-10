// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildDescriptorRedundancySummary } from "../../utils/databaseIndex/descriptorRedundancyGate"

function actionTone(action) {
  if (action === "keep") return "pass"
  if (action === "penalize") return "warn"
  return "proxy"
}

function actionLabel(action, lang) {
  if (action === "penalize") return text(lang, "惩罚", "penalize")
  if (action === "review") return text(lang, "复核", "review")
  return text(lang, "保留", "keep")
}

export function DescriptorRedundancyPanel({ records = [], lang, t, isMobile }) {
  const summary = useMemo(() => buildDescriptorRedundancySummary(records), [records])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "描述符冗余门控", "Descriptor Redundancy Gate")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "该门控用于识别可能重复放大同类信息的描述符，不会自动删除字段，也不改变 OACS/DMRS 公式。",
              "This gate identifies descriptors that may duplicate the same signal. It does not automatically delete descriptors or modify OACS/DMRS formulas."
            )} />
          </span>
        </div>
        <StatusPill tone="warn" t={t}>{text(lang, "审计用途", "audit only")}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {[
          [text(lang, "描述符总数", "Descriptors"), summary.descriptorCount],
          [text(lang, "低信息量", "Low variance"), summary.lowVarianceCount],
          [text(lang, "高相关对", "High-correlation pairs"), summary.redundantPairCount],
          [text(lang, "样本不足", "Insufficient data"), summary.insufficientDataCount],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 16 }}>{formatCount(value)}</strong>
          </article>
        ))}
      </div>

      {summary.redundantPairs.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 420, width: "100%" }}>
            <thead>
              <tr>
                {[text(lang, "描述符 A", "Descriptor A"), text(lang, "描述符 B", "Descriptor B"), "Pearson r", text(lang, "动作", "Action")].map(label => (
                  <th key={label} style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.5, padding: "7px 6px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.redundantPairs.map(pair => (
                <tr key={`${pair.descriptorA}-${pair.descriptorB}`}>
                  <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.6, padding: "7px 6px" }}>{pair.descriptorA}</td>
                  <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.6, padding: "7px 6px" }}>{pair.descriptorB}</td>
                  <td style={{ borderTop: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11.6, fontWeight: 850, padding: "7px 6px" }}>{pair.pearsonR}</td>
                  <td style={{ borderTop: `1px solid ${t.divider}`, padding: "7px 6px" }}><StatusPill tone="warn" t={t}>{actionLabel("penalize", lang)}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "当前已加载记录中未发现高相关描述符对（或样本不足）。", "No high-correlation descriptor pairs found in the loaded records (or insufficient data).")}</span>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {summary.descriptors.filter(row => row.action !== "keep").slice(0, 8).map(row => (
          <StatusPill key={row.descriptorKey} tone={actionTone(row.action)} t={t}>{`${row.descriptorKey}: ${actionLabel(row.action, lang)}`}</StatusPill>
        ))}
      </div>

      <p style={{ color: t.muted, fontSize: 11.6, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, summary.boundaryZh, summary.boundary)} />
      </p>
    </section>
  )
}

export default DescriptorRedundancyPanel
