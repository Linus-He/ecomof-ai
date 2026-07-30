// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"

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
            <span style={{ borderLeft: `2px solid ${t.border}`, color: t.faint, fontSize: 11.2, lineHeight: 1.58, marginTop: 3, paddingLeft: 8 }}>
              {text(
                lang,
                "执行约束：仅接收上一阶段已通过身份、单位与来源检查的状态；若条件不满足，本步保留阻断原因并停止向正式结果传递。",
                "Execution constraint: only states that passed identity, unit, and provenance checks in the previous stage are accepted. Unmet conditions retain a blocking reason and do not propagate into formal results.",
              )}
            </span>
          </span>
        </article>
      ))}
    </div>
  )
}
