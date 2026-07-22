// @ts-nocheck
import { useMemo, useState } from "react"
import { buildDescriptorScatterPoints } from "./MofDescriptor3DScatter"

const EXPLORER_TARGET_COUNT = 2000

const METRIC_CONFIG = {
  surfaceArea: { zh: "比表面积", en: "Surface area", shortZh: "比表面", shortEn: "SA", unit: "m²/g", digits: 0 },
  poreVolume: { zh: "孔体积", en: "Pore volume", shortZh: "孔体积", shortEn: "PV", unit: "cm³/g", digits: 2 },
  voidFraction: { zh: "孔隙率", en: "Porosity", shortZh: "孔隙率", shortEn: "Por.", unit: "", digits: 2 },
  density: { zh: "密度", en: "Density", shortZh: "密度", shortEn: "Dens.", unit: "g/cm³", digits: 2 },
}

const METRIC_KEYS = Object.keys(METRIC_CONFIG)
const BAR_COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#be123c", "#64748b"]

function label(metric, lang) {
  const config = METRIC_CONFIG[metric]
  return config ? (lang === "zh" ? config.zh : config.en) : metric
}

function shortLabel(metric, lang) {
  const config = METRIC_CONFIG[metric]
  return config ? (lang === "zh" ? config.shortZh : config.shortEn) : metric
}

function finite(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatNumber(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  if (Math.abs(number) >= 1000) return number.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return number.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function extent(values) {
  const nums = values.map(finite).filter(value => value !== null)
  if (!nums.length) return { min: 0, max: 1, span: 1 }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return { min, max, span: max - min || 1 }
}

function pearson(rows, aKey, bKey) {
  const pairs = rows
    .map(row => [finite(row[aKey]), finite(row[bKey])])
    .filter(([a, b]) => a !== null && b !== null)
  if (pairs.length < 3) return null
  const aMean = pairs.reduce((sum, [a]) => sum + a, 0) / pairs.length
  const bMean = pairs.reduce((sum, [, b]) => sum + b, 0) / pairs.length
  let numerator = 0
  let aSq = 0
  let bSq = 0
  pairs.forEach(([a, b]) => {
    const da = a - aMean
    const db = b - bMean
    numerator += da * db
    aSq += da * da
    bSq += db * db
  })
  const denominator = Math.sqrt(aSq * bSq)
  return denominator ? numerator / denominator : null
}

function buildHistogram(rows, metric, bins = 9) {
  const values = rows.map(row => finite(row[metric])).filter(value => value !== null)
  const e = extent(values)
  const buckets = Array.from({ length: bins }, (_, index) => {
    const start = e.min + e.span * (index / bins)
    const end = e.min + e.span * ((index + 1) / bins)
    return { index, start, end, count: 0 }
  })
  values.forEach(value => {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - e.min) / e.span) * bins)))
    buckets[index].count += 1
  })
  return buckets
}

