// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { formatCount } from "../../utils/databaseIndex/databaseIndexFormatters"
import { buildAlgorithmImprovementTrace } from "../../utils/databaseIndex/algorithmImprovementTrace"

export function AlgorithmImprovementTracePanel({ records = [], topNCount, lang, t }) {
  const trace = useMemo(() => buildAlgorithmImprovementTrace(records, { topNCount }), [records, topNCount])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 12 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: t.textStrong, fontSize: 14 }}>{text(lang, "算法改进追踪", "Algorithm Improvement Trace")}</strong>
          <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}>
            <ChemicalText value={text(
              lang,
              "该链路用于展示样本如何从原始记录进入可审计预览，不代表已经训练预测模型。",
              "This trace shows how samples move from raw records into an auditable preview. It does not represent a trained predictive model."
            )} />
          </span>
        </div>
        <StatusPill tone="warn" t={t}>{text(lang, "非最终推荐", "not final recommendation")}</StatusPill>
      </header>

      <ol style={{ display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
        {trace.stages.map((stage, index) => (
          <li key={stage.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 12.6 }}>{index + 1}. {text(lang, stage.labelZh, stage.label)}</strong>
              <span style={{ color: t.muted, fontSize: 11.4 }}>
                {text(lang, "输入", "in")} {formatCount(stage.inputCount)} · {text(lang, "输出", "out")} {formatCount(stage.outputCount)}
              </span>
            </div>
            <span style={{ color: t.faint, fontSize: 11, lineHeight: 1.4 }}><ChemicalText value={text(lang, stage.boundaryZh, stage.boundary)} /></span>
          </li>
        ))}
      </ol>

      <p style={{ color: t.muted, fontSize: 11.4, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, trace.inspirationZh, trace.inspiration)} />
      </p>
    </section>
  )
}

export default AlgorithmImprovementTracePanel
