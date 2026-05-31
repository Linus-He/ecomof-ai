// @ts-nocheck

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function WorkflowStepRail({ steps, activeStep, onSelect, lang = "en" }) {
  return (
    <nav className="workflow-step-rail" aria-label={text(lang, "首页工作流步骤", "Homepage workflow steps")}>
      {steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          data-active={activeStep === index ? "true" : "false"}
          onClick={() => onSelect(index)}
        >
          <span>{step.number}</span>
          <strong>{text(lang, step.title.zh, step.title.en)}</strong>
          <small>{text(lang, step.purpose.zh, step.purpose.en)}</small>
        </button>
      ))}
    </nav>
  )
}
