// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { CollapsibleNavGroup } from "./CollapsibleNavGroup"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function MethodologySidebar({ items, activeId, onJump, lang, t, isMobile }) {
  const parentByChild = useMemo(() => {
    const map = new Map()
    items.forEach(item => {
      ;(item.children || []).forEach(child => map.set(child.id, item.id))
    })
    return map
  }, [items])
  const [openIds, setOpenIds] = useState(() => new Set(items.slice(0, 2).map(item => item.id)))

  useEffect(() => {
    const parentId = parentByChild.get(activeId) || activeId
    if (!parentId) return
    setOpenIds(prev => {
      if (prev.has(parentId)) return prev
      const next = new Set(prev)
      next.add(parentId)
      return next
    })
  }, [activeId, parentByChild])

  const toggle = id => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 0,
        maxHeight: isMobile ? "none" : "calc(100vh - 112px)",
        overflow: "auto",
        padding: "8px 8px 8px 12px",
        position: isMobile ? "static" : "sticky",
        top: 92,
      }}
    >
      <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, marginBottom: 8, textTransform: "uppercase" }}>
        {text(lang, "方法目录 · 按研究流程排列", "Methods directory · research order")}
      </div>
      <nav style={{ display: isMobile ? "flex" : "grid", gap: 6, overflowX: isMobile ? "auto" : "visible" }}>
        {items.map((item, index) => (
          <CollapsibleNavGroup
            key={item.id}
            item={{ ...item, sequence: index + 1 }}
            activeId={activeId}
            isOpen={openIds.has(item.id)}
            onToggle={toggle}
            onJump={onJump}
            lang={lang}
            t={t}
            isMobile={isMobile}
          />
        ))}
      </nav>
    </aside>
  )
}
