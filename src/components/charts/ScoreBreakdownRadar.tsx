// @ts-nocheck
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts"
import { useT, useLang } from "../../contexts"

export function ScoreBreakdownRadar({ data = [], title }) {
  const t = useT()
  const { lang } = useLang()
  const rows = data.map(item => ({ dimension: lang === "zh" ? (item.labelZh || item.dimensionZh || item.label || item.dimension) : (item.label || item.dimension), value: Number(item.value || 0) }))
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title || (lang === "zh" ? "评分维度雷达图" : "Score Breakdown Radar Chart")}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
        {lang === "zh" ? "分数拆解展示了哪些维度对最终评分贡献最大。" : "The breakdown shows which dimensions contribute most to the final score."}
      </div>
      <div style={{ height: 300, minWidth: 260, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={rows} outerRadius="72%">
            <PolarGrid stroke={t.divider} />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: t.subtle, fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: t.faint, fontSize: 9 }} />
            <Radar dataKey="value" stroke={t.accent} fill={t.accent} fillOpacity={0.25} />
            <Tooltip formatter={value => [Number(value).toFixed(1), lang === "zh" ? "评分" : "Score"]} contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
