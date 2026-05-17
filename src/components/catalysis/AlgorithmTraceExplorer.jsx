import { useMemo, useState } from "react"
import { useViewport } from "../../shared"
import { BYPRODUCT_KEYS, PATHWAY_SCORE_KEYS, STEP_WEIGHTS, safeNumber } from "../../utils/rgfaScore"
import {
  DescriptorLabel,
  FormulaCard,
  FormulaInline,
  NumericText,
  ORGANIC_ACID_FONT,
  organicAcidPalette as palette,
  pathwayMeta,
  VariableLabel,
} from "./FormulaInline"

const steps = [
  { id: "raw", zh: "原始输入", en: "Raw Input" },
  { id: "gate", zh: "门槛初筛", en: "Gate" },
  { id: "pathway", zh: "路径指纹", en: "Pathway" },
  { id: "step", zh: "步骤评分", en: "StepScore" },
  { id: "selectivity", zh: "选择性因子", en: "Selectivity" },
  { id: "critic", zh: "权重校正", en: "CRITIC" },
  { id: "rgfa", zh: "最终评分", en: "RGFA" },
  { id: "ranking", zh: "排名影响", en: "Ranking" },
  { id: "experiment", zh: "下一步实验", en: "Experiment" },
]

const inputRows = [
  { key: "Y_FA", usage: "甲酸产率", status: "available" },
  { key: "S_FA_C", usage: "甲酸碳基选择性", status: "available" },
  { key: "Y_lactic", usage: "副产物惩罚", status: "available" },
  { key: "Y_acetic", usage: "副产物惩罚", status: "available" },
  { key: "Y_glycolic", usage: "副产物惩罚", status: "available" },
  { key: "Y_pyruvic", usage: "副产物惩罚", status: "available" },
  { key: "Y_solid", usage: "固相副产物惩罚", status: "available" },
  { key: "A1", usage: "葡萄糖活化/异构化能力", status: "available" },
  { key: "A2", usage: "甲酸前体生成能力", status: "available" },
  { key: "A3", usage: "中间体转甲酸能力", status: "available" },
  { key: "A4", usage: "甲酸释放与稳定能力", status: "available" },
  { key: "B1", usage: "副产物风险路径", status: "available" },
  { key: "waterStabilityScore", usage: "Gate 水相稳定性", status: "available" },
  { key: "accessibilityScore", usage: "Gate 可及性", status: "available" },
  { key: "activeSiteConfidence", usage: "Gate 活性位点可信度", status: "available" },
]

const stepLabels = {
  A1: "葡萄糖活化/异构化",
  A2: "甲酸前体生成",
  A3: "中间体 → 甲酸",
  A4: "甲酸/甲酸盐释放",
  B1: "副产物路径风险",
}

const byproductNotes = {
  Y_lactic: "乳酸副产物",
  Y_acetic: "乙酸副产物",
  Y_glycolic: "乙醇酸副产物",
  Y_pyruvic: "丙酮酸副产物",
  Y_solid: "固相副产物",
}

function fmt(value, digits = 3) {
  return safeNumber(value, 0).toFixed(digits)
}

function pct(value) {
  return `${Math.round(Math.max(0, Math.min(1, safeNumber(value, 0))) * 100)}%`
}

function toneForClass(candidateClass) {
  if (candidateClass === "A") return palette.positive
  if (candidateClass === "B") return palette.accent
  if (candidateClass === "C") return palette.mixed
  return palette.risk
}

function dominantContribution(trace) {
  const entries = ["A1", "A2", "A3", "A4"].map((key) => [key, safeNumber(trace.stepScore[key]?.contribution, 0)])
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || "A3"
}

function dominantPenalty(trace) {
  const penalty = BYPRODUCT_KEYS
    .map((key) => [key, safeNumber(trace.selectivityFactor.penaltyTerms[key]?.contribution, 0)])
    .sort((a, b) => b[1] - a[1])[0]?.[0]
  return penalty || "Y_lactic"
}

function nextExperimentCards(recommendation) {
  const items = recommendation?.nextExperiment || []
  return [
    { title: "Primary test", label: items[0] || "Main reaction test / 主反应测试", reason: "先确认主反应是否支撑当前排序。" },
    { title: "Pathway test", label: items.find((item) => /feeding|Tracing|示踪|投料/.test(item)) || items[1] || "Pathway validation pending", reason: "验证三路径中最关键的正向或风险分支。" },
    { title: "Validation test", label: items.find((item) => /balance|DFT|stability|完整度|碳平衡/.test(item)) || items[items.length - 1] || "Validation pending", reason: "补齐证据链与后续建模输入。" },
  ]
}

