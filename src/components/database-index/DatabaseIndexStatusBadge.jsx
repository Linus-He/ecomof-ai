// @ts-nocheck
import { StatusPill } from "../catalysis/organic-acid-final/FinalScreeningShared"

function toneFor(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("preview") || value.includes("offline") || value.includes("demand")) return "proxy"
  if (value.includes("not_full") || value.includes("pending") || value.includes("review")) return "warn"
  if (value.includes("ready") || value.includes("loaded")) return "pass"
  if (value.includes("reject")) return "fail"
  return "info"
}

export function DatabaseIndexStatusBadge({ status, t }) {
  return <StatusPill tone={toneFor(status)} t={t}>{status}</StatusPill>
}
