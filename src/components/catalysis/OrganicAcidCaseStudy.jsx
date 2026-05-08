import { BasisBadge } from "../../shared"
import {
  organicAcidCaseSummary,
  organicAcidCompletenessMatrix,
  organicAcidDecisionRules,
  organicAcidFieldPriority,
  organicAcidFutureDataLevels,
  organicAcidIntakeTemplate,
  organicAcidMockRecord,
  organicAcidReadinessTrace,
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

function RecordIntakeTemplate({ lang, t }) {
  const groups = organicAcidIntakeTemplate.reduce((acc, row) => {
    const groupKey = lang === "zh" ? row.groupZh : row.groupEn
    acc[groupKey] = acc[groupKey] || []
    acc[groupKey].push(row)
    return acc
  }, {})

  return (
    <Panel t={t}>
      <SectionTitle
        eyebrow={lang === "zh" ? "输入模板" : "Record intake template"}
        title={lang === "zh" ? "一条有机酸催化记录需要如何进入系统" : "How an organic-acid catalysis record enters the workspace"}
        t={t}
      />
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
        {lang === "zh"
          ? "每项都使用占位示例说明公开演示可接收的字段形态，不包含合作方未公开实验数据。"
          : "Each row uses placeholder entries to show accepted field shape; no collaborator-owned experimental data are included."}
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {Object.entries(groups).map(([group, rows]) => (
          <article key={group} style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{group}</div>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {rows.map(row => (
                <div key={`${row.groupEn}-${row.fieldEn}`} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 10, gridTemplateColumns: "minmax(120px, 0.9fr) minmax(0, 1.8fr)", paddingTop: 10 }}>
                  <div>
                    <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.fieldZh : row.fieldEn}</div>
                    <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, marginTop: 4 }}>{row.priority}</div>
                  </div>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                    <MiniField label={lang === "zh" ? "占位示例" : "Example entry"} value={lang === "zh" ? row.exampleZh : row.exampleEn} t={t} />
                    <MiniField label={lang === "zh" ? "为什么重要" : "Why it matters"} value={lang === "zh" ? row.whyZh : row.whyEn} t={t} />
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

function CompletenessMatrix({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle
        eyebrow={lang === "zh" ? "完整度诊断" : "Completeness matrix"}
        title={lang === "zh" ? "mock 记录如何暴露可比性缺口" : "How the mock record exposes comparability gaps"}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 14 }}>
        {organicAcidCompletenessMatrix.map(item => (
          <article key={item.groupEn} style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? item.groupZh : item.groupEn}</div>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "available" : "available", value: lang === "zh" ? item.availableZh : item.availableEn },
                { label: lang === "zh" ? "partial" : "partial", value: lang === "zh" ? item.partialZh : item.partialEn },
                { label: lang === "zh" ? "missing" : "missing", value: lang === "zh" ? item.missingZh : item.missingEn },
                { label: lang === "zh" ? "framework-only" : "framework-only", value: lang === "zh" ? item.frameworkOnlyZh : item.frameworkOnlyEn },
              ]}
            />
            <div style={{ background: t.surface, border: `1px solid ${t.divider}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 10, padding: 10 }}>
              {lang === "zh" ? item.interpretationZh : item.interpretationEn}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}

function ReadinessTrace({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle
        eyebrow={lang === "zh" ? "判定轨迹" : "Readiness trace"}
        title={lang === "zh" ? "为什么当前 mock 记录仍是 framework-only" : "Why the current mock record remains framework-only"}
        t={t}
      />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {organicAcidReadinessTrace.map((step, index) => (
          <article key={step.stageEn} style={{ alignItems: "start", display: "grid", gap: 10, gridTemplateColumns: "30px minmax(0, 1fr)" }}>
            <div style={{ alignItems: "center", background: index === organicAcidReadinessTrace.length - 1 ? t.badgeWarnBg : t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: index === organicAcidReadinessTrace.length - 1 ? t.badgeWarnText : t.accentText, display: "flex", fontSize: 12, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>{index + 1}</div>
            <div style={{ borderBottom: `1px solid ${t.divider}`, paddingBottom: 10 }}>
              <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? step.stageZh : step.stageEn}</div>
                <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? step.resultZh : step.resultEn}</div>
              </div>
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>{lang === "zh" ? step.evidenceZh : step.evidenceEn}</div>
            </div>
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

function FutureDataIntegrationLevels({ lang, t }) {
  return (
    <Panel t={t}>
      <SectionTitle
        eyebrow={lang === "zh" ? "未来接入边界" : "Future data integration levels"}
        title={lang === "zh" ? "真实数据如何安全进入工作台" : "How real records can be integrated safely later"}
        t={t}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginTop: 14 }}>
        {organicAcidFutureDataLevels.map(level => (
          <article key={level.levelEn} style={{ borderLeft: `3px solid ${t.accent}`, paddingLeft: 12 }}>
            <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 950 }}>{lang === "zh" ? level.levelZh : level.levelEn}</div>
            <DefinitionList
              t={t}
              items={[
                { label: lang === "zh" ? "可展示" : "Can display", value: lang === "zh" ? level.canDisplayZh : level.canDisplayEn },
                { label: lang === "zh" ? "边界" : "Boundary", value: lang === "zh" ? level.boundaryZh : level.boundaryEn },
              ]}
            />
          </article>
        ))}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: 12 }}>
        {lang === "zh"
          ? "当前公开演示不包含合作方未公开实验数据。真实记录进入公开页面前需要来源、授权和敏感字段边界检查。"
          : "No collaborator-owned experimental data are included in this public demo. Real records require provenance, permission, and sensitivity checks before public display."}
      </div>
    </Panel>
  )
}

export function OrganicAcidCaseStudy({ lang, t }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Purpose lang={lang} t={t} />
      <Workflow lang={lang} t={t} />
      <RecordIntakeTemplate lang={lang} t={t} />
      <FieldPriority lang={lang} t={t} />
      <MockTransformation lang={lang} t={t} />
      <CompletenessMatrix lang={lang} t={t} />
      <ReadinessTrace lang={lang} t={t} />
      <DecisionRules lang={lang} t={t} />
      <ReadinessClasses lang={lang} t={t} />
      <FutureDataIntegrationLevels lang={lang} t={t} />
    </div>
  )
}
