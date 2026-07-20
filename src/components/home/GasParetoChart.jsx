// @ts-nocheck
import { useMemo, useState } from "react"
import gasRecordsData from "../../../public/data/gas_adsorption_records_v2.json"

const GRADE_STYLE = {
  iast: { color: "#2563eb", labelZh: "IAST", labelEn: "IAST", shape: "circle" },
  experimental: { color: "#16a34a", labelZh: "实验", labelEn: "Experimental", shape: "square" },
  computed: { color: "#9333ea", labelZh: "计算", labelEn: "Computed", shape: "diamond" },
  seed: { color: "#b45309", labelZh: "Seed", labelEn: "Seed", shape: "triangle" },
  unknown: { color: "#64748b", labelZh: "未知", labelEn: "Unknown", shape: "circle" },
}

function recordsFrom(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.data || []
}

function finiteMetric(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))
}

function gasPairOf(record) {
  return record?.gasPair || record?.condition?.gasPair || [record?.primaryGas, record?.secondaryGas].filter(Boolean).join("/") || "unknown"
}

function prettyGasPair(pair) {
  return String(pair || "")
    .replace(/CO2/g, "CO₂")
    .replace(/CH4/g, "CH₄")
    .replace(/N2/g, "N₂")
    .replace(/O2/g, "O₂")
    .replace(/H2/g, "H₂")
    .replace(/C2H2/g, "C₂H₂")
    .replace(/C2H4/g, "C₂H₄")
    .replace(/C3H6/g, "C₃H₆")
    .replace(/C3H8/g, "C₃H₈")
}

function classifyGrade(record) {
  const grade = String(record?.dataGrade || record?.recordProvenance?.dataGrade || "").toLowerCase()
  if (grade.includes("seed")) return "seed"
  if (grade.includes("iast") || finiteMetric(record?.metrics?.iaSTSelectivity)) return "iast"
  if (grade.includes("experimental")) return "experimental"
  if (grade.includes("computed") || grade.includes("simulation")) return "computed"
  return "unknown"
}

function selectivityValue(record) {
  if (finiteMetric(record?.metrics?.iaSTSelectivity)) return Number(record.metrics.iaSTSelectivity)
  if (finiteMetric(record?.metrics?.selectivity)) return Number(record.metrics.selectivity)
  return null
}

function workingCapacityValue(record) {
  if (!finiteMetric(record?.metrics?.workingCapacity)) return null
  return Number(record.metrics.workingCapacity)
}

export function buildGasParetoRows(records = recordsFrom(gasRecordsData)) {
  return records
    .map(record => {
      const selectivity = selectivityValue(record)
      const workingCapacity = workingCapacityValue(record)
      if (!finiteMetric(selectivity) || !finiteMetric(workingCapacity) || selectivity <= 0 || workingCapacity <= 0) return null
      const provenance = record.recordProvenance || record.provenance || {}
      return {
        id: record.id || `${record.mofId || record.displayName}-${gasPairOf(record)}`,
        mof: record.rawName || record.displayName || record.mofId || "MOF",
        displayName: record.displayName || record.rawName || record.mofId || "MOF",
        gasPair: gasPairOf(record),
        selectivity,
        workingCapacity,
        grade: classifyGrade(record),
        dataGrade: record.dataGrade || "unknown",
        temperatureK: record.condition?.temperatureK,
        adsorptionPressureBar: record.condition?.adsorptionPressureBar ?? record.condition?.pressureBar,
        desorptionPressureBar: record.condition?.desorptionPressureBar,
        sourceUrl: provenance.sourceUrl || record.sourceUrl || provenance.sourceDatabase || "pending",
        doi: provenance.doi || record.doi || "",
      }
    })
    .filter(Boolean)
}

export function buildParetoFrontier(rows = []) {
  const sorted = [...rows].sort((a, b) => b.workingCapacity - a.workingCapacity || b.selectivity - a.selectivity)
  const frontier = []
  let bestSelectivity = -Infinity
  sorted.forEach(row => {
    if (row.selectivity > bestSelectivity) {
      frontier.push(row)
      bestSelectivity = row.selectivity
    }
  })
  return frontier.sort((a, b) => a.workingCapacity - b.workingCapacity)
}

