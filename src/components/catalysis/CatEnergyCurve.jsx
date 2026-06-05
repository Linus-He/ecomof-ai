// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { CatalystCatSprite } from "./CatalystCatSprite"
import { catScienceZoneForPoint, clamp } from "./catEnergyModel"

const CAT_POINT_STORAGE_KEY = "ecomof-cat-energy-point"

function xScale(progress) {
  return 90 + (clamp(progress, 0, 100) / 100) * 590
}

function progressFromX(x) {
  return Math.round(clamp(((Number(x) - 90) / 590) * 100, 0, 100))
}

function curveY(progress, peakY, productY = 292, width = 0.18) {
  const p = clamp(progress, 0, 100) / 100
  const reactantY = 260
  const baseY = reactantY + (productY - reactantY) * p
  const center = 0.52
  const gaussian = Math.exp(-Math.pow((p - center) / width, 2))
  const peakBaseY = reactantY + (productY - reactantY) * center
  return baseY - (peakBaseY - peakY) * gaussian
}

function pathFor(peakY, productY, width) {
  return Array.from({ length: 76 }, (_, index) => {
    const progress = (index / 75) * 100
    const x = xScale(progress)
    const y = curveY(progress, peakY, productY, width)
    return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(" ")
}

function clampPoint(point) {
  return {
    x: clamp(Number(point?.x) || 90, 90, 680),
    y: clamp(Number(point?.y) || 260, 72, 318),
  }
}

function loadStoredPoint(fallbackPoint) {
  if (typeof window === "undefined") return fallbackPoint
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CAT_POINT_STORAGE_KEY) || "null")
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) return clampPoint(parsed)
  } catch {
    return fallbackPoint
  }
  return fallbackPoint
}

function storePoint(point) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CAT_POINT_STORAGE_KEY, JSON.stringify(clampPoint(point)))
  } catch {
    // Persistence is optional; drag interaction still works without localStorage.
  }
}

function clearStoredPoint() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CAT_POINT_STORAGE_KEY)
  } catch {
    // Ignore storage failures in private or restricted browser contexts.
  }
}

