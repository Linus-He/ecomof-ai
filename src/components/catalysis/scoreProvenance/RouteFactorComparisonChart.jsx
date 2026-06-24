import { asArray, cardStyle, EmptyState, fmt, palette, pct, text } from "./shared"

const ROUTE_TONES = [palette.positive, palette.accent, palette.mixed || palette.faint]

export function RouteFactorComparisonChart({ model, lang = "zh", withTestId = true, onSelectRoute }) {
  const routes = asArray(model?.routes)
  const factorRows = asArray(model?.factorRows)
  if (!routes.length || !factorRows.length) {
    return (
      <div data-testid={withTestId ? "route-factor-comparison-chart" : undefined} data-route-count={0} style={cardStyle({ background: palette.bg })}>
        <EmptyState lang={lang} />
      </div>
    )
  }
  return (
    <div data-testid={withTestId ? "route-factor-comparison-chart" : undefined} data-route-count={routes.length} style={cardStyle({ background: palette.bg, overflowX: "auto" })}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ color: palette.text, fontSize: 13 }}>{text(lang, model.titleZh, model.titleEn)}</strong>
        <span style={{ color: palette.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "比较 Top / Runner-up / Third 三条路线的八个 HGCPS 因子；高亮当前 top route。", "Compare the eight HGCPS factors across Top / Runner-up / Third; the top route is highlighted.")}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {routes.map((route, index) => (
          <button
            key={route.routeId}
            type="button"
            onClick={() => onSelectRoute?.(route)}
            style={{ alignItems: "center", background: palette.surface, border: `1px solid ${index === 0 ? palette.positive : palette.border}`, borderRadius: 999, color: palette.text, cursor: "pointer", display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6, padding: "4px 9px" }}
          >
            <span style={{ background: ROUTE_TONES[index] || palette.faint, borderRadius: 3, height: 10, width: 10 }} />
            #{route.rank} {route.label} · {fmt(route.finalHGCPS, 3)}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {factorRows.map(row => (
          <div key={row.factorKey} style={{ display: "grid", gap: 5 }}>
            <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <span style={{ color: palette.text, fontSize: 11.5, fontWeight: 800 }}>{text(lang, row.labelZh, row.labelEn)}</span>
              <span style={{ color: row.topVsSecondDelta > 0 ? palette.positive : palette.faint, fontSize: 10.5, fontWeight: 850 }}>Top−runner {row.topVsSecondDelta >= 0 ? "+" : ""}{fmt(row.topVsSecondDelta, 2)}</span>
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              {asArray(row.values).map((cell, index) => (
                <div key={cell.routeId} style={{ alignItems: "center", display: "grid", gap: 7, gridTemplateColumns: "26px minmax(0,1fr) 38px" }}>
                  <span style={{ color: palette.faint, fontSize: 10, fontWeight: 850 }}>#{cell.rank}</span>
                  <span style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
                    <span style={{ background: cell.isTop ? palette.positive : (ROUTE_TONES[index] || palette.accent), display: "block", height: "100%", width: pct(cell.value) }} />
                  </span>
                  <span style={{ color: palette.muted, fontSize: 10.5, textAlign: "right" }}>{fmt(cell.value, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ background: palette.accentSoft, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.text, fontSize: 11.5, lineHeight: 1.5, margin: 0, padding: 9 }}>
        {text(lang, model.autoSentenceZh, model.autoSentenceEn)}
      </p>
    </div>
  )
}

export default RouteFactorComparisonChart
