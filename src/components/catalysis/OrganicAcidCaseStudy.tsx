// @ts-nocheck
import {
  organicAcidCaseSummary,
  organicAcidCompletenessMatrix,
  organicAcidDecisionRules,
  organicAcidFieldPriority,
  organicAcidFutureDataLevels,
  organicAcidIntakeTemplate,
  organicAcidMockRecord,
  organicAcidReadinessClasses,
  organicAcidReadinessTrace,
  organicAcidWorkflowSteps,
} from "../../data/organicAcidFramework"

function Panel({ ariaLabel, children, t, style = {} }) {
  return (
    <section aria-label={ariaLabel} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, maxWidth: "100%", minWidth: 0, padding: 18, ...style }}>
      {children}
    </section>
  )
}

function SectionHeader({ eyebrow, title, note, t }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase" }}>{eyebrow}</div>
      <h3 style={{ color: t.textStrong, fontSize: 16, fontWeight: 950, lineHeight: 1.25, margin: 0 }}>{title}</h3>
      {note ? <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
    </div>
  )
}

function StatusDot({ status, t }) {
  const color = status === "available" ? t.accent : status === "missing" ? t.badgeWarnText : status === "partial" ? t.badgeCalcText : t.faint
  return <span aria-hidden="true" style={{ background: color, borderRadius: 999, display: "inline-block", height: 7, width: 7 }} />
}

function formatPriority(priority, lang) {
  if (lang !== "zh") return priority
  const labels = {
    required: "必需",
    recommended: "推荐",
    derived: "派生",
  }
  return labels[priority] || priority
}

function formatMatrixLabel(label, lang) {
  if (lang !== "zh") return label
  const labels = {
    available: "可用",
    partial: "部分",
    missing: "缺失",
    "framework-only": "仅框架级",
  }
  return labels[label] || label
}

function formatClassLabel(label, lang) {
  if (lang !== "zh") return label
  if (label === "framework-only") return "仅框架级 / framework-only"
  if (label === "comparison-ready") return "可比较 / comparison-ready"
  if (label === "contextual-only") return "仅语境解释 / contextual-only"
  if (label === "incomplete") return "不完整 / incomplete"
  return label
}

function DefinitionList({ items, t }) {
  return (
    <dl style={{ display: "grid", gap: 8, margin: 0, minWidth: 0 }}>
      {items.map(item => (
        <div key={item.label} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, gridTemplateColumns: "minmax(86px, 0.38fr) minmax(0, 1fr)", minWidth: 0, paddingTop: 8 }}>
          <dt style={{ color: t.faint, fontSize: 11, fontWeight: 850, minWidth: 0 }}>{item.label}</dt>
          <dd style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, margin: 0, minWidth: 0, overflowWrap: "anywhere" }}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function OrganicAcidHero({ lang, summary, t }) {
  const cards = lang === "zh"
    ? [
        ["记录生命周期", "原始记录 → 标准化记录 → 准备度等级"],
        ["证据感知", "来源、定量方法、碳源证据先被标注"],
        ["可比性准备度", "只有证据和条件足够时才进入比较"],
      ]
    : [
        ["Record lifecycle", "Raw note → normalized record → readiness class"],
        ["Evidence-aware", "Source, quantification, and carbon evidence are tagged first"],
        ["Comparison-ready", "Comparison is enabled only after evidence and context checks"],
      ]

  return (
    <Panel t={t} style={{ background: `linear-gradient(135deg, ${t.panel}, ${t.surface})`, borderLeft: `3px solid ${t.accent}` }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <div style={{ color: t.faint, fontSize: 11, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase" }}>
            {lang === "zh" ? "框架优先的公开演示" : "Framework-first public demo"}
          </div>
          <h2 style={{ color: t.textStrong, fontSize: 22, fontWeight: 950, lineHeight: 1.18, margin: "5px 0 0" }}>
            {lang === "zh" ? summary.titleZh : summary.titleEn} v0
          </h2>
          <div style={{ color: t.accentText, fontSize: 13, fontWeight: 850, marginTop: 6 }}>
            {lang === "zh" ? summary.pathwayZh : summary.pathwayEn}
          </div>
          <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.62, margin: "10px 0 0", maxWidth: 920 }}>
            {lang === "zh" ? summary.purposeZh : summary.purposeEn}
          </p>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {cards.map(([title, value]) => (
            <article key={title} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{title}</div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.5, marginTop: 6 }}>{value}</div>
            </article>
          ))}
        </div>

        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.6, padding: 11 }}>
          {lang === "zh"
            ? "当前公开演示不包含合作方未公开实验数据，也不发布真实实验结果。"
            : "No collaborator-owned experimental data are included in this public demo, and no experimental results are published here."}
        </div>
      </div>
    </Panel>
  )
}

