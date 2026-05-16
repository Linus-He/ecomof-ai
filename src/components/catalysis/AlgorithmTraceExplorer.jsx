import { useMemo, useState } from "react"
import { FONT_MONO, useViewport } from "../../shared"
import { BYPRODUCT_KEYS, PATHWAY_SCORE_KEYS, STEP_WEIGHTS, safeNumber } from "../../utils/rgfaScore"

const palette = {
  bg: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceStrong: "#F1F5F9",
  border: "#D9E2EC",
  borderStrong: "#B8C5D4",
  text: "#0F172A",
  muted: "#475569",
  faint: "#64748B",
  accent: "#1A6DB5",
  accentSoft: "#E8F2FC",
  positive: "#147C43",
  positiveSoft: "#F2FBF6",
  mixed: "#A15C13",
  mixedSoft: "#FFF7ED",
  risk: "#8F3B1B",
  riskSoft: "#FFF1E8",
}

const steps = [
  { id: "raw", zh: "原始输入", en: "Raw Input" },
  { id: "gate", zh: "门槛初筛", en: "Gate Screening" },
  { id: "pathway", zh: "路径指纹", en: "Pathway Fingerprint" },
  { id: "step", zh: "步骤评分", en: "StepScore" },
  { id: "selectivity", zh: "选择性因子", en: "SelectivityFactor" },
  { id: "critic", zh: "CRITIC 权重校正", en: "CRITIC Adjustment" },
  { id: "rgfa", zh: "RGFA 最终评分", en: "RGFA Score" },
  { id: "ranking", zh: "排名影响", en: "Ranking Impact" },
  { id: "experiment", zh: "下一步实验", en: "Next Experiment" },
]

const inputGroups = [
  {
    title: "产物标签 Product labels",
    rows: [
      ["Y_FA", "Y_FA"],
      ["S_FA_C", "S_FA_C"],
      ["Y_lactic", "Y_lactic"],
      ["Y_acetic", "Y_acetic"],
      ["Y_glycolic", "Y_glycolic"],
      ["Y_pyruvic", "Y_pyruvic"],
      ["Y_solid", "Y_solid"],
    ],
  },
  {
    title: "步骤输入 Step inputs",
    rows: [["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["B1", "B1"]],
  },
  {
    title: "门槛输入 Gate inputs",
    rows: [
      ["waterStabilityScore", "waterStabilityScore"],
      ["accessibilityScore", "accessibilityScore"],
      ["activeSiteConfidence", "activeSiteConfidence"],
    ],
  },
]

const pathwayMeta = {
  formaldehyde_to_formic: {
    label: "甲醛 → 甲酸",
    en: "Formaldehyde → Formic acid",
    note: "主正路径 Primary C1 positive route",
    color: palette.positive,
  },
  glyceraldehyde_to_formic: {
    label: "甘油醛 → 甲酸",
    en: "Glyceraldehyde → Formic acid",
    note: "混合路径中的正向分支",
    color: palette.mixed,
  },
  glyceraldehyde_to_c2_byproducts: {
    label: "甘油醛 → 乙醇酸/乙酸",
    en: "Glyceraldehyde → C2 byproducts",
    note: "C2 副产物风险",
    color: palette.mixed,
  },
  pyruvaldehyde_to_formic: {
    label: "丙酮醛 → 甲酸",
    en: "Pyruvaldehyde → Formic acid",
    note: "可能正向分支",
    color: palette.risk,
  },
  pyruvaldehyde_to_lactic: {
    label: "丙酮醛 → 乳酸/丙酮酸",
    en: "Pyruvaldehyde → Lactic/Pyruvic acid",
    note: "风险主导分支",
    color: palette.risk,
  },
}

function fmt(value, digits = 3) {
  return safeNumber(value, 0).toFixed(digits)
}

function pct(value) {
  return `${Math.round(Math.max(0, Math.min(1, safeNumber(value, 0))) * 100)}%`
}

function Sub({ children }) {
  return <sub style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sub>
}

function Sup({ children }) {
  return <sup style={{ fontSize: "0.72em", lineHeight: 0 }}>{children}</sup>
}

function VarLabel({ id }) {
  const labels = {
    Y_FA: <>Y<Sub>FA</Sub></>,
    S_FA_C: <>S<Sub>FA,C</Sub></>,
    Y_lactic: <>Y<Sub>lactic</Sub></>,
    Y_acetic: <>Y<Sub>acetic</Sub></>,
    Y_glycolic: <>Y<Sub>glycolic</Sub></>,
    Y_pyruvic: <>Y<Sub>pyruvic</Sub></>,
    Y_solid: <>Y<Sub>solid</Sub></>,
  }
  return labels[id] || id
}

function ChemLabel({ id }) {
  if (id === "isotopeBicarbonate") return <>NaH<Sup>13</Sup>CO<Sub>3</Sub></>
  return null
}

function ExperimentLabel({ value }) {
  if (value === "isotopeTracing") {
    return (
      <>
        <ChemLabel id="isotopeBicarbonate" /> isotope tracing / <ChemLabel id="isotopeBicarbonate" /> 同位素示踪
      </>
    )
  }
  return value
}

function FormulaBox({ children }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, display: "flex", flexWrap: "wrap", fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 900, gap: "4px 7px", lineHeight: 1.6, padding: 11, minWidth: 0 }}>
      {children}
    </div>
  )
}

