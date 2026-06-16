// @ts-nocheck
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"

export function ScreeningDataGapPanel({ trace, lang, t, isMobile }) {
  const gaps = trace?.dataGaps || { byField: [], candidateGaps: [], priorityRepairList: [] }
  return (
    <section id="screening-data-gap" data-testid="screening-data-gap-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "数据缺口", "Data Gaps")}</strong>
      <div style={{ color: t.muted, fontSize: 11.6 }}>
        {text(lang, "优先补齐", "Priority repair")}: {(gaps.priorityRepairList || []).join(", ") || text(lang, "无", "none")}
      </div>
      {gaps.byField?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {gaps.byField.map(f => (
            <span key={f.field} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, fontSize: 10.8, fontWeight: 800, padding: "5px 8px" }}>{f.field}: {f.count}</span>
          ))}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 6 }}>
        {(gaps.candidateGaps || []).slice(0, isMobile ? 5 : 12).map(c => (
          <div key={c.candidateId} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 3, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 11.6, overflowWrap: "anywhere" }}>{c.displayName}</strong>
            <span style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.4, overflowWrap: "anywhere" }}>
              {text(lang, "缺口", "blockers")}: {(c.missingDescriptors || []).concat(c.blockers || []).join(", ") || text(lang, "无", "none")}
            </span>
            {c.fieldSourceGaps?.length ? (
              <span style={{ color: t.warn, fontSize: 10.6, lineHeight: 1.4, overflowWrap: "anywhere" }}>
                {text(lang, "字段级缺口", "field-level gaps")}: {c.fieldSourceGaps.slice(0, 6).map(g => `${g.field}:${g.status}`).join(", ")}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <span style={{ color: t.faint, fontSize: 10.8 }}>{text(lang, "补齐这些字段后候选才可能进入 verified metadata。", "These fields must be filled before a candidate can reach verified metadata.")}</span>
    </section>
  )
}

export default ScreeningDataGapPanel
