// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  FieldProvenanceButton,
  FONT_MONO,
  PageHeader,
  fetchDataJson,
  toolbarBtn,
  useLang,
  useT,
  useViewport,
} from "../../shared"
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

function EvolutionOverview({ data, projectStatus, lang, t, isMobile }) {
  const overview = data.overview || {}
  const resolvedStatus = projectStatus || buildProjectStatusSummary({ versionEvolution: data })
  const cards = buildProjectOverviewCards(resolvedStatus)
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
        <BasisBadge tone="proxy">{overview.databasePreviewStatus}</BasisBadge>
        <BasisBadge tone="warn">{overview.notFinalRecommendationStatus}</BasisBadge>
      </div>
    </Card>
  )
}

// Current in-progress release. The shared version_evolution_records.json data source is
// bumped by the release that finalizes V3.9.2; this curated entry lets the Project Evolution
// timeline surface the work in progress without mutating the cross-module data file.
const CURRENT_RELEASE = {
  version: "V3.9.2",
  title: { zh: "分模块数据库卡片接线", en: "Full Per-Tab Database Card Wiring" },
  summary: {
    zh: "接入 GasSep 与 Organic Acid 摘要构建器，清理 Catalysis playground 样式，并补充页面级导出能力。",
    en: "GasSep + Organic Acid summary builders, Catalysis playground CSS cleanup, page-level export.",
  },
  scientificImpact: {
    zh: "各模块数据库卡片由摘要构建器派生，保持字段级可追溯。",
    en: "Per-tab database cards derive from summary builders with field-level traceability.",
  },
  validationImpact: {
    zh: "保留 Organic Acid 研究验证闭环，统计可由构建器动态计算。",
    en: "Keeps the Organic Acid research-validation loop; stats derive from builders.",
  },
  breakingChanges: { zh: "无", en: "None" },
  nextVersionGoal: {
    zh: "将剩余 Organic Acid / MOF / Benchmark 卡片与导出按钮接入对应构建器。",
    en: "Wire remaining Organic Acid / MOF / Benchmark cards and export buttons to their builders.",
  },
}

// Project Updates, grouped into four numbered work streams for the current release.
const PROJECT_UPDATE_STREAMS = [
  {
    no: "01",
    label: { zh: "数据接入", en: "Data wiring" },
    body: {
      zh: "将 GasSep 与 Organic Acid 摘要构建器接入各模块数据库卡片，数字由数据源派生而非写死。",
      en: "Wire GasSep + Organic Acid summary builders into per-tab database cards so numbers derive from data, not hardcoded values.",
    },
  },
  {
    no: "02",
    label: { zh: "解释链路", en: "Explanation path" },
    body: {
      zh: "保持字段级溯源与筛选追踪在接线后的卡片中可检查，缺失字段统一降级。",
      en: "Keep field-level provenance and screening trace inspectable across the wired cards, with unified fallbacks for missing fields.",
    },
  },
  {
    no: "03",
    label: { zh: "交互与样式", en: "Interaction cleanup" },
    body: {
      zh: "清理孤立的 Catalysis playground 样式，同时保留共享 .formula 与通用动效。",
      en: "Remove orphaned Catalysis playground CSS while preserving the shared .formula and generic motion styles.",
    },
  },
  {
    no: "04",
    label: { zh: "页面级导出", en: "Page-level export" },
    body: {
      zh: "提供可复用的页面级导出按钮，输出 CSV / JSON，并在测试环境中安全降级。",
      en: "Provide a reusable page-level export button for CSV / JSON output, no-op-safe in tests.",
    },
  },
]

