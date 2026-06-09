// @ts-nocheck
import { Suspense, lazy, useEffect, useMemo, useState } from "react"
import { ChemicalText } from "../common/ChemicalFormula"
import { fetchDataJson } from "../../services/dataService"
import { MethodologySectionSkeleton } from "./MethodologySkeleton"
import { runOrganicAcidFinalScreening } from "../../utils/organicAcidFinalScreening"
import { DescriptorEvidenceMatrix } from "./organic-acid-final/DescriptorEvidenceMatrix"
import { FormulaExplainerCard } from "./organic-acid-final/FormulaExplainerCard"
import { MechanismPathMethodCard } from "./organic-acid-final/MechanismPathMethodCard"
import { MethodologyCitationPanel } from "./organic-acid-final/MethodologyCitationPanel"
import { MethodologyFlowDiagram } from "./organic-acid-final/MethodologyFlowDiagram"
import { MethodologyLimitationsCard } from "./organic-acid-final/MethodologyLimitationsCard"
import { OrganicAcidMethodologyOverview } from "./organic-acid-final/OrganicAcidMethodologyOverview"
import { ExafsFalsificationDiagram, ValidationLoopDiagram } from "./organic-acid-final/ValidationLoopDiagram"

const DataMappingSchemaValidationPanel = lazy(() =>
  import("./organic-acid-final/DataMappingSchemaValidationPanel").then(module => ({ default: module.DataMappingSchemaValidationPanel })),
)

const text = (lang, zh, en) => (lang === "zh" ? zh : en)

function MetricCard({ label, value, t, tone = "info" }) {
  return (
    <article style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 9, display: "grid", gap: 4, minWidth: 0, padding: 10 }}>
      <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <strong style={{ color: tone === "warn" ? t.warn : t.textStrong, fontSize: 18, lineHeight: 1.1 }}><ChemicalText value={value} /></strong>
    </article>
  )
}

function RobustnessAuditMethod({ result, lang, t }) {
  const target = result?.sensitivity?.targetMetal || {}
  const rows = [
    {
      title: text(lang, "Weight perturbation", "Weight perturbation"),
      value: `${result?.sensitivity?.perturbationRange || "+/-20%"} · ${result?.sensitivity?.iterations || 1000} iterations`,
      detail: text(lang, "每轮扰动后重新归一化并重排全金属池。", "Every perturbation is normalized and reranks the full metal pool."),
    },
    {
      title: text(lang, "Full-metal distribution", "Full-metal distribution"),
      value: "Mo / W / V / Fe / Ti / Zr",
      detail: text(lang, "竞品金属保持可见，避免把审计收缩成 Mo-only 结论。", "Competitors remain visible so the audit does not collapse into a Mo-only claim."),
    },
    {
      title: text(lang, "Interpretation rule", "Interpretation rule"),
      value: text(lang, "Mo Top 3 >=85% -> robust high-priority", "Mo Top 3 >=85% -> robust high-priority"),
      detail: text(lang, "Mo Top1 100% -> robust but audit-required。", "Mo Top1 100% -> robust but audit-required."),
    },
  ]

  return (
    <section id="methodology-oafs-robustness" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Robustness Audit</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "稳健性审计：从推荐结果到可审计假设", "Robustness Audit: From Recommendation to Auditable Hypothesis")}
        </h3>
      </header>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(row => (
          <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, minWidth: 0, padding: 11 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{row.title}</span>
            <strong style={{ color: t.textStrong, fontSize: 14, lineHeight: 1.25 }}><ChemicalText value={row.value} /></strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.42 }}><ChemicalText value={row.detail} /></span>
          </article>
        ))}
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label="Mo Top1" value={`${Math.round((target.top1Probability || 0) * 100)}%`} t={t} tone="warn" />
        <MetricCard label="Mo Top3" value={`${Math.round((target.top3Probability || 0) * 100)}%`} t={t} />
        <MetricCard label="Audit status" value={result?.moRobustnessAudit?.label || "audit required"} t={t} tone="warn" />
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "Mo Top1 100% 不被解释为最终证明，而是标记为“稳健但需审计”。",
          "Mo Top1 100% is not treated as final proof. It is flagged as robust but audit-required."
        )} />
      </p>
    </section>
  )
}

