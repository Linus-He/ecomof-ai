// @ts-nocheck
import { Fragment } from "react"
import { BasisBadge, ChemicalText, FONT_MONO, SectionTitle, formatPercent, formatScore100 } from "../../shared"
import {
  GAS_METRICS,
  CONTRIBUTION_COLORS,
  dataStatus,
  formatNumber,
  metricContribution,
  metricDisplayValue,
  metricNormalizedValue,
  text,
} from "./gasViewUtils"

function sortValue(record, key, peers) {
  if (key === "GasScore") return Number(record?.score || 0)
  return Number(metricNormalizedValue(record, key, peers) || 0)
}

function cellValue(row, metric, view, ranked, lang) {
  if (view === "raw") return metricDisplayValue(row, metric, lang, ranked)
  if (view === "weighted") {
    const contribution = metricContribution(row, metric)
    return contribution == null ? "pending" : formatNumber(contribution)
  }
  const normalized = metricNormalizedValue(row, metric, ranked)
  return normalized == null ? "pending" : formatPercent(normalized, { lang, normalized: true })
}

function backgroundFor(row, metric, view, ranked, t) {
  if (view === "weighted") {
    const value = metricContribution(row, metric)
    const opacity = value == null ? 0.06 : Math.min(0.76, 0.12 + value / 22)
    return `rgba(47, 125, 123, ${opacity})`
  }
  const normalized = metricNormalizedValue(row, metric, ranked)
  const opacity = normalized == null ? 0.06 : 0.14 + normalized * 0.58
  return `rgba(47, 125, 123, ${opacity})`
}

export function GasMetricHeatmap({
  ranked = [],
  selectedId,
  selectedMetric,
  setSelectedMetric,
  heatmapView,
  setHeatmapView,
  heatmapSortMetric,
  setHeatmapSortMetric,
  onSelectCell,
  lang,
  t,
}) {
  const rows = [...ranked].sort((a, b) => sortValue(b, heatmapSortMetric, ranked) - sortValue(a, heatmapSortMetric, ranked)).slice(0, 10)
  const selectedMetricKey = GAS_METRICS.some(metric => metric.key === selectedMetric) ? selectedMetric : "primaryUptake"
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <SectionTitle>{text(lang, "可诊断指标热力图", "Diagnostic Metric Heatmap")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {text(lang, "支持 normalized / raw / weighted contribution；点击单元格查看指标诊断。", "Switch normalized / raw / weighted contribution views; click a cell to inspect the metric.")}
          </div>
        </div>
        <BasisBadge tone="info">{heatmapView}</BasisBadge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 9, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "视图", "View")}</span>
          <select aria-label={text(lang, "选择热力图视图模式", "Select heatmap view mode")} value={heatmapView} onChange={event => setHeatmapView(event.target.value)} style={{ minHeight: 40, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 10px" }}>
            <option value="normalized">{text(lang, "Normalized 归一化", "Normalized view")}</option>
            <option value="raw">{text(lang, "Raw 原始值", "Raw value view")}</option>
            <option value="weighted">{text(lang, "Weighted 贡献值", "Weighted contribution view")}</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850, textTransform: "uppercase" }}>{text(lang, "排序", "Sort")}</span>
          <select aria-label={text(lang, "选择热力图排序指标", "Select heatmap sort metric")} value={heatmapSortMetric} onChange={event => setHeatmapSortMetric(event.target.value)} style={{ minHeight: 40, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, padding: "8px 10px" }}>
            <option value="GasScore">GasScore</option>
            {GAS_METRICS.map(metric => <option key={metric.key} value={metric.key}>{text(lang, metric.labelZh, metric.label)}</option>)}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 12, overflowX: "auto", maxWidth: "100%" }}>
        {!rows.length ? (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, padding: 12 }}>{text(lang, "当前气体对暂无候选。", "No candidates for this gas pair.")}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `minmax(160px, 1.2fr) repeat(${GAS_METRICS.length}, minmax(86px, 1fr))`, gap: 3, minWidth: 770 }}>
            <div />
            {GAS_METRICS.map(metric => {
              const active = selectedMetric === metric.key
              return (
                <button key={metric.key} type="button" onClick={() => setSelectedMetric(metric.key)} aria-label={text(lang, `切换热力图指标：${metric.labelZh}`, `Switch heatmap metric: ${metric.label}`)} title={text(lang, metric.labelZh, metric.label)} style={{ background: active ? t.badgeInfoBg : "transparent", border: `1px solid ${active ? t.accent : "transparent"}`, borderRadius: 7, color: active ? t.textStrong : t.faint, cursor: "pointer", fontSize: 10.5, fontWeight: 850, minHeight: 36, padding: "5px 4px" }}>
                  {text(lang, metric.labelZh, metric.label)}
                </button>
              )
            })}
            {rows.map(row => (
              <Fragment key={row.id}>
                <button key={`${row.id}-name`} type="button" onClick={() => onSelectCell(row, selectedMetricKey)} style={{ background: row.id === selectedId ? t.badgeInfoBg : t.surface, border: `1px solid ${row.id === selectedId ? t.accent : t.border}`, borderRadius: 7, color: t.textStrong, cursor: "pointer", display: "grid", gap: 3, fontSize: 11.5, fontWeight: 850, minHeight: 58, padding: 8, textAlign: "left" }}>
                  <ChemicalText value={row.displayName} />
                  <small style={{ color: t.subtle, fontWeight: 600 }}>{dataStatus(row, lang)} · {formatScore100(row.score, lang)}</small>
                </button>
                {GAS_METRICS.map(metric => {
                  const active = selectedMetric === metric.key
                  return (
                    <button key={`${row.id}-${metric.key}`} type="button" onClick={() => onSelectCell(row, metric.key)} aria-label={text(lang, `查看 ${row.displayName} 的 ${metric.labelZh} 指标诊断`, `Inspect ${metric.label} for ${row.displayName}`)} title={text(lang, `查看 ${metric.labelZh}`, `Inspect ${metric.label}`)} style={{ background: backgroundFor(row, metric.key, heatmapView, ranked, t), border: `1px solid ${row.id === selectedId || active ? t.accent : t.border}`, borderRadius: 7, color: t.textStrong, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 850, minHeight: 58, padding: 7, textAlign: "center" }}>
                      {cellValue(row, metric.key, heatmapView, ranked, lang)}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {GAS_METRICS.map(metric => <span key={metric.key} style={{ alignItems: "center", color: t.subtle, display: "inline-flex", fontSize: 10.5, gap: 5 }}><i style={{ background: CONTRIBUTION_COLORS[metric.scoreKey], borderRadius: 999, height: 8, width: 8 }} />{text(lang, metric.labelZh, metric.label)}</span>)}
      </div>
    </section>
  )
}
