import { BasisBadge } from "../../shared"
import { DATA_STATUSES, labelFor } from "./catalysisData"

function Field({ label, value, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.45, marginTop: 5 }}>{value || "—"}</div>
    </div>
  )
}

export function CatalysisDetailPanel({ selectedTask, filteredCount = 0, selectedComparison, lang, t }) {
  if (!selectedTask) {
    return (
      <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, minWidth: 0 }}>
        <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{lang === "zh" ? "当前选择" : "Current selection"}</div>
        <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, lineHeight: 1.35, marginTop: 8 }}>
          {lang === "zh" ? "当前筛选条件下暂无催化任务" : "No catalysis task matches the current filters"}
        </div>
        <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
          {lang === "zh"
            ? "当前筛选条件下暂无催化任务。请放宽 reaction domain、product family 或 data status 条件。"
            : "No catalysis task matches the current filters. Try broadening reaction domain, product family, or data status."}
        </div>
      </aside>
    )
  }
  return (
    <aside style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{lang === "zh" ? "当前选择" : "Current selection"}</div>
          <div style={{ color: t.textStrong, fontSize: 16, fontWeight: 950, lineHeight: 1.25, marginTop: 5 }}>{lang === "zh" ? selectedTask.taskZh : selectedTask.taskEn}</div>
        </div>
        <BasisBadge tone={selectedTask.quantitativeStatus === "curated" ? "info" : "proxy"}>{selectedTask.quantitativeStatus}</BasisBadge>
      </div>
      <div style={{ color: t.faint, fontSize: 10, marginTop: 8 }}>
        {lang === "zh" ? `当前筛选结果：${filteredCount} 项任务` : `${filteredCount} tasks in current filter set`}
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <Field label={lang === "zh" ? "领域 / 方式" : "Domain / mode"} value={`${selectedTask.domainLabel} · ${selectedTask.modeLabel}`} t={t} />
        <Field label={lang === "zh" ? "原料 / 产物族" : "Feedstock / product"} value={`${selectedTask.feedstockLabel} → ${selectedTask.productFamilyLabel}`} t={t} />
        <Field label={lang === "zh" ? "关键指标" : "Key metrics"} value={(lang === "zh" ? selectedTask.keyMetricsZh : selectedTask.keyMetricsEn).join(" · ")} t={t} />
        <Field label={lang === "zh" ? "条件语境" : "Condition context"} value={(lang === "zh" ? selectedTask.conditionContextZh : selectedTask.conditionContextEn).join(" · ")} t={t} />
        <Field label={lang === "zh" ? "数据状态" : "Data status"} value={labelFor(DATA_STATUSES, selectedTask.dataStatusKey, lang)} t={t} />
      </div>
      {selectedComparison && (
        <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 12, paddingTop: 12 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{lang === "zh" ? "可比性判断" : "Comparability"}</div>
          <div style={{ marginTop: 7 }}><BasisBadge tone={selectedComparison.statusKey === "comparable" ? "info" : selectedComparison.statusKey === "not-comparable" ? "warn" : "proxy"}>{lang === "zh" ? selectedComparison.statusZh : selectedComparison.statusEn}</BasisBadge></div>
          <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{lang === "zh" ? selectedComparison.reasonZh : selectedComparison.reasonEn}</div>
          <Field label={lang === "zh" ? "缺失桥梁指标" : "Missing bridge metrics"} value={(lang === "zh" ? selectedComparison.missingBridgeMetricsZh : selectedComparison.missingBridgeMetricsEn).join(" · ")} t={t} />
        </div>
      )}
    </aside>
  )
}
