// @ts-nocheck
import { StatusPill } from "../catalysis/organic-acid-final/FinalScreeningShared"
import { dbStatusLabel } from "../../utils/databaseIndex/databaseIndexCopy"

function toneFor(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("quarantined") || value.includes("not_full") || value.includes("pending") || value.includes("review")) return "warn"
  if (value.includes("preview") || value.includes("offline") || value.includes("demand") || value.includes("screening_only")) return "proxy"
  if (value.includes("real_core") || value.includes("active_source") || value.includes("ready") || value.includes("loaded")) return "pass"
  if (value.includes("reject")) return "fail"
  return "info"
}

export function DatabaseIndexStatusBadge({ status, lang = "en", t }) {
  return <StatusPill tone={toneFor(status)} t={t}>{dbStatusLabel(status, lang)}</StatusPill>
}
