// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import { ChemicalText, formatPercent } from "../../shared"
import { getFieldSource, getRecordProvenance } from "./gasDataSchema"
import { metricLabel, text } from "./gasViewUtils"

function display(value) {
  if (value === null || value === undefined || value === "") return "pending"
  return Array.isArray(value) ? value.join(", ") : String(value)
}

export function GasFieldProvenanceButton({ record, field, currentValue, unit, lang = "en", t, label }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0, mobile: false })
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const source = getFieldSource(record, field)
  const provenance = getRecordProvenance(record)
  const fieldLabel = label || metricLabel(field, lang)

  useEffect(() => {
    if (!open) return undefined
    const onKey = event => {
      if (event.key === "Escape") setOpen(false)
    }
    const onPointer = event => {
      if (panelRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return
      setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onPointer)
    }
  }, [open])

  const toggle = event => {
    event.stopPropagation()
    const rect = buttonRef.current?.getBoundingClientRect()
    const mobile = window.innerWidth < 620
    setPosition({
      mobile,
      left: rect ? Math.min(window.innerWidth - 340, Math.max(12, rect.left)) : 12,
      top: rect ? Math.min(window.innerHeight - 360, rect.bottom + 8) : 80,
    })
    setOpen(prev => !prev)
  }

  const rows = [
    [text(lang, "字段", "Field"), fieldLabel],
    [text(lang, "当前值", "Current value"), currentValue],
    [text(lang, "原始值", "Original value"), source.originalValue],
    [text(lang, "单位", "Unit"), unit || source.normalizedUnit || "dimensionless"],
    [text(lang, "来源类型", "Source type"), source.sourceType],
    [text(lang, "引用", "Citation"), source.citation],
    ["DOI / URL", source.doi || source.sourceUrl || "pending"],
    [text(lang, "来源记录ID", "Source record id"), provenance.sourceRecordId],
    [text(lang, "表格/图/页码", "Table / figure / page"), [source.tableOrFigure, source.page].filter(Boolean).join(" · ") || "pending"],
    [text(lang, "整理状态", "Curation status"), source.curationStatus],
    [text(lang, "置信度", "Confidence"), source.confidence == null ? "pending" : formatPercent(source.confidence, { lang, normalized: true })],
    [text(lang, "单位换算说明", "Conversion note"), source.unitConversion],
    [text(lang, "限制说明", "Limitation"), source.note],
  ]

  return (
    <span style={{ display: "inline-flex", position: "relative", verticalAlign: "middle" }} onClick={event => event.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={text(lang, `查看 ${fieldLabel} 字段级溯源`, `View field-level provenance for ${fieldLabel}`)}
        title={text(lang, `查看 ${fieldLabel} 字段级溯源`, `View field-level provenance for ${fieldLabel}`)}
        onClick={toggle}
        style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 900, height: 22, justifyContent: "center", marginLeft: 5, width: 22 }}
      >
        ⓘ
      </button>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={text(lang, "字段级溯源", "Field-level provenance")}
          style={{
            background: t.tooltipBg || t.panel,
            border: `1px solid ${t.borderStrong || t.border}`,
            borderRadius: position.mobile ? "14px 14px 0 0" : 10,
            bottom: position.mobile ? 0 : "auto",
            boxShadow: t.shadowLg || t.shadowMd,
            color: t.muted,
            left: position.mobile ? 0 : position.left,
            maxHeight: position.mobile ? "72vh" : 360,
            overflowY: "auto",
            padding: 12,
            position: "fixed",
            right: position.mobile ? 0 : "auto",
            top: position.mobile ? "auto" : position.top,
            width: position.mobile ? "auto" : 330,
            zIndex: 120,
          }}
        >
          <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", marginBottom: 8 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "字段级溯源", "Field-level provenance")}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={text(lang, "关闭字段级溯源", "Close field-level provenance")} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.subtle, cursor: "pointer", minHeight: 32, padding: "4px 8px" }}>Esc</button>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(([name, value]) => (
              <div key={name} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
                <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{name}</span>
                {name === "DOI / URL" && source.sourceUrl ? (
                  <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={text(lang, "在新标签页打开来源链接", "Open source link in a new tab")} style={{ color: t.accentText, fontSize: 11.5, overflowWrap: "anywhere" }}>
                    <ChemicalText value={display(value)} />
                  </a>
                ) : (
                  <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.42, overflowWrap: "anywhere" }}><ChemicalText value={display(value)} /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </span>
  )
}
