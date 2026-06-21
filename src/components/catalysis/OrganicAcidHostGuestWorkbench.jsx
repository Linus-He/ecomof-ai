// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { fetchDataJson } from "../../shared"
import {
  buildAlgorithmTraceJson,
  buildHostGuestRouteExplanation,
  buildHostGuestRouteExplanationJson,
  buildHostGuestRoutePriorityQueueCsv,
  buildOrganicAcidExperimentalRouteJson,
  buildOrganicAcidHostGuestWorkbench,
  buildPathwayDescriptorMapCsv,
  ORGANIC_ACID_HOST_GUEST_VERSION,
} from "../../utils/organicAcidHostGuest"
import { NumericText, organicAcidPalette as palette, ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"

const DATA_FILES = {
  pathwaySteps: "organic_acid_host_guest/pathway_steps.json",
  pathwayDescriptorMap: "organic_acid_host_guest/pathway_descriptor_map.json",
  hostMofCandidates: "organic_acid_host_guest/host_mof_candidates.json",
  guestMetalCandidates: "organic_acid_host_guest/guest_metal_candidates.json",
  hostGuestRoutes: "organic_acid_host_guest/host_guest_routes.json",
  evidenceRiskRecords: "organic_acid_host_guest/evidence_risk_records.json",
  validationExperiments: "organic_acid_host_guest/validation_experiments.json",
}

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function fmt(value, digits = 3) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0"
  return next.toFixed(digits)
}

function pct(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0%"
  return `${Math.round(Math.max(0, Math.min(1, next)) * 100)}%`
}

function joinList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("; ") || "pending"
  return value || "pending"
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
    lineHeight: 1.35,
    minHeight: 34,
    padding: "8px 10px",
    textAlign: "left",
  }
}

function downloadText(fileName, content, type = "application/json") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function ScorePill({ label, value, tone = palette.accent }) {
  return (
    <div style={{ ...cardStyle({ padding: 10 }), gap: 7 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
        <NumericText style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}>{fmt(value, 2)}</NumericText>
      </div>
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <span style={{ background: tone, display: "block", height: "100%", width: pct(value) }} />
      </div>
    </div>
  )
}

function SectionTitle({ kicker, title, note }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.12, textTransform: "uppercase" }}>{kicker}</div>
      <h2 style={{ color: palette.text, fontSize: 20, lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {note ? <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{note}</p> : null}
    </div>
  )
}

