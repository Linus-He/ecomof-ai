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

function MetricCard({ label, value, source, t, lang, tone = "info" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.good || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ alignItems: "center", color, display: "inline-flex", fontSize: 20, fontWeight: 930, lineHeight: 1.12, marginTop: 6, maxWidth: "100%" }}>
        <span style={{ overflowWrap: "anywhere" }}>{value}</span>
        <FieldProvenanceButton fieldKey={label} fieldLabel={label} source={source} lang={lang} />
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
      title={text(lang, "Evolution Overview", "Evolution Overview")}
      subtitle={text(lang, "当前项目状态总览；所有关键数字都带来源按钮。", "Current project status; every key number has a provenance button.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))" }}>
        <MetricCard label="Current Version" value={overview.currentVersion} source={sources.currentVersion} t={t} lang={lang} tone="pass" />
        <MetricCard label="Database Size" value={`${overview.databaseSize} Candidates`} source={sources.databaseSize} t={t} lang={lang} />
        <MetricCard label="Verified Metadata" value={overview.verifiedMetadataCount} source={sources.verifiedMetadataCount} t={t} lang={lang} tone="pass" />
        <MetricCard label="Source Confirmed" value={overview.sourceConfirmedCount} source={sources.sourceConfirmedCount} t={t} lang={lang} />
        <MetricCard label="Citation Ready" value={overview.citationReadyCount} source={sources.citationReadyCount} t={t} lang={lang} />
        <MetricCard label="Field Provenance Coverage" value={pct(overview.fieldProvenanceCoverage)} source={sources.fieldProvenanceCoverage} t={t} lang={lang} />
        <MetricCard label="Model Validation Status" value={overview.modelValidationStatus} source={sources.currentVersion} t={t} lang={lang} tone="warn" />
        <MetricCard label="Project Age" value={overview.projectAge} source={sources.currentVersion} t={t} lang={lang} />
        <MetricCard label="GitHub Stars" value={overview.githubStars} source={sources.githubStars} t={t} lang={lang} tone="warn" />
        <MetricCard label="Milestone Count" value={overview.milestoneCount} source={sources.currentVersion} t={t} lang={lang} />
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
      title={text(lang, "Version Timeline", "Version Timeline")}
      subtitle={text(lang, "统一版本历史；这是 Version Timeline、Release Notes、Roadmap 与 Milestones 的唯一权威数据源。", "Unified version history; this is the only authoritative source for Version Timeline, Release Notes, Roadmap, and Milestones.")}
      t={t}
      actions={<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search versions" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, fontSize: 12, minHeight: 34, padding: "7px 9px" }} />}
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
                ["Commit", selected.commit],
                ["Scientific Impact", selected.scientificImpact],
                ["Database Impact", selected.databaseImpact],
                ["Algorithm Impact", selected.algorithmImpact],
                ["Validation Impact", selected.validationImpact],
                ["UI Impact", selected.uiImpact],
                ["Known Limitations", selected.knownLimitations],
                ["Breaking Changes", selected.breakingChanges],
                ["Next Version Goal", selected.nextVersionGoal],
              ].map(([label, value]) => (
                <div key={label} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 8 }}>
                  <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <span style={{ color: label === "Known Limitations" || label === "Breaking Changes" ? t.warn : t.textStrong, display: "block", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>{value}</span>
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
  const versions = ["All", ...new Set(notes.map(row => row.version))]
  const categories = ["All", ...new Set(notes.map(row => row.category))]
  const visible = notes.filter(row => (version === "All" || row.version === version) && (category === "All" || row.category === category))
  return (
    <Card id="project-evolution-release-notes" title={text(lang, "Release Notes Center", "Release Notes Center")} subtitle={text(lang, "按版本、模块和分类查看所有更新。", "Browse all updates by version, module, and category.")} t={t}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select value={version} onChange={event => setVersion(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>{versions.map(item => <option key={item}>{item}</option>)}</select>
        <select value={category} onChange={event => setCategory(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "7px 9px" }}>{categories.map(item => <option key={item}>{item}</option>)}</select>
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
    <Card id="project-evolution-scientific" title={text(lang, "Scientific Evolution", "Scientific Evolution")} subtitle="Raw Screening -> CRITIC -> Evidence Framework -> Screening Trace -> Verified Metadata -> Model Validation Lab -> Future Experimental Validation." t={t}>
      <MiniBarChart rows={data.scientificEvolution || []} xKey="stage" yKey="maturity" t={t} labelFormatter={value => `${value}/100`} />
      <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{text(lang, "Scientific Capability Growth", "Scientific Capability Growth")}</strong>
    </Card>
  )
}

function DatabaseEvolution({ data, lang, t }) {
  const rows = data.databaseEvolution || []
  return (
    <Card id="project-evolution-database" title={text(lang, "Database Evolution", "Database Evolution")} subtitle={text(lang, "数据库成长、verified metadata 成长与字段级溯源覆盖率。", "Database growth, verified metadata growth, and field provenance coverage.")} t={t}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Database Growth</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="candidateCount" t={t} labelFormatter={value => value === "pending" ? "pending" : `${value} Candidates`} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Verified Metadata Growth</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="verifiedCount" t={t} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.5 }}>Field Provenance Coverage</strong>
          <MiniBarChart rows={rows} xKey="version" yKey="fieldProvenanceCoverage" t={t} labelFormatter={pct} />
        </div>
      </div>
      <div style={{ color: t.muted, fontSize: 11.7, lineHeight: 1.45 }}>
        <span>1000 Candidates</span>
        <FieldProvenanceButton fieldKey="databaseSize" fieldLabel="1000 Candidates" source={data.overview?.sources?.databaseSize} lang={lang} />
        <span> · 30 verified metadata</span>
        <FieldProvenanceButton fieldKey="verifiedMetadataCount" fieldLabel="30 verified metadata" source={data.overview?.sources?.verifiedMetadataCount} lang={lang} />
      </div>
    </Card>
  )
}

function AlgorithmEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-algorithm" title={text(lang, "Algorithm Evolution", "Algorithm Evolution")} subtitle="Descriptor Scoring -> CRITIC -> Evidence Adjustment -> Screening Trace -> Data Quality Audit -> Model Validation Lab -> Future ML Validation." t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {(data.algorithmEvolution || []).map(row => (
          <article key={row.stage} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.stage} · {row.version}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>New: {row.newCapability}</span>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>Retired: {row.retiredCapability}</span>
            <span style={{ color: t.warn, fontSize: 11.5, lineHeight: 1.45 }}>Limitation: {row.limitation}</span>
            <span style={{ color: t.accentText, fontSize: 11.5, lineHeight: 1.45 }}>Future: {row.futurePlan}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function ValidationEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-validation" title={text(lang, "Validation Evolution", "Validation Evolution")} subtitle="Source Confirmed -> Citation Ready -> Verified Metadata -> External Validation -> Experimental Validation." t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.validationEvolution || []).map(row => (
          <article key={row.stage} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{row.stage}</strong>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>{row.definition}</span>
            <span style={{ color: t.accentText, fontSize: 11.2 }}>Pass: {row.passCondition}</span>
            <span style={{ color: t.warn, fontSize: 11.2 }}>Block: {row.blockingCondition}</span>
            <span style={{ color: t.textStrong, fontSize: 11.4, fontWeight: 850 }}>Current: {row.currentCount}</span>
            <span style={{ color: t.faint, fontSize: 11.2 }}>Next: {row.nextGoal}</span>
          </article>
        ))}
      </div>
    </Card>
  )
}

