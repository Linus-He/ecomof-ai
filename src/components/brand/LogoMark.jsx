import { ECOMOF_LOGO_SRC } from "../ui"

export function LogoMark({
  size = 32,
  radius = 8,
  alt = "EcoMOF-AI logo",
  decorative = false,
  className = "",
  style,
}) {
  return (
    <img
      src={ECOMOF_LOGO_SRC}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? "true" : undefined}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        display: "block",
        flex: "0 0 auto",
        ...style,
      }}
    />
  )
}