function InfoBlock({ title, children }) {
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 11, minWidth: 0 }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.62, marginTop: 7 }}>{children}</div>
    </div>
  )
}

function MetricCell({ label, value, note, tone = palette.accent }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10, minWidth: 0 }}>
      <div style={{ color: palette.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: tone, fontFamily: FONT_MONO, fontSize: 18, fontWeight: 950, lineHeight: 1.05, marginTop: 7 }}>{value}</div>
      {note ? <div style={{ color: palette.muted, fontSize: 11, lineHeight: 1.45, marginTop: 6 }}>{note}</div> : null}
    </div>
  )
}

function ValueRow({ label, value, color = palette.accent, note }) {
  const width = pct(value)
  return (
    <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <span style={{ color: palette.text, fontSize: 12, fontWeight: 850, minWidth: 0 }}>{label}</span>
        <span style={{ color: palette.text, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 900 }}>{fmt(value)}</span>
      </div>
      {note ? <div style={{ color: palette.muted, fontSize: 11, lineHeight: 1.4 }}>{note}</div> : null}
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <div style={{ background: color, height: "100%", width }} />
      </div>
    </div>
  )
}

function ContributionRow({ id, term }) {
  const isPenalty = safeNumber(term.weight, 0) < 0
  const color = id === "A3" ? palette.positive : isPenalty ? palette.risk : palette.accent
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <span style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}>{id} · {term.label}</span>
        <span style={{ color: isPenalty ? palette.risk : palette.text, fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 900 }}>
          {fmt(term.weight, 2)} × {fmt(term.value, 2)} = {fmt(term.contribution)}
        </span>
      </div>
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
        <div style={{ background: color, height: "100%", width: pct(Math.abs(safeNumber(term.contribution, 0)) / 0.35) }} />
      </div>
    </div>
  )
}

