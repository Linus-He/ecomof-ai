import { BasisBadge, Callout } from "../../shared"
import { DATA_STATUSES, labelFor } from "./catalysisData"

function Chip({ children, tone = "proxy" }) {
  return <BasisBadge tone={tone}>{children}</BasisBadge>
}

function SourceBadge({ selectionSource, lang }) {
  if (selectionSource === "chart") return <BasisBadge tone="info">{lang === "zh" ? "由坐标图选择" : "Selected from chart"}</BasisBadge>
  if (selectionSource === "filter") return <BasisBadge tone="calc">{lang === "zh" ? "随筛选结果自动选择" : "Auto-selected by filters"}</BasisBadge>
  return <BasisBadge tone="proxy">{lang === "zh" ? "由任务表选择" : "Selected from table"}</BasisBadge>
}

export function CatalysisDetailPanel({
  selectedTask,
  filteredTasks = [],
  selectedIndex = -1,
  selectionSource = "filter",
  selectedComparison,
  lang,
  t,
}) {
  const count = filteredTasks.length
  if (!selectedTask) {
    return (
      <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 12, minWidth: 0, padding: 16 }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <span aria-hidden="true" style={{ background: t.accent, borderRadius: 999, height: 8, width: 8 }} />
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 950 }}>{lang === "zh" ? "选中任务详情" : "Selected Task Inspector"}</div>
        </div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
          {lang === "zh"
            ? "当前筛选条件下暂无催化任务。请放宽领域、产物族或数据状态条件。"
            : "No catalysis task matches the current filters. Try broadening reaction domain, product family, or data status."}
        </div>
      </aside>
    )
  }

  const metrics = lang === "zh" ? selectedTask.keyMetricsZh : selectedTask.keyMetricsEn
  const bridges = lang === "zh" ? selectedTask.missingBridgeMetricsZh : selectedTask.missingBridgeMetricsEn
  const positionText = count > 0 && selectedIndex >= 0
    ? (lang === "zh" ? `来自当前筛选结果 · ${selectedIndex + 1} / ${count}` : `From current filter set · ${selectedIndex + 1} / ${count}`)
    : (lang === "zh" ? "点击坐标图中的点可切换任务" : "Click a point in the chart to switch tasks")

  return (
    <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 12, minWidth: 0, padding: 16 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ alignItems: "center", color: t.textStrong, display: "flex", fontSize: 15, fontWeight: 950, gap: 8 }}>
            <span aria-hidden="true" style={{ background: t.accent, borderRadius: 999, boxShadow: `0 0 0 4px ${t.badgeInfoBg}`, height: 8, width: 8 }} />
            {lang === "zh" ? "选中任务详情" : "Selected Task Inspector"}
          </div>
          <div style={{ color: t.faint, fontSize: 11, marginTop: 6 }}>{positionText}</div>
        </div>
        <SourceBadge selectionSource={selectionSource} lang={lang} />
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, height: 8, marginTop: 14, overflow: "hidden" }}>
        <div style={{ background: t.accent, height: "100%", width: `${Math.min(100, Math.max(8, selectedTask.fieldCompleteness || 0))}%` }} />
      </div>

      <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 950, lineHeight: 1.3, marginTop: 14 }}>
        {lang === "zh" ? selectedTask.taskZh : selectedTask.taskEn}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
        <Chip tone="info">{selectedTask.domainLabel}</Chip>
        <Chip>{selectedTask.modeLabel}</Chip>
        <Chip tone="calc">{selectedTask.productFamilyLabel}</Chip>
        <Chip tone={selectedTask.quantitativeStatus === "curated" ? "info" : "proxy"}>{labelFor(DATA_STATUSES, selectedTask.dataStatusKey, lang)}</Chip>
      </div>

      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, marginTop: 14, textTransform: "uppercase" }}>
        {lang === "zh" ? "关键指标" : "Key metrics"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
        {metrics.map(metric => <Chip key={metric}>{metric}</Chip>)}
      </div>

      {selectedComparison && (
        <Callout tone={selectedComparison.statusKey === "comparable" ? "info" : "warn"}>
          <strong>{lang === "zh" ? selectedComparison.statusZh : selectedComparison.statusEn}</strong>
          <div style={{ marginTop: 5 }}>{lang === "zh" ? selectedComparison.reasonZh : selectedComparison.reasonEn}</div>
        </Callout>
      )}

      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, marginTop: 14, textTransform: "uppercase" }}>
        {lang === "zh" ? "缺失桥梁指标" : "Missing bridge metrics"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
        {bridges.length ? bridges.map(metric => <Chip key={metric} tone="warn">{metric}</Chip>) : <Chip tone="info">{lang === "zh" ? "暂无缺失项" : "No missing items"}</Chip>}
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 14, paddingTop: 12 }}>
        {lang === "zh" ? "点击坐标图中的其他点可切换当前任务。" : "Click another point in the chart to switch the current task."}
      </div>
    </aside>
  )
}
