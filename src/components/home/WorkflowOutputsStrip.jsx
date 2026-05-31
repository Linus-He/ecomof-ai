// @ts-nocheck
import { toolbarBtn } from "../../utils/styles"
import { workflowOutputs } from "./workflowData"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function WorkflowOutputsStrip({ lang = "en", t, onNavigate }) {
  return (
    <section className="workflow-outputs-strip" aria-label={text(lang, "这套流程最终产出什么", "What this workflow produces")}>
      <div>
        <span>{text(lang, "流程产出", "Workflow outputs")}</span>
        <h3>{text(lang, "这套流程最终产出什么", "What this workflow produces")}</h3>
      </div>
      <div className="workflow-output-grid">
        {workflowOutputs.map((output) => (
          <button
            key={output.en}
            type="button"
            onClick={() => onNavigate?.(output.target)}
            style={{ ...toolbarBtn(t), minHeight: 42 }}
          >
            {text(lang, output.zh, output.en)}
          </button>
        ))}
      </div>
    </section>
  )
}
