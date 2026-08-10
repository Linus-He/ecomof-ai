// @ts-nocheck
import { BasisBadge } from "../../shared"

function InlineBadges({ items, t }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {items.slice(0, 4).map(item => (
        <span key={item} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, color: t.muted, fontSize: 10, fontWeight: 750, padding: "4px 7px" }}>{item}</span>
      ))}
    </div>
  )
}

export function CatalysisTaskTable({ tasks, selectedTaskId, selectedComparisonIds, onSelectTask, onToggleComparison, lang, t }) {
  const emptyText = lang === "zh"
    ? "当前筛选条件下暂无催化任务。请放宽 reaction domain、product family 或 data status 条件。"
    : "No catalysis task matches the current filters. Try broadening reaction domain, product family, or data status."
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900 }}>{lang === "zh" ? "催化任务表" : "Catalysis task table"}</div>
        <span style={{ color: t.faint, fontSize: 11 }}>{lang === "zh" ? `${tasks.length} 条任务` : `${tasks.length} tasks`}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1100, width: "100%" }}>
          <thead>
            <tr style={{ background: t.surface }}>
              {(lang === "zh"
                ? ["任务", "领域", "方式", "原料", "产物族", "关键指标", "状态", "比较"]
                : ["Task", "Domain", "Mode", "Feedstock", "Product family", "Key metrics", "Status", "Compare"]
              ).map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 10, padding: 9, textAlign: "left", textTransform: "uppercase" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, padding: 18, textAlign: "center" }}>
                  {emptyText}
                </td>
              </tr>
            ) : tasks.map(task => {
              const active = selectedTaskId === task.id
              const checked = selectedComparisonIds.includes(task.id)
              return (
                <tr key={task.id} onClick={() => onSelectTask(task)} style={{ background: active ? t.badgeInfoBg : "transparent", cursor: "pointer" }}>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 850, padding: 9 }}>{lang === "zh" ? task.taskZh : task.taskEn}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: 9 }}>{task.domainLabel}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: 9 }}>{task.modeLabel}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: 9 }}>{task.feedstockLabel}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11, padding: 9 }}>{task.productFamilyLabel}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, padding: 9 }}><InlineBadges items={lang === "zh" ? task.keyMetricsZh : task.keyMetricsEn} t={t} /></td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, padding: 9 }}><BasisBadge tone={task.quantitativeStatus === "curated" ? "info" : "proxy"}>{task.quantitativeStatus}</BasisBadge></td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, padding: 9 }}>
                    <label onClick={event => event.stopPropagation()} style={{ color: checked ? t.accentText : t.muted, cursor: "pointer", display: "inline-flex", gap: 6, fontSize: 11, fontWeight: 850 }}>
                      <input type="checkbox" checked={checked} onChange={() => onToggleComparison(task.id)} style={{ accentColor: t.accent }} />
                      {lang === "zh" ? "比较" : "Compare"}
                    </label>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
