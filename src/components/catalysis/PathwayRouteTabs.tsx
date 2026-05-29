// @ts-nocheck
import { ROUTE_GROUPS } from "./reactionRationaleData"

export function PathwayRouteTabs({ activeGroup, onChange, t, isMobile }) {
  if (isMobile) {
    return (
      <select
        value={activeGroup}
        onChange={event => onChange(event.target.value)}
        style={{
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 7,
          color: t.textStrong,
          fontSize: 12,
          fontWeight: 800,
          minHeight: 36,
          padding: "0 9px",
          width: "100%",
        }}
      >
        {ROUTE_GROUPS.map(group => <option key={group} value={group}>{group}</option>)}
      </select>
    )
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {ROUTE_GROUPS.map(group => {
        const active = group === activeGroup
        return (
          <button
            key={group}
            type="button"
            onClick={() => onChange(group)}
            style={{
              background: active ? t.badgeInfoBg : t.panel,
              border: `1px solid ${active ? t.accent : t.border}`,
              borderRadius: 7,
              color: active ? t.accentText : t.muted,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 850,
              lineHeight: 1.2,
              minHeight: 34,
              padding: "7px 9px",
            }}
          >
            {group}
          </button>
        )
      })}
    </div>
  )
}
