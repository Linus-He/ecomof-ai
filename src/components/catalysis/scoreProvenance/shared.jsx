import { organicAcidPalette as palette, ORGANIC_ACID_FONT } from "../FormulaInline"

export { palette, ORGANIC_ACID_FONT }

export const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function fmt(value, digits = 3) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0"
  return next.toFixed(digits)
}

export function pct(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return "0%"
  return `${Math.round(Math.max(0, Math.min(1, next)) * 100)}%`
}

export function asArray(value) {
  return Array.isArray(value) ? value : []
}

const GRADE_TONE = {
  info: [palette.accentSoft, palette.accent, palette.accent],
  good: [palette.positiveSoft, palette.positive, palette.positive],
  warn: [palette.riskSoft, palette.mixed || palette.risk, palette.risk],
  muted: [palette.bg, palette.borderStrong, palette.faint],
}

export function cardStyle(style = {}) {
  return {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    display: "grid",
    gap: 9,
    minWidth: 0,
    padding: 12,
    ...style,
  }
}

export function GradeBadge({ grade, labelZh, labelEn, tone = "info", lang = "zh" }) {
  const [bg, border, color] = GRADE_TONE[tone] || GRADE_TONE.info
  return (
    <span
      data-testid="score-data-grade-badge"
      data-grade={grade}
      style={{ alignItems: "center", background: bg, border: `1px solid ${border}`, borderRadius: 999, color, display: "inline-flex", fontSize: 10.5, fontWeight: 900, gap: 5, lineHeight: 1.2, padding: "3px 8px" }}
    >
      {text(lang, labelZh, labelEn)}
    </span>
  )
}

export function GradeBadgeRow({ badges, lang = "zh" }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {asArray(badges).map(badge => (
        <GradeBadge key={badge.grade} grade={badge.grade} labelZh={badge.labelZh} labelEn={badge.labelEn} tone={badge.tone} lang={lang} />
      ))}
    </div>
  )
}

export function ChartFrame({ testId, rowCount, title, subtitle, children, scroll = false }) {
  return (
    <div
      data-testid={testId}
      data-row-count={rowCount}
      style={cardStyle({ background: palette.bg, ...(scroll ? { overflowX: "auto" } : {}) })}
    >
      {title ? (
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ color: palette.text, fontSize: 13 }}>{title}</strong>
          {subtitle ? <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{subtitle}</span> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

export function EmptyState({ lang = "zh" }) {
  return (
    <div style={{ color: palette.faint, fontSize: 12, padding: 8 }}>
      {text(lang, "数据不足 / pending insufficient data", "Pending / insufficient data")}
    </div>
  )
}
