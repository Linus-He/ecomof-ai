import { useEffect, useMemo, useRef, useState } from "react"
import { BrandMotif, BrandNode } from "../brand"
import { InlineFormula } from "../ui"
import { FONT_MONO } from "../../constants/theme"

const DESCRIPTORS = [
  "surfaceArea",
  "poreSizeA",
  "poreVolume",
  "co2Uptake",
  "bandGap",
  "waterStability",
  "thermalStability",
  "toxicityConcern",
]

const STATUS_BY_DESCRIPTOR = [
  "curated",
  "curated",
  "pending",
  "curated",
  "needs review",
  "curated",
  "needs review",
  "demo only",
]

const RANKINGS = [
  { name: "UiO-66", score: 0.74, completeness: "6/8", confidence: "medium-high", warning: "2 fields need review" },
  { name: "MOF-801", score: 0.68, completeness: "5/8", confidence: "medium", warning: "pending poreVolume" },
  { name: "HKUST-1", score: 0.59, completeness: "8/8", confidence: "demo only", warning: "water stability risk" },
]

function useActiveStep(count, disabled = false) {
  const refs = useRef([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (disabled) {
      setActive(count - 1)
      return undefined
    }
    if (typeof IntersectionObserver === "undefined") return undefined

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      const index = refs.current.findIndex(node => node === visible.target)
      if (index >= 0) setActive(index)
    }, { threshold: [0.35, 0.55, 0.72], rootMargin: "-18% 0px -32% 0px" })

    refs.current.forEach(node => {
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [count, disabled])

  const setRef = (index) => (node) => {
    refs.current[index] = node
  }

  return [active, setRef, setActive]
}

function StepTextCard({ step, index, active, setRef, setActive, t, isMobile }) {
  const isActive = active === index
  return (
    <article
      ref={setRef(index)}
      tabIndex={0}
      onFocus={() => setActive(index)}
      className="narrative-step-card"
      data-active={isActive ? "true" : "false"}
      style={{
        background: isActive ? t.badgeInfoBg : t.panel,
        border: `1px solid ${isActive ? t.accent : t.border}`,
        borderRadius: 12,
        padding: isMobile ? 16 : 20,
        boxShadow: isActive ? t.shadowSm : "none",
        minHeight: isMobile ? 0 : 190,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BrandNode active={isActive} t={t}>{String(index + 1).padStart(2, "0")}</BrandNode>
        <div style={{ color: isActive ? t.accentText : t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
          {step.eyebrow}
        </div>
      </div>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 18 : 23, lineHeight: 1.2, fontWeight: 950 }}>
        {step.title}
      </h3>
      <p style={{ margin: 0, color: t.muted, fontSize: 13, lineHeight: 1.65 }}>
        {step.body}
      </p>
      <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.55, fontWeight: 780 }}>
        {step.note}
      </div>
    </article>
  )
}

function DescriptorNetwork({ activeStep, t }) {
  return (
    <div className="decision-visual-network" style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: 9,
    }}>
      {DESCRIPTORS.map((descriptor, index) => {
        const status = STATUS_BY_DESCRIPTOR[index]
        const dim = activeStep === 0 ? false : status === "pending" || status === "demo only"
        return (
          <div
            key={descriptor}
            className="decision-descriptor-node"
            data-active={activeStep >= 0 ? "true" : "false"}
            style={{
              "--node-delay": `${index * 45}ms`,
              background: dim ? t.panel : t.badgeInfoBg,
              border: `1px ${activeStep >= 1 && status === "pending" ? "dashed" : "solid"} ${dim ? t.borderStrong : t.accent}`,
              color: dim ? t.subtle : t.accentText,
              clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)",
              minHeight: 48,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: "8px 9px",
              fontSize: 10.5,
              lineHeight: 1.25,
              fontWeight: 850,
            }}
          >
            {descriptor}
            {activeStep >= 1 && (
              <span style={{ display: "block", color: dim ? t.faint : t.textStrong, fontSize: 8.8, fontWeight: 800, marginTop: 3 }}>
                {status}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WeightingVisual({ activeStep, t }) {
  const rows = [
    ["raw values", 46],
    ["normalized values", 68],
    ["weighted indicators", 76],
    ["score contribution", 81],
  ]
  return (
    <div className="decision-weighting-visual" style={{ display: "grid", gap: 10 }}>
      {rows.map(([label, value], index) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: "128px minmax(0, 1fr) auto", gap: 9, alignItems: "center" }}>
          <span style={{ color: t.subtle, fontSize: 11, fontWeight: 850 }}>{label}</span>
          <span style={{ height: 9, borderRadius: 999, border: `1px solid ${t.border}`, background: t.panel, overflow: "hidden" }}>
            <span className="decision-flow-bar" style={{
              display: "block",
              width: activeStep >= 2 ? `${value}%` : "16%",
              height: "100%",
              background: index >= 2 ? (t.violet || t.accent) : t.accent,
            }} />
          </span>
          <span style={{ color: t.textStrong, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{value}%</span>
        </div>
      ))}
      <div style={{ marginTop: 4, color: t.muted, fontSize: 12, lineHeight: 1.55 }}>
        <InlineFormula math="S_i = \\sum_j w_j \\cdot \\tilde{x}_{ij}" fallback="S_i = sum_j w_j * x_ij_normalized" />
      </div>
    </div>
  )
}

function RankingVisual({ activeStep, t }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {RANKINGS.map((candidate, index) => (
        <div
          key={candidate.name}
          className="decision-ranking-row"
          data-active={activeStep >= 3 ? "true" : "false"}
          style={{
            "--rank-delay": `${index * 80}ms`,
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            gap: 10,
            alignItems: "center",
            background: index === 0 ? t.badgeInfoBg : t.panel,
            border: `1px solid ${index === 0 ? t.accent : t.border}`,
            borderRadius: 9,
            padding: "10px 11px",
          }}
        >
          <BrandNode active={index === 0} t={t} style={{ width: 28, height: 28, fontSize: 10 }}>
            {index + 1}
          </BrandNode>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", color: t.textStrong, fontSize: 13, fontWeight: 950, lineHeight: 1.2 }}>{candidate.name}</span>
            <span style={{ display: "block", color: t.faint, fontSize: 10.5, lineHeight: 1.4, marginTop: 3 }}>
              {candidate.completeness} · {candidate.confidence} · {candidate.warning}
            </span>
          </span>
          <span style={{ color: t.textStrong, fontFamily: FONT_MONO, fontSize: 14, fontWeight: 950 }}>{candidate.score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

function DescriptorDecisionVisual({ activeStep, t }) {
  return (
    <div className="decision-visual-panel" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      boxShadow: t.shadowSm,
      padding: 18,
      display: "grid",
      gap: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      <BrandMotif size={210} color={t.accentText} opacity={0.055} style={{ position: "absolute", right: -48, top: -52, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: t.faint, fontSize: 10.5, textTransform: "uppercase", fontWeight: 900, letterSpacing: 0 }}>
            Decision-support pipeline
          </div>
          <div style={{ color: t.textStrong, fontSize: 18, fontWeight: 950, lineHeight: 1.2, marginTop: 5 }}>
            {["Descriptor collection", "Evidence mapping", "Weighting & normalization", "Candidate ranking"][activeStep]}
          </div>
        </div>
        <span style={{ color: t.accentText, background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, padding: "6px 9px", fontSize: 10.5, fontWeight: 900 }}>
          step {activeStep + 1}/4
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 16 }}>
        <DescriptorNetwork activeStep={activeStep} t={t} />
        {(activeStep >= 2) && <WeightingVisual activeStep={activeStep} t={t} />}
        {(activeStep >= 3) && <RankingVisual activeStep={activeStep} t={t} />}
      </div>
      <div style={{ position: "relative", zIndex: 1, color: t.faint, fontSize: 11, lineHeight: 1.55, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
        The visual changes with the active scroll step. It illustrates data quality and scoring logic, not a validated prediction claim.
      </div>
    </div>
  )
}

export function ScrollNarrative({ t, isMobile, reducedMotion }) {
  const steps = useMemo(() => [
    {
      eyebrow: "Step 1",
      title: "Descriptor collection",
      body: "EcoMOF-AI first organizes MOF records into eight inspectable descriptors rather than starting from a black-box score.",
      note: "Surface area, pore size, pore volume, CO2 uptake, band gap, water stability, thermal stability, and toxicity concern become one review surface.",
    },
    {
      eyebrow: "Step 2",
      title: "Evidence mapping",
      body: "Each descriptor keeps a data-state language: curated, pending, needs review, or demo only.",
      note: "This is where provenance and evidence level stay attached to the record, so missing data remains visible.",
    },
    {
      eyebrow: "Step 3",
      title: "Weighting & normalization",
      body: "Indicators are normalized and weighted before a candidate score is shown.",
      note: "The calculation remains interpretable and can be questioned field by field.",
    },
    {
      eyebrow: "Step 4",
      title: "Candidate ranking",
      body: "Ranking combines score, descriptor completeness, confidence, and uncertainty warnings.",
      note: "The output is a decision-support priority, not final experimental evidence.",
    },
  ], [])

  const [activeStep, setRef, setActiveStep] = useActiveStep(steps.length, reducedMotion || isMobile)

  if (isMobile) {
    return (
      <section className="scroll-narrative-section" style={{ display: "grid", gap: 14 }}>
        {steps.map((step, index) => (
          <div key={step.title} style={{ display: "grid", gap: 10 }}>
            <StepTextCard step={step} index={index} active={index} setRef={() => () => {}} setActive={() => {}} t={t} isMobile={isMobile} />
            <DescriptorDecisionVisual activeStep={index} t={t} />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="scroll-narrative-section" style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 0.9fr) minmax(420px, 1.1fr)",
      gap: 28,
      alignItems: "start",
    }}>
      <div style={{ display: "grid", gap: 22, padding: "8px 0 80px" }}>
        {steps.map((step, index) => (
          <StepTextCard
            key={step.title}
            step={step}
            index={index}
            active={activeStep}
            setRef={setRef}
            setActive={setActiveStep}
            t={t}
            isMobile={isMobile}
          />
        ))}
      </div>
      <div className="decision-sticky-wrap" style={{ position: "sticky", top: 128, alignSelf: "start" }}>
        <DescriptorDecisionVisual activeStep={activeStep} t={t} />
      </div>
    </section>
  )
}
