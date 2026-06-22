import { asArray, palette, text } from "./shared"

const ROLE_TONE = {
  primary: [palette.accentSoft, palette.accent, ["主评分", "primary"]],
  legacy: [palette.bg, palette.faint, ["历史", "legacy"]],
  auxiliary: [palette.bg, palette.faint, ["辅助", "auxiliary"]],
  factor: [palette.positiveSoft, palette.positive, ["因子", "factor"]],
}

export function TerminologyCrosswalkPanel({ model, lang = "zh", withTestId = true }) {
  if (!model) return null
  const terms = asArray(model.terms)
  return (
    <details data-testid={withTestId ? "terminology-crosswalk" : undefined} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: "9px 11px" }}>
      <summary style={{ color: palette.accent, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>
        {text(lang, model.titleZh, model.titleEn)} · HGCPS / OACS / DMRS
      </summary>
      <p style={{ color: palette.muted, fontSize: 11, lineHeight: 1.45, margin: "8px 0" }}>{text(lang, model.firstMentionNoteZh, model.firstMentionNoteEn)}</p>
      <div style={{ display: "grid", gap: 6 }}>
        {terms.map(term => {
          const [bg, color, label] = ROLE_TONE[term.role] || ROLE_TONE.factor
          return (
            <div key={term.acronym} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 7, display: "grid", gap: 3, padding: 8 }}>
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
                <strong style={{ color: palette.text, fontSize: 11.8 }}>{term.acronym}</strong>
                <span style={{ background: bg, border: `1px solid ${color}`, borderRadius: 999, color, fontSize: 9, fontWeight: 900, padding: "2px 7px" }}>{text(lang, label[0], label[1])}</span>
                <span style={{ color: palette.muted, fontSize: 10.5 }}>{text(lang, term.nameZh, term.nameEn)}</span>
              </div>
              <span style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.45 }}>{text(lang, term.noteZh, term.noteEn)}</span>
            </div>
          )
        })}
      </div>
    </details>
  )
}

export default TerminologyCrosswalkPanel
