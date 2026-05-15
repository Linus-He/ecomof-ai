import { useEffect, useMemo, useRef, useState } from "react"
import { getDescriptorsForPreset } from "../../scoring"
import { FONT_MONO } from "../../constants/theme"
import { BrandMotif, BrandNode } from "../brand"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const STATUS_BY_KEY = {
  surfaceArea: { label: "curated", zhLabel: "已整理", tone: "curated" },
  poreSizeA: { label: "curated", zhLabel: "已整理", tone: "curated" },
  poreVolume: { label: "pending", zhLabel: "待复核", tone: "pending" },
  co2Uptake: { label: "curated", zhLabel: "已整理", tone: "curated" },
  bandGap: { label: "needs check", zhLabel: "需检查", tone: "review" },
  waterStability: { label: "curated", zhLabel: "已整理", tone: "curated" },
  thermalStability: { label: "needs check", zhLabel: "需检查", tone: "review" },
  toxicityConcern: { label: "demo data", zhLabel: "演示数据", tone: "demo" },
}

const NODE_POSITIONS = [
  { x: 50, y: 12 },
  { x: 78, y: 23 },
  { x: 84, y: 50 },
  { x: 72, y: 77 },
  { x: 50, y: 88 },
  { x: 27, y: 77 },
  { x: 16, y: 50 },
  { x: 23, y: 23 },
]

const DESCRIPTOR_NODES = getDescriptorsForPreset("coreMof8").map((descriptor, index) => ({
  key: descriptor.key,
  label: descriptor.label,
  labelZh: descriptor.labelZh,
  group: descriptor.group,
  unit: descriptor.unit,
  status: STATUS_BY_KEY[descriptor.key] || { label: "pending", zhLabel: "待复核", tone: "pending" },
  ...NODE_POSITIONS[index],
}))

const WEIGHT_ROWS = [
  { key: "co2Uptake", weight: 0.23 },
  { key: "waterStability", weight: 0.18 },
  { key: "surfaceArea", weight: 0.16 },
  { key: "toxicityConcern", weight: 0.08 },
]

const RANKINGS = [
  {
    name: "UiO-66",
    score: 0.76,
    completeness: "7/8",
    driver: "CO₂ uptake",
    zhDriver: "CO₂ 吸附量",
    warning: "2 fields need review",
    zhWarning: "2 个字段需复核",
  },
  {
    name: "MOF-801",
    score: 0.68,
    completeness: "5/8",
    driver: "water stability",
    zhDriver: "水稳定性",
    warning: "pending pore volume",
    zhWarning: "孔体积待复核",
  },
  {
    name: "HKUST-1",
    score: 0.54,
    completeness: "6/8",
    driver: "surface area",
    zhDriver: "比表面积",
    warning: "stability risk",
    zhWarning: "稳定性风险",
  },
]

const visualPalette = {
  panel: "linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(239, 247, 255, 0.96))",
  card: "rgba(255, 255, 255, 0.88)",
  cardSoft: "rgba(232, 244, 255, 0.72)",
  border: "rgba(90, 142, 190, 0.24)",
  borderStrong: "rgba(42, 116, 181, 0.34)",
  line: "rgba(67, 130, 187, 0.26)",
  lineStrong: "rgba(33, 113, 181, 0.42)",
  text: "#14314d",
  muted: "#52677d",
  faint: "#7b8fa3",
  accent: "#1d75b9",
  accentSoft: "rgba(58, 148, 215, 0.12)",
  slate: "#5667b0",
  warning: "#94612d",
}

const INTERSECTION_THRESHOLDS = Array.from({ length: 11 }, (_, index) => index / 10)

