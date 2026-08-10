// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { BasisBadge, ChemicalText, FONT_SANS, SectionTitle, formatPercent } from "../../shared"
import { GAS_METRICS, dataStatus, formatNumber, metricDisplayValue, metricInterpretation, metricNormalizedValue, text } from "./gasViewUtils"

const COLORS = ["#2F7D7B", "#4E72B8", "#B87333"]

function polygonFor(record, metrics, ranked, cx, cy, radius) {
  return metrics.map((metric, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length
    const normalized = metricNormalizedValue(record, metric.key, ranked)
    const r = normalized == null ? 0 : radius * normalized
    return {
      metric: metric.key,
      value: normalized,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (radius + 34),
      labelY: cy + Math.sin(angle) * (radius + 34),
    }
  })
}

function DetailRows({ record, ranked, lang, t }) {
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {GAS_METRICS.map(metric => {
        const normalized = metricNormalizedValue(record, metric.key, ranked)
        return (
          <div key={metric.key} style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr) 58px", gap: 8, alignItems: "center" }}>
            <span style={{ color: t.muted, fontSize: 11.5 }}>{text(lang, metric.labelZh, metric.label)}</span>
            <span style={{ display: "grid", gap: 3 }}>
              <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: 8, overflow: "hidden" }}>
                {normalized == null ? null : <span style={{ background: COLORS[0], display: "block", height: "100%", width: `${Math.round(normalized * 100)}%` }} />}
              </span>
              <span style={{ color: t.subtle, fontSize: 10.5, lineHeight: 1.35 }}>
                {metricDisplayValue(record, metric.key, lang, ranked)} · {dataStatus(record, lang)}
              </span>
            </span>
            <span style={{ color: t.textStrong, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 850, textAlign: "right" }}>{normalized == null ? "pending" : formatPercent(normalized, { lang, normalized: true })}</span>
          </div>
        )
      })}
    </div>
  )
}

