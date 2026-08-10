// @ts-nocheck
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"

export function ScreeningNextActionPanel({ trace, lang, t }) {
  const actions = trace?.nextActions || []
  return (
    <section id="screening-next-action" data-testid="screening-next-action-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "下一步建议", "Next Action")}</strong>
        <StatusBadge tone="warn" t={t}>{text(lang, "非最终推荐", "not final recommendation")}</StatusBadge>
      </div>
      <ul style={{ display: "grid", gap: 7, listStyle: "none", margin: 0, padding: 0 }}>
        {actions.map(a => (
          <li key={a.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 11.6, lineHeight: 1.45, overflowWrap: "anywhere", padding: 9 }}>
            {text(lang, a.zh, a.en)}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ScreeningNextActionPanel
