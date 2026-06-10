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
      text(lang, "V2.0-J 筛选运行体验与结果面板重构", "V2.0-J Screening Run UX and Result Panel Refactor"),
      text(lang, "V2.0-J 不新增算法，而是把筛选器重构为可运行的科研工作台：新增筛选运行台与醒目的“开始筛选审计”按钮、12 步运行过程（含运行中/已完成/需注意/阻断状态）、筛选结果面板（5 组结果 + 通俗结论 + 结果解释）与由汇总驱动的下一步行动面板，并把证据整理与高级审计折叠到次级层级。运行状态机仅读取现有 V2.0-I 汇总，不重算 OACS/DMRS、不执行全量数据库评分、不训练模型；结果仍是仅限预览且不是最终推荐，verified_metadata 仍为 0。", "V2.0-J adds no new algorithm; it refactors the screener into a runnable research workbench: a Screening Run Console with a prominent Run-screening-audit button, a 12-step run progress (running/completed/warning/blocked), a Screening Result Panel (5 result groups + plain-language conclusion + result interpretation), and a summary-driven Next Action panel, with evidence curation and advanced audits collapsed into secondary layers. The run state machine only reads the existing V2.0-I summary; it does not recompute OACS/DMRS, run full database scoring, or train a model; the result stays preview only and not a final recommendation, with verified_metadata still 0."),
    ],
    [
      text(lang, "运行体验边界", "Screening run boundary"),
      text(lang, "运行台只是交互层：点击运行只是把已有审计汇总按步骤呈现，并给出结果解释与下一步行动；它不产生新证据，也不把 preview 结果说成最终推荐。", "The run console is an interaction layer only: clicking run replays the existing audit summary as steps and adds interpretation and next actions; it produces no new evidence and never presents the preview result as a final recommendation."),
    ],
    [
      text(lang, "V2.0-I 人工 metadata 整理与来源链接补全", "V2.0-I Manual Metadata Curation and Source-Link Enrichment"),
      text(lang, "V2.0-I 把 V2.0-H 的 18 条核验队列变成可持续的人工 metadata 整理流程：curation 状态分层（needs_source_review → source_confirmed → citation_ready → license_pending/confirmed → doi_pending → verified_metadata，或 curation_blocked）、整理进度汇总、保留人工字段的构建脚本，以及人工整理面板与详情抽屉联动。找不到 DOI/license/来源时保持待补，绝不伪造；source_confirmed / citation_ready / near_verified 都不等于 verified_metadata。verified_metadata 仍需在真实已确认字段上通过 V2.0-E/V2.0-H 门控，因此当前仍为 0。不扩数据库、不训练模型，仍不是最终推荐。", "V2.0-I turns the V2.0-H 18-item verification queue into a sustainable manual metadata curation workflow: a curation status ladder (needs_source_review -> source_confirmed -> citation_ready -> license_pending/confirmed -> doi_pending -> verified_metadata, or curation_blocked), a progress summary, a merge-preserving build script, and a curation panel linked into the detail drawer. When DOI/license/source cannot be found they stay pending and are never fabricated; source_confirmed / citation_ready / near_verified are not verified_metadata. verified_metadata still requires the V2.0-E/V2.0-H gate to pass on real confirmed fields, so it is still 0. No database expansion, no model training, and still not a final recommendation."),
    ],
    [
      text(lang, "来源链接补全边界", "Source-link enrichment boundary"),
      text(lang, "人工整理只记录进度，不替代 metadata 门控；脚本重跑会保留人工已填写的 source/citation/license/DOI（existing manual value > 新生成的 pending 占位）。", "Manual curation records progress only and does not replace the metadata gate; re-running the build script preserves manually entered source/citation/license/DOI (existing manual value > newly generated pending placeholder)."),
    ],
    [
      text(lang, "V2.0-H 小样本验证与敏感性审计", "V2.0-H Small-Sample Validation and Sensitivity Audit"),
      text(lang, "V2.0-H 把 V2.0-G 的 120 条样本推进到可审计验证计划：人工 metadata 核验队列、near_verified 分层（仅优先核验，不等于已核验）、确定性敏感性审计、特征消融审计、机制证据回填（文献支持/描述符推断/弱代理/证据不足）与候选验证路线。受 Han et al. 2024 的 筛选→机制解释→验证 闭环启发，仅作方法类比：不复现 Li-S 模型、不训练 XGBoost、不报告模型精度。不扩数据库、不改 OACS/DMRS，仍不是最终推荐。", "V2.0-H pushes the V2.0-G 120-record sample toward an auditable validation plan: a manual metadata verification queue, a near_verified tier (priority review only, not verified), a deterministic sensitivity audit, a feature ablation audit, mechanism evidence backfill (literature_supported / descriptor_inferred / weak_proxy / insufficient_evidence), and a candidate validation roadmap. Inspired by the screen -> mechanism-explain -> validate loop in Han et al. 2024 as a method analogy only: no Li-S model reproduction, no XGBoost training, no model-precision metrics. No database expansion, no OACS/DMRS change, and still not a final recommendation."),
    ],
    [
      text(lang, "near_verified 分层", "near_verified tier"),
      text(lang, "near_verified 表示来源/描述符溯源基本完整、citation 或来源链接至少有一个可用，但 DOI 或 license 仍待核验的候选；它只能进入优先人工核验队列，仍不可作为最终推荐。", "near_verified marks candidates whose source/descriptor provenance is largely complete with at least a citation or source lead, but whose DOI or license is still pending; it only enters the priority manual-review queue and is still not a final recommendation."),
    ],
    [
      text(lang, "V2.0-G 小规模经核验数据库接入 + 多视角描述符门控", "V2.0-G Small-Scale Verified Database Integration + Multi-View Descriptor Gate"),
      text(lang, "V2.0-G 接入一个有界（<= 200 条）小规模经核验样本，让部分候选从仅限预览推进到 partial_metadata（DOI/license 仍待核验，未伪造）。新增描述符冗余门控（方差/缺失率/Pearson 相关，标记但不删除）、机制代理层（描述符 → CO₂→有机酸机制代理，证据不足返回 null）与算法改进追踪。受 Han et al. 2024（10.1038/s41467-024-52550-9）多视角特征工程启发，仅作方法类比：不复现其 Li-S 模型、不使用 Li-S 目标变量、不训练 XGBoost、不报告模型精度指标。OACS/DMRS 公式未修改。", "V2.0-G integrates a bounded (<= 200 record) small verified sample and advances part of it from preview only to partial_metadata (DOI/license still pending, not fabricated). It adds a descriptor redundancy gate (variance/missingness/Pearson, flag-not-delete), a mechanism proxy layer (descriptors -> CO2->organic-acid proxies, null on insufficient evidence), and an algorithm improvement trace. Inspired by the multi-view feature engineering in Han et al. 2024 (10.1038/s41467-024-52550-9) as a method analogy only: no reproduction of their Li-S model, no Li-S target variables, no XGBoost training, and no model-precision metrics reported. OACS/DMRS formulas are unchanged."),
    ],
    [
      text(lang, "Han et al. 2024 借鉴边界", "Han et al. 2024 adaptation boundary"),
      text(lang, "仅借鉴 limited dataset 下的多视角特征工程、filter/wrapper/embedded 分层特征选择思想、Pearson 冗余过滤与集合/协同描述符思路；不复现 Li-S 电池模型，不使用其数据与目标变量，不训练黑盒 ML，不声称达到其预测性能。", "We borrow only the ideas of multi-view feature engineering under a limited dataset, layered filter/wrapper/embedded selection, Pearson redundancy filtering, and ensemble/synergy descriptors; we do not reproduce the Li-S battery model, do not use its data or target variables, do not train black-box ML, and do not claim its predictive performance."),
    ],
    [
      text(lang, "V2.0-F 后台预计算管线规划", "V2.0-F Background Precompute Pipeline Planning"),
      text(lang, "V2.0-F 规划后台预计算管线：原始记录 → 归一化 → metadata 门控 → 描述符检查 → OACS/DMRS 试算 → 预计算 Top-N → 浏览器预览边界。提供管线文档、离线 dry-run 脚本与预计算索引 schema。V2.0-F 不接入全量数据库，也不是经完整验证的筛选；全量评分仍在浏览器主线程之外进行。", "V2.0-F plans the background precompute pipeline: raw records → normalization → metadata gate → descriptor check → OACS/DMRS dry-run → precomputed Top-N → browser preview boundary. It ships a pipeline doc, an offline dry-run script, and a precomputed index schema. V2.0-F does not integrate the full database and is not full verified screening; full scoring stays outside the browser main thread."),
    ],
    [
      text(lang, "预计算 dry-run（离线）", "Precompute dry-run (offline)"),
      text(lang, "dry-run 脚本只读取本地预览样本（Top-N 与一个选定分片），统计 metadata 核验状态与描述符完整度，输出审计摘要；不联网、不加载全量数据库、不产生最终推荐。", "The dry-run script reads only local preview fixtures (Top-N and one selected part), counts metadata verification status and descriptor completeness, and emits an audit summary; no network, no full database load, no final recommendation."),
    ],
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
          {text(lang, "数据库索引预览：V2.0-J 筛选运行体验与结果面板重构", "Database Index Preview: V2.0-J Screening Run UX and Result Panel Refactor")}
        </h3>
      </header>
      <p style={{ color: t.muted, fontSize: 12.5, lineHeight: 1.58, margin: 0 }}>
        <ChemicalText value={text(
          lang,
          "V2.0-J 在 V2.0-I 之上重构筛选运行体验：筛选运行台、12 步运行过程、筛选结果面板、结果解释与下一步行动面板，并把高级审计折叠到次级层级。浏览器仍只加载 manifest 摘要、预计算候选预览、选定索引分片和按需详情记录；运行状态机只读取现有汇总，不重算 OACS/DMRS、不训练模型，结果仍是仅限预览且不是最终推荐。",
          "V2.0-J refactors the screening run experience on top of V2.0-I: a run console, a 12-step run progress, a result panel, result interpretation, and a next-action panel, with advanced audits collapsed into secondary layers. The browser still loads only manifest summaries, precomputed candidate previews, selected index parts, and detail records on demand; the run state machine only reads the existing summary, does not recompute OACS/DMRS, does not train a model, and the result stays preview only and not a final recommendation."
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
        <ChemicalText value={text(lang, "V2.0-J 仍然不是经完整验证的全量数据库筛选；它只重构运行体验，结果仅限预览且不是最终推荐，verified_metadata 仍为 0，未训练任何模型，OACS/DMRS 公式未在 V2.0-J 中修改。经完整验证的全量筛选仍需来源/DOI/license/引用回填、描述符复算、公式审计与实验/文献验证。", "V2.0-J remains a UX refactor of the screening run, not full verified database screening; the result is preview only and not a final recommendation, verified_metadata is still 0, no model is trained, and OACS/DMRS formulas are unchanged in V2.0-J. Full verified screening still requires source/DOI/license/citation backfill, descriptor recomputation, formula audit, and experimental/literature validation.")} />
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
        <LazyMethodologyDetails id="methodology-oafs-database-index-preview" title="Database Index Preview" titleZh="数据库索引预览" summary="V2.0-J refactors the screening run experience (run console, run stepper, result panel, result interpretation, next-action panel) over the V2.0-I curation workflow; the run state machine only reads the existing summary, the result is preview only, verified_metadata is still 0, and the OACS/DMRS formulas and lazy loading are unchanged." summaryZh="V2.0-J 在 V2.0-I 整理流程之上重构筛选运行体验（运行台、运行过程、结果面板、结果解释、下一步行动面板）；运行状态机只读取现有汇总，结果仅限预览，verified_metadata 仍为 0，OACS/DMRS 公式与懒加载边界保持不变。" lang={lang} t={t}>
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
