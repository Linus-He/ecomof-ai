// @ts-nocheck
// V3.9 — explicit "missing data" notice so a card with absent data never renders
// blank. Surfaces how many sources fell back to defaults.
import { APP_VERSION_LABEL } from "../../constants/appVersion"

export function MissingDataNotice({ message, count = null, t }: any) {
  const text = message || (count != null ? `${count} data source(s) unavailable — showing fallback values.` : "Some data is unavailable; showing fallback values.")
  return (
    <div data-testid="missing-data-notice" title={APP_VERSION_LABEL} style={{ background: t?.badgeWarnBg || "#FEF2F2", border: `1px solid ${t?.warn || "#B91C1C"}`, borderRadius: 8, color: t?.warn || "#B91C1C", fontSize: 11, fontWeight: 700, lineHeight: 1.5, padding: 9 }}>
      {text}
    </div>
  )
}

export default MissingDataNotice