function useStepIntersection(stepRefs, count, disabled = false) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (disabled) return undefined
    if (typeof window === "undefined") return undefined
    if (typeof IntersectionObserver === "undefined") return undefined

    const nodes = stepRefs.current.slice(0, count).filter(Boolean)
    if (!nodes.length) return undefined

    const visibleRatios = new Map(nodes.map((node) => [Number(node.getAttribute("data-step-index")), 0]))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute("data-step-index"))
        if (Number.isFinite(index)) {
          visibleRatios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
      })

      setActive((previous) => {
        let next = previous
        let strongestRatio = visibleRatios.get(previous) ?? 0
        visibleRatios.forEach((ratio, index) => {
          if (ratio > strongestRatio + 0.03) {
            strongestRatio = ratio
            next = index
          }
        })
        return strongestRatio > 0.04 ? next : previous
      })
    }, {
      threshold: INTERSECTION_THRESHOLDS,
      rootMargin: "-14% 0px -22% 0px",
    })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [stepRefs, count, disabled])

  return [active, setActive]
}

function StepTextCard({ step, index, active, setActive, t, isMobile, lang, cardRef }) {
  const isActive = active === index
  return (
    <article
      ref={cardRef}
      tabIndex={0}
      aria-current={isActive ? "step" : undefined}
      data-step-index={index}
      onFocus={() => setActive(index)}
      onClick={() => setActive(index)}
      className="narrative-step-card"
      data-active={isActive ? "true" : "false"}
      style={{
        minHeight: isMobile ? "auto" : 300,
        display: "flex",
        alignItems: "stretch",
        opacity: isMobile || isActive ? 1 : 0.68,
        cursor: isMobile ? "default" : "pointer",
        scrollMarginTop: 112,
      }}
    >
      <div style={{
        width: "100%",
        flex: 1,
        background: isActive ? "rgba(239, 247, 255, 0.94)" : t.panel,
        border: `1px solid ${isActive ? "rgba(33, 113, 181, 0.32)" : t.border}`,
        borderRadius: 18,
        padding: isMobile ? 16 : 22,
        boxShadow: isActive ? "0 18px 42px rgba(15, 72, 122, 0.10)" : "none",
        display: "grid",
        gap: 12,
        alignContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandNode active={isActive} t={t}>{String(index + 1).padStart(2, "0")}</BrandNode>
          <div style={{ color: isActive ? visualPalette.accent : t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 }}>
            {step.eyebrow}
          </div>
        </div>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 18 : 24, lineHeight: 1.16, fontWeight: 950 }}>
          {step.title}
        </h3>
        <p style={{ margin: 0, color: t.muted, fontSize: 13.5, lineHeight: 1.68 }}>
          {step.body}
        </p>
        <div style={{ color: t.subtle, fontSize: 11.8, lineHeight: 1.58, fontWeight: 760 }}>
          {step.note}
        </div>
      </div>
    </article>
  )
}

function StepIndicator({ activeStep, steps, lang }) {
  const active = steps[activeStep]
  const progress = ((activeStep + 1) / steps.length) * 100
  return (
    <div
      className="decision-step-indicator"
      aria-label={`${text(lang, "步骤", "Step")} ${activeStep + 1} ${text(lang, "/", "of")} ${steps.length}: ${active.title}`}
      style={{ display: "grid", gap: 7, minWidth: 108 }}
    >
      <div style={{ color: visualPalette.faint, fontSize: 10.5, fontWeight: 850, textAlign: "right", textTransform: "uppercase", letterSpacing: 0 }}>
        {text(lang, `步骤 ${activeStep + 1} / ${steps.length}`, `Step ${activeStep + 1} of ${steps.length}`)}
      </div>
      <div style={{ height: 3, borderRadius: 999, background: "rgba(87, 119, 152, 0.16)", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: visualPalette.accent }} />
      </div>
    </div>
  )
}

