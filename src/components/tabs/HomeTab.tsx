// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  useT,
  useLang,
  useViewport,
  FONT_SANS,
  LogoMark,
  BrandMotif,
} from "../../shared"
import { BrandMotionBackground, GasParetoChart, MofDescriptor3DScatter, buildGasParetoRows } from "../home"
import { toolbarBtn } from "../../utils/styles"
import {
  DEFAULT_HOME_SUMMARY,
  loadHomeSummary,
} from "../../utils/homeSummary"
import { APP_VERSION_LABEL } from "../../constants/appVersion"

const text = (zh, en, lang) => (lang === "zh" ? zh : en)

function numberText(value, suffix = "") {
  const number = Number(value)
  if (!Number.isFinite(number)) return "Not available"
  return `${number}${suffix}`
}

function metricText(value, digits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value ?? "Not available")
  return Number.isInteger(number) ? String(number) : number.toFixed(digits)
}

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

function SectionHeader({ eyebrow, title, subtitle, t, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? 14 : 18, maxWidth: 880 }}>
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
          maxWidth: 780,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function ActionButton({ children, onClick, t, primary = false, wide = false, hash }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-hash={hash}
      className={primary ? "btn-primary home-glass-button home-glass-button-primary" : "btn-secondary home-glass-button"}
      style={{
        ...toolbarBtn(t),
        justifyContent: "center",
        minHeight: 40,
        padding: "10px 16px",
        fontSize: 12.5,
        fontWeight: 850,
        border: `1px solid ${primary ? `${t.accent}66` : t.borderStrong}`,
        background: primary
          ? `linear-gradient(135deg, ${t.accent}EA 0%, ${t.accentText}C8 100%)`
          : `linear-gradient(135deg, ${t.panel}D8 0%, ${t.surface}B8 100%)`,
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

function IconBadge({ children, t, tone = "info" }) {
  const toneMap = {
    info: [t.badgeInfoBg, t.accentText],
    success: [t.badgeCalcBg, t.success || t.accentText],
    warn: [t.badgeWarnBg, t.warn],
    neutral: [t.surface, t.subtle],
  }
  const [background, color] = toneMap[tone] || toneMap.info
  return (
    <span style={{
      width: 38,
      height: 38,
      borderRadius: 9,
      border: `1px solid ${t.borderStrong}`,
      background,
      color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 950,
      fontFamily: FONT_SANS,
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

function PlatformCapabilityCard({ item, t }) {
  return (
    <article className="content-card home-art-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      minWidth: 0,
      display: "grid",
      gap: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconBadge t={t} tone={item.tone}>{item.mark}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 17, lineHeight: 1.25, fontWeight: 900 }}>
            {item.title}
          </h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>
            {item.subtitle}
          </div>
        </div>
      </div>
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 9,
        padding: "10px 11px",
        display: "grid",
        gap: 5,
      }}>
        {item.highlights.map(highlight => (
          <strong key={highlight} style={{ color: t.textStrong, fontSize: 13, lineHeight: 1.35, fontWeight: 900 }}>
            {highlight}
          </strong>
        ))}
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12, lineHeight: 1.6 }}>{item.body}</p>
    </article>
  )
}

function DataCard({ item, t }) {
  return (
    <article className="home-data-tile" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "13px 14px",
      display: "grid",
      gap: 6,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5, lineHeight: 1.3 }}>{item.name}</strong>
        <span style={{ color: t.accentText, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 950 }}>{item.value}</span>
      </div>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.body}</span>
    </article>
  )
}

function AtlasMetric({ item, t, index }) {
  return (
    <div className="atlas-metric" style={{ "--metric-delay": `${index * 90}ms`, background: t.surface, border: `1px solid ${t.border}` }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, letterSpacing: 0, textTransform: "uppercase" }}>{item.label}</span>
      <strong className="num" style={{ color: t.textStrong, fontSize: 19, lineHeight: 1.15, fontWeight: 950 }}>{item.value}</strong>
      <span className="atlas-metric-spark" aria-hidden="true" style={{ background: t.badgeInfoBg }}>
        <span style={{ background: item.tone || t.accentText }} />
      </span>
    </div>
  )
}

