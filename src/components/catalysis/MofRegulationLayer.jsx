import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MofRegulationLayer({ regulations, activeRegulationId, onSelectRegulation, lang }) {
  return (
    <section style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 10, padding: 14 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "MOF 催化调控层", "MOF regulation layer")}
        </div>
        <p style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
          {text(lang, "点击调控因子会高亮其影响的路径边，并显示促进 / 抑制方向、证据等级和待验证方式。", "Click a regulation factor to highlight affected edges and inspect direction, evidence level, and validation methods.")}
        </p>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        {regulations.map(item => {
          const active = activeRegulationId === item.id
          return (
            <button key={item.id} type="button" onClick={() => onSelectRegulation(item)} style={{ background: active ? palette.accentSoft : palette.surface, border: `1px solid ${active ? palette.accent : palette.border}`, borderRadius: 10, cursor: "pointer", display: "grid", gap: 6, padding: 10, textAlign: "left" }}>
              <strong style={{ color: active ? palette.accent : palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 13 }}>{text(lang, item.labelZh, item.label)}</strong>
              <span style={{ color: palette.muted, fontSize: 11.5 }}>{item.direction} · {item.evidenceLevel}</span>
              <span style={{ color: palette.faint, fontSize: 11.5 }}>{text(lang, "影响边", "Affected edges")}: {item.affectedEdges?.length || 0}</span>
              {active ? <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, item.explanationZh, item.explanation)}</span> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