function CurationWorkflow({ lang, t, workflowSteps }) {
  return (
    <Panel ariaLabel="Curation Workflow" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "数据整理工作流" : "Curation workflow"}
        title={lang === "zh" ? "从原始记录到可比性感知输出" : "From raw note to comparison-aware output"}
        note={lang === "zh" ? "每一步都把非结构化描述推进到可审计字段、证据状态和准备度等级。" : "Each step moves a heterogeneous description toward auditable fields, evidence status, and readiness class."}
        t={t}
      />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginTop: 16 }}>
        {workflowSteps.map((step, index) => (
          <article key={step.stepEn} style={{ background: index === 0 ? t.badgeInfoBg : t.bg, border: `1px solid ${t.border}`, borderRadius: 12, minHeight: 150, padding: 12, position: "relative" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
              <span style={{ alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 950, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</span>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 950, lineHeight: 1.35 }}>{lang === "zh" ? step.stepZh : step.stepEn}</div>
            </div>
            <div style={{ borderTop: `1px solid ${t.divider}`, marginTop: 10, paddingTop: 9 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{lang === "zh" ? "输入" : "Input"}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.45, marginTop: 3 }}>{lang === "zh" ? step.inputZh : step.inputEn}</div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, marginTop: 8 }}>{lang === "zh" ? "输出" : "Output"}</div>
              <div style={{ color: t.textStrong, fontSize: 11, lineHeight: 1.45, marginTop: 3 }}>{lang === "zh" ? step.outputZh : step.outputEn}</div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, marginTop: 8 }}>{lang === "zh" ? "处理方式" : "Processing"}</div>
              <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.45, marginTop: 3 }}>{lang === "zh" ? step.processingZh : step.processingEn}</div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function FieldPriorityModel({ fieldPriority, lang, t }) {
  const groups = ["required", "recommended", "derived"].map(key => fieldPriority[key])
  return (
    <Panel ariaLabel="Field Priority Model" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "字段优先级模型" : "Field priority model"}
        title={lang === "zh" ? "字段不是清单，而是判定模型" : "Fields are a decision model, not a checklist"}
        note={lang === "zh" ? "必需字段决定记录是否成立，推荐字段决定能否比较，派生字段输出整理状态。" : "Required fields validate the record, recommended fields support comparison, and derived fields produce curation labels."}
        t={t}
      />
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginTop: 16 }}>
        {groups.map(group => {
          const fields = lang === "zh" ? group.fieldsZh : group.fieldsEn
          return (
            <article key={group.en} style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 950 }}>{lang === "zh" ? group.zh : group.en}</div>
              <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, margin: "6px 0 0" }}>{lang === "zh" ? group.purposeZh : group.purposeEn}</p>
              <ol style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.65, margin: "10px 0 0", paddingLeft: 18 }}>
                {fields.slice(0, 7).map(field => <li key={field}>{field}</li>)}
              </ol>
              {fields.length > 7 ? <div style={{ color: t.faint, fontSize: 11, marginTop: 6 }}>+ {fields.length - 7} {lang === "zh" ? "个补充字段" : "additional fields"}</div> : null}
            </article>
          )
        })}
      </div>
    </Panel>
  )
}

