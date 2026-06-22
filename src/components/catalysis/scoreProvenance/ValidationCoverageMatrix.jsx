import { useState } from "react"
import { asArray, EmptyState, palette, text } from "./shared"

const STATUS_TONE = {
  covered: [palette.positiveSoft, palette.positive],
  partial: [palette.accentSoft, palette.accent],
  pending: [palette.bg, palette.faint],
  missing: [palette.riskSoft, palette.risk],
}
const STATUS_LABEL = {
  covered: ["已覆盖", "covered"],
  partial: ["部分", "partial"],
  pending: ["待补", "pending"],
  missing: ["缺失", "missing"],
}

function actionBtn() {
  return { background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.accent, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 32, padding: "7px 10px", textAlign: "center" }
}

export function ValidationCoverageMatrix({ model, summary, lang = "zh", withTestId = true, onOpenActivationCenter, onDownloadTemplate, onViewFeedbackRules }) {
  const items = asArray(model?.items)
  const [open, setOpen] = useState(null)
  if (!items.length) {
    return <div data-testid={withTestId ? "validation-coverage-matrix" : undefined} data-item-count={0} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 12 }}><EmptyState lang={lang} /></div>
  }
  return (
    <div data-testid={withTestId ? "validation-coverage-matrix" : undefined} data-item-count={items.length} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, minWidth: 0, padding: 12 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        {summary ? <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.5 }}>{text(lang, summary.oneLineConclusionZh, summary.oneLineConclusionEn)}</span> : null}
        <span style={{ color: palette.faint, fontSize: 10.5 }}>{model.readinessLevel} · {text(lang, "实验组", "groups")} {model.experimentGroupCount}</span>
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {items.map(item => {
          const [bg, color] = STATUS_TONE[item.status] || STATUS_TONE.pending
          const [sZh, sEn] = STATUS_LABEL[item.status] || STATUS_LABEL.pending
          const isOpen = open === item.id
          return (
            <div key={item.id} style={{ display: "grid", gap: 0 }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} style={{ background: bg, border: `1px solid ${color}`, borderRadius: 8, cursor: "pointer", display: "grid", gap: 4, padding: 9, textAlign: "left" }}>
                <span style={{ color: palette.text, fontSize: 11.5, fontWeight: 800 }}>{text(lang, item.labelZh, item.labelEn)}</span>
                <span style={{ color, fontSize: 10, fontWeight: 900 }}>{text(lang, sZh, sEn)}</span>
              </button>
              {isOpen ? (
                <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.muted, display: "grid", fontSize: 10.5, gap: 3, lineHeight: 1.45, marginTop: 4, padding: 8 }}>
                  {asArray(item.matchedGroups).slice(0, 3).map(g => <span key={g.id} style={{ color: palette.text }}>{g.name} · {g.purpose}</span>)}
                  {asArray(item.matchedGroups).length === 0 ? <span>{text(lang, "暂无对应实验组", "no matching experiment group")}</span> : null}
                  <span style={{ color: palette.faint }}>{item.dataState}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={onOpenActivationCenter} style={actionBtn()}>{text(lang, "打开实验启用中心", "Open Activation Center")}</button>
        <button type="button" onClick={onDownloadTemplate} style={actionBtn()}>{text(lang, "下载同条件数据模板", "Download same-condition template")}</button>
        <button type="button" onClick={onViewFeedbackRules} style={actionBtn()}>{text(lang, "查看反馈规则", "View feedback rules")}</button>
      </div>
      <p style={{ color: palette.risk, fontSize: 11, lineHeight: 1.45, margin: 0 }}>{text(lang, model.headerNoteZh, model.headerNoteEn)}</p>
    </div>
  )
}

export default ValidationCoverageMatrix
