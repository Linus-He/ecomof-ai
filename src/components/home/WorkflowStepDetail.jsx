// @ts-nocheck
import { toolbarBtn } from "../../utils/styles"
import { WorkflowMiniVisual } from "./WorkflowMiniVisuals"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function IpoColumn({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <p>{value}</p>
    </article>
  )
}

export function WorkflowStepDetail({ step, index, active, lang = "en", t, onNavigate, setRef, compact = false }) {
  const shortcuts = step.shortcuts || [step.shortcut]
  return (
    <article
      ref={setRef}
      className="workflow-step-detail"
      data-step-index={index}
      data-active={active ? "true" : "false"}
      id={`workflow-step-${step.id}`}
    >
      <div className="workflow-step-detail-header">
        <div>
          <span>{step.number}</span>
          <h3>{text(lang, step.title.zh, step.title.en)}</h3>
          <p>{text(lang, step.purpose.zh, step.purpose.en)}</p>
        </div>
        <div className="workflow-step-shortcuts">
          {shortcuts.filter(Boolean).map((shortcut) => (
            <button
              key={shortcut.target}
              type="button"
              onClick={() => onNavigate?.(shortcut.target)}
              style={{ ...toolbarBtn(t), minHeight: 40, justifyContent: "center" }}
            >
              {text(lang, shortcut.zh, shortcut.en)}
            </button>
          ))}
        </div>
      </div>

      <div className="workflow-ipo-grid">
        <IpoColumn label={text(lang, "输入", "Input")} value={text(lang, step.input.zh, step.input.en)} />
        <IpoColumn label={text(lang, "处理", "Process")} value={text(lang, step.process.zh, step.process.en)} />
        <IpoColumn label={text(lang, "输出", "Output")} value={text(lang, step.output.zh, step.output.en)} />
      </div>

      <div className="workflow-mini-visual-shell">
        <WorkflowMiniVisual type={step.visual} lang={lang} compact={compact} />
      </div>
    </article>
  )
}
