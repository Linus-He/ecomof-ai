import { useState, useCallback, useRef } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS, THEME_DARK } from "../../constants/theme"
import { GAS_SYSTEMS, MOF_PRESETS } from "../../constants/catalogs"
import { headerChipBtn, headerInputStyle, toolbarBtn, darkenLayer } from "../../utils/styles"
import { findPresetName, getPresetSuggestionNames } from "../../utils/presets"
import { downloadTextFile } from "../../utils/report"
import { MetricCard } from "../ui/index.jsx"
import { gasLabel } from "../../utils/labels"

export function PresetSearchControl({
  value,
  setValue,
  status,
  setStatus,
  open,
  setOpen,
  suggestions,
  applyPreset,
  placeholder,
  width = 320,
}) {
  const t = useT()
  const { copy } = useLang()
  const borderColor = status === "miss" ? t.danger : status === "loaded" ? t.success : t.border

  return (
    <div style={{ position: "relative", minWidth: 0, width: "100%", maxWidth: width }}>
      <input
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={e => { setValue(e.target.value); setStatus(null); setOpen(true) }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const match = findPresetName(value)
            if (match) applyPreset(match)
            else if (suggestions[0]) applyPreset(suggestions[0])
            else {
              setStatus("miss")
              setOpen(false)
            }
          }
          if (e.key === "Escape") setOpen(false)
        }}
        style={{ ...headerInputStyle(t, borderColor), width: "100%", paddingRight: 40, position: "relative", zIndex: 0 }}
      />
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: t.faint, fontSize: 13, pointerEvents: "none" }}>
        ⌕
      </div>
      {open && suggestions.length > 0 && value && status !== "loaded" && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          right: 0,
          background: t.panel,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 120,
          boxShadow: t.shadowSm,
        }}>
          {suggestions.map((name, index) => (
            <button
              key={name}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => applyPreset(name)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                borderBottom: index === suggestions.length - 1 ? "none" : `1px solid ${t.divider}`,
                padding: "10px 14px",
                color: t.text,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: FONT_SANS,
              }}
            >
              {name}
              <span style={{ color: t.faint, fontSize: 10 }}>
                {" "}· {MOF_PRESETS[name].metalCenter} · {MOF_PRESETS[name].organicLinker}
              </span>
            </button>
          ))}
        </div>
      )}
      {status === "loaded" && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 14, color: t.success, fontSize: 10 }}>
          ✓ {copy.header.loaded}
        </div>
      )}
      {status === "miss" && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 14, color: t.danger, fontSize: 10 }}>
          {copy.header.miss}
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, meta, action }) {
  const t = useT()
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start",
      flexWrap: "wrap", marginBottom: 8,
    }}>
      <div>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: 32, fontWeight: 700, letterSpacing: 0, lineHeight: 1.15 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 880 }}>
            {subtitle}
          </p>
        )}
        {meta && (
          <div style={{ marginTop: 10, color: t.faint, fontSize: 11, lineHeight: 1.5 }}>
            {meta}
          </div>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{action}</div>}
    </div>
  )
}

function LayoutSectionTitle({ children }) {
  const t = useT()
  return <div style={{ color: t.subtle, fontSize: 12, fontWeight: 700, letterSpacing: 0, marginBottom: 14 }}>{children}</div>
}

export function EmptyState({ message }) {
  const t = useT()
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: 300, background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 10 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
      <div style={{ color: t.faint, fontSize: 14 }}>{message}</div>
    </div>
  )
}

