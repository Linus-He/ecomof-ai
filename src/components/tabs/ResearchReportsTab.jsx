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
    <div id="research-reports-chart-pack" data-testid="research-reports-chart-pack" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
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

function ReportTypeControls({ type, setType, candidateId, setCandidateId, candidates, t, lang }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {REPORT_TYPES.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => setType(item.id)}
          style={{ ...toolbarBtn(t), background: type === item.id ? t.badgeInfoBg : t.surface, borderColor: type === item.id ? t.accent : t.border, color: type === item.id ? t.accentText : t.muted }}
        >
          {text(lang, item.zh, item.en)}
        </button>
      ))}
      <select value={candidateId} onChange={event => setCandidateId(event.target.value)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 7, color: t.textStrong, minHeight: 36, padding: "7px 9px" }}>
        {candidates.map(row => <option key={row.candidateId} value={row.candidateId}>{row.displayName || row.candidateId}</option>)}
      </select>
    </div>
  )
}

function ReportGenerator({ report, records, type, setType, candidateId, setCandidateId, t, lang }) {
  const candidates = records.slice(0, 10)
  return (
    <Card
      id="research-reports-generator"
      title={text(lang, "研究报告生成器", "Research Report Generator")}
      subtitle={text(lang, "Generate Research Report：支持候选报告、对比报告、筛选报告、验证报告和有机酸筛选报告。", "Generate Research Report: candidate, comparison, screening, validation, and Organic Acid Screening reports.")}
      t={t}
      actions={
        <button type="button" onClick={() => downloadTextFile(`ecomof-${report.type}-research-report.md`, report.markdown)} style={{ ...toolbarBtn(t), color: t.accentText, borderColor: t.accent }}>
          {text(lang, "导出研究报告", "Export research report")}
        </button>
      }
    >
      <ReportTypeControls type={type} setType={setType} candidateId={candidateId} setCandidateId={setCandidateId} candidates={candidates} t={t} lang={lang} />
      <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 10, padding: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <BasisBadge tone="info">{report.title}</BasisBadge>
          <BasisBadge tone="proxy">{report.subtitle}</BasisBadge>
          <BasisBadge tone="warn">数据库预览</BasisBadge>
          <BasisBadge tone="warn">Not Final Recommendation</BasisBadge>
        </div>
        <p style={{ color: t.textStrong, fontSize: 13.2, fontWeight: 800, lineHeight: 1.6, margin: 0 }}>{report.executiveSummary}</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {report.sections.map(section => (
            <div key={section.title} style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, minWidth: 0, padding: 9 }}>
              <strong style={{ color: t.textStrong, display: "block", fontSize: 12.3 }}>{section.title}</strong>
              <span style={{ color: t.muted, display: "block", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{section.body}</span>
            </div>
          ))}
        </div>
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
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
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

export function ResearchReportsTab({ records: providedRecords = null, summary: providedSummary = null, versionData: providedVersionData = null, organicAcidResult: providedOrganicAcidResult = null } = {}) {
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
    ]).then(([nextRecords, nextSummary, nextVersionData, organicFrameworks, organicMetals, organicRules, organicEvidence, gold, literature, benchmark, labels, reaction, verifiedMetadataReport, growthSummary, sourceRegistry, ingestionSummaryV3, firstBenchmarkReport, credibilityReport, robustnessReport, experimentalLabelRows, benchmarkV36]) => {
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
      setCandidateId(current => current || rows[0]?.candidateId || "")
    })
    return () => { active = false }
  }, [providedRecords, providedSummary, providedVersionData, providedOrganicAcidResult])

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
      <FieldSourceTable report={report} t={t} lang={lang} />
      <CitationPackage packageData={report.citationPackage} t={t} lang={lang} />
      <LocalizationAuditPanel audit={audit} t={t} lang={lang} isMobile={isMobile} />
    </div>
  )
}

export default ResearchReportsTab
