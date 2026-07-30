// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { BasisBadge } from "../ui"
import { SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"
import { MethodAlgorithmStepper } from "./MethodAlgorithmStepper"
import { MethodEvidenceBoundary } from "./MethodEvidenceBoundary"
import { MethodFormulaCard } from "./MethodFormulaCard"
import { MethodIOPanel } from "./MethodIOPanel"
import { MethodVisualizationCard } from "./MethodVisualizationCard"
import { MethodInteractiveWorkbench } from "./MethodInteractiveWorkbench"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function BadgeList({ rows = [], t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {rows.map(row => (
        <span key={row} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 760, lineHeight: 1.2, padding: "5px 8px" }}>
          <ChemicalText value={row} />
        </span>
      ))}
    </div>
  )
}

function MethodReferences({ references = [], lang, t }) {
  if (!references.length) return null
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
      <strong style={{ color: t.textStrong, fontSize: 12.3 }}>{text(lang, "方法与数据依据", "Method and data sources")}</strong>
      <div style={{ display: "grid", gap: 7 }}>
        {references.map(reference => (
          <div key={reference.id || reference.url || reference.label} style={{ display: "grid", gap: 3 }}>
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: t.accentText, fontSize: 11.8, fontWeight: 850, lineHeight: 1.4, overflowWrap: "anywhere", textDecoration: "none" }}
            >
              <ChemicalText value={reference.label || reference.title || reference.url} />
            </a>
            <span style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5 }}>
              <ChemicalText value={text(lang, reference.noteZh, reference.note)} />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function DetailedMethodExplanation({ group, lang, t }) {
  const steps = Array.isArray(group.algorithmSteps) ? group.algorithmSteps : []
  const inputs = lang === "zh" ? group.inputsZh : group.inputs
  const outputs = lang === "zh" ? group.outputsZh : group.outputs
  const limits = lang === "zh" ? group.limitationsZh : group.limitations
  const references = Array.isArray(group.references) ? group.references : []
  const stepSequence = steps
    .map((step, index) => `${index + 1}. ${text(lang, step.labelZh, step.label)}：${text(lang, step.descriptionZh, step.description)}`)
    .join(text(lang, "；", "; "))
  const inputList = (inputs || []).join(text(lang, "、", ", "))
  const outputList = (outputs || []).join(text(lang, "、", ", "))
  const limitList = (limits || []).join(text(lang, "；", "; "))
  const sourceList = references.map(reference => reference.label || reference.title).filter(Boolean).join(text(lang, "、", ", "))

  const rows = [
    {
      titleZh: "研究对象与使用目的",
      titleEn: "Research object and intended use",
      bodyZh: `${group.purposeZh || "本节处理当前功能登记的数据与研究条件。"} 这里首先限定研究对象和可回答的问题，避免把描述性比较扩张为未经验证的因果或性能结论。`,
      bodyEn: `${group.purpose || "This section processes the data and research conditions registered for the current feature."} The intended question is fixed before calculation so a descriptive comparison is not expanded into an unvalidated causal or performance claim.`,
    },
    {
      titleZh: "输入字段与进入条件",
      titleEn: "Input fields and entry criteria",
      bodyZh: `本流程读取${inputList || "本节登记的输入字段"}。进入计算前逐项检查记录身份、字段状态、单位、条件和来源；缺失项保持 missing 或 pending，单位冲突和身份歧义不会被默认值掩盖。`,
      bodyEn: `The workflow reads ${inputList || "the inputs registered for this section"}. Before calculation it checks identity, field state, units, conditions, and provenance. Missing values remain missing or pending, and unit conflicts or identity ambiguity are not hidden by defaults.`,
    },
    {
      titleZh: "执行顺序与中间状态",
      titleEn: "Execution order and intermediate states",
      bodyZh: `实际处理顺序为：${stepSequence || "按本节登记顺序执行数据筛选、计算和校验"}。每一步只接收上一阶段通过检查的输出，同时保留纳入、排除、降级、代理和阻断原因，便于从最终结果回查到中间状态。`,
      bodyEn: `The execution order is: ${stepSequence || "data filtering, calculation, and validation in the registered order"}. Each step consumes only checked output from the previous stage and retains inclusion, exclusion, downgrade, proxy, and blocking reasons for trace-back.`,
    },
    {
      titleZh: "结果生成与页面呈现",
      titleEn: "Result generation and presentation",
      bodyZh: `流程输出${outputList || "结果、解释信息和状态说明"}。页面把来源值、本站计算值、代理值和演示状态分开显示；交互只改变当前查看条件或解释视图，不会在浏览器中覆写正式数据产物。`,
      bodyEn: `The workflow outputs ${outputList || "results, explanations, and state notes"}. Source values, site calculations, proxies, and demonstrations remain visually distinct. UI interactions change the current view or explanatory state and do not overwrite formal artifacts.`,
    },
    {
      titleZh: "核查依据与停止条件",
      titleEn: "Review basis and stop conditions",
      bodyZh: `${sourceList ? `本节登记的直接方法或数据依据包括${sourceList}。` : "本节沿用模块登记的来源、字段溯源和验证规则。"}停止或降级条件包括：${limitList || "来源、条件或必要字段不足以支持当前结论"}。触发后保留已有事实，但不继续生成看似完整的定量结果。`,
      bodyEn: `${sourceList ? `Registered method or data sources include ${sourceList}.` : "This section follows the module's registered sources, field provenance, and validation rules."} Stop or downgrade conditions include: ${limitList || "insufficient provenance, conditions, or required fields"}. Existing facts remain visible, but no complete-looking quantitative result is generated.`,
    },
  ]

  return (
    <section style={{ background: t.surface, borderTop: `1px solid ${t.border}`, display: "grid", gap: 0, paddingTop: 4 }}>
      <header style={{ display: "grid", gap: 4, padding: "8px 0 6px" }}>
        <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "逐项实现说明", "Detailed implementation notes")}</strong>
        <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>
          {text(lang, "以下说明把本节的用途、输入、执行顺序、页面行为和停止条件连成一条可核查链路。", "The notes below connect purpose, input, execution, UI behavior, and stop conditions into one reviewable chain.")}
        </span>
      </header>
      {rows.map((row, index) => (
        <article key={row.titleEn} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 5, gridTemplateColumns: "34px minmax(0, 1fr)", padding: "11px 0" }}>
          <strong style={{ color: t.accentText, fontSize: 11.5 }}>{index + 1}</strong>
          <div style={{ display: "grid", gap: 5 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.4 }}>{text(lang, row.titleZh, row.titleEn)}</strong>
            <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.72, margin: 0 }}>
              <ChemicalText value={text(lang, row.bodyZh, row.bodyEn)} />
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}