function DetailShell({ title, subtitle, children }) {
  return (
    <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <div>
        <h3 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>{title}</h3>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.6, margin: "6px 0 0" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function RawInputStep({ candidate, trace }) {
  return (
    <DetailShell
      title="原始输入 Raw Input"
      subtitle="该步骤展示算法使用的原始输入，包括产物分布、步骤能力、门槛分数和路径指纹。当前为演示数据 / Demo data，不代表真实实验结果。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {inputGroups.map(group => (
          <InfoBlock key={group.title} title={group.title}>
            <div style={{ display: "grid", gap: 6 }}>
              {group.rows.map(([label, key]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{label.startsWith("Y_") || label === "S_FA_C" ? <VarLabel id={label} /> : label}</span>
                  <span style={{ color: palette.text, fontFamily: FONT_MONO, fontWeight: 900 }}>{fmt(trace.input[key])}</span>
                </div>
              ))}
            </div>
          </InfoBlock>
        ))}
      </div>
      <InfoBlock title="路径分数 Pathway scores">
        <div style={{ display: "grid", gap: 7 }}>
          {PATHWAY_SCORE_KEYS.map(key => (
            <ValueRow key={key} label={pathwayMeta[key].label} note={pathwayMeta[key].en} value={trace.pathwayFingerprint[key]} color={pathwayMeta[key].color} />
          ))}
        </div>
      </InfoBlock>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <MetricCell label="数据完整度 Data completeness" value={`${trace.inputCompleteness.availableFields}/${trace.inputCompleteness.totalFields}`} note="available fields / total fields" />
        <MetricCell label="数据状态 Data status" value={candidate.dataStatus || "prototype"} note="原型数据 / Prototype data" />
        <MetricCell label="证据等级 Evidence" value={candidate.evidenceLevel || "demo"} note="演示数据 / Demo data" />
      </div>
      {trace.inputCompleteness.missingFields.length ? (
        <InfoBlock title="缺失字段 Missing fields">
          {trace.inputCompleteness.missingFields.join(", ")}
        </InfoBlock>
      ) : null}
    </DetailShell>
  )
}

function GateStep({ trace }) {
  return (
    <DetailShell
      title="门槛初筛 Gate Screening"
      subtitle="Gate 用于判断候选 MOF 是否具备进入反应筛选的基本条件，包括水相稳定性、底物可及性和活性位点可信度。"
    >
      <FormulaBox>
        <span>Gate</span><span>=</span><span>water stability</span><span>×</span><span>accessibility</span><span>×</span><span>active-site confidence</span>
      </FormulaBox>
      <FormulaBox>
        <span>{fmt(trace.gate.waterStabilityScore)}</span><span>×</span><span>{fmt(trace.gate.accessibilityScore)}</span><span>×</span><span>{fmt(trace.gate.activeSiteConfidence)}</span><span>=</span><span>{fmt(trace.gate.result)}</span>
      </FormulaBox>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCell label="水相稳定性 Water stability" value={fmt(trace.gate.waterStabilityScore)} note="反应水相条件下的结构保真假设" />
        <MetricCell label="孔道/底物可及性 Accessibility" value={fmt(trace.gate.accessibilityScore)} note="葡萄糖、中间体和甲酸盐的通行可行性" />
        <MetricCell label="活性位点可信度 Active-site confidence" value={fmt(trace.gate.activeSiteConfidence)} note="金属位点/官能团参与反应的可信度" />
      </div>
    </DetailShell>
  )
}

function PathwayStep({ trace }) {
  return (
    <DetailShell
      title="路径指纹 Pathway Fingerprint"
      subtitle="路径指纹把三路径反应网络转化为可计算特征。颜色与上方动态图保持一致，副产物分支作为 B1 和选择性惩罚的依据。"
    >
      <div style={{ display: "grid", gap: 10 }}>
        {PATHWAY_SCORE_KEYS.map(key => (
          <ValueRow
            key={key}
            label={`${pathwayMeta[key].label} / ${pathwayMeta[key].en}`}
            note={pathwayMeta[key].note}
            value={trace.pathwayFingerprint[key]}
            color={pathwayMeta[key].color}
          />
        ))}
      </div>
    </DetailShell>
  )
}

