// @ts-nocheck
import { useMemo } from "react"
import frameworks from "../../../public/data/organic_acid_final_screening/al_mof_framework_candidates.json"
import metals from "../../../public/data/organic_acid_final_screening/dopant_metal_property_matrix.json"
import evidenceRecords from "../../../public/data/organic_acid_final_screening/organic_acid_evidence_records.json"
import rules from "../../../public/data/organic_acid_final_screening/organic_acid_screening_rules.json"
import { ChemicalText } from "../../shared"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { DescriptorEvidenceMatrix } from "./organic-acid-final/DescriptorEvidenceMatrix"
import { FormulaExplainerCard } from "./organic-acid-final/FormulaExplainerCard"
import { MechanismPathMethodCard } from "./organic-acid-final/MechanismPathMethodCard"
import { MethodologyCitationPanel } from "./organic-acid-final/MethodologyCitationPanel"
import { MethodologyFlowDiagram } from "./organic-acid-final/MethodologyFlowDiagram"
import { MethodologyLimitationsCard } from "./organic-acid-final/MethodologyLimitationsCard"
import { OrganicAcidMethodologyOverview } from "./organic-acid-final/OrganicAcidMethodologyOverview"
import { ExafsFalsificationDiagram, ValidationLoopDiagram } from "./organic-acid-final/ValidationLoopDiagram"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const ORGANIC_ACID_FINAL_DIRECTORY = {
  id: "methodology-organic-acid-final-screening",
  label: "Organic Acid Final Screening Methodology",
  labelZh: "有机酸最终筛选方法论",
  level: 1,
  display: "有机酸最终筛选方法论",
  children: [
    { id: "methodology-oafs-overview", label: "Method Overview", labelZh: "方法总览" },
    { id: "methodology-oafs-flow", label: "Two-Stage Algorithm Flow", labelZh: "两阶段算法流程" },
    { id: "methodology-oafs-oacs", label: "Stage 1: OACS Framework Mining", labelZh: "Stage 1：OACS 骨架筛选" },
    { id: "methodology-oafs-dmrs", label: "Stage 2: DMRS Dopant Recommendation", labelZh: "Stage 2：DMRS 第二金属推荐" },
    { id: "methodology-oafs-robustness", label: "Robustness Audit", labelZh: "稳健性审计" },
    { id: "methodology-oafs-evidence-matrix", label: "Evidence Strength Matrix", labelZh: "证据强度矩阵" },
    { id: "methodology-oafs-exafs", label: "EXAFS-Guided Falsification", labelZh: "EXAFS 引导证伪" },
    { id: "methodology-oafs-validation-loop", label: "Experimental Control Loop", labelZh: "实验控制闭环" },
    { id: "methodology-oafs-limitations", label: "Limitations & Reproducibility", labelZh: "限制与复现" },
  ],
}

function MetricCard({ label, value, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}><ChemicalText value={value} /></strong>
    </article>
  )
}

function RobustnessAuditMethod({ result, lang, t }) {
  const target = result?.sensitivity?.targetMetal || {}
  const rows = [
    {
      title: text(lang, "Weight perturbation", "Weight perturbation"),
      value: `${result?.sensitivity?.perturbationRange || "+/-20%"} · ${result?.sensitivity?.iterations || 1000} iterations`,
      detail: text(lang, "每轮扰动后重新归一化并重排全金属池。", "Every perturbation is normalized and reranks the full metal pool."),
    },
    {
      title: text(lang, "Full-metal distribution", "Full-metal distribution"),
      value: "Mo / W / V / Fe / Ti / Zr",
      detail: text(lang, "竞品金属保持可见，避免把审计收缩成 Mo-only 结论。", "Competitors remain visible so the audit does not collapse into a Mo-only claim."),
    },
    {
      title: text(lang, "Interpretation rule", "Interpretation rule"),
      value: text(lang, "Mo Top 3 >=85% -> robust high-priority", "Mo Top 3 >=85% -> robust high-priority"),
      detail: text(lang, "Mo Top1 100% -> robust but audit-required。", "Mo Top1 100% -> robust but audit-required."),
    },
  ]

  return (
    <section id="methodology-oafs-robustness" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Robustness Audit</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "稳健性审计：从推荐结果到可审计假设", "Robustness Audit: From Recommendation to Auditable Hypothesis")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minWidth: 0, padding: 11 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{row.title}</span>
            <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.25 }}><ChemicalText value={row.value} /></strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.42 }}><ChemicalText value={row.detail} /></span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label="Mo Top1" value={`${Math.round((target.top1Probability || 0) * 100)}%`} t={t} tone="warn" />
        <MetricCard label="Mo Top3" value={`${Math.round((target.top3Probability || 0) * 100)}%`} t={t} />
        <MetricCard label="Audit status" value={result?.moRobustnessAudit?.label || "audit required"} t={t} tone="warn" />
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "Mo Top1 100% 不被解释为最终证明，而是标记为“稳健但需审计”。",
          "Mo Top1 100% is not treated as final proof. It is flagged as robust but audit-required."
        )} />
      </p>
    </section>
  )
}

export function OrganicAcidFinalMethodology({ lang, t }) {
  const result = useMemo(() => runOrganicAcidFinalScreening(frameworks, metals, rules, evidenceRecords), [])
  const oacsCard = result.formulaCards.find(card => card.id === "oacs")
  const dmrsCard = result.formulaCards.find(card => card.id === "dmrs")

  return (
    <details id="methodology-organic-acid-final-screening" open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 14, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 22, fontWeight: 940, lineHeight: 1.15 }}>
        {text(lang, "有机酸最终筛选方法论", "Organic Acid Final Screening Methodology")}
      </summary>
      <div style={{ display: "grid", gap: 14, marginTop: 13 }}>
        <OrganicAcidMethodologyOverview lang={lang} t={t} coverage={result.evidenceCoverage} />
        <MethodologyFlowDiagram flow={result.methodologyFlowData} lang={lang} t={t} />
        <FormulaExplainerCard card={oacsCard} lang={lang} t={t} />
        <FormulaExplainerCard card={dmrsCard} lang={lang} t={t} />
        <MechanismPathMethodCard lang={lang} t={t} />
        <RobustnessAuditMethod result={result} lang={lang} t={t} />
        <DescriptorEvidenceMatrix rows={result.evidenceStrengthMatrix} coverage={result.evidenceCoverage} lang={lang} t={t} />
        <ExafsFalsificationDiagram signature={result.exafsSignature} lang={lang} t={t} />
        <ValidationLoopDiagram validation={result.validationLoopData} lang={lang} t={t} />
        <MethodologyLimitationsCard lang={lang} t={t} />
        <MethodologyCitationPanel coverage={result.evidenceCoverage} lang={lang} t={t} />
      </div>
    </details>
  )
}
