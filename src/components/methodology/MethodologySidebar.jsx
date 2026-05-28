const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologySidebar({ items, activeId, onJump, lang, t, isMobile }) {
  return (
    <aside
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        maxHeight: isMobile ? "none" : "calc(100vh - 112px)",
        overflow: "auto",
        padding: 10,
        position: isMobile ? "static" : "sticky",
        top: 92,
      }}
    >
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, marginBottom: 8, textTransform: "uppercase" }}>
        {text(lang, "方法目录", "Methods directory")}
      </div>
      <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible" }}>
        {items.map(item => {
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item.id)}
              style={{
                background: active ? t.badgeInfoBg : t.surface,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderRadius: 8,
                color: active ? t.accentText : t.textStrong,
                cursor: "pointer",
                display: "grid",
                flex: "0 0 auto",
                fontSize: item.level === 2 ? 11.2 : 12.2,
                fontWeight: active ? 900 : 780,
                gap: 3,
                lineHeight: 1.25,
                padding: item.level === 2 ? "7px 8px 7px 16px" : "8px 9px",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              <span>{text(lang, item.labelZh, item.label)}</span>
              {item.children?.length ? (
                <span style={{ color: active ? t.accentText : t.faint, fontSize: 10.5, fontWeight: 700 }}>
                  {item.children.map(child => text(lang, child.labelZh, child.label)).join(" · ")}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
