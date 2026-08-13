// @ts-nocheck
import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react"
import { CaretRight, EnvelopeSimple, GlobeHemisphereEast, MagnifyingGlass, Moon, Sun, Translate, User } from "@phosphor-icons/react"
import { COPY } from "./i18n"
import { ThemeCtx, LangCtx, ViewportCtx } from "./contexts"
import { THEME_DARK, THEME_LIGHT, FONT_SANS } from "./constants/theme"
import { DEFAULT_INPUTS } from "./constants/defaults"
import { MOF_PRESETS } from "./constants/catalogs"
import { TABS } from "./constants/badges"
import {
  getNavigationItem,
  getNavigationRoute,
  getScrollTargetForHash,
  preloadNavigationRoutes,
  resolveTabForHash,
} from "./config/navigationRegistry"
import { findPresetName, getPresetSuggestionNames } from "./utils/presets"
import { predictMOF, validateScreeningInputs } from "./utils/prediction"
import { downloadTextFile, buildComparisonCandidate } from "./utils/report"
import { HASH_TO_TAB, getHashMeta, normalizeHash, tabToHash } from "./utils/deepLinks"
import { fetchDataJson } from "./services/dataService"
import { resolveInitialLocale, SUPPORTED_LOCALES } from "./utils/locale"
import { observeTraditionalChinese } from "./utils/traditionalChinese"
import { AppFooter, ContextualHeaderBar, SavedRunsModal, DisclaimerModal, PhysicochemicalPropertyModal } from "./components/layout"
import { LogoWordmark } from "./components/brand"
import { PrimaryDomainNavigation } from "./components/navigation/PrimaryDomainNavigation"
import { CandidateComparisonModal } from "./components/mof/CandidateComparisonModal"
import { HomeTab } from "./components/tabs/HomeTab"

const lazyNamed = (loader, exportName) => lazy(async () => {
  const reloadKey = `ecomof-lazy-reload:${exportName}`
  try {
    const module = await loader()
    if (typeof window !== "undefined") window.sessionStorage.removeItem(reloadKey)
    return { default: module[exportName] }
  } catch (error) {
    const isChunkLoadFailure = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(String(error?.message || error))
    if (typeof window !== "undefined" && isChunkLoadFailure && !window.sessionStorage.getItem(reloadKey)) {
      window.sessionStorage.setItem(reloadKey, "1")
      window.location.reload()
      return new Promise(() => {})
    }
    throw error
  }
})

const routeComponent = tabId => getNavigationRoute(tabId)?.component

const EcoScreenTab = lazyNamed(routeComponent("ecoscreen").load, routeComponent("ecoscreen").exportName)
const PerformanceTab = lazyNamed(routeComponent("performance").load, routeComponent("performance").exportName)
const GasSepTab = lazyNamed(routeComponent("gassep").load, routeComponent("gassep").exportName)
const CatalysisLabTab = lazyNamed(routeComponent("catalysis").load, routeComponent("catalysis").exportName)
const MOFLibraryTab = lazyNamed(routeComponent("library").load, routeComponent("library").exportName)
const WorkflowTab = lazyNamed(() => import("./components/tabs/WorkflowTab"), "WorkflowTab")
const ScreeningTab = lazyNamed(() => import("./components/tabs/ScreeningTab"), "ScreeningTab")
const ComparisonTab = lazyNamed(() => import("./components/tabs/ComparisonTab"), "ComparisonTab")
const ValidationTab = lazyNamed(() => import("./components/tabs/ValidationTab"), "ValidationTab")
const ResourcesTab = lazyNamed(() => import("./components/tabs/ResourcesTab"), "ResourcesTab")
const MethodsLimitationsTab = lazyNamed(routeComponent("about").load, routeComponent("about").exportName)
const ProjectEvolutionTab = lazyNamed(routeComponent("projectEvolution").load, routeComponent("projectEvolution").exportName)
const DatabaseComplianceTab = lazyNamed(routeComponent("dataCompliance").load, routeComponent("dataCompliance").exportName)
const CatalysisLiteratureVerificationPage = lazyNamed(routeComponent("catalysisLiterature").load, routeComponent("catalysisLiterature").exportName)
const OrganicAcidResearchPage = lazyNamed(routeComponent("organicAcid").load, routeComponent("organicAcid").exportName)
const AlgorithmValidationPage = lazyNamed(routeComponent("algorithmValidation").load, routeComponent("algorithmValidation").exportName)
const DataQualityProvenancePage = lazyNamed(routeComponent("dataQuality").load, routeComponent("dataQuality").exportName)
const BenchmarkReferencesPage = lazyNamed(routeComponent("benchmarkReferences").load, routeComponent("benchmarkReferences").exportName)
const MofRecordPage = lazyNamed(routeComponent("mofRecord").load, routeComponent("mofRecord").exportName)
const LiteratureRecordPage = lazyNamed(routeComponent("literatureRecord").load, routeComponent("literatureRecord").exportName)
const ResearchCharterPage = lazyNamed(routeComponent("charter").load, routeComponent("charter").exportName)
const CreatorStatementPage = lazyNamed(routeComponent("creatorStatement").load, routeComponent("creatorStatement").exportName)
const ReleaseNotesPage = lazyNamed(routeComponent("releaseNotes").load, routeComponent("releaseNotes").exportName)
const ContactPage = lazyNamed(routeComponent("contact").load, routeComponent("contact").exportName)
const AcknowledgementsPage = lazyNamed(routeComponent("acknowledgements").load, routeComponent("acknowledgements").exportName)

