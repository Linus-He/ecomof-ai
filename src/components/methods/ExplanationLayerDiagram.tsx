// @ts-nocheck
import { MethodArchitectureDiagram } from "./MethodArchitectureDiagram"
import { MethodArrow } from "./MethodArrow"
import { MethodBlock } from "./MethodBlock"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function ExplanationLayerDiagram({ t, lang = "en" }) {
  const inputs = text(
    lang,
    [
      "Candidate score",
      "Descriptor contribution",
      "Missing descriptor penalty",
      "Evidence warnings",
      "Descriptor coverage",
    ],
    [
      "Candidate score",
      "Descriptor contribution",
      "Missing descriptor penalty",
      "Evidence warnings",
      "Descriptor coverage",
    ]
  )

  const userSees = text(
    lang,
    ["Ranking Explanation", "Main drivers", "Weaknesses", "Data limitations", "Method note"],
    ["Ranking Explanation", "Main drivers", "Weaknesses", "Data limitations", "Method note"]
  )

  return (
    <MethodArchitectureDiagram
      t={t}
      eyebrow={text(lang, "解释层", "Explanation Layer")}
      title={text(lang, "解释层 / 排序解释", "Explanation Layer / Ranking Explanation")}
      subtitle={text(
        lang,
        "解释层把分数、贡献、缺失、证据警告和覆盖率汇总到用户可读的结果解释中。",
        "The explanation layer turns score, contribution, missingness, evidence warnings, and coverage into a user-readable result explanation."
      )}
    >
      <div className="method-explanation-grid">
        <div className="method-plus-stack" style={{ display: "grid", gap: 8 }}>
          {inputs.map((item, index) => (
            <div key={item}>
              <MethodBlock t={t} title={item} tone={index === 0 ? "input" : index >= 2 ? "quality" : "process"} compact />
              {index < inputs.length - 1 && (
                <div style={{ color: t.accentText, textAlign: "center", fontSize: 15, fontWeight: 850, lineHeight: 1.1 }}>+</div>
              )}
            </div>
          ))}
        </div>
        <div className="method-explanation-arrow">
          <MethodArrow t={t} direction="horizontal" />
        </div>
        <MethodBlock
          t={t}
          eyebrow={text(lang, "UI drawer", "UI drawer")}
          title={text(lang, "Score explanation drawer", "Score explanation drawer")}
          subtitle={text(lang, "用户入口统一为“排序解释”，内部信息结构对应评分依据、数据缺口和证据状态。", "The user entry is normalized as Ranking Explanation, with internal sections for scoring basis, data gaps, and evidence status.")}
          items={text(
            lang,
            ["评分依据", "结果解释", "排序解释"],
            ["Scoring basis", "Result explanation", "Ranking explanation"]
          )}
          tone="highlight"
        />
        <div className="method-explanation-arrow">
          <MethodArrow t={t} direction="horizontal" />
        </div>
        <MethodBlock
          t={t}
          eyebrow={text(lang, "User sees", "User sees")}
          title={text(lang, "解释输出", "Explanation output")}
          items={userSees}
          tone="output"
        />
      </div>
    </MethodArchitectureDiagram>
  )
}
