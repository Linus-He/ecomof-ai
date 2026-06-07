// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, text } from "../FinalScreeningShared"

function tone(status) {
  if (status === "completed") return "pass"
  if (status === "warning" || status === "completed_with_warnings") return "warn"
  if (status === "blocked" || status === "failed") return "fail"
  return "info"
}

export function TraceStepTimeline({ steps = [], activeStepId, setActiveStepId, lang, t, isMobile }) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Step-level Trace Records", "Step-level Trace Records")}
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {steps.map(step => {
          const active = step.id === activeStepId
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 9, color: t.textStrong, cursor: "pointer", display: "grid", gap: 6, minHeight: 88, padding: 10, textAlign: "left" }}
            >
              <span style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ fontSize: 12.4, lineHeight: 1.25 }}>
                  {String(step.step).padStart(2, "0")}. <ChemicalText value={text(lang, step.titleZh, step.title)} />
                </strong>
                <StatusPill tone={tone(step.status)} t={t}>{step.status}</StatusPill>
              </span>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.4 }}>
                {text(lang, "输入", "Input")}: {step.input?.count || 0} · {text(lang, "输出", "Output")}: {step.output?.count || 0}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

