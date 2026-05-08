import { BasisBadge, Callout } from "../../shared"
import {
  CATALYTIC_MODES,
  DATA_STATUSES,
  FEEDSTOCKS,
  PRODUCT_FAMILIES,
  REACTION_DOMAINS,
  labelFor,
} from "./catalysisData"

function Chip({ children, tone = "proxy" }) {
  return <BasisBadge tone={tone}>{children}</BasisBadge>
}

function ActionButton({ children, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        color: t.accentText,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 850,
        minHeight: 32,
        padding: "6px 10px",
      }}
    >
      {children}
    </button>
  )
}

function SourceBadge({ selectionSource, lang }) {
  if (selectionSource === "chart") return <BasisBadge tone="info">{lang === "zh" ? "由坐标图选择" : "Selected from chart"}</BasisBadge>
  if (selectionSource === "list") return <BasisBadge tone="proxy">{lang === "zh" ? "由任务列表选择" : "Selected from task list"}</BasisBadge>
  return <BasisBadge tone="calc">{lang === "zh" ? "等待选择" : "Waiting for selection"}</BasisBadge>
}

function activeFilterChips(filters, lang) {
  const config = [
    ["domain", REACTION_DOMAINS],
    ["mode", CATALYTIC_MODES],
    ["feedstock", FEEDSTOCKS],
    ["productFamily", PRODUCT_FAMILIES],
    ["dataStatus", DATA_STATUSES],
  ]
  return config
    .filter(([key]) => filters[key] && filters[key] !== "all")
    .map(([key, options]) => ({ key, label: labelFor(options, filters[key], lang) }))
}

function TaskOption({ task, lang, onSelectTask, t }) {
  return (
    <button
      type="button"
      onClick={() => onSelectTask(task)}
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        color: t.textStrong,
        cursor: "pointer",
        padding: 10,
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.35 }}>{lang === "zh" ? task.taskZh : task.taskEn}</div>
      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.4, marginTop: 5 }}>{task.domainLabel} · {task.modeLabel}</div>
    </button>
  )
}

function GuideState({ filteredTasks, lang, t }) {
  const domainLabels = Array.from(new Set(filteredTasks.map(task => task.domainLabel))).slice(0, 6)
  const modeLabels = Array.from(new Set(filteredTasks.map(task => task.modeLabel))).slice(0, 4)
  return (
    <>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <Title lang={lang} t={t} title={lang === "zh" ? "选中任务详情" : "Selected Task Inspector"} />
        <BasisBadge tone="calc">{lang === "zh" ? "等待选择" : "Waiting for selection"}</BasisBadge>
      </div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
        {lang === "zh"
          ? "请点击坐标图中的任意点，或从任务列表中选择一个催化路径。"
          : "Click any point in the chart, or choose a catalysis pathway from the task list."}
      </div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, marginTop: 14, textTransform: "uppercase" }}>
        {lang === "zh" ? "当前图表覆盖范围" : "Current chart coverage"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {[...domainLabels, ...modeLabels].map(label => <Chip key={label} tone="info">{label}</Chip>)}
      </div>
    </>
  )
}

function FilterState({ filters, filteredTasks, lang, onSelectTask, t }) {
  const chips = activeFilterChips(filters, lang)
  if (filteredTasks.length === 0) {
    return (
      <>
        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <Title lang={lang} t={t} title={lang === "zh" ? "筛选结果" : "Filter Results"} />
          <BasisBadge tone="warn">{lang === "zh" ? "暂无任务" : "No tasks"}</BasisBadge>
        </div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
          {lang === "zh"
            ? "当前筛选条件下暂无催化任务。请放宽领域、产物族或数据状态条件。"
            : "No catalysis task matches the current filters. Try broadening reaction domain, product family, or data status."}
        </div>
      </>
    )
  }
  return (
    <>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <Title lang={lang} t={t} title={lang === "zh" ? "筛选结果" : "Filter Results"} />
        <BasisBadge tone="calc">{lang === "zh" ? "请选择任务" : "Select a task"}</BasisBadge>
      </div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
        {lang === "zh"
          ? `当前筛选得到 ${filteredTasks.length} 个催化任务，请点击坐标图中的点查看详情。`
          : `${filteredTasks.length} catalysis tasks match the current filters. Click a chart point to inspect details.`}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {chips.map(chip => <Chip key={chip.key} tone="info">{chip.label}</Chip>)}
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        {filteredTasks.slice(0, 4).map(task => <TaskOption key={task.id} task={task} lang={lang} onSelectTask={onSelectTask} t={t} />)}
      </div>
    </>
  )
}

function Title({ title, t }) {
  return (
    <div style={{ alignItems: "center", color: t.textStrong, display: "flex", fontSize: 15, fontWeight: 950, gap: 8 }}>
      <span aria-hidden="true" style={{ background: t.accent, borderRadius: 999, boxShadow: `0 0 0 4px ${t.badgeInfoBg}`, height: 8, width: 8 }} />
      {title}
    </div>
  )
}

export function SelectionInspector({
  filters,
  filteredTasks = [],
  onClearSelection,
  onSelectTask,
  selectedTask,
  selectedIndex = -1,
  selectionSource = "none",
  selectedComparison,
  lang,
  t,
}) {
  const hasActiveFilters = activeFilterChips(filters, lang).length > 0
  const count = filteredTasks.length
  const metrics = selectedTask ? (lang === "zh" ? selectedTask.keyMetricsZh : selectedTask.keyMetricsEn) : []
  const bridges = selectedTask ? (lang === "zh" ? selectedTask.missingBridgeMetricsZh : selectedTask.missingBridgeMetricsEn) : []

  return (
    <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderLeft: `4px solid ${t.accent}`, borderRadius: 12, minWidth: 0, padding: 16 }}>
      {!selectedTask && !hasActiveFilters && <GuideState filteredTasks={filteredTasks} lang={lang} t={t} />}
      {!selectedTask && hasActiveFilters && <FilterState filters={filters} filteredTasks={filteredTasks} lang={lang} onSelectTask={onSelectTask} t={t} />}

      {selectedTask && (
        <>
          <div style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <Title lang={lang} t={t} title={lang === "zh" ? "选中任务详情" : "Selected Task Inspector"} />
              <div style={{ color: t.faint, fontSize: 11, marginTop: 6 }}>
                {lang === "zh" ? `来自当前筛选结果 · ${selectedIndex + 1} / ${count}` : `From current filter set · ${selectedIndex + 1} / ${count}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <SourceBadge selectionSource={selectionSource} lang={lang} />
              <ActionButton onClick={onClearSelection} t={t}>{lang === "zh" ? "清除选择" : "Clear selection"}</ActionButton>
            </div>
          </div>

          <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 950, lineHeight: 1.3, marginTop: 14 }}>
            {lang === "zh" ? selectedTask.taskZh : selectedTask.taskEn}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
            <Chip tone="info">{selectedTask.domainLabel}</Chip>
            <Chip>{selectedTask.modeLabel}</Chip>
            <Chip>{selectedTask.feedstockLabel}</Chip>
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
            {lang === "zh" ? "点击图表中的其他点可切换当前任务。" : "Click another point in the chart to switch the current task."}
          </div>
        </>
      )}
    </aside>
  )
}