function StepScoreStep({ trace }) {
  return (
    <DetailShell
      title="步骤评分 StepScore"
      subtitle="A3 权重最高，因为它直接反映中间体是否被导向甲酸；B1 是副产物路径风险，因此作为扣分项。"
    >
      <FormulaBox>
        <span>StepScore</span><span>=</span><span>0.15A<Sub>1</Sub></span><span>+</span><span>0.20A<Sub>2</Sub></span><span>+</span><span>0.35A<Sub>3</Sub></span><span>+</span><span>0.15A<Sub>4</Sub></span><span>−</span><span>0.15B<Sub>1</Sub></span>
      </FormulaBox>
      <div style={{ display: "grid", gap: 9 }}>
        {Object.keys(STEP_WEIGHTS).map(key => <ContributionRow key={key} id={key} term={trace.stepScore[key]} />)}
      </div>
      <MetricCell label="输出 Output" value={fmt(trace.stepScore.result)} note="贡献项相加后小于 0 时按 0 处理，避免负分进入乘法评分。" tone={palette.positive} />
    </DetailShell>
  )
}

function SelectivityStep({ trace }) {
  return (
    <DetailShell
      title="选择性因子 SelectivityFactor"
      subtitle="该因子用于避免只看甲酸产率而忽视副产物。乳酸、乙酸、乙醇酸、丙酮酸和固体副产物越高，分母越大，最终分数越低。"
    >
      <FormulaBox>
        <span>Numerator</span><span>=</span><span><VarLabel id="Y_FA" /></span><span>×</span><span><VarLabel id="S_FA_C" /></span><span>=</span><span>{fmt(trace.selectivityFactor.numerator)}</span>
      </FormulaBox>
      <FormulaBox>
        <span>Denominator</span><span>=</span><span>1</span><span>+</span><span>weighted byproduct penalties</span><span>=</span><span>{fmt(trace.selectivityFactor.denominator)}</span>
      </FormulaBox>
      <div style={{ display: "grid", gap: 8 }}>
        {BYPRODUCT_KEYS.map(key => {
          const term = trace.selectivityFactor.penaltyTerms[key]
          return (
            <div key={key} style={{ alignItems: "center", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 8, gridTemplateColumns: "minmax(90px, 0.7fr) minmax(0, 1fr)", padding: 9 }}>
              <div style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}><VarLabel id={key} /></div>
              <div style={{ color: palette.muted, fontFamily: FONT_MONO, fontSize: 12, lineHeight: 1.5 }}>
                {fmt(term.weight)} × {fmt(term.value)} = <strong style={{ color: palette.risk }}>{fmt(term.contribution)}</strong>
              </div>
            </div>
          )
        })}
      </div>
      <MetricCell label="输出 Output" value={fmt(trace.selectivityFactor.result)} note="SelectivityFactor = Numerator / Denominator" tone={palette.positive} />
    </DetailShell>
  )
}

