// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react"
import { InlineMath, BlockMath } from "react-katex"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS, FONT_MONO } from "../../constants/theme"
import { chemText, isScientificToken, SCIENTIFIC_TOKEN_FONT } from "../../utils/chemText"
import { WORKFLOW_STAGE_ITEMS, SOURCE_BADGES } from "../../constants/badges"
import { zhText, gasLabel } from "../../utils/labels"
import { formatFunctionalGroupSummary, getFunctionalGroupEntries } from "../../utils/functionalGroups"
import { getGasSystem } from "../../utils/prediction"
import { toolbarBtn } from "../../utils/styles"
import { buildDeepLink } from "../../utils/deepLinks"
import { GraphDescriptorPanel } from "../mof/GraphDescriptorPanel"
import { OrganicAcidRelevancePanel } from "../mof/OrganicAcidRelevancePanel"
import { ChemicalFormula as ChemicalFormulaText } from "../common/ChemicalFormula"
import { AnchoredFieldProvenancePanel } from "../common/FieldProvenanceButton"

export const ECOMOF_LOGO_SRC = "/ecomof-ai/ecomof-logo.png"

function FormulaFallback({ children, block = false, t }) {
  return (
    <code style={{
      display: block ? "block" : "inline",
      color: t?.textStrong || "currentColor",
      fontFamily: FONT_MONO,
      fontSize: block ? 11 : "0.95em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </code>
  )
}

export function InlineFormula({ math, fallback, style }) {
  const t = useT()
  return (
    <span className="math-inline" style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden", verticalAlign: "middle", ...style }}>
      <InlineMath math={math} renderError={() => <FormulaFallback t={t}>{fallback || math}</FormulaFallback>} />
    </span>
  )
}

export function ScientificText({ children, as: Tag = "span", style }) {
  const value = chemText(children)
  return (
    <Tag style={{
      fontFamily: isScientificToken(value) ? SCIENTIFIC_TOKEN_FONT : undefined,
      ...style,
    }}>
      {value}
    </Tag>
  )
}

export function ChemFormula({ children, value, style }) {
  return <ChemicalFormulaText value={value ?? children} style={style} />
}

export function BlockFormula({ math, fallback, t: tone, style }) {
  const theme = useT()
  const t = tone || theme
  return (
    <div className="formula-scroll" style={{
      overflowX: "auto",
      overflowY: "hidden",
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: "10px 12px",
      ...style,
    }}>
      <BlockMath math={math} renderError={() => <FormulaFallback block t={t}>{fallback || math}</FormulaFallback>} />
    </div>
  )
}

export function BrandMark({ size = 32, radius = 8, alt = "EcoMOF-AI logo", style }) {
  return (
    <img
      src={ECOMOF_LOGO_SRC}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        display: "block",
        flex: "0 0 auto",
        ...style,
      }}
    />
  )
}

export function CopyLinkButton({
  hash,
  value,
  label,
  copiedLabel,
  ariaLabel,
  tone = "subtle",
}) {
  const t = useT()
  const { lang } = useLang()
  const [status, setStatus] = useState("")
  const text = value || buildDeepLink(hash)
  const displayLabel = label || (lang === "zh" ? "复制链接" : "Copy link")
  const defaultSuccessLabel = lang === "zh" ? "已复制 ✓" : "Copied ✓"
  const isLinkCopy = Boolean(hash) || /link|链接/i.test(displayLabel)
  const successLabel = isLinkCopy ? defaultSuccessLabel : (copiedLabel || defaultSuccessLabel)
  const failedLabel = lang === "zh" ? "复制失败" : "Copy failed"

  const copy = async () => {
    let ok = false
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
    } catch {
      ok = false
    }

    if (!ok) {
      try {
        const area = document.createElement("textarea")
        area.value = text
        area.setAttribute("readonly", "")
        area.style.position = "fixed"
        area.style.opacity = "0"
        document.body.appendChild(area)
        area.select()
        ok = document.execCommand("copy")
        document.body.removeChild(area)
      } catch {
        ok = false
      }
    }

    setStatus(ok ? "copied" : "failed")
    window.setTimeout(() => setStatus(""), 1500)
  }

  const buttonLabel = status === "copied" ? successLabel : status === "failed" ? failedLabel : displayLabel

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
      <button
        type="button"
        onClick={copy}
        aria-label={ariaLabel || displayLabel}
        aria-live="polite"
        style={{
          ...toolbarBtn(t),
          padding: "7px 10px",
          fontSize: 11,
          fontWeight: status ? 850 : 750,
          color: status === "copied" ? t.success : status === "failed" ? t.danger : tone === "accent" ? t.accentText : t.subtle,
          borderColor: status === "copied" ? t.success : status === "failed" ? t.danger : t.borderStrong,
          background: status === "copied" ? t.badgeCalcBg : status === "failed" ? t.badgeDangerBg : t.panel,
          whiteSpace: "nowrap",
        }}
      >
        {buttonLabel}
      </button>
    </span>
  )
}

export function openDisclaimerCenter() {
  if (typeof window === "undefined") return
  const targetHash = "#disclaimer"
  if (window.location.hash !== targetHash) {
    const url = `${window.location.pathname}${window.location.search}${targetHash}`
    window.history.pushState(null, "", url)
  }
  const event = typeof HashChangeEvent === "function" ? new HashChangeEvent("hashchange") : new Event("hashchange")
  window.dispatchEvent(event)
}

export function DisclaimerLink({ label, ariaLabel, style }) {
  const t = useT()
  const { lang } = useLang()
  const displayLabel = label || (lang === "zh" ? "查看声明" : "See Disclaimer")

  return (
    <button
      type="button"
      onClick={openDisclaimerCenter}
      aria-label={ariaLabel || (lang === "zh" ? "查看声明与使用边界" : "View Disclaimer Center")}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        color: t.accentText,
        cursor: "pointer",
        fontFamily: FONT_SANS,
        fontSize: "inherit",
        fontWeight: 800,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        ...style,
      }}
    >
      {displayLabel}
    </button>
  )
}

