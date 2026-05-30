// @ts-nocheck
import { useMemo, useRef, useState } from "react"
import { toolbarBtn } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const confidenceFactorMap = {
  low: 0.45,
  medium: 0.7,
  high: 0.9,
}

const confidenceLabels = {
  low: { zh: "低", en: "Low" },
  medium: { zh: "中", en: "Medium" },
  high: { zh: "高", en: "High" },
}

const conceptCopy = {
  reactants: {
    number: "1",
    label: { zh: "反应物", en: "Reactants" },
    short: { zh: "反应起点", en: "Initial state" },
    explanation: {
      zh: "反应物处于跨越催化能垒前的初始能量状态。这里关注它是否能进入孔道、靠近活性位点并形成可反应构型。",
      en: "Initial chemical state before crossing the catalytic energy barrier. The key question is whether the reactants can access pores, active sites, and reactive orientations.",
    },
    interpretation: {
      zh: "EcoMOF-AI 会把吸附亲和性、反应物可达性和孔径匹配度作为路径可行性的前置证据。",
      en: "EcoMOF-AI treats adsorption affinity, reactant accessibility, and pore-size compatibility as early evidence for pathway feasibility.",
    },
    descriptors: {
      zh: ["吸附亲和性", "反应物可达性", "孔径匹配度"],
      en: ["adsorption affinity", "reactant accessibility", "pore size compatibility"],
    },
  },
  transitionState: {
    number: "2",
    label: { zh: "过渡态", en: "Transition state" },
    short: { zh: "TS", en: "TS" },
    explanation: {
      zh: "过渡态是决定活化能高低的高能构型。MOF 的金属节点、配体官能团和孔道限域可能稳定类过渡态构型。",
      en: "The transition state is the high-energy configuration controlling the activation barrier. MOF metal nodes, linker groups, and pore confinement may stabilize transition-state-like configurations.",
    },
    interpretation: {
      zh: "该交互把过渡态稳定作用转译为 MOF 调控因子，并进入证据加权优先级判断。",
      en: "This interaction maps transition-state stabilization into MOF modulation factors used by evidence-weighted prioritization.",
    },
    descriptors: {
      zh: ["金属节点", "配体官能团", "孔道限域", "水稳定性"],
      en: ["metal node", "linker functional group", "pore confinement", "water stability"],
    },
  },
  mofCatalyst: {
    number: "3",
    label: { zh: "MOF 催化剂", en: "MOF catalyst" },
    short: { zh: "MOF", en: "MOF" },
    explanation: {
      zh: "MOF 可能通过稳定中间体或类过渡态构型来降低表观能垒；这里的小猫是可拖动的催化助手，不代表真实结构。",
      en: "MOF structures may stabilize intermediates or transition-state-like configurations, lowering the apparent barrier; the cat is a draggable helper mascot, not a structural model.",
    },
    interpretation: {
      zh: "稳定作用、孔道限域和证据置信度会共同影响当前路径的优先级变化，而不是直接给出实验结论。",
      en: "Stabilization, confinement, and evidence confidence jointly affect the pathway-priority shift without claiming an experimental result.",
    },
    descriptors: {
      zh: ["MOF 稳定作用", "孔道限域效应", "水稳定性标记", "热稳定性标记"],
      en: ["MOF stabilization", "pore confinement", "water stability flag", "thermal stability flag"],
    },
  },
  products: {
    number: "4",
    label: { zh: "产物", en: "Products" },
    short: { zh: "产物", en: "Products" },
    explanation: {
      zh: "产物侧显示反应坐标到达终点后的相对能量。ΔE 用于概念性表示反应前后能级差。",
      en: "The product side shows the relative energy after the reaction coordinate reaches the final state. ΔE conceptually marks the reactant-to-product energy difference.",
    },
    interpretation: {
      zh: "EcoMOF-AI 还会关注产物侧稳定性、选择性警示和竞争路径风险。",
      en: "EcoMOF-AI also tracks product-side stability, selectivity warnings, and competing-pathway risk.",
    },
    descriptors: {
      zh: ["产物侧稳定性", "选择性警示", "竞争路径风险"],
      en: ["product-side stability", "selectivity warning", "competing pathway risk"],
    },
  },
  deltaEa: {
    number: "5",
    label: { zh: "活化能降低量", en: "ΔEa reduction" },
    short: { zh: "ΔEₐ", en: "ΔEₐ" },
    explanation: {
      zh: "ΔEa 表示无催化路径与 MOF 催化路径之间的活化能差值。概念图中 ΔEa 越大，表示催化辅助越强。",
      en: "ΔEa is the difference between the uncatalyzed and MOF-catalyzed activation barriers. In this schematic, larger ΔEa means stronger catalytic assistance.",
    },
    interpretation: {
      zh: "该值连接到反应指纹、MOF 调控因子、路径可行性和算法追踪解释。",
      en: "This value connects reaction fingerprints, MOF modulation factors, pathway feasibility, and algorithm trace explanations.",
    },
    descriptors: {
      zh: ["Eₐ,no cat", "Eₐ,MOF", "ΔEa = Eₐ,no cat − Eₐ,MOF"],
      en: ["Ea,no cat", "Ea,MOF", "ΔEa = Ea,no cat - Ea,MOF"],
    },
  },
}

