// @ts-nocheck
import { BasisBadge, Callout } from "../../shared"
import {
  CATALYTIC_MODES,
  DATA_STATUSES,
  FEEDSTOCKS,
  PRODUCT_FAMILIES,
  REACTION_DOMAINS,
  labelFor,
} from "./catalysisData"

const FILTER_LABELS = {
  domain: ["Domain", "领域"],
  mode: ["Mode", "方式"],
  feedstock: ["Feedstock", "原料"],
  productFamily: ["Product family", "产物族"],
  dataStatus: ["Data status", "数据状态"],
}

function actionButtonStyle(t) {
  return {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.accentText,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    minHeight: 34,
    padding: "7px 10px",
  }
}

function activeFilters(filters, lang) {
  const config = [
    ["domain", REACTION_DOMAINS],
    ["mode", CATALYTIC_MODES],
    ["feedstock", FEEDSTOCKS],
    ["productFamily", PRODUCT_FAMILIES],
    ["dataStatus", DATA_STATUSES],
  ]
  return config
    .filter(([key]) => filters[key] && filters[key] !== "all")
    .map(([key, options]) => ({
      key,
      name: lang === "zh" ? FILTER_LABELS[key][1] : FILTER_LABELS[key][0],
      value: labelFor(options, filters[key], lang),
    }))
}

function Header({ badge, lang, title, t }) {
  return (
    <div style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
      <div>
        <div style={{ alignItems: "center", color: t.textStrong, display: "flex", fontSize: 16, fontWeight: 950, gap: 9 }}>
          <span aria-hidden="true" style={{ background: t.accent, borderRadius: 6, boxShadow: `0 0 0 4px ${t.badgeInfoBg}`, height: 8, width: 8 }} />
          {title}
        </div>
        <div style={{ color: t.faint, fontSize: 11, marginTop: 5 }}>
          {lang === "zh" ? "动态分析面板" : "Dynamic analysis inspector"}
        </div>
      </div>
      {badge}
    </div>
  )
}

function DefinitionList({ items, t }) {
  return (
    <dl style={{ display: "grid", gap: 8, margin: 0 }}>
      {items.map(item => (
        <div key={item.label} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, gridTemplateColumns: "86px minmax(0, 1fr)", paddingTop: 8 }}>
          <dt style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{item.label}</dt>
          <dd style={{ color: t.textStrong, fontSize: 12, fontWeight: 760, lineHeight: 1.45, margin: 0 }}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Section({ children, title, t }) {
  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </section>
  )
}

function TaskRow({ index, lang, onSelectTask, task, t }) {
  const missing = (lang === "zh" ? task.missingBridgeMetricsZh : task.missingBridgeMetricsEn)[0]
  return (
    <button
      type="button"
      onClick={() => onSelectTask(task)}
      style={{
        background: "transparent",
        border: 0,
        borderTop: `1px solid ${t.divider}`,
        color: t.textStrong,
        cursor: "pointer",
        display: "grid",
        gap: 3,
        padding: "10px 0",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{ color: t.faint, fontSize: 12, fontWeight: 900 }}>{index + 1}.</span>
        <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.35 }}>{lang === "zh" ? task.taskZh : task.taskEn}</span>
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45, paddingLeft: 22 }}>
        {task.modeLabel} · {labelFor(DATA_STATUSES, task.dataStatusKey, lang)} · {lang === "zh" ? "主要缺失项" : "main gap"}: {missing || "—"}
      </div>
    </button>
  )
}

function interpretationFor(task, lang) {
  const status = labelFor(DATA_STATUSES, task.dataStatusKey, lang)
  if (lang === "zh") {
    return `这是一条${task.domainLabel}路径，采用${task.modeLabel}语境，产物族为${task.productFamilyLabel}。当前记录处于${status}状态，适合用于路径说明、数据整理和可比性判断，不适合直接做横向性能结论。`
  }
  return `This ${task.domainLabel} pathway uses a ${task.modeLabel} context and targets the ${task.productFamilyLabel} product family. Its record status is ${status}, so it is suitable for pathway explanation, curation, and comparability assessment, not direct performance conclusion.`
}

function GuideState({ lang, t }) {
  return (
    <>
      <Header
        lang={lang}
        t={t}
        title={lang === "zh" ? "选中任务详情" : "Selected Task Inspector"}
        badge={<BasisBadge tone="calc">{lang === "zh" ? "等待选择" : "Waiting for selection"}</BasisBadge>}
      />
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, lineHeight: 1.55, marginTop: 16 }}>
        {lang === "zh"
          ? "尚未选择具体催化任务。点击坐标图中的点，查看该任务的条件强度、数据准备度与可比性判断。"
          : "No catalysis task is selected yet. Click a point in the chart to inspect condition intensity, data readiness, and comparability context."}
      </div>
      <div style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 14, paddingTop: 12 }}>
        {lang === "zh"
          ? "当前图表显示全部催化任务；上方筛选器用于限定任务范围。"
          : "The chart currently shows all catalysis tasks. Use the filters above to narrow the scope."}
      </div>
    </>
  )
}