function MockRecordTransformation({ lang, mockRecord, t }) {
  return (
    <Panel ariaLabel="Mock Record Transformation" t={t} style={{ borderLeft: `3px solid ${t.accent}` }}>
      <SectionHeader
        eyebrow={lang === "zh" ? "示例记录转换" : "Example record transformation"}
        title={lang === "zh" ? "一条记录如何被标准化" : "How one record is normalized"}
        note={lang === "zh" ? "该示例记录只展示整理逻辑；数值为隐藏、缺失或待补充状态。" : "This example record shows curation logic only; values are hidden, missing, or awaiting curation."}
        t={t}
      />
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 16 }}>
        <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? mockRecord.labelZh : mockRecord.labelEn}</div>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "8px 0 0" }}>
            {lang === "zh" ? mockRecord.rawInputZh : mockRecord.rawInputEn}
          </p>
        </aside>
        <div style={{ maxWidth: "100%", minWidth: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr>
                {(lang === "zh" ? ["字段", "标准化值", "状态", "重要性"] : ["Field", "Value", "Status", "Why it matters"]).map(head => (
                  <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 11, padding: "8px 10px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockRecord.normalizedRows.map(row => (
                <tr key={row.fieldEn}>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 850, padding: "10px" }}>{lang === "zh" ? row.fieldZh : row.fieldEn}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>{lang === "zh" ? row.valueZh : row.valueEn}</td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, padding: "10px", whiteSpace: "nowrap" }}>
                    <span style={{ alignItems: "center", display: "inline-flex", gap: 7 }}>
                      <StatusDot status={row.statusEn} t={t} />
                      {lang === "zh" ? row.statusZh : row.statusEn}
                    </span>
                  </td>
                  <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>{lang === "zh" ? row.whyZh : row.whyEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  )
}

