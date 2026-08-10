import { asArray, ChartFrame, EmptyState, fmt, palette, text } from "./shared"

export function DescriptorContributionBar({ model, routeId = "", lang = "zh" }) {
  const candidate = asArray(model?.candidates).find(row => row.routeId === routeId)
    || asArray(model?.candidates)[0]
  const rows = asArray(candidate?.contributions)
  if (!candidate || !rows.length) {
    return (
      <ChartFrame testId="descriptor-contribution-bar" rowCount={0} title={text(lang, "逐描述符贡献", "Per-descriptor contribution")}>
        <EmptyState lang={lang} />
      </ChartFrame>
    )
  }
  const maxAbs = Math.max(0.001, ...rows.map(row => Math.abs(Number(row.relativeContribution) || 0)))
  return (
    <ChartFrame
      testId="descriptor-contribution-bar"
      rowCount={rows.length}
      title={text(lang, "逐描述符贡献条", "Per-descriptor contribution bars")}
      subtitle={`${candidate.routeName} · ${text(lang, "原始分解为 weight × ln(factor)；正负色表示相对该路线平均贡献。", "Raw decomposition is weight × ln(factor); sign colors show deviation from the route-average contribution.")}`}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map(row => {
          const relative = Number(row.relativeContribution) || 0
          const positive = relative >= 0
          const width = `${Math.max(2, Math.round(Math.abs(relative) / maxAbs * 50))}%`
          return (
            <div key={row.factorKey} data-testid="descriptor-contribution-row" data-factor-key={row.factorKey} style={{ display: "grid", gap: 4 }}>
              <div style={{ alignItems: "baseline", display: "grid", gap: 8, gridTemplateColumns: "minmax(130px, 1fr) auto auto" }}>
                <strong style={{ color: palette.text, fontSize: 11.5 }}>{text(lang, row.labelZh, row.labelEn)}</strong>
                <span style={{ color: palette.muted, fontSize: 10.8 }}>factor {fmt(row.factorValue, 3)} · weight {fmt(row.weight, 2)}</span>
                <span style={{ color: positive ? palette.positive : palette.risk, fontSize: 10.8, fontWeight: 900 }}>{fmt(row.logContribution, 5)}</span>
              </div>
              <div style={{ background: palette.surfaceStrong, border: `1px solid ${palette.border}`, borderRadius: 6, height: 12, overflow: "hidden", position: "relative" }}>
                <span style={{ background: palette.borderStrong, height: "100%", left: "50%", position: "absolute", width: 1 }} />
                <span style={{
                  background: positive ? palette.positive : palette.risk,
                  borderRadius: 6,
                  height: "100%",
                  left: positive ? "50%" : `calc(50% - ${width})`,
                  position: "absolute",
                  width,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}

export default DescriptorContributionBar
