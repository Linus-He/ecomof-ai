// @ts-nocheck
import { InlineFormula } from "../ui"
import { MethodArchitectureDiagram } from "./MethodArchitectureDiagram"
import { MethodArrow } from "./MethodArrow"
import { MethodBlock } from "./MethodBlock"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function FormulaBlock({ t, label, math, fallback, note }) {
  return (
    <MethodBlock t={t} title={label} tone="highlight">
      <div style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.55, overflowX: "auto", overflowY: "hidden" }}>
        <InlineFormula math={math} fallback={fallback} />
      </div>
      {note && <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5 }}>{note}</div>}
    </MethodBlock>
  )
}

export function CriticWeightingDiagram({ t, lang = "en" }) {
  return (
    <MethodArchitectureDiagram
      t={t}
      eyebrow={text(lang, "探索性客观权重", "Exploratory Objective Weighting")}
      title={text(lang, "CRITIC Weighting Logic", "CRITIC Weighting Logic")}
      subtitle={text(
        lang,
        "CRITIC 是当前候选集中的 exploratory weighting reference，用于观察哪些描述符携带更多区分信息。",
        "CRITIC is an exploratory weighting reference for the current candidate set, used to inspect which descriptors carry more differentiating information."
      )}
      footer="CRITIC suggests which descriptors carry more information in the current candidate set."
    >
      <div className="method-flow-chain">
        <MethodBlock t={t} title="Descriptor matrix X" subtitle={text(lang, "候选 × 描述符矩阵。", "Candidate-by-descriptor matrix.")} tone="input" />
        <MethodArrow t={t} direction="down" />
        <MethodBlock t={t} title={text(lang, "Direction-aware normalization", "Direction-aware normalization")} subtitle={text(lang, "cost 指标先反向归一化，避免方向混乱。", "Cost descriptors are inverted during normalization to avoid direction confusion.")} tone="process" />
        <MethodArrow t={t} direction="down" />
        <div className="method-dual-branch">
          <FormulaBlock
            t={t}
            label={text(lang, "Standard deviation", "Standard deviation")}
            math="\\sigma_j"
            fallback="sigma_j"
            note={text(lang, "contrast intensity：候选集内差异越大，排序影响越可能上升。", "Contrast intensity: more candidate variation can increase ranking influence.")}
          />
          <FormulaBlock
            t={t}
            label={text(lang, "Correlation matrix", "Correlation matrix")}
            math="r_{jk}"
            fallback="r_jk"
            note={text(lang, "相关性用于判断描述符之间的信息重复程度。", "Correlation estimates information redundancy between descriptors.")}
          />
        </div>
        <MethodArrow t={t} direction="down" />
        <FormulaBlock
          t={t}
          label={text(lang, "Conflict score", "Conflict score")}
          math="\\sum_{k=1}^{m}(1-r_{jk})"
          fallback="sum_k(1 - r_jk)"
          note={text(lang, "与其他描述符越不重复，conflict score 越高。", "Less redundant descriptors receive a higher conflict score.")}
        />
        <MethodArrow t={t} direction="down" />
        <FormulaBlock
          t={t}
          label={text(lang, "Information content", "Information content")}
          math="C_j=\\sigma_j\\times\\sum_{k=1}^{m}(1-r_{jk})"
          fallback="C_j = sigma_j x sum_k(1 - r_jk)"
          note={text(lang, "同时考虑区分度与非冗余信息。", "Combines contrast intensity and non-redundant information.")}
        />
        <MethodArrow t={t} direction="down" />
        <FormulaBlock
          t={t}
          label={text(lang, "Weight", "Weight")}
          math="w_j=\\frac{C_j}{\\sum_{j=1}^{m}C_j}"
          fallback="w_j = C_j / sum_j(C_j)"
          note={text(lang, "权重归一化到 sum = 1。", "Weights are normalized to sum = 1.")}
        />
        <MethodArrow t={t} direction="down" />
        <MethodBlock
          t={t}
          title={text(lang, "Weight rationale", "Weight rationale")}
          items={text(
            lang,
            ["contrast intensity", "conflict score", "missing rate", "evidence coverage"],
            ["contrast intensity", "conflict score", "missing rate", "evidence coverage"]
          )}
          subtitle={text(
            lang,
            "CRITIC 不证明某个描述符“最好”；它提示当前候选集中哪些描述符信息量更高。",
            "CRITIC does not prove the best descriptor; it suggests which descriptors carry more information in the current candidate set."
          )}
          tone="output"
        />
      </div>
    </MethodArchitectureDiagram>
  )
}