function fieldLabel(key) {
  if (["Y_FA", "S_FA_C", "Y_lactic", "Y_acetic", "Y_glycolic", "Y_pyruvic", "Y_solid", "A1", "A2", "A3", "A4", "B1"].includes(key)) {
    return <VariableLabel name={key} />
  }
  return key
}

function SummaryMetric({ label, value, note, tone = palette.accent }) {
  return (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "9px 10px" }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>{label}</div>
      <div style={{ color: tone, fontSize: 14.5, fontWeight: 700, lineHeight: 1.15, marginTop: 5 }}>{value}</div>
      {note ? <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4, marginTop: 4 }}>{note}</div> : null}
    </div>
  )
}

function ProgressBar({ value, tone = palette.accent }) {
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
      <div style={{ background: tone, height: "100%", width: pct(value) }} />
    </div>
  )
}

function ContributionBar({ label, value, tone, note, accent = false }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ color: palette.text, fontSize: 12.5, fontWeight: accent ? 800 : 700 }}>{label}</div>
        <NumericText style={{ color: palette.text, fontSize: 11.5, fontWeight: 800 }}>{fmt(value)}</NumericText>
      </div>
      {note ? <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{note}</div> : null}
      <ProgressBar value={Math.min(Math.abs(value) / 0.9, 1)} tone={tone} />
    </div>
  )
}

function TraceLayout({ title, subtitle, lead, detail, summary, isNarrow }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <h3 style={{ color: palette.text, fontSize: 17, lineHeight: 1.25, margin: 0 }}>{title}</h3>
        <p style={{ color: palette.muted, fontSize: 12.25, lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.26fr) minmax(220px, 0.74fr)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {lead}
          {detail}
        </div>
        <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 11, alignSelf: "start" }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>Step summary</div>
          {summary}
        </aside>
      </div>
    </div>
  )
}

function CandidateSelector({ rankedRows, selected, setSelectedMof, isNarrow }) {
  const quickRows = useMemo(() => {
    const top = rankedRows.slice(0, 3)
    return top.some((row) => row.mof === selected.mof) ? top : [selected, ...top.slice(0, 2)]
  }, [rankedRows, selected])

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: palette.faint, fontSize: 11, fontWeight: 800 }}>快速候选 Quick picks</div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "repeat(3, minmax(0, 1fr))" : "repeat(3, minmax(140px, 1fr))" }}>
          {quickRows.map((row) => {
            const active = row.mof === selected.mof
            return (
              <button
                key={row.mof}
                type="button"
                onClick={() => setSelectedMof(row.mof)}
                style={{
                  background: active ? palette.accentSoft : palette.surface,
                  border: `1px solid ${active ? palette.accent : palette.border}`,
                  borderRadius: 10,
                  color: palette.text,
                  cursor: "pointer",
                  display: "grid",
                  gap: 3,
                  minHeight: 64,
                  padding: "9px 11px",
                  textAlign: "left",
                }}
              >
                <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{row.mof}</div>
                <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  <NumericText>RGFA #{row.rgfaRank}</NumericText> · <NumericText>{fmt(row.rgfaScore)}</NumericText>
                </div>
              </button>
            )
          })}
      </div>
    </div>
  )
}

