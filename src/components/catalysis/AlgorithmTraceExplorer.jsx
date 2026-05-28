import { useMemo, useState } from "react"
import { useLang, useViewport } from "../../shared"
import { safeNumber } from "../../utils/rgfaScore"
import {
  NumericText,
  ORGANIC_ACID_FONT,
  SCIENTIFIC_TOKEN_FONT,
  organicAcidPalette as palette,
  VariableLabel,
} from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const TRACE_STEPS = [
  {
    id: "descriptor",
    zh: "Step 1: 描述符可用性",
    en: "Step 1: Descriptor availability",
    detailZh: "检查候选物是否具备水相稳定性、孔道可及性、位点、官能团和反应描述符。",
    detailEn: "Checks whether stability, accessibility, site, functional-group, and reaction descriptors are available.",
  },
  {
    id: "rules",
    zh: "Step 2: 规则匹配",
    en: "Step 2: Rule matching",
    detailZh: "把候选物角色映射到有机酸三路径网络和 reaction rule 节点。",
    detailEn: "Maps candidate roles to the organic-acid three-pathway network and reaction-rule nodes.",
  },
  {
    id: "evidence",
    zh: "Step 3: 证据加权",
    en: "Step 3: Evidence weighting",
    detailZh: "根据 curated / literature / pending 状态调节贡献置信度。",
    detailEn: "Adjusts confidence using curated, literature, and pending evidence states.",
  },
  {
    id: "risk",
    zh: "Step 4: 风险惩罚",
    en: "Step 4: Risk penalty",
    detailZh: "考虑副产物、稳定性、毒性、可持续性和缺失字段带来的折扣。",
    detailEn: "Applies penalties for byproducts, stability, toxicity, sustainability, and missing fields.",
  },
  {
    id: "tier",
    zh: "Step 5: 优先级分层",
    en: "Step 5: Priority tier assignment",
    detailZh: "输出证据加权的决策支持 tier，不作为实验验证排名。",
    detailEn: "Outputs an evidence-weighted decision-support tier, not an experimentally validated ranking.",
  },
]

function fmt(value, digits = 3) {
  return safeNumber(value, 0).toFixed(digits)
}

function candidateName(candidate) {
  return candidate?.displayName || candidate?.commonName || candidate?.name || candidate?.mofName || candidate?.id || candidate?.mof || "selected candidate"
}

function roles(candidate) {
  return Array.isArray(candidate?.organicAcidRelevance?.possibleRoles) ? candidate.organicAcidRelevance.possibleRoles : []
}

function rgfaTier(candidate) {
  const cls = candidate?.computedClass
  if (cls === "A") return "Tier A"
  if (cls === "B") return "Tier B"
  if (cls === "C") return "Tier C"
  return candidate?.organicAcidRelevance?.scoreStatus?.includes?.("pending") ? "Tier D" : "Tier B"
}

