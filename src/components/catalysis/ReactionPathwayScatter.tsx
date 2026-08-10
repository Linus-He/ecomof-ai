// @ts-nocheck
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
import { DOMAIN_COLORS } from "./catalysisData"

function TooltipBody({ active, payload, lang, t }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10, maxWidth: 280, padding: 10, whiteSpace: "normal", wordBreak: "break-word" }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900, lineHeight: 1.35 }}>{lang === "zh" ? row.taskZh : row.taskEn}</div>
      <div style={{ color: t.faint, fontSize: 10, marginTop: 6 }}>{row.domainLabel} · {row.modeLabel} · {row.quantitativeStatus}</div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>
        {row.feedstockLabel} → {row.productFamilyLabel}<br />
        {(lang === "zh" ? row.keyMetricsZh : row.keyMetricsEn).join(" · ")}<br />
        {(lang === "zh" ? row.missingBridgeMetricsZh : row.missingBridgeMetricsEn).join(" · ")}
      </div>
    </div>
  )
}

export function ReactionPathwayScatter({ data, selectedTaskId, onSelectTask, lang, t, height = 420 }) {
  const domains = Array.from(new Set(data.map(item => item.domainKey))).map(domainKey => ({
    key: domainKey,
    label: data.find(item => item.domainKey === domainKey)?.domainLabel || domainKey,
  }))
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, minWidth: 0, overflow: "visible" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <div style={{ color: t.textStrong, fontSize: 15, fontWeight: 900 }}>{lang === "zh" ? "反应路径坐标图 / Reaction Pathway Scatter" : "Reaction Pathway Scatter"}</div>
          <div style={{ color: t.faint, fontSize: 10, marginTop: 4 }}>{lang === "zh" ? "点代表催化任务或路径。" : "Each point represents a catalysis task or pathway."}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 460 }}>
          {domains.map(domain => (
            <span key={domain.key} style={{ alignItems: "center", color: t.muted, display: "inline-flex", fontSize: 10, fontWeight: 800, gap: 5, lineHeight: 1.2 }}>
              <span aria-hidden="true" style={{ background: DOMAIN_COLORS[domain.key] || t.accent, borderRadius: 6, display: "inline-block", height: 8, width: 8 }} />
              {domain.label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height} minHeight={height}>
        <ScatterChart margin={{ top: 20, right: 32, bottom: 40, left: 72 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
          <XAxis
            type="number"
            dataKey="conditionIntensity"
            domain={[0, 100]}
            tick={{ fill: t.subtle, fontSize: 12 }}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            type="number"
            dataKey="dataReadiness"
            domain={[0, 100]}
            width={72}
            tick={{ fill: t.subtle, fontSize: 12 }}
            label={{ value: lang === "zh" ? "数据就绪度" : "Data readiness", fill: t.subtle, fontSize: 13, angle: -90, position: "left" }}
          />
          <ZAxis type="number" dataKey="z" range={[70, 360]} />
          <Tooltip content={<TooltipBody lang={lang} t={t} />} cursor={{ stroke: t.accent, strokeDasharray: "3 3" }} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 20 }} />
          {domains.map(domain => (
            <Scatter
              key={domain.key}
              name={domain.label}
              data={data.filter(item => item.domainKey === domain.key)}
              fill={DOMAIN_COLORS[domain.key] || t.accent}
              onClick={(point) => onSelectTask?.(point?.payload || point)}
            >
              {data.filter(item => item.domainKey === domain.key).map(item => (
                <Cell
                  key={item.id}
                  fill={DOMAIN_COLORS[item.domainKey] || t.accent}
                  stroke={item.id === selectedTaskId ? t.textStrong : "transparent"}
                  strokeWidth={item.id === selectedTaskId ? 3 : 0}
                />
              ))}
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ color: t.subtle, fontSize: 13, fontWeight: 750, marginTop: 8, textAlign: "center" }}>
        {lang === "zh" ? "反应条件强度" : "Reaction condition intensity"}
      </div>
      <div style={{ color: t.faint, fontSize: 10, lineHeight: 1.5 }}>
        {lang === "zh"
          ? "该图仅支持早期比较；除非明确标注为已整理，坐标值为演示或待整理状态。"
          : "This chart supports early-stage comparison only; values are demo or pending curation unless explicitly marked as curated."}
      </div>
    </section>
  )
}
