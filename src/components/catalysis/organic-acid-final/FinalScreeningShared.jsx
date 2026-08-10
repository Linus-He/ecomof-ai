// @ts-nocheck
import { useRef, useState } from "react"
import { AnchoredFieldProvenancePanel } from "../../common/FieldProvenanceButton"
import { ChemicalText } from "../../../shared"
import { X } from "@phosphor-icons/react"

export const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function displayValue(value, fallback = "Pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  if (Array.isArray(value)) return value.length ? value.map(item => displayValue(item, "")).filter(Boolean).join(", ") : fallback
  const rendered = String(value)
  if (!rendered || ["undefined", "null", "NaN"].includes(rendered)) return fallback
  return rendered
}

export function formatScore(value, fallback = "Pending") {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return numeric.toFixed(3)
}

export function formatPercent(value, fallback = "Pending") {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return `${Math.round(numeric * 100)}%`
}

export function statusTone(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("pass") || value.includes("robust") || value.includes("eligible")) return "pass"
  if (value.includes("review") || value.includes("pending") || value.includes("hypothesis")) return "warn"
  if (value.includes("fail") || value.includes("reject")) return "fail"
  return "info"
}

export function StatusBadge({ children, tone = "info", t }) {
  const palette = {
    pass: [t.badgeGoodBg || t.badgeInfoBg, t.good || "#0f8a5f"],
    warn: [t.badgeWarnBg, t.warn],
    fail: [t.badgeDangerBg || t.badgeWarnBg, t.danger || t.warn],
    proxy: [t.badgeInfoBg, t.accentText],
    info: [t.badgeInfoBg, t.accentText],
  }[tone] || [t.badgeInfoBg, t.accentText]
  return (
    <span style={{ alignItems: "center", background: palette[0], border: `1px solid ${palette[1]}`, borderRadius: 6, color: palette[1], display: "inline-flex", fontSize: 10.5, fontWeight: 900, lineHeight: 1.1, padding: "5px 8px", textTransform: "uppercase" }}>
      <ChemicalText value={displayValue(children)} />
    </span>
  )
}

export function Panel({ id, eyebrow, title, children, t, actions, style }) {
  return (
    <section id={id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, minWidth: 0, padding: 15, scrollMarginTop: 118, ...style }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          {eyebrow ? <div style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}><ChemicalText value={eyebrow} /></div> : null}
          <h2 style={{ color: t.textStrong, fontSize: 20, lineHeight: 1.18, margin: 0 }}><ChemicalText value={title} /></h2>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function MiniMetric({ label, value, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 5, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}><ChemicalText value={displayValue(value)} /></strong>
    </article>
  )
}

function sourceTypeText(source, lang) {
  const sourceType = source?.sourceType || "pending_provenance"
  if (["pending", "missing", "pending_provenance"].includes(sourceType)) {
    return text(lang, "Pending provenance", "Pending provenance")
  }
  return sourceType
}