function RecommendationCard({ workbench, lang }) {
  const rec = workbench.recommendation
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.accent}`, borderRadius: 10, display: "grid", gap: 13, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: palette.accent, fontSize: 11, fontWeight: 950, letterSpacing: 0.1, textTransform: "uppercase" }}>
          Current algorithm recommendation:
        </div>
        <h2 style={{ color: palette.text, fontSize: 22, lineHeight: 1.16, margin: 0 }}>
          {text(lang, "当前算法建议：Al-MOF + Mo 实验验证路线", "Al-MOF + Mo experimental validation route")}
        </h2>
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <ScorePill label="Host framework: Al-MOF" value={workbench.hostSelection.selectedHost?.hostScore} tone={palette.positive} />
        <ScorePill label="Guest / dopant metal: Mo" value={workbench.guestSelection.selectedGuestMetal?.guestScore} />
        <ScorePill label="Final HGCPS" value={workbench.complementarity.topRoute?.finalHGCPS} tone={palette.mixed} />
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {[
          ["Suggested route", rec.suggestedRoute],
          ["Algorithm basis", rec.algorithmBasis],
          ["Confidence", rec.confidence],
          ["Main uncertainty", rec.mainUncertainty],
          ["Note", rec.note],
        ].map(([label, value]) => (
          <div key={label} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 760, lineHeight: 1.45, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55 }}>
        {text(
          lang,
          "结论边界：Al-MOF 是稳定主体 MOF / stable host framework；Mo 是客体 / 掺杂 / activity compensation metal。该路线来自路径步骤描述符筛选与主客体互补路径评分，不是黑盒机器学习预测，也不代表已经证明最终催化性能最优。",
          "Boundary: Al-MOF is the stable host framework; Mo is the guest / dopant / activity compensation metal. The route comes from pathway-step descriptor screening and host-guest complementarity scoring, not black-box machine learning, and it is not final proof of catalytic performance."
        )}
      </div>
    </section>
  )
}

function PipelineStepper({ workbench, activeStep, setActiveStep, lang, isNarrow }) {
  const active = workbench.pipelineSteps[activeStep] || workbench.pipelineSteps[0]
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="6-step algorithm timeline"
        title={text(lang, "6-step 主客体路径筛选流程", "6-step Host-Guest Pathway Screening Timeline")}
        note={text(lang, "每一步显示输入、筛选逻辑、输出、证据与不确定性。", "Each step shows input, screening logic, output, evidence, and uncertainty.")}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr" : "repeat(6, minmax(0, 1fr))" }}>
        {workbench.pipelineSteps.map((step, index) => (
          <button key={step.id} type="button" onClick={() => setActiveStep(index)} style={buttonStyle(activeStep === index)}>
            <span style={{ color: activeStep === index ? palette.accent : palette.faint, display: "block", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 900 }}>Step {step.stepNumber}</span>
            <span>{step.title}</span>
          </button>
        ))}
      </div>
      <article style={{ ...cardStyle({ background: palette.surfaceStrong }) }}>
        <div style={{ color: palette.text, fontSize: 16, fontWeight: 920 }}>{active.title}</div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {[
            ["Input", active.input],
            ["Screening logic", active.screeningLogic],
            ["Output", active.output],
            ["Evidence", active.evidence],
            ["Uncertainty", active.uncertainty],
          ].map(([label, value]) => (
            <div key={label} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
              <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{value}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

function PathwayDescriptorSection({ workbench, lang }) {
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Pathway descriptors"
        title={text(lang, "路径步骤描述符筛选", "Pathway Step Descriptor Screening")}
        note={text(lang, "描述符按路径步骤映射，避免把 CO2 富集、活化、HCOO* 稳定、脱附与稳定性风险混成一个总表。", "Descriptors are mapped by pathway step rather than merged into one table.")}
      />
      <div style={{ display: "grid", gap: 10 }}>
        {workbench.pathwaySteps.map(step => {
          const mappings = workbench.descriptorMap.filter(mapping => mapping.stepId === step.stepId)
          return (
            <article key={step.stepId} style={cardStyle()}>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.4fr)" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ color: palette.text, fontSize: 13.5 }}>{step.order}. {step.stepName}</strong>
                  <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>{step.chemicalMeaning}</span>
                  <span style={{ color: palette.faint, fontSize: 11.5 }}>Bottleneck: {step.bottleneckType} · confidence {step.confidenceLevel}</span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {mappings.map(mapping => (
                    <div key={mapping.mappingId} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 9 }}>
                      <div style={{ color: palette.accent, fontSize: 12, fontWeight: 900 }}>{mapping.descriptorGroup}</div>
                      <div style={{ color: palette.text, fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{mapping.descriptorSummary}</div>
                      <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{mapping.whyTheseDescriptorsMatter}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SelectionSection({ workbench, lang, isNarrow }) {
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Host and guest selection"
        title={text(lang, "主体 MOF 与客体金属筛选", "Host MOF and Guest Metal Selection")}
        note={text(lang, "Al-MOF 与 Mo 均由候选评分排序得到；Al-MOF 是稳定骨架，Mo 是活性补偿和电子调控客体。", "Al-MOF and Mo are selected by candidate scoring; Al-MOF is the stable scaffold and Mo is the activity-compensation guest.")}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <div style={cardStyle()}>
          <strong style={{ color: palette.text }}>Host MOF Selection</strong>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>{workbench.hostSelection.hostRoleExplanation}</div>
          <div style={{ display: "grid", gap: 7 }}>
            {workbench.hostSelection.rankedHosts.map(host => (
              <div key={host.hostMofId} style={{ background: host.ranking === 1 ? palette.positiveSoft : palette.bg, border: `1px solid ${host.ranking === 1 ? palette.positive : palette.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "34px minmax(0, 1fr) 58px", padding: 9 }}>
                <NumericText style={{ color: palette.faint, fontSize: 12, fontWeight: 900 }}>#{host.ranking}</NumericText>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900 }}>{host.displayName}</div>
                  <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4 }}>{host.hostRole}</div>
                </div>
                <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 900, textAlign: "right" }}>{fmt(host.hostScore, 3)}</NumericText>
              </div>
            ))}
          </div>
          <div style={{ color: palette.risk, fontSize: 11.8, lineHeight: 1.45 }}>{workbench.hostSelection.hostLimitation}</div>
        </div>
        <div style={cardStyle()}>
          <strong style={{ color: palette.text }}>Guest Metal Selection</strong>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>{workbench.guestSelection.guestRoleExplanation}</div>
          <div style={{ display: "grid", gap: 7 }}>
            {workbench.guestSelection.rankedGuestMetals.map(guest => (
              <div key={guest.guestMetal} style={{ background: guest.ranking === 1 ? palette.accentSoft : palette.bg, border: `1px solid ${guest.ranking === 1 ? palette.accent : palette.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "34px minmax(0, 1fr) 58px", padding: 9 }}>
                <NumericText style={{ color: palette.faint, fontSize: 12, fontWeight: 900 }}>#{guest.ranking}</NumericText>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900 }}>{guest.guestMetal}</div>
                  <div style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4 }}>{guest.role}</div>
                </div>
                <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 900, textAlign: "right" }}>{fmt(guest.guestScore, 3)}</NumericText>
              </div>
            ))}
          </div>
          <div style={{ color: palette.risk, fontSize: 11.8, lineHeight: 1.45 }}>{workbench.guestSelection.mainRisk}</div>
        </div>
      </div>
    </section>
  )
}

function PriorityQueueSection({ workbench, selectedRouteId, setSelectedRouteId, selectedExplanation, lang, isNarrow }) {
  const routeGroups = [
    [text(lang, "Top Priority Route", "Top Priority Route"), workbench.priorityQueue.topPriority],
    [text(lang, "Conditional Routes", "Conditional Routes"), workbench.priorityQueue.conditionalRoutes],
    [text(lang, "Pending / Insufficient Evidence Routes", "Pending / Insufficient Evidence Routes"), workbench.priorityQueue.pendingRoutes],
  ]
  return (
    <section id="organic-acid-host-guest-priority-queue" style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}>
      <SectionTitle
        kicker="Route Priority Queue"
        title={text(lang, "实验路线优先级队列", "Host-Guest Route Priority Queue")}
        note={text(lang, "队列按实验路线排序，不再把优先级解释成单纯 MOF 候选列表。", "The queue ranks experimental routes, not a plain MOF candidate list.")}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.2fr) minmax(320px, 0.8fr)" }}>
        <div style={{ display: "grid", gap: 12 }}>
          {routeGroups.map(([title, rows]) => (
            <div key={title} style={{ display: "grid", gap: 8 }}>
              <strong style={{ color: palette.text, fontSize: 13 }}>{title}</strong>
              {rows.map(route => (
                <button key={route.routeId} type="button" onClick={() => setSelectedRouteId(route.routeId)} style={{ ...buttonStyle(selectedRouteId === route.routeId), display: "grid", gap: 8 }}>
                  <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
                    <span>{route.ranking}. {route.hostMof} + {route.guestMetal} · {route.routeType}</span>
                    <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 900 }}>{fmt(route.finalHGCPS, 3)}</NumericText>
                  </div>
                  <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4 }}>
                    confidence {route.confidenceLevel} · evidence {route.evidenceConfidence >= 0.75 ? "A/B proxy" : "needs validation"} · {route.mainRisk}
                  </span>
                  <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.4 }}>{route.nextExperiment}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <RouteExplanationPanel explanation={selectedExplanation} lang={lang} />
      </div>
    </section>
  )
}

function RouteExplanationPanel({ explanation, lang }) {
  return (
    <aside data-testid="host-guest-route-explanation" style={{ ...cardStyle({ alignSelf: "start", background: palette.surfaceStrong, position: "sticky", top: 96 }) }}>
      <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Route Explanation Panel</div>
      <h3 style={{ color: palette.text, fontSize: 18, lineHeight: 1.18, margin: 0 }}>{explanation.routeName}</h3>
      <div style={{ display: "grid", gap: 7 }}>
        {[
          ["host MOF", explanation.hostMof],
          ["guest metal", explanation.guestMetal],
          ["target product", explanation.targetProduct],
          ["route type", explanation.routeType],
          ["pathway steps supported", joinList(explanation.pathwayStepsSupported)],
          ["provenance trace", joinList(explanation.provenanceTrace)],
          ["next validation experiment", explanation.nextValidationExperiment],
        ].map(([label, value]) => (
          <div key={label} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 8 }}>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
            <div style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.45, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <ScorePill label="Complementarity" value={explanation.complementarityScore} />
        <ScorePill label="Risk penalty" value={explanation.riskPenalty} tone={palette.risk} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "证据来源与风险原因", "Evidence sources and risk reasons")}</strong>
        {explanation.riskPenaltyBreakdown.slice(0, 4).map(row => (
          <div key={row.evidenceId} style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            {row.evidenceId}: {row.riskType} · penalty {fmt(row.penalty, 2)} · {row.reason}
          </div>
        ))}
      </div>
    </aside>
  )
}

function ComplementaryScoringSection({ workbench, lang }) {
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Complementary Scoring"
        title={text(lang, "HGCPS 主客体互补路径评分", "HGCPS Host-Guest Complementarity Scoring")}
        note="HGCPS = Host Stability Score * Host Pathway Support Score * Guest Activity Compensation Score * Host-Guest Complementarity Score * Evidence Confidence Score * Risk Penalty."
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 850, width: "100%" }}>
          <thead>
            <tr>
              {["Rank", "Route", "Host", "Guest", "Complementarity", "Evidence", "Risk penalty", "Final HGCPS", "Main reason"].map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workbench.complementarity.routeScores.map(route => (
              <tr key={route.routeId} style={{ background: route.ranking === 1 ? palette.accentSoft : "transparent" }}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontSize: 12, fontWeight: 900, padding: "9px" }}>#{route.ranking}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 12, fontWeight: 850, padding: "9px" }}>{route.routeName}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.hostStability, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.guestActivityCompensation, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.complementarity, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.evidence, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.riskPenalty, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12, fontWeight: 950, padding: "9px" }}>{fmt(route.finalHGCPS, 3)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.5, lineHeight: 1.45, padding: "9px" }}>{route.mainReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
        Random Forest baseline remains a baseline / risk reference only; it is not used as the final recommendation basis.
      </div>
    </section>
  )
}

function TraceAndGraphSection({ workbench, lang, isNarrow }) {
  const typeCounts = workbench.knowledgeGraph.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {})
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Trace and knowledge graph"
        title={text(lang, "算法追踪器与主客体知识图谱", "Algorithm Trace Explorer and Host-Guest Knowledge Graph")}
        note="Trace path: pathway -> descriptor -> host -> guest -> route."
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <div style={cardStyle()}>
          <strong style={{ color: palette.text }}>Algorithm Trace Explorer</strong>
          {workbench.algorithmTrace.map((step, index) => (
            <div key={step.id} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 5, gridTemplateColumns: "28px minmax(0, 1fr)", padding: 9 }}>
              <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 950 }}>{index + 1}</NumericText>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: palette.text, fontSize: 12.5 }}>{step.title}</strong>
                <span style={{ color: palette.muted, fontSize: 11.6, lineHeight: 1.45 }}>Input: {step.input}</span>
                <span style={{ color: palette.muted, fontSize: 11.6, lineHeight: 1.45 }}>Method: {step.method}</span>
                <span style={{ color: palette.accent, fontSize: 11.6, lineHeight: 1.45 }}>Output: {step.output}</span>
                <span style={{ color: palette.faint, fontSize: 11.2, lineHeight: 1.4 }}>Uncertainty: {step.uncertainty}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={cardStyle()}>
          <strong style={{ color: palette.text }}>Knowledge Graph</strong>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
            {text(lang, "点击 Al-MOF + Mo route 时，高亮路径步骤、描述符、Al-MOF、Mo、证据、风险与验证实验。", "Selecting the Al-MOF + Mo route highlights pathway steps, descriptors, Al-MOF, Mo, evidence, risk, and validation experiments.")}
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 9 }}>
                <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{type}</div>
                <NumericText style={{ color: palette.text, fontSize: 18, fontWeight: 950 }}>{count}</NumericText>
              </div>
            ))}
          </div>
          <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 11.5, lineHeight: 1.45, padding: 10 }}>
            Highlighted path: {workbench.knowledgeGraph.highlightedPath.slice(0, 12).join(" -> ")}
          </div>
        </div>
      </div>
    </section>
  )
}

function EvidenceMatrixSection({ workbench, lang }) {
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Evidence and Confidence Matrix"
        title={text(lang, "证据矩阵 / 置信矩阵", "Evidence Matrix / Confidence Matrix")}
        note={text(lang, "矩阵按 Route / Host / Guest × Pathway Step × Evidence Type × Confidence 展示；缺失证据显式标记 Missing evidence。", "The matrix is route-driven and explicitly marks missing evidence.")}
      />
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760, width: "100%" }}>
            <thead>
              <tr>
                {["Route / Host / Guest", "Pathway Step", "Evidence Type", "Confidence", "Same condition", "Descriptor"].map(head => (
                  <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workbench.evidenceMatrix.slice(0, 12).map((row, index) => (
                <tr key={`${row.routeId}-${index}`}>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 11.7, padding: "8px 9px" }}>{row.hostMof} + {row.guestMetal}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.pathwayStep}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: row.evidenceType === "missing" ? palette.risk : palette.accent, fontSize: 11.7, padding: "8px 9px" }}>{row.evidenceType || "Missing evidence"}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.confidenceLevel}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.sameCondition}</td>
                  <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.descriptor || "Missing evidence"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {workbench.confidenceMatrix.slice(0, 6).map(row => (
            <div key={row.routeId} style={cardStyle({ padding: 10 })}>
              <strong style={{ color: palette.text, fontSize: 12 }}>{row.hostMof} + {row.guestMetal}</strong>
              <span style={{ color: palette.muted, fontSize: 11.5 }}>confidence {row.confidenceLevel} · {row.evidenceGrade}</span>
              <span style={{ color: palette.faint, fontSize: 11.2 }}>{row.provenanceStatus}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValidationAndExportSection({ workbench, selectedExplanation, lang }) {
  const exportRows = [
    {
      label: "Host-Guest Route Priority Queue CSV",
      action: () => downloadText("host-guest-route-priority-queue.csv", buildHostGuestRoutePriorityQueueCsv(workbench.priorityQueue), "text/csv"),
    },
    {
      label: "Al-MOF + Mo Route Explanation JSON",
      action: () => downloadText("al-mof-mo-route-explanation.json", JSON.stringify(buildHostGuestRouteExplanationJson(selectedExplanation), null, 2)),
    },
    {
      label: "Algorithm Trace JSON",
      action: () => downloadText("organic-acid-host-guest-algorithm-trace.json", JSON.stringify(buildAlgorithmTraceJson(workbench.algorithmTrace), null, 2)),
    },
    {
      label: "Pathway Descriptor Map CSV",
      action: () => downloadText("pathway-descriptor-map.csv", buildPathwayDescriptorMapCsv(workbench.descriptorMap), "text/csv"),
    },
    {
      label: "Experimental Route JSON",
      action: () => downloadText("organic-acid-experimental-route.json", JSON.stringify(buildOrganicAcidExperimentalRouteJson(workbench.experimentalRoute), null, 2)),
    },
  ]

  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Experimental Route and Exports"
        title={text(lang, "实验验证路线与导出", "Experimental Route and Exports")}
        note={text(lang, "导出包含版本、生成时间、目标产物、主体 MOF、客体金属、路线类型、评分拆解、证据、风险、溯源与下一步实验。", "Exports include version, generated time, target product, host, guest, route type, score breakdown, evidence, risk, provenance, and next experiment.")}
      />
      <div style={{ display: "grid", gap: 10 }}>
        {workbench.experimentalRoute.experiments.map((experiment, index) => (
          <article key={experiment.experimentId} style={{ ...cardStyle({ gridTemplateColumns: "34px minmax(0, 1fr)" }) }}>
            <NumericText style={{ color: palette.accent, fontSize: 13, fontWeight: 950 }}>{index + 1}</NumericText>
            <div style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: palette.text, fontSize: 12.8 }}>{experiment.recommendedExperiment}</strong>
              <span style={{ color: palette.muted, fontSize: 11.7, lineHeight: 1.45 }}>Purpose: {experiment.purpose}</span>
              <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.4 }}>Success criterion: {experiment.successCriterion}</span>
            </div>
          </article>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {exportRows.map(row => (
          <button key={row.label} type="button" onClick={row.action} style={{ ...buttonStyle(false), textAlign: "center" }}>
            {row.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidHostGuestWorkbench({ lang = "zh", isNarrow = false, initialData = null, workbench: suppliedWorkbench = null }) {
  const [sourceData, setSourceData] = useState(initialData)
  const [status, setStatus] = useState(initialData || suppliedWorkbench ? "loaded" : "idle")
  const [activeStep, setActiveStep] = useState(0)
  const [selectedRouteId, setSelectedRouteId] = useState("route-al-mof-mo")

  useEffect(() => {
    if (initialData || suppliedWorkbench) return
    let live = true
    setStatus("loading")
    Promise.all([
      fetchDataJson(DATA_FILES.pathwaySteps, []),
      fetchDataJson(DATA_FILES.pathwayDescriptorMap, []),
      fetchDataJson(DATA_FILES.hostMofCandidates, []),
      fetchDataJson(DATA_FILES.guestMetalCandidates, []),
      fetchDataJson(DATA_FILES.hostGuestRoutes, []),
      fetchDataJson(DATA_FILES.evidenceRiskRecords, []),
      fetchDataJson(DATA_FILES.validationExperiments, []),
    ]).then(([pathwaySteps, pathwayDescriptorMap, hostMofCandidates, guestMetalCandidates, hostGuestRoutes, evidenceRiskRecords, validationExperiments]) => {
      if (!live) return
      setSourceData({ pathwaySteps, pathwayDescriptorMap, hostMofCandidates, guestMetalCandidates, hostGuestRoutes, evidenceRiskRecords, validationExperiments })
      setStatus("loaded")
    }).catch(() => {
      if (!live) return
      setSourceData(null)
      setStatus("error")
    })
    return () => {
      live = false
    }
  }, [initialData, suppliedWorkbench])

  const workbench = useMemo(() => suppliedWorkbench || (sourceData ? buildOrganicAcidHostGuestWorkbench(sourceData) : null), [sourceData, suppliedWorkbench])
  const selectedRoute = useMemo(() => (
    workbench?.complementarity?.routeScores?.find(route => route.routeId === selectedRouteId) || workbench?.complementarity?.topRoute || null
  ), [workbench, selectedRouteId])
  const selectedExplanation = useMemo(() => {
    if (!workbench || !selectedRoute) return null
    return selectedRoute.routeId === workbench.selectedRouteExplanation.routeId
      ? workbench.selectedRouteExplanation
      : buildHostGuestRouteExplanation(selectedRoute, {
        hostSelection: workbench.hostSelection,
        guestSelection: workbench.guestSelection,
        descriptorMap: workbench.descriptorMap,
        evidenceRecords: sourceData?.evidenceRiskRecords || [],
        validationExperiments: sourceData?.validationExperiments || [],
      })
  }, [workbench, selectedRoute, sourceData])

  if (status === "loading" || !workbench || !selectedExplanation) {
    return (
      <section id="organic-acid-host-guest-workbench" style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}>
        <SectionTitle kicker="V3.9.2" title="Organic Acid Host-Guest Pathway Screening Workbench" note="Loading host-guest algorithm data..." />
      </section>
    )
  }

  if (status === "error") {
    return (
      <section id="organic-acid-host-guest-workbench" style={{ ...cardStyle({ background: palette.riskSoft, padding: 14, scrollMarginTop: 118 }) }}>
        <SectionTitle kicker="V3.9.2" title="Organic Acid Host-Guest Pathway Screening Workbench" note="Host-guest data could not be loaded." />
      </section>
    )
  }

  return (
    <section
      id="organic-acid-host-guest-workbench"
      data-testid="organic-acid-host-guest-workbench"
      style={{ display: "grid", fontFamily: ORGANIC_ACID_FONT, gap: 14, scrollMarginTop: 118 }}
    >
      <section style={{ ...cardStyle({ background: palette.surfaceStrong, padding: 14 }) }}>
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>EcoMOF-AI {ORGANIC_ACID_HOST_GUEST_VERSION}</div>
          <h1 style={{ color: palette.text, fontSize: isNarrow ? 22 : 28, lineHeight: 1.12, margin: 0 }}>
            {workbench.workbenchName} / {workbench.workbenchNameZh}
          </h1>
          <p style={{ color: palette.muted, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            {text(
              lang,
              "围绕 CO2 -> 有机酸路径步骤，先映射描述符，再筛选主体 MOF 和客体金属，最后用 HGCPS 输出高优先级实验验证路线。",
              "Starting from CO2 -> organic-acid pathway steps, the workbench maps descriptors, selects host and guest candidates, then ranks experimental routes with HGCPS."
            )}
          </p>
        </div>
      </section>
      <RecommendationCard workbench={workbench} lang={lang} />
      <PipelineStepper workbench={workbench} activeStep={activeStep} setActiveStep={setActiveStep} lang={lang} isNarrow={isNarrow} />
      <PathwayDescriptorSection workbench={workbench} lang={lang} />
      <SelectionSection workbench={workbench} lang={lang} isNarrow={isNarrow} />
      <ComplementaryScoringSection workbench={workbench} lang={lang} />
      <PriorityQueueSection workbench={workbench} selectedRouteId={selectedRoute.routeId} setSelectedRouteId={setSelectedRouteId} selectedExplanation={selectedExplanation} lang={lang} isNarrow={isNarrow} />
      <TraceAndGraphSection workbench={workbench} lang={lang} isNarrow={isNarrow} />
      <EvidenceMatrixSection workbench={workbench} lang={lang} />
      <ValidationAndExportSection workbench={workbench} selectedExplanation={selectedExplanation} lang={lang} />
    </section>
  )
}
