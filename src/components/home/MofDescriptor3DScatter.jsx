// @ts-nocheck
// Self-contained interactive 3D scatter of real MOF descriptors.
// Axes: surface area x pore volume x porosity (void fraction).
// Points are real CoRE/QMOF seed records (statically bundled, no network fetch).
// Desktop: drag to rotate, wheel to zoom, hover for details.
// Mobile: degrades to a static 2D scatter (surface area x pore volume).
import { useMemo, useRef, useState } from "react"
import seedRows from "../../../public/data/open_mof_seed_candidates.json"

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
const FALLBACK_COLOR = "#64748b"

function hasNum(value) {
  return Number.isFinite(Number(value)) && value !== null && value !== ""
}

function colorForMetal(metal) {
  return METAL_COLORS[String(metal || "").trim()] || FALLBACK_COLOR
}

function usePoints() {
  return useMemo(() => {
    const rows = Array.isArray(seedRows) ? seedRows : (seedRows.records || seedRows.candidates || [])
    return rows
      .filter(row => hasNum(row.surfaceArea) && hasNum(row.poreVolume) && hasNum(row.voidFraction))
      .map(row => ({
        name: row.name || row.sourceRecordId || row.id,
        source: row.sourceDatabase || "Open MOF Seed",
        metal: row.metalNode && row.metalNode !== "pending" ? row.metalNode : "—",
        sa: Number(row.surfaceArea),
        pv: Number(row.poreVolume),
        vf: Number(row.voidFraction),
      }))
  }, [])
}

function axisExtent(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { min, max, span: max - min || 1 }
}

function norm(value, extent) {
  return (value - extent.min) / extent.span - 0.5 // min-max per axis -> centered [-0.5, 0.5]
}

// Rotate a centered unit point around the vertical (y) then horizontal (x) axis.
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

function Scatter3D({ points, t, lang }) {
  const [yaw, setYaw] = useState(-0.6)
  const [pitch, setPitch] = useState(0.42)
  const [zoom, setZoom] = useState(1)
  const [hover, setHover] = useState(null)
  const drag = useRef(null)
  const W = 640
  const H = 460
  const MARGIN = 64 // room for axis labels so nothing clips

  const saE = useMemo(() => axisExtent(points.map(p => p.sa)), [points])
  const pvE = useMemo(() => axisExtent(points.map(p => p.pv)), [points])
  const vfE = useMemo(() => axisExtent(points.map(p => p.vf)), [points])

  const rotatedPoints = useMemo(() => points.map((p, index) => ({
    ...p,
    index,
    ...rotate({ x: norm(p.sa, saE), y: norm(p.pv, pvE), z: norm(p.vf, vfE) }, yaw, pitch),
  })), [points, saE, pvE, vfE, yaw, pitch])

  // Independent x/y auto-fit to the DATA points so they fill the plot at any
  // rotation. Cube/extent fitting is avoided because the three descriptors are
  // correlated and project into a thin slab, which would leave empty quadrants.
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

  // Orientation gizmo: rotated unit directions of the three descriptor axes,
  // drawn in the corner so the viewer keeps their bearings while rotating.
  const gizmo = useMemo(() => {
    const L = 32
    const gx = 40
    const gy = H - 34
    const dir = (vec) => { const r = rotate(vec, yaw, pitch); return { x: gx + r.x * L, y: gy - r.y * L } }
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
    setZoom(z => Math.max(0.6, Math.min(2.2, z - event.deltaY * 0.0012)))
  }

  const metals = useMemo(() => [...new Set(points.map(p => p.metal))], [points])

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={lang === "zh" ? "MOF 描述符 3D 散点图" : "MOF descriptor 3D scatter"}
        style={{ width: "100%", height: "auto", overflow: "visible", touchAction: "none", cursor: drag.current ? "grabbing" : "grab", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.sa.x} y2={gizmo.sa.y} stroke={t.subtle} strokeWidth={1.6} />
        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.pv.x} y2={gizmo.pv.y} stroke={t.subtle} strokeWidth={1.6} />
        <line x1={gizmo.gx} y1={gizmo.gy} x2={gizmo.vf.x} y2={gizmo.vf.y} stroke={t.subtle} strokeWidth={1.6} />
        <text x={gizmo.sa.x} y={gizmo.sa.y - 4} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{lang === "zh" ? "比表面" : "SA"}</text>
        <text x={gizmo.pv.x} y={gizmo.pv.y - 4} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{lang === "zh" ? "孔体积" : "PV"}</text>
        <text x={gizmo.vf.x} y={gizmo.vf.y - 4} textAnchor="middle" fill={t.faint} fontSize={9.5} fontWeight={850}>{lang === "zh" ? "孔隙率" : "ε"}</text>
        {projected.map(p => {
          const r = 4.5 + (p.depth + 0.5) * 3.2
          const active = hover?.index === p.index
          return (
            <circle
              key={p.index}
              cx={p.sx}
              cy={p.sy}
              r={active ? r + 2 : r}
              fill={colorForMetal(p.metal)}
              fillOpacity={0.82}
              stroke={active ? t.textStrong : "#ffffff"}
              strokeWidth={active ? 1.6 : 0.8}
              onPointerEnter={() => setHover(p)}
              onPointerLeave={() => setHover(null)}
            />
          )
        })}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
        {metals.map(metal => (
          <span key={metal} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 11, fontWeight: 700, gap: 5 }}>
            <span style={{ background: colorForMetal(metal), borderRadius: 999, height: 9, width: 9 }} />
            {metal}
          </span>
        ))}
      </div>

      {hover ? (
        <div style={{ background: t.panel, border: `1px solid ${t.accent}`, borderRadius: 8, boxShadow: t.shadowSm, fontSize: 11.5, left: 12, lineHeight: 1.5, padding: "8px 10px", pointerEvents: "none", position: "absolute", top: 12, zIndex: 2 }}>
          <strong style={{ color: t.textStrong, display: "block" }}>{hover.name}</strong>
          <span style={{ color: t.muted }}>{lang === "zh" ? "来源" : "Source"}: {hover.source} · {hover.metal}</span><br />
          <span style={{ color: t.muted }}>SA {Math.round(hover.sa)} m²/g · PV {hover.pv.toFixed(2)} cm³/g · {lang === "zh" ? "孔隙率" : "porosity"} {hover.vf.toFixed(2)}</span>
        </div>
      ) : null}
    </div>
  )
}

