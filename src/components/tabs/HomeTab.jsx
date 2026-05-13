import { useEffect, useMemo, useRef, useState } from "react"
import {
  useT,
  useLang,
  useViewport,
  DataModeNote,
  DataModeToggle,
  FONT_MONO,
  LogoMark,
  BrandMotif,
  BrandNode,
} from "../../shared"
import {
  BrandMotionBackground,
  EvidenceChainAnimation,
  ModuleRail,
  ScrollNarrative,
} from "../home"
import { toolbarBtn } from "../../utils/styles"

const CORE_DESCRIPTOR_LABELS = [
  "Surface area",
  "Pore size",
  "Pore volume",
  "CO2 uptake",
  "Band gap",
  "Water stability",
  "Thermal stability",
  "Toxicity concern",
]

const SCREENING_CANDIDATES = [
  {
    name: "MOF-801",
    score: 0.68,
    completeness: 5,
    evidence: "needs-validation",
    evidenceZh: "待验证 needs-validation",
    status: "Real-seed / pending",
    statusZh: "真实种子 / 待整理",
    bars: [54, 62, 46, 70],
  },
  {
    name: "UiO-66",
    score: 0.74,
    completeness: 6,
    evidence: "literature-supported",
    evidenceZh: "文献支持",
    status: "Seed record",
    statusZh: "种子记录",
    bars: [76, 70, 63, 58],
  },
  {
    name: "HKUST-1",
    score: 0.59,
    completeness: 8,
    evidence: "rule-based",
    evidenceZh: "规则推断",
    status: "Demo only",
    statusZh: "仅演示",
    bars: [84, 52, 38, 66],
  },
]

const EVIDENCE_CHAIN_FIELDS = [
  {
    field: "CO2 uptake",
    zhField: "CO2 吸附量",
    status: "curated",
    zhStatus: "已整理",
    evidenceType: "literature-derived",
    zhEvidenceType: "文献整理",
    sourceType: "paper / database",
    zhSourceType: "论文 / 数据库",
    confidence: "medium-high",
    zhConfidence: "中高",
    note: "Comparable only under similar temperature and pressure conditions.",
    zhNote: "只有在相近温度、压力和测试条件下才适合横向比较。",
  },
  {
    field: "Surface area",
    zhField: "比表面积",
    status: "needs review",
    zhStatus: "需复核",
    evidenceType: "BET report",
    zhEvidenceType: "BET 报告",
    sourceType: "literature table",
    zhSourceType: "文献表格",
    confidence: "medium",
    zhConfidence: "中",
    note: "Activation protocol and sample state must be checked before direct comparison.",
    zhNote: "直接比较前需要核对活化流程、样品状态和测量条件。",
  },
  {
    field: "Water stability",
    zhField: "水稳定性",
    status: "pending",
    zhStatus: "待补充",
    evidenceType: "qualitative inference",
    zhEvidenceType: "定性推断",
    sourceType: "synthesis report",
    zhSourceType: "合成记录",
    confidence: "low-medium",
    zhConfidence: "中低",
    note: "Needs pH, exposure time, humidity, and cycling conditions.",
    zhNote: "需要补充 pH、暴露时间、湿度和循环条件后才能用于排序解释。",
  },
  {
    field: "Thermal stability",
    zhField: "热稳定性",
    status: "demo only",
    zhStatus: "仅演示",
    evidenceType: "rule-based placeholder",
    zhEvidenceType: "规则占位",
    sourceType: "demo record",
    zhSourceType: "演示记录",
    confidence: "low",
    zhConfidence: "低",
    note: "Useful for interface testing, not for experimental conclusion.",
    zhNote: "用于界面和流程测试，不构成实验结论。",
  },
]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener?.("change", sync)
    return () => media.removeEventListener?.("change", sync)
  }, [])

  return reduced
}

function useInViewOnce(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return undefined
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.28, rootMargin: "0px 0px -8% 0px", ...options })
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return [ref, visible]
}

function useWindowScrollY(disabled = false) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (disabled || typeof window === "undefined") {
      setScrollY(0)
      return undefined
    }

    let frame = 0
    const sync = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0)
        frame = 0
      })
    }

    sync()
    window.addEventListener("scroll", sync, { passive: true })
    return () => {
      window.removeEventListener("scroll", sync)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [disabled])

  return scrollY
}

