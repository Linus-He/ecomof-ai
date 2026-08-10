// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildFeatureAblationAudit } from "../../utils/databaseIndex/featureAblationAudit"

function overlapTone(value) {
  if (value >= 0.8) return "pass"
  if (value >= 0.5) return "proxy"
  return "warn"
}

export function FeatureAblationAuditPanel({ records = [], lang, t }) {
  const audit = useMemo(() => buildFeatureAblationAudit(records), [records])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "特征消融审计", "Feature Ablation Audit")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "移除某类特征后比较 Top-N 重叠，判断排序是否过度依赖某类特征。不删除任何描述符字段，也不修改 OACS/DMRS 公式。",
              "Compares Top-N overlap after removing a feature class to judge whether the ordering over-relies on it. No descriptor field is deleted and OACS/DMRS formulas are unchanged."
            )} />
          </span>
        </div>
        <StatusBadge tone="warn" t={t}>{text(lang, "仅审计", "audit only")}</StatusBadge>
      </header>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 420, width: "100%" }}>
          <thead>
            <tr>
              {[text(lang, "变体", "Variant"), text(lang, "与基线 Top-N 重叠", "Top-N overlap"), text(lang, "移除/惩罚", "Removed / penalized")].map(label => (
                <th key={label} style={{ borderBottom: `1px solid ${t.divider}`, color: t.faint, fontSize: 10.5, padding: "7px 6px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audit.variants.map(variant => (
              <tr key={variant.id}>
                <td style={{ borderTop: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 11.6, fontWeight: 700, padding: "7px 6px" }}>{text(lang, variant.labelZh, variant.label)}</td>
                <td style={{ borderTop: `1px solid ${t.divider}`, padding: "7px 6px" }}><StatusBadge tone={overlapTone(variant.topNOverlapWithBaseline)} t={t}>{Number(variant.topNOverlapWithBaseline).toFixed(2)}</StatusBadge></td>
                <td style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: "7px 6px" }}>{(variant.removedOrPenalized || []).slice(0, 4).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: t.muted, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, audit.boundaryZh, audit.boundary)} />
      </p>
    </section>
  )
}

export default FeatureAblationAuditPanel
