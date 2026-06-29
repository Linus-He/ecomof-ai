// @ts-nocheck
// Self-contained interactive descriptor scatter from bundled CoRE/QMOF imports.
// Desktop: drag to rotate, wheel to zoom, hover for details.
// Mobile: degrades to a compact 2D scatter.
import { useMemo, useRef, useState } from "react"
import coreMofImport from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImport from "../../../public/data/data_ingestion/qmof_import_v2.json"

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

export function buildDescriptorScatterPoints(target = TARGET_POINT_COUNT) {
  const sourceRows = [
    ...rowsFrom(coreMofImport).map(row => ({ ...row, _sourceFamily: "CoRE MOF" })),
    ...rowsFrom(qmofImport).map(row => ({ ...row, _sourceFamily: "QMOF" })),
  ]
  const fullAxisRows = sourceRows
    .filter(row => hasNum(row.surfaceArea) && hasNum(row.poreVolume) && hasNum(row.voidFraction))
    .sort((a, b) => String(a.mofId || a.sourceRecordId).localeCompare(String(b.mofId || b.sourceRecordId)))
  return deterministicSample(fullAxisRows, target).map((row, index) => ({
    id: row.mofId || row.sourceRecordId || `mof-${index}`,
    name: row.displayName || row.mofId || row.sourceRecordId || `MOF ${index + 1}`,
    source: row.sourceDatabase || row._sourceFamily || "CoRE/QMOF",
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

function Scatter3D({ points, t, lang, colorMode, setColorMode }) {
  const [yaw, setYaw] = useState(-0.72)
  const [pitch, setPitch] = useState(0.44)
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState(null)
  const drag = useRef(null)
  const W = 680
  const H = 470
  const MARGIN = 68
  const zh = lang === "zh"

  const extents = useMemo(() => ({
    surfaceArea: axisExtent(points.map(p => p.surfaceArea)),
    poreVolume: axisExtent(points.map(p => p.poreVolume)),
    voidFraction: axisExtent(points.map(p => p.voidFraction)),
    density: axisExtent(points.map(p => p.density).filter(value => value !== null)),
  }), [points])

  const rotatedPoints = useMemo(() => points.map((p, index) => ({
    ...p,
    index,
    size: 3.7 + (p.density == null ? 0.45 : (1 - norm01(p.density, extents.density)) * 3.4),
    ...rotate({
      x: norm(p.surfaceArea, extents.surfaceArea) + jitter(index, "x"),
      y: norm(p.poreVolume, extents.poreVolume) + jitter(index, "y"),
      z: norm(p.voidFraction, extents.voidFraction) + jitter(index, "z"),
    }, yaw, pitch),
  })), [points, extents, yaw, pitch])

  const fit = useMemo(() => {
    const xs = rotatedPoints.map(p => p.x)
    const ys = rotatedPoints.map(p => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return { minX, minY, spanX: (Math.max(...xs) - minX) || 1, spanY: (Math.max(...ys) - minY) || 1 }
  }, [rotatedPoints])

  const cx = W / 2
  const cy = H / 2
  const innerW = (W - 2 * MARGIN) * zoom
  const innerH = (H - 2 * MARGIN) * zoom
  const toScreen = (r) => ({
    sx: cx + (((r.x - fit.minX) / fit.spanX) - 0.5) * innerW,
    sy: cy - (((r.y - fit.minY) / fit.spanY) - 0.5) * innerH,
    depth: r.depth,
  })

  const projected = useMemo(() => rotatedPoints
    .map(p => ({ ...p, ...toScreen(p) }))
    .sort((a, b) => a.depth - b.depth), [rotatedPoints, fit, zoom])

  const gizmo = useMemo(() => {
    const L = 38
    const gx = 46
    const gy = H - 40
    const dir = (vec) => {
      const r = rotate(vec, yaw, pitch)
      return { x: gx + r.x * L, y: gy - r.y * L }
    }
    return { gx, gy, sa: dir({ x: 1, y: 0, z: 0 }), pv: dir({ x: 0, y: 1, z: 0 }), vf: dir({ x: 0, y: 0, z: 1 }) }
  }, [yaw, pitch])

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
        <rect x={MARGIN - 18} y={MARGIN - 24} width={W - 2 * MARGIN + 36} height={H - 2 * MARGIN + 36} rx="10" fill={t.chartBg || t.surface} stroke={t.border} opacity="0.58" />
        {[0.25, 0.5, 0.75].map(level => (
          <line key={level} x1={MARGIN} x2={W - MARGIN} y1={MARGIN + level * (H - 2 * MARGIN)} y2={MARGIN + level * (H - 2 * MARGIN)} stroke={t.divider || t.border} strokeDasharray="3 8" />
        ))}

        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.sa.x} y2={gizmo.sa.y} stroke={t.subtle} strokeWidth={1.7} />
        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.pv.x} y2={gizmo.pv.y} stroke={t.subtle} strokeWidth={1.7} />
        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.vf.x} y2={gizmo.vf.y} stroke={t.subtle} strokeWidth={1.7} />
        <text x={gizmo.sa.x} y={gizmo.sa.y - 5} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{zh ? "比表面" : "SA"}</text>
        <text x={gizmo.pv.x} y={gizmo.pv.y - 5} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{zh ? "孔体积" : "PV"}</text>
        <text x={gizmo.vf.x} y={gizmo.vf.y - 5} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{zh ? "孔隙率" : "ε"}</text>

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

function Scatter2D({ points, t, lang, colorMode, setColorMode }) {
  const W = 380
  const H = 290
  const pad = 40
  const zh = lang === "zh"
  const [hover, setHover] = useState(null)
  const extents = useMemo(() => ({
    surfaceArea: axisExtent(points.map(p => p.surfaceArea)),
    poreVolume: axisExtent(points.map(p => p.poreVolume)),
    voidFraction: axisExtent(points.map(p => p.voidFraction)),
  }), [points])
  return (
    <div style={{ display: "grid", gap: 8, position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {[
          ["metal", zh ? "金属" : "Metal"],
          ["grade", "dataGrade"],
        ].map(([mode, label]) => {
          const active = colorMode === mode
          return (
            <button key={mode} type="button" onClick={() => setColorMode(mode)} style={{ background: active ? t.badgeInfoBg : t.surface, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 999, color: active ? t.accentText : t.muted, fontSize: 11, fontWeight: 850, minHeight: 29, padding: "5px 10px" }}>
              {label}
            </button>
          )
        })}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={zh ? "MOF 描述符 2D 散点图" : "MOF descriptor 2D scatter"} style={{ width: "100%", height: "auto" }}>
        <line x1={pad} y1={H - pad} x2={W - 12} y2={H - pad} stroke={t.border} strokeWidth={1.5} />
        <line x1={pad} y1={12} x2={pad} y2={H - pad} stroke={t.border} strokeWidth={1.5} />
        <text x={W - 12} y={H - pad + 15} fill={t.subtle} fontSize={10} fontWeight={800} textAnchor="end">{zh ? "比表面积" : "Surface area"}</text>
        <text x={pad - 4} y={17} fill={t.subtle} fontSize={10} fontWeight={800}>{zh ? "孔体积" : "Pore volume"}</text>
        {points.map((p, index) => {
          const x = pad + norm01(p.surfaceArea, extents.surfaceArea) * (W - pad - 16)
          const y = (H - pad) - norm01(p.poreVolume, extents.poreVolume) * (H - pad - 16)
          const fill = colorMode === "metal" ? colorForMetal(p.metal) : colorForGrade(p.dataGrade)
          const active = hover?.id === p.id
          return <circle key={p.id} cx={x} cy={y} r={active ? 6.5 : 4.8} fill={fill} fillOpacity={active ? 0.95 : 0.68} stroke="#ffffff" strokeWidth={0.8} onPointerEnter={() => setHover(p)} onPointerLeave={() => setHover(null)} />
        })}
      </svg>
      <AxisRangeLegend extents={extents} t={t} lang={lang} isMobile />
      {hover ? (
        <div style={{ color: t.muted, fontSize: 11.2, lineHeight: 1.5 }}>
          <strong style={{ color: t.textStrong }}>{hover.name}</strong> · SA {formatCompact(hover.surfaceArea, 0)} m²/g · PV {formatCompact(hover.poreVolume, 2)} cm³/g
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
  const allRows = rowsFrom(coreMofImport).length + rowsFrom(qmofImport).length
  const qMofExcluded = rowsFrom(qmofImport).filter(row => !hasNum(row.poreVolume)).length
  return (
    <div data-testid="home-3d-scatter" data-point-count={points.length} className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: t.shadowSm, display: "grid", gap: 13, minWidth: 0, overflow: "visible", padding: isMobile ? 16 : 22 }}>
      <div>
        <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, letterSpacing: 0, marginBottom: 6, textTransform: "uppercase" }}>
          {zh ? "数据库描述符" : "Database descriptors"}
        </div>
        <h3 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, fontWeight: 900, lineHeight: 1.24, margin: 0, overflow: "visible" }}>
          {zh ? "MOF 描述符三维分布" : "MOF descriptor space in 3D"}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>
          {zh
            ? `比表面积 × 孔体积 × 孔隙率，展示 ${points.length} 个具备完整三轴字段的真实结构记录（来自 ${allRows} 条 CoRE/QMOF 导入）。${isMobile ? "移动端为 2D 视图。" : "拖动旋转、滚轮缩放、悬停看真实值。"}`
            : `Surface area × pore volume × porosity for ${points.length} real structure records with complete axes (from ${allRows} CoRE/QMOF imports). ${isMobile ? "Mobile shows a 2D view." : "Drag to rotate, scroll to zoom, hover for real values."}`}
        </p>
      </div>
      {isMobile
        ? <Scatter2D points={points} t={t} lang={lang} colorMode={colorMode} setColorMode={setColorMode} />
        : <Scatter3D points={points} t={t} lang={lang} colorMode={colorMode} setColorMode={setColorMode} />}
      <p style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
        {zh
          ? `着色可按金属节点或结构记录 dataGrade/source grade 切换；点大小映射低密度/开放孔道倾向。${qMofExcluded ? `QMOF 记录缺孔体积字段，未进入三轴视图：${qMofExcluded} 条。` : ""}`
          : `Color can switch between metal node and structural dataGrade/source grade; point size maps lower density / more open pores. ${qMofExcluded ? `${qMofExcluded} QMOF records lack pore volume and are excluded from the 3-axis view.` : ""}`}
      </p>
    </div>
  )
}

export default MofDescriptor3DScatter