function ScientificAtlasHero({ t, lang, summary, gasParetoCount, isMobile, reducedMotion }) {
  const zh = lang === "zh"
  const metrics = [
    { label: zh ? "结构记录" : "Structure records", value: numberText(summary.totalRecords, "+"), tone: t.accentText },
    { label: "ISODB / IAST", value: numberText(gasParetoCount), tone: t.violet || t.accentText },
    { label: zh ? "实验标签" : "Experimental labels", value: numberText(summary.experimentalLabelCount), tone: t.warn },
    { label: zh ? "可信度" : "Credibility", value: `${metricText(summary.credibilityScore, 1)}`, tone: t.success || t.accentText },
  ]
  const modules = [
    { id: "EcoScreen", x: 122, y: 98, tone: t.accentText },
    { id: "MOF Library", x: 382, y: 86, tone: t.success || t.accentText },
    { id: "Organic Acid", x: 132, y: 260, tone: t.warn },
    { id: "GasSep", x: 410, y: 244, tone: t.violet || t.accentText },
  ]
  const sourceLines = [
    { d: "M72 178 C150 78 232 72 308 152", delay: "0ms" },
    { d: "M72 178 C160 224 248 230 410 244", delay: "120ms" },
    { d: "M308 152 C282 226 220 280 132 260", delay: "240ms" },
    { d: "M122 98 C202 142 285 132 382 86", delay: "360ms" },
  ]

  return (
    <aside
      data-testid="home-scientific-atlas"
      className="home-scientific-atlas"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={{
        minWidth: 0,
        position: "relative",
        minHeight: isMobile ? 340 : 444,
        borderRadius: 0,
        overflow: "visible",
      }}
    >
      <div className="atlas-glass-plate" style={{
        position: "absolute",
        inset: isMobile ? "18px 0 0" : "12px 0 0",
        border: `1px solid ${t.border}`,
        background: `linear-gradient(145deg, ${t.panel}E8, ${t.surface}C8 58%, ${t.badgeInfoBg}B8)`,
        boxShadow: t.shadowSm,
        borderRadius: 12,
      }} />
      <svg className="atlas-map-svg" viewBox="0 0 520 350" role="img" aria-label={zh ? "EcoMOF-AI 科研图谱：首页模块与真实数据流" : "EcoMOF-AI research atlas: homepage modules and real data flow"} style={{ position: "relative", width: "100%", minHeight: isMobile ? 270 : 318, display: "block", overflow: "visible" }}>
        <defs>
          <radialGradient id="atlasCoreGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={t.badgeInfoBg} stopOpacity="0.98" />
            <stop offset="52%" stopColor={t.badgeInfoBg} stopOpacity="0.24" />
            <stop offset="100%" stopColor={t.badgeInfoBg} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="atlasParetoLine" x1="0%" x2="100%" y1="100%" y2="0%">
            <stop offset="0%" stopColor={t.accentText} stopOpacity="0.35" />
            <stop offset="58%" stopColor={t.success || t.accentText} stopOpacity="0.95" />
            <stop offset="100%" stopColor={t.warn} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="atlasScanGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor={t.panel} stopOpacity="0" />
            <stop offset="42%" stopColor={t.accentText} stopOpacity="0.04" />
            <stop offset="50%" stopColor={t.accentText} stopOpacity="0.24" />
            <stop offset="58%" stopColor={t.accentText} stopOpacity="0.04" />
            <stop offset="100%" stopColor={t.panel} stopOpacity="0" />
          </linearGradient>
          <filter id="atlasPacketGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="atlasWindowClip">
            <rect x="18" y="28" width="484" height="294" rx="18" />
          </clipPath>
        </defs>
        <rect className="atlas-window-frame" x="18" y="28" width="484" height="294" rx="18" fill="transparent" stroke={t.border} strokeOpacity="0.38" strokeWidth="0.75" strokeDasharray="2 14" />
        <g clipPath="url(#atlasWindowClip)">
          {[82, 164, 246, 328, 410].map((x, index) => (
            <line key={`v-${x}`} className="atlas-depth-line" x1={x} y1="38" x2={x} y2="312" stroke={t.border} strokeOpacity="0.58" strokeWidth="0.55" style={{ "--grid-delay": `${index * 70}ms` }} />
          ))}
          {[92, 160, 228, 296].map((y, index) => (
            <line key={`h-${y}`} className="atlas-depth-line" x1="28" y1={y} x2="492" y2={y} stroke={t.border} strokeOpacity="0.58" strokeWidth="0.55" style={{ "--grid-delay": `${180 + index * 70}ms` }} />
          ))}
          <rect className="atlas-scan-beam" x="-92" y="34" width="92" height="284" fill="url(#atlasScanGradient)" />
        </g>
        <circle cx="260" cy="176" r="134" fill="url(#atlasCoreGlow)" />
        {[70, 120, 170].map((r, index) => (
          <ellipse key={r} className="atlas-orbit" cx="260" cy="176" rx={r + 54} ry={r} fill="none" stroke={t.border} strokeWidth="1" strokeDasharray={index === 1 ? "2 8" : "5 10"} style={{ "--orbit-delay": `${index * 220}ms` }} />
        ))}
        {sourceLines.map((line, index) => (
          <path key={index} className="atlas-source-line" d={line.d} fill="none" stroke={t.accentText} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="6 8" style={{ "--source-delay": line.delay }} />
        ))}
        <g className="atlas-data-packets" filter="url(#atlasPacketGlow)" aria-hidden="true">
          <circle className="atlas-data-packet atlas-data-packet-a" cx="72" cy="178" r="3.8" fill={t.accentText} />
          <circle className="atlas-data-packet atlas-data-packet-b" cx="72" cy="178" r="3.4" fill={t.violet || t.accentText} />
          <circle className="atlas-data-packet atlas-data-packet-c" cx="308" cy="152" r="3.2" fill={t.warn} />
          <circle className="atlas-data-packet atlas-data-packet-d" cx="122" cy="98" r="3.5" fill={t.success || t.accentText} />
        </g>
        <path className="atlas-pareto-line" d="M86 288 C144 250 170 236 210 214 C252 190 300 178 342 140 C376 110 408 88 454 70" fill="none" stroke="url(#atlasParetoLine)" strokeWidth="3.4" strokeLinecap="round" />
        {[0.12, 0.28, 0.43, 0.55, 0.68, 0.82].map((ratio, index) => {
          const x = 82 + ratio * 376
          const y = 294 - Math.pow(ratio, 1.55) * 226
          return <circle key={ratio} className="atlas-pareto-point" cx={x} cy={y} r={index % 2 ? 4.8 : 6.2} fill={index % 3 === 0 ? t.warn : t.accentText} fillOpacity="0.82" stroke={t.panel} strokeWidth="1.4" style={{ "--point-delay": `${index * 90}ms` }} />
        })}
        <g className="atlas-core">
          <circle className="atlas-core-halo atlas-core-halo-outer" cx="260" cy="176" r="66" fill="none" stroke={t.accentText} strokeWidth="1" />
          <circle className="atlas-core-halo atlas-core-halo-inner" cx="260" cy="176" r="56" fill="none" stroke={t.warn} strokeWidth="0.9" />
          <circle cx="260" cy="176" r="48" fill={t.panel} stroke={t.accentText} strokeWidth="1.8" />
          <circle cx="260" cy="176" r="28" fill={t.badgeInfoBg} stroke={t.border} />
          <text x="260" y="171" textAnchor="middle" fill={t.textStrong} fontSize="13" fontWeight="900">EcoMOF</text>
          <text x="260" y="190" textAnchor="middle" fill={t.muted} fontSize="10" fontWeight="800">AI Atlas</text>
        </g>
        {modules.map((module, index) => (
          <g key={module.id} className="atlas-module-node" style={{ "--module-delay": `${index * 120}ms` }}>
            <circle className="atlas-node-pulse" cx={module.x} cy={module.y} r="31" fill="none" stroke={module.tone} strokeWidth="1" style={{ "--pulse-delay": `${index * 420}ms` }} />
            <circle cx={module.x} cy={module.y} r="23" fill={t.panel} stroke={module.tone} strokeWidth="2" />
            <circle cx={module.x} cy={module.y} r="7" fill={module.tone} fillOpacity="0.82" />
            <text x={module.x} y={module.y + 39} textAnchor="middle" fill={t.textStrong} fontSize="10.5" fontWeight="850">{module.id}</text>
          </g>
        ))}
      </svg>
      <div className="atlas-metric-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 8, marginTop: isMobile ? -18 : -30, padding: isMobile ? "0 8px 8px" : "0 14px 12px" }}>
        {metrics.map((metric, index) => <AtlasMetric key={metric.label} item={metric} t={t} index={index} />)}
      </div>
    </aside>
  )
}

