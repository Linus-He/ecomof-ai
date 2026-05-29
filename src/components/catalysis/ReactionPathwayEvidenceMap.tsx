// @ts-nocheck
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import { formatScore, pct } from "./evidenceScoring"

const categoryColors = {
  "Organic acid formation": "#2563eb",
  "Hydrogenation": "#15803d",
  "Electrochemical CO₂ conversion": "#be123c",
  "Biomass-assisted conversion": "#64748b",
  "Cyclic carbonate formation": "#0f766e",
  "Photocatalytic conversion": "#7c3aed",
  "CO₂ to formate": "#2563eb",
  "CO₂ to acetate": "#0f766e",
  "CO₂ to lactate": "#b45309",
  "CO₂ to glycolate": "#7c3aed",
  "CO₂ hydrogenation": "#15803d",
  "Electrochemical CO₂ reduction": "#be123c",
  "Biomass-assisted CO₂ conversion": "#64748b",
}

function safeLabel(value, fallback = "unknown") {
  return value || fallback
}

function displayChemLabel(value) {
  return safeLabel(value)
    .replace(/CO2/g, "CO₂")
    .replace(/CH4/g, "CH₄")
    .replace(/N2/g, "N₂")
    .replace(/C2H2/g, "C₂H₂")
    .replace(/C2H4/g, "C₂H₄")
    .replace(/HCO3[−-]/g, "HCO₃⁻")
}

function categoryColor(value, t) {
  return categoryColors[displayChemLabel(value)] || categoryColors[value] || t.accent
}

function FilterSelect({ label, value, options, onChange, t }) {
  return (
    <label style={{ color: t.faint, display: "grid", fontSize: 10.5, fontWeight: 850, gap: 4, minWidth: 0, textTransform: "uppercase" }}>
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          color: t.text,
          fontSize: 11.5,
          minHeight: 34,
          minWidth: 0,
          padding: "6px 8px",
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function TooltipBody({ active, payload, t, lang }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const zh = lang === "zh"
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10, maxWidth: 310, padding: 11, whiteSpace: "normal" }}>
      <div style={{ color: t.textStrong, fontSize: 12.5, fontWeight: 900, lineHeight: 1.35 }}>{displayChemLabel(row.pathwayName)}</div>
      <div style={{ color: t.faint, fontSize: 10.5, lineHeight: 1.35, marginTop: 4 }}>
        {displayChemLabel(row.mainProduct)} · {displayChemLabel(row.catalyst)}
      </div>
      <div style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.55, marginTop: 7 }}>
        {zh ? "性能潜力" : "Performance potential"}: {formatScore(row.performancePotential)}<br />
        {zh ? "证据成熟度" : "Evidence readiness"}: {formatScore(row.evidenceReadiness)}<br />
        {zh ? "数据覆盖率" : "Data coverage"}: {pct(row.dataCoverage)}<br />
        {zh ? "证据" : "Evidence"}: {safeLabel(row.evidenceLevel)} · {safeLabel(row.sourceType)}<br />
        {zh ? "可比性" : "Comparability"}: {safeLabel(row.comparabilityStatus)}
        <br />
        {zh ? "验证状态" : "Validation"}: {safeLabel(row.validationStatus)}
      </div>
      {row.missingFields?.length ? (
        <div style={{ color: t.warn, fontSize: 11, lineHeight: 1.45, marginTop: 7 }}>
          {zh ? "缺失" : "Missing"}: {row.missingFields.slice(0, 4).join(", ")}
        </div>
      ) : null}
    </div>
  )
}

function optionList(records, key, allLabel) {
  const values = Array.from(new Set(records.map(row => row[key]).filter(Boolean))).sort()
  return [{ value: "all", label: allLabel }, ...values.map(value => ({ value, label: displayChemLabel(value) }))]
}

function validationOpacity(row) {
  if (["validated", "literature", "real_seed", "experimental"].includes(row.evidenceLevel)) return 0.95
  if (row.evidenceLevel === "derived" || row.evidenceLevel === "rule-based") return 0.72
  return 0.48
}