function UiEvolution({ data, lang, t }) {
  return (
    <Card id="project-evolution-ui" title={text(lang, "UI Evolution", "UI Evolution")} subtitle={text(lang, "记录首页、EcoScreen、Model Validation Lab、Data Quality Audit 与 Project Evolution 的界面演化。", "Tracks UI evolution for Home, EcoScreen, Model Validation Lab, Data Quality Audit, and Project Evolution.")} t={t}>
      <div style={{ display: "grid", gap: 8 }}>
        {(data.uiEvolution || []).map(row => (
          <article key={`${row.version}-${row.area}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, gridTemplateColumns: "minmax(110px, 0.35fr) minmax(0, 0.65fr)", padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12 }}>{row.version} · {row.area}</strong>
            <span style={{ color: t.muted, fontSize: 11.4, lineHeight: 1.45 }}>Before: {row.before}<br />After: {row.after}<br />Change: {row.change}</span>
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
    <Card id="project-evolution-milestones" title={text(lang, "Milestone Center", "Milestone Center")} subtitle={text(lang, "Milestone Timeline，点击可查看详情。", "Milestone Timeline; click to view details.")} t={t}>
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
    <Card id="project-evolution-roadmap" title={text(lang, "Roadmap", "Roadmap")} subtitle={text(lang, "未来规划：V2.4 到 V3.0。", "Future plan: V2.4 through V3.0.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(data.roadmap || []).map(row => (
          <article key={row.version} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 6, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 13 }}>{row.version}</strong>
            <span style={{ color: t.accentText, fontSize: 11.5, fontWeight: 850 }}>{row.plannedFeatures.join(", ")}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>Scientific Goal: {row.scientificGoal}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>Database Goal: {row.databaseGoal}</span>
            <span style={{ color: t.muted, fontSize: 11.3, lineHeight: 1.45 }}>Validation Goal: {row.validationGoal}</span>
            <span style={{ color: t.warn, fontSize: 11.3, lineHeight: 1.45 }}>Known Risks: {row.knownRisks.join("; ")}</span>
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
    { id: "project-evolution-overview", label: "Overview" },
    { id: "project-evolution-version-timeline", label: "Version Timeline" },
    { id: "project-evolution-release-notes", label: "Release Notes" },
    { id: "project-evolution-scientific", label: "Scientific Evolution" },
    { id: "project-evolution-database", label: "Database Evolution" },
    { id: "project-evolution-algorithm", label: "Algorithm Evolution" },
    { id: "project-evolution-validation", label: "Validation Evolution" },
    { id: "project-evolution-ui", label: "UI Evolution" },
    { id: "project-evolution-milestones", label: "Milestones" },
    { id: "project-evolution-roadmap", label: "Roadmap" },
  ], [])

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
        title={text(lang, "项目演化中心", "Project Evolution Center")}
        subtitle={text(lang, "独立展示 EcoMOF-AI 的成长过程：版本、Release Notes、数据库、算法、验证、UI、里程碑与路线图。", "A standalone view of how EcoMOF-AI grew: versions, release notes, database, algorithms, validation, UI, milestones, and roadmap.")}
        meta={text(lang, "What Changed In EcoMOF-AI", "What Changed In EcoMOF-AI")}
        action={<><BasisBadge tone="info">V2.3</BasisBadge><CopyLinkButton hash="project-evolution" ariaLabel="Copy Project Evolution link" /></>}
      />
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", padding: 11 }}>
        <span style={{ fontSize: 12.2, lineHeight: 1.5 }}>{text(lang, "Project Evolution 解释项目成长历史；Methods & Evidence 只解释 EcoMOF-AI 如何工作。", "Project Evolution explains project history; Methods & Evidence explains how EcoMOF-AI works.")}</span>
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
      <MilestoneCenter data={data} lang={lang} t={t} />
      <Roadmap data={data} lang={lang} t={t} />
    </div>
  )
}

export default ProjectEvolutionTab
