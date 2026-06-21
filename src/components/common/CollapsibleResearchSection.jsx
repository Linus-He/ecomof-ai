// @ts-nocheck
import { useEffect, useState } from "react"
import { BasisBadge, ChemicalText, useLang, useT, useViewport } from "../../shared"

const STATES = ["expanded", "compact", "collapsed"]

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function stateLabel(state, lang) {
  if (state === "expanded") return text(lang, "完整展开", "Expanded")
  if (state === "collapsed") return text(lang, "已收起", "Collapsed")
  return text(lang, "摘要压缩", "Compact")
}

function nextState(current) {
  if (current === "expanded") return "compact"
  if (current === "compact") return "collapsed"
  return "expanded"
}

function buttonLabel(state, lang) {
  if (state === "expanded") return text(lang, "压缩模块", "Compact section")
  if (state === "compact") return text(lang, "收起模块", "Collapse section")
  return text(lang, "展开模块", "Expand section")
}

function normalizeState(value, fallback = "compact") {
  return STATES.includes(value) ? value : fallback
}

function ControlButton({ children, onClick, t, active, ariaLabel, ariaExpanded, ariaControls }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      onClick={onClick}
      style={{
        background: active ? t.badgeInfoBg : t.surface,
        border: `1px solid ${active ? t.accent : t.border}`,
        borderRadius: 8,
        color: active ? t.textStrong : t.muted,
        cursor: "pointer",
        fontSize: 11.5,
        fontWeight: 850,
        minHeight: 40,
        padding: "7px 10px",
      }}
    >
      {children}
    </button>
  )
}

function MiniSummary({ items = [], t, isMobile }) {
  if (!items.length) return null
  return (
    <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(130px, 1fr))", minWidth: 0 }}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
          <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, lineHeight: 1.25, textTransform: "uppercase" }}>{item.label}</div>
          <div style={{ color: t.textStrong, fontSize: 13.2, fontWeight: 900, lineHeight: 1.25, marginTop: 4, overflowWrap: "anywhere" }}>
            <ChemicalText value={item.value ?? "pending"} />
          </div>
          {item.note ? <div style={{ color: t.subtle, fontSize: 10.5, lineHeight: 1.35, marginTop: 3, overflowWrap: "anywhere" }}><ChemicalText value={item.note} /></div> : null}
        </div>
      ))}
    </div>
  )
}

export function SectionLayoutControls() {
  return null
}

export function CollapsibleResearchSection({
  id,
  title,
  titleZh,
  description,
  descriptionZh,
  defaultState = "compact",
  lowPriority = false,
  statusBadges = [],
  summaryItems = [],
  miniPreview,
  actions,
  children,
}) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [state, setState] = useState(normalizeState(defaultState))
  const [pinned, setPinned] = useState(false)
  const bodyId = `${id}-body`
  const expanded = pinned || state === "expanded"
  const effectiveState = pinned ? "expanded" : state
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches

  useEffect(() => {
    if (!expanded || typeof window === "undefined") return undefined
    const timers = [80, 260, 620].map(delay => window.setTimeout(() => window.dispatchEvent(new Event("resize")), delay))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [expanded])

  const titleText = text(lang, titleZh || title, title)
  const descText = text(lang, descriptionZh || description, description)
  const cycle = () => setState(prev => nextState(prev))

  return (
    <section
      id={id}
      data-section-state={effectiveState}
      style={{
        background: effectiveState === "expanded" ? t.panel : effectiveState === "compact" ? t.surface : t.bg,
        border: `1px solid ${pinned ? t.accent : t.border}`,
        borderRadius: 12,
        boxShadow: effectiveState === "expanded" ? t.shadowSm : "none",
        display: "grid",
        gap: effectiveState === "collapsed" ? 9 : 12,
        minWidth: 0,
        padding: isMobile ? 11 : 13,
        scrollMarginTop: 118,
        transition: reducedMotion ? "none" : "background 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
      }}
    >
      <header style={{ display: "grid", gap: 10 }}>
        <div style={{ alignItems: isMobile ? "stretch" : "start", display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
              <h2 style={{ color: t.textStrong, fontSize: isMobile ? 17 : 19, lineHeight: 1.2, margin: 0, overflowWrap: "anywhere" }}>{titleText}</h2>
              <BasisBadge tone={pinned ? "calc" : effectiveState === "expanded" ? "info" : "proxy"}>{pinned ? text(lang, "固定展开", "Pinned open") : stateLabel(effectiveState, lang)}</BasisBadge>
            </div>
            <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: "6px 0 0", maxWidth: 920 }}>{descText}</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
            <ControlButton
              t={t}
              active={pinned}
              onClick={() => setPinned(prev => !prev)}
              ariaLabel={pinned ? text(lang, "取消固定", "Unpin") : text(lang, "固定展开", "Pin open")}
            >
              {pinned ? text(lang, "取消固定", "Unpin") : text(lang, "固定展开", "Pin open")}
            </ControlButton>
            <ControlButton
              t={t}
              active={effectiveState === "expanded"}
              onClick={cycle}
              ariaExpanded={expanded}
              ariaControls={bodyId}
              ariaLabel={buttonLabel(effectiveState, lang)}
            >
              {buttonLabel(effectiveState, lang)}
            </ControlButton>
            {actions}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {statusBadges.map((badge, index) => (
            <BasisBadge key={`${badge.label || badge}-${index}`} tone={badge.tone || "proxy"}>{badge.label || badge}</BasisBadge>
          ))}
        </div>

        <MiniSummary items={summaryItems} t={t} isMobile={isMobile} />
      </header>

      {effectiveState !== "collapsed" && miniPreview ? (
        <div style={{ opacity: effectiveState === "compact" ? 1 : 0.9, transform: "translateY(0)", transition: reducedMotion ? "none" : "opacity 160ms ease" }}>
          {miniPreview}
        </div>
      ) : null}

      <div
        id={bodyId}
        style={{
          display: expanded ? "block" : "none",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </section>
  )
}
