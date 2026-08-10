import { useEffect, useMemo, useRef, useState } from "react"
import { fetchDataJson } from "../../shared"
import {
  buildEvidenceMatrixCsv,
  buildAblationAnalysisJson,
  buildHostGuestRouteExplanation,
  buildHostGuestRoutePriorityQueueCsv,
  buildMarkdownResearchSummary,
  buildMissingEvidenceRiskMatrixCsv,
  buildOrganicAcidExperimentalRouteJson,
  buildOrganicAcidHostGuestWorkbench,
  buildOrganicAcidRouteReportJson,
  buildSensitivityAnalysisJson,
  HGCPS_FORMULA_TEXT,
  ORGANIC_ACID_HOST_GUEST_VERSION,
} from "../../utils/organicAcidHostGuest"
import { buildOrganicAcidAlgorithmFlowNetwork } from "../../utils/organicAcidAlgorithmFlow"
import { buildStepwiseExecutionChain } from "../../utils/organicAcidStepwiseExecution"
import { buildExperimentalActivationWorkbench } from "../../utils/organicAcidExperimentalActivation"
import { NumericText, organicAcidPalette as palette, ORGANIC_ACID_FONT, SCIENTIFIC_TOKEN_FONT } from "./FormulaInline"
import {
  OrganicAcidAlgorithmFlowExportLinks,
} from "./OrganicAcidAlgorithmFlowNetwork"
import { OrganicAcidExperimentalActivationCenter } from "./OrganicAcidExperimentalActivationCenter"
import { OrganicAcidStepwiseExecutionChain } from "./stepwiseExecution"
import { RouteHostStructureModal, RouteStructureEvidence } from "./RouteStructureEvidence"

const DATA_FILES = {
  pathwaySteps: "organic_acid_host_guest/pathway_steps.json",
  pathwayDescriptorMap: "organic_acid_host_guest/pathway_descriptor_map.json",
  hostMofCandidates: "organic_acid_host_guest/host_mof_candidates.json",
  guestMetalCandidates: "organic_acid_host_guest/guest_metal_candidates.json",
  hostGuestRoutes: "organic_acid_host_guest/host_guest_routes.json",
  evidenceRiskRecords: "organic_acid_host_guest/evidence_risk_records.json",
  validationExperiments: "organic_acid_host_guest/validation_experiments.json",
  coreMofImport: "data_ingestion/core_mof_import_v2.json",
  qmofImport: "data_ingestion/qmof_import_v2.json",
  reactionDataset: "data_ingestion/organic_acid_reaction_dataset_v1.json",
  gasAdsorptionRecords: "gas_adsorption_records_v1.json",
  literatureDataset: "organic_acid_literature_dataset_v2.json",
  goldDataset: "organic_acid_gold_dataset_v2.json",
  fairMofsFamilyEvidence: "fair_mofs_family_synthesis_evidence.json",
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

function sourceLabel(tuple) {
  if (!tuple) return "pending"
  return `${tuple.derivationLevel || "source"} (n=${tuple.nRecords ?? 0}, ${tuple.sourceDataset || "dataset pending"})`
}

function rawAggregateText(value) {
  if (!value || typeof value !== "object") return String(value ?? "pending")
  return Object.entries(value).map(([key, item]) => `${key}: ${Array.isArray(item) ? item.join("|") : String(item)}`).join("; ")
}

function FactorSourceRows({ provenance = {}, lang, maxRows = 8 }) {
  const rows = Object.entries(provenance).slice(0, maxRows)
  if (!rows.length) return null
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "逐因子来源", "Factor sources")}</strong>
      {rows.map(([factor, tuple]) => (
        <details key={factor} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 8 }}>
          <summary style={{ color: /fallback/.test(tuple?.derivationLevel || "") ? palette.risk : /curated/.test(tuple?.derivationLevel || "") ? palette.mixed : palette.accent, cursor: "pointer", fontSize: 11.7, fontWeight: 850 }}>
            {factor}: {sourceLabel(tuple)}
          </summary>
          <div style={{ color: palette.muted, display: "grid", fontSize: 11.3, gap: 4, lineHeight: 1.45, marginTop: 7 }}>
            <span>rawAggregate: {rawAggregateText(tuple?.rawAggregate)}</span>
            <span>normalization: {tuple?.normalization || "pending"}</span>
            <span>value: {fmt(tuple?.value, 3)}</span>
            {tuple?.recordRefs?.length ? <span>records: {tuple.recordRefs.slice(0, 5).join("; ")}</span> : null}
            {tuple?.fallbackReason ? <span>fallback: {tuple.fallbackReason}</span> : null}
          </div>
        </details>
      ))}
    </div>
  )
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

function scrollToActivationCenter() {
  if (typeof document === "undefined") return
  const details = document.getElementById("organic-acid-experimental-activation-entry")
  if (details?.tagName === "DETAILS") details.open = true
  document.getElementById("organic-acid-experimental-activation-entry")?.scrollIntoView?.({ behavior: "smooth", block: "start" })
}

function openAlgorithmMethodology(anchor = "#project-evolution-organic-acid-algorithm-methodology") {
  if (typeof window === "undefined") return
  window.location.hash = anchor
}

function ScoreBadge({ label, value, tone = palette.accent }) {
  return (
    <div style={{ ...cardStyle({ padding: 10 }), gap: 7 }}>
      <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
        <NumericText style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}>{fmt(value, 2)}</NumericText>
      </div>
      <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 6, height: 7, overflow: "hidden" }}>
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

