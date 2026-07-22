// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  FieldProvenanceButton,
  FONT_SANS,
  PageHeader,
  fetchDataJson,
  toolbarBtn,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import pathwayStepsData from "../../../public/data/organic_acid_host_guest/pathway_steps.json"
import pathwayDescriptorMapData from "../../../public/data/organic_acid_host_guest/pathway_descriptor_map.json"
import hostMofCandidatesData from "../../../public/data/organic_acid_host_guest/host_mof_candidates.json"
import guestMetalCandidatesData from "../../../public/data/organic_acid_host_guest/guest_metal_candidates.json"
import hostGuestRoutesData from "../../../public/data/organic_acid_host_guest/host_guest_routes.json"
import evidenceRiskRecordsData from "../../../public/data/organic_acid_host_guest/evidence_risk_records.json"
import validationExperimentsData from "../../../public/data/organic_acid_host_guest/validation_experiments.json"
import activationReadinessSummaryData from "../../../public/data/organic_acid_experimental_activation/activation_readiness_summary.json"
import coreMofImportData from "../../../public/data/data_ingestion/core_mof_import_v2.json"
import qmofImportData from "../../../public/data/data_ingestion/qmof_import_v2.json"
import reactionDatasetData from "../../../public/data/data_ingestion/organic_acid_reaction_dataset_v1.json"
import gasAdsorptionRecordsData from "../../../public/data/gas_adsorption_records_v1.json"
import literatureDatasetData from "../../../public/data/organic_acid_literature_dataset_v2.json"
import goldDatasetData from "../../../public/data/organic_acid_gold_dataset_v2.json"
import appReleaseLog from "../../../public/data/app_release_log.json"
import { APP_VERSION_LABEL } from "../../constants/appVersion"
import { BlockFormula } from "../ui"
import {
  buildOrganicAcidAlgorithmFormulaJson,
  buildOrganicAcidAlgorithmLatexSummary,
  buildOrganicAcidAlgorithmMethodology,
  buildOrganicAcidAlgorithmMethodologyMarkdown,
} from "../../utils/organicAcidAlgorithmMethodology"
import { buildProjectOverviewCards, buildProjectStatusSummary, loadProjectStatusSummary } from "../../utils/projectStatus"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)
const pct = value => Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : String(value ?? "pending")

