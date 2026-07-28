// @ts-nocheck
import { useState, useCallback, useRef } from "react"
import { useT, useLang, useViewport } from "../../contexts"
import { FONT_SANS, THEME_DARK } from "../../constants/theme"
import { GAS_SYSTEMS, MOF_PRESETS } from "../../constants/catalogs"
import { headerChipBtn, headerInputStyle, toolbarBtn, darkenLayer } from "../../utils/styles"
import { findPresetName, getPresetSuggestionNames } from "../../utils/presets"
import { downloadTextFile } from "../../utils/report"
import { MetricCard } from "../ui/index"
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
  const { lang, copy } = useLang()
  const borderColor = status === "miss" ? t.danger : status === "loaded" ? t.success : t.border
  const trimmedQuery = value.trim()
  const showSearchFeedback = trimmedQuery.length > 0 && status !== "loaded"
  const resultFeedback = suggestions.length
    ? (lang === "zh" ? `${suggestions.length} 个匹配候选材料` : `${suggestions.length} matching candidate${suggestions.length === 1 ? "" : "s"}`)
    : (lang === "zh" ? "未找到匹配候选材料" : "No matching candidates")
  const confirmSearch = useCallback(() => {
    const match = findPresetName(value)
    if (match) {
      applyPreset(match)
      return
    }
    if (suggestions[0]) {
      applyPreset(typeof suggestions[0] === "object" ? suggestions[0].value : suggestions[0])
      return
    }
    setStatus("miss")
    setOpen(false)
  }, [applyPreset, setOpen, setStatus, suggestions, value])

  return (
    <div style={{ display: "grid", gap: 7, gridTemplateColumns: "minmax(0, 1fr) auto", minWidth: 0, width: "100%", maxWidth: width }}>
      <div style={{ position: "relative", minWidth: 0 }}>
        <input
          aria-label={lang === "zh" ? "检索 MOF 候选材料" : "Search MOF candidates"}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={e => { setValue(e.target.value); setStatus(null); setOpen(true) }}
          onKeyDown={e => {
            if (e.key === "Enter") confirmSearch()
            if (e.key === "Escape") setOpen(false)
          }}
          style={{ ...headerInputStyle(t, borderColor), width: "100%", paddingRight: 40, position: "relative", zIndex: 0 }}
        />
        <div style={{ position: "absolute", right: 14, top: 19, transform: "translateY(-50%)", color: t.faint, fontSize: 13, pointerEvents: "none" }}>
          ⌕
        </div>
        {showSearchFeedback && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 2,
            color: suggestions.length ? t.subtle : t.danger,
            fontSize: 10,
            fontWeight: 750,
            lineHeight: 1.3,
            zIndex: 121,
            pointerEvents: "none",
          }} aria-live="polite">
            {resultFeedback}
          </div>
        )}
        {open && suggestions.length > 0 && value && status !== "loaded" && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 26px)",
            left: 0,
            right: 0,
            background: t.panel,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 120,
            boxShadow: t.shadowSm,
          }}>
            {suggestions.map((suggestion, index) => {
              const value = typeof suggestion === "object" ? suggestion.value : suggestion
              const label = typeof suggestion === "object" ? suggestion.label : suggestion
              const meta = typeof suggestion === "object" ? suggestion.meta : null
              const preset = MOF_PRESETS[value]
              return (
              <button
                key={value}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => applyPreset(value)}
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
                {label}
                {(meta || preset) ? <span style={{ color: t.faint, fontSize: 10 }}>
                  {" "}· {meta || `${preset.metalCenter} · ${preset.organicLinker}`}
                </span> : null}
              </button>
              )
            })}
          </div>
        )}
        {status === "loaded" && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 2, color: t.success, fontSize: 10 }} aria-live="polite">
            ✓ {copy.header.loaded}
          </div>
        )}
        {status === "miss" && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 2, color: t.danger, fontSize: 10 }} aria-live="polite">
            {lang === "zh" ? "未找到匹配候选材料" : "No matching candidates"}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={confirmSearch}
        disabled={!trimmedQuery}
        style={{
          ...headerChipBtn(t),
          alignSelf: "start",
          background: trimmedQuery ? t.accentText : t.surface,
          borderColor: trimmedQuery ? t.accent : t.border,
          color: trimmedQuery ? "#fff" : t.faint,
          cursor: trimmedQuery ? "pointer" : "not-allowed",
          minHeight: 38,
          padding: "8px 13px",
          whiteSpace: "nowrap",
        }}
      >
        {lang === "zh" ? "确认" : "Confirm"}
      </button>
    </div>
  )
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, meta, action }) {
  const t = useT()
  const { isMobile } = useViewport()
  const metaItems = Array.isArray(meta) ? meta : String(meta || "").split("·").map(item => item.trim()).filter(Boolean)
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start",
      flexWrap: "wrap", marginBottom: 6,
    }}>
      <div style={{ minWidth: 0, flex: isMobile ? "1 1 100%" : "1 1 520px", maxWidth: "100%" }}>
        <h1 style={{ margin: 0, color: t.textStrong, fontSize: isMobile ? 28 : 32, fontWeight: 700, letterSpacing: 0, lineHeight: 1.15, overflowWrap: "anywhere" }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: "6px 0 0", color: t.subtle, fontSize: isMobile ? 13 : 14, lineHeight: 1.45, maxWidth: 760, overflowWrap: "anywhere" }}>
            {subtitle}
          </p>
        )}
        {metaItems.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
            {metaItems.slice(0, 6).map(item => (
              <span key={item} style={{
                color: t.faint,
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                lineHeight: 1.2,
                padding: "4px 7px",
                whiteSpace: "nowrap",
              }}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end", maxWidth: "100%" }}>{action}</div>}
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
            <button
              onClick={exportSavedCsv}
              disabled={!savedSummary.count}
              title={!savedSummary.count ? (lang === "zh" ? "暂无已保存运行可导出。" : "No saved runs to export.") : undefined}
              style={{ ...toolbarBtn(t), opacity: savedSummary.count ? 1 : 0.5, cursor: savedSummary.count ? "pointer" : "not-allowed" }}
            >↓ CSV</button>
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
    gap: 8,
    flexWrap: "wrap",
    minHeight: 40,
    padding: isMobile ? "6px 0 8px" : "6px 0 8px",
    background: darkenLayer(t),
    border: "none",
    borderTop: `1px solid ${t.divider || t.border}`,
    borderRadius: 0,
    boxShadow: "none",
  }
  const subnavChip = (active = false) => ({
    ...headerChipBtn(t, active),
    background: active ? t.surface : "transparent",
    border: `1px solid ${active ? t.border : t.divider}`,
    color: active ? t.accentText : t.subtle,
    fontSize: 11,
    fontWeight: active ? 760 : 650,
    padding: "5px 9px",
    minHeight: 30,
    boxShadow: "none",
  })
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
    { id: "methods", label: lang === "zh" ? "方法论" : "Methodology" },
  ]
  const selectedComparison = comparisonCandidates.find(item => item.id === comparisonFocusId)

  if (activeTab === "about") return null

  if (activeTab === "home") return null

  if (activeTab === "gassep") {
    return (
      <div style={layerStyle}>
        <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
          {lang === "zh" ? "气体分离聚焦气体比例、温度、压力、方法、来源和等温线状态的条件语境记录。" : "GasSep focuses on records with condition context: gas ratio, temperature, pressure, method, source, and isotherm status."}
        </div>
        <button type="button" onClick={() => setActiveTab("ecoscreen")} style={subnavChip()}>
          {lang === "zh" ? "EcoScreen 候选评分" : "EcoScreen"}
        </button>
        <button type="button" onClick={() => setActiveTab("library")} style={subnavChip()}>
          {lang === "zh" ? "MOF库" : "MOF Library"}
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
          width={isMobile ? "100%" : 450}
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
          title={!results || results.unavailable ? (lang === "zh" ? "先运行当前结构后再加入比较。" : "Run the current structure before adding it to comparison.") : undefined}
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
            style={{
              ...headerChipBtn(t),
              minWidth: 40,
              minHeight: 38,
              padding: isMobile ? "9px 0" : "9px 12px",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>◧</span>
            {!isMobile && <span>{copy.common.savedRuns}</span>}
          </button>
        </span>
      </div>
    )
  }

  if (activeTab === "catalysis") {
    return (
      <div style={layerStyle}>
        <div style={{ color: t.subtle, fontSize: 12, lineHeight: 1.5 }}>
          {lang === "zh" ? "催化模块用于比较反应路径证据、条件可比性与待验证候选；演示记录会明确标注证据边界。" : "Catalysis compares pathway evidence, condition comparability, and candidates awaiting validation; demonstration records keep their evidence boundaries visible."}
        </div>
        <button type="button" onClick={() => setActiveTab("about")} style={headerChipBtn(t)}>
          {lang === "zh" ? "阅读方法论" : "Read methodology"}
        </button>
      </div>
    )
  }

  if (activeTab === "library") return null

  return null
}

export function InternalNav({ items, active, onChange }) {
  const t = useT()
  return (
    <div className="subnav-strip" style={{ display: "flex", gap: 5, flexWrap: "wrap", background: t.surface, border: `1px solid ${t.divider || t.border}`, borderRadius: 8, padding: 4 }}>
      {items.map(item => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)}
          style={{ ...toolbarBtn(t), padding: "4px 8px", minHeight: 28, fontSize: 10.5, background: active === item.id ? t.panel : "transparent", border: `1px solid ${active === item.id ? t.border : "transparent"}`, color: active === item.id ? t.accentText : t.faint, boxShadow: "none", fontWeight: active === item.id ? 760 : 650 }}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

export { ContactModal } from "./ContactModal"
export { AcknowledgementsModal } from "./AcknowledgementsModal"
export { DisclaimerModal } from "./DisclaimerModal"
