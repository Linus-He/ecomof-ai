// @ts-nocheck
// Self-contained interactive descriptor scatter from the active CoRE MOF 2024
// CSD-modified CR import.
// Desktop: drag to rotate, wheel to zoom, hover for details.
// Mobile: keeps the same interactive 3D projection with a tighter viewport.
import { useMemo, useRef, useState } from "react"
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import { getReadableMofLabel } from "../../utils/mofDisplayName"

const TARGET_POINT_COUNT = 240

const METAL_COLORS = {
  Zr: "#2563eb",
  Cu: "#dc2626",
  Zn: "#16a34a",
  Mg: "#9333ea",
  Co: "#ea580c",
  Ni: "#0891b2",
  Fe: "#b45309",
  Al: "#4f46e5",
  Mn: "#db2777",
}

const GRADE_COLORS = {
  database_distribution: "#2563eb",
  external_database: "#16a34a",
  source_confirmed: "#0891b2",
  unverified: "#b45309",
}

const FALLBACK_COLOR = "#64748b"

function rowsFrom(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.records || payload?.candidates || payload?.rows || []
}

function hasNum(value) {
  return value !== null && value !== "" && value !== undefined && Number.isFinite(Number(value))
}

function axisExtent(values) {
  const nums = values.filter(value => Number.isFinite(value))
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return { min, max, span: max - min || 1 }
}

function norm01(value, extent) {
  return (value - extent.min) / extent.span
}

function norm(value, extent) {
  return norm01(value, extent) - 0.5
}

function formatCompact(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "pending"
  if (Math.abs(number) >= 1000) return number.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return number.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function deterministicSample(rows, target = TARGET_POINT_COUNT) {
  if (rows.length <= target) return rows
  const selected = []
  const step = rows.length / target
  for (let i = 0; i < target; i += 1) {
    selected.push(rows[Math.min(rows.length - 1, Math.floor(i * step))])
  }
  return selected
}

function jitter(index, axis) {
  const seed = Math.sin((index + 1) * (axis === "x" ? 12.9898 : axis === "y" ? 78.233 : 37.719)) * 43758.5453
  return (seed - Math.floor(seed) - 0.5) * 0.018
}

function colorForMetal(metal) {
  return METAL_COLORS[String(metal || "").trim()] || FALLBACK_COLOR
}

function colorForGrade(grade) {
  return GRADE_COLORS[String(grade || "").trim()] || FALLBACK_COLOR
}

function isDarkTheme(theme) {
  const hex = String(theme?.bg || "").trim().replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(hex)) return false
  const [r, g, b] = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  const linear = value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < 0.22
}

export function buildDescriptorScatterPoints(target = TARGET_POINT_COUNT) {
  const sourceRows = rowsFrom(coreMofImport).map(row => ({ ...row, _sourceFamily: "CoRE MOF" }))
  const fullAxisRows = sourceRows
    .filter(row => hasNum(row.surfaceArea) && hasNum(row.poreVolume) && hasNum(row.voidFraction))
    .sort((a, b) => String(a.mofId || a.sourceRecordId).localeCompare(String(b.mofId || b.sourceRecordId)))
  return deterministicSample(fullAxisRows, target).map((row, index) => ({
    id: row.mofId || row.sourceRecordId || `mof-${index}`,
    name: getReadableMofLabel(row, "en"),
    source: row.sourceDatabase || row._sourceFamily || "CoRE MOF 2024 CR",
    sourceRecordId: row.sourceRecordId || "pending",
    metal: row.metalNode && row.metalNode !== "pending" ? row.metalNode : "unknown",
    topology: row.topology || "pending",
    dataGrade: row.dataGrade || row.valueBasis || row.datasetOrigin || (row.provenanceConfirmed ? "source_confirmed" : "unverified"),
    surfaceArea: Number(row.surfaceArea),
    poreVolume: Number(row.poreVolume),
    voidFraction: Number(row.voidFraction),
    density: hasNum(row.density) ? Number(row.density) : null,
  }))
}

function rotate(p, yaw, pitch) {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const x1 = p.x * cosY + p.z * sinY
  const z1 = -p.x * sinY + p.z * cosY
  const y2 = p.y * cosP - z1 * sinP
  const z2 = p.y * sinP + z1 * cosP
  return { x: x1, y: y2, depth: z2 }
}

