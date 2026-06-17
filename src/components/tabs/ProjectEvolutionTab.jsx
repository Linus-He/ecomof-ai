// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
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

function EvolutionOverview({ data, lang, t, isMobile }) {
  const overview = data.overview || {}
  const sources = overview.sources || {}
  return (
    <Card
      id="project-evolution-overview"
      title={text(lang, "项目状态总览", "Evolution Overview")}
      subtitle={text(lang, "当前项目状态总览；所有关键数字都带来源按钮。", "Current project status; every key number has a provenance button.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MetricCard fieldKey="currentVersion" label={text(lang, "当前版本", "Current Version")} value={overview.currentVersion} source={sources.currentVersion} t={t} lang={lang} tone="pass" />
        <MetricCard fieldKey="databaseSize" label={text(lang, "数据库规模", "Database Size")} value={`${overview.databaseSize} Candidates`} source={sources.databaseSize} t={t} lang={lang} />
        <MetricCard fieldKey="verifiedMetadataCount" label={text(lang, "已核验元数据", "Verified Metadata")} value={overview.verifiedMetadataCount} source={sources.verifiedMetadataCount} t={t} lang={lang} tone="pass" />
        <MetricCard fieldKey="sourceConfirmedCount" label={text(lang, "来源已确认", "Source Confirmed")} value={overview.sourceConfirmedCount} source={sources.sourceConfirmedCount} t={t} lang={lang} />
        <MetricCard fieldKey="citationReadyCount" label={text(lang, "引文已就绪", "Citation Ready")} value={overview.citationReadyCount} source={sources.citationReadyCount} t={t} lang={lang} />
        <MetricCard fieldKey="fieldProvenanceCoverage" label={text(lang, "字段级溯源覆盖率", "Field Provenance Coverage")} value={pct(overview.fieldProvenanceCoverage)} source={sources.fieldProvenanceCoverage} t={t} lang={lang} />
        <MetricCard fieldKey="modelValidationStatus" label={text(lang, "模型验证状态", "Model Validation Status")} value={overview.modelValidationStatus} source={sources.currentVersion} t={t} lang={lang} tone="warn" />
        <MetricCard fieldKey="projectAge" label={text(lang, "项目时长", "Project Age")} value={overview.projectAge} source={sources.currentVersion} t={t} lang={lang} />
        <MetricCard fieldKey="githubStars" label={text(lang, "GitHub Stars", "GitHub Stars")} value={overview.githubStars} source={sources.githubStars} t={t} lang={lang} tone="warn" />
        <MetricCard fieldKey="milestoneCount" label={text(lang, "里程碑数量", "Milestone Count")} value={overview.milestoneCount} source={sources.currentVersion} t={t} lang={lang} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="proxy">{overview.databasePreviewStatus}</BasisBadge>
        <BasisBadge tone="warn">{overview.notFinalRecommendationStatus}</BasisBadge>
      </div>
    </Card>
  )
}

function VersionTimeline({ data, lang, t, isMobile }) {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(data.currentVersion || "V2.3")
  const versions = data.versions || []
  const visible = versions.filter(row => `${row.version} ${row.summary} ${row.categories?.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
  const selected = versions.find(row => row.version === active) || visible[0] || versions[0]
  return (
    <Card
      id="project-evolution-version-timeline"
      title={text(lang, "版本演化时间线", "Version Timeline")}
      subtitle={text(lang, "统一版本历史；这是版本演化时间线、版本更新记录、发展路线图与关键里程碑的唯一权威数据源。", "Unified version history; this is the only authoritative source for Version Timeline, Release Notes, Roadmap, and Milestones.")}
      t={t}
      actions={<input value={query} onChange={event => setQuery(event.target.value)} placeholder={text(lang, "搜索版本", "Search versions")} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "7px 9px" }} />}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "minmax(220px, 0.42fr) minmax(0, 0.58fr)" }}>
        <div style={{ display: "grid", gap: 7 }}>
          {visible.map(row => (
            <button key={row.version} type="button" onClick={() => setActive(row.version)} style={{ background: row.version === selected?.version ? t.badgeInfoBg : t.surface, border: `1px solid ${row.version === selected?.version ? t.accent : t.border}`, borderRadius: 8, color: row.version === selected?.version ? t.accentText : t.textStrong, cursor: "pointer", display: "grid", gap: 3, minHeight: 58, padding: 9, textAlign: "left" }}>
              <strong style={{ fontSize: 12.5 }}>{row.version} · {row.date}</strong>
              <span style={{ color: t.muted, fontSize: 11, lineHeight: 1.35 }}>{row.summary}</span>
            </button>
          ))}
        </div>
        {selected ? (
          <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 15 }}>{selected.version} · {selected.date}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{selected.summary}</span>
            <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
              {[
                ["commit", text(lang, "提交", "Commit"), selected.commit, false],
                ["scientificImpact", text(lang, "科研影响", "Scientific Impact"), selected.scientificImpact, false],
                ["databaseImpact", text(lang, "数据库影响", "Database Impact"), selected.databaseImpact, false],
                ["algorithmImpact", text(lang, "算法影响", "Algorithm Impact"), selected.algorithmImpact, false],
                ["validationImpact", text(lang, "验证影响", "Validation Impact"), selected.validationImpact, false],
                ["uiImpact", text(lang, "界面影响", "UI Impact"), selected.uiImpact, false],
                ["knownLimitations", text(lang, "已知局限", "Known Limitations"), selected.knownLimitations, true],
                ["breakingChanges", text(lang, "破坏性变更", "Breaking Changes"), selected.breakingChanges, true],
                ["nextVersionGoal", text(lang, "下一版本目标", "Next Version Goal"), selected.nextVersionGoal, false],
              ].map(([key, label, value, warn]) => (
                <div key={key} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 8 }}>
                  <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <span style={{ color: warn ? t.warn : t.textStrong, display: "block", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>{value}</span>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </Card>
  )
}

function ReleaseNotesCenter({ data, lang, t }) {
  const [version, setVersion] = useState("All")
  const [category, setCategory] = useState("All")
  const notes = data.releaseNotes || []
  const allLabel = text(lang, "全部", "All")
  const versions = ["All", ...new Set(notes.map(row => row.version))]
  const categories = ["All", ...new Set(notes.map(row => row.category))]
  const visible = notes.filter(row => (version === "All" || row.version === version) && (category === "All" || row.category === category))
  return (
    <Card id="project-evolution-release-notes" title={text(lang, "版本更新记录", "Release Notes")} subtitle={text(lang, "按版本、模块和分类查看所有更新。", "Browse all updates by version, module, and category.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select value={version} onChange={event => setVersion(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>{versions.map(item => <option key={item} value={item}>{item === "All" ? allLabel : item}</option>)}</select>
        <select value={category} onChange={event => setCategory(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>{categories.map(item => <option key={item} value={item}>{item === "All" ? allLabel : item}</option>)}</select>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {visible.map(row => (
          <article key={`${row.version}-${row.title}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.version} · {row.title}</strong>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 850 }}>{row.date} · {row.module} · {row.category}</span>
            <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>{row.body}</span>
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
        <span>1000 Candidates</span>
        <FieldProvenanceButton fieldKey="databaseSize" fieldLabel="1000 Candidates" source={data.overview?.sources?.databaseSize} lang={lang} />
        <span> · {text(lang, "30 条已核验元数据", "30 verified metadata")}</span>
        <FieldProvenanceButton fieldKey="verifiedMetadataCount" fieldLabel="30 verified metadata" source={data.overview?.sources?.verifiedMetadataCount} lang={lang} />
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
    <Card id="project-evolution-ui" title={text(lang, "界面演化", "UI Evolution")} subtitle={text(lang, "记录首页、EcoScreen、模型验证实验室、数据质量审计、项目演化与研究报告的界面演化。", "Tracks UI evolution for Home, EcoScreen, Model Validation Lab, Data Quality Audit, Project Evolution, and Research Reports.")} t={t}>
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
          <span style={{ color: t.faint, fontSize: 11 }}>{selected.date}</span>
          <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.45 }}>{selected.detail}</span>
        </article>
      ) : null}
    </Card>
  )
}

