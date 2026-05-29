// @ts-nocheck
import { useState } from "react"
import { toolbarBtn } from "../../shared"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const HOTSPOTS = {
  reactants: {
    label: "Reactants",
    zh: "反应物",
    enDetail: "Initial chemical state before crossing the catalytic energy barrier.",
    zhDetail: "反应物处于反应开始前的初始能量状态。",
  },
  transition: {
    label: "Transition state",
    zh: "过渡态",
    enDetail: "High-energy configuration that controls the activation barrier.",
    zhDetail: "决定活化能高低的高能过渡构型。",
  },
  products: {
    label: "Products",
    zh: "产物",
    enDetail: "Final state after the reaction coordinate reaches the product side.",
    zhDetail: "反应路径到达产物侧后的最终状态。",
  },
  catalyst: {
    label: "MOF catalyst",
    zh: "MOF 催化剂",
    enDetail: "MOF structures may stabilize intermediates or transition-state-like configurations, lowering the apparent barrier.",
    zhDetail: "MOF 可能通过稳定中间体或类过渡态构型来降低表观能垒。",
  },
  deltaEa: {
    label: "Delta Ea",
    display: "ΔEa",
    zh: "能垒差",
    enDetail: "Difference between the uncatalyzed and catalyzed activation barriers.",
    zhDetail: "无催化路径与催化路径之间的活化能差值。",
  },
}

const concepts = [
  {
    en: "Lower activation barrier",
    zh: "降低活化能",
    enBody: "Catalysis changes the accessible route so less energy is needed to cross the key barrier.",
    zhBody: "催化剂改变可达路径，使反应跨越关键能垒所需能量更低。",
  },
  {
    en: "Stabilize transition state",
    zh: "稳定过渡态",
    enBody: "Open sites, pore fields, or functional groups may stabilize barrier-controlling configurations.",
    zhBody: "开放位点、孔道环境或官能团可能稳定控制能垒的构型。",
  },
  {
    en: "Guide pathway selection",
    zh: "引导路径选择",
    enBody: "Barrier shifts connect to reaction fingerprints, MOF modulation factors, feasibility, priority, and trace explanations.",
    zhBody: "能垒变化会连接到反应指纹、MOF 调制因子、可行性、优先级和算法追踪解释。",
  },
]

function smoothScrollTo(id) {
  if (typeof document === "undefined") return false
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

function HotspotLabel({ id, x, y, activeHotspot, setActiveHotspot, children }) {
  const active = activeHotspot === id
  const activate = () => setActiveHotspot(id)
  return (
    <g
      role="button"
      tabIndex="0"
      aria-label={HOTSPOTS[id]?.label || id}
      onClick={activate}
      onFocus={activate}
      onMouseEnter={activate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          activate()
        }
      }}
      style={{ cursor: "pointer", outline: "none" }}
    >
      <rect x={x - 9} y={y - 18} width={Math.max(74, String(children).length * 7.2)} height="24" rx="8" fill={active ? "#FFF7ED" : "#FFFFFF"} stroke={active ? "#D97706" : "#D9E2EC"} />
      <text x={x} y={y - 2} fill={active ? "#9A3412" : "#334155"} fontSize="12" fontWeight={active ? "850" : "720"}>{children}</text>
    </g>
  )
}

