// @ts-nocheck
import { DataModeToggle } from "../ui"
import { useT, useViewport } from "../../contexts"
import { toolbarBtn } from "../../utils/styles"

export function ModulePageHeader({ title = "", subtitle = "", action = null }) {
  const t = useT()
  const { isMobile } = useViewport()

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: isMobile ? "1 1 100%" : "1 1 620px" }}>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 28 : 34, lineHeight: 1.12, fontWeight: 920, letterSpacing: 0 }}>
          {title}
        </h1>
        <p style={{ margin: "7px 0 0", color: t.subtle, fontSize: isMobile ? 13 : 14, lineHeight: 1.55, maxWidth: 820 }}>
          {subtitle}
        </p>
      </div>
      {action && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
          {action}
        </div>
      )}
    </header>
  )
}

export function PrimaryWorkbenchCard({
  title = "",
  description = "",
  capabilities = [],
  metrics = [],
  note = "",
  primaryLabel = "",
  onPrimary,
  secondaryLabel = "",
  onSecondary,
  actions = null,
}) {
  const t = useT()
  const { isNarrow, isMobile } = useViewport()
  const safeMetrics = Array.isArray(metrics) ? metrics : []
  const capabilityText = Array.isArray(capabilities) ? capabilities.filter(Boolean).join(" · ") : capabilities
  const showActions = actions || primaryLabel || secondaryLabel

  return (
    <section style={{
      background: t.panel,
      border: `1px solid ${t.borderStrong || t.border}`,
      borderRadius: 12,
      boxShadow: t.shadowSm,
      padding: isMobile ? 16 : 18,
      display: "grid",
      gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) auto",
      gap: isMobile ? 14 : 18,
      alignItems: "center",
    }}>
      <div style={{ minWidth: 0, display: "grid", gap: 9 }}>
        <div>
          <h2 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 19 : 22, lineHeight: 1.2, fontWeight: 920 }}>
            {title}
          </h2>
          <p style={{ margin: "7px 0 0", color: t.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 880 }}>
            {description}
          </p>
        </div>
        {capabilityText && (
          <div style={{ color: t.accentText, fontSize: 12, lineHeight: 1.5, fontWeight: 800 }}>
            {capabilityText}
          </div>
        )}
        {note && (
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, maxWidth: 900 }}>
            {note}
          </div>
        )}
        {safeMetrics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(104px, 1fr))", gap: 8, maxWidth: 760 }}>
            {safeMetrics.map(metric => (
              <div key={metric.key || metric.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 9px", minWidth: 0 }}>
                <div style={{ color: t.textStrong, fontSize: 18, lineHeight: 1, fontWeight: 920 }}>{metric.value ?? "—"}</div>
                <div style={{ color: t.faint, fontSize: 9.5, lineHeight: 1.3, fontWeight: 850, textTransform: "uppercase", marginTop: 5 }}>
                  {metric.label || ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showActions && (
        <div style={{ display: "flex", gap: 9, justifyContent: isNarrow ? "flex-start" : "flex-end", flexWrap: "wrap", width: isNarrow ? "100%" : "auto" }}>
          {actions || (
            <>
              {primaryLabel && (
                <button
                  type="button"
                  onClick={onPrimary}
                  aria-label={primaryLabel}
                  className="btn-primary"
                  style={{
                    ...toolbarBtn(t),
                    background: t.accent,
                    borderColor: t.accent,
                    color: "#fff",
                    justifyContent: "center",
                    minHeight: 40,
                    padding: "10px 15px",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {primaryLabel}
                </button>
              )}
              {secondaryLabel && (
                <button
                  type="button"
                  onClick={onSecondary}
                  aria-label={secondaryLabel}
                  style={{
                    ...toolbarBtn(t),
                    justifyContent: "center",
                    minHeight: 40,
                    padding: "10px 13px",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  {secondaryLabel}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

export function SecondaryTabs({ tabs = [], items, activeKey, active, onChange, ariaLabel }) {
  const t = useT()
  const safeTabs = Array.isArray(items) ? items : (Array.isArray(tabs) ? tabs : [])
  if (!safeTabs.length) return null
  const requestedActive = activeKey ?? active
  const fallbackKey = safeTabs[0]?.key ?? safeTabs[0]?.id
  const resolvedActive = safeTabs.some(item => (item.key ?? item.id) === requestedActive) ? requestedActive : fallbackKey

  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%", paddingBottom: 2 }}>
      {safeTabs.map(item => {
        const itemKey = item.key ?? item.id
        const selected = resolvedActive === itemKey
        return (
          <button
            key={itemKey}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(itemKey)}
            style={{
              background: selected ? t.badgeInfoBg : t.panel,
              border: `1px solid ${selected ? t.accent : t.border}`,
              borderRadius: 7,
              color: selected ? t.accentText : t.subtle,
              cursor: "pointer",
              flex: "0 0 auto",
              fontSize: 12,
              fontWeight: selected ? 850 : 750,
              minHeight: 34,
              padding: "8px 12px",
              whiteSpace: "nowrap",
            }}
          >
            {item.label || itemKey}
          </button>
        )
      })}
    </div>
  )
}

export function ScopeNoticeBar({ label = "", children = null, actionLabel = "", onAction, tone, type = "info" }) {
  const t = useT()
  const { isNarrow } = useViewport()
  if (children === null || children === undefined || children === "") return null
  const resolvedTone = tone || type
  const bg = resolvedTone === "warn" ? (t.badgeWarnBg || t.surface) : resolvedTone === "scope" ? t.surface : t.badgeInfoBg
  const border = resolvedTone === "warn" ? (t.warn || t.border) : t.border

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 9,
      padding: "9px 11px",
      display: "grid",
      gridTemplateColumns: isNarrow || !actionLabel ? "1fr" : "minmax(0, 1fr) auto",
      gap: 10,
      alignItems: "center",
    }}>
      <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, minWidth: 0 }}>
        {label && <strong style={{ color: t.textStrong }}>{label}: </strong>}
        {children}
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} style={{ ...toolbarBtn(t), padding: "7px 10px", minHeight: 32, fontSize: 11, justifyContent: "center" }}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function CompactDataModeBar({ value, mode = "demo", onChange = () => {}, lang = "zh", statusText, infoLabel, onInfo, recordsCount = 0, options }) {
  const t = useT()
  const { isNarrow } = useViewport()
  const currentMode = value ?? mode
  const resolvedStatusText = statusText ?? (lang === "zh" ? `${recordsCount} 条记录` : `${recordsCount} records`)

  return (
    <div style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 9,
      padding: "9px 11px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    }}>
      <span style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>
        {lang === "zh" ? "数据模式：" : "Data mode:"}
      </span>
      <DataModeToggle value={currentMode} onChange={onChange} lang={lang} options={options} />
      <span style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.45, flex: isNarrow ? "1 1 100%" : "1 1 auto" }}>
        {resolvedStatusText}
      </span>
      {infoLabel && (
        <button type="button" onClick={onInfo} style={{ ...toolbarBtn(t), padding: "6px 9px", minHeight: 30, fontSize: 11, marginLeft: isNarrow ? 0 : "auto" }}>
          {infoLabel}
        </button>
      )}
    </div>
  )
}
