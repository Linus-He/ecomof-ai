// @ts-nocheck
import { FONT_MONO } from "../../constants/theme"

const toneStyle = (t, tone) => ({
  input: {
    background: t.badgeInfoBg,
    border: t.accent,
    label: t.accentText,
  },
  process: {
    background: t.panel,
    border: t.border,
    label: t.faint,
  },
  highlight: {
    background: t.surface,
    border: t.accent,
    label: t.accentText,
  },
  quality: {
    background: t.surface,
    border: t.borderStrong,
    label: t.warn,
  },
  output: {
    background: t.badgeInfoBg,
    border: t.accent,
    label: t.accentText,
  },
}[tone] || {
  background: t.panel,
  border: t.border,
  label: t.faint,
})

export function MethodBlock({
  t,
  eyebrow,
  title,
  subtitle,
  items = [],
  tone = "process",
  onClick,
  titleAttr,
  compact = false,
  children,
}) {
  const palette = toneStyle(t, tone)
  const sharedStyle = {
    width: "100%",
    minWidth: 0,
    background: palette.background,
    border: `1px solid ${palette.border}`,
    borderRadius: compact ? 12 : 14,
    padding: compact ? "10px 11px" : "12px 13px",
    boxShadow: tone === "highlight" || tone === "output" ? t.shadowSm : "none",
    textAlign: "left",
    color: t.muted,
    display: "grid",
    gap: compact ? 6 : 8,
    font: "inherit",
  }
  const content = (
    <>
      {eyebrow && (
        <div style={{ color: palette.label, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 900, letterSpacing: 0 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ color: t.textStrong, fontSize: compact ? 12.5 : 13.5, fontWeight: 900, lineHeight: 1.25 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ color: t.subtle, fontSize: compact ? 10.8 : 11.5, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {items.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          {items.map(item => (
            <div key={item} style={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr)", gap: 6, alignItems: "baseline" }}>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: palette.label, transform: "translateY(-1px)" }} />
              <span style={{ color: t.muted, fontSize: compact ? 10.5 : 11.2, lineHeight: 1.42, overflowWrap: "anywhere" }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
      {children}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className="method-block method-block-clickable"
        onClick={onClick}
        title={titleAttr}
        style={{ ...sharedStyle, cursor: "pointer" }}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="method-block" title={titleAttr} style={sharedStyle}>
      {content}
    </div>
  )
}