function SmallRealDatasetMethod({ mappingReport, lang, t }) {
  const report = mappingReport || {}
  const rows = [
    [text(lang, "样例边界", "Sample boundary"), text(lang, "只接入小规模人工整理真实样例，不接入全量 CoRE/QMOF。", "Only a small curated real-example sample is integrated; full CoRE/QMOF is not loaded.")],
    [text(lang, "数据质量门", "Data quality gate"), text(lang, "ready-for-scoring 才可计算 OACS；needs-review 与 rejected 保持可审计但不进入最终推荐。", "Only ready-for-scoring records can calculate OACS; needs-review and rejected records remain auditable but cannot enter final recommendation.")],
    [text(lang, "字段来源", "Field provenance"), text(lang, "缺失来源显示 Pending provenance，不伪造 DOI、citation 或 license。", "Missing sources are shown as Pending provenance; DOI, citation, and license are not fabricated.")],
    [text(lang, "热区投影", "Hot spot projection"), text(lang, "Curated 点用于验证 mapper、quality gate 和 hot spot role display，不证明催化性能。", "Curated points validate mapper, quality gate, and hot spot role display; they do not prove catalytic performance.")],
  ]

  return (
    <section id="methodology-oafs-small-real-dataset" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Small Real Dataset Integration</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "小规模真实样例接入", "Small Real Dataset Integration")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V1.6 引入小规模人工整理真实样例，用于验证数据映射、schema validation、quality gate、fieldSources、Run Launcher 与 Hot Spot Map 是否能承接真实数据形状；V1.7 保持该边界并增加可审计 trace。",
          "V1.6 introduced curated real examples to validate data mapping, schema validation, quality gate, fieldSources, Run Launcher, and Hot Spot Map real-data shapes. V1.7 preserves that boundary and adds auditable trace records."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label={text(lang, "骨架样例", "Framework records")} value={report.frameworkRecords ?? "Pending"} t={t} />
        <MetricCard label="QMOF descriptors" value={report.qmofDescriptorRecords ?? "Pending"} t={t} />
        <MetricCard label={text(lang, "证据记录", "Evidence records")} value={report.evidenceRecords ?? "Pending"} t={t} />
        <MetricCard label={text(lang, "可评分 / 需复核 / 拒绝", "Ready / review / rejected")} value={`${report.readyForScoring ?? "?"} / ${report.needsReview ?? "?"} / ${report.rejected ?? "?"}`} t={t} tone="warn" />
      </div>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(lang, report.boundaryZh || "仅小规模人工整理样例；不是全量数据库筛选。", report.boundary || "Small curated sample only. Not full database screening.")} />
      </p>
    </section>
  )
}

