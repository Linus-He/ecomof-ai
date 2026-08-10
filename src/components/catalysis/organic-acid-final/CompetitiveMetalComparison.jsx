// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, MiniMetric, Panel, StatusBadge, text } from "./FinalScreeningShared"

function DeltaList({ title, items, emptyText, t }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</span>
      {(items || []).length ? items.map(item => (
        <div key={item.key} style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.35 }}><ChemicalText value={item.label} /></span>
          <strong style={{ color: t.textStrong, fontSize: 11.8 }}>{item.delta > 0 ? "+" : ""}{formatScore(item.delta)}</strong>
        </div>
      )) : (
        <span style={{ color: t.faint, fontSize: 11.8 }}>{emptyText}</span>
      )}
    </div>
  )
}

export function CompetitiveMetalComparison({ comparisons, lang, t, isMobile }) {
  const rows = comparisons || []
  return (
    <Panel
      id="organic-acid-final-competitive-metal-comparison"
      eyebrow={text(lang, "竞品审计", "Competitive audit")}
      title={text(lang, "Mo vs W/V/Ti/Zr/Fe Competitive Metal Comparison", "Mo vs W/V/Ti/Zr/Fe Competitive Metal Comparison")}
      t={t}
      actions={<StatusBadge tone="warn" t={t}>demo/proxy comparison</StatusBadge>}
    >
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          "这里不把 Mo 视为已证明最优，而是把 W、V、Ti、Zr、Fe 作为紧邻竞品，展示 DMRS 差距、Mo 胜出项、竞品胜出项和共同不确定性。",
          "Mo is not treated as proven optimal here. W, V, Ti, Zr, and Fe are kept as close competitors with DMRS gaps, Mo-winning terms, competitor-winning terms, and shared uncertainty."
        )} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {rows.map(row => (
          <article key={row.competitor} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 14 }}>Mo vs {row.competitor}</strong>
              <StatusBadge tone={row.dmrsGap >= 0 ? "pass" : "warn"} t={t}>
                {row.dmrsGap >= 0 ? text(lang, "Mo higher", "Mo higher") : text(lang, "competitor higher", "competitor higher")}
              </StatusBadge>
            </div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <MiniMetric label="Mo DMRS" value={formatScore(row.targetDmrs)} t={t} />
              <MiniMetric label={`${row.competitor} DMRS`} value={formatScore(row.competitorDmrs)} t={t} />
              <MiniMetric label={text(lang, "差距", "Gap")} value={formatScore(row.dmrsGap)} t={t} tone={row.dmrsGap < 0.03 ? "warn" : "info"} />
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
              <DeltaList
                title={text(lang, "Mo wins", "Mo wins")}
                items={row.targetWins}
                emptyText={text(lang, "No clear Mo-winning term", "No clear Mo-winning term")}
                t={t}
              />
              <DeltaList
                title={text(lang, `${row.competitor} wins`, `${row.competitor} wins`)}
                items={row.competitorWins}
                emptyText={text(lang, "No clear competitor-winning term", "No clear competitor-winning term")}
                t={t}
              />
            </div>
            <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, color: t.muted, display: "grid", gap: 4, fontSize: 11.8, lineHeight: 1.45, padding: 9 }}>
              <strong style={{ color: t.warn }}>{text(lang, "Shared uncertainty", "Shared uncertainty")}</strong>
              <ChemicalText value={displayValue(row.sharedUncertainty?.target?.summary)} />
              <ChemicalText value={displayValue(row.sharedUncertainty?.competitor?.summary)} />
              <span>
                <ChemicalText value={`${row.dataStatus?.target?.label || "Pending"} / ${row.dataStatus?.competitor?.label || "Pending"}`} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
