import { asArray, cardStyle, EmptyState, fmt, GradeBadge, palette, pct, text } from "./shared"

const SERIES_TONES = [palette.positive, palette.accent, palette.mixed || palette.faint]
const GRADE_TONE = { seed: "info", proxy: "warn", curated: "good", inferred: "muted" }

export function GuestScoreBreakdownChart({ models, model, summary, lang = "zh", withTestId = true }) {
  const series = asArray(models).length ? asArray(models) : (model ? [model] : [])
  if (!series.length) {
    return <div data-testid={withTestId ? "guest-score-breakdown-chart" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const factorKeys = asArray(series[0].rows).map(row => row.fieldKey)
  const labelByKey = new Map(asArray(series[0].rows).map(row => [row.fieldKey, [row.labelZh, row.labelEn]]))
  return (
    <div data-testid={withTestId ? "guest-score-breakdown-chart" : undefined} data-row-count={factorKeys.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "客体得分拆解图", "Guest Score Breakdown Chart")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>
          {text(lang, "并排对比选中客体与次优客体的七个评分因子。", "Side-by-side comparison of the seven scoring factors for the selected and runner-up guests.")}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {series.map((entry, index) => (
          <span key={entry.candidateLabel} style={{ alignItems: "center", color: palette.text, display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6 }}>
            <span style={{ background: SERIES_TONES[index] || palette.faint, borderRadius: 3, height: 10, width: 10 }} />
            #{entry.rank} {entry.candidateLabel} · {fmt(entry.finalValue, 3)}
            <GradeBadge grade={entry.dataGrade} labelZh={entry.dataGrade} labelEn={entry.dataGrade} tone={GRADE_TONE[entry.dataGrade] || "info"} lang={lang} />
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {factorKeys.map(key => {
          const [labelZh, labelEn] = labelByKey.get(key) || [key, key]
          return (
            <div key={key} style={{ display: "grid", gap: 4 }}>
              <span style={{ color: palette.text, fontSize: 11.4, fontWeight: 800 }}>{text(lang, labelZh, labelEn)}</span>
              {series.map((entry, index) => {
                const cell = asArray(entry.rows).find(row => row.fieldKey === key) || {}
                return (
                  <div key={entry.candidateLabel} style={{ alignItems: "center", display: "grid", gap: 7, gridTemplateColumns: "minmax(0,1fr) 36px" }}>
                    <span style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, height: 7, overflow: "hidden" }}>
                      <span style={{ background: SERIES_TONES[index] || palette.accent, display: "block", height: "100%", width: pct(cell.normalizedValue) }} />
                    </span>
                    <span style={{ color: palette.muted, fontSize: 10, textAlign: "right" }}>{fmt(cell.normalizedValue, 2)}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {summary ? (
        <p style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontSize: 11.5, lineHeight: 1.5, margin: 0, padding: 9 }}>
          {text(lang, summary.whyWinnerLeadsZh, summary.whyWinnerLeadsEn)}
        </p>
      ) : null}
      <p style={{ color: palette.faint, fontSize: 10.5, lineHeight: 1.4, margin: 0 }}>{text(lang, series[0].headerNoteZh, series[0].headerNoteEn)}</p>
    </div>
  )
}

export default GuestScoreBreakdownChart