function CriticStep({ trace }) {
  return (
    <DetailShell
      title="CRITIC 权重校正 CRITIC Adjustment"
      subtitle="CRITIC 用于根据演示数据中的离散度和冲突性校正副产物惩罚权重，但不替代反应机理先验。当前 CRITIC 校正基于原型数据，仅用于方法展示。"
    >
      <FormulaBox>
        <span>Final weight</span><span>=</span><span>0.7 × mechanism prior</span><span>+</span><span>0.3 × CRITIC weight</span>
      </FormulaBox>
      <div style={{ maxWidth: "100%", overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 560, width: "100%" }}>
          <thead>
            <tr>
              {["指标 Term", "机理先验 Mechanism prior", "CRITIC 权重", "最终融合权重 Final blended"].map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, padding: "8px 9px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BYPRODUCT_KEYS.map(key => (
              <tr key={key}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, fontWeight: 900, padding: "9px" }}><VarLabel id={key} /></td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontFamily: FONT_MONO, fontSize: 12, padding: "9px" }}>{fmt(trace.criticAdjustment.mechanismPriorWeights[key])}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontFamily: FONT_MONO, fontSize: 12, padding: "9px" }}>{fmt(trace.criticAdjustment.criticWeights[key])}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 900, padding: "9px" }}>{fmt(trace.criticAdjustment.blendedWeights[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InfoBlock title="方法边界 Method boundary">
        CRITIC adjustment is calculated from prototype data for demonstration only. 当前 CRITIC 校正基于原型数据，仅用于方法展示。
      </InfoBlock>
    </DetailShell>
  )
}

function RgfaStep({ candidate, trace }) {
  return (
    <DetailShell
      title="RGFA 最终评分 RGFA Score"
      subtitle="RGFA Score 将材料门槛、反应步骤能力和产物选择性合并为一个用于候选优先级讨论的原型评分。"
    >
      <FormulaBox>
        <span>RGFA Score</span><span>=</span><span>Gate</span><span>×</span><span>StepScore</span><span>×</span><span>SelectivityFactor</span>
      </FormulaBox>
      <FormulaBox>
        <span>{fmt(trace.rgfaScore.gate)}</span><span>×</span><span>{fmt(trace.rgfaScore.stepScore)}</span><span>×</span><span>{fmt(trace.rgfaScore.selectivityFactor)}</span><span>=</span><span>{fmt(trace.rgfaScore.result)}</span>
      </FormulaBox>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCell label="RGFA Score" value={fmt(trace.rgfaScore.result)} tone={palette.positive} />
        <MetricCell label="Candidate class / 类别" value={trace.recommendation.class} note={trace.recommendation.type} />
        <MetricCell label="Recommendation / 推荐类型" value={candidate.mof} note={trace.recommendation.reason} />
      </div>
    </DetailShell>
  )
}

function RankingStep({ trace }) {
  return (
    <DetailShell
      title="排名影响 Ranking Impact"
      subtitle="如果只看甲酸产率，某些副产物较高的材料可能被高估。RGFA + CRITIC 排名会综合考虑选择性、副产物惩罚、路径风险和门槛分数。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <MetricCell label="仅按甲酸产率 Yield-only ranking" value={trace.rankingImpact.yieldOnlyRank ? `#${trace.rankingImpact.yieldOnlyRank}` : "-"} note="以甲酸产率为主，辅以碳选择性打破并列。" />
        <MetricCell label="RGFA + CRITIC 校正排序" value={trace.rankingImpact.rgfaRank ? `#${trace.rankingImpact.rgfaRank}` : "-"} note="综合路径、门槛、选择性与 CRITIC 校正。" tone={palette.positive} />
      </div>
      <InfoBlock title="解释 Explanation">
        {trace.rankingImpact.explanation}
      </InfoBlock>
    </DetailShell>
  )
}

function ExperimentStep({ trace }) {
  return (
    <DetailShell
      title="下一步实验 Next Experiment"
      subtitle="推荐实验用于把原型排序转化为可验证的机理问题和候选优先级，不代表已经验证的实验结论。"
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <MetricCell label="候选类别 Candidate class" value={trace.recommendation.class} note={trace.recommendation.type} />
        <MetricCell label="推荐类型 Recommendation" value={trace.recommendation.type.split("/")[0].trim()} note={trace.recommendation.reason} tone={palette.positive} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {trace.recommendation.nextExperiment.map((item, index) => (
          <article key={item} style={{ alignItems: "start", background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 9, gridTemplateColumns: "30px minmax(0, 1fr)", padding: 10 }}>
            <div style={{ alignItems: "center", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.accent, display: "flex", fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 950, height: 26, justifyContent: "center", width: 26 }}>{index + 1}</div>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900, lineHeight: 1.45 }}><ExperimentLabel value={item} /></div>
          </article>
        ))}
      </div>
    </DetailShell>
  )
}

function StepDetail({ candidate, trace, activeStep }) {
  const renderers = {
    raw: <RawInputStep candidate={candidate} trace={trace} />,
    gate: <GateStep trace={trace} />,
    pathway: <PathwayStep trace={trace} />,
    step: <StepScoreStep trace={trace} />,
    selectivity: <SelectivityStep trace={trace} />,
    critic: <CriticStep trace={trace} />,
    rgfa: <RgfaStep candidate={candidate} trace={trace} />,
    ranking: <RankingStep trace={trace} />,
    experiment: <ExperimentStep trace={trace} />,
  }
  return renderers[activeStep] || renderers.raw
}

