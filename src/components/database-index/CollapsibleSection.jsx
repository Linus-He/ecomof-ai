// @ts-nocheck
import { text } from "../catalysis/organic-acid-final/FinalScreeningShared"

// A lightweight collapsible section so secondary panels do not flood the first screen.
// Uses native <details> so it works without extra state and stays accessible.
export function CollapsibleSection({ title, titleZh, subtitle, subtitleZh, defaultOpen = false, lang, t, children }) {
  return (
    <details open={defaultOpen} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 0 }}>
      <summary style={{ alignItems: "center", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", listStyle: "none", padding: "11px 12px" }}>
        <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, titleZh, title)}</strong>
        {subtitle || subtitleZh ? <span style={{ color: t.muted, fontSize: 11.4 }}>{text(lang, subtitleZh || subtitle, subtitle || subtitleZh)}</span> : null}
      </summary>
      <div style={{ display: "grid", gap: 12, padding: "0 12px 12px" }}>
        {children}
      </div>
    </details>
  )
}

export default CollapsibleSection
