import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from "react"
import { COPY } from "./i18n"
import { ThemeCtx, LangCtx, ViewportCtx } from "./contexts"
import { THEME_DARK, THEME_LIGHT, FONT_SANS } from "./constants/theme"
import { DEFAULT_INPUTS } from "./constants/defaults"
import { MOF_PRESETS } from "./constants/catalogs"
import { TABS } from "./constants/badges"
import { findPresetName, getPresetSuggestionNames } from "./utils/presets"
import { predictMOF, validateScreeningInputs } from "./utils/prediction"
import { downloadTextFile, buildComparisonCandidate } from "./utils/report"
import { headerChipBtn } from "./utils/styles"
import { ContextualHeaderBar, SavedRunsModal } from "./components/layout"

const lazyNamed = (loader, exportName) => lazy(() => loader().then(module => ({ default: module[exportName] })))

const HomeTab = lazyNamed(() => import("./components/tabs/HomeTab.jsx"), "HomeTab")
const WorkflowTab = lazyNamed(() => import("./components/tabs/WorkflowTab.jsx"), "WorkflowTab")
const ScreeningTab = lazyNamed(() => import("./components/tabs/ScreeningTab.jsx"), "ScreeningTab")
const ComparisonTab = lazyNamed(() => import("./components/tabs/ComparisonTab.jsx"), "ComparisonTab")
const ValidationTab = lazyNamed(() => import("./components/tabs/ValidationTab.jsx"), "ValidationTab")
const ResourcesTab = lazyNamed(() => import("./components/tabs/ResourcesTab.jsx"), "ResourcesTab")
const MethodsLimitationsTab = lazyNamed(() => import("./components/tabs/MethodsLimitationsTab.jsx"), "MethodsLimitationsTab")

function LoadingPanel({ theme, lang }) {
  return (
    <div
      className="page-transition"
      style={{
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        boxShadow: theme.shadowSm,
      }}
    >
      <div style={{ color: theme.subtle, fontSize: 13, fontWeight: 700 }}>
        {lang === "zh" ? "正在加载页面…" : "Loading view..."}
      </div>
    </div>
  )
}

