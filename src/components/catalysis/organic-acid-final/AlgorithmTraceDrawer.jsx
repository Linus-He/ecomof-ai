// @ts-nocheck
import { useState } from "react"
import { ChemicalText } from "../../../shared"
import { StatusPill, text } from "./FinalScreeningShared"

export function AlgorithmTraceDrawer({ trace, lang, t, label, compact = false }) {
  const [open, setOpen] = useState(false)
  const rows = trace || []

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: compact ? t.surface : t.accent,
          border: `1px solid ${compact ? t.border : t.accent}`,
          borderRadius: 8,
          color: compact ? t.textStrong : t.buttonText || "#fff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 900,
          minHeight: 34,
          padding: "7px 10px",
        }}
      >
        {label || text(lang, "查看算法追踪", "View algorithm trace")}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={text(lang, "算法追踪", "Algorithm trace")}
          style={{
            alignItems: "stretch",
            background: "rgba(15, 23, 42, 0.42)",
            display: "grid",
            inset: 0,
            justifyItems: "end",
            position: "fixed",
            zIndex: 9000,
          }}
          onClick={() => setOpen(false)}
        >
          <aside
            onClick={event => event.stopPropagation()}
            style={{
              background: t.panel,
              borderLeft: `1px solid ${t.borderStrong || t.border}`,
              boxShadow: t.shadowLg || t.shadowMd,
              display: "grid",
              gap: 12,
              maxWidth: 520,
              overflowY: "auto",
              padding: 16,
              width: "min(94vw, 520px)",
            }}
          >
            <header style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: t.textStrong, fontSize: 18 }}>
                  {text(lang, "Algorithm Trace Drawer", "Algorithm Trace Drawer")}
                </strong>
                <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.45 }}>
                  <ChemicalText value={text(
                    lang,
                    "该追踪链解释的是演示级代理评分逻辑，不证明实际催化转化性能。",
                    "This trace explains the demo/proxy ranking logic. It does not prove catalytic conversion performance."
                  )} />
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.textStrong, cursor: "pointer", minHeight: 32, padding: "5px 9px" }}
              >
                Esc
              </button>
            </header>
            <StatusPill tone="warn" t={t}>demo/proxy trace</StatusPill>
            <div style={{ display: "grid", gap: 9 }}>
              {rows.map((row, index) => (
                <article key={row.id || row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 11 }}>
                  <div style={{ alignItems: "start", display: "grid", gap: 8, gridTemplateColumns: "30px minmax(0, 1fr)" }}>
                    <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 999, color: t.accentText, display: "inline-flex", fontSize: 11, fontWeight: 900, height: 26, justifyContent: "center", width: 26 }}>
                      {index + 1}
                    </span>
                    <div style={{ display: "grid", gap: 3 }}>
                      <strong style={{ color: t.textStrong, fontSize: 13.2 }}>
                        <ChemicalText value={lang === "zh" ? row.titleZh || row.title : row.title} />
                      </strong>
                      <span style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.48 }}>
                        <ChemicalText value={lang === "zh" ? row.detailZh || row.detail : row.detail} />
                      </span>
                    </div>
                  </div>
                  {row.items?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 38 }}>
                      {row.items.map(item => <StatusPill key={item} tone="info" t={t}>{item}</StatusPill>)}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
