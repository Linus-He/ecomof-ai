// @ts-nocheck
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { useT, useLang } from "../../contexts"

export function SensitivityAnalysisChart({ data = [], dimension }) {
  const t = useT()
  const { lang } = useLang()
  const scenarios = ["-20%", "Base", "+20%"]
  const names = Array.from(new Set(data.map(item => item.name))).slice(0, 5)
  const rows = scenarios.map(scenario => {
    const row = { scenario }
    data.filter(item => item.scenario === scenario).forEach(item => {
      row[item.name] = Number(item.rank)
    })
    return row
  })
  const colors = [t.accent, t.validationAccent, t.sensitivityAccent, t.success, t.warn]
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{lang === "zh" ? "敏感性分析图" : "Sensitivity Analysis Chart"}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
        {lang === "zh" ? "敏感性分析用于检查评分权重变化后，排名靠前的候选材料是否仍然稳定。" : "Sensitivity analysis checks whether top-ranked candidates remain stable when scoring weights change."}
        {dimension ? ` ${lang === "zh" ? "当前维度" : "Dimension"}: ${dimension}.` : ""}
      </div>
      <div style={{ height: 260, minWidth: 300, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 18, left: -8, bottom: 8 }}>
            <CartesianGrid stroke={t.divider} />
            <XAxis dataKey="scenario" tick={{ fill: t.subtle, fontSize: 10 }} />
            <YAxis domain={[1, 5]} reversed allowDecimals={false} tick={{ fill: t.faint, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {names.map((name, index) => (
              <Line key={name} type="monotone" dataKey={name} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
