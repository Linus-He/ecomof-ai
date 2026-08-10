import { asArray, ChartFrame, EmptyState, fmt, palette, text } from "./shared"

const SERIES_COLORS = [
  palette.accent,
  palette.positive,
  palette.mixed,
  palette.risk,
  "#6D5CA8",
  "#0F766E",
  "#9A3412",
  "#475569",
]

function routeEvolution(model, routeId) {
  return asArray(model?.candidates).find(row => row.routeId === routeId)?.evolution || []
}

export function DescriptorAblationChart({ model, lang = "zh", selectedRouteId = "", onSelectRoute }) {
  const layers = asArray(model?.layers)
  const candidates = asArray(model?.candidates)
  if (!layers.length || !candidates.length) {
    return (
      <ChartFrame testId="descriptor-ablation-chart" rowCount={0} title={text(lang, "描述符影响 / 消融", "Descriptor impact / ablation")}>
        <EmptyState lang={lang} />
      </ChartFrame>
    )
  }
  const activeRouteId = selectedRouteId || layers.at(-1)?.candidates?.[0]?.routeId || candidates[0]?.routeId
  const width = 720
  const height = 390
  const left = 62
  const right = 24
  const top = 28
  const bottom = 58
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maxRank = Math.max(1, candidates.length)
  const xFor = index => left + (plotWidth * index) / Math.max(1, layers.length - 1)
  const yFor = rank => top + (Math.max(1, rank) - 1) / Math.max(1, maxRank - 1) * plotHeight
  const rankTicks = Array.from(new Set([1, 5, 10, 15, 20, maxRank].filter(value => value <= maxRank)))

  return (
    <ChartFrame
      testId="descriptor-ablation-chart"
      rowCount={candidates.length}
      title={text(lang, "描述符影响 / 消融：排名演化", "Descriptor impact / ablation: rank evolution")}
      subtitle={text(lang, model.impactSummary?.summaryZh, model.impactSummary?.summaryEn)}
      scroll
    >
      <div data-layer-count={layers.length} data-candidate-count={candidates.length} style={{ minWidth: 640 }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text(lang, "候选路线从 L0 到 L3 的排名演化图", "Candidate route rank evolution from L0 to L3")} style={{ display: "block", minWidth: 640, width: "100%" }}>
          {rankTicks.map(rank => (
            <g key={rank}>
              <line x1={left} x2={width - right} y1={yFor(rank)} y2={yFor(rank)} stroke={palette.border} strokeDasharray="4 5" />
              <text x={left - 12} y={yFor(rank) + 4} textAnchor="end" fill={palette.faint} fontSize="10">#{rank}</text>
            </g>
          ))}
          {layers.map((layer, index) => (
            <g key={layer.id}>
              <line x1={xFor(index)} x2={xFor(index)} y1={top} y2={height - bottom} stroke={palette.borderStrong} />
              <text x={xFor(index)} y={height - 28} textAnchor="middle" fill={palette.text} fontSize="12" fontWeight="800">
                {layer.id} {text(lang, layer.labelZh, layer.labelEn)}
              </text>
            </g>
          ))}
          {candidates.map((candidate, index) => {
            const evolution = routeEvolution(model, candidate.routeId)
            const points = evolution.map((row, layerIndex) => `${xFor(layerIndex)},${yFor(row.rank)}`).join(" ")
            const active = candidate.routeId === activeRouteId
            const color = SERIES_COLORS[index % SERIES_COLORS.length]
            return (
              <g key={candidate.routeId}>
                <polyline
                  data-testid="descriptor-ablation-line"
                  data-route-id={candidate.routeId}
                  points={points}
                  fill="none"
                  stroke={active ? color : palette.borderStrong}
                  strokeOpacity={active ? 1 : 0.42}
                  strokeWidth={active ? 4 : 1.4}
                  role="button"
                  tabIndex={0}
                  aria-label={`${candidate.routeName}: ${evolution.map(row => `${row.layerId} #${row.rank}`).join(", ")}`}
                  onClick={() => onSelectRoute?.(candidate.routeId)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") onSelectRoute?.(candidate.routeId)
                  }}
                  style={{ cursor: "pointer" }}
                />
                {evolution.map((row, layerIndex) => (
                  <circle
                    key={`${candidate.routeId}-${row.layerId}`}
                    cx={xFor(layerIndex)}
                    cy={yFor(row.rank)}
                    r={active ? 4.5 : 2}
                    fill={active ? color : palette.borderStrong}
                    opacity={active ? 1 : 0.5}
                  />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {candidates.map((candidate, index) => {
          const active = candidate.routeId === activeRouteId
          const full = candidate.evolution?.at(-1) || {}
          return (
            <button
              key={candidate.routeId}
              type="button"
              onClick={() => onSelectRoute?.(candidate.routeId)}
              style={{ alignItems: "center", background: active ? palette.accentSoft : palette.surface, border: `1px solid ${active ? palette.accent : palette.border}`, borderRadius: 8, color: palette.text, cursor: "pointer", display: "grid", gap: 7, gridTemplateColumns: "10px minmax(0, 1fr) auto", padding: "7px 8px", textAlign: "left" }}
            >
              <span style={{ background: SERIES_COLORS[index % SERIES_COLORS.length], borderRadius: 6, height: 8, width: 8 }} />
              <span style={{ fontSize: 11.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{candidate.routeName}</span>
              <strong style={{ color: active ? palette.accent : palette.muted, fontSize: 11.2 }}>#{full.rank} · {fmt(full.score, 3)}</strong>
            </button>
          )
        })}
      </div>
    </ChartFrame>
  )
}

export default DescriptorAblationChart
