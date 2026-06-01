// @ts-nocheck
import { ChemicalText } from "../../shared"
import { text } from "./gasViewUtils"

export function GasUnitNormalizationNote({ record, field, lang = "en", t, compact = false }) {
  const raw = record?.rawValues?.[field]
  if (!raw) return null
  return (
    <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: compact ? 10.8 : 11.8, lineHeight: 1.45, padding: compact ? "6px 8px" : 10 }}>
      <strong style={{ color: t.textStrong }}>{text(lang, "单位规范化：", "Unit normalization: ")}</strong>
      <ChemicalText value={`${raw.originalValue ?? "pending"} ${raw.originalUnit || ""} → ${raw.normalizedValue ?? "pending"} ${raw.normalizedUnit || ""}`} />
      {raw.conversionNote ? <span> · <ChemicalText value={raw.conversionNote} /></span> : null}
    </div>
  )
}