function shouldPreloadRouteModules() {
  if (typeof navigator === "undefined") return true
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return true
  if (connection.saveData) return false
  return !/2g/i.test(String(connection.effectiveType || ""))
}

function preloadCommonRouteModules() {
  return preloadNavigationRoutes(["performance", "catalysis", "library", "gassep"])
}

function getInitialDeepLinkState() {
  const rawHash = typeof window === "undefined" ? "" : window.location.hash
  const explicitHash = String(rawHash || "").replace(/^#/, "").trim()
  const hash = explicitHash || "default"
  const routeHash = hash === "default" ? "overview" : normalizeHash(hash)
  const pendingScrollTarget = getScrollTargetForHash(routeHash)

  return {
    activeHash: hash,
    activeTab: resolveTabForHash(routeHash) || "home",
    pendingScrollTarget,
  }
}

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
  locale,
  copy,
  viewport,
  activeHash,
  activeTab,
  setActiveTab,
  setLang,
  darkMode,
  setDarkMode,
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
  disclaimerOpen,
  setDisclaimerOpen,
  closeDisclaimerModal,
  confirmedMofSelection,
}) {
  const [homeComparisonOpen, setHomeComparisonOpen] = useState(false)
  const [comparisonBuilderContext, setComparisonBuilderContext] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)
  const settingsRef = useRef(null)
  const appShellRef = useRef(null)
  const compactHeader = viewport.width < 1320
  const veryCompactHeader = viewport.width < 760
  const chromeTheme = theme
  const moduleTone = ({
    home: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    ecoscreen: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    performance: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    gassep: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    catalysis: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    library: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    about: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    projectEvolution: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    dataCompliance: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    catalysisLiterature: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    organicAcid: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    algorithmValidation: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    dataQuality: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    benchmarkReferences: { accent: chromeTheme.textStrong, soft: chromeTheme.surface },
    mofRecord: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    literatureRecord: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    charter: { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft },
    creatorStatement: { accent: chromeTheme.textStrong, soft: chromeTheme.surface },
    releaseNotes: { accent: chromeTheme.textStrong, soft: chromeTheme.surface },
    contact: { accent: chromeTheme.textStrong, soft: chromeTheme.surface },
    acknowledgements: { accent: chromeTheme.textStrong, soft: chromeTheme.surface },
  })[activeTab] || { accent: chromeTheme.accentText, soft: chromeTheme.accentSoft }
  const openComparisonBuilder = useCallback((context = null) => {
    setComparisonBuilderContext(context || null)
    setHomeComparisonOpen(true)
  }, [])
  const closeComparisonBuilder = useCallback(() => {
    setHomeComparisonOpen(false)
    setComparisonBuilderContext(null)
  }, [])
  useEffect(() => {
    const root = appShellRef.current
    if (!root) return undefined
    root.lang = locale === "zh-TW" ? "zh-TW" : locale === "en" ? "en" : "zh-CN"
    if (locale !== "zh-TW") return undefined
    let cancelled = false
    let restore = null
    observeTraditionalChinese(root).then(cleanup => {
      if (cancelled) cleanup()
      else restore = cleanup
    })
    return () => {
      cancelled = true
      restore?.()
    }
  }, [locale])
  useEffect(() => {
    if (!settingsOpen && !globalSearchOpen) return undefined
    const close = event => {
      if (event.key === "Escape") {
        setSettingsOpen(false)
        setGlobalSearchOpen(false)
        return
      }
      if (event.type === "pointerdown" && !settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false)
        setGlobalSearchOpen(false)
      }
    }
    window.addEventListener("keydown", close)
    window.addEventListener("pointerdown", close)
    return () => {
      window.removeEventListener("keydown", close)
      window.removeEventListener("pointerdown", close)
    }
  }, [settingsOpen, globalSearchOpen])
  return (
    <div
      ref={appShellRef}
      className="app-shell"
      data-active-tab={activeTab}
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: FONT_SANS,
        "--module-accent": moduleTone.accent,
        "--module-soft": moduleTone.soft,
      }}
    >
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 110,
        padding: 0,
        background: chromeTheme.headerBg,
        borderBottom: 0,
      }}>
        <div style={{ maxWidth: 1460, margin: "0 auto", display: "flex", flexDirection: "column", gap: 0, padding: viewport.isMobile ? "0 12px" : "0 18px" }}>
          <div
            className="nav-shell"
            style={{
              display: "grid",
              gridTemplateColumns: veryCompactHeader
                ? "auto minmax(0, 1fr) auto"
                : compactHeader
                  ? "96px minmax(0, 1fr) 96px"
                  : "170px minmax(0, 1fr) auto",
              alignItems: "center",
              columnGap: veryCompactHeader ? 6 : 10,
              minHeight: viewport.isMobile ? 56 : 72,
              padding: 0,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              position: "relative",
              overflow: "visible",
            }}
          >
            <div className="brand-nav-wordmark" style={{ display: "flex", alignItems: "center", minWidth: 0, flex: "0 0 auto" }}>
              <LogoWordmark
                markSize={viewport.isMobile ? 28 : 30}
                radius={viewport.isMobile ? 7 : 8}
                t={chromeTheme}
                text={veryCompactHeader ? "" : "EcoMOF-AI"}
                compact
              />
            </div>

            <div
              data-testid="primary-nav-slot"
              style={{
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
                overflow: "visible",
                position: "relative",
              }}
            >
              <PrimaryDomainNavigation
                activeHash={activeHash}
                activeTab={activeTab}
                isMobile={viewport.isMobile}
                lang={lang}
                onNavigate={setActiveTab}
                theme={chromeTheme}
              />
            </div>

            <div ref={settingsRef} className="settings-control-cluster" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: compactHeader ? 4 : 8,
              minWidth: 0,
              flex: "0 0 auto",
              width: compactHeader && !veryCompactHeader ? 96 : "auto",
              position: "relative",
              zIndex: 2,
              background: "transparent",
            }}>
              <div className="user-menu-control" style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-expanded={settingsOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setSettingsOpen(open => !open)
                    setGlobalSearchOpen(false)
                  }}
                  title={lang === "zh" ? "打开用户菜单" : "Open user menu"}
                  aria-label={lang === "zh" ? "打开用户菜单" : "Open user menu"}
                  className="settings-trigger nav-action-button nav-user-trigger"
                  data-open={settingsOpen ? "true" : "false"}
                  style={{
                    alignItems: "center",
                    background: "transparent",
                    border: "1px solid transparent",
                    boxShadow: "none",
                    color: settingsOpen ? chromeTheme.textStrong : chromeTheme.subtle,
                    cursor: "pointer",
                    display: "inline-flex",
                    fontFamily: FONT_SANS,
                    justifyContent: "center",
                    gap: 4,
                    transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  <User aria-hidden="true" size={18} weight={settingsOpen ? "fill" : "regular"} />
                </button>
                {settingsOpen ? (
                  <div
                    role="menu"
                    aria-label={lang === "zh" ? "用户与设置菜单" : "User and settings menu"}
                    className="settings-menu"
                    onPointerDown={event => event.stopPropagation()}
                    style={{
                      display: "grid",
                      overflow: "hidden",
                      padding: 6,
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      zIndex: 180,
                    }}
                  >
                    <div role="none" className="settings-menu-row settings-menu-row--select">
                      <Translate aria-hidden="true" size={17} weight="regular" />
                      <label htmlFor="user-menu-language">{lang === "zh" ? "语言" : "Language"}</label>
                      <select
                        id="user-menu-language"
                        aria-label={lang === "zh" ? "语言" : "Language"}
                        className="settings-language-select"
                        onChange={event => {
                          setLang(event.target.value)
                          setSettingsOpen(false)
                        }}
                        value={locale}
                      >
                        <option value="zh-CN">简体中文</option>
                        <option value="zh-TW">繁體中文</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      aria-pressed={darkMode}
                      className="settings-menu-row"
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      {darkMode ? <Moon aria-hidden="true" size={17} weight="regular" /> : <Sun aria-hidden="true" size={17} weight="regular" />}
                      <span>{lang === "zh" ? "外观" : "Appearance"}</span>
                      <span className="settings-menu-value">{darkMode ? (lang === "zh" ? "深色" : "Dark") : (lang === "zh" ? "浅色" : "Light")}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="settings-menu-row"
                      onClick={() => {
                        setSettingsOpen(false)
                        navigateTab("compliance-hosting-notice")
                      }}
                    >
                      <GlobeHemisphereEast aria-hidden="true" size={17} weight="regular" />
                      <span>{lang === "zh" ? "数据托管与跨境访问" : "Data hosting & access"}</span>
                      <CaretRight aria-hidden="true" size={14} weight="bold" />
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="settings-menu-row"
                      onClick={() => {
                        setSettingsOpen(false)
                        navigateTab("contact")
                      }}
                    >
                      <EnvelopeSimple aria-hidden="true" size={17} weight="regular" />
                      <span>{lang === "zh" ? "联系与合作" : "Contact & collaboration"}</span>
                      <CaretRight aria-hidden="true" size={14} weight="bold" />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="global-search-control" style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-expanded={globalSearchOpen}
                  aria-haspopup="dialog"
                  aria-label={lang === "zh" ? "打开全局 MOF 检索" : "Open global MOF search"}
                  className="nav-action-button nav-search-trigger"
                  onClick={() => {
                    setGlobalSearchOpen(open => !open)
                    setSettingsOpen(false)
                    setSearchOpen(true)
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid transparent",
                    color: globalSearchOpen ? chromeTheme.accentText : chromeTheme.textStrong,
                  }}
                >
                  <MagnifyingGlass aria-hidden="true" size={18} weight="regular" />
                </button>
                {globalSearchOpen ? (
                  <div
                    aria-label={lang === "zh" ? "全局 MOF 检索" : "Global MOF search"}
                    className="global-search-popover"
                    role="dialog"
                    style={{ background: chromeTheme.panel, border: `1px solid ${chromeTheme.border}`, boxShadow: "0 18px 46px rgba(15, 23, 42, 0.16)" }}
                  >
                    <label style={{ color: chromeTheme.faint, fontSize: 10.5, fontWeight: 820 }}>
                      {lang === "zh" ? "跨来源检索 MOF" : "Search MOFs across sources"}
                    </label>
                    <input
                      aria-label={lang === "zh" ? "全局检索 MOF 候选材料" : "Global MOF candidate search"}
                      autoFocus
                      onChange={event => { setSearchQuery(event.target.value); setSearchStatus(null); setSearchOpen(true) }}
                      onKeyDown={event => {
                        if (event.key === "Escape") setGlobalSearchOpen(false)
                        if (event.key === "Enter" && presetSuggestions[0]) {
                          applyPreset(typeof presetSuggestions[0] === "object" ? presetSuggestions[0].value : presetSuggestions[0])
                          setGlobalSearchOpen(false)
                        }
                      }}
                      placeholder={copy.header.searchPlaceholder}
                      value={searchQuery}
                      style={{ background: chromeTheme.surface, border: `1px solid ${chromeTheme.borderStrong}`, borderRadius: 10, color: chromeTheme.textStrong, fontFamily: FONT_SANS, fontSize: 12, minHeight: 40, outline: "none", padding: "9px 12px", width: "100%" }}
                    />
                    {searchQuery && presetSuggestions.length ? (
                      <div className="global-search-results" role="listbox">
                        {presetSuggestions.slice(0, 5).map(suggestion => {
                          const value = typeof suggestion === "object" ? suggestion.value : suggestion
                          const label = typeof suggestion === "object" ? suggestion.label : suggestion
                          const meta = typeof suggestion === "object" ? suggestion.meta : ""
                          return (
                            <button key={value} type="button" onClick={() => { applyPreset(value); setGlobalSearchOpen(false) }} role="option" style={{ background: "transparent", border: 0, borderRadius: 8, color: chromeTheme.textStrong, cursor: "pointer", display: "grid", fontFamily: FONT_SANS, gap: 2, padding: "8px 9px", textAlign: "left", width: "100%" }}>
                              <strong style={{ fontSize: 11.5 }}>{label}</strong>
                              {meta ? <span style={{ color: chromeTheme.faint, fontSize: 10 }}>{meta}</span> : null}
                            </button>
                          )
                        })}
                      </div>
                    ) : searchQuery ? <span style={{ color: chromeTheme.faint, fontSize: 10.5 }}>{lang === "zh" ? "继续输入材料名、Refcode 或 DOI" : "Keep typing a material name, Refcode, or DOI"}</span> : null}
                  </div>
                ) : null}
              </div>
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
            propertyRecord={confirmedMofSelection?.record || null}
            onOpenProperties={() => setPropertyOpen(true)}
          />
        </div>
      </header>

      <main className="app-main" style={{ padding: viewport.isMobile ? "14px 12px" : "22px 24px", maxWidth: 1460, margin: "0 auto" }}>
        <Suspense fallback={<LoadingPanel theme={theme} lang={lang} />}>
          <div key={activeTab} className="page-transition" data-tab={activeTab}>
            {activeTab === "home" && <HomeTab setActiveTab={navigateTab} onContactOpen={() => navigateTab("contact")} onOpenComparisonBuilder={() => openComparisonBuilder()} />}
            {activeTab === "ecoscreen" && (
              <EcoScreenTab
                inputs={inputs}
                setInputs={setInputs}
                results={results}
                loading={loading}
                onPredict={handlePredict}
                onNavigate={navigateTab}
                materialConfirmed={Boolean(confirmedMofSelection)}
              />
            )}
            {activeTab === "performance" && (
              <PerformanceTab
                inputs={inputs}
                setInputs={setInputs}
                results={results}
                loading={loading}
                onPredict={handlePredict}
                onNavigate={navigateTab}
                onSaveRun={saveCurrentRun}
                apiUrl={apiUrl}
                setApiUrl={setApiUrl}
                apiStatus={apiStatus}
                onCheckApi={checkApi}
                onLoadBenchmark={loadBenchmarkExample}
                onAddComparison={addCurrentToComparison}
              />
            )}
            {activeTab === "gassep" && <GasSepTab onNavigate={navigateTab} onOpenComparisonBuilder={openComparisonBuilder} />}
            {activeTab === "catalysis" && <CatalysisLabTab onNavigate={navigateTab} />}
            {activeTab === "library" && <MOFLibraryTab results={results} inputs={inputs} />}
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
            {activeTab === "about" && <MethodsLimitationsTab onNavigate={navigateTab} />}
            {activeTab === "projectEvolution" && <ProjectEvolutionTab onNavigate={navigateTab} />}
            {activeTab === "dataCompliance" && <DatabaseComplianceTab />}
            {activeTab === "catalysisLiterature" && <CatalysisLiteratureVerificationPage />}
            {activeTab === "organicAcid" && <OrganicAcidResearchPage onNavigate={navigateTab} />}
            {activeTab === "algorithmValidation" && <AlgorithmValidationPage />}
            {activeTab === "dataQuality" && <DataQualityProvenancePage />}
            {activeTab === "benchmarkReferences" && <BenchmarkReferencesPage />}
            {activeTab === "mofRecord" && <MofRecordPage />}
            {activeTab === "literatureRecord" && <LiteratureRecordPage />}
            {activeTab === "charter" && <ResearchCharterPage />}
            {activeTab === "creatorStatement" && <CreatorStatementPage />}
            {activeTab === "releaseNotes" && <ReleaseNotesPage />}
            {activeTab === "contact" && <ContactPage />}
            {activeTab === "acknowledgements" && <AcknowledgementsPage />}
          </div>
        </Suspense>
      </main>

      <AppFooter
        lang={lang}
        navigate={navigateTab}
        onAcknowledgements={() => navigateTab("acknowledgements")}
        onContact={() => navigateTab("contact")}
        onDisclaimer={() => setDisclaimerOpen(true)}
        theme={theme}
      />

      <DisclaimerModal open={disclaimerOpen} onClose={closeDisclaimerModal} />
      <PhysicochemicalPropertyModal open={propertyOpen} onClose={() => setPropertyOpen(false)} record={confirmedMofSelection?.record || null} />
      <CandidateComparisonModal
        open={homeComparisonOpen}
        candidates={[]}
        initialContext={comparisonBuilderContext}
        onClose={closeComparisonBuilder}
        t={theme}
        lang={lang}
        isMobile={viewport.isMobile}
      />

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
  const initialDeepLink = useMemo(() => getInitialDeepLinkState(), [])
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      const stored = window.localStorage.getItem("ecomof-theme")
      if (stored === "dark") return true
      if (stored === "light") return false
    } catch {
      // Fall through to the operating-system preference.
    }
    return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches)
  })
  const [locale, setLocale] = useState(() => {
    try {
      return resolveInitialLocale({
        browserLanguages: typeof navigator === "undefined" ? [] : navigator.languages?.length ? navigator.languages : [navigator.language],
        storedLocale: typeof window === "undefined" ? null : window.localStorage.getItem("ecomof-language"),
      })
    } catch {
      return resolveInitialLocale({ browserLanguages: typeof navigator === "undefined" ? [] : [navigator.language] })
    }
  })
  const lang = locale === "en" ? "en" : "zh"
  const setLang = useCallback(next => {
    const normalized = next === "zh" ? "zh-CN" : next
    if (!SUPPORTED_LOCALES.includes(normalized)) return
    setLocale(normalized)
    try {
      window.localStorage.setItem("ecomof-language", normalized)
    } catch {
      // The locale switch still works when storage is unavailable.
    }
  }, [])
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth))
  const [activeTab, setActiveTab] = useState(initialDeepLink.activeTab)
  const [activeHash, setActiveHash] = useState(initialDeepLink.activeHash)
  const [pendingScrollTarget, setPendingScrollTarget] = useState(initialDeepLink.pendingScrollTarget)
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchStatus, setSearchStatus] = useState(null)
  const [databaseSearchRows, setDatabaseSearchRows] = useState([])
  const [confirmedMofSelection, setConfirmedMofSelection] = useState(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
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
    message: "Local screening model",
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

  const applyDeepLink = useCallback((rawHash) => {
    const explicitHash = String(rawHash || "").replace(/^#/, "").trim()
    const hash = explicitHash || "default"
    const routeHash = hash === "default" ? "overview" : normalizeHash(hash)
    const tab = resolveTabForHash(routeHash)

    setActiveHash(hash)
    setDisclaimerOpen(routeHash === "disclaimer")

    if (tab) {
      setActiveTab(tab)
      const scrollTarget = getScrollTargetForHash(routeHash)
      if (scrollTarget) setPendingScrollTarget(scrollTarget)
    }
  }, [])

  const setRouteHash = useCallback((hash, { replace = false } = {}) => {
    const normalized = normalizeHash(hash)
    const targetHash = `#${normalized}`
    if (window.location.hash !== targetHash) {
      const url = `${window.location.pathname}${window.location.search}${targetHash}`
      if (replace) window.history.replaceState(null, "", url)
      else window.history.pushState(null, "", url)
    }
    applyDeepLink(normalized)
  }, [applyDeepLink])

  const closeDisclaimerModal = useCallback(() => {
    setDisclaimerOpen(false)
    if (normalizeHash(window.location.hash) === "disclaimer") {
      setRouteHash(tabToHash(activeTab), { replace: true })
    }
  }, [activeTab, setRouteHash])

  useEffect(() => {
    document.body.style.background = theme.bg
    document.documentElement.style.background = theme.bg
    document.body.style.fontFamily = FONT_SANS
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"
    document.documentElement.dataset.theme = darkMode ? "dark" : "light"
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light"
    try {
      window.localStorage.setItem("ecomof-theme", darkMode ? "dark" : "light")
    } catch {
      // Appearance remains functional when storage is unavailable.
    }
  }, [darkMode, theme.bg, lang])

  useEffect(() => {
    applyDeepLink(window.location.hash)
    const onHashChange = () => applyDeepLink(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    window.addEventListener("popstate", onHashChange)
    return () => {
      window.removeEventListener("hashchange", onHashChange)
      window.removeEventListener("popstate", onHashChange)
    }
  }, [applyDeepLink])

  useEffect(() => {
    if (!shouldPreloadRouteModules()) return undefined

    const preload = () => {
      preloadCommonRouteModules()
    }

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(preload, { timeout: 3500 })
      return () => window.cancelIdleCallback?.(idleId)
    }

    const timeoutId = window.setTimeout(preload, 2400)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const meta = getHashMeta(activeHash)
    document.title = meta.title
    let description = document.querySelector('meta[name="description"]')
    if (!description) {
      description = document.createElement("meta")
      description.setAttribute("name", "description")
      document.head.appendChild(description)
    }
    description.setAttribute("content", meta.description)
  }, [activeHash])

  useEffect(() => {
    if (!pendingScrollTarget || activeTab !== "library") return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 80))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

  useEffect(() => {
    if (!pendingScrollTarget || activeTab !== "about") return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 80))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

  useEffect(() => {
    if (!pendingScrollTarget || activeTab !== "dataCompliance") return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 80))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

  useEffect(() => {
    if (!pendingScrollTarget || activeTab !== "projectEvolution") return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 80))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

  useEffect(() => {
    if (!pendingScrollTarget || activeTab !== "catalysis") return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 120))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

  useEffect(() => {
    if (!pendingScrollTarget || !["organicAcid", "algorithmValidation"].includes(activeTab)) return
    const scroll = () => {
      const target = document.getElementById(pendingScrollTarget)
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
        setPendingScrollTarget(null)
      }
    }
    const frame = window.requestAnimationFrame(() => window.setTimeout(scroll, 120))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, pendingScrollTarget])

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
    const normalizedTabs = {
      workflow: "home",
      screening: "ecoscreen",
      // V2.7: Performance Priority merged into EcoScreen; the standalone performance
      // route now redirects to EcoScreen instead of being a separate top-level tab.
      performance: "ecoscreen",
      comparison: "ecoscreen",
      validation: "about",
      resources: "about",
    }
    const nextTab = normalizedTabs[activeTab] || (getNavigationRoute(activeTab) ? activeTab : TABS[0]?.id || "home")
    if (nextTab !== activeTab) setActiveTab(nextTab)
  }, [activeTab])

  useEffect(() => {
    if (!apiStatus.checked) {
      setApiStatus(prev => ({
        ...prev,
        message: lang === "zh" ? "本地筛选模型" : "Local screening model",
      }))
    }
  }, [lang, apiStatus.checked])

  useEffect(() => {
    if (
      databaseSearchRows.length
      || (!searchOpen && !String(searchQuery || "").trim())
    ) return
    let active = true
    Promise.all([
      fetchDataJson("core_mof_2024/cr_search_index.json", []),
      fetchDataJson("fair_mofs_property_index_v1.json", { records: [] }),
      fetchDataJson("mof_physicochemical_index_v1.json", { records: [], summary: {} }),
    ]).then(([coreRows, fairIndex, physicochemicalIndex]) => {
      if (!active) return
      const fairCrossValidationByCoreId = new Map(
        (physicochemicalIndex?.records || []).map(record => [record.coreRecordId, record.fairMofsCrossValidation]),
      )
      const exactFairByCoreId = new Map()
      for (const record of fairIndex?.records || []) {
        if (record.match?.structureIdentityLevel !== "exact-refcode") continue
        for (const coreId of record.match?.matchedCoreRecordIds || []) {
          if (!exactFairByCoreId.has(coreId)) exactFairByCoreId.set(coreId, record)
        }
      }
      const coreSearchRows = (Array.isArray(coreRows) ? coreRows : []).map(record => ({
        ...record,
        databaseCandidateId: record.id,
        fairMofsRecord: exactFairByCoreId.get(record.id) || null,
        fairMofsCrossValidation: fairCrossValidationByCoreId.get(record.id) || null,
        physicochemicalCoverage: physicochemicalIndex?.summary || null,
        searchSource: exactFairByCoreId.has(record.id)
          ? "CoRE structure + FAIR-MOFs exact Refcode"
          : "CoRE MOF 2024 structure",
      }))
      const standaloneFairRows = (fairIndex?.records || [])
        .filter(record => record.match?.structureIdentityLevel !== "exact-refcode")
        .map(record => ({
          id: record.id,
          databaseCandidateId: record.id,
          displayName: record.csdRefcode,
          csdRefcode: record.csdRefcode,
          aliases: record.aliases,
          sourceRecordId: record.csdRefcode,
          sourceDatabase: "FAIR-MOFs",
          doi: record.doi,
          family: record.family,
          metalNode: record.inferredMetals?.join(", ") || "pending",
          topology: record.physicalProperties?.topology,
          fairMofsRecord: record,
          searchSource: record.match?.structureIdentityLevel === "base-refcode-variant"
            ? "FAIR-MOFs base-Refcode variant evidence"
            : "Standalone FAIR-MOFs evidence",
        }))
      setDatabaseSearchRows([...coreSearchRows, ...standaloneFairRows])
    }).catch(() => {
      if (active) setDatabaseSearchRows([])
    })
    return () => {
      active = false
    }
  }, [databaseSearchRows.length, searchOpen, searchQuery])

  useEffect(() => {
    if (!confirmedMofSelection) return
    const normalize = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "")
    if (normalize(searchQuery) !== normalize(confirmedMofSelection.query)) {
      setConfirmedMofSelection(null)
    }
  }, [confirmedMofSelection, searchQuery])

  const presetSuggestions = useMemo(() => {
    const presetRows = getPresetSuggestionNames(searchQuery)
    const query = String(searchQuery || "").trim().toLowerCase()
    if (!query) return presetRows
    const databaseRows = databaseSearchRows
      .filter(record => [
        record.commonName,
        record.displayName,
        record.csdRefcode,
        record.coreId,
        record.sourceRecordId,
        record.id,
        record.doi,
        record.family,
        record.metalNode,
        record.topology,
        ...(record.aliases || []),
      ].filter(Boolean).join(" ").toLowerCase().includes(query))
      .slice(0, Math.max(0, 8 - presetRows.length))
      .map(record => ({
        value: `database:${record.databaseCandidateId}`,
        label: record.commonName
          ? `${record.commonName} · CSD ${record.csdRefcode || record.sourceRecordId}`
          : `CSD ${record.csdRefcode || record.sourceRecordId}`,
        meta: `${record.metalNode || "metal pending"} · ${record.searchSource}`,
      }))
    return [...presetRows, ...databaseRows]
  }, [databaseSearchRows, searchQuery])

  const applyPreset = useCallback((name) => {
    if (String(name || "").startsWith("database:")) {
      const databaseCandidateId = String(name).slice("database:".length)
      const record = databaseSearchRows.find(row => row.databaseCandidateId === databaseCandidateId)
      if (!record) {
        setSearchStatus("miss")
        return
      }
      const displayName = record.commonName || record.csdRefcode || record.displayName || record.sourceRecordId
      setInputs(prev => ({
        ...prev,
        databaseCandidateId,
        mofName: displayName,
        ...(Number.isFinite(Number(record.surfaceArea)) ? { betSurfaceArea: Number(record.surfaceArea) } : {}),
        ...(Number.isFinite(Number(record.poreSizeA)) ? { poreDiameter: Number(record.poreSizeA) } : {}),
        ...(Number.isFinite(Number(record.poreVolume)) ? { poreVolume: Number(record.poreVolume) } : {}),
      }))
      setSearchQuery(displayName)
      setSearchOpen(false)
      setSearchStatus("loaded")
      setConfirmedMofSelection({ query: displayName, record })
      setRouteHash("ecoscreen")
      window.setTimeout(() => {
        document.getElementById("ecoscreen-scenario-controls")?.scrollIntoView({ block: "start", behavior: "smooth" })
      }, 220)
      window.setTimeout(() => setSearchStatus(null), 1800)
      return
    }
    const presetName = findPresetName(name)
    const preset = presetName ? MOF_PRESETS[presetName] : null
    if (!preset) {
      setSearchStatus("miss")
      return
    }
    const normalizedPreset = String(presetName).toLowerCase().replace(/[^a-z0-9]+/g, "")
    const matchedRecord = databaseSearchRows.find(record => [
      record.commonName,
      record.displayName,
      record.csdRefcode,
      ...(record.aliases || []),
    ].some(value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "") === normalizedPreset)) || null
    setInputs(prev => {
      const { databaseCandidateId: _databaseCandidateId, ...rest } = prev
      return {
        ...rest,
        ...preset,
        mofName: presetName,
        ...(matchedRecord ? {
          databaseCandidateId: matchedRecord.databaseCandidateId,
          betSurfaceArea: matchedRecord.surfaceArea,
          poreDiameter: matchedRecord.poreSizeA,
          poreVolume: matchedRecord.poreVolume,
        } : {}),
      }
    })
    setSearchQuery(presetName)
    setSearchOpen(false)
    setSearchStatus("loaded")
    setConfirmedMofSelection({
      query: presetName,
      record: matchedRecord || {
        displayName: presetName,
        commonName: presetName,
        sourceDatabase: "EcoMOF preset input",
        sourceVersion: "preset",
        surfaceArea: preset.betSurfaceArea,
        poreSizeA: preset.poreDiameter,
        pldA: preset.poreDiameter,
        poreVolume: preset.poreVolume,
        density: null,
        voidFraction: null,
      },
    })
    setRouteHash("ecoscreen")
    window.setTimeout(() => {
      document.getElementById("ecoscreen-scenario-controls")?.scrollIntoView({ block: "start", behavior: "smooth" })
      document.querySelector("[data-testid='ecoscreen-candidate-select']")?.focus()
    }, 220)
    window.setTimeout(() => setSearchStatus(null), 1800)
  }, [databaseSearchRows, setRouteHash])

  const navigateTab = useCallback((target, { resetScroll = false } = {}) => {
    const go = (hash) => {
      setRouteHash(hash)
      if (!resetScroll || typeof window === "undefined") return
      const scrollToModuleTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      scrollToModuleTop()
      window.requestAnimationFrame(scrollToModuleTop)
    }
    if (target === "overview") {
      go("overview")
      return
    }
    if (target === "ecoScreen") {
      go("ecoscreen")
      return
    }
    if (target === "performance") {
      go("performance")
      return
    }
    if (target === "gassep" || target === "gasSep") {
      go("gassep")
      return
    }
    if (target === "contact") {
      go("contact")
      return
    }
    if (target === "disclaimer") {
      go("disclaimer")
      return
    }
    if (target === "catalysisLab") {
      go("catalysis")
      return
    }
    if (target === "mofLibrary" || target === "resources" || target === "literature") {
      go("library")
      return
    }
    if (target === "data-quality-provenance") {
      go("data-quality-provenance")
      return
    }
    if (target === "benchmark-references") {
      go("benchmark-references")
      return
    }
    if (target === "validation-evidence") {
      go("validation-evidence")
      return
    }
    if (target === "graph-informed-descriptor-integration") {
      go("graph-informed-descriptor-integration")
      return
    }
    if (target === "organic-acid-graph-explorer") {
      go("organic-acid-graph-explorer")
      return
    }
    if (target === "methodology" || target === "about" || target === "validation") {
      go("methodology")
      return
    }
    if (target === "projectEvolution" || target === "project-evolution") {
      go("project-evolution")
      return
    }
    if (["feasibility", "lca", "sensitivity", "comparison"].includes(target)) {
      if (["feasibility", "lca", "sensitivity"].includes(target)) setComparisonTab(target)
      go("ecoscreen")
      return
    }
    if (["dataSources", "literature", "methods"].includes(target)) {
      setResourcesTab(target)
      go(target === "literature" ? "library" : "methodology")
      return
    }
    if (target === "screening" || target === "workflow" || target === "structure" || target === "interpretation" || target === "ml") {
      go("performance")
      return
    }
    const navigationItem = getNavigationItem(target)
    if (navigationItem) {
      go(navigationItem.hash)
      return
    }
    if (HASH_TO_TAB[target]) {
      go(target)
      return
    }
    go(tabToHash(target))
  }, [setRouteHash])

  const loadBenchmarkExample = useCallback((name = "UiO-66") => {
    applyPreset(name)
  }, [applyPreset])

  const addCurrentToComparison = useCallback(() => {
    const candidate = buildComparisonCandidate(inputs, results, lang)
    if (!candidate) return
    setComparisonCandidates(prev => {
      const withoutDuplicate = prev.filter(item => item.name !== candidate.name || item.gasSystem !== candidate.gasSystem)
      return [candidate, ...withoutDuplicate].slice(0, 3)
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
        message: lang === "zh" ? "未设置 API 地址；使用本地筛选模型。" : "No API URL set; using local screening model.",
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
          ? `API 不可用：${error.message}。将使用本地筛选模型。`
          : `API unavailable: ${error.message}. Local screening model will be used.`,
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
          ? `后端预测失败：${error.message}。已使用本地筛选模型。`
          : `Backend prediction failed: ${error.message}. Local screening model used.`,
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
    setRouteHash("performance")
  }, [setRouteHash])

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
      <LangCtx.Provider value={{ lang, locale, copy, setLang }}>
        <ViewportCtx.Provider value={viewport}>
          <AppShell
            theme={theme}
            lang={lang}
            locale={locale}
            copy={copy}
            viewport={viewport}
            activeHash={activeHash}
            activeTab={activeTab}
            setActiveTab={navigateTab}
            setLang={setLang}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
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
            disclaimerOpen={disclaimerOpen}
            setDisclaimerOpen={() => setRouteHash("disclaimer")}
            closeDisclaimerModal={closeDisclaimerModal}
            confirmedMofSelection={confirmedMofSelection}
          />
        </ViewportCtx.Provider>
      </LangCtx.Provider>
    </ThemeCtx.Provider>
  )
}
