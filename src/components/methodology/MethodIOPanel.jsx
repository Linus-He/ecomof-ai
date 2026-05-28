import { SCIENTIFIC_TOKEN_FONT, chemText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Pill({ children, t }) {
  return (
    <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, display: "inline-flex", fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11, fontWeight: 780, lineHeight: 1.2, padding: "5px 8px" }}>
      {chemText(children)}
    </span>
  )
}

export function MethodIOPanel({ inputs = [], inputsZh = [], outputs = [], outputsZh = [], lang, t }) {
  const rows = [
    [text(lang, "输入", "Inputs"), lang === "zh" ? inputsZh : inputs],
    [text(lang, "输出", "Outputs"), lang === "zh" ? outputsZh : outputs],
  ]
  return (
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      {rows.map(([label, values]) => (
        <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: 11 }}>
          <strong style={{ color: t.textStrong, display: "block", fontSize: 12.5, marginBottom: 8 }}>{label}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(values || []).map(value => <Pill key={value} t={t}>{value}</Pill>)}
          </div>
        </article>
      ))}
    </div>
  )
}
