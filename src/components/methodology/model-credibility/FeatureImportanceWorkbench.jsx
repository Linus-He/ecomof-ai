// @ts-nocheck
// V3.5 Feature Importance Workbench — interactive, sortable, filterable view of
// the permutation feature importance for the frozen V3.4 models. Click a bar to
// see its source; hover for the explanation; sort by importance ↑/↓.
import { useMemo, useState } from "react"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

export function FeatureImportanceWorkbench({ credibility = null, lang = "en", t, isMobile = false }) {
  const models = credibility?.featureImportance || []
  const [modelName, setModelName] = useState(credibility?.bestModel || models[0]?.model || "Random Forest")
  const [sortDir, setSortDir] = useState("desc")
  const [selected, setSelected] = useState(null)

  const active = models.find(m => m.model === modelName) || models[0]
  const rows = useMemo(() => {
    const r = [...(active?.rows || [])]
    r.sort((a, b) => (sortDir === "desc" ? b.importance - a.importance : a.importance - b.importance))
    return r
  }, [active, sortDir])

  if (!active) return null
  const max = Math.max(...rows.map(r => r.importance), 0.0001)

  return (
    <section
      id="algval-feature-importance"
      data-testid="algval-feature-importance"
      className="algorithm-validation-section"
      style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 11, display: "grid", gap: 11, minWidth: 0, padding: 14, scrollMarginTop: 118 }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Feature Importance Workbench</span>
        <h3 style={{ color: t.textStrong, fontSize: 16, margin: 0 }}>{text(lang, "特征重要性工作台", "Feature Importance Workbench")}</h3>
        <p style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
          {text(lang, "排列重要性（permutation importance）基于 V3.4 已拟合模型和内部留出集；仅展示模型实际使用的特征，不代表外部实验因果关系。", "Permutation importance uses the fitted V3.4 models and internal held-out set; it shows features used by the model and does not establish external experimental causality.")}
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {models.map(m => (
          <button key={m.model} type="button" data-testid={`fi-model-${m.model.replace(/\s+/g, "-")}`} aria-pressed={modelName === m.model} onClick={() => { setModelName(m.model); setSelected(null) }}
            style={{ background: modelName === m.model ? t.badgeInfoBg : t.surface, border: `1px solid ${modelName === m.model ? t.accent : t.border}`, borderRadius: 7, color: modelName === m.model ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.3, fontWeight: 850, minHeight: 30, padding: "5px 10px" }}>
            {m.model}
          </button>
        ))}
        <button type="button" data-testid="fi-sort-toggle" onClick={() => setSortDir(d => (d === "desc" ? "asc" : "desc"))}
          style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, cursor: "pointer", fontSize: 11.3, fontWeight: 850, marginLeft: "auto", minHeight: 30, padding: "5px 10px" }}>
          {text(lang, "重要性", "Importance")} {sortDir === "desc" ? "↓" : "↑"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {rows.map(row => (
          <button
            key={row.feature}
            type="button"
            data-testid={`fi-bar-${row.feature}`}
            title={text(lang, `${row.label}：重要性 ${row.importance}（贡献 ${Math.round(row.contribution * 100)}%）`, `${row.label}: importance ${row.importance} (contribution ${Math.round(row.contribution * 100)}%)`)}
            onClick={() => setSelected(row.feature === selected ? null : row.feature)}
            style={{ alignItems: "center", background: "transparent", border: "none", cursor: "pointer", display: "grid", gap: 8, gridTemplateColumns: isMobile ? "120px 1fr 52px" : "180px 1fr 64px", padding: 0, textAlign: "left", width: "100%" }}
          >
            <span style={{ color: t.textStrong, fontSize: 11.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>#{row.rank} {row.label}</span>
            <span style={{ background: t.surface, borderRadius: 5, display: "block", height: 16, overflow: "hidden", position: "relative" }}>
              <span style={{ background: row.feature === selected ? t.accentStrong || t.accent : t.accent, display: "block", height: "100%", width: `${Math.max(3, (row.importance / max) * 100)}%` }} />
            </span>
            <span style={{ color: t.muted, fontSize: 11, textAlign: "right" }}>{row.importance.toFixed(3)}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div data-testid="fi-source" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.3, lineHeight: 1.5, padding: 10 }}>
          {(() => { const r = rows.find(x => x.feature === selected); return text(lang,
            `来源：${active.source}。方法：${active.method}（评估集 ${active.evalSize} 条）。${r.label} 重要性 ${r.importance} ± ${r.importanceStd}，贡献占比 ${Math.round(r.contribution * 100)}%。`,
            `Source: ${active.source}. Method: ${active.method} (eval set ${active.evalSize}). ${r.label} importance ${r.importance} ± ${r.importanceStd}, contribution ${Math.round(r.contribution * 100)}%.`) })()}
        </div>
      ) : null}
    </section>
  )
}

export default FeatureImportanceWorkbench