export function AlgorithmTraceExplorer({ rankedRows = [], selectedMof, setSelectedMof }) {
  const { isNarrow } = useViewport()
  const [activeStep, setActiveStep] = useState("raw")
  const selected = useMemo(() => (
    rankedRows.find(row => row.mof === selectedMof) || rankedRows[0] || null
  ), [rankedRows, selectedMof])

  if (!rankedRows.length || !selected) {
    return (
      <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: palette.text, fontSize: 15, fontWeight: 900 }}>算法追踪器 Algorithm Trace Explorer</div>
        <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.6, marginTop: 7 }}>正在等待 organic_acid_project_demo.json 演示数据。</div>
      </section>
    )
  }

  const activeIndex = steps.findIndex(step => step.id === activeStep)

  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "grid", gap: 4, marginBottom: 13 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.2, textTransform: "uppercase" }}>Algorithm Trace Explorer</div>
        <h2 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>算法追踪器 Algorithm Trace Explorer</h2>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
          从原始输入到 RGFA 最终评分逐步展开，展示候选 MOF 如何经过 Gate 初筛、路径指纹、选择性惩罚和 CRITIC 权重校正进入排序。
        </p>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "230px minmax(300px, 0.9fr) minmax(360px, 1.2fr)", alignItems: "start" }}>
        <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 10 }}>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 950 }}>候选选择器 Candidate Selector</div>
          <div style={{ display: "grid", gap: 7, maxHeight: isNarrow ? "none" : 360, overflowY: isNarrow ? "visible" : "auto" }}>
            {rankedRows.map(row => {
              const selectedRow = row.mof === selected.mof
              return (
                <button
                  key={row.mof}
                  type="button"
                  onClick={() => setSelectedMof(row.mof)}
                  style={{
                    alignItems: "flex-start",
                    background: selectedRow ? palette.accentSoft : palette.bg,
                    border: `1px solid ${selectedRow ? palette.accent : palette.border}`,
                    borderRadius: 8,
                    boxSizing: "border-box",
                    color: palette.text,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "inherit",
                    gap: 6,
                    justifyContent: "flex-start",
                    minHeight: 70,
                    overflow: "hidden",
                    padding: "10px 12px",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 950, lineHeight: 1.25, minWidth: 0, overflowWrap: "anywhere" }}>{row.mof}</span>
                  <span style={{ color: palette.muted, display: "block", fontFamily: FONT_MONO, fontSize: 11, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>
                    RGFA #{row.rgfaRank} · Score {fmt(row.rgfaScore)}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <nav style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: isNarrow ? "flex" : "grid", gap: 7, overflowX: isNarrow ? "auto" : "visible", padding: 10 }}>
          {steps.map((step, index) => {
            const current = step.id === activeStep
            const completed = index < activeIndex
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                style={{
                  background: current ? palette.accent : completed ? palette.accentSoft : palette.bg,
                  border: `1px solid ${current ? palette.accent : palette.border}`,
                  borderRadius: 8,
                  color: current ? "#fff" : palette.text,
                  cursor: "pointer",
                  display: "grid",
                  gap: 3,
                  minWidth: isNarrow ? 170 : 0,
                  padding: "8px 9px",
                  textAlign: "left",
                }}
              >
                <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 900 }}>
                  {completed ? "completed" : `step ${index + 1}`}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 930, lineHeight: 1.3 }}>{step.zh}</span>
                <span style={{ color: current ? "rgba(255,255,255,0.78)" : palette.muted, fontSize: 11 }}>{step.en}</span>
              </button>
            )
          })}
        </nav>

        <article style={{ background: palette.bg, border: `1px solid ${palette.borderStrong}`, borderRadius: 10, padding: 13, minWidth: 0 }}>
          <StepDetail candidate={selected} trace={selected.trace} activeStep={activeStep} />
        </article>
      </div>
    </section>
  )
}
