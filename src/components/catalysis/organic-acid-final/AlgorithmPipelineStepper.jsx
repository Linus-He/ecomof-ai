// @ts-nocheck
import { useEffect, useState } from "react"
import { ChemicalText } from "../../../shared"
import { Panel, StatusPill, text } from "./FinalScreeningShared"

function toneFor(status) {
  if (status === "completed") return "pass"
  if (status === "warning" || status === "active") return "warn"
  if (status === "blocked") return "fail"
  return "info"
}

export function AlgorithmPipelineStepper({ steps, lang, t, isMobile }) {
  const [activeId, setActiveId] = useState(steps?.[0]?.id)

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined
    const nodes = (steps || [])
      .map(step => [step.id, document.getElementById(step.linkedSectionId)])
      .filter(([, node]) => node)
    if (!nodes.length) return undefined
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0]
      if (!visible) return
      const found = nodes.find(([, node]) => node === visible.target)
      if (found) setActiveId(found[0])
    }, { rootMargin: "-120px 0px -58% 0px", threshold: [0.12, 0.3, 0.6] })
    nodes.forEach(([, node]) => observer.observe(node))
    return () => observer.disconnect()
  }, [steps])

  const jump = step => {
    const node = document.getElementById(step.linkedSectionId)
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveId(step.id)
    }
  }

  return (
    <Panel
      id="organic-acid-final-algorithm-stepper"
      eyebrow={text(lang, "算法旅程", "Algorithm journey")}
      title={text(lang, "Algorithm Pipeline Stepper", "Algorithm Pipeline Stepper")}
      t={t}
      actions={<StatusPill tone="warn" t={t}>robust but audit-required visible</StatusPill>}
    >
      <div style={{
        display: isMobile ? "flex" : "grid",
        gap: 9,
        gridTemplateColumns: isMobile ? undefined : "repeat(7, minmax(0, 1fr))",
        overflowX: isMobile ? "auto" : "visible",
        paddingBottom: isMobile ? 4 : 0,
        WebkitOverflowScrolling: "touch",
      }}>
        {(steps || []).map(step => {
          const active = step.id === activeId
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => jump(step)}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 9,
                color: t.textStrong,
                cursor: "pointer",
                display: "grid",
                gap: 7,
                minHeight: 128,
                minWidth: isMobile ? 210 : 0,
                padding: 10,
                textAlign: "left",
              }}
            >
              <span style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                <strong style={{ color: active ? t.accentText : t.textStrong, fontSize: 13 }}>{step.step}</strong>
                <StatusPill tone={toneFor(step.status)} t={t}>{step.status}</StatusPill>
              </span>
              <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.25 }}>
                <ChemicalText value={lang === "zh" ? step.titleZh || step.title : step.title} />
              </strong>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.42 }}>
                <ChemicalText value={lang === "zh" ? step.descriptionZh || step.description : step.description} />
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
