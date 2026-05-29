// @ts-nocheck
import { organicAcidPalette as palette } from "./FormulaInline"
import { evidenceLabel } from "./GraphEvidencePanel"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function CandidateRuleMatchExplorer({ rules, selectedRuleId, onSelectRule, lang }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 3 }}>
        <strong style={{ color: palette.text, fontSize: 14 }}>{text(lang, "规则匹配浏览器", "Rule Match Explorer")}</strong>
        <span style={{ color: palette.muted, fontSize: 12 }}>{text(lang, "点击规则会高亮相关反应边，并显示命中候选物。", "Click a rule to highlight related reaction edges and matched candidates.")}</span>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rules.map(rule => {
          const active = selectedRuleId === rule.id
          return (
            <button key={rule.id} type="button" onClick={() => onSelectRule(rule)} style={{ background: active ? palette.accentSoft : palette.surface, border: `1px solid ${active ? palette.accent : palette.border}`, borderRadius: 10, cursor: "pointer", display: "grid", gap: 7, padding: 10, textAlign: "left" }}>
              <strong style={{ color: active ? palette.accent : palette.text, fontSize: 12.5 }}>{text(lang, rule.nameZh, rule.name)}</strong>
              <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, rule.descriptionZh, rule.description)}</span>
              <span style={{ color: palette.faint, fontSize: 11 }}>
                {evidenceLabel(rule.evidenceLevel, lang)} · {text(lang, "矩阵权重", "Matrix weight")} {Math.round((rule.weightInPriority || 0) * 100)}%
              </span>
              <span style={{ color: palette.accent, fontSize: 11.5, fontWeight: 850 }}>
                {text(lang, "命中候选物", "Matched candidates")}: {rule.matchedCandidates?.length || 0}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
