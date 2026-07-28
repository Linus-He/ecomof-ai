import { NumericText } from "../FormulaInline"
import { asArray, cardStyle, fmt, palette, text } from "./shared"
import { HgcpsFactorRose } from "./HgcpsFactorRose"
import { ValidationReadinessDonut } from "./ValidationReadinessDonut"
import { RouteStructureEvidence } from "../RouteStructureEvidence"

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

function Caption({ children }) {
  return <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.5 }}>{children}</span>
}

function TopRouteHgcpsComparisonChart({ model, lang = "zh", onViewHostStructure }) {
  const rows = asArray(model?.rows)
  const maxValue = Math.max(0.01, Number(model?.maxValue) || Math.max(...rows.map(row => Number(row.finalHGCPS) || 0), 0.01))
  if (!rows.length) return null
  return (
    <div data-testid="final-route-comparison-chart" data-row-count={rows.length} style={cardStyle({ background: palette.bg })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        <Caption>{text(lang, model.captionZh, model.captionEn)}</Caption>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((row, index) => (
          <div key={row.routeId} style={{ display: "grid", gap: 7 }}>
            <div style={{ alignItems: "baseline", display: "grid", gap: 8, gridTemplateColumns: "36px minmax(0,1fr) 64px" }}>
              <NumericText style={{ color: index === 0 ? palette.accent : palette.faint, fontSize: 12, fontWeight: 950 }}>#{row.rank}</NumericText>
              <strong style={{ color: palette.text, fontSize: 11.7, minWidth: 0 }}>{row.label}</strong>
              <NumericText style={{ color: index === 0 ? palette.positive : palette.accent, fontSize: 12, fontWeight: 950, textAlign: "right" }}>{fmt(row.finalHGCPS, 3)}</NumericText>
            </div>
            <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, height: 10, overflow: "hidden" }}>
              <span style={{ background: index === 0 ? palette.positive : palette.accent, display: "block", height: "100%", width: `${Math.max(3, Math.min(100, (Number(row.finalHGCPS) || 0) / maxValue * 100))}%` }} />
            </div>
            <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))" }}>
              {asArray(row.factors).map(factor => (
                <span key={`${row.routeId}-${factor.factorKey}`} title={`${text(lang, factor.labelZh, factor.labelEn)} ${fmt(factor.value, 2)}`} style={{ alignItems: "center", color: palette.faint, display: "inline-flex", fontSize: 9.6, fontWeight: 800, gap: 4, minWidth: 0 }}>
                  <span style={{ background: factor.factorKey === "riskRetentionFactor" ? palette.risk : palette.borderStrong, borderRadius: 999, height: 6, width: 6 }} />
                  {text(lang, factor.labelZh, factor.labelEn)} {fmt(factor.value, 2)}
                </span>
              ))}
            </div>
            <RouteStructureEvidence route={row} lang={lang} compact onViewHostStructure={onViewHostStructure} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FinalResultSummary({ model, lang = "zh", onOpenActivationCenter, onViewHostStructure, withTestId = true }) {
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
            <Pill>Δ runner {model.deltaToSecond >= 0 ? "+" : ""}{fmt(model.deltaToSecond, 3)}</Pill>
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
      <section data-testid="final-paper-comparison-section" style={cardStyle({ background: palette.bg })}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: palette.text, fontSize: 14 }}>{text(lang, "论文级对比与解读", "Paper-style comparison and interpretation")}</strong>
          <Caption>{text(lang, "图为主、图注式解读；所有数值来自当前路线评分与验证矩阵。", "Figure-first reading with caption-style interpretation; all values come from the current route scoring and validation matrix.")}</Caption>
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          <TopRouteHgcpsComparisonChart model={model.routeComparisonModel} lang={lang} onViewHostStructure={onViewHostStructure} />
          <div style={{ display: "grid", gap: 7 }}>
            <HgcpsFactorRose
              model={model.factorOverlayModel?.top || model.factorRoseModel}
              overlayRoute={model.factorOverlayModel?.runnerUp}
              factorDetails={model.perFactorInterpretation}
              factorEvidence={model.factorEvidence}
              lang={lang}
              mini
              withTestId={false}
            />
            <Caption>{text(lang, model.chartCaptions?.find(row => row.id === "factor-overlay")?.zh, model.chartCaptions?.find(row => row.id === "factor-overlay")?.en)}</Caption>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            <ValidationReadinessDonut model={model.validationDonutModel} lang={lang} withTestId={false} />
            <Caption>{text(lang, model.validationDonutModel?.captionZh, model.validationDonutModel?.captionEn)}</Caption>
          </div>
        </div>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          {asArray(model.interpretationParagraphs).map(row => (
            <div key={row.id} style={cardStyle({ background: palette.surfaceStrong, padding: 10 })}>
              <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, row.labelZh, row.labelEn)}</strong>
              <Caption>{text(lang, row.bodyZh, row.bodyEn)}</Caption>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

export default FinalResultSummary