function TraceWorkbenchMethod({ lang, t }) {
  return (
    <section id="methodology-oafs-trace-workbench" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 12, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Algorithm Trace Workbench</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "算法追踪工作台：可审计计算链", "Algorithm Trace Workbench: Auditable Computation Chain")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V1.7 将 Run Launcher 输出扩展为 runId、step-level trace、candidate decision log、formula weight inspector、evidence trace、candidate flow funnel 和 exportable Markdown / JSON report。它解释当前 demo / mapped fixture / curated sample 如何产生推荐，不证明催化性能。",
          "V1.7 expands Run Launcher output into runId, step-level trace records, candidate decision logs, formula weight inspectors, evidence traces, a candidate flow funnel, and exportable Markdown / JSON reports. It explains how the current demo / mapped fixture / curated sample produces a recommendation; it does not prove catalytic performance."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {[
          [text(lang, "Trace schema", "Trace schema"), "RunTrace / StepTrace / CandidateDecision / FormulaContribution / EvidenceTrace"],
          [text(lang, "导出", "Export"), "Markdown / JSON"],
          [text(lang, "边界", "Boundary"), "auditability and transparency, not proof"],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 10 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.8 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.45 }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

function DatabaseIndexPreviewMethod({ lang, t }) {
  const rows = [
    [
      text(lang, "V2.0-E 经核验 metadata 补全流程", "V2.0-E Verified Metadata Enrichment Workflow"),
      text(lang, "V2.0-E 在 V2.0-D Worker 边界之上新增 metadata 核验门控：对 DOI、来源链接、license、引用与描述符溯源建模核验状态。缺关键 metadata 的候选只能停留在仅限预览，必须通过 metadata 门控才能进入经核验推荐。V2.0-E 不修改 OACS/DMRS 公式，也不在浏览器内执行全量数据库评分。", "V2.0-E adds a metadata verification gate on top of the V2.0-D worker boundary: it models verification status for DOI, source link, license, citation, and descriptor provenance. Candidates missing key metadata stay preview only and must pass the metadata gate before becoming eligible for verified recommendation. V2.0-E does not modify OACS/DMRS formulas and does not run full database scoring in the browser."),
    ],
    [
      text(lang, "Metadata 核验门控", "Metadata verification gate"),
      text(lang, "门控将候选分为 metadata 已核验 / 部分完整 / 仅限预览 / 暂不可用，并给出阻断原因与提示；只有 metadata 已核验的候选 verifiedRecommendationEligible 为真。本轮只做状态建模与门控，不进行联网 DOI 核验。", "The gate classifies candidates as verified / partial / preview-only / blocked metadata with blocking reasons and warnings; only verified-metadata candidates are verifiedRecommendationEligible. This release models status and gating only and does not run live DOI verification."),
    ],
    [
      text(lang, "CI 远端验证", "CI verification gate"),
      text(lang, "新增独立于 GitHub Pages 部署的 GitHub Actions CI，运行 test、typecheck、build 与 visual check，避免只有本地验证报告。", "A GitHub Actions CI workflow, separate from the GitHub Pages deploy workflow, runs test, typecheck, build, and visual check so verification is not local-only."),
    ],
    [
      text(lang, "V2.0-D Worker 评分边界", "V2.0-D Worker-Based Scoring Boundary Design"),
      text(lang, "V2.0-D 在 V2.0-C 工作台上新增 Worker 评分边界预览。Worker 只处理已加载范围试算、当前选定索引分片或用户主动选择的小批量候选。", "V2.0-D adds the Worker-Based Scoring Boundary Design on top of the V2.0-C workbench. The worker handles loaded-scope dry runs, the selected index part, or user-selected small candidate batches only."),
    ],
    [
      text(lang, "为什么不在主线程全量评分", "Why full scoring does not run on the main thread"),
      text(lang, "CoRE/QMOF-like 数据库规模较大，全量数据库评分必须预计算，或在浏览器主线程之外执行；前端不自动加载全部索引分片或详情记录。", "CoRE/QMOF-like databases are large, so full database scoring must be precomputed or run outside the browser main thread; the front end does not automatically load all index parts or detail records."),
    ],
    [
      text(lang, "已加载范围试算", "Loaded-scope dry run"),
      text(lang, "已加载范围试算只使用界面中已经出现的 records，用于检查 request、skip reason 和 trace，不输出最终验证推荐。", "The loaded-scope dry run uses only records already present in the UI. It audits request shape, skip reasons, and trace output without producing a final verified recommendation."),
    ],
    [
      "Manifest + summaries",
      text(lang, "浏览器加载 manifest 摘要、CoRE/QMOF summary、descriptor availability 与 provenance coverage。", "The browser loads the manifest, CoRE/QMOF summaries, descriptor availability, and provenance coverage."),
    ],
    [
      "Top-N preview",
      text(lang, "预计算候选只作为 Top-N 预览展示，不是最终验证推荐。", "Precomputed candidates are shown as Top-N preview only, not final verified recommendations."),
    ],
    [
      "Index parts",
      text(lang, "用户点击后才加载当前选定索引分片；筛选、搜索、排序、分页和 Worker 试算都只作用于当前已加载分片，不会一次性加载全部分片。", "Only the selected index part loads after user action; filters, search, sorting, pagination, and worker dry runs apply only to the currently loaded part and do not fetch all parts at once."),
    ],
    [
      "Detail on demand",
      text(lang, "detailRef 在用户打开详情时才 fetch，并在 drawer 内呈现 descriptor checklist、provenance checklist、source boundary 与 missing evidence warning；缺失 DOI/citation/license 显示证据待核验。", "detailRef is fetched only when detail is opened, then the drawer shows descriptor checklists, provenance checklists, source boundaries, and missing evidence warnings; missing DOI/citation/license is shown as evidence pending."),
    ],
    [
      "Why no full database load",
      text(lang, "前端保持 manifest / summary / Top-N 预览 / 当前选定分片 / 详情按需加载边界，避免浏览器一次性加载全部 JSON 或执行全库评分。", "The front end keeps manifest / summary / Top-N preview / selected index part / detail-on-demand boundaries instead of loading all JSON files or running full database scoring in the browser."),
    ],
    [
      "Top-N preview vs full verified screening",
      text(lang, "Top-N 预览是离线预计算索引预览，用于解释候选进入预览的原因；经完整验证的全量数据库筛选仍需要完整来源核验、描述符复算、OACS/DMRS 审计和实验/文献验证。", "Top-N preview is an offline precomputed index preview used to explain why a candidate appears in the preview; full verified database screening still requires source verification, descriptor recomputation, OACS/DMRS audit, and experimental/literature validation."),
    ],
    [
      "Candidate Compare boundary",
      text(lang, "候选对比最多对比 3 个已加载候选，字段来自当前预览/索引数据；对比仅基于当前已加载的预览/索引数据。", "Candidate Compare compares up to 3 loaded candidates, with fields from the current preview/index data; comparison is based on currently loaded preview/index data only."),
    ],
    [
      text(lang, "Worker trace 审计", "Worker trace audit"),
      text(lang, "Worker trace 记录 runId、createdAt、scope、输入记录数、已评分数、跳过数、skip reason、formulaVersion、boundary 与 notFinalRecommendation，用于审计而不是最终推荐。", "Worker trace records runId, createdAt, scope, input count, scored count, skipped count, skip reasons, formulaVersion, boundary, and notFinalRecommendation for auditability, not final recommendation."),
    ],
  ]
  return (
    <section id="methodology-oafs-database-index-preview" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Database Index Preview</span>
        <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
          {text(lang, "数据库索引预览：V2.0-E 经核验 metadata 补全流程", "Database Index Preview: V2.0-E Verified Metadata Enrichment Workflow")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V2.0-E 在 V2.0-D Worker 边界之上新增 metadata 核验门控，让候选从“可预览”推进到“可核验”，并补齐 GitHub Actions 远端验证。浏览器仍只加载 manifest 摘要、预计算候选预览、选定索引分片和按需详情记录。",
          "V2.0-E adds a metadata verification gate on top of the V2.0-D worker boundary so candidates move from previewable to verifiable, and adds a remote GitHub Actions verification gate. The browser still loads only manifest summaries, precomputed candidate previews, selected index parts, and detail records on demand."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {rows.map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 12.7 }}>{label}</strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={value} /></span>
          </article>
        ))}
      </div>
      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(lang, "V2.0-E 仍然不是经完整验证的全量数据库筛选；Top-N 预览只是预览，OACS/DMRS 公式未在 V2.0-E 中修改。经完整验证的全量筛选仍需描述符复算、来源核验、公式审计与实验/文献验证。", "V2.0-E remains an index preview, not full verified database screening; Top-N preview is still preview only and OACS/DMRS formulas are unchanged in V2.0-E. Full verified screening still requires descriptor recomputation, source verification, formula audit, and experimental/literature validation.")} />
      </p>
    </section>
  )
}

