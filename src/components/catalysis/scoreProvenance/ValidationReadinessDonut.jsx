import { asArray, cardStyle, EmptyState, palette, text } from "./shared"

function countsFromModel(model) {
  const items = asArray(model?.items)
  if (items.length) {
    const covered = items.filter(item => item.status === "covered" || item.status === "partial").length
    return { covered, pending: Math.max(0, items.length - covered), total: items.length }
  }
  const rows = asArray(model?.rows)
  const covered = rows.filter(row => row.covered).reduce((sum, row) => sum + (Number(row.count) || 1), 0)
  const total = rows.reduce((sum, row) => sum + Math.max(1, Number(row.count) || 0), 0)
  return { covered, pending: Math.max(0, total - covered), total }
}

export function ValidationReadinessDonut({ model, lang = "zh", withTestId = true }) {
  const counts = countsFromModel(model)
  if (!counts.total) {
    return <div data-testid={withTestId ? "validation-readiness-donut" : undefined} data-row-count={0} style={cardStyle({ background: palette.bg })}><EmptyState lang={lang} /></div>
  }
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const coveredRatio = counts.covered / counts.total
  return (
    <div data-testid={withTestId ? "validation-readiness-donut" : undefined} data-row-count={counts.total} style={cardStyle({ background: palette.bg })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, "验证覆盖环图", "Validation Readiness Donut")}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "展示最小实验矩阵中已覆盖与待补项。", "Shows covered versus pending items in the minimum validation matrix.")}</span>
      </div>
      <div style={{ alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: "140px minmax(0,1fr)" }}>
        <svg viewBox="0 0 140 140" role="img" aria-label={text(lang, "验证覆盖环图", "Validation readiness donut")} style={{ width: 140, height: 140 }}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke={palette.riskSoft} strokeWidth="18" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={palette.positive}
            strokeDasharray={`${coveredRatio * circumference} ${circumference}`}
            strokeLinecap="round"
            strokeWidth="18"
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="66" fill={palette.text} fontSize="20" fontWeight="950" textAnchor="middle">{Math.round(coveredRatio * 100)}%</text>
          <text x="70" y="84" fill={palette.faint} fontSize="10" fontWeight="850" textAnchor="middle">{text(lang, "覆盖", "covered")}</text>
        </svg>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ color: palette.text, fontSize: 12, fontWeight: 900 }}>{text(lang, "最小实验矩阵", "Minimum experiment matrix")}</div>
          <div style={{ color: palette.muted, fontSize: 11.5 }}>{text(lang, "已覆盖", "covered")}: {counts.covered}</div>
          <div style={{ color: palette.risk, fontSize: 11.5 }}>{text(lang, "待补", "pending")}: {counts.pending}</div>
          <div style={{ color: palette.faint, fontSize: 10.5 }}>{model?.readinessLevel || model?.headerNoteZh || "planning-ready / not performance-validated"}</div>
        </div>
      </div>
    </div>
  )
}

export default ValidationReadinessDonut