function RecordIntakeTemplate({ intakeTemplate, lang, t }) {
  const groups = intakeTemplate.reduce((acc, row) => {
    const label = lang === "zh" ? row.groupZh : row.groupEn
    acc[label] = acc[label] || []
    acc[label].push(row)
    return acc
  }, {})

  return (
    <Panel ariaLabel="Record Intake Template" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "记录输入模板" : "Record intake template"}
        title={lang === "zh" ? "实验记录需要如何提交和整理" : "How an experimental record is submitted and structured"}
        note={lang === "zh" ? "输入模板说明字段组、优先级、示例格式和用途；示例不包含真实实验数值。" : "The intake template shows field group, priority, example format, and purpose; examples contain no experimental values."}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {Object.entries(groups).map(([group, rows]) => (
          <article key={group} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{group}</div>
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {rows.map(row => (
                <div key={`${row.groupEn}-${row.fieldEn}`} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", minWidth: 0, paddingTop: 8 }}>
                  <div>
                    <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.fieldZh : row.fieldEn}</div>
                    <div style={{ color: t.faint, fontSize: 11, fontWeight: 850, marginTop: 3 }}>{formatPriority(row.priority, lang)}</div>
                  </div>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", minWidth: 0 }}>
                    <div>
                      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{lang === "zh" ? "占位示例" : "Example entry"}</div>
                      <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{lang === "zh" ? row.exampleZh : row.exampleEn}</div>
                    </div>
                    <div>
                      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{lang === "zh" ? "用途" : "Why it matters"}</div>
                      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>{lang === "zh" ? row.whyZh : row.whyEn}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function CompletenessMatrix({ completenessMatrix, lang, t }) {
  return (
    <Panel ariaLabel="Completeness Matrix" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "完整度矩阵" : "Completeness matrix"}
        title={lang === "zh" ? "缺失字段如何影响可比性" : "How missing fields affect comparability"}
        note={lang === "zh" ? "矩阵按字段组显示可用、部分、缺失和仅框架级状态，并给出解释。" : "The matrix diagnoses available, partial, missing, and framework-only status by field group."}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", marginTop: 14 }}>
        {completenessMatrix.map(item => (
          <article key={item.groupEn} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? item.groupZh : item.groupEn}</div>
            <DefinitionList
              t={t}
              items={[
                { label: formatMatrixLabel("available", lang), value: lang === "zh" ? item.availableZh : item.availableEn },
                { label: formatMatrixLabel("partial", lang), value: lang === "zh" ? item.partialZh : item.partialEn },
                { label: formatMatrixLabel("missing", lang), value: lang === "zh" ? item.missingZh : item.missingEn },
                { label: formatMatrixLabel("framework-only", lang), value: lang === "zh" ? item.frameworkOnlyZh : item.frameworkOnlyEn },
              ]}
            />
            <div style={{ borderTop: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 10, paddingTop: 10 }}>
              {lang === "zh" ? item.interpretationZh : item.interpretationEn}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function ReadinessTrace({ lang, readinessTrace, t }) {
  const traceItems = [
    { label: lang === "zh" ? "必需字段检查" : "Required checks", value: lang === "zh" ? readinessTrace.requiredChecksZh : readinessTrace.requiredChecksEn },
    { label: lang === "zh" ? "推荐字段检查" : "Recommended checks", value: lang === "zh" ? readinessTrace.recommendedChecksZh : readinessTrace.recommendedChecksEn },
    { label: lang === "zh" ? "派生标签" : "Derived labels", value: lang === "zh" ? readinessTrace.derivedLabelsZh : readinessTrace.derivedLabelsEn },
    { label: lang === "zh" ? "最终等级" : "Final class", value: formatClassLabel(readinessTrace.finalClass, lang) },
  ]

  return (
    <Panel ariaLabel="Readiness Trace" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "判定轨迹" : "Readiness trace"}
        title={lang === "zh" ? "为什么当前示例记录仅具备框架级信息" : "Why the example record is framework-level"}
        note={lang === "zh" ? "判定轨迹展示必需、推荐和派生字段如何共同生成最终等级。" : "The trace shows how required, recommended, and derived checks produce the final class."}
        t={t}
      />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {traceItems.map((item, index) => (
          <article key={item.label} style={{ alignItems: "start", display: "grid", gap: 10, gridTemplateColumns: "30px minmax(0, 1fr)" }}>
            <div style={{ alignItems: "center", background: index === 3 ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: index === 3 ? t.badgeWarnText : t.accentText, display: "flex", fontSize: 12, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>{index + 1}</div>
            <div style={{ borderBottom: `1px solid ${t.divider}`, paddingBottom: 10 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{item.label}</div>
              <div style={{ color: index === 3 ? t.badgeWarnText : t.muted, fontSize: 12, fontWeight: index === 3 ? 850 : 500, lineHeight: 1.55, marginTop: 5 }}>{item.value}</div>
            </div>
          </article>
        ))}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: 12 }}>
        <strong style={{ color: t.textStrong }}>{lang === "zh" ? "原因：" : "Reason: "}</strong>
        {lang === "zh" ? readinessTrace.reasonZh : readinessTrace.reasonEn}
      </div>
    </Panel>
  )
}

function ComparabilityDecisionLogic({ decisionRules, lang, t }) {
  return (
    <Panel ariaLabel="Comparability Decision Logic" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "可比性判断逻辑" : "Comparability decision logic"}
        title={lang === "zh" ? "缺失字段如何改变可比性判断" : "How missing fields change comparability"}
        note={lang === "zh" ? "规则表将条件、判断和解释分开，避免把缺失字段误读为性能差。" : "Rules separate conditions, decisions, and explanations so missing fields are not treated as poor performance."}
        t={t}
      />
      <div style={{ marginTop: 14, maxWidth: "100%", minWidth: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
          <thead>
            <tr>
              {(lang === "zh" ? ["条件", "判断", "解释"] : ["Condition", "Decision", "Explanation"]).map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 11, padding: "8px 10px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisionRules.map(rule => (
              <tr key={rule.conditionEn}>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, lineHeight: 1.45, padding: "10px" }}>{lang === "zh" ? rule.conditionZh : rule.conditionEn}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.accentText, fontSize: 12, fontWeight: 850, padding: "10px" }}>{lang === "zh" ? rule.decisionZh : rule.decisionEn}</td>
                <td style={{ borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 12, lineHeight: 1.5, padding: "10px" }}>{lang === "zh" ? rule.explanationZh : rule.explanationEn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function ReadinessClasses({ lang, readinessClasses, readinessTrace, t }) {
  return (
    <Panel ariaLabel="Output Readiness Classes" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "输出准备度等级" : "Output readiness classes"}
        title={lang === "zh" ? "最终输出等级如何产生" : "How final readiness class is produced"}
        note={lang === "zh" ? "准备度来自必需字段、推荐字段和派生标签的组合，不代表真实性能排序。" : "Readiness comes from required fields, recommended fields, and derived labels; it is not a performance ranking."}
        t={t}
      />
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, marginTop: 14, padding: 12 }}>
        <DefinitionList
          t={t}
          items={[
            { label: lang === "zh" ? "必需字段" : "Required", value: lang === "zh" ? readinessTrace.requiredChecksZh : readinessTrace.requiredChecksEn },
            { label: lang === "zh" ? "推荐字段" : "Recommended", value: lang === "zh" ? readinessTrace.recommendedChecksZh : readinessTrace.recommendedChecksEn },
            { label: lang === "zh" ? "派生标签" : "Derived", value: lang === "zh" ? readinessTrace.derivedLabelsZh : readinessTrace.derivedLabelsEn },
            { label: lang === "zh" ? "当前等级" : "Current class", value: formatClassLabel(readinessTrace.finalClass, lang) },
            { label: lang === "zh" ? "原因" : "Reason", value: lang === "zh" ? readinessTrace.reasonZh : readinessTrace.reasonEn },
          ]}
        />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", marginTop: 14 }}>
        {readinessClasses.map(item => (
          <article key={item.className} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: t.textStrong, fontFamily: "monospace", fontSize: 13, fontWeight: 950 }}>{formatClassLabel(item.className, lang)}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{lang === "zh" ? item.meaningZh : item.meaningEn}</div>
            <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.5, marginTop: 10 }}>{lang === "zh" ? item.allowedUseZh : item.allowedUseEn}</div>
            <div style={{ borderTop: `1px solid ${t.divider}`, color: t.faint, fontSize: 11, lineHeight: 1.45, marginTop: 10, paddingTop: 8 }}>
              {lang === "zh" ? item.requiredEvidenceZh : item.requiredEvidenceEn}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function FutureDataIntegrationLevels({ futureDataLevels, lang, t }) {
  return (
    <Panel ariaLabel="Future Data Integration Levels" t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "未来数据接入等级" : "Future data integration levels"}
        title={lang === "zh" ? "真实合作数据未来如何安全接入" : "How future collaborator data can be integrated safely"}
        note={lang === "zh" ? "该区块只描述未来授权数据能补充什么，不暗示当前公开页面已包含合作方数据。" : "This section describes what authorized data could add later; it does not imply that collaborator data are included now."}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
        {futureDataLevels.map(level => (
          <article key={level.levelEn} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? level.levelZh : level.levelEn}</div>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "可展示" : "Can display", value: lang === "zh" ? level.canDisplayZh : level.canDisplayEn },
                { label: lang === "zh" ? "需隐藏" : "Should hide", value: lang === "zh" ? level.shouldHideZh : level.shouldHideEn },
                { label: lang === "zh" ? "用途" : "Use case", value: lang === "zh" ? level.useCaseZh : level.useCaseEn },
              ]}
            />
          </article>
        ))}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? "当前公开状态" : "Current public status"}</div>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" }}>
            {lang === "zh" ? "当前公开演示不包含合作方未公开实验数据；真实记录进入公开页面前需要来源、授权和敏感字段边界检查。" : "No collaborator-owned experimental data are included in this public demo. Real records require provenance, permission, and sensitivity checks before public display."}
          </p>
        </div>
      </div>
    </Panel>
  )
}

export function OrganicAcidCaseStudy({ lang, t }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <OrganicAcidHero lang={lang} summary={organicAcidCaseSummary} t={t} />
      <CurationWorkflow lang={lang} t={t} workflowSteps={organicAcidWorkflowSteps} />
      <FieldPriorityModel fieldPriority={organicAcidFieldPriority} lang={lang} t={t} />
      <MockRecordTransformation lang={lang} mockRecord={organicAcidMockRecord} t={t} />
      <RecordIntakeTemplate intakeTemplate={organicAcidIntakeTemplate} lang={lang} t={t} />
      <CompletenessMatrix completenessMatrix={organicAcidCompletenessMatrix} lang={lang} t={t} />
      <ReadinessTrace lang={lang} readinessTrace={organicAcidReadinessTrace} t={t} />
      <ComparabilityDecisionLogic decisionRules={organicAcidDecisionRules} lang={lang} t={t} />
      <ReadinessClasses lang={lang} readinessClasses={organicAcidReadinessClasses} readinessTrace={organicAcidReadinessTrace} t={t} />
      <FutureDataIntegrationLevels futureDataLevels={organicAcidFutureDataLevels} lang={lang} t={t} />
    </div>
  )
}
