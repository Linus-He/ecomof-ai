// @ts-nocheck
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useT, useLang } from "../../contexts"

function ChartShell({ title, description, children }) {
  const t = useT()
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{title}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>{description}</div>
      <div style={{ height: 260, minWidth: 260, marginTop: 10 }}>{children}</div>
    </div>
  )
}

export function RankingBarChart({ data = [], scoreLabel }) {
  const t = useT()
  const { lang } = useLang()
  const rows = data.slice(0, 8).map(item => ({ name: item.name, score: Number(item.score || 0) }))
  return (
    <ChartShell
      title={lang === "zh" ? "候选排名图" : "Ranking Bar Chart"}
      description={lang === "zh" ? "分数越高表示在当前规则辅助策略下候选优先级越高。" : "Higher score indicates higher candidate priority under the current rule-assisted scoring strategy."}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 16, left: 16, bottom: 4 }}>
          <CartesianGrid stroke={t.divider} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: t.faint, fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={92} tick={{ fill: t.subtle, fontSize: 10 }} />
          <Tooltip formatter={value => [Number(value).toFixed(1), scoreLabel || "Score"]} contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
          <Bar dataKey="score" fill={t.accent} radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
