import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useT, useLang } from "../../contexts"

export function WeightContributionChart({ data = [] }) {
  const t = useT()
  const { lang } = useLang()
  const rows = data.map(item => ({
    dimension: lang === "zh" ? (item.dimensionZh || item.dimension) : item.dimension,
    contribution: Number(item.contribution || 0),
    weight: Number(item.weight || 0),
    normalizedScore: Number(item.normalizedScore || 0),
  }))
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{lang === "zh" ? "权重贡献图" : "Weight Contribution Chart"}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
        {lang === "zh" ? "权重贡献图解释了每个加权描述符如何影响最终评分。" : "Weight contribution explains how each weighted descriptor affects the final score."}
      </div>
      <div style={{ height: 260, minWidth: 280, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 58 }}>
            <CartesianGrid stroke={t.divider} vertical={false} />
            <XAxis dataKey="dimension" angle={-30} textAnchor="end" interval={0} tick={{ fill: t.subtle, fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: t.faint, fontSize: 10 }} />
            <Tooltip
              formatter={(value, name, item) => [
                Number(value).toFixed(1),
                `${lang === "zh" ? "贡献" : name} · w=${Number(item.payload.weight).toFixed(2)} · n=${Number(item.payload.normalizedScore).toFixed(1)}`,
              ]}
              contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }}
            />
            <Bar dataKey="contribution" fill={t.sensitivityAccent || t.accent} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
