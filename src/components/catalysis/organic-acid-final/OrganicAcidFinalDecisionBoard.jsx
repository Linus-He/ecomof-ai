// @ts-nocheck
import { useMemo, useState } from "react"
import { ChemicalText } from "../../../shared"
import { displayValue, formatScore, Panel, StatusPill, statusTone, text, ValueWithSource } from "./FinalScreeningShared"

function gateLabel(status, lang) {
  const value = String(status || "pending")
  if (lang === "zh") {
    if (value === "pass") return "通过"
    if (value === "needs_review") return "需复核"
    if (value === "fail") return "拦截"
  }
  return value.replace("_", " ")
}

function graphCentralityProxy(candidate) {
  const accessibility = Number(candidate?.descriptorScores?.poreAccessibility)
  const oacs = Number(candidate?.organicAcidScore?.oacs)
  if (Number.isFinite(accessibility)) return accessibility
  if (Number.isFinite(oacs)) return oacs
  return 0
}

function evidenceConfidence(candidate) {
  const level = String(candidate?.organicAcidScore?.evidenceLevel || candidate?.evidenceLevel || "").toLowerCase()
  if (level.includes("eligible") || level.includes("high")) return "high"
  if (level.includes("review") || level.includes("medium")) return "medium"
  return "pending"
}

function mainReason(candidate) {
  const gate = candidate?.hydrothermalGate?.status
  if (gate === "pass") return "通过水热硬阈值，孔道可达性与 OACS 支持进入最终候选排序。"
  if (gate === "needs_review") return "存在水相稳定性记录，但 PXRD 或字段来源仍需复核。"
  return "关键水热证据不足，硬阈值优先于孔结构优势。"
}

function mainRisk(candidate) {
  const risks = [
    candidate?.hydrothermalGate?.status !== "pass" ? "水热证据未闭合" : null,
    candidate?.organicAcidScore?.collapseRisk > 0.4 ? "坍塌风险偏高" : null,
    candidate?.dataStatus?.level?.includes?.("pending") ? "字段溯源待补" : null,
  ].filter(Boolean)
  return risks[0] || "仍需实验验证"
}

function nextExperiment(candidate) {
  if (candidate?.hydrothermalGate?.status !== "pass") return "优先补齐 >=150C 水相稳定性与处理后 PXRD 证据。"
  return "优先做 CO2 水相有机酸路径验证、产物分布检测与反应后 PXRD/ICP 复核。"
}

function buildDecisionRows(result = {}) {
  const topMetal = result.moRecommendation || result.rankedMetals?.[0]
  return (result.rankedFrameworks || []).slice(0, 6).map(candidate => ({
    id: candidate.id,
    candidate,
    candidateName: candidate.displayName,
    targetProduct: "甲酸 / 有机酸",
    pathwayRole: candidate.hydrothermalGate?.status === "pass" ? "Al-MOF 稳定骨架 / scaffold" : "数据补齐候选 / review candidate",
    finalScore: candidate.organicAcidScore?.oacs ?? 0,
    evidenceLevel: evidenceConfidence(candidate),
    pathwayFit: candidate.descriptorScores?.poreAccessibility ?? candidate.organicAcidScore?.oacs ?? 0,
    graphCentrality: graphCentralityProxy(candidate),
    validationReadiness: gateLabel(candidate.hydrothermalGate?.status, "zh"),
    mainReason: mainReason(candidate),
    mainRisk: mainRisk(candidate),
    nextExperiment: nextExperiment(candidate),
    metalHypothesis: topMetal?.metal ? `@${topMetal.metal}` : "metal pending",
  }))
}

