// @ts-nocheck
// V3.9 — honesty badge for a data source's mode (demo / seed / curated /
// inferred / experimental / literature / simulation / mixed). Never lets demo
// data masquerade as a complete real database.
import { APP_VERSION_LABEL } from "../../constants/appVersion"

const MODE_LABELS: Record<string, string> = {
  demo: "Demo", seed: "Seed", curated: "Curated", inferred: "Inferred",
  experimental: "Experimental", literature: "Literature", simulation: "Simulation", mixed: "Mixed",
}
const WARN_MODES = new Set(["demo", "seed", "inferred"])

export function DatasetModeBadge({ mode = "mixed", t }: any) {
  const safe = MODE_LABELS[String(mode)] ? mode : "mixed"
  const warn = WARN_MODES.has(safe)
  const color = warn ? (t?.warn || "#B91C1C") : (t?.success || "#15803D")
  return (
    <span data-testid={`dataset-mode-${safe}`} title={`${APP_VERSION_LABEL} · ${MODE_LABELS[safe]}`} style={{ background: t?.surface || "#F1F5F9", border: `1px solid ${color}`, borderRadius: 6, color, fontSize: 10.2, fontWeight: 800, padding: "2px 8px", textTransform: "uppercase" }}>
      {MODE_LABELS[safe]}
    </span>
  )
}

export default DatasetModeBadge
