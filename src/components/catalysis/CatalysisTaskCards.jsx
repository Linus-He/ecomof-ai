import { BasisBadge } from "../../shared"

export function CatalysisTaskCards({ tasks, selectedTaskId, selectedComparisonIds, onSelectTask, onToggleComparison, lang, t }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      {tasks.map(task => {
        const active = selectedTaskId === task.id
        const checked = selectedComparisonIds.includes(task.id)
        return (
          <article key={task.id} style={{ background: active ? t.badgeInfoBg : t.panel, border: `1px solid ${active ? (t.borderStrong || t.border) : t.border}`, borderRadius: 12, padding: 13 }}>
            <button
              type="button"
              onClick={() => onSelectTask(task)}
              style={{ background: "transparent", border: 0, color: t.textStrong, cursor: "pointer", fontSize: 14, fontWeight: 900, lineHeight: 1.3, padding: 0, textAlign: "left", width: "100%" }}
            >
              {lang === "zh" ? task.taskZh : task.taskEn}
            </button>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <BasisBadge tone="info">{task.domainLabel}</BasisBadge>
              <BasisBadge tone="proxy">{task.modeLabel}</BasisBadge>
              <BasisBadge tone="calc">{task.quantitativeStatus}</BasisBadge>
            </div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 9 }}>
              {task.feedstockLabel} → {task.productFamilyLabel}
            </div>
            <label style={{ alignItems: "center", color: checked ? t.accentText : t.muted, cursor: "pointer", display: "inline-flex", gap: 6, fontSize: 12, fontWeight: 850, marginTop: 10 }}>
              <input type="checkbox" checked={checked} onChange={() => onToggleComparison(task.id)} style={{ accentColor: t.accent }} />
              {lang === "zh" ? "加入可比性评估" : "Add to comparability assessment"}
            </label>
          </article>
        )
      })}
    </section>
  )
}
