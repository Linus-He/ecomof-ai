// @ts-nocheck
import { organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const evidenceLabels = {
  validated: ["已验证", "Validated"],
  strong_literature: ["强文献支持", "Strong literature"],
  literature_inference: ["文献推断", "Literature inference"],
  hypothesis_guided: ["假设驱动", "Hypothesis-guided"],
  demo_only: ["演示数据", "Demonstration data"],
  missing: ["待补充", "Missing"],
}

export function evidenceLabel(value, lang) {
  const pair = evidenceLabels[value] || [value, value]
  return lang === "zh" ? pair[0] : pair[1]
}

export function GraphEvidencePanel({ selectedNode, selectedEdge, selectedPathway, activeRegulation, lang }) {
  const evidence = selectedEdge?.evidenceSources || selectedNode?.validationMethods || selectedPathway?.recommendedValidation || activeRegulation?.validationMethods || []
  const level = selectedEdge?.evidenceLevel || selectedNode?.evidenceLevel || activeRegulation?.evidenceLevel || "hypothesis_guided"
  return (
    <section style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 12, display: "grid", gap: 10, padding: 12 }}>
      <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "证据与验证状态", "Evidence & validation status")}</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <span style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.accent, fontSize: 11.5, fontWeight: 850, padding: "5px 8px" }}>
          {evidenceLabel(level, lang)}
        </span>
        {evidence.map(item => (
          <span key={item} style={{ background: "#fff", border: `1px solid ${palette.border}`, borderRadius: 6, color: palette.muted, fontSize: 11.5, padding: "5px 8px" }}>
            {item}
          </span>
        ))}
      </div>
      <p style={{ color: palette.muted, fontSize: 12, lineHeight: 1.5, margin: 0 }}>
        {text(lang, "当前状态以文献推断和假设驱动为主；同位素示踪、中间体投料、时间序列和副产物分布用于后续验证。", "Current status is mainly literature-inference and hypothesis-guided; isotope tracing, intermediate feeding, time-series monitoring, and by-product distribution remain validation routes.")}
      </p>
    </section>
  )
}
