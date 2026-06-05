// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { Panel, StatusPill, text } from "./FinalScreeningShared"

function toneFor(status) {
  const value = String(status || "").toLowerCase()
  if (value.includes("current")) return "pass"
  if (value.includes("partial")) return "warn"
  return "proxy"
}

export function ValidationEvidenceLadder({ rows = [], lang, t }) {
  const [openLevel, setOpenLevel] = useState(1)
  return (
    <Panel
      id="organic-acid-final-validation-evidence-ladder"
      eyebrow="Validation Evidence Ladder"
      title={text(lang, "验证证据阶梯", "Validation Evidence Ladder")}
      t={t}
    >
      <div style={{ display: "grid", gap: 9 }}>
        {rows.map(row => {
          const open = openLevel === row.level
          return (
            <article key={row.level} style={{ background: open ? t.badgeInfoBg : t.surface, border: `1px solid ${open ? t.accentText : t.border}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 11 }}>
              <button
                type="button"
                onClick={() => setOpenLevel(open ? null : row.level)}
                style={{ alignItems: "center", background: "transparent", border: 0, color: t.textStrong, cursor: "pointer", display: "grid", gap: 10, gridTemplateColumns: "38px minmax(0, 1fr) auto", padding: 0, textAlign: "left" }}
              >
                <span style={{ alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 12, fontWeight: 900, height: 32, justifyContent: "center", width: 32 }}>{row.level}</span>
                <strong style={{ fontSize: 13.5, lineHeight: 1.25 }}><ChemicalText value={text(lang, row.titleZh, row.title)} /></strong>
                <StatusPill tone={toneFor(row.status)} t={t}>{text(lang, row.statusZh, row.status)}</StatusPill>
              </button>
              {open ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingLeft: 42 }}>
                  {(lang === "zh" ? row.evidenceZh : row.evidence).map(item => (
                    <span key={item} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.muted, fontSize: 11.5, fontWeight: 780, padding: "5px 8px" }}>
                      <ChemicalText value={item} />
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </Panel>
  )
}
