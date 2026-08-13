// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { ArrowSquareOut, CheckCircle, Database, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react"
import { fetchDataJson, getCatalysisReactionDatabaseV2, getGlobalMofCandidates } from "../../services/dataService"
import { useLang, useT, useViewport } from "../../contexts"
import { CatalysisLiteratureRecordCenter } from "../catalysis/CatalysisLiteratureRecordCenter"
import { OrganicAcidWorkspace } from "../catalysis/OrganicAcidWorkspace"
import { AlgorithmValidationCenter } from "../methodology/algorithm-validation/AlgorithmValidationCenter"
import { DataQualityAuditPanel } from "../data-quality/DataQualityAuditPanel"
import "./PriorityResearchPages.css"

const text = (lang, zh, en) => lang === "zh" ? zh : en
const present = value => value !== undefined && value !== null && value !== "" && value !== "pending"
const display = (value, fallback = "待补") => present(value) ? String(value) : fallback
const normalizeDoi = value => String(value || "").trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").toLowerCase()

function recordKeyFromHash(prefix) {
  if (typeof window === "undefined") return ""
  const hash = String(window.location.hash || "").replace(/^#/, "")
  if (!hash.startsWith(prefix)) return ""
  try {
    return decodeURIComponent(hash.slice(prefix.length))
  } catch {
    return hash.slice(prefix.length)
  }
}

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <header className="priority-page-intro">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </header>
  )
}

function StatusMessage({ status, lang }) {
  if (status === "loading") return <div className="priority-page-status" role="status">{text(lang, "正在读取现有数据库…", "Loading the existing database...")}</div>
  if (status === "error") return <div className="priority-page-status priority-page-status--error" role="alert"><WarningCircle aria-hidden size={19} />{text(lang, "数据读取失败，请检查已提交的数据文件。", "Data could not be loaded. Check the committed data files.")}</div>
  return null
}

function FieldGrid({ fields, lang }) {
  return (
    <dl className="priority-field-grid">
      {fields.map(field => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd className={present(field.value) ? "" : "is-pending"}>{display(field.value, text(lang, "待补", "Pending"))}</dd>
        </div>
      ))}
    </dl>
  )
}

export function CatalysisLiteratureVerificationPage() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  return (
    <div className="priority-research-page" data-testid="catalysis-literature-verification-page">
      <PageIntro
        eyebrow={text(lang, "研究 / 催化", "Research / Catalysis")}
        title={text(lang, "催化文献核验中心", "Catalysis Literature Verification")}
        description={text(lang, "将 DOI 身份、出版方元数据、反应条件、数值声明位置、活性相证据、许可与可用范围放在同一条核验链中。论文身份已确认，不等于全部实验声明已核对。", "Review DOI identity, publisher metadata, conditions, claim locations, active-phase evidence, licensing, and admission scope in one chain. Article identity does not imply that every experimental claim has been verified.")}
      >
        <a className="priority-text-link" href="#catalysis">{text(lang, "返回催化总览", "Back to Catalysis")}<ArrowSquareOut aria-hidden size={15} /></a>
      </PageIntro>
      <CatalysisLiteratureRecordCenter lang={lang} t={t} isMobile={isMobile} />
    </div>
  )
}

export function OrganicAcidResearchPage({ onNavigate }) {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  return (
    <div className="priority-research-page" data-testid="organic-acid-research-page">
      <OrganicAcidWorkspace lang={lang} t={t} isMobile={isMobile} onBack={() => onNavigate?.("catalysis")} />
    </div>
  )
}

function buildLegacyDataAudit([label, eligibility, provenance, benchmark]) {
  const leakage = {
    auditId: "data-leakage-audit",
    status: benchmark?.leakage?.leakCount ? "Fail" : "Pass",
    leakCount: benchmark?.leakage?.leakCount || 0,
    leakSeverity: benchmark?.leakage?.leakSeverity || "none",
    sharedDoiWarnings: benchmark?.leakage?.sharedDoiWarnings || [],
  }
  const statuses = [label?.status, eligibility?.status, provenance?.status, leakage.status]
  const overallStatus = statuses.includes("Fail") ? "Fail" : statuses.includes("Warning") ? "Warning" : "Pass"
  return {
    overallStatus,
    audits: { label, benchmarkEligibility: eligibility, provenance, leakage },
    benchmarkReport: benchmark,
  }
}

