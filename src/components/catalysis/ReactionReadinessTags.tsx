// @ts-nocheck
import { useState } from "react"

const READINESS_FIELDS = [
  ["waterStability", "Water stability"],
  ["poreAccess", "Pore access"],
  ["hydrophilicSites", "Hydrophilic sites"],
  ["lewisAcidSites", "Lewis acid sites"],
  ["formateReleaseRisk", "Formate release risk"],
  ["synthesisReadiness", "Synthesis readiness"],
]

function toneForValue(value, t) {
  const normalized = String(value || "unknown").toLowerCase()
  if (normalized.includes("unknown") || normalized.includes("pending")) return { border: t.warn, color: t.warn, bg: t.surface }
  if (normalized.includes("favorable") || normalized.includes("present") || normalized.includes("reported")) return { border: t.accent, color: t.accentText, bg: t.panel }
  return { border: t.border, color: t.muted, bg: t.panel }
}

export function ReactionReadinessTags({ profile, t, defaultVisible = READINESS_FIELDS.length }) {
  const [open, setOpen] = useState(false)
  const readiness = profile?.readiness?.reactionReadiness || profile?.reactionReadiness
  const visibleFields = open ? READINESS_FIELDS : READINESS_FIELDS.slice(0, defaultVisible)
  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>Reaction-readiness tags</div>
      <div style={{ display: "grid", gap: 7 }}>
        {visibleFields.map(([key, label]) => {
          const value = readiness?.[key] || "unknown / pending"
          const tone = toneForValue(value, t)
          return (
            <div key={key} style={{ alignItems: "center", background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 7, display: "flex", gap: 8, justifyContent: "space-between", padding: "7px 8px", minWidth: 0 }}>
              <span style={{ color: t.subtle, fontSize: 11, fontWeight: 830 }}>{label}</span>
              <span style={{ color: tone.color, fontSize: 11, fontWeight: 870, overflowWrap: "anywhere", textAlign: "right" }}>{value}</span>
            </div>
          )
        })}
      </div>
      {defaultVisible < READINESS_FIELDS.length && (
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, justifySelf: "start", padding: "6px 9px" }}
        >
          {open ? "Show fewer reaction tags" : "Show all reaction tags"}
        </button>
      )}
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
        These tags indicate readiness and risk cues, not absolute pass/fail conclusions.
      </div>
    </section>
  )
}
