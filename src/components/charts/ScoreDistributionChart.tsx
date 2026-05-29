// @ts-nocheck
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useT, useLang } from "../../contexts"

export function ScoreDistributionChart({ data = [] }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{lang === "zh" ? "评分分布" : "Score Distribution"}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
        {lang === "zh" ? "分数分布用于观察候选材料之间的评分是否具有区分度。" : "Score distribution shows whether candidate scores are well separated or clustered."}
      </div>
      <div style={{ height: 240, minWidth: 260, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 28 }}>
            <CartesianGrid stroke={t.divider} vertical={false} />
            <XAxis dataKey="range" tick={{ fill: t.subtle, fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fill: t.faint, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
            <Bar dataKey="count" fill={t.accent} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
