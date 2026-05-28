import { ORGANIC_ACID_FONT, organicAcidPalette as palette } from "./FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export const pathwayFilters = [
  { id: "all", label: "All pathways", labelZh: "全部路径" },
  { id: "formate-main", label: "Formate main pathway", labelZh: "甲酸主路径" },
  { id: "organic-acid-byproduct", label: "Organic acid by-product pathway", labelZh: "有机酸副产物路径" },
  { id: "hmf-humins", label: "HMF / Humins side pathway", labelZh: "HMF / 腐殖质副路径" },
  { id: "hco3-participation", label: "HCO3- / CO2 participation", labelZh: "HCO₃⁻ / CO₂ 参与路径" },
  { id: "mof-promoted", label: "MOF-promoted routes", labelZh: "MOF 促进路径" },
  { id: "mof-inhibited", label: "MOF-inhibited routes", labelZh: "MOF 抑制路径" },
  { id: "high-confidence", label: "High-confidence edges", labelZh: "高置信路径" },
  { id: "validation-needed", label: "Validation-needed edges", labelZh: "待验证路径" },
]

export function PathwayFilterBar({ activeFilter, onChange, lang }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {pathwayFilters.map(filter => {
        const active = activeFilter === filter.id
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            style={{
              background: active ? palette.accent : palette.surface,
              border: `1px solid ${active ? palette.accent : palette.border}`,
              borderRadius: 999,
              color: active ? "#fff" : palette.text,
              cursor: "pointer",
              flex: "0 0 auto",
              fontFamily: ORGANIC_ACID_FONT,
              fontSize: 12,
              fontWeight: 800,
              padding: "8px 11px",
              whiteSpace: "nowrap",
            }}
          >
            {text(lang, filter.labelZh, filter.label)}
          </button>
        )
      })}
    </div>
  )
}
