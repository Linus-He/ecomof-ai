import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

const STATUS_COLOR = {
  comparable: "#2563eb",
  "condition-normalization": "#0f766e",
  "metric-mismatch": "#ca8a04",
  "not-comparable": "#94a3b8",
}

function TooltipBody({ active, payload, lang, t }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10, maxWidth: 280, padding: 10, whiteSpace: "normal", wordBreak: "break-word" }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{lang === "zh" ? row.statusZh : row.statusEn}</div>
      <div style={{ color: t.faint, fontSize: 10, marginTop: 5 }}>
        A: {lang === "zh" ? row.taskA.taskZh : row.taskA.taskEn}<br />
        B: {lang === "zh" ? row.taskB.taskZh : row.taskB.taskEn}
      </div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>{lang === "zh" ? row.reasonZh : row.reasonEn}</div>
    </div>
  )
}

export function ComparabilityScatterQuadrant({ data, selectedComparisonId, onSelectComparison, lang, t, height = 420 }) {
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, minWidth: 0, overflow: "visible" }}>
      <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900, marginBottom: 8 }}>{lang === "zh" ? "Comparability Scatter Quadrant / 可比性坐标象限" : "Comparability Scatter Quadrant"}</div>
      <ResponsiveContainer width="100%" height={height} minHeight={height}>
        <ScatterChart margin={{ top: 20, right: 32, bottom: 40, left: 72 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={t.badgeInfoBg} fillOpacity={0.45} />
          <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill={t.surface} fillOpacity={0.6} />
          <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill={t.badgeWarnBg || t.surface} fillOpacity={0.45} />
          <ReferenceLine x={50} stroke={t.borderStrong || t.border} strokeDasharray="4 4" />
          <ReferenceLine y={50} stroke={t.borderStrong || t.border} strokeDasharray="4 4" />
          <XAxis type="number" dataKey="metricSimilarity" domain={[0, 100]} tick={{ fill: t.subtle, fontSize: 10 }} angle={-20} textAnchor="end" height={48} />
          <YAxis type="number" dataKey="conditionSimilarity" domain={[0, 100]} width={72} tick={{ fill: t.subtle, fontSize: 10 }} label={{ value: lang === "zh" ? "条件相似度" : "Condition similarity", fill: t.subtle, fontSize: 11, angle: -90, position: "left" }} />
          <ZAxis range={[110, 230]} />
          <Tooltip content={<TooltipBody lang={lang} t={t} />} cursor={{ stroke: t.accent, strokeDasharray: "3 3" }} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 20 }} />
          <Scatter data={data} name={lang === "zh" ? "任务对" : "Task pairs"} onClick={(point) => onSelectComparison?.(point?.payload || point)}>
            {data.map(item => (
              <Cell key={item.id} fill={STATUS_COLOR[item.statusKey] || t.accent} stroke={item.id === selectedComparisonId ? t.textStrong : "transparent"} strokeWidth={item.id === selectedComparisonId ? 3 : 0} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ color: t.subtle, fontSize: 13, fontWeight: 750, marginTop: 8, textAlign: "center" }}>
        {lang === "zh" ? "指标相似度" : "Metric similarity"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 6, color: t.faint, fontSize: 10, lineHeight: 1.35 }}>
        <span>{lang === "zh" ? "可比较：高指标 / 高条件" : "Comparable: high metric / high condition"}</span>
        <span>{lang === "zh" ? "条件归一化：高指标 / 低条件" : "Normalize: high metric / low condition"}</span>
        <span>{lang === "zh" ? "指标桥梁：低指标 / 高条件" : "Metric bridge: low metric / high condition"}</span>
        <span>{lang === "zh" ? "暂不可比：低指标 / 低条件" : "Not comparable: low metric / low condition"}</span>
      </div>
    </section>
  )
}