export const CustomTooltip = ({ active, payload, label, unitX = "bar", unitY = "mmol/g" }) => {
  const t = useT()
  if (active && payload && payload.length) {
    return (
      <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 12px" }}>
        <p style={{ color: t.muted, fontSize: 12, margin: 0 }}>{unitX === "bar" ? "P =" : "x ="} {label} {unitX}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, margin: "2px 0" }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value} {unitY}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function NumericField({ label, unit, min, max, step, value, onChange, helper }) {
  const t = useT()
  const [draft, setDraft] = useState(String(value ?? ""))
  useEffect(() => {
    setDraft(String(value ?? ""))
  }, [value])
  const clamp = (next) => Math.max(min, Math.min(max, next))
  const commitDraft = () => {
    if (draft === "" || draft === "-" || draft === ".") {
      setDraft(String(value ?? ""))
      return
    }
    const parsed = Number(draft)
    if (!Number.isFinite(parsed)) {
      setDraft(String(value ?? ""))
      return
    }
    const rounded = clamp(parsed)
    setDraft(String(rounded))
    onChange(rounded)
  }
  const pct = ((clamp(Number(value) || min) - min) / (max - min)) * 100
  const tooltipValue = `${Number(clamp(Number(value) || min)).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} ${unit}`
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: t.muted, fontSize: 12, fontFamily: "monospace" }}>{label}</span>
        <input
          type="number" value={draft} min={min} max={max} step={step}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={e => {
            if (e.key === "Enter") e.currentTarget.blur()
          }}
          style={{
            width: 90, background: t.surface, border: `1px solid ${t.border}`,
            borderRadius: 4, padding: "3px 8px", color: t.textStrong, fontSize: 13,
            fontFamily: FONT_MONO, outline: "none", textAlign: "right",
          }}
        />
      </div>
      <div className="range-control" style={{ position: "relative", height: 4, background: t.border, borderRadius: 2 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: t.accent, borderRadius: 2 }} />
        <div className="range-value-tooltip" style={{ left: `${pct}%`, background: t.textStrong, color: t.bg }}>
          {tooltipValue}
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => {
            const next = parseFloat(e.target.value)
            setDraft(String(next))
            onChange(next)
          }}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
        />
        <div className="range-thumb" style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 12, height: 12, borderRadius: "50%",
          background: t.accent, border: `2px solid ${t.accentSoft}`,
          pointerEvents: "none"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ color: t.faint, fontSize: 10 }}>{min} {unit}</span>
        <span style={{ color: t.faint, fontSize: 10 }}>{max} {unit}</span>
      </div>
      {helper && <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{helper}</div>}
    </div>
  )
}

