// @ts-nocheck
import { SCIENTIFIC_TOKEN_FONT, organicAcidPalette as palette } from "./FormulaInline"
import { ChemicalText } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`

function ScoreBar({ label, value, color = palette.accent }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: palette.muted, fontSize: 11.5, fontWeight: 750 }}>{label}</span>
        <span style={{ color: palette.text, fontFamily: SCIENTIFIC_TOKEN_FONT, fontSize: 11.5, fontWeight: 800 }}>{pct(value)}</span>
      </div>
      <div style={{ background: palette.surfaceStrong, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <span style={{ background: color, display: "block", height: "100%", width: pct(value) }} />
      </div>
    </div>
  )
}

function Tags({ values }) {
  if (!values?.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {values.map(value => (
        <span key={value} style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.muted, fontSize: 11.5, padding: "4px 7px" }}>
          <ChemicalText value={value} />
        </span>
      ))}
    </div>
  )
}

export function GraphEdgeDetailPanel({ edge, nodesById, lang }) {
  if (!edge) return null
  const source = nodesById.get(edge.source)
  const target = nodesById.get(edge.target)
  return (
    <article style={{ display: "grid", gap: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
          {text(lang, "边详情", "Edge detail")}
        </div>
        <h3 style={{ color: palette.text, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
          <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}><ChemicalText value={text(lang, source?.labelZh, source?.label)} /></span>
          {" → "}
          <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}><ChemicalText value={text(lang, target?.labelZh, target?.label)} /></span>
        </h3>
        <span style={{ color: palette.muted, fontSize: 12.5 }}>{text(lang, edge.labelZh, edge.label)}</span>
      </header>
      <div style={{ display: "grid", gap: 8 }}>
        <ScoreBar label={text(lang, "证据分数", "Evidence score")} value={edge.evidenceScore} />
        <ScoreBar label={text(lang, "化学合理性", "Chemical plausibility")} value={edge.chemicalPlausibility} color={palette.positive} />
        <ScoreBar label={text(lang, "MOF 调控贡献", "MOF regulation factor")} value={edge.mofRegulationFactor} color={palette.mixed} />
        <ScoreBar label={text(lang, "验证支持度", "Validation support")} value={edge.validationSupport} color={palette.risk} />
        <ScoreBar label={text(lang, "最终边权重", "Final edge weight")} value={edge.weight} color={palette.accent} />
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.55 }}>{text(lang, edge.explanationZh, edge.explanation)}</div>
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "促进因素", "Promoted by")}</strong>
        <Tags values={edge.promotedBy} />
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "抑制因素 / 竞争因素", "Inhibited by / competing factors")}</strong>
        <Tags values={edge.inhibitedBy} />
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        <strong style={{ color: palette.text, fontSize: 12.5 }}>{text(lang, "证据来源", "Evidence sources")}</strong>
        <Tags values={edge.evidenceSources} />
      </div>
      <div style={{ color: palette.muted, fontSize: 12.5, lineHeight: 1.5 }}>
        <strong style={{ color: palette.text }}>{text(lang, "验证优先级", "Validation priority")}:</strong> {edge.validationPriority}
      </div>
      {(lang === "zh" ? edge.uncertaintyZh || edge.uncertainty : edge.uncertainty || edge.uncertaintyZh)?.map(item => (
        <div key={item} style={{ color: palette.risk, fontSize: 12, lineHeight: 1.45 }}>- {item}</div>
      ))}
    </article>
  )
}
