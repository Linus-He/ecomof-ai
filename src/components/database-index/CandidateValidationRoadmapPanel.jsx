// @ts-nocheck
import { useMemo } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { StatusPill, text } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { buildCandidateValidationRoadmap } from "../../utils/databaseIndex/candidateValidationRoadmap"

function priorityTone(priority) {
  if (priority === "high") return "warn"
  if (priority === "medium") return "proxy"
  return "info"
}

function priorityLabel(priority, lang) {
  if (priority === "high") return text(lang, "高优先", "high priority")
  if (priority === "medium") return text(lang, "中优先", "medium priority")
  return text(lang, "低优先", "low priority")
}

function ActionList({ title, actions, lang, t }) {
  if (!actions || !actions.length) return null
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{title}</span>
      <ul style={{ color: t.muted, display: "grid", fontSize: 11.4, gap: 3, lineHeight: 1.4, margin: 0, paddingLeft: 16 }}>
        {actions.map((action, index) => (
          <li key={index}><ChemicalText value={text(lang, action.zh, action.en)} /></li>
        ))}
      </ul>
    </div>
  )
}

export function CandidateValidationRoadmapPanel({ record = {}, lang, t }) {
  const roadmap = useMemo(() => buildCandidateValidationRoadmap(record), [record])

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.4 }}>{text(lang, "候选验证路线", "Candidate Validation Roadmap")}</strong>
        <StatusPill tone={priorityTone(roadmap.validationPriority)} t={t}>{priorityLabel(roadmap.validationPriority, lang)}</StatusPill>
      </header>

      <div style={{ display: "grid", gap: 8 }}>
        <ActionList title={text(lang, "metadata 待补", "Metadata to confirm")} actions={roadmap.metadataActions} lang={lang} t={t} />
        <ActionList title={text(lang, "描述符待核", "Descriptors to verify")} actions={roadmap.descriptorActions} lang={lang} t={t} />
        <ActionList title={text(lang, "机制待证", "Mechanism to substantiate")} actions={roadmap.mechanismActions} lang={lang} t={t} />
        <ActionList title={text(lang, "建议验证方向", "Suggested validation directions")} actions={roadmap.suggestedValidation} lang={lang} t={t} />
      </div>

      <p style={{ color: t.muted, fontSize: 11.4, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
        <ChemicalText value={text(lang, roadmap.boundaryZh, roadmap.boundary)} />
      </p>
    </section>
  )
}

export default CandidateValidationRoadmapPanel