function AppShell({
  theme,
  lang,
  copy,
  viewport,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  setLang,
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
  addCurrentToComparison,
  setSavedOpen,
  apiStatus,
  checkApi,
  navigateTab,
  loadBenchmarkExample,
  results,
  loading,
  handlePredict,
  saveCurrentRun,
  apiUrl,
  setApiUrl,
  savedOpen,
  savedRuns,
  loadSavedRun,
  setSavedRuns,
  exportSavedRuns,
  importSavedRuns,
  removeComparisonCandidate,
  moveComparisonCandidate,
}) {
  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 14% 0%, ${darkMode ? "rgba(124,180,255,0.20)" : "rgba(110,168,255,0.12)"}, transparent 30%), radial-gradient(circle at 84% 9%, ${darkMode ? "rgba(168,202,255,0.12)" : "rgba(255,255,255,0.55)"}, transparent 25%), radial-gradient(circle at 48% 100%, ${darkMode ? "rgba(110,168,255,0.10)" : "rgba(234,244,255,0.72)"}, transparent 31%), ${theme.bg}`,
        color: theme.text,
        fontFamily: FONT_SANS,
      }}
    >
      <header style={{ position: "sticky", top: 0, zIndex: 110, padding: viewport.isMobile ? "10px 12px 0" : "14px 18px 0" }}>
        <div style={{ maxWidth: 1460, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            className="nav-shell"
            style={{
              display: "grid",
              gridTemplateColumns: viewport.isNarrow ? "1fr auto" : "160px 1fr 160px",
              alignItems: "center",
              gap: 12,
              minHeight: 58,
              padding: viewport.isMobile ? "8px 12px" : "8px 16px",
              background: `linear-gradient(135deg, rgba(255,255,255,0.30), ${theme.headerBg} 22%, ${theme.glassStrong})`,
              border: `1px solid ${theme.borderStrong}`,
              borderRadius: 999,
              backdropFilter: "blur(24px) saturate(155%)",
              boxShadow: `${theme.shadowSm}, inset 0 1px 0 rgba(255,255,255,0.34), 0 18px 40px rgba(46,94,170,0.10)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                top: 1,
                height: 22,
                borderRadius: 999,
                background: "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.04))",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -36,
                right: "18%",
                width: 180,
                height: 110,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.34), rgba(255,255,255,0))",
                pointerEvents: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${theme.accentStrong}, ${theme.accent})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  flex: "0 0 auto",
                }}
              >
                ⬡
              </div>
              <div style={{ color: theme.subtle, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>EcoMOF-AI</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", minWidth: 0, gridColumn: viewport.isNarrow ? "1 / -1" : "auto", order: viewport.isNarrow ? 3 : 2 }}>
              <nav
                className="nav-capsule"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  width: "fit-content",
                  maxWidth: "100%",
                  overflowX: "auto",
                  padding: 4,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.28), ${theme.glassStrong} 24%, ${theme.glass})`,
                  border: `1px solid ${theme.borderStrong}`,
                  borderRadius: 999,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(255,255,255,0.08), 0 12px 26px rgba(46,94,170,0.10)",
                  backdropFilter: "blur(24px) saturate(170%)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    right: 8,
                    top: 1,
                    height: 14,
                    borderRadius: 999,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.03))",
                    pointerEvents: "none",
                  }}
                />
                {TABS.map(tab => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className="nav-tab"
                      data-active={active ? "true" : "false"}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        background: active ? `linear-gradient(135deg, ${theme.badgeInfoBg}, ${theme.glassStrong})` : "transparent",
                        border: active ? `1px solid ${theme.borderStrong}` : "1px solid transparent",
                        color: active ? theme.accentText : theme.subtle,
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: active ? 800 : 700,
                        whiteSpace: "nowrap",
                        fontFamily: FONT_SANS,
                        boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.30), 0 10px 22px rgba(46,94,170,0.10)" : "none",
                        backdropFilter: active ? "blur(18px) saturate(160%)" : "none",
                      }}
                    >
                      {copy.tabs[tab.copyKey]}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, minWidth: 0, order: viewport.isNarrow ? 2 : 3 }}>
              <button
                type="button"
                onClick={() => setLang(current => (current === "en" ? "zh" : "en"))}
                title={lang === "en" ? "切换到中文" : "Switch to English"}
                style={{ ...headerChipBtn(theme), minWidth: 48, padding: "8px 10px" }}
              >
                {copy.header.language}
              </button>
              <button
                type="button"
                onClick={() => setDarkMode(current => !current)}
                title={darkMode ? copy.header.light : copy.header.dark}
                style={{ ...headerChipBtn(theme), minWidth: 40, padding: "8px 10px" }}
              >
                {darkMode ? "☀" : "☾"}
              </button>
            </div>
          </div>
          <ContextualHeaderBar
            activeTab={activeTab}
            inputs={inputs}
            setInputs={setInputs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchStatus={searchStatus}
            setSearchStatus={setSearchStatus}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            presetSuggestions={presetSuggestions}
            applyPreset={applyPreset}
            comparisonTab={comparisonTab}
            setComparisonTab={setComparisonTab}
            comparisonCandidates={comparisonCandidates}
            comparisonFocusId={comparisonFocusId}
            setComparisonFocusId={setComparisonFocusId}
            resourcesTab={resourcesTab}
            setResourcesTab={setResourcesTab}
            onAddComparison={addCurrentToComparison}
            onSavedRuns={() => setSavedOpen(true)}
            apiStatus={apiStatus}
            onCheckApi={checkApi}
            setActiveTab={navigateTab}
            onLoadBenchmark={loadBenchmarkExample}
            results={results}
          />
        </div>
      </header>

      <main style={{ padding: viewport.isMobile ? "14px 12px" : "22px 24px", maxWidth: 1460, margin: "0 auto" }}>
        <Suspense fallback={<LoadingPanel theme={theme} lang={lang} />}>
          <div key={activeTab} className="page-transition">
            {activeTab === "home" && <HomeTab setActiveTab={navigateTab} />}
            {activeTab === "workflow" && <WorkflowTab setActiveTab={navigateTab} inputs={inputs} results={results} />}
            {activeTab === "screening" && (
              <ScreeningTab
                inputs={inputs}
                setInputs={setInputs}
                results={results}
                loading={loading}
                onPredict={handlePredict}
                onSaveRun={saveCurrentRun}
                apiUrl={apiUrl}
                setApiUrl={setApiUrl}
                apiStatus={apiStatus}
                onCheckApi={checkApi}
                setActiveTab={navigateTab}
                onLoadBenchmark={loadBenchmarkExample}
                onAddComparison={addCurrentToComparison}
              />
            )}
            {activeTab === "comparison" && (
              <ComparisonTab
                activeSub={comparisonTab}
                setActiveSub={setComparisonTab}
                results={results}
                inputs={inputs}
                onNavigate={navigateTab}
                onAddComparison={addCurrentToComparison}
                comparisonCandidates={comparisonCandidates}
                comparisonFocusId={comparisonFocusId}
                onRemoveCandidate={removeComparisonCandidate}
                onMoveCandidate={moveComparisonCandidate}
              />
            )}
            {activeTab === "validation" && (
              <ValidationTab
                results={results}
                inputs={inputs}
                apiUrl={apiUrl}
                apiStatus={apiStatus}
                onCheckApi={checkApi}
                onNavigate={navigateTab}
                onAddComparison={addCurrentToComparison}
              />
            )}
            {activeTab === "resources" && <ResourcesTab activeSub={resourcesTab} setActiveSub={setResourcesTab} results={results} inputs={inputs} />}
            {activeTab === "about" && <MethodsLimitationsTab />}
          </div>
        </Suspense>
      </main>

      <footer style={{ marginTop: 40, padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ color: theme.veryFaint, fontSize: 12 }}>
          © 2024 Advanced Materials Lab · Computational Design · <strong style={{ color: theme.faint }}>EcoMOF-AI</strong>
        </span>
        <span style={{ color: theme.veryFaint, fontSize: 12 }}>
          CoRE MOF 2019 · 14,252 curated · roadmap: CoRE 2024 + QMOF ·{" "}
          <a href="https://github.com/Linus-He/ecomof-ai" target="_blank" rel="noopener" style={{ color: theme.accentText, textDecoration: "none" }}>
            GitHub
          </a>
        </span>
      </footer>

      {savedOpen && (
        <SavedRunsModal
          runs={savedRuns}
          onClose={() => setSavedOpen(false)}
          onLoad={loadSavedRun}
          onDelete={id => setSavedRuns(prev => prev.filter(run => run.id !== id))}
          onExport={exportSavedRuns}
          onImport={importSavedRuns}
        />
      )}
    </div>
  )
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [lang, setLang] = useState("en")
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth))
  const [activeTab, setActiveTab] = useState("home")
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchStatus, setSearchStatus] = useState(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [comparisonTab, setComparisonTab] = useState("feasibility")
  const [comparisonFocusId, setComparisonFocusId] = useState("all")
  const [resourcesTab, setResourcesTab] = useState("dataSources")
  const [comparisonCandidates, setComparisonCandidates] = useState([])
  const [savedRuns, setSavedRuns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ecomof_saved_runs") || "[]")
    } catch {
      return []
    }
  })
  const [apiUrl, setApiUrl] = useState(() => {
    try {
      return localStorage.getItem("ecomof_api_url") || import.meta.env.VITE_API_URL || ""
    } catch {
      return import.meta.env.VITE_API_URL || ""
    }
  })
  const [apiStatus, setApiStatus] = useState({
    ok: false,
    checked: false,
    message: "Static browser model",
    manifest: null,
  })

  const theme = darkMode ? THEME_DARK : THEME_LIGHT
  const copy = COPY[lang]
  const viewport = useMemo(
    () => ({
      width: viewportWidth,
      isNarrow: viewportWidth < 980,
      isMobile: viewportWidth < 720,
    }),
    [viewportWidth],
  )

  useEffect(() => {
    document.body.style.background = theme.bg
    document.documentElement.style.background = theme.bg
    document.body.style.fontFamily = FONT_SANS
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"
  }, [theme.bg, lang])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem("ecomof_saved_runs", JSON.stringify(savedRuns.slice(0, 20)))
  }, [savedRuns])

  useEffect(() => {
    try {
      localStorage.setItem("ecomof_api_url", apiUrl)
    } catch {
      // Ignore storage failures.
    }
  }, [apiUrl])

  useEffect(() => {
    if (comparisonFocusId !== "all" && !comparisonCandidates.some(item => item.id === comparisonFocusId)) {
      setComparisonFocusId("all")
    }
  }, [comparisonCandidates, comparisonFocusId])

  useEffect(() => {
    if (!apiStatus.checked) {
      setApiStatus(prev => ({
        ...prev,
        message: lang === "zh" ? "静态浏览器端模型" : "Static browser model",
      }))
    }
  }, [lang, apiStatus.checked])

  const presetSuggestions = useMemo(() => getPresetSuggestionNames(searchQuery), [searchQuery])

  const applyPreset = useCallback((name) => {
    const presetName = findPresetName(name)
    const preset = presetName ? MOF_PRESETS[presetName] : null
    if (!preset) {
      setSearchStatus("miss")
      return
    }
    setInputs(prev => ({ ...prev, ...preset, mofName: presetName }))
    setSearchQuery(presetName)
    setSearchOpen(false)
    setSearchStatus("loaded")
    setActiveTab("screening")
    window.setTimeout(() => setSearchStatus(null), 1800)
  }, [])

  const navigateTab = useCallback((target) => {
    if (["feasibility", "lca", "sensitivity"].includes(target)) {
      setComparisonTab(target)
      setActiveTab("comparison")
      return
    }
    if (["dataSources", "literature", "methods"].includes(target)) {
      setResourcesTab(target)
      setActiveTab("resources")
      return
    }
    if (target === "structure" || target === "interpretation" || target === "ml") {
      setActiveTab("screening")
      return
    }
    setActiveTab(target)
  }, [])

  const loadBenchmarkExample = useCallback((name = "UiO-66") => {
    applyPreset(name)
  }, [applyPreset])

  const addCurrentToComparison = useCallback(() => {
    const candidate = buildComparisonCandidate(inputs, results, lang)
    if (!candidate) return
    setComparisonCandidates(prev => {
      const withoutDuplicate = prev.filter(item => item.name !== candidate.name || item.gasSystem !== candidate.gasSystem)
      return [candidate, ...withoutDuplicate].slice(0, 4)
    })
  }, [inputs, results, lang])

  const removeComparisonCandidate = useCallback((id) => {
    setComparisonCandidates(prev => prev.filter(item => item.id !== id))
  }, [])

  const moveComparisonCandidate = useCallback((index, delta) => {
    setComparisonCandidates(prev => {
      const nextIndex = index + delta
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.splice(nextIndex, 0, item)
      return copy
    })
  }, [])

  const checkApi = useCallback(async () => {
    if (!apiUrl) {
      setApiStatus({
        ok: false,
        checked: true,
        message: lang === "zh" ? "未设置 API 地址；使用静态浏览器端模型。" : "No API URL set; using static browser model.",
        manifest: null,
      })
      return
    }
    try {
      const base = apiUrl.replace(/\/$/, "")
      const response = await fetch(`${base}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const health = await response.json()
      let manifest = null
      try {
        const manifestResponse = await fetch(`${base}/models/manifest`)
        if (manifestResponse.ok) manifest = await manifestResponse.json()
      } catch {
        manifest = null
      }
      setApiStatus({
        ok: true,
        checked: true,
        message: lang === "zh"
          ? `后端就绪 · 模型${health.model_loaded ? "已加载" : "未加载"} · 行数 ${health.training_rows ?? "—"}`
          : `Backend ready · model ${health.model_loaded ? "loaded" : "not loaded"} · rows ${health.training_rows ?? "—"}`,
        manifest,
      })
    } catch (error) {
      setApiStatus({
        ok: false,
        checked: true,
        message: lang === "zh"
          ? `API 不可用：${error.message}。将使用静态浏览器端模型。`
          : `API unavailable: ${error.message}. Static browser model will be used.`,
        manifest: null,
      })
    }
  }, [apiUrl, lang])

  const handlePredict = useCallback(async () => {
    if (validateScreeningInputs(inputs).blocked) {
      return
    }
    setLoading(true)
    try {
      if (apiUrl) {
        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        })
        if (response.ok) {
          const data = await response.json()
          const local = predictMOF(inputs)
          setApiStatus(prev => ({
            ...prev,
            ok: true,
            checked: true,
            message: lang === "zh" ? "本次运行使用后端预测。" : "Backend prediction used for this run.",
          }))
          setResults({
            ...local,
            ...data,
            thermo: local.thermo,
            primaryName: local.primaryName,
            secondaryName: local.secondaryName,
            gasSystem: local.gasSystem,
            anomaly: local.anomaly,
          })
          setLoading(false)
          return
        }
      }
    } catch (error) {
      setApiStatus(prev => ({
        ...prev,
        ok: false,
        checked: true,
        message: lang === "zh"
          ? `后端预测失败：${error.message}。已使用静态浏览器端模型。`
          : `Backend prediction failed: ${error.message}. Static browser model used.`,
      }))
    }

    await new Promise(resolve => setTimeout(resolve, 700))
    setResults(predictMOF(inputs))
    setLoading(false)
  }, [inputs, apiUrl, lang])

  const saveCurrentRun = useCallback(() => {
    if (!results || results.unavailable) return
    const id = `${Date.now()}`
    const name = inputs.mofName || `${inputs.metalCenter}/${inputs.organicLinker}`
    setSavedRuns(prev => [{ id, name, inputs, results, createdAt: new Date().toISOString() }, ...prev].slice(0, 20))
  }, [inputs, results])

  const loadSavedRun = useCallback((run) => {
    setInputs(run.inputs)
    setResults(run.results)
    setSavedOpen(false)
    setActiveTab("screening")
  }, [])

  const exportSavedRuns = useCallback(() => {
    downloadTextFile(
      `ecomof_saved_runs_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ schema: "ecomof-saved-runs-v1", exportedAt: new Date().toISOString(), runs: savedRuns }, null, 2),
      "application/json",
    )
  }, [savedRuns])

  const importSavedRuns = useCallback(async (file) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const incoming = Array.isArray(parsed) ? parsed : parsed.runs
      if (!Array.isArray(incoming)) return
      setSavedRuns(prev => {
        const merged = [...incoming, ...prev].filter(run => run?.id && run?.inputs && run?.results)
        return Array.from(new Map(merged.map(run => [run.id, run])).values()).slice(0, 40)
      })
    } catch {
      // Keep import non-blocking.
    }
  }, [])

  return (
    <ThemeCtx.Provider value={theme}>
      <LangCtx.Provider value={{ lang, copy, setLang }}>
        <ViewportCtx.Provider value={viewport}>
          <AppShell
            theme={theme}
            lang={lang}
            copy={copy}
            viewport={viewport}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setLang={setLang}
            inputs={inputs}
            setInputs={setInputs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchStatus={searchStatus}
            setSearchStatus={setSearchStatus}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            presetSuggestions={presetSuggestions}
            applyPreset={applyPreset}
            comparisonTab={comparisonTab}
            setComparisonTab={setComparisonTab}
            comparisonCandidates={comparisonCandidates}
            comparisonFocusId={comparisonFocusId}
            setComparisonFocusId={setComparisonFocusId}
            resourcesTab={resourcesTab}
            setResourcesTab={setResourcesTab}
            addCurrentToComparison={addCurrentToComparison}
            setSavedOpen={setSavedOpen}
            apiStatus={apiStatus}
            checkApi={checkApi}
            navigateTab={navigateTab}
            loadBenchmarkExample={loadBenchmarkExample}
            results={results}
            loading={loading}
            handlePredict={handlePredict}
            saveCurrentRun={saveCurrentRun}
            apiUrl={apiUrl}
            setApiUrl={setApiUrl}
            savedOpen={savedOpen}
            savedRuns={savedRuns}
            loadSavedRun={loadSavedRun}
            setSavedRuns={setSavedRuns}
            exportSavedRuns={exportSavedRuns}
            importSavedRuns={importSavedRuns}
            removeComparisonCandidate={removeComparisonCandidate}
            moveComparisonCandidate={moveComparisonCandidate}
          />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  )
}
