// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BasisBadge,
  CopyLinkButton,
  FieldProvenanceButton,
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
import ecoScreenProcessEvidenceSummary from "../../../public/data/ecoscreen_candidate_process_evidence_summary_v1.json"
import ecoScreenEvidenceRegistry from "../../../public/data/ecoscreen_evidence_source_registry_v1.json"
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

function numericCount(value) {
  if (Number.isFinite(Number(value))) return Number(value)
  const match = String(value ?? "").match(/[\d,.]+/)
  return match ? Number(match[0].replace(/,/g, "")) : 0
}

function indexSeries(rows, keys) {
  const maxima = Object.fromEntries(keys.map(key => [
    key,
    Math.max(1, ...rows.map(row => numericCount(row[key]))),
  ]))
  return rows.map(row => ({
    ...row,
    ...Object.fromEntries(keys.map(key => [`${key}Index`, Math.round(numericCount(row[key]) / maxima[key] * 100)])),
  }))
}

function EvolutionAtlas({ data, projectStatus, log, lang, t, isMobile, onNavigate }) {
  const status = projectStatus || buildProjectStatusSummary({ versionEvolution: data })
  const [activeLensId, setActiveLensId] = useState("release")
  const [selectedLabel, setSelectedLabel] = useState("")
  const currentRelease = (log?.releases || []).find(release => release.appVersion === log?.currentAppVersion)
    || log?.releases?.[0]

  const lenses = useMemo(() => {
    const releaseRows = indexSeries(
      [...(log?.releases || [])].reverse().map(release => ({
        label: release.appVersion,
        primary: Object.values(release.modules || {}).reduce((sum, module) => sum + (module.changes || []).length, 0),
        secondary: Object.keys(release.modules || {}).length,
        detail: localize(release.headline, lang),
        note: localize(release.summary, lang),
      })),
      ["primary", "secondary"],
    )
    const databaseRows = indexSeries(
      (data.databaseEvolution || [])
        .filter(row => String(row.version).toLowerCase() !== "future")
        .map(row => ({
          label: row.version,
          primary: numericCount(row.candidateCount),
          secondary: numericCount(row.verifiedCount),
          tertiary: Math.round(numericCount(row.fieldProvenanceCoverage) * 100),
          detail: text(lang, `${numericCount(row.candidateCount).toLocaleString()} 条候选`, `${numericCount(row.candidateCount).toLocaleString()} candidates`),
          note: text(lang, `${numericCount(row.verifiedCount).toLocaleString()} 条已核验元数据`, `${numericCount(row.verifiedCount).toLocaleString()} verified metadata`),
        })),
      ["primary", "secondary", "tertiary"],
    )
    const scienceRows = indexSeries(
      (data.scientificEvolution || [])
        .filter(row => String(row.version).toLowerCase() !== "future")
        .slice(-12)
        .map(row => ({
          label: row.version,
          primary: numericCount(row.maturity),
          detail: row.stage,
          note: text(lang, `科研成熟度 ${row.maturity}/100`, `Research maturity ${row.maturity}/100`),
        })),
      ["primary"],
    )
    const validationRows = indexSeries(
      (data.validationEvolution || []).map((row, index) => ({
        label: text(lang, `V${index + 1}`, `V${index + 1}`),
        primary: numericCount(row.currentCount),
        detail: row.stage,
        note: `${text(lang, "阻断条件", "Block")}: ${row.blockingCondition}`,
      })),
      ["primary"],
    )
    const experienceByVersion = new Map()
    const ensureExperience = version => {
      if (!experienceByVersion.has(version)) {
        experienceByVersion.set(version, { label: version, primary: 0, secondary: 0, details: [] })
      }
      return experienceByVersion.get(version)
    }
    for (const row of data.uiEvolution || []) {
      const target = ensureExperience(row.version)
      target.primary += 1
      target.details.push(row.area)
    }
    for (const row of data.localizationEvolution || []) {
      const target = ensureExperience(row.version)
      target.secondary += 1
      target.details.push(row.area)
    }
    let uiTotal = 0
    let languageTotal = 0
    const experienceRows = indexSeries(
      [...experienceByVersion.values()].map(row => {
        uiTotal += row.primary
        languageTotal += row.secondary
        return {
          ...row,
          primary: uiTotal,
          secondary: languageTotal,
          detail: row.details.join(" · "),
          note: text(lang, `累计 ${uiTotal} 项界面演化、${languageTotal} 项语言演化`, `${uiTotal} cumulative UI changes and ${languageTotal} localization changes`),
        }
      }),
      ["primary", "secondary"],
    )

    return [
      {
        id: "release",
        index: "01",
        label: text(lang, "Web 发布", "Web releases"),
        title: text(lang, "统一 Web 小版本", "Unified Web patch releases"),
        formula: String.raw`\mathcal{R}_t=\left(n_{\mathrm{changes}},n_{\mathrm{modules}}\right)_t`,
        rows: releaseRows,
        series: [
          { key: "primaryIndex", label: text(lang, "更新项指数", "Change index"), color: t.accentText },
          { key: "secondaryIndex", label: text(lang, "模块覆盖指数", "Module index"), color: t.good || "#2e8b57" },
        ],
      },
      {
        id: "database",
        index: "02",
        label: text(lang, "数据", "Data"),
        title: text(lang, "候选、核验与溯源覆盖", "Candidates, verification, and provenance"),
        formula: String.raw`\mathcal{D}_t=\left(N_{\mathrm{MOF}},N_{\mathrm{verified}},P_{\mathrm{prov}}\right)_t`,
        rows: databaseRows,
        series: [
          { key: "primaryIndex", label: text(lang, "候选指数", "Candidate index"), color: t.accentText },
          { key: "secondaryIndex", label: text(lang, "核验指数", "Verified index"), color: t.good || "#2e8b57" },
          { key: "tertiaryIndex", label: text(lang, "溯源指数", "Provenance index"), color: t.warn },
        ],
      },
      {
        id: "science",
        index: "03",
        label: text(lang, "科研", "Research"),
        title: text(lang, "科研能力成熟度", "Research capability maturity"),
        formula: String.raw`\mathcal{A}_t=\operatorname{maturity}\!\left(\mathrm{data},\mathrm{method},\mathrm{evidence}\right)_t`,
        rows: scienceRows,
        series: [{ key: "primaryIndex", label: text(lang, "成熟度指数", "Maturity index"), color: t.accentText }],
      },
      {
        id: "validation",
        index: "04",
        label: text(lang, "验证", "Validation"),
        title: text(lang, "证据门禁与当前覆盖", "Evidence gates and current coverage"),
        formula: String.raw`\mathcal{V}_k=N_{\mathrm{current},k}`,
        rows: validationRows,
        series: [{ key: "primaryIndex", label: text(lang, "覆盖指数", "Coverage index"), color: t.warn }],
      },
      {
        id: "experience",
        index: "05",
        label: text(lang, "体验", "Experience"),
        title: text(lang, "界面与语言演化", "Interface and localization evolution"),
        formula: String.raw`\mathcal{U}_t=\left(n_{\mathrm{interface}},n_{\mathrm{localization}}\right)_{\le t}`,
        rows: experienceRows,
        series: [
          { key: "primaryIndex", label: text(lang, "界面指数", "Interface index"), color: t.accentText },
          { key: "secondaryIndex", label: text(lang, "语言指数", "Localization index"), color: t.good || "#2e8b57" },
        ],
      },
    ]
  }, [data, lang, log, t.accentText, t.good, t.warn])

  const activeLens = lenses.find(lens => lens.id === activeLensId) || lenses[0]
  const selected = activeLens.rows.find(row => row.label === selectedLabel) || activeLens.rows.at(-1) || null
  const tooltip = ({ active, payload, label: tooltipLabel }) => {
    if (!active || !payload?.length) return null
    const row = activeLens.rows.find(item => item.label === tooltipLabel)
    return (
      <div className="evolution-chart-tooltip" style={{ "--evolution-panel": t.panel, "--evolution-border": t.border, "--evolution-text": t.textStrong, "--evolution-muted": t.muted }}>
        <strong>{tooltipLabel}</strong>
        {payload.map(item => <span key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}/100</span>)}
        {row?.detail ? <small>{row.detail}</small> : null}
      </div>
    )
  }

  return (
    <section
      data-testid="project-evolution-atlas"
      className="project-evolution-atlas"
      style={{
        "--evolution-accent": t.accentText,
        "--evolution-border": t.border,
        "--evolution-divider": t.divider || t.border,
        "--evolution-faint": t.faint,
        "--evolution-muted": t.muted,
        "--evolution-panel": t.panel,
        "--evolution-surface": t.surface,
        "--evolution-text": t.textStrong,
      }}
    >
      <div className="project-evolution-copy">
        <h2>{text(lang, "以一张图查看项目演化", "Project evolution in one view")}</h2>
        <p>{text(lang, "左侧给出演化定义、当前状态与本次更新；右侧按 Web 发布、数据、科研、验证和界面五个维度呈现变化。", "Definitions, current status, and the latest update are shown on the left; the graph compares Web releases, data, research, validation, and interface changes.")}</p>
        <div className="project-evolution-formula">
          <BlockFormula
            math={String.raw`\mathcal{E}_t=\left(\mathcal{R}_t,\mathcal{D}_t,\mathcal{A}_t,\mathcal{V}_t,\mathcal{U}_t\right)`}
            fallback="E_t = (R_t, D_t, A_t, V_t, U_t)"
            t={t}
            style={{ background: "transparent", border: 0, borderRadius: 0, padding: 0 }}
          />
          <BlockFormula
            math={activeLens.formula}
            fallback={activeLens.formula}
            t={t}
            style={{ background: "transparent", border: 0, borderRadius: 0, padding: 0, marginTop: 8 }}
          />
          <BlockFormula
            math={String.raw`z_{t,j}=100\,\frac{x_{t,j}}{\max_{\tau}x_{\tau,j}}`}
            fallback="z_t,j = 100 x_t,j / max_tau(x_tau,j)"
            t={t}
            style={{ background: "transparent", border: 0, borderRadius: 0, padding: 0, marginTop: 8 }}
          />
          <small>{text(lang, "图中指数仅用于同一维度内的视觉归一化；原始数值保留在节点说明与完整记录中。", "Indices are visual normalizations within each lens; raw values remain in node details and the complete record.")}</small>
        </div>
        <div className="project-evolution-status">
          <div><span>{text(lang, "当前 Web", "Current Web")}</span><strong>{APP_VERSION_LABEL}</strong></div>
          <div><span>{text(lang, "数据版本", "Data version")}</span><strong>{status.currentVersion || data.overview?.currentVersion || "—"}</strong></div>
          <div><span>{text(lang, "候选规模", "Candidates")}</span><strong className="num">{status.databaseScale || "—"}</strong></div>
          <div>
            <span>{text(lang, "可信度", "Credibility")}</span>
            <strong>{status.credibilityScore != null ? `${status.credibilityScore} / ${status.credibilityGrade || "—"}` : "—"}</strong>
          </div>
        </div>
        <div className="project-evolution-log" data-testid="project-evolution-current-update">
          <header>
            <span>{text(lang, "本次更新", "Current update")}</span>
            <strong>{currentRelease?.appVersion || log?.currentAppVersion}</strong>
          </header>
          <strong className="project-evolution-update-title">{localize(currentRelease?.headline, lang)}</strong>
          <p>{localize(currentRelease?.summary, lang)}</p>
        </div>
        <button type="button" onClick={() => onNavigate?.("methodology")} className="project-evolution-method-link">
          {text(lang, "查看方法论", "View Methodology")}
        </button>
      </div>

      <div className="project-evolution-visual" data-testid="project-evolution-command-center">
        <header>
          <div>
            <span>{activeLens.index} / 05</span>
            <strong>{activeLens.title}</strong>
          </div>
          <small>{text(lang, "选择节点查看对应记录", "Select a node to view its record")}</small>
        </header>
        <div className="project-evolution-lenses glass-segmented-control" role="tablist" aria-label={text(lang, "演化图层", "Evolution graph lenses")}>
          {lenses.map(lens => (
            <button
              key={lens.id}
              type="button"
              className="glass-segmented-item"
              role="tab"
              aria-selected={lens.id === activeLens.id}
              data-active={lens.id === activeLens.id ? "true" : "false"}
              onClick={() => { setActiveLensId(lens.id); setSelectedLabel("") }}
            >
              <span>{lens.index}</span>
              <strong>{lens.label}</strong>
            </button>
          ))}
        </div>
        <div className="project-evolution-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activeLens.rows} margin={{ top: 20, right: 18, bottom: 8, left: -8 }} onClick={state => state?.activeLabel && setSelectedLabel(state.activeLabel)}>
              <CartesianGrid stroke={t.divider || t.border} strokeDasharray="3 7" vertical={false} />
              <XAxis dataKey="label" stroke={t.faint} tick={{ fill: t.faint, fontSize: 9.5 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} stroke={t.faint} tick={{ fill: t.faint, fontSize: 9.5 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={tooltip} />
              <Legend iconType="line" wrapperStyle={{ color: t.muted, fontSize: 10, paddingTop: 8 }} />
              {selected ? <ReferenceLine x={selected.label} stroke={t.textStrong} strokeDasharray="2 5" strokeOpacity={0.5} /> : null}
              {activeLens.series.map(series => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2.4}
                  dot={{ fill: t.panel, r: 3.8, stroke: series.color, strokeWidth: 2 }}
                  activeDot={{ fill: series.color, r: 5.5, stroke: t.panel, strokeWidth: 2 }}
                  isAnimationActive={!isMobile}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="project-evolution-node-rail">
          {activeLens.rows.map(row => (
            <button key={row.label} type="button" data-active={selected?.label === row.label ? "true" : "false"} onClick={() => setSelectedLabel(row.label)}>
              {row.label}
            </button>
          ))}
        </div>
        {selected ? (
          <article className="project-evolution-node-detail">
            <span>{selected.label}</span>
            <strong>{selected.detail}</strong>
            <p>{selected.note}</p>
          </article>
        ) : null}
      </div>
    </section>
  )
}

function EvolutionArchive({ data, projectStatus, log, methodology, lang, t, isMobile }) {
  const groups = [
    {
      id: "release",
      index: "01",
      title: text(lang, "发布与历史档案", "Release and history archive"),
      summary: text(lang, "状态总览与模块历史；完整更新内容已迁移到独立更新日志。", "Status overview and module history; complete release details now live in the independent changelog."),
      content: <>
        <EvolutionOverview data={data} projectStatus={projectStatus} lang={lang} t={t} isMobile={isMobile} />
        <VersionTimeline data={data} lang={lang} t={t} isMobile={isMobile} />
        <LegacyModuleHistory log={log} lang={lang} t={t} isMobile={isMobile} />
      </>,
    },
    {
      id: "research",
      index: "02",
      title: text(lang, "科研系统档案", "Research-system archive"),
      summary: text(lang, "科研成熟度、数据库、算法、有机酸方法论与验证体系。", "Research maturity, database, algorithms, Organic Acid methodology, and validation."),
      content: <>
        <ScientificEvolution data={data} lang={lang} t={t} />
        <DatabaseEvolution data={data} lang={lang} t={t} />
        <AlgorithmEvolution data={data} lang={lang} t={t} />
        <OrganicAcidAlgorithmMethodology methodology={methodology} lang={lang} t={t} isMobile={isMobile} />
        <ValidationEvolution data={data} lang={lang} t={t} />
      </>,
    },
    {
      id: "experience",
      index: "03",
      title: text(lang, "体验与里程碑档案", "Experience and milestone archive"),
      summary: text(lang, "界面、语言与关键里程碑的完整记录。", "Complete interface, localization, and milestone records."),
      content: <>
        <UiEvolution data={data} lang={lang} t={t} />
        <LocalizationEvolution data={data} lang={lang} t={t} />
        <MilestoneCenter data={data} lang={lang} t={t} />
      </>,
    },
    {
      id: "roadmap",
      index: "04",
      title: text(lang, "研究路线档案", "Research-roadmap archive"),
      summary: text(lang, "由历史版本记录派生的研究目标、数据目标与风险。", "Research, data, validation, and risk fields derived from historical records."),
      content: <Roadmap data={data} lang={lang} t={t} />,
    },
  ]
  return (
    <section className="project-evolution-archive" data-testid="project-evolution-archive" style={{ "--archive-border": t.border, "--archive-divider": t.divider || t.border, "--archive-panel": t.panel, "--archive-surface": t.surface, "--archive-text": t.textStrong, "--archive-muted": t.muted, "--archive-accent": t.accentText }}>
      <header>
        <span>{text(lang, "完整记录", "Complete record")}</span>
        <h2>{text(lang, "发布、研究与验证记录按主题归档", "Release, research, and validation records by topic")}</h2>
      </header>
      {groups.map(group => (
        <details key={group.id}>
          <summary>
            <span>{group.index}</span>
            <div>
              <strong>{group.title}</strong>
              <small>{group.summary}</small>
            </div>
          </summary>
          <div>{group.content}</div>
        </details>
      ))}
    </section>
  )
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
    citation: "EcoMOF-AI unified Web release log.",
    license: "Project repository license context.",
    retrievedAt: "2026-07-22",
    curationStatus: "confirmed",
    confidence: 1,
    evidenceTier: "confirmed",
    notes: "Current Web release number. Module V3.x records remain historical data/module versions.",
  }
  const moduleVersionCard = buildProjectOverviewCards(resolvedStatus).find(card => card.id === "currentVersion")
  const cards = [
    { id: "appVersion", label: text(lang, "当前 Web 版本", "Current Web Version"), value: APP_VERSION_LABEL, source: appVersionSource, tone: "pass" },
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
        <MetricCard fieldKey="externalTest" label={text(lang, "外部测试", "External Test")} value={resolvedStatus.externalTest} source={resolvedStatus.sources?.externalTest} t={t} lang={lang} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="proxy">{databasePreviewLabel}</BasisBadge>
        <BasisBadge tone="warn">{notFinalLabel}</BasisBadge>
      </div>
    </Card>
  )
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

function LegacyModuleHistory({ log, lang, t, isMobile }) {
  const catalog = log?.moduleCatalog || {}
  const historyByModule = log?.history?.byModule || {}
  return (
    <Card
      id="project-evolution-pre-v1-history"
      title={localize(log?.history?.label, lang) || text(lang, "历史沿革（pre-1.0）", "History (pre-1.0)")}
      subtitle={`${localize(log?.history?.note, lang) || ""} · ${log?.history?.versionCount || 0} ${text(lang, "个原始版本", "original versions")}`}
      t={t}
    >
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {Object.entries(historyByModule).filter(([, rows]) => rows.length).map(([key, rows]) => (
          <section key={key} style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 8, minWidth: 0, paddingTop: 12 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{localize(catalog[key]?.label, lang) || key} · {rows.length}</strong>
            {rows.slice(-6).reverse().map(row => (
              <p key={`${key}-${row.version}`} style={{ color: t.muted, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                <strong style={{ color: t.textStrong }}>{row.version}</strong>
                {row.date ? <span style={{ color: t.faint }}> · {row.date}</span> : null}
                <span> · {publicHistoryNote(row.note, lang)}</span>
              </p>
            ))}
          </section>
        ))}
      </div>
    </Card>
  )
}

function TimelineEntry({ versionLabel, title, summary, badges, fields, t, isMobile, highlight, isLast }) {
  return (
    <div style={{ display: "grid", gap: isMobile ? 9 : 12, gridTemplateColumns: "auto minmax(0, 1fr)", minWidth: 0 }}>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
        <span style={{ background: highlight ? t.accent : t.panel, border: `2px solid ${highlight ? t.accent : t.border}`, borderRadius: 6, flexShrink: 0, height: 12, marginTop: 5, width: 12 }} />
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
    ["nextVersionGoal", text(lang, "当时开发目标", "Recorded Development Goal"), localize(row.nextVersionGoal, lang), false],
  ]
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
      subtitle={text(lang, "这里只展示 V3.x 等模块/数据历史；当前 Web 发布号在统一版本中心维护，避免新旧版本混读。", "This timeline only shows V3.x module/data history; the current Web release is maintained in the Unified Release Center to avoid mixing release schemes.")}
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
            <span style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 6, height: 9, overflow: "hidden" }}>
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
  const evidenceSummary = ecoScreenProcessEvidenceSummary.summary || {}
  const sourceLayers = ecoScreenEvidenceRegistry.sources || []
  const processCoverage = evidenceSummary.fieldCoverage || {}
  const formatCoverage = field => {
    const row = processCoverage[field]
    return row ? `${row.count.toLocaleString()} · ${pct(row.rate)}` : "—"
  }
  return (
    <Card id="project-evolution-database" title={text(lang, "数据库演化", "Database Evolution")} subtitle={text(lang, "数据库成长、已核验元数据成长、字段级溯源与 EcoScreen 候选级合成证据。", "Database growth, verified metadata growth, field provenance, and candidate-level EcoScreen synthesis evidence.")} t={t}>
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
      <div style={{ borderTop: `1px solid ${t.border}`, display: "grid", gap: 10, paddingTop: 12 }}>
        <div style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 3 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{text(lang, "EcoScreen 合成证据层", "EcoScreen Synthesis Evidence Layer")}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.5 }}>
              {text(lang, "候选级真实文献配方已经接入；比较性 LCA 所需的七项关键实测字段仍保持硬门控。", "Candidate-level literature recipes are connected; seven critical measured fields required for comparative LCA remain hard gates.")}
            </span>
          </div>
          <a href={ecoScreenProcessEvidenceSummary.source?.sourceUrl} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.5, fontWeight: 850 }}>
            FAIR-MOFs · DOI {ecoScreenProcessEvidenceSummary.source?.datasetDoi}
          </a>
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {[
            [text(lang, "合成记录", "Synthesis records"), evidenceSummary.emittedRecordCount?.toLocaleString()],
            [text(lang, "含 DOI", "With DOI"), evidenceSummary.recordsWithDoi?.toLocaleString()],
            [text(lang, "≥5 项过程字段", "≥5 process fields"), evidenceSummary.recordsWithAtLeastFiveProcessFields?.toLocaleString()],
            [text(lang, "硬门控覆盖", "Hard-gate coverage"), "0 / 7"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
              <span style={{ color: t.faint, fontSize: 9.8, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
              <strong style={{ color: value === "0 / 7" ? t.warn : t.textStrong, fontSize: 16 }}>{value || "—"}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            [text(lang, "合成路线", "Synthesis route"), formatCoverage("synthesisRoute")],
            [text(lang, "溶剂", "Solvent"), formatCoverage("synthesisSolvent")],
            [text(lang, "温度", "Temperature"), formatCoverage("synthesisTemperature")],
            [text(lang, "时间", "Time"), formatCoverage("synthesisTime")],
          ].map(([label, value]) => (
            <div key={label} style={{ alignItems: "center", background: t.panel, border: `1px solid ${t.border}`, borderRadius: 7, display: "flex", gap: 8, justifyContent: "space-between", padding: "8px 9px" }}>
              <span style={{ color: t.muted, fontSize: 11 }}>{label}</span>
              <strong style={{ color: t.textStrong, fontSize: 11 }}>{value}</strong>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {sourceLayers.map(source => (
            <article key={source.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
                <strong style={{ color: t.textStrong, fontSize: 11.4 }}>{source.shortName || source.name}</strong>
                <BasisBadge tone={source.status === "ingested" || source.status === "connected" ? "pass" : "info"}>
                  {source.status}
                </BasisBadge>
              </div>
              <span style={{ color: t.muted, fontSize: 10.7, lineHeight: 1.45 }}>{localize(source.role, lang) || source.roleZh || source.roleEn}</span>
            </article>
          ))}
        </div>
        <span style={{ color: t.warn, fontSize: 11.3, lineHeight: 1.5 }}>
          {text(lang, ecoScreenProcessEvidenceSummary.evidenceBoundaryZh, ecoScreenProcessEvidenceSummary.evidenceBoundaryEn)}
        </span>
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
      <BlockFormula math={formula.latex} t={t} style={{ background: t.panel, maxWidth: "100%", minWidth: 0, overflowX: "auto" }} />
    </div>
  )
}

function MethodologyBadge({ children, tone, t }) {
  const styles = tone === "risk"
    ? { background: t.badgeWarnBg, border: t.warn, color: t.warn }
    : { background: t.badgeInfoBg, border: t.accent, color: t.accentText }
  return (
    <span style={{ alignItems: "center", background: styles.background, border: `1px solid ${styles.border}`, borderRadius: 6, color: styles.color, display: "inline-flex", fontSize: 11, fontWeight: 900, lineHeight: 1.2, padding: "4px 8px" }}>
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
      subtitle={text(lang, "V3.9.10 独立算法方法论模块：展示八因子加权几何 HGCPS、去丰度偏置、FAIR-MOFs 合成条件证据、描述符消融与审计结论；不预设最终赢家。", "A standalone V3.9.10 methodology module covering the eight-factor weighted-geometric HGCPS, abundance-bias correction, FAIR-MOFs synthesis-condition evidence, descriptor ablation, and audit conclusions; no final winner is preset.")}
      t={t}
      actions={<CopyLinkButton hash={methodology.id} ariaLabel={text(lang, "复制算法方法论链接", "Copy algorithm methodology link")} />}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <MethodologyBadge t={t}>{context.currentTopRoute}</MethodologyBadge>
        <MethodologyBadge t={t}>HGCPS {context.hgcps}</MethodologyBadge>
        <MethodologyBadge t={t}>{context.readinessLevel}</MethodologyBadge>
        <MethodologyBadge tone="risk" t={t}>{text(lang, "高优先级实验假设", "High-priority experimental hypothesis")}</MethodologyBadge>
        <MethodologyBadge tone="risk" t={t}>{text(lang, "不构成最终催化性能证明", "Not final catalytic proof")}</MethodologyBadge>
        <MethodologyBadge tone="risk" t={t}>{text(lang, "尚不具备正式机器学习条件", "Not ready for formal machine learning")}</MethodologyBadge>
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
                  <MethodologyBadge key={source} t={t}>{source}</MethodologyBadge>
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
    <Card id="project-evolution-ui" title={text(lang, "界面演化", "UI Evolution")} subtitle={text(lang, "记录首页、生态筛选、气体分离、催化、MOF库、数据合规与项目演化的界面变化；历史版本名称保留在对应发布记录中。", "Tracks UI evolution for Home, EcoScreen, GasSep, Catalysis, MOF Library, Data Compliance, and Project Evolution; historical names remain in their release records.")} t={t}>
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

  if (!data) {
    return (
      <section id="project-evolution" data-testid="project-evolution-tab" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, color: t.muted, padding: 16 }}>
        {text(lang, "正在加载项目演化数据…", "Loading project evolution data...")}
      </section>
    )
  }

  return (
    <div id="project-evolution" data-testid="project-evolution-tab" style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "项目演化", "Project Evolution")}
        subtitle={text(lang, "发布、数据、科研、验证和界面变化汇总在同一张图中；完整记录按主题归档。", "Web releases, data, research, validation, and interface changes are brought together in one graph, with complete records grouped by topic.")}
        meta={text(lang, "EcoMOF-AI 项目变化记录", "What Changed In EcoMOF-AI")}
        action={<><BasisBadge tone="info">{APP_VERSION_LABEL}</BasisBadge><CopyLinkButton hash="project-evolution" ariaLabel={text(lang, "复制项目演化链接", "Copy Project Evolution link")} /></>}
      />
      <EvolutionAtlas data={data} projectStatus={projectStatus} log={appReleaseLog} lang={lang} t={t} isMobile={isMobile} onNavigate={onNavigate} />
      <EvolutionArchive data={data} projectStatus={projectStatus} log={appReleaseLog} methodology={organicAcidMethodology} lang={lang} t={t} isMobile={isMobile} />
    </div>
  )
}

export default ProjectEvolutionTab
