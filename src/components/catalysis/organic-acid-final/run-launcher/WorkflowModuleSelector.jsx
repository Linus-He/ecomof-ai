// @ts-nocheck
import { ChemicalText } from "../../../../shared"
import { text } from "../FinalScreeningShared"

export const RUN_MODULES = [
  ["hydrothermal", "Hydrothermal Hard Gate", "水热硬阈值"],
  ["oacs", "OACS Framework Ranking", "OACS 骨架排序"],
  ["dmrs", "DMRS Dopant Recommendation", "DMRS 第二金属推荐"],
  ["sensitivity", "Sensitivity Audit", "稳健性审计"],
  ["hotspot", "Hot Spot Map Projection", "热区图投影"],
  ["exafs", "EXAFS Hypothesis", "EXAFS 假设"],
  ["trace", "Candidate Report Trace", "候选报告追踪"],
]

export function WorkflowModuleSelector({ selectedModules, setSelectedModules, lang, t }) {
  const toggle = id => {
    setSelectedModules(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 8, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Workflow modules</span>
      <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {RUN_MODULES.map(([id, en, zh]) => {
          const checked = selectedModules.includes(id)
          return (
            <label key={id} style={{ alignItems: "center", background: checked ? t.badgeInfoBg : t.panel, border: `1px solid ${checked ? t.accentText : t.border}`, borderRadius: 8, color: t.textStrong, display: "flex", gap: 8, minHeight: 38, padding: "7px 9px" }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
              <span style={{ fontSize: 12, fontWeight: 850, lineHeight: 1.25 }}><ChemicalText value={text(lang, zh, en)} /></span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