function CompactComparison({ records, ranked, lang, t }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {GAS_METRICS.map(metric => (
        <div key={metric.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 12 }}>{text(lang, metric.labelZh, metric.label)}</strong>
          <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
            {records.map((record, index) => {
              const normalized = metricNormalizedValue(record, metric.key, ranked)
              return (
                <div key={record.id} style={{ display: "grid", gridTemplateColumns: "minmax(90px, 1fr) minmax(0, 1.2fr) 48px", gap: 7, alignItems: "center" }}>
                  <span style={{ color: t.muted, fontSize: 11, overflowWrap: "anywhere" }}><ChemicalText value={record.displayName} /></span>
                  <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: 8, overflow: "hidden" }}>
                    {normalized == null ? null : <span style={{ background: COLORS[index % COLORS.length], display: "block", height: "100%", width: `${Math.round(normalized * 100)}%` }} />}
                  </span>
                  <span style={{ color: t.subtle, fontFamily: FONT_SANS, fontSize: 10.5, textAlign: "right" }}>{normalized == null ? "pending" : formatPercent(normalized, { lang, normalized: true })}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function GasRadarComparison({ selectedRecord, compareRecords = [], ranked = [], lang, t, isMobile }) {
  const comparisonMode = compareRecords.length >= 2
  const records = comparisonMode ? compareRecords.slice(0, 3) : selectedRecord ? [selectedRecord] : []
  const [hidden, setHidden] = useState([])
  useEffect(() => setHidden([]), [records.map(record => record.id).join("|")])
  const visibleRecords = records.filter(record => !hidden.includes(record.id))
  const cx = 172
  const cy = 158
  const radius = 112
  const polygons = useMemo(() => visibleRecords.map((record, index) => ({
    record,
    color: COLORS[index % COLORS.length],
    points: polygonFor(record, GAS_METRICS, ranked, cx, cy, radius),
  })), [visibleRecords, ranked])

  const selected = records[0]
  const strongest = selected ? [...GAS_METRICS].sort((a, b) => (metricNormalizedValue(selected, b.key, ranked) || 0) - (metricNormalizedValue(selected, a.key, ranked) || 0))[0] : null
  const weakest = selected ? [...GAS_METRICS].sort((a, b) => (metricNormalizedValue(selected, a.key, ranked) || 0) - (metricNormalizedValue(selected, b.key, ranked) || 0))[0] : null

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <SectionTitle>{comparisonMode ? text(lang, "多候选雷达对比", "Radar Profile Comparison") : text(lang, "Radar Profile", "Radar Profile")}</SectionTitle>
          <div style={{ color: t.faint, fontSize: 11.5, lineHeight: 1.55, marginTop: 5 }}>
            {comparisonMode
              ? text(lang, "Compare 勾选 2-3 个 MOF 时自动叠加；点击图例可隐藏/显示候选。", "When 2-3 MOFs are checked, profiles are overlaid; click legend items to hide/show.")
              : text(lang, "显示 selected MOF 的 normalized value、raw value 与数据状态。", "Shows normalized value, raw value, and data status for the selected MOF.")}
          </div>
        </div>
        <BasisBadge tone={comparisonMode ? "info" : "proxy"}>{comparisonMode ? "comparison mode" : "single candidate"}</BasisBadge>
      </div>

      {!records.length ? (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, marginTop: 12, padding: 12 }}>
          {text(lang, "未选中候选。", "No candidate selected.")}
        </div>
      ) : comparisonMode && isMobile ? (
        <div style={{ marginTop: 12 }}><CompactComparison records={records} ranked={ranked} lang={lang} t={t} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: comparisonMode ? "minmax(0, 360px) minmax(0, 1fr)" : "minmax(0, 350px) minmax(0, 1fr)", gap: 12, alignItems: "center", marginTop: 12 }}>
          <svg viewBox="0 0 344 312" style={{ maxWidth: 360, width: "100%" }} role="img" aria-label="Gas separation radar comparison">
            {[0.25, 0.5, 0.75, 1].map(part => <circle key={part} cx={cx} cy={cy} r={radius * part} fill="none" stroke={t.divider} strokeDasharray="3 4" />)}
            {GAS_METRICS.map((metric, index) => {
              const angle = -Math.PI / 2 + (Math.PI * 2 * index) / GAS_METRICS.length
              const labelX = cx + Math.cos(angle) * (radius + 34)
              const labelY = cy + Math.sin(angle) * (radius + 34)
              return (
                <g key={metric.key}>
                  <line x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} stroke={t.divider} />
                  <text x={labelX} y={labelY} textAnchor={labelX < cx ? "end" : labelX > cx ? "start" : "middle"} fill={t.subtle} fontSize="10.5">{text(lang, metric.labelZh, metric.label)}</text>
                </g>
              )
            })}
            {polygons.map(({ record, color, points }) => (
              <polygon key={record.id} points={points.map(point => `${point.x},${point.y}`).join(" ")} fill={color} fillOpacity="0.14" stroke={color} strokeWidth="2" />
            ))}
          </svg>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {records.map((record, index) => {
                const off = hidden.includes(record.id)
                return (
                  <button key={record.id} type="button" onClick={() => setHidden(prev => off ? prev.filter(id => id !== record.id) : [...prev, record.id])} aria-label={off ? text(lang, `显示 ${record.displayName} 雷达图`, `Show ${record.displayName} radar profile`) : text(lang, `隐藏 ${record.displayName} 雷达图`, `Hide ${record.displayName} radar profile`)} style={{ alignItems: "center", background: off ? t.surface : t.badgeInfoBg, border: `1px solid ${off ? t.border : COLORS[index % COLORS.length]}`, borderRadius: 6, color: t.textStrong, cursor: "pointer", display: "inline-flex", fontSize: 11.5, gap: 6, minHeight: 40, padding: "7px 10px" }}>
                    <span style={{ background: COLORS[index % COLORS.length], borderRadius: 6, height: 9, width: 9 }} />
                    <ChemicalText value={record.displayName} />
                    <small style={{ color: t.subtle }}>{dataStatus(record, lang)}</small>
                  </button>
                )
              })}
            </div>
            {comparisonMode ? (
              <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.58 }}>
                {text(lang, "多候选叠加用于观察 trade-off；数据类型标签保留在图例中。", "Overlay comparison is for trade-off inspection; data-type labels remain visible in the legend.")}
              </div>
            ) : <DetailRows record={selectedRecord} ranked={ranked} lang={lang} t={t} />}
            {selected ? (
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 12, lineHeight: 1.58, padding: 10 }}>
                {text(
                  lang,
                  `该候选的 ${text(lang, strongest?.labelZh, strongest?.label)} 表现最突出，${text(lang, weakest?.labelZh, weakest?.label)} 相对较弱，说明它需要结合验证优先级判断是否进入工程候选。`,
                  `This candidate is strongest in ${strongest?.label} and weaker in ${weakest?.label}, so validation priority should decide whether it moves toward process-level prioritization.`
                )}{" "}
                {metricInterpretation(selected, weakest?.key, lang, ranked)}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
