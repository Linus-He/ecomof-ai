import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import { DOMAIN_COLORS, PRODUCT_FAMILIES, X_METRIC_OPTIONS, Y_METRIC_OPTIONS } from "./catalysisData"

function AxisSelect({ label, value, options, onChange, lang, t }) {
  return (
    <label style={{ display: "grid", gap: 4, color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 11, minHeight: 34, padding: "6px 8px" }}
      >
        {options.map(option => <option key={option.key} value={option.key}>{lang === "zh" ? option.zh : option.en}</option>)}
      </select>
    </label>
  )
}

function TooltipBody({ active, payload, lang, t, xMetric, yMetric }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10, maxWidth: 300, padding: 10 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.taskZh : row.taskEn}</div>
      <div style={{ color: t.faint, fontSize: 10, marginTop: 5 }}>{row.productFamilyLabel} · {row.quantitativeStatus}</div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>
        X: {row.demoMetrics[xMetric] ?? "pending"} · Y: {row.demoMetrics[yMetric] ?? "pending"}<br />
        {(lang === "zh" ? row.keyMetricsZh : row.keyMetricsEn).join(" · ")}
      </div>
    </div>
  )
}

export function ProductMetricScatter({
  data,
  selectedTaskId,
  selectedProduct,
  xMetric,
  yMetric,
  onXMetricChange,
  onYMetricChange,
  onProductChange,
  onSelectTask,
  lang,
  t,
}) {
  const chartData = data
    .filter(item => selectedProduct === "all" || item.productFamilyKey === selectedProduct)
    .map(item => ({
      ...item,
      xValue: item.demoMetrics[xMetric] ?? null,
      yValue: item.demoMetrics[yMetric] ?? null,
    }))
    .filter(item => item.xValue != null && item.yValue != null)
  const xLabel = X_METRIC_OPTIONS.find(item => item.key === xMetric)
  const yLabel = Y_METRIC_OPTIONS.find(item => item.key === yMetric)
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, minWidth: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 8 }}>
        <AxisSelect label={lang === "zh" ? "X 轴指标" : "X-axis metric"} value={xMetric} options={X_METRIC_OPTIONS} onChange={onXMetricChange} lang={lang} t={t} />
        <AxisSelect label={lang === "zh" ? "Y 轴指标" : "Y-axis metric"} value={yMetric} options={Y_METRIC_OPTIONS} onChange={onYMetricChange} lang={lang} t={t} />
        <AxisSelect label={lang === "zh" ? "产物族" : "Product family"} value={selectedProduct} options={PRODUCT_FAMILIES} onChange={onProductChange} lang={lang} t={t} />
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 14, right: 22, bottom: 38, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis type="number" dataKey="xValue" domain={[0, 100]} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: lang === "zh" ? xLabel?.zh : xLabel?.en, fill: t.subtle, fontSize: 11, dy: 28 }} />
          <YAxis type="number" dataKey="yValue" domain={[0, 100]} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: lang === "zh" ? yLabel?.zh : yLabel?.en, fill: t.subtle, fontSize: 11, angle: -90, dx: -18 }} />
          <ZAxis range={[90, 260]} />
          <Tooltip content={<TooltipBody lang={lang} t={t} xMetric={xMetric} yMetric={yMetric} />} cursor={{ stroke: t.accent, strokeDasharray: "3 3" }} />
          <Scatter name={lang === "zh" ? "产物指标" : "Product metrics"} data={chartData} onClick={(point) => onSelectTask?.(point?.payload || point)}>
            {chartData.map(item => (
              <Cell key={item.id} fill={DOMAIN_COLORS[item.domainKey] || t.accent} stroke={item.id === selectedTaskId ? t.textStrong : "transparent"} strokeWidth={item.id === selectedTaskId ? 3 : 0} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5 }}>
        {lang === "zh"
          ? "产物指标坐标用于展示比较结构；数值为 Demo / Pending curation，不能作为真实性能结论。"
          : "Product metric axes show comparison structure; values are Demo / Pending curation and are not real performance conclusions."}
      </div>
    </section>
  )
}
