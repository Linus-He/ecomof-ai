// @ts-nocheck
import { ChemicalText } from "../../../shared"
import { VersionStatusBadge } from "./VersionStatusBadge"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function VersionTimeline({ versions = [], selectedVersion, onSelect, lang, t, isMobile }) {
  return (
    <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))" }}>
      {versions.map(version => {
        const selected = version.version === selectedVersion
        return (
          <button
            key={version.version}
            type="button"
            onClick={() => onSelect(version.version)}
            style={{ background: selected ? t.badgeInfoBg : t.surface, border: `1px solid ${selected ? t.accentText : t.border}`, borderRadius: 10, color: t.textStrong, cursor: "pointer", display: "grid", gap: 7, minHeight: 116, minWidth: 0, padding: 10, textAlign: "left" }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
              <strong style={{ color: t.textStrong, fontSize: 16 }}>{version.version}</strong>
              <VersionStatusBadge status={version.status} t={t} />
            </div>
            <span style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.25 }}>
              <ChemicalText value={text(lang, version.titleZh, version.title)} />
            </span>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.35 }}>
              <ChemicalText value={text(lang, version.themeZh, version.theme)} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
