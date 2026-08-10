// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusBadge, text } from "../catalysis/organic-acid-final/FinalScreeningShared"

const PRIORITY_COPY = {
  high: { en: "High", zh: "高" },
  medium: { en: "Medium", zh: "中" },
  low: { en: "Low", zh: "低" },
}

function priorityTone(priority) {
  if (priority === "high") return "warn"
  if (priority === "medium") return "proxy"
  return "info"
}

export function ScreeningNextActionPanel({ nextActions, lang, t }) {
  const actions = nextActions?.actions || []
  return (
    <section data-testid="screening-next-action-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "下一步行动", "Next actions")}</strong>
        <StatusBadge tone="warn" t={t}>{text(lang, "非最终推荐", "not final recommendation")}</StatusBadge>
      </header>
      {actions.length ? (
        <ul style={{ display: "grid", gap: 7, listStyle: "none", margin: 0, padding: 0 }}>
          {actions.map(action => (
            <li key={action.id} style={{ alignItems: "start", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "flex", gap: 8, padding: 9 }}>
              <StatusBadge tone={priorityTone(action.priority)} t={t}>{text(lang, PRIORITY_COPY[action.priority]?.zh || action.priority, PRIORITY_COPY[action.priority]?.en || action.priority)}</StatusBadge>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}><ChemicalText value={text(lang, action.zh, action.en)} /></span>
            </li>
          ))}
        </ul>
      ) : (
        <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "暂无待办行动。", "No pending actions.")}</span>
      )}
    </section>
  )
}

export default ScreeningNextActionPanel