function FilterState({ filters, filteredTasks, lang, onSelectTask, t }) {
  const entries = activeFilters(filters, lang)
  if (filteredTasks.length === 0) {
    return (
      <>
        <Header
          lang={lang}
          t={t}
          title={lang === "zh" ? "筛选结果" : "Filter Results"}
          badge={<BasisBadge tone="warn">{lang === "zh" ? "暂无任务" : "No tasks"}</BasisBadge>}
        />
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>
          {lang === "zh"
            ? "当前筛选条件下暂无催化任务。请放宽领域、产物族或数据状态条件。"
            : "No catalysis task matches the current filters. Try broadening reaction domain, product family, or data status."}
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        lang={lang}
        t={t}
        title={lang === "zh" ? "筛选结果" : "Filter Results"}
        badge={<BasisBadge tone="calc">{lang === "zh" ? "等待任务选择" : "Select a task"}</BasisBadge>}
      />
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, lineHeight: 1.55, marginTop: 14 }}>
        {lang === "zh"
          ? `当前筛选得到 ${filteredTasks.length} 个催化任务。`
          : `${filteredTasks.length} catalysis tasks match the current filters.`}
      </div>
      <Section title={lang === "zh" ? "筛选条件" : "Active filters"} t={t}>
        <DefinitionList items={entries.map(entry => ({ label: entry.name, value: entry.value }))} t={t} />
      </Section>
      <Section title={lang === "zh" ? "可选任务" : "Selectable tasks"} t={t}>
        <div>
          {filteredTasks.slice(0, 4).map((task, index) => (
            <TaskRow key={task.id} index={index} lang={lang} onSelectTask={onSelectTask} task={task} t={t} />
          ))}
        </div>
      </Section>
    </>
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
  const entries = activeFilters(filters, lang)
  const hasActiveFilters = entries.length > 0
  const metrics = selectedTask ? (lang === "zh" ? selectedTask.keyMetricsZh : selectedTask.keyMetricsEn) : []
  const bridges = selectedTask ? (lang === "zh" ? selectedTask.missingBridgeMetricsZh : selectedTask.missingBridgeMetricsEn) : []
  const sourceText = selectionSource === "chart"
    ? (lang === "zh" ? "由坐标图选择" : "Selected from chart")
    : (lang === "zh" ? "由任务列表选择" : "Selected from task list")

  return (
    <aside style={{ background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 12, minWidth: 0, padding: 18 }}>
      {!selectedTask && !hasActiveFilters && <GuideState lang={lang} t={t} />}
      {!selectedTask && hasActiveFilters && <FilterState filters={filters} filteredTasks={filteredTasks} lang={lang} onSelectTask={onSelectTask} t={t} />}

      {selectedTask && (
        <>
          <Header
            lang={lang}
            t={t}
            title={lang === "zh" ? "选中任务详情" : "Selected Task Inspector"}
            badge={<BasisBadge tone={selectedTask.quantitativeStatus === "curated" ? "info" : "proxy"}>{labelFor(DATA_STATUSES, selectedTask.dataStatusKey, lang)}</BasisBadge>}
          />
          <div style={{ color: t.faint, fontSize: 11, marginTop: 7 }}>
            {sourceText} · {lang === "zh" ? `当前结果 ${selectedIndex + 1} / ${filteredTasks.length}` : `result ${selectedIndex + 1} / ${filteredTasks.length}`}
          </div>

          <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 950, lineHeight: 1.32, marginTop: 14 }}>
            {lang === "zh" ? selectedTask.taskZh : selectedTask.taskEn}
          </div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 10 }}>
            {interpretationFor(selectedTask, lang)}
          </div>

          <Section title={lang === "zh" ? "基础信息" : "Basic metadata"} t={t}>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "领域" : "Domain", value: selectedTask.domainLabel },
                { label: lang === "zh" ? "方式" : "Mode", value: selectedTask.modeLabel },
                { label: lang === "zh" ? "原料" : "Feedstock", value: selectedTask.feedstockLabel },
                { label: lang === "zh" ? "产物族" : "Product family", value: selectedTask.productFamilyLabel },
                { label: lang === "zh" ? "条件语境" : "Condition context", value: (lang === "zh" ? selectedTask.conditionContextZh : selectedTask.conditionContextEn).join("、") },
                { label: lang === "zh" ? "关键指标" : "Key metrics", value: metrics.join("、") },
              ]}
            />
          </Section>

          <Section title={lang === "zh" ? "可比性判断" : "Comparison readiness"} t={t}>
            <Callout tone={selectedComparison?.statusKey === "comparable" ? "info" : "warn"}>
              <strong>{selectedComparison ? (lang === "zh" ? selectedComparison.statusZh : selectedComparison.statusEn) : (lang === "zh" ? "尚未选择任务对" : "No task pair selected")}</strong>
              <div style={{ marginTop: 5 }}>
                {selectedComparison
                  ? (lang === "zh" ? selectedComparison.reasonZh : selectedComparison.reasonEn)
                  : (lang === "zh" ? "选择两项任务后，可比性判断会在这里显示。" : "Select two tasks to show comparability reasoning here.")}
              </div>
            </Callout>
          </Section>

          <Section title={lang === "zh" ? "缺失证据或桥梁指标" : "Missing evidence or bridge metrics"} t={t}>
            <ol style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
              {bridges.length
                ? bridges.map(metric => <li key={metric}>{metric}</li>)
                : <li>{lang === "zh" ? "暂无缺失项" : "No missing items"}</li>}
            </ol>
          </Section>

          <Section title={lang === "zh" ? "下一步操作" : "Next action"} t={t}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={onClearSelection} style={actionButtonStyle(t)}>{lang === "zh" ? "清除选择" : "Clear selection"}</button>
              <button type="button" onClick={() => onSelectTask(selectedTask)} style={actionButtonStyle(t)}>{lang === "zh" ? "在图中高亮" : "Highlight in chart"}</button>
            </div>
            <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>
              {lang === "zh" ? "点击图表中的其他点可切换当前任务。" : "Click another point in the chart to switch the current task."}
            </div>
          </Section>
        </>
      )}
    </aside>
  )
}