function SectionHeader({ eyebrow, title, subtitle, t, isMobile, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      marginBottom: isMobile ? 14 : 18,
      flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, maxWidth: 820 }}>
        <div style={{
          color: t.accentText,
          fontSize: 11,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: 0,
          marginBottom: 7,
        }}>
          {eyebrow}
        </div>
        <h2 style={{
          margin: 0,
          color: t.textStrong,
          fontSize: isMobile ? 22 : 30,
          lineHeight: 1.15,
          fontWeight: 900,
          letterSpacing: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            margin: "8px 0 0",
            color: t.muted,
            fontSize: isMobile ? 13 : 14,
            lineHeight: 1.65,
            maxWidth: 760,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function ActionButton({ children, onClick, t, primary = false, wide = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary ? "btn-primary" : "btn-secondary"}
      style={{
        ...toolbarBtn(t),
        justifyContent: "center",
        minHeight: 40,
        padding: "10px 15px",
        fontSize: 12.5,
        fontWeight: 850,
        border: `1px solid ${primary ? t.accent : t.borderStrong}`,
        background: primary ? t.accent : t.panel,
        color: primary ? "#FFFFFF" : t.accentText,
        width: wide ? "100%" : "auto",
        whiteSpace: "normal",
        textAlign: "center",
      }}
    >
      {children}
    </button>
  )
}

function InfoPopover({ label, title, body, t }) {
  return (
    <details style={{ position: "relative", display: "inline-flex" }}>
      <summary
        title={title}
        aria-label={title}
        style={{
          listStyle: "none",
          cursor: "pointer",
          width: 20,
          height: 20,
          borderRadius: 999,
          border: `1px solid ${t.borderStrong}`,
          color: t.accentText,
          background: t.panel,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {label || "i"}
      </summary>
      <div style={{
        position: "absolute",
        top: 26,
        right: 0,
        width: 260,
        maxWidth: "calc(100vw - 36px)",
        zIndex: 30,
        background: t.panel,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 8,
        boxShadow: t.shadowMd,
        padding: 12,
      }}>
        <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 5 }}>{title}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{body}</div>
      </div>
    </details>
  )
}

function CountUpNumber({ value, suffix = "", reducedMotion, t }) {
  const [display, setDisplay] = useState(reducedMotion ? value : 0)
  const [ref, visible] = useInViewOnce()

  useEffect(() => {
    if (!visible) return undefined
    if (reducedMotion) {
      setDisplay(value)
      return undefined
    }

    let frame
    const start = performance.now()
    const duration = 820
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [reducedMotion, value, visible])

  return (
    <span ref={ref} style={{ color: t.textStrong, fontSize: 25, fontWeight: 950, lineHeight: 1, fontFamily: FONT_MONO }}>
      {display}{suffix}
    </span>
  )
}

function AnimatedScreeningPreview({ t, lang, isMobile }) {
  const zh = lang === "zh"
  const [activeIndex, setActiveIndex] = useState(0)
  const candidates = Array.isArray(SCREENING_CANDIDATES) ? SCREENING_CANDIDATES : []
  const active = candidates[activeIndex] || candidates[0] || {
    name: "MOF",
    completeness: 0,
    status: "needs-validation",
    score: "—",
    evidence: "—",
  }
  const completenessPct = Math.round((active.completeness / 8) * 100)

  return (
    <aside className="content-card screening-preview-panel" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: isMobile ? 16 : 18,
      minWidth: 0,
      display: "grid",
      gap: 15,
      position: "relative",
      overflow: "hidden",
    }}>
      <BrandMotif
        size={150}
        color={t.accentText}
        opacity={0.045}
        className="hero-brand-watermark"
        style={{ position: "absolute", right: -28, top: -28, pointerEvents: "none" }}
      />

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <LogoMark size={24} radius={7} />
          <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.2 }}>
            {zh ? "EcoMOF-AI 筛选引擎" : "EcoMOF-AI Screening Engine"}
          </span>
        </div>
        <div style={{
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          background: t.badgeInfoBg,
          color: t.accentText,
          padding: "7px 9px",
          fontSize: 11,
          fontWeight: 850,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}>
          {zh ? "手动预览" : "User Controlled"}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "0.9fr 1.1fr",
        gap: 12,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "grid", gap: 8 }}>
          {candidates.map((candidate, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={candidate.name}
                type="button"
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                aria-label={zh ? `${candidate.name} 筛选预览` : `${candidate.name} screening preview`}
                aria-pressed={isActive}
                className="candidate-preview-row"
                data-active={isActive ? "true" : "false"}
                style={{
                  display: "grid",
                  gap: 4,
                  textAlign: "left",
                  background: isActive ? t.badgeInfoBg : t.surface,
                  border: `1px solid ${isActive ? t.accent : t.border}`,
                  borderRadius: 9,
                  padding: "10px 11px",
                  cursor: "pointer",
                  minWidth: 0,
                }}
              >
                <span style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.2 }}>{candidate.name}</span>
                <span style={{ color: isActive ? t.accentText : t.faint, fontSize: 10.5, fontWeight: 800 }}>
                  {candidate.completeness}/8 {zh ? "描述符" : "descriptors"} · {zh ? candidate.evidenceZh : candidate.evidence}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className="candidate-score-card"
          key={active.name}
          role="region"
          aria-label={zh ? `${active.name} 筛选详情` : `Screening details for ${active.name}`}
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: 13,
            display: "grid",
            gap: 12,
            minWidth: 0,
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
                {zh ? "候选名称" : "Candidate name"}
              </div>
              <div style={{ color: t.textStrong, fontSize: 19, fontWeight: 950, lineHeight: 1.1, marginTop: 4 }}>
                {active.name}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0 }}>
                {zh ? "评分" : "Score"}
              </div>
              <div style={{ color: t.textStrong, fontSize: 25, fontWeight: 950, fontFamily: FONT_MONO, lineHeight: 1.05, marginTop: 4 }}>
                {active.score.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: t.muted, fontSize: 11, fontWeight: 800 }}>{zh ? "描述符完整度" : "Descriptor completeness"}</span>
              <span style={{ color: t.textStrong, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{active.completeness}/8</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: t.panel, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div
                className="animated-progress-fill"
                style={{
                  width: `${completenessPct}%`,
                  height: "100%",
                  background: t.accent,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 9px" }}>
              <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "证据等级" : "Evidence level"}</div>
              <div style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, fontWeight: 850, marginTop: 4 }}>{zh ? active.evidenceZh : active.evidence}</div>
            </div>
            <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 9px" }}>
              <div style={{ color: t.faint, fontSize: 9.5, fontWeight: 850, textTransform: "uppercase" }}>{zh ? "数据状态" : "Data status"}</div>
              <div style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, fontWeight: 850, marginTop: 4 }}>{zh ? active.statusZh : active.status}</div>
            </div>
          </div>

          <div aria-label={zh ? `${active.name} 描述符迷你图` : `${active.name} mini descriptor chart`} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 7, alignItems: "end", minHeight: 64 }}>
            {active.bars.map((value, index) => (
              <div key={`${active.name}-${index}`} style={{ display: "grid", alignItems: "end", gap: 5, minHeight: 64 }}>
                <div style={{ height: 48, borderRadius: 7, background: t.panel, border: `1px solid ${t.border}`, display: "flex", alignItems: "end", overflow: "hidden" }}>
                  <div className="mini-chart-bar" style={{
                    width: "100%",
                    height: `${value}%`,
                    background: index === 1 ? (t.cyan || t.accent) : index === 2 ? (t.violet || t.accent) : t.accent,
                  }} />
                </div>
                <span style={{ color: t.faint, fontSize: 9.5, textAlign: "center", fontFamily: FONT_MONO }}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        color: t.subtle,
        fontSize: 11.5,
        lineHeight: 1.5,
        fontWeight: 820,
        borderTop: `1px solid ${t.divider || t.border}`,
        paddingTop: 10,
        position: "relative",
        zIndex: 1,
      }}>
        {zh ? "透明排序，不是黑箱预测。" : "Transparent ranking, not black-box prediction."}
      </div>
    </aside>
  )
}

