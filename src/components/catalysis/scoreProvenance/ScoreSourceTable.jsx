import { asArray, fmt, palette, text } from "./shared"

function cellValue(row, key, lang) {
  const value = row[key]
  if (value && typeof value === "object") return text(lang, value.zh, value.en)
  if (typeof value === "number") return fmt(value, key === "contribution" || key === "cumulativeValue" ? 4 : 3)
  return value
}

export function ScoreSourceTable({ model, lang = "zh", withTestId = true, open = false }) {
  if (!model) return null
  const columns = asArray(model.columns)
  const rows = asArray(model.rows)
  return (
    <details data-testid={withTestId ? "score-source-table" : undefined} open={open} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: "9px 11px" }}>
      <summary style={{ color: palette.accent, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>
        {text(lang, model.triggerZh, model.triggerEn)} · {text(lang, model.questionZh, model.questionEn)}
      </summary>
      <div style={{ color: palette.muted, fontSize: 11, lineHeight: 1.45, margin: "8px 0" }}>
        {text(lang, model.headerNoteZh, model.headerNoteEn)}
      </div>
      <div style={{ color: palette.faint, fontSize: 11, marginBottom: 8 }}>
        {text(lang, model.displayNameZh, model.displayNameEn)} = {fmt(model.finalValue, 3)} · #{model.rank} · {model.formulaType}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 10.5, fontWeight: 900, padding: "6px 8px", textAlign: "left" }}>
                  {text(lang, col.labelZh, col.labelEn)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label?.en || index}`}>
                {columns.map(col => (
                  <td key={col.key} style={{ borderBottom: `1px solid ${palette.border}`, color: col.key === "label" ? palette.text : palette.muted, fontSize: 10.8, padding: "6px 8px" }}>
                    {cellValue(row, col.key, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export default ScoreSourceTable
