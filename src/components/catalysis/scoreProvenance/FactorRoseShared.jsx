import { useMemo, useState } from "react"
import { asArray, cardStyle, EmptyState, fmt, palette, text } from "./shared"

function polar(cx, cy, radius, angle) {
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function truncate(value, length = 12) {
  const next = String(value || "pending")
  return next.length > length ? `${next.slice(0, length - 1)}…` : next
}

function pointsToString(points) {
  return points.map(point => `${point.x},${point.y}`).join(" ")
}

function evidenceForFactor(rows, factorKey) {
  return asArray(rows).filter(row => row.factorKey === factorKey)
}

function detailForRow(row, factorDetails, factorEvidence) {
  const detail = asArray(factorDetails).find(item => item.factorKey === row.factorKey) || row
  return {
    ...row,
    ...detail,
    evidenceRows: evidenceForFactor(factorEvidence, row.factorKey),
  }
}

export function FactorRoseChart({
  rows,
  titleZh,
  titleEn,
  subtitleZh,
  subtitleEn,
  captionZh,
  captionEn,
  centerLabel,
  centerValue,
  lang = "zh",
  testId,
  colorFor,
  outlineRows = [],
  outlineLabel = "",
  factorDetails = [],
  factorEvidence = [],
  selectedFactorKey = "",
  onSelectFactor,
}) {
  const dataRows = asArray(rows)
  const [localSelectedKey, setLocalSelectedKey] = useState("")
  const selectedKey = selectedFactorKey || localSelectedKey
  const selectedRow = useMemo(() => {
    const row = dataRows.find(item => item.factorKey === selectedKey)
    return row ? detailForRow(row, factorDetails, factorEvidence) : null
  }, [dataRows, factorDetails, factorEvidence, selectedKey])
  if (!dataRows.length) {
    return (
      <div data-testid={testId} data-row-count={0} style={cardStyle({ background: palette.bg })}>
        <EmptyState lang={lang} />
      </div>
    )
  }
  const cx = 150
  const cy = 150
  const maxRadius = 96
  const step = 360 / dataRows.length
  const rosePoints = dataRows.map((row, index) => {
    const angle = index * step
    const radius = maxRadius * Math.max(0.04, Math.min(1, Number(row.value) || 0))
    return polar(cx, cy, radius, angle)
  })
  const outlinePoints = asArray(outlineRows).map((row, index) => {
    const angle = index * step
    const radius = maxRadius * Math.max(0.04, Math.min(1, Number(row.value) || 0))
    return polar(cx, cy, radius, angle)
  })
  const selectFactor = factorKey => {
    const next = selectedKey === factorKey ? "" : factorKey
    setLocalSelectedKey(next)
    onSelectFactor?.(next || "")
  }
  return (
    <div data-testid={testId} data-row-count={dataRows.length} style={cardStyle({ background: palette.bg })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, titleZh, titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, subtitleZh, subtitleEn)}</span>
      </div>
      <svg viewBox="0 0 300 300" role="img" aria-label={text(lang, titleZh, titleEn)} style={{ width: "100%", maxHeight: 330 }}>
        {[0.2, 0.4, 0.6, 0.8, 1].map(level => (
          <g key={level}>
            <circle cx={cx} cy={cy} r={maxRadius * level} fill="none" stroke={palette.border} strokeDasharray={level === 1 ? "0" : "3 4"} strokeWidth="1" />
            <text x={cx + 4} y={cy - maxRadius * level + 4} fill={palette.faint} fontSize="8.2" fontWeight="800">{fmt(level, 1)}</text>
          </g>
        ))}
        {dataRows.map((row, index) => {
          const angle = index * step
          const value = Math.max(0.04, Math.min(1, Number(row.value) || 0))
          const point = rosePoints[index]
          const axisPoint = polar(cx, cy, maxRadius, angle)
          const labelPoint = polar(cx, cy, maxRadius + 22, angle)
          const fill = colorFor?.(row, index) || palette.accent
          const active = selectedKey === row.factorKey
          return (
            <g
              key={row.factorKey || row.labelZh || index}
              role="button"
              tabIndex={0}
              aria-label={`${text(lang, row.labelZh, row.labelEn)} ${fmt(value, 3)}`}
              data-testid="factor-rose-node"
              data-factor-key={row.factorKey}
              onClick={() => selectFactor(row.factorKey)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  selectFactor(row.factorKey)
                }
                if (event.key === "Escape") {
                  setLocalSelectedKey("")
                  onSelectFactor?.("")
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <line x1={cx} y1={cy} x2={axisPoint.x} y2={axisPoint.y} stroke={active ? palette.accent : palette.borderStrong} strokeWidth={active ? "1.8" : "1"} strokeOpacity="0.85" />
              <circle cx={point.x} cy={point.y} r={active ? 5.8 : 4.4} fill={fill} stroke={active ? palette.text : palette.bg} strokeWidth={active ? "1.8" : "1.2"} />
              <text x={labelPoint.x} y={labelPoint.y - 3} fill={active ? palette.text : palette.faint} fontSize="8.8" fontWeight="900" textAnchor={labelPoint.x >= cx + 4 ? "start" : labelPoint.x <= cx - 4 ? "end" : "middle"} dominantBaseline="middle">
                {truncate(row.labelZh, 12)}
              </text>
              <text x={labelPoint.x} y={labelPoint.y + 8} fill={palette.muted} fontSize="7.2" fontWeight="700" textAnchor={labelPoint.x >= cx + 4 ? "start" : labelPoint.x <= cx - 4 ? "end" : "middle"} dominantBaseline="middle">
                {truncate(row.labelEn, 13)}
              </text>
              <title>{text(lang, row.labelZh, row.labelEn)}: {fmt(row.value, 3)}</title>
            </g>
          )
        })}
        <polygon data-testid="factor-rose-polygon" points={pointsToString(rosePoints)} fill={palette.accentSoft} stroke={palette.accent} strokeWidth="2" opacity="0.88" pointerEvents="none" />
        {outlinePoints.length === dataRows.length ? (
          <polygon data-testid="factor-rose-overlay" points={pointsToString(outlinePoints)} fill="none" stroke={palette.borderStrong} strokeDasharray="4 4" strokeWidth="2" opacity="0.9" pointerEvents="none" />
        ) : null}
        <circle cx={cx} cy={cy} r="27" fill={palette.surfaceStrong} stroke={palette.border} />
        <text x={cx} y={cy - 4} fill={palette.faint} fontSize="9.5" fontWeight="900" textAnchor="middle">{centerLabel}</text>
        <text x={cx} y={cy + 12} fill={palette.text} fontSize="17" fontWeight="950" textAnchor="middle">{centerValue}</text>
      </svg>
      <div style={{ color: palette.muted, fontSize: 11.2, lineHeight: 1.45 }}>
        {text(lang, captionZh || "半径越长表示该因子对当前路线越有支撑；虚线为对照路线轮廓。", captionEn || "Longer radius means stronger support for the current route; dashed outline is the comparison route.")}
      </div>
      {outlinePoints.length === dataRows.length ? (
        <div style={{ alignItems: "center", color: palette.faint, display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 6 }}>
          <span style={{ borderTop: `2px dashed ${palette.borderStrong}`, display: "inline-block", width: 22 }} />
          {outlineLabel || text(lang, "对照路线", "Comparison route")}
        </div>
      ) : null}
      {selectedRow ? (
        <div data-testid="factor-rose-detail-card" style={cardStyle({ background: palette.surfaceStrong, border: `1px solid ${palette.accent}`, padding: 10 })}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between" }}>
            <strong style={{ color: palette.text, fontSize: 12 }}>{text(lang, selectedRow.labelZh, selectedRow.labelEn)}</strong>
            <span style={{ color: palette.accent, fontSize: 11.5, fontWeight: 950 }}>{fmt(selectedRow.normalizedValue ?? selectedRow.value, 3)}</span>
          </div>
          <span style={{ color: palette.muted, fontSize: 11.3, lineHeight: 1.5 }}>{text(lang, selectedRow.interpretationZh || selectedRow.labelZh, selectedRow.interpretationEn || selectedRow.labelEn)}</span>
          <div style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))" }}>
            {[
              ["raw", "Raw", selectedRow.rawValue],
              ["weight", "Weight / factor", selectedRow.weightOrFactor],
              ["contribution", "Contribution", selectedRow.contribution],
              ["grade", "Data grade", selectedRow.dataGrade],
              ["level", "Level", text(lang, selectedRow.levelTag, selectedRow.levelTagEn)],
            ].map(([key, label, value]) => (
              <span key={key} style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.muted, fontSize: 10.5, lineHeight: 1.35, padding: 7 }}>
                <strong style={{ color: palette.faint, display: "block", fontSize: 9.5 }}>{label}</strong>
                {typeof value === "number" ? fmt(value, 3) : (value || "pending")}
              </span>
            ))}
          </div>
          {selectedRow.evidenceRows.length ? (
            <div style={{ color: palette.faint, display: "grid", fontSize: 10.6, gap: 4, lineHeight: 1.4 }}>
              {selectedRow.evidenceRows.slice(0, 2).map(row => (
                <span key={row.evidenceId}>{row.citation} · {row.directness} · {row.sameCondition ? text(lang, "同条件", "same condition") : text(lang, "非同条件", "not same condition")}</span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {dataRows.map(row => (
          <div key={row.factorKey || row.labelZh} style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "minmax(0,1fr) 40px" }}>
            <span style={{ color: palette.muted, fontSize: 10.8, minWidth: 0 }}>{text(lang, row.labelZh, row.labelEn)}</span>
            <span style={{ color: palette.text, fontSize: 10.8, fontWeight: 900, textAlign: "right" }}>{fmt(row.value, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
