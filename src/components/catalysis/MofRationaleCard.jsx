import { useState } from "react"

function BulletGroup({ title, rows, t }) {
  if (!rows?.length) return null
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 900 }}>{title}</div>
      <ul style={{ color: t.muted, display: "grid", fontSize: 11.5, gap: 4, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {rows.map(row => <li key={row}>{row}</li>)}
      </ul>
    </div>
  )
}

export function MofRationaleCard({ profile, t, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const fingerprint = profile?.fingerprint
  const readiness = profile?.readiness
  const hasData = Boolean(fingerprint || readiness)
  const structureFit = readiness?.screeningRole || (hasData ? ["Reaction-readiness data are partially available."] : [])
  const siteFit = fingerprint?.rationale || []
  const riskFlags = fingerprint?.riskFlags || (hasData ? [readiness?.notes].filter(Boolean) : [])
  const validationNeeded = fingerprint?.validationNeeded || ["Reaction rationale pending experimental calibration."]

  return (
    <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          alignItems: "center",
          background: "transparent",
          border: 0,
          color: t.textStrong,
          cursor: "pointer",
          display: "flex",
          fontSize: 12.5,
          fontWeight: 900,
          justifyContent: "space-between",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span>View reaction rationale · Why recommended?</span>
        <span style={{ color: t.faint }}>{open ? "−" : "+"}</span>
      </button>
      {!hasData && (
        <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55 }}>
          Recommendation rationale is pending for this candidate. Do not interpret the current screening row as a confirmed formate-pathway result.
        </div>
      )}
      {open && (
        <div style={{ display: "grid", gap: 10 }}>
          <BulletGroup title="Structure fit" rows={structureFit} t={t} />
          <BulletGroup title="Site fit" rows={siteFit} t={t} />
          <BulletGroup title="Pathway hypothesis" rows={hasData ? ["May support C1/C3 intermediate-to-formate route under validation.", "Bicarbonate enrichment remains a hypothesis until isotope tracing is available."] : ["Pending pathway hypothesis."]} t={t} />
          <BulletGroup title="Caution / risk flags" rows={riskFlags.length ? riskFlags : ["Formate release and byproduct diversion have not been validated."]} t={t} />
          <BulletGroup title="Validation needed" rows={validationNeeded} t={t} />
        </div>
      )}
    </section>
  )
}
