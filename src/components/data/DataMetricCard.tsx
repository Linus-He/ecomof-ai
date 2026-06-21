// @ts-nocheck
// V3.9 — a single database metric card. It ONLY receives a pre-formatted summary
// value (never raw data) and routes it through formatDataCardValue so it can
// never render undefined / null / NaN / [object Object].
import { formatDataCardValue } from "../../utils/fallback/formatDataCardValue"

export function DataMetricCard({ label, value, type = "text", unit = "", decimals = 0, fallbackKind = "generic", tone = "default", t }: any) {
  const display = formatDataCardValue(value, { type, unit, decimals, fallbackKind })
  const color = tone === "warn" ? (t?.warn || "#B45309") : tone === "pass" ? (t?.success || "#15803D") : (t?.textStrong || "#0A1628")
  return (
    <div data-testid="data-metric-card" style={{ background: t?.surface || "#F1F5F9", border: `1px solid ${t?.border || "#E2E8F0"}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
      <span style={{ color: t?.faint || "#64748B", display: "block", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 15, lineHeight: 1.2, marginTop: 4, overflowWrap: "anywhere" }}>{display}</strong>
    </div>
  )
}

export default DataMetricCard
