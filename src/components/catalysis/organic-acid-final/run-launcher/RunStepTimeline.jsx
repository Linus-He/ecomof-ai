// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusBadge, text } from "../FinalScreeningShared"

function tone(status) {
  if (status === "completed") return "pass"
  if (status === "running" || status === "warning") return "warn"
  if (status === "blocked") return "fail"
  return "proxy"
}

export function RunStepTimeline({ steps = [], activeIndex = -1, runStatus = "idle", lang, t, isMobile }) {
  const rows = steps.map((step, index) => {
    if (runStatus === "running") {
      if (index < activeIndex) return { ...step, status: step.status === "warning" ? "warning" : "completed" }
      if (index === activeIndex) return { ...step, status: "running" }
      return { ...step, status: "pending" }
    }
    if (runStatus === "idle") return { ...step, status: "pending" }
    return step
  })

  return (
    <section style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {rows.map(step => (
          <article key={step.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minWidth: 0, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.25 }}>
                {String(step.step).padStart(2, "0")}. <ChemicalText value={text(lang, step.titleZh, step.title)} />
              </strong>
              <StatusBadge tone={tone(step.status)} t={t}>{step.status}</StatusBadge>
            </div>
            <div style={{ color: t.muted, display: "grid", fontSize: 11.6, gap: 4, lineHeight: 1.4 }}>
              <span>{text(lang, "输入", "Input")}: {step.inputCount ?? 0} · {text(lang, "输出", "Output")}: {step.outputCount ?? 0}</span>
              <span><ChemicalText value={text(lang, step.decisionZh, step.decision)} /></span>
              {step.linkedSectionId ? (
                <a href={`#${step.linkedSectionId}`} style={{ color: t.accentText, fontWeight: 900, textDecoration: "none" }}>
                  {text(lang, "查看筛选依据", "View screening basis")}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
