// @ts-nocheck
import { ChemicalText } from "../common/ChemicalFormula"
import { BasisBadge } from "../ui"
import { SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"
import { MethodAlgorithmStepper } from "./MethodAlgorithmStepper"
import { MethodEvidenceBoundary } from "./MethodEvidenceBoundary"
import { MethodFormulaCard } from "./MethodFormulaCard"
import { MethodIOPanel } from "./MethodIOPanel"
import { MethodVisualizationCard } from "./MethodVisualizationCard"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function BadgeList({ rows = [], t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {rows.map(row => (
        <span key={row} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 760, lineHeight: 1.2, padding: "5px 8px" }}>
          <ChemicalText value={row} />
        </span>
      ))}
    </div>
  )
}

function MethodSummaryCard({ item, lang, t }) {
  const example = item.example
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 11, padding: 13 }}>
      <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {text(lang, item.parentModuleZh, item.parentModule) || text(lang, "方法区", "Method section")}
          </div>
          <h2 style={{ color: t.textStrong, fontSize: 22, fontWeight: 940, lineHeight: 1.13, margin: 0 }}>
            {text(lang, item.moduleZh, item.module)}
          </h2>
        </div>
        <BasisBadge tone={item.id === "limitations-validation" ? "warn" : "info"}>{item.module}</BasisBadge>
      </div>
      <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.62, margin: 0 }}><ChemicalText value={text(lang, item.summaryZh, item.summary)} /></p>
      {item.specialNote ? (
        <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12.2, lineHeight: 1.55, padding: 10 }}>
          <ChemicalText value={text(lang, item.specialNoteZh, item.specialNote)} />
        </div>
      ) : null}
      {example ? (
        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, example.titleZh, example.title)}</strong>
          <span style={{ color: t.muted, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 12.5, lineHeight: 1.45 }}><ChemicalText value={text(lang, example.bodyZh, example.body)} /></span>
        </div>
      ) : null}
    </article>
  )
}

function MethodGroup({ group, lang, t }) {
  const formulas = group.formulas || []
  const visualizations = group.visualizations || []
  const limits = lang === "zh" ? group.limitationsZh : group.limitations
  return (
    <article id={`methodology-${group.id}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 12, padding: 13, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 5 }}>
        <h3 style={{ color: t.textStrong, fontSize: 17, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>
          {text(lang, group.titleZh, group.title)}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}><ChemicalText value={text(lang, group.purposeZh, group.purpose)} /></p>
      </header>
      <MethodAlgorithmStepper steps={group.algorithmSteps} lang={lang} t={t} />
      {formulas.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {formulas.map(formula => <MethodFormulaCard key={formula.id} formula={formula} lang={lang} t={t} />)}
        </div>
      ) : null}
      <MethodIOPanel inputs={group.inputs} inputsZh={group.inputsZh} outputs={group.outputs} outputsZh={group.outputsZh} lang={lang} t={t} />
      {visualizations.length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {visualizations.map(visualization => <MethodVisualizationCard key={visualization.title} visualization={visualization} lang={lang} t={t} />)}
        </div>
      ) : null}
      {limits?.length ? (
        <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 9, display: "grid", gap: 5, padding: 10 }}>
          {limits.map(limit => <div key={limit} style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}><ChemicalText value={limit} /></div>)}
        </div>
      ) : null}
    </article>
  )
}

export function MethodModuleSection({ item, lang, t }) {
  const inputs = lang === "zh" ? item.inputsZh : item.inputs
  const outputs = lang === "zh" ? item.outputsZh : item.outputs
  return (
    <section id={`methodology-${item.id}`} style={{ display: "grid", gap: 13, scrollMarginTop: 118 }}>
      <MethodSummaryCard item={item} lang={lang} t={t} />
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "核心输入", "Core inputs")}</strong>
          <BadgeList rows={inputs} t={t} />
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "核心输出", "Core outputs")}</strong>
          <BadgeList rows={outputs} t={t} />
        </article>
      </div>
      <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, padding: 13 }}>
        <h3 style={{ color: t.textStrong, fontSize: 16, fontWeight: 930, margin: 0 }}>{text(lang, "Method workflow", "Method workflow")}</h3>
        <MethodAlgorithmStepper steps={item.methodWorkflow} lang={lang} t={t} />
      </article>
      {(item.visualizations || []).length ? (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {item.visualizations.map(visualization => <MethodVisualizationCard key={visualization.title} visualization={visualization} lang={lang} t={t} />)}
        </div>
      ) : null}
      {(item.methodGroups || []).map(group => <MethodGroup key={group.id} group={group} lang={lang} t={t} />)}
      <MethodEvidenceBoundary item={item} lang={lang} t={t} />
    </section>
  )
}