export function CatalysisEnergyBarrierDemo({ lang, t, isMobile, onNavigateToSection }) {
  const zh = lang === "zh"
  const [activeHotspot, setActiveHotspot] = useState("catalyst")
  const active = HOTSPOTS[activeHotspot] || HOTSPOTS.catalyst

  const goToSection = (id) => {
    if (smoothScrollTo(id)) return
    onNavigateToSection?.(id)
  }

  const cardStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    display: "grid",
    gap: 14,
    padding: isMobile ? 13 : 16,
  }

  return (
    <section className="catalysis-cat-demo" style={cardStyle}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>
          {zh ? "概念过渡动画" : "Concept transition demo"}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 21 : 24, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {zh ? "催化猫：能垒降低示意" : "Catalysis Cat: Energy Barrier Demo"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.58, margin: 0, maxWidth: 940 }}>
          {zh
            ? "用轻量动画说明 MOF 催化剂如何降低活化能，并影响反应路径判断。"
            : "A playful schematic showing how MOF catalysts may lower activation barriers and reshape reaction pathway decisions."}
        </p>
      </div>

      <div style={{ alignItems: "stretch", display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.55fr) minmax(300px, 0.85fr)" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, minWidth: 0, overflow: "hidden", padding: isMobile ? 8 : 12 }}>
          <svg className="catalysis-energy-svg" viewBox="0 0 760 430" role="img" aria-label={zh ? "MOF 催化降低活化能概念图" : "Conceptual energy profile for MOF-catalyzed barrier lowering"}>
            <defs>
              <linearGradient id="catBarrierBg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
              <marker id="catArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L8,4.5 L0,9 Z" fill="#475569" />
              </marker>
              <marker id="orangeArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L8,4.5 L0,9 Z" fill="#D97706" />
              </marker>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
                <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#92400E" floodOpacity="0.16" />
              </filter>
            </defs>

            <rect x="0" y="0" width="760" height="430" fill="url(#catBarrierBg)" />
            <g stroke="#CBD5E1" strokeDasharray="4 8" strokeWidth="1">
              <line x1="86" y1="96" x2="690" y2="96" />
              <line x1="86" y1="178" x2="690" y2="178" />
              <line x1="86" y1="300" x2="690" y2="300" />
            </g>

            <g stroke="#334155" strokeLinecap="round" strokeWidth="3.4">
              <line x1="82" y1="346" x2="700" y2="346" markerEnd="url(#catArrow)" />
              <line x1="82" y1="346" x2="82" y2="58" markerEnd="url(#catArrow)" />
            </g>
            <text x="360" y="389" fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle">Reaction coordinate</text>
            <text x="29" y="205" fill="#1E293B" fontSize="18" fontWeight="900" textAnchor="middle" transform="rotate(-90 29 205)">Energy</text>

            <path d="M105 260 C170 255 235 253 286 244 C347 231 359 87 431 82 C524 77 564 282 660 292" fill="none" stroke="#64748B" strokeLinecap="round" strokeWidth="6" opacity="0.72" />
            <path className="catalyst-curve-glow" d="M105 260 C172 255 236 254 292 246 C349 237 361 179 418 175 C502 171 547 277 660 292" fill="none" stroke="#F59E0B" strokeLinecap="round" strokeWidth="6.5" />
            <path d="M105 260 C172 255 236 254 292 246 C349 237 361 179 418 175 C502 171 547 277 660 292" fill="none" stroke="#B45309" strokeLinecap="round" strokeWidth="2" opacity="0.35" />

            <text x="468" y="76" fill="#64748B" fontSize="13" fontWeight="850">Without catalyst</text>
            <text x="464" y="164" fill="#B45309" fontSize="13" fontWeight="900">With MOF catalyst</text>

            <g strokeLinecap="round" strokeWidth="2.4">
              <line x1="170" y1="260" x2="170" y2="86" stroke="#64748B" markerEnd="url(#catArrow)" />
              <line x1="184" y1="260" x2="184" y2="176" stroke="#D97706" markerEnd="url(#orangeArrow)" />
              <line x1="206" y1="92" x2="206" y2="176" stroke="#D97706" strokeDasharray="4 6" markerEnd="url(#orangeArrow)" />
            </g>
            <text x="124" y="167" fill="#475569" fontSize="13" fontWeight="850" transform="rotate(-90 124 167)">Ea without catalyst</text>
            <text x="208" y="223" fill="#B45309" fontSize="13" fontWeight="900" transform="rotate(-90 208 223)">Ea with MOF catalyst</text>
            <text x="224" y="134" fill="#B45309" fontSize="15" fontWeight="950">ΔEa</text>
            <text x="142" y="311" fill="#475569" fontSize="13" fontWeight="850">ΔE</text>

            <HotspotLabel id="reactants" x={108} y={252} activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot}>Reactants</HotspotLabel>
            <HotspotLabel id="transition" x={365} y={74} activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot}>Transition state</HotspotLabel>
            <HotspotLabel id="products" x={613} y={293} activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot}>Products</HotspotLabel>
            <HotspotLabel id="deltaEa" x={234} y={117} activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot}>ΔEa</HotspotLabel>

            <g
              role="button"
              tabIndex="0"
              aria-label="MOF catalyst"
              className="energy-cat-mascot"
              filter="url(#softShadow)"
              onClick={() => setActiveHotspot("catalyst")}
              onFocus={() => setActiveHotspot("catalyst")}
              onMouseEnter={() => setActiveHotspot("catalyst")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setActiveHotspot("catalyst")
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <g transform="translate(376 176)">
                <path d="M-58 69 C-54 38 -34 19 -6 20 C27 21 48 44 48 76 C48 102 31 119 4 119 C-34 119 -63 101 -58 69 Z" fill="#F7B267" stroke="#7C2D12" strokeWidth="3" />
                <path d="M-38 28 L-52 3 L-23 14 Z" fill="#F7B267" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
                <path d="M26 28 L46 5 L52 38 Z" fill="#F7B267" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
                <ellipse cx="-16" cy="52" rx="5.3" ry="6.4" fill="#111827" />
                <ellipse cx="20" cy="53" rx="5.3" ry="6.4" fill="#111827" />
                <circle cx="-14" cy="50" r="1.8" fill="#FFFFFF" />
                <circle cx="22" cy="51" r="1.8" fill="#FFFFFF" />
                <path d="M0 66 C-3 70 3 70 0 66 Z" fill="#9A3412" />
                <path d="M-7 76 C-3 81 3 81 8 76" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="2" />
                <path d="M-48 91 C-76 89 -78 55 -55 48" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
                <path d="M-48 91 C-76 89 -78 55 -55 48" fill="none" stroke="#F7B267" strokeLinecap="round" strokeWidth="5" />
                <path d="M39 105 C71 99 74 72 57 61" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
                <path d="M39 105 C71 99 74 72 57 61" fill="none" stroke="#F7B267" strokeLinecap="round" strokeWidth="5" />
                <path d="M-18 118 C-23 134 -9 142 -1 124" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
                <path d="M24 118 C29 135 44 130 37 113" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
                <path d="M-27 90 C-11 96 13 96 31 88" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="5" opacity="0.45" />
                <path d="M-28 38 C-15 31 4 31 18 39" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="4" opacity="0.38" />
              </g>
              <g transform="translate(468 266)">
                <g className="mof-cube-node">
                  <path d="M0 12 L21 0 L43 12 L21 25 Z" fill="#DBEAFE" stroke="#1A6DB5" strokeWidth="2" />
                  <path d="M0 12 L0 36 L21 49 L21 25 Z" fill="#E8F2FC" stroke="#1A6DB5" strokeWidth="2" />
                  <path d="M43 12 L43 36 L21 49 L21 25 Z" fill="#BFDBFE" stroke="#1A6DB5" strokeWidth="2" />
                  {[ [0,12], [21,0], [43,12], [0,36], [21,49], [43,36] ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#1A6DB5" />)}
                  <text x="21" y="68" fill="#1A6DB5" fontSize="12" fontWeight="900" textAnchor="middle">MOF</text>
                </g>
              </g>
            </g>
            <text x="402" y="324" fill="#9A3412" fontSize="12" fontWeight="850" textAnchor="middle">tiny catalyst helper</text>
          </svg>
        </div>

        <aside style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 13 }}>
          <div style={{ display: "grid", gap: 5 }}>
            <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
              {zh ? "当前标签" : "Selected hotspot"}
            </div>
            <h3 style={{ color: t.textStrong, fontSize: 17, lineHeight: 1.2, margin: 0 }}>
              {(active.display || active.label)} <span style={{ color: t.muted, fontSize: 13, fontWeight: 800 }}>{zh ? active.zh : active.zh}</span>
            </h3>
            <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
              {text(lang, active.zhDetail, active.enDetail)}
            </p>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {concepts.map((concept) => (
              <article key={concept.en} style={{ background: "#FFFFFF", border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 10 }}>
                <strong style={{ color: t.textStrong, fontSize: 12.4, lineHeight: 1.3 }}>{text(lang, concept.zh, concept.en)}</strong>
                <span style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}>{text(lang, concept.zhBody, concept.enBody)}</span>
              </article>
            ))}
          </div>

          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, color: "#7C2D12", fontSize: 11.7, lineHeight: 1.5, padding: 10 }}>
            {zh
              ? "该图为概念解释示意，并非计算得到的势能面。"
              : "Simplified schematic for conceptual explanation; not a computed potential energy surface."}
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "1fr" }}>
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
