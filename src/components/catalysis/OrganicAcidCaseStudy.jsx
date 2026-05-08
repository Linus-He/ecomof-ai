import { BasisBadge } from "../../shared"
import {
  organicAcidCaseSummary,
  organicAcidDecisionRules,
  organicAcidFieldPriority,
  organicAcidFutureCollaboratorData,
  organicAcidMockRecord,
  organicAcidReadinessClasses,
  organicAcidWorkflowSteps,
} from "../../data/organicAcidFramework"

function SectionTitle({ eyebrow, title, t }) {
  return (
    <div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase" }}>{eyebrow}</div>
      <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 950, marginTop: 3 }}>{title}</div>
    </div>
  )
}

function Panel({ children, t, style = {} }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, ...style }}>
      {children}
    </section>
  )
}

function DefinitionList({ items, t }) {
  return (
    <dl style={{ display: "grid", gap: 8, margin: 0 }}>
      {items.map(item => (
        <div key={item.label} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 8, gridTemplateColumns: "112px minmax(0, 1fr)", paddingTop: 8 }}>
          <dt style={{ color: t.faint, fontSize: 11, fontWeight: 850 }}>{item.label}</dt>
          <dd style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, margin: 0 }}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Purpose({ lang, t }) {
  return (
    <Panel t={t} style={{ borderLeft: `3px solid ${t.accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 950 }}>{lang === "zh" ? organicAcidCaseSummary.titleZh : organicAcidCaseSummary.titleEn} v0</div>
          <div style={{ color: t.accentText, fontSize: 13, fontWeight: 850, marginTop: 5 }}>{lang === "zh" ? organicAcidCaseSummary.pathwayZh : organicAcidCaseSummary.pathwayEn}</div>
        </div>
        <BasisBadge tone="warn">{lang === "zh" ? "framework-first" : "framework-first"}</BasisBadge>
      </div>
      <div style={{ color: t.muted, fontSize: 13, lineHeight: 1.65, marginTop: 12 }}>
        {lang === "zh" ? organicAcidCaseSummary.purposeZh : organicAcidCaseSummary.purposeEn}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 12, padding: 12 }}>
        {lang === "zh"
          ? "这是 framework-first demonstration，不是实验结果发布页。当前公开演示不包含合作方未公开实验数据。"
          : "It is a framework-first demonstration, not a publication of experimental results. No collaborator-owned experimental data are included in this public demo."}
      </div>
    </Panel>
  )
}

function Workflow({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle eyebrow={lang === "zh" ? "整理流程" : "Curation workflow"} title={lang === "zh" ? "从原始记录到可比性输出" : "From raw note to comparison-aware output"} t={t} />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {organicAcidWorkflowSteps.map((step, index) => (
          <article key={step.stepEn} style={{ alignItems: "stretch", display: "grid", gap: 10, gridTemplateColumns: "28px minmax(0, 1fr)", position: "relative" }}>
            <div style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "flex", fontSize: 12, fontWeight: 900, height: 28, justifyContent: "center", width: 28 }}>{index + 1}</div>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? step.stepZh : step.stepEn}</div>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 10 }}>
                <MiniField label={lang === "zh" ? "Input" : "Input"} value={lang === "zh" ? step.inputZh : step.inputEn} t={t} />
                <MiniField label={lang === "zh" ? "Processing" : "Processing"} value={lang === "zh" ? step.processingZh : step.processingEn} t={t} />
                <MiniField label={lang === "zh" ? "Output" : "Output"} value={lang === "zh" ? step.outputZh : step.outputEn} t={t} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function MiniField({ label, value, t }) {
  return (
    <div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{label}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{value}</div>
    </div>
  )
}

function FieldPriority({ lang, t }) {
  const groups = ["required", "recommended", "derived"].map(key => organicAcidFieldPriority[key])
  return (
    <Panel t={t}>
      <SectionTitle eyebrow={lang === "zh" ? "字段优先级" : "Field priority model"} title={lang === "zh" ? "字段如何服务整理、比较和 ML-ready 判断" : "How fields support curation, comparison, and ML-readiness"} t={t} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 14 }}>
        {groups.map(group => (
          <article key={group.en} style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 10 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? group.zh : group.en}</div>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>{lang === "zh" ? group.purposeZh : group.purposeEn}</div>
            <ol style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.6, margin: "9px 0 0", paddingLeft: 18 }}>
              {(lang === "zh" ? group.fieldsZh : group.fieldsEn).map(field => <li key={field}>{field}</li>)}
            </ol>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function MockTransformation({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle eyebrow={lang === "zh" ? "Mock 记录转换" : "Mock record transformation"} title={lang === "zh" ? "从原始描述到标准化记录" : "From raw description to normalized record"} t={t} />
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.65, marginTop: 12, padding: 12 }}>
        <strong style={{ color: t.textStrong }}>{lang === "zh" ? organicAcidMockRecord.labelZh : organicAcidMockRecord.labelEn}:</strong>{" "}
        {lang === "zh" ? organicAcidMockRecord.rawInputZh : organicAcidMockRecord.rawInputEn}
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {organicAcidMockRecord.normalizedRows.map(row => (
          <article key={row.fieldEn} style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? row.fieldZh : row.fieldEn}</div>
              <BasisBadge tone={row.statusEn === "available" ? "info" : row.statusEn === "missing" ? "warn" : "proxy"}>{lang === "zh" ? row.statusZh : row.statusEn}</BasisBadge>
            </div>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "标准化值" : "Normalized value", value: lang === "zh" ? row.valueZh : row.valueEn },
                { label: lang === "zh" ? "为什么重要" : "Why it matters", value: lang === "zh" ? row.whyZh : row.whyEn },
              ]}
            />
          </article>
        ))}
      </div>
    </Panel>
  )
}

function DecisionRules({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle eyebrow={lang === "zh" ? "规则表" : "Decision rules"} title={lang === "zh" ? "可比性判断逻辑" : "Comparability decision logic"} t={t} />
      <div style={{ overflowX: "auto", marginTop: 12 }}>
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
      <SectionTitle eyebrow={lang === "zh" ? "输出等级" : "Output readiness classes"} title={lang === "zh" ? "从 framework-only 到 comparison-ready" : "From framework-only to comparison-ready"} t={t} />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 14 }}>
        {organicAcidReadinessClasses.map(item => (
          <article key={item.className} style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 10 }}>
            <div style={{ color: t.textStrong, fontFamily: "monospace", fontSize: 13, fontWeight: 950 }}>{item.className}</div>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "含义" : "Meaning", value: lang === "zh" ? item.meaningZh : item.meaningEn },
                { label: lang === "zh" ? "所需证据" : "Required", value: lang === "zh" ? item.requiredEvidenceZh : item.requiredEvidenceEn },
                { label: lang === "zh" ? "允许用途" : "Allowed use", value: lang === "zh" ? item.allowedUseZh : item.allowedUseEn },
              ]}
            />
          </article>
        ))}
      </div>
    </Panel>
  )
}

function FutureDataSlot({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle eyebrow={lang === "zh" ? "后续数据槽" : "Future collaborator data slot"} title={lang === "zh" ? "真实合作数据后续会补充什么" : "What real collaborator data would add later"} t={t} />
      <ol style={{ color: t.muted, fontSize: 12, lineHeight: 1.7, margin: "12px 0 0", paddingLeft: 18 }}>
        {organicAcidFutureCollaboratorData.map(item => <li key={item.en}>{lang === "zh" ? item.zh : item.en}</li>)}
      </ol>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>
        {lang === "zh" ? "该区域仅说明未来授权数据可能带来的整理能力，不代表当前公开页面已包含这些数据。" : "This slot describes what authorized data could add later; it does not imply that those data are included in the current public page."}
      </div>
    </Panel>
  )
}

export function OrganicAcidCaseStudy({ lang, t }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Purpose lang={lang} t={t} />
      <Workflow lang={lang} t={t} />
      <FieldPriority lang={lang} t={t} />
      <MockTransformation lang={lang} t={t} />
      <DecisionRules lang={lang} t={t} />
      <ReadinessClasses lang={lang} t={t} />
      <FutureDataSlot lang={lang} t={t} />
    </div>
  )
}
