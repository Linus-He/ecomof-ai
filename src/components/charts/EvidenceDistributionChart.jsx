import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useT, useLang } from "../../contexts"

export function EvidenceDistributionChart({ data = [] }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: 13, minWidth: 0 }}>
      <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 850 }}>{lang === "zh" ? "Evidence Level Distribution" : "Evidence Level Distribution"}</div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.5, marginTop: 5 }}>
        {lang === "zh" ? "证据等级表示候选结果由数据或规则假设支持的强弱。" : "Evidence level indicates how strongly each candidate is supported by data or assumptions."}
      </div>
      <div style={{ height: 240, minWidth: 280, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 58 }}>
            <CartesianGrid stroke={t.divider} vertical={false} />
            <XAxis dataKey="level" angle={-30} textAnchor="end" interval={0} tick={{ fill: t.subtle, fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fill: t.faint, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
            <Bar dataKey="count" fill={t.validationAccent || t.accent} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