function MiniBarChart({ title, rows, t }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 15,
      display: "grid",
      gap: 12,
      minWidth: 0,
    }}>
      <h3 style={{ margin: 0, color: t.textStrong, fontSize: 14.5, lineHeight: 1.3, fontWeight: 900 }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: "grid", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35, fontWeight: 780 }}>{row.label}</span>
              <span style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.35, fontWeight: 900, fontFamily: FONT_SANS }}>{row.value}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: t.surface, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(5, Math.min(100, row.percent))}%`, height: "100%", background: row.color || t.accent }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function FlowStep({ item, t, index, isLast }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 11, position: "relative", minWidth: 0 }}>
      <div style={{ display: "grid", justifyItems: "center", alignContent: "start", gap: 7 }}>
        <IconBadge t={t} tone={item.tone}>{String(index + 1).padStart(2, "0")}</IconBadge>
        {!isLast && <span style={{ width: 1, height: 34, background: t.borderStrong }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10 }}>
        <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.35 }}>{item.title}</strong>
        <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 12, lineHeight: 1.55 }}>{item.body}</p>
      </div>
    </div>
  )
}

function ModuleCapabilityCard({ module, t, isMobile, onNavigate }) {
  return (
    <article className="content-card home-module-card home-atlas-linked-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 16,
      display: "grid",
      gap: 11,
      minWidth: 0,
      alignContent: "start",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconBadge t={t} tone={module.tone}>{module.mark}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, color: t.textStrong, fontSize: 16.5, lineHeight: 1.25, fontWeight: 900 }}>{module.title}</h3>
          <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, marginTop: 3, textTransform: "uppercase", letterSpacing: 0 }}>{module.tag}</div>
        </div>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.3, lineHeight: 1.6 }}>{module.body}</p>
      <div style={{ display: "grid", gap: 4 }}>
        {module.io.map(line => (
          <span key={line} style={{ color: t.textStrong, fontSize: 11.5, lineHeight: 1.45, fontWeight: 700 }}>{line}</span>
        ))}
      </div>
      <div className="home-module-flowline" aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
        <span style={{ height: 1, background: t.borderStrong }} />
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, letterSpacing: 0 }}>DATA → RESULT</span>
        <span style={{ height: 1, background: t.borderStrong }} />
      </div>
      <ActionButton t={t} wide hash={`#${module.hash}`} onClick={() => onNavigate(module.hash, module.target)}>
        {module.button}
      </ActionButton>
    </article>
  )
}

