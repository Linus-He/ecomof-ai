// @ts-nocheck
import { BasisBadge } from "../../shared"
import { dataTypeLabel, dataTypeTone, evidenceLabel, evidenceTone } from "./gasEvidence"

export function GasDataStatusBadge({ type = "dataType", value, lang = "en", compact = false }) {
  if (type === "evidence") {
    const label = evidenceLabel(value, lang)
    return <BasisBadge tone={evidenceTone(value)} title={label} aria-label={label}>{label}</BasisBadge>
  }
  const label = dataTypeLabel(value, lang)
  return <BasisBadge tone={dataTypeTone(value)} title={label} aria-label={label}>{compact ? label : label}</BasisBadge>
}