function SummaryMetric({ label, value, note, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: "9px 10px" }}>
      <div style={{ color: t.textStrong, fontSize: 17, fontWeight: 920, lineHeight: 1 }}>{value}</div>
      <div style={{ color: t.faint, fontSize: 10, fontWeight: 850, lineHeight: 1.25, marginTop: 5, textTransform: "uppercase" }}>{label}</div>
      {note ? <div style={{ color: t.muted, fontSize: 10.5, lineHeight: 1.35, marginTop: 4 }}>{note}</div> : null}
    </div>
  )
}

export function ReactionPathwayEvidenceMap({
  records,
  allRecords,
  filters,
  onFilterChange,
  selectedRecordId,
  onSelectRecord,
  onClearFilters,
  t,
  lang = "en",
  isMobile,
}) {
  const zh = lang === "zh"
  const fullRecords = Array.isArray(allRecords) ? allRecords : []
  const chartRecords = Array.isArray(records) ? records : []
  const visibleChartRecords = chartRecords.filter(row => row.performancePotential !== null && row.evidenceReadiness !== null)
  const hiddenCount = chartRecords.length - visibleChartRecords.length
  const categories = Array.from(new Set(visibleChartRecords.map(row => row.pathwayCategory || row.pathwayName || "unknown")))
  const avg = (key) => {
    const values = visibleChartRecords.map(row => row[key]).filter(value => value !== null && value !== undefined && !Number.isNaN(Number(value)))
    if (!values.length) return null
    return values.reduce((sum, value) => sum + Number(value), 0) / values.length
  }
  const needsValidation = visibleChartRecords.filter(row => row.validationStatus === "needs_validation").length

  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 14 }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.18, textTransform: "uppercase" }}>{zh ? "路径证据图" : "Reaction Pathway Evidence Map"}</div>
        <h2 style={{ color: t.textStrong, fontSize: 20, fontWeight: 930, lineHeight: 1.2, margin: 0 }}>{zh ? "催化路径证据图" : "Reaction Pathway Evidence Map"}</h2>
        <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.55, margin: 0, maxWidth: 960 }}>
          {zh
            ? "每个点位由归一化性能指标和证据成熟度字段计算得到，用于优先级判断和数据缺口检查，不等同于已验证活性预测。"
            : "Each point is calculated from normalized performance and evidence-readiness fields for prioritization and data-gap inspection."}
        </p>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <FilterSelect label={zh ? "路径" : "Pathway"} value={filters.pathwayCategory} options={optionList(fullRecords, "pathwayCategory", zh ? "全部路径" : "All pathways")} onChange={value => onFilterChange("pathwayCategory", value)} t={t} />
        <FilterSelect label={zh ? "证据" : "Evidence"} value={filters.evidenceLevel} options={optionList(fullRecords, "evidenceLevel", zh ? "全部证据" : "All evidence")} onChange={value => onFilterChange("evidenceLevel", value)} t={t} />
        <FilterSelect label={zh ? "产物" : "Product"} value={filters.productType} options={optionList(fullRecords, "productType", zh ? "全部产物" : "All products")} onChange={value => onFilterChange("productType", value)} t={t} />
        <FilterSelect label={zh ? "可比性" : "Comparability"} value={filters.comparabilityStatus} options={optionList(fullRecords, "comparabilityStatus", zh ? "全部状态" : "All statuses")} onChange={value => onFilterChange("comparabilityStatus", value)} t={t} />
        <FilterSelect label={zh ? "验证" : "Validation"} value={filters.validationStatus} options={optionList(fullRecords, "validationStatus", zh ? "全部验证状态" : "All validation")} onChange={value => onFilterChange("validationStatus", value)} t={t} />
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" }}>
        <SummaryMetric label={zh ? "可见记录" : "Visible records"} value={`${visibleChartRecords.length}/${fullRecords.length}`} note={hiddenCount ? (zh ? `${hiddenCount} 条因评分字段不足隐藏` : `${hiddenCount} hidden: incomplete scoring fields`) : (zh ? "筛选会同步图表与详情" : "filters update chart and inspector")} t={t} />
        <SummaryMetric label={zh ? "平均潜力" : "Avg potential"} value={formatScore(avg("performancePotential"))} note={zh ? "按可用字段加权" : "available weighted average"} t={t} />
        <SummaryMetric label={zh ? "平均证据成熟度" : "Avg readiness"} value={formatScore(avg("evidenceReadiness"))} note={zh ? "证据 + 完整度" : "evidence + completeness"} t={t} />
        <SummaryMetric label={zh ? "需要验证" : "Needs validation"} value={needsValidation} note={zh ? "仍需实验闭环" : "records still require validation"} t={t} />
      </div>

      <div style={{ minWidth: 0, overflowX: "auto" }}>
        <div style={{ minWidth: isMobile ? 620 : 0 }}>
          {visibleChartRecords.length ? (
            <ResponsiveContainer width="100%" height={isMobile ? 370 : 430} minHeight={isMobile ? 370 : 430}>
              <ScatterChart margin={{ top: 22, right: 28, bottom: 58, left: 74 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                <ReferenceLine x={0.5} stroke={t.borderStrong || t.border} strokeDasharray="5 4" />
                <ReferenceLine y={0.5} stroke={t.borderStrong || t.border} strokeDasharray="5 4" />
                <XAxis
                  type="number"
                  dataKey="performancePotential"
                  domain={[0, 1]}
                  tick={{ fill: t.subtle, fontSize: 11 }}
                  label={{ value: zh ? "归一化性能潜力" : "Normalized Performance Potential", fill: t.subtle, fontSize: 12, position: "bottom", offset: 38 }}
                />
                <YAxis
                  type="number"
                  dataKey="evidenceReadiness"
                  domain={[0, 1]}
                  tick={{ fill: t.subtle, fontSize: 11 }}
                  width={72}
                  label={{ value: zh ? "证据成熟度" : "Evidence Readiness", fill: t.subtle, fontSize: 12, angle: -90, position: "left" }}
                />
                <ZAxis type="number" dataKey="dataCoverage" range={[90, 390]} />
                <Tooltip content={<TooltipBody t={t} lang={lang} />} cursor={{ stroke: t.accent, strokeDasharray: "3 3" }} allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{ zIndex: 20 }} />
                {categories.map(category => {
                  const rows = visibleChartRecords.filter(row => (row.pathwayCategory || row.pathwayName || "unknown") === category)
                  return (
                    <Scatter key={category} name={displayChemLabel(category)} data={rows} onClick={(point) => onSelectRecord?.(point?.payload || point)}>
                      {rows.map(row => {
                        const warning = row.missingFields?.length > 0 || row.comparabilityStatus === "not_directly_comparable"
                        const selected = row.id === selectedRecordId
                        return (
                          <Cell
                            key={row.id}
                            fill={categoryColor(row.pathwayCategory || row.pathwayName, t)}
                            fillOpacity={validationOpacity(row)}
                            stroke={selected ? t.textStrong : warning ? t.warn : "rgba(255,255,255,0.85)"}
                            strokeWidth={selected ? 3 : warning ? 2 : 1}
                          />
                        )
                      })}
                    </Scatter>
                  )
                })}
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ alignItems: "center", background: t.surface, border: `1px dashed ${t.border}`, borderRadius: 10, color: t.muted, display: "grid", fontSize: 13, minHeight: 260, padding: 20, textAlign: "center" }}>
              {zh ? "当前筛选条件下没有匹配的路径记录。" : "No pathway records match the current filters."}
            </div>
          )}
        </div>
      </div>

      <div style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div style={{ color: t.faint, display: "flex", flexWrap: "wrap", fontSize: 11, gap: 10, lineHeight: 1.45 }}>
          <span>{zh ? "参考线：x = 0.5, y = 0.5" : "Reference lines: x = 0.5, y = 0.5"}</span>
          <span>{zh ? "点大小 = 数据覆盖率" : "Point size = data coverage"}</span>
          <span>{zh ? "警示描边 = 缺字段或可比性弱" : "Warning border = missing fields or weak comparability"}</span>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, cursor: "pointer", fontSize: 11.5, fontWeight: 850, padding: "7px 10px" }}
        >
          {zh ? "重置筛选" : "Clear filters"}
        </button>
      </div>
    </section>
  )
}