function buildMetalCounts(rows) {
  const counts = rows.reduce((acc, row) => {
    const metal = row.metal || "unknown"
    acc[metal] = (acc[metal] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([metal, count]) => ({ metal, count }))
    .sort((a, b) => b.count - a.count || a.metal.localeCompare(b.metal))
}

function summarizeRows(rows) {
  return METRIC_KEYS.map(metric => {
    const values = rows.map(row => finite(row[metric])).filter(value => value !== null)
    const e = extent(values)
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    return { metric, count: values.length, min: e.min, max: e.max, mean }
  })
}

function buildCorrelationPairs(correlations = []) {
  return METRIC_KEYS.flatMap((rowMetric, rowIndex) => (
    METRIC_KEYS.slice(rowIndex + 1).map(colMetric => {
      const item = correlations.find(row => row.rowMetric === rowMetric && row.colMetric === colMetric)
      return item ? { ...item, key: `${rowMetric}:${colMetric}`, abs: item.value === null ? 0 : Math.abs(item.value) } : null
    }).filter(Boolean)
  )).sort((a, b) => b.abs - a.abs || a.key.localeCompare(b.key))
}

function correlationTone(value, t) {
  if (value === null) return t.borderStrong || "#94a3b8"
  if (value >= 0) return t.accentText || "#2563eb"
  return t.warn || "#d97706"
}

function correlationFill(value, isDiag, active, t) {
  if (value === null || value === undefined) return t.surface
  if (isDiag) return active ? t.badgeInfoBg : t.panel
  const abs = Math.min(1, Math.abs(value))
  const alpha = active ? 0.92 : 0.2 + abs * 0.62
  if (value >= 0) return `rgba(37, 99, 235, ${alpha})`
  return `rgba(217, 119, 6, ${alpha})`
}

function correlationStrength(value, lang) {
  if (value === null) return lang === "zh" ? "无足够样本" : "insufficient n"
  const abs = Math.abs(value)
  if (abs >= 0.7) return lang === "zh" ? "强相关" : "strong"
  if (abs >= 0.35) return lang === "zh" ? "中等相关" : "moderate"
  return lang === "zh" ? "弱相关" : "weak"
}

export function buildHomeExplorerModel(rows = buildDescriptorScatterPoints(EXPLORER_TARGET_COUNT), activeMetal = "all", distributionMetric = "surfaceArea") {
  const sourceRows = Array.isArray(rows) ? rows : []
  const metalCounts = buildMetalCounts(sourceRows)
  const filteredRows = activeMetal === "all" ? sourceRows : sourceRows.filter(row => row.metal === activeMetal)
  const metric = METRIC_CONFIG[distributionMetric] ? distributionMetric : "surfaceArea"
  const correlations = METRIC_KEYS.flatMap(rowMetric => METRIC_KEYS.map(colMetric => ({
    rowMetric,
    colMetric,
    value: rowMetric === colMetric ? 1 : pearson(filteredRows, rowMetric, colMetric),
    n: filteredRows.filter(row => finite(row[rowMetric]) !== null && finite(row[colMetric]) !== null).length,
  })))
  return {
    rows: sourceRows,
    filteredRows,
    metalCounts,
    selectedMetalCount: filteredRows.length,
    histogram: buildHistogram(filteredRows, metric),
    distributionMetric: metric,
    summaries: summarizeRows(filteredRows),
    correlations,
  }
}

function ChartShell({ title, subtitle, t, children, badge }) {
  return (
    <article style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 10, minWidth: 0, overflow: "hidden", padding: 14 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, lineHeight: 1.25, margin: 0 }}>{title}</h3>
          <p style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.5, margin: "5px 0 0" }}>{subtitle}</p>
        </div>
        {badge ? <span style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 999, color: t.accentText, flex: "0 0 auto", fontSize: 10.5, fontWeight: 850, padding: "3px 8px" }}>{badge}</span> : null}
      </div>
      {children}
    </article>
  )
}