function MethodSummaryCard({ item, lang, t }) {
  const example = item.example
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 13 }}>
      <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, item.parentModuleZh, item.parentModule) || text(lang, "方法区", "Method section")}
          </div>
          <h2 style={{ color: t.textStrong, fontSize: 22, fontWeight: 940, lineHeight: 1.13, margin: 0 }}>
            {text(lang, item.moduleZh, item.module)}
          </h2>
        </div>
        <BasisBadge tone={item.id === "limitations-validation" ? "warn" : "info"}>{item.module}</BasisBadge>
      </div>
      <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.62, margin: 0 }}><ChemicalText value={text(lang, item.summaryZh, item.summary)} /></p>
      {item.specialNote ? (
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12.2, lineHeight: 1.55, padding: 10 }}>
          <ChemicalText value={text(lang, item.specialNoteZh, item.specialNote)} />
        </div>
      ) : null}
      {example ? (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, example.titleZh, example.title)}</strong>
          <span style={{ color: t.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.5, lineHeight: 1.45 }}><ChemicalText value={text(lang, example.bodyZh, example.body)} /></span>
        </div>
      ) : null}
    </article>
  )
}

function MethodGroup({ group, lang, t }) {
  const formulas = group.formulas || []
  const visualizations = group.visualizations || []
  const limits = lang === "zh" ? group.limitationsZh : group.limitations
  return (
    <article id={`methodology-${group.id}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, padding: 13, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <h3 style={{ color: t.textStrong, fontSize: 17, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {text(lang, group.titleZh, group.title)}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}><ChemicalText value={text(lang, group.purposeZh, group.purpose)} /></p>
      </header>
      <MethodAlgorithmStepper steps={group.algorithmSteps} lang={lang} t={t} />
      {formulas.length ? (
        <div style={{ alignItems: "stretch", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div style={{ display: "grid", gap: 10 }}>
            {formulas.map(formula => <MethodFormulaCard key={formula.id} formula={formula} lang={lang} t={t} />)}
          </div>
          <MethodInteractiveWorkbench groupId={group.id} lang={lang} t={t} />
        </div>
      ) : null}
      <MethodIOPanel inputs={group.inputs} inputsZh={group.inputsZh} outputs={group.outputs} outputsZh={group.outputsZh} lang={lang} t={t} />
      <DetailedMethodExplanation group={group} lang={lang} t={t} />
      {visualizations.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {visualizations.map(visualization => <MethodVisualizationCard key={visualization.title} visualization={visualization} lang={lang} t={t} />)}
        </div>
      ) : null}
      <MethodReferences references={group.references || []} lang={lang} t={t} />
      {limits?.length ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
          {limits.map(limit => <div key={limit} style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}><ChemicalText value={limit} /></div>)}
        </div>
      ) : null}
    </article>
  )
}

function ImplementationLogic({ item, lang, t }) {
  const rows = item.implementationLogic || (item.methodGroups || []).map(group => ({
    function: text(lang, group.titleZh, group.title),
    trigger: text(lang, group.inputsZh?.slice(0, 2).join("、"), group.inputs?.slice(0, 2).join(", ")),
    process: text(lang, group.algorithmSteps?.map(step => step.labelZh).filter(Boolean).join(" → "), group.algorithmSteps?.map(step => step.label).filter(Boolean).join(" → ")),
    output: text(lang, group.outputsZh?.slice(0, 2).join("、"), group.outputs?.slice(0, 2).join(", ")),
    guard: text(lang, group.limitationsZh?.[0], group.limitations?.[0]),
  }))
  if (!rows.length) return null
  return (
    <section id={`methodology-${item.id}-implementation`} style={{ background: t.panel, border: `1px solid ${t.borderStrong || t.border}`, borderRadius: 11, display: "grid", gap: 11, padding: 13, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "功能实现逻辑", "Implementation logic")}</div>
        <h3 style={{ color: t.textStrong, fontSize: 17, margin: 0 }}>{text(lang, "从操作到结果的完整执行链", "Complete execution chain from action to result")}</h3>
        <p style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.55, margin: 0 }}>{text(lang, "每一项都说明触发条件、处理过程、输出与阻断边界；缺失数据不会被静默补齐。", "Each function states its trigger, processing, output, and guard; missing data are never silently filled.")}</p>
      </header>
      <div style={{ display: "grid", gap: 0 }}>
        {rows.map((row, index) => (
          <article key={`${row.function}-${index}`} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, padding: "12px 0" }}>
            <h4 style={{ color: t.textStrong, fontSize: 13.2, lineHeight: 1.45, margin: 0 }}>
              <span style={{ color: t.accentText, marginRight: 9 }}>{index + 1}</span>
              <ChemicalText value={row.function} />
            </h4>
            <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.68, margin: 0 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "何时触发：", "Trigger: ")}</strong>
              <ChemicalText value={row.trigger || text(lang, "按当前页面输入触发", "Triggered by the current page input")} />
            </p>
            <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.68, margin: 0 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "怎样处理：", "Processing: ")}</strong>
              <ChemicalText value={row.process || text(lang, "依次执行本节登记的算法步骤", "Runs the registered steps in this section")} />
            </p>
            <p style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.68, margin: 0 }}>
              <strong style={{ color: t.textStrong }}>{text(lang, "得到什么：", "Output: ")}</strong>
              <ChemicalText value={row.output || text(lang, "返回结果和解释信息", "Returns a result with explanation")} />
            </p>
            <p style={{ background: t.badgeWarnBg, borderLeft: `3px solid ${t.warn}`, color: t.muted, fontSize: 11.4, lineHeight: 1.65, margin: 0, padding: "8px 10px" }}>
              <strong style={{ color: t.warn }}>{text(lang, "不能越过的边界：", "Guard: ")}</strong>
              <ChemicalText value={row.guard || text(lang, "字段来源状态不满足时停止正式计算", "Formal calculation stops when provenance requirements are not met")} />
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function MethodModuleSection({ item, lang, t }) {
  const inputs = lang === "zh" ? item.inputsZh : item.inputs
  const outputs = lang === "zh" ? item.outputsZh : item.outputs
  return (
    <section id={`methodology-${item.id}`} style={{ display: "grid", gap: 13, scrollMarginTop: 118 }}>
      <MethodSummaryCard item={item} lang={lang} t={t} />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "核心输入", "Core inputs")}</strong>
          <BadgeList rows={inputs} t={t} />
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "核心输出", "Core outputs")}</strong>
          <BadgeList rows={outputs} t={t} />
        </article>
      </div>
      <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, padding: 13 }}>
        <h3 style={{ color: t.textStrong, fontSize: 16, fontWeight: 930, margin: 0 }}>{text(lang, "处理步骤", "Method workflow")}</h3>
        <MethodAlgorithmStepper steps={item.methodWorkflow} lang={lang} t={t} />
      </article>
      {(item.visualizations || []).length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {item.visualizations.map(visualization => <MethodVisualizationCard key={visualization.title} visualization={visualization} lang={lang} t={t} />)}
        </div>
      ) : null}
      {(item.methodGroups || []).map(group => <MethodGroup key={group.id} group={group} lang={lang} t={t} />)}
      <ImplementationLogic item={item} lang={lang} t={t} />
      <MethodEvidenceBoundary item={item} lang={lang} t={t} />
    </section>
  )
}
