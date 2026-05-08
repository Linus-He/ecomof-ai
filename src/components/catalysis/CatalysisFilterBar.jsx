import {
  CATALYTIC_MODES,
  DATA_STATUSES,
  FEEDSTOCKS,
  PRODUCT_FAMILIES,
  REACTION_DOMAINS,
} from "./catalysisData"

export function CatalysisFilterBar({ filters, onChange, onClear, lang, t }) {
  const fields = [
    ["domain", lang === "zh" ? "反应领域" : "Reaction domain", REACTION_DOMAINS],
    ["mode", lang === "zh" ? "催化方式" : "Catalytic mode", CATALYTIC_MODES],
    ["feedstock", lang === "zh" ? "原料" : "Feedstock", FEEDSTOCKS],
    ["productFamily", lang === "zh" ? "产物族" : "Product family", PRODUCT_FAMILIES],
    ["dataStatus", lang === "zh" ? "数据状态" : "Data status", DATA_STATUSES],
  ]
  return (
    <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, alignItems: "end" }}>
        {fields.map(([key, label, options]) => (
          <label key={key} style={{ display: "grid", gap: 5, color: t.faint, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
            {label}
            <select
              value={filters[key]}
              onChange={event => onChange(key, event.target.value)}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                color: t.text,
                fontSize: 12,
                minHeight: 38,
                padding: "8px 10px",
                width: "100%",
              }}
            >
              {options.map(option => <option key={option.key} value={option.key}>{lang === "zh" ? option.zh : option.en}</option>)}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={onClear}
          style={{
            background: t.surface,
            border: `1px solid ${t.borderStrong || t.border}`,
            borderRadius: 8,
            color: t.subtle,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 850,
            minHeight: 38,
            padding: "8px 10px",
          }}
        >
          {lang === "zh" ? "清除筛选" : "Clear filters"}
        </button>
      </div>
    </section>
  )
}
