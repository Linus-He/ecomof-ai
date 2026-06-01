// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { WorkflowOutputsStrip } from "./WorkflowOutputsStrip"
import { WorkflowStepDetail } from "./WorkflowStepDetail"
import { WorkflowStepRail } from "./WorkflowStepRail"
import { workflowSteps } from "./workflowData"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

const thresholds = Array.from({ length: 11 }, (_, index) => index / 10)

function useWorkflowIntersection(stepRefs, disabled = false) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (disabled) return undefined
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return undefined
    const nodes = stepRefs.current.filter(Boolean)
    if (!nodes.length) return undefined

    const ratios = new Map(nodes.map((node) => [Number(node.getAttribute("data-step-index")), 0]))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute("data-step-index"))
        if (Number.isFinite(index)) ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0)
      })

      setActiveStep((previous) => {
        let next = previous
        let strongest = ratios.get(previous) ?? 0
        ratios.forEach((ratio, index) => {
          if (ratio > strongest + 0.08) {
            strongest = ratio
            next = index
          }
        })
        return strongest > 0.06 ? next : previous
      })
    }, {
      threshold: thresholds,
      rootMargin: "-16% 0px -28% 0px",
    })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [disabled, stepRefs])

  return [activeStep, setActiveStep]
}

export function WorkflowNarrative({ lang = "en", t, isMobile = false, reducedMotion = false, onNavigate }) {
  const stepRefs = useRef([])
  const steps = useMemo(() => workflowSteps, [])
  const [activeStep, setActiveStep] = useWorkflowIntersection(stepRefs, isMobile || reducedMotion)
  const [openMobileStep, setOpenMobileStep] = useState(0)

  const selectStep = (index) => {
    setActiveStep(index)
    setOpenMobileStep(index)
    const node = stepRefs.current[index]
    node?.scrollIntoView?.({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })
  }

  const variables = {
    "--workflow-bg": t.panel,
    "--workflow-card": t.surface,
    "--workflow-card-muted": t.badgeInfoBg || t.surface,
    "--workflow-border": t.border,
    "--workflow-text": t.textStrong,
    "--workflow-text-muted": t.muted,
    "--workflow-accent": t.accent,
    "--workflow-accent-soft": t.badgeInfoBg || t.surface,
    "--workflow-warning": t.warn,
    "--workflow-warning-soft": t.badgeWarnBg || t.surface,
    "--workflow-success": t.success || "#1F8A5B",
    "--workflow-success-soft": t.badgeSuccessBg || t.surface,
  }

  if (isMobile) {
    return (
      <section className="workflow-narrative workflow-narrative-mobile" style={variables}>
        <div className="workflow-mobile-progress">
          <span>{text(lang, `步骤 ${openMobileStep + 1} / ${steps.length}`, `Step ${openMobileStep + 1} of ${steps.length}`)}</span>
          <i><b style={{ width: `${((openMobileStep + 1) / steps.length) * 100}%` }} /></i>
        </div>
        <div className="workflow-mobile-accordion">
          {steps.map((step, index) => {
            const open = openMobileStep === index
            return (
              <article key={step.id} className="workflow-mobile-step-card" ref={(node) => { stepRefs.current[index] = node }} data-step-index={index}>
                <button type="button" onClick={() => setOpenMobileStep(open ? -1 : index)} aria-expanded={open} aria-label={text(lang, `${open ? "折叠" : "展开"}${step.title.zh}`, `${open ? "Collapse" : "Expand"} ${step.title.en}`)}>
                  <span>{step.number}</span>
                  <strong>{text(lang, step.title.zh, step.title.en)}</strong>
                </button>
                {open ? (
                  <WorkflowStepDetail
                    step={step}
                    index={index}
                    active
                    compact
                    lang={lang}
                    t={t}
                    onNavigate={onNavigate}
                  />
                ) : null}
              </article>
            )
          })}
        </div>
        <WorkflowOutputsStrip lang={lang} t={t} onNavigate={onNavigate} />
      </section>
    )
  }

  return (
    <section className="workflow-narrative" style={variables}>
      <div className="workflow-narrative-grid">
        <WorkflowStepRail steps={steps} activeStep={activeStep} onSelect={selectStep} lang={lang} />
        <div className="workflow-step-detail-stack">
          {steps.map((step, index) => (
            <WorkflowStepDetail
              key={step.id}
              step={step}
              index={index}
              active={activeStep === index}
              lang={lang}
              t={t}
              onNavigate={onNavigate}
              setRef={(node) => { stepRefs.current[index] = node }}
            />
          ))}
        </div>
      </div>
      <WorkflowOutputsStrip lang={lang} t={t} onNavigate={onNavigate} />
    </section>
  )
}
