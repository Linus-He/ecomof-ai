import { useMemo, useState } from "react"
import type { IsothermPoint } from "../types/mof"

interface IsothermChartProps {
  data: IsothermPoint[]
  title: string
}

interface HoverPoint {
  point: IsothermPoint
  x: number
  y: number
}

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b", "#0891b2", "#be123c"]

function curveKey(point: IsothermPoint): string {
  return `${point.gas}-${point.temperature}-${point.isDesorption ? "desorption" : "adsorption"}`
}

function formatNumber(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits).replace(/\.?0+$/, "") : "0"
}

export function IsothermChart({ data, title }: IsothermChartProps) {
  const [hover, setHover] = useState<HoverPoint | null>(null)
  const chart = useMemo(() => {
    const width = 720
    const height = 360
    const margin = { top: 34, right: 28, bottom: 56, left: 64 }
    const points = data.filter(point => Number.isFinite(point.pressure) && Number.isFinite(point.uptake))
    const maxPressure = Math.max(1, ...points.map(point => point.pressure))
    const maxUptake = Math.max(1, ...points.map(point => point.uptake))
    const xScale = (pressure: number) => margin.left + (pressure / maxPressure) * (width - margin.left - margin.right)
    const yScale = (uptake: number) => height - margin.bottom - (uptake / maxUptake) * (height - margin.top - margin.bottom)
    const groups = new Map<string, IsothermPoint[]>()
    points.forEach(point => {
      const key = curveKey(point)
      groups.set(key, [...(groups.get(key) || []), point])
    })
    return {
      width,
      height,
      margin,
      maxPressure,
      maxUptake,
      xScale,
      yScale,
      groups: Array.from(groups.entries()).map(([key, items], index) => ({
        key,
        color: COLORS[index % COLORS.length],
        items: items.slice().sort((a, b) => a.pressure - b.pressure),
      })),
    }
  }, [data])

  if (!data.length) {
    return (
      <div className="isotherm-chart-empty" role="img" aria-label={`${title}: no isotherm data available`}>
        No isotherm data available
      </div>
    )
  }

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map(value => value * chart.maxPressure)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(value => value * chart.maxUptake)

  return (
    <div className="isotherm-chart-wrap">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title} className="isotherm-chart-svg">
        <title>{title}</title>
        <rect x="0" y="0" width={chart.width} height={chart.height} rx="12" fill="rgba(255,255,255,0.02)" />
        <text x={chart.margin.left} y="23" fill="currentColor" fontSize="15" fontWeight="800">{title}</text>
        {xTicks.map(tick => {
          const x = chart.xScale(tick)
          return (
            <g key={`x-${tick}`}>
              <line x1={x} x2={x} y1={chart.margin.top} y2={chart.height - chart.margin.bottom} stroke="rgba(148,163,184,0.22)" />
              <text x={x} y={chart.height - chart.margin.bottom + 20} textAnchor="middle" fill="rgb(100,116,139)" fontSize="11">
                {formatNumber(tick)}
              </text>
            </g>
          )
        })}
        {yTicks.map(tick => {
          const y = chart.yScale(tick)
          return (
            <g key={`y-${tick}`}>
              <line x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" />
              <text x={chart.margin.left - 12} y={y + 4} textAnchor="end" fill="rgb(100,116,139)" fontSize="11">
                {formatNumber(tick)}
              </text>
            </g>
          )
        })}
        <line x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={chart.height - chart.margin.bottom} y2={chart.height - chart.margin.bottom} stroke="rgb(100,116,139)" />
        <line x1={chart.margin.left} x2={chart.margin.left} y1={chart.margin.top} y2={chart.height - chart.margin.bottom} stroke="rgb(100,116,139)" />
        <text x={chart.width / 2} y={chart.height - 14} textAnchor="middle" fill="rgb(71,85,105)" fontSize="12" fontWeight="700">Pressure (bar)</text>
        <text transform={`translate(18 ${chart.height / 2}) rotate(-90)`} textAnchor="middle" fill="rgb(71,85,105)" fontSize="12" fontWeight="700">Uptake (mmol/g)</text>
        {chart.groups.map(group => {
          const path = group.items.map(point => `${chart.xScale(point.pressure)},${chart.yScale(point.uptake)}`).join(" ")
          const first = group.items[0]
          return (
            <g key={group.key}>
              <polyline
                points={path}
                fill="none"
                stroke={group.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={first?.isDesorption ? "6 5" : undefined}
              />
              {group.items.map(point => {
                const x = chart.xScale(point.pressure)
                const y = chart.yScale(point.uptake)
                return (
                  <circle
                    key={`${group.key}-${point.pressure}-${point.uptake}`}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill={group.color}
                    stroke="white"
                    strokeWidth="1.2"
                    onMouseEnter={() => setHover({ point, x, y })}
                    onMouseLeave={() => setHover(null)}
                  />
                )
              })}
              <text x={chart.width - chart.margin.right - 4} y={chart.margin.top + 15 + chart.groups.indexOf(group) * 16} textAnchor="end" fill={group.color} fontSize="11" fontWeight="750">
                {first?.gas} {first?.temperature} K {first?.isDesorption ? "des." : "ads."}
              </text>
            </g>
          )
        })}
      </svg>
      {hover && (
        <div className="isotherm-tooltip" style={{ left: `${(hover.x / chart.width) * 100}%`, top: `${(hover.y / chart.height) * 100}%` }}>
          <strong>{hover.point.gas} · {hover.point.temperature} K</strong>
          <span>Pressure: {formatNumber(hover.point.pressure, 3)} bar</span>
          <span>Uptake: {formatNumber(hover.point.uptake, 3)} mmol/g</span>
          <span>{hover.point.isDesorption ? "Desorption" : "Adsorption"}</span>
        </div>
      )}
    </div>
  )
}
