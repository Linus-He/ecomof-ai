// @ts-nocheck
import { BasisBadge, ChemicalText, SectionTitle, formatGasPairLabel } from "../../shared"
import { gasMethodScoreLabel, getParetoFrontier } from "../../utils/gasSeparationScreening"
import { finite, metricNormalizedValue, text } from "./gasViewUtils"

function pickMax(rows, metric) {
  return [...rows].sort((a, b) => (metricNormalizedValue(b, metric, rows) || 0) - (metricNormalizedValue(a, metric, rows) || 0))[0]
}

export function GasTradeoffSummary({ ranked = [], scenario = {}, lang, t }) {
  if (!ranked.length) {
    return (
      <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
        <SectionTitle>{text(lang, "Gas trade-off 摘要", "Gas Trade-off Summary")}</SectionTitle>
        <div style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>{text(lang, "当前场景无候选。", "No candidates for this scenario.")}</div>
      </section>
    )
  }
  const balanced = ranked[0]
  const selectivity = pickMax(ranked, "selectivity")
  const capacity = pickMax(ranked, "workingCapacity")
  const plottable = ranked.filter(row => finite(row.workingCapacity ?? row.metrics?.workingCapacity) !== null && finite(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity) !== null).slice(0, 160)
  const pareto = getParetoFrontier(plottable)
  const paretoIds = new Set(pareto.map(row => row.id))
  const width = 640
  const height = 310
  const margin = { top: 18, right: 20, bottom: 44, left: 58 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const xValues = plottable.map(row => finite(row.workingCapacity ?? row.metrics?.workingCapacity)).filter(value => value !== null)
  const yValues = plottable.map(row => finite(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity)).filter(value => value !== null)
  const maxX = Math.max(1, ...xValues)
  const maxY = Math.max(1, ...yValues)
  const x = value => margin.left + (Number(value) / maxX) * plotW
  const y = value => margin.top + plotH - (Number(value) / maxY) * plotH
  const colorFor = row => row.dataGrade === "experimental" ? "#2F7D7B" : row.dataGrade === "computed" || row.dataGrade === "computed-IAST" ? "#4E72B8" : "#7B61A9"
  const paretoPath = pareto.map(row => `${x(row.workingCapacity ?? row.metrics?.workingCapacity)},${y(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity)}`).join(" ")
  const regenGap = Math.abs((metricNormalizedValue(selectivity, "selectivity", ranked) || 0) - (metricNormalizedValue(selectivity, "regenerability", ranked) || 0))
  const mainTradeoff = regenGap > 0.34
    ? text(lang, "选择性与可再生性之间存在明显权衡。", "There is a clear trade-off between selectivity and regenerability.")
    : text(lang, "当前候选更接近均衡型排序，但仍需证据等级校正。", "The current set is closer to balanced ranking, but still needs evidence adjustment.")
  const validationPriority = String(balanced?.dataType || "").includes("simulated")
    ? text(lang, "IAST 验证 / 穿透实验", "IAST validation / breakthrough experiment")
    : text(lang, "GCMC 模拟 / 证据升级", "GCMC simulation / evidence upgrade")

  const cards = [
    [text(lang, "当前方法首位", "Top by current method"), balanced.displayName, gasMethodScoreLabel(balanced, balanced.gasScreening?.methodId, lang), "calc"],
    [text(lang, "选择性最高候选", "Highest selectivity candidate"), selectivity.displayName, `${selectivity.selectivity}`, "info"],
    [text(lang, "工作容量最高候选", "Highest working capacity candidate"), capacity.displayName, `${capacity.workingCapacity} mmol/g`, "proxy"],
    [text(lang, "验证优先级", "Validation priority"), validationPriority, formatGasPairLabel(scenario.gasPair || balanced.gasPair), "warn"],
  ]

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <SectionTitle>{text(lang, "Gas trade-off 摘要", "Gas Trade-off Summary")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 12 }}>
        {cards.map(([label, value, note, tone]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <BasisBadge tone={tone}>{label}</BasisBadge>
            <div style={{ color: t.textStrong, fontSize: 14, fontWeight: 900, lineHeight: 1.25, marginTop: 8, overflowWrap: "anywhere" }}><ChemicalText value={value} /></div>
            <div style={{ color: t.subtle, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}><ChemicalText value={note} /></div>
          </div>
        ))}
      </div>
      <div style={{ background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 9, color: t.muted, fontSize: 12, lineHeight: 1.6, marginTop: 12, padding: 11 }}>
        {text(
          lang,
          `当前候选集中，${balanced.displayName} 是所选排序方法下的首位候选；${selectivity.displayName} 选择性突出，但仍需结合工作容量、可再生性、证据等级和过程级验证。建议优先对 ${balanced.displayName} 进行 IAST 或穿透曲线验证，同时保留 ${selectivity.displayName} 作为高选择性机理候选。`,
          `In the current candidate set, ${balanced.displayName} is first under the selected ranking method. ${selectivity.displayName} shows strong selectivity, but still needs working-capacity, regenerability, evidence-level, and process-level checks. Prioritize IAST or breakthrough validation for ${balanced.displayName}, while keeping ${selectivity.displayName} as a high-selectivity mechanistic candidate.`
        )}{" "}
        {mainTradeoff}
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, marginTop: 12, padding: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "选择性 vs 工作容量", "Selectivity vs Working Capacity")}</strong>
          <span style={{ color: t.faint, fontSize: 11 }}>{text(lang, `帕累托前沿 ${pareto.length} / 可绘制 ${plottable.length}`, `Pareto frontier ${pareto.length} / plottable ${plottable.length}`)}</span>
        </div>
        {plottable.length ? (
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="selectivity working capacity tradeoff" style={{ display: "block", width: "100%", height: 320 }}>
            <rect x={margin.left} y={margin.top} width={plotW} height={plotH} rx="6" fill={t.panel} stroke={t.border} />
            {[0, 0.25, 0.5, 0.75, 1].map(tick => (
              <g key={tick}>
                <line x1={margin.left + tick * plotW} x2={margin.left + tick * plotW} y1={margin.top} y2={margin.top + plotH} stroke={t.divider} strokeDasharray="3 4" />
                <line x1={margin.left} x2={margin.left + plotW} y1={margin.top + tick * plotH} y2={margin.top + tick * plotH} stroke={t.divider} strokeDasharray="3 4" />
                <text x={margin.left + tick * plotW} y={height - 18} textAnchor="middle" fill={t.subtle} fontSize="10">{(maxX * tick).toFixed(1)}</text>
                <text x={margin.left - 8} y={margin.top + plotH - tick * plotH + 4} textAnchor="end" fill={t.subtle} fontSize="10">{(maxY * tick).toFixed(0)}</text>
              </g>
            ))}
            {paretoPath ? <polyline points={paretoPath} fill="none" stroke={t.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {plottable.map(row => {
              const px = x(row.workingCapacity ?? row.metrics?.workingCapacity)
              const py = y(row.selectivity ?? row.metrics?.selectivity ?? row.iaSTSelectivity ?? row.metrics?.iaSTSelectivity)
              const frontier = paretoIds.has(row.id)
              return row.dataGrade === "computed" || row.dataGrade === "computed-IAST" ? (
                <rect key={row.id} x={px - (frontier ? 5 : 3.5)} y={py - (frontier ? 5 : 3.5)} width={frontier ? 10 : 7} height={frontier ? 10 : 7} fill={colorFor(row)} fillOpacity={frontier ? 0.95 : 0.68} stroke={frontier ? t.textStrong : t.panel} />
              ) : (
                <circle key={row.id} cx={px} cy={py} r={frontier ? 5 : 3.6} fill={colorFor(row)} fillOpacity={frontier ? 0.95 : 0.68} stroke={frontier ? t.textStrong : t.panel} />
              )
            })}
            <text x={margin.left + plotW / 2} y={height - 4} textAnchor="middle" fill={t.subtle} fontSize="11">{text(lang, "工作容量 mmol/g", "Working capacity mmol/g")}</text>
            <text x="15" y={margin.top + plotH / 2} textAnchor="middle" transform={`rotate(-90 15 ${margin.top + plotH / 2})`} fill={t.subtle} fontSize="11">{text(lang, "选择性", "Selectivity")}</text>
          </svg>
        ) : (
          <div style={{ color: t.warn, fontSize: 12, lineHeight: 1.6 }}>{text(lang, "当前气对缺少同时具备选择性与工作容量的记录，无法绘制帕累托前沿。", "This gas pair lacks records with both selectivity and working capacity, so the Pareto frontier cannot be drawn.")}</div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <BasisBadge tone="calc">{text(lang, "圆点：实验", "circle: experimental")}</BasisBadge>
          <BasisBadge tone="info">{text(lang, "方点：计算 / IAST", "square: computed / IAST")}</BasisBadge>
          <BasisBadge tone="proxy">{text(lang, "紫色：seed", "purple: seed")}</BasisBadge>
        </div>
      </div>
    </section>
  )
}
