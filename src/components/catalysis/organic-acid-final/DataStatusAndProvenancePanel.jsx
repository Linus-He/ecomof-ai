// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { formatPercent, MiniMetric, Panel, StatusPill, text } from "./FinalScreeningShared"

function CountChips({ counts, t }) {
  const entries = Object.entries(counts || {})
  if (!entries.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {entries.map(([key, value]) => (
        <span key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontSize: 11, fontWeight: 850, padding: "6px 9px" }}>
          <ChemicalText value={`${key}: ${value}`} />
        </span>
      ))}
    </div>
  )
}

export function DataStatusAndProvenancePanel({ coverage, lang, t, isMobile }) {
  return (
    <Panel
      id="organic-acid-final-data-status-provenance"
      eyebrow={text(lang, "数据状态", "Data status")}
      title={text(lang, "Data Status & Provenance Coverage", "Data Status & Provenance Coverage")}
      t={t}
      actions={<StatusPill tone={coverage?.noFakeDoiPolicyActive ? "pass" : "fail"} t={t}>No fake DOI policy active</StatusPill>}
    >
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MiniMetric label={text(lang, "结构化 value", "Structured values")} value={formatPercent(coverage?.structuredValueCoverage)} t={t} />
        <MiniMetric label="Source basis" value={formatPercent(coverage?.sourceBasisCoverage)} t={t} />
        <MiniMetric label="Confidence" value={formatPercent(coverage?.confidenceCoverage)} t={t} />
        <MiniMetric label="DOI coverage" value={formatPercent(coverage?.doiCoverage)} t={t} tone="warn" />
        <MiniMetric label="Fake DOI" value={coverage?.fakeDoiCount ?? 0} t={t} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Source coverage", "Source coverage")}</strong>
          <CountChips counts={coverage?.bySourceBasis} t={t} />
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Confidence coverage", "Confidence coverage")}</strong>
          <CountChips counts={coverage?.byConfidence} t={t} />
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "Data status", "Data status")}</strong>
          <CountChips counts={coverage?.dataStatusCounts} t={t} />
        </article>
      </div>

      <div style={{ background: coverage?.noFakeDoiPolicyActive ? t.badgeInfoBg : t.badgeWarnBg, border: `1px solid ${coverage?.noFakeDoiPolicyActive ? t.accent : t.warn}`, borderRadius: 10, color: t.muted, fontSize: 12.4, lineHeight: 1.55, padding: 11 }}>
        <ChemicalText value={text(
          lang,
          `当前金属矩阵 ${coverage?.descriptorFieldCount || 0} 个 descriptor 字段全部保留 sourceBasis 与 confidence；无 DOI 的字段显示为 evidence pending，不伪造 DOI。`,
          `The current metal matrix keeps sourceBasis and confidence for ${coverage?.descriptorFieldCount || 0} descriptor fields. Fields without DOI are shown as evidence pending; DOI values are not fabricated.`
        )} />
      </div>
    </Panel>
  )
}
