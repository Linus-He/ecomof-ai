// @ts-nocheck
export function MethodArrow({ t, direction = "down", dashed = false, label }) {
  const isDown = direction === "down"
  return (
    <div
      className={`method-arrow method-arrow-${direction}`}
      aria-hidden={!label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isDown ? 5 : 7,
        minHeight: isDown ? 22 : 28,
        color: t.accentText,
        fontSize: 12,
        fontWeight: 850,
      }}
    >
      <span
        style={{
          display: "block",
          width: isDown ? 1 : 38,
          height: isDown ? 16 : 1,
          background: isDown ? t.borderStrong : "transparent",
          borderTop: isDown ? 0 : `1px ${dashed ? "dashed" : "solid"} ${t.borderStrong}`,
        }}
      />
      <span style={{ lineHeight: 1 }}>{isDown ? "↓" : "→"}</span>
      {label && (
        <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 800, lineHeight: 1.2 }}>
          {label}
        </span>
      )}
    </div>
  )
}
