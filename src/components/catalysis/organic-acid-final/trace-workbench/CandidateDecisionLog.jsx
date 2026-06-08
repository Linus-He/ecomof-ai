// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, displayValue, formatScore, statusTone, text } from "../FinalScreeningShared"

export function CandidateDecisionLog({ decisions = [], lang, t, isMobile }) {
  const rows = decisions.slice(0, 28)
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Candidate Decision Log", "Candidate Decision Log")}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {rows.map(row => (
          <article key={`${row.candidateType}-${row.id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.25 }}><ChemicalText value={row.label} /></strong>
              <StatusPill tone={statusTone(row.status)} t={t}>{row.candidateType}</StatusPill>
            </div>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.8, gap: 4, lineHeight: 1.4 }}>
              <span>{text(lang, "决策", "Decision")}: <strong style={{ color: t.textStrong }}><ChemicalText value={text(lang, row.decisionZh, row.decision)} /></strong></span>
              <span>{text(lang, "状态", "Status")}: {displayValue(row.status)}</span>
              <span>{text(lang, "分数", "Score")}: {formatScore(row.score)}</span>
              <span>{text(lang, "证据", "Evidence")}: {row.evidenceIds?.slice(0, 4).join(" / ") || text(lang, "待核验", "Pending")}</span>
            </div>
            {row.warnings?.length ? (
              <span style={{ color: t.warn, fontSize: 11.6, fontWeight: 850, lineHeight: 1.4 }}><ChemicalText value={(lang === "zh" && row.warningsZh?.length ? row.warningsZh : row.warnings)[0]} /></span>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