export function MetricCard({ label, value, unit, badge, badgeColor, badgeBg, comparison }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div className="content-card metric-card" style={{ position: "relative", overflow: "hidden", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "14px 16px", boxShadow: t.shadowSm }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${t.accent}, ${t.accentSoft})` }} />
      <div style={{ color: t.subtle, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>{zhText(lang, label)}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ color: t.textStrong, fontSize: 28, fontWeight: 700, fontFamily: FONT_MONO }}>{value}</span>
        <span style={{ color: t.faint, fontSize: 13 }}>{unit}</span>
        {badge && (
          <span style={{ marginLeft: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
            color: badgeColor, background: badgeBg, letterSpacing: "0.05em" }}>
            {zhText(lang, badge)}
          </span>
        )}
      </div>
      {comparison && <div style={{ color: t.accentText, fontSize: 11, marginTop: 4 }}>{zhText(lang, comparison)}</div>}
    </div>
  )
}

export function BasisBadge({ children, tone = "info", style, ...props }) {
  const t = useT()
  const { lang } = useLang()
  const palette = {
    info: { color: t.badgeInfoText, bg: t.badgeInfoBg, border: "rgba(110,168,255,0.26)" },
    calc: { color: t.badgeCalcText, bg: t.badgeCalcBg, border: "rgba(156,178,212,0.24)" },
    proxy: { color: t.badgeProxyText, bg: t.badgeProxyBg, border: "rgba(183,169,255,0.28)" },
    user: { color: t.badgeUserText, bg: t.badgeUserBg, border: "rgba(156,178,212,0.18)" },
    warn: { color: t.badgeWarnText, bg: t.badgeWarnBg, border: "rgba(246,201,142,0.42)" },
    danger: { color: t.badgeDangerText, bg: t.badgeDangerBg, border: "rgba(232,134,134,0.42)" },
  }[tone] || {}
  return (
    <span {...props} className="basis-badge" style={{ display: "inline-flex", alignItems: "center", width: "fit-content",
      color: palette.color, background: palette.bg, border: `1px solid ${palette.border}`,
      borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, lineHeight: 1.4, ...style }}>
      {zhText(lang, children)}
    </span>
  )
}

const CURATION_FIELDS = [
  { key: "surfaceArea",      en: "Surface area",   zh: "比表面积"   },
  { key: "poreSizeA",        en: "Pore size",      zh: "孔径"       },
  { key: "poreVolume",       en: "Pore volume",    zh: "孔体积"     },
  { key: "co2Uptake",        en: "CO₂ uptake",     zh: "CO₂ 吸附量" },
  { key: "bandGap",          en: "Band gap",       zh: "带隙"       },
  { key: "waterStability",   en: "Water stability",zh: "水稳定性"   },
  { key: "thermalStability", en: "Thermal stability", zh: "热稳定性"},
  { key: "toxicityConcern",  en: "Toxicity concern",  zh: "毒性关注" },
]

function fieldCurationStatus(src, lang) {
  const zh = lang === "zh"
  if (!src) return { label: zh ? "待整理" : "Pending curation", tone: "warn" }
  if (src.sourceType === "pending") return { label: zh ? "待整理" : "Pending curation", tone: "warn" }
  if (src.evidenceLevel === "needs-validation") return { label: zh ? "待整理" : "Pending curation", tone: "warn" }
  if (src.curationStatus === "needs-review" || src.reviewStatus === "conflict" || src.hasConflict) {
    return { label: zh ? "待核查" : "Needs review", tone: "danger" }
  }
  return { label: zh ? "已整理" : "Curated", tone: "calc" }
}

function DescriptorCurationChecklist({ fieldSources, lang, t }) {
  const zh = lang === "zh"
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase", marginBottom: 8 }}>
        {zh ? "描述符整理清单" : "Descriptor Curation Checklist"}
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        {CURATION_FIELDS.map(f => {
          const src = fieldSources?.[f.key]
          const { label: statusLabel, tone } = fieldCurationStatus(src, lang)
          const displayVal = src?.value !== undefined && src?.value !== null
            ? `${src.value}${src.unit ? " " + src.unit : ""}`
            : (zh ? "暂无数据" : "Not available")
          return (
            <div key={f.key} style={{
              display: "grid",
              gridTemplateColumns: "minmax(90px, 1.2fr) minmax(60px, 1fr) auto auto",
              gap: 6, alignItems: "center",
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 6, padding: "6px 9px",
              boxShadow: `inset 3px 0 0 0 ${tone === "calc" ? (t.accent || "#4f86f7") : tone === "danger" ? (t.badgeDangerText || "#ef4444") : (t.warn || "#f59e0b")}`,
            }}>
              <span style={{ color: t.subtle, fontSize: 10, fontWeight: 700 }}>
                {zh ? f.zh : f.en}
              </span>
              <span style={{ color: t.textStrong, fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayVal}
              </span>
              <BasisBadge tone={tone}>{statusLabel}</BasisBadge>
              {src !== undefined && (
                <FieldProvenanceButton
                  fieldKey={f.key}
                  fieldLabel={zh ? f.zh : f.en}
                  source={src}
                  lang={lang}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function UnifiedCandidateCard({
  name,
  score,
  scoreLabel,
  suitableTask,
  scoreBreakdown = [],
  keyReasons = [],
  evidenceLevel,
  limitations,
  recommendedNextStep,
  fieldSources,
  graphMetadata,
  organicAcidRelevance,
  candidate,
  dataStatus,
  onDetails,
  descriptorTotal = 8,
  extraAction,
}) {
  const [expanded, setExpanded] = useState(false)
  const t = useT()
  const { lang } = useLang()
  const safeScore = Number.isFinite(Number(score)) ? Number(score).toFixed(1) : score || "—"
  const tone = Number(score) >= 8 ? "calc" : Number(score) >= 6.5 ? "info" : Number(score) >= 5 ? "proxy" : "warn"
  const scoreTone = Number(score) >= 80 ? "calc" : Number(score) >= 65 ? "info" : Number(score) >= 50 ? "proxy" : tone

  const curatedCount = fieldSources
    ? CURATION_FIELDS.filter(f => {
        const src = fieldSources[f.key]
        return src && src.sourceType !== "pending" && src.evidenceLevel !== "needs-validation"
      }).length
    : null

  const normalizedWidth = (value) => {
    const number = Number(value || 0)
    return Math.max(0, Math.min(100, number > 10 ? number : number * 10))
  }
  const formattedValue = (value) => Number(value || 0).toFixed(1)
  const nextSteps = Array.isArray(recommendedNextStep)
    ? recommendedNextStep
    : String(recommendedNextStep || "").split(/;|\n/).map(item => item.trim()).filter(Boolean)

  const dataStatusLabel = () => {
    if (!fieldSources && !dataStatus) return null
    if (dataStatus && /demo/i.test(dataStatus)) return { label: lang === "zh" ? "演示数据" : "Demo", tone: "proxy" }
    if (curatedCount === null) return dataStatus ? { label: dataStatus, tone: "proxy" } : null
    if (curatedCount === 0) return { label: lang === "zh" ? "待整理" : "Pending curation", tone: "warn" }
    if (curatedCount <= 5) return { label: lang === "zh" ? "部分已整理" : "Partially curated", tone: "user" }
    return { label: lang === "zh" ? "已整理" : "Curated", tone: "calc" }
  }

  const statusInfo = dataStatusLabel()

  return (
    <article className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, display: "grid", gap: 9, alignSelf: "start" }}>
      {/* ── Header row: name + score ── */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 3 }}>
            {lang === "zh" ? "MOF 名称" : "MOF name"}
          </div>
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 880, overflowWrap: "anywhere", lineHeight: 1.25 }}>{name}</div>
        </div>
        <BasisBadge tone={scoreTone}>{scoreLabel || (lang === "zh" ? "评分" : "Score")} {safeScore}</BasisBadge>
      </div>

      {/* ── Suitable task ── */}
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.45 }}>{suitableTask}</div>

      {/* ── Badges row ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <BasisBadge tone={/high|高|中等|medium/i.test(String(evidenceLevel)) ? "info" : "proxy"}>
          {evidenceLevel || (lang === "zh" ? "证据待补充" : "Evidence pending")}
        </BasisBadge>
        {statusInfo && <BasisBadge tone={statusInfo.tone}>{statusInfo.label}</BasisBadge>}
      </div>

      {/* ── Top 2 key reasons ── */}
      {keyReasons.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {keyReasons.slice(0, 2).map(reason => (
            <span key={reason} style={{ color: t.subtle, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 750 }}>
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* ── Descriptor curated count ── */}
      {curatedCount !== null && (
        <div style={{
          color: curatedCount === 0 ? t.warn : curatedCount <= 4 ? t.muted : t.accentText,
          fontSize: 10,
          fontWeight: curatedCount === 0 ? 750 : 600,
        }}>
          {lang === "zh"
            ? `${descriptorTotal} 个关键描述符中 ${curatedCount} 个已整理`
            : `${curatedCount}/${descriptorTotal} descriptors curated`}
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div style={{ display: "grid", gap: 10, paddingTop: 4, borderTop: `1px solid ${t.divider || t.border}` }}>
          {/* Score breakdown */}
          {scoreBreakdown.length > 0 && (
            <div>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>{lang === "zh" ? "评分分解" : "Score breakdown"}</div>
              <div style={{ display: "grid", gap: 5 }}>
                {scoreBreakdown.map(item => {
                  const itemLabel = lang === "zh" ? (item.labelZh || item.label) : item.label
                  return (
                  <div key={item.key || item.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 42px", gap: 8, alignItems: "center" }}>
                    <div style={{ height: 4, background: t.border, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${normalizedWidth(item.value)}%`, background: item.color || t.accent, borderRadius: 999 }} />
                    </div>
                    <div style={{ color: t.subtle, fontSize: 10, fontWeight: 800 }}>{formattedValue(item.value)}</div>
                    <div style={{ gridColumn: "1 / -1", color: t.faint, fontSize: 10, marginTop: -3 }}>{itemLabel}</div>
                  </div>
                )})}
              </div>
            </div>
          )}
          {/* All key reasons */}
          {keyReasons.length > 2 && (
            <div>
              <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 5 }}>{lang === "zh" ? "关键原因" : "Key reasons"}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {keyReasons.map(reason => (
                  <span key={reason} style={{ color: t.subtle, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 750 }}>
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Limitations */}
          {limitations && (
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 8 }}>
              <strong style={{ color: t.warn }}>{lang === "zh" ? "限制：" : "Limitations: "}</strong>{limitations}
            </div>
          )}
          {/* Next steps */}
          {nextSteps.length > 0 && (
            <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55 }}>
              <strong style={{ color: t.accentText }}>{lang === "zh" ? "下一步：" : "Recommended next step: "}</strong>
              <ul style={{ margin: "5px 0 0 16px", padding: 0 }}>
                {nextSteps.slice(0, 3).map(step => <li key={step}>{step}</li>)}
              </ul>
            </div>
          )}
          {/* Descriptor curation checklist */}
          {fieldSources && (
            <DescriptorCurationChecklist fieldSources={fieldSources} lang={lang} t={t} />
          )}
          {/* Graph descriptor panel */}
          <GraphDescriptorPanel graphMetadata={graphMetadata} t={t} lang={lang} />
          <OrganicAcidRelevancePanel relevance={organicAcidRelevance} candidate={candidate || { organicAcidRelevance, graphMetadata }} t={t} lang={lang} />
        </div>
      )}

      {/* ── Footer: expand / details buttons ── */}
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{ ...toolbarBtn(t), padding: "5px 9px", fontSize: 10 }}
        >
          {expanded
            ? (lang === "zh" ? "收起详情" : "Collapse")
            : (lang === "zh" ? "展开详情" : "View details")}
        </button>
        {onDetails && (
          <button type="button" onClick={onDetails} style={{ ...toolbarBtn(t), padding: "5px 9px", fontSize: 10, border: `1px solid ${t.accent}`, color: t.accentText }}>
            {lang === "zh" ? "详细分析" : "Full analysis"}
          </button>
        )}
        {extraAction}
      </div>
    </article>
  )
}