function topDrivers(candidate) {
  if (candidate?.trace?.stepScore) {
    return ["A1", "A2", "A3", "A4"]
      .map(key => ({ key, value: safeNumber(candidate.trace.stepScore[key]?.contribution, 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(row => <span key={row.key}><VariableLabel name={row.key} /> <NumericText>{fmt(row.value, 2)}</NumericText></span>)
  }
  const roleRows = roles(candidate).slice(0, 3)
  if (roleRows.length) return roleRows.map((role, index) => <span key={`${role.relatedRuleId || index}`}>{role.relatedRuleId || role.relatedPathwayNode || role.role || "rule match"}</span>)
  return ["descriptor pending", "rule match pending", "validation gap pending"]
}

function summaryText(candidate, selectedPathwayId, lang) {
  const name = candidateName(candidate)
  const tier = rgfaTier(candidate)
  const score = candidate?.rgfaScore !== undefined ? fmt(candidate.rgfaScore, 2) : candidate?.organicAcidRelevance?.pathwayPriorityScore || "pending"
  return text(
    lang,
    `${name}: ${selectedPathwayId || "formaldehyde"} 路径下的 ${tier} / score ${score}。该结论来自规则与证据贡献解释，不证明真实机理因果关系。`,
    `${name}: ${tier} / score ${score} under ${selectedPathwayId || "formaldehyde"} pathway. This explains rule and evidence contributions; it does not prove mechanistic causality.`
  )
}

function stepStatus(stepId, candidate) {
  const pending = `${candidate?.dataStatus || ""} ${candidate?.organicAcidRelevance?.scoreStatus || ""}`.toLowerCase().includes("pending")
  if (stepId === "descriptor" && pending) return "pending fields"
  if (stepId === "rules" && !roles(candidate).length) return "rule links pending"
  if (stepId === "evidence" && pending) return "source pending"
  if (stepId === "risk") return candidate?.organicAcidRelevance?.stabilityConcern || candidate?.toxicityConcern || "risk reviewed"
  if (stepId === "tier") return rgfaTier(candidate)
  return "available"
}

function StepDetails({ step, candidate, lang }) {
  const detailRows = {
    descriptor: [
      ["matched descriptors", candidate?.trace?.inputCompleteness ? `${candidate.trace.inputCompleteness.availableFields}/${candidate.trace.inputCompleteness.totalFields}` : "descriptor support pending"],
      ["missing fields", candidate?.organicAcidRelevance?.missingFields?.join?.(", ") || "Eads(HCO₃⁻), formate desorption, post-reaction stability where absent"],
    ],
    rules: [
      ["matched rules", roles(candidate).map(role => role.relatedRuleId).filter(Boolean).join(", ") || "pending"],
      ["pathway nodes", roles(candidate).map(role => role.relatedPathwayNode).filter(Boolean).join(", ") || "pending"],
    ],
    evidence: [
      ["evidence sources", candidate?.provenance?.sourceDatabase || candidate?.sourceDatabase || candidate?.dataStatus || "source pending"],
      ["curation status", candidate?.organicAcidRelevance?.scoreStatus || candidate?.graphMetadata?.graphConfidence || "pending"],
    ],
    risk: [
      ["penalty reasons", candidate?.organicAcidRelevance?.riskPenalty || candidate?.organicAcidRelevance?.stabilityConcern || "byproduct / stability / toxicity review pending"],
      ["validation gaps", candidate?.organicAcidRelevance?.validationNeeded?.slice?.(0, 3).join("; ") || "validation roadmap pending"],
    ],
    tier: [
      ["final tier / score", `${rgfaTier(candidate)} · ${candidate?.rgfaScore !== undefined ? fmt(candidate.rgfaScore, 3) : candidate?.organicAcidRelevance?.pathwayPriorityScore || "pending"}`],
      ["boundary", text(lang, "决策支持标签，不是实验验证排名。", "Decision-support label, not an experimentally validated ranking.")],
    ],
  }
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
      {(detailRows[step.id] || []).map(([label, value]) => (
        <div key={label} style={{ display: "grid", gap: 3 }}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{label}</span>
          <span style={{ color: palette.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12, lineHeight: 1.45 }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

export function AlgorithmTraceExplorer({
  rankedRows = [],
  selectedMof,
  setSelectedMof = () => {},
  activeStep,
  onActiveStepChange = () => {},
  selectedCandidate,
  selectedPathwayId = "formaldehyde",
}) {
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  const [localStep, setLocalStep] = useState("descriptor")
  const stepId = activeStep && TRACE_STEPS.some(step => step.id === activeStep) ? activeStep : localStep
  const selectedRgfa = useMemo(() => (
    rankedRows.find(row => row.mof === selectedMof) || rankedRows[0] || null
  ), [rankedRows, selectedMof])
  const candidate = selectedCandidate || selectedRgfa
  const activeMeta = TRACE_STEPS.find(step => step.id === stepId) || TRACE_STEPS[0]
  const drivers = topDrivers(candidate || {})
  const traceSummary = candidate ? summaryText(candidate, selectedPathwayId, lang) : text(lang, "暂无可追踪候选。", "No candidate is available for trace explanation.")

  const setStep = (nextStep) => {
    setLocalStep(nextStep)
    onActiveStepChange(nextStep)
  }

  const copySummary = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(traceSummary).catch(() => {})
    }
  }

  if (!candidate) {
    return (
      <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ color: palette.muted, fontSize: 13 }}>{text(lang, "Algorithm Trace Explorer 暂无候选数据。", "Algorithm Trace Explorer has no candidate data yet.")}</div>
      </section>
    )
  }

  return (
    <section id="organic-acid-algorithm-trace" style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 10, display: "grid", fontFamily: ORGANIC_ACID_FONT, gap: 13, padding: 14 }}>
      <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "Trace explanation", "Trace explanation")}</div>
          <h2 style={{ color: palette.text, fontSize: isNarrow ? 20 : 23, lineHeight: 1.15, margin: 0 }}>{text(lang, "Algorithm Trace Explorer", "Algorithm Trace Explorer")}</h2>
          <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 900 }}>
            {text(
              lang,
              "默认显示摘要与五步时间线；展开当前步骤查看规则贡献、证据来源、惩罚原因和验证缺口。它解释规则和证据贡献，不证明真实机理因果关系。",
              "By default this shows a compact summary and five-step timeline. Expand the current step to inspect rule contributions, evidence sources, penalty reasons, and validation gaps. It explains contributions, not mechanistic causality."
            )}
          </p>
        </div>
        <button type="button" onClick={copySummary} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.accent, cursor: "pointer", fontSize: 12, fontWeight: 850, minHeight: 34, padding: "0 11px" }}>
          {text(lang, "复制追踪摘要", "Copy trace summary")}
        </button>
      </div>

      <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 9, display: "grid", gap: 9, padding: 12 }}>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
          <div>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "Selected candidate", "Selected candidate")}</div>
            <div style={{ color: palette.text, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 4 }}>{candidateName(candidate)}</div>
          </div>
          <div>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "Selected pathway", "Selected pathway")}</div>
            <div style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 13, fontWeight: 850, marginTop: 4 }}>{selectedPathwayId}</div>
          </div>
          <div>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "Final tier / score", "Final tier / score")}</div>
            <div style={{ color: palette.accent, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 13, fontWeight: 900, marginTop: 4 }}>{rgfaTier(candidate)} · {candidate?.rgfaScore !== undefined ? fmt(candidate.rgfaScore) : candidate?.organicAcidRelevance?.pathwayPriorityScore || "pending"}</div>
          </div>
          <div>
            <div style={{ color: palette.faint, fontSize: 10.5, fontWeight: 850 }}>{text(lang, "Top 3 drivers", "Top 3 drivers")}</div>
            <div style={{ color: palette.text, display: "flex", flexWrap: "wrap", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12, gap: 6, lineHeight: 1.35, marginTop: 4 }}>
              {drivers.map((driver, index) => <span key={index}>{driver}</span>)}
            </div>
          </div>
        </div>
        <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.55 }}>{traceSummary}</div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {TRACE_STEPS.map((step, index) => {
          const active = step.id === stepId
          return (
            <article key={step.id} style={{ background: active ? palette.accentSoft : palette.surface, border: `1px solid ${active ? palette.accent : palette.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 10 }}>
              <button type="button" onClick={() => setStep(step.id)} style={{ alignItems: "center", background: "transparent", border: "none", color: palette.text, cursor: "pointer", display: "grid", gap: 9, gridTemplateColumns: "30px minmax(0, 1fr) auto", padding: 0, textAlign: "left" }}>
                <span style={{ alignItems: "center", background: active ? palette.accent : palette.bg, border: `1px solid ${active ? palette.accent : palette.borderStrong}`, borderRadius: 999, color: active ? "#fff" : palette.faint, display: "inline-flex", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 900, height: 26, justifyContent: "center", width: 26 }}>{index + 1}</span>
                <span style={{ display: "grid", gap: 2 }}>
                  <strong style={{ color: active ? palette.accent : palette.text, fontSize: 13.2, lineHeight: 1.25 }}>{text(lang, step.zh, step.en)}</strong>
                  <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.35 }}>{text(lang, step.detailZh, step.detailEn)}</span>
                </span>
                <span style={{ color: active ? palette.accent : palette.faint, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5, fontWeight: 850 }}>{stepStatus(step.id, candidate)}</span>
              </button>
              {active ? <StepDetails step={activeMeta} candidate={candidate} lang={lang} /> : null}
            </article>
          )
        })}
      </div>

      {rankedRows.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {rankedRows.slice(0, 4).map(row => (
            <button key={row.mof} type="button" onClick={() => setSelectedMof(row.mof)} style={{ background: row.mof === selectedMof ? palette.accentSoft : palette.surface, border: `1px solid ${row.mof === selectedMof ? palette.accent : palette.border}`, borderRadius: 999, color: palette.text, cursor: "pointer", fontSize: 11.8, fontWeight: 850, minHeight: 30, padding: "0 10px" }}>
              {row.mof} · <NumericText>{fmt(row.rgfaScore, 2)}</NumericText>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