export function ProvenanceButton({ record, field, label, value, lang = "en", t, source }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const fieldSource = source || record?.fieldSources?.[field] || {
    sourceType: "pending_provenance",
    sourceDatabase: record?.sourceDatabase || "Pending provenance",
    sourceRecordId: record?.sourceRecordId || "Pending provenance",
    curationStatus: "demo / needs review",
    confidence: record?.waterStability?.confidence_score,
    note: "Pending provenance placeholder reserved for field-level source curation.",
  }

  const rows = [
    [text(lang, "字段", "Field"), label || field],
    [text(lang, "当前值", "Current value"), value],
    [text(lang, "来源类型", "Source type"), sourceTypeText(fieldSource, lang)],
    [text(lang, "来源数据库", "Source database"), fieldSource.sourceDatabase || record?.sourceDatabase],
    [text(lang, "来源记录ID", "Source record id"), fieldSource.sourceRecordId || record?.sourceRecordId],
    [text(lang, "整理状态", "Curation status"), fieldSource.curationStatus],
    [text(lang, "置信度", "Confidence"), fieldSource.confidence == null ? "Pending" : formatPercent(fieldSource.confidence)],
    ["DOI / URL", fieldSource.doi || fieldSource.sourceDoi || fieldSource.sourceUrl || "evidence pending"],
    [text(lang, "说明", "Note"), fieldSource.note],
  ]

  return (
    <span style={{ display: "inline-flex", position: "relative", verticalAlign: "middle" }} onClick={event => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={text(lang, `查看 ${label || field} 字段级溯源`, `View field-level provenance for ${label || field}`)}
        title={text(lang, "字段级溯源", "Field-level provenance")}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 900, height: 22, justifyContent: "center", marginLeft: 5, width: 22 }}
      >
        i
      </button>
      {open ? (
        <AnchoredFieldProvenancePanel
          open
          anchorRef={buttonRef}
          panelRef={panelRef}
          isMobile={typeof window !== "undefined" ? window.innerWidth < 620 : false}
          onClose={() => setOpen(false)}
          ariaLabel={text(lang, "字段级溯源", "Field-level provenance")}
          width={360}
          maxHeight={420}
          style={{ background: t.tooltipBg || t.panel, border: `1px solid ${t.borderStrong || t.border}`, boxShadow: t.shadowLg || t.shadowMd, color: t.muted, padding: 12 }}
        >
          <div style={{ alignItems: "center", background: t.tooltipBg || t.panel, borderBottom: `1px solid ${t.border}`, display: "flex", gap: 10, justifyContent: "space-between", margin: "-12px -12px 8px", padding: "11px 12px 9px", position: "sticky", top: -12, zIndex: 2 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "字段级溯源", "Field-level provenance")}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={text(lang, "关闭", "Close")} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.subtle, cursor: "pointer", display: "inline-flex", height: 32, justifyContent: "center", padding: 0, width: 32 }}><X aria-hidden="true" size={16} weight="bold" /></button>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(([name, rowValue]) => (
              <div key={name} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
                <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{name}</span>
                <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.42, overflowWrap: "anywhere" }}><ChemicalText value={displayValue(rowValue, "Pending provenance")} /></span>
              </div>
            ))}
          </div>
        </AnchoredFieldProvenancePanel>
      ) : null}
    </span>
  )
}

export function ValueWithSource({ record, field, label, value, lang, t, fallback = "Pending", source }) {
  const rendered = displayValue(value, fallback)
  return (
    <span style={{ alignItems: "center", display: "inline-flex", gap: 2, minWidth: 0 }}>
      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><ChemicalText value={rendered} /></span>
      <ProvenanceButton record={record} source={source} field={field} label={label} value={rendered} lang={lang} t={t} />
    </span>
  )
}

export function methodologyHref() {
  return "#methodology-organic-acid-final-screening"
}

export function evidenceLayerHref() {
  return "#methodology-oafs-evidence-matrix"
}

export function MethodologyLink({ lang, t }) {
  return (
    <a
      href={methodologyHref()}
      style={{ alignItems: "center", background: t.accent, border: `1px solid ${t.accent}`, borderRadius: 8, color: t.buttonText || "#fff", display: "inline-flex", fontSize: 12, fontWeight: 900, justifyContent: "center", minHeight: 34, padding: "7px 11px", textDecoration: "none" }}
    >
      {text(lang, "查看完整方法论", "View full methodology")}
    </a>
  )
}

export function EvidenceLayerLink({ lang, t }) {
  return (
    <a
      href={evidenceLayerHref()}
      style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.accentText || t.accent}`, borderRadius: 8, color: t.accentText, display: "inline-flex", fontSize: 12, fontWeight: 900, justifyContent: "center", minHeight: 34, padding: "7px 11px", textDecoration: "none" }}
    >
      {text(lang, "查看证据层", "View evidence layer")}
    </a>
  )
}
