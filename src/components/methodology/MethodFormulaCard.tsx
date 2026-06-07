// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { BlockFormula, InlineFormula } from "../ui"
import { SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const formulaDetails = {
  "critic-information": {
    variables: [
      ["C_j", "第 j 个指标的信息量。", "information content of descriptor j."],
      ["σ_j", "第 j 个指标在候选物集合中的标准差，用于衡量区分度。", "standard deviation of descriptor j across candidates, used as contrast intensity."],
      ["r_jk", "第 j 个指标与第 k 个指标之间的相关系数。", "correlation coefficient between descriptor j and descriptor k."],
      ["m", "参与权重计算的指标数量。", "number of descriptors included in the weighting step."],
    ],
    interpretationZh: "CRITIC 方法认为，一个指标越能区分候选物，并且与其他指标重复性越低，它携带的信息量就越高。",
    interpretation: "CRITIC assigns higher information content to descriptors that distinguish candidates and are less redundant with other descriptors.",
    inputsZh: "归一化后的候选物描述符矩阵。",
    inputs: "Normalized candidate descriptor matrix.",
    outputsZh: "每个指标的信息量 C_j。",
    outputs: "Information content for each descriptor.",
  },
  "critic-weight": {
    variables: [
      ["w_j", "第 j 个指标的 CRITIC 权重。", "CRITIC weight of descriptor j."],
      ["C_j", "第 j 个指标的信息量。", "information content of descriptor j."],
      ["m", "指标总数。", "number of descriptors."],
    ],
    interpretationZh: "该步骤将所有指标的信息量归一化，使权重总和为 1。",
    interpretation: "This step normalizes descriptor information content so that all weights sum to one.",
    inputsZh: "各指标的信息量 C_j。",
    inputs: "Descriptor information content values.",
    outputsZh: "归一化后的指标权重 w_j。",
    outputs: "Normalized descriptor weights.",
  },
  "candidate-raw": {
    variables: [
      ["D_raw", "证据修正前的候选物综合评分。", "raw candidate score before evidence-quality adjustment."],
      ["G", "几何聚合项或基础可行性因子。", "geometric aggregation or base feasibility factor."],
      ["d_j", "候选物在第 j 个指标上的归一化得分。", "normalized score of the candidate for descriptor j."],
      ["w_j", "第 j 个指标的 CRITIC 权重。", "CRITIC weight of descriptor j."],
      ["m", "指标数量。", "number of descriptors."],
    ],
    interpretationZh: "该公式使用加权几何聚合计算候选物综合表现。某一关键指标过低时，综合评分会明显下降，适合用于多指标同时满足的筛选场景。",
    interpretation: "The weighted geometric aggregation lowers the score when a critical descriptor is weak, making it suitable for multi-constraint screening.",
    inputsZh: "归一化指标得分和 CRITIC 权重。",
    inputs: "Normalized descriptor scores and CRITIC weights.",
    outputsZh: "未经过证据置信度修正的候选物综合评分。",
    outputs: "Raw candidate score before evidence-quality adjustment.",
  },
  "evidence-confidence": {
    variables: [
      ["D_expected", "经过证据质量修正后的期望评分。", "expected score after evidence-quality correction."],
      ["D_raw", "证据修正前的候选物综合评分。", "raw candidate score before evidence-quality adjustment."],
      ["Q", "证据质量修正因子。", "evidence-quality correction factor."],
    ],
    interpretationZh: "当候选物的描述符来源不完整、验证等级较低或关键字段缺少来源时，Q 会降低最终期望评分，避免低证据候选物被过度推荐。",
    interpretation: "When descriptor sources are incomplete, validation level is low, or key fields lack provenance, Q lowers the expected score to avoid overstating weak-evidence candidates.",
    inputsZh: "原始综合评分和证据质量因子。",
    inputs: "Raw score and evidence-quality factor.",
    outputsZh: "证据修正后的候选物期望评分。",
    outputs: "Evidence-corrected expected candidate score.",
  },
  "organic-edge-weight": {
    variables: [
      ["w_ij", "从节点 i 到节点 j 的反应边权重。", "edge weight from node i to node j."],
      ["E_ij", "该反应边的证据分数。", "evidence score for the edge."],
      ["P_ij", "化学合理性评分。", "chemical plausibility score."],
      ["M_ij", "MOF 调控贡献因子。", "MOF regulation contribution factor."],
      ["V_ij", "验证支持度。", "validation-support factor."],
    ],
    interpretationZh: "边权重用于表示某一步转化在当前证据条件下的可信度和优先级。权重越高，说明该路径更值得进入候选验证或进一步数据整理。",
    interpretation: "Edge weight represents the current confidence and validation priority of a transformation under the available evidence.",
    inputsZh: "反应证据、化学合理性判断、MOF 调控规则和验证状态。",
    inputs: "Reaction evidence, chemical plausibility, MOF regulation rules, and validation status.",
    outputsZh: "可用于路径筛选和候选物优先级判断的边权重。",
    outputs: "Edge weights for pathway filtering and candidate prioritization.",
  },
  "organic-path-score": {
    variables: [
      ["S_p", "路径 p 的综合评分。", "aggregate score for pathway p."],
      ["w_ij", "路径中每条反应边的权重。", "weight of each edge in the pathway."],
      ["p", "被评估的反应路径。", "reaction pathway being evaluated."],
    ],
    interpretationZh: "当前采用乘积聚合；路径中任一低证据步骤都会显著降低总分，因此更适合识别瓶颈边和待验证步骤。",
    interpretation: "The current method uses multiplicative aggregation, so a single weak-evidence step substantially lowers the pathway score and highlights bottlenecks.",
    inputsZh: "路径上的边权重集合。",
    inputs: "Edge weights along the pathway.",
    outputsZh: "路径评分和瓶颈步骤提示。",
    outputs: "Pathway score and bottleneck-step indication.",
  },
  "candidate-priority-score": {
    variables: [
      ["P_c", "候选物 c 的优先级评分。", "priority score for candidate c."],
      ["R_c", "路径相关性，表示候选物与目标反应路径的关联程度。", "pathway relevance of the candidate."],
      ["E_c", "证据就绪度，表示关键描述符与来源是否完整。", "evidence readiness for key descriptors and sources."],
      ["F_c", "MOF 可行性，表示水稳定性、孔道可达性、金属中心和官能团等条件是否满足。", "MOF feasibility across stability, accessibility, metal-site, and functional-group conditions."],
      ["V_c", "验证价值，表示该候选物是否能帮助区分关键机理假设。", "validation value for separating mechanistic hypotheses."],
    ],
    interpretationZh: "候选物优先级不是单纯性能排序，而是用于决定“先验证谁、先补谁的数据、谁适合作为对照”的决策指标。",
    interpretation: "Candidate priority is not a pure performance ranking; it supports decisions about validation order, data completion, and control candidates.",
    inputsZh: "路径相关性、证据完整度、MOF 可行性和验证价值。",
    inputs: "Pathway relevance, evidence completeness, MOF feasibility, and validation value.",
    outputsZh: "候选物在优先级矩阵中的位置和推荐下一步动作。",
    outputs: "Candidate position in the priority matrix and recommended next action.",
  },
}

function detailFor(formula) {
  return formulaDetails[formula.id] || formula.methodDetails || null
}

function VariableRows({ rows, lang, t }) {
  if (!rows?.length) return null
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{text(lang, "变量释义", "Variables")}</strong>
      {rows.map(([symbol, zh, en]) => (
        <div key={symbol} style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}>
          <span style={{ color: t.textStrong, fontFamily: SCIENTIFIC_TOKEN_FONT, fontWeight: 900 }}>{symbol}</span>
          {"："}
          {text(lang, zh, en)}
        </div>
      ))}
    </div>
  )
}

