import {
  organicAcidCaseSummary,
  organicAcidDecisionRules,
  organicAcidFieldPriority,
  organicAcidFutureCollaboratorData,
  organicAcidMockRecord,
  organicAcidReadinessClasses,
  organicAcidReadinessTrace,
  organicAcidWorkflowSteps,
} from "../../data/organicAcidFramework"

function Panel({ children, t, style = {} }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18, ...style }}>
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

function DefinitionList({ items, t }) {
  return (
    <dl style={{ display: "grid", gap: 8, margin: 0 }}>
      {items.map(item => (
        <div key={item.label} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, gridTemplateColumns: "128px minmax(0, 1fr)", paddingTop: 8 }}>
          <dt style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{item.label}</dt>
          <dd style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function OrganicAcidHero({ lang, t }) {
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
            {lang === "zh" ? organicAcidCaseSummary.titleZh : organicAcidCaseSummary.titleEn} v0
          </h2>
          <div style={{ color: t.accentText, fontSize: 13, fontWeight: 850, marginTop: 6 }}>
            {lang === "zh" ? organicAcidCaseSummary.pathwayZh : organicAcidCaseSummary.pathwayEn}
          </div>
          <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.62, margin: "10px 0 0", maxWidth: 920 }}>
            {lang === "zh" ? organicAcidCaseSummary.purposeZh : organicAcidCaseSummary.purposeEn}
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

function CurationWorkflow({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "数据整理工作流" : "Curation workflow"}
        title={lang === "zh" ? "从原始记录到可比性感知输出" : "From raw note to comparison-aware output"}
        note={lang === "zh" ? "每一步都把非结构化描述推进到可审计字段、证据状态和准备度等级。" : "Each step moves a heterogeneous description toward auditable fields, evidence status, and readiness class."}
        t={t}
      />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginTop: 16 }}>
        {organicAcidWorkflowSteps.map((step, index) => (
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
              <details style={{ color: t.muted, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>
                <summary style={{ color: t.faint, cursor: "pointer", fontWeight: 850 }}>{lang === "zh" ? "处理方式" : "Processing"}</summary>
                <div style={{ marginTop: 4 }}>{lang === "zh" ? step.processingZh : step.processingEn}</div>
              </details>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function FieldPriorityModel({ lang, t }) {
  const groups = ["required", "recommended", "derived"].map(key => organicAcidFieldPriority[key])
  return (
    <Panel t={t}>
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

function MockRecordTransformation({ lang, t }) {
  return (
    <Panel t={t} style={{ borderLeft: `3px solid ${t.accent}` }}>
      <SectionHeader
        eyebrow={lang === "zh" ? "Mock 记录转换" : "Mock record transformation"}
        title={lang === "zh" ? "一条记录如何被标准化" : "How one record is normalized"}
        note={lang === "zh" ? "该 mock 记录只展示整理逻辑；数值为隐藏、缺失或占位状态。" : "This mock record shows curation logic only; values are hidden, missing, or framework placeholders."}
        t={t}
      />
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 16 }}>
        <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? organicAcidMockRecord.labelZh : organicAcidMockRecord.labelEn}</div>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.65, margin: "8px 0 0" }}>
            {lang === "zh" ? organicAcidMockRecord.rawInputZh : organicAcidMockRecord.rawInputEn}
          </p>
        </aside>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr>
                {(lang === "zh" ? ["Field", "标准化值", "状态", "为什么重要"] : ["Field", "Value", "Status", "Why it matters"]).map(head => (
                  <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 11, padding: "8px 10px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organicAcidMockRecord.normalizedRows.map(row => (
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

function ComparabilityDecisionLogic({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "可比性判断逻辑" : "Comparability decision logic"}
        title={lang === "zh" ? "缺失字段如何改变可比性判断" : "How missing fields change comparability"}
        note={lang === "zh" ? "规则表将条件、判断和解释分开，避免把缺失字段误读为性能差。" : "Rules separate conditions, decisions, and explanations so missing fields are not treated as poor performance."}
        t={t}
      />
      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <table style={{ borderCollapse: "collapse", minWidth: 720, width: "100%" }}>
          <thead>
            <tr>
              {(lang === "zh" ? ["条件", "判断", "解释"] : ["Condition", "Decision", "Explanation"]).map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${t.border}`, color: t.faint, fontSize: 11, padding: "8px 10px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organicAcidDecisionRules.map(rule => (
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

function ReadinessClasses({ lang, t }) {
  return (
    <Panel t={t}>
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
            { label: lang === "zh" ? "必需字段" : "Required", value: lang === "zh" ? organicAcidReadinessTrace.requiredChecksZh : organicAcidReadinessTrace.requiredChecksEn },
            { label: lang === "zh" ? "推荐字段" : "Recommended", value: lang === "zh" ? organicAcidReadinessTrace.recommendedChecksZh : organicAcidReadinessTrace.recommendedChecksEn },
            { label: lang === "zh" ? "派生标签" : "Derived", value: lang === "zh" ? organicAcidReadinessTrace.derivedLabelsZh : organicAcidReadinessTrace.derivedLabelsEn },
            { label: lang === "zh" ? "当前等级" : "Current class", value: organicAcidReadinessTrace.finalClass },
            { label: lang === "zh" ? "原因" : "Reason", value: lang === "zh" ? organicAcidReadinessTrace.reasonZh : organicAcidReadinessTrace.reasonEn },
          ]}
        />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", marginTop: 14 }}>
        {organicAcidReadinessClasses.map(item => (
          <article key={item.className} style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
            <div style={{ color: t.textStrong, fontFamily: "monospace", fontSize: 13, fontWeight: 950 }}>{item.className}</div>
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

function FutureDataIntegration({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionHeader
        eyebrow={lang === "zh" ? "未来数据接入" : "Future data integration"}
        title={lang === "zh" ? "真实合作数据未来如何安全接入" : "How future collaborator data can be integrated safely"}
        note={lang === "zh" ? "该区块只描述未来授权数据能补充什么，不暗示当前公开页面已包含合作方数据。" : "This section describes what authorized data could add later; it does not imply that collaborator data are included now."}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? "当前公开状态" : "Current public status"}</div>
          <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" }}>
            {lang === "zh" ? "当前公开演示不包含合作方未公开实验数据；真实记录进入公开页面前需要来源、授权和敏感字段边界检查。" : "No collaborator-owned experimental data are included in this public demo. Real records require provenance, permission, and sensitivity checks before public display."}
          </p>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {organicAcidFutureCollaboratorData.map((item, index) => (
            <article key={item.en} style={{ borderTop: `2px solid ${index < 2 ? t.accent : t.divider}`, paddingTop: 10 }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</div>
              <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, lineHeight: 1.5, marginTop: 4 }}>{lang === "zh" ? item.zh : item.en}</div>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  )
}

export function OrganicAcidCaseStudy({ lang, t }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <OrganicAcidHero lang={lang} t={t} />
      <CurationWorkflow lang={lang} t={t} />
      <FieldPriorityModel lang={lang} t={t} />
      <MockRecordTransformation lang={lang} t={t} />
      <ComparabilityDecisionLogic lang={lang} t={t} />
      <ReadinessClasses lang={lang} t={t} />
      <FutureDataIntegration lang={lang} t={t} />
    </div>
  )
}
