// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { fetchDataJson, toolbarBtn } from "../../shared"
import { CatEffectContributionPanel } from "./CatEffectContributionPanel"
import { CatEnergyCurve } from "./CatEnergyCurve"
import { CatScienceMetricsPanel } from "./CatScienceMetricsPanel"
import { DescriptorTreatChips } from "./DescriptorTreatChips"
import { CAT_MOF_OPTIONS, catScienceZoneForPoint, clamp, computeCatEnergyState } from "./catEnergyModel"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const FALLBACK_PATHWAY = {
  id: "formic-acid",
  labelZh: "甲酸路径",
  labelEn: "Formic acid pathway",
  baselineEa: 72,
  baselineDeltaE: -6,
  evidenceLevel: "C",
  notesZh: "甲酸路径适合作为优先解释路径，但仍需同条件验证。",
  notesEn: "The formic acid pathway is prioritized for explanation but still needs same-condition validation.",
  descriptorWeights: {},
}

function smoothScrollTo(id) {
  if (typeof document === "undefined") return false
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ behavior: "smooth", block: "start" })
  return true
}

function selectorStyle(t) {
  return {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    color: t.text,
    minHeight: 40,
    padding: "8px 10px",
    width: "100%",
  }
}

export function CatalysisEnergyBarrierDemo({ lang, t, isMobile, onNavigateToSection }) {
  const zh = lang === "zh"
  const [descriptors, setDescriptors] = useState([])
  const [pathways, setPathways] = useState([FALLBACK_PATHWAY])
  const [pathwayId, setPathwayId] = useState("formic-acid")
  const [mofId, setMofId] = useState("uio66nh2")
  const [selectedDescriptorIds, setSelectedDescriptorIds] = useState(["pore-matching", "polar-functional-group"])
  const [catProgress, setCatProgress] = useState(52)
  const [catSciencePoint, setCatSciencePoint] = useState(null)
  const [catResetToken, setCatResetToken] = useState(0)
  const [showNote, setShowNote] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    let active = true
    fetchDataJson("cat_energy_descriptors_demo.json", []).then(rows => {
      if (active) setDescriptors(Array.isArray(rows) ? rows : [])
    }).catch(() => active && setDescriptors([]))
    fetchDataJson("cat_energy_pathways_demo.json", []).then(rows => {
      if (active) setPathways(Array.isArray(rows) && rows.length ? rows : [FALLBACK_PATHWAY])
    }).catch(() => active && setPathways([FALLBACK_PATHWAY]))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(Boolean(query?.matches))
    sync()
    query?.addEventListener?.("change", sync)
    return () => query?.removeEventListener?.("change", sync)
  }, [])

  const pathway = pathways.find(item => item.id === pathwayId) || pathways[0] || FALLBACK_PATHWAY
  const mof = CAT_MOF_OPTIONS.find(item => item.id === mofId) || CAT_MOF_OPTIONS[1]
  const catScienceZone = useMemo(() => catSciencePoint ? catScienceZoneForPoint(catSciencePoint) : null, [catSciencePoint])
  const state = useMemo(() => computeCatEnergyState({ pathway, descriptors, selectedDescriptorIds, mof, catProgress, catScienceZone }), [pathway, descriptors, selectedDescriptorIds, mof, catProgress, catScienceZone])

  const toggleDescriptor = (id) => {
    setShowNote(true)
    setSelectedDescriptorIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  const reset = () => {
    setSelectedDescriptorIds([])
    setCatProgress(52)
    setCatSciencePoint(null)
    setCatResetToken(current => current + 1)
    setMofId("uio66nh2")
    setPathwayId("formic-acid")
    setShowNote(true)
  }

  const goToSection = (id) => {
    if (smoothScrollTo(id)) return
    onNavigateToSection?.(id)
  }

  return (
    <section className="catalysis-cat-demo energy-playground" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 14, padding: isMobile ? 13 : 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0, textTransform: "uppercase" }}>
          {zh ? "Demo / hypothesis-based visualization" : "Demo / hypothesis-based visualization"}
        </div>
        <h2 style={{ color: t.textStrong, fontSize: isMobile ? 21 : 24, fontWeight: 940, lineHeight: 1.16, margin: 0 }}>
          {zh ? "催化小猫能量游乐场" : "Catalyst Cat Energy Playground"}
        </h2>
        <p style={{ color: t.muted, fontSize: 12.8, lineHeight: 1.58, margin: 0, maxWidth: 1040 }}>
          {text(
            lang,
            "拖动催化小猫和描述符卡片，观察 MOF 相关因素如何影响活化能、过渡态稳定与路径优先级判断。",
            "Drag the catalyst cat and descriptor chips to see how MOF-related factors may affect activation energy, transition-state stabilization, and pathway priority."
          )}
        </p>
      </header>

      <div className="cat-playground-controls" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <label>
          <span style={{ color: t.faint }}>{zh ? "路径选择" : "Pathway"}</span>
          <select value={pathwayId} onChange={event => { setPathwayId(event.target.value); setShowNote(true) }} style={selectorStyle(t)}>
            {pathways.map(item => <option key={item.id} value={item.id}>{zh ? item.labelZh : item.labelEn}</option>)}
          </select>
        </label>
        <label>
          <span style={{ color: t.faint }}>{zh ? "MOF 对比模式" : "MOF comparison"}</span>
          <select value={mofId} onChange={event => { setMofId(event.target.value); setShowNote(true) }} style={selectorStyle(t)}>
            {CAT_MOF_OPTIONS.map(item => <option key={item.id} value={item.id}>{zh ? item.labelZh : item.labelEn}</option>)}
          </select>
        </label>
        <div className="cat-zone-pill" style={{ background: t.surface, borderColor: t.border }}>
          <span style={{ color: t.faint }}>{zh ? "小猫位置" : "Cat zone"}</span>
          <strong style={{ color: t.textStrong }}>{zh ? state.zone.labelZh : state.zone.labelEn}</strong>
        </div>
        <button type="button" onClick={reset} style={{ ...toolbarBtn(t), justifyContent: "center", minHeight: 40 }}>
          {zh ? "Reset：清空描述符并复位" : "Reset descriptors and cat"}
        </button>
      </div>

      <div className="energy-playground-layout" style={{ gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.55fr) minmax(330px, 0.9fr)" }}>
        <div
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault()
            const id = event.dataTransfer.getData("text/plain")
            if (id) toggleDescriptor(id)
          }}
        >
          <CatEnergyCurve
            lang={lang}
            t={t}
            state={state}
            catProgress={catProgress}
            setCatProgress={setCatProgress}
            onCatPointChange={setCatSciencePoint}
            onNavigateZone={goToSection}
            showNote={showNote}
            setShowNote={setShowNote}
            reducedMotion={reducedMotion}
            resetToken={catResetToken}
            resetCat={() => setCatProgress(52)}
          />
        </div>
        <CatScienceMetricsPanel state={state} pathway={pathway} mof={mof} lang={lang} t={t} />
      </div>

      <DescriptorTreatChips descriptors={descriptors} selectedIds={selectedDescriptorIds} toggleDescriptor={toggleDescriptor} lang={lang} t={t} />
      <CatEffectContributionPanel contributions={state.contributions} lang={lang} t={t} />

      <footer className="energy-playground-boundary" style={{ background: t.badgeWarnBg, borderColor: t.warn, color: t.muted }}>
        {zh
          ? "该图用于解释 MOF 描述符可能如何影响反应能垒和路径优先级，属于交互式假设可视化，不代表真实 DFT 能量曲线或实验产率。"
          : "This visualization explains how MOF-related descriptors may influence reaction barriers and pathway priority. It is an interactive hypothesis view, not a DFT energy profile or experimental yield prediction."}
      </footer>

      <div className="energy-playground-cta">
        <button type="button" onClick={() => goToSection("organic-acid-workbench")} style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", justifyContent: "center", minHeight: 38, padding: "8px 10px" }}>
          {zh ? "进入有机酸工作台" : "Enter organic acid workbench"}
        </button>
        <button type="button" onClick={() => goToSection("algorithm-trace-explorer")} style={{ ...toolbarBtn(t), justifyContent: "center", minHeight: 36, padding: "8px 10px" }}>
          {zh ? "查看算法判断过程" : "View algorithm trace"}
        </button>
      </div>
    </section>
  )
}