function smoothScrollTo(id) {
  if (typeof document === "undefined") return false
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

function xScale(progress) {
  return 92 + (clamp(progress, 0, 100) / 100) * 582
}

function profileY(progress, peakY, width = 0.15) {
  const p = clamp(progress, 0, 100) / 100
  const reactantY = 258
  const productY = 290
  const baseY = reactantY + (productY - reactantY) * p
  const center = 0.52
  const gaussian = Math.exp(-Math.pow((p - center) / width, 2))
  const peakBaseY = reactantY + (productY - reactantY) * center
  return baseY - (peakBaseY - peakY) * gaussian
}

function makeProfilePath(peakY, width) {
  const points = Array.from({ length: 72 }, (_, index) => {
    const progress = (index / 71) * 100
    return [xScale(progress), profileY(progress, peakY, width)]
  })
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
}

function MetricCard({ label, value, note, tone = "neutral", t }) {
  const toneColor = tone === "accent" ? "#B45309" : tone === "info" ? "#1A6DB5" : t.textStrong
  return (
    <article className="energy-playground-metric-card" style={{ borderColor: t.border }}>
      <span style={{ color: t.faint }}>{label}</span>
      <strong style={{ color: toneColor }}>{value}</strong>
      {note ? <small style={{ color: t.muted }}>{note}</small> : null}
    </article>
  )
}

function HotspotButton({ id, x, y, activeConcept, setActiveConcept, lang }) {
  const concept = conceptCopy[id]
  const active = activeConcept === id
  return (
    <g
      role="button"
      tabIndex="0"
      aria-label={text(lang, concept.label.zh, concept.label.en)}
      className="energy-playground-hotspot"
      data-active={active ? "true" : "false"}
      onClick={() => setActiveConcept(id)}
      onFocus={() => setActiveConcept(id)}
      onMouseEnter={() => setActiveConcept(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          setActiveConcept(id)
        }
      }}
      style={{ cursor: "pointer", outline: "none" }}
    >
      <circle cx={x} cy={y} r={active ? 15 : 13} fill={active ? "#FFF7ED" : "#FFFFFF"} stroke={active ? "#D97706" : "#94A3B8"} strokeWidth="2" />
      <text x={x} y={y + 4} fill={active ? "#9A3412" : "#334155"} fontSize="12" fontWeight="900" textAnchor="middle">
        {concept.number}
      </text>
      <text x={x + 20} y={y + 4} fill={active ? "#9A3412" : "#334155"} fontSize="12" fontWeight="820">
        {text(lang, concept.short.zh, concept.short.en)}
      </text>
    </g>
  )
}

function MofCube({ active, onActivate }) {
  return (
    <g
      role="button"
      tabIndex="0"
      aria-label="MOF catalyst"
      className="mof-cube-node"
      data-active={active ? "true" : "false"}
      onClick={onActivate}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onActivate()
        }
      }}
      transform="translate(518 204)"
      style={{ cursor: "pointer", outline: "none" }}
    >
      <path d="M0 13 L23 0 L47 13 L23 27 Z" fill="#DBEAFE" stroke="#1A6DB5" strokeWidth="2" />
      <path d="M0 13 L0 39 L23 53 L23 27 Z" fill="#E8F2FC" stroke="#1A6DB5" strokeWidth="2" />
      <path d="M47 13 L47 39 L23 53 L23 27 Z" fill="#BFDBFE" stroke="#1A6DB5" strokeWidth="2" />
      {[
        [0, 13],
        [23, 0],
        [47, 13],
        [0, 39],
        [23, 53],
        [47, 39],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#1A6DB5" />
      ))}
      <text x="23" y="73" fill="#1A6DB5" fontSize="12" fontWeight="900" textAnchor="middle">
        MOF
      </text>
    </g>
  )
}

