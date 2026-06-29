// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import {
  BasisBadge,
  CopyLinkButton,
  FieldProvenanceButton,
  PageHeader,
  downloadTextFile,
  fetchDataJson,
  toolbarBtn,
  useLang,
  useT,
  useViewport,
} from "../../shared"
import { generateResearchReport, REPORT_TYPES } from "../../utils/researchReports"
import { runLocalizationAudit, terminologyPairs } from "../../utils/localizationAudit"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { summarizeDataFoundation } from "../../utils/dataFoundation"
import { runDataAudit } from "../../utils/dataAudit/index.js"
import { dataIngestionSummary } from "../../utils/dataIngestion/index.js"
import { buildResearchValidationSummary } from "../../utils/organicAcidResearchValidation"
import { buildDescriptorEvolutionReport } from "../../utils/organicAcidRankingEvolution"
import { organicAcidPalette as oaPalette, SCIENTIFIC_TOKEN_FONT } from "../catalysis/FormulaInline"

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function Card({ id, title, subtitle, children, t, actions, shellReady = false }) {
  return (
    <section id={id} data-testid={id} data-shell-ready={shellReady ? "true" : undefined} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 12, minWidth: 0, padding: 14, scrollMarginTop: 118 }}>
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

function ReportCharts({ charts = [], t, lang }) {
  return (
    <div id="research-reports-chart-pack" data-testid="research-reports-chart-pack" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
      {charts.map(chart => {
        const max = Math.max(1, ...chart.rows.map(row => Number(row.value) || 0))
        return (
          <article key={chart.id} id={`research-${chart.id}`} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 8, minWidth: 0, padding: 10 }}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{chart.title}</strong>
              <span style={{ color: t.faint, fontSize: 10.8 }}>{chart.subtitle} · {text(lang, chart.xAxis, chart.xAxis)} / {text(lang, chart.yAxis, chart.yAxis)}</span>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {chart.rows.map(row => {
                const value = Number(row.value)
                const width = Number.isFinite(value) ? `${Math.max(4, Math.round((value / max) * 100))}%` : "4%"
                return (
                  <div key={row.label} style={{ display: "grid", gap: 3, minWidth: 0 }}>
                    <div style={{ alignItems: "baseline", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
                      <span style={{ color: t.muted, fontSize: 11, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
                      <strong style={{ color: t.textStrong, fontSize: 11.2 }}>{Number.isFinite(value) ? value : row.value}</strong>
                    </div>
                    <span style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <span style={{ background: t.accent, display: "block", height: "100%", width }} />
                    </span>
                  </div>
                )
              })}
            </div>
            <span style={{ color: t.faint, fontSize: 10.5 }}>{text(lang, "图例", "Legend")}: {chart.legend}</span>
          </article>
        )
      })}
    </div>
  )
}

function Metric({ label, value, t, tone = "default" }) {
  const color = tone === "warn" ? t.warn : tone === "pass" ? (t.good || t.accentText) : t.textStrong
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, display: "block", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color, display: "block", fontSize: 16, lineHeight: 1.2, marginTop: 6, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  )
}

// A/B positioning: A = candidate-facing reports, B = round/screening-facing reports.
// Every report type still renders as the same four-block compact narrative.
const REPORT_GROUPS = [
  { id: "candidate", zh: "候选报告", en: "Candidate report", scope: { zh: "面向候选", en: "Per candidate" }, types: ["candidate", "comparison", "organic_acid"] },
  { id: "round", zh: "筛选报告", en: "Screening report", scope: { zh: "面向轮次", en: "Per round" }, types: ["screening", "validation"] },
]

function groupForType(type) {
  return REPORT_GROUPS.find(group => group.types.includes(type)) || REPORT_GROUPS[0]
}

// Maps the report's fine-grained sections into four compact narrative blocks.
// "执行摘要" is intentionally dropped here because the conclusion block already
// shows report.executiveSummary verbatim (de-duplication).
const NARRATIVE_BLOCKS = [
  {
    id: "conclusion",
    zh: "结论（带不确定度 · 非最终推荐）",
    en: "Conclusion (with uncertainty · not final)",
    titles: ["研究问题", "筛选设置", "筛选优先级", "研究目标", "评分模式"],
  },
  {
    id: "evidence",
    zh: "证据与溯源",
    en: "Evidence & Provenance",
    titles: ["证据与溯源", "排序解释", "数据库快照", "优先候选摘要", "Top Candidate Review", "Score breakdown", "Decision trace", "Feature Importance Summary"],
  },
  {
    id: "limits",
    zh: "已知局限 / 数据缺口",
    en: "Limitations / Data gaps",
    titles: ["已知局限", "数据缺口", "Known limitations", "Candidate Stability", "Sanity check", "Sensitivity analysis"],
  },
  {
    id: "next",
    zh: "下一步建议",
    en: "Next steps",
    titles: ["下一步建议", "验证就绪度", "Model Benchmark Readiness", "Benchmark Roadmap"],
  },
]

function hasBody(section) {
  return section && String(section.body || "").trim().length > 0
}

function buildNarrativeBlocks(sections = []) {
  const remaining = sections.filter(section => hasBody(section) && section.title !== "执行摘要")
  const used = new Set()
  const blocks = NARRATIVE_BLOCKS.map(block => {
    const members = remaining.filter(section => block.titles.includes(section.title))
    members.forEach(section => used.add(section.title))
    return { ...block, members }
  })
  // Any section we did not explicitly route lands in the evidence block so nothing is lost.
  const leftovers = remaining.filter(section => !used.has(section.title))
  if (leftovers.length) {
    const evidence = blocks.find(block => block.id === "evidence")
    evidence.members = [...evidence.members, ...leftovers]
  }
  return blocks
}

function ReportScopeTabs({ type, setType, t, lang }) {
  const activeGroup = groupForType(type)
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {REPORT_GROUPS.map(group => {
          const active = group.id === activeGroup.id
          return (
            <button
              key={group.id}
              type="button"
              data-testid={`research-report-group-${group.id}`}
              onClick={() => { if (!active) setType(group.types[0]) }}
              style={{ ...toolbarBtn(t), background: active ? t.accent : t.surface, borderColor: active ? t.accent : t.border, color: active ? "#FFFFFF" : t.muted, fontWeight: 850 }}
            >
              {text(lang, group.zh, group.en)} · {text(lang, group.scope.zh, group.scope.en)}
            </button>
          )
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {activeGroup.types.map(typeId => {
          const item = REPORT_TYPES.find(row => row.id === typeId)
          if (!item) return null
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setType(item.id)}
              style={{ ...toolbarBtn(t), background: type === item.id ? t.badgeInfoBg : t.surface, borderColor: type === item.id ? t.accent : t.border, color: type === item.id ? t.accentText : t.muted }}
            >
              {text(lang, item.zh, item.en)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FourBlockNarrative({ report, t, lang }) {
  const blocks = useMemo(() => buildNarrativeBlocks(report.sections), [report.sections])
  return (
    <div data-testid="research-report-narrative" style={{ display: "grid", gap: 10 }}>
      {blocks.map((block, index) => (
        <article key={block.id} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 8, minWidth: 0, padding: 12 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
            <span style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 7, color: t.accentText, display: "inline-flex", fontSize: 11.5, fontWeight: 950, height: 24, justifyContent: "center", width: 24 }}>{index + 1}</span>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}>{text(lang, block.zh, block.en)}</strong>
          </div>
          {block.id === "conclusion" ? (
            <p style={{ color: t.textStrong, fontSize: 12.8, fontWeight: 760, lineHeight: 1.6, margin: 0 }}>{report.executiveSummary}</p>
          ) : null}
          {block.members.length ? (
            <div style={{ display: "grid", gap: 7 }}>
              {block.members.map(section => (
                <div key={section.title} style={{ minWidth: 0 }}>
                  <strong style={{ color: t.subtle, display: "block", fontSize: 11.5 }}>{section.title}</strong>
                  <span style={{ color: t.muted, display: "block", fontSize: 11.6, lineHeight: 1.5, marginTop: 2 }}>{section.body}</span>
                </div>
              ))}
            </div>
          ) : (block.id === "conclusion" ? null : (
            <span style={{ color: t.faint, fontSize: 11.4 }}>{text(lang, "本轮无该类内容。", "Nothing for this block in this run.")}</span>
          ))}
        </article>
      ))}
    </div>
  )
}

function ReportGenerator({ report, records, type, setType, candidateId, setCandidateId, t, lang }) {
  const candidates = records.slice(0, 10)
  const isCandidateScope = groupForType(type).id === "candidate"
  return (
    <Card
      id="research-reports-generator"
      title={text(lang, "研究报告", "Research Report")}
      subtitle={text(lang, "候选报告（面向候选）与筛选报告（面向轮次）分子 tab；每份报告都收敛为结论→证据→局限→下一步四块紧凑叙事。", "Candidate reports (per candidate) and screening reports (per round) split by sub-tab; each report converges into a conclusion → evidence → limitations → next-steps narrative.")}
      t={t}
      actions={
        <button type="button" onClick={() => downloadTextFile(`ecomof-${report.type}-research-report.md`, report.markdown)} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
          {text(lang, "导出研究报告", "Export research report")}
        </button>
      }
    >
      <ReportScopeTabs type={type} setType={setType} t={t} lang={lang} />
      {isCandidateScope ? (
        <label style={{ alignItems: "center", color: t.faint, display: "inline-flex", fontSize: 11, fontWeight: 800, gap: 7 }}>
          {text(lang, "选择候选", "Candidate")}
          <select value={candidateId} onChange={event => setCandidateId(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 34, padding: "6px 9px" }}>
            {candidates.map(row => <option key={row.candidateId} value={row.candidateId}>{row.displayName || row.candidateId}</option>)}
          </select>
        </label>
      ) : null}
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 10, padding: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BasisBadge tone="info">{report.title}</BasisBadge>
          <BasisBadge tone="proxy">{report.subtitle}</BasisBadge>
          <BasisBadge tone="warn">数据库预览</BasisBadge>
          <BasisBadge tone="warn">Not Final Recommendation</BasisBadge>
        </div>
        <FourBlockNarrative report={report} t={t} lang={lang} />
        <ReportCharts charts={report.charts} t={t} lang={lang} />
      </article>
    </Card>
  )
}

function RunSnapshot({ snapshot, t, lang, isMobile }) {
  return (
    <Card id="research-reports-snapshot" title={text(lang, "运行快照", "Run Snapshot")} subtitle={text(lang, "复现报告生成时的数据库、方法、验证和候选数量。", "Reproducibility snapshot for database, method, validation, and candidate counts.")} t={t} shellReady>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <Metric label="Run ID" value={snapshot.runId} t={t} />
        <Metric label="Database Version" value={snapshot.databaseVersion} t={t} />
        <Metric label="Method Version" value={snapshot.methodVersion} t={t} />
        <Metric label="Validation Version" value={snapshot.validationVersion} t={t} />
        <Metric label="Priority Mode" value={snapshot.performancePriorityModeLabel} t={t} />
        <Metric label="Timestamp" value={snapshot.timestamp} t={t} />
        <Metric label="Candidate Count" value={snapshot.candidateCount} t={t} />
        <Metric label="Verified Metadata Count" value={snapshot.verifiedMetadataCount} t={t} tone="pass" />
      </div>
    </Card>
  )
}

function FieldSourceTable({ report, t, lang }) {
  return (
    <Card id="research-reports-field-provenance" title={text(lang, "字段级溯源进入报告", "Field Provenance in Report")} subtitle={text(lang, "报告直接列出关键字段来源、状态、评分资格和核验阻断信息。", "The report includes key field sources, status, scoring eligibility, and verification blockers.")} t={t}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "0 7px", minWidth: 760, width: "100%" }}>
          <thead>
            <tr style={{ color: t.faint, fontSize: 10, textAlign: "left", textTransform: "uppercase" }}>
              <th>字段</th><th>值</th><th>来源</th><th>状态</th><th>评分</th><th>阻断</th>
            </tr>
          </thead>
          <tbody>
            {report.fieldSources.map(row => (
              <tr key={row.field} style={{ color: t.muted, fontSize: 11.5 }}>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, color: t.textStrong, fontWeight: 900, padding: 9 }}>{row.field}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 9 }}>{String(row.value)}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 9 }}>
                  {row.sourceDatabase}
                  <FieldProvenanceButton fieldKey={row.field} fieldLabel={row.field} source={row} lang={lang} />
                </td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 9 }}>{row.status}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 9 }}>{row.scoringEligible ? "yes" : "no"}</td>
                <td style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: 9 }}>{row.blocksVerifiedMetadata ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function CitationPackage({ packageData, t, lang }) {
  return (
    <Card id="research-reports-citation-package" title={text(lang, "引用包", "Citation Package")} subtitle={text(lang, "集中展示引用来源、数据来源、字段来源、来源链接和引用状态。", "Citation sources, data sources, field sources, source links, and citation status.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        <Metric label="Citation Ready Count" value={packageData.citationReadyCount} t={t} tone="pass" />
        <Metric label="Source Confirmed Count" value={packageData.sourceConfirmedCount} t={t} tone="pass" />
        <Metric label="Field Source Rows" value={packageData.fieldSources.length} t={t} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {packageData.entries.slice(0, 5).map(entry => (
          <article key={`${entry.dataSource}-${entry.sourceRecordId}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.5 }}>{entry.dataSource} · {entry.citationStatus}</strong>
            <span style={{ color: t.muted, fontSize: 11.5, lineHeight: 1.45 }}>{entry.citationSource}</span>
            <a href={entry.sourceUrl} target="_blank" rel="noreferrer" style={{ color: t.accentText, fontSize: 11.3, overflowWrap: "anywhere" }}>{entry.sourceUrl}</a>
          </article>
        ))}
      </div>
    </Card>
  )
}

function ResearchValidationSummaryCard({ summary, t, lang, isMobile }) {
  if (!summary) return null
  const diversity = summary.labelDiversity || {}
  const coverage = summary.evidenceCoverage || {}
  const queue = summary.validationQueue || []
  return (
    <Card id="research-validation-summary" title={text(lang, "Research Validation Summary", "Research Validation Summary")} subtitle={text(lang, "自动生成证据覆盖、标签多样性和验证优先队列。", "Automatically generated evidence coverage, label diversity, and validation priority queue.")} t={t}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))" }}>
        <Metric label="Label Diversity Score" value={`${diversity.score ?? "pending"} · ${diversity.grade || "pending"}`} t={t} tone={diversity.grade === "Weak" ? "warn" : "pass"} />
        <Metric label="Evidence Coverage" value={coverage.total ?? coverage.rows?.length ?? "pending"} t={t} />
        <Metric label="Validation Queue" value={queue.length} t={t} />
        <Metric label="Top Priority" value={queue[0]?.name || "pending"} t={t} tone="pass" />
      </div>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.4 }}>Evidence Coverage</strong>
          {(coverage.buckets || []).map(row => <span key={row.type} style={{ color: t.muted, fontSize: 11.5 }}>{row.type}: {row.count}</span>)}
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.4 }}>Label Diversity</strong>
          <span style={{ color: t.muted, fontSize: 11.5 }}>Unique DOI {diversity.uniqueDoi}</span>
          <span style={{ color: t.muted, fontSize: 11.5 }}>Unique Papers {diversity.uniquePapers}</span>
          <span style={{ color: t.muted, fontSize: 11.5 }}>Unique Catalysts {diversity.uniqueCatalysts}</span>
          <span style={{ color: t.muted, fontSize: 11.5 }}>Unique Experiments {diversity.uniqueExperiments}</span>
        </article>
        <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, display: "grid", gap: 5, padding: 9 }}>
          <strong style={{ color: t.textStrong, fontSize: 12.4 }}>Validation Queue</strong>
          {queue.slice(0, 5).map((row, index) => <span key={row.id} style={{ color: t.muted, fontSize: 11.5 }}>#{index + 1} {row.name}: {row.priorityScore}</span>)}
        </article>
      </div>
    </Card>
  )
}

function LocalizationAuditPanel({ audit, t, lang, isMobile }) {
  return (
    <Card id="research-reports-localization-audit" title={text(lang, "汉化质量审计", "Localization Audit")} subtitle={text(lang, "检查未翻译英文、混杂术语、重复翻译、旧文案和开发者文案。", "Checks untranslated English, mixed terminology, duplicate translations, legacy copy, and developer-oriented copy.")} t={t} shellReady>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))" }}>
        <Metric label="Localization Coverage" value={`${Math.round(audit.localizationCoverage * 100)}%`} t={t} tone="pass" />
        <Metric label="Terminology Consistency" value={audit.terminologyConsistency ? "pass" : "review"} t={t} tone={audit.terminologyConsistency ? "pass" : "warn"} />
        <Metric label="Scientific Language Consistency" value={audit.scientificLanguageConsistency ? "pass" : "review"} t={t} tone={audit.scientificLanguageConsistency ? "pass" : "warn"} />
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.muted, fontSize: 11.7, lineHeight: 1.55, padding: 10 }}>
        {text(lang, "术语库覆盖核心科研输出术语；科研动作统一为“查看筛选依据 / 查看字段来源 / 查看数据缺口 / 查看验证状态 / 查看排序解释 / 查看研究报告”。", "Terminology is centralized and scientific actions are normalized across the research output workflow.")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {terminologyPairs().slice(0, 12).map(row => (
          <span key={row.key} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 999, color: t.textStrong, fontSize: 11, fontWeight: 850, padding: "5px 8px" }}>
            {row.zh} / {row.en}
          </span>
        ))}
      </div>
    </Card>
  )
}

const EVOLUTION_COLORS = [oaPalette.accent, oaPalette.positive, oaPalette.mixed, oaPalette.risk, "#6D5CA8", "#0F766E", "#9A3412", "#475569"]

function DescriptorEvolutionLineChart({ model, lang }) {
  const stages = model.stages || []
  const series = model.routeSeries || []
  const width = 760
  const height = 360
  const left = 58
  const right = 30
  const top = 28
  const bottom = 74
  const maxRank = Math.max(1, ...stages.map(stage => stage.routeRankings?.length || 1))
  const xFor = index => left + (width - left - right) * index / Math.max(1, stages.length - 1)
  const yFor = rank => top + (Math.max(1, rank) - 1) / Math.max(1, maxRank - 1) * (height - top - bottom)
  const ticks = Array.from(new Set([1, 5, 10, 15, 20, maxRank].filter(value => value <= maxRank)))
  return (
    <div data-testid="descriptor-evolution-line-chart" data-series-count={series.length} style={{ background: oaPalette.bg, border: `1px solid ${oaPalette.border}`, borderRadius: 10, overflowX: "auto", padding: 10 }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={text(lang, "历次描述符添加的路线排名演化", "Route rank evolution across descriptor additions")} style={{ display: "block", minWidth: 680, width: "100%" }}>
        {ticks.map(rank => (
          <g key={rank}>
            <line x1={left} x2={width - right} y1={yFor(rank)} y2={yFor(rank)} stroke={oaPalette.border} strokeDasharray="4 5" />
            <text x={left - 10} y={yFor(rank) + 4} fill={oaPalette.faint} fontSize="10" textAnchor="end">#{rank}</text>
          </g>
        ))}
        {stages.map((stage, index) => (
          <g key={stage.stage}>
            <line x1={xFor(index)} x2={xFor(index)} y1={top} y2={height - bottom} stroke={oaPalette.borderStrong} />
            <text x={xFor(index)} y={height - 46} fill={oaPalette.text} fontSize="10.5" fontWeight="800" textAnchor="middle">{stage.version}</text>
            <text x={xFor(index)} y={height - 28} fill={oaPalette.muted} fontSize="9.5" textAnchor="middle">{stage.stage.slice(0, 24)}</text>
          </g>
        ))}
        {series.map((row, index) => {
          const color = EVOLUTION_COLORS[index % EVOLUTION_COLORS.length]
          const points = row.points.map((point, pointIndex) => `${xFor(pointIndex)},${yFor(point.rank)}`).join(" ")
          return (
            <g key={row.routeId}>
              <polyline data-testid="descriptor-evolution-series" data-route-id={row.routeId} points={points} fill="none" stroke={color} strokeOpacity="0.82" strokeWidth="2.2" />
              {row.points.map((point, pointIndex) => <circle key={`${row.routeId}-${point.version}`} cx={xFor(pointIndex)} cy={yFor(point.rank)} r="3" fill={color} />)}
            </g>
          )
        })}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {series.map((row, index) => (
          <span key={row.routeId} style={{ alignItems: "center", color: oaPalette.muted, display: "inline-flex", fontSize: 10.5, gap: 5 }}>
            <span style={{ background: EVOLUTION_COLORS[index % EVOLUTION_COLORS.length], borderRadius: 999, height: 7, width: 7 }} />
            {row.routeName}
          </span>
        ))}
      </div>
    </div>
  )
}

function DescriptorEvolutionReportSection({ model, t, lang }) {
  if (!model) return null
  return (
    <Card
      id="descriptor-evolution-report-section"
      title={text(lang, "描述符添加与排名演化报告", "Descriptor Addition and Ranking Evolution Report")}
      subtitle={text(lang, "按历史阶段记录 top-route 快照、真实价格重跑、描述符消融与审计结论；新增阶段只追加，不覆盖旧记录。", "Records historical top-route snapshots, the real-price rerun, descriptor ablation, and audit conclusions; new stages append without overwriting history.")}
      t={t}
    >
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <Metric label={text(lang, "阶段数", "Stages")} value={model.stages.length} t={t} />
        <Metric label={text(lang, "当前阶段", "Current stage")} value={model.currentStage.stage} t={t} tone="pass" />
        <Metric label="Composite Spearman ρ" value={model.audit.compositeSpearman ?? "n/a"} t={t} />
        <Metric label={text(lang, "榜首翻转率", "Top-route flip rate")} value={model.audit.topRouteFlipFrequency} t={t} tone={model.audit.topRouteFlipFrequency > 0 ? "warn" : "pass"} />
      </div>

      <div data-testid="descriptor-evolution-table" style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 1120, width: "100%" }}>
          <thead>
            <tr style={{ color: oaPalette.faint, fontSize: 10.5, textAlign: "left", textTransform: "uppercase" }}>
              <th style={{ padding: 8 }}>{text(lang, "阶段", "Stage")}</th>
              <th style={{ padding: 8 }}>Model</th>
              {[1, 2, 3, 4, 5].map(rank => <th key={rank} style={{ padding: 8 }}>#{rank}</th>)}
              <th style={{ padding: 8 }}>Al-MOF</th>
              <th style={{ padding: 8 }}>{text(lang, "价格状态", "Price status")}</th>
            </tr>
          </thead>
          <tbody>
            {model.stages.map(stage => (
              <tr key={stage.stage} style={{ color: oaPalette.muted, fontSize: 11.3, verticalAlign: "top" }}>
                <td style={{ borderTop: `1px solid ${oaPalette.border}`, color: oaPalette.text, fontWeight: 900, padding: 8 }}>{stage.stage}<br /><span style={{ color: oaPalette.faint }}>{stage.version}</span></td>
                <td style={{ borderTop: `1px solid ${oaPalette.border}`, padding: 8 }}>{stage.model}</td>
                {stage.top5Routes.map(row => (
                  <td key={row.rank} style={{ borderTop: `1px solid ${oaPalette.border}`, minWidth: 135, padding: 8 }}>
                    <strong style={{ color: oaPalette.text }}>{row.route}</strong><br />
                    <span style={{ color: oaPalette.accent }}>{row.score}</span>
                  </td>
                ))}
                <td style={{ borderTop: `1px solid ${oaPalette.border}`, color: oaPalette.accent, fontWeight: 900, padding: 8 }}>#{stage.alMofRank}</td>
                <td style={{ borderTop: `1px solid ${oaPalette.border}`, padding: 8 }}>{stage.priceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DescriptorEvolutionLineChart model={model} lang={lang} />

      <div data-testid="descriptor-evolution-analysis" style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {model.analyses.map(row => (
          <article key={row.id} style={{ background: oaPalette.bg, border: `1px solid ${oaPalette.border}`, borderRadius: 9, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: row.id === "limitation" ? oaPalette.risk : oaPalette.text, fontSize: 12.5 }}>{text(lang, row.titleZh, row.titleEn)}</strong>
            <span style={{ color: oaPalette.muted, fontSize: 11.7, lineHeight: 1.55 }}>{text(lang, row.bodyZh, row.bodyEn)}</span>
          </article>
        ))}
      </div>

      <div data-testid="descriptor-evolution-audit" style={{ background: oaPalette.surface, border: `1px solid ${oaPalette.border}`, borderRadius: 9, display: "grid", gap: 7, padding: 10 }}>
        <strong style={{ color: oaPalette.text, fontSize: 12.5 }}>{text(lang, "审计结论上墙", "Published audit conclusions")}</strong>
        <span style={{ color: oaPalette.muted, fontSize: 11.7, lineHeight: 1.5 }}>
          Composite Spearman ρ={model.audit.compositeSpearman ?? "n/a"} · {model.audit.compositeValidity} ·
          {text(lang, "低有效性单项", " low-validity standalone descriptors")}: {model.audit.lowValidityDescriptors.join(", ") || "none"} ·
          {text(lang, "低置信家族", " low-confidence families")}: {model.audit.lowConfidenceFamilies.join(", ") || "none"} ·
          {text(lang, "敏感性", " sensitivity")}: {model.audit.sensitivityScenarioCount} scenarios / {model.audit.fragility} / {model.audit.mostSensitiveFactor}
        </span>
        <span style={{ color: oaPalette.risk, fontSize: 11.5, fontWeight: 850 }}>{model.boundary}</span>
      </div>
    </Card>
  )
}

export function ResearchReportsTab({
  records: providedRecords = null,
  summary: providedSummary = null,
  versionData: providedVersionData = null,
  organicAcidResult: providedOrganicAcidResult = null,
  rankingEvolutionLog: providedRankingEvolutionLog = null,
  organicAcidAudit: providedOrganicAcidAudit = null,
  metalPriceTable: providedMetalPriceTable = null,
} = {}) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [records, setRecords] = useState(() => Array.isArray(providedRecords) ? providedRecords : [])
  const [summary, setSummary] = useState(providedSummary)
  const [versionData, setVersionData] = useState(providedVersionData)
  const [organicAcidResult, setOrganicAcidResult] = useState(providedOrganicAcidResult)
  const [dataFoundation, setDataFoundation] = useState(null)
  const [dataAudit, setDataAudit] = useState(null)
  const [dataIngestion, setDataIngestion] = useState(null)
  const [firstBenchmark, setFirstBenchmark] = useState(null)
  const [credibility, setCredibility] = useState(null)
  const [robustness, setRobustness] = useState(null)
  const [organicEvidenceRecords, setOrganicEvidenceRecords] = useState([])
  const [experimentalLabels, setExperimentalLabels] = useState(null)
  const [benchmarkDatasetV36, setBenchmarkDatasetV36] = useState(null)
  const [rankingEvolutionLog, setRankingEvolutionLog] = useState(providedRankingEvolutionLog)
  const [organicAcidAudit, setOrganicAcidAudit] = useState(providedOrganicAcidAudit)
  const [metalPriceTable, setMetalPriceTable] = useState(providedMetalPriceTable)
  const [type, setType] = useState("candidate")
  const [candidateId, setCandidateId] = useState("")

  useEffect(() => {
    let active = true
    if (providedRecords && providedSummary && providedVersionData) {
      const rows = Array.isArray(providedRecords) ? providedRecords : []
      setRecords(rows)
      setSummary(providedSummary)
      setVersionData(providedVersionData)
      setOrganicAcidResult(providedOrganicAcidResult)
      setRankingEvolutionLog(providedRankingEvolutionLog)
      setOrganicAcidAudit(providedOrganicAcidAudit)
      setMetalPriceTable(providedMetalPriceTable)
      setCandidateId(current => current || rows[0]?.candidateId || "")
      return () => { active = false }
    }
    Promise.all([
      fetchDataJson("database_precompute/v2_2/scalable_database_preview_records.json", []),
      fetchDataJson("database_precompute/v2_2/scalable_database_preview_summary.json", null),
      fetchDataJson("version_evolution_records.json", null),
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", []),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", []),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}),
      fetchDataJson("organic_acid_final_screening/organic_acid_evidence_records.json", []),
      fetchDataJson("organic_acid_gold_dataset_v2.json", null),
      fetchDataJson("organic_acid_literature_dataset_v2.json", null),
      fetchDataJson("benchmark_dataset_v2.json", null),
      fetchDataJson("organic_acid_labels_v2.json", null),
      fetchDataJson("data_ingestion/organic_acid_reaction_dataset_v1.json", null),
      fetchDataJson("data_ingestion/verified_metadata_expansion_report.json", null),
      fetchDataJson("data_ingestion/reaction_data_expansion_summary_v3_1.json", null),
      fetchDataJson("data_ingestion/source_registry.json", null),
      fetchDataJson("data_ingestion/data_ingestion_summary_v3.json", null),
      fetchDataJson("first_real_benchmark_report_v1.json", null),
      fetchDataJson("model_credibility_report_v1.json", null),
      fetchDataJson("model_robustness_report_v1.json", null),
      fetchDataJson("experimental_labels/experimental_labels_v2.json", null),
      fetchDataJson("benchmark_dataset_v3_6.json", null),
      fetchDataJson("organic_acid_ranking_evolution_log.json", null),
      fetchDataJson("organic_acid_audit_v3_9_8.json", null),
      fetchDataJson("metal_precursor_cost_table.json", null),
    ]).then(([nextRecords, nextSummary, nextVersionData, organicFrameworks, organicMetals, organicRules, organicEvidence, gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary, sourceRegistry, ingestionSummaryV3, firstBenchmarkReport, credibilityReport, robustnessReport, experimentalLabelRows, benchmarkV36, evolutionLog, scoringAudit, priceTable]) => {
      if (!active) return
      const rows = Array.isArray(nextRecords) ? nextRecords : []
      setRecords(rows)
      setSummary(nextSummary || {})
      setVersionData(nextVersionData || {})
      setOrganicAcidResult(runOrganicAcidFinalScreening(organicFrameworks || [], organicMetals || [], organicRules || {}, organicEvidence || [], { reactionDataset: reaction, goldDataset: gold, labelDataset: labels }))
      setDataFoundation(summarizeDataFoundation({ gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary, sourceRegistry }))
      setDataAudit(runDataAudit({ gold, labels, benchmark, reaction, sampleSize: 100 }))
      setDataIngestion(ingestionSummaryV3 && typeof ingestionSummaryV3 === "object" ? ingestionSummaryV3 : null)
      setFirstBenchmark(firstBenchmarkReport && typeof firstBenchmarkReport === "object" ? firstBenchmarkReport : null)
      setCredibility(credibilityReport && typeof credibilityReport === "object" ? credibilityReport : null)
      setRobustness(robustnessReport && typeof robustnessReport === "object" ? robustnessReport : null)
      setOrganicEvidenceRecords(Array.isArray(organicEvidence) ? organicEvidence : [])
      setExperimentalLabels(experimentalLabelRows && typeof experimentalLabelRows === "object" ? experimentalLabelRows : null)
      setBenchmarkDatasetV36(benchmarkV36 && typeof benchmarkV36 === "object" ? benchmarkV36 : null)
      setRankingEvolutionLog(evolutionLog && typeof evolutionLog === "object" ? evolutionLog : null)
      setOrganicAcidAudit(scoringAudit && typeof scoringAudit === "object" ? scoringAudit : null)
      setMetalPriceTable(priceTable && typeof priceTable === "object" ? priceTable : null)
      setCandidateId(current => current || rows[0]?.candidateId || "")
    })
    return () => { active = false }
  }, [providedRecords, providedSummary, providedVersionData, providedOrganicAcidResult, providedRankingEvolutionLog, providedOrganicAcidAudit, providedMetalPriceTable])

  const researchValidationSummary = useMemo(() => buildResearchValidationSummary({
    result: organicAcidResult,
    evidenceRecords: organicEvidenceRecords,
    labels: experimentalLabels,
    benchmarkDataset: benchmarkDatasetV36,
  }), [organicAcidResult, organicEvidenceRecords, experimentalLabels, benchmarkDatasetV36])
  const report = useMemo(() => generateResearchReport({
    type,
    records,
    summary: summary || {},
    versionData: versionData || {},
    candidateId,
    organicAcidResult,
    dataFoundation,
    dataAudit,
    dataIngestion,
    firstBenchmark,
    credibility,
    robustness,
    researchValidationSummary,
  }), [candidateId, records, summary, type, versionData, organicAcidResult, dataFoundation, dataAudit, dataIngestion, firstBenchmark, credibility, robustness, researchValidationSummary])
  const descriptorEvolutionReport = useMemo(() => buildDescriptorEvolutionReport(
    rankingEvolutionLog || {},
    organicAcidAudit || {},
    metalPriceTable || {},
  ), [metalPriceTable, organicAcidAudit, rankingEvolutionLog])
  const audit = useMemo(() => runLocalizationAudit({
    corpus: [
      report.markdown,
      "排序解释 查看筛选依据 查看字段来源 查看数据缺口 查看验证状态 查看研究报告 研究报告 运行快照 引用包 汉化质量审计",
    ],
  }), [report.markdown])

  if (!summary || !versionData) {
    return (
      <div id="research-reports" data-testid="research-reports-tab" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <section style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, color: t.muted, padding: 16 }}>
          {text(lang, "正在加载研究报告框架…", "Loading research reports framework...")}
        </section>
        <Card id="research-reports-snapshot" title={text(lang, "运行快照", "Run Snapshot")} subtitle={text(lang, "报告 shell 已就绪，等待数据库快照填充。", "Report shell is ready; waiting for database snapshot data.")} t={t} shellReady>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minHeight: 54 }} />
        </Card>
        <Card id="research-reports-localization-audit" title={text(lang, "汉化质量审计", "Localization Audit")} subtitle={text(lang, "审计 shell 已就绪，等待报告文本填充。", "Audit shell is ready; waiting for report text.")} t={t} shellReady>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, minHeight: 54 }} />
        </Card>
      </div>
    )
  }

  return (
    <div id="research-reports" data-testid="research-reports-tab" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <PageHeader
        title={text(lang, "研究报告", "Research Reports")}
        subtitle={text(lang, "将数据库预览、筛选流程追踪、字段级溯源、验证状态、模型基准就绪度和引用包组织为可复现的科研输出。", "Organizes database preview, screening trace, field provenance, validation status, model benchmark readiness, and citation package into reproducible research outputs.")}
        meta={text(lang, "科研展示与科研输出平台", "Research output framework")}
        action={<><BasisBadge tone="info">{versionData?.currentVersion || "V3.6"}</BasisBadge><CopyLinkButton hash="research-reports" ariaLabel="Copy Research Reports link" /></>}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <BasisBadge tone="proxy">数据库预览</BasisBadge>
        <BasisBadge tone="warn">Not Final Recommendation</BasisBadge>
        <BasisBadge tone="info">已核验元数据 {summary.verifiedMetadataCount}</BasisBadge>
        <BasisBadge tone="info">来源已确认 {summary.sourceConfirmedCandidates}</BasisBadge>
        <BasisBadge tone="info">引文已就绪 {summary.citationReadyCandidates}</BasisBadge>
      </div>
      <ReportGenerator report={report} records={records} type={type} setType={setType} candidateId={candidateId} setCandidateId={setCandidateId} t={t} lang={lang} />
      <ResearchValidationSummaryCard summary={researchValidationSummary} t={t} lang={lang} isMobile={isMobile} />
      <RunSnapshot snapshot={report.snapshot} t={t} lang={lang} isMobile={isMobile} />
      <CitationPackage packageData={report.citationPackage} t={t} lang={lang} />
      <details style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 13px" }}>
        <summary style={{ color: t.accentText, cursor: "pointer", fontSize: 12.5, fontWeight: 850 }}>
          {text(lang, "开发者与方法学细节（供复现：字段溯源、描述符演化、汉化审计）", "Developer & methodology details (for reproducibility: field provenance, descriptor evolution, localization audit)")}
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>
          <FieldSourceTable report={report} t={t} lang={lang} />
          <DescriptorEvolutionReportSection model={descriptorEvolutionReport} t={t} lang={lang} />
          <LocalizationAuditPanel audit={audit} t={t} lang={lang} isMobile={isMobile} />
        </div>
      </details>
    </div>
  )
}

export default ResearchReportsTab