function ScenarioCard({ scenario, t, isMobile, onNavigate }) {
  return (
    <article className="content-card" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      boxShadow: t.shadowSm,
      padding: 17,
      display: "grid",
      gap: 13,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBadge t={t} tone={scenario.tone}>{scenario.mark}</IconBadge>
        <h3 style={{ margin: 0, color: t.textStrong, fontSize: 18, lineHeight: 1.25, fontWeight: 950 }}>{scenario.title}</h3>
      </div>
      <p style={{ margin: 0, color: t.muted, fontSize: 12.5, lineHeight: 1.65 }}>{scenario.body}</p>
      <ActionButton t={t} wide={isMobile} hash={`#${scenario.hash}`} onClick={() => onNavigate(scenario.hash, scenario.target)}>
        {scenario.button}
      </ActionButton>
    </article>
  )
}

function LimitationItem({ item, t }) {
  return (
    <li style={{
      listStyle: "none",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "12px 13px",
      color: t.textStrong,
      display: "grid",
      gap: 3,
      minWidth: 0,
    }}>
      <strong style={{ fontSize: 13, lineHeight: 1.35 }}>{item.zh}</strong>
      <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{item.en}</span>
    </li>
  )
}

function HeroVisual({ t, lang, summary }) {
  const rows = [
    { label: "Database", value: numberText(summary.totalRecords, "+") },
    { label: "Labels", value: numberText(summary.experimentalLabelCount) },
    { label: "Benchmark", value: numberText(summary.benchmarkEligibleCount) },
    { label: "Model", value: summary.bestModel || "Pending" },
  ]

  return (
    <aside className="content-card home-platform-visual" style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: 18,
      display: "grid",
      gap: 15,
      minWidth: 0,
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
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <LogoMark size={24} radius={7} />
          <strong style={{ color: t.textStrong, fontSize: 12.5, lineHeight: 1.2 }}>
            {text("平台工作流", "Platform Workflow", lang)}
          </strong>
        </div>
        <span style={{
          color: t.accentText,
          background: t.badgeInfoBg,
          border: `1px solid ${t.border}`,
          borderRadius: 999,
          padding: "6px 9px",
          fontSize: 10.5,
          fontWeight: 850,
        }}>
          {APP_VERSION_LABEL}
        </span>
      </div>
      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 9 }}>
        {rows.map((row, index) => (
          <div key={row.label} style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
          }}>
            <IconBadge t={t} tone={index === 0 ? "info" : index === 1 ? "success" : index === 2 ? "warn" : "neutral"}>
              {String(index + 1).padStart(2, "0")}
            </IconBadge>
            <div style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 9,
              padding: "10px 11px",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}>
              <span style={{ color: t.muted, fontSize: 12, fontWeight: 820 }}>{row.label}</span>
              <strong style={{ color: t.textStrong, fontSize: 12.5, fontFamily: FONT_SANS, lineHeight: 1.3 }}>{row.value}</strong>
            </div>
          </div>
        ))}
      </div>
      <p style={{ position: "relative", zIndex: 1, margin: 0, color: t.subtle, fontSize: 11.5, lineHeight: 1.55, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
        {text("从数据库到筛选解释，再到验证准备。", "From database to screening explanation, then validation preparation.", lang)}
      </p>
    </aside>
  )
}

