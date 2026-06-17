// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, statusTone, text, ValueWithSource } from "./FinalScreeningShared"

function buildDecisionRows(result = {}) {
  const algorithmRows = result.organicAcidAlgorithm?.rankedCandidates || []
  if (algorithmRows.length) {
    return algorithmRows.slice(0, 6).map(row => ({
      ...row,
      id: row.candidateId,
      candidate: row.sourceCandidate || row,
      candidateName: row.candidateName,
      pathwayRole: row.features?.pathwayRole?.value || "formic-acid pathway scaffold",
      evidenceLevel: row.features?.evidenceLevel?.value || "pending",
      pathwayFit: row.pathwayFitScore,
      graphCentrality: row.graphRelevanceScore,
      validationReadiness: row.recommendationClass,
      mainReason: row.mainReasons?.[0] || "算法建议，仍需实验验证。",
      mainRisk: row.mainRisks?.[0] || "仍需实验验证",
    }))
  }
  return (result.rankedFrameworks || []).slice(0, 6).map(candidate => ({
    id: candidate.id,
    candidate,
    candidateName: candidate.displayName,
    targetProduct: "甲酸 / formic acid",
    pathwayRole: candidate.hydrothermalGate?.status === "pass" ? "formic-acid pathway scaffold" : "data review / risk-gated scaffold",
    finalScore: candidate.organicAcidScore?.oacs ?? 0,
    evidenceLevel: candidate.organicAcidScore?.evidenceLevel || "pending",
    pathwayFit: candidate.descriptorScores?.poreAccessibility ?? candidate.organicAcidScore?.oacs ?? 0,
    graphCentrality: candidate.descriptorScores?.poreAccessibility ?? 0,
    validationReadiness: "algorithmic suggestion",
    mainReason: "兼容旧结果的展示行；V2.6 主路径应读取 organicAcidAlgorithm.rankedCandidates。",
    mainRisk: "仍需实验验证",
    nextExperiment: "补齐 V2.6 算法输入后再生成下一步实验。",
    recommendationClass: "data_needed",
    scoreBreakdown: null,
    decisionTrace: [],
  }))
}

function recommendationTone(value) {
  const textValue = String(value || "")
  if (textValue === "priority_validation") return "pass"
  if (textValue === "rejected" || textValue === "low_priority") return "fail"
  if (textValue.includes("needed") || textValue.includes("check")) return "warn"
  return statusTone(textValue)
}

function stepLabel(step, lang) {
  const labels = {
    "Candidate Loaded": ["候选加载", "Candidate Loaded"],
    "Feature Availability Check": ["特征可用性检查", "Feature Availability Check"],
    "Pathway Fit Calculation": ["路径适配计算", "Pathway Fit Calculation"],
    "Evidence Adjustment": ["证据修正", "Evidence Adjustment"],
    "Graph Relevance Calculation": ["图论相关性计算", "Graph Relevance Calculation"],
    "Structure Suitability Calculation": ["结构适配计算", "Structure Suitability Calculation"],
    "Risk Penalty Applied": ["风险惩罚应用", "Risk Penalty Applied"],
    "Validation Readiness Check": ["验证就绪度检查", "Validation Readiness Check"],
    "Final Ranking": ["最终排序", "Final Ranking"],
    "Next Experiment Generated": ["下一步实验生成", "Next Experiment Generated"],
  }
  const pair = labels[step] || [step, step]
  return text(lang, pair[0], pair[1])
}

function TraceGrid({ row, lang, t }) {
  const trace = row.decisionTrace || []
  return (
    <div data-testid="organic-acid-decision-trace" style={{ display: "grid", gap: 7 }}>
      {trace.map(item => (
        <article key={item.step} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.2 }}>{stepLabel(item.step, lang)}</strong>
          <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "输入", "Input")}: {displayValue(item.input)} · {text(lang, "输出", "Output")}: {displayValue(item.output)}</span>
          <span style={{ color: t.accentText, fontSize: 11.2 }}>{text(lang, "影响分数", "Affected score")}: {displayValue(item.affectedScore)}</span>
          <span style={{ color: t.warn, fontSize: 11.2 }}>{text(lang, "阻断因素", "Blocker")}: {displayValue(item.blocker)}</span>
          <span style={{ color: t.faint, fontSize: 11.2 }}>{text(lang, "解释", "Explanation")}: {text(lang, item.explanationZh || item.explanation, item.explanation)}</span>
        </article>
      ))}
    </div>
  )
}

