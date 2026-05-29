// @ts-nocheck
import { MethodArchitectureDiagram } from "./MethodArchitectureDiagram"
import { MethodArrow } from "./MethodArrow"
import { MethodBlock } from "./MethodBlock"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function CatalysisWorkflowDiagram({ t, lang = "en" }) {
  const flow = [
    {
      title: text(lang, "Raw catalysis record", "Raw catalysis record"),
      items: ["catalyst", "reaction condition", "substrate / CO₂ source", "product metrics", "evidence source"],
      tone: "input",
    },
    {
      title: text(lang, "Record normalization", "Record normalization"),
      subtitle: text(lang, "统一单位、条件字段和证据状态。", "Unify units, condition fields, and evidence status."),
      tone: "process",
    },
    {
      title: text(lang, "Structured tables", "Structured tables"),
      items: ["catalyst_records", "reaction_conditions", "product_metrics", "evidence_records"],
      tone: "highlight",
    },
    {
      title: text(lang, "Comparability check", "Comparability check"),
      subtitle: text(lang, "判断实验条件是否可横向比较。", "Check whether experimental conditions are comparable."),
      tone: "quality",
    },
    {
      title: text(lang, "Coordinate map / task table / CRITIC case", "Coordinate map / task table / CRITIC case"),
      subtitle: text(lang, "支持通用催化记录工作台，不限定为有机酸案例。", "Supports a general catalysis-record workbench, not only the organic-acid case."),
      tone: "output",
    },
  ]

  return (
    <MethodArchitectureDiagram
      t={t}
      eyebrow={text(lang, "催化数据工作流", "Catalysis Data Workflow")}
      title={text(lang, "Catalysis Record Structuring Pipeline", "Catalysis Record Structuring Pipeline")}
      subtitle={text(
        lang,
        "把催化实验记录拆成可复核表结构，再进入坐标图、任务表和探索性 CRITIC case。",
        "Split catalysis records into reviewable table structures before coordinate maps, task tables, and exploratory CRITIC cases."
      )}
    >
      <div className="method-horizontal-flow method-catalysis-flow">
        {flow.map((step, index) => (
          <div key={step.title} className="method-horizontal-step">
            <MethodBlock t={t} title={step.title} subtitle={step.subtitle} items={step.items} tone={step.tone} compact />
            {index < flow.length - 1 && <MethodArrow t={t} direction="horizontal" />}
          </div>
        ))}
      </div>
    </MethodArchitectureDiagram>
  )
}