function localize(value, lang) {
  return value && typeof value === "object" ? value[lang === "zh" ? "zh" : "en"] : value
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

function VersionTimeline({ data, lang, t, isMobile }) {
  const [query, setQuery] = useState("")
  const versions = data.versions || []
  const ordered = [...versions].reverse()
  const recent = ordered.slice(0, 2)
  const earlier = ordered.slice(2)
  const q = query.trim().toLowerCase()
  const searchPool = [
    { version: CURRENT_RELEASE.version, summary: localize(CURRENT_RELEASE.summary, lang), categories: [] },
    ...ordered,
  ]
  const matches = q
    ? searchPool.filter(row => `${row.version} ${row.summary} ${(row.categories || []).join(" ")}`.toLowerCase().includes(q))
    : null

  return (
    <Card
      id="project-evolution-version-timeline"
      title={text(lang, "版本演化时间线", "Version Timeline")}
      subtitle={text(lang, "紧凑型版本时间轴；这是版本演化、版本更新、发展路线图与关键里程碑的唯一权威数据源。", "Compact version timeline; the only authoritative source for evolution, updates, roadmap, and milestones.")}
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
          <TimelineEntry
            versionLabel={CURRENT_RELEASE.version}
            title={localize(CURRENT_RELEASE.title, lang)}
            summary={localize(CURRENT_RELEASE.summary, lang)}
            badges={<><StatusBadge tone="info" t={t}>{text(lang, "当前", "Current")}</StatusBadge><StatusBadge tone="warn" t={t}>{text(lang, "进行中", "In progress")}</StatusBadge></>}
            fields={impactFields(CURRENT_RELEASE, lang)}
            t={t}
            isMobile={isMobile}
            highlight
            isLast={false}
          />
          {recent.map(row => (
            <TimelineEntry key={row.version} versionLabel={row.version} summary={row.summary} fields={impactFields(row, lang)} t={t} isMobile={isMobile} isLast={false} />
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

function ProjectUpdates({ lang, t, isMobile }) {
  return (
    <Card
      id="project-evolution-release-notes"
      title={text(lang, "项目更新", "Project Updates")}
      subtitle={text(lang, `当前版本 ${CURRENT_RELEASE.version} 的更新按数据接入、解释链路、交互与样式、页面级导出四条线索整理。`, `Updates in the current ${CURRENT_RELEASE.version} release, organized into data wiring, explanation path, interaction cleanup, and page-level export.`)}
      t={t}
    >
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {PROJECT_UPDATE_STREAMS.map(stream => (
          <article key={stream.no} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 11, gridTemplateColumns: "auto minmax(0, 1fr)", minWidth: 0, padding: isMobile ? 11 : 13 }}>
            <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, display: "inline-flex", fontFamily: FONT_MONO, fontSize: 13, fontWeight: 950, height: 34, justifyContent: "center", width: 34 }}>
              {stream.no}
            </span>
            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <strong style={{ color: t.textStrong, fontSize: 13 }}>{localize(stream.label, lang)}</strong>
              <span style={{ color: t.muted, fontSize: 11.6, lineHeight: 1.5 }}>{localize(stream.body, lang)}</span>
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
    <Card id="project-evolution-localization" title={text(lang, "汉化演化", "Localization Evolution")} subtitle={text(lang, "记录术语统一、科研表达规范与研究报告框架的新增时间。", "Tracks terminology unification, scientific language guidance, and research report additions.")} t={t}>
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
    { id: "project-evolution-overview", label: text(lang, "总览", "Overview") },
    { id: "project-evolution-version-timeline", label: text(lang, "版本演化时间线", "Version Timeline") },
    { id: "project-evolution-release-notes", label: text(lang, "项目更新", "Project Updates") },
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
        action={<><BasisBadge tone="info">{projectStatus?.currentVersion || data.currentVersion}</BasisBadge><CopyLinkButton hash="project-evolution" ariaLabel={text(lang, "复制项目演化链接", "Copy Project Evolution link")} /></>}
      />
      <div style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 10, color: t.muted, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", padding: 11 }}>
        <span style={{ fontSize: 12.2, lineHeight: 1.5 }}>{text(lang, "项目演化解释项目成长历史；方法与证据只解释 EcoMOF-AI 如何工作。", "Project Evolution explains project history; Methods & Evidence explains how EcoMOF-AI works.")}</span>
        <button type="button" onClick={() => onNavigate?.("methodology")} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
          {text(lang, "查看方法论", "View Methods")}
        </button>
      </div>
      <SectionNav sections={sections} t={t} />
      <EvolutionOverview data={data} projectStatus={projectStatus} lang={lang} t={t} isMobile={isMobile} />
      <VersionTimeline data={data} lang={lang} t={t} isMobile={isMobile} />
      <ProjectUpdates lang={lang} t={t} isMobile={isMobile} />
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