function ReasonCard({ card, t, isMobile }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: isMobile ? 18 : 22,
      display: "grid",
      gap: 12,
      minWidth: 0,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        border: `1px solid ${t.border}`,
        background: card.tint,
        color: card.color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 950,
        fontFamily: FONT_MONO,
      }}>
        {card.mark}
      </div>
      <div>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 17 : 19, lineHeight: 1.25, fontWeight: 900 }}>
          {card.title}
        </h3>
        <p style={{ margin: "7px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6 }}>
          {card.body}
        </p>
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 17px", color: t.subtle, fontSize: 12, lineHeight: 1.8 }}>
        {card.points.map(point => <li key={point}>{point}</li>)}
      </ul>
    </article>
  )
}

function MetricCard({ metric, t, reducedMotion }) {
  const [ref, visible] = useInViewOnce()
  const pct = metric.progress ?? 0
  const badgeLabels = metric.badgeLabels || ["experimental", "literature", "simulation", "rule-based"]
  const toggleLabels = metric.toggleLabels || ["Demo data", "Seed data"]

  return (
    <article ref={ref} className="content-card metric-card home-motion-card" data-visible={visible ? "true" : "false"} style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 16,
      boxShadow: "none",
      minWidth: 0,
      display: "grid",
      gap: 9,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        {metric.countTo !== undefined ? (
          <CountUpNumber value={metric.countTo} suffix={metric.suffix || ""} reducedMotion={reducedMotion} t={t} />
        ) : (
          <div style={{ color: t.textStrong, fontSize: 25, fontWeight: 950, lineHeight: 1, fontFamily: FONT_MONO }}>
            {metric.value}
          </div>
        )}
        {metric.info && (
          <InfoPopover label="?" title={metric.title} body={metric.info} t={t} />
        )}
      </div>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850, lineHeight: 1.35 }}>{metric.title}</div>
      <p style={{ margin: 0, color: t.muted, fontSize: 11.5, lineHeight: 1.6 }}>{metric.body}</p>
      {metric.kind === "progress" && (
        <div style={{ display: "grid", gap: 6, marginTop: 2 }}>
          <div style={{ height: 7, borderRadius: 999, border: `1px solid ${t.border}`, background: t.surface, overflow: "hidden" }}>
            <div className="animated-progress-fill" style={{ width: visible || reducedMotion ? `${pct}%` : "0%", height: "100%", background: t.accent }} />
          </div>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 800 }}>{metric.progressLabel || `${metric.value} descriptors curated`}</div>
        </div>
      )}
      {metric.kind === "badges" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          {badgeLabels.map((badge, index) => (
            <span
              key={badge}
              className="evidence-badge-reveal"
              data-visible={visible ? "true" : "false"}
              style={{
                "--badge-delay": `${index * 70}ms`,
                color: t.accentText,
                background: t.badgeInfoBg,
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                padding: "4px 7px",
                fontSize: 9.5,
                fontWeight: 850,
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      {metric.kind === "toggle" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginTop: 2,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: 4,
        }}>
          {toggleLabels.map((label, index) => (
            <span key={label} style={{
              textAlign: "center",
              borderRadius: 6,
              padding: "6px 5px",
              color: index === 0 ? t.accentText : t.subtle,
              background: index === 0 ? t.panel : "transparent",
              border: index === 0 ? `1px solid ${t.borderStrong}` : "1px solid transparent",
              fontSize: 10.5,
              fontWeight: 850,
            }}>
              {label}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function ValidationItem({ item, t }) {
  return (
    <article style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: 14,
      minWidth: 0,
      display: "grid",
      gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 15, lineHeight: 1.3, fontWeight: 900 }}>
          {item.title}
        </h3>
        {item.info && <InfoPopover label="i" title={item.title} body={item.info} t={t} />}
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.6 }}>{item.body}</p>
      <ul style={{ margin: 0, padding: "0 0 0 16px", color: t.subtle, fontSize: 11.5, lineHeight: 1.75 }}>
        {item.points.map(point => <li key={point}>{point}</li>)}
      </ul>
    </article>
  )
}

function AudienceCard({ item, t }) {
  return (
    <article style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "14px 15px",
      minWidth: 0,
      display: "grid",
      gap: 6,
    }}>
      <div style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.35, fontWeight: 900 }}>{item.role}</div>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{item.body}</div>
    </article>
  )
}