export function AlgorithmValidationPage() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [status, setStatus] = useState("loading")
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetchDataJson("core_mof_2024/summary.json", {}, { throwOnError: true }),
      fetchDataJson("data_ingestion/data_ingestion_summary_v3.json", {}, { throwOnError: true }),
      fetchDataJson("data_ingestion/label_audit_report_v1.json", {}, { throwOnError: true }),
      fetchDataJson("data_ingestion/benchmark_eligibility_audit_v1.json", {}, { throwOnError: true }),
      fetchDataJson("data_ingestion/provenance_audit_report_v1.json", {}, { throwOnError: true }),
      fetchDataJson("data_ingestion/benchmark_report_v1.json", {}, { throwOnError: true }),
      fetchDataJson("first_real_benchmark_report_v1.json", {}, { throwOnError: true }),
      fetchDataJson("model_credibility_report_v1.json", {}, { throwOnError: true }),
      fetchDataJson("model_robustness_report_v1.json", {}, { throwOnError: true }),
    ]).then(([summary, ingestion, label, eligibility, provenance, benchmark, firstBenchmark, credibility, robustness]) => {
      if (!active) return
      setData({
        summary: { totalCandidates: summary.count, verifiedMetadataCount: ingestion.verifiedMetadataCount, fieldProvenanceCoverage: 1 },
        dataIngestion: ingestion,
        dataAudit: buildLegacyDataAudit([label, eligibility, provenance, benchmark]),
        firstBenchmark,
        credibility,
        robustness,
      })
      setStatus("loaded")
    }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])

  return (
    <div className="priority-research-page" data-testid="algorithm-validation-page">
      <PageIntro
        eyebrow={text(lang, "方法与验证", "Methods & Validation")}
        title={text(lang, "算法验证中心", "Algorithm Validation Center")}
        description={text(lang, "这里读取已提交的数据库摘要、审计报告、内部协议基准、模型可信度与稳健性报告。结构元数据、整理标签、模型诊断和实验验证是彼此独立的证据层。", "This page reads the committed database summary, audit reports, internal protocol benchmark, model credibility, and robustness reports. Structural metadata, curated labels, model diagnostics, and experimental validation remain separate evidence layers.")}
      />
      <section className="research-center-boundary" aria-labelledby="algorithm-boundary-title">
        <h2 id="algorithm-boundary-title">{text(lang, "当前可以说明什么", "What the evidence currently supports")}</h2>
        <p>{text(lang, "模型指标来自冻结的内部整理标签和留出协议，可用于检查代码、拆分、泄漏、稳健性与可解释性。标签尚未完成逐条 DOI 和全文数值定位，因此不能称为外部独立实验验证；高过拟合风险也必须与指标同时阅读。", "Model metrics come from a frozen internally curated label corpus and held-out protocol. They can test code, splitting, leakage, robustness, and explainability. Because per-label DOI and full-text claim locations are incomplete, this is not independent external experimental validation; the high overfitting risk must be read alongside the metrics.")}</p>
        <a href="#benchmark-references">{text(lang, "查看基准采用与来源", "View benchmark adoption and sources")}<ArrowSquareOut aria-hidden size={15} /></a>
      </section>
      <nav className="research-center-index" aria-label={text(lang, "算法验证内容索引", "Algorithm validation index")}>
        {[
          ["algval-figure", text(lang, "验证图谱", "Validation map")],
          ["algval-data-audit", text(lang, "数据审计", "Data audit")],
          ["algval-experimental-labels", text(lang, "标签与协议基准", "Labels & protocol benchmark")],
          ["algval-model-leaderboard", text(lang, "模型诊断", "Model diagnostics")],
          ["algval-robustness", text(lang, "稳健性", "Robustness")],
          ["algval-database", text(lang, "数据库与描述符", "Database & descriptors")],
          ["algval-experimental", text(lang, "实验验证边界", "Experimental boundary")],
        ].map(([id, label], index) => <a href={`#${id}`} key={id}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}
      </nav>
      <StatusMessage status={status} lang={lang} />
      {status === "loaded" ? <AlgorithmValidationCenter {...data} lang={lang} t={t} isMobile={isMobile} /> : null}
    </div>
  )
}