export function summarizeGasParetoRows(rows = []) {
  const byPair = {}
  rows.forEach(row => {
    byPair[row.gasPair] ||= { total: 0, byGrade: { iast: 0, experimental: 0, computed: 0, seed: 0, unknown: 0 } }
    byPair[row.gasPair].total += 1
    byPair[row.gasPair].byGrade[row.grade] = (byPair[row.gasPair].byGrade[row.grade] || 0) + 1
  })
  return byPair
}

function formatCompact(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  if (Math.abs(number) >= 1000) return number.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return number.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function niceMax(values, pad = 1.08) {
  const max = Math.max(1, ...values.map(Number).filter(Number.isFinite))
  return max * pad
}

function log10(value) {
  return Math.log10(Math.max(Number(value) || 1, 1))
}

export function buildLogSelectivityScale(rows = []) {
  const values = rows.map(row => Number(row.selectivity)).filter(value => Number.isFinite(value) && value > 0)
  const min = Math.max(1, Math.min(...values))
  const max = Math.max(1, Math.max(...values))
  const minPow = Math.floor(log10(min))
  const maxPow = Math.ceil(log10(max))
  const ticks = []
  for (let pow = minPow; pow <= maxPow; pow += 1) {
    ticks.push(10 ** pow)
  }
  if (!ticks.includes(1)) ticks.unshift(1)
  return {
    min: 10 ** minPow,
    max: 10 ** maxPow,
    logMin: minPow,
    logMax: Math.max(maxPow, minPow + 1),
    ticks: ticks.filter(value => value >= 10 ** minPow && value <= 10 ** maxPow),
  }
}

function formatSelectivityTick(value) {
  if (value >= 1000000) return `${formatCompact(value / 1000000, 1)}M`
  if (value >= 1000) return `${formatCompact(value / 1000, value >= 10000 ? 0 : 1)}k`
  return formatCompact(value, 0)
}

function Shape({ point, active, style }) {
  const r = active ? 6.5 : 5.2
  if (style.shape === "square") {
    return <rect x={point.x - r} y={point.y - r} width={r * 2} height={r * 2} rx="2" fill={style.color} fillOpacity={active ? 0.96 : 0.72} stroke="#fff" strokeWidth={active ? 1.6 : 0.8} />
  }
  if (style.shape === "diamond") {
    return <path d={`M${point.x},${point.y - r} L${point.x + r},${point.y} L${point.x},${point.y + r} L${point.x - r},${point.y} Z`} fill={style.color} fillOpacity={active ? 0.96 : 0.74} stroke="#fff" strokeWidth={active ? 1.6 : 0.8} />
  }
  if (style.shape === "triangle") {
    return <path d={`M${point.x},${point.y - r - 1} L${point.x + r + 1},${point.y + r} L${point.x - r - 1},${point.y + r} Z`} fill={style.color} fillOpacity={active ? 0.96 : 0.74} stroke="#fff" strokeWidth={active ? 1.6 : 0.8} />
  }
  return <circle cx={point.x} cy={point.y} r={r} fill={style.color} fillOpacity={active ? 0.96 : 0.74} stroke="#fff" strokeWidth={active ? 1.6 : 0.8} />
}

export function GasParetoChart({ t, lang, isMobile }) {
  const rows = useMemo(() => buildGasParetoRows(), [])
  const summary = useMemo(() => summarizeGasParetoRows(rows), [rows])
  const pairOptions = useMemo(() => Object.keys(summary).sort((a, b) => (summary[b]?.total || 0) - (summary[a]?.total || 0)), [summary])
  const [activePair, setActivePair] = useState(pairOptions.includes("CO2/N2") ? "CO2/N2" : pairOptions[0])
  const [hover, setHover] = useState(null)
  const zh = lang === "zh"
  if (!rows.length || !activePair) return null

  const pairRows = rows.filter(row => row.gasPair === activePair)
  const frontier = buildParetoFrontier(pairRows)
  const activeSummary = summary[activePair] || { total: 0, byGrade: {} }
  const W = isMobile ? 420 : 720
  const H = isMobile ? 320 : 420
  const m = { left: 58, right: 22, top: 26, bottom: 52 }
  const maxX = niceMax(pairRows.map(row => row.workingCapacity))
  const yScale = buildLogSelectivityScale(pairRows)
  const xFor = value => m.left + (Number(value) / maxX) * (W - m.left - m.right)
  const yFor = value => H - m.bottom - ((log10(value) - yScale.logMin) / (yScale.logMax - yScale.logMin)) * (H - m.top - m.bottom)
  const projected = pairRows.map((row, index) => ({ ...row, x: xFor(row.workingCapacity), y: yFor(row.selectivity), index }))
  const frontierPath = frontier.map(row => `${xFor(row.workingCapacity)},${yFor(row.selectivity)}`).join(" ")
  const tickFractions = [0, 0.25, 0.5, 0.75, 1]
  const thin = pairRows.length < 10

  return (
    <section data-testid="home-gas-pareto" className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: t.shadowSm, display: "grid", gap: 13, minWidth: 0, padding: isMobile ? 16 : 22 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <div>
            <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, letterSpacing: 0, marginBottom: 6, textTransform: "uppercase" }}>
              {zh ? "气体分离权衡" : "Gas separation trade-off"}
            </div>
            <h3 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, fontWeight: 900, lineHeight: 1.24, margin: 0 }}>
              {zh ? "选择性 × 工作容量帕累托图" : "Selectivity × working-capacity Pareto"}
            </h3>
          </div>
          <span style={{ alignSelf: "start", background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 999, color: t.warn, fontSize: 10.5, fontWeight: 850, padding: "3px 9px" }}>
            {zh ? "Demo/数据库预览，非最终推荐" : "Demo/database preview, not final recommendation"}
          </span>
        </div>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>
          {zh
            ? `仅使用 gas_adsorption_records_v2 中同时具备选择性与工作容量的 ${rows.length} 个真实点；选择性轴用 log 刻度，避免极端选择性点压扁其它材料。`
            : `Uses only the ${rows.length} real gas_adsorption_records_v2 points that have both selectivity and working capacity; selectivity uses a log scale so extreme points do not flatten the rest.`}
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {pairOptions.map(pair => {
          const active = pair === activePair
          return (
            <button key={pair} type="button" onClick={() => setActivePair(pair)} style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 999, color: active ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 32, padding: "6px 11px" }}>
              {prettyGasPair(pair)} · {summary[pair].total}
            </button>
          )
        })}
      </div>

      <div style={{ color: thin ? t.warn : t.muted, fontSize: 12, fontWeight: thin ? 850 : 760, lineHeight: 1.55 }}>
        {zh
          ? `${prettyGasPair(activePair)}：${activeSummary.total} 个可绘制点（IAST ${activeSummary.byGrade.iast || 0} / 实验 ${activeSummary.byGrade.experimental || 0} / 计算 ${activeSummary.byGrade.computed || 0} / seed ${activeSummary.byGrade.seed || 0}）。${thin ? "该气对数据较薄，仅作预览。" : ""}`
          : `${prettyGasPair(activePair)}: ${activeSummary.total} plottable points (IAST ${activeSummary.byGrade.iast || 0} / experimental ${activeSummary.byGrade.experimental || 0} / computed ${activeSummary.byGrade.computed || 0} / seed ${activeSummary.byGrade.seed || 0}). ${thin ? "Thin gas-pair coverage; preview only." : ""}`}
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={zh ? "选择性与工作容量帕累托散点图" : "Selectivity and working capacity Pareto scatter"} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <rect x={m.left} y={m.top} width={W - m.left - m.right} height={H - m.top - m.bottom} rx="8" fill={t.chartBg || t.surface} stroke={t.border} />
          {tickFractions.map(f => (
            <g key={`x-${f}`}>
              <line x1={xFor(maxX * f)} x2={xFor(maxX * f)} y1={m.top} y2={H - m.bottom} stroke={t.divider || t.border} strokeDasharray={f === 0 ? "none" : "3 7"} />
              <text className="num" x={xFor(maxX * f)} y={H - m.bottom + 18} textAnchor="middle" fill={t.subtle} fontSize="10.5">{(maxX * f).toFixed(1)}</text>
            </g>
          ))}
          {yScale.ticks.map(value => (
            <g key={`y-${value}`}>
              <line x1={m.left} x2={W - m.right} y1={yFor(value)} y2={yFor(value)} stroke={t.divider || t.border} strokeDasharray={value === yScale.min ? "none" : "3 7"} />
              <text className="num" x={m.left - 9} y={yFor(value) + 4} textAnchor="end" fill={t.subtle} fontSize="10.5">{formatSelectivityTick(value)}</text>
            </g>
          ))}
          <text x={(W + m.left - m.right) / 2} y={H - 14} textAnchor="middle" fill={t.muted} fontSize="11.2" fontWeight="850">{zh ? "工作容量 (mmol/g)" : "Working capacity (mmol/g)"}</text>
          <text transform={`translate(16 ${(H - m.bottom + m.top) / 2}) rotate(-90)`} textAnchor="middle" fill={t.muted} fontSize="11.2" fontWeight="850">{zh ? "选择性（log）" : "Selectivity (log)"}</text>
          <text x={W - m.right - 6} y={m.top + 17} textAnchor="end" fill={t.accentText} fontSize="11" fontWeight="900">{zh ? "右上为优" : "Upper-right is better"}</text>

          {frontier.length > 1 ? <polyline points={frontierPath} fill="none" stroke={t.accentText} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {projected.map(point => {
            const active = hover?.id === point.id
            return (
              <g
                key={`${point.id}-${point.index}`}
                onPointerEnter={() => setHover(point)}
                onPointerDown={event => {
                  setHover(point)
                  event.stopPropagation()
                }}
                onPointerLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <Shape point={point} active={active} style={GRADE_STYLE[point.grade] || GRADE_STYLE.unknown} />
              </g>
            )
          })}
        </svg>

        {hover ? (
          <div style={{ background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 8, boxShadow: t.shadowSm, color: t.muted, fontSize: 11.5, left: 12, lineHeight: 1.5, maxWidth: 330, padding: "9px 11px", pointerEvents: "none", position: "absolute", top: 12, zIndex: 2 }}>
            <strong style={{ color: t.textStrong, display: "block" }}>{hover.mof}</strong>
            <span>{prettyGasPair(hover.gasPair)} · {hover.dataGrade}</span><br />
            <span className="num">{zh ? "工作容量" : "Working capacity"} {hover.workingCapacity.toFixed(2)} mmol/g · {zh ? "选择性" : "selectivity"} {hover.selectivity.toFixed(1)}</span><br />
            <span className="num">T {hover.temperatureK || "pending"} K · P_ads {hover.adsorptionPressureBar ?? "pending"} bar · P_des {hover.desorptionPressureBar ?? "pending"} bar</span><br />
            <span>{hover.doi || hover.sourceUrl}</span>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        {Object.entries(GRADE_STYLE).filter(([key]) => (activeSummary.byGrade[key] || 0) > 0).map(([key, style]) => (
          <span key={key} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 760, gap: 6 }}>
            <span style={{ background: style.color, borderRadius: style.shape === "square" ? 2 : 999, height: 10, transform: style.shape === "diamond" ? "rotate(45deg)" : "none", width: 10 }} />
            {zh ? style.labelZh : style.labelEn} <span className="num">{activeSummary.byGrade[key]}</span>
          </span>
        ))}
        <span className="num" style={{ color: t.faint, fontSize: 11 }}>{zh ? "帕累托前沿点" : "Pareto frontier points"}: {frontier.length}</span>
      </div>
    </section>
  )
}

export default GasParetoChart
