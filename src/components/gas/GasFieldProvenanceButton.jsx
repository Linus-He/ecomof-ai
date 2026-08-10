// @ts-nocheck
import { useRef, useState } from "react"
import { ChemicalText, formatPercent } from "../../shared"
import { AnchoredFieldProvenancePanel } from "../common/FieldProvenanceButton"
import { getFieldSource, getRecordProvenance } from "./gasDataSchema"
import { metricLabel, text } from "./gasViewUtils"
import { X } from "@phosphor-icons/react"

function display(value, fallback = "pending") {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value === "number" && !Number.isFinite(value)) return fallback
  if (Array.isArray(value)) return value.length ? value.map(item => display(item, "")).filter(Boolean).join(", ") : fallback
  const textValue = String(value)
  if (!textValue || ["undefined", "null", "NaN"].includes(textValue)) return fallback
  return textValue
}

function sourceTypeText(sourceType, lang) {
  if (!sourceType || ["missing", "pending", "pending_provenance"].includes(sourceType)) {
    return text(lang, "待补充溯源", "Pending provenance")
  }
  return sourceType
}

function linkForSource(source = {}) {
  if (source.doi) {
    const doi = String(source.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    return `https://doi.org/${doi}`
  }
  return source.sourceUrl || null
}

function isExternalLink(value) {
  return /^https?:\/\//i.test(String(value || ""))
}

export function GasFieldProvenanceButton({ record, field, currentValue, unit, lang = "en", t, label }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const source = getFieldSource(record, field)
  const provenance = getRecordProvenance(record)
  const fieldLabel = label || metricLabel(field, lang)

  const toggle = event => {
    event.stopPropagation()
    setOpen(prev => !prev)
  }

  const sourceLink = linkForSource(source)
  const rows = [
    [text(lang, "字段", "Field"), fieldLabel],
    [text(lang, "当前值", "Current value"), currentValue ?? source.normalizedValue],
    [text(lang, "原始值", "Original value"), source.originalValue],
    [text(lang, "单位", "Unit"), unit || source.normalizedUnit || "dimensionless"],
    [text(lang, "来源类型", "Source type"), sourceTypeText(source.sourceType, lang)],
    [text(lang, "来源数据库", "Source database"), source.sourceDatabase || provenance.sourceDatabase],
    [text(lang, "来源记录ID", "Source record id"), source.sourceRecordId || provenance.sourceRecordId],
    [text(lang, "引用", "Citation"), source.citation],
    ["DOI / URL", sourceLink || "pending"],
    [text(lang, "检索日期", "Retrieved date"), source.retrievedAt || provenance.retrievedAt],
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
        aria-expanded={open}
        style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.accentText, cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 900, height: 22, justifyContent: "center", marginLeft: 5, width: 22 }}
      >
        ⓘ
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
          style={{
            background: t.tooltipBg || t.panel,
            border: `1px solid ${t.borderStrong || t.border}`,
            boxShadow: t.shadowLg || t.shadowMd,
            color: t.muted,
            padding: 12,
          }}
        >
          <div style={{ alignItems: "center", background: t.tooltipBg || t.panel, borderBottom: `1px solid ${t.border}`, display: "flex", gap: 10, justifyContent: "space-between", margin: "-12px -12px 8px", padding: "11px 12px 9px", position: "sticky", top: -12, zIndex: 2 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "字段级溯源", "Field-level provenance")}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={text(lang, "关闭字段级溯源", "Close field-level provenance")} style={{ alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.subtle, cursor: "pointer", display: "inline-flex", height: 32, justifyContent: "center", padding: 0, width: 32 }}><X aria-hidden="true" size={16} weight="bold" /></button>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(([name, value]) => (
              <div key={name} style={{ borderTop: `1px solid ${t.divider}`, display: "grid", gap: 3, paddingTop: 7 }}>
                <span style={{ color: t.faint, fontSize: 10.3, fontWeight: 900, textTransform: "uppercase" }}>{name}</span>
                {name === "DOI / URL" && sourceLink ? (
                  <a
                    href={sourceLink}
                    {...(isExternalLink(sourceLink) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    aria-label={isExternalLink(sourceLink) ? text(lang, "在新标签页打开来源链接", "Open source link in a new tab") : text(lang, "打开来源链接", "Open source link")}
                    style={{ color: t.accentText, fontSize: 11.5, overflowWrap: "anywhere" }}
                  >
                    <ChemicalText value={display(value)} />
                  </a>
                ) : (
                  <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.42, overflowWrap: "anywhere" }}><ChemicalText value={display(value)} /></span>
                )}
              </div>
            ))}
          </div>
        </AnchoredFieldProvenancePanel>
      ) : null}
    </span>
  )
}