function DescriptorNetwork({ activeStep, lang, compact = false, reducedMotion = false }) {
  const zh = lang === "zh"
  const showEvidence = activeStep >= 1
  return (
    <div
      className="descriptor-network-canvas"
      data-compact={compact ? "true" : "false"}
      style={{
        position: "relative",
        minHeight: compact ? 246 : 342,
        borderRadius: 22,
        background: "radial-gradient(circle at 50% 46%, rgba(75, 160, 220, 0.13), rgba(255, 255, 255, 0) 54%)",
        overflow: "hidden",
      }}
    >
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <g stroke={activeStep >= 1 ? visualPalette.lineStrong : visualPalette.line} strokeWidth="0.32">
          {DESCRIPTOR_NODES.map(node => (
            <line key={node.key} x1="50" y1="49" x2={node.x} y2={node.y} />
          ))}
        </g>
        {activeStep >= 2 && (
          <path d="M24 25 C36 14, 64 14, 77 25 M83 52 C78 72, 63 85, 50 87 M17 52 C22 71, 36 84, 50 87" fill="none" stroke="rgba(86, 103, 176, 0.20)" strokeWidth="0.38" strokeDasharray="2 2" />
        )}
      </svg>

      <div className="descriptor-network-center" style={{
        position: "absolute",
        left: "50%",
        top: "49%",
        transform: "translate(-50%, -50%)",
        width: compact ? 112 : 132,
        minHeight: compact ? 76 : 88,
        borderRadius: 20,
        background: "rgba(255, 255, 255, 0.92)",
        border: `1px solid ${visualPalette.borderStrong}`,
        boxShadow: "0 18px 42px rgba(30, 105, 170, 0.12)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 12,
        color: visualPalette.text,
        fontSize: compact ? 12 : 13.5,
        fontWeight: 940,
        lineHeight: 1.22,
      }}>
        <span>{zh ? "描述符集" : "Descriptor Set"}</span>
        <span style={{ color: visualPalette.faint, fontSize: 10, fontFamily: FONT_MONO, marginTop: 3 }}>{DESCRIPTOR_NODES.length} fields</span>
      </div>

      {DESCRIPTOR_NODES.map((node, index) => {
        const dim = showEvidence && (node.status.tone === "pending" || node.status.tone === "demo")
        const review = showEvidence && node.status.tone === "review"
        const nodeLabel = zh ? node.labelZh : node.label
        return (
          <div
            key={`${node.key}-${activeStep}`}
            className="descriptor-network-node"
            data-active="true"
            data-tone={showEvidence ? node.status.tone : "collected"}
            style={{
              "--node-delay": reducedMotion ? "0ms" : `${index * 38}ms`,
              position: "absolute",
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
              width: compact ? 96 : 120,
              minHeight: showEvidence ? 48 : 40,
              borderRadius: 12,
              background: dim ? "rgba(255, 255, 255, 0.64)" : "rgba(255, 255, 255, 0.92)",
              border: `1px ${dim || review ? "dashed" : "solid"} ${review ? "rgba(148, 97, 45, 0.35)" : dim ? "rgba(90, 142, 190, 0.26)" : visualPalette.borderStrong}`,
              boxShadow: dim ? "none" : "0 10px 24px rgba(40, 100, 160, 0.08)",
              color: dim ? visualPalette.faint : visualPalette.text,
              display: "grid",
              alignContent: "center",
              gap: 5,
              padding: compact ? "8px 9px" : "9px 10px",
              fontSize: compact ? 9.8 : 10.8,
              lineHeight: 1.22,
              fontWeight: 870,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: showEvidence
                  ? node.status.tone === "curated" ? visualPalette.accent : node.status.tone === "review" ? "#b88443" : "rgba(90, 142, 190, 0.48)"
                  : visualPalette.accent,
                boxShadow: showEvidence && node.status.tone !== "curated" ? "none" : "0 0 0 4px rgba(29, 117, 185, 0.08)",
                flex: "0 0 auto",
              }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{nodeLabel}</span>
            </span>
            {showEvidence && (
              <span style={{
                color: node.status.tone === "review" ? visualPalette.warning : visualPalette.faint,
                fontSize: 9.4,
                fontWeight: 790,
                whiteSpace: "nowrap",
              }}>
                {zh ? node.status.zhLabel : node.status.label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EvidenceMappingLayer({ lang }) {
  return (
    <div className="decision-stage-panel" style={{
      background: visualPalette.card,
      border: `1px solid ${visualPalette.border}`,
      borderRadius: 16,
      padding: "10px 12px",
      color: visualPalette.muted,
      fontSize: 11.5,
      lineHeight: 1.55,
    }}>
      {text(lang, "字段级来源与整理状态会影响评分解释", "Field-level provenance and curation status influence score explanations")}
    </div>
  )
}

function WeightingBars({ lang }) {
  const zh = lang === "zh"
  const labels = Object.fromEntries(DESCRIPTOR_NODES.map(node => [node.key, zh ? node.labelZh : node.label]))
  return (
    <div className="decision-stage-panel" style={{ display: "grid", gap: 12 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        color: visualPalette.muted,
        fontSize: 11,
        fontWeight: 850,
      }}>
        <span>{text(lang, "CRITIC / Hybrid 权重", "CRITIC / Hybrid weights")}</span>
        <span style={{ fontFamily: FONT_MONO, color: visualPalette.faint }}>alpha 0.65</span>
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {WEIGHT_ROWS.map(row => (
          <div key={row.key} style={{ display: "grid", gridTemplateColumns: "minmax(88px, 0.68fr) minmax(0, 1fr) 42px", gap: 9, alignItems: "center" }}>
            <span style={{ color: visualPalette.text, fontSize: 10.8, fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{labels[row.key]}</span>
            <span style={{ height: 8, borderRadius: 999, background: "rgba(87, 119, 152, 0.13)", overflow: "hidden" }}>
              <span className="decision-flow-bar" style={{
                display: "block",
                width: `${row.weight * 100 * 3.2}%`,
                maxWidth: "100%",
                height: "100%",
                borderRadius: 999,
                background: row.key === "toxicityConcern" ? visualPalette.slate : visualPalette.accent,
              }} />
            </span>
            <span style={{ color: visualPalette.text, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{row.weight.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr auto 1fr",
        gap: 8,
        alignItems: "center",
        color: visualPalette.faint,
        fontSize: 10.5,
        fontWeight: 850,
      }}>
        <span>{text(lang, "raw values", "raw values")}</span>
        <span>→</span>
        <span>{text(lang, "normalized", "normalized")}</span>
        <span>→</span>
        <span>{text(lang, "weighted score", "weighted score")}</span>
      </div>
    </div>
  )
}

function CandidateRankingPreview({ lang }) {
  const zh = lang === "zh"
  return (
    <div className="decision-stage-panel" style={{ display: "grid", gap: 9 }}>
      {RANKINGS.map((candidate, index) => (
        <div
          key={candidate.name}
          className="decision-ranking-row"
          data-active="true"
          style={{
            "--rank-delay": `${index * 70}ms`,
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            gap: 10,
            alignItems: "center",
            background: index === 0 ? visualPalette.cardSoft : visualPalette.card,
            border: `1px solid ${index === 0 ? visualPalette.borderStrong : visualPalette.border}`,
            borderRadius: 14,
            padding: "10px 11px",
          }}
        >
          <span style={{ color: visualPalette.accent, fontFamily: FONT_MONO, fontSize: 11, fontWeight: 950 }}>#{index + 1}</span>
          <span style={{ minWidth: 0, display: "grid", gap: 3 }}>
            <span style={{ color: visualPalette.text, fontSize: 13, fontWeight: 940, lineHeight: 1.18 }}>{candidate.name}</span>
            <span style={{ color: visualPalette.faint, fontSize: 10.5, lineHeight: 1.35 }}>
              {text(lang, "主导因素", "main driver")}: {zh ? candidate.zhDriver : candidate.driver}
            </span>
            <span style={{ color: visualPalette.warning, fontSize: 10.2, lineHeight: 1.35 }}>
              {zh ? candidate.zhWarning : candidate.warning} · {candidate.completeness}
            </span>
          </span>
          <span style={{ color: visualPalette.text, fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 950 }}>{candidate.score.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ color: visualPalette.muted, fontSize: 11.3, lineHeight: 1.55 }}>
        {text(lang, "排序结果同时展示贡献因素与不确定性提示", "Ranking results show contribution factors and uncertainty prompts together")}
      </div>
    </div>
  )
}

function DescriptorDecisionVisual({ activeStep, steps, reducedMotion, isMobile, lang, inline = false }) {
  const active = steps[activeStep]
  const compactNetwork = activeStep === 2 && !isMobile
  const showNetwork = activeStep !== 3
  return (
    <div className="decision-visual-panel" data-step={activeStep} style={{
      background: visualPalette.panel,
      border: `1px solid ${visualPalette.border}`,
      borderRadius: 24,
      boxShadow: "0 24px 70px rgba(34, 91, 145, 0.12)",
      minHeight: isMobile ? 0 : inline ? 360 : "100%",
      height: isMobile || inline ? "auto" : "100%",
      maxHeight: isMobile || inline ? "none" : "calc(100vh - 140px)",
      padding: isMobile ? 16 : 22,
      display: "grid",
      gridTemplateRows: "auto minmax(0, 1fr) auto",
      gap: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      <BrandMotif size={250} color={visualPalette.accent} opacity={0.045} style={{ position: "absolute", right: -74, top: -68, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: visualPalette.faint, fontSize: 10.5, textTransform: "uppercase", fontWeight: 900, letterSpacing: 0 }}>
            {text(lang, "决策引擎视觉", "Decision engine visual")}
          </div>
          <div style={{ color: visualPalette.text, fontSize: isMobile ? 18 : 20, fontWeight: 950, lineHeight: 1.16, marginTop: 5 }}>
            {active.title}
          </div>
        </div>
        <StepIndicator activeStep={activeStep} steps={steps} lang={lang} />
      </div>

      <div
        key={`decision-visual-${activeStep}`}
        className="decision-visual-state"
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: compactNetwork ? "minmax(0, 0.94fr) minmax(230px, 0.74fr)" : "1fr",
          gap: 16,
          alignContent: "center",
          minWidth: 0,
          opacity: 1,
          transform: "translateY(0)",
          transition: reducedMotion ? "none" : "opacity 260ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          animation: reducedMotion ? "none" : undefined,
          willChange: reducedMotion ? "auto" : "opacity, transform",
        }}
      >
        {showNetwork && <DescriptorNetwork activeStep={activeStep} lang={lang} compact={compactNetwork} reducedMotion={reducedMotion} />}
        {activeStep === 1 && <EvidenceMappingLayer lang={lang} />}
        {activeStep === 2 && <WeightingBars lang={lang} />}
        {activeStep === 3 && <CandidateRankingPreview lang={lang} />}
      </div>

      <div style={{
        position: "relative",
        zIndex: 1,
        color: visualPalette.faint,
        fontSize: 11,
        lineHeight: 1.55,
        borderTop: `1px solid ${visualPalette.border}`,
        paddingTop: 11,
      }}>
        {text(
          lang,
          "该视觉说明数据质量与评分逻辑，不代表已验证预测结论。",
          "This visual explains data quality and scoring logic, not a validated prediction claim."
        )}
      </div>
    </div>
  )
}

export function ScrollNarrative({ t, isMobile, reducedMotion, lang = "en" }) {
  const zh = lang === "zh"
  const sectionRef = useRef(null)
  const stepRefs = useRef([])
  const steps = useMemo(() => zh ? [
    {
      eyebrow: "Descriptor collection",
      title: "描述符收集",
      body: "EcoMOF-AI 先把 MOF 记录整理为 8 个可检查描述符，而不是直接给出黑箱分数。",
      note: "比表面积、孔径、孔体积、CO₂ 吸附量、带隙、水稳定性、热稳定性和毒性关注会进入同一复核界面。",
    },
    {
      eyebrow: "Evidence mapping",
      title: "证据映射",
      body: "每个描述符都保留数据状态语言：已整理、待复核、需检查或演示数据。",
      note: "字段级来源和证据等级不会脱离记录本身，缺失信息会保持可见。",
    },
    {
      eyebrow: "Weighting",
      title: "权重与归一化",
      body: "指标先经过方向调整、归一化和 CRITIC / Hybrid 权重，再形成候选评分。",
      note: "计算过程保持可解释，研究者可以逐项质疑字段、权重和边界。",
    },
    {
      eyebrow: "Candidate ranking",
      title: "候选排序",
      body: "排序同时考虑评分、描述符完整度、主要贡献因素和不确定性提示。",
      note: "输出是决策支持优先级，不是最终实验结论。",
    },
  ] : [
    {
      eyebrow: "Descriptor collection",
      title: "Descriptor collection",
      body: "EcoMOF-AI first organizes MOF records into eight inspectable descriptors rather than starting from a black-box score.",
      note: "Surface area, pore size, pore volume, CO₂ uptake, band gap, water stability, thermal stability, and toxicity concern become one review surface.",
    },
    {
      eyebrow: "Evidence mapping",
      title: "Evidence mapping",
      body: "Each descriptor keeps a data-state language: curated, pending, needs check, or demo data.",
      note: "Field-level provenance and evidence level stay attached to the record, so missing data remains visible.",
    },
    {
      eyebrow: "Weighting",
      title: "Weighting & normalization",
      body: "Indicators are direction-adjusted, normalized, and weighted through CRITIC / Hybrid logic before a score appears.",
      note: "The calculation remains interpretable and can be questioned field by field.",
    },
    {
      eyebrow: "Candidate ranking",
      title: "Candidate ranking",
      body: "Ranking combines score, descriptor completeness, main drivers, and uncertainty warnings.",
      note: "The output is a decision-support priority, not final experimental evidence.",
    },
  ], [zh])

  const [activeStep, setActiveStep] = useStepIntersection(stepRefs, steps.length, isMobile)

  if (isMobile) {
    return (
      <section ref={sectionRef} className="scroll-narrative-section scroll-narrative-mobile" style={{ display: "grid", gap: 18 }}>
        {steps.map((step, index) => (
          <div key={step.title} style={{ display: "grid", gap: 12, minWidth: 0 }}>
            <StepTextCard step={step} index={index} active={index} setActive={() => {}} t={t} isMobile={isMobile} lang={lang} />
            <DescriptorDecisionVisual activeStep={index} steps={steps} reducedMotion={reducedMotion} isMobile={isMobile} lang={lang} />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="scroll-narrative-section" style={{ paddingBottom: 0 }}>
      <div className="scroll-narrative-steps" style={{
        display: "grid",
        gap: 24,
        paddingTop: 4,
      }}>
        {steps.map((step, index) => {
          const isActive = activeStep === index
          return (
            <div
              key={step.title}
              className="scroll-narrative-step-row"
              data-active={isActive ? "true" : "false"}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px, 0.86fr) minmax(400px, 1.14fr)",
                gap: 30,
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <StepTextCard
                cardRef={(node) => {
                  stepRefs.current[index] = node
                }}
                step={step}
                index={index}
                active={activeStep}
                setActive={setActiveStep}
                t={t}
                isMobile={isMobile}
                lang={lang}
              />
              <div
                className="scroll-narrative-inline-visual"
                style={{
                  minWidth: 0,
                  opacity: isActive ? 1 : 0.66,
                  transform: isActive ? "translateY(0)" : "translateY(6px)",
                  transition: reducedMotion ? "none" : "opacity 260ms ease, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <DescriptorDecisionVisual activeStep={index} steps={steps} reducedMotion={reducedMotion} isMobile={isMobile} lang={lang} inline />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
