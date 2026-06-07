// @ts-nocheck
import { ChemicalText } from "../../../common/ChemicalFormula"
import { StatusPill, displayValue, formatScore, text } from "../FinalScreeningShared"

function ContributionBar({ row, t }) {
  const value = Number(row.value)
  const width = Math.min(100, Math.max(5, Math.abs(value || 0) * 420))
  const penalty = row.direction === "penalty"
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <span style={{ color: t.muted, fontSize: 11.7 }}>{displayValue(row.label)}</span>
        <strong style={{ color: penalty ? t.warn : t.textStrong, fontSize: 11.7 }}>{formatScore(row.contribution)}</strong>
      </div>
      <div style={{ background: t.border, borderRadius: 999, height: 7, overflow: "hidden" }}>
        <div style={{ background: penalty ? t.warn : t.accent, borderRadius: 999, height: "100%", width: `${width}%` }} />
      </div>
    </div>
  )
}

export function FormulaWeightInspector({ formulas = [], lang, t, isMobile }) {
  return (
    <section style={{ display: "grid", gap: 9 }}>
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
        {text(lang, "Formula & Weight Inspector", "Formula & Weight Inspector")}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {formulas.map(formula => (
          <article key={formula.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, padding: 11 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={text(lang, formula.labelZh, formula.label)} /></strong>
              <StatusPill tone="info" t={t}>{formula.formulaId}</StatusPill>
            </div>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={text(lang, formula.formulaZh, formula.formula)} /></span>
            <div style={{ color: t.muted, display: "grid", fontSize: 12, gap: 4 }}>
              <span>{text(lang, "目标", "Target")}: <strong style={{ color: t.textStrong }}>{displayValue(formula.target)}</strong></span>
              <span>{text(lang, "分数", "Score")}: <strong style={{ color: t.textStrong }}>{formatScore(formula.score)}</strong></span>
              <span>{text(lang, "权重方法", "Weighting")}: {displayValue(formula.weightingMethod)}</span>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {(formula.contributions || []).slice(0, 12).map(row => <ContributionBar key={row.key} row={row} t={t} />)}
            </div>
            <span style={{ color: t.warn, fontSize: 11.8, fontWeight: 850, lineHeight: 1.4 }}><ChemicalText value={text(lang, formula.boundaryZh, formula.boundary)} /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

