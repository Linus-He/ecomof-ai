// @ts-nocheck
export function BrandMotif({
  size = 64,
  color = "currentColor",
  opacity = 0.14,
  className = "",
  style,
  strokeWidth = 1.7,
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      style={{ color, opacity, display: "block", flex: "0 0 auto", ...style }}
      fill="none"
    >
      <path d="M32 6 54 19v26L32 58 10 45V19L32 6Z" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M32 6v16m22-3-14 8m14 18-14-8M32 58V42M10 45l14-8M10 19l14 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="32" cy="22" r="4.2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="40" cy="37" r="4.2" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="24" cy="37" r="4.2" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M28 24.8 24.8 33m10.4-8.2 3.6 8.2M28.4 37h7.2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function BrandCornerMotif({ t, style }) {
  return (
    <BrandMotif
      size={74}
      color={t?.accentText || "currentColor"}
      opacity={0.1}
      className="brand-corner-motif"
      style={style}
      strokeWidth={1.45}
    />
  )
}

export function BrandNode({ active = false, t, children, style }) {
  return (
    <span
      className="brand-node"
      data-active={active ? "true" : "false"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0 50%)",
        background: active ? (t?.badgeInfoBg || "rgba(26,109,181,0.12)") : (t?.surface || "transparent"),
        border: `1px solid ${active ? (t?.accent || "currentColor") : (t?.border || "currentColor")}`,
        color: active ? (t?.accentText || "currentColor") : (t?.subtle || "currentColor"),
        fontSize: 11,
        fontWeight: 900,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