function CatMascot({ x, y, active, isDragging, onPointerDown, onPointerMove, onPointerUp, onKeyDown }) {
  return (
    <g
      role="slider"
      tabIndex="0"
      aria-label="Draggable catalysis cat"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(((x - 92) / 582) * 100)}
      className="energy-cat-mascot"
      data-active={active ? "true" : "false"}
      data-dragging={isDragging ? "true" : "false"}
      transform={`translate(${x - 35} ${y - 68}) scale(0.78)`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      style={{ cursor: isDragging ? "grabbing" : "grab", outline: "none", touchAction: "none" }}
    >
      <path d="M-34 64 C-30 35 -13 17 12 18 C43 19 61 40 59 69 C58 93 42 108 17 108 C-18 108 -39 93 -34 64 Z" fill="#F8B66B" stroke="#7C2D12" strokeWidth="3" />
      <path d="M-17 27 L-30 4 L-5 13 Z" fill="#F8B66B" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
      <path d="M39 27 L56 6 L61 36 Z" fill="#F8B66B" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
      <ellipse cx="2" cy="49" rx="5" ry="6" fill="#111827" />
      <ellipse cx="35" cy="49" rx="5" ry="6" fill="#111827" />
      <circle cx="4" cy="47" r="1.7" fill="#FFFFFF" />
      <circle cx="37" cy="47" r="1.7" fill="#FFFFFF" />
      <path d="M19 61 C16 65 22 65 19 61 Z" fill="#9A3412" />
      <path d="M12 71 C17 76 24 76 30 71" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="2" />
      <path d="M-28 82 C-57 80 -59 50 -36 43" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
      <path d="M-28 82 C-57 80 -59 50 -36 43" fill="none" stroke="#F8B66B" strokeLinecap="round" strokeWidth="5" />
      <path d="M48 94 C76 89 80 65 65 54" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
      <path d="M48 94 C76 89 80 65 65 54" fill="none" stroke="#F8B66B" strokeLinecap="round" strokeWidth="5" />
      <path d="M0 107 C-7 122 7 130 15 113" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
      <path d="M38 106 C44 122 58 117 51 101" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
      <path d="M-6 82 C10 88 31 88 47 80" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="5" opacity="0.45" />
      <path d="M-5 36 C9 29 27 29 40 37" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="4" opacity="0.36" />
    </g>
  )
}

function SliderControl({ label, value, onChange, min = 0, max = 100, t }) {
  return (
    <label className="energy-playground-control">
      <span>
        <strong style={{ color: t.textStrong }}>{label}</strong>
        <output style={{ color: t.muted }}>{value}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  )
}

function activeMetricRows(activeConcept, metrics, lang) {
  const zh = lang === "zh"
  const rows = {
    reactants: [
      [zh ? "当前能级" : "Current energy level", "0 kJ·mol⁻¹"],
      [zh ? "初始反应状态" : "Initial state", zh ? "反应物侧" : "reactant side"],
    ],
    transitionState: [
      [zh ? "无催化活化能" : "Ea without catalyst", `${metrics.eaNoCatalyst} kJ·mol⁻¹`],
      [zh ? "MOF 催化活化能" : "Ea with MOF", `${metrics.eaWithMof} kJ·mol⁻¹`],
      [zh ? "ΔEa" : "ΔEa", `${metrics.deltaEa} kJ·mol⁻¹`],
      [zh ? "过渡态稳定评分" : "TS stabilization score", metrics.tsStabilizationScore.toFixed(2)],
    ],
    mofCatalyst: [
      [zh ? "MOF 稳定作用" : "MOF stabilization strength", `${metrics.mofStabilization}%`],
      [zh ? "孔道限域效应" : "Pore confinement", `${metrics.poreConfinement}%`],
      [zh ? "水稳定性标记" : "Water stability flag", metrics.waterStability],
      [zh ? "热稳定性标记" : "Thermal stability flag", metrics.thermalStability],
    ],
    products: [
      [zh ? "反应能 ΔE" : "Reaction energy ΔE", `${metrics.deltaE} kJ·mol⁻¹`],
      [zh ? "产物侧稳定性" : "Product-side stability", zh ? "概念性较低能级" : "conceptual lower-energy side"],
      [zh ? "选择性警示" : "Selectivity warning", zh ? "需比较竞争路径" : "compare competing routes"],
    ],
    deltaEa: [
      [zh ? "公式" : "Formula", "ΔEa = Ea,no cat − Ea,MOF"],
      [zh ? "动态值" : "Dynamic value", `${metrics.deltaEa} kJ·mol⁻¹`],
      [zh ? "解释" : "Interpretation", zh ? "概念图中数值越大表示催化辅助越强" : "larger value means stronger catalytic assistance in this schematic"],
    ],
  }
  return rows[activeConcept] || rows.transitionState
}

