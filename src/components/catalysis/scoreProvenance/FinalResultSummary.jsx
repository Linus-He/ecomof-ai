import { NumericText } from "../FormulaInline"
import { asArray, cardStyle, fmt, palette, text } from "./shared"
import { HgcpsFactorRose } from "./HgcpsFactorRose"

function Pill({ children, tone = "info" }) {
  const colors = tone === "risk"
    ? [palette.riskSoft, palette.risk, palette.risk]
    : tone === "good"
      ? [palette.positiveSoft, palette.positive, palette.positive]
      : [palette.accentSoft, palette.accent, palette.accent]
  return (
    <span style={{ alignItems: "center", background: colors[0], border: `1px solid ${colors[1]}`, borderRadius: 999, color: colors[2], display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

export function FinalResultSummary({ model, lang = "zh", onOpenActivationCenter, withTestId = true }) {
  if (!model) return null
  return (
    <section data-testid={withTestId ? "final-result-summary" : undefined} style={cardStyle({ background: palette.surfaceStrong, border: `1px solid ${palette.accent}`, padding: 14 })}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: palette.accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Final Board</div>
        <h2 style={{ color: palette.text, fontSize: 20, lineHeight: 1.2, margin: 0 }}>{text(lang, model.titleZh, model.titleEn)}</h2>
        <p style={{ color: palette.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>{text(lang, model.noteZh, model.noteEn)}</p>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <div style={cardStyle({ background: palette.bg })}>
          <span style={{ color: palette.faint, fontSize: 10.5, fontWeight: 900 }}>{text(lang, "选中路线", "Selected route")}</span>
          <strong style={{ color: palette.text, fontSize: 18 }}>{model.routeLabel}</strong>
          <span style={{ color: palette.muted, fontSize: 11.5 }}>{model.recommendationTier}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            <Pill tone="good">{text(lang, "排名", "rank")} #{model.ranking}</Pill>
            <Pill>Δ #2 {model.deltaToSecond >= 0 ? "+" : ""}{fmt(model.deltaToSecond, 3)}</Pill>
          </div>
          <NumericText style={{ color: palette.accent, fontSize: 32, fontWeight: 950 }}>HGCPS {fmt(model.finalHGCPS, 3)}</NumericText>
        </div>
        <HgcpsFactorRose model={model.factorRoseModel} lang={lang} mini />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {asArray(model.boundaries).map(boundary => <Pill key={boundary.id} tone="risk">{text(lang, boundary.zh, boundary.en)}</Pill>)}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div style={cardStyle({ background: palette.bg })}>
          <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, "最小实验矩阵摘要", "Minimum experiment matrix")}</strong>
          <span style={{ color: palette.positive, fontSize: 12 }}>{text(lang, "已覆盖 / 已规划", "covered / planned")}: {model.validationCounts.coveredCount}</span>
          <span style={{ color: palette.risk, fontSize: 12 }}>{text(lang, "待补", "pending")}: {model.validationCounts.pendingCount}</span>
        </div>
        <div style={cardStyle({ background: palette.accentSoft, border: `1px solid ${palette.accent}` })}>
          <strong style={{ color: palette.accent, fontSize: 12.5 }}>{text(lang, model.actionZh, model.actionEn)}</strong>
          <span style={{ color: palette.text, fontSize: 12, lineHeight: 1.5 }}>{model.nextExperiment}</span>
          <button type="button" onClick={onOpenActivationCenter} style={{ background: palette.bg, border: `1px solid ${palette.accent}`, borderRadius: 8, color: palette.accent, cursor: "pointer", fontSize: 12, fontWeight: 900, minHeight: 34, padding: "8px 10px", textAlign: "center" }}>
            {text(lang, model.actionButtonZh, model.actionButtonEn)}
          </button>
        </div>
      </div>
    </section>
  )
}

export default FinalResultSummary
