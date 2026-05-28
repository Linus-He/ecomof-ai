import { BlockFormula, InlineFormula, SCIENTIFIC_TOKEN_FONT } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodFormulaCard({ formula, lang, t }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.3 }}>
          {text(lang, formula.labelZh, formula.label)}
        </strong>
        <span style={{ color: t.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 850 }}>
          {formula.id}
        </span>
      </div>
      <BlockFormula math={formula.latex} fallback={formula.fallback} t={t} />
      <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>
        {text(lang, formula.explanationZh, formula.explanation)}
      </p>
    </article>
  )
}

export function MethodInlineFormula({ math, fallback }) {
  return (
    <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}>
      <InlineFormula math={math} fallback={fallback} />
    </span>
  )
}