function HistogramChart({ model, metric, activeBin, setActiveBin, t, lang, isMobile }) {
  const [hoverBin, setHoverBin] = useState(null)
  const W = isMobile ? 430 : 640
  const H = 260
  const m = { left: 46, right: 18, top: 18, bottom: 44 }
  const rows = model.histogram
  const maxCount = Math.max(1, ...rows.map(row => row.count))
  const config = METRIC_CONFIG[metric]
  const barW = (W - m.left - m.right) / rows.length
  const focus = hoverBin ?? activeBin
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === "zh" ? "描述符统计分布直方图" : "Descriptor distribution histogram"} data-testid="home-stat-distribution" style={{ width: "100%", height: "auto" }}>
        <rect x={m.left} y={m.top} width={W - m.left - m.right} height={H - m.top - m.bottom} rx="8" fill={t.chartBg || t.surface} stroke={t.border} />
        {[0, 0.5, 1].map(frac => {
          const y = H - m.bottom - frac * (H - m.top - m.bottom)
          return (
            <g key={frac}>
              <line x1={m.left} x2={W - m.right} y1={y} y2={y} stroke={t.divider || t.border} strokeDasharray={frac ? "3 7" : "none"} />
              <text className="num" x={m.left - 9} y={y + 4} textAnchor="end" fill={t.subtle} fontSize="10.5">{Math.round(maxCount * frac)}</text>
            </g>
          )
        })}
        {rows.map((row, index) => {
          const barH = (row.count / maxCount) * (H - m.top - m.bottom - 12)
          const x = m.left + index * barW + 4
          const y = H - m.bottom - barH
          const active = focus === row.index
          return (
            <g key={row.index} onPointerEnter={() => setHoverBin(row.index)} onPointerLeave={() => setHoverBin(null)} onClick={() => setActiveBin(activeBin === row.index ? null : row.index)} style={{ cursor: "pointer" }}>
              <rect x={x} y={y} width={Math.max(8, barW - 8)} height={barH} rx="5" fill={active ? t.accentText : BAR_COLORS[index % BAR_COLORS.length]} fillOpacity={active ? 0.95 : 0.72} />
              <text className="num" x={x + Math.max(8, barW - 8) / 2} y={H - m.bottom + 17} textAnchor="middle" fill={t.subtle} fontSize="9.8">{formatNumber(row.start, config.digits)}</text>
            </g>
          )
        })}
        <text x={m.left + (W - m.left - m.right) / 2} y={H - 9} textAnchor="middle" fill={t.muted} fontSize="11" fontWeight="850">{label(metric, lang)}{config.unit ? ` (${config.unit})` : ""}</text>
      </svg>
      {focus !== null && rows[focus] ? (
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
          {lang === "zh" ? "选中区间" : "Selected bin"}: <span className="num">{formatNumber(rows[focus].start, config.digits)} - {formatNumber(rows[focus].end, config.digits)}</span> · {lang === "zh" ? "记录" : "records"} <span className="num">{rows[focus].count}</span>
        </div>
      ) : null}
    </div>
  )
}

function MetalFilterChart({ model, activeMetal, setActiveMetal, t, lang, isMobile }) {
  const [hoverMetal, setHoverMetal] = useState(null)
  const rows = model.metalCounts.slice(0, isMobile ? 8 : 12)
  const W = isMobile ? 430 : 520
  const H = 260
  const m = { left: 38, right: 14, top: 18, bottom: 44 }
  const maxCount = Math.max(1, ...rows.map(row => row.count))
  const barW = (W - m.left - m.right) / rows.length
  const focus = hoverMetal || activeMetal
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === "zh" ? "金属节点筛选柱状图" : "Metal-node filter bar chart"} data-testid="home-metal-filter-chart" style={{ width: "100%", height: "auto" }}>
      <rect x={m.left} y={m.top} width={W - m.left - m.right} height={H - m.top - m.bottom} rx="8" fill={t.chartBg || t.surface} stroke={t.border} />
      {rows.map((row, index) => {
        const barH = (row.count / maxCount) * (H - m.top - m.bottom - 14)
        const x = m.left + index * barW + 5
        const y = H - m.bottom - barH
        const active = focus === row.metal
        return (
          <g key={row.metal} onPointerEnter={() => setHoverMetal(row.metal)} onPointerLeave={() => setHoverMetal(null)} onClick={() => setActiveMetal(activeMetal === row.metal ? "all" : row.metal)} style={{ cursor: "pointer" }}>
            <rect x={x} y={y} width={Math.max(9, barW - 10)} height={barH} rx="5" fill={active ? t.accentText : BAR_COLORS[index % BAR_COLORS.length]} fillOpacity={active ? 0.96 : 0.68} />
            <text className="num" x={x + Math.max(9, barW - 10) / 2} y={y - 6} textAnchor="middle" fill={active ? t.textStrong : t.subtle} fontSize="10.2" fontWeight={active ? "900" : "760"}>{row.count}</text>
            <text x={x + Math.max(9, barW - 10) / 2} y={H - m.bottom + 17} textAnchor="middle" fill={active ? t.accentText : t.subtle} fontSize="10.5" fontWeight="850">{row.metal}</text>
          </g>
        )
      })}
    </svg>
  )
}

