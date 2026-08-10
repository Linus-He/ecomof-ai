// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatPercent, MiniMetric, Panel, StatusBadge, statusTone, text } from "./FinalScreeningShared"

function statusLabel(row, lang) {
  if (row?.status === "rank-locked") return text(lang, "锁定排名 / 需审计", "rank locked / audit required")
  if (row?.status === "top3-robust") return text(lang, "Top 3 稳健", "Top 3 robust")
  return text(lang, "敏感", "sensitive")
}

export function MetalSensitivityDistribution({ distribution, sensitivity, audit, lang, t, isMobile }) {
  const rows = distribution || sensitivity?.summaries || []
  const mo = rows.find(row => row.metal === "Mo")
  const showAuditWarning = audit?.status === "audit_required" || mo?.top1Probability >= 1

  return (
    <Panel
      id="organic-acid-final-metal-sensitivity-distribution"
      eyebrow={text(lang, "全金属分布", "Full-metal distribution")}
      title={text(lang, "Full-Metal Sensitivity Distribution", "Full-Metal Sensitivity Distribution")}
      t={t}
      actions={<StatusBadge tone={statusTone(audit?.status)} t={t}>{audit?.label || "distribution audit"}</StatusBadge>}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <MiniMetric label="Iterations" value={sensitivity?.iterations || mo?.iterations || 1000} t={t} />
        <MiniMetric label={text(lang, "扰动范围", "Perturbation")} value={sensitivity?.perturbationRange || mo?.perturbationRange || "+/-20%"} t={t} />
        <MiniMetric label={text(lang, "扰动校验", "Perturbation validation")} value={sensitivity?.validation?.status || "valid"} t={t} />
        <MiniMetric label="Mo rank range" value={mo?.rankRange || "Pending"} t={t} tone={showAuditWarning ? "warn" : "info"} />
      </div>

      {showAuditWarning ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
          <strong style={{ color: t.warn, display: "block", fontSize: 13, marginBottom: 4 }}>
            {text(lang, "Mo Top1 = 100%：稳健，但必须审计", "Mo Top1 = 100%: robust but audit required")}
          </strong>
          <ChemicalText value={audit?.reason || text(
            lang,
            "Mo 在所有权重扰动下保持第一，说明当前 demo descriptor 集合内稳定；这不能作为 Mo 最优的最终证明，需要检查 descriptor 饱和、竞品方差和缺失证据。",
            "Mo stays first across all weight perturbations in the current demo descriptor set; this is not final proof of Mo optimality and requires audit for descriptor saturation, competitor variance, and missing evidence."
          )} />
        </div>
      ) : null}

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 760, width: "100%" }}>
          <thead>
            <tr>
              {[
                text(lang, "Metal", "Metal"),
                "Top 1",
                "Top 3",
                text(lang, "Mean rank", "Mean rank"),
                text(lang, "Rank std", "Rank std"),
                text(lang, "Rank range", "Rank range"),
                text(lang, "Status", "Status"),
              ].map(label => (
                <th key={label} style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10.5, fontWeight: 900, padding: "9px 8px", textAlign: "left", textTransform: "uppercase" }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.metal}>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 900, padding: "9px 8px" }}>{row.metal}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{formatPercent(row.top1Probability)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{formatPercent(row.top3Probability)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{displayValue(row.meanRank)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{displayValue(row.rankStd)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "9px 8px" }}>{displayValue(row.rankRange)}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11.8, padding: "9px 8px" }}>
                  <StatusBadge tone={row.status === "sensitive" ? "warn" : row.status === "rank-locked" ? "warn" : "pass"} t={t}>{statusLabel(row, lang)}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