function RecommendationCard({ workbench, lang, onOpenActivationCenter }) {
  const rec = workbench.recommendation
  const topRoute = workbench.complementarity.topRoute
  const structuralHost = workbench.hostSelection.selectedHost
  const routeHost = workbench.hostSelection.rankedHosts.find(row => row.displayName === topRoute?.hostMof)
  const routeGuest = workbench.guestSelection.rankedGuestMetals.find(row => row.guestMetal === topRoute?.guestMetal)
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.accent}`, borderRadius: 10, display: "grid", gap: 13, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: palette.accent, fontSize: 11, fontWeight: 950, letterSpacing: 0.1, textTransform: "uppercase" }}>
          Current algorithm recommendation:
        </div>
        <h2 style={{ color: palette.text, fontSize: 22, lineHeight: 1.16, margin: 0 }}>
          {text(lang, `当前算法建议：${topRoute?.hostMof || rec.hostFramework} + ${topRoute?.guestMetal || rec.guestDopantMetal} 实验验证路线`, `${topRoute?.hostMof || rec.hostFramework} + ${topRoute?.guestMetal || rec.guestDopantMetal} experimental validation route`)}
        </h2>
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <ScoreBadge label={`${text(lang, "路线最优主体", "Top route host")}: ${routeHost?.displayName || "pending"}`} value={routeHost?.hostScore} tone={palette.positive} />
        <ScoreBadge label={`${text(lang, "路线客体 / 掺杂金属", "Route guest / dopant")}: ${routeGuest?.guestMetal || "pending"}`} value={routeGuest?.guestScore} />
        <ScoreBadge label="Final HGCPS" value={topRoute?.finalHGCPS} tone={palette.mixed} />
      </div>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {[
          [text(lang, "结构 / 稳定性最优主体", "Top structural host"), rec.topStructuralHost],
          [text(lang, "综合路线最优主体", "Top route host"), rec.topRouteHost],
          [text(lang, "主体分歧解释", "Host divergence explanation"), rec.hostSelectionExplanation],
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
          `结论边界：最终推荐对象取路线榜 HGCPS 第一，即 ${routeHost?.displayName || "当前路线主体"} + ${routeGuest?.guestMetal || "当前路线客体"}。结构 / 稳定性单项最优主体为 ${structuralHost?.displayName || "待定"}；两者不一致时会明确并列展示。该路线不是黑盒机器学习预测，也不代表已经证明最终催化性能最优。`,
          `Boundary: the final recommendation follows the top HGCPS route, ${routeHost?.displayName || "the route host"} + ${routeGuest?.guestMetal || "the route guest"}. The host-only structural leader is ${structuralHost?.displayName || "pending"}; any divergence is shown explicitly. This is not black-box ML or final proof of catalytic performance.`
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          Open Experimental Activation Center
        </button>
        <button type="button" onClick={openAlgorithmMethodology} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          Organic Acid Algorithm Methodology
        </button>
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
        note={text(lang, "主体与客体均由 V3.9.10 锁定 spec v3 计算；可合成性已改为 FAIR-MOFs 合成条件可及性，记录数只用于收缩与置信度，不再直接奖励数据库中的高频家族。", "Host and guest are computed with the locked V3.9.10 spec v3. Synthesizability is now FAIR-MOFs synthesis-condition accessibility; record count controls shrinkage and confidence but never directly rewards frequent database families.")}
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
                  <div style={{ color: palette.faint, fontSize: 10.8, lineHeight: 1.35 }}>{sourceLabel(host.factorProvenance?.poreEnvironmentScore || host.factorProvenance?.stabilityProxy)}</div>
                  <div style={{ color: palette.faint, fontSize: 10.8, lineHeight: 1.35 }}>
                    ligand {fmt(host.ligandPathwaySupport, 2)} · synthesis {fmt(host.synthesizabilityScore, 2)}
                  </div>
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
                  <div style={{ color: palette.faint, fontSize: 10.8, lineHeight: 1.35 }}>{sourceLabel(guest.factorProvenance?.co2ActivationScore)}</div>
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

function PriorityQueueSection({ workbench, selectedRouteId, setSelectedRouteId, selectedExplanation, lang, isNarrow, onOpenActivationCenter, onViewHostStructure }) {
  const routeGroups = [
    [text(lang, "最高优先级路线", "Top Priority Route"), workbench.priorityQueue.topPriority],
    [text(lang, "有条件推进路线", "Conditional Routes"), workbench.priorityQueue.conditionalRoutes],
    [text(lang, "证据不足/待补路线", "Pending / Insufficient Evidence Routes"), workbench.priorityQueue.pendingRoutes],
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
                <div key={route.routeId} style={{ ...buttonStyle(selectedRouteId === route.routeId), display: "grid", gap: 8 }}>
                  <button type="button" onClick={() => setSelectedRouteId(route.routeId)} style={{ background: "transparent", border: 0, cursor: "pointer", display: "grid", gap: 8, padding: 0, textAlign: "left" }}>
                    <div style={{ alignItems: "baseline", display: "flex", gap: 10, justifyContent: "space-between" }}>
                      <span>{route.ranking}. {route.hostMof} + {route.guestMetal} · {route.routeType}</span>
                      <NumericText style={{ color: palette.accent, fontSize: 12, fontWeight: 900 }}>{fmt(route.finalHGCPS, 3)}</NumericText>
                    </div>
                    <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.4 }}>
                      confidence {route.confidenceLevel} · evidence {route.evidenceConfidence >= 0.75 ? "A/B proxy" : "needs validation"} · {route.mainRisk}
                    </span>
                    <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.4 }}>{route.nextExperiment}</span>
                  </button>
                  <RouteStructureEvidence route={route} lang={lang} compact onViewHostStructure={onViewHostStructure} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <RouteExplanationPanel explanation={selectedExplanation} lang={lang} onOpenActivationCenter={onOpenActivationCenter} onViewHostStructure={onViewHostStructure} />
      </div>
    </section>
  )
}

function RouteExplanationPanel({ explanation, lang, onOpenActivationCenter, onViewHostStructure }) {
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
        <ScoreBadge label="Complementarity" value={explanation.complementarityScore} />
        <ScoreBadge label="Risk retention factor" value={explanation.riskPenalty} tone={palette.risk} />
      </div>
      <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 11.8, lineHeight: 1.45, padding: 9 }}>
        {text(
          lang,
          `来源总览：${explanation.derivationSummary?.dataDerivedCount ?? 0} 个 data/rule-derived，${explanation.derivationSummary?.curatedCount ?? 0} 个 curated，${explanation.derivationSummary?.fallbackCount ?? 0} 个 fallback；累计记录 n=${explanation.derivationSummary?.totalRecords ?? 0}。`,
          `Source overview: ${explanation.derivationSummary?.dataDerivedCount ?? 0} data/rule-derived, ${explanation.derivationSummary?.curatedCount ?? 0} curated, ${explanation.derivationSummary?.fallbackCount ?? 0} fallback; total records n=${explanation.derivationSummary?.totalRecords ?? 0}.`
        )}
      </div>
      <FactorSourceRows provenance={explanation.routeFactorProvenance} lang={lang} maxRows={8} />
      <RouteStructureEvidence route={explanation} lang={lang} onViewHostStructure={onViewHostStructure} />
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "证据来源与风险原因", "Evidence sources and risk reasons")}</strong>
        {explanation.riskPenaltyBreakdown.slice(0, 4).map(row => (
          <div key={row.evidenceId} style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
            {row.evidenceId}: {row.riskType} · reason weight {fmt(row.penalty, 2)} · {row.reason}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          Plan first experiment
        </button>
        <button type="button" onClick={openAlgorithmMethodology} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          View algorithm methodology
        </button>
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
        note={`${HGCPS_FORMULA_TEXT}. The preregistered weighted geometric mean preserves the bottleneck effect while adding ligand chemistry, synthesizability, and economics.`}
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1080, width: "100%" }}>
          <thead>
            <tr>
              {["Rank", "Route", "Host stability", "Pathway", "Guest", "Complementarity", "Evidence", "Risk", "Synthesis", "Economics", "Final HGCPS", "Main reason"].map(head => (
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
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.hostPathwaySupport, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.guestActivityCompensation, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.complementarity, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.evidence, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.riskRetentionFactor, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.synthesizability, 2)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.mixed, fontSize: 12, padding: "9px" }}>{fmt(route.scoreBreakdown.economics, 2)}</td>
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
            {text(lang, "选择当前路线时，高亮路径步骤、描述符、主体、客体、证据、风险与验证实验。", "Selecting the current route highlights pathway steps, descriptors, host, guest, evidence, risk, and validation experiments.")}
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
    <section style={{ display: "grid", gap: 12 }}>
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

function RiskMatrixSection({ workbench, lang, onOpenActivationCenter }) {
  const topRouteId = workbench.complementarity.topRoute?.routeId
  const topRisk = workbench.missingEvidenceRiskMatrix.find(row => row.routeId === topRouteId) || workbench.missingEvidenceRiskMatrix[0]
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Missing Evidence & Risk Matrix"
        title={text(lang, "缺失证据与风险矩阵", "Missing Evidence & Risk Matrix")}
        note={text(lang, "把缺失描述符、同条件实验、170C 水相稳定性、客体引入和局域配位不确定性作为可验证风险列出。", "Missing descriptors, same-condition experiments, 170C aqueous stability, guest introduction, and local coordination uncertainty are listed as testable risks.")}
      />
      {topRisk ? (
        <article style={{ ...cardStyle({ background: palette.riskSoft }) }}>
          <strong style={{ color: palette.text, fontSize: 13.5 }}>{topRisk.routeName}</strong>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {[
              ["Guest introduction feasibility", topRisk.moIntroductionFeasibilityRisk],
              ["Local coordination", topRisk.localCoordinationUncertainty],
              ["170C aqueous stability", topRisk.hydrothermalStabilityRisk],
              ["Same-condition evidence", topRisk.missingSameConditionExperiment],
              ["Missing descriptor", topRisk.missingDescriptor],
              ["Risk retention factor", fmt(topRisk.riskRetentionFactor, 2)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, padding: 10 }}>
                <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
                <div style={{ color: palette.text, fontSize: 12.2, fontWeight: 760, lineHeight: 1.45, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>
            Recommended data to collect: {topRisk.recommendedDataToCollect}
          </div>
          <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, justifySelf: "start", textAlign: "center" }}>
            Generate required data template
          </button>
        </article>
      ) : null}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 940, width: "100%" }}>
          <thead>
            <tr>
              {["Route", "Missing descriptor", "Same-condition experiment", "Hydrothermal stability", "Mo / guest introduction", "Local coordination", "Risk retention"].map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workbench.missingEvidenceRiskMatrix.slice(0, 10).map(row => (
              <tr key={row.routeId} style={{ background: row.routeId === topRouteId ? palette.accentSoft : "transparent" }}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 11.7, fontWeight: 820, padding: "8px 9px" }}>{row.routeName}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.missingDescriptor}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.missingSameConditionExperiment}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 11.7, padding: "8px 9px" }}>{row.hydrothermalStabilityRisk}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.risk, fontSize: 11.7, padding: "8px 9px" }}>{row.moIntroductionFeasibilityRisk}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.localCoordinationUncertainty}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.accent, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.7, fontWeight: 900, padding: "8px 9px" }}>{fmt(row.riskRetentionFactor, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SensitivityAnalysisSection({ workbench, lang }) {
  const summary = workbench.sensitivityAnalysis.summary
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Sensitivity Analysis Panel"
        title={text(lang, "敏感性分析", "Sensitivity Analysis")}
        note={text(lang, "对每个 HGCPS 因子做权重指数 ±20% 扰动，并加入归一化曲率扰动；报告路线翻转率与 Al-MOF / Ti-MOF / MIL-type 的排名分布。", "Each HGCPS factor receives a +/-20% weight-exponent perturbation plus normalization-curvature scenarios; route flip frequency and Al-MOF / Ti-MOF / MIL-type rank distributions are reported.")}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {[
          ["Rank stability", pct(summary.rankStability)],
          ["Top-route flip frequency", pct(summary.topRouteFlipFrequency)],
          ["Fragility", summary.fragility],
          ["Current top route remains top", summary.topRouteRemainsTop ? "yes" : "no"],
          ["Most sensitive factor", summary.mostSensitiveFactor],
          ["Max score change", fmt(summary.maxScoreChange, 3)],
        ].map(([label, value]) => (
          <div key={label} style={cardStyle({ background: palette.surfaceStrong })}>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</div>
            <div style={{ color: palette.text, fontSize: 13.5, fontWeight: 920 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {workbench.sensitivityAnalysis.candidateRankDistributions.map(row => (
          <div key={row.hostMof} style={cardStyle({ background: palette.surfaceStrong })}>
            <div style={{ color: palette.text, fontSize: 12.5, fontWeight: 900 }}>{row.hostMof}</div>
            <div style={{ color: palette.muted, fontSize: 11.7 }}>
              {text(lang, "排名范围", "Rank range")}: #{row.minRank}-#{row.maxRank} · {text(lang, "中位", "median")} #{row.medianRank} · #1 {pct(row.topRankFrequency)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 820, width: "100%" }}>
          <thead>
            <tr>
              {["Factor", "Perturbation", "Baseline ranking", "Adjusted ranking", "Original top rank", "Score change", "Warning"].map(head => (
                <th key={head} style={{ borderBottom: `1px solid ${palette.borderStrong}`, color: palette.faint, fontSize: 11, fontWeight: 900, padding: "8px 9px", textAlign: "left" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workbench.sensitivityAnalysis.scenarios.map(row => (
              <tr key={row.scenarioId}>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 11.7, padding: "8px 9px" }}>{row.factorLabel}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.perturbation}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontSize: 11.7, padding: "8px 9px" }}>{row.baselineTopRoute}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: row.topRouteRemainsTop ? palette.accent : palette.risk, fontSize: 11.7, padding: "8px 9px" }}>{row.adjustedTopRoute}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.text, fontSize: 11.7, fontWeight: 850, padding: "8px 9px" }}>#{row.adjustedOriginalTopRank}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: palette.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.7, padding: "8px 9px" }}>{fmt(row.scoreChange, 3)}</td>
                <td style={{ borderBottom: `1px solid ${palette.border}`, color: row.warning ? palette.risk : palette.faint, fontSize: 11.7, padding: "8px 9px" }}>{row.warning || "rank stable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ScoringAuditSection({ workbench, lang }) {
  const audit = workbench.audit || {}
  const proxy = audit.proxyValidity || {}
  const family = audit.familyFairness || {}
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="V3.9.10 Scoring Audit"
        title={text(lang, "评分审计", "Scoring Audit")}
        note={text(lang, "审计只报告代理有效性、家族公平性与排名稳健性；不静默改权重。", "The audit reports proxy validity, family fairness, and ranking robustness; it does not silently change weights.")}
      />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {(proxy.descriptors || []).map(row => (
          <div key={row.descriptor} style={cardStyle({ background: row.validity === "low-validity-for-this-reaction" ? palette.riskSoft : palette.positiveSoft })}>
            <strong style={{ color: palette.text, fontSize: 12.5 }}>{row.descriptor}</strong>
            <NumericText style={{ color: row.validity === "low-validity-for-this-reaction" ? palette.risk : palette.positive, fontSize: 15, fontWeight: 950 }}>
              Spearman {row.spearmanRho ?? "n/a"}
            </NumericText>
            <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{row.validity}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "复合孔代理", "Composite pore proxy")}</strong>
          <span style={{ color: palette.muted, fontSize: 11.7 }}>
            rho {proxy.composite?.spearmanRho ?? "n/a"} · {proxy.composite?.validity || "pending"}
          </span>
        </div>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "低置信家族", "Low-confidence families")}</strong>
          <span style={{ color: palette.risk, fontSize: 11.7 }}>{(family.lowConfidenceFamilies || []).join(", ") || "none"}</span>
        </div>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "权重变更", "Weight mutation")}</strong>
          <span style={{ color: palette.positive, fontSize: 11.7 }}>{audit.scoringMutation?.applied ? "applied" : "none during audit"}</span>
        </div>
      </div>
      <div style={{ color: palette.muted, fontSize: 11.8, lineHeight: 1.5 }}>
        {text(
          lang,
          `家族审计输出 nRecords、median / IQR、异常值与主导记录。当前敏感性：top route 翻转率 ${pct(audit.rankingSensitivity?.summary?.topRouteFlipFrequency || 0)}。`,
          `Family audit includes nRecords, median/IQR, outliers, and dominant records. Current top-route flip frequency: ${pct(audit.rankingSensitivity?.summary?.topRouteFlipFrequency || 0)}.`
        )}
      </div>
    </section>
  )
}

function AblationAnalysisSection({ workbench, lang }) {
  const ablation = workbench.ablationAnalysis
  const topRoute = workbench.complementarity.topRoute
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Ablation Analysis Panel"
        title={text(lang, "消融分析", "Ablation Analysis")}
        note={text(lang, "逐项移除客体活性补偿、主体稳定性、主客体互补、证据置信度与风险保留，检验当前 top route 排名依赖。", "Each scenario removes guest compensation, host stability, complementarity, evidence confidence, or risk retention to test the top-route dependency.")}
      />
      <div style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 12, lineHeight: 1.5, padding: 10 }}>
        {ablation.summary}
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {ablation.scenarios.map(row => (
          <article key={row.scenarioId} style={cardStyle({ background: row.adjustedTopRoute === workbench.complementarity.topRoute?.routeId ? palette.surface : palette.riskSoft })}>
            <strong style={{ color: palette.text, fontSize: 12.5 }}>{row.label}</strong>
            <NumericText style={{ color: palette.accent, fontSize: 18, fontWeight: 950 }}>HGCPS {fmt(row.scoreAfterAblation, 3)}</NumericText>
            <span style={{ color: palette.muted, fontSize: 11.7, lineHeight: 1.45 }}>Adjusted top route: {row.adjustedTopRoute}; route rank after ablation #{row.rankingAfterAblation}</span>
            <span style={{ color: palette.faint, fontSize: 11.5, lineHeight: 1.45 }}>{row.contributionInterpretation}</span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{topRoute?.guestMetal || "Guest"} compensation contribution</strong>
          <span style={{ color: palette.muted, fontSize: 11.7, lineHeight: 1.45 }}>{ablation.moContribution.interpretation}</span>
          <NumericText style={{ color: palette.accent, fontSize: 14, fontWeight: 950 }}>contribution {fmt(ablation.moContribution.contribution, 3)}</NumericText>
        </div>
        <div style={cardStyle({ background: palette.surfaceStrong })}>
          <strong style={{ color: palette.text, fontSize: 12.5 }}>{topRoute?.hostMof || "Host"} stability contribution</strong>
          <span style={{ color: palette.muted, fontSize: 11.7, lineHeight: 1.45 }}>{ablation.hostStabilityContribution.interpretation}</span>
          <NumericText style={{ color: palette.accent, fontSize: 14, fontWeight: 950 }}>contribution {fmt(ablation.hostStabilityContribution.contribution, 3)}</NumericText>
        </div>
      </div>
    </section>
  )
}

function BoundaryPanel({ workbench, lang, onOpenActivationCenter }) {
  const topRoute = workbench?.complementarity?.topRoute || {}
  const host = topRoute.hostMof || workbench?.hostSelection?.selectedHost?.displayName || "current host"
  const guest = topRoute.guestMetal || workbench?.guestSelection?.selectedGuestMetal?.guestMetal || "current guest"
  const boundaries = [
    ["Recommendation status", `${host} + ${guest} is the current high-priority experimental route, not final catalytic proof.`],
    ["Data status", "Evidence remains seed / curated / proxy / inferred / mixed until direct same-condition validation is added."],
    ["Comparability", "Cross-literature reaction conditions are not directly comparable."],
    ["Experimental gap", "Same-condition experiments are still insufficient."],
    ["Guest feasibility", `${guest} doping or post-modification feasibility needs validation.`],
    ["Host stability", `${host} 170C aqueous stability must be validated under the reaction protocol.`],
    ["Model boundary", "Random Forest is a baseline / risk reference only and is not the final recommendation basis."],
    ["Validation roadmap", `Validate yield, selectivity, structure retention, ${guest} loading, ${guest} coordination, and carbon balance.`],
  ]
  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Organic Acid Algorithm Boundary Panel"
        title={text(lang, "算法边界", "Algorithm Boundary")}
        note={text(lang, "该面板固定列出 V3.9.10 不允许越界表达的结论边界。", "This panel fixes the conclusion boundaries that V3.9.10 must not overstate.")}
      />
      <div style={{ display: "grid", gap: 8 }}>
        {boundaries.map(([label, value]) => (
          <div key={label} style={{ ...cardStyle({ background: palette.surfaceStrong, gridTemplateColumns: "180px minmax(0, 1fr)" }) }}>
            <strong style={{ color: palette.text, fontSize: 12.3 }}>{label}</strong>
            <span style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5 }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          See activation readiness
        </button>
        <button type="button" onClick={openAlgorithmMethodology} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          View Project Evolution methodology
        </button>
      </div>
    </section>
  )
}

function ReportExportSection({ workbench, selectedExplanation, lang, onOpenActivationCenter }) {
  const topRouteSlug = (workbench.complementarity.topRoute?.routeId || "organic-acid-top-route").replace(/^route-/, "")
  const exportRows = [
    {
      label: "Top Route Report JSON",
      action: () => downloadText(`${topRouteSlug}-route-report.json`, JSON.stringify(buildOrganicAcidRouteReportJson(workbench, selectedExplanation), null, 2)),
    },
    {
      label: "Host-Guest Route Priority Queue CSV",
      action: () => downloadText("host-guest-route-priority-queue.csv", buildHostGuestRoutePriorityQueueCsv(workbench.priorityQueue), "text/csv"),
    },
    {
      label: "Evidence Matrix CSV",
      action: () => downloadText("organic-acid-evidence-matrix.csv", buildEvidenceMatrixCsv(workbench.evidenceMatrix), "text/csv"),
    },
    {
      label: "Missing Evidence & Risk Matrix CSV",
      action: () => downloadText("organic-acid-missing-evidence-risk-matrix.csv", buildMissingEvidenceRiskMatrixCsv(workbench.missingEvidenceRiskMatrix), "text/csv"),
    },
    {
      label: "Sensitivity Analysis JSON",
      action: () => downloadText("organic-acid-sensitivity-analysis.json", JSON.stringify(buildSensitivityAnalysisJson(workbench.sensitivityAnalysis), null, 2)),
    },
    {
      label: "Scoring Audit JSON",
      action: () => downloadText("organic-acid-scoring-audit.json", JSON.stringify(workbench.audit, null, 2)),
    },
    {
      label: "Ablation Analysis JSON",
      action: () => downloadText("organic-acid-ablation-analysis.json", JSON.stringify(buildAblationAnalysisJson(workbench.ablationAnalysis), null, 2)),
    },
    {
      label: "Validation Roadmap JSON",
      action: () => downloadText("organic-acid-experimental-route.json", JSON.stringify(buildOrganicAcidExperimentalRouteJson(workbench.experimentalRoute), null, 2)),
    },
    {
      label: "Markdown Research Summary",
      action: () => downloadText("organic-acid-host-guest-summary.md", buildMarkdownResearchSummary(workbench, selectedExplanation), "text/markdown"),
    },
  ]

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <SectionTitle
        kicker="Route Report Export"
        title={text(lang, "路线报告与验证路线导出", "Route Report and Validation Exports")}
        note={text(lang, "导出包含当前 top route 报告、队列、证据矩阵、风险矩阵、敏感性、消融、验证路线与 Markdown 摘要。", "Exports include the current top-route report, route queue, evidence matrix, risk matrix, sensitivity, ablation, validation roadmap, and Markdown summary.")}
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
        <button type="button" onClick={onOpenActivationCenter} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          Create minimum experiment matrix
        </button>
        <button type="button" onClick={openAlgorithmMethodology} style={{ ...buttonStyle(false), color: palette.accent, textAlign: "center" }}>
          View algorithm methodology
        </button>
        {exportRows.map(row => (
          <button key={row.label} type="button" onClick={row.action} style={{ ...buttonStyle(false), textAlign: "center" }}>
            {row.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function AdvancedAnalysisTabs({ workbench, selectedExplanation, lang, onOpenActivationCenter, activeTab: controlledActiveTab = null, onTabChange = null }) {
  const [internalActiveTab, setInternalActiveTab] = useState("risk")
  const activeTab = controlledActiveTab || internalActiveTab
  const setActiveTab = tabId => {
    setInternalActiveTab(tabId)
    onTabChange?.(tabId)
  }
  const tabs = [
    ["risk", text(lang, "缺失证据与风险矩阵", "Missing Evidence & Risk Matrix")],
    ["evidence", text(lang, "证据矩阵", "Evidence Matrix")],
    ["audit", text(lang, "评分审计", "Scoring Audit")],
    ["sensitivity", text(lang, "敏感性分析", "Sensitivity Analysis")],
    ["ablation", text(lang, "消融分析", "Ablation Analysis")],
    ["boundary", text(lang, "算法边界", "Algorithm Boundary")],
    ["report", text(lang, "路线报告导出", "Route Report Export")],
  ]
  return (
    <section style={{ ...cardStyle({ background: palette.bg, padding: 14 }) }}>
      <SectionTitle
        kicker="Advanced route analysis"
        title={text(lang, "高级证据、风险与稳健性分析", "Advanced Evidence, Risk, and Robustness Analysis")}
        note={text(lang, "默认显示缺失证据与风险矩阵；其余分析通过 tabs 展开，避免压缩主流程。", "The default tab shows missing evidence and risk; other analyses open through tabs so the main workflow remains clear.")}
      />
      <div role="tablist" aria-label="Organic Acid advanced analysis" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} style={{ ...buttonStyle(activeTab === id), textAlign: "center" }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab === "risk" ? <RiskMatrixSection workbench={workbench} lang={lang} onOpenActivationCenter={onOpenActivationCenter} /> : null}
      {activeTab === "evidence" ? <EvidenceMatrixSection workbench={workbench} lang={lang} /> : null}
      {activeTab === "audit" ? <ScoringAuditSection workbench={workbench} lang={lang} /> : null}
      {activeTab === "sensitivity" ? <SensitivityAnalysisSection workbench={workbench} lang={lang} /> : null}
      {activeTab === "ablation" ? <AblationAnalysisSection workbench={workbench} lang={lang} /> : null}
      {activeTab === "boundary" ? <BoundaryPanel workbench={workbench} lang={lang} onOpenActivationCenter={onOpenActivationCenter} /> : null}
      {activeTab === "report" ? <ReportExportSection workbench={workbench} selectedExplanation={selectedExplanation} lang={lang} onOpenActivationCenter={onOpenActivationCenter} /> : null}
    </section>
  )
}

export function OrganicAcidHostGuestWorkbench({ lang = "zh", isNarrow = false, initialData = null, workbench: suppliedWorkbench = null, activationWorkbench: suppliedActivationWorkbench = null }) {
  const [sourceData, setSourceData] = useState(initialData)
  const [status, setStatus] = useState(initialData || suppliedWorkbench ? "loaded" : "idle")
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [selectedStepId, setSelectedStepId] = useState("step-0")
  const [activationOpen, setActivationOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedTab, setAdvancedTab] = useState("risk")
  const [structureSelection, setStructureSelection] = useState(null)
  const traceTimersRef = useRef([])

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
      fetchDataJson(DATA_FILES.coreMofImport, {}),
      fetchDataJson(DATA_FILES.qmofImport, {}),
      fetchDataJson(DATA_FILES.reactionDataset, {}),
      fetchDataJson(DATA_FILES.gasAdsorptionRecords, []),
      fetchDataJson(DATA_FILES.literatureDataset, {}),
      fetchDataJson(DATA_FILES.goldDataset, {}),
      fetchDataJson(DATA_FILES.fairMofsFamilyEvidence, {}),
      fetchDataJson(DATA_FILES.specificAlMofHosts, {}),
      fetchDataJson(DATA_FILES.moIntroductionStrategies, {}),
      fetchDataJson(DATA_FILES.minimumExperimentalMatrix, {}),
      fetchDataJson(DATA_FILES.sameConditionDataTemplate, {}),
      fetchDataJson(DATA_FILES.experimentalValidationResultsTemplate, {}),
      fetchDataJson(DATA_FILES.experimentalFeedbackRules, {}),
      fetchDataJson(DATA_FILES.activationReadinessSummary, {}),
    ]).then(([
      pathwaySteps,
      pathwayDescriptorMap,
      hostMofCandidates,
      guestMetalCandidates,
      hostGuestRoutes,
      evidenceRiskRecords,
      validationExperiments,
      coreMofImport,
      qmofImport,
      reactionDataset,
      gasAdsorptionRecords,
      literatureDataset,
      goldDataset,
      fairMofsFamilyEvidence,
      specificAlMofHosts,
      moIntroductionStrategies,
      minimumExperimentalMatrix,
      sameConditionDataTemplate,
      experimentalValidationResultsTemplate,
      experimentalFeedbackRules,
      activationReadinessSummary,
    ]) => {
      if (!live) return
      setSourceData({
        pathwaySteps,
        pathwayDescriptorMap,
        hostMofCandidates,
        guestMetalCandidates,
        hostGuestRoutes,
        evidenceRiskRecords,
        validationExperiments,
        coreMofImport,
        qmofImport,
        reactionDataset,
        gasAdsorptionRecords,
        literatureDataset,
        goldDataset,
        fairMofsFamilyEvidence,
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
      setSourceData(null)
      setStatus("error")
    })
    return () => {
      live = false
    }
  }, [initialData, suppliedWorkbench])

  useEffect(() => () => {
    traceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    traceTimersRef.current = []
  }, [])

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
  const activationWorkbench = useMemo(() => {
    if (suppliedActivationWorkbench) return suppliedActivationWorkbench
    if (!workbench || !sourceData?.minimumExperimentalMatrix) return null
    return buildExperimentalActivationWorkbench({
      specificAlMofHosts: sourceData.specificAlMofHosts,
      moIntroductionStrategies: sourceData.moIntroductionStrategies,
      minimumExperimentalMatrix: sourceData.minimumExperimentalMatrix,
      sameConditionDataTemplate: sourceData.sameConditionDataTemplate,
      experimentalValidationResultsTemplate: sourceData.experimentalValidationResultsTemplate,
      experimentalFeedbackRules: sourceData.experimentalFeedbackRules,
      activationReadinessSummary: sourceData.activationReadinessSummary,
    }, {
      topRoute: workbench.complementarity.topRoute,
      selectedHost: workbench.hostSelection.selectedHost,
      selectedGuestMetal: workbench.guestSelection.selectedGuestMetal,
      selectedRouteExplanation: selectedExplanation,
    })
  }, [workbench, sourceData, suppliedActivationWorkbench, selectedExplanation])
  const flowNetwork = useMemo(() => {
    if (!workbench) return null
    return buildOrganicAcidAlgorithmFlowNetwork(workbench, sourceData || {}, {
      lang,
      activationWorkbench,
    })
  }, [workbench, sourceData, lang, activationWorkbench])
  const stepwiseChain = useMemo(() => {
    if (!workbench || !flowNetwork) return null
    return buildStepwiseExecutionChain(workbench, sourceData || {}, {
      lang,
      selectedStepId,
      flowNetwork,
      activationWorkbench,
    })
  }, [workbench, sourceData, lang, selectedStepId, flowNetwork, activationWorkbench])

  const openActivationEntry = () => {
    setActivationOpen(true)
    if (typeof window === "undefined") return
    window.setTimeout(() => {
      document.getElementById("organic-acid-experimental-activation-entry")?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    }, 0)
  }

  const openAdvancedTab = (tabId = "risk") => {
    setAdvancedTab(tabId)
    setAdvancedOpen(true)
    if (typeof window === "undefined") return
    window.setTimeout(() => {
      document.getElementById("organic-acid-advanced-robustness-evidence")?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    }, 0)
  }

  const selectExecutionStep = (stepId, anchorId = "") => {
    setSelectedStepId(stepId)
    if (typeof window === "undefined") return
    window.setTimeout(() => {
      document.getElementById(anchorId || `organic-acid-execution-${stepId}`)?.scrollIntoView?.({ behavior: "smooth", block: "center" })
    }, 0)
  }

  const traceStepwiseChain = () => {
    if (typeof window === "undefined") {
      setSelectedStepId("step-6")
      return
    }
    traceTimersRef.current.forEach(timer => window.clearTimeout(timer))
    const ids = ["step-0", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6", "final-result"]
    traceTimersRef.current = ids.map((stepId, index) => window.setTimeout(() => {
      setSelectedStepId(stepId)
      document.getElementById(stepId === "final-result" ? "organic-acid-final-result-summary" : `organic-acid-execution-${stepId}`)?.scrollIntoView?.({ behavior: "smooth", block: "center" })
    }, index * 900))
  }

  if (status === "loading" || !workbench || !selectedExplanation || !stepwiseChain) {
    return (
      <section id="organic-acid-host-guest-workbench" style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}>
        <SectionTitle
          kicker={ORGANIC_ACID_HOST_GUEST_VERSION}
          title={text(lang, "有机酸主客体路径筛选工作台", "Organic Acid Host-Guest Pathway Screening Workbench")}
          note={text(lang, "正在载入主客体算法数据。", "Loading host-guest algorithm data.")}
        />
      </section>
    )
  }

  if (status === "error") {
    return (
      <section id="organic-acid-host-guest-workbench" style={{ ...cardStyle({ background: palette.riskSoft, padding: 14, scrollMarginTop: 118 }) }}>
        <SectionTitle
          kicker={ORGANIC_ACID_HOST_GUEST_VERSION}
          title={text(lang, "有机酸主客体路径筛选工作台", "Organic Acid Host-Guest Pathway Screening Workbench")}
          note={text(lang, "主客体算法数据载入失败。", "Host-guest data could not be loaded.")}
        />
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
      <aside
        data-testid="fair-mofs-synthesis-boundary"
        style={{
          background: palette.accentSoft,
          border: `1px solid ${palette.accent}`,
          borderRadius: 9,
          color: palette.muted,
          display: "grid",
          fontSize: 12.2,
          gap: 5,
          lineHeight: 1.55,
          padding: "11px 13px",
        }}
      >
        <strong style={{ color: palette.text }}>
          {text(lang, "FAIR-MOFs 接入边界：合成条件可及性，不是合成成功率", "FAIR-MOFs boundary: synthesis-condition accessibility, not synthesis success probability")}
        </strong>
        <span>
          {text(
            lang,
            "温度与反应时间经固定边界归一化，并按“DOI + 条件指纹”去重；样本量只控制经验贝叶斯收缩、置信度与不确定性。FAIR-MOFs 不含统一失败集或收率，因此本因子不能被解释为成功概率。",
            "Temperature and reaction time use fixed bounds and are deduplicated by DOI plus condition fingerprint. Sample size controls empirical-Bayes shrinkage, confidence, and uncertainty only. FAIR-MOFs has no harmonized failure set or yield, so this factor must not be interpreted as success probability."
          )}
        </span>
      </aside>
      <OrganicAcidStepwiseExecutionChain
        chain={stepwiseChain}
        lang={lang}
        isNarrow={isNarrow}
        selectedStepId={selectedStepId}
        onSelectStep={selectExecutionStep}
        onTrace={traceStepwiseChain}
        onOpenActivationCenter={openActivationEntry}
        onOpenMethodology={openAlgorithmMethodology}
        onOpenAdvancedTab={openAdvancedTab}
        onViewHostStructure={(structure, route) => setStructureSelection({ structure, route })}
      />
      {structureSelection ? (
        <RouteHostStructureModal
          selection={structureSelection}
          lang={lang}
          onClose={() => setStructureSelection(null)}
        />
      ) : null}
      <details
        id="organic-acid-experimental-activation-entry"
        open={activationOpen}
        onToggle={event => setActivationOpen(event.currentTarget.open)}
        style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}
      >
        <summary style={{ color: palette.text, cursor: "pointer", fontSize: 14, fontWeight: 950 }}>
          {text(lang, "实验启用 / Experimental Activation Entry", "Experimental Activation Entry / 实验启用")}
        </summary>
        <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, marginTop: 10 }}>
          {text(lang, "现在可以用于实验规划，但还不能用于性能证明。", "Ready for experiment planning, but not performance proof.")}
        </div>
        <div style={{ marginTop: 12 }}>
          <OrganicAcidExperimentalActivationCenter
            lang={lang}
            isNarrow={isNarrow}
            routeContext={{
              topRoute: workbench.complementarity.topRoute,
              selectedHost: workbench.hostSelection.selectedHost,
              selectedGuestMetal: workbench.guestSelection.selectedGuestMetal,
              selectedRouteExplanation: selectedExplanation,
            }}
            activationWorkbench={activationWorkbench || suppliedActivationWorkbench}
          />
        </div>
      </details>
      <details
        id="organic-acid-advanced-robustness-evidence"
        open={advancedOpen}
        onToggle={event => setAdvancedOpen(event.currentTarget.open)}
        style={{ ...cardStyle({ background: palette.bg, padding: 14, scrollMarginTop: 118 }) }}
      >
        <summary style={{ color: palette.text, cursor: "pointer", fontSize: 14, fontWeight: 950 }}>
          {text(lang, "高级稳健性与证据 / Advanced Robustness and Evidence", "Advanced Robustness and Evidence / 高级稳健性与证据")}
        </summary>
        <div style={{ marginTop: 12 }}>
          <AdvancedAnalysisTabs
            workbench={workbench}
            selectedExplanation={selectedExplanation}
            lang={lang}
            onOpenActivationCenter={openActivationEntry}
            activeTab={advancedTab}
            onTabChange={setAdvancedTab}
          />
        </div>
      </details>
      <OrganicAcidAlgorithmFlowExportLinks network={flowNetwork} lang={lang} onOpenMethodology={openAlgorithmMethodology} />
    </section>
  )
}