export function SavedRunsModal({ runs, onClose, onLoad, onDelete, onImport, onExport }) {
  const t = useT()
  const { lang, copy: c } = useLang()
  const savedSummary = runs.reduce((acc, run) => {
    if (!run?.results || run.results.unavailable) return acc
    const selectivity = Number(run.results.selectivity || 0)
    const green = Number(run.results.lca?.compositeGreenScore || 0)
    return {
      count: acc.count + 1,
      bestSelectivity: selectivity > acc.bestSelectivity.value ? { name: run.name, value: selectivity } : acc.bestSelectivity,
      bestGreen: green > acc.bestGreen.value ? { name: run.name, value: green } : acc.bestGreen,
    }
  }, {
    count: 0,
    bestSelectivity: { name: "—", value: 0 },
    bestGreen: { name: "—", value: 0 },
  })
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const exportSavedCsv = () => {
    const header = ["Name", "Gas", "Metal", "Linker", "Primary uptake", "Secondary uptake", "Selectivity", "Eco score", "Confidence", "Created"]
    const rows = runs
      .filter(run => run?.results && !run.results.unavailable)
      .map(run => [
        run.name,
        run.results.gasSystem,
        run.inputs.metalCenter,
        run.inputs.organicLinker,
        run.results.primaryUptake,
        run.results.secondaryUptake,
        run.results.selectivity,
        run.results.lca?.compositeGreenScore ?? "",
        run.results.confidenceScore ?? "",
        run.createdAt || "",
      ])
    downloadTextFile("ecomof_saved_runs.csv", [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n"), "text/csv")
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.55)", zIndex: 220,
      display: "flex", alignItems: "flex-start", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ marginTop: 70, width: "min(760px, 94vw)",
        maxHeight: "78vh", overflow: "auto", background: t.panel, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: t.accentText, fontSize: 14, fontWeight: 800 }}>{c.common.savedRuns}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={exportSavedCsv} disabled={!savedSummary.count} style={toolbarBtn(t)}>↓ CSV</button>
            <button onClick={onExport} style={toolbarBtn(t)}>↓ {lang === "zh" ? "JSON 备份" : "JSON backup"}</button>
            <label style={toolbarBtn(t)}>
              ↑ {lang === "zh" ? "导入 JSON" : "Import JSON"}
              <input type="file" accept=".json,application/json" style={{ display: "none" }}
                onChange={e => onImport(e.target.files?.[0])} />
            </label>
            <button onClick={onClose} style={{ background: "none", border: "none", color: t.subtle, fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
        </div>
        <div style={{ color: t.faint, fontSize: 11, lineHeight: 1.55, marginBottom: 12 }}>
          {lang === "zh"
            ? "静态 GitHub Pages 没有已认证云端数据库。当前用 localStorage 保存，并提供 JSON 备份/导入和 CSV 分析导出。"
            : "Static GitHub Pages has no authenticated cloud database. Current runs use localStorage, with JSON backup/import and CSV analysis export."}
        </div>
        {runs.length === 0 ? (
          <div style={{ color: t.faint, fontSize: 13, padding: "32px 8px", textAlign: "center" }}>{c.common.noSavedRuns}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <MetricCard label={lang === "zh" ? "可导出记录" : "Exportable runs"} value={savedSummary.count} unit={`/ ${runs.length}`} />
              <MetricCard label={lang === "zh" ? "最高选择性" : "Best selectivity"} value={savedSummary.bestSelectivity.value || "—"} unit="" comparison={savedSummary.bestSelectivity.name} />
              <MetricCard label={lang === "zh" ? "最高生态评分" : "Best eco score"} value={savedSummary.bestGreen.value || "—"} unit="/10" comparison={savedSummary.bestGreen.name} />
            </div>
            {runs.map(run => (
              <div key={run.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12,
                display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 800 }}>{run.name}</div>
                  <div style={{ color: t.subtle, fontSize: 11, marginTop: 4 }}>
                    {run.results.gasSystem} · {run.inputs.metalCenter}/{run.inputs.organicLinker} · {lang === "zh" ? "选择性" : "Sel."} {run.results.selectivity} · LCA {run.results.lca.compositeGreenScore}/10
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onLoad(run)} style={toolbarBtn(t)}>{c.common.loadRun}</button>
                  <button onClick={() => onDelete(run.id)} style={{ ...toolbarBtn(t), color: t.danger }}>{c.common.deleteRun}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ContextualHeaderBar({
  activeTab,
  inputs,
  setInputs,
  searchQuery,
  setSearchQuery,
  searchStatus,
  setSearchStatus,
  searchOpen,
  setSearchOpen,
  presetSuggestions,
  applyPreset,
  comparisonTab,
  setComparisonTab,
  comparisonCandidates,
  comparisonFocusId,
  setComparisonFocusId,
  resourcesTab,
  setResourcesTab,
  onAddComparison,
  onSavedRuns,
  apiStatus,
  onCheckApi,
  setActiveTab,
  onLoadBenchmark,
  results,
}) {
  const t = useT()
  const { lang, copy } = useLang()
  const { isNarrow, isMobile } = useViewport()
  const layerStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    minHeight: 46,
    padding: isMobile ? "8px 0 10px" : "8px 0 10px",
    background: darkenLayer(t),
    border: "none",
    borderTop: `1px solid ${t.border}`,
    borderRadius: 0,
    boxShadow: "none",
  }
  const compactSelectStyle = { ...headerInputStyle(t), minWidth: 0, flex: "0 1 auto", cursor: "pointer" }
  const gasOptions = GAS_SYSTEMS.filter(item => item.priority !== "unavailable")
  const comparisonSubtabs = [
    { id: "feasibility", label: lang === "zh" ? "可行性" : "Feasibility" },
    { id: "lca", label: "LCA / LCC" },
    { id: "sensitivity", label: lang === "zh" ? "敏感性" : "Sensitivity" },
  ]
  const resourceSubtabs = [
    { id: "dataSources", label: lang === "zh" ? "数据来源" : "Data Sources" },
    { id: "literature", label: lang === "zh" ? "数据库" : "Database" },
    { id: "methods", label: lang === "zh" ? "方法说明" : "Methods" },
  ]
  const selectedComparison = comparisonCandidates.find(item => item.id === comparisonFocusId)

  if (activeTab === "about") return null

  if (activeTab === "home") {
    return (
      <div style={layerStyle}>
        <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
          {lang === "zh" ? "模块入口页 · 首页不承载复杂筛选器" : "Module entry page · no dense filters on Overview"}
        </div>
        <button type="button" onClick={() => setActiveTab("performance")} style={{ ...headerChipBtn(t, true), padding: "9px 14px" }}>
          Performance
        </button>
        <button type="button" onClick={() => setActiveTab("ecoscreen")} style={headerChipBtn(t)}>
          EcoScreen
        </button>
        <button type="button" onClick={() => setActiveTab("catalysis")} style={headerChipBtn(t)}>
          CatalysisLab
        </button>
        <button type="button" onClick={() => setActiveTab("library")} style={headerChipBtn(t)}>
          MOF Library
        </button>
      </div>
    )
  }

  if (activeTab === "ecoscreen" || activeTab === "performance") {
    return (
      <div style={layerStyle}>
        <PresetSearchControl
          value={searchQuery}
          setValue={setSearchQuery}
          status={searchStatus}
          setStatus={setSearchStatus}
          open={searchOpen}
          setOpen={setSearchOpen}
          suggestions={presetSuggestions}
          applyPreset={applyPreset}
          placeholder={copy.header.searchPlaceholder}
          width={isMobile ? "100%" : 360}
        />
        <select
          value={inputs.gasSystem}
          onChange={e => setInputs(prev => ({ ...prev, gasSystem: e.target.value }))}
          style={{ ...compactSelectStyle, width: isMobile ? "100%" : 220 }}
        >
          {gasOptions.map(gas => (
            <option key={gas.id} value={gas.id}>{gasLabel(gas.label, lang)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onAddComparison}
          disabled={!results || results.unavailable}
          style={{
            ...headerChipBtn(t, false),
            opacity: !results || results.unavailable ? 0.45 : 1,
            cursor: !results || results.unavailable ? "not-allowed" : "pointer",
          }}
        >
          {lang === "zh" ? "加入比较" : "Add to comparison"}
        </button>
        <span className="ecomof-tooltip" data-tooltip={copy.common.savedRuns} style={{ display: "inline-flex" }}>
          <button
            type="button"
            onClick={onSavedRuns}
            title={copy.common.savedRuns}
            aria-label={copy.common.savedRuns}
            style={{ ...headerChipBtn(t), width: 40, padding: "9px 0", justifyContent: "center", fontSize: 15 }}
          >
            ◧
          </button>
        </span>
      </div>
    )
  }

  if (activeTab === "catalysis") {
    return (
      <div style={layerStyle}>
        <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
          {lang === "zh" ? "CatalysisLab 当前使用模拟数据；页面内切换催化任务和证据过滤。" : "CatalysisLab currently uses mock data; task and evidence filters are inside the page."}
        </div>
        <button type="button" onClick={() => setActiveTab("about")} style={headerChipBtn(t)}>
          {lang === "zh" ? "查看方法限制" : "View methodology"}
        </button>
      </div>
    )
  }

  if (activeTab === "library") {
    return (
      <div style={layerStyle}>
        <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
          {lang === "zh" ? "MOF 库只展示基础数据与来源字段，不输出科研结论。" : "MOF Library exposes baseline records and source fields; it does not claim conclusions."}
        </div>
      </div>
    )
  }

  return null
}

export function InternalNav({ items, active, onChange }) {
  const t = useT()
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 6 }}>
      {items.map(item => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)}
          style={{ ...toolbarBtn(t), background: active === item.id ? t.badgeInfoBg : "transparent", borderColor: active === item.id ? t.borderStrong : t.border, color: active === item.id ? t.accentText : t.subtle }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