export function SourceBadge({ type }) {
  const item = SOURCE_BADGES[type] || SOURCE_BADGES.proxy
  return <BasisBadge tone={item.tone}>{item.label}</BasisBadge>
}

export function StageStrip({ current = "screening", onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const stagePalette = {
    screening: { color: t.performance, bg: t.badgeInfoBg },
    feasibility: { color: t.lccAccent, bg: t.badgeProxyBg },
    comparison: { color: t.sensitivityAccent, bg: t.badgeUserBg },
    engineering: { color: t.validationAccent, bg: t.badgeCalcBg },
  }
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 5 : 8,
      flexWrap: "wrap",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      padding: 0,
      boxShadow: "none",
    }}>
      {WORKFLOW_STAGE_ITEMS.map((item, index) => {
        const active = item.id === current || (current === "lca" && item.id === "comparison") || (current === "sensitivity" && item.id === "comparison") || (current === "validation" && item.id === "screening")
        const palette = stagePalette[item.id] || stagePalette.engineering
        return (
          <div key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 8, minWidth: 0 }}>
            {index > 0 && <span style={{ color: t.faint, fontSize: 14 }}>/</span>}
            <button
              type="button"
              onClick={() => onNavigate?.(item.target)}
              className="stage-breadcrumb-link stage-pill"
              data-active={active ? "true" : "false"}
              disabled={!onNavigate}
              title={lang === "zh" ? item.zh : item.label}
              style={{
                appearance: "none",
                border: active ? `1px solid ${palette.color}` : `1px solid transparent`,
                background: active ? palette.bg : "transparent",
                borderRadius: 999,
                padding: active ? "4px 10px" : "4px 3px",
                color: active ? palette.color : t.muted,
                fontSize: 12,
                fontWeight: active ? 850 : 650,
                fontFamily: FONT_SANS,
                cursor: onNavigate ? "pointer" : "default",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: active ? 900 : 750 }}>{item.stage.replace("Future ", "")}</span>
              {!isMobile && (
                <span style={{ marginLeft: 6, color: active ? t.textStrong : t.subtle }}>
                  {lang === "zh" ? item.zh : item.label}
                </span>
              )}
            </button>
            {active && !isMobile && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.color, flex: "0 0 auto" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StickySummaryBar({ inputs, results, stage, confidence, onAddComparison, canAddComparison = false }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const confidenceValue = confidence ?? (results && !results.unavailable ? Math.round(results.confidenceScore * 100) : null)
  const gas = getGasSystem(inputs?.gasSystem)
  const summaryItems = [
    [lang === "zh" ? "候选" : "Candidate", inputs?.mofName || `${inputs?.metalCenter || "—"} / ${inputs?.organicLinker || "—"}`],
    [lang === "zh" ? "气体体系" : "Gas system", gasLabel(gas?.label || inputs?.gasSystem || "—", lang)],
    [lang === "zh" ? "条件" : "Conditions", `${inputs?.temperature ?? "—"} K · ${inputs?.pressure ?? "—"} bar`],
    [lang === "zh" ? "结构" : "Structure", `${inputs?.organicLinker || "—"} · ${formatFunctionalGroupSummary(inputs, lang)}`],
  ]
  return (
    <div className="sticky-summary-bar" style={{
      position: "sticky",
      top: 58,
      zIndex: 12,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
      gap: 10,
      alignItems: "center",
      background: t.panel,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 8,
      padding: "9px 11px",
      boxShadow: t.shadowSm,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {summaryItems.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ color: t.faint, fontSize: 9, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
            <div style={{ color: t.textStrong, fontSize: 11, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: isMobile ? "flex-start" : "flex-end", flexWrap: "wrap" }}>
        <BasisBadge tone="info">{stage}</BasisBadge>
        <BasisBadge tone={confidenceValue == null ? "proxy" : confidenceValue >= 70 ? "calc" : "warn"}>
          {confidenceValue == null ? (lang === "zh" ? "未运行" : "Not run") : `${confidenceValue}% ${lang === "zh" ? "置信度" : "confidence"}`}
        </BasisBadge>
        {canAddComparison && (
          <button type="button" onClick={onAddComparison} style={{ ...toolbarBtn(t), padding: "5px 9px", fontSize: 11 }}>
            + {lang === "zh" ? "加入比较" : "Add to comparison"}
          </button>
        )}
      </div>
    </div>
  )
}

export function ResultLayer({ number, title, subtitle, children }) {
  const t = useT()
  return (
    <section className="result-layer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
        <span style={{ color: t.accentText, fontSize: 11, fontWeight: 900, fontFamily: FONT_MONO }}>{number}</span>
        <div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: 16, lineHeight: 1.25 }}>{title}</h2>
          {subtitle && <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.5, marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function MethodDrawer({ title, badge = "Screening proxy", children }) {
  const t = useT()
  return (
    <details className="motion-surface" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
      <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
        {title} <span style={{ marginLeft: 8 }}><BasisBadge tone="proxy">{badge}</BasisBadge></span>
      </summary>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
        {children}
      </div>
    </details>
  )
}

export function HowToRead({ children }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>
      <strong style={{ color: t.subtle }}>{lang === "zh" ? "如何阅读：" : "How to read: "}</strong>{children}
    </div>
  )
}

export function NextStepCTA({ label, body, actionLabel, onClick }) {
  const t = useT()
  return (
    <div className="content-card next-step-cta" style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", background: t.panel, border: `1px solid ${t.borderStrong}`, borderRadius: 10, padding: 14 }}>
      <div>
        <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850 }}>{label}</div>
        {body && <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 4 }}>{body}</div>}
      </div>
      <button type="button" className="btn-primary" onClick={onClick} style={{ ...toolbarBtn(t), background: t.accent, borderColor: t.accent, color: "#fff", padding: "8px 12px" }}>
        {actionLabel}
      </button>
    </div>
  )
}

export function CandidateComparisonPanel({ candidates, onRemove, onMove, focusId = "all" }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  if (!candidates?.length) {
    return (
      <div style={{ background: t.surface, border: `1px dashed ${t.borderStrong}`, borderRadius: 10, padding: 13, color: t.subtle, fontSize: 12, lineHeight: 1.55 }}>
        {lang === "zh"
          ? "还没有比较候选。先在 Screening 或比较页面运行结果，然后点击“加入比较”。建议保留 2-4 个候选。"
          : "No comparison candidates yet. Run a result in Screening or a comparison page, then click Add to comparison. Keep 2-4 candidates for a readable decision view."}
      </div>
    )
  }
  const visibleCandidates = focusId === "all" ? candidates : candidates.filter(item => item.id === focusId)
  return (
    <div className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <SectionTitle>{lang === "zh" ? "候选比较清单" : "Candidate comparison shortlist"}</SectionTitle>
        <BasisBadge tone="proxy">{visibleCandidates.length}/{candidates.length}</BasisBadge>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {(lang === "zh"
                ? ["候选", "性能", "选择性", "可行性", "LCA/LCC", "稳健性", "操作"]
                : ["Candidate", "Performance", "Selectivity", "Feasibility", "LCA/LCC", "Robustness", "Actions"]).map(head => (
                <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}` }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleCandidates.map((item) => {
              const sourceIndex = candidates.findIndex(candidate => candidate.id === item.id)
              return (
              <tr key={item.id} className="motion-table-row" style={{ background: focusId !== "all" && item.id === focusId ? t.badgeInfoBg : "transparent" }}>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
                  {item.name}<div style={{ color: t.faint, fontSize: 10, marginTop: 2 }}>{item.metal} · {item.linker} · {item.gasSystem}</div>
                </td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.performance} mmol/g</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.selectivity}</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}` }}>
                  <BasisBadge tone={item.feasibility === "High" ? "warn" : item.feasibility === "Medium" ? "proxy" : "calc"}>{item.feasibility}</BasisBadge>
                </td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>LCA {item.lca}/10 · ${item.lcc}/kg</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}`, color: t.muted, fontSize: 11 }}>{item.robustness}%</td>
                <td style={{ padding: "8px", borderBottom: `1px solid ${t.divider}` }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: isNarrow ? "wrap" : "nowrap" }}>
                    <button
                      type="button"
                      onClick={() => onMove?.(sourceIndex, -1)}
                      disabled={sourceIndex === 0}
                      title={sourceIndex === 0 ? (lang === "zh" ? "已在列表顶部。" : "Already at the top of the list.") : undefined}
                      style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10, opacity: sourceIndex === 0 ? 0.55 : 1, cursor: sourceIndex === 0 ? "not-allowed" : "pointer" }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove?.(sourceIndex, 1)}
                      disabled={sourceIndex === candidates.length - 1}
                      title={sourceIndex === candidates.length - 1 ? (lang === "zh" ? "已在列表底部。" : "Already at the bottom of the list.") : undefined}
                      style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10, opacity: sourceIndex === candidates.length - 1 ? 0.55 : 1, cursor: sourceIndex === candidates.length - 1 ? "not-allowed" : "pointer" }}
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => onRemove?.(item.id)} style={{ ...toolbarBtn(t), padding: "3px 7px", fontSize: 10 }}>
                      {lang === "zh" ? "移除" : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ProvenanceGrid({ items }) {
  const t = useT()
  const { lang } = useLang()
  const { isNarrow } = useViewport()
  return (
    <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`, gap: 10 }}>
      {items.map(item => (
        <div key={item.label} className="content-card provenance-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 7 }}>
            <span style={{ color: t.faint, fontSize: 10, textTransform: "uppercase" }}>{zhText(lang, item.label)}</span>
            {item.type && <SourceBadge type={item.type} />}
          </div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>{zhText(lang, item.value)}</div>
          {item.note && <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.45, marginTop: 5 }}>{zhText(lang, item.note)}</div>}
        </div>
      ))}
    </div>
  )
}