function DetailLine({ labelZh, label, valueZh, value, lang, t }) {
  if (!valueZh && !value) return null
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{text(lang, labelZh, label)}</strong>
      <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.48 }}><ChemicalText value={text(lang, valueZh, value)} /></span>
    </div>
  )
}

export function MethodFormulaCard({ formula, lang, t }) {
  const details = detailFor(formula)
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 9, minWidth: 0, padding: 11 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.3 }}>
          {text(lang, formula.labelZh, formula.label)}
        </strong>
        <span style={{ color: t.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 850 }}>
          {formula.id}
        </span>
      </div>
      <BlockFormula math={formula.latex} fallback={formula.fallback} t={t} />
      <VariableRows rows={details?.variables} lang={lang} t={t} />
      <DetailLine labelZh="方法含义" label="Interpretation" valueZh={details?.interpretationZh || formula.explanationZh} value={details?.interpretation || formula.explanation} lang={lang} t={t} />
      <DetailLine labelZh="输入" label="Input" valueZh={details?.inputsZh} value={details?.inputs} lang={lang} t={t} />
      <DetailLine labelZh="输出" label="Output" valueZh={details?.outputsZh} value={details?.outputs} lang={lang} t={t} />
    </article>
  )
}

export function MethodInlineFormula({ math, fallback }) {
  return (
    <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}>
      <InlineFormula math={math} fallback={fallback} />
    </span>
  )
}
