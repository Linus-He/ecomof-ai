import { asArray, cardStyle, EmptyState, palette, text } from "./shared"

function countsFromModel(model) {
  const items = asArray(model?.items)
  if (items.length) {
    const covered = items.filter(item => item.status === "covered" || item.status === "partial").length
    return { covered, pending: Math.max(0, items.length - covered), total: items.length }
  }
  const rows = asArray(model?.rows)
  const covered = rows.filter(row => row.covered).reduce((sum, row) => sum + (Number(row.count) || 1), 0)
  const total = rows.reduce((sum, row) => sum + Math.max(1, Number(row.count) || 0), 0)
  return { covered, pending: Math.max(0, total - covered), total }
}

function readinessCopy(model, lang) {
  const raw = String(model?.readinessLevel || model?.headerNoteZh || "")
  if (/planning-ready|not performance-validated/i.test(raw)) {
    return text(lang, "可进入实验规划；同条件性能验证尚未完成。", "Ready for experimental planning; same-condition performance validation remains pending.")
  }
  return raw || text(lang, "验证状态待补充。", "Validation status pending.")
}

export function ValidationReadinessDonut({ model, lang = "zh", withTestId = true }) {
  const counts = countsFromModel(model)
  if (!counts.total) {
    return <div data-testid={withTestId ? "validation-readiness-donut" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const coveredRatio = counts.covered / counts.total
  return (
    <div data-testid={withTestId ? "validation-readiness-donut" : undefined} data-row-count={counts.total} style={cardStyle({ background: palette.bg, gap: 11 })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "验证覆盖概览", "Validation coverage overview")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, "汇总最小实验矩阵中已经覆盖与仍需补充的项目。", "Summarizes covered and pending items in the minimum validation matrix.")}</span>
      </div>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: palette.text, fontSize: 24 }}>{Math.round(coveredRatio * 100)}%</strong>
        <span style={{ color: palette.faint, fontSize: 10.8 }}>{text(lang, "当前覆盖比例", "Current coverage")}</span>
      </div>
      <div style={{ background: palette.riskSoft, border: `1px solid ${palette.border}`, borderRadius: 3, height: 14, overflow: "hidden" }}>
        <span style={{ background: palette.positive, display: "block", height: "100%", width: `${coveredRatio * 100}%` }} />
      </div>
      <div style={{ display: "grid", gap: 0, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div style={{ borderRight: `1px solid ${palette.border}`, display: "grid", gap: 3, padding: "6px 10px 6px 0" }}>
          <span style={{ color: palette.faint, fontSize: 10.2, fontWeight: 850 }}>{text(lang, "已覆盖或已规划", "Covered or planned")}</span>
          <strong style={{ color: palette.positive, fontSize: 17 }}>{counts.covered}</strong>
        </div>
        <div style={{ display: "grid", gap: 3, padding: "6px 0 6px 10px" }}>
          <span style={{ color: palette.faint, fontSize: 10.2, fontWeight: 850 }}>{text(lang, "待补项目", "Pending items")}</span>
          <strong style={{ color: palette.risk, fontSize: 17 }}>{counts.pending}</strong>
        </div>
      </div>
      <p style={{ border: `1px solid ${palette.risk}`, borderRadius: 6, color: palette.muted, fontSize: 10.8, lineHeight: 1.5, margin: 0, padding: "7px 9px" }}>
        {readinessCopy(model, lang)}
      </p>
    </div>
  )
}

export default ValidationReadinessDonut