function Card({ id, title, subtitle, children, t, actions }) {
  return (
    <section id={id} data-testid={id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <h2 style={{ color: t.textStrong, fontSize: 18, lineHeight: 1.18, margin: 0 }}>{title}</h2>
          {subtitle ? <p style={{ color: t.muted, fontSize: 12.3, lineHeight: 1.55, margin: 0 }}>{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

function MetricCard({ label, value, source, t, lang, tone = "info", fieldKey }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.good || t.accentText) : t.textStrong
  const key = fieldKey || label
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ alignItems: "center", color, display: "inline-flex", fontSize: 20, fontWeight: 930, lineHeight: 1.12, marginTop: 6, maxWidth: "100%" }}>
        <span style={{ overflowWrap: "anywhere" }}>{value}</span>
        <FieldProvenanceButton fieldKey={key} fieldLabel={label} source={source} lang={lang} />
      </strong>
    </div>
  )
}

function SectionNav({ sections, t }) {
  return (
    <nav style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
      {sections.map(item => (
        <a key={item.id} href={`#${item.id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.muted, flex: "0 0 auto", fontSize: 11.5, fontWeight: 850, padding: "7px 9px", textDecoration: "none" }}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}

function downloadText(fileName, content, type = "text/plain") {
  if (typeof document === "undefined") return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function copyText(value) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return
  navigator.clipboard.writeText(value)
}

function EvolutionOverview({ data, projectStatus, lang, t, isMobile }) {
  const overview = data.overview || {}
  const resolvedStatus = projectStatus || buildProjectStatusSummary({ versionEvolution: data })
  const labelMap = {
    databaseScale: text(lang, "数据库规模", "Database Scale"),
    experimentalLabels: text(lang, "实验标签", "Experimental Labels"),
    benchmarkEligible: text(lang, "Benchmark 就绪", "Benchmark Ready"),
    bestModel: text(lang, "最佳模型", "Best Model"),
    credibility: text(lang, "模型可信度", "Credibility"),
    currentRisk: text(lang, "当前风险", "Current Risk"),
  }
  const translatedValue = (card) => {
    if (lang === "zh" && card.id === "currentRisk" && /High Overfitting Risk/i.test(String(card.value))) return "高过拟合风险"
    if (lang === "zh" && card.id === "credibility") return String(card.value).replace("Grade ", "")
    return card.value
  }
  const appVersionSource = {
    value: APP_VERSION_LABEL,
    sourceDatabase: "app_release_log.json",
    sourceRecordId: "currentAppVersion",
    sourceUrl: "public/data/app_release_log.json",
    citation: "EcoMOF-AI unified App release log.",
    license: "Project repository license context.",
    retrievedAt: "2026-07-22",
    curationStatus: "confirmed",
    confidence: 1,
    evidenceTier: "confirmed",
    notes: "Current App release number. Module V3.x records remain historical data/module versions.",
  }
  const moduleVersionCard = buildProjectOverviewCards(resolvedStatus).find(card => card.id === "currentVersion")
  const cards = [
    { id: "appVersion", label: text(lang, "当前 App 版本", "Current App Version"), value: APP_VERSION_LABEL, source: appVersionSource, tone: "pass" },
    { id: "moduleDataVersion", label: text(lang, "最新模块数据版本", "Latest Module Data Version"), value: moduleVersionCard?.value || resolvedStatus.currentVersion, source: moduleVersionCard?.source || resolvedStatus.sources?.currentVersion, tone: "info" },
    ...buildProjectOverviewCards(resolvedStatus)
      .filter(card => card.id !== "currentVersion")
      .map(card => ({ ...card, label: labelMap[card.id] || card.label, value: translatedValue(card) })),
  ]
  const databasePreviewLabel = lang === "zh" ? "数据库预览" : overview.databasePreviewStatus
  const notFinalLabel = lang === "zh" ? "非最终推荐" : overview.notFinalRecommendationStatus
  return (
    <Card
      id="project-evolution-overview"
      title={text(lang, "项目状态总览", "Evolution Overview")}
      subtitle={text(lang, "动态项目状态中心；所有关键数字都由项目数据源聚合并带来源按钮。", "Dynamic project status center; every key number is aggregated from project data sources with provenance.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
        {cards.map(card => (
          <MetricCard key={card.id} fieldKey={card.id} label={card.label} value={card.value} source={card.source} t={t} lang={lang} tone={card.tone} />
        ))}
        <MetricCard fieldKey="verifiedMetadata" label={text(lang, "已核验元数据", "Verified Metadata")} value={resolvedStatus.verifiedMetadata} source={resolvedStatus.sources?.verifiedMetadata} t={t} lang={lang} tone="pass" />
        <MetricCard fieldKey="goldDataset" label={text(lang, "Gold 数据集", "Gold Dataset")} value={resolvedStatus.goldDataset} source={resolvedStatus.sources?.goldDataset} t={t} lang={lang} />
        <MetricCard fieldKey="externalTest" label={text(lang, "外部测试", "External Test")} value={resolvedStatus.externalTest} source={resolvedStatus.sources?.externalTest} t={t} lang={lang} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="proxy">{databasePreviewLabel}</BasisBadge>
        <BasisBadge tone="warn">{notFinalLabel}</BasisBadge>
      </div>
    </Card>
  )
}

function getCurrentRelease(log) {
  const releases = Array.isArray(log?.releases) ? log.releases : []
  const current = String(log?.currentAppVersion || "").trim()
  return releases.find(row => row.appVersion === current) || releases[0] || null
}

function localize(value, lang) {
  return value && typeof value === "object" ? value[lang === "zh" ? "zh" : "en"] : value
}

function publicHistoryNote(note, lang) {
  const value = String(note || "")
  if (!value) return value
  const developerPattern = /src\/|scripts\/|data-testid|undefined|null|NaN|\[object Object\]|fallback|\.json|\.js|Worker|main thread|browser|GitHub Actions|typecheck|visual check|schema|pipeline|manifest|fetch|lazy|smoke|regression|脚本|组件|主线程|浏览器|路由|深链接|写死|回归|冒烟|测试覆盖/i
  if (!developerPattern.test(value)) return value
  return text(
    lang,
    "保留该阶段原始版本号与能力变化；实现细节不在前台展开。",
    "Original version and capability change retained; implementation details are omitted from the public view."
  )
}

function StatusBadge({ tone, children, t }) {
  const palette = tone === "warn"
    ? { background: t.badgeWarnBg, color: t.warn, border: t.warn }
    : { background: t.badgeInfoBg, color: t.accentText, border: t.accent }
  return (
    <span style={{ alignItems: "center", background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 999, color: palette.color, display: "inline-flex", fontSize: 10, fontWeight: 900, letterSpacing: 0.2, padding: "3px 8px", textTransform: "uppercase" }}>
      {children}
    </span>
  )
}

function TimelineEntry({ versionLabel, title, summary, badges, fields, t, isMobile, highlight, isLast }) {
  return (
    <div style={{ display: "grid", gap: isMobile ? 9 : 12, gridTemplateColumns: "auto minmax(0, 1fr)", minWidth: 0 }}>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
        <span style={{ background: highlight ? t.accent : t.panel, border: `2px solid ${highlight ? t.accent : t.border}`, borderRadius: 999, flexShrink: 0, height: 12, marginTop: 5, width: 12 }} />
        {!isLast ? <span style={{ background: t.border, flex: 1, minHeight: 18, width: 2 }} /> : null}
      </div>
      <article style={{ background: highlight ? t.badgeInfoBg : t.surface, border: `1px solid ${highlight ? t.accent : t.border}`, borderRadius: 9, display: "grid", gap: fields?.length ? 8 : 5, marginBottom: 12, minWidth: 0, padding: isMobile ? 11 : 13 }}>
        <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
          <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{versionLabel}</strong>
          {title ? <span style={{ color: t.muted, fontSize: 12.5 }}>· {title}</span> : null}
          {badges}
        </header>
        {summary ? <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{summary}</span> : null}
        {fields?.length ? (
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {fields.filter(([, , value]) => value).map(([key, label, value, warn]) => (
              <div key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, minWidth: 0, padding: 8 }}>
                <span style={{ color: t.faint, display: "block", fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                <span style={{ color: warn ? t.warn : t.textStrong, display: "block", fontSize: 11.2, lineHeight: 1.4, marginTop: 3 }}>{value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  )
}

function impactFields(row, lang) {
  return [
    ["scientificImpact", text(lang, "科研影响", "Scientific Impact"), localize(row.scientificImpact, lang), false],
    ["validationImpact", text(lang, "验证影响", "Validation Impact"), localize(row.validationImpact, lang), false],
    ["breakingChanges", text(lang, "破坏性变更", "Breaking Changes"), localize(row.breakingChanges, lang), true],
    ["nextVersionGoal", text(lang, "下一版本目标", "Next Version Goal"), localize(row.nextVersionGoal, lang), false],
  ]
}

function UnifiedReleaseCenter({ log, lang, t, isMobile }) {
  const releases = log?.releases || []
  const catalog = log?.moduleCatalog || {}
  const [activeVersion, setActiveVersion] = useState(releases[0]?.appVersion || "")
  const release = releases.find(row => row.appVersion === activeVersion) || releases[0]
  const moduleKeys = release ? Object.keys(release.modules || {}) : []
  const [activeModule, setActiveModule] = useState(moduleKeys[0] || "")
  const activeModuleKey = moduleKeys.includes(activeModule) ? activeModule : moduleKeys[0]
  const activeModuleData = activeModuleKey ? release.modules[activeModuleKey] : null
  const historyByModule = log?.history?.byModule || {}
  const isCurrentRelease = release?.appVersion === log?.currentAppVersion

  if (!release) return null

  return (
    <Card
      id="project-evolution-app-release"
      title={text(lang, "统一版本中心", "Unified Release Center")}
      subtitle={text(lang, "一个 App 版本号管全局；每次发布只列出本次有更新的模块，点模块看二级更新要点。", "One App version governs the whole platform; each release lists only the modules it changed — open a module for its detailed updates.")}
      t={t}
      actions={
        <label style={{ alignItems: "center", display: "inline-flex", gap: 7 }}>
          <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{text(lang, "版本", "Version")}</span>
          <select
            value={activeVersion}
            onChange={event => setActiveVersion(event.target.value)}
            aria-label={text(lang, "选择 App 版本", "Select App version")}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 12, fontWeight: 850, minHeight: 34, padding: "6px 9px" }}
          >
            {releases.map(row => (
              <option key={row.appVersion} value={row.appVersion}>{`App ${row.appVersion}`}</option>
            ))}
          </select>
        </label>
      }
    >
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10 }}>
        <span style={{ alignItems: "baseline", background: t.badgeInfoBg, border: `1px solid ${t.accent}`, borderRadius: 10, color: t.accentText, display: "inline-flex", fontFamily: FONT_SANS, fontSize: 19, fontWeight: 950, gap: 6, padding: "6px 12px" }}>
          App {release.appVersion}
        </span>
        <StatusBadge tone="info" t={t}>{isCurrentRelease ? text(lang, "当前 App 发布", "Current App Release") : text(lang, "历史 App 发布", "Historical App Release")}</StatusBadge>
      </div>
      <p style={{ color: t.textStrong, fontSize: 13.5, fontWeight: 850, lineHeight: 1.5, margin: 0 }}>{localize(release.headline, lang)}</p>
      <p style={{ color: t.muted, fontSize: 12.2, lineHeight: 1.55, margin: 0 }}>{localize(release.summary, lang)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {moduleKeys.map(key => {
          const isActive = key === activeModuleKey
          const label = localize(catalog[key]?.label, lang) || key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveModule(key)}
              data-testid={`app-release-module-tab-${key}`}
              style={{ background: isActive ? t.badgeInfoBg : t.surface, border: `1px solid ${isActive ? t.accent : t.border}`, borderRadius: 999, color: isActive ? t.accentText : t.muted, cursor: "pointer", fontSize: 11.5, fontWeight: 850, minHeight: 32, padding: "6px 12px" }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {activeModuleData ? (
        <article data-testid={`app-release-module-panel-${activeModuleKey}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: isMobile ? 11 : 13 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{localize(catalog[activeModuleKey]?.label, lang) || activeModuleKey}</strong>
          <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>{localize(activeModuleData.summary, lang)}</span>
          <ul style={{ display: "grid", gap: 6, margin: 0, paddingLeft: 18 }}>
            {(activeModuleData.changes || []).map((change, index) => (
              <li key={index} style={{ color: t.textStrong, fontSize: 11.8, lineHeight: 1.5 }}>{localize(change, lang)}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 11px" }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>
          {localize(log?.history?.label, lang) || text(lang, "历史沿革（pre-1.0）", "History (pre-1.0)")}
        </summary>
        <p style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.5, margin: "9px 0 0" }}>{localize(log?.history?.note, lang)}</p>
        <div style={{ display: "grid", gap: 9, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", marginTop: 10 }}>
          {Object.entries(historyByModule).map(([key, rows]) => (
            <div key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, minWidth: 0, padding: 10 }}>
              <strong style={{ color: t.textStrong, fontSize: 12 }}>{localize(catalog[key]?.label, lang) || key} · {rows.length}</strong>
              <div style={{ display: "grid", gap: 4 }}>
                {rows.slice(-6).reverse().map(row => (
                  <div key={`${key}-${row.version}`} style={{ color: t.muted, fontSize: 10.8, lineHeight: 1.4 }}>
                    <span style={{ color: t.accentText, fontFamily: FONT_SANS, fontWeight: 850 }}>{row.version}</span>
                    <span> · {publicHistoryNote(row.note, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </Card>
  )
}

function PendingReleaseDraft({ log, lang, t, isMobile }) {
  const draft = log?.pendingNextRelease
  if (!draft) return null
  const modules = Object.entries(draft.modules || {})
  return (
    <Card
      id="project-evolution-next-release-draft"
      title={text(lang, "下一版更新预告", "Next Release Preview")}
      subtitle={text(
        lang,
        "本轮已确认的改动会先归入下一版预告；正式版本号在发布时确认。",
        "Confirmed changes in this round are collected here first; the final version number is assigned at release time."
      )}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {[
          [text(lang, "基础版本", "Base version"), draft.baseAppVersion],
          [text(lang, "目标版本号", "Target version"), localize(draft.versionPolicy, lang)],
          [text(lang, "状态", "Status"), localize(draft.statusLabel, lang)],
          [text(lang, "记录日期", "Recorded"), draft.recordedAt],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 10 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, display: "block", fontSize: 12.2, lineHeight: 1.4, marginTop: 5, overflowWrap: "anywhere" }}>{value || "—"}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {modules.map(([key, module]) => (
          <article key={key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{localize(module.label, lang)}</strong>
            <span style={{ color: t.muted, fontSize: 11.8, lineHeight: 1.5 }}>{localize(module.summary, lang)}</span>
            <ul style={{ display: "grid", gap: 6, margin: 0, paddingLeft: 18 }}>
              {(module.changes || []).map((change, index) => (
                <li key={index} style={{ color: t.textStrong, fontSize: 11.8, lineHeight: 1.5 }}>{localize(change, lang)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Card>
  )
}

function VersionTimeline({ data, lang, t, isMobile }) {
  const [query, setQuery] = useState("")
  const versions = data.versions || []
  const ordered = [...versions].reverse()
  const recent = ordered.slice(0, 2)
  const earlier = ordered.slice(2)
  const q = query.trim().toLowerCase()
  const searchPool = ordered
  const matches = q
    ? searchPool.filter(row => `${row.version} ${row.summary} ${(row.categories || []).join(" ")}`.toLowerCase().includes(q))
    : null

  return (
    <Card
      id="project-evolution-version-timeline"
      title={text(lang, "模块历史时间线", "Module History Timeline")}
      subtitle={text(lang, "这里只展示 V3.x 等模块/数据历史；当前 App 发布号在统一版本中心维护，避免新旧版本混读。", "This timeline only shows V3.x module/data history; the current App release is maintained in the Unified Release Center to avoid mixing release schemes.")}
      t={t}
      actions={<input value={query} onChange={event => setQuery(event.target.value)} placeholder={text(lang, "搜索版本", "Search versions")} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "7px 9px" }} />}
    >
      {matches ? (
        <div style={{ display: "grid" }}>
          {matches.length ? matches.map((row, index) => (
            <TimelineEntry key={row.version} versionLabel={row.version} summary={row.summary} t={t} isMobile={isMobile} isLast={index === matches.length - 1} />
          )) : (
            <span style={{ color: t.muted, fontSize: 12 }}>{text(lang, "没有匹配的版本。", "No matching versions.")}</span>
          )}
        </div>
      ) : (
        <div style={{ display: "grid" }}>
          {recent.map((row, index) => (
            <TimelineEntry key={row.version} versionLabel={row.version} summary={row.summary} fields={impactFields(row, lang)} t={t} isMobile={isMobile} highlight={index === 0} isLast={false} />
          ))}
          {earlier.length ? (
            <details style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 11px" }}>
              <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12, fontWeight: 850 }}>
                {text(lang, "查看早期版本", "View earlier milestones")}
              </summary>
              <div style={{ display: "grid", marginTop: 11 }}>
                {earlier.map((row, index) => (
                  <TimelineEntry key={row.version} versionLabel={row.version} summary={row.summary} t={t} isMobile={isMobile} isLast={index === earlier.length - 1} />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </Card>
  )
}

function ProjectUpdates({ log, lang, t, isMobile }) {
  const release = getCurrentRelease(log)
  const catalog = log?.moduleCatalog || {}
  const streams = release
    ? Object.entries(release.modules || {}).map(([key, module], index) => ({
        key,
        no: String(index + 1).padStart(2, "0"),
        label: localize(catalog[key]?.label, lang) || localize(module.label, lang) || key,
        body: localize(module.summary, lang),
        changes: (module.changes || []).map(change => localize(change, lang)).filter(Boolean),
      }))
    : []

  if (!release) return null

  return (
    <Card
      id="project-evolution-release-notes"
      title={text(lang, "项目更新", "Project Updates")}
      subtitle={text(
        lang,
        `当前 App ${release.appVersion} 的模块更新由统一版本记录生成；版本记录调整后此处自动更新。`,
        `Module updates for App ${release.appVersion} come from the unified release record and update automatically when that record changes.`
      )}
      t={t}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {streams.map(stream => (
          <article key={stream.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 11, gridTemplateColumns: "auto minmax(0, 1fr)", minWidth: 0, padding: isMobile ? 11 : 13 }}>
            <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, display: "inline-flex", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 950, height: 34, justifyContent: "center", width: 34 }}>
              {stream.no}
            </span>
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{stream.label}</strong>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5 }}>{stream.body}</span>
              {stream.changes.length ? (
                <ul style={{ display: "grid", gap: 5, margin: "3px 0 0", paddingLeft: 17 }}>
                  {stream.changes.slice(0, 3).map((change, index) => (
                    <li key={index} style={{ color: t.textStrong, fontSize: 11.3, lineHeight: 1.45 }}>{change}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function MiniBarChart({ rows, xKey, yKey, t, labelFormatter = value => value }) {
  const max = Math.max(1, ...rows.map(row => Number(row[yKey]) || 0))
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {rows.map(row => {
        const value = Number(row[yKey])
        const width = Number.isFinite(value) ? `${Math.max(4, Math.round(value / max * 100))}%` : "4%"
        return (
          <div key={`${row[xKey]}-${yKey}`} style={{ display: "grid", gap: 4 }}>
            <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between" }}>
              <span style={{ color: t.muted, fontSize: 11.3, fontWeight: 850 }}>{row[xKey]}</span>
              <strong style={{ color: t.textStrong, fontSize: 11.5 }}>{labelFormatter(row[yKey])}</strong>
            </div>
            <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 999, height: 9, overflow: "hidden" }}>
              <span style={{ background: t.accent, display: "block", height: "100%", width }} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ScientificEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-scientific" title={text(lang, "科研能力演化", "Scientific Evolution")} subtitle={text(lang, "Raw Screening -> CRITIC -> Evidence Framework -> Screening Trace -> Verified Metadata -> Model Validation Lab -> Research Outputs Framework -> Future Experimental Validation.", "Raw Screening -> CRITIC -> Evidence Framework -> Screening Trace -> Verified Metadata -> Model Validation Lab -> Research Outputs Framework -> Future Experimental Validation.")} t={t}>
      <MiniBarChart rows={data.scientificEvolution || []} xKey="stage" yKey="maturity" t={t} labelFormatter={value => `${value}/100`} />
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "科研能力成长", "Scientific Capability Growth")}</strong>
    </Card>
  )
}

function DatabaseEvolution({ data, lang, t }) {
  const rows = data.databaseEvolution || []
  const databaseSize = data.overview?.databaseSize
  const verifiedMetadataCount = data.overview?.verifiedMetadataCount
  return (
    <Card id="project-evolution-database" title={text(lang, "数据库演化", "Database Evolution")} subtitle={text(lang, "数据库成长、已核验元数据成长与字段级溯源覆盖率。", "Database growth, verified metadata growth, and field provenance coverage.")} t={t}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "数据库规模成长", "Database Growth")}</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="candidateCount" t={t} labelFormatter={value => value === "pending" ? text(lang, "待补", "pending") : `${value} Candidates`} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "已核验元数据成长", "Verified Metadata Growth")}</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="verifiedCount" t={t} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "字段级溯源覆盖率", "Field Provenance Coverage")}</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="fieldProvenanceCoverage" t={t} labelFormatter={pct} />
        </div>
      </div>
      <div style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}>
        <span>{databaseSize}+ Candidates</span>
        <FieldProvenanceButton fieldKey="databaseSize" fieldLabel={`${databaseSize}+ Candidates`} source={data.overview?.sources?.databaseSize} lang={lang} />
        <span> · {text(lang, `${verifiedMetadataCount} 条已核验元数据`, `${verifiedMetadataCount} verified metadata`)}</span>
        <FieldProvenanceButton fieldKey="verifiedMetadataCount" fieldLabel={`${verifiedMetadataCount} verified metadata`} source={data.overview?.sources?.verifiedMetadataCount} lang={lang} />
      </div>
    </Card>
  )
}

function AlgorithmEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-algorithm" title={text(lang, "算法演化", "Algorithm Evolution")} subtitle={text(lang, "描述符评分 → CRITIC → 证据修正 → 筛选流程追踪 → 数据质量审计 → 模型验证实验室 → 未来 ML 验证。", "Descriptor Scoring -> CRITIC -> Evidence Adjustment -> Screening Trace -> Data Quality Audit -> Model Validation Lab -> Future ML Validation.")} t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {(data.algorithmEvolution || []).map(row => (
          <article key={row.stage} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.stage} · {row.version}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "新增", "New")}: {row.newCapability}</span>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "退役", "Retired")}: {row.retiredCapability}</span>
            <span style={{ color: t.warn, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "局限", "Limitation")}: {row.limitation}</span>
            <span style={{ color: t.accentText, fontSize: 11.5, lineHeight: 1.45 }}>{text(lang, "未来", "Future")}: {row.futurePlan}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function FormulaMethodCard({ formula, t, lang }) {
  return (
    <div id={`project-evolution-organic-acid-algorithm-methodology-formula-${formula.id}`} data-testid={`organic-acid-formula-${formula.id}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 10, scrollMarginTop: 118 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{formula.title}</strong>
        <button type="button" onClick={() => copyText(`\\[${formula.latex}\\]`)} style={{ ...toolbarBtn(t), minHeight: 28, padding: "5px 8px" }}>
          {text(lang, "复制 LaTeX", "Copy LaTeX")}
        </button>
      </div>
      <BlockFormula math={formula.latex} t={t} style={{ background: t.panel, maxWidth: "100%", minWidth: 0 }} />
    </div>
  )
}

function MethodologyPill({ children, tone, t }) {
  const styles = tone === "risk"
    ? { background: t.badgeWarnBg, border: t.warn, color: t.warn }
    : { background: t.badgeInfoBg, border: t.accent, color: t.accentText }
  return (
    <span style={{ alignItems: "center", background: styles.background, border: `1px solid ${styles.border}`, borderRadius: 999, color: styles.color, display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
      {children}
    </span>
  )
}

function OrganicAcidAlgorithmMethodology({ methodology, lang, t, isMobile }) {
  const context = methodology.dynamicContext
  const exportRows = [
    {
      label: "Organic Acid Algorithm Methodology Markdown",
      action: () => downloadText(methodology.exportNames.markdown, buildOrganicAcidAlgorithmMethodologyMarkdown(methodology), "text/markdown"),
    },
    {
      label: "Organic Acid Algorithm Formula JSON",
      action: () => downloadText(methodology.exportNames.formulaJson, JSON.stringify(buildOrganicAcidAlgorithmFormulaJson(methodology), null, 2), "application/json"),
    },
    {
      label: "Organic Acid Algorithm LaTeX Summary",
      action: () => downloadText(methodology.exportNames.latexSummary, buildOrganicAcidAlgorithmLatexSummary(methodology), "text/plain"),
    },
  ]
  return (
    <Card
      id={methodology.id}
      title={text(lang, methodology.titleZh, methodology.title)}
      subtitle={text(lang, "V3.9.8 独立算法方法论模块：展示八因子加权几何 HGCPS、描述符消融、真实价格、预注册纪律与审计结论；不预设最终赢家。", "A standalone V3.9.8 methodology module covering the eight-factor weighted-geometric HGCPS, descriptor ablation, real prices, preregistration discipline, and audit conclusions; no final winner is preset.")}
      t={t}
      actions={<CopyLinkButton hash={methodology.id} ariaLabel={text(lang, "复制算法方法论链接", "Copy algorithm methodology link")} />}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <MethodologyPill t={t}>{context.currentTopRoute}</MethodologyPill>
        <MethodologyPill t={t}>HGCPS {context.hgcps}</MethodologyPill>
        <MethodologyPill t={t}>{context.readinessLevel}</MethodologyPill>
        <MethodologyPill tone="risk" t={t}>High-priority experimental hypothesis</MethodologyPill>
        <MethodologyPill tone="risk" t={t}>Not final catalytic proof</MethodologyPill>
        <MethodologyPill tone="risk" t={t}>Not ready for formal machine learning</MethodologyPill>
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))" }}>
        {[
          [text(lang, "当前路线", "Current top route"), context.currentTopRoute],
          [text(lang, "主体", "Selected host"), `${context.selectedHost} · ${context.selectedHostRole}`],
          [text(lang, "客体", "Selected guest"), `${context.selectedGuest} · ${context.selectedGuestRole}`],
          [text(lang, "边界", "Boundary"), `${context.performanceClaimStatus}; ${context.mlReadinessStatus}`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10 }}>
            <span style={{ color: t.faint, display: "block", fontSize: 10.5, fontWeight: 900 }}>{label}</span>
            <strong style={{ color: t.textStrong, display: "block", fontSize: 12.2, lineHeight: 1.45, marginTop: 4 }}>{value}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {methodology.sections.map((section, index) => (
          <details id={`project-evolution-organic-acid-algorithm-methodology-${section.id}`} key={section.id} open={index === 0 || section.id === "hgcps"} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, padding: 11, scrollMarginTop: 118 }}>
            <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 13.5, fontWeight: 900 }}>
              {index + 1}. {text(lang, section.titleZh, section.title)}
            </summary>
            <div style={{ display: "grid", gap: 10, marginTop: 11 }}>
              <div style={{ color: t.muted, fontSize: 12.1, lineHeight: 1.55 }}>{text(lang, section.explanationZh, section.explanation)}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {section.formulas.map(formula => <FormulaMethodCard key={formula.id} formula={formula} t={t} lang={lang} />)}
              </div>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
                {[
                  [text(lang, "输入", "Input"), section.input],
                  [text(lang, "输出", "Output"), section.output],
                  [text(lang, "当前边界", "Limitation"), section.limitation],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 9 }}>
                    <span style={{ color: t.faint, display: "block", fontSize: 10.5, fontWeight: 900 }}>{label}</span>
                    <span style={{ color: t.muted, display: "block", fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {section.dataSource.map(source => (
                  <MethodologyPill key={source} t={t}>{source}</MethodologyPill>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {exportRows.map(row => (
          <button key={row.label} type="button" onClick={row.action} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
            {row.label}
          </button>
        ))}
      </div>
    </Card>
  )
}

function ValidationEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-validation" title={text(lang, "验证体系演化", "Validation Evolution")} subtitle={text(lang, "来源已确认 → 引文已就绪 → 已核验元数据 → 外部验证 → 实验验证。", "Source Confirmed -> Citation Ready -> Verified Metadata -> External Validation -> Experimental Validation.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.validationEvolution || []).map(row => (
          <article key={row.stage} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.stage}</strong>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{row.definition}</span>
            <span style={{ color: t.accentText, fontSize: 11.2 }}>{text(lang, "通过条件", "Pass")}: {row.passCondition}</span>
            <span style={{ color: t.warn, fontSize: 11.2 }}>{text(lang, "阻断条件", "Block")}: {row.blockingCondition}</span>
            <span style={{ color: t.textStrong, fontSize: 11.4, fontWeight: 850 }}>{text(lang, "当前数量", "Current")}: {row.currentCount}</span>
            <span style={{ color: t.faint, fontSize: 11.2 }}>{text(lang, "下一步", "Next")}: {row.nextGoal}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function UiEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-ui" title={text(lang, "界面演化", "UI Evolution")} subtitle={text(lang, "记录首页、EcoScreen、GasSep、催化实验室、MOF 候选库、数据质量审计与项目演化的界面演化；旧版科研输出页只保留为历史记录。", "Tracks UI evolution for Home, EcoScreen, GasSep, CatalysisLab, MOF Library, Data Quality Audit, and Project Evolution; legacy research-output pages remain historical only.")} t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {(data.uiEvolution || []).map(row => (
          <article key={`${row.version}-${row.area}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "minmax(110px, 0.35fr) minmax(0, 0.65fr)", padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12 }}>{row.version} · {row.area}</strong>
            <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.45 }}>{text(lang, "改造前", "Before")}: {row.before}<br />{text(lang, "改造后", "After")}: {row.after}<br />{text(lang, "变化", "Change")}: {row.change}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function MilestoneCenter({ data, lang, t }) {
  const [active, setActive] = useState(data.milestones?.[0]?.id)
  const selected = (data.milestones || []).find(row => row.id === active) || data.milestones?.[0]
  return (
    <Card id="project-evolution-milestones" title={text(lang, "关键里程碑", "Milestones")} subtitle={text(lang, "关键里程碑时间线，选择节点查看科研能力变化。", "Milestone Timeline; select a node to review capability changes.")} t={t}>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
        {(data.milestones || []).map(row => (
          <button key={row.id} type="button" onClick={() => setActive(row.id)} style={{ background: row.id === selected?.id ? t.badgeInfoBg : t.surface, border: `1px solid ${row.id === selected?.id ? t.accent : t.border}`, borderRadius: 8, color: row.id === selected?.id ? t.accentText : t.muted, cursor: "pointer", flex: "0 0 auto", fontSize: 11.5, fontWeight: 850, minHeight: 36, padding: "7px 9px" }}>
            {row.title}
          </button>
        ))}
      </div>
      {selected ? (
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 10 }}>
          <strong style={{ color: t.textStrong, fontSize: 13 }}>{selected.title} · {selected.version}</strong>
          <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>{selected.detail}</span>
        </article>
      ) : null}
    </Card>
  )
}

function Roadmap({ data, lang, t }) {
  const rows = (data.versions || []).slice(-6).map(row => ({
    version: row.version,
    plannedFeatures: row.categories || [row.summary],
    scientificGoal: row.nextVersionGoal || row.scientificImpact,
    databaseGoal: row.databaseImpact,
    validationGoal: row.validationImpact,
    knownRisks: String(row.knownLimitations || "pending").split(/[;；。]/).map(item => item.trim()).filter(Boolean),
  }))
  return (
    <Card id="project-evolution-roadmap" title={text(lang, "发展路线图", "Roadmap")} subtitle={text(lang, "由版本演化记录动态读取最近阶段目标、数据目标和验证风险。", "Dynamically reads recent stage goals, data goals, and validation risks from version evolution records.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.version} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{row.version}</strong>
            <span style={{ color: t.accentText, fontSize: 11.5, fontWeight: 850 }}>{row.plannedFeatures.join(", ")}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "科研目标", "Scientific Goal")}: {row.scientificGoal}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "数据库目标", "Database Goal")}: {row.databaseGoal}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "验证目标", "Validation Goal")}: {row.validationGoal}</span>
            <span style={{ color: t.warn, fontSize: 11.3, lineHeight: 1.45 }}>{text(lang, "已知风险", "Known Risks")}: {row.knownRisks.join("; ")}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function LocalizationEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-localization" title={text(lang, "汉化演化", "Localization Evolution")} subtitle={text(lang, "记录术语统一、科研表达规范与科研输出框架的历史新增时间。", "Tracks terminology unification, scientific language guidance, and historical research-output additions.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.localizationEvolution || []).map(row => (
          <article key={`${row.version}-${row.area}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.version} · {row.area}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{row.change}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

export function ProjectEvolutionTab({ onNavigate, data: providedData = null }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [data, setData] = useState(providedData)
  const [projectStatus, setProjectStatus] = useState(() => providedData ? buildProjectStatusSummary({ versionEvolution: providedData }) : null)
  const organicAcidMethodology = useMemo(() => buildOrganicAcidAlgorithmMethodology({
    pathwaySteps: pathwayStepsData,
    pathwayDescriptorMap: pathwayDescriptorMapData,
    hostMofCandidates: hostMofCandidatesData,
    guestMetalCandidates: guestMetalCandidatesData,
    hostGuestRoutes: hostGuestRoutesData,
    evidenceRiskRecords: evidenceRiskRecordsData,
    validationExperiments: validationExperimentsData,
    coreMofImport: coreMofImportData,
    qmofImport: qmofImportData,
    reactionDataset: reactionDatasetData,
    gasAdsorptionRecords: gasAdsorptionRecordsData,
    literatureDataset: literatureDatasetData,
    goldDataset: goldDatasetData,
    activationReadinessSummary: activationReadinessSummaryData,
  }), [])

  useEffect(() => {
    if (providedData) {
      setData(providedData)
      setProjectStatus(buildProjectStatusSummary({ versionEvolution: providedData }))
      return undefined
    }
    let active = true
    Promise.all([
      fetchDataJson("version_evolution_records.json", null),
      loadProjectStatusSummary(),
    ])
      .then(([payload, status]) => {
        if (!active) return
        setData(payload)
        setProjectStatus(status)
      })
      .catch(() => { if (active) setData(null) })
    return () => { active = false }
  }, [providedData])

  const sections = useMemo(() => [
    { id: "project-evolution-app-release", label: text(lang, "统一版本中心", "Unified Release") },
    { id: "project-evolution-overview", label: text(lang, "总览", "Overview") },
    { id: "project-evolution-next-release-draft", label: text(lang, "待发布日志", "Next Draft") },
    { id: "project-evolution-version-timeline", label: text(lang, "模块历史时间线", "Module History") },
    { id: "project-evolution-release-notes", label: text(lang, "项目更新", "Project Updates") },
    { id: "project-evolution-scientific", label: text(lang, "科研能力演化", "Scientific Evolution") },
    { id: "project-evolution-database", label: text(lang, "数据库演化", "Database Evolution") },
    { id: "project-evolution-algorithm", label: text(lang, "算法演化", "Algorithm Evolution") },
    { id: "project-evolution-organic-acid-algorithm-methodology", label: text(lang, "有机酸算法方法论", "Organic Acid Methodology") },
    { id: "project-evolution-validation", label: text(lang, "验证体系演化", "Validation Evolution") },
    { id: "project-evolution-ui", label: text(lang, "界面演化", "UI Evolution") },
    { id: "project-evolution-localization", label: text(lang, "汉化演化", "Localization Evolution") },
    { id: "project-evolution-milestones", label: text(lang, "关键里程碑", "Milestones") },
    { id: "project-evolution-roadmap", label: text(lang, "发展路线图", "Roadmap") },
  ], [lang])

  if (!data) {
    return (
      <section id="project-evolution" data-testid="project-evolution-tab" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, color: t.muted, padding: 16 }}>
        {text(lang, "正在加载项目演化数据…", "Loading project evolution data...")}
      </section>
    )
  }

  return (
    <div id="project-evolution" data-testid="project-evolution-tab" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "项目演化", "Project Evolution Center")}
        subtitle={text(lang, "独立展示 EcoMOF-AI 的成长过程：统一发布日志、模块历史、数据库、算法、验证、界面、汉化演化、关键里程碑与发展路线图。", "A standalone view of how EcoMOF-AI grew: unified release log, module history, database, algorithms, validation, UI, localization evolution, milestones, and roadmap.")}
        meta={text(lang, "EcoMOF-AI 项目变化记录", "What Changed In EcoMOF-AI")}
        action={<><BasisBadge tone="info">{APP_VERSION_LABEL}</BasisBadge><CopyLinkButton hash="project-evolution" ariaLabel={text(lang, "复制项目演化链接", "Copy Project Evolution link")} /></>}
      />
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", padding: 11 }}>
        <span style={{ fontSize: 12.2, lineHeight: 1.5 }}>{text(lang, "项目演化解释项目成长历史；方法与证据只解释 EcoMOF-AI 如何工作。", "Project Evolution explains project history; Methods & Evidence explains how EcoMOF-AI works.")}</span>
        <button type="button" onClick={() => onNavigate?.("methodology")} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
          {text(lang, "查看方法论", "View Methods")}
        </button>
      </div>
      <SectionNav sections={sections} t={t} />
      <UnifiedReleaseCenter log={appReleaseLog} lang={lang} t={t} isMobile={isMobile} />
      <EvolutionOverview data={data} projectStatus={projectStatus} lang={lang} t={t} isMobile={isMobile} />
      <PendingReleaseDraft log={appReleaseLog} lang={lang} t={t} isMobile={isMobile} />
      <VersionTimeline data={data} lang={lang} t={t} isMobile={isMobile} />
      <ProjectUpdates log={appReleaseLog} lang={lang} t={t} isMobile={isMobile} />
      <ScientificEvolution data={data} lang={lang} t={t} />
      <DatabaseEvolution data={data} lang={lang} t={t} />
      <AlgorithmEvolution data={data} lang={lang} t={t} />
      <OrganicAcidAlgorithmMethodology methodology={organicAcidMethodology} lang={lang} t={t} isMobile={isMobile} />
      <ValidationEvolution data={data} lang={lang} t={t} />
      <UiEvolution data={data} lang={lang} t={t} />
      <LocalizationEvolution data={data} lang={lang} t={t} />
      <MilestoneCenter data={data} lang={lang} t={t} />
      <Roadmap data={data} lang={lang} t={t} />
    </div>
  )
}

export default ProjectEvolutionTab
