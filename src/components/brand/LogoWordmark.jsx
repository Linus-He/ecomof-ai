import { LogoMark } from "./LogoMark"
import { FONT_SANS } from "../../constants/theme"

export function LogoWordmark({
  markSize = 30,
  radius = 8,
  text = "EcoMOF-AI",
  tagline,
  t,
  compact = false,
  className = "",
  style,
}) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 7 : 9,
        minWidth: 0,
        fontFamily: FONT_SANS,
        ...style,
      }}
    >
      <LogoMark size={markSize} radius={radius} style={{ boxShadow: t?.shadowSm }} />
      <span style={{ display: "grid", gap: 1, minWidth: 0 }}>
        <span style={{
          color: t?.textStrong || "currentColor",
          fontSize: compact ? 12 : 13,
          fontWeight: 850,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}>
          {text}
        </span>
        {tagline && (
          <span style={{
            color: t?.faint || "currentColor",
            fontSize: 10.5,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: compact ? 190 : 360,
          }}>
            {tagline}
          </span>
        )}
      </span>
    </div>
  )
}
