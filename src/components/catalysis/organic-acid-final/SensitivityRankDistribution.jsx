// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatPercent, Panel, StatusPill, text } from "./FinalScreeningShared"

const SEGMENTS = [
  ["rank1", "Rank 1", "#1A6DB5"],
  ["rank2", "Rank 2", "#0F8A5F"],
  ["rank3", "Rank 3", "#D99A2B"],
  ["rank4Plus", "Rank 4+", "#9CA3AF"],
]

function toneFor(row) {
  if (row.top3Probability >= 0.85) return "pass"
  if (row.top3Probability >= 0.5) return "warn"
  return "info"
}

export function SensitivityRankDistribution({ bars, audit, lang, t }) {
  const rows = bars || []
  const mo = rows.find(row => row.metal === "Mo")
  const auditRequired = audit?.status === "audit_required" || mo?.rankProbabilities?.rank1 >= 1

  return (
    <Panel
      id="organic-acid-final-sensitivity-rank-distribution"
      eyebrow={text(lang, "扰动排名分布", "Perturbed rank distribution")}
      title={text(lang, "Sensitivity Rank Distribution", "Sensitivity Rank Distribution")}
      t={t}
      actions={<StatusPill tone={auditRequired ? "warn" : "pass"} t={t}>{auditRequired ? "robust but audit-required" : "rank distribution"}</StatusPill>}
    >
      {auditRequired ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
          <ChemicalText value={text(
            lang,
            "Mo 在所有扰动中均保持第 1。这说明结果稳健，但仍需审计，因为描述符边距可能主导排序。",
            "Mo remains Rank #1 in every perturbation. This is robust but audit-required because descriptor-margin effects may dominate."
          )} />
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 9 }}>
        {rows.map(row => (
          <article key={row.metal} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 10 }}>
            <div style={{ alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "52px minmax(0, 1fr) 92px" }}>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{row.metal}</strong>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, display: "flex", height: 26, minWidth: 0, overflow: "hidden" }}>
                {SEGMENTS.map(([key, label, color]) => {
                  const value = row.rankProbabilities?.[key] || 0
                  return value > 0 ? (
                    <div key={key} title={`${label}: ${formatPercent(value)}`} style={{ background: color, minWidth: value >= 0.035 ? 8 : 3, width: `${value * 100}%` }} />
                  ) : null
                })}
              </div>
              <StatusPill tone={toneFor(row)} t={t}>{lang === "zh" ? row.statusZh : row.status}</StatusPill>
            </div>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", lineHeight: 1.4 }}>
              <span>Rank 1 {formatPercent(row.rankProbabilities?.rank1)}</span>
              <span>Rank 2 {formatPercent(row.rankProbabilities?.rank2)}</span>
              <span>Rank 3 {formatPercent(row.rankProbabilities?.rank3)}</span>
              <span>Rank 4+ {formatPercent(row.rankProbabilities?.rank4Plus)}</span>
              <span>Top 3 {formatPercent(row.top3Probability)}</span>
              <span>{text(lang, "平均排名", "Mean rank")} {row.meanRank}</span>
              <span>{text(lang, "范围", "Range")} {row.rankRange}</span>
            </div>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {SEGMENTS.map(([key, label, color]) => (
          <span key={key} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 11.5, gap: 6 }}>
            <span style={{ background: color, borderRadius: 4, display: "inline-block", height: 10, width: 18 }} />
            {label}
          </span>
        ))}
      </div>
    </Panel>
  )
}