function CorrelationMatrix({ model, activeCell, setActiveCell, t, lang, isMobile }) {
  const [hoverCell, setHoverCell] = useState(null)
  const pairs = buildCorrelationPairs(model.correlations)
  const focusKey = hoverCell || activeCell || pairs[0]?.key
  const focus = pairs.find(item => item.key === focusKey) || pairs[0] || null
  const cell = isMobile ? 54 : 62
  const left = isMobile ? 72 : 82
  const top = 34
  const W = left + cell * METRIC_KEYS.length + 18
  const H = top + cell * METRIC_KEYS.length + 48
  const pairKey = (a, b) => {
    const aIndex = METRIC_KEYS.indexOf(a)
    const bIndex = METRIC_KEYS.indexOf(b)
    return aIndex <= bIndex ? `${a}:${b}` : `${b}:${a}`
  }
  const cellDatum = (rowMetric, colMetric) => (
    model.correlations.find(row => row.rowMetric === rowMetric && row.colMetric === colMetric) || { rowMetric, colMetric, value: null, n: 0 }
  )
  return (
    <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 185px", alignItems: "start" }}>
      <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === "zh" ? "描述符 Pearson 相关矩阵" : "Descriptor Pearson correlation matrix"} data-testid="home-correlation-matrix" style={{ width: "100%", maxWidth: isMobile ? 390 : 430, height: "auto", justifySelf: "center" }}>
          <rect x="4" y="4" width={W - 8} height={H - 8} rx="10" fill={t.chartBg || t.surface} stroke={t.border} />
          {METRIC_KEYS.map((metric, index) => (
            <text key={`top-${metric}`} x={left + index * cell + cell / 2} y={top - 10} textAnchor="middle" fill={t.faint} fontSize="10.5" fontWeight="900">{shortLabel(metric, lang)}</text>
          ))}
          {METRIC_KEYS.map((metric, rowIndex) => (
            <text key={`left-${metric}`} x={left - 10} y={top + rowIndex * cell + cell / 2 + 4} textAnchor="end" fill={t.faint} fontSize="10.5" fontWeight="900">{shortLabel(metric, lang)}</text>
          ))}
          {METRIC_KEYS.flatMap((rowMetric, rowIndex) => (
            METRIC_KEYS.map((colMetric, colIndex) => {
              const item = cellDatum(rowMetric, colMetric)
              const isDiag = rowMetric === colMetric
              const key = isDiag ? `${rowMetric}:${colMetric}` : pairKey(rowMetric, colMetric)
              const active = focus?.key === key
              const value = item.value
              const x = left + colIndex * cell + 2.5
              const y = top + rowIndex * cell + 2.5
              const abs = value === null ? 0 : Math.abs(value)
              return (
                <g key={`${rowMetric}-${colMetric}`} onPointerEnter={() => !isDiag && setHoverCell(key)} onPointerLeave={() => setHoverCell(null)} onClick={() => !isDiag && setActiveCell(activeCell === key ? null : key)} style={{ cursor: isDiag ? "default" : "pointer" }}>
                  <rect
                    x={x}
                    y={y}
                    width={cell - 5}
                    height={cell - 5}
                    rx="7"
                    fill={correlationFill(value, isDiag, active, t)}
                    stroke={active ? t.textStrong : t.border}
                    strokeWidth={active ? 1.8 : 1}
                  />
                  {!isDiag && abs < 0.08 ? (
                    <line x1={x + 9} x2={x + cell - 14} y1={y + cell / 2 - 2.5} y2={y + cell / 2 - 2.5} stroke={t.borderStrong} strokeWidth="1.2" strokeLinecap="round" />
                  ) : null}
                  <text className="num" x={x + (cell - 5) / 2} y={y + (cell - 5) / 2 + 4} textAnchor="middle" fill={!isDiag && abs > 0.58 ? "#fff" : t.textStrong} fontSize={isMobile ? "10.2" : "11"} fontWeight="900">
                    {value === null ? "NA" : value.toFixed(isDiag ? 0 : 2)}
                  </text>
                  <title>{`${label(rowMetric, lang)} / ${label(colMetric, lang)}: r=${value === null ? "NA" : value.toFixed(3)} · n=${item.n}`}</title>
                </g>
              )
            })
          ))}
          <text x={left} y={H - 18} fill={t.faint} fontSize="10.5" fontWeight="850">{lang === "zh" ? "负相关" : "negative"}</text>
          <rect x={left + 50} y={H - 27} width="34" height="9" rx="4" fill="rgba(217, 119, 6, 0.66)" />
          <rect x={left + 90} y={H - 27} width="34" height="9" rx="4" fill={t.panel} stroke={t.border} />
          <rect x={left + 130} y={H - 27} width="34" height="9" rx="4" fill="rgba(37, 99, 235, 0.66)" />
          <text x={left + 172} y={H - 18} fill={t.faint} fontSize="10.5" fontWeight="850">{lang === "zh" ? "正相关" : "positive"}</text>
        </svg>
        {focus ? (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.5, lineHeight: 1.55, padding: "8px 10px" }}>
            <strong style={{ color: t.textStrong }}>{label(focus.rowMetric, lang)} / {label(focus.colMetric, lang)}</strong>
            {" "}Pearson r=<span className="num">{focus.value === null ? "NA" : focus.value.toFixed(3)}</span> · n=<span className="num">{focus.n}</span> · {correlationStrength(focus.value, lang)}
          </div>
        ) : null}
      </div>
      {focus ? (
        <div style={{ display: "grid", gap: 7, alignContent: "start", minWidth: 0 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.2, lineHeight: 1.3 }}>{lang === "zh" ? "按 |r| 排序" : "Ranked by |r|"}</strong>
          {pairs.slice(0, 6).map(item => {
          const active = focus?.key === item.key
          return (
            <button key={item.key} type="button" onPointerEnter={() => setHoverCell(item.key)} onPointerLeave={() => setHoverCell(null)} onClick={() => setActiveCell(activeCell === item.key ? null : item.key)} style={{ alignItems: "center", background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accentText : t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", display: "grid", gap: 6, minHeight: 36, padding: "7px 9px", textAlign: "left" }}>
              <span style={{ color: active ? t.accentText : t.muted, fontSize: 11.2, fontWeight: 850 }}>{shortLabel(item.rowMetric, lang)} / {shortLabel(item.colMetric, lang)} · n={item.n}</span>
              <span style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 1fr) 42px" }}>
                <span style={{ background: t.panel, borderRadius: 999, height: 7, overflow: "hidden" }}>
                  <span style={{ background: correlationTone(item.value, t), display: "block", height: "100%", width: `${Math.max(6, item.abs * 100)}%` }} />
                </span>
                <span className="num" style={{ color: t.subtle, fontSize: 11, textAlign: "right" }}>{item.value === null ? "NA" : item.value.toFixed(2)}</span>
              </span>
            </button>
          )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function HomeDataExplorer({ t, lang, isMobile }) {
  const zh = lang === "zh"
  const allRows = useMemo(() => buildDescriptorScatterPoints(EXPLORER_TARGET_COUNT), [])
  const [activeMetal, setActiveMetal] = useState("all")
  const [distributionMetric, setDistributionMetric] = useState("surfaceArea")
  const [activeBin, setActiveBin] = useState(null)
  const [activeCell, setActiveCell] = useState(null)
  const model = useMemo(() => buildHomeExplorerModel(allRows, activeMetal, distributionMetric), [allRows, activeMetal, distributionMetric])
  const metalOptions = model.metalCounts.slice(0, isMobile ? 8 : 12)
  if (!allRows.length) return null

  return (
    <section data-testid="home-data-explorer" style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <header style={{ alignItems: "end", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, letterSpacing: 0, marginBottom: 5, textTransform: "uppercase" }}>
            {zh ? "真实数据探索层" : "Real-data explorer"}
          </div>
          <h3 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, fontWeight: 900, lineHeight: 1.24, margin: 0 }}>
            {zh ? "分布、金属筛选与描述符相关性" : "Distribution, metal filtering, and descriptor correlation"}
          </h3>
          <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: "7px 0 0", maxWidth: 820 }}>
            {zh
              ? `所有图表均由 ${allRows.length} 条具备完整结构描述符的 CoRE/QMOF 记录动态派生；点击金属或区间会联动筛选与解释。`
              : `All charts are dynamically derived from ${allRows.length} CoRE/QMOF records with complete structural descriptors; click metals or bins to update the linked view.`}
          </p>
        </div>
        <span style={{ background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 999, color: t.accentText, fontSize: 10.5, fontWeight: 850, padding: "4px 10px" }}>
          {activeMetal === "all" ? (zh ? "全部金属" : "All metals") : `${activeMetal} · ${model.selectedMetalCount}`}
        </span>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" onClick={() => setActiveMetal("all")} style={{ background: activeMetal === "all" ? t.badgeInfoBg : t.surface, border: `1px solid ${activeMetal === "all" ? t.accent : t.border}`, borderRadius: 999, color: activeMetal === "all" ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.3, fontWeight: 850, minHeight: 31, padding: "6px 10px" }}>
          {zh ? "全部" : "All"} · {allRows.length}
        </button>
        {metalOptions.map(item => (
          <button key={item.metal} type="button" onClick={() => setActiveMetal(item.metal)} style={{ background: activeMetal === item.metal ? t.badgeInfoBg : t.surface, border: `1px solid ${activeMetal === item.metal ? t.accent : t.border}`, borderRadius: 999, color: activeMetal === item.metal ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.3, fontWeight: 850, minHeight: 31, padding: "6px 10px" }}>
            {item.metal} · {item.count}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {METRIC_KEYS.map(metric => {
          const active = distributionMetric === metric
          return (
            <button key={metric} type="button" onClick={() => { setDistributionMetric(metric); setActiveBin(null) }} style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 999, color: active ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.3, fontWeight: 850, minHeight: 31, padding: "6px 10px" }}>
              {label(metric, lang)}
            </button>
          )
        })}
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.08fr) minmax(280px, 0.92fr)" }}>
        <ChartShell
          title={zh ? "统计分布" : "Statistical distribution"}
          subtitle={zh ? "按当前金属筛选后重建直方图；点击柱子锁定区间。" : "Histogram rebuilds after the current metal filter; click a bar to lock the bin."}
          badge={`${model.selectedMetalCount} rows`}
          t={t}
        >
          <HistogramChart model={model} metric={distributionMetric} activeBin={activeBin} setActiveBin={setActiveBin} t={t} lang={lang} isMobile={isMobile} />
        </ChartShell>

        <ChartShell
          title={zh ? "金属筛选" : "Metal filter"}
          subtitle={zh ? "柱高来自可绘制结构记录数；点击柱子切换金属子集。" : "Bar height is the plottable structure-record count; click a bar to filter the subset."}
          badge={`${model.metalCounts.length} metals`}
          t={t}
        >
          <MetalFilterChart model={model} activeMetal={activeMetal} setActiveMetal={setActiveMetal} t={t} lang={lang} isMobile={isMobile} />
        </ChartShell>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "minmax(320px, 0.78fr) minmax(0, 1fr)" }}>
        <ChartShell
          title={zh ? "相关性图" : "Correlation map"}
          subtitle={zh ? "Pearson r 基于当前筛选行实时计算；色阶表示正/负相关与强度，点击单元格查看样本数。" : "Pearson r is recomputed from the current filtered rows; color encodes sign and strength, and each cell exposes sample size."}
          badge={activeMetal === "all" ? "global" : activeMetal}
          t={t}
        >
          <CorrelationMatrix model={model} activeCell={activeCell} setActiveCell={setActiveCell} t={t} lang={lang} isMobile={isMobile} />
        </ChartShell>

        <div style={{ alignContent: "start", display: "grid", gap: 8 }}>
          {model.summaries.map(summary => {
            const config = METRIC_CONFIG[summary.metric]
            return (
              <div key={summary.metric} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "150px repeat(3, minmax(0, 1fr))", minWidth: 0, padding: "9px 11px" }}>
                <strong style={{ color: t.textStrong, fontSize: 12.2 }}>{label(summary.metric, lang)}</strong>
                <span className="num" style={{ color: t.muted, fontSize: 11 }}>{zh ? "均值" : "mean"} {formatNumber(summary.mean, config.digits)} {config.unit}</span>
                <span className="num" style={{ color: t.muted, fontSize: 11 }}>{zh ? "最小" : "min"} {formatNumber(summary.min, config.digits)}</span>
                <span className="num" style={{ color: t.muted, fontSize: 11 }}>{zh ? "最大" : "max"} {formatNumber(summary.max, config.digits)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeDataExplorer
