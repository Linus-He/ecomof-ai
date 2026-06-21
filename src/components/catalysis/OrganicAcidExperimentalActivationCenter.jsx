import { useEffect, useMemo, useState } from "react"
import { fetchDataJson } from "../../shared"
import {
  buildActivationReadinessJson,
  buildActivationReportMarkdown,
  buildExperimentalActivationWorkbench,
  buildExperimentalFeedbackRulesJson,
  buildExperimentalMatrixCsv,
  buildMoIntroductionStrategiesCsv,
  buildSameConditionTemplateCsv,
  buildSameConditionTemplateJsonSchema,
  buildSpecificAlMofHostsCsv,
} from "../../utils/organicAcidExperimentalActivation"
import { NumericText, organicAcidPalette as palette, ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"

const ACTIVATION_DATA_FILES = {
  specificAlMofHosts: "organic_acid_experimental_activation/specific_al_mof_hosts.json",
  moIntroductionStrategies: "organic_acid_experimental_activation/mo_introduction_strategies.json",
  minimumExperimentalMatrix: "organic_acid_experimental_activation/minimum_experimental_matrix.json",
  sameConditionDataTemplate: "organic_acid_experimental_activation/same_condition_data_template.json",
  experimentalValidationResultsTemplate: "organic_acid_experimental_activation/experimental_validation_results_template.json",
  experimentalFeedbackRules: "organic_acid_experimental_activation/experimental_feedback_rules.json",
  activationReadinessSummary: "organic_acid_experimental_activation/activation_readiness_summary.json",
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function fmt(value, digits = 3) {
  const next = Number(value)
  return Number.isFinite(next) ? next.toFixed(digits) : "pending"
}

function joinList(value) {
  return Array.isArray(value) ? value.filter(Boolean).join("; ") || "pending" : value || "pending"
}

function cardStyle(style = {}) {
  return {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    display: "grid",
    gap: 9,
    minWidth: 0,
    padding: 12,
    ...style,
  }
}

function buttonStyle(active = false) {
  return {
    background: active ? palette.accentSoft : palette.bg,
    border: `1px solid ${active ? palette.accent : palette.border}`,
    borderRadius: 8,
    color: active ? palette.accent : palette.text,
    cursor: "pointer",
    fontFamily: ORGANIC_ACID_FONT,
    fontSize: 12,
    fontWeight: 850,
    minHeight: 34,
    padding: "8px 10px",
    textAlign: "left",
  }
}

function downloadText(fileName, content, type = "application/json") {
  if (typeof document === "undefined") return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function openAlgorithmMethodology() {
  if (typeof window === "undefined") return
  window.location.hash = "#project-evolution-organic-acid-algorithm-methodology"
}

function SectionTitle({ kicker, title, note }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>{kicker}</div>
      <h2 style={{ color: palette.text, fontSize: 20, lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {note ? <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
    </div>
  )
}

function RouteBadge({ children, tone = "info" }) {
  const colors = tone === "risk"
    ? { background: palette.riskSoft, border: palette.risk, color: palette.risk }
    : tone === "good"
      ? { background: palette.positiveSoft, border: palette.positive, color: palette.positive }
      : { background: palette.accentSoft, border: palette.accent, color: palette.accent }
  return (
    <span style={{ alignItems: "center", background: colors.background, border: `1px solid ${colors.border}`, borderRadius: 999, color: colors.color, display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

function ActivationReadinessCard({ workbench, lang }) {
  const readiness = workbench.readiness
  return (
    <section style={{ ...cardStyle({ background: palette.surfaceStrong, padding: 14 }) }}>
      <div style={{ alignItems: "start", display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <SectionTitle
            kicker="Activation readiness"
            title="Organic Acid Experimental Activation Center / 有机酸实验启用中心"
            note={text(lang, "把 Al-MOF + Mo 从算法路线转成可执行的第一轮实验计划，但不声明性能已被验证。", "Turns the Al-MOF + Mo algorithmic route into a first experiment plan without claiming validated performance.")}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <RouteBadge>{workbench.routeContext.topRouteName}</RouteBadge>
            <RouteBadge tone="good">{readiness.readinessLevel}</RouteBadge>
            <RouteBadge tone="risk">Not final catalytic proof</RouteBadge>
            <RouteBadge tone="risk">Not ready for formal machine learning</RouteBadge>
          </div>
        </div>
        <div style={{ ...cardStyle({ background: palette.bg }) }}>
          {[
            [text(lang, "实验规划", "Experiment planning"), readiness.canUseForExperimentPlanning ? text(lang, "可用于实验规划", "ready") : text(lang, "暂不可用", "blocked"), "good"],
            [text(lang, "性能证明", "Performance claim"), readiness.canUseForPerformanceClaim ? text(lang, "可声明", "allowed") : text(lang, "不能用于性能证明", "not allowed"), "risk"],
            [text(lang, "机器学习", "Machine learning"), readiness.canUseForMachineLearning ? text(lang, "可训练", "ready") : text(lang, "不能用于正式机器学习", "not ready"), "risk"],
          ].map(([label, value, tone]) => (
            <div key={label} style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <span style={{ color: palette.faint, fontSize: 11, fontWeight: 850 }}>{label}</span>
              <strong style={{ color: tone === "risk" ? palette.risk : palette.positive, fontSize: 12 }}>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {[
          ["Route", workbench.routeContext.routeId],
          ["Host family", workbench.routeContext.selectedHostFamily],
          ["Mo strategy", workbench.routeContext.selectedMoStrategy],
          ["First experiment", workbench.routeContext.firstRecommendedExperiment],
          ["HGCPS", fmt(workbench.routeContext.hgcps)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
            <div style={{ color: palette.text, fontSize: 12.4, fontWeight: 780, lineHeight: 1.45, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
        {readiness.recommendedNextAction}
      </div>
      <button type="button" onClick={openAlgorithmMethodology} style={{ ...buttonStyle(false), color: palette.accent, justifySelf: "start", textAlign: "center" }}>
        Organic Acid Algorithm Methodology
      </button>
    </section>
  )
}

function SpecificAlMofHostCandidatesPanel({ workbench, lang }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Specific Al-MOF hosts"
        title={text(lang, "具体 Al-MOF 主体候选", "Specific Al-MOF Host Candidates")}
        note={text(lang, "Primary / backup / control 主体均保留 provenance 和 limitation；primary 不是最优催化剂证明。", "Primary, backup, and control hosts retain provenance and limitation; primary is not proof of optimal catalysis.")}
      />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {workbench.hosts.all.map(host => (
          <article key={host.hostCandidateId} style={{ ...cardStyle({ background: host.priorityTier === "primary" ? palette.positiveSoft : palette.surface }) }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <RouteBadge tone={host.priorityTier === "primary" ? "good" : "info"}>{host.priorityTier}</RouteBadge>
              <RouteBadge>{host.confidenceLevel}</RouteBadge>
            </div>
            <strong style={{ color: palette.text, fontSize: 14 }}>{host.displayName}</strong>
            <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>{host.hostFamily}</span>
            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ color: palette.text, fontSize: 12 }}>{host.reasonForSelection}</span>
              <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.45 }}>Pre-check: {host.requiredPreExperimentCheck}</span>
              <span style={{ color: palette.risk, fontSize: 11.5, lineHeight: 1.45 }}>Limitation: {host.mainLimitation}</span>
            </div>
            <span style={{ color: palette.faint, fontSize: 11.2 }}>Provenance: {joinList(host.provenance)} · {host.evidenceType}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function MoStrategyDecisionTree({ workbench }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong style={{ color: palette.text, fontSize: 13 }}>Mo strategy decision tree</strong>
      {workbench.moStrategyDecisionTree.map(row => (
        <div key={row.branchId} style={{ ...cardStyle({ background: palette.bg, gridTemplateColumns: "minmax(140px, 0.35fr) minmax(0, 0.65fr)" }) }}>
          <span style={{ color: palette.faint, fontSize: 11, fontWeight: 850 }}>{row.condition}</span>
          <span style={{ color: palette.text, fontSize: 12, lineHeight: 1.45 }}><strong>{row.recommendation}</strong> · {row.rationale}</span>
        </div>
      ))}
    </div>
  )
}

function MoIntroductionStrategiesPanel({ workbench, lang }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Mo introduction"
        title={text(lang, "Mo 引入方案", "Mo Introduction Strategies")}
        note={text(lang, "低风险优先 post-synthetic modification；强互补可考虑 bimetallic；快速验证可用 pore confinement / impregnation。", "Low-risk first: post-synthetic modification; stronger synergy: bimetallic; fast validation: pore confinement / impregnation.")}
      />
      <MoStrategyDecisionTree workbench={workbench} />
      <div style={{ display: "grid", gap: 10 }}>
        {workbench.moStrategies.all.map(strategy => (
          <article key={strategy.strategyId} style={cardStyle()}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
              <strong style={{ color: palette.text, fontSize: 13.5 }}>{strategy.displayName}</strong>
              <RouteBadge>{strategy.routeType}</RouteBadge>
            </div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <span style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.45 }}>Method: {strategy.introductionMethod}</span>
              <span style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.45 }}>Expected Mo: {strategy.expectedMoState}</span>
              <span style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.45 }}>Characterization: {joinList(strategy.requiredCharacterization)}</span>
              <span style={{ color: palette.risk, fontSize: 11.8, lineHeight: 1.45 }}>Risk: {strategy.leachingRisk}; {strategy.localCoordinationUncertainty}</span>
            </div>
            <span style={{ color: palette.faint, fontSize: 11.5 }}>Control: {strategy.recommendedControl}</span>
            <span style={{ color: palette.accent, fontSize: 11.5, lineHeight: 1.45 }}>Success: {strategy.successCriterion}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function MinimumExperimentalMatrixPanel({ workbench, lang }) {
  const matrix = workbench.minimumExperimentalMatrix
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Minimum matrix"
        title={text(lang, "最小实验矩阵", "Minimum Experimental Matrix")}
        note={text(lang, "覆盖 blank、pristine Al-MOF、Al-MOF+Mo、guest control、Zr-MOF+Mo、Mo-only/MoOx 与重复稳定性。", "Covers blank, pristine Al-MOF, Al-MOF+Mo, guest control, Zr-MOF+Mo, Mo-only/MoOx, and repeat stability.")}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {Object.entries(matrix.coverage).map(([key, value]) => (
          <div key={key} style={cardStyle({ background: value === true ? palette.positiveSoft : palette.surfaceStrong, padding: 10 })}>
            <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{key}</span>
            <strong style={{ color: value === true ? palette.positive : palette.text, fontSize: 13 }}>{String(value)}</strong>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 960, width: "100%" }}>
          <thead>
            <tr>
              {["Priority", "Experiment", "Route", "Guest", "Control", "Purpose", "Failure meaning", "Must run"].map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.all.map(row => (
              <tr key={row.experimentGroupId} style={{ background: row.routeId === "route-al-mof-mo" ? palette.accentSoft : "transparent" }}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontSize: 12, fontWeight: 900, padding: "8px 9px" }}>{row.priority}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 11.8, fontWeight: 820, padding: "8px 9px" }}>{row.experimentName}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.8, padding: "8px 9px" }}>{row.routeId}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.8, padding: "8px 9px" }}>{row.guestMetal}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.8, padding: "8px 9px" }}>{row.controlType}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.8, lineHeight: 1.4, padding: "8px 9px" }}>{row.purpose}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 11.8, lineHeight: 1.4, padding: "8px 9px" }}>{row.failureMeaning}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: row.mustRun ? palette.positive : palette.faint, fontSize: 11.8, padding: "8px 9px" }}>{row.mustRun ? "yes" : "optional"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SameConditionDataTemplatePanel({ workbench, lang }) {
  const template = workbench.sameConditionDataTemplate
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Same-condition template"
        title={text(lang, "同条件数据记录模板", "Same-Condition Data Collection Template")}
        note={text(lang, "字段用于回填 evidence confidence、risk retention 与 host-guest complementarity；pending 不是实验结果。", "Fields feed evidence confidence, risk retention, and host-guest complementarity; pending values are not experimental results.")}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <div style={cardStyle({ background: palette.surfaceStrong })}><span style={{ color: palette.faint, fontSize: 11 }}>Categories</span><NumericText style={{ color: palette.text, fontSize: 18, fontWeight: 950 }}>{template.summary.categoryCount}</NumericText></div>
        <div style={cardStyle({ background: palette.surfaceStrong })}><span style={{ color: palette.faint, fontSize: 11 }}>Fields</span><NumericText style={{ color: palette.text, fontSize: 18, fontWeight: 950 }}>{template.summary.fieldCount}</NumericText></div>
        <div style={cardStyle({ background: palette.surfaceStrong })}><span style={{ color: palette.faint, fontSize: 11 }}>Required</span><NumericText style={{ color: palette.text, fontSize: 18, fontWeight: 950 }}>{template.summary.requiredFieldCount}</NumericText></div>
      </div>
      {template.categories.map(category => (
        <details key={category.category} open={category.category === "basic"} style={cardStyle()}>
          <summary style={{ color: palette.text, cursor: "pointer", fontSize: 13, fontWeight: 900 }}>{category.displayName}</summary>
          <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
            {category.fields.map(field => (
              <div key={field.fieldName} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 0.75fr) minmax(0, 1.25fr)", padding: 9 }}>
                <div style={{ display: "grid", gap: 3 }}>
                  <strong style={{ color: palette.text, fontSize: 12 }}>{field.label}</strong>
                  <span style={{ color: palette.faint, fontSize: 11 }}>{field.dataType} · {field.required ? "required" : "optional"} · {field.unit || "no unit"}</span>
                </div>
                <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
                  {field.whyNeeded}<br />
                  <span style={{ color: palette.accent }}>Affects: {field.affectsAlgorithmFactor}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </section>
  )
}

function ExperimentalResultFeedbackPanel({ workbench, lang }) {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Feedback rules"
        title={text(lang, "实验结果回填与算法更新", "Experimental Result Feedback and Algorithm Update")}
        note={text(lang, "仅展示 pending template 和规则；没有真实实验结果，也不自动重排。", "Shows pending templates and rules only; no real results and no automatic reranking.")}
      />
      <div style={{ background: palette.riskSoft, border: `1px solid ${palette.risk}`, borderRadius: 8, color: palette.risk, fontSize: 12.2, fontWeight: 850, lineHeight: 1.45, padding: 10 }}>
        Template status: {workbench.experimentalValidationResultTemplate.status}; has real results: {String(workbench.experimentalValidationResultTemplate.hasRealResults)}.
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {workbench.feedbackRules.rules.map(rule => (
          <article key={rule.ruleId} style={cardStyle()}>
            <strong style={{ color: palette.text, fontSize: 12.8 }}>{rule.triggerCondition}</strong>
            <span style={{ color: palette.muted, fontSize: 11.7, lineHeight: 1.45 }}>Action: {rule.updateAction}</span>
            <span style={{ color: palette.accent, fontSize: 11.7, lineHeight: 1.45 }}>Factors: {joinList(rule.factorAffected)}</span>
            <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.45 }}>{rule.explanation}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function AlgorithmUpdatePreviewPanel({ workbench, lang }) {
  const preview = workbench.algorithmUpdatePreview
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Update preview"
        title={text(lang, "算法更新预览", "Algorithm Update Preview")}
        note={text(lang, "supported / contradicted / inconclusive 只产生预览；碳平衡不闭合保持 inconclusive。", "supported / contradicted / inconclusive create previews only; incomplete carbon balance stays inconclusive.")}
      />
      {[
        ["Supported result", preview.supportedResult],
        ["Contradicted result", preview.contradictedResult],
        ["Inconclusive result", preview.inconclusiveResult],
      ].map(([label, item]) => (
        <article key={label} style={cardStyle({ background: label.includes("Inconclusive") ? palette.riskSoft : palette.surface })}>
          <strong style={{ color: palette.text, fontSize: 13 }}>{label}</strong>
          <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>{item.expectedAction}</span>
          <span style={{ color: palette.faint, fontSize: 11.5 }}>Rules: {joinList(item.rules)}</span>
        </article>
      ))}
      <article style={cardStyle({ background: palette.surfaceStrong })}>
        <strong style={{ color: palette.text, fontSize: 13 }}>Post-experiment reranking preview</strong>
        <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.45 }}>{workbench.postExperimentRouteRerankingPreview.boundary}</span>
      </article>
    </section>
  )
}

function ActivationReportExportPanel({ workbench, lang }) {
  const exportRows = [
    ["Specific Al-MOF Hosts CSV", () => downloadText("specific-al-mof-hosts.csv", buildSpecificAlMofHostsCsv(workbench.hosts), "text/csv")],
    ["Mo Introduction Strategies CSV", () => downloadText("mo-introduction-strategies.csv", buildMoIntroductionStrategiesCsv(workbench.moStrategies), "text/csv")],
    ["Minimum Experimental Matrix CSV", () => downloadText("minimum-experimental-matrix.csv", buildExperimentalMatrixCsv(workbench.minimumExperimentalMatrix), "text/csv")],
    ["Same-Condition Data Template CSV", () => downloadText("same-condition-data-template.csv", buildSameConditionTemplateCsv(workbench.sameConditionDataTemplate), "text/csv")],
    ["Same-Condition JSON Schema", () => downloadText("same-condition-data-template.schema.json", JSON.stringify(buildSameConditionTemplateJsonSchema(workbench.sameConditionDataTemplate), null, 2))],
    ["Experimental Feedback Rules JSON", () => downloadText("experimental-feedback-rules.json", JSON.stringify(buildExperimentalFeedbackRulesJson(workbench.feedbackRules), null, 2))],
    ["Activation Readiness JSON", () => downloadText("activation-readiness.json", JSON.stringify(buildActivationReadinessJson(workbench.readiness), null, 2))],
    ["Experimental Activation Report Markdown", () => downloadText("organic-acid-experimental-activation-report.md", buildActivationReportMarkdown(workbench), "text/markdown")],
  ]
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Activation exports"
        title={text(lang, "实验启用导出", "Experimental Activation Exports")}
        note={text(lang, "导出保留 seed / curated / proxy 边界，供内部讨论和第一轮实验规划使用。", "Exports retain the seed / curated / proxy boundary for internal discussion and first experiment planning.")}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {exportRows.map(([label, action]) => (
          <button key={label} type="button" onClick={action} style={{ ...buttonStyle(false), textAlign: "center" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
        {text(lang, "所有导出均为 planning-ready，不构成性能证明或正式机器学习标签。", "All exports are planning-ready and do not constitute performance proof or formal ML labels.")}
      </div>
    </section>
  )
}

export function OrganicAcidExperimentalActivationCenter({
  lang = "zh",
  isNarrow = false,
  routeContext = {},
  initialData = null,
  activationWorkbench: suppliedActivationWorkbench = null,
}) {
  const [sourceData, setSourceData] = useState(initialData)
  const [status, setStatus] = useState(initialData || suppliedActivationWorkbench ? "loaded" : "idle")
  const [activeTab, setActiveTab] = useState("hosts")

  useEffect(() => {
    if (initialData || suppliedActivationWorkbench) return undefined
    let live = true
    setStatus("loading")
    Promise.all([
      fetchDataJson(ACTIVATION_DATA_FILES.specificAlMofHosts, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.moIntroductionStrategies, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.minimumExperimentalMatrix, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.sameConditionDataTemplate, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.experimentalValidationResultsTemplate, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.experimentalFeedbackRules, {}),
      fetchDataJson(ACTIVATION_DATA_FILES.activationReadinessSummary, {}),
    ]).then(([specificAlMofHosts, moIntroductionStrategies, minimumExperimentalMatrix, sameConditionDataTemplate, experimentalValidationResultsTemplate, experimentalFeedbackRules, activationReadinessSummary]) => {
      if (!live) return
      setSourceData({
        specificAlMofHosts,
        moIntroductionStrategies,
        minimumExperimentalMatrix,
        sameConditionDataTemplate,
        experimentalValidationResultsTemplate,
        experimentalFeedbackRules,
        activationReadinessSummary,
      })
      setStatus("loaded")
    }).catch(() => {
      if (!live) return
      setStatus("error")
      setSourceData(null)
    })
    return () => { live = false }
  }, [initialData, suppliedActivationWorkbench])

  const workbench = useMemo(() => suppliedActivationWorkbench || (sourceData ? buildExperimentalActivationWorkbench(sourceData, routeContext) : null), [sourceData, routeContext, suppliedActivationWorkbench])

  if (status === "loading" || !workbench) {
    return (
      <section id="organic-acid-experimental-activation-center" data-testid="organic-acid-experimental-activation-center" style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }), fontFamily: ORGANIC_ACID_FONT }}>
        <SectionTitle kicker="V3.9.4" title="Organic Acid Experimental Activation Center / 有机酸实验启用中心" note="Loading activation package..." />
      </section>
    )
  }

  if (status === "error") {
    return (
      <section id="organic-acid-experimental-activation-center" data-testid="organic-acid-experimental-activation-center" style={{ ...cardStyle({ background: palette.riskSoft, padding: 14, scrollMarginTop: 118 }), fontFamily: ORGANIC_ACID_FONT }}>
        <SectionTitle kicker="V3.9.4" title="Organic Acid Experimental Activation Center / 有机酸实验启用中心" note="Activation package could not be loaded." />
      </section>
    )
  }

  const tabs = [
    ["hosts", "Hosts"],
    ["mo", "Mo Strategies"],
    ["matrix", "Experiment Matrix"],
    ["template", "Data Template"],
    ["feedback", "Feedback Rules"],
    ["update", "Update Preview"],
    ["export", "Export"],
  ]

  return (
    <section
      id="organic-acid-experimental-activation-center"
      data-testid="organic-acid-experimental-activation-center"
      style={{ background: palette.bg, border: `1px solid ${palette.accent}`, borderRadius: 10, display: "grid", fontFamily: ORGANIC_ACID_FONT, gap: 14, minWidth: 0, padding: isNarrow ? 12 : 14, scrollMarginTop: 118 }}
    >
      <ActivationReadinessCard workbench={workbench} lang={lang} />
      <div role="tablist" aria-label="Organic Acid Experimental Activation Center tabs" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} style={{ ...buttonStyle(activeTab === id), fontFamily: SCIENTIFIC_TOKEN_FONT }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab === "hosts" ? <SpecificAlMofHostCandidatesPanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "mo" ? <MoIntroductionStrategiesPanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "matrix" ? <MinimumExperimentalMatrixPanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "template" ? <SameConditionDataTemplatePanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "feedback" ? <ExperimentalResultFeedbackPanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "update" ? <AlgorithmUpdatePreviewPanel workbench={workbench} lang={lang} /> : null}
      {activeTab === "export" ? <ActivationReportExportPanel workbench={workbench} lang={lang} /> : null}
    </section>
  )
}

export default OrganicAcidExperimentalActivationCenter