export function ResultProvenanceDrawer({ results, inputs }) {
  const t = useT()
  const { lang } = useLang()
  if (!results) return null
  const rows = [
    {
      output: lang === "zh" ? "吸附量" : "Uptake",
      basis: lang === "zh" ? "结构描述符 + 筛选模型" : "Descriptor input + screening model",
      source: lang === "zh" ? "模型预测" : "Model-predicted",
      flag: lang === "zh" ? "中等" : "Medium",
      limitation: lang === "zh" ? "需实验等温线或 GCMC 确认绝对值" : "Absolute values need experimental isotherms or GCMC confirmation",
      stage: "Stage 1",
    },
    {
      output: lang === "zh" ? "选择性" : "Selectivity",
      basis: lang === "zh" ? "表观吸附量比值" : "Apparent uptake ratio",
      source: lang === "zh" ? "筛选代理" : "Screening proxy",
      flag: lang === "zh" ? "假设依赖" : "Assumption-dependent",
      limitation: lang === "zh" ? "不是严格 Henry 或 IAST 混合气平衡计算" : "Not strict Henry or IAST mixture-equilibrium selectivity",
      stage: "Stage 1",
    },
    {
      output: "Qst",
      basis: lang === "zh" ? "预测多温等温线反推" : "Derived from predicted multi-temperature isotherms",
      source: lang === "zh" ? "筛选代理" : "Screening proxy",
      flag: lang === "zh" ? "探索性" : "Exploratory",
      limitation: lang === "zh" ? "不是量热实测或研究级多温拟合" : "Not calorimetry or research-grade multi-T fitting",
      stage: "Stage 1",
    },
    {
      output: lang === "zh" ? "可行性" : "Feasibility",
      basis: lang === "zh" ? "连接体、金属、成本带和规模摩擦" : "Linker, metal, cost band, and scale-friction cues",
      source: lang === "zh" ? "用户输入 + 代理规则" : "User-defined + proxy rules",
      flag: lang === "zh" ? "粗边界" : "Coarse boundary",
      limitation: lang === "zh" ? "不等同于正式生命周期成本" : "Not formal lifecycle costing",
      stage: "Stage 2",
    },
    {
      output: "LCA / LCC",
      basis: lang === "zh" ? "代理清单与入围候选比较" : "Proxy inventory and shortlist comparison",
      source: lang === "zh" ? "假设依赖" : "Assumption-dependent",
      flag: lang === "zh" ? "比较性" : "Comparative",
      limitation: lang === "zh" ? "不是工程级 LCA/LCC 或供应商报价" : "Not engineering-grade LCA/LCC or supplier quotes",
      stage: "Stage 3",
    },
  ]
  return (
    <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 11 }}>
      <summary style={{ cursor: "pointer", color: t.textStrong, fontSize: 12, fontWeight: 800 }}>
        {lang === "zh" ? "结果级来源与适用范围" : "Result-level provenance and scope"}
      </summary>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, margin: "8px 0 10px" }}>
        {lang === "zh"
          ? `当前输入的官能团：${formatFunctionalGroupSummary(inputs, lang)}。这些标签说明结果如何解释，而不是替代原始数据审计。`
          : `Functional groups in this run: ${formatFunctionalGroupSummary(inputs, lang)}. These labels explain intended interpretation; they do not replace raw data audit trails.`}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr>
              {(lang === "zh" ? ["输出", "依据", "来源类型", "质量标记", "限制", "使用阶段"] : ["Output", "Basis", "Source type", "Quality flag", "Limitation", "Use stage"]).map(head => (
                <th key={head} style={{ textAlign: "left", color: t.faint, fontSize: 10, padding: "7px 8px", borderBottom: `1px solid ${t.border}` }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.output}>
                <td style={{ color: t.textStrong, fontSize: 11, fontWeight: 800, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.output}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.basis}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.source}</td>
                <td style={{ color: t.warn, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.flag}</td>
                <td style={{ color: t.subtle, fontSize: 11, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.limitation}</td>
                <td style={{ color: t.accentText, fontSize: 11, fontFamily: FONT_MONO, padding: "8px", borderBottom: `1px solid ${t.divider}` }}>{row.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function InfoTip({ text }) {
  const t = useT()
  return (
    <span title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 16, height: 16, borderRadius: "50%", border: `1px solid ${t.borderStrong}`,
      color: t.accentText, fontSize: 11, fontWeight: 800, marginLeft: 6, cursor: "help" }}>
      i
    </span>
  )
}

export function Callout({ tone = "info", children }) {
  const t = useT()
  const palette = {
    info: { bg: t.badgeInfoBg, border: t.accent, color: t.badgeInfoText },
    note: { bg: t.surface, border: t.border, color: t.subtle },
    warn: { bg: t.badgeWarnBg, border: t.warn, color: t.badgeWarnText },
    danger:{ bg: t.badgeDangerBg, border: t.danger, color: t.badgeDangerText },
    success:{ bg: t.badgeCalcBg, border: t.lcaAccent, color: t.badgeCalcText },
  }[tone]
  return (
    <div style={{ background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 8,
      padding: "10px 14px", color: palette.color, fontSize: 12, lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

export function LinkerSubstitutionPreview({ inputs, linker }) {
  const t = useT()
  const { lang } = useLang()
  const entries = getFunctionalGroupEntries(inputs)
  const positions = {
    "1": { x: 185, y: 100 },
    "2": { x: 150, y: 40 },
    "3": { x: 80, y: 40 },
    "4": { x: 45, y: 100 },
    "5": { x: 80, y: 160 },
    "6": { x: 150, y: 160 },
  }
  const ringPoints = ["1", "2", "3", "4", "5", "6"].map(pos => `${positions[pos].x},${positions[pos].y}`).join(" ")
  const groupByPosition = entries.reduce((acc, { meta, detail }) => {
    for (const pos of detail.positions || []) {
      acc[pos] = [...(acc[pos] || []), meta.label.replace(/\s*\(.+\)$/, "")]
    }
    return acc
  }, {})
  const linkerAnchors = linker?.value === "BTC"
    ? ["1", "3", "5"]
    : linker?.connectivity === 4
      ? ["1", "2", "4", "5"]
      : ["1", "4"]
  const isBenzeneLike = ["BDC", "NH2-BDC", "NO2-BDC", "Br-BDC", "DOBDC", "BTC", "BPDC", "NDC", "BTB", "ADC"].includes(linker?.value)
    || String(linker?.category || "").toLowerCase().includes("carboxylate")

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
            {lang === "zh" ? "取代构型示意" : "Substitution sketch"}
          </div>
          <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.45 }}>
            {isBenzeneLike
              ? (lang === "zh" ? "简化芳环编号：1/4 为连接位，2/3/5/6 为可标注取代位。" : "Simplified aromatic numbering: 1/4 anchors, 2/3/5/6 substituent positions.")
              : (lang === "zh" ? "当前连接体不是标准苯二甲酸示意，以下仅作位置草图。" : "Current linker is not a standard BDC ring; this is a positional sketch only.")}
          </div>
        </div>
        <BasisBadge tone="user">{lang === "zh" ? "草图" : "sketch"}</BasisBadge>
      </div>
      <svg viewBox="0 0 230 220" width="100%" height="220" role="img" aria-label="Functional group substitution preview">
        <rect x="0" y="0" width="230" height="220" rx="10" fill={t.panel} stroke={t.border} />
        <polygon points={ringPoints} fill="none" stroke={t.textStrong} strokeWidth="3" />
        <line x1="60" y1="88" x2="92" y2="34" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="138" y1="34" x2="170" y2="88" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="170" y1="112" x2="138" y2="166" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        <line x1="92" y1="166" x2="60" y2="112" stroke={t.subtle} strokeWidth="1.5" opacity="0.45" />
        {Object.entries(positions).map(([pos, point]) => {
          const anchor = linkerAnchors.includes(pos)
          const groups = groupByPosition[pos] || []
          const labelOffset = {
            "1": { x: 18, y: 4, anchor: "start" },
            "2": { x: 0, y: -18, anchor: "middle" },
            "3": { x: 0, y: -18, anchor: "middle" },
            "4": { x: -18, y: 4, anchor: "end" },
            "5": { x: 0, y: 24, anchor: "middle" },
            "6": { x: 0, y: 24, anchor: "middle" },
          }[pos]
          return (
            <g key={pos}>
              <circle cx={point.x} cy={point.y} r={anchor ? 14 : groups.length ? 13 : 10}
                fill={groups.length ? t.badgeInfoBg : anchor ? t.badgeCalcBg : t.bg}
                stroke={groups.length ? t.accent : anchor ? t.validationAccent : t.borderStrong}
                strokeWidth={groups.length ? 2.5 : 1.5} />
              <text x={point.x} y={point.y + 4} textAnchor="middle" fill={anchor ? t.textStrong : t.subtle}
                fontSize="12" fontFamily={FONT_MONO} fontWeight="800">{pos}</text>
              {anchor && (
                <text x={point.x + labelOffset.x} y={point.y + labelOffset.y} textAnchor={labelOffset.anchor}
                  fill={t.validationAccent} fontSize="11" fontFamily={FONT_MONO} fontWeight="800">COOH</text>
              )}
              {groups.length > 0 && (
                <g>
                  <line x1={point.x} y1={point.y} x2={point.x + labelOffset.x * 1.55} y2={point.y + labelOffset.y * 1.55}
                    stroke={t.accent} strokeWidth="1.6" />
                  <text x={point.x + labelOffset.x * 1.95} y={point.y + labelOffset.y * 1.95}
                    textAnchor={labelOffset.anchor} fill={t.accentText} fontSize="11" fontFamily={FONT_MONO} fontWeight="850">
                    {groups.join(",")}
                  </text>
                </g>
              )}
            </g>
          )
        })}
        <text x="115" y="202" textAnchor="middle" fill={t.faint} fontSize="10" fontFamily={FONT_SANS}>
          {lang === "zh" ? "仅为结构草图 · 不代表合成验证" : "Structural sketch only · not synthesis validation"}
        </text>
      </svg>
      <div style={{ color: t.subtle, fontSize: 10, lineHeight: 1.55, marginTop: 8 }}>
        {lang === "zh"
          ? `当前标注：${formatFunctionalGroupSummary(inputs, lang)}。这张图只表达你输入的取代位置，不检查真实合成可行性或配位构型。`
          : `Current annotation: ${formatFunctionalGroupSummary(inputs, lang)}. This visualizes entered positions only; it does not validate synthesis feasibility or coordination geometry.`}
      </div>
    </div>
  )
}

export function WindRoseChart({ data }) {
  const t = useT()
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const innerRadius = 22
  const maxRadius = 88
  const maxValue = 5
  const sector = 360 / data.length
  const toPoint = (radius, angle) => {
    const rad = (angle - 90) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  const pathFor = (start, end, radius) => {
    const p1 = toPoint(innerRadius, start)
    const p2 = toPoint(radius, start)
    const p3 = toPoint(radius, end)
    const p4 = toPoint(innerRadius, end)
    const largeArc = end - start > 180 ? 1 : 0
    return [
      `M ${p1.x} ${p1.y}`,
      `L ${p2.x} ${p2.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${p3.x} ${p3.y}`,
      `L ${p4.x} ${p4.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${p1.x} ${p1.y}`,
      "Z",
    ].join(" ")
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="240" role="img" aria-label="Normalized wind rose chart">
      {[1, 3, 5].map(level => (
        <circle key={level} cx={cx} cy={cy} r={innerRadius + (level / maxValue) * maxRadius}
          fill="none" stroke={t.border} strokeDasharray={level === 5 ? "none" : "3 4"} />
      ))}
      {data.map((item, index) => {
        const start = index * sector - sector / 2
        const end = start + sector * 0.76
        const radius = innerRadius + (Math.min(maxValue, item.value) / maxValue) * maxRadius
        const labelPoint = toPoint(maxRadius + 38, index * sector)
        const valuePoint = toPoint(radius + 11, index * sector)
        const axisPoint = toPoint(maxRadius + 18, index * sector)
        const textAnchor = Math.abs(labelPoint.x - cx) < 8 ? "middle" : labelPoint.x > cx ? "start" : "end"
        return (
          <g key={item.name}>
            <line x1={cx} y1={cy} x2={axisPoint.x} y2={axisPoint.y} stroke={t.divider} strokeWidth="1" />
            <path d={pathFor(start, end, radius)} fill={item.fill} fillOpacity="0.68" stroke={item.fill} strokeWidth="1.5" />
            <text x={labelPoint.x} y={labelPoint.y} textAnchor={textAnchor} dominantBaseline="middle"
              fill={t.subtle} fontSize="10" fontFamily={FONT_SANS}>{item.name}</text>
            <text x={valuePoint.x} y={valuePoint.y} textAnchor="middle" dominantBaseline="middle"
              fill={t.textStrong} fontSize="9" fontFamily={FONT_MONO}>{item.value.toFixed(1)}</text>
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={innerRadius} fill={t.panel} stroke={t.border} />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={t.textStrong} fontSize="11" fontWeight="700" fontFamily={FONT_SANS}>0-5</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={t.faint} fontSize="9" fontFamily={FONT_SANS}>index</text>
    </svg>
  )
}

// Re-export SectionTitle here since it's used by CandidateComparisonPanel above
export function SectionTitle({ children }) {
  const t = useT()
  return <div style={{ color: t.subtle, fontSize: 12, fontWeight: 700, letterSpacing: 0, marginBottom: 14 }}>{children}</div>
}

/**
 * safeVal — gracefully display possibly-null real-seed fields.
 * Returns a localised fallback string instead of null/undefined/NaN.
 */
export function safeVal(value, lang, fallback) {
  if (value === null || value === undefined || value === "" || (typeof value === "number" && !Number.isFinite(value))) {
    if (fallback) return fallback
    return lang === "zh" ? "暂无数据" : "Not available"
  }
  if (typeof value === "string" && value.toLowerCase() === "pending") {
    return lang === "zh" ? "待整理" : "Pending curation"
  }
  if (typeof value === "string" && value.toLowerCase() === "unknown") {
    return lang === "zh" ? "未知" : "Unknown"
  }
  return value
}

/**
 * DataModeToggle — compact pill toggle for the active candidate data route.
 * Emits the selected option id.
 */
export function DataModeToggle({ value, onChange, lang, options: customOptions }) {
  const t = useT()
  const options = customOptions || [
    { id: "open-mof-seed", label: lang === "zh" ? "Open MOF Seed" : "Open MOF Seed" },
  ]
  return (
    <div style={{ display: "inline-flex", gap: 4, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 4 }}>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          style={{
            padding: "6px 13px",
            fontSize: 11,
            fontWeight: value === opt.id ? 800 : 500,
            borderRadius: 6,
            border: value === opt.id ? `1px solid ${t.borderStrong}` : "1px solid transparent",
            background: value === opt.id ? t.panel : "transparent",
            color: value === opt.id ? t.accentText : t.subtle,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Field-level Provenance ────────────────────────────────────────────────────

/**
 * FieldSourcePanel — popover (desktop) / bottom-sheet (mobile) for field-level provenance.
 */
function FieldSourcePanel({ fieldLabel, source, lang, t, anchorRef, isMobile, onClose }) {
  const panelRef = useRef(null)

  const isPending = !source || ["pending", "missing", "pending_provenance"].includes(source.sourceType)
  const sourceDatabase = source?.sourceDatabase || source?.database || source?.sourceName
  const sourceRecordId = source?.sourceRecordId || source?.recordId
  const sourceVersion = source?.sourceVersion || source?.version
  const sourceUrl = source?.sourceUrl || source?.url
  const rows = isPending ? [] : [
    sourceDatabase       && ["sourceDatabase", lang === "zh" ? "来源数据库" : "Source database", sourceDatabase],
    sourceRecordId       && ["sourceRecordId", lang === "zh" ? "原始记录" : "Source record", sourceRecordId],
    sourceVersion        && ["sourceVersion", lang === "zh" ? "来源版本" : "Source version", sourceVersion],
    sourceUrl            && ["sourceUrl", lang === "zh" ? "来源链接" : "Source URL", sourceUrl],
    source.citation      && ["citation", lang === "zh" ? "引用" : "Citation", source.citation],
    source.license       && ["license", lang === "zh" ? "许可证" : "License", source.license],
    source.condition     && ["condition",     lang === "zh" ? "测量条件"    : "Measurement condition",   source.condition],
    source.evidenceLevel && ["evidenceLevel", lang === "zh" ? "证据等级"    : "Evidence level",          source.evidenceLevel],
    source.curationStatus && ["curationStatus", lang === "zh" ? "整理状态" : "Curation status", source.curationStatus],
    source.curationNote  && ["curationNote",  lang === "zh" ? "整理说明"    : "Curation note",           source.curationNote],
    source.limitations && source.limitations !== "" && ["limitations", lang === "zh" ? "限制" : "Limitations", source.limitations],
  ].filter(Boolean)

  return (
    <AnchoredFieldProvenancePanel
      open
      anchorRef={anchorRef}
      panelRef={panelRef}
      isMobile={isMobile}
      onClose={onClose}
      ariaLabel={lang === "zh" ? "字段级溯源" : "Field-level provenance"}
      style={{
        background: t.panel || t.bg,
        border: `1px solid ${t.borderStrong || t.border}`,
        padding: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        fontFamily: FONT_SANS,
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ color: t.faint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
              {lang === "zh" ? "字段来源" : "Field provenance"}
            </div>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 850 }}>
              {lang === "zh" ? "字段：" : "Field: "}{fieldLabel}
            </div>
            {source && source.value !== null && source.value !== undefined && (
              <div style={{ color: t.accentText, fontSize: 11, marginTop: 2 }}>
                {lang === "zh" ? "当前值：" : "Current value: "}{source.value}{source.unit ? ` ${source.unit}` : ""}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={lang === "zh" ? "关闭字段来源" : "Close field provenance"}
            style={{ background: "transparent", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer", padding: "2px 6px", lineHeight: 1, flexShrink: 0 }}>
            ✕
          </button>
        </div>
        {isPending ? (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "11px 13px", color: t.muted, fontSize: 12, lineHeight: 1.65 }}>
            {lang === "zh"
              ? "待整理。该字段尚未关联已核实的数据来源。"
              : "Pending curation. This field does not have a verified source record yet."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rows.map(([key, label, value]) => (
              <div key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: "7px 10px" }}>
                <div style={{ color: t.faint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                <div style={{ color: t.textStrong, fontSize: 12, lineHeight: 1.5, wordBreak: "break-all" }}>
                  {key === "sourceUrl" ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" aria-label={lang === "zh" ? "在新标签页打开字段来源链接" : "Open field source link in a new tab"} style={{ color: t.accentText, overflowWrap: "anywhere" }}>
                      {value}
                    </a>
                  ) : value}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, color: t.faint, fontSize: 10, lineHeight: 1.5, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 10 }}>
          {source?.sourceType === "open-mof-seed"
            ? (lang === "zh"
              ? "Open MOF Seed 是 EcoMOF-AI 的多源数据层，不是原始数据库名称。该字段的原始来源见上方来源数据库。"
              : "Open MOF Seed is EcoMOF-AI's multi-source data layer, not the original database name. The original source is shown above as source database.")
            : (lang === "zh"
              ? "字段级数据溯源说明数据框架，不替代手动数据核实和实验验证。"
              : "Field-level provenance describes the data framework and does not replace manual data verification.")}
        </div>
      </div>
    </AnchoredFieldProvenancePanel>
  )
}

/**
 * FieldProvenanceButton — ⓘ icon opening a popover/bottom-sheet for field provenance.
 * Renders nothing if `source` is undefined (demo data without fieldSources).
 */
export function FieldProvenanceButton({ fieldKey, fieldLabel, source, lang }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const t = useT()
  const { isMobile } = useViewport()

  if (source === undefined) return null

  const isPending = !source || ["pending", "missing", "pending_provenance"].includes(source.sourceType)

  const handleOpen = (e) => {
    e.stopPropagation()
    setOpen(prev => !prev)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        title={lang === "zh" ? "查看来源" : "View source"}
        aria-label={lang === "zh" ? `查看 ${fieldLabel} 字段来源` : `View field provenance for ${fieldLabel}`}
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 16, height: 16, borderRadius: "50%",
          border: `1px solid ${isPending ? t.faint : t.accent}`,
          background: "transparent",
          color: isPending ? t.faint : t.accentText,
          fontSize: 10, fontWeight: 900, cursor: "pointer", padding: 0,
          marginLeft: 5, flexShrink: 0, lineHeight: 1,
          verticalAlign: "middle",
        }}
      >
        ⓘ
      </button>
      {open && (
        <FieldSourcePanel
          fieldLabel={fieldLabel}
          source={source}
          lang={lang}
          t={t}
          anchorRef={btnRef}
          isMobile={isMobile}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

/**
 * RealSeedCallout — fixed-wording disclosure required in Real Seed Dataset mode.
 */
export function RealSeedCallout({ lang }) {
  const t = useT()
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
      color: t.subtle,
      lineHeight: 1.65,
      boxShadow: `inset 3px 0 0 0 ${t.accentSoft || t.border}`,
    }}>
      {lang === "zh"
        ? "真实种子数据集是真实数据接入框架。待补充字段仍在复核中，后续可能更新。"
        : "Real Seed Dataset is a framework for curated real-data ingestion. Pending fields are under review and may change."}
    </div>
  )
}

/**
 * DemoModeBanner — lightweight notice bar shown when Demo Dataset is active.
 * Not a watermark. Does not block content.
 */
export function DemoModeBanner({ lang }) {
  const t = useT()
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: t.badgeProxyBg || "rgba(167,139,250,0.12)",
        border: `1px solid ${t.badgeProxyText || "#7c3aed"}`,
        borderRadius: 6,
        padding: "7px 14px",
        fontSize: 11,
        fontWeight: 750,
        color: t.badgeProxyText || "#7c3aed",
        lineHeight: 1.4,
      }}
    >
      <span style={{ opacity: 0.7 }}>◈</span>
      {lang === "zh"
        ? "演示数据集 · 不用于科研结论"
        : "Demo Dataset Only · Not for scientific interpretation"}
    </div>
  )
}

/**
 * DataModeNote — description shown near DataModeToggle explaining mode semantics.
 */
export function DataModeNote({ lang }) {
  const t = useT()
  const items = lang === "zh" ? [
    "Open MOF Seed 是主候选数据路线",
    "可信度通过字段级来源、证据等级和整理状态表达",
    "待补充字段仍在复核中，后续可能更新",
    "示例数据只保留在隔离的演示页面",
  ] : [
    "Open MOF Seed is the main candidate data route",
    "Trust is expressed by field provenance, evidence level, and curation status",
    "Pending fields are under review and may change",
    "Example data stays in isolated demo surfaces",
  ]
  return (
    <ul style={{ margin: "4px 0 0", padding: "0 0 0 14px", color: t.faint, fontSize: 11, lineHeight: 1.7 }}>
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  )
}

/**
 * EvidenceLevelLegend — compact legend explaining what each evidence level means.
 * Does not change evidence level data; only explains existing states.
 */
export function EvidenceLevelLegend({ lang }) {
  const t = useT()
  const zh = lang === "zh"
  const levels = zh ? [
    { level: "High",    tone: "calc",  desc: "已有来源，并包含必要条件或单位的整理字段" },
    { level: "Medium",  tone: "info",  desc: "已有数值，但条件或来源细节仍需复核" },
    { level: "Low",     tone: "proxy", desc: "初步记录或不完整记录" },
    { level: "Pending", tone: "warn",  desc: "尚未整理" },
  ] : [
    { level: "High",    tone: "calc",  desc: "Curated value with source and condition where applicable" },
    { level: "Medium",  tone: "info",  desc: "Value available but condition or source detail may require review" },
    { level: "Low",     tone: "proxy", desc: "Preliminary or incomplete record" },
    { level: "Pending", tone: "warn",  desc: "Not yet curated" },
  ]
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>
        {zh ? "证据等级说明 / Evidence Level" : "Evidence Level"}
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {levels.map(({ level, tone, desc }) => (
          <div key={level} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <BasisBadge tone={tone}>{level}</BasisBadge>
            <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.6 }}>{desc}</span>
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5, marginTop: 10, borderTop: `1px solid ${t.divider || t.border}`, paddingTop: 8 }}>
        {zh
          ? "证据等级说明当前数据状态，不代表已完全验证。High 不等于实验验证完成。"
          : "Evidence levels describe the current data state, not full validation. High does not mean experimentally verified."}
      </div>
    </div>
  )
}