function Scatter2D({ points, t, lang }) {
  const W = 360
  const H = 280
  const pad = 36
  const saE = useMemo(() => axisExtent(points.map(p => p.sa)), [points])
  const pvE = useMemo(() => axisExtent(points.map(p => p.pv)), [points])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === "zh" ? "MOF 描述符 2D 散点图" : "MOF descriptor 2D scatter"} style={{ width: "100%", height: "auto" }}>
      <line x1={pad} y1={H - pad} x2={W - 8} y2={H - pad} stroke={t.border} strokeWidth={1.5} />
      <line x1={pad} y1={8} x2={pad} y2={H - pad} stroke={t.border} strokeWidth={1.5} />
      <text x={W - 8} y={H - pad + 14} fill={t.subtle} fontSize={10} fontWeight={800} textAnchor="end">{lang === "zh" ? "比表面积" : "Surface area"}</text>
      <text x={pad - 4} y={14} fill={t.subtle} fontSize={10} fontWeight={800}>{lang === "zh" ? "孔体积" : "Pore volume"}</text>
      {points.map((p, index) => {
        const x = pad + ((p.sa - saE.min) / saE.span) * (W - pad - 12)
        const y = (H - pad) - ((p.pv - pvE.min) / pvE.span) * (H - pad - 12)
        return <circle key={index} cx={x} cy={y} r={5} fill={colorForMetal(p.metal)} fillOpacity={0.8} stroke="#ffffff" strokeWidth={0.8} />
      })}
    </svg>
  )
}

export function MofDescriptor3DScatter({ t, lang, isMobile }) {
  const points = usePoints()
  if (!points.length) return null
  const zh = lang === "zh"
  return (
    <div data-testid="home-3d-scatter" className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, boxShadow: t.shadowSm, display: "grid", gap: 12, minWidth: 0, padding: isMobile ? 16 : 20 }}>
      <div>
        <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, letterSpacing: 0, marginBottom: 6, textTransform: "uppercase" }}>
          {zh ? "数据库描述符" : "Database descriptors"}
        </div>
        <h3 style={{ color: t.textStrong, fontSize: isMobile ? 18 : 21, fontWeight: 900, lineHeight: 1.2, margin: 0 }}>
          {zh ? "MOF 描述符三维分布" : "MOF descriptor space in 3D"}
        </h3>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.6, margin: "7px 0 0", maxWidth: 720 }}>
          {zh
            ? `比表面积 × 孔体积 × 孔隙率，点为 ${points.length} 个真实 CoRE/QMOF 种子 MOF，按金属节点着色。${isMobile ? "移动端为 2D 视图。" : "拖动旋转、滚轮缩放、悬停看详情。"}`
            : `Surface area × pore volume × porosity for ${points.length} real CoRE/QMOF seed MOFs, colored by metal node. ${isMobile ? "Mobile shows a 2D view." : "Drag to rotate, scroll to zoom, hover for details."}`}
        </p>
      </div>
      {isMobile ? <Scatter2D points={points} t={t} lang={lang} /> : <Scatter3D points={points} t={t} lang={lang} />}
      <p style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
        {zh
          ? "着色按金属节点（化学）；这些种子记录暂未填充气体性能/dataGrade，故不以其着色。"
          : "Colored by metal node (chemistry); these seed records do not yet carry gas-performance/dataGrade, so that coloring is omitted."}
      </p>
    </div>
  )
}

export default MofDescriptor3DScatter