export function OrganicAcidFinalDecisionBoard({ result, lang, t, isMobile, onInspectCandidate }) {
  const algorithm = result?.organicAcidAlgorithm || {}
  const rows = useMemo(() => buildDecisionRows(result), [result])
  const [activeId, setActiveId] = useState(rows[0]?.id)
  const active = rows.find(row => row.id === activeId) || rows[0]
  if (!rows.length) return null

  return (
    <Panel
      id="organic-acid-final-decision-board"
      eyebrow={text(lang, "有机酸最终决策面板", "Organic Acid Final Decision Board")}
      title={text(lang, "有机酸最终决策面板 / Organic Acid Final Decision Board", "Organic Acid Final Decision Board")}
      t={t}
      style={{ borderColor: t.accent }}
    >
      <div data-testid="organic-acid-final-decision-board" style={{ display: "grid", gap: 12 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, color: t.muted, fontSize: 12.5, lineHeight: 1.58, padding: 11 }}>
          <ChemicalText value={text(
            lang,
            "当前用于什么判断：V2.6 决策面板读取 rankOrganicAcidCandidates 的真实算法输出，把目标函数、路径适配、证据修正、图论相关性、结构适配、风险惩罚、验证就绪度、数据缺口与下一步实验放在同一判断面。所有输出都是算法建议，仍需实验验证。",
            "The V2.6 decision board reads rankOrganicAcidCandidates output and combines objective function, pathway fit, evidence adjustment, graph relevance, structure suitability, risk penalty, validation readiness, data gaps, and next experiments. Outputs are algorithmic suggestions and require experimental validation."
          )} />
        </div>

        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
          <article style={{ background: algorithm.sanityCheck?.passed ? t.badgeGoodBg || t.badgeInfoBg : t.badgeWarnBg, border: `1px solid ${algorithm.sanityCheck?.passed ? t.accent : t.warn}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.2 }}>{text(lang, "算法合理性检查", "Algorithm Sanity Check")}</strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}>
              {text(lang, algorithm.sanityCheck?.summaryZh || "算法合理性检查待生成。", algorithm.sanityCheck?.summary || "Algorithm sanity check pending.")}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <StatusPill tone={algorithm.sanityCheck?.passed ? "pass" : "warn"} t={t}>{algorithm.sanityCheck?.passed ? text(lang, "通过", "passed") : text(lang, "需复核", "review")}</StatusPill>
              <StatusPill tone="warn" t={t}>{text(lang, "失败规则", "failed rules")}: {algorithm.sanityCheck?.failedRules?.length || 0}</StatusPill>
              <StatusPill tone="warn" t={t}>{text(lang, "警告", "warnings")}: {algorithm.sanityCheck?.warnings?.length || 0}</StatusPill>
            </div>
          </article>
          <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.2 }}>{text(lang, "敏感性分析", "Sensitivity Analysis")}</strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.45 }}>
              {text(lang, algorithm.sensitivitySummary?.explanationZh || "敏感性分析待生成。", algorithm.sensitivitySummary?.explanation || "Sensitivity analysis pending.")}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <StatusPill tone={algorithm.sensitivitySummary?.topCandidateStability ? "pass" : "warn"} t={t}>{algorithm.sensitivitySummary?.topCandidateStability ? text(lang, "Top 稳定", "Top stable") : text(lang, "Top 会变化", "Top changes")}</StatusPill>
              <StatusPill tone="info" t={t}>{text(lang, "不稳定候选", "unstable")}: {algorithm.sensitivitySummary?.unstableCandidates?.length || 0}</StatusPill>
              <StatusPill tone="proxy" t={t}>{algorithm.scoringModeLabelZh || algorithm.scoringModeLabel || "formic_acid_priority"}</StatusPill>
            </div>
          </article>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {rows.map(row => {
            const activeCard = row.id === active?.id
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setActiveId(row.id)}
                style={{ background: activeCard ? t.badgeInfoBg : t.surface, border: `1px solid ${activeCard ? t.accent : t.border}`, borderRadius: 9, color: t.textStrong, cursor: "pointer", display: "grid", gap: 7, padding: 10, textAlign: "left" }}
              >
                <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 13.2 }}><ChemicalText value={`#${row.rank || row.candidate?.rank || "-"} ${row.candidateName}`} /></strong>
                  <StatusPill tone={recommendationTone(row.recommendationClass)} t={t}>{row.recommendationClass || row.validationReadiness}</StatusPill>
                </div>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{row.targetProduct} · {row.pathwayRole}</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                  {[
                    [text(lang, "最终分", "Final score"), formatScore(row.finalScore)],
                    [text(lang, "证据", "Evidence"), row.evidenceLevel],
                    [text(lang, "路径适配", "Pathway fit"), formatScore(row.pathwayFit)],
                    [text(lang, "风险惩罚", "Risk penalty"), formatScore(row.riskPenalty || 0)],
                  ].map(([label, value]) => (
                    <span key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, display: "grid", fontSize: 10.8, gap: 3, padding: 7 }}>
                      <span style={{ color: t.faint, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                      <strong style={{ color: t.textStrong }}>{value}</strong>
                    </span>
                  ))}
                </div>
                <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{row.mainReason}</span>
                <span style={{ color: t.warn, fontSize: 11.2, lineHeight: 1.45 }}>{row.mainRisk}</span>
              </button>
            )
          })}
        </div>

        {active ? (
          <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
            <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 15 }}><ChemicalText value={active.candidateName} /></strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {[
                  [text(lang, "查看路径依据", "View pathway basis"), "organic-acid-final-framework-ranking"],
                  [text(lang, "查看证据来源", "View evidence sources"), "methodology-oafs-evidence-matrix"],
                  [text(lang, "查看图论指标", "View graph metrics"), "organic-acid-final-hot-spot-map"],
                  [text(lang, "查看实验建议", "View experiment plan"), "organic-acid-final-validation-roadmap"],
                ].map(([label, id]) => (
                  <a key={label} href={`#${id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, fontSize: 11.5, fontWeight: 900, minHeight: 30, padding: "6px 8px", textDecoration: "none" }}>{label}</a>
                ))}
                {onInspectCandidate ? (
                  <button type="button" onClick={() => onInspectCandidate(active.candidate)} style={{ background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 7, color: t.buttonText || "#fff", cursor: "pointer", fontSize: 11.5, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
                    {text(lang, "打开候选决策", "Open candidate decision")}
                  </button>
                ) : null}
              </div>
            </header>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
              {[
                ["candidateName", "candidateName", active.candidateName],
                ["targetProduct", "targetProduct", active.targetProduct],
                ["pathwayRole", "pathwayRole", active.pathwayRole],
                ["rank", "rank", active.rank],
                ["recommendationClass", "recommendationClass", active.recommendationClass],
                ["finalScore", "finalScore", formatScore(active.finalScore)],
                ["evidenceLevel", "evidenceLevel", active.evidenceLevel],
                ["pathwayFit", "pathwayFit", formatScore(active.pathwayFit)],
                ["graphCentrality", "graphCentrality", formatScore(active.graphCentrality)],
                ["riskPenalty", "riskPenalty", formatScore(active.riskPenalty || 0)],
                ["validationReadiness", "validationReadiness", active.validationReadiness],
                ["nextExperiment", "nextExperiment", active.nextExperiment],
              ].map(([field, label, value]) => (
                <div key={field} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
                  <span style={{ color: t.faint, display: "block", fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <span style={{ color: t.muted, display: "block", fontSize: 11.8, lineHeight: 1.45, marginTop: 4 }}>
                    <ValueWithSource record={active.candidate} field={field} label={label} value={value} lang={lang} t={t} />
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "为什么排在这里", "Why this rank")}</strong>
                {(active.mainReasons || []).slice(0, 4).map(reason => (
                  <span key={reason} style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}><ChemicalText value={reason} /></span>
                ))}
              </div>
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "哪些风险拉低评分", "Risk drivers")}</strong>
                {(active.mainRisks || []).slice(0, 5).map(risk => (
                  <span key={risk} style={{ color: t.warn, fontSize: 11.5, lineHeight: 1.45 }}><ChemicalText value={risk} /></span>
                ))}
              </div>
            </div>
            {active.scoreBreakdown ? (
              <div data-testid="organic-acid-score-breakdown" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "Score breakdown / 评分拆解", "Score breakdown")}</strong>
                <span style={{ color: t.faint, fontSize: 10.8, lineHeight: 1.45 }}>{active.scoreBreakdown.equation}</span>
                <div style={{ display: "grid", gap: 6, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
                  {Object.entries(active.scoreBreakdown.dimensions || {}).map(([key, value]) => (
                    <span key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, display: "grid", gap: 3, padding: 7 }}>
                      <span style={{ color: t.faint, fontSize: 10, fontWeight: 900 }}>{key}</span>
                      <strong style={{ color: t.textStrong, fontSize: 12 }}>{formatScore(value)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <TraceGrid row={active} lang={lang} t={t} />
          </article>
        ) : null}
      </div>
    </Panel>
  )
}

export default OrganicAcidFinalDecisionBoard