export function DataQualityProvenancePage() {
  const t = useT()
  const { lang } = useLang()
  const { isMobile } = useViewport()
  const [status, setStatus] = useState("loading")
  const [records, setRecords] = useState([])

  useEffect(() => {
    let active = true
    getGlobalMofCandidates({ throwOnError: true }).then(rows => {
      if (!active) return
      setRecords(rows)
      setStatus("loaded")
    }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])

  return (
    <div className="priority-research-page" data-testid="data-quality-provenance-page">
      <PageIntro
        eyebrow={text(lang, "数据 / 治理", "Data / Governance")}
        title={text(lang, "数据质量与来源中心", "Data Quality & Provenance")}
        description={text(lang, "直接审计当前 9,835 条 CoRE MOF 2024 CSD-modified CR 记录，展示字段覆盖、来源完整度、歧义、缺失与核验阻断项；不沿用旧的合成样例审计摘要。", "Audit the active 9,835 CoRE MOF 2024 CSD-modified CR records directly, including field coverage, provenance completeness, ambiguity, missingness, and verification blockers. Legacy synthetic-fixture audit summaries are not reused.")}
      />
      <section className="research-center-boundary" aria-labelledby="data-quality-boundary-title">
        <h2 id="data-quality-boundary-title">{text(lang, "审计对象与判定边界", "Audit scope and decision boundary")}</h2>
        <p>{text(lang, "页面直接对当前统一 MOF 记录运行字段审计。来源已确认、引文就绪、许可证已确认和已核验元数据是不同状态；任何一项都不会自动升级另一项，也不代表论文实验性能已经核对。", "The page runs field audits directly over the active unified MOF records. Source confirmed, citation ready, licence confirmed, and verified metadata are distinct states; none automatically upgrades another or verifies experimental performance in a paper.")}</p>
        <a href="#benchmark-references">{text(lang, "查看结构数据库与来源基准", "View structural data and provenance references")}<ArrowSquareOut aria-hidden size={15} /></a>
      </section>
      <nav className="research-center-index" aria-label={text(lang, "数据质量内容索引", "Data quality index")}>
        {[
          ["database-health-score-card", text(lang, "数据库健康", "Database health")],
          ["field-coverage-matrix", text(lang, "字段覆盖", "Field coverage")],
          ["provenance-completeness-panel", text(lang, "来源完整度", "Provenance")],
          ["ambiguity-risk-panel", text(lang, "歧义与缺失", "Ambiguity & missingness")],
          ["verified-blocker-summary", text(lang, "核验阻断项", "Verification blockers")],
        ].map(([id, label], index) => <a href={`#${id}`} key={id}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}
      </nav>
      <StatusMessage status={status} lang={lang} />
      {status === "loaded" ? <DataQualityAuditPanel records={records} lang={lang} t={t} isMobile={isMobile} /> : null}
    </div>
  )
}

export function MofRecordPage() {
  const { lang } = useLang()
  const [status, setStatus] = useState("loading")
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState(recordKeyFromHash("mof-record-"))
  const [submitted, setSubmitted] = useState(query)

  useEffect(() => {
    let active = true
    getGlobalMofCandidates({ throwOnError: true }).then(rows => {
      if (!active) return
      setRecords(rows)
      setStatus("loaded")
    }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])

  useEffect(() => {
    const syncRecordFromHash = () => {
      const next = recordKeyFromHash("mof-record-")
      setQuery(next)
      setSubmitted(next)
    }
    window.addEventListener("hashchange", syncRecordFromHash)
    return () => window.removeEventListener("hashchange", syncRecordFromHash)
  }, [])

  const record = useMemo(() => {
    const key = String(submitted || "").trim().toLowerCase()
    if (!key) return null
    return records.find(row => [row.id, row.displayName, row.csdRefcode, row.sourceRecordId, ...(row.aliasNames || [])].some(value => String(value || "").toLowerCase() === key))
      || records.find(row => String(row.searchText || "").toLowerCase().includes(key))
  }, [records, submitted])

  const openRecord = event => {
    event.preventDefault()
    const key = String(query || "").trim()
    if (!key) return
    window.location.hash = `mof-record-${encodeURIComponent(key)}`
    setSubmitted(key)
  }

  return (
    <div className="priority-research-page" data-testid="mof-record-page">
      <PageIntro
        eyebrow={text(lang, "数据 / 记录详情", "Data / Record Detail")}
        title={record?.displayName || text(lang, "MOF 记录详情", "MOF Record Detail")}
        description={text(lang, "输入 CoRE 记录 ID、CSD Refcode、常用名或来源记录 ID。页面从统一 MOF 数据接口读取，不创建独立副本。", "Enter a CoRE record ID, CSD Refcode, common name, or source record ID. This page reads the unified MOF data interface without creating a second copy.")}
      />
      <form className="priority-record-search" onSubmit={openRecord}>
        <MagnifyingGlass aria-hidden size={18} />
        <input aria-label={text(lang, "查找 MOF 记录", "Find MOF record")} onChange={event => setQuery(event.target.value)} placeholder="coremof2024-csdm-00001 / ABAVIJ" value={query} />
        <button type="submit">{text(lang, "查看", "Open")}</button>
      </form>
      <StatusMessage status={status} lang={lang} />
      {status === "loaded" && submitted && !record ? <div className="priority-page-status priority-page-status--error" role="alert">{text(lang, "没有找到完全匹配的记录，请检查 ID 或 Refcode。", "No matching record was found. Check the ID or Refcode.")}</div> : null}
      {status === "loaded" && !submitted ? (
        <section className="priority-empty-state">
          <Database aria-hidden size={27} />
          <h2>{text(lang, "从真实记录开始", "Start with a real record")}</h2>
          <p>{text(lang, "例如 ABAVIJ 对应 CoRE MOF 记录 coremof2024-csdm-00001。", "For example, ABAVIJ maps to CoRE MOF record coremof2024-csdm-00001.")}</p>
          <a href="#mof-record-coremof2024-csdm-00001">ABAVIJ</a>
        </section>
      ) : null}
      {record ? (
        <article className="priority-record-detail">
          <div className="priority-record-state"><CheckCircle aria-hidden size={18} />{display(record.curationStatus, text(lang, "来源状态待补", "Source status pending"))}</div>
          <FieldGrid lang={lang} fields={[
            { label: text(lang, "记录 ID", "Record ID"), value: record.id },
            { label: "CSD Refcode", value: record.csdRefcode },
            { label: text(lang, "来源记录", "Source record"), value: record.sourceRecordId },
            { label: text(lang, "金属节点", "Metal node"), value: record.metalNode },
            { label: text(lang, "拓扑", "Topology"), value: record.topology },
            { label: text(lang, "年份", "Year"), value: record.year },
            { label: text(lang, "比表面积", "Surface area"), value: present(record.surfaceArea) ? `${record.surfaceArea} m²/g` : null },
            { label: "PLD", value: present(record.pldA) ? `${record.pldA} Å` : null },
            { label: "LCD", value: present(record.lcdA) ? `${record.lcdA} Å` : null },
            { label: text(lang, "孔体积", "Pore volume"), value: present(record.poreVolume) ? `${record.poreVolume} cm³/g` : null },
            { label: text(lang, "密度", "Density"), value: present(record.density) ? `${record.density} g/cm³` : null },
            { label: "DOI", value: record.doi },
          ]} />
          <section className="priority-source-block">
            <h2>{text(lang, "来源与使用边界", "Provenance & Use Boundary")}</h2>
            <p>{record.citation}</p>
            <p>{record.sourceDatabase} · {record.sourceVersion} · {record.license}</p>
            <div>
              {present(record.sourceUrl) ? <a href={record.sourceUrl} target="_blank" rel="noreferrer">{text(lang, "数据库来源", "Database source")}<ArrowSquareOut aria-hidden size={14} /></a> : null}
              {present(record.doi) ? <a href={`https://doi.org/${record.doi}`} target="_blank" rel="noreferrer">DOI<ArrowSquareOut aria-hidden size={14} /></a> : null}
            </div>
          </section>
        </article>
      ) : null}
    </div>
  )
}

export function LiteratureRecordPage() {
  const { lang } = useLang()
  const [status, setStatus] = useState("loading")
  const [database, setDatabase] = useState(null)
  const [query, setQuery] = useState(recordKeyFromHash("literature-doi-"))
  const [submitted, setSubmitted] = useState(query)

  useEffect(() => {
    let active = true
    getCatalysisReactionDatabaseV2({ throwOnError: true }).then(value => {
      if (!active) return
      setDatabase(value)
      setStatus("loaded")
    }).catch(() => active && setStatus("error"))
    return () => { active = false }
  }, [])

  useEffect(() => {
    const syncRecordFromHash = () => {
      const next = recordKeyFromHash("literature-doi-")
      setQuery(next)
      setSubmitted(next)
    }
    window.addEventListener("hashchange", syncRecordFromHash)
    return () => window.removeEventListener("hashchange", syncRecordFromHash)
  }, [])

  const documents = database?.tables?.sourceDocuments || []
  const record = useMemo(() => documents.find(row => normalizeDoi(row.doi) === normalizeDoi(submitted)), [documents, submitted])
  const verification = record ? database?.tables?.documentVerifications?.find(row => row.sourceDocumentId === record.id) : null
  const reactions = record ? (database?.tables?.reactionRecords || []).filter(row => row.sourceDocumentId === record.id) : []
  const catalystStates = reactions.map(reaction => database?.tables?.catalystStates?.find(row => row.reactionRecordId === reaction.id)).filter(Boolean)

  const openRecord = event => {
    event.preventDefault()
    const doi = normalizeDoi(query)
    if (!doi) return
    window.location.hash = `literature-doi-${encodeURIComponent(doi)}`
    setSubmitted(doi)
  }

  return (
    <div className="priority-research-page" data-testid="literature-record-page">
      <PageIntro
        eyebrow={text(lang, "数据 / DOI 详情", "Data / DOI Detail")}
        title={record?.title || text(lang, "DOI 文献详情", "DOI Literature Detail")}
        description={text(lang, "当前页面读取催化反应数据库中的来源文献、Crossref 核验快照、许可证据与关联反应记录。它是后续全局 DOI 注册表的详情页原型。", "This page reads source documents, Crossref verification snapshots, license evidence, and linked reaction records from the catalysis database. It is the detail-page prototype for a future global DOI registry.")}
      />
      <form className="priority-record-search" onSubmit={openRecord}>
        <MagnifyingGlass aria-hidden size={18} />
        <input aria-label={text(lang, "查找 DOI", "Find DOI")} onChange={event => setQuery(event.target.value)} placeholder="10.1039/d2ta04485d" value={query} />
        <button type="submit">{text(lang, "核验记录", "Open record")}</button>
      </form>
      <StatusMessage status={status} lang={lang} />
      {status === "loaded" && submitted && !record ? <div className="priority-page-status priority-page-status--error" role="alert">{text(lang, "该 DOI 尚未进入当前核验数据库。", "This DOI is not yet present in the verification database.")}</div> : null}
      {status === "loaded" && !submitted ? (
        <section className="priority-record-list">
          <h2>{text(lang, "已登记文献", "Registered literature")}</h2>
          {documents.map(row => <a key={row.id} href={`#literature-doi-${encodeURIComponent(row.doi)}`}><span>{row.title}</span><small>{row.doi} · {row.journal} · {row.year}</small></a>)}
        </section>
      ) : null}
      {record ? (
        <article className="priority-record-detail">
          <div className="priority-record-state"><CheckCircle aria-hidden size={18} />{verification?.metadataMatch?.status || record.metadataVerification}</div>
          <FieldGrid lang={lang} fields={[
            { label: "DOI", value: record.doi },
            { label: text(lang, "期刊", "Journal"), value: record.journal },
            { label: text(lang, "年份", "Year"), value: record.year },
            { label: text(lang, "文献类型", "Document type"), value: record.documentType },
            { label: text(lang, "元数据核验", "Metadata verification"), value: verification?.metadataMatch?.status },
            { label: text(lang, "注册机构", "Registration agency"), value: verification?.registrationAgency },
            { label: text(lang, "更新状态", "Update status"), value: verification?.updateStatus?.status },
            { label: text(lang, "全文访问", "Full-text access"), value: record.fullTextAccess },
            { label: text(lang, "许可", "License"), value: record.license?.name },
            { label: text(lang, "关联反应", "Linked reactions"), value: reactions.length },
            { label: text(lang, "催化剂状态", "Catalyst states"), value: catalystStates.length },
            { label: text(lang, "核验时间", "Checked at"), value: verification?.checkedAt },
          ]} />
          <section className="priority-source-block">
            <h2>{text(lang, "许可证据与关联对象", "License Evidence & Linked Objects")}</h2>
            <p>{record.licenseEvidence?.sourceLocation || text(lang, "许可证据位置待补", "License evidence location pending")}</p>
            {catalystStates.map(state => <p key={state.id}><strong>{state.catalystName}</strong> · {state.activePhaseStatus} · {state.frameworkFamily}</p>)}
            <div>
              <a href={record.doiUrl} target="_blank" rel="noreferrer">DOI<ArrowSquareOut aria-hidden size={14} /></a>
              <a href={record.sourceUrl} target="_blank" rel="noreferrer">{text(lang, "出版方页面", "Publisher page")}<ArrowSquareOut aria-hidden size={14} /></a>
              {record.license?.url ? <a href={record.license.url} target="_blank" rel="noreferrer">{text(lang, "许可原文", "License text")}<ArrowSquareOut aria-hidden size={14} /></a> : null}
            </div>
          </section>
        </article>
      ) : null}
    </div>
  )
}

const CHARTER_PRINCIPLES = [
  {
    number: "01",
    zh: "让研究收益广泛可用",
    en: "Broadly useful research",
    bodyZh: "我们的使命是让 MOF 筛选、证据核验和研究讨论更透明、更可追溯。公开界面应帮助研究者理解数据、方法与边界，而不是用复杂度制造权威感。",
    bodyEn: "Our mission is to make MOF screening, evidence review, and scientific discussion more transparent and traceable. Public interfaces should reveal data, methods, and boundaries rather than manufacture authority through complexity.",
  },
  {
    number: "02",
    zh: "坚持长期科学可靠性",
    en: "Long-term scientific reliability",
    bodyZh: "当证据、许可或适用条件不充分时，我们宁可标记待补、阻断比较或延迟发布，也不制造确定性。筛选分数、代理指标和模型输出不能被包装成最终实验结论。",
    bodyEn: "When evidence, licensing, or operating conditions are insufficient, we prefer pending states, blocked comparisons, or delayed publication over false certainty. Screening scores, proxies, and model outputs must not be presented as final experimental conclusions.",
  },
  {
    number: "03",
    zh: "保持技术与证据领导力",
    en: "Technical and evidence leadership",
    bodyZh: "我们通过真实记录、字段级来源、可复现构建脚本、条件化比较和可证伪验证来提高研究质量。新功能必须说明输入、算法、假设、不确定性、失败条件与来源。",
    bodyEn: "We improve research quality through real records, field-level provenance, reproducible builders, condition-aware comparison, and falsifiable validation. New capabilities must state inputs, algorithms, assumptions, uncertainty, failure conditions, and sources.",
  },
  {
    number: "04",
    zh: "保持开放合作取向",
    en: "Cooperative orientation",
    bodyZh: "我们支持可复核的引用、合理的数据互操作、错误报告和方法讨论；尊重发布方许可、作者署名与机构边界，并保留暂停、更正、限制或移除有争议内容的机制。",
    bodyEn: "We support reviewable citation, responsible interoperability, error reporting, and methodological discussion; respect publisher licences, attribution, and institutional boundaries; and retain mechanisms to pause, correct, restrict, or remove disputed content.",
  },
]

export function ResearchCharterPage() {
  const { lang } = useLang()
  return (
    <article className="research-charter-page" data-testid="research-charter-page">
      <header>
        <span>{text(lang, "关于 / 项目治理", "About / Governance")}</span>
        <h1>{text(lang, "EcoMOF-AI 研究宪章", "The EcoMOF-AI Research Charter")}</h1>
        <p>{text(lang, "我们的使命是建设一套面向 MOF 可持续筛选、气体分离、催化研究与数据核验的透明基础设施，使每个重要判断都能回到记录、条件、方法与来源。", "Our mission is to build transparent infrastructure for sustainable MOF screening, gas separation, catalysis research, and data verification, so every material judgment can return to records, conditions, methods, and sources.")}</p>
        <small>{text(lang, "研究治理文件 · 不是法律条款或许可替代文件", "Research governance document · not a substitute for legal terms or licences")}</small>
      </header>
      <section className="research-charter-principles">
        {CHARTER_PRINCIPLES.map(item => (
          <article key={item.number}>
            <span>{item.number}</span>
            <h2>{text(lang, item.zh, item.en)}</h2>
            <p>{text(lang, item.bodyZh, item.bodyEn)}</p>
          </article>
        ))}
      </section>
      <footer>
        <p>{text(lang, "本宪章规定项目方向；具体数据访问、许可、署名、再分发与用户责任仍以“条款与政策”及发布方原文为准。", "This charter sets project direction. Data access, licensing, attribution, redistribution, and user responsibilities remain governed by Terms & Policies and the original publisher documents.")}</p>
        <div>
          <a href="#database-compliance">{text(lang, "查看条款与政策", "View Terms & Policies")}<ArrowSquareOut aria-hidden size={14} /></a>
          <a href="https://openai.com/charter/" target="_blank" rel="noreferrer">{text(lang, "结构参考：OpenAI Charter", "Structural reference: OpenAI Charter")}<ArrowSquareOut aria-hidden size={14} /></a>
        </div>
      </footer>
    </article>
  )
}