export function HomeTab({ setActiveTab }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const reducedMotion = usePrefersReducedMotion()
  const [summary, setSummary] = useState(DEFAULT_HOME_SUMMARY)
  const gasParetoCount = useMemo(() => buildGasParetoRows().length, [])
  const zh = lang === "zh"

  useEffect(() => {
    let cancelled = false
    loadHomeSummary().then(nextSummary => {
      if (!cancelled) setSummary(nextSummary)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const navigateHash = (hash, fallbackTarget) => {
    setActiveTab?.(fallbackTarget)
    if (typeof window === "undefined") return
    const normalized = String(hash || "").replace(/^#/, "")
    window.location.hash = normalized
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    } catch {
      window.dispatchEvent(new Event("hashchange"))
    }
  }

  const pageGap = isMobile ? 28 : 38
  const sectionStyle = { background: "transparent", border: "none", borderRadius: 0 }
  const panelStyle = {
    background: t.panel,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    boxShadow: t.shadowSm,
  }

  const capabilities = useMemo(() => [
    {
      mark: "CV",
      title: "Current Version",
      subtitle: zh ? "动态项目状态" : "Dynamic project status",
      tone: "info",
      highlights: [APP_VERSION_LABEL, `${zh ? "数据状态" : "Data state"} ${summary.currentVersion || "V3.6"}`],
      body: zh ? "当前 App 版本来自 app_release_log；项目演化 V3.x 作为历史/数据状态保留。" : "The current App version comes from app_release_log; project-evolution V3.x remains as history/data state.",
    },
    {
      mark: "DB",
      title: "Database Scale",
      subtitle: zh ? "真实数据规模" : "Real data scale",
      tone: "success",
      highlights: [`${numberText(summary.totalRecords, "+")} Records`, `${numberText(summary.verifiedMetadataCount)} Verified Metadata`],
      body: zh ? "数据库规模与已核验元数据来自 ingestion summary。" : "Database scale and verified metadata come from the ingestion summary.",
    },
    {
      mark: "EL",
      title: "Experimental Labels",
      subtitle: "Platform Capabilities",
      tone: "warn",
      highlights: [numberText(summary.experimentalLabelCount), `${numberText(summary.externalTestCount)} External Test`],
      body: zh ? "实验标签与外部测试来自 V3.6 稳健性验证数据。" : "Experimental labels and external tests come from the V3.6 robustness dataset.",
    },
    {
      mark: "BM",
      title: "Benchmark Ready",
      subtitle: "Platform Capabilities",
      tone: "neutral",
      highlights: [numberText(summary.benchmarkEligibleCount), summary.bestModel || "Random Forest"],
      body: zh ? "Benchmark eligible 与最佳模型由验证数据动态给出。" : "Benchmark eligible count and best model are resolved from validation artifacts.",
    },
    {
      mark: "CR",
      title: "Credibility",
      subtitle: zh ? "模型可信度" : "Model credibility",
      tone: "success",
      highlights: [`${metricText(summary.credibilityScore)} / Grade ${summary.credibilityGrade}`, `ROC-AUC ${metricText(summary.rocAuc, 4)}`],
      body: zh ? "可信度分数来自 Robustness Validation 的 credibility v2。" : "Credibility score is read from robustness validation credibility v2.",
    },
    {
      mark: "RK",
      title: "Current Risk",
      subtitle: zh ? "当前限制" : "Current limitation",
      tone: "warn",
      highlights: [summary.currentRisk || "High Overfitting Risk", "Not Final Recommendation"],
      body: zh ? "风险作为首页状态展示，不隐藏在说明文字中。" : "Risk is surfaced on the homepage instead of being hidden in explanatory copy.",
    },
  ], [summary, zh])

  const dataCards = useMemo(() => [
    { name: "CoRE MOF", value: numberText(summary.coreMofRecords), body: zh ? "外部数据库来源材料记录。" : "External database material records." },
    { name: "QMOF", value: numberText(summary.qmofRecords), body: zh ? "量子化学数据来源材料记录。" : "Quantum chemistry source records." },
    { name: "Organic Acid Literature", value: numberText(summary.organicAcidLiteratureRecords), body: zh ? "有机酸路径文献整理记录。" : "Literature-curated organic-acid pathway records." },
    { name: "Reaction Dataset", value: numberText(summary.reactionDatasetCount), body: zh ? "反应证据与可比性数据层。" : "Reaction evidence and comparability layer." },
    { name: "Gold Dataset", value: numberText(summary.goldDatasetCount), body: zh ? "用于质量审计的高质量整理集合。" : "High-quality curation set for quality audit." },
  ], [summary, zh])

  const chartRows = useMemo(() => ({
    coverage: [
      { label: "CoRE MOF", value: numberText(summary.coreMofRecords), percent: 100 },
      { label: "QMOF", value: numberText(summary.qmofRecords), percent: 100 },
      { label: "Organic Acid Literature", value: numberText(summary.organicAcidLiteratureRecords), percent: 44 },
    ],
    quality: [
      { label: "Verified Metadata", value: numberText(summary.verifiedMetadataCount), percent: Math.round((summary.verifiedMetadataCount / Math.max(1, summary.totalRecords)) * 100) },
      { label: "Gold Dataset", value: numberText(summary.goldDatasetCount), percent: 62 },
      { label: "Reaction Dataset", value: numberText(summary.reactionDatasetCount), percent: 100 },
    ],
    source: [
      { label: "Database", value: numberText(summary.coreMofRecords + summary.qmofRecords), percent: 82 },
      { label: "Literature", value: numberText(summary.organicAcidLiteratureRecords), percent: 18 },
      { label: "Derived Research Layer", value: numberText(summary.reactionDatasetCount), percent: 35 },
    ],
  }), [summary])

  const validationFlow = useMemo(() => [
    {
      title: "White-box Screening",
      body: zh ? "透明规则与权重让筛选路径可检查。" : "Transparent rules and weights keep the screening path inspectable.",
      tone: "info",
    },
    {
      title: "Evidence Adjustment",
      body: zh ? "证据等级、来源状态和风险提示影响解释语境。" : "Evidence level, source status, and risk notes shape the explanation context.",
      tone: "success",
    },
    {
      title: "Sensitivity Analysis",
      body: zh ? "候选稳定性通过参数扰动与排序变化检查。" : "Candidate stability is checked through parameter changes and ranking movement.",
      tone: "warn",
    },
    {
      title: "Experimental Labels",
      body: zh ? "实验标签用于连接候选解释与模型验证。" : "Experimental labels connect candidate explanation to model validation.",
      tone: "neutral",
    },
    {
      title: "Benchmark Framework",
      body: "Benchmark Available",
      tone: "info",
    },
  ], [zh])

  const scenarios = useMemo(() => [
    {
      mark: "MD",
      title: "MOF Discovery",
      body: zh ? "面向早期材料筛选，快速查看候选、来源字段和排序解释。" : "For early material screening: inspect candidates, source fields, and ranking explanations.",
      button: zh ? "进入 EcoScreen" : "Enter EcoScreen",
      hash: "ecoscreen",
      target: "ecoscreen",
      tone: "info",
    },
    {
      mark: "OA",
      title: "Organic Acid Screening",
      body: zh ? "围绕有机酸路径，查看反应数据、证据语境和候选决策面板。" : "For organic-acid pathways: review reaction data, evidence context, and candidate decision boards.",
      button: zh ? "进入 Organic Acid" : "Enter Organic Acid",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
      tone: "warn",
    },
    {
      mark: "BV",
      title: "Benchmark Validation",
      body: zh ? "查看验证中心的 Benchmark 框架、实验标签层和模型验证状态。" : "Use the validation center for benchmark framework, labels, and model-validation state.",
      button: zh ? "进入 Validation Center" : "Enter Validation Center",
      hash: "methodology-algorithm-validation",
      target: "about",
      tone: "success",
    },
  ], [zh])

  const limitations = useMemo(() => [
    { zh: summary.currentRisk || "High Overfitting Risk", en: "Train to external-test gap remains high and must stay visible." },
    { zh: "Need More Experimental Labels", en: `${numberText(summary.experimentalLabelCount)} labels are useful but still below research-grade scale.` },
    { zh: "Not Final Recommendation", en: "Candidate rankings support research decisions, not final experimental recommendation." },
  ], [summary])


  const moduleCapabilities = useMemo(() => [
    {
      mark: "ES",
      title: "EcoScreen",
      tag: zh ? "可持续性筛选" : "Sustainability screening",
      tone: "info",
      body: zh
        ? "做什么：对候选 MOF 做 LCA / LCC 可持续性筛选与白盒排序。"
        : "What it does: LCA / LCC sustainability screening with white-box ranking for candidate MOFs.",
      io: [
        zh ? "输入：MOF 结构 + 反应/工艺条件" : "Input: MOF structure + reaction/process conditions",
        zh ? "输出：环境与成本评分 + 可检查的排序解释" : "Output: environment & cost scores + inspectable ranking",
      ],
      button: zh ? "进入 EcoScreen" : "Enter EcoScreen",
      hash: "ecoscreen",
      target: "ecoscreen",
    },
    {
      mark: "ML",
      title: "MOF Library",
      tag: zh ? "统一 MOF 浏览器" : "Unified MOF browser",
      tone: "neutral",
      body: zh
        ? "做什么：查任意 MOF 的结构 + 气体 + 催化全貌，含字段级溯源。"
        : "What it does: browse any MOF's structure + gas + catalysis profile with field-level provenance.",
      io: [
        zh ? "输入：金属节点 / 拓扑 / 比表面 等分面检索" : "Input: faceted search by metal node / topology / surface area",
        zh ? "输出：聚合详情面板 + 数据完整度三色点" : "Output: aggregated detail panel + tri-color completeness dots",
      ],
      button: zh ? "进入 MOF Library" : "Enter MOF Library",
      hash: "library",
      target: "mofLibrary",
    },
    {
      mark: "OA",
      title: "Organic Acid",
      tag: zh ? "白盒催化路线筛选" : "White-box route screening",
      tone: "warn",
      body: zh
        ? "做什么：数据驱动的白盒主客体催化路线筛选（HGCPS + 不确定度）。"
        : "What it does: data-driven white-box host-guest catalytic route screening (HGCPS + uncertainty).",
      io: [
        zh ? "输入：反应数据 + 主体 MOF / 客体金属候选" : "Input: reaction data + host-MOF / guest-metal candidates",
        zh ? "输出：带误差条的 HGCPS 排序 + 证据语境" : "Output: HGCPS ranking with error bars + evidence context",
      ],
      button: zh ? "进入 Organic Acid" : "Enter Organic Acid",
      hash: "catalysis-organic-acid",
      target: "catalysisLab",
    },
    {
      mark: "GS",
      title: "GasSep",
      tag: zh ? "气体分离 / 容量筛选" : "Gas separation / capacity",
      tone: "success",
      body: zh
        ? "做什么：基于 ISODB 真实等温线与 IAST 选择性比较气体分离候选。"
        : "What it does: compare gas-separation candidates using real ISODB isotherms and IAST selectivity.",
      io: [
        zh ? "输入：气对（如 CO₂/N₂）+ 温度条件" : "Input: gas pair (e.g. CO₂/N₂) + temperature",
        zh ? "输出：computed-IAST 选择性 + 工作容量排序" : "Output: computed-IAST selectivity + working-capacity ranking",
      ],
      button: zh ? "进入 GasSep" : "Enter GasSep",
      hash: "gassep",
      target: "gassep",
    },
  ], [zh])

  const quickStart = [
    { label: zh ? "进入 EcoScreen" : "Enter EcoScreen", hash: "ecoscreen", target: "ecoscreen", primary: true },
    { label: zh ? "进入 MOF Library" : "Enter MOF Library", hash: "library", target: "mofLibrary" },
    { label: zh ? "进入 Organic Acid" : "Enter Organic Acid", hash: "catalysis-organic-acid", target: "catalysisLab" },
    { label: zh ? "进入 GasSep" : "Enter GasSep", hash: "gassep", target: "gassep" },
    { label: zh ? "进入 Validation Center" : "Enter Validation Center", hash: "methodology-algorithm-validation", target: "about" },
    { label: zh ? "进入 Research Reports" : "Enter Research Reports", hash: "research-reports", target: "researchReports" },
  ]

  return (
    <div className="home-story-shell" style={{ display: "flex", flexDirection: "column", gap: pageGap, overflow: "hidden", position: "relative" }}>
      <BrandMotionBackground t={t} isMobile={isNarrow} reducedMotion={reducedMotion} />

      <section id="overview" data-testid="home-hero" className="home-hero-section" style={{ ...sectionStyle, paddingTop: isMobile ? 10 : 18, position: "relative", overflow: "hidden" }}>
        <div className="home-hero-bg-layer" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
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
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 0.96fr) minmax(320px, 0.82fr)",
          gap: isMobile ? 16 : 20,
          alignItems: "center",
          minWidth: 0,
          position: "relative",
          zIndex: 1,
        }}>
          <div className="home-hero-foreground" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <LogoMark size={isMobile ? 48 : 58} radius={14} style={{ boxShadow: t.shadowSm }} />
              <div style={{ color: t.accentText, fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                {zh ? "材料筛选 / 字段级溯源 / 验证准备" : "Material screening / field-level provenance / validation readiness"}
              </div>
            </div>
            <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 42 : 64, lineHeight: 0.98, fontWeight: 950, letterSpacing: 0 }}>
              EcoMOF-AI
            </h1>
            <p style={{ margin: isMobile ? "14px 0 0" : "18px 0 0", color: t.textStrong, fontSize: isMobile ? 20 : 28, lineHeight: 1.18, fontWeight: 900, maxWidth: 860 }}>
              Data-driven MOF Screening and Validation Platform
            </p>
            <p style={{ margin: "13px 0 0", color: t.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.7, maxWidth: 780 }}>
              {zh
                ? "一个平台，四个模块：EcoScreen 做可持续性筛选，MOF Library 浏览结构/气体/催化全貌，Organic Acid 做白盒催化路线筛选，GasSep 做气体分离筛选。"
                : "One platform, four modules: EcoScreen for sustainability screening, MOF Library to browse structure/gas/catalysis, Organic Acid for white-box route screening, and GasSep for gas separation."}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }} className="home-hero-cta">
              {quickStart.slice(0, 3).map(cta => (
                <ActionButton key={cta.hash} t={t} primary={cta.primary} wide={isMobile} hash={`#${cta.hash}`} onClick={() => navigateHash(cta.hash, cta.target)}>
                  {cta.label}
                </ActionButton>
              ))}
            </div>
          </div>
          <ScientificAtlasHero t={t} lang={lang} summary={summary} gasParetoCount={gasParetoCount} isMobile={isMobile} reducedMotion={reducedMotion} />
        </div>
      </section>

      <section data-testid="home-module-capabilities" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "平台模块" : "Platform Modules"}
          title={zh ? "按模块看能力" : "Capabilities by module"}
          subtitle={zh ? "每个模块解决一类问题：做什么、输入什么、输出什么，点击直达对应工作区。" : "Each module solves one kind of problem — what it does, what it takes in, what it returns. Click to enter."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          {moduleCapabilities.map(module => (
            <ModuleCapabilityCard key={module.title} module={module} t={t} isMobile={isMobile} onNavigate={navigateHash} />
          ))}
        </div>
      </section>

      <section data-testid="home-platform-capabilities" style={sectionStyle}>
        <SectionHeader
          eyebrow="Current Capability"
          title={zh ? "当前能力状态" : "Current capability status"}
          subtitle={zh ? "状态卡直接读取项目状态聚合器，展示数据库、标签、Benchmark、模型、可信度与风险。" : "Cards read the project status aggregator for database, labels, benchmark, model, credibility, and risk."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {capabilities.map(item => <PlatformCapabilityCard key={item.title} item={item} t={t} />)}
        </div>
      </section>

      <section data-testid="home-data-foundation" style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.badgeInfoBg }}>
        <SectionHeader
          eyebrow={zh ? "数据基础" : "Data Foundation"}
          title={zh ? "可追踪的数据来源与质量概览" : "Traceable source and data-quality overview"}
          subtitle={zh ? "展示数据库、文献、反应与 Gold 数据集，不展示版本增长曲线。" : "Shows database, literature, reaction, and Gold datasets without a version-growth chart."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(5, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
          {dataCards.map(item => <DataCard key={item.name} item={item} t={t} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <MiniBarChart title="Data Coverage" rows={chartRows.coverage} t={t} />
          <MiniBarChart title="Data Quality" rows={chartRows.quality} t={t} />
          <MiniBarChart title="Source Distribution" rows={chartRows.source} t={t} />
        </div>
      </section>

      <section data-testid="home-descriptor-3d" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "交互可视化" : "Interactive Visual"}
          title={zh ? "数据库描述符空间" : "Descriptor space explorer"}
          subtitle={zh ? "用真实 CoRE/QMOF 数据展示 MOF 描述符的三维分布，可旋转、缩放与悬停查看。" : "Explore the 3D distribution of MOF descriptors on real CoRE/QMOF data — rotate, zoom, and hover."}
          t={t}
          isMobile={isMobile}
        />
        <MofDescriptor3DScatter t={t} lang={lang} isMobile={isMobile} />
        <div style={{ height: isMobile ? 14 : 18 }} />
        <GasParetoChart t={t} lang={lang} isMobile={isMobile} />
      </section>

      <section data-testid="home-algorithm-validation" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "算法与验证" : "Validation"}
          title={zh ? "白盒筛选与 Benchmark 验证框架" : "White-box screening with benchmark validation framework"}
          subtitle={zh ? "首页只展示验证能力与 Benchmark 可用状态，具体模型指标留在算法验证中心。" : "The homepage shows validation capabilities and Benchmark Available; detailed model metrics stay in the validation center."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ ...panelStyle, padding: isMobile ? "16px" : "22px", display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 220px", gap: 18 }}>
          <div style={{ display: "grid", gap: 2 }}>
            {validationFlow.map((item, index) => (
              <FlowStep key={item.title} item={item} t={t} index={index} isLast={index === validationFlow.length - 1} />
            ))}
          </div>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 15, alignSelf: "start", display: "grid", gap: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 16, lineHeight: 1.3 }}>Benchmark Available</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.6 }}>
              {zh ? "Benchmark 框架已作为验证入口呈现，模型指标详情由验证中心承载。" : "The benchmark framework is available as the validation entry; model metric details stay in the validation center."}
            </span>
          </div>
        </div>
      </section>

      <section data-testid="home-research-scenarios" style={sectionStyle}>
        <SectionHeader
          eyebrow={zh ? "研究场景" : "Research Scenarios"}
          title={zh ? "三类常见研究入口" : "Three common research entry points"}
          subtitle={zh ? "用户可以从材料发现、有机酸筛选或 Benchmark 验证直接进入对应工作区。" : "Users can enter the right workspace through discovery, organic-acid screening, or benchmark validation."}
          t={t}
          isMobile={isMobile}
        />
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {scenarios.map(scenario => (
            <ScenarioCard key={scenario.title} scenario={scenario} t={t} isMobile={isMobile} onNavigate={navigateHash} />
          ))}
        </div>
      </section>

      <section data-testid="home-current-limitations" style={{ ...panelStyle, padding: isMobile ? "18px 16px" : "24px", background: t.surface }}>
        <SectionHeader
          eyebrow="Current Limitations"
          title={zh ? "当前限制" : "Current limitations"}
          subtitle={zh ? "风险区直接显示当前统计学风险、标签规模需求和非最终推荐边界。" : "The risk area directly shows statistical risk, label-scale need, and not-final recommendation boundary."}
          t={t}
          isMobile={isMobile}
        />
        <ul style={{ margin: 0, padding: 0, display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {limitations.map(item => <LimitationItem key={item.zh} item={item} t={t} />)}
        </ul>
      </section>

      <section data-testid="home-quick-start" style={{ ...panelStyle, padding: isMobile ? "22px 18px" : "30px 34px", display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto", gap: 18, alignItems: "center", marginBottom: isMobile ? 4 : 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.accentText, fontSize: 11, fontWeight: 850, textTransform: "uppercase", letterSpacing: 0, marginBottom: 8 }}>
            {zh ? "快速开始" : "Quick Start"}
          </div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 24 : 32, lineHeight: 1.15, fontWeight: 950, letterSpacing: 0 }}>
            {zh ? "选择研究入口" : "Choose a research entry point"}
          </h2>
          <p style={{ margin: "9px 0 0", color: t.muted, fontSize: 13.5, lineHeight: 1.65, maxWidth: 760 }}>
            {zh ? "从筛选、数据库、有机酸、验证中心或研究报告进入完整工作流。" : "Start from screening, the MOF library, organic acid, the validation center, or research reports."}
          </p>
        </div>
        <div data-testid="home-quick-start-buttons" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
          {quickStart.map(cta => (
            <ActionButton key={cta.hash} t={t} primary={cta.primary} wide={isMobile} hash={`#${cta.hash}`} onClick={() => navigateHash(cta.hash, cta.target)}>
              {cta.label}
            </ActionButton>
          ))}
        </div>
      </section>
    </div>
  )
}
