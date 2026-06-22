import { asArray, palette, text } from "./shared"

export function VisualQaChecklistPanel({ model, lang = "zh", withTestId = true }) {
  if (!model) return null
  const items = asArray(model.items)
  return (
    <details data-testid={withTestId ? "visual-qa-checklist" : undefined} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: "9px 11px" }}>
      <summary style={{ color: palette.accent, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>{text(lang, model.titleZh, model.titleEn)}</summary>
      <p style={{ color: palette.muted, fontSize: 11, lineHeight: 1.45, margin: "8px 0" }}>{text(lang, model.noteZh, model.noteEn)}</p>
      <ul style={{ display: "grid", gap: 4, listStyle: "none", margin: 0, padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ color: palette.text, fontSize: 11, lineHeight: 1.45 }}>
            <span style={{ color: palette.faint }}>☐</span> {text(lang, item.labelZh, item.labelEn)}
          </li>
        ))}
      </ul>
    </details>
  )
}

export default VisualQaChecklistPanel
