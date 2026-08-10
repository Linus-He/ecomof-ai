// @ts-nocheck
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis,
} from "recharts"
import { BasisBadge, Callout, SectionTitle, SCIENTIFIC_TOKEN_FONT, chemText, ChemicalFormula } from "../../shared"

export const GAS_CHART_COLORS = ["#69A7DD", "#38BDF8", "#34D399", "#C084FC", "#F87171", "#94A3B8"]

function text(lang, zh, en) {
  return lang === "zh" ? zh : en
}

export function displayGasFormula(value = "") {
  return chemText(value)
}

export function GasFormula({ value, style }) {
  return <ChemicalFormula value={value} style={style} />
}

function conditionText(item, lang) {
  const pending = text(lang, "待补充", "Pending")
  if (!item) return pending
  const pressure = item.pressureKPa != null
    ? `${item.pressureKPa} kPa`
    : item.pressureBar != null
      ? `${item.pressureBar} bar`
      : pending
  return `${item.feedRatio || pending} · ${item.temperatureK ?? "—"} K · ${pressure} · ${item.method || pending}`
}

function FilterSelect({ label, value, options, onChange, t }) {
  return (
    <label style={{ display: "grid", gap: 5, minWidth: 0 }}>
      <span style={{ color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        style={{
          minHeight: 38,
          width: "100%",
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          color: t.text,
          fontSize: 12,
          padding: "8px 10px",
          outline: "none",
        }}
      >
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

export function GasConditionFilter({ filters, options, setFilters, clearFilters, t, lang, isMobile, isNarrow }) {
  return (
    <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <SectionTitle>{text(lang, "Condition filter", "Condition filter")}</SectionTitle>
        <button type="button" onClick={clearFilters} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "7px 10px" }}>
          {text(lang, "清空筛选", "Clear filters")}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))", gap: 10 }}>
        <FilterSelect label={text(lang, "气体体系", "Gas system")} value={filters.gasSystem} options={options.gasSystem} onChange={value => setFilters(prev => ({ ...prev, gasSystem: value }))} t={t} />
        <FilterSelect label="Feed ratio" value={filters.feedRatio} options={options.feedRatio} onChange={value => setFilters(prev => ({ ...prev, feedRatio: value }))} t={t} />
        <FilterSelect label={text(lang, "温度", "Temperature")} value={filters.temperature} options={options.temperature} onChange={value => setFilters(prev => ({ ...prev, temperature: value }))} t={t} />
        <FilterSelect label={text(lang, "压力", "Pressure")} value={filters.pressure} options={options.pressure} onChange={value => setFilters(prev => ({ ...prev, pressure: value }))} t={t} />
        <FilterSelect label={text(lang, "方法", "Method")} value={filters.method} options={options.method} onChange={value => setFilters(prev => ({ ...prev, method: value }))} t={t} />
      </div>
    </section>
  )
}

export function GasComparabilityBadge({ status, lang }) {
  return (
    <BasisBadge tone={status === "directly-comparable" ? "calc" : status === "condition-mixed" ? "warn" : "info"}>
      {status === "directly-comparable"
        ? text(lang, "directly comparable", "directly comparable")
        : status === "condition-mixed"
          ? "condition-mixed"
          : text(lang, "single condition", "single condition")}
    </BasisBadge>
  )
}

function SelectivityTooltip({ active, payload, label, t, lang }) {
  if (!active || !payload?.length) return null
  const visible = payload.filter(item => item.value != null)
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px", maxWidth: 310 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 850 }}>{text(lang, "总压力", "Total pressure")}: {label} kPa</div>
      {visible.map(item => {
        const meta = item.payload?.[`${item.dataKey}Meta`] || {}
        return (
          <div key={item.dataKey} style={{ color: item.color, fontSize: 11, lineHeight: 1.5, marginTop: 6, fontFamily: SCIENTIFIC_TOKEN_FONT }}>
            <strong>{chemText(item.dataKey)}</strong>: {item.value}
            <div style={{ color: t.subtle }}><GasFormula value={meta.gasSystem} /> · {conditionText(meta, lang)} · {meta.sourceLocation}</div>
          </div>
        )
      })}
    </div>
  )
}