export function CatalysisEnergyBarrierDemo({ lang, t, isMobile, onNavigateToSection }) {
  const zh = lang === "zh"
  const chartRef = useRef(null)
  const [activeConcept, setActiveConcept] = useState("transitionState")
  const [mofStabilization, setMofStabilization] = useState(55)
  const [poreConfinement, setPoreConfinement] = useState(48)
  const [evidenceConfidence, setEvidenceConfidence] = useState("medium")
  const [catProgress, setCatProgress] = useState(38)
  const [isDragging, setIsDragging] = useState(false)

  const metrics = useMemo(() => {
    const eaNoCatalyst = 82
    const eaWithMof = Math.round(70 - mofStabilization * 0.28 - poreConfinement * 0.08)
    const deltaEa = eaNoCatalyst - eaWithMof
    const tsStabilizationScore = Math.min(1, mofStabilization * 0.006 + poreConfinement * 0.004)
    const confidenceFactor = confidenceFactorMap[evidenceConfidence] || confidenceFactorMap.medium
    const pathwayPriorityShift = deltaEa / 100 * confidenceFactor
    return {
      eaNoCatalyst,
      eaWithMof,
      deltaEa,
      tsStabilizationScore,
      pathwayPriorityShift,
      confidenceFactor,
      deltaE: -18,
      mofStabilization,
      poreConfinement,
      waterStability: mofStabilization > 62 ? text(lang, "需复核", "review") : text(lang, "待验证", "pending"),
      thermalStability: poreConfinement > 58 ? text(lang, "较稳健", "moderate") : text(lang, "待验证", "pending"),
    }
  }, [evidenceConfidence, lang, mofStabilization, poreConfinement])

  const diagram = useMemo(() => {
    const uncatPeakY = 78
    const reactantY = 258
    const productY = 290
    const catalyzedPeakY = profileY(52, 258 - (metrics.eaWithMof / metrics.eaNoCatalyst) * (258 - uncatPeakY), 0.13)
    const width = 0.18 - poreConfinement * 0.00065
    const catY = profileY(catProgress, catalyzedPeakY, width) + 18
    return {
      uncatPeakY,
      catalyzedPeakY,
      reactantY,
      productY,
      width,
      catX: xScale(catProgress),
      catY,
      uncatPath: makeProfilePath(uncatPeakY, 0.18),
      catalyzedPath: makeProfilePath(catalyzedPeakY, width),
    }
  }, [catProgress, metrics.eaNoCatalyst, metrics.eaWithMof, poreConfinement])

  const activeCopy = conceptCopy[activeConcept] || conceptCopy.transitionState
  const isNearTransition = catProgress >= 42 && catProgress <= 64
  const isProductSide = catProgress >= 78

  const goToSection = (id) => {
    if (smoothScrollTo(id)) return
    onNavigateToSection?.(id)
  }

  const updateProgressFromClientX = (clientX) => {
    if (!chartRef.current) return catProgress
    const rect = chartRef.current.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * 760
    const progress = ((svgX - 92) / 582) * 100
    const nextProgress = Math.round(clamp(progress, 0, 100))
    setCatProgress(nextProgress)
    return nextProgress
  }

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsDragging(true)
    setActiveConcept("mofCatalyst")
    updateProgressFromClientX(event.clientX)
  }

  const handlePointerMove = (event) => {
    if (!isDragging) return
    const nextProgress = updateProgressFromClientX(event.clientX)
    if (nextProgress >= 42 && nextProgress <= 64) setActiveConcept("transitionState")
    if (nextProgress >= 78) setActiveConcept("products")
  }

  const handlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)
  }

  const handleCatKeyDown = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      setCatProgress((current) => clamp(current - 5, 0, 100))
    }
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      setCatProgress((current) => clamp(current + 5, 0, 100))
    }
    if (event.key === "Home") {
      event.preventDefault()
      setCatProgress(0)
    }
    if (event.key === "End") {
      event.preventDefault()
      setCatProgress(100)
    }
  }

  const cardStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    display: "grid",
    gap: 14,
    padding: isMobile ? 13 : 16,
  }

  const statusNote = isProductSide
    ? text(lang, "小猫已到达产物侧：重点查看 ΔE 与竞争路径风险。", "The cat reached the product side: inspect ΔE and competing-pathway risk.")
    : isNearTransition
      ? text(lang, "小猫靠近过渡态：MOF 稳定作用与 Eₐ,MOF 正在高亮。", "The cat is near the transition state: MOF stabilization and Ea,MOF are highlighted.")
      : text(lang, "拖动小猫沿催化路径移动，右侧指标会随交互更新。", "Drag the cat along the catalyzed path; the right-side metrics update with the interaction.")

  return (
    <section className="catalysis-cat-demo energy-playground" style={cardStyle}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>
          {zh ? "概念交互模块" : "Concept interaction module"}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 21 : 24, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {zh ? "催化能垒交互工作台" : "Catalysis Energy Playground"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.58, margin: 0, maxWidth: 980 }}>
          {zh
            ? "拖动催化小猫，观察 MOF 相关描述符如何影响活化能、过渡态稳定与路径优先级判断。"
            : "Drag the catalyst helper and inspect how MOF-related descriptors may reshape the activation barrier, transition-state stabilization, and pathway priority."}
        </p>
      </div>

      <div className="energy-playground-layout" style={{ gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.5fr) minmax(320px, 0.9fr)" }}>
        <div className="energy-playground-chart-card" style={{ borderColor: t.border }}>
          <svg
            ref={chartRef}
            className="catalysis-energy-svg"
            viewBox="0 0 760 430"
            role="img"
            aria-label={zh ? "可交互 MOF 催化能垒示意图" : "Interactive MOF catalysis energy-barrier schematic"}
          >
            <defs>
              <linearGradient id="energyPlaygroundBg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
              <marker id="playgroundArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L8,4.5 L0,9 Z" fill="#475569" />
              </marker>
              <marker id="playgroundAccentArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L8,4.5 L0,9 Z" fill="#D97706" />
              </marker>
              <filter id="catSoftShadow" x="-25%" y="-25%" width="150%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#92400E" floodOpacity="0.16" />
              </filter>
            </defs>

            <rect x="0" y="0" width="760" height="430" rx="0" fill="url(#energyPlaygroundBg)" />
            <g stroke="#E2E8F0" strokeDasharray="4 8" strokeWidth="1">
              <line x1="86" y1="92" x2="694" y2="92" />
              <line x1="86" y1="170" x2="694" y2="170" />
              <line x1="86" y1="258" x2="694" y2="258" />
              <line x1="86" y1="290" x2="694" y2="290" />
            </g>

            <g stroke="#334155" strokeLinecap="round" strokeWidth="3.2">
              <line x1="82" y1="346" x2="702" y2="346" markerEnd="url(#playgroundArrow)" />
              <line x1="82" y1="346" x2="82" y2="58" markerEnd="url(#playgroundArrow)" />
            </g>
            <text x="360" y="389" fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle">
              {zh ? "反应坐标" : "Reaction coordinate"}
            </text>
            <text x="29" y="205" fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle" transform="rotate(-90 29 205)">
              {zh ? "能量" : "Energy"}
            </text>

            <path d={diagram.uncatPath} fill="none" stroke="#64748B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" opacity="0.7" />
            <path
              className="catalyst-curve-glow"
              d={diagram.catalyzedPath}
              fill="none"
              stroke={isNearTransition ? "#F97316" : "#F59E0B"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="6.5"
            />
            <path d={diagram.catalyzedPath} fill="none" stroke="#1A6DB5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" opacity="0.42" />

            <g strokeLinecap="round" strokeWidth="2.3">
              <line x1="128" y1={diagram.reactantY} x2="128" y2={diagram.uncatPeakY} stroke="#64748B" markerEnd="url(#playgroundArrow)" />
              <line x1="158" y1={diagram.reactantY} x2="158" y2={diagram.catalyzedPeakY} stroke="#D97706" markerEnd="url(#playgroundAccentArrow)" />
              <line x1="210" y1={diagram.uncatPeakY} x2="210" y2={diagram.catalyzedPeakY} stroke="#1A6DB5" strokeDasharray="4 6" markerEnd="url(#playgroundAccentArrow)" />
              <line x1="620" y1={diagram.reactantY} x2="620" y2={diagram.productY} stroke="#475569" strokeDasharray="4 6" markerEnd="url(#playgroundArrow)" />
            </g>
            <g className="energy-playground-formula-labels">
              <text x="104" y="170" fill="#475569" textAnchor="middle">
                Eₐ,no cat
              </text>
              <text x="185" y={(diagram.reactantY + diagram.catalyzedPeakY) / 2 + 5} fill="#B45309" textAnchor="start">
                Eₐ,MOF
              </text>
              <text x="225" y={(diagram.uncatPeakY + diagram.catalyzedPeakY) / 2 + 5} fill="#1A6DB5" textAnchor="start">
                ΔEₐ
              </text>
              <text x="635" y={(diagram.reactantY + diagram.productY) / 2 + 5} fill="#475569" textAnchor="start">
                ΔE
              </text>
            </g>

            <HotspotButton id="reactants" x={112} y={249} activeConcept={activeConcept} setActiveConcept={setActiveConcept} lang={lang} />
            <HotspotButton id="transitionState" x={360} y={diagram.catalyzedPeakY - 18} activeConcept={activeConcept} setActiveConcept={setActiveConcept} lang={lang} />
            <HotspotButton id="products" x={590} y={298} activeConcept={activeConcept} setActiveConcept={setActiveConcept} lang={lang} />
            <HotspotButton id="deltaEa" x={222} y={(diagram.uncatPeakY + diagram.catalyzedPeakY) / 2 - 20} activeConcept={activeConcept} setActiveConcept={setActiveConcept} lang={lang} />
            <MofCube active={activeConcept === "mofCatalyst"} onActivate={() => setActiveConcept("mofCatalyst")} />

            <g filter="url(#catSoftShadow)">
              <CatMascot
                x={diagram.catX}
                y={diagram.catY}
                active={activeConcept === "mofCatalyst" || isNearTransition}
                isDragging={isDragging}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleCatKeyDown}
              />
            </g>
          </svg>

          <div className="energy-playground-legend" style={{ color: t.muted }}>
            <span><i style={{ background: "#64748B" }} />{zh ? "无催化路径" : "Without catalyst"}</span>
            <span><i style={{ background: "#F59E0B" }} />{zh ? "MOF 催化路径" : "With MOF catalyst"}</span>
            <span><i style={{ background: "#1A6DB5" }} />{zh ? "MOF 微环境" : "MOF microenvironment"}</span>
            <span><i style={{ background: "#F8B66B" }} />{zh ? "可拖动催化小猫" : "Draggable cat helper"}</span>
          </div>
          <p className="energy-playground-status" style={{ color: t.muted }}>{statusNote}</p>
          <div className="energy-playground-stepper">
            <button type="button" onClick={() => setCatProgress((current) => clamp(current - 8, 0, 100))} style={toolbarBtn(t)}>
              {zh ? "小猫后退" : "Move cat backward"}
            </button>
            <span style={{ color: t.muted }}>{zh ? "反应进度" : "Reaction progress"}: {catProgress}%</span>
            <button type="button" onClick={() => setCatProgress((current) => clamp(current + 8, 0, 100))} style={toolbarBtn(t)}>
              {zh ? "小猫前进" : "Move cat forward"}
            </button>
          </div>
        </div>

        <aside className="energy-playground-panel" style={{ background: t.surface, borderColor: t.border }}>
          <div style={{ display: "grid", gap: 5 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
              {zh ? "科学指标面板" : "Scientific Metrics Panel"}
            </div>
            <h3 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.2, margin: 0 }}>
              {text(lang, activeCopy.label.zh, activeCopy.label.en)}
            </h3>
            <p style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.58, margin: 0 }}>{text(lang, activeCopy.explanation.zh, activeCopy.explanation.en)}</p>
          </div>

          <div className="energy-playground-metrics">
            <MetricCard label={zh ? "无催化活化能" : "Ea without catalyst"} value={`${metrics.eaNoCatalyst} kJ·mol⁻¹`} note="Eₐ,no cat" t={t} />
            <MetricCard label={zh ? "MOF 催化活化能" : "Ea with MOF catalyst"} value={`${metrics.eaWithMof} kJ·mol⁻¹`} note="Eₐ,MOF" tone="accent" t={t} />
            <MetricCard label={zh ? "活化能降低量" : "ΔEa reduction"} value={`${metrics.deltaEa} kJ·mol⁻¹`} note="Eₐ,no cat − Eₐ,MOF" tone="info" t={t} />
            <MetricCard label={zh ? "过渡态稳定评分" : "TS stabilization score"} value={metrics.tsStabilizationScore.toFixed(2)} note="0-1 proxy" t={t} />
            <MetricCard label={zh ? "路径优先级变化" : "Pathway priority shift"} value={`+${metrics.pathwayPriorityShift.toFixed(2)}`} note={zh ? "甲酸路径示例" : "formic-acid route example"} tone="info" t={t} />
            <MetricCard label={zh ? "证据置信度" : "Evidence confidence"} value={text(lang, confidenceLabels[evidenceConfidence].zh, confidenceLabels[evidenceConfidence].en)} note={`factor ${metrics.confidenceFactor.toFixed(2)}`} t={t} />
          </div>

          <div className="energy-playground-explanation" style={{ borderColor: t.border }}>
            <strong style={{ color: t.textStrong }}>{zh ? "EcoMOF-AI 解释" : "EcoMOF-AI interpretation"}</strong>
            <p style={{ color: t.muted }}>{text(lang, activeCopy.interpretation.zh, activeCopy.interpretation.en)}</p>
            <div className="energy-playground-active-rows">
              {activeMetricRows(activeConcept, metrics, lang).map(([label, value]) => (
                <div key={label}>
                  <span style={{ color: t.faint }}>{label}</span>
                  <strong style={{ color: t.textStrong }}>{value}</strong>
                </div>
              ))}
            </div>
            <div className="energy-playground-tags">
              {activeCopy.descriptors[zh ? "zh" : "en"].map((descriptor) => (
                <span key={descriptor} style={{ borderColor: t.border, color: t.textStrong }}>{descriptor}</span>
              ))}
            </div>
            <div className="energy-playground-formula-note" style={{ color: t.muted }}>
              <span className="formula">ΔE<sub>a</sub> = E<sub>a,no cat</sub> − E<sub>a,MOF</sub></span>
            </div>
          </div>

          <div className="energy-playground-controls">
            <SliderControl label={zh ? "MOF 稳定作用" : "MOF stabilization"} value={mofStabilization} onChange={setMofStabilization} t={t} />
            <SliderControl label={zh ? "孔道限域效应" : "Pore confinement"} value={poreConfinement} onChange={setPoreConfinement} t={t} />
            <div className="energy-playground-confidence" role="group" aria-label={zh ? "证据置信度" : "Evidence confidence"}>
              <span style={{ color: t.textStrong }}>{zh ? "证据置信度" : "Evidence confidence"}</span>
              <div>
                {["low", "medium", "high"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    data-active={evidenceConfidence === level ? "true" : "false"}
                    onClick={() => setEvidenceConfidence(level)}
                    style={{ borderColor: evidenceConfidence === level ? t.accent : t.border, color: evidenceConfidence === level ? t.accent : t.muted }}
                  >
                    {text(lang, confidenceLabels[level].zh, confidenceLabels[level].en)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="energy-playground-note">
            {zh
              ? "数值仅用于解释评分逻辑，并非实验或 DFT 计算结果。该图为概念解释示意，并非计算得到的势能面。"
              : "Illustrative values only. They explain the scoring logic and are not experimental or DFT results. This is a conceptual schematic, not a computed potential energy surface."}
          </div>

          <div className="energy-playground-cta">
            <button
              type="button"
              onClick={() => goToSection("organic-acid-workbench")}
              style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", justifyContent: "center", minHeight: 38, padding: "8px 10px" }}
            >
              {zh ? "进入有机酸工作台" : "Enter organic acid workbench"}
            </button>
            <button
              type="button"
              onClick={() => goToSection("algorithm-trace-explorer")}
              style={{ ...toolbarBtn(t), justifyContent: "center", minHeight: 36, padding: "8px 10px" }}
            >
              {zh ? "查看算法判断过程" : "View algorithm trace"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