function RoadmapItem({ item, t, isLast, visible, index = 0 }) {
  return (
    <div className="roadmap-motion-item" data-visible={visible ? "true" : "false"} style={{
      "--roadmap-delay": `${index * 90}ms`,
      display: "grid",
      gridTemplateColumns: "auto minmax(0, 1fr)",
      gap: 12,
      position: "relative",
      minWidth: 0,
    }}>
      <div style={{ display: "grid", justifyItems: "center", alignContent: "start", gap: 6 }}>
        <BrandNode active={item.active} t={t} style={{ width: 25, height: 25, fontSize: 10 }}>
          {item.index}
        </BrandNode>
        {!isLast && <div className="roadmap-connector" style={{ width: 1, height: 42, background: item.active ? t.accent : t.border }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 12, minWidth: 0 }}>
        <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>{item.title}</div>
        <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.6, marginTop: 3 }}>{item.body}</div>
      </div>
    </div>
  )
}

export function HomeTab({ setActiveTab, onContactOpen, onOpenComparisonBuilder }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const [dataMode, setDataMode] = useState("demo")
  const reducedMotion = usePrefersReducedMotion()
  const [roadmapRef, roadmapVisible] = useInViewOnce()
  const heroScrollY = useWindowScrollY(reducedMotion || isMobile)
  const zh = lang === "zh"

  const go = (target) => setActiveTab?.(target)
  const openContact = () => {
    if (setActiveTab) setActiveTab("contact")
    else onContactOpen?.(true)
  }

  const pageGap = isMobile ? 34 : 52
  const storyIsMobile = isNarrow
  const heroProgress = Math.min(1, heroScrollY / 760)
  const heroBgTransform = reducedMotion || isMobile
    ? "none"
    : `translate3d(0, ${Math.round(heroProgress * 26)}px, 0) scale(${1 + heroProgress * 0.018})`
  const sectionStyle = {
    background: "transparent",
    border: "none",
    borderRadius: 0,
  }
  const bluePanel = {
    background: t === undefined ? "#FFFFFF" : t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const reasons = useMemo(() => [
    {
      mark: "D",
      color: t.accentText,
      tint: t.badgeInfoBg,
      title: zh ? "描述符感知筛选" : "Descriptor-aware screening",
      body: zh ? "先检查描述符是否足够，再解释排序结果。" : "Screening starts with descriptor coverage before ranking claims.",
      points: zh ? [
        "8 个核心描述符作为共享检查框架",
        "显式标注缺失、待整理和需复核字段",
        "候选评分不隐藏数据空白",
      ] : [
        "8 core descriptors as the shared check frame",
        "Missing, pending, and review fields stay visible",
        "Candidate scores do not hide data gaps",
      ],
    },
    {
      mark: "E",
      color: t.cyan || t.accentText,
      tint: t.surface,
      title: zh ? "证据关联数据" : "Evidence-linked data",
      body: zh ? "结果、描述符和来源状态放在同一个阅读语境里。" : "Results, descriptors, and source status are read together.",
      points: zh ? [
        "保留 evidence level 与字段级来源",
        "区分 demo record 与 real-seed record",
        "支持跳转到数据质量与来源（Data Quality & Provenance）",
      ] : [
        "Evidence level and field provenance remain attached",
        "Demo records and real-seed records are separated",
        "Data Quality & Provenance is a first-class route",
      ],
    },
    {
      mark: "L",
      color: t.violet || t.accentText,
      tint: t.badgeCalcBg,
      title: zh ? "面向 LCA 的早期判断" : "LCA-oriented thinking",
      body: zh ? "不是把 LCA 当作装饰指标，而是让可行性边界提前出现。" : "LCA is treated as an early feasibility lens, not decoration.",
      points: zh ? [
        "把稳定性、毒性关注和可持续性风险纳入早筛",
        "明确当前不是验证级 LCA/LCC 结论",
        "为后续实验与生命周期数据接入预留结构",
      ] : [
        "Stability, toxicity concern, and sustainability risk enter early screening",
        "Current outputs are not validated LCA/LCC conclusions",
        "The structure leaves room for experimental and lifecycle data",
      ],
    },
  ], [t, zh])

  const metrics = useMemo(() => [
    {
      value: "8",
      countTo: 8,
      title: zh ? "核心描述符" : "Core descriptors",
      body: zh ? "比表面积、孔径、孔体积、CO2 吸附量、带隙、水稳定性、热稳定性、毒性关注。" : CORE_DESCRIPTOR_LABELS.join(", "),
      info: zh ? "这是透明度检查框架，不代表所有记录都已经完整或验证。" : "This is a transparency frame, not a claim that every record is complete or validated.",
    },
    {
      value: dataMode === "demo" ? "8/8" : "0/8",
      kind: "progress",
      progress: dataMode === "demo" ? 100 : 0,
      title: zh ? "描述符完整度" : "Descriptor completeness",
      progressLabel: zh ? `${dataMode === "demo" ? "8/8" : "0/8"} 个描述符已整理` : `${dataMode === "demo" ? "8/8" : "0/8"} descriptors curated`,
      body: dataMode === "demo"
        ? (zh ? "演示数据用于展示完整流程；真实种子字段仍需要逐项复核。" : "Demo data shows the full workflow; real-seed fields still need curation.")
        : (zh ? "真实种子模式优先暴露待整理状态，不伪装成完整数据库。" : "Real-seed mode exposes pending curation instead of pretending to be complete."),
      info: zh ? "X/8 只表示当前模式下核心字段可读程度，不等同实验验证。" : "X/8 describes field readability in the selected mode; it is not experimental validation.",
    },
    {
      value: "6",
      countTo: 6,
      kind: "badges",
      title: zh ? "证据等级" : "Evidence levels",
      body: zh ? "experimental、literature、simulation、ML-predicted、rule-based、needs-validation。" : "Experimental, literature, simulation, ML-predicted, rule-based, and needs-validation states.",
      info: zh ? "证据等级说明数据状态；High 或 experimental 仍需结合具体任务与条件解释。" : "Evidence level describes data state and must still be read with task and condition context.",
      badgeLabels: zh ? ["实验", "文献", "模拟", "规则"] : ["experimental", "literature", "simulation", "rule-based"],
    },
    {
      value: "2",
      countTo: 2,
      kind: "toggle",
      title: zh ? "演示与种子库分离" : "Demo + seed separation",
      body: zh ? "演示数据与真实种子数据分离，避免把占位数据误读为科研结论。" : "Demo and real-seed data stay separated to avoid treating placeholders as conclusions.",
      info: zh ? "来源说明保留在 Data Mode、Field-level Provenance 和 Methodology 中。" : "Source boundaries remain visible through Data Mode, field provenance, and Methodology.",
      toggleLabels: zh ? ["演示数据", "种子数据"] : ["Demo data", "Seed data"],
    },
  ], [dataMode, zh])

  const modules = useMemo(() => [
    {
      name: "EcoScreen",
      kicker: zh ? "候选评分" : "Candidate scoring",
      target: "ecoscreen",
      mark: "E",
      positioning: zh ? "面向早期环境可行性与候选优先级的筛选入口。" : "Screening entry for early environmental feasibility and candidate priority.",
      functionText: zh ? "用可解释权重、硬筛选边界和不确定性提示排序候选材料。" : "Rank candidates with explainable weights, hard-screen boundaries, and uncertainty signals.",
      capabilities: zh ? ["CRITIC-MCDA 评分", "不确定性提示", "硬筛选边界"] : ["CRITIC-MCDA scoring", "Uncertainty flags", "Hard-screen boundary"],
      buttonLabel: zh ? "开始筛选" : "Start Screening",
    },
    {
      name: zh ? "MOF 候选库" : "MOF Library",
      kicker: zh ? "描述符与溯源" : "Descriptors & provenance",
      target: "mofLibrary",
      mark: "L",
      positioning: zh ? "候选材料、字段状态、来源信息和对比器的主要入口。" : "Main entry for candidates, field status, provenance, and comparison.",
      functionText: zh ? "浏览演示 / 真实种子（demo / real-seed）数据，检查 8 个描述符、证据等级和字段级来源。" : "Browse demo / real-seed data and inspect 8 descriptors, evidence level, and field sources.",
      capabilities: zh ? ["演示 / 真实种子记录", "字段级来源", "候选对比"] : ["Demo / real-seed records", "Field provenance", "Candidate comparison"],
      buttonLabel: zh ? "浏览候选库" : "Explore Library",
      compareAction: zh ? "打开对比器" : "Open builder",
    },
    {
      name: zh ? "性能优先级" : "Performance Analysis",
      kicker: zh ? "吸附优先级" : "Adsorption priority",
      target: "performance",
      mark: "P",
      positioning: zh ? "面向吸附与性能线索的候选材料分析页面。" : "Candidate analysis page for adsorption and performance cues.",
      functionText: zh ? "查看静态浏览器端模型、候选优先级、保存结果和基准样例。" : "Review the static browser model, candidate priorities, saved runs, and benchmark examples.",
      capabilities: zh ? ["吸附线索", "静态浏览器端模型", "已保存运行语境"] : ["Adsorption cues", "Static browser model", "Saved run context"],
      buttonLabel: zh ? "查看性能分析" : "View Performance",
    },
    {
      name: zh ? "催化实验室" : "Catalysis Lab",
      kicker: zh ? "任务导向记录" : "Task-oriented records",
      target: "catalysis",
      mark: "C",
      positioning: zh ? "围绕 CO2 转化与有机酸路径的催化探索原型。" : "Catalysis prototype for CO2 conversion and organic-acid pathway exploration.",
      functionText: zh ? "使用演示记录（mock / demo records）做任务语境探索，不把候选结果写成已验证结论。" : "Use mock / demo records for task-context exploration without claiming validated performance.",
      capabilities: zh ? ["任务记录", "CO2 转化语境", "演示数据边界"] : ["Task records", "CO2 conversion context", "Mock-data boundary"],
      buttonLabel: zh ? "打开催化实验室" : "Open Catalysis Lab",
    },
    {
      name: zh ? "方法与限制" : "Methods & Limitations",
      kicker: zh ? "方法论" : "Methodology",
      target: "methodology",
      mark: "M",
      positioning: zh ? "评分、证据、验证状态、限制和引用边界的集中说明。" : "Central explanation for scoring, evidence, validation state, limits, and citation boundaries.",
      functionText: zh ? "阅读 CRITIC-MCDA、RSM 边界、验证与证据（Validation & Evidence）和基准参考（benchmark references）。" : "Read CRITIC-MCDA, RSM boundaries, Validation & Evidence, and benchmark references.",
      capabilities: zh ? ["方法边界", "证据语言", "基准语境"] : ["Method boundary", "Evidence language", "Benchmark context"],
      buttonLabel: zh ? "阅读方法论" : "Read Methodology",
    },
  ], [zh])

  const validationItems = useMemo(() => [
    {
      title: zh ? "当前状态" : "Current status",
      body: zh ? "当前为研究原型与候选优先级工具，不是验证级预测引擎。" : "Current status is a research prototype and candidate-priority tool, not a validated prediction engine.",
      points: zh ? [
        "演示记录用于展示流程",
        "真实种子记录用于真实数据接入框架",
        "结果用于假设生成与早期筛选",
      ] : [
        "Demo records show the workflow",
        "Real-seed records define the ingestion frame",
        "Outputs support hypothesis generation and early screening",
      ],
      info: zh ? "该说明不是为了弱化产品，而是让研究边界可审计。" : "This boundary makes the research state auditable rather than vague.",
    },
    {
      title: zh ? "检查字段" : "Checked fields",
      body: zh ? "首页保留核心字段检查：描述符完整性、来源状态、条件语境和风险提示。" : "The homepage preserves checks for descriptor completeness, source status, condition context, and risk flags.",
      points: zh ? [
        "8 个核心描述符",
        "字段级来源",
        "数据质量与来源深链",
      ] : [
        "8 core descriptors",
        "Field-level provenance",
        "Data Quality & Provenance deep link",
      ],
    },
    {
      title: zh ? "证据等级" : "Evidence levels",
      body: zh ? "证据等级是数据状态语言，不把规则推断、模拟和实验支持混为一谈。" : "Evidence level is a data-state language that separates rules, simulation, literature, and experiment.",
      points: zh ? [
        "规则推断（rule-based）与待验证（needs-validation）默认谨慎呈现",
        "ML-predicted 为保留类别，不冒充当前模型输出",
        "基准参考只提供解释语境",
      ] : [
        "rule-based and needs-validation stay cautious",
        "ML-predicted is a reserved category, not active model output",
        "benchmark references provide context, not superiority claims",
      ],
    },
    {
      title: zh ? "下一步验证计划" : "Next validation plan",
      body: zh ? "下一步是把公开来源、实验记录、条件字段和生命周期数据逐步接入验证工作流。" : "Next work connects public sources, experimental records, condition fields, and lifecycle data into validation-ready workflows.",
      points: zh ? [
        "补全字段来源与条件",
        "加入重复性与基准检查（replicate / benchmark checks）",
        "形成可导出的验证摘要",
      ] : [
        "Complete field sources and conditions",
        "Add replicate and benchmark checks",
        "Produce exportable validation summaries",
      ],
    },
  ], [zh])

  const audiences = useMemo(() => [
    {
      role: zh ? "MOF 研究者" : "MOF researchers",
      body: zh ? "快速查看候选材料描述符、缺失字段和可疑边界。" : "Review descriptors, missing fields, and questionable boundaries quickly.",
    },
    {
      role: zh ? "LCA 研究者" : "LCA researchers",
      body: zh ? "把早期环境可行性信号放入材料筛选语境中。" : "Place early environmental feasibility signals inside the material-screening context.",
    },
    {
      role: zh ? "信息学 / ML 研究者" : "ML / informatics researchers",
      body: zh ? "观察透明规则、证据等级和数据整理结构如何影响排序。" : "Inspect how transparent rules, evidence levels, and curation structure affect ranking.",
    },
    {
      role: zh ? "学生 / 作品集评审者" : "Students / portfolio reviewers",
      body: zh ? "理解一个科研产品原型如何组织问题、数据、模型和限制。" : "Understand how a research product prototype organizes questions, data, models, and limits.",
    },
    {
      role: zh ? "潜在合作者" : "Potential collaborators",
      body: zh ? "找到数据接入、验证、benchmark 和领域任务扩展的合作点。" : "Find collaboration points for data ingestion, validation, benchmarks, and domain tasks.",
    },
  ], [zh])

  const roadmap = useMemo(() => [
    {
      index: "1",
      active: true,
      title: zh ? "演示筛选" : "Demo screening",
      body: zh ? "稳定展示候选评分、模块入口和研究边界。" : "Stabilize candidate scoring, module entry points, and research boundaries.",
    },
    {
      index: "2",
      active: true,
      title: zh ? "溯源层" : "Provenance layer",
      body: zh ? "继续完善字段级来源、条件、证据等级和数据模式（Data Mode）语义。" : "Improve field sources, conditions, evidence levels, and Data Mode semantics.",
    },
    {
      index: "3",
      active: false,
      title: zh ? "催化记录" : "Catalysis records",
      body: zh ? "扩展任务导向催化记录，同时保留演示数据（mock / demo）边界。" : "Expand task-oriented catalysis records while keeping mock / demo boundaries explicit.",
    },
    {
      index: "4",
      active: false,
      title: zh ? "面向验证的工作流" : "Validation-ready workflow",
      body: zh ? "接入基准、重复性检查、导出摘要和人工复核流程。" : "Connect benchmarks, replicates, export summaries, and manual review workflow.",
    },
    {
      index: "5",
      active: false,
      title: zh ? "未来研究工作台" : "Future research workspace",
      body: zh ? "面向团队协作、私有数据接入和可复现实验记录。" : "Support team collaboration, private data ingestion, and reproducible experiment records.",
    },
  ], [zh])

  return (
    <div className="home-story-shell" style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden", position: "relative" }}>
      <BrandMotionBackground t={t} isMobile={storyIsMobile} reducedMotion={reducedMotion} />
      <section id="overview" className="home-hero-section" style={{ ...sectionStyle, paddingTop: isMobile ? 12 : 30, position: "relative", overflow: "hidden" }}>
        <div
          className="home-hero-bg-layer"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transform: heroBgTransform,
            transition: reducedMotion ? "none" : "transform 120ms linear",
          }}
        >
          {!isMobile && (
            <BrandMotif
              size={300}
              color={t.accentText}
              opacity={0.052}
              className="hero-bg-brand-motif"
              style={{ position: "absolute", right: -86, top: 10, pointerEvents: "none" }}
              strokeWidth={1.2}
            />
          )}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
          gap: isMobile ? 18 : 28,
          alignItems: "center",
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}>
          <div
            className="home-hero-foreground"
            style={{
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <LogoMark size={isMobile ? 48 : 58} radius={14} style={{ boxShadow: t.shadowSm }} />
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                {zh ? "研究原型 · MOF 筛选" : "Research prototype · MOF screening"}
              </div>
            </div>
            <h1 style={{
              margin: 0,
              color: t.textStrong,
              fontSize: isMobile ? 42 : 64,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: 0,
            }}>
              EcoMOF-AI
            </h1>
            <p style={{
              margin: isMobile ? "14px 0 0" : "18px 0 0",
              color: t.textStrong,
              fontSize: isMobile ? 20 : 27,
              lineHeight: 1.18,
              fontWeight: 900,
              maxWidth: 860,
            }}>
              {zh ? "面向可持续 MOF 筛选的透明决策支持平台" : "A transparent decision-support platform for sustainable MOF screening"}
            </p>
            <p style={{
              margin: "13px 0 0",
              color: t.muted,
              fontSize: isMobile ? 14 : 16,
              lineHeight: 1.7,
              maxWidth: 760,
            }}>
              {zh
                ? "面向 MOF 候选材料筛选、数据溯源与早期环境可行性判断的交互式研究原型。"
                : "Interactive research prototype for MOF candidate screening, data provenance, and early environmental feasibility judgment."}
            </p>
            <div style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 22,
            }} className="home-hero-cta">
              <ActionButton t={t} primary wide={isMobile} onClick={() => go("ecoscreen")}>
                {zh ? "开始筛选" : "Start Screening"}
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("mofLibrary")}>
                {zh ? "浏览 MOF 候选库" : "Explore MOF Library"}
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("methodology")}>
                {zh ? "查看方法与证据" : "View Methods & Evidence"}
              </ActionButton>
            </div>
          </div>
          <div
            className="home-hero-preview-shell"
            style={{
              minWidth: 0,
            }}
          >
            <AnimatedScreeningPreview t={t} lang={lang} isMobile={isMobile} />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "为什么使用 EcoMOF-AI" : "Why EcoMOF-AI"}
          title={zh ? "三个核心价值，而不是一组黑箱分数" : "Three reasons beyond a black-box score"}
          subtitle={zh ? "首页把筛选、数据证据和 LCA 思维按研究流程组织，避免让结果脱离来源和限制。" : "The homepage connects screening, evidence, and LCA-oriented reasoning so outputs are not detached from source and limits."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
          gap: 14,
        }}>
          {reasons.map(card => <ReasonCard key={card.title} card={card} t={t} isMobile={isMobile} />)}
        </div>
      </section>

      <section style={{
        ...bluePanel,
        padding: isMobile ? "18px 16px" : "24px",
        background: t.badgeInfoBg,
      }}>
        <SectionHeader
          eyebrow={zh ? "透明度指标 / 信任线索" : "Metrics / Trust Indicators"}
          title={zh ? "透明度指标，不是商业夸张指标" : "Transparency indicators, not marketing claims"}
          subtitle={zh ? "这些数字说明原型如何暴露描述符、证据状态和数据模式，而不是承诺科研结论已经完成。" : "These numbers explain how the prototype exposes descriptors, evidence state, and data mode rather than claiming completed scientific validation."}
          t={t}
          isMobile={isMobile}
          action={
            <div style={{ display: "grid", gap: 7, justifyItems: isMobile ? "stretch" : "end", width: isMobile ? "100%" : "auto" }}>
              <DataModeToggle value={dataMode} onChange={setDataMode} lang={lang} />
              <button
                type="button"
                onClick={() => go("data-quality-provenance")}
                style={{
                  ...toolbarBtn(t),
                  minHeight: 32,
                  padding: "7px 10px",
                  fontSize: 11,
                  justifyContent: "center",
                  color: t.accentText,
                  background: t.panel,
                }}
              >
                {zh ? "查看数据质量与溯源" : "View Data Quality & Provenance"}
              </button>
            </div>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}>
          {metrics.map(metric => <MetricCard key={metric.title} metric={metric} t={t} reducedMotion={reducedMotion} />)}
        </div>
        <div style={{ marginTop: 12, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: "10px 12px" }}>
          <DataModeNote lang={lang} />
        </div>
      </section>

      <section style={{ ...bluePanel, padding: isMobile ? "18px 16px" : "24px" }}>
        <SectionHeader
          eyebrow={zh ? "流程叙事" : "Scroll Narrative"}
          title={zh ? "从描述符到决策支持" : "From descriptors to decisions"}
          subtitle={zh ? "滚动经过四个研究步骤时，右侧视觉面板会从描述符网络过渡到证据映射、权重归一化和候选排序。" : "As the user scrolls through four research steps, the visual panel moves from descriptor network to evidence mapping, weighting, normalization, and candidate ranking."}
          t={t}
          isMobile={isMobile}
        />
        <ScrollNarrative t={t} isMobile={storyIsMobile} reducedMotion={reducedMotion} lang={lang} />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "平台模块" : "Platform Modules"}
          title={zh ? "从首页进入完整研究工作台" : "Enter the research workspace from the homepage"}
          subtitle={zh ? "模块卡片统一呈现定位、核心功能和入口，保留现有 EcoScreen、Library、Performance、Catalysis 与 Methodology 路由。" : "Module cards present positioning, core function, and entry points while preserving existing EcoScreen, Library, Performance, Catalysis, and Methodology routes."}
          t={t}
          isMobile={isMobile}
        />
        <ModuleRail
          modules={modules}
          t={t}
          isMobile={storyIsMobile}
          onNavigate={go}
          onOpenComparisonBuilder={onOpenComparisonBuilder}
        />
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "验证与证据" : "Validation & Evidence"}
          title={zh ? "把可信度做成研究面板，而不是免责声明" : "Research credibility panel, not a generic disclaimer"}
          subtitle={zh ? "保留当前验证状态、检查字段、证据等级和下一步验证计划，让读者能质疑每个结果。" : "Current validation status, checked fields, evidence levels, and next validation plans remain visible so every result can be questioned."}
          t={t}
          isMobile={isMobile}
          action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <ActionButton t={t} wide={isMobile} onClick={() => go("validation-evidence")}>
                {zh ? "打开验证与证据" : "Open Validation & Evidence"}
              </ActionButton>
              <ActionButton t={t} wide={isMobile} onClick={() => go("benchmark-references")}>
                {zh ? "查看 benchmark 参考" : "View Benchmark References"}
              </ActionButton>
            </div>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}>
          {validationItems.map(item => <ValidationItem key={item.title} item={item} t={t} />)}
        </div>
        <div style={{ marginTop: 14 }}>
          <EvidenceChainAnimation fields={EVIDENCE_CHAIN_FIELDS} t={t} isMobile={storyIsMobile} lang={lang} />
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "适用对象" : "Audience"}
          title={zh ? "面向不同用户的同一套透明语言" : "One transparent language for different users"}
          subtitle={zh ? "首页保留原有用户类型，并把每类用户能获得的价值压缩成一句话。" : "The homepage keeps the existing audience types and compresses each value proposition into one sentence."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: 11,
        }}>
          {audiences.map(item => <AudienceCard key={item.role} item={item} t={t} />)}
        </div>
      </section>

      <section ref={roadmapRef} style={{ ...bluePanel, padding: isMobile ? "18px 16px" : "24px" }}>
        <SectionHeader
          eyebrow={zh ? "发展路线图" : "Development Roadmap"}
          title={zh ? "从演示筛选走向可验证研究工作流" : "From demo screening to validation-ready research workflow"}
          subtitle={zh ? "路线图保持简洁，说明当前完成的层、正在打磨的层和未来需要真实数据支撑的层。" : "A concise roadmap separates the current layer, the provenance work in progress, and future layers that need real validation data."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))",
          gap: isNarrow ? 10 : 14,
        }}>
          {roadmap.map((item, index) => (
            <RoadmapItem key={item.title} item={item} t={t} isLast={index === roadmap.length - 1} visible={roadmapVisible || reducedMotion} index={index} />
          ))}
        </div>
      </section>

      <section style={{
        ...bluePanel,
        padding: isMobile ? "22px 18px" : "30px 34px",
        display: "grid",
        gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto",
        gap: 18,
        alignItems: "center",
        marginBottom: isMobile ? 4 : 10,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 8 }}>
            {zh ? "联系 / 合作" : "Contact / Collaboration"}
          </div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, fontWeight: 950, letterSpacing: 0 }}>
            {zh ? "浏览、评估，并质疑每一个结果。" : "Explore, evaluate, and question every result."}
          </h2>
          <p style={{ margin: "9px 0 0", color: t.muted, fontSize: 13.5, lineHeight: 1.65, maxWidth: 760 }}>
            {zh
              ? "如果你希望接入催化数据、完善 MOF 描述符、讨论 LCA 评价或共同验证候选材料，可以从这里进入方法说明或联系合作。"
              : "Use EcoMOF-AI to inspect data, question ranking assumptions, and discuss collaboration around descriptors, catalysis records, LCA evaluation, or validation."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
          <ActionButton t={t} primary wide={isMobile} onClick={() => go("ecoscreen")}>
            {zh ? "打开 EcoScreen" : "Open EcoScreen"}
          </ActionButton>
          <ActionButton t={t} wide={isMobile} onClick={() => go("methodology")}>
            {zh ? "阅读方法论" : "Read Methodology"}
          </ActionButton>
          <ActionButton t={t} wide={isMobile} onClick={openContact}>
            {zh ? "联系 / 合作" : "Contact / Collaborate"}
          </ActionButton>
        </div>
      </section>
    </div>
  )
}
