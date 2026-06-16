// @ts-nocheck
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"

export function CandidateRankingExplanation({ explanation, lang, t }) {
  if (!explanation) return null
  return (
    <section data-testid="candidate-ranking-explanation" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11 }}>
      <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "排序解释 / 决策追踪", "Ranking Explanation / Decision Trace")}</strong>
      <div style={{ display: "grid", gap: 3 }}>
        {explanation.steps.map(s => (
          <div key={s.id} style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <span style={{ color: t.muted, fontSize: 11.4 }}>{text(lang, s.labelZh, s.labelEn)}</span>
            <strong style={{ color: t.textStrong, fontSize: 12 }}>{s.value === null || s.value === undefined ? text(lang, "待补", "pending") : String(s.value)}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 8 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "参与评分字段", "Scored fields")}</div>
          <div style={{ color: t.textStrong, fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>{(explanation.scoredFields || []).map(f => text(lang, f.labelZh, f.label)).join(", ") || text(lang, "无", "none")}</div>
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 8 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "缺失未参与字段", "Missing / not used")}</div>
          <div style={{ color: (explanation.missingFields || []).length ? t.warn : t.textStrong, fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>{(explanation.missingFields || []).map(f => text(lang, f.labelZh, f.label)).join(", ") || text(lang, "无", "none")}</div>
        </div>
      </div>
      <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45, margin: 0 }}>{text(lang, explanation.mainReasonZh, explanation.mainReasonEn)}</p>
      <p style={{ color: t.warn, fontSize: 11.4, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>{text(lang, explanation.mainUncertaintyZh, explanation.mainUncertaintyEn)}</p>
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "该解释不代表最终推荐。", "This explanation is not a final recommendation.")}</span>
    </section>
  )
}

export default CandidateRankingExplanation