function TraceGrid({ row, lang, t }) {
  const trace = [
    {
      step: "Raw Candidate",
      stepZh: "原始候选",
      input: row.candidateName,
      output: row.candidate?.sourceDatabase || "pending source",
      impact: "candidate loaded",
      impactZh: "候选进入筛选",
      blocker: row.candidate?.sourceRecordId || "pending",
      next: "检查字段来源",
      nextEn: "Check field provenance",
    },
    {
      step: "Pathway Mapping",
      stepZh: "路径映射",
      input: row.targetProduct,
      output: row.pathwayRole,
      impact: "pathway fit",
      impactZh: "路径适配度",
      blocker: row.mainRisk,
      next: "查看路径依据",
      nextEn: "Review pathway basis",
    },
    {
      step: "Graph Metric Calculation",
      stepZh: "图论指标计算",
      input: "孔结构 / descriptor proxy",
      output: formatScore(row.graphCentrality),
      impact: "graph metric proxy",
      impactZh: "图论/结构指标代理",
      blocker: "真实图中心性待回填",
      next: "查看图论指标",
      nextEn: "Review graph metrics",
    },
    {
      step: "Evidence Adjustment",
      stepZh: "证据修正",
      input: row.evidenceLevel,
      output: row.validationReadiness,
      impact: "evidence confidence",
      impactZh: "证据置信度",
      blocker: row.mainRisk,
      next: "查看证据来源",
      nextEn: "Review evidence sources",
    },
    {
      step: "Priority Scoring",
      stepZh: "优先级评分",
      input: "OACS",
      output: formatScore(row.finalScore),
      impact: "final ranking",
      impactZh: "最终排序",
      blocker: row.finalScore > 0 ? "none" : "OACS forced to 0",
      next: "查看排序解释",
      nextEn: "Review ranking explanation",
    },
    {
      step: "Risk Check",
      stepZh: "风险检查",
      input: row.mainRisk,
      output: row.validationReadiness,
      impact: "risk gate",
      impactZh: "风险门控",
      blocker: row.mainRisk,
      next: "查看实验建议",
      nextEn: "Review experiment plan",
    },
    {
      step: "Final Candidate",
      stepZh: "最终候选",
      input: row.candidateName,
      output: row.nextExperiment,
      impact: "next action",
      impactZh: "下一步行动",
      blocker: "not final recommendation",
      next: row.nextExperiment,
      nextEn: row.nextExperiment,
    },
  ]
  return (
    <div data-testid="organic-acid-decision-trace" style={{ display: "grid", gap: 7 }}>
      {trace.map(item => (
        <article key={item.step} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.2 }}>{text(lang, item.stepZh, item.step)}</strong>
          <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "输入", "Input")}: {displayValue(item.input)} · {text(lang, "输出", "Output")}: {displayValue(item.output)}</span>
          <span style={{ color: t.accentText, fontSize: 11.2 }}>{text(lang, "影响指标", "Impact metric")}: {text(lang, item.impactZh, item.impact)}</span>
          <span style={{ color: t.warn, fontSize: 11.2 }}>{text(lang, "阻断因素", "Blocker")}: {displayValue(item.blocker)}</span>
          <span style={{ color: t.faint, fontSize: 11.2 }}>{text(lang, "下一步建议", "Next action")}: {text(lang, item.next, item.nextEn)}</span>
        </article>
      ))}
    </div>
  )
}

export function OrganicAcidFinalDecisionBoard({ result, lang, t, isMobile, onInspectCandidate }) {
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
            "当前用于什么判断：最终决策面板把候选排序、路径适配、证据置信度、图论/结构指标代理、验证就绪度、数据缺口与推荐下一步实验放在同一判断面。真实图中心性和实验结论仍需后续数据回填。",
            "The decision board combines ranking, pathway fit, evidence confidence, graph/structure metric proxies, validation readiness, data gaps, and next experiment suggestions in one decision surface."
          )} />
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
                  <strong style={{ fontSize: 13.2 }}><ChemicalText value={`#${row.candidate?.rank || "-"} ${row.candidateName}`} /></strong>
                  <StatusPill tone={statusTone(row.candidate?.hydrothermalGate?.status)} t={t}>{row.validationReadiness}</StatusPill>
                </div>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{row.targetProduct} · {row.pathwayRole}</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                  {[
                    [text(lang, "最终分", "Final score"), formatScore(row.finalScore)],
                    [text(lang, "证据", "Evidence"), row.evidenceLevel],
                    [text(lang, "路径适配", "Pathway fit"), formatScore(row.pathwayFit)],
                    [text(lang, "图论指标", "Graph metric"), formatScore(row.graphCentrality)],
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
                ["finalScore", "finalScore", formatScore(active.finalScore)],
                ["evidenceLevel", "evidenceLevel", active.evidenceLevel],
                ["pathwayFit", "pathwayFit", formatScore(active.pathwayFit)],
                ["graphCentrality", "graphCentrality", formatScore(active.graphCentrality)],
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
            <TraceGrid row={active} lang={lang} t={t} />
          </article>
        ) : null}
      </div>
    </Panel>
  )
}

export default OrganicAcidFinalDecisionBoard