function LazyMethodologyDetails({ id, title, titleZh, summary, summaryZh, defaultOpen = false, lang, t, children }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen
    const hash = String(window.location.hash || "").replace(/^#/, "")
    return defaultOpen || hash === id
  })
  const [loaded, setLoaded] = useState(open)
  const handleToggle = event => {
    const nextOpen = event.currentTarget.open
    setOpen(nextOpen)
    if (nextOpen) setLoaded(true)
  }
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const onHash = () => {
      const hash = String(window.location.hash || "").replace(/^#/, "")
      if (hash === id) {
        setOpen(true)
        setLoaded(true)
        window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
      }
    }
    onHash()
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [id])
  return (
    <details id={id} open={open} onToggle={handleToggle} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 15, fontWeight: 940, lineHeight: 1.25 }}>
        {text(lang, titleZh, title)}
        <span style={{ color: t.muted, display: "block", fontSize: 12, fontWeight: 650, lineHeight: 1.45, marginTop: 4 }}>
          <ChemicalText value={text(lang, summaryZh, summary)} />
        </span>
      </summary>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {loaded ? children : <MethodologySectionSkeleton lang={lang} t={t} title={title} titleZh={titleZh} />}
      </div>
    </details>
  )
}

function CoupledHotSpotMethod({ result, lang, t }) {
  const mapRows = [
    {
      title: "Scaffold Map",
      titleZh: "Scaffold Map / 骨架热区",
      body: "Scaffold Map evaluates whether an Al-MOF candidate lies in the region where hydrothermal evidence and C1 intermediate accessibility are jointly favorable.",
      bodyZh: "Scaffold Map 评估 Al-MOF 候选是否位于水热证据与 C1 中间体可及性同时较优的区域。",
    },
    {
      title: "Dopant Map",
      titleZh: "Dopant Map / 金属热区",
      body: "Dopant Map evaluates whether a second metal lies in the region where defect anchoring feasibility and active-site value are jointly favorable.",
      bodyZh: "Dopant Map 评估第二金属是否位于缺陷锚定可行性与活性位点价值同时较优的区域。",
    },
    {
      title: "Synergy Map",
      titleZh: "Synergy Map / 协同热区",
      body: "Synergy Map combines the selected Al-MOF scaffold with candidate dopants to visualize the current Mo primary hypothesis and W backup hypothesis.",
      bodyZh: "Synergy Map 将选定 Al-MOF 骨架与候选第二金属组合，可视化当前 Mo 主要假设与 W 备选假设。",
    },
  ]

  return (
    <section id="methodology-oafs-hot-spot" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Coupled Descriptor Hot Spot Map</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "耦合描述符热区图", "Coupled Descriptor Hot Spot Map")}
          </h3>
        </div>
        <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "打开知识库", "Open Knowledge Base")}
        </a>
      </header>

      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "本节将 OACS/DMRS 排序工作流转化为耦合描述符设计空间。受几何-电子耦合催化剂设计思想启发，热区图不新增科学结论，而是可视化骨架稳健性与第二金属活性位点价值如何共同定义当前高优先级设计区域。",
          "This section translates the OACS/DMRS ranking workflow into a coupled descriptor design space. Inspired by geometric-electronic coupled catalyst design, the hot spot map does not introduce new scientific claims; it visualizes how scaffold robustness and second-metal active-site value jointly define the current high-priority design region."
        )} />
      </p>

      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "参考工作以几何描述符和电子描述符构建双原子 ORR 催化剂热区图。EcoMOF-AI 借鉴的是这种设计思想，而不是其 ORR 模型本身；在本项目中，耦合坐标轴被改写为骨架稳健性与第二金属活性位点价值。",
          "The reference work constructs a catalytic hot spot map using a geometric descriptor and an electronic descriptor for diatomic ORR catalysts. EcoMOF-AI borrows this design philosophy, but adapts it to organic-acid-oriented MOF screening using scaffold robustness and dopant active-site value as the coupled axes."
        )} />
      </p>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {mapRows.map(row => (
          <article key={row.title} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 7, padding: 11 }}>
            <strong style={{ color: t.textStrong, fontSize: 13.5 }}><ChemicalText value={text(lang, row.titleZh, row.title)} /></strong>
            <span style={{ color: t.muted, fontSize: 12, lineHeight: 1.48 }}><ChemicalText value={text(lang, row.bodyZh, row.body)} /></span>
          </article>
        ))}
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <MetricCard label="Selected scaffold OACS" value={result?.selectedFramework?.organicAcidScore?.oacs ?? "Pending"} t={t} />
        <MetricCard label="Mo role" value="primary hypothesis" t={t} />
        <MetricCard label="W role" value="backup hypothesis" t={t} />
        <MetricCard label="Hot spot threshold" value={`${result?.hotSpotRegion?.xMin ?? 0.65} / ${result?.hotSpotRegion?.yMin ?? 0.65} / ${result?.hotSpotRegion?.synergyMin ?? 0.6}`} t={t} />
      </div>

      <p style={{ color: t.warn, fontSize: 12.5, fontWeight: 900, lineHeight: 1.52, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "不同于参考工作，当前 EcoMOF-AI 热区图尚未基于 DFT 标注的反应性能数据训练，而是基于演示级 / 代理 OACS-DMRS 描述符。因此它应被理解为假设生成工具，而不是性能预测模型。",
          "Unlike the reference work, the current EcoMOF-AI hot spot map is not trained on DFT-labeled reaction performance. It is based on demo/proxy OACS-DMRS descriptors and should be interpreted as a hypothesis-generation tool."
        )} />
      </p>
    </section>
  )
}

