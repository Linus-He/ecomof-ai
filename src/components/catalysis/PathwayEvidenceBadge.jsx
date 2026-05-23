import { useState } from "react"

export const EVIDENCE_LEVELS = {
  A: {
    label: "Strong evidence",
    explanation: "Isotope tracing, time-series detection, intermediate feeding, or similarly strong pathway evidence.",
  },
  B: {
    label: "Literature-supported",
    explanation: "Supported in related literature, but still requires validation in the current MOF / glucose / bicarbonate system.",
  },
  C: {
    label: "Hypothesis",
    explanation: "Chemically plausible and useful for prioritization, but not validated in the current system.",
  },
  D: {
    label: "Open uncertainty",
    explanation: "Unknown pathway or carbon-balance loss that should remain open until targeted analysis is available.",
  },
}

export function getEvidenceInfo(level) {
  return EVIDENCE_LEVELS[level] || EVIDENCE_LEVELS.D
}

export function PathwayEvidenceBadge({ level, t, compact = false }) {
  const [open, setOpen] = useState(false)
  const info = getEvidenceInfo(level)
  const isWeak = level === "C" || level === "D"
  return (
    <span style={{ display: "inline-grid", gap: 5, position: "relative", verticalAlign: "middle" }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        title={`Level ${level} — ${info.label}: ${info.explanation}`}
        style={{
          background: isWeak ? t.surface : t.panel,
          border: `1px solid ${isWeak ? t.warn : t.accent}`,
          borderRadius: 6,
          color: isWeak ? t.warn : t.accentText,
          cursor: "pointer",
          fontSize: compact ? 10.5 : 11,
          fontWeight: 850,
          lineHeight: 1.2,
          padding: compact ? "3px 6px" : "4px 7px",
          whiteSpace: "nowrap",
        }}
      >
        Level {level} · {compact ? info.label.replace("Literature-supported", "Literature") : info.label}
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            background: t.tooltipBg || t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 7,
            boxShadow: t.shadowSm,
            color: t.muted,
            fontSize: 11,
            left: 0,
            lineHeight: 1.45,
            minWidth: 220,
            padding: 8,
            position: "absolute",
            top: "calc(100% + 4px)",
            zIndex: 20,
          }}
        >
          {info.explanation}
        </span>
      )}
    </span>
  )
}
