// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"
import { BlockFormula } from "../../ui"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function EvidenceBadge({ children, t }) {
  return (
    <span style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, display: "inline-flex", fontSize: 10.5, fontWeight: 900, padding: "4px 7px", textTransform: "uppercase" }}>
      <ChemicalText value={children} />
    </span>
  )
}

export function FormulaExplainerCard({ card, lang, t }) {
  return (
    <article id={`methodology-oafs-${card.id}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, minWidth: 0, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{card.id === "oacs" ? "OACS Formula Explainer" : "DMRS Formula Explainer"}</span>
          <h3 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.15, margin: 0 }}>
            <ChemicalText value={text(lang, card.titleZh, card.title)} />
          </h3>
        </div>
        <EvidenceBadge t={t}>{card.id === "oacs" ? "Stage 1" : "Stage 2"}</EvidenceBadge>
      </header>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 9, minWidth: 0, padding: 12 }}>
        <BlockFormula t={t} math={card.math} fallback={card.fallback} />
        <BlockFormula t={t} math={card.thresholdMath} fallback={card.thresholdFallback} />
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {card.variables.map(variable => (
          <div key={variable.symbol} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, minWidth: 0, padding: 10 }}>
            <code style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>{variable.symbol}</code>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.4 }}><ChemicalText value={text(lang, variable.meaningZh, variable.meaning)} /></span>
            <EvidenceBadge t={t}>{variable.status}</EvidenceBadge>
          </div>
        ))}
      </div>

      <p style={{ color: card.id === "dmrs" ? t.warn : t.muted, fontSize: 12.5, fontWeight: card.id === "dmrs" ? 900 : 700, lineHeight: 1.5, margin: 0 }}>
        <ChemicalText value={text(lang, card.interpretationZh, card.interpretation)} />
      </p>
    </article>
  )
}