export function GasSelectivityPressureChart({ chartData, mofSeries, selectedTitleContext, t, lang, isMobile }) {
  return (
    <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <SectionTitle>{text(lang, "Selectivity vs pressure", "Selectivity vs pressure")}</SectionTitle>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
        {text(lang, "标题条件：", "Title condition:")} <span style={{ fontFamily: SCIENTIFIC_TOKEN_FONT }}>{chemText(selectedTitleContext)}</span>
      </div>
      <div style={{ height: isMobile ? 270 : 330, marginTop: 12 }}>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 14, right: 20, bottom: 36, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="pressureKPa" tick={{ fill: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} label={{ value: text(lang, "总压力 / kPa", "Total gas pressure / kPa"), fill: t.subtle, fontSize: 11, dy: 22, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              <YAxis tick={{ fill: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} label={{ value: text(lang, "吸附选择性", "Adsorption selectivity"), fill: t.subtle, fontSize: 11, angle: -90, dx: -12, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              <Tooltip content={<SelectivityTooltip t={t} lang={lang} />} wrapperStyle={{ zIndex: 20 }} />
              <Legend wrapperStyle={{ color: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              {mofSeries.map((mof, index) => (
                <Line key={mof} type="linear" dataKey={mof} name={chemText(mof)} stroke={GAS_CHART_COLORS[index % GAS_CHART_COLORS.length]} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} strokeWidth={chartData.length === 1 ? 0 : 2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Callout tone="warn">{text(lang, "当前筛选下没有可绘制的数值选择性点。", "No numeric selectivity points are available for the current filters.")}</Callout>
        )}
      </div>
    </section>
  )
}

function ScatterTooltip({ active, payload, t, lang }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 11px", maxWidth: 310 }}>
      <div style={{ color: t.textStrong, fontSize: 12, fontWeight: 900 }}>{point.mofName}</div>
      <div style={{ color: t.muted, fontSize: 11, lineHeight: 1.55, marginTop: 5, fontFamily: SCIENTIFIC_TOKEN_FONT }}>
        <GasFormula value={point.gasSystem} /> · {point.feedRatio} · {point.temperatureK} K · {point.pressureKPa} kPa · {point.method}
      </div>
      <div style={{ color: t.subtle, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
        {text(lang, "吸附量", "Uptake")}: {point.uptake ?? "—"} {point.uptakeUnit || ""}<br />
        {text(lang, "选择性", "Selectivity")}: {point.selectivity ?? "—"}<br />
        {text(lang, "动态容量", "Dynamic capacity")}: {point.dynamicCapacity ?? "—"} {point.dynamicCapacityUnit || ""}<br />
        {text(lang, "位置", "Location")}: {point.sourceLocation || text(lang, "待补充", "Pending")}
      </div>
    </div>
  )
}

export function GasUptakeSelectivityScatter({ scatterPoints, evidenceGroups, t, lang, isMobile }) {
  return (
    <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <SectionTitle>{text(lang, "Uptake vs selectivity", "Uptake vs selectivity")}</SectionTitle>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginTop: 5 }}>
        {text(lang, "横轴为目标气体吸附量，纵轴为选择性，气泡大小代表动态容量（如可用）。", "X-axis is target gas uptake, Y-axis is selectivity, and bubble size represents dynamic capacity when available.")}
      </div>
      <div style={{ height: isMobile ? 285 : 350, marginTop: 12 }}>
        {scatterPoints.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 22, bottom: 38, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis type="number" dataKey="uptake" tick={{ fill: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} label={{ value: text(lang, "目标气体吸附量", "Target gas uptake"), fill: t.subtle, fontSize: 11, dy: 22, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              <YAxis type="number" dataKey="selectivity" tick={{ fill: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} label={{ value: text(lang, "选择性", "Selectivity"), fill: t.subtle, fontSize: 11, angle: -90, dx: -12, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              <ZAxis type="number" dataKey="z" range={[140, 820]} />
              <Tooltip content={<ScatterTooltip t={t} lang={lang} />} wrapperStyle={{ zIndex: 20 }} cursor={{ strokeDasharray: "3 3" }} />
              <Legend wrapperStyle={{ color: t.subtle, fontSize: 11, fontFamily: SCIENTIFIC_TOKEN_FONT }} />
              {evidenceGroups.map(([level, points], index) => (
                <Scatter key={level} name={level} data={points} fill={GAS_CHART_COLORS[index % GAS_CHART_COLORS.length]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <Callout tone="warn">{text(lang, "当前筛选下没有同时具备吸附量和选择性的点。", "No points with both uptake and selectivity are available for the current filters.")}</Callout>
        )}
      </div>
    </section>
  )
}

export function GasDataCurationPanel({ t, lang, isMobile }) {
  return (
    <section className="content-card" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
      <SectionTitle>{text(lang, "Data curation / provenance panel", "Data curation / provenance panel")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        {[
          [text(lang, "主记录文件", "Primary record file"), "public/data/mof_gas_separation_records.json", "calc"],
          [text(lang, "体系索引", "System index"), "public/data/gas_systems_demo.json", "info"],
          [text(lang, "来源索引", "Source index"), "public/data/gas_sources_demo.json", "proxy"],
        ].map(([label, value, tone]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
            <BasisBadge tone={tone}>{label}</BasisBadge>
            <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.55, marginTop: 8, overflowWrap: "anywhere" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.65, marginTop: 12 }}>
        {text(
          lang,
          "mof_gas_separation_records.json 是 GasSep 主数据源；gas_adsorption_records_demo.json 只作为角色说明/索引说明，不参与页面主记录加载。字段级 ⓘ 覆盖 selectivity、feedRatio、temperature、pressure、method、uptake、dynamicCapacity 和 sourceLocation。",
          "mof_gas_separation_records.json is the primary GasSep data source; gas_adsorption_records_demo.json is a role/index note and is not loaded as the primary record table. Field-level ⓘ covers selectivity, feedRatio, temperature, pressure, method, uptake, dynamicCapacity, and sourceLocation."
        )}
      </div>
    </section>
  )
}