export function CatEnergyCurve({
  lang,
  t,
  state,
  catProgress,
  setCatProgress,
  onCatPointChange,
  onNavigateZone,
  showNote,
  setShowNote,
  reducedMotion,
  resetCat,
  resetToken,
}) {
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef(null)
  const didHandleResetRef = useRef(false)
  const zh = lang === "zh"
  const baselinePeakY = 72
  const baselineProductY = 260 + Math.max(-45, Math.min(45, state.baselineDeltaE * 3))
  const mofPeakY = 260 - (state.mofEa / Math.max(1, state.baselineEa)) * (260 - baselinePeakY)
  const mofProductY = baselineProductY + state.reactionEnergyDelta * 3
  const fallbackPoint = clampPoint({
    x: xScale(catProgress),
    y: curveY(catProgress, mofPeakY, mofProductY, 0.145) + 15,
  })
  const [catPoint, setCatPoint] = useState(() => loadStoredPoint(fallbackPoint))
  const catScienceZone = catScienceZoneForPoint(catPoint)
  const catX = catPoint.x
  const catY = catPoint.y
  const bubbleX = Math.min(454, Math.max(92, catX - 120))
  const bubbleY = Math.min(254, Math.max(12, catY - 166))

  useEffect(() => {
    onCatPointChange?.(catPoint)
  }, [catPoint, onCatPointChange])

  useEffect(() => {
    if (resetToken === undefined) return
    if (!didHandleResetRef.current) {
      didHandleResetRef.current = true
      return
    }
    clearStoredPoint()
    setCatPoint(fallbackPoint)
    setCatProgress(progressFromX(fallbackPoint.x))
    onCatPointChange?.(fallbackPoint)
  }, [resetToken])

  const pointFromPointer = (event) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    return clampPoint({
      x: ((event.clientX - rect.left) / rect.width) * 760,
      y: ((event.clientY - rect.top) / rect.height) * 430,
    })
  }

  const commitPoint = (point, persist = false) => {
    const next = clampPoint(point)
    setCatPoint(next)
    setCatProgress(progressFromX(next.x))
    onCatPointChange?.(next)
    if (persist) storePoint(next)
  }

  const resetPoint = (event) => {
    event?.preventDefault?.()
    clearStoredPoint()
    setDragging(false)
    setShowNote(true)
    commitPoint(fallbackPoint, false)
    resetCat?.()
  }

  const down = event => {
    const next = pointFromPointer(event)
    if (!next) return
    event.preventDefault()
    svgRef.current?.setPointerCapture?.(event.pointerId)
    setDragging(true)
    setShowNote(true)
    commitPoint(next)
  }

  const move = event => {
    if (!dragging) return
    const next = pointFromPointer(event)
    if (!next) return
    event.preventDefault()
    commitPoint(next)
  }

  const up = event => {
    if (!dragging) return
    event.preventDefault()
    svgRef.current?.releasePointerCapture?.(event.pointerId)
    const next = pointFromPointer(event) || catPoint
    commitPoint(next, true)
    setDragging(false)
  }

  const key = event => {
    const stepX = event.shiftKey ? 48 : 24
    const stepY = event.shiftKey ? 36 : 18
    let next = null
    if (event.key === "ArrowLeft") next = { x: catPoint.x - stepX, y: catPoint.y }
    if (event.key === "ArrowRight") next = { x: catPoint.x + stepX, y: catPoint.y }
    if (event.key === "ArrowUp") next = { x: catPoint.x, y: catPoint.y - stepY }
    if (event.key === "ArrowDown") next = { x: catPoint.x, y: catPoint.y + stepY }
    if (event.key === "Home") next = { x: 90, y: catPoint.y }
    if (event.key === "End") next = { x: 680, y: catPoint.y }
    if (!next) return
    event.preventDefault()
    setShowNote(true)
    commitPoint(next, true)
  }

  const navigateToZone = event => {
    event.stopPropagation()
    if (catScienceZone.actionId) onNavigateZone?.(catScienceZone.actionId)
  }

  return (
    <div className="cat-energy-curve-card" style={{ background: t.panel, borderColor: t.border }}>
      <svg
        ref={svgRef}
        viewBox="0 0 760 430"
        role="img"
        aria-label={zh ? "催化小猫能量游乐场" : "Catalyst Cat Energy Playground"}
        className="cat-energy-svg"
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ touchAction: "none" }}
      >
        <rect x="0" y="0" width="760" height="430" rx="12" fill={t.panel} />
        <rect x="90" y="76" width="130" height="242" rx="10" fill="#DBEAFE" opacity="0.18" />
        <rect x="220" y="76" width="136" height="242" rx="10" fill="#DCFCE7" opacity="0.18" />
        <rect x="356" y="76" width="144" height="242" rx="10" fill="#FEF3C7" opacity="0.2" />
        <rect x="500" y="76" width="120" height="242" rx="10" fill="#FCE7F3" opacity="0.18" />
        <rect x="90" y="76" width="590" height="58" rx="10" fill="#E0F2FE" opacity="0.2" />
        {[82, 160, 260, 292].map(y => <line key={y} x1="82" x2="696" y1={y} y2={y} stroke={t.divider} strokeDasharray="4 8" />)}
        <line x1="82" y1="346" x2="704" y2="346" stroke={t.textStrong} strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="346" x2="82" y2="58" stroke={t.textStrong} strokeWidth="3" strokeLinecap="round" />
        <text x="148" y="98" fill={t.muted} fontSize="10.5" fontWeight="900" textAnchor="middle">{zh ? "水热阈值" : "Hydrothermal"}</text>
        <text x="288" y="98" fill={t.muted} fontSize="10.5" fontWeight="900" textAnchor="middle">{zh ? "OACS" : "OACS"}</text>
        <text x="428" y="98" fill={t.muted} fontSize="10.5" fontWeight="900" textAnchor="middle">{zh ? "DMRS" : "DMRS"}</text>
        <text x="560" y="98" fill={t.muted} fontSize="10.5" fontWeight="900" textAnchor="middle">{zh ? "EXAFS" : "EXAFS"}</text>
        <text x="358" y="390" fill={t.textStrong} fontSize="17" fontWeight="900" textAnchor="middle">{zh ? "反应坐标" : "Reaction coordinate"}</text>
        <text x="30" y="205" fill={t.textStrong} fontSize="17" fontWeight="900" textAnchor="middle" transform="rotate(-90 30 205)">{zh ? "能量" : "Energy"}</text>
        <path d={pathFor(baselinePeakY, baselineProductY, 0.18)} fill="none" stroke={t.faint} strokeWidth="6" strokeLinecap="round" opacity="0.75" />
        <path d={pathFor(mofPeakY, mofProductY, 0.145)} fill="none" stroke={state.riskPenalty > 22 ? "#D97706" : "#1A6DB5"} strokeWidth="7" strokeLinecap="round" className="catalyst-curve-glow" />
        <line x1="145" x2="145" y1="260" y2={baselinePeakY} stroke={t.faint} strokeWidth="2.4" />
        <line x1="180" x2="180" y1="260" y2={mofPeakY} stroke="#1A6DB5" strokeWidth="2.4" />
        <line x1="224" x2="224" y1={baselinePeakY} y2={mofPeakY} stroke="#D97706" strokeWidth="2.4" strokeDasharray="5 6" />
        <line x1="626" x2="626" y1={baselineProductY} y2={mofProductY} stroke="#64748B" strokeWidth="2.2" strokeDasharray="5 6" />
        <text x="116" y="168" fill={t.muted} fontSize="13" fontFamily='"Times New Roman", Times, serif'>E<tspan baselineShift="sub">a,no MOF</tspan></text>
        <text x="188" y={(260 + mofPeakY) / 2} fill="#1A6DB5" fontSize="13" fontFamily='"Times New Roman", Times, serif'>E<tspan baselineShift="sub">a,MOF</tspan></text>
        <text x="235" y={(baselinePeakY + mofPeakY) / 2} fill="#D97706" fontSize="13" fontFamily='"Times New Roman", Times, serif'>ΔE<tspan baselineShift="sub">a</tspan></text>
        <text x="637" y={(baselineProductY + mofProductY) / 2} fill={t.muted} fontSize="13" fontFamily='"Times New Roman", Times, serif'>ΔE</text>
        <g transform="translate(530 196)">
          <path d="M0 14 L24 0 L49 14 L24 29 Z" fill="#DBEAFE" stroke="#1A6DB5" strokeWidth="2" />
          <path d="M0 14 L0 40 L24 55 L24 29 Z" fill="#E8F2FC" stroke="#1A6DB5" strokeWidth="2" />
          <path d="M49 14 L49 40 L24 55 L24 29 Z" fill="#BFDBFE" stroke="#1A6DB5" strokeWidth="2" />
          <text x="24" y="76" fill="#1A6DB5" fontSize="12" fontWeight="900" textAnchor="middle">MOF</text>
        </g>
        <g>
          <CatalystCatSprite
            mood={state.mood}
            x={catX}
            y={catY}
            dragging={dragging}
            reducedMotion={reducedMotion}
            onPointerDown={down}
            onDoubleClick={resetPoint}
            onClick={() => setShowNote(true)}
            onKeyDown={key}
          />
        </g>
        {showNote ? (
          <foreignObject x={bubbleX} y={bubbleY} width="286" height="154">
            <div className="cat-note-bubble cat-note-bubble--expanded" style={{ background: state.riskPenalty > 22 ? t.badgeWarnBg : t.badgeInfoBg, borderColor: state.riskPenalty > 22 ? t.warn : t.accent, color: t.textStrong }}>
              <button type="button" className="cat-note-close" onClick={() => setShowNote(false)} aria-label={zh ? "关闭小猫提示" : "Close cat note"}>×</button>
              <strong>{zh ? "小猫提示 / Cat insight" : "Cat insight"}</strong>
              <span>{zh ? "当前区域 / Current zone" : "Current zone"}: {zh ? catScienceZone.labelZh : catScienceZone.labelEn}</span>
              <span>{zh ? "相关指标 / Related metric" : "Related metric"}: {zh ? catScienceZone.metricZh : catScienceZone.metric}</span>
              <small>{zh ? catScienceZone.insightZh : catScienceZone.insight}</small>
              <button type="button" className="cat-note-action" onClick={navigateToZone}>
                {zh ? catScienceZone.actionLabelZh : catScienceZone.actionLabel}
              </button>
            </div>
          </foreignObject>
        ) : null}
      </svg>
      <div className="energy-playground-legend" style={{ color: t.muted }}>
        <span><i style={{ background: t.faint }} />{zh ? "No MOF baseline curve" : "No MOF baseline curve"}</span>
        <span><i style={{ background: "#1A6DB5" }} />{zh ? "MOF-modulated curve" : "MOF-modulated curve"}</span>
        <span><i style={{ background: "#F8B66B" }} />{zh ? "可拖动催化小猫" : "Draggable catalyst cat"}</span>
      </div>
    </div>
  )
}
