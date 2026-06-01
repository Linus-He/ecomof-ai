// @ts-nocheck
export function CatalystCatSprite({ mood = "happy", x = 0, y = 0, dragging = false, reducedMotion = false, onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onClick, onKeyDown }) {
  const eye = mood === "stars" ? "★" : mood === "confused" ? "?" : mood === "frown" || mood === "warning" ? "•" : "•"
  const mouth = mood === "frown" || mood === "warning" ? "M42 62 C35 56 26 56 19 62" : "M19 61 C26 70 36 70 43 61"
  return (
    <g
      role="slider"
      tabIndex="0"
      aria-label="Catalyst cat"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(((x - 90) / 590) * 100)}
      transform={`translate(${x - 38} ${y - 76})`}
      className="energy-cat-mascot"
      data-dragging={dragging ? "true" : "false"}
      data-mood={mood}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{ cursor: dragging ? "grabbing" : "grab", outline: "none", touchAction: "none" }}
    >
      <path d="M-16 27 L-29 5 L-5 13 Z" fill="#F8B66B" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
      <path d="M43 27 L60 6 L63 36 Z" fill="#F8B66B" stroke="#7C2D12" strokeLinejoin="round" strokeWidth="3" />
      <path d="M-31 67 C-28 35 -8 16 21 18 C52 20 70 43 67 72 C65 100 45 116 18 114 C-18 112 -37 94 -31 67 Z" fill="#F8B66B" stroke="#7C2D12" strokeWidth="3" />
      <path d="M-5 38 C8 29 30 29 46 39" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="4" opacity="0.38" />
      <path d="M-5 86 C12 94 34 94 52 84" fill="none" stroke="#D97706" strokeLinecap="round" strokeWidth="5" opacity="0.46" />
      {mood === "stars" ? (
        <>
          <text x="10" y="50" fill="#7C2D12" fontSize="15" fontWeight="900" textAnchor="middle">{eye}</text>
          <text x="43" y="50" fill="#7C2D12" fontSize="15" fontWeight="900" textAnchor="middle">{eye}</text>
          {!reducedMotion ? <circle className="cat-spark" cx="61" cy="23" r="4" fill="#FBBF24" /> : null}
        </>
      ) : (
        <>
          <ellipse cx="10" cy="48" rx={mood === "confused" ? 4 : 5} ry="6" fill="#111827" />
          <ellipse cx="43" cy="48" rx={mood === "confused" ? 4 : 5} ry="6" fill="#111827" />
          <circle cx="12" cy="46" r="1.7" fill="#FFFFFF" />
          <circle cx="45" cy="46" r="1.7" fill="#FFFFFF" />
        </>
      )}
      {mood === "confused" ? <text x="56" y="20" fill="#1A6DB5" fontSize="22" fontWeight="900">?</text> : null}
      <path d="M26 59 C23 63 29 63 26 59 Z" fill="#9A3412" />
      <path d={mouth} fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M-25 84 C-57 78 -58 47 -35 42" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
      <path d="M-25 84 C-57 78 -58 47 -35 42" fill="none" stroke="#F8B66B" strokeLinecap="round" strokeWidth="5" />
      <path d="M56 94 C84 88 87 63 70 54" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="9" />
      <path d="M56 94 C84 88 87 63 70 54" fill="none" stroke="#F8B66B" strokeLinecap="round" strokeWidth="5" />
      <path d="M1 111 C-6 127 9 134 18 115" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
      <path d="M42 112 C50 128 64 121 55 103" fill="none" stroke="#7C2D12" strokeLinecap="round" strokeWidth="8" />
      {mood === "warning" ? (
        <g transform="translate(52 6)">
          <rect x="0" y="0" width="48" height="24" rx="6" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
          <text x="24" y="17" fill="#92400E" fontSize="15" fontWeight="900" textAnchor="middle">!</text>
        </g>
      ) : null}
    </g>
  )
}
