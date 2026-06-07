// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { text } from "../FinalScreeningShared"

export function TraceEmptyState({ lang, t }) {
  return (
    <section style={{ background: t.surface, border: `1px dashed ${t.borderStrong || t.border}`, borderRadius: 10, color: t.muted, display: "grid", gap: 6, fontSize: 12.5, lineHeight: 1.55, padding: 12 }}>
      <strong style={{ color: t.textStrong, fontSize: 13 }}>
        {text(lang, "等待一次 Run Screening", "Waiting for a Run Screening event")}
      </strong>
      <ChemicalText value={text(
        lang,
        "点击上方 Run Launcher 后，这里会显示 runId、step-level trace、候选决策、公式权重、证据来源和导出报告。",
        "After the Run Launcher executes, this panel will show runId, step-level trace, candidate decisions, formula weights, evidence links, and export reports."
      )} />
    </section>
  )
}

