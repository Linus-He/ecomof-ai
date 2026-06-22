import { useState } from "react"
import { asArray, EmptyState, palette, text } from "./shared"

const STATUS_TONE = {
  covered: [palette.positiveSoft, palette.positive],
  partial: [palette.accentSoft, palette.accent],
  pending: [palette.bg, palette.faint],
  missing: [palette.riskSoft, palette.risk],
  risk: [palette.riskSoft, palette.risk],
}

const STATUS_LABEL = {
  covered: ["覆盖", "covered"],
  partial: ["部分", "partial"],
  pending: ["待补", "pending"],
  missing: ["缺失", "missing"],
  risk: ["风险", "risk"],
}

function cellText(cell, lang) {
  if (cell.metric === "confidence" || cell.metric === "risk") return String(cell.value)
  return String(cell.value)
}

export function PathwayEvidenceHeatmap({ model, lang = "zh", withTestId = true }) {
  const rows = asArray(model?.rows)
  const columns = asArray(model?.columns)
  const [open, setOpen] = useState(null)
  if (!rows.length) {
    return <div data-testid={withTestId ? "pathway-evidence-heatmap" : undefined} data-row-count={0} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}><EmptyState lang={lang} /></div>
  }
  const gridCols = `minmax(120px, 1.4fr) repeat(${columns.length}, minmax(64px, 1fr))`
  return (
    <div data-testid={withTestId ? "pathway-evidence-heatmap" : undefined} data-row-count={rows.length} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, overflowX: "auto", padding: 12 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.4 }}>{text(lang, "纵轴为路径步骤，横轴为证据 / 置信 / 描述符 / 风险；点击格子查看来源字段。", "Rows are pathway steps; columns are evidence / confidence / descriptor / risk. Click a cell for source fields.")}</span>
      </div>
      <div style={{ display: "grid", gap: 5, minWidth: 360 }}>
        <div style={{ display: "grid", gap: 5, gridTemplateColumns: gridCols }}>
          <span />
          {columns.map(col => <span key={col.key} style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textAlign: "center", textTransform: "uppercase" }}>{text(lang, col.labelZh, col.labelEn)}</span>)}
        </div>
        {rows.map(row => (
          <div key={row.stepId} style={{ display: "grid", gap: 5 }}>
            <div style={{ alignItems: "center", display: "grid", gap: 5, gridTemplateColumns: gridCols }}>
              <span style={{ color: palette.text, fontSize: 11, fontWeight: 700, lineHeight: 1.25, minWidth: 0 }}>{text(lang, row.labelZh, row.labelEn)}</span>
              {asArray(row.cells).map(cell => {
                const [bg, color] = STATUS_TONE[cell.status] || STATUS_TONE.pending
                const [sZh, sEn] = STATUS_LABEL[cell.status] || STATUS_LABEL.pending
                return (
                  <button
                    key={cell.metric}
                    type="button"
                    onClick={() => setOpen(open === `${row.stepId}-${cell.metric}` ? null : `${row.stepId}-${cell.metric}`)}
                    title={`${text(lang, cell.labelZh, cell.labelEn)}: ${text(lang, sZh, sEn)}`}
                    style={{ alignItems: "center", background: bg, border: `1px solid ${color}`, borderRadius: 6, color, cursor: "pointer", display: "grid", fontSize: 10.5, fontWeight: 800, justifyItems: "center", minHeight: 34, padding: "4px 2px" }}
                  >
                    <span>{cellText(cell, lang)}</span>
                    <span style={{ fontSize: 8.5, opacity: 0.85 }}>{text(lang, sZh, sEn)}</span>
                  </button>
                )
              })}
            </div>
            {open && open.startsWith(`${row.stepId}-`) ? (
              <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.muted, fontSize: 10.5, lineHeight: 1.45, padding: 8 }}>
                {text(lang, "来源字段", "Source fields")}: {asArray(row.sourceFields).join(" · ")} · {text(lang, "数据等级", "grade")} {row.dataGrade} · {text(lang, "缺失描述符", "missing")} {row.missingDescriptorCount}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.4, margin: 0 }}>{text(lang, model.headerNoteZh, model.headerNoteEn)}</p>
    </div>
  )
}

export default PathwayEvidenceHeatmap
