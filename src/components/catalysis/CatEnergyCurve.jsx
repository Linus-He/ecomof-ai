// @ts-nocheck
import { useRef, useState } from "react"
import { CatalystCatSprite } from "./CatalystCatSprite"
import { clamp } from "./catEnergyModel"

function xScale(progress) {
  return 90 + (clamp(progress, 0, 100) / 100) * 590
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

export function CatEnergyCurve({ lang, t, state, catProgress, setCatProgress, showNote, setShowNote, reducedMotion, resetCat }) {
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef(null)
  const zh = lang === "zh"
  const baselinePeakY = 72
  const baselineProductY = 260 + Math.max(-45, Math.min(45, state.baselineDeltaE * 3))
  const mofPeakY = 260 - (state.mofEa / Math.max(1, state.baselineEa)) * (260 - baselinePeakY)
  const mofProductY = baselineProductY + state.reactionEnergyDelta * 3
  const catX = xScale(catProgress)
  const catY = curveY(catProgress, mofPeakY, mofProductY, 0.145) + 15

  const updateFromPointer = (clientX) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const svgX = ((clientX - rect.left) / rect.width) * 760
    setCatProgress(Math.round(clamp(((svgX - 90) / 590) * 100, 0, 100)))
  }
  const down = event => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
    setShowNote(true)
    updateFromPointer(event.clientX)
  }
  const move = event => {
    if (dragging) updateFromPointer(event.clientX)
  }
  const up = event => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDragging(false)
  }
  const key = event => {
    if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      event.preventDefault()
      setCatProgress(current => clamp(current - 5, 0, 100))
    }
    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault()
      setCatProgress(current => clamp(current + 5, 0, 100))
    }
    if (event.key === "Home") setCatProgress(0)
    if (event.key === "End") setCatProgress(100)
  }

  return (
    <div className="cat-energy-curve-card" style={{ background: t.panel, borderColor: t.border }}>
      <svg ref={svgRef} viewBox="0 0 760 430" role="img" aria-label={zh ? "催化小猫能量游乐场" : "Catalyst Cat Energy Playground"} className="cat-energy-svg">
        <rect x="0" y="0" width="760" height="430" rx="12" fill={t.panel} />
        {[82, 160, 260, 292].map(y => <line key={y} x1="82" x2="696" y1={y} y2={y} stroke={t.divider} strokeDasharray="4 8" />)}
        <line x1="82" y1="346" x2="704" y2="346" stroke={t.textStrong} strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="346" x2="82" y2="58" stroke={t.textStrong} strokeWidth="3" strokeLinecap="round" />
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
          <CatalystCatSprite mood={state.mood} x={catX} y={catY} dragging={dragging} reducedMotion={reducedMotion} onPointerDown={down} onPointerMove={move} onPointerUp={up} onDoubleClick={resetCat} onClick={() => setShowNote(true)} onKeyDown={key} />
        </g>
        {showNote ? (
          <foreignObject x={Math.min(506, Math.max(92, catX - 80))} y={Math.max(14, catY - 118)} width="230" height="88">
            <div className="cat-note-bubble" style={{ background: state.riskPenalty > 22 ? t.badgeWarnBg : t.badgeInfoBg, borderColor: state.riskPenalty > 22 ? t.warn : t.accent, color: t.textStrong }}>
              <button type="button" onClick={() => setShowNote(false)} aria-label={zh ? "关闭小猫提示" : "Close cat note"}>×</button>
              {zh ? `小猫提示：当前位于${state.zone.labelZh}，ΔEa 变化 ${state.activationEnergyDelta} kJ/mol，证据等级 ${state.evidenceLevel}，需要进一步验证。` : `Cat note: In the ${state.zone.labelEn}, ΔEa changes by ${state.activationEnergyDelta} kJ/mol. Evidence ${state.evidenceLevel}; validation is still needed.`}
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