function KnowledgeBaseMethod({ lang, t }) {
  return (
    <section id="methodology-oafs-knowledge-base" style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 11, padding: 15, scrollMarginTop: 118 }}>
      <header style={{ alignItems: "start", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: t.accentText, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Knowledge Base</span>
          <h3 style={{ color: t.textStrong, fontSize: 21, lineHeight: 1.15, margin: 0 }}>
            {text(lang, "知识库：版本、文献与证据边界", "Knowledge Base: Versions, Literature, and Evidence Boundaries")}
          </h3>
        </div>
        <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
          {text(lang, "打开知识库", "Open Knowledge Base")}
        </a>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "知识库记录每一项工作流设计背后的文献灵感来源，包括哪些思想被迁移、哪些结论没有被直接转用，以及哪些证据仍处于待核状态。",
          "The Knowledge Base records the literature inspirations behind each workflow decision, including which ideas were adapted, which claims were not transferred, and which evidence remains pending."
        )} />
      </p>
      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          [text(lang, "已核验来源", "Verified source"), "Nature Communications 2025 hot spot map paper"],
          [text(lang, "文献库", "Literature Library"), "5 unique records from 6 uploaded files"],
          [text(lang, "迁移边界", "Adaptation boundary"), "Conceptual inspiration only; no DFT / ML / experimental reproduction claim"],
        ].map(([label, value]) => (
          <article key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, display: "grid", gap: 6, padding: 10 }}>
            <span style={{ color: t.faint, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
            <strong style={{ color: t.textStrong, fontSize: 12.8, lineHeight: 1.35 }}><ChemicalText value={value} /></strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export function OrganicAcidFinalMethodology({ lang, t }) {
  const [data, setData] = useState({ frameworks: [], metals: [], rules: {}, evidenceRecords: [], mappingReport: null })
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    let active = true
    setStatus("loading")
    Promise.all([
      fetchDataJson("organic_acid_final_screening/al_mof_framework_candidates.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/dopant_metal_property_matrix.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_screening_rules.json", {}, { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/organic_acid_evidence_records.json", [], { throwOnError: true }),
      fetchDataJson("organic_acid_final_screening/curated_real_examples/real_data_mapping_report.json", {}, { throwOnError: true }),
    ]).then(([frameworkRows, metalRows, ruleConfig, evidenceRows, mappingReport]) => {
      if (!active) return
      setData({
        frameworks: Array.isArray(frameworkRows) ? frameworkRows : [],
        metals: Array.isArray(metalRows) ? metalRows : [],
        rules: ruleConfig || {},
        evidenceRecords: Array.isArray(evidenceRows) ? evidenceRows : [],
        mappingReport: mappingReport || {},
      })
      setStatus("loaded")
    }).catch(error => {
      if (!active) return
      console.warn("Organic Acid methodology data could not be loaded.", error)
      setData({ frameworks: [], metals: [], rules: {}, evidenceRecords: [], mappingReport: null })
      setStatus("error")
    })
    return () => { active = false }
  }, [])

  const result = useMemo(() => {
    if (status !== "loaded") return null
    return runOrganicAcidFinalScreening(data.frameworks, data.metals, data.rules, data.evidenceRecords)
  }, [data, status])

  if (status === "loading") return <MethodologySectionSkeleton lang={lang} t={t} title="Organic Acid Final Screening Methodology" titleZh="有机酸最终筛选方法论" />
  if (status === "error" || !result) {
    return (
      <section id="methodology-organic-acid-final-screening" style={{ background: t.badgeWarnBg, border: `1px solid ${t.warn}`, borderRadius: 12, color: t.muted, display: "grid", gap: 8, padding: 14, scrollMarginTop: 118 }}>
        <strong style={{ color: t.warn }}>{text(lang, "有机酸方法论数据加载失败", "Organic Acid methodology data failed to load")}</strong>
        <span>{text(lang, "请稍后重试；Methods 其他章节不受影响。", "Please retry later; other Methods sections remain available.")}</span>
      </section>
    )
  }

  const oacsCard = result.formulaCards.find(card => card.id === "oacs")
  const dmrsCard = result.formulaCards.find(card => card.id === "dmrs")

  return (
    <details id="methodology-organic-acid-final-screening" open style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, display: "grid", gap: 13, padding: 14, scrollMarginTop: 118 }}>
      <summary style={{ color: t.textStrong, cursor: "pointer", fontSize: 22, fontWeight: 940, lineHeight: 1.15 }}>
        {text(lang, "有机酸最终筛选方法论", "Organic Acid Final Screening Methodology")}
      </summary>
      <div style={{ display: "grid", gap: 14, marginTop: 13 }}>
        <div style={{ alignItems: "center", background: t.badgeInfoBg, border: `1px solid ${t.border}`, borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "space-between", padding: 11 }}>
          <span style={{ color: t.muted, fontSize: 12.4, lineHeight: 1.45 }}>
            {text(lang, "打开知识库，查看 V1.0–V2.0-B 的版本演进、文献灵感来源、方法迁移边界与后续 roadmap。", "Open the Knowledge Base to review V1.0-V2.0-B version history, literature inspirations, method adaptation boundaries, and future roadmap.")}
          </span>
          <a href="#methodology-knowledge-base" style={{ background: t.surface, border: `1px solid ${t.accentText || t.accent}`, borderRadius: 8, color: t.accentText, fontSize: 12, fontWeight: 900, padding: "7px 10px", textDecoration: "none" }}>
            {text(lang, "打开知识库", "Open Knowledge Base")}
          </a>
        </div>
        <OrganicAcidMethodologyOverview lang={lang} t={t} coverage={result.evidenceCoverage} />
        <MethodologyFlowDiagram flow={result.methodologyFlowData} lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-data-mapping" title="Data Mapping and Schema Validation" titleZh="数据映射与 Schema Validation" summary="Data Mapper Preview Panel / Schema Validation Panel / Data Quality Gate Panel" summaryZh="Data Mapper Preview Panel / Schema Validation Panel / Data Quality Gate Panel" lang={lang} t={t}>
          <Suspense fallback={<MethodologySectionSkeleton lang={lang} t={t} title="Data Mapping and Schema Validation" titleZh="数据映射与 Schema Validation" />}>
            <DataMappingSchemaValidationPanel lang={lang} t={t} />
          </Suspense>
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-small-real-dataset" title="Small Real Dataset Integration" titleZh="小规模真实样例接入" summary="Small curated sample, quality gate, field provenance, and hot spot projection." summaryZh="小规模样例、质量门、字段来源与热区投影。" lang={lang} t={t}>
          <SmallRealDatasetMethod mappingReport={data.mappingReport} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <TraceWorkbenchMethod lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-database-index-preview" title="Database Index Preview" titleZh="数据库索引预览" summary="V2.0-E adds a metadata verification gate and CI verification on top of the V2.0-D worker boundary, while preserving lazy loading and the OACS/DMRS formulas." summaryZh="V2.0-E 在 V2.0-D Worker 边界之上新增 metadata 核验门控与 CI 验证，同时保持懒加载边界与 OACS/DMRS 公式不变。" lang={lang} t={t}>
          <DatabaseIndexPreviewMethod lang={lang} t={t} />
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-oacs" title="OACS Formula Explainer" titleZh="OACS 骨架筛选" summary="Formula card renders after expansion." summaryZh="公式卡片展开后渲染。" lang={lang} t={t}>
          <FormulaExplainerCard card={oacsCard} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-dmrs" title="DMRS Formula Explainer" titleZh="DMRS 第二金属推荐" summary="Formula card renders after expansion." summaryZh="公式卡片展开后渲染。" lang={lang} t={t}>
          <FormulaExplainerCard card={dmrsCard} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <MechanismPathMethodCard lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-hot-spot" title="Coupled Descriptor Hot Spot Map" titleZh="耦合描述符热区图" summary="Hot Spot Map method note renders when expanded." summaryZh="Hot Spot Map 方法说明展开后渲染。" lang={lang} t={t}>
          <CoupledHotSpotMethod result={result} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <KnowledgeBaseMethod lang={lang} t={t} />
        <LazyMethodologyDetails id="methodology-oafs-robustness" title="Robustness Audit" titleZh="稳健性审计" summary="Weight perturbation and Mo audit interpretation." summaryZh="权重扰动与 Mo 审计解释。" lang={lang} t={t}>
          <RobustnessAuditMethod result={result} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <LazyMethodologyDetails id="methodology-oafs-evidence-matrix" title="Evidence Strength Matrix" titleZh="证据强度矩阵" summary="Evidence matrix cards render on expansion." summaryZh="证据矩阵卡片展开后渲染。" lang={lang} t={t}>
          <DescriptorEvidenceMatrix rows={result.evidenceStrengthMatrix} coverage={result.evidenceCoverage} lang={lang} t={t} />
        </LazyMethodologyDetails>
        <ExafsFalsificationDiagram signature={result.exafsSignature} lang={lang} t={t} />
        <ValidationLoopDiagram validation={result.validationLoopData} lang={lang} t={t} />
        <MethodologyLimitationsCard lang={lang} t={t} />
        <MethodologyCitationPanel coverage={result.evidenceCoverage} lang={lang} t={t} />
      </div>
    </details>
  )
}