const CUBE_CORNERS = [
  { x: -0.5, y: -0.5, z: -0.5 },
  { x: 0.5, y: -0.5, z: -0.5 },
  { x: -0.5, y: 0.5, z: -0.5 },
  { x: 0.5, y: 0.5, z: -0.5 },
  { x: -0.5, y: -0.5, z: 0.5 },
  { x: 0.5, y: -0.5, z: 0.5 },
  { x: -0.5, y: 0.5, z: 0.5 },
  { x: 0.5, y: 0.5, z: 0.5 },
]

const CUBE_EDGES = [
  [0, 1], [0, 2], [1, 3], [2, 3],
  [4, 5], [4, 6], [5, 7], [6, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

function lerpCoord(from, to, ratio) {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    z: from.z + (to.z - from.z) * ratio,
  }
}

function AxisRangeLegend({ extents, t, lang, isMobile }) {
  const zh = lang === "zh"
  const rows = [
    { key: "surfaceArea", label: zh ? "比表面积" : "Surface area", unit: "m²/g" },
    { key: "poreVolume", label: zh ? "孔体积" : "Pore volume", unit: "cm³/g" },
    { key: "voidFraction", label: zh ? "孔隙率" : "Porosity", unit: "" },
  ]
  return (
    <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
      {rows.map(row => {
        const e = extents[row.key]
        const mid = e.min + e.span / 2
        return (
          <div key={row.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: "7px 9px" }}>
            <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 850 }}>{row.label}</div>
            <div className="num" style={{ color: t.muted, display: "flex", fontSize: 10.5, gap: 6, justifyContent: "space-between", marginTop: 4 }}>
              <span>{formatCompact(e.min)} {row.unit}</span>
              <span>{formatCompact(mid)} {row.unit}</span>
              <span>{formatCompact(e.max)} {row.unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Scatter3D({ points, t, lang, colorMode, setColorMode, isMobile = false }) {
  const [yaw, setYaw] = useState(-0.72)
  const [pitch, setPitch] = useState(0.44)
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState(null)
  const drag = useRef(null)
  const W = isMobile ? 560 : 720
  const H = isMobile ? 430 : 500
  const MARGIN = isMobile ? 72 : 86
  const zh = lang === "zh"

  const extents = useMemo(() => ({
    surfaceArea: axisExtent(points.map(p => p.surfaceArea)),
    poreVolume: axisExtent(points.map(p => p.poreVolume)),
    voidFraction: axisExtent(points.map(p => p.voidFraction)),
    density: axisExtent(points.map(p => p.density).filter(value => value !== null)),
  }), [points])

  const cx = W / 2
  const cy = H / 2
  const projection = useMemo(() => {
    const rotated = CUBE_CORNERS.map(corner => rotate(corner, yaw, pitch))
    const minX = Math.min(...rotated.map(p => p.x))
    const maxX = Math.max(...rotated.map(p => p.x))
    const minY = Math.min(...rotated.map(p => p.y))
    const maxY = Math.max(...rotated.map(p => p.y))
    const scale = Math.min((W - 2 * MARGIN) / (maxX - minX || 1), (H - 2 * MARGIN) / (maxY - minY || 1)) * zoom
    return {
      corners: rotated.map(p => ({ ...p, sx: cx + p.x * scale, sy: cy - p.y * scale })),
      project: (coord) => {
        const r = rotate(coord, yaw, pitch)
        return { ...r, sx: cx + r.x * scale, sy: cy - r.y * scale }
      },
    }
  }, [yaw, pitch, zoom])

  const projected = useMemo(() => points.map((p, index) => {
    const coord = {
      x: norm(p.surfaceArea, extents.surfaceArea) + jitter(index, "x"),
      y: norm(p.poreVolume, extents.poreVolume) + jitter(index, "y"),
      z: norm(p.voidFraction, extents.voidFraction) + jitter(index, "z"),
    }
    return {
      ...p,
      index,
      size: 3.5 + (p.density == null ? 0.45 : (1 - norm01(p.density, extents.density)) * 3.2),
      ...projection.project(coord),
    }
  }).sort((a, b) => a.depth - b.depth), [points, extents, projection])

  const axes = useMemo(() => ([
    {
      key: "surfaceArea",
      label: zh ? "比表面积" : "Surface area",
      unit: "m²/g",
      color: t.accentText,
      from: { x: -0.5, y: -0.5, z: -0.5 },
      to: { x: 0.5, y: -0.5, z: -0.5 },
      labelOffset: { x: -18, y: 28 },
      tickOffset: { x: 0, y: 17 },
    },
    {
      key: "poreVolume",
      label: zh ? "孔体积" : "Pore volume",
      unit: "cm³/g",
      color: t.warn,
      from: { x: -0.5, y: -0.5, z: -0.5 },
      to: { x: -0.5, y: 0.5, z: -0.5 },
      labelOffset: { x: -56, y: -16 },
      tickOffset: { x: -34, y: 3 },
    },
    {
      key: "voidFraction",
      label: zh ? "孔隙率" : "Porosity",
      unit: "",
      color: t.success || t.accentText,
      from: { x: -0.5, y: -0.5, z: -0.5 },
      to: { x: -0.5, y: -0.5, z: 0.5 },
      labelOffset: { x: 22, y: -28 },
      tickOffset: { x: 18, y: -8 },
    },
  ]), [zh, t])

  const onPointerDown = event => {
    drag.current = { x: event.clientX, y: event.clientY, yaw, pitch }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = event => {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    setYaw(drag.current.yaw + dx * 0.01)
    setPitch(Math.max(-1.3, Math.min(1.3, drag.current.pitch + dy * 0.01)))
  }
  const onPointerUp = () => { drag.current = null }
  const onWheel = event => {
    event.preventDefault()
    setZoom(z => Math.max(0.68, Math.min(2.25, z - event.deltaY * 0.0012)))
  }

  const legendItems = useMemo(() => {
    const values = [...new Set(points.map(p => colorMode === "metal" ? p.metal : p.dataGrade))].slice(0, 12)
    return values.map(value => ({ value, color: colorMode === "metal" ? colorForMetal(value) : colorForGrade(value) }))
  }, [points, colorMode])

  return (
    <div style={{ display: "grid", gap: 10, minWidth: 0, position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {[
          ["metal", zh ? "按金属节点" : "Metal node"],
          ["grade", zh ? "按 dataGrade" : "dataGrade"],
        ].map(([mode, label]) => {
          const active = colorMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setColorMode(mode)}
              style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 999, color: active ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.2, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={zh ? "MOF 描述符 3D 散点图" : "MOF descriptor 3D scatter"}
        style={{ width: "100%", height: "auto", overflow: "visible", touchAction: "none", cursor: drag.current ? "grabbing" : "grab", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <rect x={42} y={22} width={W - 84} height={H - 60} rx="12" fill={t.chartBg || t.surface} stroke={t.border} opacity="0.42" />
        {CUBE_EDGES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={projection.corners[a].sx}
            y1={projection.corners[a].sy}
            x2={projection.corners[b].sx}
            y2={projection.corners[b].sy}
            stroke={t.border}
            strokeWidth="1.2"
            strokeDasharray={a < 4 && b < 4 ? "none" : "4 7"}
          />
        ))}

        {axes.map(axis => {
          const start = projection.project(axis.from)
          const end = projection.project(axis.to)
          const extent = extents[axis.key]
          return (
            <g key={axis.key}>
              <line x1={start.sx} y1={start.sy} x2={end.sx} y2={end.sy} stroke={axis.color} strokeWidth="2.2" strokeLinecap="round" />
              {[0, 0.5, 1].map(ratio => {
                const tick = projection.project(lerpCoord(axis.from, axis.to, ratio))
                const value = extent.min + extent.span * ratio
                return (
                  <g key={`${axis.key}-${ratio}`}>
                    <circle cx={tick.sx} cy={tick.sy} r="2.2" fill={axis.color} />
                    <text className="num" x={tick.sx + axis.tickOffset.x} y={tick.sy + axis.tickOffset.y} textAnchor={axis.tickOffset.x < 0 ? "end" : "middle"} fill={t.subtle} fontSize="9.8" fontWeight="760">
                      {formatCompact(value, axis.key === "voidFraction" ? 2 : axis.key === "poreVolume" ? 2 : 0)}
                    </text>
                  </g>
                )
              })}
              <text x={end.sx + (isMobile ? axis.labelOffset.x * 0.68 : axis.labelOffset.x)} y={end.sy + (isMobile ? axis.labelOffset.y * 0.75 : axis.labelOffset.y)} textAnchor={axis.labelOffset.x < 0 ? "end" : "start"} fill={axis.color} fontSize={isMobile ? "10.2" : "11.2"} fontWeight="900">
                {axis.label}{axis.unit ? ` (${axis.unit})` : ""}
              </text>
            </g>
          )
        })}

        {projected.map(p => {
          const active = hover?.index === p.index
          const fill = colorMode === "metal" ? colorForMetal(p.metal) : colorForGrade(p.dataGrade)
          return (
            <circle
              key={p.id}
              cx={p.sx}
              cy={p.sy}
              r={active ? p.size + 2.5 : p.size}
              fill={fill}
              fillOpacity={active ? 0.96 : 0.66}
              stroke={active ? t.textStrong : "#ffffff"}
              strokeWidth={active ? 1.7 : 0.65}
              onPointerEnter={() => setHover(p)}
              onPointerDown={event => {
                setHover(p)
                event.stopPropagation()
              }}
              onPointerLeave={() => setHover(null)}
            />
          )
        })}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {legendItems.map(item => (
          <span key={item.value} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 760, gap: 5 }}>
            <span style={{ background: item.color, borderRadius: 999, height: 9, width: 9 }} />
            {item.value}
          </span>
        ))}
        <span className="num" style={{ color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
          {zh ? "点大小：低密度/开放孔道更大" : "Size: lower density / more open pores"}
        </span>
      </div>

      <AxisRangeLegend extents={extents} t={t} lang={lang} />

      {hover ? (
        <div style={{ background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 8, boxShadow: t.shadowSm, fontSize: 11.5, left: 12, lineHeight: 1.5, maxWidth: 340, padding: "9px 11px", pointerEvents: "none", position: "absolute", top: 42, zIndex: 2 }}>
          <strong style={{ color: t.textStrong, display: "block" }}>{hover.name}</strong>
          <span style={{ color: t.muted }}>{hover.source} · {hover.sourceRecordId}</span><br />
          <span style={{ color: t.muted }}>{zh ? "金属" : "Metal"} {hover.metal} · topology {hover.topology} · {hover.dataGrade}</span><br />
          <span className="num" style={{ color: t.muted }}>
            SA {formatCompact(hover.surfaceArea, 0)} m²/g · PV {formatCompact(hover.poreVolume, 2)} cm³/g · {zh ? "孔隙率" : "porosity"} {formatCompact(hover.voidFraction, 2)} · {zh ? "密度" : "density"} {formatCompact(hover.density, 2)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function MofDescriptor3DScatter({ t, lang, isMobile }) {
  const [colorMode, setColorMode] = useState("metal")
  const points = useMemo(() => buildDescriptorScatterPoints(), [])
  if (!points.length) return null
  const zh = lang === "zh"
  const allRows = rowsFrom(coreMofImport).length
  const darkStage = isDarkTheme(t)
  const stageExtents = {
    surfaceArea: axisExtent(points.map(point => point.surfaceArea)),
    poreVolume: axisExtent(points.map(point => point.poreVolume)),
    voidFraction: axisExtent(points.map(point => point.voidFraction)),
  }
  const stageTheme = darkStage
    ? {
        ...t,
        accent: "#ff766f",
        accentText: "#ff827a",
        badgeInfoBg: "rgba(255, 118, 111, 0.12)",
        border: "rgba(169, 196, 198, 0.22)",
        chartBg: "#091317",
        faint: "#70848b",
        muted: "#a8b7bc",
        panel: "#0b161a",
        subtle: "#82969c",
        success: "#9caf91",
        surface: "#101e22",
        textStrong: "#f4f8f7",
        warn: "#d8b77b",
      }
    : {
        ...t,
        accent: "#bd4b47",
        accentText: "#a83e3a",
        badgeInfoBg: "#fff0ef",
        border: "#d9e2e5",
        chartBg: "#fbfdfe",
        faint: "#718188",
        muted: "#53636b",
        panel: "#f6f9fa",
        subtle: "#687b83",
        success: "#58785f",
        surface: "#ffffff",
        textStrong: "#0a1720",
        warn: "#9a6a2c",
      }
  const descriptorRows = [
    {
      key: "surfaceArea",
      symbol: "SA*",
      label: zh ? "比表面积" : "Surface area",
      unit: "m²/g",
      digits: 0,
    },
    {
      key: "poreVolume",
      symbol: "Vₚ*",
      label: zh ? "孔体积" : "Pore volume",
      unit: "cm³/g",
      digits: 2,
    },
    {
      key: "voidFraction",
      symbol: "φ*",
      label: zh ? "孔隙率" : "Porosity",
      unit: "",
      digits: 2,
    },
  ]
  return (
    <article
      data-testid="home-3d-scatter"
      data-point-count={points.length}
      className="content-card descriptor-story-stage"
      style={{
        "--descriptor-accent": stageTheme.accent,
        "--descriptor-border": stageTheme.border,
        "--descriptor-divider": darkStage ? "rgba(169, 196, 198, 0.12)" : "rgba(15, 35, 44, 0.10)",
        "--descriptor-faint": stageTheme.faint,
        "--descriptor-muted": stageTheme.muted,
        "--descriptor-panel": stageTheme.panel,
        "--descriptor-shadow": darkStage ? "0 16px 38px rgba(3, 12, 15, 0.18)" : "0 16px 38px rgba(38, 75, 91, 0.12)",
        "--descriptor-surface": stageTheme.surface,
        "--descriptor-text": stageTheme.textStrong,
        boxShadow: t.shadowSm,
      }}
      data-color-scheme={darkStage ? "dark" : "light"}
    >
      <div className="descriptor-story-copy">
        <div className="descriptor-story-eyebrow">
          {zh ? "数据库描述符 / 三维坐标" : "Database descriptors / 3D coordinates"}
        </div>
        <h3>
          {zh ? "MOF 描述符三维分布" : "MOF descriptor space in 3D"}
        </h3>
        <p className="descriptor-story-lede">
          {zh
            ? "把每条结构记录投影为一个可比较的描述符向量；方向表达孔结构差异，距离用于观察材料空间中的聚类与离群。"
            : "Project every structure into a comparable descriptor vector; direction expresses pore geometry, while distance reveals clusters and outliers."}
        </p>
        <div className="descriptor-equation-block" aria-label={zh ? "三维描述符向量与极差归一化方程" : "Three-dimensional descriptor vector and min-max normalization equations"}>
          <div className="descriptor-equation-main formula">
            d<sub>i</sub> = [ SA<sub>i</sub><sup>*</sup>, V<sub>p,i</sub><sup>*</sup>, φ<sub>i</sub><sup>*</sup> ]<sup>T</sup>
          </div>
          <div className="descriptor-equation-rule formula">
            x<sub>ij</sub><sup>*</sup> = (x<sub>ij</sub> − min x<sub>j</sub>) / (max x<sub>j</sub> − min x<sub>j</sub>)
          </div>
          <p>{zh ? "三轴采用同一极差归一化，将不同量纲映射到 [0, 1]。" : "The same min–max rule maps all three axes to [0, 1]."}</p>
        </div>
        <div className="descriptor-variable-list" aria-label={zh ? "描述符变量定义" : "Descriptor variable definitions"}>
          {descriptorRows.map(row => {
            const extent = stageExtents[row.key]
            return (
              <div key={row.key}>
                <strong className="formula">{row.symbol}</strong>
                <span>{row.label}</span>
                <small className="num">
                  {formatCompact(extent.min, row.digits)}–{formatCompact(extent.max, row.digits)} {row.unit}
                </small>
              </div>
            )
          })}
          <div>
            <strong className="formula">r<sub>i</sub></strong>
            <span>{zh ? "点半径" : "Point radius"}</span>
            <small className="formula">r<sub>i</sub> = 3.5 + 3.2(1 − ρ<sub>i</sub><sup>*</sup>)</small>
          </div>
        </div>
        <div className="descriptor-story-source">
          <span>{zh ? "数据来源" : "Source"}</span>
          <p>
            {zh
              ? `${allRows} 条真实 CoRE MOF 2024 CSD-modified CR 记录；此处使用 ${points.length} 条确定性可视化样本，且全部具备三轴字段。`
              : `${allRows} real CoRE MOF 2024 CSD-modified CR records; this view uses a deterministic ${points.length}-record visualization sample with complete axes.`}
          </p>
          <p>
            {zh
              ? "三维绘制时将 [0, 1] 坐标平移到 [−0.5, 0.5]；缺失密度的点使用中性半径 3.95，不参与密度大小推断。"
              : "Rendering recenters [0, 1] coordinates to [−0.5, 0.5]. Points with missing density use the neutral radius 3.95 and do not imply a density-derived size."}
          </p>
        </div>
      </div>
      <div className="descriptor-story-visual">
        <div className="descriptor-story-metric" aria-label={zh ? `${points.length} 条记录，三个描述符轴` : `${points.length} records across three descriptor axes`}>
          <span>{zh ? "ACTIVE SPACE" : "ACTIVE SPACE"}</span>
          <strong className="num">{points.length}</strong>
          <small>{zh ? "→ 3 个描述符轴" : "→ 3 descriptor axes"}</small>
        </div>
        <Scatter3D points={points} t={stageTheme} lang={lang} colorMode={colorMode} setColorMode={setColorMode} isMobile={isMobile} />
        <p className="descriptor-story-interaction">
          {zh
            ? `拖动旋转，${isMobile ? "点按查看真实值。" : "滚轮缩放、悬停查看真实值。"}着色可在金属节点与 dataGrade/source grade 间切换。`
            : `Drag to rotate; ${isMobile ? "tap points for real values." : "scroll to zoom and hover for real values."} Switch color between metal node and dataGrade/source grade.`}
        </p>
      </div>
    </article>
  )
}

export default MofDescriptor3DScatter