function Roadmap({ data, lang, t }) {
  return (
    <Card id="project-evolution-roadmap" title={text(lang, "发展路线图", "Roadmap")} subtitle={text(lang, "未来规划：V2.4 到 V3.0。", "Future plan: V2.4 through V3.0.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.roadmap || []).map(row => (
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
    <Card id="project-evolution-localization" title={text(lang, "汉化演化", "Localization Evolution")} subtitle={text(lang, "记录术语统一、科研表达规范与研究报告框架的新增时间。", "Tracks terminology unification, scientific language guidance, and research report additions.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.localizationEvolution || []).map(row => (
          <article key={`${row.version}-${row.area}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.version} · {row.area}</strong>
            <span style={{ color: t.faint, fontSize: 11 }}>{row.date}</span>
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

  useEffect(() => {
    if (providedData) { setData(providedData); return undefined }
    let active = true
    fetchDataJson("version_evolution_records.json", null)
      .then(payload => { if (active) setData(payload) })
      .catch(() => { if (active) setData(null) })
    return () => { active = false }
  }, [providedData])

  const sections = useMemo(() => [
    { id: "project-evolution-overview", label: text(lang, "总览", "Overview") },
    { id: "project-evolution-version-timeline", label: text(lang, "版本演化时间线", "Version Timeline") },
    { id: "project-evolution-release-notes", label: text(lang, "版本更新记录", "Release Notes") },
    { id: "project-evolution-scientific", label: text(lang, "科研能力演化", "Scientific Evolution") },
    { id: "project-evolution-database", label: text(lang, "数据库演化", "Database Evolution") },
    { id: "project-evolution-algorithm", label: text(lang, "算法演化", "Algorithm Evolution") },
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
        subtitle={text(lang, "独立展示 EcoMOF-AI 的成长过程：版本更新记录、数据库、算法、验证、界面、汉化演化、关键里程碑与发展路线图。", "A standalone view of how EcoMOF-AI grew: versions, release notes, database, algorithms, validation, UI, localization evolution, milestones, and roadmap.")}
        meta={text(lang, "EcoMOF-AI 项目变化记录", "What Changed In EcoMOF-AI")}
        action={<><BasisBadge tone="info">V2.4</BasisBadge><CopyLinkButton hash="project-evolution" ariaLabel={text(lang, "复制项目演化链接", "Copy Project Evolution link")} /></>}
      />
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", padding: 11 }}>
        <span style={{ fontSize: 12.2, lineHeight: 1.5 }}>{text(lang, "项目演化解释项目成长历史；方法与证据只解释 EcoMOF-AI 如何工作。", "Project Evolution explains project history; Methods & Evidence explains how EcoMOF-AI works.")}</span>
        <button type="button" onClick={() => onNavigate?.("methodology")} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
          {text(lang, "查看方法论", "View Methods")}
        </button>
      </div>
      <SectionNav sections={sections} t={t} />
      <EvolutionOverview data={data} lang={lang} t={t} isMobile={isMobile} />
      <VersionTimeline data={data} lang={lang} t={t} isMobile={isMobile} />
      <ReleaseNotesCenter data={data} lang={lang} t={t} />
      <ScientificEvolution data={data} lang={lang} t={t} />
      <DatabaseEvolution data={data} lang={lang} t={t} />
      <AlgorithmEvolution data={data} lang={lang} t={t} />
      <ValidationEvolution data={data} lang={lang} t={t} />
      <UiEvolution data={data} lang={lang} t={t} />
      <LocalizationEvolution data={data} lang={lang} t={t} />
      <MilestoneCenter data={data} lang={lang} t={t} />
      <Roadmap data={data} lang={lang} t={t} />
    </div>
  )
}

export default ProjectEvolutionTab
