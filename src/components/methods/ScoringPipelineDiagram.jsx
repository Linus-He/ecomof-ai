import { MethodArchitectureDiagram, scrollToMethodTarget } from "./MethodArchitectureDiagram"
import { MethodArrow } from "./MethodArrow"
import { MethodBlock } from "./MethodBlock"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function ScoringPipelineDiagram({ t, lang = "en" }) {
  const flow = [
    {
      title: text(lang, "Raw MOF candidates / CIF / Literature data", "Raw MOF candidates / CIF / Literature data"),
      subtitle: text(lang, "候选材料、结构文件、文献字段与 seed/demo 数据进入同一数据入口。", "Candidate records, structure files, literature fields, and seed/demo data enter one input surface."),
      tone: "input",
    },
    {
      title: "Descriptor Registry",
      items: ["unit", "direction", "normalizer", "missing policy", "evidence requirement"],
      tone: "highlight",
      onClick: () => scrollToMethodTarget("registry-viewer"),
    },
    {
      title: text(lang, "Descriptor Extraction", "Descriptor Extraction"),
      subtitle: text(lang, "把记录字段解析为统一描述符值。", "Parse record fields into normalized descriptor inputs."),
      tone: "process",
    },
    {
      title: text(lang, "Normalization", "Normalization"),
      subtitle: text(lang, "按 benefit / cost 方向进行可比化。", "Make values comparable with benefit / cost direction awareness."),
      tone: "process",
    },
    {
      title: text(lang, "Weighting Engine", "Weighting Engine"),
      items: ["Manual", "Equal", "CRITIC", "Hybrid"],
      tone: "highlight",
      onClick: () => scrollToMethodTarget("critic-weighting"),
    },
    {
      title: text(lang, "Scoring Engine", "Scoring Engine"),
      subtitle: text(lang, "计算候选分数与描述符贡献。", "Compute candidate scores and descriptor contributions."),
      tone: "process",
    },
    {
      title: text(lang, "Ranking Engine", "Ranking Engine"),
      subtitle: text(lang, "生成排序、rank shift 与稳健性提示。", "Generate ranks, rank shifts, and robustness prompts."),
      tone: "process",
    },
    {
      title: text(lang, "Explanation Layer", "Explanation Layer"),
      subtitle: text(lang, "连接贡献、缺失、证据与解释抽屉。", "Connect contributions, missingness, evidence, and explanation drawers."),
      tone: "highlight",
      onClick: () => scrollToMethodTarget("why-this-result-ui"),
    },
    {
      title: text(lang, "Decision-support Output", "Decision-support Output"),
      items: ["score", "rank", "descriptor completeness", "main driver", "evidence warning", "why this result"],
      tone: "output",
    },
  ]

  const qualityItems = text(lang,
    ["字段级来源", "证据等级", "缺失数据", "Demo / seed 数据状态"],
    ["Field-level provenance", "Evidence level", "Missing data", "Demo / seed data status"]
  )

  return (
    <MethodArchitectureDiagram
      t={t}
      eyebrow={text(lang, "系统总图", "System Architecture")}
      title="EcoMOF-AI Scoring Pipeline"
      subtitle={text(
        lang,
        "从输入数据到候选排序的主链路，右侧数据质量层通过旁路影响权重与解释。",
        "The main path from input data to candidate ranking, with a side data-quality layer influencing weighting and explanations."
      )}
      footer={text(
        lang,
        "输出是 decision-support priority，用于研究讨论和下一步验证排序，不是已验证预测结论。",
        "The output is a decision-support priority for research discussion and validation planning, not a validated prediction claim."
      )}
    >
      <div className="method-pipeline-layout">
        <div className="method-flow-chain">
          {flow.map((step, index) => (
            <div key={step.title} className="method-flow-step">
              <MethodBlock
                t={t}
                title={step.title}
                subtitle={step.subtitle}
                items={step.items}
                tone={step.tone}
                onClick={step.onClick}
                titleAttr={step.onClick ? text(lang, "点击跳转到方法说明", "Click to jump to method detail") : undefined}
              />
              {index < flow.length - 1 && <MethodArrow t={t} direction="down" />}
            </div>
          ))}
        </div>

        <aside className="method-quality-layer" style={{ background: t.panel, border: `1px dashed ${t.borderStrong}`, borderRadius: 16, padding: 14, display: "grid", gap: 12, alignSelf: "start" }}>
          <MethodBlock
            t={t}
            eyebrow={text(lang, "旁路层", "Side layer")}
            title={text(lang, "Data Quality Layer", "Data Quality Layer")}
            items={qualityItems}
            tone="quality"
          />
          <div className="method-side-influence" style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5, borderTop: `1px dashed ${t.borderStrong}`, paddingTop: 10 }}>
            <strong style={{ color: t.warn }}>{text(lang, "虚线影响", "Dashed influence")}:</strong>{" "}
            {text(lang, "缺失率、证据覆盖和来源状态会改变 Weighting Engine 的解释稳定性。", "Missing rate, evidence coverage, and provenance status affect weighting stability.")}
          </div>
          <div className="method-side-influence" style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5, borderTop: `1px dashed ${t.borderStrong}`, paddingTop: 10 }}>
            <strong style={{ color: t.warn }}>{text(lang, "旁路箭头", "Side arrow")}:</strong>{" "}
            {text(lang, "同一数据质量层进入 Explanation Layer，生成 evidence warning 与 data limitation。", "The same data-quality layer enters the Explanation Layer to produce evidence warnings and data limitations.")}
          </div>
        </aside>
      </div>
    </MethodArchitectureDiagram>
  )
}