function Stepper({ activeStep, setActiveStep }) {
  return (
    <nav style={{ borderBottom: `1px solid ${palette.border}`, display: "flex", gap: 0, minHeight: 58, overflowX: "auto", paddingBottom: 2 }}>
      {steps.map((step, index) => {
        const active = step.id === activeStep
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            style={{
              alignItems: "center",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${active ? palette.accent : "transparent"}`,
              color: active ? palette.accent : palette.text,
              cursor: "pointer",
              display: "grid",
              flexShrink: 0,
              gap: 3,
              minWidth: 112,
              padding: "8px 12px 10px",
              textAlign: "left",
            }}
          >
            <span style={{ alignItems: "center", display: "inline-flex", gap: 8 }}>
              <span
                style={{
                  background: active ? palette.accent : palette.bg,
                  border: `1px solid ${active ? palette.accent : palette.borderStrong}`,
                  borderRadius: 999,
                  color: active ? "#fff" : palette.faint,
                  display: "inline-flex",
                  fontSize: 10.5,
                  fontWeight: 800,
                  height: 20,
                  justifyContent: "center",
                  minWidth: 20,
                  padding: "0 6px",
                }}
              >
                0{index + 1}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: active ? 800 : 700, lineHeight: 1.2 }}>{step.zh}</span>
            </span>
            <span style={{ color: active ? palette.accent : palette.muted, fontSize: 10.5, lineHeight: 1.2 }}>{step.en}</span>
          </button>
        )
      })}
    </nav>
  )
}

function CandidateSummary({ candidate, activeStep }) {
  const trace = candidate.trace
  const driverKey = dominantContribution(trace)
  const penaltyKey = dominantPenalty(trace)
  const classTone = toneForClass(candidate.computedClass)
  const activeMeta = steps.find((step) => step.id === activeStep) || steps[0]

  return (
    <aside style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 10, padding: 12, alignSelf: "start" }}>
      <div style={{ borderBottom: `1px solid ${palette.border}`, display: "grid", gap: 4, paddingBottom: 9 }}>
        <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>Candidate summary</div>
        <div style={{ color: palette.text, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{candidate.mof}</div>
        <div style={{ color: palette.muted, fontSize: 11.75, lineHeight: 1.45 }}>当前步骤 Current step: {activeMeta.zh} {activeMeta.en}</div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <SummaryMetric label="RGFA Score" value={<NumericText style={{ color: palette.positive, fontSize: 15, fontWeight: 700 }}>{fmt(candidate.rgfaScore)}</NumericText>} tone={palette.positive} />
        <SummaryMetric label="Class" value={candidate.computedClass} tone={classTone} />
        <SummaryMetric label="Rank shift" value={<><NumericText>#{candidate.yieldOnlyRank}</NumericText> → <NumericText>#{candidate.rgfaRank}</NumericText></>} note="Yield-only → RGFA" />
        <SummaryMetric label="Evidence level" value={candidate.evidenceLevel || "demo"} note="prototype data" />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700 }}>关键判断 Key signals</div>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>Main driver</div>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, marginTop: 5 }}>
            <VariableLabel name={driverKey} /> · {stepLabels[driverKey]}
          </div>
        </div>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>Main penalty</div>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, marginTop: 5 }}>
            <VariableLabel name={penaltyKey} /> · {byproductNotes[penaltyKey]}
          </div>
        </div>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>Why this candidate</div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{candidate.explanations[0]}</div>
        </div>
        <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 10 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800 }}>Recommended next step</div>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, marginTop: 5 }}>{trace.recommendation.nextExperiment?.[0] || "Main reaction test / 主反应测试"}</div>
        </div>
      </div>
    </aside>
  )
}

function RawStep({ candidate, trace, isNarrow }) {
  const completion = trace.inputCompleteness.availableFields / trace.inputCompleteness.totalFields
  const rows = inputRows.map((row) => ({ ...row, value: trace.input[row.key] }))

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="原始输入 Raw Input"
      subtitle="把当前候选进入算法前的原始输入压成一张紧凑数据表，先看字段、再看完整度。"
      lead={(
        <FormulaCard title="Input schema">
          <FormulaInline>
            <span>Raw Input</span><span>=</span><span>Product labels</span><span>+</span><span>Step inputs</span><span>+</span><span>Gate inputs</span><span>+</span><span>Pathway scores</span>
          </FormulaInline>
          <div style={{ display: "grid", gap: 7 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 10, justifyContent: "space-between" }}>
              <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700 }}>Data completeness</div>
              <NumericText style={{ color: palette.text, fontSize: 12, fontWeight: 800 }}>
                {trace.inputCompleteness.availableFields} / {trace.inputCompleteness.totalFields}
              </NumericText>
            </div>
            <ProgressBar value={completion} tone={palette.accent} />
          </div>
        </FormulaCard>
      )}
      detail={(
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["字段 Field", "值 Value", "用途 Use", "状态 Status"].map((head) => (
                  <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, padding: "8px 9px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 700, padding: "8px 9px" }}>{fieldLabel(row.key)}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(row.value)}</NumericText></td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "8px 9px" }}>{row.usage}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "8px 9px" }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="Demo status" value={candidate.dataStatus || "prototype"} note="当前为方法演示数据" />
          <SummaryMetric label="Evidence" value={candidate.evidenceLevel || "demo"} note="not experimental truth" />
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            当前候选输入完整，后续真实版本可在同一表结构下直接补齐 pending 字段。
          </div>
        </>
      )}
    />
  )
}

function GateStep({ trace, isNarrow }) {
  const cards = [
    ["Water stability", trace.gate.waterStabilityScore, "水相稳定性"],
    ["Accessibility", trace.gate.accessibilityScore, "孔道/底物可及性"],
    ["Active-site confidence", trace.gate.activeSiteConfidence, "活性位点可信度"],
  ]

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="门槛初筛 Gate Screening"
      subtitle="先判断材料是否值得进入反应筛选，再讨论更细的路径与选择性。"
      lead={(
        <FormulaCard title="Gate formula">
          <FormulaInline>
            <span>Gate</span><span>=</span><span>water stability</span><span>×</span><span>accessibility</span><span>×</span><span>active-site confidence</span>
          </FormulaInline>
          <FormulaInline color={palette.accent}>
            <span>{fmt(trace.gate.waterStabilityScore)}</span><span>×</span><span>{fmt(trace.gate.accessibilityScore)}</span><span>×</span><span>{fmt(trace.gate.activeSiteConfidence)}</span><span>=</span><span>{fmt(trace.gate.result)}</span>
          </FormulaInline>
        </FormulaCard>
      )}
      detail={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {cards.map(([title, value, note]) => (
            <SummaryMetric
              key={title}
              label={title}
              value={<NumericText style={{ color: palette.text, fontSize: 16, fontWeight: 800 }}>{fmt(value)}</NumericText>}
              note={note}
            />
          ))}
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="Gate output" value={<NumericText style={{ color: palette.positive, fontSize: 16, fontWeight: 800 }}>{fmt(trace.gate.result)}</NumericText>} tone={palette.positive} />
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            Gate 低时优先回到稳定性、孔道或位点可信度补证据，而不是直接讨论排序。
          </div>
        </>
      )}
    />
  )
}

function PathwayStep({ trace, isNarrow }) {
  const dominantKey = PATHWAY_SCORE_KEYS
    .map((key) => ({ key, value: trace.pathwayFingerprint[key] }))
    .sort((a, b) => safeNumber(b.value, 0) - safeNumber(a.value, 0))[0]?.key

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="路径指纹 Pathway Fingerprint"
      subtitle="把三路径动态图的机理假设翻译成可排序的路径分数，但不改变上方动态图视觉。"
      lead={(
        <FormulaCard title="Pathway fingerprint">
          <FormulaInline>
            <span>Pathway fingerprint</span><span>=</span><span>C1 positive route</span><span>+</span><span>mixed route</span><span>+</span><span>risk route</span>
          </FormulaInline>
        </FormulaCard>
      )}
      detail={(
        <div style={{ display: "grid", gap: 10 }}>
          {PATHWAY_SCORE_KEYS.map((key) => (
            <ContributionBar
              key={key}
              label={`${pathwayMeta[key].labelZh} / ${pathwayMeta[key].labelEn}`}
              value={trace.pathwayFingerprint[key]}
              tone={pathwayMeta[key].color}
              note={pathwayMeta[key].note}
            />
          ))}
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="Dominant route" value={dominantKey ? pathwayMeta[dominantKey].labelZh : "pending"} />
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            强正向路径会推高 A3，风险路径则会体现在 B1 与选择性惩罚中。
          </div>
        </>
      )}
    />
  )
}

function StepScoreStep({ trace, isNarrow }) {
  const peak = dominantContribution(trace)

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="步骤评分 StepScore"
      subtitle="A3 权重最高，用于强调中间体是否真正被导向甲酸；B1 为负项。"
      lead={(
        <FormulaCard title="StepScore formula">
          <FormulaInline>
            <span>StepScore</span><span>=</span><span>0.15<VariableLabel name="A1" /></span><span>+</span><span>0.20<VariableLabel name="A2" /></span><span>+</span><span>0.35<VariableLabel name="A3" /></span><span>+</span><span>0.15<VariableLabel name="A4" /></span><span>−</span><span>0.15<VariableLabel name="B1" /></span>
          </FormulaInline>
        </FormulaCard>
      )}
      detail={(
        <div style={{ display: "grid", gap: 10 }}>
          {Object.keys(STEP_WEIGHTS).map((key) => {
            const term = trace.stepScore[key]
            const penalty = safeNumber(term.weight, 0) < 0
            return (
              <ContributionBar
                key={key}
                label={<><VariableLabel name={key} /> · {stepLabels[key]}</>}
                value={term.contribution}
                tone={penalty ? palette.risk : key === "A3" ? palette.positive : palette.accent}
                note={`${fmt(term.weight, 2)} × ${fmt(term.value, 2)} = ${fmt(term.contribution)}`}
                accent={key === peak}
              />
            )
          })}
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="StepScore output" value={<NumericText style={{ color: palette.positive, fontSize: 16, fontWeight: 800 }}>{fmt(trace.stepScore.result)}</NumericText>} tone={palette.positive} />
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>
            <VariableLabel name={peak} /> 是当前最大正贡献项。
          </div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            当前候选由 {stepLabels[peak]} 主导，不再是单纯的说明文档，而是可核对的贡献拆解。
          </div>
        </>
      )}
    />
  )
}

function SelectivityStep({ trace, isNarrow }) {
  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="选择性因子 SelectivityFactor"
      subtitle="用分子鼓励甲酸方向，用分母惩罚副产物，避免高产率但副产物重的候选被高估。"
      lead={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          <FormulaCard title="Numerator">
            <FormulaInline>
              <span><VariableLabel name="Y_FA" /></span><span>×</span><span><VariableLabel name="S_FA_C" /></span><span>=</span><span>{fmt(trace.selectivityFactor.numerator)}</span>
            </FormulaInline>
          </FormulaCard>
          <FormulaCard title="Denominator">
            <FormulaInline>
              <span>1</span><span>+</span><span>weighted byproduct penalties</span><span>=</span><span>{fmt(trace.selectivityFactor.denominator)}</span>
            </FormulaInline>
          </FormulaCard>
        </div>
      )}
      detail={(
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Term", "value", "weight", "contribution"].map((head) => (
                  <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, padding: "8px 9px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BYPRODUCT_KEYS.map((key) => {
                const term = trace.selectivityFactor.penaltyTerms[key]
                return (
                  <tr key={key}>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 700, padding: "8px 9px" }}><VariableLabel name={key} /></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(term.value)}</NumericText></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(term.weight)}</NumericText></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(term.contribution)}</NumericText></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="SelectivityFactor" value={<NumericText style={{ color: palette.positive, fontSize: 16, fontWeight: 800 }}>{fmt(trace.selectivityFactor.result)}</NumericText>} tone={palette.positive} />
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            分母越大，说明副产物越强；这一步直接决定“看起来高产”是否真的值得排前面。
          </div>
        </>
      )}
    />
  )
}

function CriticStep({ trace, isNarrow }) {
  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="权重校正 CRITIC Adjustment"
      subtitle="CRITIC 不替代机理先验，只在当前候选集里对副产物惩罚做轻量校正。"
      lead={(
        <FormulaCard title="Blend rule">
          <FormulaInline>
            <span>Final</span><span>=</span><span>0.7 × prior</span><span>+</span><span>0.3 × CRITIC</span>
          </FormulaInline>
        </FormulaCard>
      )}
      detail={(
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Indicator", "Mechanism prior", "CRITIC weight", "Final blended", "Δ"].map((head) => (
                  <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, padding: "8px 9px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BYPRODUCT_KEYS.map((key) => {
                const prior = trace.criticAdjustment.mechanismPriorWeights[key]
                const critic = trace.criticAdjustment.criticWeights[key]
                const blended = trace.criticAdjustment.blendedWeights[key]
                return (
                  <tr key={key}>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12.5, fontWeight: 700, padding: "8px 9px" }}><VariableLabel name={key} /></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(prior)}</NumericText></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(critic)}</NumericText></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(blended)}</NumericText></td>
                    <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "8px 9px" }}><NumericText>{fmt(blended - prior)}</NumericText></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      summary={(
        <>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>当前规则：先验权重保持主导，CRITIC 只做 30% 融合。</div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            这一步强调权重来源可审计，避免把方法说明写成大段文档。
          </div>
        </>
      )}
    />
  )
}

function RgfaStep({ candidate, trace, isNarrow }) {
  const cards = [
    ["Gate", trace.rgfaScore.gate, palette.accent],
    ["StepScore", trace.rgfaScore.stepScore, palette.mixed],
    ["SelectivityFactor", trace.rgfaScore.selectivityFactor, palette.positive],
    ["RGFA", trace.rgfaScore.result, palette.positive],
  ]

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="最终评分 RGFA Score"
      subtitle="把材料门槛、反应步骤和选择性三部分压缩成一个可解释的排序信号。"
      lead={(
        <FormulaCard title="RGFA formula">
          <FormulaInline>
            <span>Gate</span><span>×</span><span>StepScore</span><span>×</span><span>SelectivityFactor</span><span>=</span><span>{fmt(trace.rgfaScore.result)}</span>
          </FormulaInline>
        </FormulaCard>
      )}
      detail={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {cards.map(([label, value, tone]) => (
            <SummaryMetric
              key={label}
              label={label}
              value={<NumericText style={{ color: tone, fontSize: 16, fontWeight: 800 }}>{fmt(value)}</NumericText>}
              tone={tone}
            />
          ))}
        </div>
      )}
      summary={(
        <>
          <SummaryMetric label="Candidate class" value={candidate.computedClass} tone={toneForClass(candidate.computedClass)} />
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            RGFA 不是实验结论，而是下一轮验证资源应该优先给谁的工作台分数。
          </div>
        </>
      )}
    />
  )
}

function RankingStep({ candidate, trace, isNarrow }) {
  const shift = `${trace.rankingImpact.yieldOnlyRank ? `#${trace.rankingImpact.yieldOnlyRank}` : "-"} → ${trace.rankingImpact.rgfaRank ? `#${trace.rankingImpact.rgfaRank}` : "-"}`

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="排名影响 Ranking Impact"
      subtitle="左右对照“只看产率”和“引入 RGFA 后”的位置变化。"
      lead={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
          <SummaryMetric label="Yield-only ranking" value={<NumericText style={{ color: palette.text, fontSize: 16, fontWeight: 800 }}>#{trace.rankingImpact.yieldOnlyRank || "-"}</NumericText>} note="只看甲酸产率，碳选择性用于打破并列" />
          <SummaryMetric label="RGFA + CRITIC ranking" value={<NumericText style={{ color: palette.positive, fontSize: 16, fontWeight: 800 }}>#{trace.rankingImpact.rgfaRank || "-"}</NumericText>} tone={palette.positive} note="加入路径风险、Gate 和副产物惩罚" />
        </div>
      )}
      detail={(
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 12 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Rank shift</div>
          <div style={{ color: palette.text, fontSize: 20, fontWeight: 800, marginTop: 6 }}><NumericText>{shift}</NumericText></div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{trace.rankingImpact.explanation}</div>
        </div>
      )}
      summary={(
        <>
          <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>{candidate.explanations.at(-1) || "当前候选排名变化不大。"}</div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
            排名变化本质上回答一个问题：为什么该候选不该只靠产率排位。
          </div>
        </>
      )}
    />
  )
}

function ExperimentStep({ trace, isNarrow }) {
  const cards = nextExperimentCards(trace.recommendation)

  return (
    <TraceLayout
      isNarrow={isNarrow}
      title="下一步实验 Next Experiment"
      subtitle="把当前排序转成可执行的实验动作，而不是留在抽象解释层。"
      lead={(
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {cards.map((card, index) => (
            <article key={card.title} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 12 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
                <div style={{ alignItems: "center", background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.accent, display: "flex", fontSize: 11.5, fontWeight: 800, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</div>
                <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 800 }}>{card.title}</div>
              </div>
              <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>{card.label}</div>
              <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{card.reason}</div>
            </article>
          ))}
        </div>
      )}
      detail={(
        <FormulaCard title="Recommendation type">
          <div style={{ color: palette.text, fontSize: 13, fontWeight: 700, lineHeight: 1.45 }}>{trace.recommendation.type}</div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>{trace.recommendation.reason}</div>
        </FormulaCard>
      )}
      summary={(
        <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>
          当前建议优先级来自 RGFA、路径风险和证据状态的组合，不代表实验已经完成。
        </div>
      )}
    />
  )
}

function PathwaySummary({ trace }) {
  const sorted = PATHWAY_SCORE_KEYS
    .map((key) => ({ key, value: trace.pathwayFingerprint[key] }))
    .sort((a, b) => safeNumber(b.value, 0) - safeNumber(a.value, 0))
  return sorted[0]?.key
}

function StepDetail({ candidate, activeStep, isNarrow }) {
  const trace = candidate.trace
  const dominantPath = PathwaySummary({ trace })

  const detailMap = {
    raw: <RawStep candidate={candidate} trace={trace} isNarrow={isNarrow} />,
    gate: <GateStep trace={trace} isNarrow={isNarrow} />,
    pathway: <PathwayStep trace={trace} isNarrow={isNarrow} dominantPath={dominantPath} />,
    step: <StepScoreStep trace={trace} isNarrow={isNarrow} />,
    selectivity: <SelectivityStep trace={trace} isNarrow={isNarrow} />,
    critic: <CriticStep trace={trace} isNarrow={isNarrow} />,
    rgfa: <RgfaStep candidate={candidate} trace={trace} isNarrow={isNarrow} />,
    ranking: <RankingStep candidate={candidate} trace={trace} isNarrow={isNarrow} />,
    experiment: <ExperimentStep trace={trace} isNarrow={isNarrow} />,
  }

  return detailMap[activeStep] || detailMap.raw
}

export function AlgorithmTraceExplorer({ rankedRows = [], selectedMof, setSelectedMof }) {
  const { isNarrow } = useViewport()
  const [activeStep, setActiveStep] = useState("raw")
  const selected = useMemo(() => (
    rankedRows.find((row) => row.mof === selectedMof) || rankedRows[0] || null
  ), [rankedRows, selectedMof])

  if (!selected) {
    return (
      <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, padding: 18, fontFamily: ORGANIC_ACID_FONT }}>
        <div style={{ color: palette.text, fontSize: 16, fontWeight: 700 }}>算法追踪器 Algorithm Trace Explorer</div>
        <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, marginTop: 6 }}>正在等待 organic_acid_project_demo.json 演示数据。</div>
      </section>
    )
  }

  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 18, fontFamily: ORGANIC_ACID_FONT }}>
      <div style={{ alignItems: "end", display: "grid", gap: 10, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.95fr) minmax(220px, 0.65fr) minmax(280px, 0.7fr)" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.18, textTransform: "uppercase" }}>Algorithm Trace Explorer</div>
          <h2 style={{ color: palette.text, fontSize: 22, lineHeight: 1.15, margin: 0 }}>算法追踪器 Algorithm Trace Explorer</h2>
          <p style={{ color: palette.muted, fontSize: 12.75, lineHeight: 1.55, margin: 0 }}>
            候选选择、紧凑流程条与当前步骤工作台联动展示。保留上方三路径动态图，只修复算法工作台的视觉密度与排版。
          </p>
        </div>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ color: palette.text, fontSize: 12.5, fontWeight: 700 }}>当前候选 Candidate</span>
          <select
            value={selected.mof}
            onChange={(event) => setSelectedMof(event.target.value)}
            style={{
              appearance: "none",
              background: palette.bg,
              border: `1px solid ${palette.borderStrong}`,
              borderRadius: 10,
              color: palette.text,
              fontFamily: ORGANIC_ACID_FONT,
              fontSize: 13,
              minHeight: 36,
              padding: "0 12px",
            }}
          >
            {rankedRows.map((row) => (
              <option key={row.mof} value={row.mof}>{row.mof}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <SummaryMetric label="RGFA Score" value={<NumericText style={{ color: palette.positive, fontSize: 15, fontWeight: 700 }}>{fmt(selected.rgfaScore)}</NumericText>} tone={palette.positive} />
          <SummaryMetric label="Class" value={selected.computedClass} tone={toneForClass(selected.computedClass)} />
          <SummaryMetric label="Rank shift" value={<><NumericText>#{selected.yieldOnlyRank}</NumericText> → <NumericText>#{selected.rgfaRank}</NumericText></>} note="Yield-only → RGFA" />
        </div>
      </div>

      <CandidateSelector rankedRows={rankedRows} selected={selected} setSelectedMof={setSelectedMof} isNarrow={isNarrow} />
      <Stepper activeStep={activeStep} setActiveStep={setActiveStep} />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.28fr) minmax(280px, 0.72fr)", alignItems: "start" }}>
        <article style={{ background: palette.bg, border: `1px solid ${palette.borderStrong}`, borderRadius: 12, minWidth: 0, padding: 12 }}>
          <StepDetail candidate={selected} activeStep={activeStep} isNarrow={isNarrow} />
        </article>
        <CandidateSummary candidate={selected} activeStep={activeStep} />
      </div>
    </section>
  )
}
