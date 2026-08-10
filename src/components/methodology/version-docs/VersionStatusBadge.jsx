// @ts-nocheck
import { ChemicalText } from "../../common/ChemicalFormula"

export function VersionStatusBadge({ status, t }) {
  const value = String(status || "planned").toLowerCase()
  const palette = value === "current"
    ? [t.badgeGoodBg || t.badgeInfoBg, t.good || t.accentText]
    : value === "completed"
      ? [t.badgeInfoBg, t.accentText]
      : value === "deprecated"
        ? [t.badgeDangerBg || t.badgeWarnBg, t.danger || t.warn]
        : [t.badgeWarnBg, t.warn]
  return (
    <span style={{ background: palette[0], border: `1px solid ${palette[1]}`, borderRadius: 6, color: palette[1], display: "inline-flex", fontSize: 10.5, fontWeight: 900, lineHeight: 1.1, padding: "5px 8px", textTransform: "uppercase" }}>
      <ChemicalText value={status || "planned"} />
    </span>
  )
}
