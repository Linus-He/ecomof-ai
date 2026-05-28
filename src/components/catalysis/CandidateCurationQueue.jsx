import { organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

const statusLabel = {
  ready_for_screening: ["可进入筛选", "Ready for screening"],
  needs_descriptor_review: ["需要描述符复核", "Needs descriptor review"],
  needs_provenance: ["需要补充来源", "Needs provenance"],
  needs_reaction_mapping: ["需要补充反应路径关联", "Needs reaction mapping"],
  low_priority: ["暂缓", "Defer"],
}

export function CandidateCurationQueue({ queue, selectedCandidateId, onSelectCandidate, lang }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 14 }}>{text(lang, "整理队列", "Curation Queue")}</strong>
        <span style={{ color: palette.muted, fontSize: 12 }}>{text(lang, "队列显示缺失字段、规则命中数、证据完整度和下一步整理动作。", "The queue shows missing fields, rule matches, evidence completeness, and next curation actions.")}</span>
      </header>
      <div style={{ display: "grid", gap: 8 }}>
        {queue.map(item => {
          const active = selectedCandidateId === item.id
          const label = statusLabel[item.curationStatus] || [item.curationStatus, item.curationStatus]
          return (
            <button key={item.id} type="button" onClick={() => onSelectCandidate(item.id)} style={{ background: active ? palette.accentSoft : palette.surface, border: `1px solid ${active ? palette.accent : palette.border}`, borderRadius: 10, cursor: "pointer", display: "grid", gap: 7, padding: 10, textAlign: "left" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: active ? palette.accent : palette.text, fontSize: 12.5 }}>{item.name}</strong>
                <span style={{ color: palette.faint, fontSize: 11.5 }}>{lang === "zh" ? label[0] : label[1]}</span>
              </div>
              <div style={{ background: palette.surfaceStrong, borderRadius: 999, height: 7, overflow: "hidden" }}>
                <span style={{ background: palette.accent, display: "block", height: "100%", width: pct(item.evidenceCompleteness) }} />
              </div>
              <span style={{ color: palette.muted, fontSize: 11.5 }}>
                {text(lang, "命中规则", "Rule matches")}: {item.matchedRuleCount} · {text(lang, "缺失", "Missing")}: {item.missingFields?.join(", ") || "none"}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
