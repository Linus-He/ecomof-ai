// @ts-nocheck
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodAlgorithmStepper({ steps = [], lang, t }) {
  if (!steps.length) return null
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {steps.map((step, index) => (
        <article
          key={`${step.label}-${index}`}
          style={{
            alignItems: "start",
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 9,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "30px minmax(0, 1fr)",
            padding: 10,
          }}
        >
          <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 900, height: 26, justifyContent: "center", width: 26 }}>
            {index + 1}
          </span>
          <span style={{ display: "grid", gap: 3 }}>
            <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.3 }}>
              <ChemicalText value={text(lang, step.labelZh, step.label)} />
            </strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>
              <ChemicalText value={text(lang, step.descriptionZh, step.description)} />
            </span>
          </span>
        </article>
      ))}
    </div>
  )
}
