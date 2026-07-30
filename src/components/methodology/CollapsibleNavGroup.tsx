// @ts-nocheck
const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function CollapsibleNavGroup({ item, activeId, isOpen, onToggle, onJump, lang, t, isMobile }) {
  const activeParent = activeId === item.id
  const activeChild = item.children?.some(child => child.id === activeId)
  const active = activeParent || activeChild
  return (
    <div style={{ display: "grid", gap: 4, minWidth: isMobile ? 240 : 0 }}>
      <button
        type="button"
        onClick={() => {
          onToggle(item.id)
          onJump(item.id)
        }}
        style={{
          alignItems: "center",
          background: active ? t.badgeInfoBg : "transparent",
          borderBottomColor: active ? t.accent : t.border,
          borderLeftColor: active ? t.accent : "transparent",
          borderRightColor: "transparent",
          borderTopColor: "transparent",
          borderBottomWidth: 1,
          borderLeftWidth: 4,
          borderRightWidth: 1,
          borderStyle: "solid",
          borderTopWidth: 1,
          borderRadius: 0,
          color: active ? t.accentText : t.textStrong,
          cursor: "pointer",
          display: "grid",
          fontSize: 12.4,
          fontWeight: 900,
          gap: 8,
          gridTemplateColumns: "minmax(0, 1fr) auto",
          lineHeight: 1.25,
          padding: "8px 8px 8px 9px",
          textAlign: "left",
          whiteSpace: "normal",
        }}
      >
        <span><span style={{ color: t.faint, fontSize: 10.5, marginRight: 8 }}>{String(item.sequence || 0).padStart(2, "0")}</span>{text(lang, item.labelZh, item.label)}</span>
        <span aria-hidden="true" style={{ color: active ? t.accentText : t.faint, fontSize: 11 }}>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen && item.children?.length ? (
        <div style={{ borderLeft: `1px solid ${t.border}`, display: "grid", gap: 4, marginLeft: 10, paddingLeft: 8 }}>
          {item.children.map(child => {
            const childActive = activeId === child.id
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => onJump(child.id)}
                style={{
                  background: childActive ? t.badgeInfoBg : "transparent",
                  borderBottomColor: childActive ? t.accent : "transparent",
                  borderLeftColor: childActive ? t.accent : "transparent",
                  borderRightColor: childActive ? t.accent : "transparent",
                  borderTopColor: childActive ? t.accent : "transparent",
                  borderBottomWidth: 1,
                  borderLeftWidth: 3,
                  borderRightWidth: 1,
                  borderStyle: "solid",
                  borderTopWidth: 1,
                  borderRadius: 0,
                  color: childActive ? t.accentText : t.muted,
                  cursor: "pointer",
                  fontSize: 11.3,
                  fontWeight: childActive ? 900 : 760,
                  lineHeight: 1.28,
                  padding: "6px 8px",
                  textAlign: "left",
                  whiteSpace: "normal",
                }}
              >
                {text(lang, child.labelZh, child.label)}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
