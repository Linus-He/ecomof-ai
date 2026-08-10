// @ts-nocheck
import { FINGERPRINT_METRICS } from "./reactionRationaleData"

export function ReactionFingerprintPanel({ profile, t, compact = false }) {
  const fingerprintRow = profile?.fingerprint || profile
  const fingerprint = fingerprintRow?.fingerprint

  if (!fingerprint) {
    return (
      <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: compact ? 10 : 12 }}>
        <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900 }}>Pathway Fingerprint</div>
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
          No pathway fingerprint available yet. This candidate requires experimental calibration.
        </div>
      </section>
    )
  }

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: compact ? 8 : 10, minWidth: 0, padding: compact ? 10 : 12 }}>
      <div>
        <div style={{ color: t.textStrong, fontSize: compact ? 12.5 : 14, fontWeight: 920 }}>Pathway Fingerprint</div>
        <div style={{ color: t.faint, fontSize: 11.2, lineHeight: 1.5, marginTop: 3 }}>
          Current values are expert-prior estimates and require experimental calibration.
        </div>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {FINGERPRINT_METRICS.map(([key, label, kind]) => {
          const value = Math.max(0, Math.min(100, Number(fingerprint[key]) || 0))
          const isRisk = kind === "risk"
          return (
            <div key={key} style={{ display: "grid", gap: 4 }}>
              <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <span style={{ color: isRisk ? t.warn : t.muted, fontSize: 11.5, fontWeight: 820 }}>{label}</span>
                <span style={{ color: isRisk ? t.warn : t.textStrong, fontSize: 12, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{value}</span>
              </div>
              <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: compact ? 6 : 7, overflow: "hidden" }}>
                <div style={{ background: isRisk ? t.warn : t.accentText, height: "100%", width: `${value}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.45 }}>
        {fingerprintRow.confidence || "expert-prior"} · {fingerprintRow.validationStatus || "pending experimental calibration"}
      </div>
    </section>
  )
}
